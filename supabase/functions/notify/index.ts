// Supabase Edge Function: sends farm notifications by WhatsApp, SMS and email.
//   POST { farm_id, type: "activity" | "alert" | "test", events: [{ title, detail? }], actor?: string, channels?: ["whatsapp","sms","email"] }
// The browser never chooses WHO is messaged: recipients come from the farm's notification_contacts table (managed by owners / farm
// managers), and the caller must be a member of the farm who can write (not a viewer). The browser also cannot choose the message
// layout, so this can't be used as a free text relay.
//
// Providers (set only the ones you want; channels without secrets are skipped and logged as "not_configured"):
//   WhatsApp + SMS  – Twilio:  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
//                              TWILIO_WHATSAPP_FROM  (e.g. whatsapp:+14155238886 – the sandbox number, or your approved sender)
//                              TWILIO_SMS_FROM       (a Twilio number or alphanumeric sender id)
//                              TWILIO_WHATSAPP_CONTENT_SID (optional) – approved WhatsApp *template* with one variable {{1}}.
//                              WhatsApp only allows free text within 24 h of the person's last message to you; for farm alerts that
//                              start a conversation you need an approved template, so set this for production.
//   Email           – Resend:  RESEND_API_KEY, NOTIFY_EMAIL_FROM (e.g. "FarmHelper <alerts@yourdomain.com>")
// Optional: DEFAULT_COUNTRY_CODE (digits, default 263 = Zimbabwe) used for numbers typed like 0771234567; APP_URL (link in messages).
// Deploy:  supabase functions deploy notify        (JWT verification stays ON – see supabase/config.toml)
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

const MAX_BODY = 64 * 1024;
const MAX_EVENTS = 50;
const MAX_PER_HOUR = 300; // messages per farm per hour, all channels
const CHANNELS = ["whatsapp", "sms", "email"] as const;
type Channel = (typeof CHANNELS)[number];
type Ev = { title: string; detail?: string; key?: string };
type Contact = { id: string; name: string; phone: string | null; email: string | null; via_whatsapp: boolean; via_sms: boolean; via_email: boolean; want_activity: boolean; want_alerts: boolean };

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const env = (k: string) => (Deno.env.get(k) ?? "").trim();
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n) : "");

/** "0771 234 567" → "+263771234567"; already international numbers keep their country code. null when it can't be a phone number. */
export function toE164(raw: string, cc = env("DEFAULT_COUNTRY_CODE") || "263"): string | null {
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (!s.startsWith("+")) s = "+" + cc + s.replace(/^0+/, "");
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

function compose(type: string, farm: string, actor: string, events: Ev[]) {
  const head = type === "alert" ? `⚠️ ${farm}: ${events.length === 1 ? "needs attention" : events.length + " things need attention"}`
    : type === "test" ? `✅ ${farm}: test message from FarmHelper`
    : `${farm}: ${events.length} update${events.length === 1 ? "" : "s"}${actor ? " by " + actor : ""}`;
  const line = (e: Ev) => `• ${e.title}${e.detail ? " – " + e.detail : ""}`;
  const link = env("APP_URL");
  const full = [head, ...events.slice(0, 15).map(line), events.length > 15 ? `…and ${events.length - 15} more` : "", link].filter(Boolean).join("\n");
  const short = [head, ...events.slice(0, 3).map(line), events.length > 3 ? `+${events.length - 3} more` : ""].filter(Boolean).join("\n").slice(0, 600);
  return { subject: head.replace(/^[^\p{L}\p{N}]+/u, ""), full, short };
}

async function twilio(to: string, from: string, body?: string, contentSid?: string, vars?: string) {
  const sid = env("TWILIO_ACCOUNT_SID");
  const form = new URLSearchParams({ To: to, From: from });
  if (contentSid) { form.set("ContentSid", contentSid); form.set("ContentVariables", vars ?? "{}"); } else form.set("Body", body ?? "");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${sid}:${env("TWILIO_AUTH_TOKEN")}`), "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${clip((await res.json().catch(() => ({})))?.message ?? "request failed", 160)}`);
}

async function resend(to: string, subject: string, text: string) {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env("NOTIFY_EMAIL_FROM"), to: [to], subject, text, html: `<div style="font-family:sans-serif;white-space:pre-line">${esc(text)}</div>` }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${clip((await res.json().catch(() => ({})))?.message ?? "request failed", 160)}`);
}

const configured: Record<Channel, () => boolean> = {
  whatsapp: () => !!(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_WHATSAPP_FROM")),
  sms: () => !!(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_SMS_FROM")),
  email: () => !!(env("RESEND_API_KEY") && env("NOTIFY_EMAIL_FROM")),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: "Request too large" }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json({ error: "Bad request" }, 400); }

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth.user;
  if (!user) return json({ error: "Sign in first" }, 401);

  const farmId = clip(body.farm_id, 64);
  const type = body.type === "alert" || body.type === "test" ? body.type : "activity";
  const { data: member } = await admin.from("farm_members").select("role").eq("farm_id", farmId).eq("user_id", user.id).maybeSingle();
  if (!member || member.role === "viewer") return json({ error: "Not allowed" }, 403);
  if (type === "test" && !["owner", "farm_manager"].includes(member.role)) return json({ error: "Only owners and managers can send a test" }, 403);

  const events: Ev[] = (Array.isArray(body.events) ? body.events : []).slice(0, MAX_EVENTS)
    .map((e: Record<string, unknown>) => ({ title: clip(e?.title, 140), detail: clip(e?.detail, 160), key: clip(e?.key, 120) })).filter((e) => e.title);
  if (type === "test" && !events.length) events.push({ title: "Notifications are working" });
  if (!events.length) return json({ sent: 0, skipped: "no events" });
  const asked = Array.isArray(body.channels) ? (body.channels as unknown[]).filter((c): c is Channel => CHANNELS.includes(c as Channel)) : [...CHANNELS];

  const { data: farm } = await admin.from("farms").select("name").eq("id", farmId).maybeSingle();
  const { data: contacts } = await admin.from("notification_contacts").select("*").eq("farm_id", farmId);
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("notification_log").select("id", { count: "exact", head: true }).eq("farm_id", farmId).eq("status", "sent").gte("at", since);
  let budget = Math.max(0, MAX_PER_HOUR - (count ?? 0));

  const msg = compose(type, clip(farm?.name, 60) || "Your farm", type === "activity" ? clip(body.actor, 60) : "", events);
  const dedupe = type === "alert" ? events.map((e) => e.key).filter(Boolean).sort().join("|").slice(0, 400) || null : null;
  const result = { sent: 0, failed: 0, notConfigured: [] as string[], skipped: 0 };
  const log: Record<string, unknown>[] = [];

  for (const c of (contacts ?? []) as Contact[]) {
    if (type === "activity" && !c.want_activity) continue;
    if (type === "alert" && !c.want_alerts) continue;
    const plan: [Channel, string | null][] = [
      ["whatsapp", c.via_whatsapp && c.phone ? toE164(c.phone) : null],
      ["sms", c.via_sms && c.phone ? toE164(c.phone) : null],
      ["email", c.via_email ? c.email : null],
    ];
    for (const [ch, to] of plan) {
      if (!to || !asked.includes(ch)) continue;
      const row = { farm_id: farmId, contact_id: c.id, channel: ch, kind: type, dedupe_key: dedupe };
      if (!configured[ch]()) { if (!result.notConfigured.includes(ch)) result.notConfigured.push(ch); log.push({ ...row, dedupe_key: null, status: "not_configured" }); continue; }
      if (budget <= 0) { result.skipped++; continue; }
      if (dedupe) { // already sent this alert to this person on this channel
        const { data: seen } = await admin.from("notification_log").select("id").eq("farm_id", farmId).eq("contact_id", c.id).eq("channel", ch).eq("dedupe_key", dedupe).eq("status", "sent").limit(1);
        if (seen?.length) { result.skipped++; continue; }
      }
      try {
        if (ch === "whatsapp") {
          const tpl = env("TWILIO_WHATSAPP_CONTENT_SID"); // template variables can't contain line breaks
          await twilio(`whatsapp:${to}`, env("TWILIO_WHATSAPP_FROM"), msg.full, tpl || undefined, tpl ? JSON.stringify({ 1: msg.full.replace(/\s*\n\s*/g, "  ").slice(0, 900) }) : undefined);
        } else if (ch === "sms") await twilio(to, env("TWILIO_SMS_FROM"), msg.short);
        else await resend(to, msg.subject, msg.full);
        result.sent++; budget--; log.push({ ...row, status: "sent" });
      } catch (e) {
        result.failed++; log.push({ ...row, dedupe_key: null, status: "failed", error: clip((e as Error).message, 300) });
      }
    }
  }
  if (log.length) await admin.from("notification_log").insert(log);
  return json(result);
});
