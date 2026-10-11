import { Camera, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AI_DISCLAIMER_CROP, AI_DISCLAIMER_LIVESTOCK, aiConfigured, analyze, readImage, type AiResult } from "@/lib/ai";
import { ageLabel, todayISO } from "@/lib/calc";
import { canWrite } from "@/lib/permissions";
import { saveRecord } from "@/lib/rules";
import { labelOf } from "@/lib/schema";
import { useRows, useUser } from "@/lib/store";
import { Disclaimer, nativeSelect, Panel } from "./kit";

function PhotoPicker({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Take or upload a photo"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try { onChange(await readImage(f)); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not read image"); }
          e.target.value = "";
        }} />
      {value ? (
        <div className="space-y-2"><img src={value} alt="Selected" className="max-h-56 rounded-lg border object-contain" /><Button type="button" variant="outline" onClick={() => onChange(undefined)}>Remove photo</Button></div>
      ) : (
        <Button type="button" variant="outline" size="lg" className="h-14 w-full text-base" onClick={() => ref.current?.click()}><Camera className="mr-2 h-5 w-5" />Take or upload a photo</Button>
      )}
    </div>
  );
}

const URGENCY_STYLE = { Low: "bg-success/15 text-success", Moderate: "bg-warning/20 text-[hsl(30_90%_28%)]", High: "bg-danger/15 text-danger", Emergency: "bg-danger text-white" } as const;
const List = ({ title, items }: { title: string; items: string[] }) => items.length ? <div><h4 className="mb-1 text-sm font-semibold">{title}</h4><ul className="list-disc space-y-0.5 pl-5 text-sm">{items.map((i) => <li key={i}>{i}</li>)}</ul></div> : null;

function ResultView({ r, onSave, saveLabel }: { r: AiResult; onSave?: () => void; saveLabel: string }) {
  return (
    <Panel title="Result" action={<span className={`rounded-full px-3 py-1 text-xs font-bold ${URGENCY_STYLE[r.urgency]}`}>Urgency: {r.urgency}</span>}>
      <div className="space-y-4">
        <p className="text-sm">{r.summary}</p>
        <p className="text-xs text-muted-foreground">{r.source === "ai" ? "Analysed by AI from your photo and details." : "Built-in offline guide – uses your written description only, not the photo."}</p>
        {r.findings.length > 0 && (
          <div className="space-y-2">{r.findings.map((f) => (
            <div key={f.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2"><b>{f.name}</b>{f.confidence != null && <span className="text-xs text-muted-foreground">Confidence {f.confidence}%</span>}</div>
              {f.symptoms && <p className="mt-1 text-sm text-muted-foreground">Signs: {f.symptoms}</p>}
              {f.causes && <p className="text-sm text-muted-foreground">Possible cause: {f.causes}</p>}
            </div>
          ))}</div>
        )}
        <List title="Do this now" items={r.immediateActions} />
        <List title="Next steps" items={r.nextSteps} />
        <List title="Questions to ask the vet" items={r.vetQuestions} />
        <div className="text-sm"><b>Monitor:</b> {r.monitoring}</div>
        <div className="text-sm"><b>When to get a professional:</b> {r.seeProfessional}</div>
        {onSave && <Button size="lg" onClick={onSave}>{saveLabel}</Button>}
      </div>
    </Panel>
  );
}

export function CropDiseaseAI() {
  const crops = useRows("crops");
  const role = useUser().role;
  const [cropId, setCropId] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult>();
  const run = async () => {
    if (!photo && !symptoms.trim()) return toast.error("Add a photo or describe what you see");
    setBusy(true);
    try { setResult(await analyze({ kind: "crop", symptoms, imageDataUrl: photo, crop: labelOf("crops", crops.find((c) => c.id === cropId)) })); } finally { setBusy(false); }
  };
  const save = () => {
    if (!cropId || !result) return toast.error("Choose which crop this is for, then save");
    const top = result.findings[0];
    saveRecord("diagnoses", { cropId, date: todayISO(), finding: top?.name ?? "No clear match", confidence: top?.confidence != null ? `${top.confidence}%` : "–", source: "AI (recommendation)", symptoms: symptoms || top?.symptoms || "", nextSteps: [...result.immediateActions, ...result.nextSteps].join("\n") });
    toast.success("Saved to the crop’s history");
  };
  return (
    <div className="mb-6 space-y-4">
      <Disclaimer><b>Recommendation only.</b> {AI_DISCLAIMER_CROP}{!aiConfigured() && " Photo analysis needs the AI service to be connected; until then the app uses your written description."}</Disclaimer>
      <Panel title="Check a plant">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div><Label className="mb-1.5 block">Which crop?</Label>
              <select className={nativeSelect} value={cropId} onChange={(e) => setCropId(e.target.value)}><option value="">Select crop…</option>{crops.map((c) => <option key={c.id} value={c.id}>{labelOf("crops", c)}</option>)}</select></div>
            <PhotoPicker value={photo} onChange={setPhoto} />
          </div>
          <div className="space-y-3">
            <div><Label className="mb-1.5 block">What do you see?</Label><Textarea rows={5} placeholder="e.g. yellow older leaves, orange spots under the leaf, holes in leaves…" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} /></div>
            <Button size="lg" className="w-full" onClick={run} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Analyse</Button>
          </div>
        </div>
      </Panel>
      {result && <ResultView r={result} onSave={canWrite(role, "agriculture") ? save : undefined} saveLabel="Save to crop history" />}
    </div>
  );
}

export function LivestockAI() {
  const animals = useRows("animals");
  const role = useUser().role;
  const live = animals.filter((a) => a.status === "Active" || a.status === "Quarantined");
  const [animalId, setAnimalId] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [f, setF] = useState({ symptoms: "", age: "", breed: "", weight: "", history: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult>();
  const pick = (id: string) => {
    setAnimalId(id);
    const a = animals.find((x) => x.id === id);
    if (a) setF((s) => ({ ...s, age: a.dob ? ageLabel(a.dob) : s.age, breed: a.breed ?? s.breed, weight: a.currentWeight ? String(a.currentWeight) : s.weight }));
  };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const run = async () => {
    if (!photo && !f.symptoms.trim()) return toast.error("Add a photo or enter the symptoms");
    setBusy(true);
    try { setResult(await analyze({ kind: "livestock", symptoms: f.symptoms, imageDataUrl: photo, ageText: f.age, breed: f.breed, weightKg: f.weight, history: f.history })); } finally { setBusy(false); }
  };
  const save = () => {
    if (!animalId || !result) return toast.error("Choose the animal, then save");
    const top = result.findings[0];
    saveRecord("health", {
      animalId, date: todayISO(), condition: top?.name ?? "AI health assessment", symptoms: f.symptoms, diagnosis: "AI assessment – NOT a veterinary diagnosis",
      treatment: result.immediateActions.join("; "), recovery: "Ongoing", source: "AI assessment", urgency: result.urgency, notes: `Urgency: ${result.urgency}. ${result.seeProfessional}`,
    });
    toast.success("Saved to the animal’s medical history");
  };
  return (
    <div className="mb-6 space-y-4">
      <Disclaimer><b>Not a veterinary diagnosis.</b> {AI_DISCLAIMER_LIVESTOCK}{!aiConfigured() && " Photo analysis needs the AI service to be connected; until then the app uses your written description."}</Disclaimer>
      <Panel title="Describe the problem">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div><Label className="mb-1.5 block">Animal</Label>
              <select className={nativeSelect} value={animalId} onChange={(e) => pick(e.target.value)}><option value="">Select animal…</option>{live.map((a) => <option key={a.id} value={a.id}>{labelOf("animals", a)}</option>)}</select></div>
            <PhotoPicker value={photo} onChange={setPhoto} />
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="mb-1.5 block text-xs">Age</Label><Input className="h-11 md:h-10" value={f.age} onChange={set("age")} placeholder="2 y" /></div>
              <div><Label className="mb-1.5 block text-xs">Breed</Label><Input className="h-11 md:h-10" value={f.breed} onChange={set("breed")} /></div>
              <div><Label className="mb-1.5 block text-xs">Weight (kg)</Label><Input className="h-11 md:h-10" inputMode="decimal" value={f.weight} onChange={set("weight")} /></div>
            </div>
          </div>
          <div className="space-y-3">
            <div><Label className="mb-1.5 block">Symptoms</Label><Textarea rows={4} placeholder="e.g. limping on front left leg, not eating since yesterday, swollen foot…" value={f.symptoms} onChange={set("symptoms")} /></div>
            <div><Label className="mb-1.5 block">Recent health history</Label><Textarea rows={2} placeholder="Recent treatments, new feed, contact with sick animals…" value={f.history} onChange={set("history")} /></div>
            <Button size="lg" className="w-full" onClick={run} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Analyse</Button>
          </div>
        </div>
      </Panel>
      {result && <ResultView r={result} onSave={canWrite(role, "livestock") ? save : undefined} saveLabel="Save to medical history" />}
    </div>
  );
}
