import { round, sum, toNum } from "./calc";
import { latestWeights } from "./analytics";
import type { Row } from "./types";

/** Costs that go straight into producing crops / livestock (used for gross profit). */
export const DIRECT_COSTS = ["Feed", "Fertilizer", "Seeds", "Veterinary", "Medication", "Livestock purchase"];

export type Kpis = {
  revenue: number; expenses: number; grossProfit: number; netProfit: number; margin: number; roi: number;
  outstandingPayable: number; outstandingReceivable: number; costPerAnimal: number; costPerHa: number;
  costPerKg: number; revenuePerHa: number; feedPerAnimal: number; vetPerAnimal: number;
};

export function farmKpis(income: Row[], expenses: Row[], animals: Row[], weights: Row[], cultivatedHa: number): Kpis {
  const revenue = sum(income, "amount");
  const spent = sum(expenses, "amount");
  const direct = sum(expenses.filter((e) => DIRECT_COSTS.includes(e.category)), "amount");
  const live = animals.filter((a) => a.status === "Active" || a.status === "Quarantined");
  const totalKg = [...latestWeights(weights).entries()].filter(([id]) => live.some((a) => a.id === id)).reduce((s, [, w]) => s + toNum(w.weight), 0);
  const livestockCost = sum(expenses.filter((e) => e.section === "Livestock" || e.animalId || ["Feed", "Veterinary", "Medication", "Livestock purchase"].includes(e.category)), "amount");
  const feed = sum(expenses.filter((e) => e.category === "Feed"), "amount");
  const vet = sum(expenses.filter((e) => e.category === "Veterinary" || e.category === "Medication"), "amount");
  const cropRevenue = sum(income.filter((i) => i.category === "Crop sales"), "amount");
  return {
    revenue, expenses: spent, grossProfit: round(revenue - direct), netProfit: round(revenue - spent),
    margin: revenue > 0 ? round(((revenue - spent) / revenue) * 100, 1) : 0, roi: spent > 0 ? round(((revenue - spent) / spent) * 100, 1) : 0,
    outstandingPayable: sum(expenses.filter((e) => e.paymentStatus === "Outstanding"), "amount"),
    outstandingReceivable: sum(income.filter((e) => e.paymentStatus === "Outstanding"), "amount"),
    costPerAnimal: live.length ? round(livestockCost / live.length) : 0,
    costPerHa: cultivatedHa > 0 ? round(sum(expenses.filter((e) => e.section === "Agriculture" || ["Fertilizer", "Seeds"].includes(e.category)), "amount") / cultivatedHa) : 0,
    costPerKg: totalKg > 0 ? round(livestockCost / totalKg, 2) : 0,
    revenuePerHa: cultivatedHa > 0 ? round(cropRevenue / cultivatedHa) : 0,
    feedPerAnimal: live.length ? round(feed / live.length) : 0,
    vetPerAnimal: live.length ? round(vet / live.length) : 0,
  };
}

export const PROFIT_DIMENSIONS = ["Crop", "Field", "Animal", "Herd", "Pasture", "Feedlot", "Production cycle", "Month", "Year", "Farm section", "Category"] as const;
export type ProfitDimension = (typeof PROFIT_DIMENSIONS)[number];

export function dimensionKey(dim: ProfitDimension, lookup: (collection: string, id?: string) => string): (r: Row) => string {
  switch (dim) {
    case "Crop": return (r) => (r.cropId ? lookup("crops", r.cropId) : "");
    case "Field": return (r) => (r.fieldId ? lookup("fields", r.fieldId) : "");
    case "Animal": return (r) => (r.animalId ? lookup("animals", r.animalId) : "");
    case "Pasture": return (r) => (r.pastureId ? lookup("pastures", r.pastureId) : "");
    case "Herd": return (r) => r.herd ?? "";
    case "Feedlot": return (r) => r.feedlotId ?? "";
    case "Production cycle": return (r) => r.cycle ?? "";
    case "Month": return (r) => String(r.date ?? "").slice(0, 7);
    case "Year": return (r) => String(r.date ?? "").slice(0, 4);
    case "Farm section": return (r) => r.section ?? "";
    default: return (r) => r.category ?? "";
  }
}
