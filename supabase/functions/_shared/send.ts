// Shared by the `notify` and `notify-digest` functions: phone/number handling, message layout, Twilio + Resend, and delivery to a farm's contacts.
import { createClient } from "npm:@supabase/supabase-js@2";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
export const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
export const env = (k: string) => (Deno.env.get(k) ?? "").trim();
// strip control characters (keeps tab and line breaks) so nothing odd reaches a phone or inbox
// eslint-disable-next-line no-control-regex
export const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n) : "");

export const MAX_PER_HOUR = 300; // messages per farm per hour, all channels
export const CHANNELS = ["whatsapp", "sms", "email"] as const;
export type Channel = (typeof CHANNELS)[number];
export type Ev = { title: string; detail?: string; key?: string };
export type Contact = { id: string; name: string; phone: string | null; email: string | null; via_whatsapp: boolean; via_sms: boolean; via_email: boolean; want_activity: boolean; want_alerts: boolean; want_weekly: boolean };
export type Attachment = { filename: string; content: string }; // content is base64

/** "0771 234 567" → "+263771234567"; already international numbers keep their country code. null when it can't be a phone number. */
export function toE164(raw: string, cc = env("DEFAULT_COUNTRY_CODE") || "263"): string | null {
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (!s.startsWith("+")) s = "+" + cc + s.replace(/^0+/, "");
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

export function compose(type: string, farm: string, actor: string, events: Ev[]) {
  const head = type === "weekly" ? `📊 ${farm}: weekly report, ${actor}`
    : type === "digest" ? `📋 ${farm}: daily summary – ${events.length} thing${events.length === 1 ? "" : "s"} to look at`
    : type === "alert" ? `⚠️ ${farm}: ${events.length === 1 ? "needs attention" : events.length + " things need attention"}`
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

async function resend(to: string, subject: string, text: string, attachment?: Attachment, html?: string) {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env("NOTIFY_EMAIL_FROM"), to: [to], subject, text, ...(attachment ? { attachments: [attachment] } : {}), html: html ?? `<div style="font-family:sans-serif;white-space:pre-line">${esc(text)}</div>` }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${clip((await res.json().catch(() => ({})))?.message ?? "request failed", 160)}`);
}

export const configured: Record<Channel, () => boolean> = {
  whatsapp: () => !!(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_WHATSAPP_FROM")),
  sms: () => !!(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_SMS_FROM")),
  email: () => !!(env("RESEND_API_KEY") && env("NOTIFY_EMAIL_FROM")),
};


/** NOTIFY_MODE=demo: nothing is sent to Twilio/Resend; each message is logged as "demo" with its text so the app can show what would have gone out. */
export const demoMode = () => env("NOTIFY_MODE") === "demo";

/**
 * Email one person who is not a notification contact (e.g. a payment receipt) and record it in the message log.
 * Returns what happened. With `simulateIfUnconfigured` (demo payments) a missing email provider is shown as a simulated "demo" email
 * instead of "not set up", so the whole flow can be demonstrated before an email account exists.
 */
export async function sendDirectEmail(o: { farmId: string; to: string; subject: string; text: string; html?: string; kind: string; simulateIfUnconfigured?: boolean }): Promise<"sent" | "demo" | "not_configured" | "failed"> {
  const preview = `${o.subject}\n\n${o.text}`.slice(0, 1500);
  let status: "sent" | "demo" | "not_configured" | "failed" = "sent";
  let error = "";
  if (demoMode() || (o.simulateIfUnconfigured && !configured.email())) status = "demo";
  else if (!configured.email()) status = "not_configured";
  else {
    try { await resend(o.to, o.subject, o.text, undefined, o.html); } catch (e) { status = "failed"; error = clip((e as Error).message, 300); }
  }
  await admin.from("notification_log").insert({ farm_id: o.farmId, contact_id: null, channel: "email", kind: o.kind, dedupe_key: null, status, error: error || null, preview, recipient: clip(o.to, 200) });
  return status;
}

export type Delivery = { sent: number; failed: number; demo: number; notConfigured: string[]; skipped: number };

/** Send one message to every contact who wants this kind and has the channel on. `dedupe` stops a repeat to the same person on the same channel. */
export async function deliver(o: { farmId: string; farmName: string; type: "activity" | "alert" | "test" | "digest" | "weekly"; events: Ev[]; actor?: string; channels?: Channel[]; dedupe?: string | null; attachment?: Attachment }): Promise<Delivery> {
  const { farmId, type, events } = o;
  const asked = o.channels ?? [...CHANNELS];
  const dedupe = o.dedupe ?? null;
  const { data: contacts } = await admin.from("notification_contacts").select("*").eq("farm_id", farmId);
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("notification_log").select("id", { count: "exact", head: true }).eq("farm_id", farmId).eq("status", "sent").gte("at", since);
  let budget = Math.max(0, MAX_PER_HOUR - (count ?? 0));
  const msg = compose(type, clip(o.farmName, 60) || "Your farm", type === "activity" || type === "weekly" ? clip(o.actor, 60) : "", events);
  const attach = type === "weekly" ? o.attachment : undefined; // only emails carry the file
  const result: Delivery = { sent: 0, failed: 0, demo: 0, notConfigured: [], skipped: 0 };
  const log: Record<string, unknown>[] = [];
  for (const c of (contacts ?? []) as Contact[]) {
    if (type === "activity" && !c.want_activity) continue;
    if ((type === "alert" || type === "digest") && !c.want_alerts) continue;
    if (type === "weekly" && !c.want_weekly) continue;
    const plan: [Channel, string | null][] = [
      ["whatsapp", c.via_whatsapp && c.phone ? toE164(c.phone) : null],
      ["sms", c.via_sms && c.phone ? toE164(c.phone) : null],
      ["email", c.via_email ? c.email : null],
    ];
    for (const [ch, to] of plan) {
      if (!to || !asked.includes(ch)) continue;
      const row = { farm_id: farmId, contact_id: c.id, channel: ch, kind: type, dedupe_key: dedupe, preview: ((ch === "sms" ? msg.short : msg.full) + (attach && ch === "email" ? `\n\n📎 ${attach.filename}` : "")).slice(0, 1500) };
      if (demoMode()) { result.demo++; log.push({ ...row, dedupe_key: null, status: "demo" }); continue; }
      if (!configured[ch]()) { if (!result.notConfigured.includes(ch)) result.notConfigured.push(ch); log.push({ ...row, dedupe_key: null, status: "not_configured" }); continue; }
      if (budget <= 0) { result.skipped++; continue; }
      if (dedupe) {
        const { data: seen } = await admin.from("notification_log").select("id").eq("farm_id", farmId).eq("contact_id", c.id).eq("channel", ch).eq("dedupe_key", dedupe).eq("status", "sent").limit(1);
        if (seen?.length) { result.skipped++; continue; }
      }
      try {
        if (ch === "whatsapp") {
          const tpl = env("TWILIO_WHATSAPP_CONTENT_SID"); // template variables can't contain line breaks
          await twilio(`whatsapp:${to}`, env("TWILIO_WHATSAPP_FROM"), msg.full, tpl || undefined, tpl ? JSON.stringify({ 1: msg.full.replace(/\s*\n\s*/g, "  ").slice(0, 900) }) : undefined);
        } else if (ch === "sms") await twilio(to, env("TWILIO_SMS_FROM"), msg.short);
        else await resend(to, msg.subject, msg.full, attach);
        result.sent++; budget--; log.push({ ...row, status: "sent" });
      } catch (e) {
        result.failed++; log.push({ ...row, dedupe_key: null, status: "failed", error: clip((e as Error).message, 300) });
      }
    }
  }
  if (log.length) await admin.from("notification_log").insert(log);
  return result;
}
