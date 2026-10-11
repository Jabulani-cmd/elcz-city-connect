import { useMemo, useSyncExternalStore } from "react";
import type { Farm, OutboxItem, Role, Row } from "./types";
import { seedDemo } from "./seed";

export type FailedChange = { id: string; collection: string; rowId: string; message: string; at: string };

export type State = {
  version: number;
  farms: Farm[];
  activeFarmId: string;
  data: Record<string, Row[]>;
  outbox: OutboxItem[];
  user: { name: string; role: Role };
  demo: boolean;
  /** Role of the signed-in user on each farm (cloud mode). */
  roles: Record<string, Role>;
  /** Changes the server refused (e.g. no permission); kept so the user can see them. */
  failed: FailedChange[];
  /** Per-farm pull cursor (server `updated_at`). */
  cursors: Record<string, string>;
  lastSyncAt: string;
  adoptedLocal: boolean;
};

/** Collection name used in the outbox for farm profile rows. */
export const FARMS = "__farms";

export const LOCAL_KEY = "farmhelper.v1";
let storageKey: string | null = LOCAL_KEY;

const uid = () => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const now = () => new Date().toISOString();

export function emptyState(): State {
  return { version: 2, farms: [], activeFarmId: "", data: {}, outbox: [], user: { name: "Farm Owner", role: "Owner" }, demo: false, roles: {}, failed: [], cursors: {}, lastSyncAt: "", adoptedLocal: false };
}

/** Early versions auto-loaded a sample farm ("Green Valley Farm"). Remove it from data saved by those versions; real farms are kept. */
export function migrate(s: State): State {
  if ((s.version ?? 1) >= 2) return s;
  const demoIds = new Set(s.farms.filter((f) => f.id.startsWith("demo-")).map((f) => f.id));
  const data: State["data"] = {};
  for (const [k, rows] of Object.entries(s.data ?? {})) data[k] = rows.filter((r) => !demoIds.has(r.farmId));
  const farms = s.farms.filter((f) => !demoIds.has(f.id));
  return { ...s, version: 2, farms, data, demo: false, outbox: (s.outbox ?? []).filter((o) => !demoIds.has(o.rowId) && !String(o.rowId).startsWith("demo-")),
    activeFarmId: farms.some((f) => f.id === s.activeFarmId) ? s.activeFarmId : farms[0]?.id ?? "" };
}

function readKey(key: string): State | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return migrate({ ...emptyState(), ...JSON.parse(raw) });
  } catch {
    /* storage unavailable or corrupt */
  }
  return null;
}

let state: State = readKey(LOCAL_KEY) ?? emptyState();
const listeners = new Set<() => void>();

function persist() {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
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
export function subscribeState(fn: (s: State) => void): () => void {
  const l = () => fn(state);
  listeners.add(l);
  return () => { listeners.delete(l); };
}
export const useStore = <T,>(sel: (s: State) => T): T => useSyncExternalStore(subscribe, () => sel(state));

/* ---------- account scoping (cloud mode) ---------- */
/** Switch to the data saved for a signed-in user. */
export function attachUser(userId: string, name?: string) {
  storageKey = `${LOCAL_KEY}.u.${userId}`;
  const loaded = readKey(storageKey) ?? emptyState();
  if (name && loaded.user.name === "Farm Owner") loaded.user = { ...loaded.user, name };
  state = loaded;
  persist();
  listeners.forEach((l) => l());
}

/** Signed out: show nothing and write nothing. */
export function detachUser() {
  storageKey = null;
  state = emptyState();
  listeners.forEach((l) => l());
}

/** Back to the on-device (no sign-in) data. */
export function attachLocal() {
  storageKey = LOCAL_KEY;
  state = readKey(LOCAL_KEY) ?? emptyState();
  listeners.forEach((l) => l());
}

/** Farm data saved on this device before the user signed in (excluding sample data). */
export function localDeviceData(): State | null {
  const s = readKey(LOCAL_KEY);
  if (!s) return null;
  const farms = s.farms.filter((f) => !f.id.startsWith("demo-"));
  return farms.length ? { ...s, farms } : null;
}

/** Copy the on-device data into the signed-in account and queue it for upload. */
export function adoptLocalData(): number {
  const local = localDeviceData();
  if (!local) return 0;
  const farmIds = new Set(local.farms.map((f) => f.id));
  const data: State["data"] = { ...state.data };
  const outbox = [...state.outbox];
  let count = 0;
  for (const f of local.farms) if (!state.farms.some((x) => x.id === f.id)) outbox.push({ id: uid(), op: "upsert", collection: FARMS, rowId: f.id, at: now() });
  for (const [c, rows] of Object.entries(local.data)) {
    if (c === "audit") continue;
    const mine = rows.filter((r) => farmIds.has(r.farmId));
    const have = new Set((data[c] ?? []).map((r) => r.id));
    const add = mine.filter((r) => !have.has(r.id));
    if (!add.length) continue;
    data[c] = [...(data[c] ?? []), ...add];
    for (const r of add) outbox.push({ id: uid(), op: "upsert", collection: c, rowId: r.id, at: now() });
    count += add.length;
  }
  const farms = [...state.farms, ...local.farms.filter((f) => !state.farms.some((x) => x.id === f.id))];
  const roles = { ...state.roles };
  for (const f of local.farms) roles[f.id] = roles[f.id] ?? "Owner";
  set({ ...state, farms, data, outbox, roles, adoptedLocal: true, activeFarmId: state.activeFarmId || farms[0]?.id || "" });
  return count;
}
export const dismissAdopt = () => set({ ...state, adoptedLocal: true });

/* ---------- reads ---------- */
export const rowsOf = (collection: string, s: State = state): Row[] =>
  (s.data[collection] ?? []).filter((r) => r.farmId === s.activeFarmId);

export function useRows(collection: string): Row[] {
  const all = useStore((s) => s.data[collection]);
  const farmId = useStore((s) => s.activeFarmId);
  return useMemo(() => (all ?? []).filter((r) => r.farmId === farmId), [all, farmId]);
}

export const useFarm = (): Farm | undefined => useStore((s) => s.farms.find((f) => f.id === s.activeFarmId));
export const useFarms = () => useStore((s) => s.farms);
export const useUser = () => useStore((s) => s.user);
export const usePendingCount = () => useStore((s) => s.outbox.length);

/* ---------- writes ---------- */
function queue(s: State, op: OutboxItem["op"], collection: string, rowId: string): OutboxItem[] {
  const rest = s.outbox.filter((o) => !(o.collection === collection && o.rowId === rowId));
  return [...rest, { id: uid(), op, collection, rowId, at: now() }];
}

function audit(s: State, action: string, collection: string, rowId: string, summary: string): Row[] {
  const entry: Row = { id: uid(), farmId: s.activeFarmId, createdAt: now(), updatedAt: now(), action, collection, rowId, summary, user: `${s.user.name} (${s.user.role})` };
  return [entry, ...(s.data.audit ?? [])].slice(0, 1000);
}

export function upsert(collection: string, values: Partial<Row>): Row {
  const s = state;
  const existing = values.id ? (s.data[collection] ?? []).find((r) => r.id === values.id) : undefined;
  const row: Row = existing
    ? { ...existing, ...values, updatedAt: now() }
    : ({ id: uid(), farmId: s.activeFarmId, createdAt: now(), updatedAt: now(), ...values } as Row);
  const list = existing ? (s.data[collection] ?? []).map((r) => (r.id === row.id ? row : r)) : [...(s.data[collection] ?? []), row];
  const next: State = { ...s, data: { ...s.data, [collection]: list }, outbox: queue(s, "upsert", collection, row.id) };
  if (collection !== "audit") next.data.audit = audit(s, existing ? "update" : "create", collection, row.id, row.name || row.tag || row.title || row.description || row.id);
  set(next);
  return row;
}

export function remove(collection: string, id: string) {
  const s = state;
  const next: State = { ...s, data: { ...s.data, [collection]: (s.data[collection] ?? []).filter((r) => r.id !== id) }, outbox: queue(s, "delete", collection, id) };
  next.data.audit = audit(s, "delete", collection, id, id);
  set(next);
}

export function createFarm(values: Partial<Farm>): Farm {
  const farm: Farm = {
    id: uid(), name: "New farm", location: "", latitude: "", longitude: "", sizeHa: 0, farmType: "Mixed", manager: "", phone: "", email: "",
    registration: "", description: "", agriHa: 0, pastureHa: 0, createdAt: now(), ...values,
  };
  set({ ...state, farms: [...state.farms, farm], activeFarmId: farm.id, roles: { ...state.roles, [farm.id]: "Owner" }, user: { ...state.user, role: "Owner" }, outbox: queue(state, "upsert", FARMS, farm.id) });
  return farm;
}

export function updateFarm(id: string, values: Partial<Farm>) {
  set({ ...state, farms: state.farms.map((f) => (f.id === id ? { ...f, ...values } : f)), outbox: queue(state, "upsert", FARMS, id) });
}

export const setActiveFarm = (id: string) => set({ ...state, activeFarmId: id, user: { ...state.user, role: state.roles[id] ?? state.user.role } });
export const setUser = (u: Partial<State["user"]>) => set({ ...state, user: { ...state.user, ...u } });

export function clearDemoData() {
  const demoFarmIds = new Set(state.farms.filter((f) => f.id.startsWith("demo-")).map((f) => f.id));
  const data: State["data"] = {};
  for (const [k, rows] of Object.entries(state.data)) data[k] = rows.filter((r) => !demoFarmIds.has(r.farmId));
  const farms = state.farms.filter((f) => !demoFarmIds.has(f.id));
  set({ ...state, farms, data, demo: false, outbox: state.outbox.filter((o) => !demoFarmIds.has(o.rowId)), activeFarmId: farms[0]?.id ?? "" });
}

/** Erase everything on this device; the app returns to first-run setup. */
export function resetAll() {
  set(emptyState());
}

/** Optional sample farm for trying the app out. Local mode only – sample data is never uploaded. */
export function loadDemo() {
  if (state.farms.some((f) => f.id === "demo-farm")) return set({ ...state, activeFarmId: "demo-farm" });
  const demo = seedDemo(emptyState());
  const data: State["data"] = { ...state.data };
  for (const [k, rows] of Object.entries(demo.data)) data[k] = [...(data[k] ?? []), ...rows];
  set({ ...state, farms: [...state.farms, ...demo.farms], data, activeFarmId: "demo-farm", demo: true });
}

/* ---------- sync hooks (used by sync.ts) ---------- */
export function markSynced(ids: string[]) {
  const done = new Set(ids);
  set({ ...state, outbox: state.outbox.filter((o) => !done.has(o.id)) });
}

/** The server refused these changes for good; drop them from the queue but keep a record. */
export function markFailed(items: { item: OutboxItem; message: string }[]) {
  if (!items.length) return;
  const gone = new Set(items.map((i) => i.item.id));
  const failed = [...items.map((i) => ({ id: i.item.id, collection: i.item.collection, rowId: i.item.rowId, message: i.message, at: now() })), ...state.failed].slice(0, 50);
  set({ ...state, outbox: state.outbox.filter((o) => !gone.has(o.id)), failed });
}
export const clearFailed = () => set({ ...state, failed: [] });

/** Put refused changes back in the queue (e.g. after the owner changed your role). */
export function retryFailed() {
  const outbox = [...state.outbox];
  for (const f of state.failed) if ((state.data[f.collection] ?? []).some((r) => r.id === f.rowId) || f.collection === FARMS) outbox.push({ id: uid(), op: "upsert", collection: f.collection, rowId: f.rowId, at: now() });
  set({ ...state, outbox, failed: [] });
}

/** Update a stored row without queueing it for upload (e.g. after a file upload). */
export function patchLocal(collection: string, id: string, patch: Partial<Row>) {
  set({ ...state, data: { ...state.data, [collection]: (state.data[collection] ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)) } });
}

export type RemoteBatch = {
  farms?: Farm[];
  roles?: Record<string, Role>;
  rows?: Record<string, Row[]>;
  deleted?: Record<string, string[]>;
  cursors?: Record<string, string>;
};

/** Merge what the server sent. Rows with unsent local edits are left alone (they win, then upload). */
export function applyRemote(b: RemoteBatch) {
  const pending = new Set(state.outbox.map((o) => `${o.collection}:${o.rowId}`));
  const data = { ...state.data };
  for (const [c, rows] of Object.entries(b.rows ?? {})) {
    const byId = new Map((data[c] ?? []).map((r) => [r.id, r]));
    for (const r of rows) if (!pending.has(`${c}:${r.id}`)) byId.set(r.id, r);
    data[c] = [...byId.values()];
  }
  for (const [c, ids] of Object.entries(b.deleted ?? {})) {
    const gone = new Set(ids.filter((id) => !pending.has(`${c}:${id}`)));
    if (gone.size) data[c] = (data[c] ?? []).filter((r) => !gone.has(r.id));
  }
  let farms = state.farms;
  if (b.farms) {
    const remote = new Map(b.farms.map((f) => [f.id, f]));
    const keepLocal = state.farms.filter((f) => !remote.has(f.id) && (f.id.startsWith("demo-") || pending.has(`${FARMS}:${f.id}`)));
    farms = [...b.farms.map((f) => (pending.has(`${FARMS}:${f.id}`) ? state.farms.find((x) => x.id === f.id) ?? f : f)), ...keepLocal];
  }
  const roles = { ...state.roles, ...(b.roles ?? {}) };
  const activeFarmId = farms.some((f) => f.id === state.activeFarmId) ? state.activeFarmId : farms[0]?.id ?? "";
  set({ ...state, data, farms, roles, activeFarmId, cursors: { ...state.cursors, ...(b.cursors ?? {}) }, user: { ...state.user, role: roles[activeFarmId] ?? state.user.role }, lastSyncAt: now() });
}

/** Re-queue everything for upload (e.g. after fixing permissions). */
export function requeueAll() {
  const outbox = [...state.outbox];
  for (const f of state.farms) if (!f.id.startsWith("demo-")) outbox.push({ id: uid(), op: "upsert", collection: FARMS, rowId: f.id, at: now() });
  for (const [c, rows] of Object.entries(state.data)) if (c !== "audit") for (const r of rows) if (!r.farmId.startsWith("demo-")) outbox.push({ id: uid(), op: "upsert", collection: c, rowId: r.id, at: now() });
  set({ ...state, outbox });
}

export const newId = uid;
