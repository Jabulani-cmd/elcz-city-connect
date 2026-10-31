import {
  acquisitionTotal, ageLabel, addDays, animalProfit, averageDailyGain, daysBetween, feedAvailable, feedlotMetrics,
  netSaleRevenue, round, stockingRate, sum, toNum, todayISO,
} from "./calc";
import type { Row } from "./types";

export type FieldType = "text" | "number" | "money" | "date" | "select" | "textarea" | "ref" | "file";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  ref?: string;
  allowAll?: boolean;
  required?: boolean;
  placeholder?: string;
  help?: string;
  half?: boolean;
  /** Default for new records. Functions are evaluated when the form opens. */
  def?: string | number | (() => string | number);
};

export type Ctx = { rows: (collection: string) => Row[] };

export type Derived = {
  key: string;
  label: string;
  value: (r: Row, ctx: Ctx) => string | number;
  kind?: "money" | "number" | "text" | "date";
};

export type Resource = {
  collection: string;
  title: string;
  singular: string;
  help?: string;
  fields: Field[];
  columns: string[];
  derived?: Derived[];
  derivedColumns?: string[];
  search?: string[];
  filter?: { key: string; label: string };
  sort?: (a: Row, b: Row) => number;
};

const f = (type: FieldType) => (key: string, label: string, extra: Partial<Field> = {}): Field => ({ key, label, type, ...extra });
const txt = f("text");
const num = f("number");
const money = f("money");
const date = f("date");
const area = f("textarea");
const file = f("file");
const sel = (key: string, label: string, options: string[], extra: Partial<Field> = {}): Field => ({ key, label, type: "select", options, ...extra });
const ref = (key: string, label: string, collection: string, extra: Partial<Field> = {}): Field => ({ key, label, type: "ref", ref: collection, ...extra });
const today = () => todayISO();

export const byDateDesc = (key: string) => (a: Row, b: Row) => String(b[key] ?? "").localeCompare(String(a[key] ?? ""));

/* ---------- option lists ---------- */
export const SPECIES = ["Cattle", "Goats", "Sheep", "Pigs", "Poultry", "Other"];
export const CATTLE_BREEDS = ["Brahman", "Nguni", "Angus", "Hereford", "Bonsmara", "Boran", "Simmental", "Holstein", "Jersey", "Tuli", "Mashona", "Crossbreed", "Other"];
export const CATEGORIES = ["Bull", "Cow", "Heifer", "Calf", "Steer"];
export const ANIMAL_STATUS = ["Active", "Sold", "Deceased", "Missing", "Quarantined", "Transferred"];
export const SOIL_TYPES = ["Sandy", "Loam", "Clay", "Silt", "Sandy loam", "Clay loam"];
export const FERTILITY = ["High", "Medium", "Low"];
export const IRRIGATION_SYSTEMS = ["None (rain-fed)", "Centre pivot", "Drip", "Sprinkler", "Furrow", "Flood", "Manual"];
export const EXPENSE_CATEGORIES = ["Feed", "Fertilizer", "Seeds", "Veterinary", "Medication", "Labour", "Fuel", "Equipment", "Machinery", "Utilities", "Transport", "Land costs", "Maintenance", "Livestock purchase", "Other expenses"];
export const INCOME_CATEGORIES = ["Livestock sales", "Crop sales", "Milk sales", "Egg sales", "Other agricultural income"];
export const PAYMENT_METHODS = ["Cash", "Bank transfer", "Mobile money", "Card", "Cheque", "Credit"];
export const FARM_SECTIONS = ["General", "Agriculture", "Livestock", "Feedlot", "Employees"];
export const FEED_TYPES = ["Hay", "Silage", "Grain", "Concentrates", "Minerals", "Supplements", "Protein feed", "Other feed"];
export const INVENTORY_CATEGORIES = ["Feed", "Seeds", "Fertilizer", "Chemicals", "Veterinary medicines", "Equipment", "Spare parts", "Tools", "Fuel", "Other supplies"];
export const UNITS = ["kg", "t", "bags", "L", "bales", "doses", "units"];
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
export const TASK_STATUS = ["To do", "In progress", "Done"];
export const MAP_TYPES = ["Field", "Pasture", "Barn", "Feedlot", "Water source", "Dam", "Irrigation system", "Animal group", "Building", "Storage facility"];

/* ---------- labels used wherever a record is referenced ---------- */
export const LABELS: Record<string, (r: Row) => string> = {
  animals: (r) => `${r.tag}${r.name ? ` · ${r.name}` : ""}`,
  fields: (r) => r.name,
  crops: (r) => `${r.cropName}${r.variety ? ` (${r.variety})` : ""}`,
  pastures: (r) => `${r.code ? r.code + " · " : ""}${r.name}`,
  feed: (r) => r.name,
  employees: (r) => r.name,
  inventory: (r) => r.name,
  suppliers: (r) => r.name,
  customers: (r) => r.name,
};
export const labelOf = (collection: string, r?: Row) => (r ? (LABELS[collection]?.(r) ?? r.name ?? r.id) : "–");

const animalRef = (key = "animalId", label = "Animal", extra: Partial<Field> = {}) => ref(key, label, "animals", { required: true, ...extra });
const money0 = (label: string, key: string, extra: Partial<Field> = {}) => money(key, label, { half: true, ...extra });

/* ---------- finance tag fields shared by income & expenses ---------- */
const financeTags: Field[] = [
  sel("section", "Farm section", FARM_SECTIONS, { def: "General", half: true }),
  ref("animalId", "Animal (optional)", "animals", { half: true }),
  ref("fieldId", "Field (optional)", "fields", { half: true }),
  ref("cropId", "Crop (optional)", "crops", { half: true }),
  ref("pastureId", "Pasture (optional)", "pastures", { half: true }),
  txt("herd", "Herd (optional)", { half: true }),
  txt("feedlotId", "Feedlot / pen (optional)", { half: true }),
  txt("cycle", "Production cycle (optional)", { half: true, placeholder: "e.g. 2026 summer" }),
  file("receipt", "Receipt / document"),
];

const cropCost = (c: Row, ctx: Ctx) =>
  toNum(c.seedCost) + toNum(c.productionCost) +
  sum(ctx.rows("fertilizer").filter((x) => x.cropId === c.id), "cost") +
  sum(ctx.rows("protection").filter((x) => x.cropId === c.id), "cost") +
  sum(ctx.rows("irrigation").filter((x) => x.cropId === c.id), "cost");
export const cropRevenue = (c: Row) => toNum(c.actualYield) * toNum(c.sellingPrice);
export { cropCost };

const animalCost = (a: Row, ctx: Ctx) =>
  (a.acquisitionCost != null && a.acquisitionCost !== "" ? toNum(a.acquisitionCost) : toNum(a.purchasePrice)) +
  sum(ctx.rows("expenses").filter((e) => e.animalId === a.id), "amount");
export { animalCost };

/* ---------- resources ---------- */
export const RESOURCES: Record<string, Resource> = {
  /* ===== Agriculture ===== */
  fields: {
    collection: "fields", title: "Fields", singular: "field",
    help: "Each field or plot on the farm. Add GPS as latitude, longitude to show it on the farm map.",
    fields: [
      txt("name", "Field name / number", { required: true, half: true }),
      num("sizeHa", "Size (ha)", { required: true, half: true }),
      txt("gps", "GPS location", { placeholder: "-20.1500, 28.5800", half: true }),
      sel("soilType", "Soil type", SOIL_TYPES, { half: true }),
      sel("soilFertility", "Soil fertility", FERTILITY, { half: true }),
      sel("irrigationSystem", "Irrigation system", IRRIGATION_SYSTEMS, { half: true }),
      txt("currentCrop", "Current crop", { half: true }),
      txt("previousCrop", "Previous crop", { half: true }),
      sel("status", "Field status", ["Active", "Preparing", "Fallow", "Resting"], { def: "Active", half: true }),
    ],
    columns: ["name", "sizeHa", "soilType", "soilFertility", "currentCrop", "irrigationSystem", "status"],
    search: ["name", "currentCrop", "soilType"], filter: { key: "status", label: "Status" },
  },
  crops: {
    collection: "crops", title: "Crops", singular: "crop",
    help: "One record per crop planted. Revenue and profit calculate automatically from yield, price and all linked costs.",
    fields: [
      txt("cropName", "Crop name", { required: true, half: true }),
      txt("variety", "Variety", { half: true }),
      ref("fieldId", "Field / plot", "fields", { required: true }),
      date("plantingDate", "Planting date", { half: true, def: today }),
      date("expectedHarvestDate", "Expected harvest date", { half: true }),
      date("actualHarvestDate", "Actual harvest date", { half: true }),
      num("areaHa", "Area planted (ha)", { half: true }),
      num("seedQty", "Seed quantity (kg)", { half: true }),
      money("seedCost", "Seed cost", { half: true }),
      txt("fertilizerUsed", "Fertilizer used", { half: true }),
      txt("pesticidesUsed", "Pesticides used", { half: true }),
      txt("irrigationInfo", "Irrigation information", { half: true }),
      num("expectedYield", "Expected yield (t)", { half: true }),
      num("actualYield", "Actual yield (t)", { half: true }),
      money("productionCost", "Other cost of production", { half: true, help: "Labour, fuel etc. Fertilizer, chemical and irrigation records add on automatically." }),
      money("sellingPrice", "Selling price per tonne", { half: true }),
      sel("health", "Crop health", ["Good", "Fair", "Poor", "Diseased"], { def: "Good", half: true }),
    ],
    columns: ["cropName", "fieldId", "plantingDate", "expectedHarvestDate", "areaHa", "expectedYield", "actualYield", "health"],
    derived: [
      { key: "cost", label: "Total cost", kind: "money", value: (r, c) => round(cropCost(r, c)) },
      { key: "revenue", label: "Revenue", kind: "money", value: (r) => round(cropRevenue(r)) },
      { key: "profit", label: "Profit", kind: "money", value: (r, c) => round(cropRevenue(r) - cropCost(r, c)) },
    ],
    derivedColumns: ["cost", "revenue", "profit"],
    search: ["cropName", "variety"], filter: { key: "health", label: "Health" },
    sort: byDateDesc("plantingDate"),
  },
  plantings: {
    collection: "plantings", title: "Planting schedule", singular: "planting",
    fields: [
      txt("cropName", "Crop", { required: true, half: true }),
      txt("variety", "Seed variety", { half: true }),
      ref("fieldId", "Field", "fields", { required: true }),
      date("plantingDate", "Planting date", { required: true, half: true, def: today }),
      date("expectedHarvestDate", "Expected harvest date", { half: true }),
      num("quantity", "Planting quantity (kg)", { half: true }),
      money("cost", "Planting cost", { half: true }),
      sel("status", "Status", ["Scheduled", "Planted", "Delayed", "Cancelled"], { def: "Scheduled", half: true }),
    ],
    columns: ["cropName", "variety", "fieldId", "plantingDate", "expectedHarvestDate", "quantity", "cost", "status"],
    search: ["cropName", "variety"], filter: { key: "status", label: "Status" }, sort: byDateDesc("plantingDate"),
  },
  fertilizer: {
    collection: "fertilizer", title: "Fertilizer applications", singular: "fertilizer application",
    fields: [
      txt("fertilizerType", "Fertilizer type", { required: true, placeholder: "e.g. Compound D, AN", half: true }),
      num("quantity", "Quantity (kg)", { required: true, half: true }),
      ref("fieldId", "Field", "fields", { required: true, half: true }),
      ref("cropId", "Crop (optional)", "crops", { half: true }),
      date("applicationDate", "Application date", { half: true, def: today }),
      sel("method", "Application method", ["Broadcast", "Banding", "Side-dress", "Fertigation", "Foliar", "By hand"], { half: true }),
      money("cost", "Cost", { half: true }),
    ],
    columns: ["applicationDate", "fertilizerType", "fieldId", "quantity", "method", "cost"],
    derived: [{ key: "rate", label: "Rate (kg/ha)", kind: "number", value: (r, c) => { const fl = c.rows("fields").find((x) => x.id === r.fieldId); return fl && toNum(fl.sizeHa) > 0 ? round(toNum(r.quantity) / toNum(fl.sizeHa)) : 0; } }],
    derivedColumns: ["rate"], search: ["fertilizerType"], sort: byDateDesc("applicationDate"),
  },
  protection: {
    collection: "protection", title: "Crop protection", singular: "application",
    fields: [
      sel("kind", "Type", ["Pesticide", "Herbicide", "Fungicide"], { required: true, half: true }),
      txt("product", "Product", { required: true, half: true }),
      ref("fieldId", "Field", "fields", { required: true, half: true }),
      ref("cropId", "Crop (optional)", "crops", { half: true }),
      date("applicationDate", "Application date", { half: true, def: today }),
      num("quantity", "Quantity (L or kg)", { half: true }),
      txt("target", "Target pest / disease", { half: true }),
      money("cost", "Cost", { half: true }),
    ],
    columns: ["applicationDate", "kind", "product", "fieldId", "quantity", "target", "cost"],
    search: ["product", "target"], filter: { key: "kind", label: "Type" }, sort: byDateDesc("applicationDate"),
  },
  irrigation: {
    collection: "irrigation", title: "Irrigation", singular: "irrigation record",
    fields: [
      ref("fieldId", "Field", "fields", { required: true, half: true }),
      date("date", "Irrigation date", { half: true, def: today }),
      sel("system", "Irrigation system", IRRIGATION_SYSTEMS, { half: true }),
      num("durationH", "Duration (hours)", { half: true }),
      num("waterM3", "Water used (m³)", { half: true }),
      sel("source", "Water source", ["Borehole", "Dam", "River", "Canal", "Municipal", "Rainwater"], { half: true }),
      ref("cropId", "Crop (optional)", "crops", { half: true }),
      money("cost", "Irrigation cost", { half: true }),
      area("problems", "Irrigation problems", { placeholder: "Leave blank if none" }),
    ],
    columns: ["date", "fieldId", "system", "durationH", "waterM3", "source", "cost", "problems"],
    sort: byDateDesc("date"), search: ["source", "problems"],
  },
  harvests: {
    collection: "harvests", title: "Harvests", singular: "harvest",
    fields: [
      ref("cropId", "Crop", "crops", { required: true }),
      date("harvestDate", "Harvest date", { half: true, def: today }),
      num("quantity", "Quantity harvested (t)", { required: true, half: true }),
      sel("quality", "Quality", ["Grade A", "Grade B", "Grade C", "Mixed"], { half: true }),
      txt("storage", "Storage location", { half: true }),
      num("quantitySold", "Quantity sold (t)", { half: true }),
      money("sellingPrice", "Selling price per tonne", { half: true }),
    ],
    columns: ["harvestDate", "cropId", "quantity", "quality", "storage", "quantitySold"],
    derived: [
      { key: "remaining", label: "Remaining (t)", kind: "number", value: (r) => round(toNum(r.quantity) - toNum(r.quantitySold)) },
      { key: "revenue", label: "Revenue", kind: "money", value: (r) => round(toNum(r.quantitySold) * toNum(r.sellingPrice)) },
    ],
    derivedColumns: ["remaining", "revenue"], sort: byDateDesc("harvestDate"),
  },
  diagnoses: {
    collection: "diagnoses", title: "Crop diagnosis history", singular: "diagnosis",
    fields: [
      ref("cropId", "Crop", "crops", { required: true }),
      date("date", "Date", { def: today, half: true }),
      txt("finding", "Possible issue", { half: true }),
      txt("confidence", "Confidence", { half: true }),
      sel("source", "Source", ["AI (recommendation)", "Agronomist", "Self-assessed"], { half: true }),
      area("symptoms", "Visible symptoms"),
      area("nextSteps", "Recommended next steps"),
    ],
    columns: ["date", "cropId", "finding", "confidence", "source"], sort: byDateDesc("date"),
  },

  /* ===== Livestock ===== */
  animals: {
    collection: "animals", title: "Herd registry", singular: "animal",
    help: "Every animal has its own profile. Tap a row's chart icon to see its weight trend and history.",
    fields: [
      txt("tag", "Animal ID / tag", { required: true, half: true }),
      txt("rfid", "RFID number (optional)", { half: true, placeholder: "Leave blank if no electronic tag" }),
      txt("name", "Name / nickname", { half: true }),
      sel("species", "Species", SPECIES, { def: "Cattle", half: true }),
      sel("breed", "Breed", CATTLE_BREEDS, { half: true }),
      sel("category", "Type", CATEGORIES, { required: true, half: true }),
      sel("sex", "Sex", ["Female", "Male"], { required: true, half: true }),
      date("dob", "Date of birth", { half: true }),
      txt("color", "Color", { half: true }),
      txt("registrationNo", "Registration number", { half: true }),
      txt("sireId", "Sire (father)", { half: true }),
      txt("damId", "Dam (mother)", { half: true }),
      ref("pastureId", "Pasture", "pastures", { half: true }),
      txt("location", "Current location", { half: true }),
      txt("herd", "Herd / group", { half: true }),
      sel("breedingAnimal", "Breeding animal?", ["No", "Yes"], { def: "No", half: true }),
      date("purchaseDate", "Purchase date", { half: true }),
      money("purchasePrice", "Purchase price", { half: true }),
      money("estimatedValue", "Current estimated value", { half: true }),
      num("currentWeight", "Current weight (kg)", { half: true, help: "Updated automatically when you record a weight." }),
      sel("status", "Status", ANIMAL_STATUS, { def: "Active", half: true }),
    ],
    columns: ["tag", "name", "breed", "category", "pastureId", "herd", "currentWeight", "status"],
    derived: [{ key: "age", label: "Age", kind: "text", value: (r) => ageLabel(r.dob) }],
    derivedColumns: ["age"],
    search: ["tag", "name", "rfid", "breed", "herd"], filter: { key: "status", label: "Status" },
    sort: (a, b) => String(a.tag).localeCompare(String(b.tag), undefined, { numeric: true }),
  },
  weights: {
    collection: "weights", title: "Weight records", singular: "weight",
    help: "Pick the animal, enter the weight and save. Gain and daily gain calculate automatically.",
    fields: [
      animalRef(),
      num("weight", "Weight (kg)", { required: true, half: true }),
      date("date", "Date weighed", { required: true, half: true, def: today }),
      txt("location", "Weighing location", { half: true }),
      txt("notes", "Notes", { half: true }),
    ],
    columns: ["date", "animalId", "weight", "previousWeight", "difference", "adg", "location"],
    sort: byDateDesc("date"), search: ["notes", "location"],
  },
  pastures: {
    collection: "pastures", title: "Pastures", singular: "pasture",
    fields: [
      txt("code", "Pasture ID", { half: true }),
      txt("name", "Pasture name", { required: true, half: true }),
      num("areaHa", "Area (ha)", { required: true, half: true }),
      txt("gps", "GPS location", { half: true, placeholder: "-20.1500, 28.5800" }),
      txt("forage", "Grass / forage type", { half: true }),
      num("capacity", "Carrying capacity (animals)", { half: true }),
      date("grazingStart", "Grazing start date", { half: true }),
      date("grazingEnd", "Grazing end date", { half: true }),
      num("restDays", "Required rest period (days)", { half: true, def: 30 }),
      date("lastFertilizer", "Last fertilizer application", { half: true }),
      sel("water", "Water availability", ["Available", "Limited", "Unavailable"], { def: "Available", half: true }),
      sel("condition", "Pasture condition", ["Good", "Fair", "Poor"], { def: "Good", half: true }),
      area("notes", "Notes"),
    ],
    columns: ["code", "name", "areaHa", "forage", "capacity", "water", "condition"],
    derived: [
      { key: "current", label: "Animals now", kind: "number", value: (r, c) => c.rows("animals").filter((a) => a.pastureId === r.id && (a.status === "Active" || a.status === "Quarantined")).length },
      { key: "stocking", label: "Stocking (animals/ha)", kind: "number", value: (r, c) => stockingRate(c.rows("animals").filter((a) => a.pastureId === r.id && (a.status === "Active" || a.status === "Quarantined")).length, toNum(r.areaHa)) },
    ],
    derivedColumns: ["current", "stocking"], search: ["name", "code", "forage"], filter: { key: "condition", label: "Condition" },
  },
  grazing: {
    collection: "grazing", title: "Grazing history", singular: "grazing record",
    fields: [
      animalRef(), ref("pastureId", "Pasture", "pastures", { required: true, half: true }),
      date("startDate", "Moved in", { half: true, def: today }), date("endDate", "Moved out", { half: true }),
    ],
    columns: ["startDate", "endDate", "animalId", "pastureId"], sort: byDateDesc("startDate"),
  },
  health: {
    collection: "health", title: "Medical history", singular: "health record",
    fields: [
      animalRef(),
      date("date", "Date", { half: true, def: today }),
      txt("condition", "Condition", { required: true, half: true }),
      area("symptoms", "Symptoms"),
      txt("diagnosis", "Diagnosis", { half: true }),
      txt("treatment", "Treatment", { half: true }),
      txt("medication", "Medication", { half: true }),
      txt("dosage", "Dosage", { half: true }),
      txt("veterinarian", "Veterinarian", { half: true }),
      date("startDate", "Treatment start", { half: true }),
      date("endDate", "Treatment end", { half: true }),
      num("withdrawalDays", "Withdrawal period (days)", { half: true }),
      sel("recovery", "Recovery status", ["Ongoing", "Recovered", "Chronic", "Died"], { def: "Ongoing", half: true }),
      area("notes", "Notes"),
    ],
    columns: ["date", "animalId", "condition", "treatment", "medication", "veterinarian", "recovery"],
    derived: [{ key: "withdrawalUntil", label: "Withdrawal ends", kind: "date", value: (r) => (r.withdrawalDays && (r.endDate || r.date) ? addDays(r.endDate || r.date, toNum(r.withdrawalDays)) : "") }],
    derivedColumns: ["withdrawalUntil"], search: ["condition", "diagnosis", "medication"], filter: { key: "recovery", label: "Recovery" }, sort: byDateDesc("date"),
  },
  vaccinations: {
    collection: "vaccinations", title: "Vaccinations", singular: "vaccination",
    help: "Choose “All active animals” to vaccinate the whole herd in one entry.",
    fields: [
      animalRef("animalId", "Animal", { allowAll: true }),
      txt("vaccine", "Vaccine", { required: true, half: true }),
      date("date", "Date administered", { half: true, def: today }),
      date("nextDate", "Next vaccination date", { half: true }),
      txt("batch", "Batch number", { half: true }),
      txt("veterinarian", "Veterinarian", { half: true }),
      money("cost", "Cost", { half: true }),
    ],
    columns: ["date", "animalId", "vaccine", "nextDate", "batch", "veterinarian", "cost"], search: ["vaccine", "batch"], sort: byDateDesc("date"),
  },
  diseases: {
    collection: "diseases", title: "Disease records", singular: "disease record",
    fields: [
      txt("disease", "Disease", { required: true, half: true }), animalRef(),
      date("dateDetected", "Date detected", { half: true, def: today }),
      txt("diagnosis", "Diagnosis", { half: true }),
      area("symptoms", "Symptoms"),
      txt("treatment", "Treatment", { half: true }),
      sel("outcome", "Outcome", ["Under treatment", "Recovered", "Chronic", "Died", "Culled"], { half: true }),
      sel("isolation", "Isolated?", ["No", "Yes"], { half: true }),
    ],
    columns: ["dateDetected", "disease", "animalId", "treatment", "outcome", "isolation"], search: ["disease"], sort: byDateDesc("dateDetected"),
  },
  quarantine: {
    collection: "quarantine", title: "Quarantine", singular: "quarantine record",
    help: "Saving a record puts the animal in Quarantined status. Mark it released to return it to Active.",
    fields: [
      animalRef(), txt("reason", "Reason", { required: true, half: true }),
      date("startDate", "Start date", { half: true, def: today }), date("expectedRelease", "Expected release date", { half: true }),
      txt("healthStatus", "Health status", { half: true }), txt("treatments", "Treatments", { half: true }),
      area("vetNotes", "Veterinary notes"),
      sel("released", "Released?", ["No", "Yes"], { def: "No", half: true }),
    ],
    columns: ["startDate", "animalId", "reason", "expectedRelease", "healthStatus", "released"], filter: { key: "released", label: "Released" }, sort: byDateDesc("startDate"),
  },
  appointments: {
    collection: "appointments", title: "Vet appointments", singular: "appointment",
    fields: [
      date("date", "Date", { required: true, half: true, def: today }), txt("veterinarian", "Veterinarian", { half: true }),
      ref("animalId", "Animal (optional)", "animals", { half: true }), txt("reason", "Reason", { required: true, half: true }),
      sel("status", "Status", ["Scheduled", "Completed", "Cancelled"], { def: "Scheduled", half: true }),
    ],
    columns: ["date", "veterinarian", "animalId", "reason", "status"], filter: { key: "status", label: "Status" }, sort: byDateDesc("date"),
  },
  feed: {
    collection: "feed", title: "Feed inventory", singular: "feed item",
    help: "Available = purchased − used. Log usage on the “Feed use” tab and stock updates itself.",
    fields: [
      sel("feedType", "Feed type", FEED_TYPES, { required: true, half: true }),
      txt("name", "Feed name", { required: true, half: true }),
      txt("supplier", "Supplier", { half: true }),
      num("qtyPurchased", "Quantity purchased", { required: true, half: true }),
      sel("unit", "Unit", UNITS, { def: "kg", half: true }),
      money("costPerUnit", "Cost per unit", { half: true }),
      date("purchaseDate", "Purchase date", { half: true, def: today }),
      date("expiryDate", "Expiry date", { half: true }),
      txt("storage", "Storage location", { half: true }),
      num("minStock", "Low-stock level", { half: true, help: "You’ll get an alert when stock falls to this level." }),
    ],
    columns: ["feedType", "name", "supplier", "qtyPurchased", "unit", "costPerUnit", "expiryDate", "storage"],
    derived: [
      { key: "used", label: "Used", kind: "number", value: (r, c) => sum(c.rows("feedUsage").filter((u) => u.feedId === r.id), "quantity") },
      { key: "available", label: "Available", kind: "number", value: (r, c) => feedAvailable(toNum(r.qtyPurchased), sum(c.rows("feedUsage").filter((u) => u.feedId === r.id), "quantity")) },
    ],
    derivedColumns: ["used", "available"], search: ["name", "supplier"], filter: { key: "feedType", label: "Type" },
  },
  feedUsage: {
    collection: "feedUsage", title: "Feed use", singular: "feed use record",
    fields: [
      ref("feedId", "Feed", "feed", { required: true }),
      num("quantity", "Quantity used", { required: true, half: true }),
      date("date", "Date", { half: true, def: today }),
      txt("target", "Fed to (herd / pasture / pen)", { half: true }), txt("notes", "Notes", { half: true }),
    ],
    columns: ["date", "feedId", "quantity", "target", "notes"], sort: byDateDesc("date"),
  },
  feedlot: {
    collection: "feedlot", title: "Feedlot", singular: "feedlot animal",
    fields: [
      txt("feedlotId", "Feedlot / pen ID", { required: true, half: true }), animalRef(),
      date("entryDate", "Entry date", { half: true, def: today }),
      num("startWeight", "Starting weight (kg)", { required: true, half: true }),
      num("currentWeight", "Current weight (kg)", { half: true }),
      num("targetWeight", "Target weight (kg)", { half: true }),
      txt("ration", "Feed ration", { half: true }),
      num("dailyIntakeKg", "Daily feed intake (kg)", { half: true }),
      money("feedCostPerKg", "Feed cost per kg", { half: true }),
      money("salePricePerKg", "Expected sale price per kg", { half: true }),
    ],
    columns: ["feedlotId", "animalId", "entryDate", "startWeight", "currentWeight", "targetWeight"],
    derived: [
      { key: "days", label: "Days on feed", kind: "number", value: (r) => feedlotMetrics(r).daysOnFeed },
      { key: "adg", label: "ADG (kg/day)", kind: "number", value: (r) => feedlotMetrics(r).adg },
      { key: "feedCost", label: "Feed cost", kind: "money", value: (r) => feedlotMetrics(r).feedCost },
      { key: "finish", label: "Est. finish", kind: "date", value: (r) => feedlotMetrics(r).finishingDate },
      { key: "saleValue", label: "Est. sale value", kind: "money", value: (r) => feedlotMetrics(r).salePrice },
    ],
    derivedColumns: ["days", "adg", "feedCost", "finish", "saleValue"], search: ["feedlotId", "ration"], filter: { key: "feedlotId", label: "Pen" },
  },
  purchases: {
    collection: "purchases", title: "Cattle purchases", singular: "purchase",
    help: "Saving a new purchase adds the animal to the herd registry and books the cost as an expense.",
    fields: [
      date("date", "Purchase date", { required: true, half: true, def: today }), txt("seller", "Seller", { half: true }),
      txt("tag", "Animal ID / tag", { required: true, half: true }),
      sel("breed", "Breed", CATTLE_BREEDS, { half: true }),
      sel("category", "Type", CATEGORIES, { required: true, half: true }),
      sel("sex", "Sex", ["Female", "Male"], { required: true, half: true }),
      num("ageMonths", "Age (months)", { half: true }), num("weight", "Weight (kg)", { half: true }),
      money("price", "Purchase price", { required: true, half: true }),
      money("transport", "Transport cost", { half: true }), money("vetCost", "Vet inspection cost", { half: true }),
      money("otherCost", "Other costs", { half: true }), txt("location", "Location purchased", { half: true }),
      area("notes", "Notes"),
    ],
    columns: ["date", "tag", "seller", "breed", "weight", "price"],
    derived: [
      { key: "perKg", label: "Cost per kg", kind: "money", value: (r) => (toNum(r.weight) > 0 ? round(toNum(r.price) / toNum(r.weight)) : 0) },
      { key: "total", label: "Total acquisition cost", kind: "money", value: (r) => acquisitionTotal(toNum(r.price), toNum(r.transport), toNum(r.vetCost), toNum(r.otherCost)) },
    ],
    derivedColumns: ["perKg", "total"], search: ["tag", "seller", "breed"], sort: byDateDesc("date"),
  },
  sales: {
    collection: "sales", title: "Cattle sales", singular: "sale",
    help: "Saving a new sale marks the animal Sold and books the net amount as income.",
    fields: [
      date("date", "Sale date", { required: true, half: true, def: today }), animalRef("animalId", "Animal", { half: true }),
      txt("buyer", "Buyer", { half: true }), num("weight", "Animal weight (kg)", { half: true }),
      money("price", "Selling price", { required: true, half: true }),
      money("transport", "Transport cost", { half: true }), money("commission", "Commission", { half: true }),
      money("otherCost", "Other expenses", { half: true }), area("notes", "Notes"),
    ],
    columns: ["date", "animalId", "buyer", "weight", "price"],
    derived: [
      { key: "perKg", label: "Price per kg", kind: "money", value: (r) => (toNum(r.weight) > 0 ? round(toNum(r.price) / toNum(r.weight)) : 0) },
      { key: "net", label: "Net sale value", kind: "money", value: (r) => netSaleRevenue(toNum(r.price), toNum(r.transport), toNum(r.commission), toNum(r.otherCost)) },
      { key: "profit", label: "Profit / loss", kind: "money", value: (r, c) => animalProfit(netSaleRevenue(toNum(r.price), toNum(r.transport), toNum(r.commission), toNum(r.otherCost)), r.costBasis != null ? toNum(r.costBasis) : animalCost(c.rows("animals").find((a) => a.id === r.animalId) ?? {} as Row, c)) },
    ],
    derivedColumns: ["perKg", "net", "profit"], search: ["buyer"], sort: byDateDesc("date"),
  },
  breeding: {
    collection: "breeding", title: "Breeding", singular: "breeding record",
    fields: [
      ref("cowId", "Cow", "animals", { required: true, half: true }), ref("bullId", "Bull (if natural)", "animals", { half: true }),
      date("matingDate", "Mating date", { required: true, half: true, def: today }),
      sel("method", "Breeding method", ["Natural", "Artificial insemination"], { def: "Natural", half: true }),
      txt("semen", "AI semen / sire details", { half: true }),
      sel("pregnancyStatus", "Pregnancy status", ["Pending check", "Pregnant", "Not pregnant", "Calved"], { def: "Pending check", half: true }),
      date("expectedCalvingDate", "Expected calving date", { half: true, help: "Leave blank to use mating date + 283 days." }),
      date("actualCalvingDate", "Actual calving date", { half: true }),
      txt("calfTag", "Calf ID", { half: true, help: "Filling calving date + calf ID creates the birth record and adds the calf to the herd." }),
      num("birthWeight", "Birth weight (kg)", { half: true }),
      sel("calfSex", "Calf sex", ["Female", "Male"], { half: true }),
      txt("complications", "Birth complications"),
    ],
    columns: ["matingDate", "cowId", "bullId", "method", "pregnancyStatus", "actualCalvingDate"],
    derived: [
      { key: "expected", label: "Expected calving", kind: "date", value: (r) => r.expectedCalvingDate || (r.matingDate ? addDays(r.matingDate, 283) : "") },
      { key: "check", label: "Pregnancy check due", kind: "date", value: (r) => (r.matingDate ? addDays(r.matingDate, 60) : "") },
    ],
    derivedColumns: ["expected", "check"], filter: { key: "pregnancyStatus", label: "Status" }, sort: byDateDesc("matingDate"),
  },
  births: {
    collection: "births", title: "Births & calves", singular: "birth",
    help: "Saving a new birth adds the calf to the herd automatically.",
    fields: [
      txt("calfTag", "Calf ID / tag", { required: true, half: true }), txt("name", "Name", { half: true }),
      ref("motherId", "Mother", "animals", { required: true, half: true }), ref("fatherId", "Father (bull)", "animals", { half: true }),
      date("birthDate", "Birth date", { required: true, half: true, def: today }),
      num("birthWeight", "Birth weight (kg)", { half: true }),
      sel("sex", "Sex", ["Female", "Male"], { required: true, half: true }), sel("breed", "Breed", CATTLE_BREEDS, { half: true }),
      txt("complications", "Birth complications", { half: true }), sel("healthStatus", "Health status", ["Healthy", "Weak", "Under treatment"], { def: "Healthy", half: true }),
      date("weaningDate", "Weaning date", { half: true }), num("weaningWeight", "Weaning weight (kg)", { half: true }),
    ],
    columns: ["birthDate", "calfTag", "motherId", "fatherId", "sex", "birthWeight", "healthStatus", "weaningDate"],
    search: ["calfTag", "name"], sort: byDateDesc("birthDate"),
  },
  mortality: {
    collection: "mortality", title: "Mortality", singular: "mortality record",
    help: "Saving a record marks the animal Deceased.",
    fields: [
      animalRef(), date("date", "Date of death", { required: true, half: true, def: today }),
      txt("cause", "Cause of death", { required: true, half: true }), txt("location", "Location", { half: true }),
      money("loss", "Estimated financial loss", { half: true }), area("vetFindings", "Veterinary findings"), area("notes", "Notes"),
    ],
    columns: ["date", "animalId", "cause", "location", "loss"],
    derived: [{ key: "ageAtDeath", label: "Age", kind: "text", value: (r, c) => { const a = c.rows("animals").find((x) => x.id === r.animalId); return a?.dob ? ageLabel(a.dob, r.date) : "–"; } }],
    derivedColumns: ["ageAtDeath"], search: ["cause"], sort: byDateDesc("date"),
  },

  /* ===== Finance ===== */
  income: {
    collection: "income", title: "Income", singular: "income",
    fields: [
      date("date", "Date", { required: true, half: true, def: today }), sel("category", "Category", INCOME_CATEGORIES, { required: true, half: true }),
      txt("description", "Description", { required: true }), money("amount", "Amount", { required: true, half: true }),
      sel("paymentMethod", "Payment method", PAYMENT_METHODS, { half: true }), ref("customerId", "Customer", "customers", { half: true }),
      sel("paymentStatus", "Payment status", ["Paid", "Outstanding"], { def: "Paid", half: true }), date("dueDate", "Payment due date", { half: true }),
      ...financeTags,
    ],
    columns: ["date", "category", "description", "amount", "customerId", "paymentStatus", "section"],
    search: ["description", "category"], filter: { key: "category", label: "Category" }, sort: byDateDesc("date"),
  },
  expenses: {
    collection: "expenses", title: "Expenses", singular: "expense",
    fields: [
      date("date", "Date", { required: true, half: true, def: today }), sel("category", "Category", EXPENSE_CATEGORIES, { required: true, half: true }),
      txt("description", "Description", { required: true }), money("amount", "Amount", { required: true, half: true }),
      sel("paymentMethod", "Payment method", PAYMENT_METHODS, { half: true }), ref("supplierId", "Supplier", "suppliers", { half: true }),
      sel("paymentStatus", "Payment status", ["Paid", "Outstanding"], { def: "Paid", half: true }), date("dueDate", "Payment due date", { half: true }),
      ...financeTags,
    ],
    columns: ["date", "category", "description", "amount", "supplierId", "paymentStatus", "section"],
    search: ["description", "category"], filter: { key: "category", label: "Category" }, sort: byDateDesc("date"),
  },
  budgets: {
    collection: "budgets", title: "Budgets", singular: "budget",
    help: "Set a monthly budget per expense category to see budget vs actual in Reports.",
    fields: [sel("category", "Expense category", EXPENSE_CATEGORIES, { required: true, half: true }), txt("month", "Month (YYYY-MM)", { required: true, half: true, def: () => todayISO().slice(0, 7) }), money("amount", "Budget amount", { required: true })],
    columns: ["month", "category", "amount"], sort: byDateDesc("month"),
  },
  suppliers: {
    collection: "suppliers", title: "Suppliers", singular: "supplier",
    fields: [txt("name", "Name", { required: true }), txt("phone", "Phone", { half: true }), txt("email", "Email", { half: true }), txt("address", "Address"), area("notes", "Notes")],
    columns: ["name", "phone", "email", "address"], search: ["name"],
  },
  customers: {
    collection: "customers", title: "Customers", singular: "customer",
    fields: [txt("name", "Name", { required: true }), txt("phone", "Phone", { half: true }), txt("email", "Email", { half: true }), txt("address", "Address"), area("notes", "Notes")],
    columns: ["name", "phone", "email", "address"], search: ["name"],
  },

  /* ===== Employees ===== */
  employees: {
    collection: "employees", title: "Employees", singular: "employee",
    fields: [
      txt("empNo", "Employee ID", { half: true }), txt("name", "Full name", { required: true, half: true }),
      txt("position", "Position", { half: true }), sel("department", "Department", ["Crops", "Livestock", "Feedlot", "Workshop", "Office", "General"], { half: true }),
      txt("phone", "Phone", { half: true }), txt("email", "Email", { half: true }),
      date("hireDate", "Employment date", { half: true }), money("salary", "Salary / wage", { half: true }),
      sel("payFrequency", "Payment frequency", ["Weekly", "Fortnightly", "Monthly", "Daily"], { def: "Monthly", half: true }),
      txt("workLocation", "Work location", { half: true }), txt("emergencyContact", "Emergency contact"),
      sel("status", "Status", ["Active", "On leave", "Suspended", "Left"], { def: "Active", half: true }),
    ],
    columns: ["empNo", "name", "position", "department", "phone", "salary", "payFrequency", "status"],
    search: ["name", "position", "empNo"], filter: { key: "department", label: "Department" },
  },
  attendance: {
    collection: "attendance", title: "Attendance & leave", singular: "attendance record",
    fields: [
      ref("employeeId", "Employee", "employees", { required: true }), date("date", "Date", { half: true, def: today }),
      sel("status", "Status", ["Present", "Absent", "Late", "Leave", "Sick"], { def: "Present", half: true }),
      num("hours", "Hours worked", { half: true, def: 8 }), txt("notes", "Notes", { half: true }),
    ],
    columns: ["date", "employeeId", "status", "hours", "notes"], filter: { key: "status", label: "Status" }, sort: byDateDesc("date"),
  },
  performance: {
    collection: "performance", title: "Performance", singular: "review",
    fields: [
      ref("employeeId", "Employee", "employees", { required: true }), date("date", "Date", { half: true, def: today }),
      sel("rating", "Rating", ["5 – Excellent", "4 – Good", "3 – Satisfactory", "2 – Needs improvement", "1 – Poor"], { half: true }),
      area("notes", "Notes"),
    ],
    columns: ["date", "employeeId", "rating", "notes"], sort: byDateDesc("date"),
  },
  payroll: {
    collection: "payroll", title: "Salary payments", singular: "salary payment",
    help: "Each payment is also booked as a Labour expense.",
    fields: [
      ref("employeeId", "Employee", "employees", { required: true }), date("date", "Payment date", { half: true, def: today }),
      money("amount", "Amount", { required: true, half: true }), txt("period", "Pay period", { half: true, placeholder: "e.g. March 2026" }),
      sel("paymentMethod", "Payment method", PAYMENT_METHODS, { half: true }),
    ],
    columns: ["date", "employeeId", "period", "amount", "paymentMethod"], sort: byDateDesc("date"),
  },
  tasks: {
    collection: "tasks", title: "Tasks", singular: "task",
    fields: [
      txt("name", "Task name", { required: true }), area("description", "Description"),
      ref("employeeId", "Assigned employee", "employees", { half: true }), sel("section", "Farm section", FARM_SECTIONS, { half: true, def: "General" }),
      sel("priority", "Priority", PRIORITIES, { def: "Medium", half: true }), sel("status", "Status", TASK_STATUS, { def: "To do", half: true }),
      date("startDate", "Start date", { half: true, def: today }), date("dueDate", "Due date", { half: true, def: today }), area("notes", "Notes"),
    ],
    columns: ["name", "employeeId", "section", "priority", "dueDate", "status"],
    search: ["name", "description"], filter: { key: "status", label: "Status" }, sort: (a, b) => String(a.dueDate).localeCompare(String(b.dueDate)),
  },

  /* ===== Inventory, documents, map ===== */
  inventory: {
    collection: "inventory", title: "Inventory", singular: "inventory item",
    help: "Everything else on the farm besides feed. Items at or below their minimum level raise a low-stock alert.",
    fields: [
      sel("category", "Category", INVENTORY_CATEGORIES, { required: true, half: true }), txt("name", "Item name", { required: true, half: true }),
      num("quantity", "Quantity", { required: true, half: true }), sel("unit", "Unit", UNITS, { def: "units", half: true }),
      money("price", "Purchase price (per unit)", { half: true }), ref("supplierId", "Supplier", "suppliers", { half: true }),
      txt("storage", "Storage location", { half: true }), date("expiry", "Expiry date", { half: true }),
      num("minStock", "Minimum stock level", { half: true }), date("nextService", "Next service (equipment)", { half: true }),
    ],
    columns: ["category", "name", "quantity", "unit", "minStock", "storage", "expiry"],
    derived: [{ key: "value", label: "Value", kind: "money", value: (r) => round(toNum(r.quantity) * toNum(r.price)) }],
    derivedColumns: ["value"], search: ["name", "storage"], filter: { key: "category", label: "Category" },
  },
  documents: {
    collection: "documents", title: "Documents", singular: "document",
    fields: [
      txt("title", "Title", { required: true }), sel("category", "Category", ["Registration", "Contract", "Permit / licence", "Veterinary", "Receipt", "Insurance", "Employee", "Other"], { half: true }),
      txt("relatedTo", "Related to", { half: true, placeholder: "Animal, employee, field…" }), date("expiry", "Expiry date", { half: true }),
      file("file", "File"), area("notes", "Notes"),
    ],
    columns: ["title", "category", "relatedTo", "expiry", "file"], search: ["title", "relatedTo"], filter: { key: "category", label: "Category" },
  },
  mapItems: {
    collection: "mapItems", title: "Map features", singular: "map feature",
    fields: [
      sel("type", "Type", MAP_TYPES, { required: true, half: true }), txt("name", "Name", { required: true, half: true }),
      txt("gps", "GPS location", { required: true, placeholder: "-20.1500, 28.5800", help: "Latitude, longitude. On your phone, use “Use my location”." }), area("notes", "Notes"),
    ],
    columns: ["type", "name", "gps", "notes"], search: ["name"], filter: { key: "type", label: "Type" },
  },
};

export const parseGps = (gps?: string): [number, number] | null => {
  if (!gps) return null;
  const m = gps.match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
};

export const adgOf = (gain: number, days: number) => averageDailyGain(gain, days);
export { daysBetween };
