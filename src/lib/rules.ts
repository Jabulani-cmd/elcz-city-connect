import { acquisitionTotal, addDays, animalProfit, averageDailyGain, daysBetween, netSaleRevenue, round, toNum, todayISO } from "./calc";
import { animalCost } from "./schema";
import { getState, remove, rowsOf, upsert } from "./store";
import type { Row } from "./types";

export const ALL_ANIMALS = "__ALL__";
const find = (collection: string, id?: string) => (id ? rowsOf(collection).find((r) => r.id === id) : undefined);
const activeAnimals = () => rowsOf("animals").filter((a) => a.status === "Active" || a.status === "Quarantined");

/** Recompute previous weight / gain / ADG for every record of one animal, and refresh its current weight. */
export function recomputeWeights(animalId: string) {
  const list = rowsOf("weights").filter((w) => w.animalId === animalId).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  let prev: Row | undefined;
  for (const w of list) {
    const previousWeight = prev ? toNum(prev.weight) : 0;
    const difference = prev ? round(toNum(w.weight) - previousWeight) : 0;
    const days = prev ? daysBetween(prev.date, w.date) : 0;
    const adg = prev ? averageDailyGain(difference, days) : 0;
    if (w.previousWeight !== (prev ? previousWeight : "") || w.difference !== difference || w.adg !== adg) {
      upsert("weights", { id: w.id, previousWeight: prev ? previousWeight : "", difference, adg, days });
    }
    prev = w;
  }
  const animal = find("animals", animalId);
  if (animal && list.length) upsert("animals", { id: animalId, currentWeight: toNum(list[list.length - 1].weight) });
}

function requireUniqueTag(tag: string, ownId?: string) {
  const t = String(tag ?? "").trim().toLowerCase();
  if (!t) throw new Error("Animal ID / tag is required");
  if (rowsOf("animals").some((a) => a.id !== ownId && String(a.tag).trim().toLowerCase() === t)) throw new Error(`An animal with ID “${tag}” already exists`);
}

function setAnimalStatus(animalId: string | undefined, status: string, extra: Partial<Row> = {}) {
  if (animalId && find("animals", animalId)) upsert("animals", { id: animalId, status, ...extra });
}

/** Create or update the finance row linked to another record (keeps income/expenses in step with sales, purchases, payroll). */
function linkedFinance(collection: "income" | "expenses", linkKey: string, linkId: string, values: Partial<Row>): string {
  const existing = rowsOf(collection).find((r) => r[linkKey] === linkId);
  return upsert(collection, existing ? { id: existing.id, ...values } : { ...values, [linkKey]: linkId, paymentStatus: "Paid" }).id;
}
const unlinkFinance = (collection: "income" | "expenses", linkKey: string, linkId: string) =>
  rowsOf(collection).filter((r) => r[linkKey] === linkId).forEach((r) => remove(collection, r.id));

export function saveRecord(collection: string, values: Partial<Row>): Row {
  const isNew = !values.id;
  const prev = values.id ? rowsOf(collection).find((r) => r.id === values.id) : undefined;

  /* validation + pre-processing */
  if (collection === "animals") requireUniqueTag(values.tag as string, values.id);
  if (collection === "purchases" && isNew) requireUniqueTag(values.tag as string);
  if (collection === "births" && isNew) requireUniqueTag(values.calfTag as string);

  if (collection === "vaccinations" && values.animalId === ALL_ANIMALS) {
    const targets = activeAnimals();
    if (!targets.length) throw new Error("There are no active animals to vaccinate");
    targets.forEach((a) => upsert("vaccinations", { ...values, animalId: a.id }));
    return rowsOf("vaccinations")[0];
  }

  if (collection === "sales") {
    const animal = find("animals", values.animalId as string);
    if (!animal) throw new Error("Choose the animal being sold");
    if (isNew && animal.status === "Sold") throw new Error("This animal is already marked as sold");
    if (isNew) values = { ...values, costBasis: round(animalCost(animal, { rows: rowsOf })) };
    if (isNew && !values.weight && animal.currentWeight) values = { ...values, weight: animal.currentWeight };
  }
  if (collection === "mortality" && isNew) {
    const animal = find("animals", values.animalId as string);
    if (animal && (values.loss === undefined || values.loss === "")) values = { ...values, loss: toNum(animal.estimatedValue) };
  }
  if (collection === "feedlot" && isNew && !values.currentWeight) values = { ...values, currentWeight: values.startWeight };
  if (collection === "health" && values.recovery === "Died") { /* kept as history; mortality is recorded separately */ }

  const row = upsert(collection, values);

  /* post-save effects */
  switch (collection) {
    case "weights": {
      recomputeWeights(row.animalId);
      if (prev && prev.animalId !== row.animalId) recomputeWeights(prev.animalId);
      const feedlotRow = rowsOf("feedlot").find((f) => f.animalId === row.animalId);
      const latest = find("animals", row.animalId)?.currentWeight;
      if (feedlotRow && latest) upsert("feedlot", { id: feedlotRow.id, currentWeight: latest });
      break;
    }
    case "purchases": {
      const total = acquisitionTotal(toNum(row.price), toNum(row.transport), toNum(row.vetCost), toNum(row.otherCost));
      if (isNew) {
        const dob = row.ageMonths ? addDays(row.date, -Math.round(toNum(row.ageMonths) * 30.4)) : "";
        const animal = upsert("animals", {
          tag: row.tag, species: "Cattle", breed: row.breed, category: row.category, sex: row.sex, dob, status: "Active",
          purchaseDate: row.date, purchasePrice: toNum(row.price), acquisitionCost: total, estimatedValue: toNum(row.price),
          currentWeight: toNum(row.weight), location: row.location, purchaseId: row.id,
        });
        if (toNum(row.weight) > 0) upsert("weights", { animalId: animal.id, date: row.date, weight: toNum(row.weight), location: row.location || "At purchase", previousWeight: "", difference: 0, adg: 0 });
        upsert("purchases", { id: row.id, animalId: animal.id });
      } else if (row.animalId) {
        upsert("animals", { id: row.animalId, purchasePrice: toNum(row.price), acquisitionCost: total, purchaseDate: row.date });
      }
      linkedFinance("expenses", "purchaseId", row.id, { date: row.date, category: "Livestock purchase", description: `Purchase of ${row.tag}${row.seller ? ` from ${row.seller}` : ""}`, amount: total, section: "Livestock", supplierId: undefined });
      break;
    }
    case "sales": {
      const net = netSaleRevenue(toNum(row.price), toNum(row.transport), toNum(row.commission), toNum(row.otherCost));
      setAnimalStatus(row.animalId, "Sold", { soldDate: row.date, pastureId: "" });
      const animal = find("animals", row.animalId);
      linkedFinance("income", "saleId", row.id, { date: row.date, category: "Livestock sales", description: `Sale of ${animal?.tag ?? "animal"}${row.buyer ? ` to ${row.buyer}` : ""}`, amount: net, section: "Livestock", animalId: row.animalId });
      break;
    }
    case "births": {
      if (isNew) {
        const mother = find("animals", row.motherId);
        const father = find("animals", row.fatherId);
        const calf = upsert("animals", {
          tag: row.calfTag, name: row.name, species: mother?.species ?? "Cattle", breed: row.breed || mother?.breed, category: "Calf", sex: row.sex,
          dob: row.birthDate, status: "Active", damId: mother?.tag, sireId: father?.tag, pastureId: mother?.pastureId, herd: mother?.herd,
          currentWeight: toNum(row.birthWeight), birthId: row.id,
        });
        if (toNum(row.birthWeight) > 0) upsert("weights", { animalId: calf.id, date: row.birthDate, weight: toNum(row.birthWeight), location: "Birth", previousWeight: "", difference: 0, adg: 0 });
        upsert("births", { id: row.id, calfId: calf.id });
        const pending = rowsOf("breeding").find((b) => b.cowId === row.motherId && b.pregnancyStatus !== "Calved" && b.pregnancyStatus !== "Not pregnant");
        if (pending) upsert("breeding", { id: pending.id, pregnancyStatus: "Calved", actualCalvingDate: row.birthDate, calfTag: row.calfTag, birthWeight: row.birthWeight, calfSex: row.sex, birthId: row.id });
      } else if (row.calfId) {
        upsert("animals", { id: row.calfId, name: row.name, sex: row.sex, dob: row.birthDate, breed: row.breed });
        if (toNum(row.weaningWeight) > 0 && row.weaningDate) {
          const existing = rowsOf("weights").find((w) => w.animalId === row.calfId && w.date === row.weaningDate);
          if (!existing) saveRecord("weights", { animalId: row.calfId, date: row.weaningDate, weight: toNum(row.weaningWeight), location: "Weaning" });
        }
      }
      break;
    }
    case "breeding": {
      if (row.actualCalvingDate && row.calfTag && !row.birthId) {
        const birth = saveRecord("births", { calfTag: row.calfTag, motherId: row.cowId, fatherId: row.bullId, birthDate: row.actualCalvingDate, birthWeight: row.birthWeight, sex: row.calfSex || "Female", complications: row.complications, healthStatus: "Healthy" });
        upsert("breeding", { id: row.id, pregnancyStatus: "Calved", birthId: birth.id });
      }
      if (row.pregnancyStatus === "Pregnant" || row.pregnancyStatus === "Pending check") {
        if (row.cowId) upsert("animals", { id: row.cowId, breedingAnimal: "Yes" });
      }
      break;
    }
    case "mortality":
      setAnimalStatus(row.animalId, "Deceased", { deathDate: row.date, pastureId: "" });
      break;
    case "quarantine":
      setAnimalStatus(row.animalId, row.released === "Yes" ? "Active" : "Quarantined");
      break;
    case "payroll": {
      const emp = find("employees", row.employeeId);
      linkedFinance("expenses", "payrollId", row.id, { date: row.date, category: "Labour", description: `Salary – ${emp?.name ?? "employee"}${row.period ? ` (${row.period})` : ""}`, amount: toNum(row.amount), paymentMethod: row.paymentMethod, section: "Employees" });
      break;
    }
    case "harvests": {
      const crop = find("crops", row.cropId);
      if (crop && !crop.actualHarvestDate) upsert("crops", { id: crop.id, actualHarvestDate: row.harvestDate, actualYield: toNum(row.quantity), sellingPrice: toNum(row.sellingPrice) || crop.sellingPrice });
      if (toNum(row.quantitySold) > 0 && toNum(row.sellingPrice) > 0) {
        linkedFinance("income", "harvestId", row.id, { date: row.harvestDate, category: "Crop sales", description: `Sale of ${crop?.cropName ?? "crop"} (${row.quantitySold} t)`, amount: round(toNum(row.quantitySold) * toNum(row.sellingPrice)), section: "Agriculture", cropId: row.cropId, fieldId: crop?.fieldId });
      }
      break;
    }
    case "feedlot": {
      if (isNew) {
        const a = find("animals", row.animalId);
        if (a) upsert("animals", { id: a.id, herd: a.herd || `Feedlot ${row.feedlotId}` });
      }
      break;
    }
    default:
  }
  return row;
}

export function deleteRecord(collection: string, id: string) {
  const row = rowsOf(collection).find((r) => r.id === id);
  if (!row) return;
  remove(collection, id);
  switch (collection) {
    case "weights":
      recomputeWeights(row.animalId);
      break;
    case "sales":
      unlinkFinance("income", "saleId", id);
      if (find("animals", row.animalId)?.status === "Sold") setAnimalStatus(row.animalId, "Active", { soldDate: "" });
      break;
    case "mortality":
      if (find("animals", row.animalId)?.status === "Deceased") setAnimalStatus(row.animalId, "Active", { deathDate: "" });
      break;
    case "purchases":
      unlinkFinance("expenses", "purchaseId", id);
      break;
    case "payroll":
      unlinkFinance("expenses", "payrollId", id);
      break;
    case "harvests":
      unlinkFinance("income", "harvestId", id);
      break;
    case "quarantine":
      if (row.released !== "Yes" && find("animals", row.animalId)?.status === "Quarantined") setAnimalStatus(row.animalId, "Active");
      break;
    case "animals": {
      for (const c of ["weights", "health", "vaccinations", "diseases", "quarantine", "grazing", "feedlot"]) {
        rowsOf(c).filter((r) => r.animalId === id).forEach((r) => remove(c, r.id));
      }
      break;
    }
    default:
  }
}

/** Move animals to a pasture, closing their previous grazing record and updating pasture dates. */
export function moveAnimals(animalIds: string[], toPastureId: string, date = todayISO()): string[] {
  const warnings: string[] = [];
  const to = find("pastures", toPastureId);
  if (!to) throw new Error("Choose a destination pasture");
  const leaving = new Set<string>();
  for (const id of animalIds) {
    const a = find("animals", id);
    if (!a) continue;
    if (a.pastureId && a.pastureId !== toPastureId) leaving.add(a.pastureId);
    rowsOf("grazing").filter((g) => g.animalId === id && !g.endDate).forEach((g) => upsert("grazing", { id: g.id, endDate: date }));
    upsert("grazing", { animalId: id, pastureId: toPastureId, startDate: date, endDate: "" });
    upsert("animals", { id, pastureId: toPastureId });
  }
  const current = rowsOf("animals").filter((a) => a.pastureId === toPastureId && (a.status === "Active" || a.status === "Quarantined")).length;
  const rested = to.grazingEnd ? daysBetween(to.grazingEnd, date) : null;
  const wasEmpty = current === animalIds.length;
  upsert("pastures", { id: to.id, ...(wasEmpty ? { grazingStart: date, grazingEnd: "", lastRestActual: rested ?? "" } : {}) });
  if (toNum(to.capacity) > 0 && current > toNum(to.capacity)) warnings.push(`${to.name} is now overstocked (${current} animals, capacity ${to.capacity}).`);
  if (wasEmpty && rested !== null && toNum(to.restDays) > rested) warnings.push(`${to.name} has only rested ${rested} of ${to.restDays} days.`);
  if (to.water === "Unavailable") warnings.push(`${to.name} has no water available.`);
  for (const pid of leaving) {
    const still = rowsOf("animals").some((a) => a.pastureId === pid && (a.status === "Active" || a.status === "Quarantined"));
    if (!still) upsert("pastures", { id: pid, grazingEnd: date });
  }
  return warnings;
}

export const animalLabelById = (id?: string) => (id ? find("animals", id)?.tag ?? "" : "");
export const profitOfSale = (s: Row) => animalProfit(netSaleRevenue(toNum(s.price), toNum(s.transport), toNum(s.commission), toNum(s.otherCost)), toNum(s.costBasis));
export const farmId = () => getState().activeFarmId;
