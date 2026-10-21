import type { Role, Section } from "./types";

const ALL: Section[] = ["dashboard", "agriculture", "livestock", "inventory", "finance", "employees", "tasks", "map", "assistant", "reports", "notifications", "documents", "settings"];

/** Sections each role can open. `write` is the subset they can change. */
export const ACCESS: Record<Role, { read: Section[]; write: Section[] }> = {
  Owner: { read: ALL, write: ALL },
  "Farm Manager": { read: ALL, write: ALL.filter((s) => s !== "settings") },
  Veterinarian: { read: ["dashboard", "livestock", "map", "assistant", "notifications", "documents", "tasks"], write: ["livestock", "documents"] },
  Agronomist: { read: ["dashboard", "agriculture", "inventory", "map", "assistant", "notifications", "documents", "tasks"], write: ["agriculture", "inventory", "documents"] },
  Employee: { read: ["dashboard", "agriculture", "livestock", "tasks", "map", "notifications"], write: ["agriculture", "livestock", "tasks"] },
  Accountant: { read: ["dashboard", "finance", "inventory", "reports", "employees", "notifications", "documents"], write: ["finance", "documents"] },
  Viewer: { read: ["dashboard", "agriculture", "livestock", "inventory", "finance", "employees", "tasks", "map", "reports", "notifications", "documents"], write: [] },
};

export const canRead = (role: Role, s: Section) => ACCESS[role].read.includes(s);

/** Set while a farm’s trial or plan has lapsed: everyone can still read, nobody can change anything (the database enforces the same). */
let readOnly = false;
export const setReadOnly = (v: boolean) => { readOnly = v; };
export const isReadOnly = () => readOnly;
export const canWrite = (role: Role, s: Section) => !readOnly && ACCESS[role].write.includes(s);

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Owner: "Full access, including settings and farms.",
  "Farm Manager": "Runs the whole farm; cannot change settings or roles.",
  Veterinarian: "Livestock health, treatments, vaccinations and documents.",
  Agronomist: "Crop management, fields and inputs.",
  Employee: "Records weights, health, tasks and field work.",
  Accountant: "Finance, reports and payroll view.",
  Viewer: "Read-only access.",
};
