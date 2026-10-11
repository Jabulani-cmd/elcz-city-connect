// Records are user-defined shapes (see schema.ts); cell values are validated at the form boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Cell = any;
export type Values = Record<string, Cell>;

export type Row = {
  id: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: Cell;
};

export type Role =
  | "Owner"
  | "Farm Manager"
  | "Veterinarian"
  | "Agronomist"
  | "Employee"
  | "Accountant"
  | "Viewer";

export const ROLES: Role[] = [
  "Owner",
  "Farm Manager",
  "Veterinarian",
  "Agronomist",
  "Employee",
  "Accountant",
  "Viewer",
];

export type Section =
  | "dashboard"
  | "agriculture"
  | "livestock"
  | "inventory"
  | "finance"
  | "employees"
  | "tasks"
  | "map"
  | "assistant"
  | "reports"
  | "notifications"
  | "documents"
  | "settings";

export type Farm = {
  id: string;
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  sizeHa: number;
  farmType: string;
  manager: string;
  phone: string;
  email: string;
  registration: string;
  description: string;
  agriHa: number;
  pastureHa: number;
  createdAt: string;
};

export type OutboxItem = {
  id: string;
  op: "upsert" | "delete";
  collection: string;
  rowId: string;
  at: string;
};
