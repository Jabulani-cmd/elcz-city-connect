import { addDays, daysBetween, fmtMoney, fmtNum, round, sum, toNum, todayISO } from "./calc";
import { cropCost, cropRevenue, labelOf } from "./schema";
import { feedAvailable } from "./calc";
import { rowsOf } from "./store";
import type { Row } from "./types";

export type Answer = { text: string; table?: { headers: string[]; rows: (string | number)[][] } };

export const SUGGESTIONS = [
  "How many cattle do I currently have?",
  "Which cattle have not been vaccinated?",
  "Which animals gained the most weight this month?",
  "Which pasture currently has the most cattle?",
  "How much feed do I have left?",
  "Which animals are due for vaccination?",
  "How much did I spend on feed this month?",
  "What was my livestock profit last month?",
  "Which crop is generating the highest profit?",
  "Which animals are ready for sale?",
  "Which expenses increased this month?",
];

const live = (a: Row) => a.status === "Active" || a.status === "Quarantined";
const L = (a?: Row) => labelOf("animals", a);
const month = (offset = 0) => { const d = new Date(); d.setMonth(d.getMonth() + offset, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

/** Answers questions from the farm's own records. Runs entirely on this device. */
export function answer(question: string): Answer {
  const q = question.toLowerCase();
  const animals = rowsOf("animals");
  const liveAnimals = animals.filter(live);
  const has = (...re: RegExp[]) => re.some((r) => r.test(q));
  const today = todayISO();

  if (has(/not been vaccinated|unvaccinated|never (been )?vaccinated|without vaccin/)) {
    const done = new Set(rowsOf("vaccinations").map((v) => v.animalId));
    const list = liveAnimals.filter((a) => !done.has(a.id));
    return list.length ? { text: `${list.length} of ${liveAnimals.length} animals have no vaccination on record.`, table: { headers: ["Animal", "Type", "Age group"], rows: list.map((a) => [L(a), a.category ?? "", a.dob ?? ""]) } } : { text: "Every active animal has at least one vaccination recorded." };
  }
  if (has(/due for vaccin|vaccin.*due|upcoming vaccin|need.*vaccin/)) {
    const latest = new Map<string, Row>();
    for (const v of rowsOf("vaccinations")) { const k = `${v.animalId}|${v.vaccine}`; const c = latest.get(k); if (!c || v.date > c.date) latest.set(k, v); }
    const due = [...latest.values()].filter((v) => v.nextDate && v.nextDate <= addDays(today, 30) && live(animals.find((a) => a.id === v.animalId) ?? ({} as Row))).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    return due.length ? { text: `${due.length} vaccination${due.length === 1 ? " is" : "s are"} due within 30 days (or overdue).`, table: { headers: ["Animal", "Vaccine", "Due", "Status"], rows: due.map((v) => [L(animals.find((a) => a.id === v.animalId)), v.vaccine, v.nextDate, v.nextDate < today ? `${daysBetween(v.nextDate, today)} days overdue` : "Upcoming"]) } } : { text: "No vaccinations are due in the next 30 days." };
  }
  if (has(/gain(ed)?.*(most|weight)|most weight|best.*(growth|gain)|fastest/)) {
    const start = addDays(today, -30);
    const rows = liveAnimals.map((a) => {
      const w = rowsOf("weights").filter((x) => x.animalId === a.id).sort((x, y) => x.date.localeCompare(y.date));
      const end = w[w.length - 1];
      if (!end || end.date < start) return null;
      const before = [...w].reverse().find((x) => x.date <= start) ?? w.find((x) => x.date >= start);
      if (!before || before.id === end.id) return null;
      return { a, gain: round(toNum(end.weight) - toNum(before.weight)), days: daysBetween(before.date, end.date) };
    }).filter(Boolean).sort((x, y) => y!.gain - x!.gain).slice(0, 10) as { a: Row; gain: number; days: number }[];
    return rows.length ? { text: `Top gainers over the last 30 days (${L(rows[0].a)} gained ${fmtNum(rows[0].gain)} kg).`, table: { headers: ["Animal", "Gain (kg)", "Over (days)"], rows: rows.map((r) => [L(r.a), r.gain, r.days]) } } : { text: "I need at least two weight records within the last month to compare. Record some weights first." };
  }
  if (has(/pasture.*(most|highest|busiest)|most.*pasture|where.*(most|cattle|animals)/)) {
    const pastures = rowsOf("pastures");
    const rows = pastures.map((p) => [labelOf("pastures", p), liveAnimals.filter((a) => a.pastureId === p.id).length, toNum(p.capacity) || ""]).sort((a, b) => (b[1] as number) - (a[1] as number));
    return rows.length ? { text: `${rows[0][0]} has the most animals (${rows[0][1]}).`, table: { headers: ["Pasture", "Animals", "Capacity"], rows } } : { text: "No pastures have been set up yet." };
  }
  if (has(/spen[dt].*feed|feed.*(spend|spent|cost)|cost.*feed/)) {
    const m = /last month/.test(q) ? month(-1) : month(0);
    const total = sum(rowsOf("expenses").filter((e) => e.category === "Feed" && String(e.date).startsWith(m)), "amount");
    return { text: `You spent ${fmtMoney(total)} on feed ${/last month/.test(q) ? "last month" : "this month"} (${m}).` };
  }
  if (has(/feed.*(left|remain|stock|have)|how much feed/)) {
    const usage = rowsOf("feedUsage");
    const rows = rowsOf("feed").map((f) => [f.name, round(feedAvailable(toNum(f.qtyPurchased), sum(usage.filter((u) => u.feedId === f.id), "quantity"))), f.unit ?? "", toNum(f.minStock) && feedAvailable(toNum(f.qtyPurchased), sum(usage.filter((u) => u.feedId === f.id), "quantity")) <= toNum(f.minStock) ? "Low" : "OK"]);
    return rows.length ? { text: `You have ${rows.length} feed item${rows.length === 1 ? "" : "s"} in stock.${rows.some((r) => r[3] === "Low") ? " Some are running low." : ""}`, table: { headers: ["Feed", "Available", "Unit", "Status"], rows } } : { text: "No feed has been recorded yet." };
  }
  if (has(/livestock profit|profit.*livestock|livestock.*(income|earn)/)) {
    const m = /this month/.test(q) ? month(0) : month(-1);
    const isLs = (r: Row) => r.section === "Livestock" || r.category === "Livestock sales" || ["Feed", "Veterinary", "Medication", "Livestock purchase"].includes(r.category);
    const inc = sum(rowsOf("income").filter((r) => isLs(r) && String(r.date).startsWith(m)), "amount");
    const exp = sum(rowsOf("expenses").filter((r) => isLs(r) && String(r.date).startsWith(m)), "amount");
    return { text: `Livestock profit for ${m}: ${fmtMoney(inc - exp)} (income ${fmtMoney(inc)} − expenses ${fmtMoney(exp)}).` };
  }
  if (has(/crop.*(profit|money|best)|highest profit|most profitable/)) {
    const rows = rowsOf("crops").map((c) => ({ c, p: cropRevenue(c) - cropCost(c, { rows: rowsOf }), rev: cropRevenue(c), cost: cropCost(c, { rows: rowsOf }) })).filter((x) => x.rev > 0 || x.cost > 0).sort((a, b) => b.p - a.p);
    return rows.length ? { text: `${labelOf("crops", rows[0].c)} is the most profitable crop (${fmtMoney(rows[0].p)}). Crops still growing show a loss until harvest is recorded.`, table: { headers: ["Crop", "Revenue", "Cost", "Profit"], rows: rows.map((x) => [labelOf("crops", x.c), round(x.rev), round(x.cost), round(x.p)]) } } : { text: "No crop records yet." };
  }
  if (has(/ready (for|to) (sale|sell)|ready to be sold|can (i )?sell|sell(ing)? soon/)) {
    const fl = rowsOf("feedlot").filter((f) => toNum(f.targetWeight) > 0 && toNum(f.currentWeight) >= toNum(f.targetWeight) * 0.95);
    const ids = new Set(fl.map((f) => f.animalId));
    const others = liveAnimals.filter((a) => !ids.has(a.id) && (a.category === "Steer" || a.category === "Bull") && toNum(a.currentWeight) >= 450);
    const rows = [...fl.map((f) => [L(animals.find((a) => a.id === f.animalId)), toNum(f.currentWeight), toNum(f.targetWeight), "At feedlot target"]), ...others.map((a) => [L(a), toNum(a.currentWeight), "", "Steer/bull over 450 kg"])];
    return rows.length ? { text: `${rows.length} animal${rows.length === 1 ? " looks" : "s look"} ready for sale. (Rule: within 5% of feedlot target weight, or a steer/bull over 450 kg.)`, table: { headers: ["Animal", "Weight (kg)", "Target (kg)", "Why"], rows } } : { text: "No animals meet the sale rule yet (within 5% of feedlot target weight, or a steer/bull over 450 kg)." };
  }
  if (has(/expenses?.*(increase|up|rose|higher|grew)|spending.*(up|increase)/)) {
    const a = month(0), b = month(-1);
    const tot = (m: string) => { const t = new Map<string, number>(); for (const e of rowsOf("expenses")) if (String(e.date).startsWith(m)) t.set(e.category, (t.get(e.category) ?? 0) + toNum(e.amount)); return t; };
    const now = tot(a), prev = tot(b);
    const rows = [...now.entries()].map(([c, v]) => [c, round(prev.get(c) ?? 0), round(v), round(v - (prev.get(c) ?? 0))]).filter((r) => (r[3] as number) > 0).sort((x, y) => (y[3] as number) - (x[3] as number));
    return rows.length ? { text: `${rows.length} expense categor${rows.length === 1 ? "y is" : "ies are"} higher in ${a} than in ${b} (the month may not be finished).`, table: { headers: ["Category", `${b}`, `${a}`, "Increase"], rows } } : { text: `No expense category is higher in ${a} than in ${b} so far.` };
  }
  if (has(/medical attention|sick|unwell|treatment|ill\b/)) {
    const ongoing = rowsOf("health").filter((h) => h.recovery === "Ongoing");
    const ids = new Set([...ongoing.map((h) => h.animalId), ...animals.filter((a) => a.status === "Quarantined").map((a) => a.id)]);
    const list = [...ids].map((id) => animals.find((a) => a.id === id)).filter((a): a is Row => !!a && live(a));
    return list.length ? { text: `${list.length} animal${list.length === 1 ? " needs" : "s need"} medical attention.`, table: { headers: ["Animal", "Condition", "Status"], rows: list.map((a) => [L(a), ongoing.find((h) => h.animalId === a.id)?.condition ?? "Quarantined", a.status]) } } : { text: "No animals currently need treatment." };
  }
  if (has(/how many.*(cattle|cows?|animals|livestock|herd)|herd size|number of (cattle|animals)|total (cattle|animals)/)) {
    const cattle = liveAnimals.filter((a) => (a.species || "Cattle") === "Cattle");
    const by = (c: string) => cattle.filter((a) => a.category === c).length;
    return { text: `You currently have ${cattle.length} cattle${liveAnimals.length !== cattle.length ? ` (${liveAnimals.length} animals in total)` : ""}.`, table: { headers: ["Type", "Count"], rows: ["Bull", "Cow", "Heifer", "Calf", "Steer"].map((c) => [c, by(c)]) } };
  }
  if (has(/employees?|staff|workers/)) {
    const e = rowsOf("employees").filter((x) => x.status === "Active");
    return { text: `You have ${e.length} active employee${e.length === 1 ? "" : "s"}.`, table: { headers: ["Name", "Position"], rows: e.map((x) => [x.name, x.position ?? ""]) } };
  }
  if (has(/tasks?|to.?do|overdue/)) {
    const open = rowsOf("tasks").filter((t) => t.status !== "Done").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return open.length ? { text: `${open.length} open task${open.length === 1 ? "" : "s"}, ${open.filter((t) => t.dueDate < today).length} overdue.`, table: { headers: ["Task", "Due", "Priority", "Status"], rows: open.map((t) => [t.name, t.dueDate, t.priority, t.status]) } } : { text: "No open tasks." };
  }
  if (has(/profit|income|revenue|expenses?|spen[dt]/)) {
    const inc = sum(rowsOf("income"), "amount"), exp = sum(rowsOf("expenses"), "amount");
    return { text: `Across all records: income ${fmtMoney(inc)}, expenses ${fmtMoney(exp)}, net profit ${fmtMoney(inc - exp)}. Ask about a specific month, feed, livestock or a crop for more detail.` };
  }
  return { text: "I can answer questions about your herd, weights, vaccinations, pastures, feed, finances, crops, employees and tasks using your farm’s records. Try one of the suggestions below." };
}
