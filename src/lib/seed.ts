import { addDays, averageDailyGain, daysBetween, round, todayISO } from "./calc";
import type { Farm, Row, Values } from "./types";
import type { State } from "./store";

/** Demo farm shown on first launch so every screen has something to look at. Removable in Settings. */
export function seedDemo(base: State): State {
  const today = todayISO();
  const farmId = "demo-farm";
  const stamp = new Date().toISOString();
  let seedN = 7;
  const rnd = () => ((seedN = (seedN * 16807) % 2147483647) / 2147483647);
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const data: Record<string, Row[]> = {};
  const counters: Record<string, number> = {};
  const mk = (collection: string, v: Values): Row => {
    counters[collection] = (counters[collection] ?? 0) + 1;
    const row = { id: `demo-${collection}-${counters[collection]}`, farmId, createdAt: stamp, updatedAt: stamp, ...v } as Row;
    (data[collection] ??= []).push(row);
    return row;
  };

  const farm: Farm = {
    id: farmId, name: "Green Valley Farm (demo)", location: "Matopos, Bulawayo, Zimbabwe", latitude: "-20.4200", longitude: "28.5000",
    sizeHa: 420, farmType: "Mixed (crops & livestock)", manager: "Tendai Moyo", phone: "+263 77 000 0000", email: "office@greenvalley.example",
    registration: "REG-2019-0457", description: "Demonstration farm with sample data. Remove it in Settings when you are ready to add your own.",
    agriHa: 120, pastureHa: 260, createdAt: stamp,
  };

  /* fields & crops */
  const F = [
    mk("fields", { name: "Field A1", sizeHa: 25, gps: "-20.4150, 28.4950", soilType: "Loam", soilFertility: "High", currentCrop: "Maize", previousCrop: "Soya beans", irrigationSystem: "Centre pivot", status: "Active" }),
    mk("fields", { name: "Field A2", sizeHa: 30, gps: "-20.4130, 28.5050", soilType: "Sandy loam", soilFertility: "Medium", currentCrop: "Sorghum", previousCrop: "Maize", irrigationSystem: "Sprinkler", status: "Active" }),
    mk("fields", { name: "Field B1", sizeHa: 18, gps: "-20.4250, 28.4900", soilType: "Clay loam", soilFertility: "Medium", currentCrop: "Wheat", previousCrop: "Fallow", irrigationSystem: "Drip", status: "Active" }),
    mk("fields", { name: "Field B2", sizeHa: 12, gps: "-20.4280, 28.5000", soilType: "Sandy", soilFertility: "Low", currentCrop: "", previousCrop: "Groundnuts", irrigationSystem: "None (rain-fed)", status: "Fallow" }),
  ];
  const C = [
    mk("crops", { cropName: "Maize", variety: "SC403", fieldId: F[0].id, plantingDate: addDays(today, -95), expectedHarvestDate: addDays(today, 10), areaHa: 25, seedQty: 600, seedCost: 2400, fertilizerUsed: "Compound D + AN", pesticidesUsed: "Cypermethrin", irrigationInfo: "Pivot, weekly", expectedYield: 150, actualYield: "", productionCost: 6200, sellingPrice: 280, health: "Good" }),
    mk("crops", { cropName: "Sorghum", variety: "Macia", fieldId: F[1].id, plantingDate: addDays(today, -80), expectedHarvestDate: addDays(today, 40), areaHa: 30, seedQty: 450, seedCost: 1800, expectedYield: 90, productionCost: 4100, sellingPrice: 250, health: "Poor" }),
    mk("crops", { cropName: "Wheat", variety: "SC Nduna", fieldId: F[2].id, plantingDate: addDays(today, -60), expectedHarvestDate: addDays(today, 70), areaHa: 18, seedQty: 2200, seedCost: 3300, expectedYield: 72, productionCost: 5600, sellingPrice: 420, health: "Diseased" }),
    mk("crops", { cropName: "Soya beans", variety: "Solitaire", fieldId: F[0].id, plantingDate: addDays(today, -300), expectedHarvestDate: addDays(today, -170), actualHarvestDate: addDays(today, -168), areaHa: 25, seedCost: 2000, expectedYield: 60, actualYield: 66, productionCost: 4800, sellingPrice: 520, health: "Good" }),
  ];
  mk("plantings", { cropName: "Maize", variety: "SC403", fieldId: F[3].id, plantingDate: addDays(today, 5), expectedHarvestDate: addDays(today, 130), quantity: 300, cost: 1200, status: "Scheduled" });
  mk("fertilizer", { fertilizerType: "Compound D", quantity: 2500, fieldId: F[0].id, cropId: C[0].id, applicationDate: addDays(today, -95), method: "Banding", cost: 2750 });
  mk("fertilizer", { fertilizerType: "AN", quantity: 1500, fieldId: F[0].id, cropId: C[0].id, applicationDate: addDays(today, -50), method: "Broadcast", cost: 1650 });
  mk("protection", { kind: "Fungicide", product: "Mancozeb", fieldId: F[2].id, cropId: C[2].id, applicationDate: addDays(today, -6), quantity: 18, target: "Leaf rust", cost: 420 });
  mk("irrigation", { fieldId: F[0].id, cropId: C[0].id, date: addDays(today, -3), system: "Centre pivot", durationH: 8, waterM3: 640, source: "Dam", cost: 180, problems: "" });
  mk("irrigation", { fieldId: F[1].id, cropId: C[1].id, date: addDays(today, -2), system: "Sprinkler", durationH: 5, waterM3: 300, source: "Borehole", cost: 120, problems: "Two sprinkler heads blocked" });
  mk("harvests", { cropId: C[3].id, harvestDate: addDays(today, -168), quantity: 66, quality: "Grade A", storage: "Silo 2", quantitySold: 50, sellingPrice: 520 });

  /* pastures */
  const P = [
    mk("pastures", { code: "P1", name: "North Paddock", areaHa: 60, gps: "-20.4000, 28.5100", forage: "Rhodes grass", capacity: 45, grazingStart: addDays(today, -12), restDays: 30, lastFertilizer: addDays(today, -90), water: "Available", condition: "Good", notes: "Main breeding paddock" }),
    mk("pastures", { code: "P2", name: "River Camp", areaHa: 40, gps: "-20.4350, 28.5200", forage: "Natural veld", capacity: 20, grazingStart: addDays(today, -20), restDays: 45, water: "Available", condition: "Fair", lastRestActual: 38 }),
    mk("pastures", { code: "P3", name: "Hill Camp", areaHa: 80, gps: "-20.3900, 28.4800", forage: "Mixed veld", capacity: 40, grazingEnd: addDays(today, -15), restDays: 30, water: "Unavailable", condition: "Fair", notes: "Trough pump being repaired" }),
    mk("pastures", { code: "P4", name: "South Flats", areaHa: 50, gps: "-20.4500, 28.4850", forage: "Star grass", capacity: 8, grazingStart: addDays(today, -4), restDays: 30, water: "Available", condition: "Poor", lastRestActual: 12 }),
  ];

  /* animals */
  const breeds = ["Brahman", "Nguni", "Angus", "Bonsmara", "Tuli"];
  const plan: [string, string, number, number, number][] = [ // category, sex, count, ageMonthsMin, ageMonthsMax
    ["Bull", "Male", 2, 36, 60], ["Cow", "Female", 14, 30, 96], ["Heifer", "Female", 6, 14, 24], ["Calf", "Female", 4, 2, 8], ["Calf", "Male", 4, 2, 8], ["Steer", "Male", 6, 14, 26],
  ];
  const A: Row[] = [];
  let n = 1;
  for (const [category, sex, count, a0, a1] of plan) {
    for (let i = 0; i < count; i++, n++) {
      const age = Math.round(between(a0, a1));
      const base = category === "Bull" ? 640 : category === "Cow" ? 430 : category === "Heifer" ? 320 : category === "Steer" ? 360 : 90 + age * 18;
      const pasture = category === "Steer" ? undefined : P[n % 2 === 0 ? 0 : n % 3 === 0 ? 1 : 0];
      A.push(mk("animals", {
        tag: `ZW-${String(n).padStart(3, "0")}`, rfid: `9820000${String(1000 + n)}`, name: category === "Bull" || n % 7 === 0 ? ["Thunder", "Duke", "Daisy", "Bella", "Ruby"][n % 5] : "",
        species: "Cattle", breed: breeds[n % breeds.length], category, sex, dob: addDays(today, -age * 30), color: ["Brown", "Black", "Red", "Spotted"][n % 4],
        pastureId: pasture?.id, herd: category === "Steer" ? "Feedlot A" : category === "Calf" ? "Calves" : "Breeding herd", breedingAnimal: category === "Cow" || category === "Bull" || category === "Heifer" ? "Yes" : "No",
        purchaseDate: n % 3 === 0 ? addDays(today, -age * 30 + 200) : "", purchasePrice: n % 3 === 0 ? Math.round(base * 2.1) : "", acquisitionCost: n % 3 === 0 ? Math.round(base * 2.3) : "",
        estimatedValue: Math.round(base * 2.6), currentWeight: Math.round(base), status: "Active",
      }));
    }
  }
  A[3].status = "Quarantined"; A[3].pastureId = undefined;
  A[8].status = "Sold"; A[8].pastureId = undefined; A[8].soldDate = addDays(today, -40);
  A[9].status = "Sold"; A[9].pastureId = undefined; A[9].soldDate = addDays(today, -25);
  A[15].status = "Deceased"; A[15].pastureId = undefined; A[15].deathDate = addDays(today, -33);
  P[2].grazingEnd = addDays(today, -15);
  // overstock P2 (capacity 20) is avoided; push extras onto P4 (cap 15)
  A.filter((a) => a.status === "Active" && a.category === "Heifer").forEach((a) => (a.pastureId = P[3].id));
  A.filter((a) => a.status === "Active" && a.category === "Calf").slice(0, 4).forEach((a) => (a.pastureId = P[3].id));
  A.filter((a) => a.status === "Active" && a.category === "Steer").forEach((a) => (a.pastureId = undefined));

  /* weights: 4 readings over ~4 months per live animal */
  for (const a of A) {
    if (a.status === "Deceased") continue;
    const target = a.currentWeight;
    const rate = a.category === "Cow" || a.category === "Bull" ? between(0.1, 0.5) : between(0.5, 1.3);
    let prev: Row | undefined;
    [-120, -80, -40, -3].forEach((offset) => {
      const date = addDays(today, offset);
      const w = Math.round(target - rate * (-offset) + between(-4, 4));
      const diff = prev ? round(w - prev.weight) : "";
      const row = mk("weights", { animalId: a.id, date, weight: w, location: "Crush pen", previousWeight: prev ? prev.weight : "", difference: diff, adg: prev ? averageDailyGain(w - prev.weight, daysBetween(prev.date, date)) : 0 });
      prev = row;
    });
    a.currentWeight = prev!.weight;
  }

  /* health */
  const cow = (i: number) => A[2 + i];
  mk("vaccinations", { animalId: cow(0).id, vaccine: "Anthrax", date: addDays(today, -350), nextDate: addDays(today, 15), batch: "AN-2291", veterinarian: "Dr. Ncube", cost: 3 });
  mk("vaccinations", { animalId: cow(1).id, vaccine: "Anthrax", date: addDays(today, -365), nextDate: addDays(today, -2), batch: "AN-2291", veterinarian: "Dr. Ncube", cost: 3 });
  mk("vaccinations", { animalId: cow(2).id, vaccine: "Foot & Mouth", date: addDays(today, -170), nextDate: addDays(today, 6), batch: "FM-118", veterinarian: "Dr. Ncube", cost: 5 });
  mk("vaccinations", { animalId: cow(3).id, vaccine: "Brucellosis", date: addDays(today, -300), nextDate: addDays(today, 65), batch: "BR-77", veterinarian: "Dr. Ncube", cost: 4 });
  mk("health", { animalId: cow(4).id, date: addDays(today, -5), condition: "Lameness", symptoms: "Limping on front left leg", diagnosis: "Foot rot", treatment: "Antibiotic injection, hoof trim", medication: "Oxytetracycline", dosage: "10 ml daily x3", veterinarian: "Dr. Ncube", startDate: addDays(today, -5), endDate: addDays(today, -2), withdrawalDays: 14, recovery: "Ongoing", source: "Manual" });
  mk("health", { animalId: A[3].id, date: addDays(today, -9), condition: "Suspected tick-borne disease", symptoms: "Fever, off feed", diagnosis: "Heartwater suspected", treatment: "Isolated and treated", medication: "Tetracycline", dosage: "20 ml", veterinarian: "Dr. Ncube", recovery: "Ongoing", source: "Manual" });
  mk("quarantine", { animalId: A[3].id, reason: "Suspected tick-borne disease", startDate: addDays(today, -9), expectedRelease: addDays(today, 5), healthStatus: "Improving", treatments: "Tetracycline", vetNotes: "Re-check temperature daily", released: "No" });
  mk("appointments", { date: addDays(today, 3), veterinarian: "Dr. Ncube", reason: "Herd pregnancy testing", status: "Scheduled" });

  /* feed */
  const FD = [
    mk("feed", { feedType: "Hay", name: "Teff hay bales", supplier: "Highveld Feeds", qtyPurchased: 400, unit: "bales", costPerUnit: 6, purchaseDate: addDays(today, -60), expiryDate: "", storage: "Hay shed", minStock: 100 }),
    mk("feed", { feedType: "Concentrates", name: "Finisher pellets", supplier: "AgriMix", qtyPurchased: 6000, unit: "kg", costPerUnit: 0.42, purchaseDate: addDays(today, -45), expiryDate: addDays(today, 25), storage: "Feed store", minStock: 1200 }),
    mk("feed", { feedType: "Minerals", name: "Lick blocks", supplier: "AgriMix", qtyPurchased: 80, unit: "units", costPerUnit: 9, purchaseDate: addDays(today, -30), storage: "Feed store", minStock: 15 }),
    mk("feed", { feedType: "Silage", name: "Maize silage", supplier: "Own production", qtyPurchased: 20000, unit: "kg", costPerUnit: 0.08, purchaseDate: addDays(today, -100), storage: "Silage pit", minStock: 4000 }),
  ];
  mk("feedUsage", { feedId: FD[0].id, quantity: 330, date: addDays(today, -5), target: "Breeding herd" });
  mk("feedUsage", { feedId: FD[1].id, quantity: 4300, date: addDays(today, -4), target: "Feedlot A" });
  mk("feedUsage", { feedId: FD[2].id, quantity: 52, date: addDays(today, -10), target: "All pastures" });
  mk("feedUsage", { feedId: FD[3].id, quantity: 11000, date: addDays(today, -6), target: "Breeding herd" });

  /* feedlot (steers) */
  A.filter((a) => a.category === "Steer" && a.status === "Active").forEach((a, i) => {
    mk("feedlot", { feedlotId: "Feedlot A", animalId: a.id, entryDate: addDays(today, -75 - i * 3), startWeight: a.currentWeight - 70 - i * 3, currentWeight: a.currentWeight, targetWeight: 480, ration: "Finisher pellets + silage", dailyIntakeKg: 9.5, feedCostPerKg: 0.3, salePricePerKg: 3.1 });
  });

  /* purchases & sales */
  const bought = A[5];
  mk("purchases", { date: addDays(today, -60), seller: "Mutare Auctions", tag: bought.tag, breed: bought.breed, category: bought.category, sex: bought.sex, ageMonths: 20, weight: 280, price: 760, transport: 80, vetCost: 25, otherCost: 0, location: "Mutare", animalId: bought.id });
  mk("expenses", { date: addDays(today, -60), category: "Livestock purchase", description: `Purchase of ${bought.tag} from Mutare Auctions`, amount: 865, paymentStatus: "Paid", paymentMethod: "Bank transfer", section: "Livestock", purchaseId: "demo-purchases-1" });
  for (const [i, a] of [A[8], A[9]].entries()) {
    const price = 1180 + i * 90;
    const sale = mk("sales", { date: a.soldDate, animalId: a.id, buyer: "Bulawayo Abattoir", weight: 420 + i * 25, price, transport: 40, commission: 35, otherCost: 0, costBasis: 760 + i * 40 });
    mk("income", { date: a.soldDate, category: "Livestock sales", description: `Sale of ${a.tag} to Bulawayo Abattoir`, amount: price - 75, paymentStatus: "Paid", paymentMethod: "Bank transfer", section: "Livestock", animalId: a.id, saleId: sale.id });
  }

  /* breeding, births, mortality */
  mk("breeding", { cowId: cow(5).id, bullId: A[0].id, matingDate: addDays(today, -255), method: "Natural", pregnancyStatus: "Pregnant", expectedCalvingDate: addDays(today, 12) });
  mk("breeding", { cowId: cow(6).id, bullId: A[0].id, matingDate: addDays(today, -58), method: "Natural", pregnancyStatus: "Pending check" });
  mk("breeding", { cowId: cow(7).id, bullId: A[1].id, matingDate: addDays(today, -120), method: "Artificial insemination", semen: "Angus AI-204", pregnancyStatus: "Pregnant" });
  A.filter((a) => a.category === "Calf").slice(0, 4).forEach((c, i) => mk("births", { calfTag: c.tag, motherId: cow(8 + i).id, fatherId: A[0].id, birthDate: c.dob, birthWeight: 32 + i, sex: c.sex, breed: c.breed, healthStatus: "Healthy", calfId: c.id }));
  mk("mortality", { animalId: A[15].id, date: addDays(today, -33), cause: "Snake bite", location: "River Camp", loss: A[15].estimatedValue, vetFindings: "Swelling at hind leg" });

  /* finance: 6 months */
  const cats: [string, number, number][] = [["Feed", 700, 1400], ["Veterinary", 120, 380], ["Labour", 1900, 2100], ["Fuel", 300, 520], ["Seeds", 0, 900], ["Fertilizer", 0, 1100], ["Utilities", 150, 260], ["Maintenance", 90, 400]];
  for (let m = 5; m >= 0; m--) {
    const date = addDays(today, -m * 30 - 3);
    for (const [category, lo, hi] of cats) {
      const amount = Math.round(between(lo, hi));
      if (amount > 0) mk("expenses", { date, category, description: `${category} – monthly`, amount, paymentMethod: "Bank transfer", paymentStatus: "Paid", section: category === "Feed" || category === "Veterinary" ? "Livestock" : category === "Seeds" || category === "Fertilizer" ? "Agriculture" : "General", ...(category === "Feed" ? { herd: "Breeding herd" } : {}) });
    }
    mk("income", { date, category: m % 2 ? "Crop sales" : "Livestock sales", description: m % 2 ? "Grain delivery" : "Weaner sales", amount: Math.round(between(2500, 6500)), paymentMethod: "Bank transfer", paymentStatus: "Paid", section: m % 2 ? "Agriculture" : "Livestock" });
  }
  mk("expenses", { date: addDays(today, -10), category: "Feed", description: "Winter feed order – AgriMix", amount: 2150, paymentStatus: "Outstanding", dueDate: addDays(today, 4), paymentMethod: "Credit", section: "Livestock" });
  mk("budgets", { category: "Feed", month: today.slice(0, 7), amount: 1200 });
  mk("budgets", { category: "Veterinary", month: today.slice(0, 7), amount: 300 });
  mk("budgets", { category: "Labour", month: today.slice(0, 7), amount: 2000 });
  mk("suppliers", { name: "AgriMix", phone: "+263 77 111 2222", email: "sales@agrimix.example" });
  mk("suppliers", { name: "Highveld Feeds", phone: "+263 77 333 4444" });
  mk("customers", { name: "Bulawayo Abattoir", phone: "+263 77 555 6666" });

  /* employees, attendance, tasks, inventory, map */
  const E = [
    mk("employees", { empNo: "E001", name: "Tendai Moyo", position: "Farm Manager", department: "General", phone: "+263 77 000 0001", hireDate: "2019-03-01", salary: 900, payFrequency: "Monthly", workLocation: "Main office", status: "Active" }),
    mk("employees", { empNo: "E002", name: "Sipho Dube", position: "Herdsman", department: "Livestock", phone: "+263 77 000 0002", hireDate: "2021-06-15", salary: 420, payFrequency: "Monthly", workLocation: "Livestock", status: "Active" }),
    mk("employees", { empNo: "E003", name: "Grace Ndlovu", position: "Irrigation technician", department: "Crops", phone: "+263 77 000 0003", hireDate: "2022-01-10", salary: 460, payFrequency: "Monthly", workLocation: "Fields", status: "Active" }),
  ];
  E.forEach((e) => { for (let d = 0; d < 5; d++) mk("attendance", { employeeId: e.id, date: addDays(today, -d), status: d === 3 && e.empNo === "E003" ? "Leave" : "Present", hours: d === 3 && e.empNo === "E003" ? 0 : 8 }); });
  mk("tasks", { name: "Move cattle to Pasture 4", employeeId: E[1].id, section: "Livestock", priority: "High", startDate: today, dueDate: today, status: "To do", description: "Move the heifers and four calves to South Flats" });
  mk("tasks", { name: "Repair Hill Camp water trough", employeeId: E[1].id, section: "Livestock", priority: "Urgent", startDate: addDays(today, -2), dueDate: addDays(today, -1), status: "In progress" });
  mk("tasks", { name: "Inspect irrigation heads on Field A2", employeeId: E[2].id, section: "Agriculture", priority: "High", startDate: today, dueDate: addDays(today, 1), status: "To do" });
  mk("tasks", { name: "Weigh feedlot steers", employeeId: E[1].id, section: "Feedlot", priority: "Medium", startDate: addDays(today, 5), dueDate: addDays(today, 7), status: "To do" });
  mk("tasks", { name: "Order lick blocks", employeeId: E[0].id, section: "General", priority: "Low", startDate: addDays(today, -6), dueDate: addDays(today, -4), status: "Done" });
  mk("inventory", { category: "Equipment", name: "Tractor (John Deere 5075)", quantity: 1, unit: "units", price: 28000, storage: "Machinery shed", nextService: addDays(today, 6) });
  mk("inventory", { category: "Veterinary medicines", name: "Oxytetracycline 20%", quantity: 4, unit: "units", price: 18, supplierId: "demo-suppliers-1", storage: "Vet fridge", expiry: addDays(today, 150), minStock: 5 });
  mk("inventory", { category: "Fuel", name: "Diesel", quantity: 650, unit: "L", price: 1.6, storage: "Fuel tank", minStock: 300 });
  mk("inventory", { category: "Seeds", name: "Maize seed SC403", quantity: 300, unit: "kg", price: 4, storage: "Seed store", minStock: 100 });
  mk("mapItems", { type: "Dam", name: "Main dam", gps: "-20.4300, 28.5150" });
  mk("mapItems", { type: "Barn", name: "Cattle crush & barn", gps: "-20.4180, 28.5000" });
  mk("mapItems", { type: "Water source", name: "Borehole 2", gps: "-20.3950, 28.4900" });
  mk("mapItems", { type: "Storage facility", name: "Grain silos", gps: "-20.4120, 28.5020" });

  return { ...base, farms: [farm], activeFarmId: farmId, data, demo: true, user: { name: "Farm Owner", role: "Owner" } };
}
