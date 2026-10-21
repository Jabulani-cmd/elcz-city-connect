import { AlertTriangle, Bell, CheckCheck, Info, OctagonAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Empty, PageHeader, Panel, nativeSelect } from "@/components/farm/kit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_KINDS } from "@/lib/alerts";
import { SEV_STYLE, SEV_TEXT, useAlerts } from "@/components/farm/alertUi";
import { upsert, useRows } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICON = { danger: OctagonAlert, warning: AlertTriangle, info: Info } as const;
const CHANNELS = [["inApp", "In-app"], ["push", "Push"], ["email", "Email"], ["sms", "SMS"]] as const;

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
      <div className="mb-3 flex flex-wrap gap-2">
        <select aria-label="Type" className={cn(nativeSelect, "w-auto")} value={kind} onChange={(e) => setKind(e.target.value)}><option value="">All types</option>{NOTIFICATION_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        <select aria-label="Urgency" className={cn(nativeSelect, "w-auto")} value={sev} onChange={(e) => setSev(e.target.value)}><option value="">All urgency</option><option value="danger">Urgent</option><option value="warning">Soon</option><option value="info">Upcoming</option></select>
      </div>
      {list.length === 0 ? <Empty><Bell className="mx-auto mb-2 h-6 w-6" />You’re all caught up.</Empty> : (
        <ul className="space-y-2">
          {list.map((a) => { const I = ICON[a.severity]; const isRead = read.has(a.id); return (
            <li key={a.id}>
              <Link to={a.to} onClick={() => !isRead && upsert("prefs", { type: "read", alertId: a.id })} className={cn("flex items-start gap-3 rounded-xl border p-3 transition-opacity hover:opacity-90", SEV_STYLE[a.severity], isRead && "opacity-60")}>
                <I className={cn("mt-0.5 h-5 w-5 shrink-0", SEV_TEXT[a.severity])} />
                <div className="min-w-0 flex-1"><div className="font-medium">{a.title}</div><div className="text-sm text-muted-foreground">{a.detail}</div></div>
                <span className="shrink-0 rounded-full bg-background/70 px-2 py-0.5 text-xs">{a.kind}</span>
              </Link>
            </li>); })}
        </ul>
      )}
      <Panel title="How you get notified" className="mt-8">
        <p className="mb-3 text-sm text-muted-foreground">In-app notifications work everywhere. Push uses your browser’s notifications while the app is open. Email and SMS preferences are saved, but sending them needs a server-side provider that isn’t connected yet.</p>
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
