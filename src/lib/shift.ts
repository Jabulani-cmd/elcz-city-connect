import { useSyncExternalStore } from "react";
import { getState, rowsOf, upsert } from "./store";
import { clearedPosition, hoursBetween, positionValues, shouldPublish, type Fix } from "./tracking";

/**
 * An employee's shift on this phone. Location is shared only while they are clocked in AND have consented, and only while the app is open
 * (browsers do not allow a web app to track in the background). Clocking out stops sharing and clears the stored coordinates.
 */
export type Shift = { farmId: string; employeeId: string; consentAt: string; clockedInAt: string };

const KEY = "farmhelper.shift";
let shift: Shift | null = (() => { try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; } })();
const subs = new Set<() => void>();
const save = (s: Shift | null) => {
  shift = s;
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  subs.forEach((f) => f());
};

export const useShift = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => shift);
export const getShift = () => shift;

const employeeName = (id: string) => String(rowsOf("employees").find((e) => e.id === id)?.name ?? "Employee");

/** Consent is recorded per clock-in so it is explicit every shift. */
export function clockIn(employeeId: string): Shift {
  const s: Shift = { farmId: getState().activeFarmId, employeeId, consentAt: new Date().toISOString(), clockedInAt: new Date().toISOString() };
  save(s);
  return s;
}

export function clockOut() {
  const s = shift;
  if (!s) return;
  upsert("attendance", { employeeId: s.employeeId, date: s.clockedInAt.slice(0, 10), status: "Present", hours: hoursBetween(s.clockedInAt), clockedInAt: s.clockedInAt, clockedOutAt: new Date().toISOString(), notes: "Clocked in/out from the app" });
  if (rowsOf("positions").some((p) => p.id === s.employeeId)) upsert("positions", clearedPosition(s.employeeId));
  save(null);
}

/** Publish one fix for the person on shift. Returns whether it was sent. */
export function publishEmployeeFix(fix: Fix, last: Fix | null): boolean {
  const s = shift;
  if (!s || !shouldPublish(last, fix)) return false;
  upsert("positions", positionValues("Employee", s.employeeId, employeeName(s.employeeId), fix, "Phone", { consentAt: s.consentAt }));
  return true;
}
