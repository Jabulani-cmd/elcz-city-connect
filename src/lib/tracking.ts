import type { Row } from "./types";

/** Helpers for live positions (employees' phones, animal collars/tags, manual check-ins). Pure so they can be tested. */

export type Fix = { lat: number; lng: number; accuracy?: number; at: number };
export type Freshness = "live" | "recent" | "stale";

export const LIVE_MS = 10 * 60_000;
export const RECENT_MS = 2 * 3_600_000;
/** Phones are asked to publish at most once a minute, and only after moving this far (saves data and battery). */
export const MIN_PUBLISH_MS = 60_000;
export const MIN_PUBLISH_M = 25;
/** Fixes less precise than this are ignored (cell-tower guesses would put people in the wrong paddock). */
export const MAX_ACCURACY_M = 200;

export const isValidCoord = (lat: unknown, lng: unknown): lat is number =>
  typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

export const isUsableFix = (f: { lat: number; lng: number; accuracy?: number }) =>
  isValidCoord(f.lat, f.lng) && (f.accuracy == null || f.accuracy <= MAX_ACCURACY_M);

export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Whether a new GPS fix is worth sending: the first one, or enough time has passed AND the person has actually moved (or a long time has passed). */
export function shouldPublish(prev: Fix | null, next: Fix): boolean {
  if (!isUsableFix(next)) return false;
  if (!prev) return true;
  const dt = next.at - prev.at;
  if (dt < MIN_PUBLISH_MS) return false;
  return distanceM(prev, next) >= MIN_PUBLISH_M || dt >= 10 * 60_000;
}

export function freshness(recordedAt: string | undefined, now = Date.now()): Freshness {
  const t = Date.parse(recordedAt ?? "");
  if (!Number.isFinite(t)) return "stale";
  const age = now - t;
  return age <= LIVE_MS ? "live" : age <= RECENT_MS ? "recent" : "stale";
}

export function ago(recordedAt: string | undefined, now = Date.now()): string {
  const t = Date.parse(recordedAt ?? "");
  if (!Number.isFinite(t)) return "unknown time";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86_400)} d ago`;
}

/** Positions that have coordinates (a person who clocked out has theirs cleared). */
export const withCoords = (rows: Row[]) => rows.filter((r) => isValidCoord(Number(r.lat), Number(r.lng)) && r.lat !== "" && r.lng !== "");

export const positionValues = (subjectType: "Employee" | "Animal", subjectId: string, name: string, fix: { lat: number; lng: number; accuracy?: number }, source: string, extra: Partial<Row> = {}): Partial<Row> => ({
  id: subjectId, subjectType, name, lat: round6(fix.lat), lng: round6(fix.lng), accuracy: fix.accuracy != null ? Math.round(fix.accuracy) : "", source, recordedAt: new Date().toISOString(), ...extra,
});

/** What is saved when a person clocks out: the coordinates are blanked so nothing is kept about where they were off the clock. */
export const clearedPosition = (subjectId: string): Partial<Row> => ({ id: subjectId, lat: "", lng: "", accuracy: "", recordedAt: new Date().toISOString() });

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** True when an employee may be located: they are clocked in AND have consented. */
export const mayShare = (shift: { clockedInAt?: string; consentAt?: string } | null) => !!shift?.clockedInAt && !!shift?.consentAt;

export const hoursBetween = (fromIso: string, to = Date.now()) => Math.max(0, Math.round(((to - Date.parse(fromIso)) / 3_600_000) * 10) / 10);
