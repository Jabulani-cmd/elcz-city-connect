import type { Row } from "./types";

const DAY = 86_400_000;

export const toNum = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const parseDate = (d?: string | null): Date | null => {
  if (!d) return null;
  const t = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  return Number.isNaN(t.getTime()) ? null : t;
};

export const daysBetween = (from?: string | null, to?: string | null): number => {
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / DAY);
};

export const addDays = (d: string, days: number): string => {
  const t = parseDate(d) ?? new Date();
  t.setDate(t.getDate() + days);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

export const round = (n: number, dp = 2) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Weight Gain = Current Weight − Previous Weight */
export const weightGain = (current: number, previous: number) => round(current - previous);

/** Average Daily Gain = Weight Gain ÷ Number of Days */
export const averageDailyGain = (gain: number, days: number) => (days > 0 ? round(gain / days, 3) : 0);

export function ageInMonths(dob?: string | null, now = todayISO()): number {
  const b = parseDate(dob);
  const n = parseDate(now);
  if (!b || !n) return 0;
  return Math.max(0, (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth()) - (n.getDate() < b.getDate() ? 1 : 0));
}

export function ageLabel(dob?: string | null, now = todayISO()): string {
  if (!dob) return "–";
  const m = ageInMonths(dob, now);
  if (m < 1) return `${Math.max(0, daysBetween(dob, now))} d`;
  if (m < 24) return `${m} mo`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r ? `${y} y ${r} mo` : `${y} y`;
}

/** Net Sale Revenue = Sale Price − Selling Expenses */
export const netSaleRevenue = (price: number, transport: number, commission: number, other: number) =>
  round(price - transport - commission - other);

/** Animal Profit = Net Sale Revenue − Total Acquisition/Production Cost */
export const animalProfit = (netRevenue: number, totalCost: number) => round(netRevenue - totalCost);

export const acquisitionTotal = (price: number, transport: number, vet: number, other: number) =>
  round(price + transport + vet + other);

/** Feed Inventory = Purchases − Feed Used */
export const feedAvailable = (purchased: number, used: number) => round(purchased - used);

export const sum = (rows: Row[], key: string) => rows.reduce((a, r) => a + toNum(r[key]), 0);

export function stockingRate(animals: number, hectares: number): number {
  return hectares > 0 ? round(animals / hectares, 2) : 0;
}

export type FeedlotMetrics = {
  daysOnFeed: number;
  gain: number;
  adg: number;
  totalFeedKg: number;
  feedCost: number;
  fcr: number;
  costPerKgGain: number;
  finishingDate: string;
  salePrice: number;
};

export function feedlotMetrics(r: Row, today = todayISO()): FeedlotMetrics {
  const days = Math.max(0, daysBetween(r.entryDate, today));
  const gain = round(toNum(r.currentWeight) - toNum(r.startWeight));
  const adg = averageDailyGain(gain, days);
  const totalFeedKg = round(toNum(r.dailyIntakeKg) * days);
  const feedCost = round(totalFeedKg * toNum(r.feedCostPerKg));
  const remaining = Math.max(0, toNum(r.targetWeight) - toNum(r.currentWeight));
  const finishingDate = adg > 0 ? addDays(today, Math.ceil(remaining / adg)) : "";
  return {
    daysOnFeed: days,
    gain,
    adg,
    totalFeedKg,
    feedCost,
    fcr: gain > 0 ? round(totalFeedKg / gain) : 0,
    costPerKgGain: gain > 0 ? round(feedCost / gain) : 0,
    finishingDate,
    salePrice: round(toNum(r.targetWeight) * toNum(r.salePricePerKg)),
  };
}

export type HerdCounts = {
  total: number;
  bulls: number;
  cows: number;
  heifers: number;
  calves: number;
  steers: number;
  breeding: number;
  pregnant: number;
  quarantine: number;
  sold: number;
  deceased: number;
  avgWeight: number;
  cattle: number;
  other: number;
};

export function herdCounts(animals: Row[], breeding: Row[] = []): HerdCounts {
  const active = animals.filter((a) => a.status === "Active" || a.status === "Quarantined");
  const cat = (c: string) => active.filter((a) => a.category === c).length;
  const weights = active.map((a) => toNum(a.currentWeight)).filter((w) => w > 0);
  const pregnantIds = new Set(
    breeding.filter((b) => b.pregnancyStatus === "Pregnant" && !b.actualCalvingDate).map((b) => b.cowId),
  );
  return {
    total: active.length,
    bulls: cat("Bull"),
    cows: cat("Cow"),
    heifers: cat("Heifer"),
    calves: cat("Calf"),
    steers: cat("Steer"),
    breeding: active.filter((a) => a.breedingAnimal === "Yes").length,
    pregnant: pregnantIds.size,
    quarantine: animals.filter((a) => a.status === "Quarantined").length,
    sold: animals.filter((a) => a.status === "Sold").length,
    deceased: animals.filter((a) => a.status === "Deceased").length,
    avgWeight: weights.length ? round(weights.reduce((a, b) => a + b, 0) / weights.length, 1) : 0,
    cattle: active.filter((a) => (a.species || "Cattle") === "Cattle").length,
    other: active.filter((a) => (a.species || "Cattle") !== "Cattle").length,
  };
}

export const monthKey = (d?: string | null) => (d ? d.slice(0, 7) : "");

export function lastMonths(n: number, now = todayISO()): string[] {
  const base = parseDate(now) ?? new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export const fmtMoney = (n: number, cur = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n || 0);

export const fmtNum = (n: number, dp = 1) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: dp }).format(n || 0);
