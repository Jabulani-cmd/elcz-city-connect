import { beforeEach, describe, expect, it } from "vitest";
import type { Remote } from "./remote";
import { RemoteError } from "./remote";
import { seedDemo } from "./seed";
import { adoptLocalData, attachUser, createFarm, detachUser, getState, remove, upsert } from "./store";
import { createSyncEngine } from "./sync";
import { COLLECTION_OF_TABLE, fromDb, TABLES, toDb } from "./tables";
import type { Farm, Role, Row } from "./types";

type Rec = Record<string, unknown>;
const T = (c: string) => TABLES[c];

/** An in-memory stand-in for the server: tables, farms, soft deletes, a server clock. */
class FakeServer implements Remote {
  farms = new Map<string, Farm>();
  roles: Record<string, Role> = {};
  tables = new Map<string, Map<string, Rec>>();
  clock = Date.parse("2026-10-12T08:00:00Z");
  calls: string[] = [];
  failWith: (() => Error | null) | null = null;
  tick() { this.clock += 1000; return new Date(this.clock).toISOString(); }
  private t(name: string) { return this.tables.get(name) ?? this.tables.set(name, new Map()).get(name)!; }
  async fetchFarms() { return { farms: [...this.farms.values()], roles: this.roles }; }
  async upsertFarm(f: Farm) { this.calls.push("farm"); this.farms.set(f.id, f); this.roles[f.id] = "Owner"; }
  async upsertRows(table: string, rows: Rec[]) {
    const err = this.failWith?.(); if (err) throw err;
    this.calls.push(`upsert:${table}`);
    for (const r of rows) this.t(table).set(r.id as string, { ...this.t(table).get(r.id as string), ...r, updated_at: this.tick(), deleted_at: null });
  }
  async softDelete(table: string, ids: string[]) { this.calls.push(`delete:${table}`); for (const id of ids) { const r = this.t(table).get(id); if (r) this.t(table).set(id, { ...r, deleted_at: "x", updated_at: this.tick() }); } }
  async fetchChanges(farmId: string, since: string | null) {
    const byTable: Record<string, Rec[]> = {};
    for (const [name, rows] of this.tables) {
      const list = [...rows.values()].filter((r) => r.farm_id === farmId && (since ? (r.updated_at as string) >= since : !r.deleted_at));
      if (list.length) byTable[name] = list;
    }
    return { byTable, more: [] };
  }
  async fetchTable() { return []; }
  async uploadFile() { /* noop */ }
}
const iso = (r: Rec) => ({ ...r, updated_at: typeof r.updated_at === "string" ? r.updated_at : new Date(r.updated_at as number).toISOString() });

const engine = (s: FakeServer) => createSyncEngine({ remote: { ...s, fetchFarms: () => s.fetchFarms(), upsertFarm: (f) => s.upsertFarm(f), upsertRows: (t, r) => s.upsertRows(t, r), softDelete: (t, i) => s.softDelete(t, i), fetchChanges: async (f, since) => { const r = await s.fetchChanges(f, since); for (const k of Object.keys(r.byTable)) r.byTable[k] = r.byTable[k].map(iso); return r; }, fetchTable: () => s.fetchTable(), uploadFile: () => s.uploadFile() }, readFile: async () => undefined, online: () => true });

beforeEach(() => { localStorage.clear(); attachUser(`u-${Math.random()}`); });

describe("row codec", () => {
  it("round-trips every collection of the sample farm", () => {
    const demo = seedDemo({ ...getState() });
    let n = 0;
    for (const [collection, rows] of Object.entries(demo.data)) {
      if (!TABLES[collection]) continue;
      for (const row of rows) {
        const back = fromDb(collection, { ...toDb(collection, row), updated_at: "2026-10-12T08:00:00+00:00" });
        for (const [k, v] of Object.entries(row)) {
          if (k === "updatedAt" || v === undefined || v === "") continue;
          if (typeof v === "string" && /^demo-/.test(v)) continue; // sample ids are not UUIDs
          expect(back[k], `${collection}.${k}`).toEqual(v);
        }
        n++;
      }
    }
    expect(n).toBeGreaterThan(300);
  });
  it("keeps unknown keys in extra and blanks become null", () => {
    const d = toDb("weights", { id: "i", farmId: "f", createdAt: "c", updatedAt: "u", animalId: "not-a-uuid", weight: "", adg: 0.4, days: 12 } as Row);
    expect(d.animal_id).toBeNull();
    expect(d.weight).toBeNull();
    expect(d.extra).toEqual({ adg: 0.4, days: 12 });
  });
});

describe("sync engine", () => {
  const setup = () => { const farm = createFarm({ name: "Test" }); const server = new FakeServer(); return { farm, server, eng: engine(server) }; };

  it("uploads the farm before its data and parents before children", async () => {
    const { server, eng } = setup();
    const a = upsert("animals", { tag: "A1", category: "Cow" });
    upsert("weights", { animalId: a.id, date: "2026-01-01", weight: 300 });
    expect(await eng.syncNow()).toBe(true);
    expect(server.calls.indexOf("farm")).toBeLessThan(server.calls.indexOf("upsert:animals"));
    expect(server.calls.indexOf("upsert:animals")).toBeLessThan(server.calls.indexOf("upsert:weight_records"));
    expect(getState().outbox).toHaveLength(0);
  });

  it("pulls another device's changes and soft-deletes", async () => {
    const { server, farm, eng } = setup();
    const a = upsert("animals", { tag: "A1", category: "Cow" });
    await eng.syncNow();
    // another device edits the animal and adds one
    server.tables.get(T("animals"))!.set(a.id, { ...server.tables.get(T("animals"))!.get(a.id)!, tag: "A1-renamed", updated_at: server.tick() });
    const other = crypto.randomUUID();
    server.tables.get(T("animals"))!.set(other, { id: other, farm_id: farm.id, tag: "B2", extra: {}, created_at: "2026-01-01T00:00:00Z", updated_at: server.tick(), deleted_at: null });
    await eng.syncNow();
    expect(getState().data.animals.map((r) => r.tag).sort()).toEqual(["A1-renamed", "B2"]);
    // …and deletes B2
    server.tables.get(T("animals"))!.set(other, { ...server.tables.get(T("animals"))!.get(other)!, deleted_at: "x", updated_at: server.tick() });
    await eng.syncNow();
    expect(getState().data.animals.map((r) => r.tag)).toEqual(["A1-renamed"]);
  });

  it("deleting locally soft-deletes on the server", async () => {
    const { server, eng } = setup();
    const a = upsert("animals", { tag: "A1" });
    await eng.syncNow();
    remove("animals", a.id);
    await eng.syncNow();
    expect(server.tables.get(T("animals"))!.get(a.id)!.deleted_at).toBeTruthy();
    expect(getState().outbox).toHaveLength(0);
  });

  it("an unsent local edit is not overwritten by a pull", async () => {
    const { server, eng } = setup();
    const a = upsert("animals", { tag: "A1" });
    await eng.syncNow();
    server.tables.get(T("animals"))!.set(a.id, { ...server.tables.get(T("animals"))!.get(a.id)!, tag: "SERVER", updated_at: server.tick() });
    upsert("animals", { id: a.id, tag: "LOCAL" });
    await eng.pull();
    expect(getState().data.animals[0].tag).toBe("LOCAL");
  });

  it("network failures keep changes queued and retry", async () => {
    const { server, eng } = setup();
    upsert("animals", { tag: "A1" });
    server.failWith = () => new RemoteError("Failed to fetch");
    expect(await eng.syncNow()).toBe(false);
    expect(getState().outbox.length).toBeGreaterThan(0);
    expect(getState().failed).toHaveLength(0);
    server.failWith = null;
    expect(await eng.syncNow()).toBe(true);
    expect(getState().outbox).toHaveLength(0);
  });

  it("a refused change is reported and does not block the rest", async () => {
    const { server, eng } = setup();
    const bad = upsert("income", { date: "2026-01-01", amount: 5, category: "Crop sales", description: "x" });
    upsert("animals", { tag: "OK" });
    server.failWith = () => null;
    const orig = server.upsertRows.bind(server);
    server.upsertRows = async (table, rows) => { if (table === T("income")) throw new RemoteError("You don’t have permission to change this", "42501", true); return orig(table, rows); };
    expect(await eng.syncNow()).toBe(true);
    expect(getState().failed.map((f) => f.rowId)).toEqual([bad.id]);
    expect(getState().outbox).toHaveLength(0);
    expect(server.tables.get(T("animals"))!.size).toBe(1);
  });

  it("never uploads sample-farm data", async () => {
    const { server, eng } = setup();
    const demo = seedDemo(getState());
    expect(demo.farms[0].id).toMatch(/^demo-/);
    await eng.syncNow();
    expect([...server.farms.keys()].some((id) => id.startsWith("demo-"))).toBe(false);
  });

  it("adopts on-device data into the account and uploads it", async () => {
    detachUser();
    localStorage.clear();
    const local = { ...getState(), version: 2 };
    const f = { id: crypto.randomUUID(), name: "Home farm", location: "", latitude: "", longitude: "", sizeHa: 5, farmType: "Mixed", manager: "", phone: "", email: "", registration: "", description: "", agriHa: 0, pastureHa: 0, createdAt: "x" } as Farm;
    const animalId = crypto.randomUUID();
    localStorage.setItem("farmhelper.v1", JSON.stringify({ ...local, farms: [f], data: { animals: [{ id: animalId, farmId: f.id, createdAt: "x", updatedAt: "x", tag: "L1" }] } }));
    attachUser("u-adopt");
    expect(adoptLocalData()).toBe(1);
    const server = new FakeServer();
    await engine(server).syncNow();
    expect(server.farms.has(f.id)).toBe(true);
    expect(server.tables.get(T("animals"))!.has(animalId)).toBe(true);
  });

  it("maps every table back to a collection", () => {
    for (const [c, t] of Object.entries(TABLES)) expect(COLLECTION_OF_TABLE[t]).toBe(c);
  });
});

describe("migration of data saved by early versions", () => {
  it("removes the auto-loaded sample farm but keeps real farms", async () => {
    const { attachLocal } = await import("./store");
    const demo = seedDemo({ ...getState() });
    const real = { id: crypto.randomUUID(), name: "Real farm", location: "", latitude: "", longitude: "", sizeHa: 1, farmType: "Mixed", manager: "", phone: "", email: "", registration: "", description: "", agriHa: 0, pastureHa: 0, createdAt: "x" } as Farm;
    const animal = { id: crypto.randomUUID(), farmId: real.id, createdAt: "x", updatedAt: "x", tag: "R1" };
    localStorage.setItem("farmhelper.v1", JSON.stringify({ ...demo, version: 1, farms: [...demo.farms, real], activeFarmId: "demo-farm", data: { ...demo.data, animals: [...demo.data.animals, animal] } }));
    attachLocal();
    const s = getState();
    expect(s.farms.map((f) => f.name)).toEqual(["Real farm"]);
    expect(s.activeFarmId).toBe(real.id);
    expect(s.demo).toBe(false);
    expect(Object.values(s.data).flat().every((r) => r.farmId === real.id)).toBe(true);
    expect(s.data.animals.map((a) => a.tag)).toEqual(["R1"]);
  });
  it("does not touch sample data a user explicitly loaded in the current version", async () => {
    const { attachLocal, loadDemo, resetAll } = await import("./store");
    resetAll(); loadDemo();
    localStorage.setItem("farmhelper.v1", JSON.stringify(getState()));
    attachLocal();
    expect(getState().farms.some((f) => f.id === "demo-farm")).toBe(true);
  });
});
