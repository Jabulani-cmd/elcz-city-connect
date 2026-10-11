import { Download, Plus, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Empty, PageHeader, Panel, nativeSelect } from "@/components/farm/kit";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { aiConfigured } from "@/lib/ai";
import { TeamPanel } from "@/components/farm/TeamPanel";
import { cloudEnabled } from "@/integrations/supabase/client";
import { signOut, useAuth } from "@/lib/auth";
import { ACCESS, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { clearDemoData, clearFailed, createFarm, getState, resetAll, retryFailed, setUser, updateFarm, useFarm, usePendingCount, useRows, useStore, useUser } from "@/lib/store";
import { syncNow, useSyncStatus } from "@/lib/sync";
import { BUILD_ID, refreshApp, usePwa } from "@/lib/pwa";
import { ROLES, type Farm, type Role, type Section } from "@/lib/types";

const FARM_TYPES = ["Crops", "Livestock", "Mixed (crops & livestock)", "Ranch", "Dairy", "Poultry", "Other"];
const SECTIONS: Section[] = ["dashboard", "agriculture", "livestock", "inventory", "finance", "employees", "tasks", "map", "assistant", "reports", "notifications", "documents", "settings"];

function FarmForm({ farm }: { farm: Farm }) {
  const [f, setF] = useState(farm);
  useEffect(() => setF(farm), [farm]);
  const set = (k: keyof Farm) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: ["sizeHa", "agriHa", "pastureHa"].includes(k) ? Number(e.target.value) : e.target.value }));
  const txt = (k: keyof Farm, label: string, extra: object = {}) => <div><Label className="mb-1.5 block text-sm">{label}</Label><Input className="h-11 md:h-10" value={String(f[k] ?? "")} onChange={set(k)} {...extra} /></div>;
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return toast.error("Farm name is required"); updateFarm(farm.id, f); toast.success("Farm saved"); }}>
      {txt("name", "Farm name *")}
      {txt("location", "Location")}
      {txt("latitude", "GPS latitude", { inputMode: "decimal", placeholder: "-20.42" })}
      {txt("longitude", "GPS longitude", { inputMode: "decimal", placeholder: "28.50" })}
      {txt("sizeHa", "Total farm size (ha)", { type: "number", min: 0 })}
      {txt("agriHa", "Agricultural land (ha)", { type: "number", min: 0 })}
      {txt("pastureHa", "Pasture area (ha)", { type: "number", min: 0 })}
      <div><Label className="mb-1.5 block text-sm">Farm type</Label><select className={nativeSelect} value={f.farmType} onChange={set("farmType")}>{[...new Set([...FARM_TYPES, f.farmType])].map((t) => <option key={t}>{t}</option>)}</select></div>
      {txt("manager", "Farm manager")}
      {txt("phone", "Phone")}
      {txt("email", "Email", { type: "email" })}
      {txt("registration", "Registration details")}
      <div className="sm:col-span-2"><Label className="mb-1.5 block text-sm">Description</Label><Textarea rows={3} value={f.description} onChange={set("description")} /></div>
      <div className="sm:col-span-2"><Button type="submit" size="lg">Save farm details</Button></div>
    </form>
  );
}

export default function Settings() {
  const farm = useFarm();
  const user = useUser();
  const pending = usePendingCount();
  const audit = useRows("audit");
  const demo = useStore((s) => s.demo);
  const [name, setName] = useState(user.name);
  const pwa = usePwa();
  const auth = useAuth();
  const sync = useSyncStatus();
  const failed = useStore((s) => s.failed);
  const isOwner = user.role === "Owner";

  const backup = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `farmhelper-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const restore = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.farms) || typeof parsed.data !== "object") throw new Error("not a FarmHelper backup");
      localStorage.setItem("farmhelper.v1", JSON.stringify(parsed));
      toast.success("Backup restored – reloading");
      setTimeout(() => location.reload(), 600);
    } catch (e) { toast.error(`Could not restore: ${e instanceof Error ? e.message : "invalid file"}`); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" actions={<Button size="lg" onClick={() => { createFarm({ name: "New farm" }); toast.success("New farm created – fill in its details"); }}><Plus className="mr-1.5 h-4 w-4" />Add a farm</Button>} />
      {farm && <Panel title="Farm details">{cloudEnabled && user.role !== "Owner" && user.role !== "Farm Manager" ? <p className="text-sm text-muted-foreground">Only the owner or farm manager can edit farm details.</p> : <FarmForm farm={farm} />}</Panel>}

      <Panel title="App version">
        <p className="text-sm text-muted-foreground">Running version: <b className="text-foreground">{BUILD_ID}</b></p>
        <p className="mt-1 text-sm text-muted-foreground">Seeing an old version or old screens? This clears the saved copy of the app and loads the newest one. Your farm records are not deleted.</p>
        <Button variant="outline" className="mt-3" onClick={() => { void refreshApp(); }}>Get the latest version</Button>
      </Panel>

      <Panel title="Install on your phone">
        {pwa.installed ? <p className="text-sm text-muted-foreground">FarmHelper is installed on this device and works offline.</p>
          : pwa.canInstall ? <><p className="mb-3 text-sm text-muted-foreground">Install FarmHelper for one-tap access, full-screen use and offline recording in the field.</p><Button size="lg" onClick={() => pwa.install()}><Download className="mr-1.5 h-4 w-4" />Install app</Button></>
          : pwa.ios ? <p className="text-sm text-muted-foreground">On iPhone/iPad: open this site in <b>Safari</b>, tap the Share button, then <b>Add to Home Screen</b>.</p>
          : <p className="text-sm text-muted-foreground">{pwa.blocker}</p>}
        {!pwa.installed && <Button asChild variant="outline" className="mt-3"><Link to="/install">Check install problems</Link></Button>}
      </Panel>

      {cloudEnabled ? (
        <>
          <Panel title="Your account">
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Name</dt><dd>{auth.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="truncate">{auth.email}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Your role on this farm</dt><dd>{user.role} <span className="text-xs text-muted-foreground">– {ROLE_DESCRIPTIONS[user.role]}</span></dd></div>
            </dl>
            <Button variant="outline" className="mt-4" onClick={() => { if (pending === 0 || confirm(`${pending} change${pending === 1 ? " is" : "s are"} not uploaded yet. They stay on this device and upload next time you sign in. Sign out now?`)) void signOut(); }}>Sign out</Button>
          </Panel>
          <TeamPanel />
        </>
      ) : (
      <Panel title="Your role">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="mb-1.5 block text-sm">Your name</Label><Input className="h-11 md:h-10" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setUser({ name: name.trim() || user.name })} /></div>
          <div><Label className="mb-1.5 block text-sm">Role on this device</Label>
            <select className={nativeSelect} value={user.role} onChange={(e) => setUser({ role: e.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
            <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[user.role]}</p></div>
        </div>
        <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs">Switching roles here lets you preview what each person will see. Real sign-in and per-user enforcement happen on the server (see <code>supabase/migrations</code>) – this on-device role is not a security boundary.</p>
      </Panel>
      )}

      <Panel title="What each role can do">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground"><tr><th className="py-2 text-left">Area</th>{ROLES.map((r) => <th key={r} className="px-2 text-center">{r}</th>)}</tr></thead>
          <tbody className="divide-y">{SECTIONS.map((s) => (
            <tr key={s}><td className="py-1.5 capitalize">{s}</td>{ROLES.map((r) => <td key={r} className="px-2 text-center">{ACCESS[r].write.includes(s) ? <span title="Can edit" className="font-semibold text-success">Edit</span> : ACCESS[r].read.includes(s) ? <span title="Can view" className="text-muted-foreground">View</span> : <span className="text-muted-foreground/40">–</span>}</td>)}</tr>
          ))}</tbody></table></div>
      </Panel>

      <Panel title="Data, backup and sync">
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Storage</dt><dd>{cloudEnabled ? "Cloud account + copy on this device (works offline)" : "On this device only (works offline)"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{cloudEnabled ? "Sync status" : "Changes waiting"}</dt><dd>{cloudEnabled ? (sync.state === "syncing" ? "Syncing…" : sync.state === "error" ? `Problem: ${sync.error}` : sync.state === "offline" ? "Offline" : pending ? `${pending} waiting to upload` : `Up to date${sync.lastSyncAt ? ` · ${new Date(sync.lastSyncAt).toLocaleTimeString()}` : ""}`) : `${pending} – cloud sync not set up`}</dd></div>
          <div><dt className="text-xs text-muted-foreground">AI photo analysis</dt><dd>{aiConfigured() ? "Connected" : "Not connected (using offline guide)"}</dd></div>
        </dl>
        {failed.length > 0 && (
          <div role="alert" className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm">
            <b>{failed.length} change{failed.length === 1 ? " was" : "s were"} not saved to the cloud</b>
            <ul className="mt-1 list-disc pl-5">{failed.slice(0, 5).map((f) => <li key={f.id}>{f.collection}: {f.message}</li>)}</ul>
            <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => { retryFailed(); void syncNow(); }}>Try again</Button><Button size="sm" variant="outline" onClick={clearFailed}>Dismiss</Button></div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {cloudEnabled && <Button onClick={async () => { const ok = await syncNow(); toast[ok ? "success" : "error"](ok ? "Synced" : "Couldn’t sync – will retry"); }}>Sync now</Button>}
          <Button variant="outline" onClick={backup}><Download className="mr-1.5 h-4 w-4" />Download backup</Button>
          {!cloudEnabled && <Button variant="outline" asChild><label className="cursor-pointer"><Upload className="mr-1.5 h-4 w-4" />Restore backup<input type="file" accept="application/json" className="sr-only" onChange={(e) => restore(e.target.files?.[0])} /></label></Button>}
          {!cloudEnabled && demo && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline">Remove sample farm</Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove the sample farm?</AlertDialogTitle><AlertDialogDescription>The sample farm and all its records are deleted. Farms you created are kept.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { clearDemoData(); toast.success("Sample farm removed"); }}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          )}
          {!cloudEnabled && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="text-danger">Erase everything</Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Erase all data on this device?</AlertDialogTitle><AlertDialogDescription>Every farm and record on this device is deleted and you start again from the setup screen. Download a backup first if you might need it.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-danger hover:bg-danger/90" onClick={() => { resetAll(); toast.success("Reset"); }}>Erase</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </Panel>

      <Panel title="Audit log">
        {audit.length === 0 ? <Empty>No changes recorded yet.</Empty> : (
          <div className="max-h-80 overflow-auto"><table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">When</th><th>Who</th><th>Action</th><th>Record</th></tr></thead>
            <tbody className="divide-y">{audit.slice(0, 100).map((a) => <tr key={a.id}><td className="whitespace-nowrap py-1.5 pr-3">{new Date(a.createdAt).toLocaleString()}</td><td className="pr-3">{a.user}</td><td className="pr-3 capitalize">{a.action} {a.collection}</td><td className="max-w-[16rem] truncate">{a.summary}</td></tr>)}</tbody></table></div>
        )}
      </Panel>
    </div>
  );
}
