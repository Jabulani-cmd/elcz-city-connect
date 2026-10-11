import { addDays, ageInMonths, lastMonths, parseDate, round, sum, toNum, todayISO } from "./calc";
import type { Row } from "./types";

export type Granularity = "daily" | "monthly" | "annual";

const startOf = (a: Row) => a.purchaseDate || a.dob || (a.createdAt ?? "").slice(0, 10);
const endOf = (a: Row) => (a.status === "Sold" ? a.soldDate : a.status === "Deceased" ? a.deathDate : a.status === "Transferred" ? a.transferDate : "") || "";

/** Was this animal on the farm at the end of `date`? */
export const onFarmOn = (a: Row, date: string) => {
  const s = startOf(a);
  const e = endOf(a);
  return (!s || s <= date) && (!e || e > date);
};

export function herdSeries(animals: Row[], g: Granularity, now = todayISO()): { label: string; herd: number }[] {
  const points: { label: string; at: string }[] = [];
  if (g === "daily") for (let i = 29; i >= 0; i--) { const d = addDays(now, -i); points.push({ label: d.slice(5), at: d }); }
  else if (g === "monthly") for (const m of lastMonths(12, now)) { const d = new Date(Number(m.slice(0, 4)), Number(m.slice(5)), 0); const end = `${m}-${String(d.getDate()).padStart(2, "0")}`; points.push({ label: m, at: end > now ? now : end }); }
  else { const y = Number(now.slice(0, 4)); for (let i = 4; i >= 0; i--) points.push({ label: String(y - i), at: y - i === y ? now : `${y - i}-12-31` }); }
  return points.map((p) => ({ label: p.label, herd: animals.filter((a) => a.species !== "Poultry" && onFarmOn(a, p.at)).length }));
}

/** Counts of dated records per month for the last `n` months. */
export function monthlyCounts(rows: Row[], dateKey: string, n = 12, now = todayISO()) {
  return lastMonths(n, now).map((m) => ({ month: m, count: rows.filter((r) => String(r[dateKey] ?? "").startsWith(m)).length }));
}

export function groupSum<T extends Row = Row>(rows: T[], keyOf: (r: T) => string, valueOf: (r: T) => number) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = keyOf(r) || "Unknown"; m.set(k, (m.get(k) ?? 0) + valueOf(r)); }
  return [...m.entries()].map(([name, value]) => ({ name, value: round(value) })).sort((a, b) => b.value - a.value);
}

export const AGE_GROUPS = ["0–6 mo", "6–12 mo", "1–2 y", "2–4 y", "4+ y"] as const;
export const ageGroup = (dob?: string, now = todayISO()) => {
  if (!dob) return "Unknown";
  const m = ageInMonths(dob, now);
  return m < 6 ? AGE_GROUPS[0] : m < 12 ? AGE_GROUPS[1] : m < 24 ? AGE_GROUPS[2] : m < 48 ? AGE_GROUPS[3] : AGE_GROUPS[4];
};

export function avgBy(rows: Row[], keyOf: (r: Row) => string, valueOf: (r: Row) => number) {
  const m = new Map<string, number[]>();
  for (const r of rows) { const v = valueOf(r); if (v > 0) { const k = keyOf(r) || "Unknown"; (m.get(k) ?? m.set(k, []).get(k)!).push(v); } }
  return [...m.entries()].map(([name, v]) => ({ name, value: round(v.reduce((a, b) => a + b, 0) / v.length, 1), count: v.length }));
}

/** Latest weight record (with its ADG) for each animal. */
export function latestWeights(weights: Row[]): Map<string, Row> {
  const m = new Map<string, Row>();
  for (const w of weights) { const c = m.get(w.animalId); if (!c || w.date > c.date || (w.date === c.date && w.createdAt > c.createdAt)) m.set(w.animalId, w); }
  return m;
}

export type FinanceFilter = { from?: string; to?: string };
export const inRange = (d: string | undefined, f: FinanceFilter) => !!d && (!f.from || d >= f.from) && (!f.to || d <= f.to);

export function profitability(income: Row[], expenses: Row[], keyOf: (r: Row) => string) {
  const m = new Map<string, { income: number; expenses: number }>();
  for (const r of income) { const k = keyOf(r) || "Unassigned"; const e = m.get(k) ?? { income: 0, expenses: 0 }; e.income += toNum(r.amount); m.set(k, e); }
  for (const r of expenses) { const k = keyOf(r) || "Unassigned"; const e = m.get(k) ?? { income: 0, expenses: 0 }; e.expenses += toNum(r.amount); m.set(k, e); }
  return [...m.entries()].map(([name, v]) => ({ name, income: round(v.income), expenses: round(v.expenses), profit: round(v.income - v.expenses) })).sort((a, b) => b.profit - a.profit);
}

export const sumAmount = (rows: Row[]) => sum(rows, "amount");
export const toDate = parseDate;
