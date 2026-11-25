import { round, toNum } from "./calc";
import type { Row, Values } from "./types";

export const SPECIES = ["Cattle", "Goats", "Sheep", "Pigs", "Poultry", "Other"];

const CROSS = "Crossbreed – other";
export const CATTLE_BREEDS = [
  "Brahman", "Nguni", "Angus", "Hereford", "Bonsmara", "Boran", "Simmental", "Holstein", "Jersey", "Tuli", "Mashona",
  "Crossbreed – Brahman × Angus", "Crossbreed – Brahman × Hereford", "Crossbreed – Bonsmara × Nguni", CROSS, "Other",
];

export const BREEDS_BY_SPECIES: Record<string, string[]> = {
  Cattle: CATTLE_BREEDS,
  Goats: ["Boer", "Kalahari Red", "Savanna", "Mashona", "Matabele", "Angora", "Indigenous", "Crossbreed – Boer × Indigenous", "Crossbreed – Boer × Kalahari Red", CROSS, "Other"],
  Sheep: ["Dorper", "Merino", "Damara", "Blackhead Persian", "Meatmaster", "Indigenous", "Crossbreed – Dorper × Blackhead Persian", "Crossbreed – Dorper × Merino", CROSS, "Other"],
  Pigs: ["Large White", "Landrace", "Duroc", "Hampshire", "Pietrain", "Crossbreed – Large White × Landrace", "Crossbreed – Duroc × Large White", CROSS, "Other"],
  Poultry: ["Boschveld", "Kuroiler", "Rhode Island Red", "Australorp", "Cobb 500", "Ross 308", "Hy-Line Brown", "Lohmann Brown", "Indigenous / roadrunner", "Crossbreed – Boschveld × Rhode Island Red", CROSS, "Other"],
  Other: [CROSS, "Other"],
};

export const CATEGORIES = ["Bull", "Cow", "Heifer", "Calf", "Steer"];
export const CATEGORIES_BY_SPECIES: Record<string, string[]> = {
  Cattle: CATEGORIES,
  Goats: ["Buck", "Doe", "Doeling", "Kid", "Wether"],
  Sheep: ["Ram", "Ewe", "Ewe lamb", "Lamb", "Wether"],
  Pigs: ["Boar", "Sow", "Gilt", "Piglet", "Barrow"],
  Poultry: ["Rooster", "Hen", "Pullet", "Cockerel", "Chick"],
  Other: ["Breeding male", "Breeding female", "Young", "Other"],
};

export const breedOptions = (values: Values) => BREEDS_BY_SPECIES[String(values.species || "Cattle")] ?? BREEDS_BY_SPECIES.Other;
export const categoryOptions = (values: Values) => CATEGORIES_BY_SPECIES[String(values.species || "Cattle")] ?? CATEGORIES_BY_SPECIES.Other;

/** Carcass weight × price/kg supplies the total; otherwise derive price/kg from the total. */
export function carcassPricing(values: Values): Values {
  const weight = toNum(values.carcassWeight);
  const perKg = toNum(values.pricePerKg);
  if (weight > 0 && perKg > 0) return { ...values, price: round(weight * perKg) };
  if (toNum(values.price) <= 0) throw new Error("Enter the total selling price, or carcass weight and price per kg");
  if (weight > 0 && perKg <= 0) return { ...values, pricePerKg: round(toNum(values.price) / weight) };
  return values;
}

/** Monthly sales throughput and carcass economics. Gross value uses the recorded total selling price. */
export function monthlyThroughput(sales: Row[], month: string) {
  const rows = sales.filter((s) => String(s.date ?? "").startsWith(month));
  const carcassWeightKg = round(rows.reduce((n, s) => n + toNum(s.carcassWeight), 0));
  const grossValue = round(rows.reduce((n, s) => n + toNum(s.price), 0));
  return {
    animalsSold: rows.length,
    carcassWeightKg,
    grossValue,
    averagePricePerKg: carcassWeightKg > 0 ? round(grossValue / carcassWeightKg) : 0,
  };
}
