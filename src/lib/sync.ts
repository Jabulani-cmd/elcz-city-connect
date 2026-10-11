import { useEffect, useState } from "react";
import { getState, markSynced } from "./store";
import type { OutboxItem } from "./types";

/**
 * Every change is written to this device first and queued in the outbox.
 * A SyncAdapter (e.g. one that talks to the Supabase schema in /supabase) drains the queue
 * whenever the browser is online. With no adapter registered the data simply stays on the device.
 */
export type SyncAdapter = (items: OutboxItem[], snapshot: ReturnType<typeof getState>) => Promise<string[]>;

let adapter: SyncAdapter | null = null;
let running = false;

export const registerSyncAdapter = (a: SyncAdapter | null) => { adapter = a; };
export const hasSyncAdapter = () => adapter !== null;

export async function syncNow(): Promise<number> {
  if (!adapter || running || !navigator.onLine) return 0;
  const { outbox } = getState();
  if (!outbox.length) return 0;
  running = true;
  try {
    const done = await adapter(outbox, getState());
    markSynced(done);
    return done.length;
  } finally {
    running = false;
  }
}

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => { setOnline(true); void syncNow().catch(() => undefined); };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
}
