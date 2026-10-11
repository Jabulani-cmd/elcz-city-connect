import { Sprout } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cloudEnabled } from "@/integrations/supabase/client";
import { createFarm, loadDemo, setUser } from "@/lib/store";
import { nativeSelect } from "./kit";

const TYPES = ["Crops", "Livestock", "Mixed (crops & livestock)", "Ranch", "Dairy", "Poultry", "Other"];

/** First-run setup: create the real farm. Sample data is a separate, optional choice. */
export function Onboarding() {
  const [f, setF] = useState({ owner: "", name: "", location: "", farmType: "Mixed (crops & livestock)", sizeHa: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = () => {
    if (!f.name.trim()) return toast.error("Please enter your farm’s name");
    if (f.owner.trim()) setUser({ name: f.owner.trim(), role: "Owner" });
    createFarm({ name: f.name.trim(), location: f.location.trim(), farmType: f.farmType, sizeHa: Number(f.sizeHa) || 0, manager: f.owner.trim() });
    toast.success("Your farm is ready");
  };
  return (
    <div className="bg-hero flex min-h-screen items-center justify-center p-4 pt-safe">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sprout className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-bold">Welcome to FarmHelper</h1><p className="text-sm text-muted-foreground">One platform to manage the entire farm</p></div>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div><Label htmlFor="ob-owner" className="mb-1.5 block">Your name</Label><Input className="h-12 text-base" autoComplete="name" id="ob-owner" value={f.owner} onChange={set("owner")} /></div>
          <div><Label htmlFor="ob-name" className="mb-1.5 block">Farm name *</Label><Input className="h-12 text-base" id="ob-name" value={f.name} onChange={set("name")} placeholder="e.g. Sunrise Farm" /></div>
          <div><Label htmlFor="ob-location" className="mb-1.5 block">Location</Label><Input className="h-12 text-base" id="ob-location" value={f.location} onChange={set("location")} placeholder="Town / district / country" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="ob-farmType" className="mb-1.5 block">Farm type</Label><select className={nativeSelect} id="ob-farmType" value={f.farmType} onChange={set("farmType")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><Label htmlFor="ob-sizeHa" className="mb-1.5 block">Size (ha)</Label><Input className="h-12 text-base" type="number" inputMode="decimal" min={0} id="ob-sizeHa" value={f.sizeHa} onChange={set("sizeHa")} /></div>
          </div>
          <Button type="submit" size="lg" className="h-12 w-full text-base">Create my farm</Button>
        </form>
        {!cloudEnabled && <div className="mt-4 border-t pt-4 text-center">
          <button type="button" className="text-sm text-muted-foreground underline" onClick={loadDemo}>Just looking? Explore with sample data</button>
        </div>}
        <p className="mt-3 text-center text-xs text-muted-foreground">You can add land, animals, crops and staff after this. More details can be edited any time in Settings.</p>
      </div>
    </div>
  );
}
