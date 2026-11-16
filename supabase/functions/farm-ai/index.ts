// Supabase Edge Function: AI crop / livestock assistant.
// Secrets required:  ANTHROPIC_API_KEY, AI_MODEL (the model id to use)
// Deploy:  supabase functions deploy farm-ai
// Abuse limits: crop/livestock checks need a signed-in user (the public anon key is not enough); the landing-page chat stays open
// to visitors but is rate-limited per IP; request bodies, images and text fields are size-capped. Limits are per function instance
// (in-memory), a cheap first line of defence, not a global quota.
// Then set VITE_AI_ENDPOINT=https://<project>.supabase.co/functions/v1/farm-ai (and VITE_AI_KEY=<anon key>) in .env

import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_BODY_BYTES = 6 * 1024 * 1024; // whole request
const MAX_IMAGES = 6;
const MAX_IMAGE_CHARS = 1_400_000; // ~1 MB of image per photo once base64-encoded
const MAX_TEXT = 2000;
const LIMITS = { chat: { max: 20, windowMs: 10 * 60_000 }, check: { max: 30, windowMs: 60 * 60_000 } };

const hits = new Map<string, number[]>();
/** true when `key` has used up its allowance in the window */
function limited(key: string, { max, windowMs }: { max: number; windowMs: number }) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return false;
}

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
async function userFrom(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}
const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
const cap = (v: unknown, n = MAX_TEXT) => (typeof v === "string" ? v.slice(0, n) : v == null ? undefined : String(v).slice(0, n));
const fail = (msg: string, status: number) => new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, "content-type": "application/json" } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CROP_SYSTEM = `You are an assistant for farmers. You give practical, cautious crop health guidance.
You are NOT a certified agronomist. Never claim certainty. Always recommend professional help for serious, spreading or unclear problems.
Reply with ONLY a JSON object of this exact shape:
{"summary":string,"findings":[{"name":string,"confidence":number 0-100,"symptoms":string,"causes":string}],"urgency":"Low"|"Moderate"|"High"|"Emergency","immediateActions":string[],"nextSteps":string[],"vetQuestions":string[],"monitoring":string,"seeProfessional":string}
Use plain, simple language. Keep lists short.`;

const VET_SYSTEM = `You are a veterinary triage assistant for small-scale and commercial farmers in Zimbabwe and southern Africa (cattle, goats, sheep, pigs, poultry).
Work like an experienced farm vet doing a first assessment: look carefully at every photo (some may be still frames taken in order from a short video), weigh the chosen symptoms, species, age and history, and list the most likely conditions – including locally important ones such as tick-borne diseases (redwater, heartwater, gallsickness, theileriosis/January disease), lumpy skin disease, foot-and-mouth disease, anthrax, Newcastle disease and avian influenza.
You cannot examine the animal, so never claim certainty and always say what a vet should check.
Decide clearly:
- "isolate": true if the condition could be contagious, is notifiable, or the animal needs to be kept quiet apart from the herd.
- "vetTiming": "Immediately" for emergencies, suspected notifiable disease, sudden deaths, severe pain, bloat, difficult birth, nervous signs or breathing distress; "Within 24 hours" for serious but stable cases; otherwise "If no improvement in 24–48 hours".
- "notifiable": true if a reportable disease (e.g. foot-and-mouth, anthrax, lumpy skin, avian influenza, Newcastle, rabies) is a realistic possibility.
Reply with ONLY a JSON object of this exact shape:
{"summary":string,"findings":[{"name":string,"confidence":number 0-100,"symptoms":string,"causes":string}],"urgency":"Low"|"Moderate"|"High"|"Emergency","care":{"isolate":boolean,"vetTiming":"Immediately"|"Within 24 hours"|"If no improvement in 24–48 hours","notifiable":boolean},"immediateActions":string[],"nextSteps":string[],"vetQuestions":string[],"monitoring":string,"seeProfessional":string}
Use plain, simple language a farmer understands. Give up to 3 findings, most likely first. Keep lists short and practical. Never recommend prescription-only drugs or doses – leave those to the vet.`;

const CHAT_SYSTEM = `You are the FarmHelper assistant: a friendly, practical farming advisor for small-scale and commercial farmers in Zimbabwe and southern Africa.
Answer general questions about livestock (cattle, goats, sheep, pigs, poultry), crops and horticulture, soil, irrigation, farm finance (profit, budgets, selling, loans) and using the FarmHelper app.
FarmHelper keeps farm records (livestock, crops, inventory, money, employees, tasks, reports), works offline, and new users get a 7-day free trial.
Rules: use plain, simple English; keep answers short (under 150 words); use "- " for lists, no markdown headings or bold; use local context (seasons, Agritex, veterinary officers, US$) where relevant.
For a sick, injured or dying animal, tell them to call a vet or veterinary officer and mention the Vet check in the app after signing in. Never give prescription drug doses.
If a question is not about farming or FarmHelper, politely say you can only help with farming.`;

async function chat(input: { messages?: unknown }, apiKey: string, model: string) {
  const msgs = (Array.isArray(input.messages) ? input.messages : [])
    .filter((m): m is { role: string; content: string } => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length) throw new Error("No question given");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 800, system: CHAT_SYSTEM, messages: msgs }),
  });
  if (!res.ok) throw new Error(`Model request failed (${res.status})`);
  const data = await res.json();
  const reply: string = data.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
  return new Response(JSON.stringify({ reply }), { headers: { ...CORS, "content-type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail("Request too large", 413);
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return fail("Request too large", 413);
    const input = JSON.parse(raw);
    if (input.kind === "chat") {
      if (limited(`chat:${clientIp(req)}`, LIMITS.chat)) return fail("Too many questions, please try again later", 429);
    } else {
      const user = await userFrom(req);
      if (!user) return fail("Please sign in to use the health checks", 401);
      if (limited(`check:${user.id}`, LIMITS.check)) return fail("Too many checks, please try again later", 429);
    }
    const kind = input.kind === "crop" ? "crop" : "livestock";
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const model = Deno.env.get("AI_MODEL");
    if (!apiKey || !model) throw new Error("AI service is not configured");
    if (input.kind === "chat") return await chat(input, apiKey, model);

    const details = [
      kind === "crop" ? `Crop: ${cap(input.crop, 200) ?? "unknown"}` : `Species: ${cap(input.species, 200) ?? "unknown"}\nBreed: ${cap(input.breed, 200) ?? "unknown"}`,
      Array.isArray(input.selectedSymptoms) && input.selectedSymptoms.length > 0 && `Symptoms chosen from the list: ${input.selectedSymptoms.slice(0, 20).map((x: unknown) => cap(x, 100)).join(", ")}`,
      input.ageText && `Age: ${cap(input.ageText, 100)}`,
      input.weightKg && `Weight: ${cap(input.weightKg, 10)} kg`,
      `Symptoms: ${cap(input.symptoms) || "(none given)"}`,
      input.history && `Recent history: ${cap(input.history)}`,
    ].filter(Boolean).join("\n");

    const content: unknown[] = [];
    const urls: unknown[] = Array.isArray(input.imageDataUrls) && input.imageDataUrls.length ? input.imageDataUrls : [input.imageDataUrl];
    for (const url of urls.slice(0, MAX_IMAGES)) {
      const m = typeof url === "string" && url.length <= MAX_IMAGE_CHARS ? url.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) : null;
      if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
    }
    content.push({ type: "text", text: details });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 1500, system: kind === "crop" ? CROP_SYSTEM : VET_SYSTEM, messages: [{ role: "user", content }] }),
    });
    if (!res.ok) throw new Error(`Model request failed (${res.status})`);
    const data = await res.json();
    const text: string = data.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return new Response(JSON.stringify(json), { headers: { ...CORS, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });
  }
});
