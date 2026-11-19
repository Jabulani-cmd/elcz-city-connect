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
import { admin, CHANNELS, clip, CORS, deliver, json, type Channel, type Ev } from "../_shared/send.ts";

const MAX_BODY = 64 * 1024;
const MAX_EVENTS = 50;

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
  const channels = Array.isArray(body.channels) ? (body.channels as unknown[]).filter((c): c is Channel => CHANNELS.includes(c as Channel)) : undefined;

  const { data: farm } = await admin.from("farms").select("name").eq("id", farmId).maybeSingle();
  const dedupe = type === "alert" ? events.map((e) => e.key).filter(Boolean).sort().join("|").slice(0, 400) || null : null;
  return json(await deliver({ farmId, farmName: farm?.name ?? "", type, events, actor: clip(body.actor, 60), channels, dedupe }));
});
