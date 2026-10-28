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
    id: farmId, name: "Green Valley Farm (Professional Demo)", location: "Matopos, Bulawayo, Zimbabwe", latitude: "-20.4200", longitude: "28.5000",
    sizeHa: 420, farmType: "Mixed (crops & livestock)", manager: "Tendai Moyo", phone: "+263 77 000 0000", email: "office@greenvalley.example",
    registration: "REG-2019-0457", description: "Advanced demonstration farm. Includes simulated health crises, financial gaps, and billing history to showcase AI insights and auditor reports.",
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
  const plan: [string, string, number, number, number][] = [
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
  A.filter((a) => a.status === "Active" && a.category === "Heifer").forEach((a) => (a.pastureId = P[3].id));
  A.filter((a) => a.status === "Active" && a.category === "Calf").slice(0, 4).forEach((a) => (a.pastureId = P[3].id));
  A.filter((a) => a.status === "Active" && a.category === "Steer").forEach((a) => (a.pastureId = undefined));

  /* weights */
  for (const a of A) {
    if (a.status === "Deceased") continue;
    const target = a.currentWeight;
    const rate = a.category === "Cow" || a.category === "Bull" ? between(0.1, 0.5) : between(0.5, 1.3);
    let prev: Row | undefined;
    [-120, -80, -40, -3].forEach((offset) => {
      const date = addDays(today, offset);
      const w = Math.round(target - rate * (-offset) + between(-4, 4));
      const diff = prev ? Math.round(w - prev.weight) : "";
      const row = mk("weights", { animalId: a.id, date, weight: w, location: "Crush pen", previousWeight: prev ? prev.weight : "", difference: diff, adg: prev ? averageDailyGain(w - prev.weight, daysBetween(prev.date, date)) : 0 });
      prev = row;
    });
    a.currentWeight = prev!.weight;
  }

  /* --- DEMO SCENARIOS --- */
  const cow = (i: number) => A[2 + i];

  // Scenario 1: Critical Health Alert (Emergency Urgency)
  mk("health", { animalId: A[3].id, date: addDays(today, -3), condition: "Suspected Heartwater", symptoms: "High fever, nervous signs, staggering", diagnosis: "Emergency Case", treatment: "Tetracycline injection, strict isolation", medication: "Tetracycline", dosage: "20 ml", veterinarian: "Dr. Ncube", startDate: addDays(today, -3), recovery: "Ongoing", source: "AI assessment", urgency: "Emergency" });
  mk("quarantine", { animalId: A[3].id, reason: "Suspected Heartwater", startDate: addDays(today, -3), expectedRelease: addDays(today, 10), healthStatus: "Critical", treatments: "Tetracycline", vetNotes: "Check temperature every 6 hours", released: "No" });

  // Scenario 2: Overdue Vaccinations (High Priority)
  mk("vaccinations", { animalId: cow(0).id, vaccine: "Anthrax", date: addDays(today, -365), nextDate: addDays(today, -5), batch: "AN-2291", veterinarian: "Dr. Ncube", cost: 3 });
  mk("vaccinations", { animalId: cow(1).id, vaccine: "Anthrax", date: addDays(today, -365), nextDate: addDays(today, -10), batch: "AN-2291", veterinarian: "Dr. Ncube", cost: 3 });

  // Scenario 3: Financial Gaps (Audit Red Flags)
  mk("expenses", { date: addDays(today, -10), category: "Feed", description: "Urgent winter feed supplement", amount: 4500, paymentStatus: "Outstanding", dueDate: addDays(today, -2), paymentMethod: "Credit", section: "Livestock" });
  mk("expenses", { date: addDays(today, -5), category: "Veterinary", description: "Emergency Vet Call-out", amount: 1200, paymentStatus: "Outstanding", dueDate: addDays(today, 2), paymentMethod: "Bank transfer", section: "Livestock" });

  // Scenario 4: Operational Lag (Overdue High Priority Tasks)
  mk("tasks", { name: "Repair North Paddock fence", employeeId: "demo-employees-2", section: "Livestock", priority: "High", startDate: addDays(today, -14), dueDate: addDays(today, -7), status: "To do", description: "Fence broke near river camp, animals escaping" });
  mk("tasks", { name: "Conduct quarterly herd audit", employeeId: "demo-employees-1", section: "General", priority: "High", startDate: addDays(today, -30), dueDate: addDays(today, -5), status: "To do", description: "Verify all tags and weights for auditor" });

  // Scenario 5: Inventory Crisis (Low Stock Alert)
  mk("inventory", { category: "Veterinary medicines", name: "Oxytetracycline", quantity: 2, unit: "units", price: 18, storage: "Vet fridge", expiry: addDays(today, 100), minStock: 10 });

  /* --- BILLING & SUBSCRIPTION DEMO --- */
  // Simulated past payments to show in the "Payment history" panel
  mk("payments", { plan_code: "standard", amount_usd: 15, billing_interval: "month", status: "paid", method: "ecocash", created_at: addDays(today, -60) });
  mk("payments", { plan_code: "standard", amount_usd: 15, billing_interval: "month", status: "paid", method: "innbucks", created_at: addDays(today, -30) });

  /* Rest of general seed data */
  const FD = [
    mk("feed", { feedType: "Hay", name: "Teff hay bales", supplier: "Highveld Feeds", qtyPurchased: 400, unit: "bales", costPerUnit: 6, purchaseDate: addDays(today, -60), expiryDate: "", storage: "Hay shed", minStock: 100 }),
    mk("feed", { feedType: "Concentrates", name: "Finisher pellets", supplier: "AgriMix", qtyPurchased: 6000, unit: "kg", costPerUnit: 0.42, purchaseDate: addDays(today, -45), expiryDate: addDays(today, 25), storage: "Feed store", minStock: 1200 }),
  ];
  mk("feedUsage", { feedId: FD[0].id, quantity: 350, date: addDays(today, -2), target: "Breeding herd" });

  return {
    ...base,
    farms: [farm],
    activeFarmId: farmId,
    data,
    demo: true,
    user: { name: "Tendai Moyo", role: "Owner", email: "office@greenvalley.example" }
  };
}
