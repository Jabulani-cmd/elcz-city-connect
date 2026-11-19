import { describe, expect, it } from "vitest";
import type { Alert } from "./alerts";
import { alertsToSend, channelsFor, describeChange, eventsForSynced } from "./notify";
import type { OutboxItem, Row } from "./types";

const row = (extra: Partial<Row> = {}): Row => ({ id: "r1", farmId: "f1", createdAt: "2026-11-19T08:00:00.000Z", updatedAt: "2026-11-19T08:00:00.100Z", ...extra });
const item = (op: OutboxItem["op"], collection: string, rowId = "r1"): OutboxItem => ({ id: `o-${collection}-${rowId}`, op, collection, rowId, at: "" });

describe("describeChange", () => {
  it("says when a record was added, updated or removed", () => {
    expect(describeChange(item("upsert", "animals"), row({ tag: "0042", name: "Bessie" }))?.title).toBe("Added animal: 0042 · Bessie");
    expect(describeChange(item("upsert", "animals"), row({ tag: "0042", updatedAt: "2026-11-19T09:00:00.000Z" }))?.title).toBe("Updated animal: 0042");
    expect(describeChange(item("delete", "sales"))?.title).toMatch(/^Removed a /);
  });
  it("ignores bookkeeping records", () => {
    expect(describeChange(item("upsert", "prefs"), row())).toBeNull();
  });
});

describe("eventsForSynced", () => {
  it("skips sample data and farm profile entries", () => {
    const rows = new Map([["animals:r1", row({ tag: "1" })]]);
    const ev = eventsForSynced([item("upsert", "animals"), item("upsert", "__farms", "f1"), item("upsert", "animals", "demo-x")], (c, id) => rows.get(`${c}:${id}`));
    expect(ev).toHaveLength(1);
  });
});

describe("alerts", () => {
  const prefs = [{ ...row(), type: "channel", kind: "Vaccinations", whatsapp: true, sms: true }, { ...row({ id: "r2" }), type: "channel", kind: "Inventory", email: true }];
  const alert = (o: Partial<Alert>): Alert => ({ id: "a", kind: "Vaccinations", severity: "danger", title: "t", detail: "d", to: "/", area: "Livestock", ...o });
  it("reads the channels switched on for a kind", () => {
    expect(channelsFor("Vaccinations", prefs)).toEqual(["whatsapp", "sms"]);
    expect(channelsFor("Irrigation", prefs)).toEqual([]);
  });
  it("sends only urgent/soon alerts that have a channel, grouped by channel set", () => {
    const g = alertsToSend([alert({}), alert({ id: "b", severity: "info" }), alert({ id: "c", kind: "Inventory", severity: "warning" }), alert({ id: "d", kind: "Irrigation" })], prefs);
    expect([...g.keys()].sort()).toEqual(["email", "whatsapp,sms"]);
  });
  it("repeats overdue alerts daily but sends 'soon' ones once", () => {
    const [danger] = alertsToSend([alert({})], prefs).get("whatsapp,sms")!;
    const [soon] = alertsToSend([alert({ severity: "warning" })], prefs).get("whatsapp,sms")!;
    expect(danger.key).toMatch(/:danger:\d{4}-\d{2}-\d{2}$/);
    expect(soon.key).toBe("a:warning");
  });
});
