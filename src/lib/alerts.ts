import { addDays, daysBetween, feedAvailable, sum, toNum, todayISO } from "./calc";
import { labelOf } from "./schema";
import type { Row } from "./types";

export type Severity = "danger" | "warning" | "info";
export type NotificationKind =
  | "Vaccinations" | "Veterinary appointments" | "Animal treatments" | "Pregnancy checks" | "Expected births"
  | "Feed shortages" | "Pasture rotation" | "Crop planting" | "Crop harvesting" | "Irrigation"
  | "Employee tasks" | "Equipment maintenance" | "Financial payments" | "Weaning" | "Crop health" | "Inventory";

export const NOTIFICATION_KINDS: NotificationKind[] = [
  "Vaccinations", "Veterinary appointments", "Animal treatments", "Pregnancy checks", "Expected births", "Weaning",
  "Feed shortages", "Inventory", "Pasture rotation", "Crop planting", "Crop harvesting", "Crop health", "Irrigation",
  "Employee tasks", "Equipment maintenance", "Financial payments",
];

export type Alert = {
  id: string;
  kind: NotificationKind;
  severity: Severity;
  title: string;
  detail: string;
  date?: string;
  to: string;
  area: "Livestock" | "Agriculture" | "Farm" | "Finance";
};

type Get = (collection: string) => Row[];
const sev = (daysLeft: number): Severity => (daysLeft < 0 ? "danger" : daysLeft <= 3 ? "warning" : "info");
const when = (daysLeft: number) => (daysLeft < 0 ? `${-daysLeft} day${daysLeft === -1 ? "" : "s"} overdue` : daysLeft === 0 ? "due today" : `due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`);
const isLive = (a?: Row) => !!a && (a.status === "Active" || a.status === "Quarantined");

export function computeAlerts(get: Get, today = todayISO()): Alert[] {
  const out: Alert[] = [];
  const animals = get("animals");
  const byId = (id: string) => animals.find((a) => a.id === id);
  const tag = (id: string) => labelOf("animals", byId(id)) || "animal";
  const left = (d: string) => daysBetween(today, d);

  /* vaccinations: use only the newest record per animal + vaccine */
  const latest = new Map<string, Row>();
  for (const v of get("vaccinations")) {
    const k = `${v.animalId}|${String(v.vaccine).toLowerCase()}`;
    const cur = latest.get(k);
    if (!cur || v.date > cur.date) latest.set(k, v);
  }
  for (const v of latest.values()) {
    if (!v.nextDate || !isLive(byId(v.animalId))) continue;
    const d = left(v.nextDate);
    if (d <= 14) out.push({ id: `vax-${v.id}`, kind: "Vaccinations", severity: sev(d), title: `${v.vaccine} – ${tag(v.animalId)}`, detail: `Vaccination ${when(d)}`, date: v.nextDate, to: "/livestock/vaccinations", area: "Livestock" });
  }
  for (const a of get("appointments")) {
    if (a.status !== "Scheduled") continue;
    const d = left(a.date);
    if (d <= 7) out.push({ id: `appt-${a.id}`, kind: "Veterinary appointments", severity: sev(d), title: `Vet visit: ${a.reason}`, detail: `${a.veterinarian || "Veterinarian"} · ${when(d)}`, date: a.date, to: "/livestock/appointments", area: "Livestock" });
  }
  for (const h of get("health")) {
    if (h.recovery !== "Ongoing" || !isLive(byId(h.animalId))) continue;
    if (h.source === "AI assessment" && h.urgency !== "High" && h.urgency !== "Emergency") continue;
    out.push({ id: `treat-${h.id}`, kind: "Animal treatments", severity: "warning", title: `${tag(h.animalId)} needs treatment follow-up`, detail: `${h.condition}${h.medication ? ` · ${h.medication}` : ""}`, date: h.date, to: "/livestock/health", area: "Livestock" });
  }
  for (const b of get("breeding")) {
    if (b.pregnancyStatus === "Calved" || b.pregnancyStatus === "Not pregnant" || b.actualCalvingDate) continue;
    if (b.pregnancyStatus === "Pending check" && b.matingDate) {
      const due = addDays(b.matingDate, 60);
      const d = left(due);
      if (d <= 7) out.push({ id: `preg-${b.id}`, kind: "Pregnancy checks", severity: sev(d), title: `Pregnancy check – ${tag(b.cowId)}`, detail: `Check ${when(d)}`, date: due, to: "/livestock/breeding", area: "Livestock" });
    }
    if (b.pregnancyStatus === "Pregnant") {
      const due = b.expectedCalvingDate || addDays(b.matingDate, 283);
      const d = left(due);
      if (d <= 21) out.push({ id: `calv-${b.id}`, kind: "Expected births", severity: sev(d), title: `Calving – ${tag(b.cowId)}`, detail: `Expected calving ${when(d)}`, date: due, to: "/livestock/breeding", area: "Livestock" });
    }
  }
  for (const b of get("births")) {
    if (b.weaningDate || !b.birthDate || !isLive(byId(b.calfId))) continue;
    const due = addDays(b.birthDate, 210);
    const d = left(due);
    if (d <= 14) out.push({ id: `wean-${b.id}`, kind: "Weaning", severity: sev(d), title: `Weaning – ${b.calfTag}`, detail: `Weaning ${when(d)}`, date: due, to: "/livestock/births", area: "Livestock" });
  }

  /* feed + inventory */
  for (const f of get("feed")) {
    const avail = feedAvailable(toNum(f.qtyPurchased), sum(get("feedUsage").filter((u) => u.feedId === f.id), "quantity"));
    if (toNum(f.minStock) > 0 && avail <= toNum(f.minStock)) out.push({ id: `feed-${f.id}`, kind: "Feed shortages", severity: avail <= 0 ? "danger" : "warning", title: `Feed running low: ${f.name}`, detail: `${avail} ${f.unit || ""} left (alert level ${f.minStock})`, to: "/livestock/feed", area: "Livestock" });
    if (f.expiryDate) { const d = left(f.expiryDate); if (d <= 30) out.push({ id: `feedexp-${f.id}`, kind: "Feed shortages", severity: sev(d), title: `Feed expiry: ${f.name}`, detail: `Expiry ${when(d)}`, date: f.expiryDate, to: "/livestock/feed", area: "Livestock" }); }
  }
  for (const i of get("inventory")) {
    if (toNum(i.minStock) > 0 && toNum(i.quantity) <= toNum(i.minStock)) out.push({ id: `inv-${i.id}`, kind: "Inventory", severity: toNum(i.quantity) <= 0 ? "danger" : "warning", title: `Low stock: ${i.name}`, detail: `${i.quantity} ${i.unit || ""} left (minimum ${i.minStock})`, to: "/inventory", area: "Farm" });
    if (i.expiry) { const d = left(i.expiry); if (d <= 30) out.push({ id: `invexp-${i.id}`, kind: "Inventory", severity: sev(d), title: `Expiring: ${i.name}`, detail: `Expiry ${when(d)}`, date: i.expiry, to: "/inventory", area: "Farm" }); }
    if (i.category === "Equipment" && i.nextService) { const d = left(i.nextService); if (d <= 14) out.push({ id: `svc-${i.id}`, kind: "Equipment maintenance", severity: sev(d), title: `Service: ${i.name}`, detail: `Maintenance ${when(d)}`, date: i.nextService, to: "/inventory", area: "Farm" }); }
  }

  /* pastures */
  for (const p of get("pastures")) {
    const n = animals.filter((a) => a.pastureId === p.id && isLive(a)).length;
    if (toNum(p.capacity) > 0 && n > toNum(p.capacity)) out.push({ id: `over-${p.id}`, kind: "Pasture rotation", severity: "danger", title: `${p.name} is overstocked`, detail: `${n} animals on a capacity of ${p.capacity}`, to: "/livestock/pastures", area: "Livestock" });
    if (n > 0 && p.lastRestActual !== undefined && p.lastRestActual !== "" && toNum(p.restDays) > toNum(p.lastRestActual)) out.push({ id: `rest-${p.id}`, kind: "Pasture rotation", severity: "warning", title: `${p.name} had too little rest`, detail: `Rested ${p.lastRestActual} of ${p.restDays} days before animals returned`, to: "/livestock/pastures", area: "Livestock" });
    if (p.water === "Unavailable") out.push({ id: `water-${p.id}`, kind: "Pasture rotation", severity: n > 0 ? "danger" : "warning", title: `No water at ${p.name}`, detail: n > 0 ? `${n} animals are grazing here` : "Fix before moving animals in", to: "/livestock/pastures", area: "Livestock" });
    if (p.condition === "Poor") out.push({ id: `cond-${p.id}`, kind: "Pasture rotation", severity: "warning", title: `${p.name} needs attention`, detail: "Pasture condition is poor – consider resting or fertilizing", to: "/livestock/pastures", area: "Livestock" });
  }

  /* crops */
  for (const c of get("crops")) {
    if (!c.actualHarvestDate && c.expectedHarvestDate) {
      const d = left(c.expectedHarvestDate);
      if (d <= 14) out.push({ id: `harv-${c.id}`, kind: "Crop harvesting", severity: sev(d), title: `Harvest: ${labelOf("crops", c)}`, detail: `Harvest ${when(d)}`, date: c.expectedHarvestDate, to: "/agriculture/harvests", area: "Agriculture" });
    }
    if (c.health === "Diseased" || c.health === "Poor") out.push({ id: `dis-${c.id}`, kind: "Crop health", severity: c.health === "Diseased" ? "danger" : "warning", title: `${labelOf("crops", c)}: health ${c.health.toLowerCase()}`, detail: "Inspect the crop or run a photo check", to: "/agriculture/disease", area: "Agriculture" });
  }
  for (const p of get("plantings")) {
    if (p.status !== "Scheduled") continue;
    const d = left(p.plantingDate);
    if (d <= 7) out.push({ id: `plant-${p.id}`, kind: "Crop planting", severity: sev(d), title: `Plant ${p.cropName}`, detail: `Planting ${when(d)}`, date: p.plantingDate, to: "/agriculture/planting", area: "Agriculture" });
  }
  for (const r of get("irrigation")) {
    if (r.problems && daysBetween(r.date, today) <= 14) out.push({ id: `irr-${r.id}`, kind: "Irrigation", severity: "warning", title: "Irrigation problem reported", detail: String(r.problems), date: r.date, to: "/agriculture/irrigation", area: "Agriculture" });
  }

  /* tasks */
  for (const t of get("tasks")) {
    if (t.status === "Done" || !t.dueDate) continue;
    const d = left(t.dueDate);
    if (d <= 2) out.push({ id: `task-${t.id}`, kind: "Employee tasks", severity: d < 0 ? "danger" : t.priority === "Urgent" || t.priority === "High" ? "warning" : "info", title: t.name, detail: `${t.employeeId ? labelOf("employees", get("employees").find((e) => e.id === t.employeeId)) : "Unassigned"} · ${when(d)}`, date: t.dueDate, to: "/tasks", area: "Farm" });
  }

  /* payments */
  for (const e of get("expenses")) {
    if (e.paymentStatus !== "Outstanding" || !e.dueDate) continue;
    const d = left(e.dueDate);
    if (d <= 7) out.push({ id: `pay-${e.id}`, kind: "Financial payments", severity: sev(d), title: `Pay: ${e.description}`, detail: `${toNum(e.amount).toFixed(0)} · ${when(d)}`, date: e.dueDate, to: "/finance/expenses", area: "Finance" });
  }
  for (const e of get("income")) {
    if (e.paymentStatus !== "Outstanding" || !e.dueDate) continue;
    const d = left(e.dueDate);
    if (d <= 0) out.push({ id: `rec-${e.id}`, kind: "Financial payments", severity: "warning", title: `Payment overdue from customer`, detail: `${e.description} · ${toNum(e.amount).toFixed(0)}`, date: e.dueDate, to: "/finance/income", area: "Finance" });
  }

  const rank = { danger: 0, warning: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || (a.date ?? "").localeCompare(b.date ?? ""));
}
