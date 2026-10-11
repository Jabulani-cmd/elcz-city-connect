import { Download, Plus, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Empty, PageHeader, Panel, nativeSelect } from "@/components/farm/kit";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { aiConfigured } from "@/lib/ai";
import { ACCESS, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { clearDemoData, createFarm, getState, resetAll, setUser, updateFarm, useFarm, usePendingCount, useRows, useStore, useUser } from "@/lib/store";
import { hasSyncAdapter } from "@/lib/sync";
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
      {farm && <Panel title="Farm details"><FarmForm farm={farm} /></Panel>}

      <Panel title="Your role">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="mb-1.5 block text-sm">Your name</Label><Input className="h-11 md:h-10" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setUser({ name: name.trim() || user.name })} /></div>
          <div><Label className="mb-1.5 block text-sm">Role on this device</Label>
            <select className={nativeSelect} value={user.role} onChange={(e) => setUser({ role: e.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
            <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[user.role]}</p></div>
        </div>
        <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs">Switching roles here lets you preview what each person will see. Real sign-in and per-user enforcement happen on the server (see <code>supabase/migrations</code>) – this on-device role is not a security boundary.</p>
      </Panel>

      <Panel title="What each role can do">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground"><tr><th className="py-2 text-left">Area</th>{ROLES.map((r) => <th key={r} className="px-2 text-center">{r}</th>)}</tr></thead>
          <tbody className="divide-y">{SECTIONS.map((s) => (
            <tr key={s}><td className="py-1.5 capitalize">{s}</td>{ROLES.map((r) => <td key={r} className="px-2 text-center">{ACCESS[r].write.includes(s) ? <span title="Can edit" className="font-semibold text-success">Edit</span> : ACCESS[r].read.includes(s) ? <span title="Can view" className="text-muted-foreground">View</span> : <span className="text-muted-foreground/40">–</span>}</td>)}</tr>
          ))}</tbody></table></div>
      </Panel>

      <Panel title="Data, backup and sync">
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">Storage</dt><dd>On this device (works offline)</dd></div>
          <div><dt className="text-xs text-muted-foreground">Changes waiting to sync</dt><dd>{pending}{!hasSyncAdapter() && " – cloud sync not connected"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">AI photo analysis</dt><dd>{aiConfigured() ? "Connected" : "Not connected (using offline guide)"}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={backup}><Download className="mr-1.5 h-4 w-4" />Download backup</Button>
          <Button variant="outline" asChild><label className="cursor-pointer"><Upload className="mr-1.5 h-4 w-4" />Restore backup<input type="file" accept="application/json" className="sr-only" onChange={(e) => restore(e.target.files?.[0])} /></label></Button>
          {demo && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline">Remove demo farm</Button></AlertDialogTrigger>
              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove the demo farm?</AlertDialogTitle><AlertDialogDescription>The sample farm and all its records are deleted. Farms you created are kept.{getState().farms.length <= 1 ? " You will then need to add your own farm." : ""}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { clearDemoData(); if (!getState().farms.length) createFarm({ name: "My farm" }); toast.success("Demo data removed"); }}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="text-danger">Erase everything</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Erase all data on this device?</AlertDialogTitle><AlertDialogDescription>Every farm and record on this device is deleted and the demo farm is restored. Download a backup first if you might need it.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-danger hover:bg-danger/90" onClick={() => { resetAll(); toast.success("Reset"); }}>Erase</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
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
