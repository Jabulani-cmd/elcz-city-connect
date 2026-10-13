// Pure helpers for the device-ingest function (no Deno APIs, so they are unit-tested from src/lib/tracking.test.ts).

export type Reading = { deviceId: string; lat: number; lng: number; accuracy: number | null; battery: number | null; recordedAt: string };

const num = (v: unknown) => (v === null || v === undefined || v === "" ? NaN : Number(v));

/** Accepts the generic shape {deviceId, lat, lng, ts?, accuracy?, battery?}; `ts` may be ISO text or epoch seconds/milliseconds. Returns null when unusable. */
export function parseReading(raw: unknown, nowMs = Date.now()): Reading | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const deviceId = String(r.deviceId ?? r.device_id ?? r.imei ?? "").trim();
  const lat = num(r.lat ?? r.latitude), lng = num(r.lng ?? r.lon ?? r.longitude);
  if (!deviceId || deviceId.length > 64) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
  let t = nowMs;
  const ts = r.ts ?? r.timestamp ?? r.time;
  if (ts !== undefined && ts !== null && ts !== "") {
    const n = typeof ts === "number" || /^\d+(\.\d+)?$/.test(String(ts)) ? Number(ts) : Date.parse(String(ts));
    if (!Number.isFinite(n)) return null;
    t = n < 1e11 ? n * 1000 : n; // epoch seconds vs milliseconds
  }
  if (t > nowMs + 5 * 60_000) t = nowMs; // clocks drift; never store the future
  const accuracy = num(r.accuracy), battery = num(r.battery);
  return { deviceId, lat, lng, accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null, battery: Number.isFinite(battery) ? Math.min(100, Math.max(0, Math.round(battery))) : null, recordedAt: new Date(t).toISOString() };
}

/** One reading, an array, or {readings: [...]}; capped so one request cannot be huge. */
export function parseBatch(body: unknown, nowMs = Date.now()): Reading[] {
  const list = Array.isArray(body) ? body : body && typeof body === "object" && Array.isArray((body as { readings?: unknown }).readings) ? (body as { readings: unknown[] }).readings : [body];
  return list.slice(0, 500).map((x) => parseReading(x, nowMs)).filter((x): x is Reading => !!x);
}
