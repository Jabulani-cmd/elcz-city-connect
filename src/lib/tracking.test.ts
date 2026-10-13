import { describe, it, expect } from "vitest";
import { parseBatch, parseReading } from "../../supabase/functions/device-ingest/parse";
import { ago, clearedPosition, distanceM, freshness, isUsableFix, mayShare, positionValues, shouldPublish, withCoords } from "./tracking";

const T0 = Date.parse("2026-10-13T08:00:00Z");

describe("fix filtering", () => {
  it("rejects null island, out-of-range and imprecise fixes", () => {
    expect(isUsableFix({ lat: 0, lng: 0 })).toBe(false);
    expect(isUsableFix({ lat: 95, lng: 10 })).toBe(false);
    expect(isUsableFix({ lat: -20.15, lng: 28.58, accuracy: 900 })).toBe(false);
    expect(isUsableFix({ lat: -20.15, lng: 28.58, accuracy: 12 })).toBe(true);
  });
  it("measures distance in metres", () => {
    expect(Math.round(distanceM({ lat: -20, lng: 28 }, { lat: -20.001, lng: 28 }))).toBe(111);
  });
});

describe("shouldPublish throttling", () => {
  const a = { lat: -20.15, lng: 28.58, at: T0 };
  it("sends the first fix", () => expect(shouldPublish(null, a)).toBe(true));
  it("waits a minute between sends", () => expect(shouldPublish(a, { ...a, lat: -20.16, at: T0 + 30_000 })).toBe(false));
  it("skips a person standing still", () => expect(shouldPublish(a, { ...a, at: T0 + 120_000 })).toBe(false));
  it("sends after moving 25 m+", () => expect(shouldPublish(a, { lat: -20.1503, lng: 28.58, at: T0 + 120_000 })).toBe(true));
  it("sends a heartbeat after 10 minutes even if still", () => expect(shouldPublish(a, { ...a, at: T0 + 11 * 60_000 })).toBe(true));
});

describe("freshness", () => {
  const iso = (ms: number) => new Date(T0 - ms).toISOString();
  it("classifies age", () => {
    expect(freshness(iso(2 * 60_000), T0)).toBe("live");
    expect(freshness(iso(60 * 60_000), T0)).toBe("recent");
    expect(freshness(iso(5 * 3_600_000), T0)).toBe("stale");
    expect(freshness("", T0)).toBe("stale");
  });
  it("words it for people", () => {
    expect(ago(iso(20_000), T0)).toBe("just now");
    expect(ago(iso(5 * 60_000), T0)).toBe("5 min ago");
    expect(ago(iso(3 * 3_600_000), T0)).toBe("3 h ago");
    expect(ago(iso(2 * 86_400_000), T0)).toBe("2 d ago");
  });
});

describe("consent + clock-out privacy", () => {
  it("shares only when clocked in AND consented", () => {
    expect(mayShare(null)).toBe(false);
    expect(mayShare({ clockedInAt: "x" })).toBe(false);
    expect(mayShare({ clockedInAt: "x", consentAt: "y" })).toBe(true);
  });
  it("clocking out blanks the coordinates so they drop off the map", () => {
    const live = { id: "e1", farmId: "f", createdAt: "", updatedAt: "", ...positionValues("Employee", "e1", "Tendai", { lat: -20.15, lng: 28.58, accuracy: 9.4 }, "Phone") };
    expect(withCoords([live as never])).toHaveLength(1);
    const out = { ...live, ...clearedPosition("e1") };
    expect(withCoords([out as never])).toHaveLength(0);
  });
  it("uses the subject id as the row id (one last-known row per subject)", () => {
    const v = positionValues("Animal", "a1", "T-01", { lat: -20.1, lng: 28.5 }, "Manual check-in");
    expect(v.id).toBe("a1");
    expect(v.subjectType).toBe("Animal");
  });
});

describe("device ingest parsing", () => {
  it("accepts the generic shape and aliases", () => {
    const r = parseReading({ device_id: "A1", latitude: "-20.15", lon: 28.58, ts: "2026-10-13T08:00:00Z", battery: 120 }, T0);
    expect(r).toMatchObject({ deviceId: "A1", lat: -20.15, lng: 28.58, battery: 100, recordedAt: "2026-10-13T08:00:00.000Z" });
  });
  it("reads epoch seconds and milliseconds", () => {
    expect(parseReading({ deviceId: "A", lat: 1, lng: 1, ts: T0 / 1000 }, T0)?.recordedAt).toBe("2026-10-13T08:00:00.000Z");
    expect(parseReading({ deviceId: "A", lat: 1, lng: 1, ts: T0 }, T0)?.recordedAt).toBe("2026-10-13T08:00:00.000Z");
  });
  it("clamps future timestamps and drops junk", () => {
    expect(parseReading({ deviceId: "A", lat: 1, lng: 1, ts: T0 + 3_600_000 }, T0)?.recordedAt).toBe(new Date(T0).toISOString());
    expect(parseReading({ deviceId: "", lat: 1, lng: 1 }, T0)).toBeNull();
    expect(parseReading({ deviceId: "A", lat: 91, lng: 1 }, T0)).toBeNull();
    expect(parseReading({ deviceId: "A", lat: 0, lng: 0 }, T0)).toBeNull();
    expect(parseReading("nope", T0)).toBeNull();
  });
  it("takes one reading, an array, or {readings}", () => {
    const one = { deviceId: "A", lat: 1, lng: 1 };
    expect(parseBatch(one, T0)).toHaveLength(1);
    expect(parseBatch([one, one, { deviceId: "B" }], T0)).toHaveLength(2);
    expect(parseBatch({ readings: [one] }, T0)).toHaveLength(1);
  });
});
