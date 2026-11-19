import { beforeEach, describe, expect, it } from "vitest";
import { activityLog, farmSummary, periodFileName, periodFor, periodReports, presets } from "./periodReports";
import { REPORTS } from "./reportCatalog";
import { attachUser, createFarm, upsert } from "./store";

describe("periodFor", () => {
  it("daily is the single day", () => {
    expect(periodFor("daily", "2026-11-19")).toMatchObject({ from: "2026-11-19", to: "2026-11-19", label: "Thu 19 Nov 2026" });
  });
  it("weekly runs Monday to Sunday around the chosen day", () => {
    expect(periodFor("weekly", "2026-11-19")).toMatchObject({ from: "2026-11-16", to: "2026-11-22" }); // Thursday
    expect(periodFor("weekly", "2026-11-16")).toMatchObject({ from: "2026-11-16", to: "2026-11-22" }); // Monday
    expect(periodFor("weekly", "2026-11-22")).toMatchObject({ from: "2026-11-16", to: "2026-11-22" }); // Sunday
  });
  it("crosses month and year ends", () => {
    expect(periodFor("weekly", "2027-01-01")).toMatchObject({ from: "2026-12-28", to: "2027-01-03" });
  });
  it("offers today/yesterday and this/last week", () => {
    expect(presets("daily", "2026-11-19").map((x) => x.anchor)).toEqual(["2026-11-19", "2026-11-18"]);
    expect(presets("weekly", "2026-11-19").map((x) => x.anchor)).toEqual(["2026-11-19", "2026-11-12"]);
  });
});

describe("period reports", () => {
  beforeEach(() => { localStorage.clear(); attachUser(`u-${Math.random()}`); createFarm({ name: "Test farm" }); });

  it("summarises only the chosen dates", () => {
    upsert("income", { date: "2026-11-18", category: "Other", description: "in", amount: 100 });
    upsert("income", { date: "2026-11-19", category: "Other", description: "in", amount: 40 });
    upsert("expenses", { date: "2026-11-19", category: "Other", description: "out", amount: 15 });
    const day = farmSummary(periodFor("daily", "2026-11-19")).rows;
    expect(day.find((r) => r[1] === "Income")?.[2]).toBe(40);
    expect(day.find((r) => r[1].toString().startsWith("Net"))?.[2]).toBe(25);
    expect(farmSummary(periodFor("weekly", "2026-11-19")).rows.find((r) => r[1] === "Income")?.[2]).toBe(140);
  });
  it("lists activity from the audit trail", () => {
    upsert("income", { date: "2026-11-19", category: "Other", description: "in", amount: 1 });
    const t = activityLog(periodFor("daily", new Date().toISOString().slice(0, 10)));
    expect(t.rows.length).toBeGreaterThan(0);
    expect(t.rows[0][2]).toBe("create");
  });
  it("offers the summary, the log and every catalogue report", () => {
    const list = periodReports(periodFor("daily", "2026-11-19"));
    expect(list).toHaveLength(REPORTS.length + 2);
    expect(list.filter((r) => r.snapshot).length).toBeGreaterThan(0);
    for (const r of list) expect(() => r.build(), r.id).not.toThrow();
  });
  it("names files with the dates", () => {
    expect(periodFileName("Farm summary", periodFor("weekly", "2026-11-19"))).toBe("farm-summary_2026-11-16_to_2026-11-22.csv");
    expect(periodFileName("Farm summary", periodFor("daily", "2026-11-19"))).toBe("farm-summary_2026-11-19.csv");
  });
});
