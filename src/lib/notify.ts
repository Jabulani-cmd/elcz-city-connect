import { computeAlerts, type Alert } from "./alerts";
import { LABELS, RESOURCES } from "./schema";
import { getState, rowsOf } from "./store";
import { supabase } from "./supabaseClient";
import type { OutboxItem, Row } from "./types";

/**
 * WhatsApp / SMS / email notifications. The browser only says WHAT happened; the `notify` edge function decides who gets it
 * (the farm's notification contacts) and sends it. Messages are sent only after a change has reached the server, so work done
 * offline notifies people once the phone is back online – and a change the server refused is never announced.
 */
export type Channel = "whatsapp" | "sms" | "email";
export type NotifyEvent = { title: string; detail?: string; key?: string };

/** Records that are bookkeeping rather than farm activity. */
const QUIET = new Set(["prefs"]);

const nameOf = (collection: string, r: Row): string => {
  if (LABELS[collection]) return String(LABELS[collection](r)).trim();
  const v = r.name ?? r.title ?? r.description ?? r.condition ?? r.reason ?? r.vaccine ?? r.item ?? "";
  return String(v).trim();
};

/** "Added animal: 0042 · Bessie" / "Updated expense: Diesel" / "Removed a sale". */
export function describeChange(item: Pick<OutboxItem, "op" | "collection">, row?: Row): NotifyEvent | null {
  const res = RESOURCES[item.collection];
  if (!res || QUIET.has(item.collection)) return null;
  const what = res.singular;
  if (item.op === "delete") return { title: `Removed ${/^[aeiou]/i.test(what) ? "an" : "a"} ${what}`, detail: res.title };
  if (!row) return null;
  const created = Math.abs(Date.parse(row.updatedAt) - Date.parse(row.createdAt)) < 2000;
  const label = nameOf(item.collection, row);
  return { title: `${created ? "Added" : "Updated"} ${what}${label ? `: ${label}` : ""}`, detail: res.title };
}

/** Events for the outbox items that were just sent to the server (and not refused). */
export function eventsForSynced(items: OutboxItem[], rows: (collection: string, id: string) => Row | undefined): NotifyEvent[] {
  const out: NotifyEvent[] = [];
  for (const it of items) {
    if (it.collection.startsWith("__") || it.rowId.startsWith("demo-")) continue;
    const e = describeChange(it, rows(it.collection, it.rowId));
    if (e) out.push(e);
  }
  return out;
}

async function send(body: Record<string, unknown>): Promise<boolean> {
  if (!supabase || !navigator.onLine) return false;
  try {
    const { error } = await supabase.functions.invoke("notify", { body });
    return !error;
  } catch {
    return false;
  }
}

/** Tell the farm's contacts about changes that were just synced. Best effort: a failure never blocks syncing. */
export async function notifyActivity(items: OutboxItem[], farmId = getState().activeFarmId): Promise<void> {
  const s = getState();
  const events = eventsForSynced(items, (c, id) => (s.data[c] ?? []).find((r) => r.id === id));
  if (!events.length || !farmId || farmId.startsWith("demo-")) return;
  await send({ farm_id: farmId, type: "activity", events, actor: s.user.name });
}

/* ---------- due alerts (vaccinations due, low feed, overdue tasks…) ---------- */

/** Channels the user switched on for an alert kind on the Notifications page. */
export function channelsFor(kind: string, prefs: Row[]): Channel[] {
  const p = prefs.find((x) => x.type === "channel" && x.kind === kind);
  return (["whatsapp", "sms", "email"] as const).filter((c) => !!p?.[c]);
}

/** Urgent / soon alerts only; "info" alerts are for the in-app list. */
export function alertsToSend(alerts: Alert[], prefs: Row[]): Map<string, NotifyEvent[]> {
  const groups = new Map<string, NotifyEvent[]>();
  for (const a of alerts) {
    if (a.severity === "info") continue;
    const ch = channelsFor(a.kind, prefs);
    if (!ch.length) continue;
    // sent once when it first needs attention; the morning digest (notify-digest) then reminds every day
    const key = `${a.id}:${a.severity}`;
    const g = ch.join(",");
    groups.set(g, [...(groups.get(g) ?? []), { title: a.title, detail: a.detail, key }]);
  }
  return groups;
}

let lastAlertRun = 0;
/** Send the farm's pending alerts. The server remembers what it already sent, so calling this often is safe. */
export async function notifyAlerts(): Promise<void> {
  if (Date.now() - lastAlertRun < 5 * 60_000) return;
  lastAlertRun = Date.now();
  const s = getState();
  if (!s.activeFarmId || s.activeFarmId.startsWith("demo-")) return;
  const alerts = computeAlerts((c) => rowsOf(c));
  for (const [channels, events] of alertsToSend(alerts, rowsOf("prefs"))) {
    await send({ farm_id: s.activeFarmId, type: "alert", channels: channels.split(","), events: events.slice(0, 50) });
  }
}

/** Sends one test message to every contact so the owner can check the set-up. */
export async function sendTestNotification(farmId: string): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: "Sign in to your farm account first." };
  if (!navigator.onLine) return { ok: false, message: "You’re offline." };
  const { data, error } = await supabase.functions.invoke("notify", { body: { farm_id: farmId, type: "test" } });
  if (error) return { ok: false, message: "Couldn’t reach the notification service. Is the `notify` function deployed?" };
  const r = data as { sent: number; failed: number; demo?: number; notConfigured: string[] };
  if (r.demo) return { ok: true, message: `Demo: ${r.demo} message${r.demo === 1 ? "" : "s"} simulated – nothing was actually sent. See “Recent messages” below.` };
  if (r.sent) return { ok: true, message: `Sent ${r.sent} message${r.sent === 1 ? "" : "s"}${r.failed ? `, ${r.failed} failed` : ""}.` };
  if (r.notConfigured?.length) return { ok: false, message: `Not set up on the server yet: ${r.notConfigured.join(", ")}. Add the provider keys (see README).` };
  return { ok: false, message: r.failed ? "Sending failed – check the numbers/addresses and provider keys." : "Add at least one contact with a phone number or email first." };
}

/* ---------- who gets messages (owners and farm managers manage this) ---------- */
export type Contact = {
  id: string; name: string; phone: string; email: string;
  viaWhatsapp: boolean; viaSms: boolean; viaEmail: boolean; wantActivity: boolean; wantAlerts: boolean;
};
type Db = Record<string, unknown>;
const fromDb = (d: Db): Contact => ({
  id: String(d.id), name: String(d.name ?? ""), phone: String(d.phone ?? ""), email: String(d.email ?? ""),
  viaWhatsapp: !!d.via_whatsapp, viaSms: !!d.via_sms, viaEmail: !!d.via_email, wantActivity: !!d.want_activity, wantAlerts: !!d.want_alerts,
});
const toDb = (c: Partial<Contact>): Db => {
  const m: Record<string, string> = { name: "name", phone: "phone", email: "email", viaWhatsapp: "via_whatsapp", viaSms: "via_sms", viaEmail: "via_email", wantActivity: "want_activity", wantAlerts: "want_alerts" };
  const out: Db = {};
  for (const [k, v] of Object.entries(c)) if (m[k]) out[m[k]] = typeof v === "string" ? v.trim() || null : v;
  return out;
};
const sb = () => { if (!supabase) throw new Error("Not connected"); return supabase; };
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

export async function listContacts(farmId: string): Promise<Contact[]> {
  const { data, error } = await sb().from("notification_contacts").select("*").eq("farm_id", farmId).order("created_at");
  fail(error);
  return (data ?? []).map(fromDb);
}
export async function addContact(farmId: string, c: Partial<Contact>) { fail((await sb().from("notification_contacts").insert({ farm_id: farmId, ...toDb(c) })).error); }
export async function updateContact(id: string, c: Partial<Contact>) { fail((await sb().from("notification_contacts").update(toDb(c)).eq("id", id)).error); }
export async function removeContact(id: string) { fail((await sb().from("notification_contacts").delete().eq("id", id)).error); }

/* ---------- recent messages (what was sent, or – in demo mode – what would have been) ---------- */
export type LogEntry = { id: number; at: string; channel: Channel; kind: string; status: string; who: string; preview: string; error: string };

export const STATUS_LABEL: Record<string, string> = {
  sent: "Sent",
  demo: "Demo – not actually sent",
  failed: "Failed",
  not_configured: "Not set up yet",
};
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;

export const CHANNEL_LABEL: Record<Channel, string> = { whatsapp: "WhatsApp", sms: "SMS", email: "Email" };
const KIND_LABEL: Record<string, string> = { activity: "Activity", alert: "Alert", digest: "Daily summary", test: "Test" };
export const kindLabel = (k: string) => KIND_LABEL[k] ?? k;

export async function listMessageLog(farmId: string, limit = 15): Promise<LogEntry[]> {
  const { data, error } = await sb().from("notification_log")
    .select("id, at, channel, kind, status, error, preview, notification_contacts(name)")
    .eq("farm_id", farmId).order("at", { ascending: false }).limit(limit);
  fail(error);
  return (data ?? []).map((d: Db) => ({
    id: Number(d.id), at: String(d.at), channel: d.channel as Channel, kind: String(d.kind), status: String(d.status),
    who: String((d.notification_contacts as { name?: string } | null)?.name ?? ""), preview: String(d.preview ?? ""), error: String(d.error ?? ""),
  }));
}
