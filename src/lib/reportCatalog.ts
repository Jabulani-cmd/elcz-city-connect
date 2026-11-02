import { herdSeries, inRange, latestWeights, monthlyCounts, type FinanceFilter } from "./analytics";
import { round, sum, toNum } from "./calc";
import type { Table } from "./export";
import { columnLabel, rawCell } from "./format";
import { profitOfSale } from "./rules";
import { cropCost, cropRevenue, labelOf, RESOURCES } from "./schema";
import { rowsOf } from "./store";
import type { Row } from "./types";

export type ReportDef = { id: string; group: "Livestock" | "Agriculture" | "Financial"; title: string; build: (range: FinanceFilter) => Table };

const within = (rows: Row[], key: string, r: FinanceFilter) => (r.from || r.to ? rows.filter((x) => inRange(x[key], r)) : rows);
const label = (c: string, id?: string) => labelOf(c, rowsOf(c).find((r) => r.id === id));
const ctx = () => ({ rows: rowsOf });

/** A report that is simply a resource table (optionally date-filtered) with its derived columns. */
function fromResource(id: string, group: ReportDef["group"], title: string, resource: string, dateKey?: string, cols?: string[]): ReportDef {
  return {
    id, group, title,
    build: (range) => {
      const res = RESOURCES[resource];
      const columns = cols ?? [...res.columns, ...(res.derivedColumns ?? [])];
      let rows = rowsOf(res.collection);
      if (dateKey) rows = within(rows, dateKey, range);
      if (res.sort) rows = [...rows].sort(res.sort);
      return { title, headers: columns.map((c) => columnLabel(res, c)), rows: rows.map((r) => columns.map((c) => rawCell(res, c, r))) };
    },
  };
}

const categoryTotals = (rows: Row[]) => {
  const m = new Map<string, { n: number; total: number }>();
  for (const r of rows) { const e = m.get(r.category) ?? { n: 0, total: 0 }; e.n++; e.total += toNum(r.amount); m.set(r.category, e); }
  return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
};

const monthsOf = (...lists: Row[][]) => [...new Set(lists.flat().map((r) => String(r.date ?? "").slice(0, 7)).filter(Boolean))].sort();

export const REPORTS: ReportDef[] = [
  /* ----- Livestock ----- */
  fromResource("herd-inventory", "Livestock", "Herd inventory", "animals", undefined, ["tag", "name", "species", "breed", "category", "sex", "age", "herd", "pastureId", "currentWeight", "estimatedValue", "status"]),
  {
    id: "herd-growth", group: "Livestock", title: "Herd growth",
    build: () => {
      const animals = rowsOf("animals");
      const s = herdSeries(animals, "monthly");
      const b = monthlyCounts(rowsOf("births"), "birthDate"), p = monthlyCounts(rowsOf("purchases"), "date"), sl = monthlyCounts(rowsOf("sales"), "date"), d = monthlyCounts(rowsOf("mortality"), "date");
      return { title: "Herd growth", headers: ["Month", "Herd size (month end)", "Births", "Purchases", "Sales", "Deaths"], rows: s.map((x, i) => [x.label, x.herd, b[i].count, p[i].count, sl[i].count, d[i].count]) };
    },
  },
  {
    id: "weights", group: "Livestock", title: "Animal weight report",
    build: () => {
      const latest = latestWeights(rowsOf("weights"));
      const rows = rowsOf("animals").filter((a) => a.status === "Active" || a.status === "Quarantined").sort((a, b) => String(a.tag).localeCompare(String(b.tag), undefined, { numeric: true })).map((a) => {
        const w = latest.get(a.id);
        return [a.tag, a.name ?? "", a.breed ?? "", a.category ?? "", w ? toNum(w.weight) : "", w?.date ?? "", w && w.previousWeight !== "" ? toNum(w.previousWeight) : "", w && w.previousWeight !== "" ? toNum(w.difference) : "", w && w.previousWeight !== "" ? toNum(w.adg) : ""];
      });
      return { title: "Animal weight report", headers: ["Animal", "Name", "Breed", "Type", "Latest weight (kg)", "Date weighed", "Previous (kg)", "Gain (kg)", "ADG (kg/day)"], rows };
    },
  },
  fromResource("health", "Livestock", "Health report", "health", "date"),
  fromResource("vaccinations", "Livestock", "Vaccination report", "vaccinations", "date"),
  fromResource("mortality", "Livestock", "Mortality report", "mortality", "date"),
  fromResource("breeding", "Livestock", "Breeding report", "breeding", "matingDate"),
  fromResource("births", "Livestock", "Birth report", "births", "birthDate"),
  fromResource("purchases", "Livestock", "Purchase report", "purchases", "date"),
  fromResource("sales", "Livestock", "Sales report", "sales", "date"),
  {
    id: "feed-consumption", group: "Livestock", title: "Feed consumption report",
    build: (range) => {
      const usage = within(rowsOf("feedUsage"), "date", range);
      const rows = rowsOf("feed").map((f) => {
        const used = sum(usage.filter((u) => u.feedId === f.id), "quantity");
        const allUsed = sum(rowsOf("feedUsage").filter((u) => u.feedId === f.id), "quantity");
        return [f.name, f.feedType, f.unit ?? "", used, round(used * toNum(f.costPerUnit)), round(toNum(f.qtyPurchased) - allUsed)];
      });
      return { title: "Feed consumption report", headers: ["Feed", "Type", "Unit", "Used in period", "Cost of feed used", "Available now"], rows };
    },
  },
  fromResource("feedlot", "Livestock", "Feedlot performance", "feedlot"),

  /* ----- Agriculture ----- */
  fromResource("crop-production", "Agriculture", "Crop production", "crops", "plantingDate"),
  {
    id: "crop-yield", group: "Agriculture", title: "Crop yield",
    build: () => ({
      title: "Crop yield", headers: ["Crop", "Field", "Area (ha)", "Expected yield (t)", "Actual yield (t)", "Yield (t/ha)", "% of expected"],
      rows: rowsOf("crops").map((c) => [labelOf("crops", c), label("fields", c.fieldId), toNum(c.areaHa), toNum(c.expectedYield), c.actualYield === "" || c.actualYield == null ? "" : toNum(c.actualYield), toNum(c.areaHa) && c.actualYield !== "" && c.actualYield != null ? round(toNum(c.actualYield) / toNum(c.areaHa)) : "", toNum(c.expectedYield) && c.actualYield !== "" && c.actualYield != null ? round((toNum(c.actualYield) / toNum(c.expectedYield)) * 100, 0) : ""]),
    }),
  },
  fromResource("planting", "Agriculture", "Planting", "plantings", "plantingDate"),
  fromResource("harvest", "Agriculture", "Harvest", "harvests", "harvestDate"),
  fromResource("fertilizer", "Agriculture", "Fertilizer usage", "fertilizer", "applicationDate"),
  fromResource("chemicals", "Agriculture", "Chemical usage", "protection", "applicationDate"),
  fromResource("irrigation", "Agriculture", "Irrigation", "irrigation", "date"),
  {
    id: "field-performance", group: "Agriculture", title: "Field performance",
    build: () => ({
      title: "Field performance", headers: ["Field", "Size (ha)", "Crops grown", "Total yield (t)", "Revenue", "Cost", "Profit"],
      rows: rowsOf("fields").map((f) => {
        const crops = rowsOf("crops").filter((c) => c.fieldId === f.id);
        const rev = crops.reduce((s, c) => s + cropRevenue(c), 0), cost = crops.reduce((s, c) => s + cropCost(c, ctx()), 0);
        return [f.name, toNum(f.sizeHa), crops.map((c) => c.cropName).join(", "), sum(crops, "actualYield"), round(rev), round(cost), round(rev - cost)];
      }),
    }),
  },
  {
    id: "crop-profit", group: "Agriculture", title: "Crop profitability",
    build: () => ({
      title: "Crop profitability", headers: ["Crop", "Field", "Revenue", "Cost", "Profit", "Margin %"],
      rows: rowsOf("crops").map((c) => { const rev = cropRevenue(c), cost = cropCost(c, ctx()); return [labelOf("crops", c), label("fields", c.fieldId), round(rev), round(cost), round(rev - cost), rev > 0 ? round(((rev - cost) / rev) * 100, 1) : ""]; }),
    }),
  },

  /* ----- Financial ----- */
  {
    id: "income-statement", group: "Financial", title: "Income statement",
    build: (range) => {
      const inc = within(rowsOf("income"), "date", range), exp = within(rowsOf("expenses"), "date", range);
      const rows: (string | number)[][] = [["INCOME", "", ""], ...categoryTotals(inc).map(([c, v]) => [c, v.n, round(v.total)]), ["Total income", "", round(sum(inc, "amount"))], ["EXPENSES", "", ""], ...categoryTotals(exp).map(([c, v]) => [c, v.n, round(v.total)]), ["Total expenses", "", round(sum(exp, "amount"))], ["NET PROFIT", "", round(sum(inc, "amount") - sum(exp, "amount"))]];
      return { title: "Income statement", headers: ["Item", "Transactions", "Amount"], rows };
    },
  },
  fromResource("expense-report", "Financial", "Expense report", "expenses", "date"),
  {
    id: "cash-flow", group: "Financial", title: "Cash flow",
    build: (range) => {
      const inc = within(rowsOf("income"), "date", range).filter((r) => r.paymentStatus !== "Outstanding"), exp = within(rowsOf("expenses"), "date", range).filter((r) => r.paymentStatus !== "Outstanding");
      let running = 0;
      return { title: "Cash flow", headers: ["Month", "Cash in", "Cash out", "Net", "Running balance"], rows: monthsOf(inc, exp).map((m) => { const i = sum(inc.filter((r) => r.date.startsWith(m)), "amount"), o = sum(exp.filter((r) => r.date.startsWith(m)), "amount"); running += i - o; return [m, round(i), round(o), round(i - o), round(running)]; }) };
    },
  },
  {
    id: "profit-loss", group: "Financial", title: "Profit / loss",
    build: (range) => {
      const inc = within(rowsOf("income"), "date", range), exp = within(rowsOf("expenses"), "date", range);
      return { title: "Profit / loss", headers: ["Month", "Income", "Expenses", "Profit / loss"], rows: monthsOf(inc, exp).map((m) => { const i = sum(inc.filter((r) => r.date.startsWith(m)), "amount"), o = sum(exp.filter((r) => r.date.startsWith(m)), "amount"); return [m, round(i), round(o), round(i - o)]; }) };
    },
  },
  {
    id: "livestock-profit", group: "Financial", title: "Livestock profitability",
    build: (range) => {
      const sales = within(rowsOf("sales"), "date", range);
      const rows = sales.map((s) => [s.date, label("animals", s.animalId), toNum(s.price), round(toNum(s.price) - profitOfSale(s) - toNum(s.costBasis)), toNum(s.costBasis), profitOfSale(s)]);
      return { title: "Livestock profitability", headers: ["Sale date", "Animal", "Sale price", "Selling expenses", "Cost of animal", "Profit / loss"], rows: [...rows, ["Total", "", round(sum(sales, "price")), "", round(sum(sales, "costBasis")), round(sales.reduce((s, x) => s + profitOfSale(x), 0))]] };
    },
  },
  {
    id: "budget-actual", group: "Financial", title: "Budget vs actual",
    build: () => ({
      title: "Budget vs actual", headers: ["Month", "Category", "Budget", "Actual", "Variance", "Used %"],
      rows: [...rowsOf("budgets")].sort((a, b) => String(b.month).localeCompare(String(a.month))).map((b) => { const actual = sum(rowsOf("expenses").filter((e) => e.category === b.category && String(e.date).startsWith(b.month)), "amount"); return [b.month, b.category, toNum(b.amount), round(actual), round(toNum(b.amount) - actual), toNum(b.amount) ? round((actual / toNum(b.amount)) * 100, 0) : ""]; }),
    }),
  },
];

// The brief lists "Crop profitability" under both Agriculture and Financial reports.
const cropProfit = REPORTS.find((r) => r.id === "crop-profit")!;
REPORTS.splice(REPORTS.findIndex((r) => r.id === "livestock-profit") + 1, 0, { ...cropProfit, id: "crop-profit-financial", group: "Financial" });
