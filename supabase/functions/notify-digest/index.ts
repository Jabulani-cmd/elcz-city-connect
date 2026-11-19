// Supabase Edge Function: the morning summary. Called once a day by the database scheduler (see migration 20261121000000), it works out
// what needs attention on every farm that has notification contacts and sends ONE message per person and channel.
// Covers the date-driven items: vaccinations due, vet visits, overdue/near tasks, calvings, expiring or low-stock inventory.
// (Feed levels that depend on usage totals are only alerted live from the app.)
// Not callable by browsers: it needs the secret from Vault (`notify_digest_secret`) in the `x-cron-secret` header.
// Deploy:  supabase functions deploy notify-digest --no-verify-jwt
import { admin, clip, deliver, json, type Ev } from "../_shared/send.ts";
import { DATE_COLUMN, isMonday, previousWeek, summaryRows, toBase64, toCsv, weeklyFileName, type Week, type WeeklyData } from "../_shared/weekly.ts";

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);
const when = (d: number) => (d < 0 ? `${-d} day${d === -1 ? "" : "s"} overdue` : d === 0 ? "due today" : `due in ${d} day${d === 1 ? "" : "s"}`);

type R = Record<string, unknown>;
const rows = async (table: string, farm: string, cols: string): Promise<R[]> => {
  const { data } = await admin.from(table).select(cols).eq("farm_id", farm).is("deleted_at", null).limit(5000);
  return (data ?? []) as unknown as R[];
};

/** Items that need attention today, most overdue first. Mirrors the rules in src/lib/alerts.ts for these kinds. */
export async function digestItems(farm: string, today: string): Promise<(Ev & { d: number })[]> {
  const out: (Ev & { d: number })[] = [];
  const add = (d: number, title: string, what: string) => out.push({ d, title, detail: what + " " + when(d), key: "" });
  const animals = await rows("animals", farm, "id, tag, name, status");
  const live = new Map(animals.filter((a) => a.status === "Active" || a.status === "Quarantined").map((a) => [a.id as string, clip(String(a.tag ?? a.name ?? "animal"), 30)]));

  const latest = new Map<string, R>();
  for (const v of await rows("vaccination_records", farm, "animal_id, vaccine, date, next_date")) {
    const k = `${v.animal_id}|${String(v.vaccine).toLowerCase()}`;
    const cur = latest.get(k);
    if (!cur || String(v.date) > String(cur.date)) latest.set(k, v);
  }
  for (const v of latest.values()) {
    if (!v.next_date || !live.has(v.animal_id as string)) continue;
    const d = days(today, String(v.next_date));
    if (d <= 14) add(d, `${clip(String(v.vaccine), 40)} – ${live.get(v.animal_id as string)}`, "Vaccination");
  }
  for (const a of await rows("vet_appointments", farm, "date, reason, status")) {
    if (a.status !== "Scheduled" || !a.date) continue;
    const d = days(today, String(a.date));
    if (d <= 7) add(d, `Vet visit: ${clip(String(a.reason ?? ""), 60)}`, "Visit");
  }
  for (const t of await rows("tasks", farm, "name, status, due_date")) {
    if (t.status === "Done" || !t.due_date) continue;
    const d = days(today, String(t.due_date));
    if (d <= 2) add(d, clip(String(t.name ?? "Task"), 70), "Task");
  }
  for (const b of await rows("breeding_records", farm, "cow_id, pregnancy_status, expected_calving_date, actual_calving_date")) {
    if (b.pregnancy_status !== "Pregnant" || b.actual_calving_date || !b.expected_calving_date) continue;
    const d = days(today, String(b.expected_calving_date));
    if (d <= 21) add(d, `Calving – ${live.get(b.cow_id as string) ?? "cow"}`, "Expected calving");
  }
  for (const i of await rows("inventory", farm, "name, quantity, min_stock, expiry, category, next_service, unit")) {
    const name = clip(String(i.name ?? "Item"), 50);
    if (Number(i.min_stock) > 0 && Number(i.quantity) <= Number(i.min_stock)) out.push({ d: Number(i.quantity) <= 0 ? -999 : -1, title: `Low stock: ${name}`, detail: `${i.quantity} ${i.unit ?? ""} left (minimum ${i.min_stock})`.trim(), key: "" });
    if (i.expiry) { const d = days(today, String(i.expiry)); if (d <= 30) add(d, `Expiring: ${name}`, "Expiry"); }
    if (i.category === "Equipment" && i.next_service) { const d = days(today, String(i.next_service)); if (d <= 14) add(d, `Service: ${name}`, "Maintenance"); }
  }
  return out.sort((a, b) => a.d - b.d);
}

Deno.serve(async (req) => {
  // The scheduler sends the secret kept in Vault (notify_digest_secret); the database checks it, so no copy lives in function settings.
  const { data: ok } = await admin.rpc("digest_secret_ok", { s: req.headers.get("x-cron-secret") ?? "" });
  if (req.method !== "POST" || ok !== true) return json({ error: "Not allowed" }, 401);

  const body = await req.json().catch(() => ({})) as { force_weekly?: boolean };
  const today = iso(new Date());
  const { data: c } = await admin.from("notification_contacts").select("farm_id").eq("want_alerts", true);
  const farmIds = [...new Set((c ?? []).map((x) => x.farm_id as string))];
  const summary = { farms: farmIds.length, sent: 0, failed: 0, demo: 0, empty: 0, weekly: { farms: 0, sent: 0, failed: 0, demo: 0 } };
  for (const farmId of farmIds) {
    try {
      const items = await digestItems(farmId, today);
      if (!items.length) { summary.empty++; continue; }
      const { data: farm } = await admin.from("farms").select("name").eq("id", farmId).maybeSingle();
      const r = await deliver({ farmId, farmName: farm?.name ?? "", type: "digest", events: items.slice(0, 50), dedupe: `digest:${today}` });
      summary.sent += r.sent; summary.failed += r.failed; summary.demo += r.demo;
    } catch (e) { summary.failed++; console.error("digest failed for farm", farmId, (e as Error).message); }
  }

  // Mondays (or when forced for a manual run): email last week's report to everyone who wants it.
  if (isMonday(today) || body.force_weekly === true) {
    const week = previousWeek(today);
    const { data: w } = await admin.from("notification_contacts").select("farm_id").eq("want_weekly", true).eq("via_email", true);
    const weeklyFarms = [...new Set((w ?? []).map((x) => x.farm_id as string))];
    summary.weekly.farms = weeklyFarms.length;
    for (const farmId of weeklyFarms) {
      try {
        const { data: farm } = await admin.from("farms").select("name").eq("id", farmId).maybeSingle();
        const name = farm?.name ?? "";
        const table = summaryRows(await weeklyData(farmId, week), week);
        const csv = toCsv(["Area", "Measure", "Value"], table);
        const highlights: Ev[] = table.filter((r) => ["Income", "Expenses", "Net (income – expenses)"].includes(String(r[1]))).map((r) => ({ title: `${r[1]}: ${r[2]}` }));
        highlights.push({ title: "The full report is attached as a CSV file (opens in Excel or Google Sheets)" });
        // `actor` carries the week's label into the subject line ("weekly report, 16 Nov – 22 Nov 2026")
        const r = await deliver({ farmId, farmName: name, type: "weekly", events: highlights, actor: week.label, channels: ["email"], dedupe: `weekly:${week.from}`, attachment: { filename: weeklyFileName(name, week), content: toBase64(csv) } });
        summary.weekly.sent += r.sent; summary.weekly.failed += r.failed; summary.weekly.demo += r.demo;
      } catch (e) { summary.weekly.failed++; console.error("weekly report failed for farm", farmId, (e as Error).message); }
    }
  }
  return json(summary);
});

/** Everything the weekly report reads, limited to the week in the database query. */
async function weeklyData(farm: string, week: Week): Promise<WeeklyData> {
  const tables = { income: "income", expenses: "expenses", sales: "livestock_sales", purchases: "livestock_purchases", births: "birth_records", deaths: "mortality_records", health: "health_records", vaccinations: "vaccination_records", harvests: "harvest_records", fertilizer: "fertilizer_records", irrigation: "irrigation_records", tasks: "tasks" } as const;
  const out = {} as WeeklyData;
  await Promise.all((Object.keys(tables) as (keyof typeof tables)[]).map(async (k) => {
    const col = DATE_COLUMN[k];
    const cols = k === "income" || k === "expenses" ? `${col}, amount` : k === "tasks" ? `${col}, status` : col;
    const { data } = await admin.from(tables[k]).select(cols).eq("farm_id", farm).is("deleted_at", null).gte(col, week.from).lte(col, week.to).limit(5000);
    out[k] = (data ?? []) as unknown as Record<string, unknown>[];
  }));
  return out;
}
