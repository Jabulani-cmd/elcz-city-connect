import { RESOURCES, type Field, type FieldType } from "./schema";
import type { Row } from "./types";

/** Client collection → database table. Order matters: parents come before the tables that reference them. */
export const TABLES: Record<string, string> = {
  suppliers: "suppliers", customers: "customers", fields: "fields", crops: "crops", plantings: "planting_records",
  fertilizer: "fertilizer_records", protection: "crop_protection_records", irrigation: "irrigation_records", harvests: "harvest_records",
  diagnoses: "crop_diagnoses", pastures: "pastures", animals: "animals", weights: "weight_records", grazing: "grazing_records",
  health: "health_records", vaccinations: "vaccination_records", diseases: "disease_records", quarantine: "quarantine_records",
  appointments: "vet_appointments", feed: "feed_inventory", feedUsage: "feed_consumption", feedlot: "feedlot_records",
  purchases: "livestock_purchases", sales: "livestock_sales", breeding: "breeding_records", births: "birth_records", mortality: "mortality_records",
  employees: "employees", attendance: "attendance", performance: "performance_reviews", payroll: "salary_payments", tasks: "tasks",
  income: "income", expenses: "expenses", budgets: "budgets", inventory: "inventory", documents: "documents", mapItems: "map_features",
  prefs: "notification_prefs",
};

export const SYNC_ORDER = Object.keys(TABLES);

/** Which permission areas may write each table (matches src/lib/permissions.ts). */
export const WRITE_AREAS: Record<string, string[]> = {
  suppliers: ["inventory", "finance"], customers: ["finance"], fields: ["agriculture"], crops: ["agriculture"], plantings: ["agriculture"], fertilizer: ["agriculture"],
  protection: ["agriculture"], irrigation: ["agriculture"], harvests: ["agriculture"], diagnoses: ["agriculture"],
  pastures: ["livestock"], animals: ["livestock"], weights: ["livestock"], grazing: ["livestock"], health: ["livestock"], vaccinations: ["livestock"],
  diseases: ["livestock"], quarantine: ["livestock"], appointments: ["livestock"], feed: ["livestock", "inventory"], feedUsage: ["livestock", "inventory"],
  feedlot: ["livestock"], purchases: ["livestock"], sales: ["livestock"], breeding: ["livestock"], births: ["livestock"], mortality: ["livestock"],
  employees: ["employees"], attendance: ["employees"], performance: ["employees"], payroll: ["employees"], tasks: ["tasks"],
  income: ["finance"], expenses: ["finance"], budgets: ["finance"], inventory: ["inventory"], documents: ["documents"], mapItems: ["map"], prefs: ["notifications"],
};

/** Extra record types that live in resources without a schema entry. */
const PREFS_FIELDS: Field[] = [
  { key: "type", label: "Type", type: "text" }, { key: "kind", label: "Kind", type: "text" }, { key: "alertId", label: "Alert", type: "text" },
  { key: "inApp", label: "In-app", type: "text" }, { key: "push", label: "Push", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "sms", label: "SMS", type: "text" },
];

export const fieldsOf = (collection: string): Field[] => (collection === "prefs" ? PREFS_FIELDS : RESOURCES[collection].fields);

export const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export const sqlType = (t: FieldType): string =>
  t === "number" || t === "money" ? "numeric" : t === "date" ? "date" : t === "ref" ? "uuid" : t === "file" ? "jsonb" : "text";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

const BASE = new Set(["id", "farmId", "createdAt", "updatedAt"]);

function toDbValue(f: Field, v: unknown): unknown {
  if (v === "" || v === undefined || v === null) return null;
  switch (f.type) {
    case "number":
    case "money": { const n = typeof v === "number" ? v : parseFloat(String(v)); return Number.isFinite(n) ? n : null; }
    case "ref": return isUuid(v) ? v : null;
    case "file": return typeof v === "object" ? v : null;
    case "date": return /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : null;
    default: return typeof v === "string" ? v : String(v);
  }
}

/** App row → database row. Keys without a column go into `extra`, so nothing is ever lost. */
export function toDb(collection: string, row: Row): Record<string, unknown> {
  const fields = fieldsOf(collection);
  const known = new Map(fields.map((f) => [f.key, f]));
  const out: Record<string, unknown> = { id: row.id, farm_id: row.farmId, created_at: row.createdAt };
  const extra: Record<string, unknown> = {};
  for (const f of fields) out[snake(f.key)] = toDbValue(f, row[f.key]);
  for (const [k, v] of Object.entries(row)) if (!known.has(k) && !BASE.has(k) && v !== undefined) extra[k] = v;
  out.extra = extra;
  return out;
}

/** Database row → app row. */
export function fromDb(collection: string, d: Record<string, unknown>): Row {
  const row: Row = { id: d.id as string, farmId: d.farm_id as string, createdAt: (d.created_at as string) ?? "", updatedAt: (d.updated_at as string) ?? "" };
  Object.assign(row, (d.extra as Record<string, unknown>) ?? {});
  for (const f of fieldsOf(collection)) {
    const v = d[snake(f.key)];
    row[f.key] = v === null || v === undefined ? "" : f.type === "number" || f.type === "money" ? Number(v) : v;
  }
  return row;
}

export const farmToDb = (f: Record<string, unknown>) => ({
  id: f.id, name: f.name, location: f.location || null, latitude: f.latitude === "" ? null : Number(f.latitude) || null, longitude: f.longitude === "" ? null : Number(f.longitude) || null,
  size_ha: Number(f.sizeHa) || null, agri_ha: Number(f.agriHa) || null, pasture_ha: Number(f.pastureHa) || null, farm_type: f.farmType || null,
  manager: f.manager || null, phone: f.phone || null, email: f.email || null, registration: f.registration || null, description: f.description || null,
});

export const farmFromDb = (d: Record<string, unknown>) => ({
  id: d.id as string, name: (d.name as string) ?? "", location: (d.location as string) ?? "", latitude: d.latitude == null ? "" : String(d.latitude), longitude: d.longitude == null ? "" : String(d.longitude),
  sizeHa: Number(d.size_ha) || 0, agriHa: Number(d.agri_ha) || 0, pastureHa: Number(d.pasture_ha) || 0, farmType: (d.farm_type as string) ?? "Mixed", manager: (d.manager as string) ?? "",
  phone: (d.phone as string) ?? "", email: (d.email as string) ?? "", registration: (d.registration as string) ?? "", description: (d.description as string) ?? "", createdAt: (d.created_at as string) ?? "",
});

export const ROLE_FROM_DB: Record<string, import("./types").Role> = {
  owner: "Owner", farm_manager: "Farm Manager", veterinarian: "Veterinarian", agronomist: "Agronomist", employee: "Employee", accountant: "Accountant", viewer: "Viewer",
};
export const ROLE_TO_DB: Record<string, string> = Object.fromEntries(Object.entries(ROLE_FROM_DB).map(([k, v]) => [v, k]));

export const COLLECTION_OF_TABLE: Record<string, string> = Object.fromEntries(Object.entries(TABLES).map(([c, t]) => [t, c]));
