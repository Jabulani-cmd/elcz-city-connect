import { useMemo, useSyncExternalStore } from "react";
import type { Farm, OutboxItem, Role, Row } from "./types";
import { seedDemo } from "./seed";

export type State = {
  version: number;
  farms: Farm[];
  activeFarmId: string;
  data: Record<string, Row[]>;
  outbox: OutboxItem[];
  user: { name: string; role: Role };
  demo: boolean;
};

const KEY = "farmhelper.v1";
const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
const now = () => new Date().toISOString();

function emptyState(): State {
  return { version: 1, farms: [], activeFarmId: "", data: {}, outbox: [], user: { name: "Farm Owner", role: "Owner" }, demo: false };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    /* storage unavailable or corrupt – fall through to a fresh state */
  }
  return emptyState();
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode – app keeps working in memory */
  }
}

function set(next: State) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getState = () => state;
export const useStore = <T,>(sel: (s: State) => T): T => useSyncExternalStore(subscribe, () => sel(state));

/* ---------- reads ---------- */
export const rowsOf = (collection: string, s: State = state): Row[] =>
  (s.data[collection] ?? []).filter((r) => r.farmId === s.activeFarmId);

export function useRows(collection: string): Row[] {
  const all = useStore((s) => s.data[collection]);
  const farmId = useStore((s) => s.activeFarmId);
  return useMemo(() => (all ?? []).filter((r) => r.farmId === farmId), [all, farmId]);
}

export const useFarm = (): Farm | undefined =>
  useStore((s) => s.farms.find((f) => f.id === s.activeFarmId));
export const useFarms = () => useStore((s) => s.farms);
export const useUser = () => useStore((s) => s.user);
export const usePendingCount = () => useStore((s) => s.outbox.length);

/* ---------- writes ---------- */
function queue(s: State, op: OutboxItem["op"], collection: string, rowId: string): OutboxItem[] {
  const rest = s.outbox.filter((o) => !(o.collection === collection && o.rowId === rowId));
  return [...rest, { id: uid(), op, collection, rowId, at: now() }];
}

function audit(s: State, action: string, collection: string, rowId: string, summary: string): Row[] {
  const entry: Row = {
    id: uid(),
    farmId: s.activeFarmId,
    createdAt: now(),
    updatedAt: now(),
    action,
    collection,
    rowId,
    summary,
    user: `${s.user.name} (${s.user.role})`,
  };
  return [entry, ...(s.data.audit ?? [])].slice(0, 1000);
}

export function upsert(collection: string, values: Partial<Row>): Row {
  const s = state;
  const existing = values.id ? (s.data[collection] ?? []).find((r) => r.id === values.id) : undefined;
  const row: Row = existing
    ? { ...existing, ...values, updatedAt: now() }
    : ({ id: uid(), farmId: s.activeFarmId, createdAt: now(), updatedAt: now(), ...values } as Row);
  const list = existing
    ? (s.data[collection] ?? []).map((r) => (r.id === row.id ? row : r))
    : [...(s.data[collection] ?? []), row];
  const next: State = { ...s, data: { ...s.data, [collection]: list }, outbox: queue(s, "upsert", collection, row.id) };
  if (collection !== "audit") next.data.audit = audit(s, existing ? "update" : "create", collection, row.id, row.name || row.tag || row.title || row.description || row.id);
  set(next);
  return row;
}

export function remove(collection: string, id: string) {
  const s = state;
  const next: State = {
    ...s,
    data: { ...s.data, [collection]: (s.data[collection] ?? []).filter((r) => r.id !== id) },
    outbox: queue(s, "delete", collection, id),
  };
  next.data.audit = audit(s, "delete", collection, id, id);
  set(next);
}

export function createFarm(values: Partial<Farm>): Farm {
  const farm: Farm = {
    id: uid(), name: "New farm", location: "", latitude: "", longitude: "", sizeHa: 0, farmType: "Mixed",
    manager: "", phone: "", email: "", registration: "", description: "", agriHa: 0, pastureHa: 0,
    createdAt: now(), ...values,
  };
  set({ ...state, farms: [...state.farms, farm], activeFarmId: farm.id });
  return farm;
}

export function updateFarm(id: string, values: Partial<Farm>) {
  set({ ...state, farms: state.farms.map((f) => (f.id === id ? { ...f, ...values } : f)) });
}

export const setActiveFarm = (id: string) => set({ ...state, activeFarmId: id });
export const setUser = (u: Partial<State["user"]>) => set({ ...state, user: { ...state.user, ...u } });

export function clearDemoData() {
  const demoFarmIds = new Set(state.farms.filter((f) => f.id.startsWith("demo-")).map((f) => f.id));
  const data: State["data"] = {};
  for (const [k, rows] of Object.entries(state.data)) data[k] = rows.filter((r) => !demoFarmIds.has(r.farmId));
  const farms = state.farms.filter((f) => !demoFarmIds.has(f.id));
  set({ ...state, farms, data, demo: false, outbox: [], activeFarmId: farms[0]?.id ?? "" });
}

/** Erase everything on this device; the app returns to first-run setup. */
export function resetAll() {
  set(emptyState());
}

/** Optional sample farm for trying the app out. Never loaded automatically. */
export function loadDemo() {
  if (state.farms.some((f) => f.id === "demo-farm")) return set({ ...state, activeFarmId: "demo-farm" });
  const demo = seedDemo(emptyState());
  const data: State["data"] = { ...state.data };
  for (const [k, rows] of Object.entries(demo.data)) data[k] = [...(data[k] ?? []), ...rows];
  set({ ...state, farms: [...state.farms, ...demo.farms], data, activeFarmId: "demo-farm", demo: true });
}

export function markSynced(ids: string[]) {
  const done = new Set(ids);
  set({ ...state, outbox: state.outbox.filter((o) => !done.has(o.id)) });
}

export const newId = uid;
