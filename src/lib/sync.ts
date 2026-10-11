import { useEffect, useState, useSyncExternalStore } from "react";
import type { Remote } from "./remote";
import { RemoteError } from "./remote";
import { applyRemote, FARMS, getState, markFailed, markSynced, patchLocal, subscribeState, type State } from "./store";
import { COLLECTION_OF_TABLE, fieldsOf, fromDb, SYNC_ORDER, TABLES, toDb } from "./tables";
import type { OutboxItem, Row } from "./types";

/**
 * Local-first sync. Every change is saved on the device first and queued in the outbox; this engine drains the queue to
 * the server (parents before children, deletes last) and pulls what other people changed. Rows with unsent local edits
 * are never overwritten by a pull.
 */
export type SyncStatus = { state: "idle" | "syncing" | "error" | "offline"; error: string; lastSyncAt: string };

let status: SyncStatus = { state: "idle", error: "", lastSyncAt: "" };
const subs = new Set<() => void>();
const setStatus = (s: Partial<SyncStatus>) => { status = { ...status, ...s }; subs.forEach((f) => f()); };
export const useSyncStatus = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => status);

export type SyncDeps = {
  remote: Remote;
  /** Reads a locally stored file for upload. */
  readFile: (fileId: string) => Promise<Blob | undefined>;
  online?: () => boolean;
};

const CHUNK = 200;
const OVERLAP_MS = 2 * 60_000; // pull a little before the cursor: transactions commit out of order
const chunks = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, (i + 1) * n));
const isDemoId = (id: string) => id.startsWith("demo-");
const isTransient = (e: unknown) => !(e instanceof RemoteError && e.permanent);
const msg = (e: unknown) => (e instanceof Error ? e.message : "Sync failed");

export function createSyncEngine(deps: SyncDeps) {
  const { remote } = deps;
  let running = false;

  async function uploadFiles(collection: string, row: Row): Promise<Row> {
    let out = row;
    for (const f of fieldsOf(collection)) {
      const v = row[f.key];
      if (f.type !== "file" || !v || typeof v !== "object" || !v.fileId || v.path) continue;
      const blob = await deps.readFile(v.fileId);
      if (!blob) continue; // file lives on another device; nothing to upload from here
      const path = `${row.farmId}/${v.fileId}`;
      await remote.uploadFile(path, blob);
      const next = { ...v, path };
      patchLocal(collection, row.id, { [f.key]: next });
      out = { ...out, [f.key]: next };
    }
    return out;
  }

  /** Send one batch; on a permanent failure retry row-by-row so one bad record doesn't block the rest. */
  async function sendRows(collection: string, items: { item: OutboxItem; row: Row }[]) {
    const table = TABLES[collection];
    const failed: { item: OutboxItem; message: string }[] = [];
    for (const group of chunks(items, CHUNK)) {
      try {
        await remote.upsertRows(table, group.map((g) => toDb(collection, g.row)));
        markSynced(group.map((g) => g.item.id));
      } catch (e) {
        if (isTransient(e)) throw e;
        for (const g of group) {
          try { await remote.upsertRows(table, [toDb(collection, g.row)]); markSynced([g.item.id]); }
          catch (e2) { if (isTransient(e2)) throw e2; failed.push({ item: g.item, message: msg(e2) }); }
        }
      }
    }
    markFailed(failed);
  }

  async function push() {
    const outbox = [...getState().outbox];
    const drop: string[] = [];
    // farm profiles first (every data row belongs to a farm)
    for (const it of outbox.filter((o) => o.collection === FARMS)) {
      const farm = getState().farms.find((f) => f.id === it.rowId);
      if (!farm || isDemoId(farm.id)) { drop.push(it.id); continue; }
      try { await remote.upsertFarm(farm); markSynced([it.id]); }
      catch (e) { if (isTransient(e)) throw e; markFailed([{ item: it, message: msg(e) }]); }
    }
    for (const collection of SYNC_ORDER) {
      const items: { item: OutboxItem; row: Row }[] = [];
      for (const it of outbox.filter((o) => o.collection === collection && o.op === "upsert")) {
        const row = (getState().data[collection] ?? []).find((r) => r.id === it.rowId);
        if (!row || isDemoId(row.farmId) || isDemoId(row.id)) { drop.push(it.id); continue; }
        items.push({ item: it, row: await uploadFiles(collection, row) });
      }
      if (items.length) await sendRows(collection, items);
    }
    for (const collection of [...SYNC_ORDER].reverse()) {
      const dels = outbox.filter((o) => o.collection === collection && o.op === "delete");
      const real = dels.filter((d) => !isDemoId(d.rowId));
      drop.push(...dels.filter((d) => isDemoId(d.rowId)).map((d) => d.id));
      for (const group of chunks(real, CHUNK)) {
        try { await remote.softDelete(TABLES[collection], group.map((g) => g.rowId)); markSynced(group.map((g) => g.id)); }
        catch (e) { if (isTransient(e)) throw e; markFailed(group.map((item) => ({ item, message: msg(e) }))); }
      }
    }
    // outbox entries we can never send (sample data, unknown collections)
    const known = new Set([...SYNC_ORDER, FARMS]);
    drop.push(...outbox.filter((o) => !known.has(o.collection)).map((o) => o.id));
    if (drop.length) markSynced(drop);
  }

  async function pull() {
    const { farms, roles } = await remote.fetchFarms();
    applyRemote({ farms, roles });
    for (const farm of getState().farms.filter((f) => !isDemoId(f.id))) {
      if (!roles[farm.id]) continue;
      const cursor = getState().cursors[farm.id];
      const since = cursor ? new Date(new Date(cursor).getTime() - OVERLAP_MS).toISOString() : null;
      const { byTable, more } = await remote.fetchChanges(farm.id, since);
      for (const table of more) { // a very large table: page through it instead
        const all: Record<string, unknown>[] = [];
        for (let from = 0; ; from += 1000) { const page = await remote.fetchTable(table, farm.id, since, from, from + 999); all.push(...page); if (page.length < 1000) break; }
        byTable[table] = all;
      }
      const rows: Record<string, Row[]> = {};
      const deleted: Record<string, string[]> = {};
      let max = cursor ? new Date(cursor).getTime() : 0;
      for (const [table, list] of Object.entries(byTable)) {
        const collection = COLLECTION_OF_TABLE[table];
        if (!collection) continue;
        for (const d of list) {
          const t = new Date(d.updated_at as string).getTime();
          if (t > max) max = t;
          if (d.deleted_at) (deleted[collection] ??= []).push(d.id as string);
          else (rows[collection] ??= []).push(fromDb(collection, d));
        }
      }
      applyRemote({ rows, deleted, cursors: max ? { [farm.id]: new Date(max).toISOString() } : {} });
    }
  }

  async function syncNow(): Promise<boolean> {
    if (running) return false;
    if (deps.online && !deps.online()) { setStatus({ state: "offline" }); return false; }
    running = true;
    setStatus({ state: "syncing", error: "" });
    try {
      await push();
      await pull();
      setStatus({ state: "idle", error: "", lastSyncAt: getState().lastSyncAt });
      return true;
    } catch (e) {
      setStatus({ state: deps.online && !deps.online() ? "offline" : "error", error: msg(e) });
      return false;
    } finally {
      running = false;
    }
  }

  /** Sync now, and again whenever changes are made, the app regains focus/connection, or every minute. */
  function start(): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastPending = getState().outbox.length;
    const soon = (ms = 1500) => { clearTimeout(timer); timer = setTimeout(() => { void syncNow(); }, ms); };
    const unsubscribe = subscribeState((s: State) => { if (s.outbox.length !== lastPending) { lastPending = s.outbox.length; if (lastPending > 0) soon(); } });
    const onOnline = () => soon(200);
    const onVisible = () => { if (document.visibilityState === "visible") soon(300); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => { if (document.visibilityState === "visible") void syncNow(); }, 60_000);
    void syncNow();
    return () => { clearTimeout(timer); clearInterval(interval); unsubscribe(); window.removeEventListener("online", onOnline); document.removeEventListener("visibilitychange", onVisible); };
  }

  return { syncNow, start, push, pull };
}

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
}

/* Registered by the app once a signed-in session exists. */
let engine: ReturnType<typeof createSyncEngine> | null = null;
export const setSyncEngine = (e: typeof engine) => { engine = e; };
export const syncNow = () => (engine ? engine.syncNow() : Promise.resolve(false));
export const hasSyncAdapter = () => engine !== null;
