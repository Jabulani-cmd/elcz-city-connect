import { describe, expect, it } from "vitest";
import { weatherAlertsFromForecast, type ForecastDay } from "./weather";

const day = (date: string, extra: Partial<ForecastDay> = {}): ForecastDay => ({ date, weatherCode: 0, tempMax: 26, tempMin: 15, rainMm: 0, rainChance: 0, windKph: 10, ...extra });

describe("weather notification rules", () => {
  it("warns about heavy rain and gives farm actions", () => {
    const alerts = weatherAlertsFromForecast("f1", [day("2026-11-26", { rainMm: 30, rainChance: 90 })]);
    expect(alerts[0].title).toMatch(/heavy rain/i);
    expect(alerts[0].detail).toMatch(/protect feed/i);
    expect(alerts[0].kind).toBe("Weather");
  });
  it("raises extreme heat, frost and damaging wind alerts", () => {
    const alerts = weatherAlertsFromForecast("f1", [day("2026-11-26", { tempMax: 36, tempMin: 0, windKph: 55 })]);
    expect(alerts.filter((a) => a.severity === "danger")).toHaveLength(3);
    expect(alerts.map((a) => a.title).join(" ")).toMatch(/extreme heat/i);
    expect(alerts.map((a) => a.title).join(" ")).toMatch(/frost/i);
    expect(alerts.map((a) => a.title).join(" ")).toMatch(/damaging winds/i);
  });
  it("warns about a dry hot week without calling it a drought", () => {
    const days = Array.from({ length: 7 }, (_, i) => day(`2026-11-${25 + i}`, { tempMax: 31 }));
    const alerts = weatherAlertsFromForecast("f1", days);
    expect(alerts).toHaveLength(1); // seven dry days produce one summary, not seven duplicate alerts
    expect(alerts.some((a) => a.id.endsWith("-dry"))).toBe(true);
    expect(alerts.find((a) => a.id.endsWith("-dry"))?.title).not.toMatch(/drought/i);
  });
  it("returns no alert for mild weather", () => {
    expect(weatherAlertsFromForecast("f1", [day("2026-11-26")])).toEqual([]);
  });
});
