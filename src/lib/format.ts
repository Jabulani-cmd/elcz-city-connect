import { fmtMoney, fmtNum, toNum } from "./calc";
import { labelOf, type Ctx, type Field, type Resource } from "./schema";
import { rowsOf } from "./store";
import type { Row } from "./types";

export const ctx: Ctx = { rows: (c) => rowsOf(c) };

export const columnLabel = (res: Resource, key: string) =>
  res.fields.find((f) => f.key === key)?.label ?? res.derived?.find((d) => d.key === key)?.label ?? key;

export function fieldText(f: Field, row: Row): string {
  const v = row[f.key];
  if (v === undefined || v === null || v === "") return "";
  switch (f.type) {
    case "ref": return labelOf(f.ref!, rowsOf(f.ref!).find((r) => r.id === v));
    case "money": return fmtMoney(toNum(v));
    case "number": return fmtNum(toNum(v), 2);
    case "file": return v.name ?? "";
    default: return String(v);
  }
}

/** Plain text for a table column (field or derived), used by tables and exports. */
export function cellText(res: Resource, key: string, row: Row): string {
  const f = res.fields.find((x) => x.key === key);
  if (f) return fieldText(f, row);
  const d = res.derived?.find((x) => x.key === key);
  if (!d) return String(row[key] ?? "");
  const v = d.value(row, ctx);
  if (v === "" || v === undefined) return "";
  if (d.kind === "money") return fmtMoney(toNum(v));
  if (d.kind === "number") return fmtNum(toNum(v), 2);
  return String(v);
}

export const rawCell = (res: Resource, key: string, row: Row): string | number => {
  const f = res.fields.find((x) => x.key === key);
  if (f && (f.type === "number" || f.type === "money")) return row[key] === "" || row[key] == null ? "" : toNum(row[key]);
  const d = res.derived?.find((x) => x.key === key);
  if (d) { const v = d.value(row, ctx); return typeof v === "number" ? v : v ?? ""; }
  return f ? fieldText(f, row) : String(row[key] ?? "");
};

const TONES: Record<string, string> = {
  good: "bg-success/15 text-success", warn: "bg-warning/20 text-[hsl(30_90%_28%)] dark:text-warning", bad: "bg-danger/15 text-danger", info: "bg-info/15 text-info", none: "bg-muted text-muted-foreground",
};
const MAP: Record<string, keyof typeof TONES> = {
  Active: "good", Good: "good", Available: "good", Paid: "good", Present: "good", Done: "good", Recovered: "good", Completed: "good", Healthy: "good", Planted: "good", Yes: "info",
  Sold: "info", Transferred: "info", Scheduled: "info", "In progress": "info", Pregnant: "info", Planted_: "info", "Pending check": "warn",
  Quarantined: "warn", Fair: "warn", Limited: "warn", Outstanding: "warn", Ongoing: "warn", Late: "warn", Medium: "warn", High: "warn", Delayed: "warn", Fallow: "warn", Weak: "warn", "Under treatment": "warn", Preparing: "warn", Leave: "warn", Low: "none",
  Deceased: "bad", Missing: "bad", Poor: "bad", Diseased: "bad", Unavailable: "bad", Urgent: "bad", Absent: "bad", Died: "bad", Cancelled: "none", "To do": "none", "Not pregnant": "bad", Calved: "good",
};
export const toneClass = (v: string) => TONES[MAP[v] ?? "none"];
export const isToneField = (key: string) => ["status", "health", "condition", "water", "priority", "recovery", "paymentStatus", "pregnancyStatus", "outcome", "healthStatus", "released"].includes(key);
