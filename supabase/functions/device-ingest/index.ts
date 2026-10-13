// Supabase Edge Function: receive GPS positions from collars, ear tags or any tracker/gateway that can POST JSON.
//   POST /functions/v1/device-ingest      header  x-ingest-key: <farm ingest key>
//   body  {"deviceId":"A123","lat":-20.15,"lng":28.58,"ts":"2026-10-13T08:00:00Z","accuracy":8,"battery":81}
//         (or an array of those, or {"readings":[...]}). The deviceId must match "GPS collar / tag device ID" on an animal.
// Deploy:  supabase functions deploy device-ingest --no-verify-jwt     (trackers cannot sign in; the ingest key authenticates them)
// Secrets: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
// Keys:    see the device_ingest_keys table (migration 20261013000000); only the SHA-256 hash is stored.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseBatch } from "./parse.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const sha256 = async (s: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  const key = req.headers.get("x-ingest-key")?.trim();
  if (!key) return reply(401, { error: "missing x-ingest-key" });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: k } = await sb.from("device_ingest_keys").select("farm_id").eq("key_hash", await sha256(key)).is("revoked_at", null).maybeSingle();
  if (!k) return reply(401, { error: "invalid key" });

  let body: unknown;
  try { body = await req.json(); } catch { return reply(400, { error: "invalid JSON" }); }
  const readings = parseBatch(body);
  if (!readings.length) return reply(400, { error: "no valid readings (need deviceId, lat, lng)" });

  // newest reading per device wins
  const latest = new Map<string, (typeof readings)[number]>();
  for (const r of readings) if (!latest.has(r.deviceId) || r.recordedAt > latest.get(r.deviceId)!.recordedAt) latest.set(r.deviceId, r);

  const { data: animals, error } = await sb.from("animals").select("id, tag, name, device_id").eq("farm_id", k.farm_id).in("device_id", [...latest.keys()]).is("deleted_at", null);
  if (error) return reply(500, { error: "lookup failed" });
  const { data: existing } = await sb.from("positions").select("id, recorded_at").eq("farm_id", k.farm_id).in("id", (animals ?? []).map((a) => a.id));
  const have = new Map((existing ?? []).map((p) => [p.id, p.recorded_at as string]));

  const rows = (animals ?? []).flatMap((a) => {
    const r = latest.get(a.device_id)!;
    if (have.get(a.id) && have.get(a.id)! >= r.recordedAt) return []; // never replace a newer position with an older one
    return [{ id: a.id, farm_id: k.farm_id, subject_type: "Animal", name: a.name ? `${a.tag} · ${a.name}` : a.tag, lat: r.lat, lng: r.lng, accuracy: r.accuracy, battery: r.battery, source: "Collar / tag", recorded_at: r.recordedAt, deleted_at: null }];
  });
  if (rows.length) {
    const { error: e } = await sb.from("positions").upsert(rows, { onConflict: "id" });
    if (e) return reply(500, { error: "save failed" });
  }
  return reply(200, { accepted: rows.length, unknownDevices: [...latest.keys()].filter((d) => !(animals ?? []).some((a) => a.device_id === d)) });
});
