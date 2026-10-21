import { describe, it, expect } from "vitest";
import type { Row } from "./types";
import {
  addDays, ageInMonths, animalProfit, averageDailyGain, daysBetween, feedAvailable, feedlotMetrics,
  herdCounts, netSaleRevenue, weightGain,
} from "./calc";

describe("weight maths", () => {
  it("weight gain = current − previous", () => expect(weightGain(350, 320)).toBe(30));
  it("ADG = gain ÷ days", () => expect(averageDailyGain(30, 30)).toBe(1));
  it("ADG is 0 for same-day weights", () => expect(averageDailyGain(10, 0)).toBe(0));
  it("counts days", () => expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30));
});

describe("money maths", () => {
  it("net sale revenue = price − selling expenses", () => expect(netSaleRevenue(1000, 50, 30, 20)).toBe(900));
  it("animal profit = net − cost", () => expect(animalProfit(900, 700)).toBe(200));
  it("feed inventory = purchases − used", () => expect(feedAvailable(100, 35)).toBe(65));
});

describe("dates", () => {
  it("adds days", () => expect(addDays("2026-01-30", 3)).toBe("2026-02-02"));
  it("age in months", () => expect(ageInMonths("2025-01-15", "2026-03-14")).toBe(13));
});

describe("herd + feedlot", () => {
  it("counts herd by status and category", () => {
    const animals = [
      { status: "Active", category: "Cow", currentWeight: 400 },
      { status: "Active", category: "Calf", currentWeight: 100 },
      { status: "Quarantined", category: "Bull", currentWeight: 600 },
      { status: "Sold", category: "Steer" },
      { status: "Deceased", category: "Cow" },
    ];
    const c = herdCounts(animals as unknown as Row[]);
    expect(c.total).toBe(3);
    expect(c.quarantine).toBe(1);
    expect(c.sold).toBe(1);
    expect(c.deceased).toBe(1);
    expect(c.avgWeight).toBe(366.7);
  });
  it("computes feedlot metrics", () => {
    const m = feedlotMetrics(
      { entryDate: "2026-01-01", startWeight: 300, currentWeight: 360, targetWeight: 420, dailyIntakeKg: 10, feedCostPerKg: 0.5, salePricePerKg: 3 } as unknown as Row,
      "2026-01-31",
    );
    expect(m.daysOnFeed).toBe(30);
    expect(m.adg).toBe(2);
    expect(m.fcr).toBe(5);
    expect(m.feedCost).toBe(150);
    expect(m.costPerKgGain).toBe(2.5);
    expect(m.finishingDate).toBe("2026-03-02");
    expect(m.salePrice).toBe(1260);
  });
});

import { herdSeries, onFarmOn, profitability } from "./analytics";

describe("analytics", () => {
  const animals = [
    { species: "Cattle", dob: "2024-01-01", status: "Active" },
    { species: "Cattle", dob: "2024-01-01", status: "Sold", soldDate: "2026-02-10" },
    { species: "Cattle", dob: "2026-02-20", status: "Active" },
  ];
  it("knows when an animal was on the farm", () => {
    expect(onFarmOn(animals[1] as unknown as Row, "2026-02-09")).toBe(true);
    expect(onFarmOn(animals[1] as unknown as Row, "2026-02-10")).toBe(false);
  });
  it("builds a daily herd series", () => {
    const s = herdSeries(animals as unknown as Row[], "daily", "2026-02-25");
    expect(s).toHaveLength(30);
    expect(s[s.length - 1].herd).toBe(2); // sold one, calf born
    expect(s[0].herd).toBe(2); // 2026-01-27: two adults
  });
  it("groups profit", () => {
    const r = profitability([{ amount: 100, section: "A" }] as unknown as Row[], [{ amount: 40, section: "A" }, { amount: 10, section: "B" }] as unknown as Row[], (x) => x.section);
    expect(r[0]).toEqual({ name: "A", income: 100, expenses: 40, profit: 60 });
    expect(r[1].profit).toBe(-10);
  });
});

describe("reports catalogue matches the brief", () => {
  it("has the 12 livestock, 9 agriculture and 7 financial reports", async () => {
    // reports.ts reads the store, which needs localStorage (jsdom provides it)
    const { REPORTS } = await import("./reports");
    const n = (g: string) => REPORTS.filter((r) => r.group === g).length;
    expect([n("Livestock"), n("Agriculture"), n("Financial")]).toEqual([12, 9, 7]);
    expect(new Set(REPORTS.map((r) => r.id)).size).toBe(REPORTS.length);
  });
});
