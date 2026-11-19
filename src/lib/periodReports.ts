import { inRange, type FinanceFilter } from "./analytics";
import { addDays, round, sum, todayISO } from "./calc";
import { slug, type Table } from "./export";
import { REPORTS, type ReportDef } from "./reportCatalog";
import { rowsOf } from "./store";

export type PeriodKind = "daily" | "weekly";
export type Period = { kind: PeriodKind; from: string; to: string; label: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Thu 19 Nov 2026" – built from the date string so the time zone can never shift the day. */
export function niceDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}
const dayOfWeek = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

/** The day itself, or the Monday–Sunday week that contains it. */
export function periodFor(kind: PeriodKind, anchor: string = todayISO()): Period {
  if (kind === "daily") return { kind, from: anchor, to: anchor, label: niceDate(anchor) };
  const from = addDays(anchor, -((dayOfWeek(anchor) + 6) % 7));
  const to = addDays(from, 6);
  return { kind, from, to, label: `${niceDate(from)} – ${niceDate(to)}` };
}

/** Quick choices shown as buttons. */
export function presets(kind: PeriodKind, today: string = todayISO()): { name: string; anchor: string }[] {
  return kind === "daily" ? [{ name: "Today", anchor: today }, { name: "Yesterday", anchor: addDays(today, -1) }]
    : [{ name: "This week", anchor: today }, { name: "Last week", anchor: addDays(today, -7) }];
}

const range = (p: Period): FinanceFilter => ({ from: p.from, to: p.to });
const inPeriod = (rows: ReturnType<typeof rowsOf>, key: string, p: Period) => rows.filter((r) => inRange(r[key], range(p)));

/** One-page overview of what happened in the period. */
export function farmSummary(p: Period): Table {
  const income = inPeriod(rowsOf("income"), "date", p), expenses = inPeriod(rowsOf("expenses"), "date", p);
  const tasks = inPeriod(rowsOf("tasks"), "dueDate", p);
  const log = rowsOf("audit").filter((a) => inRange(String(a.createdAt ?? "").slice(0, 10), range(p)));
  const n = (rows: unknown[]) => rows.length;
  const rows: (string | number)[][] = [
    ["Money", "Income", round(sum(income, "amount"))],
    ["Money", "Expenses", round(sum(expenses, "amount"))],
    ["Money", "Net (income – expenses)", round(sum(income, "amount") - sum(expenses, "amount"))],
    ["Money", "Animals sold", n(inPeriod(rowsOf("sales"), "date", p))],
    ["Livestock", "Births", n(inPeriod(rowsOf("births"), "birthDate", p))],
    ["Livestock", "Animals bought", n(inPeriod(rowsOf("purchases"), "date", p))],
    ["Livestock", "Deaths", n(inPeriod(rowsOf("mortality"), "date", p))],
    ["Livestock", "Health cases recorded", n(inPeriod(rowsOf("health"), "date", p))],
    ["Livestock", "Vaccinations given", n(inPeriod(rowsOf("vaccinations"), "date", p))],
    ["Crops", "Harvests recorded", n(inPeriod(rowsOf("harvests"), "harvestDate", p))],
    ["Crops", "Fertilizer applications", n(inPeriod(rowsOf("fertilizer"), "applicationDate", p))],
    ["Crops", "Irrigation events", n(inPeriod(rowsOf("irrigation"), "date", p))],
    ["Tasks", "Due in the period", n(tasks)],
    ["Tasks", "…of which done", n(tasks.filter((t) => t.status === "Done"))],
    ["Tasks", "…of which not done", n(tasks.filter((t) => t.status !== "Done"))],
    ["App activity", "Records added", n(log.filter((a) => a.action === "create"))],
    ["App activity", "Records changed", n(log.filter((a) => a.action === "update"))],
    ["App activity", "Records removed", n(log.filter((a) => a.action === "delete"))],
  ];
  return { title: `Farm summary – ${p.kind}`, headers: ["Area", "Measure", "Value"], rows };
}

/** Who changed what, newest first (times are UTC). */
export function activityLog(p: Period): Table {
  const rows = rowsOf("audit").filter((a) => inRange(String(a.createdAt ?? "").slice(0, 10), range(p)))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((a) => [String(a.createdAt).replace("T", " ").slice(0, 16), a.user ?? "", a.action ?? "", a.collection ?? "", a.summary ?? ""]);
  return { title: `Activity log – ${p.kind}`, headers: ["Time (UTC)", "Who", "Action", "Record type", "Details"], rows };
}

export type PeriodReport = { id: string; group: string; title: string; snapshot: boolean; build: () => Table };

/** Everything downloadable for a period: the summary, the activity log, then every catalogue report limited to the same dates. */
export function periodReports(p: Period): PeriodReport[] {
  const first: PeriodReport[] = [
    { id: "summary", group: "Overview", title: "Farm summary", snapshot: false, build: () => farmSummary(p) },
    { id: "activity", group: "Overview", title: "Activity log", snapshot: false, build: () => activityLog(p) },
  ];
  return [...first, ...REPORTS.map((r: ReportDef) => ({ id: r.id, group: r.group, title: r.title, snapshot: !!r.snapshot, build: () => r.build(range(p)) }))];
}

/** e.g. "farm-summary_2026-11-16_to_2026-11-22.csv" (a single day drops the "_to_"). */
export const periodFileName = (title: string, p: Period) => `${slug(title)}_${p.from}${p.to === p.from ? "" : `_to_${p.to}`}.csv`;
