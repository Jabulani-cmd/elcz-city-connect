import type { SupabaseClient } from "@supabase/supabase-js";
import { farmFromDb, farmToDb, ROLE_FROM_DB } from "./tables";
import type { Farm, Role } from "./types";

type Rec = Record<string, unknown>;

/** What the sync engine needs from a server. Implemented for Supabase below and faked in tests. */
export interface Remote {
  fetchFarms(): Promise<{ farms: Farm[]; roles: Record<string, Role> }>;
  upsertFarm(farm: Farm): Promise<void>;
  upsertRows(table: string, rows: Rec[]): Promise<void>;
  softDelete(table: string, ids: string[]): Promise<void>;
  fetchChanges(farmId: string, since: string | null): Promise<{ byTable: Record<string, Rec[]>; more: string[] }>;
  fetchTable(table: string, farmId: string, since: string | null, from: number, to: number): Promise<Rec[]>;
  uploadFile(path: string, blob: Blob): Promise<void>;
}

/** `permanent` = retrying will never help (permission, constraint, bad data). Everything else is retried later. */
export class RemoteError extends Error {
  constructor(message: string, public code?: string, public permanent = false) {
    super(message);
  }
}

const PERMANENT = /^(42|22|23)/; // Postgres: privilege/syntax, data exception, integrity violation
function wrap(e: { message?: string; code?: string; status?: number } | null): RemoteError | null {
  if (!e) return null;
  const permanent = !!e.code && PERMANENT.test(e.code);
  const message = e.code === "42501" ? "You don’t have permission to change this" : e.code === "23505" ? "Duplicate value (e.g. an animal ID that already exists)" : e.code === "23503" ? "Refers to a record that doesn’t exist on the server" : e.message ?? "Request failed";
  return new RemoteError(message, e.code, permanent);
}

export function supabaseRemote(sb: SupabaseClient): Remote {
  return {
    async fetchFarms() {
      const { data: auth } = await sb.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new RemoteError("Not signed in");
      const [farms, members] = await Promise.all([sb.from("farms").select("*"), sb.from("farm_members").select("farm_id, role").eq("user_id", uid)]);
      const err = wrap(farms.error) ?? wrap(members.error);
      if (err) throw err;
      const roles: Record<string, Role> = {};
      for (const m of members.data ?? []) roles[m.farm_id as string] = ROLE_FROM_DB[m.role as string] ?? "Viewer";
      return { farms: (farms.data ?? []).filter((f) => roles[f.id as string]).map((f) => farmFromDb(f as Rec) as Farm), roles };
    },
    async upsertFarm(farm) {
      const { error } = await sb.from("farms").upsert(farmToDb(farm as unknown as Rec), { onConflict: "id" });
      const e = wrap(error);
      if (e) throw e;
    },
    async upsertRows(table, rows) {
      const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
      const e = wrap(error);
      if (e) throw e;
    },
    async softDelete(table, ids) {
      const { error } = await sb.from(table).update({ deleted_at: new Date().toISOString() }).in("id", ids);
      const e = wrap(error);
      if (e) throw e;
    },
    async fetchChanges(farmId, since) {
      const { data, error } = await sb.rpc("farm_changes", { f: farmId, since, lim: 5000 });
      const e = wrap(error);
      if (e) throw e;
      return { byTable: (data?.tables ?? {}) as Record<string, Rec[]>, more: (data?.more ?? []) as string[] };
    },
    async fetchTable(table, farmId, since, from, to) {
      let q = sb.from(table).select("*").eq("farm_id", farmId);
      q = since ? q.gte("updated_at", since) : q.is("deleted_at", null);
      const { data, error } = await q.order("updated_at").order("id").range(from, to);
      const e = wrap(error);
      if (e) throw e;
      return (data ?? []) as Rec[];
    },
    async uploadFile(path, blob) {
      const { error } = await sb.storage.from("farm-files").upload(path, blob, { upsert: true, contentType: blob.type || undefined });
      if (error) throw new RemoteError(error.message, undefined, false);
    },
  };
}
