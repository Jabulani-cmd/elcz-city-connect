import { describe, expect, it } from "vitest";
import { breedOptions, carcassPricing, categoryOptions, monthlyThroughput } from "./livestock";
import { fromDb, toDb } from "./tables";
import type { Row } from "./types";

const sale = (id: string, date: string, carcassWeight: number, price: number): Row => ({ id, farmId: "f1", createdAt: "", updatedAt: "", date, carcassWeight, price });

describe("species-dependent animal fields", () => {
  it("changes breeds when species changes", () => {
    expect(breedOptions({ species: "Cattle" })).toContain("Brahman");
    expect(breedOptions({ species: "Goats" })).toContain("Boer");
    expect(breedOptions({ species: "Goats" })).not.toContain("Brahman");
    expect(breedOptions({ species: "Poultry" })).toContain("Ross 308");
  });
  it("offers scrollable crossbreed choices", () => {
    expect(breedOptions({ species: "Cattle" })).toContain("Crossbreed – Brahman × Angus");
    expect(breedOptions({ species: "Sheep" }).some((b) => b.startsWith("Crossbreed"))).toBe(true);
  });
  it("changes animal types when species changes", () => {
    expect(categoryOptions({ species: "Cattle" })).toEqual(["Bull", "Cow", "Heifer", "Calf", "Steer"]);
    expect(categoryOptions({ species: "Pigs" })).toContain("Sow");
    expect(categoryOptions({ species: "Poultry" })).toContain("Hen");
    expect(categoryOptions({ species: "Goats" })).not.toContain("Cow");
  });
});

describe("carcass and monthly throughput", () => {
  it("calculates total selling price from carcass weight and price per kg", () => {
    expect(carcassPricing({ carcassWeight: 280, pricePerKg: 4.5 }).price).toBe(1260);
  });
  it("calculates price per kg from carcass weight and total price", () => {
    expect(carcassPricing({ carcassWeight: 280, price: 1260 }).pricePerKg).toBe(4.5);
  });
  it("requires either total price or both carcass inputs", () => {
    expect(() => carcassPricing({ carcassWeight: 280 })).toThrow(/total selling price/i);
  });
  it("counts monthly throughput and weighted average carcass price", () => {
    const rows = [sale("1", "2026-11-02", 200, 900), sale("2", "2026-11-20", 300, 1350), sale("3", "2026-10-31", 250, 1000)];
    expect(monthlyThroughput(rows, "2026-11")).toEqual({ animalsSold: 2, carcassWeightKg: 500, grossValue: 2250, averagePricePerKg: 4.5 });
  });
  it("stores carcass fields in the existing extra column and restores them", () => {
    const row = sale("11111111-1111-4111-8111-111111111111", "2026-11-20", 280, 1260);
    row.pricePerKg = 4.5;
    const db = toDb("sales", row);
    expect(db.carcass_weight).toBeUndefined();
    expect(db.price_per_kg).toBeUndefined();
    expect(db.extra).toMatchObject({ carcassWeight: 280, pricePerKg: 4.5 });
    expect(fromDb("sales", db).carcassWeight).toBe(280);
    expect(fromDb("sales", db).pricePerKg).toBe(4.5);
  });
});
