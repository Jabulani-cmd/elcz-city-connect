import { AlertTriangle, Bell, CheckCheck, Info, OctagonAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Empty, PageHeader, Panel, nativeSelect } from "@/components/farm/kit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_KINDS } from "@/lib/alerts";
import { SEV_STYLE, SEV_TEXT, useAlerts } from "@/components/farm/alertUi";
import { Input } from "@/components/ui/input";
import { addContact, listContacts, removeContact, sendTestNotification, updateContact, type Contact } from "@/lib/notify";
import { upsert, useFarm, useRows, useUser } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const ICON = { danger: OctagonAlert, warning: AlertTriangle, info: Info } as const;
const CHANNELS = [["inApp", "In-app"], ["push", "Push"], ["whatsapp", "WhatsApp"], ["sms", "SMS"], ["email", "Email"]] as const;

export default function Notifications() {
  const alerts = useAlerts();
  const prefs = useRows("prefs");
  const [kind, setKind] = useState("");
  const [sev, setSev] = useState("");
  const read = new Set(prefs.filter((p) => p.type === "read").map((p) => p.alertId));
  const pref = (k: string, ch: string) => { const p = prefs.find((x) => x.type === "channel" && x.kind === k); return p ? !!p[ch] : ch === "inApp"; };
  const setPref = (k: string, ch: string, v: boolean) => {
    const p = prefs.find((x) => x.type === "channel" && x.kind === k);
    upsert("prefs", p ? { id: p.id, [ch]: v } : { type: "channel", kind: k, inApp: true, [ch]: v });
    if (ch === "push" && v && "Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  };
  const list = alerts.filter((a) => (!kind || a.kind === kind) && (!sev || a.severity === sev) && pref(a.kind, "inApp"));
  const unread = list.filter((a) => !read.has(a.id));
  const testPush = async () => {
    if (!("Notification" in window)) return toast.error("This browser doesn’t support push notifications");
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") return toast.error("Notifications are blocked – allow them in your browser settings");
    new Notification("FarmHelper", { body: alerts[0] ? `${alerts[0].title} – ${alerts[0].detail}` : "You’re all caught up.", icon: "/icon-192.png" });
  };
  return (
    <div>
      <PageHeader title="Notifications" description="Everything that needs your attention, worked out automatically from your records."
        actions={<Button variant="outline" onClick={() => unread.forEach((a) => upsert("prefs", { type: "read", alertId: a.id }))} disabled={!unread.length}><CheckCheck className="mr-1.5 h-4 w-4" />Mark all read</Button>} />
      <div className="mb-3 grid grid-cols-2 gap-2 sm:flex">
        <select aria-label="Type" className={cn(nativeSelect, "rounded-full bg-card sm:w-auto")} value={kind} onChange={(e) => setKind(e.target.value)}><option value="">All types</option>{NOTIFICATION_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        <select aria-label="Urgency" className={cn(nativeSelect, "rounded-full bg-card sm:w-auto")} value={sev} onChange={(e) => setSev(e.target.value)}><option value="">All urgency</option><option value="danger">Urgent</option><option value="warning">Soon</option><option value="info">Upcoming</option></select>
      </div>
      {list.length === 0 ? <Empty><Bell className="mx-auto mb-2 h-6 w-6" />You’re all caught up.</Empty> : (
        <ul className="space-y-2">
          {list.map((a) => { const I = ICON[a.severity]; const isRead = read.has(a.id); return (
            <li key={a.id}>
              <Link to={a.to} onClick={() => !isRead && upsert("prefs", { type: "read", alertId: a.id })} className={cn("flex items-start gap-3 rounded-xl border p-3 transition-opacity hover:opacity-90", SEV_STYLE[a.severity], isRead && "opacity-60")}>
                <I className={cn("mt-0.5 h-5 w-5 shrink-0", SEV_TEXT[a.severity])} />
                <div className="min-w-0 flex-1"><div className="font-medium leading-snug">{a.title}</div><div className="text-sm text-muted-foreground">{a.detail}</div><span className="mt-1.5 inline-block rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-medium sm:hidden">{a.kind}</span></div>
                <span className="hidden shrink-0 rounded-full bg-background/70 px-2 py-0.5 text-xs sm:inline">{a.kind}</span>
              </Link>
            </li>); })}
        </ul>
      )}
      <Recipients />
      <Panel title="How you get notified" className="mt-8">
        <p className="mb-3 text-sm text-muted-foreground">In-app notifications work everywhere. Push uses your browser’s notifications while the app is open. WhatsApp, SMS and email are sent by the server to the people listed under “Who receives messages” below, for urgent and soon-due items you switch on here.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Notify me about</th>{CHANNELS.map(([, l]) => <th key={l} className="px-3 text-center">{l}</th>)}</tr></thead>
          <tbody className="divide-y">{NOTIFICATION_KINDS.map((k) => (
            <tr key={k}><td className="py-2">{k}</td>{CHANNELS.map(([ch, l]) => <td key={ch} className="px-3 text-center"><Switch aria-label={`${k} ${l}`} checked={pref(k, ch)} onCheckedChange={(v) => setPref(k, ch, v)} /></td>)}</tr>
          ))}</tbody></table></div>
        <Button variant="outline" className="mt-4" onClick={testPush}>Send a test push notification</Button>
      </Panel>
    </div>
  );
}

const toggles: [keyof Contact, string][] = [["viaWhatsapp", "WhatsApp"], ["viaSms", "SMS"], ["viaEmail", "Email"], ["wantActivity", "Activity"], ["wantAlerts", "Alerts"]];
const blank = { name: "", phone: "", email: "" };

/** People who get WhatsApp / SMS / email for this farm. Owners and farm managers only; needs a signed-in cloud farm. */
function Recipients() {
  const farm = useFarm();
  const { role } = useUser();
  const [list, setList] = useState<Contact[] | null>(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const allowed = !!supabase && !!farm && !farm.id.startsWith("demo-") && (role === "Owner" || role === "Farm Manager");
  const load = useCallback(() => { if (allowed && farm) listContacts(farm.id).then(setList).catch(() => setList([])); }, [allowed, farm]);
  useEffect(load, [load]);
  if (!allowed || !farm) return null;
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); } };
  const add = () => {
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) return toast.error("Add a name and a phone number or email");
    void run(async () => { await addContact(farm.id, form); setForm(blank); });
  };
  return (
    <Panel title="Who receives messages" className="mt-8">
      <p className="mb-3 text-sm text-muted-foreground">These people get WhatsApp, SMS and email about farm activity (records added, changed or removed) and about alerts. Phone numbers like 0771234567 are treated as Zimbabwe numbers; use +country code for others.</p>
      <ul className="space-y-3">
        {(list ?? []).map((c) => (
          <li key={c.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="font-medium">{c.name}</div><div className="truncate text-sm text-muted-foreground">{[c.phone, c.email].filter(Boolean).join(" · ")}</div></div>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => run(() => removeContact(c.id))}>Remove</Button></div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{toggles.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><Switch checked={!!c[k]} disabled={busy} onCheckedChange={(v) => run(() => updateContact(c.id, { [k]: v }))} />{l}</label>)}</div>
          </li>))}
        {list?.length === 0 && <li className="text-sm text-muted-foreground">No one yet – add yourself first.</li>}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Input aria-label="Name" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" />
        <Input aria-label="Phone" placeholder="Phone (WhatsApp / SMS)" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" />
        <Input aria-label="Email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={add}>Add person</Button>
        <Button variant="outline" disabled={busy || !list?.length} onClick={() => run(async () => { const r = await sendTestNotification(farm.id); (r.ok ? toast.success : toast.error)(r.message); })}>Send a test message</Button>
      </div>
    </Panel>
  );
}
