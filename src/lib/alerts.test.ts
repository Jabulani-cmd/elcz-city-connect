import { describe, expect, it } from "vitest";
import { diseaseOutbreakAlerts } from "./alerts";
import type { Row } from "./types";

const disease = (id: string, animalId: string, name: string, dateDetected = "2026-11-20"): Row => ({ id, farmId: "f1", createdAt: "", updatedAt: "", animalId, disease: name, dateDetected });

describe("disease outbreak alerts", () => {
  it("does not alert for one ordinary disease case", () => {
    expect(diseaseOutbreakAlerts([disease("1", "a1", "Mastitis")], "2026-11-25")).toEqual([]);
  });
  it("warns when two different animals have the same disease within 30 days", () => {
    const alerts = diseaseOutbreakAlerts([disease("1", "a1", "Mastitis"), disease("2", "a2", "Mastitis", "2026-11-22")], "2026-11-25");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("warning");
    expect(alerts[0].kind).toBe("Disease outbreaks");
  });
  it("raises a possible outbreak for three affected animals", () => {
    const alerts = diseaseOutbreakAlerts([disease("1", "a1", "Mastitis"), disease("2", "a2", "Mastitis"), disease("3", "a3", "Mastitis")], "2026-11-25");
    expect(alerts[0].title).toBe("Possible Mastitis outbreak");
    expect(alerts[0].severity).toBe("danger");
  });
  it("counts an animal only once in a cluster", () => {
    const alerts = diseaseOutbreakAlerts([disease("1", "a1", "Mastitis"), disease("2", "a1", "Mastitis")], "2026-11-25");
    expect(alerts).toEqual([]);
  });
  it("alerts immediately for a possible notifiable disease", () => {
    const alerts = diseaseOutbreakAlerts([disease("1", "a1", "Foot-and-mouth disease")], "2026-11-25");
    expect(alerts[0].severity).toBe("danger");
    expect(alerts[0].detail).toMatch(/stop movements/i);
  });
  it("ignores cases older than 30 days", () => {
    expect(diseaseOutbreakAlerts([disease("1", "a1", "Mastitis", "2026-10-01")], "2026-11-25")).toEqual([]);
  });
});
