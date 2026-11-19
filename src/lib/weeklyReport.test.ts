import { describe, expect, it } from "vitest";
import { inWeek, isMonday, previousWeek, summaryRows, toBase64, toCsv, weeklyFileName, type WeeklyData } from "../../supabase/functions/_shared/weekly";

const empty = (): WeeklyData => ({ income: [], expenses: [], sales: [], purchases: [], births: [], deaths: [], health: [], vaccinations: [], harvests: [], fertilizer: [], irrigation: [], tasks: [] });

describe("previousWeek", () => {
  it("on a Monday is the week that just ended", () => {
    expect(previousWeek("2026-11-23")).toMatchObject({ from: "2026-11-16", to: "2026-11-22" }); // Monday 23 Nov
  });
  it("any day gives the last complete Monday–Sunday week", () => {
    expect(previousWeek("2026-11-19")).toMatchObject({ from: "2026-11-09", to: "2026-11-15" }); // Thursday
    expect(previousWeek("2026-11-22")).toMatchObject({ from: "2026-11-09", to: "2026-11-15" }); // Sunday
  });
  it("crosses month and year ends", () => {
    expect(previousWeek("2027-01-04")).toMatchObject({ from: "2026-12-28", to: "2027-01-03" });
  });
  it("labels the week", () => {
    expect(previousWeek("2026-11-23").label).toBe("16 Nov – 22 Nov 2026");
  });
  it("knows which day is Monday", () => {
    expect(isMonday("2026-11-23")).toBe(true);
    expect(isMonday("2026-11-24")).toBe(false);
    expect(isMonday("2026-11-22")).toBe(false);
  });
});

describe("summaryRows", () => {
  const w = previousWeek("2026-11-23"); // 16–22 Nov
  it("counts only the chosen week", () => {
    const d = empty();
    d.income = [{ date: "2026-11-16", amount: 100 }, { date: "2026-11-22", amount: "40.5" }, { date: "2026-11-23", amount: 999 }, { date: "2026-11-15", amount: 999 }];
    d.expenses = [{ date: "2026-11-18", amount: 30 }];
    d.births = [{ birth_date: "2026-11-20" }, { birth_date: "2026-10-01" }];
    d.tasks = [{ due_date: "2026-11-17", status: "Done" }, { due_date: "2026-11-18", status: "To do" }, { due_date: "2026-12-01", status: "To do" }];
    const rows = Object.fromEntries(summaryRows(d, w).map((r) => [r[1], r[2]]));
    expect(rows["Income"]).toBe(140.5);
    expect(rows["Expenses"]).toBe(30);
    expect(rows["Net (income – expenses)"]).toBe(110.5);
    expect(rows["Births"]).toBe(1);
    expect(rows["Due in the week"]).toBe(2);
    expect(rows["…of which done"]).toBe(1);
    expect(rows["…of which not done"]).toBe(1);
  });
  it("is all zeros for a quiet week", () => {
    for (const r of summaryRows(empty(), w)) expect(r[2]).toBe(0);
  });
  it("includes dates stored with a time part", () => {
    expect(inWeek("2026-11-16T08:00:00+00:00", w)).toBe(true);
    expect(inWeek(undefined, w)).toBe(false);
  });
});

describe("CSV output", () => {
  it("escapes commas and quotes and starts with a byte-order mark", () => {
    const csv = toCsv(["A", "B"], [["x,y", 'say "hi"'], ["Net (income – expenses)", 5]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"x,y","say ""hi"""');
    expect(csv.split("\r\n")).toHaveLength(3);
  });
  it("base64 round-trips non-ASCII text", () => {
    const text = toCsv(["Measure"], [["Net (income – expenses)"]]);
    const bytes = Uint8Array.from(atob(toBase64(text)), (c) => c.charCodeAt(0));
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // the byte-order mark Excel needs is really in the file
    expect(new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes)).toBe(text);
  });
  it("names the file after the farm and the dates", () => {
    expect(weeklyFileName("Green Valley Farm (Demo)", previousWeek("2026-11-23"))).toBe("green-valley-farm-demo_weekly-report_2026-11-16_to_2026-11-22.csv");
    expect(weeklyFileName("***", previousWeek("2026-11-23"))).toMatch(/^farm_weekly-report_/);
  });
});
