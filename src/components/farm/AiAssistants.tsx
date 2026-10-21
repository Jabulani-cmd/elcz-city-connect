import { AlertTriangle, Camera, Clock, Loader2, ShieldAlert, Siren, Sparkles, Stethoscope, Video, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AI_DISCLAIMER_CROP, AI_DISCLAIMER_LIVESTOCK, aiConfigured, analyze, readImage, type AiResult, type CareAdvice } from "@/lib/ai";
import { ageLabel, todayISO } from "@/lib/calc";
import { canWrite } from "@/lib/permissions";
import { saveRecord } from "@/lib/rules";
import { labelOf, SPECIES } from "@/lib/schema";
import { MAX_PHOTOS, readVideoFrames, VET_SYMPTOM_GROUPS } from "@/lib/vet";
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

function CareBanner({ care }: { care: CareAdvice }) {
  const now = care.vetTiming === "Immediately";
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="alert">
      <div className={`flex items-start gap-3 rounded-xl p-3 ${now ? "bg-danger text-danger-foreground" : care.vetTiming === "Within 24 hours" ? "bg-danger/15 text-danger" : "bg-success/15 text-success"}`}>
        {now ? <Siren className="mt-0.5 h-6 w-6 shrink-0" /> : care.vetTiming === "Within 24 hours" ? <Stethoscope className="mt-0.5 h-6 w-6 shrink-0" /> : <Clock className="mt-0.5 h-6 w-6 shrink-0" />}
        <div><div className="text-base font-extrabold">{now ? "See a vet immediately" : care.vetTiming === "Within 24 hours" ? "Call a vet today" : "Treat at home and watch"}</div>
          <div className="text-sm">{now ? "Call your vet or veterinary officer now." : care.vetTiming === "Within 24 hours" ? "Get a vet to see the animal within 24 hours." : "Call a vet if there is no improvement in 24–48 hours."}</div></div>
      </div>
      <div className={`flex items-start gap-3 rounded-xl p-3 ${care.isolate ? "bg-warning/25 text-foreground" : "bg-muted text-foreground"}`}>
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0" />
        <div><div className="text-base font-extrabold">{care.isolate ? "Isolate this animal" : "No need to isolate"}</div>
          <div className="text-sm">{care.isolate ? "Keep it apart from the herd with its own water and feed until a vet clears it." : "Keep it comfortable and check on it often."}</div></div>
      </div>
      {care.notifiable && (
        <div className="flex items-start gap-3 rounded-xl border-2 border-danger p-3 sm:col-span-2">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-danger" />
          <div className="text-sm"><b>Possible notifiable disease.</b> By law this must be reported to the veterinary officer. Do not move or sell animals until you have been told it is safe.</div>
        </div>
      )}
    </div>
  );
}

function ResultView({ r, onSave, saveLabel }: { r: AiResult; onSave?: () => void; saveLabel: string }) {
  return (
    <Panel title="Result" action={<span className={`rounded-full px-3 py-1 text-xs font-bold ${URGENCY_STYLE[r.urgency]}`}>Urgency: {r.urgency}</span>}>
      <div className="space-y-4">
        {r.care && <CareBanner care={r.care} />}
        <p className="text-sm">{r.summary}</p>
        <p className="text-xs text-muted-foreground">{r.source === "ai" ? "Analysed by AI from your photos, video and details." : "Built-in offline guide – uses the symptoms you chose and wrote, not the photos or video."}</p>
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

/** "AI vet": photos, a short video and a symptom pick-list → likely causes, isolate or not, and how soon to see a vet. */
export function VetCheck() {
  const animals = useRows("animals");
  const role = useUser().role;
  const [species, setSpecies] = useState("Cattle");
  const [animalId, setAnimalId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<{ name: string; frames: string[] }>();
  const [readingVideo, setReadingVideo] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult>();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const candidates = animals.filter((a) => (a.status === "Active" || a.status === "Quarantined") && (!a.species || a.species === species));
  const animal = animals.find((a) => a.id === animalId);

  const addPhotos = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, MAX_PHOTOS - photos.length);
    if (files && files.length > list.length) toast.message(`Up to ${MAX_PHOTOS} photos – extra ones were skipped`);
    try { const read = await Promise.all(list.map((f) => readImage(f))); setPhotos((p) => [...p, ...read].slice(0, MAX_PHOTOS)); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not read image"); }
  };
  const addVideo = async (file?: File) => {
    if (!file) return;
    setReadingVideo(true);
    try { setVideo({ name: file.name, frames: await readVideoFrames(file) }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not read video"); }
    finally { setReadingVideo(false); }
  };
  const addSymptom = (s: string) => { if (s && !symptoms.includes(s)) setSymptoms((x) => [...x, s]); };

  const run = async () => {
    if (!symptoms.length && !notes.trim() && !photos.length && !video) return toast.error("Choose at least one symptom, or add a photo or video");
    setBusy(true);
    setResult(undefined);
    try {
      setResult(await analyze({
        kind: "livestock", species, selectedSymptoms: symptoms, symptoms: [...symptoms, notes.trim()].filter(Boolean).join("; "),
        imageDataUrls: [...photos, ...(video?.frames ?? [])],
        breed: animal?.breed, ageText: animal?.dob ? ageLabel(animal.dob) : undefined, weightKg: animal?.currentWeight ? String(animal.currentWeight) : undefined,
        history: video ? "Some pictures are still frames taken in order from a short video." : undefined,
      }));
    } finally { setBusy(false); }
  };
  const save = () => {
    if (!animalId || !result) return toast.error("Choose the animal at the top, then save");
    const top = result.findings[0];
    saveRecord("health", {
      animalId, date: todayISO(), condition: top?.name ?? "AI vet check", symptoms: symptoms.concat(notes.trim() ? [notes.trim()] : []).join("; "), diagnosis: "AI assessment – NOT a veterinary diagnosis",
      treatment: result.immediateActions.join("; "), recovery: "Ongoing", source: "AI assessment", urgency: result.urgency,
      notes: `Urgency: ${result.urgency}. Vet: ${result.care?.vetTiming ?? "–"}. ${result.care?.isolate ? "Isolate." : ""} ${result.seeProfessional}`.trim(),
    });
    toast.success("Saved to the animal’s medical history");
  };

  return (
    <div className="space-y-4">
      <Disclaimer><b>Not a veterinary diagnosis.</b> {AI_DISCLAIMER_LIVESTOCK}{!aiConfigured() && " Photo and video analysis needs the AI service to be connected; until then the app uses the symptoms you choose."}</Disclaimer>
      <Panel title="1. Which animal?">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="vet-species" className="mb-1.5 block">Type of animal</Label>
            <select id="vet-species" className={nativeSelect} value={species} onChange={(e) => { setSpecies(e.target.value); setAnimalId(""); }}>{SPECIES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><Label htmlFor="vet-animal" className="mb-1.5 block">From your records (optional)</Label>
            <select id="vet-animal" className={nativeSelect} value={animalId} onChange={(e) => setAnimalId(e.target.value)}><option value="">Not in my records / whole group</option>{candidates.map((a) => <option key={a.id} value={a.id}>{labelOf("animals", a)}</option>)}</select></div>
        </div>
      </Panel>

      <Panel title="2. Photos and video">
        <input ref={photoRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Add photos" onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
        <input ref={videoRef} type="file" accept="video/*" capture="environment" className="sr-only" aria-label="Record or upload a video" onChange={(e) => { void addVideo(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" size="lg" className="h-14 text-base" disabled={photos.length >= MAX_PHOTOS} onClick={() => photoRef.current?.click()}><Camera className="mr-2 h-5 w-5" />{photos.length ? `Add photo (${photos.length}/${MAX_PHOTOS})` : "Take or add photos"}</Button>
          <Button type="button" variant="outline" size="lg" className="h-14 text-base" disabled={readingVideo} onClick={() => videoRef.current?.click()}>{readingVideo ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Video className="mr-2 h-5 w-5" />}{video ? "Replace video" : "Record or add a video"}</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Tip: show the problem close up, plus the whole animal standing and walking. Short videos (under 30 seconds) work best.</p>
        {(photos.length > 0 || video) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-lg border object-cover" />
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((x) => x.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 rounded-full border bg-background p-1 shadow"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {video && (
              <div className="relative flex items-center gap-1 rounded-lg border p-1">
                {video.frames.map((f, i) => <img key={i} src={f} alt={`Video frame ${i + 1}`} className="h-[70px] w-[52px] rounded object-cover" />)}
                <span className="flex items-center gap-1 px-1 text-xs text-muted-foreground"><Video className="h-3.5 w-3.5" />Video</span>
                <button type="button" aria-label="Remove video" onClick={() => setVideo(undefined)} className="absolute -right-2 -top-2 rounded-full border bg-background p-1 shadow"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel title="3. Symptoms">
        <Label htmlFor="vet-symptom" className="mb-1.5 block">Choose every symptom you see</Label>
        <select id="vet-symptom" className={nativeSelect} value="" onChange={(e) => addSymptom(e.target.value)}>
          <option value="">{symptoms.length ? "Add another symptom…" : "Select a symptom…"}</option>
          {VET_SYMPTOM_GROUPS.map((g) => <optgroup key={g.group} label={g.group}>{g.symptoms.map((s) => <option key={s} value={s} disabled={symptoms.includes(s)}>{s}</option>)}</optgroup>)}
        </select>
        {symptoms.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Chosen symptoms">
            {symptoms.map((s) => (
              <li key={s} className="flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-sm text-primary">
                {s}<button type="button" aria-label={`Remove ${s}`} onClick={() => setSymptoms((x) => x.filter((y) => y !== s))} className="rounded-full p-1 hover:bg-primary/15"><X className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
        <Label htmlFor="vet-notes" className="mb-1.5 mt-4 block">Anything else? (optional)</Label>
        <Textarea id="vet-notes" rows={3} placeholder="How long has it been sick? How many animals? Any recent treatment, new feed or new animals?" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button size="lg" className="mt-4 h-12 w-full text-base" onClick={run} disabled={busy || readingVideo}>{busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Stethoscope className="mr-2 h-5 w-5" />}{busy ? "Checking…" : "Get diagnosis and advice"}</Button>
      </Panel>

      {result && <ResultView r={result} onSave={animalId && canWrite(role, "livestock") ? save : undefined} saveLabel="Save to medical history" />}
    </div>
  );
}
