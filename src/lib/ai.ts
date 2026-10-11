/**
 * AI helpers for crop and livestock health.
 *
 * With VITE_AI_ENDPOINT set (see supabase/functions/farm-ai) photos and details are analysed by an AI model.
 * Without it – or when offline – the app falls back to a built-in symptom guide that works without internet
 * but cannot look at photos. Both paths return the same shape and both are clearly labelled as advice, not diagnosis.
 */
export type Urgency = "Low" | "Moderate" | "High" | "Emergency";

export type AiFinding = { name: string; confidence?: number; symptoms?: string; causes?: string };
export type AiResult = {
  source: "ai" | "guide";
  summary: string;
  findings: AiFinding[];
  urgency: Urgency;
  immediateActions: string[];
  nextSteps: string[];
  vetQuestions: string[];
  monitoring: string;
  seeProfessional: string;
};

export type AiInput = {
  kind: "crop" | "livestock";
  symptoms: string;
  imageDataUrl?: string;
  crop?: string;
  breed?: string;
  ageText?: string;
  weightKg?: string;
  history?: string;
};

import { getAccessToken } from "./auth";

const ENDPOINT = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
const KEY = import.meta.env.VITE_AI_KEY as string | undefined;

export const aiConfigured = () => !!ENDPOINT;

export async function analyze(input: AiInput): Promise<AiResult> {
  if (ENDPOINT && navigator.onLine) {
    try {
      const token = (await getAccessToken()) ?? KEY;
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(KEY ? { apikey: KEY } : {}) },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`AI service returned ${res.status}`);
      const data = (await res.json()) as AiResult;
      return { ...data, source: "ai" };
    } catch {
      /* fall through to the offline guide */
    }
  }
  return guide(input);
}

/** Downscale a photo so uploads stay small on mobile data. */
export function readImage(file: File, max = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image")); };
    img.src = url;
  });
}

type Rule = { match: RegExp; name: string; causes: string; actions: string[]; urgency: Urgency; confidence: number };

const LIVESTOCK_RULES: Rule[] = [
  { match: /(blood|bloody).*(urine|dung|faec)|redwater|dark urine|pale gum|anaemi/i, name: "Tick-borne disease (e.g. redwater / anaplasmosis)", causes: "Parasites spread by ticks.", actions: ["Isolate the animal in shade with water", "Check for ticks and record temperature", "Call the vet today – treatment works best early"], urgency: "High", confidence: 55 },
  { match: /lump|nodule|skin.*(bump|swell)|lumpy/i, name: "Lumpy skin disease (notifiable) or insect/skin reaction", causes: "Virus spread by biting insects; can also be allergic or abscess.", actions: ["Isolate from the herd", "Do not move animals off the farm", "Report to your veterinary authority if lumps are widespread"], urgency: "High", confidence: 45 },
  { match: /abort|stillb|retained (placenta|afterbirth)|premature calf/i, name: "Abortion (possible brucellosis or other infection)", causes: "Infectious causes (e.g. brucellosis), nutrition or stress.", actions: ["Isolate the cow and wear gloves when handling material", "Keep the foetus/placenta for vet testing", "Do not mix with pregnant cows"], urgency: "High", confidence: 50 },
  { match: /bloat|swollen (left )?(side|belly|abdomen)|distended/i, name: "Bloat", causes: "Gas trapped in the rumen, often after lush pasture or sudden feed change.", actions: ["Keep the animal standing and walking", "Remove access to lush pasture/grain", "Call the vet immediately if breathing is laboured"], urgency: "Emergency", confidence: 60 },
  { match: /scour|diarrh|loose (dung|stool)|watery dung/i, name: "Scours / diarrhoea", causes: "Infection, parasites, or feed change; dangerous in calves due to dehydration.", actions: ["Provide clean water and electrolytes", "Separate from healthy animals", "Check calf hydration (skin pinch, sunken eyes)"], urgency: "Moderate", confidence: 55 },
  { match: /cough|nasal discharge|runny nose|laboured breath|breathing|pneumon/i, name: "Respiratory disease (e.g. pneumonia)", causes: "Bacterial or viral infection, dust, stress or transport.", actions: ["Move to a well-ventilated, dry area", "Take temperature", "Ask the vet about antibiotics"], urgency: "High", confidence: 55 },
  { match: /limp|lame|swollen (foot|hoof|leg)|hoof/i, name: "Lameness (foot rot, injury or hoof problem)", causes: "Foot rot, hoof overgrowth, injury or laminitis.", actions: ["Inspect the foot for stones, cuts, swelling or smell", "Keep on soft, dry ground", "Trim/clean hoof; call vet if no improvement in 48 h"], urgency: "Moderate", confidence: 55 },
  { match: /eye.*(water|cloud|red|discharge)|pink ?eye|squint/i, name: "Pinkeye (infectious keratoconjunctivitis)", causes: "Bacteria spread by flies and dust.", actions: ["Shade the animal", "Control flies", "Vet treatment prevents ulcers"], urgency: "Moderate", confidence: 55 },
  { match: /udder|mastitis|hot.*teat|clots? in milk/i, name: "Mastitis", causes: "Bacterial infection of the udder.", actions: ["Strip the quarter and check milk", "Keep bedding clean", "Ask the vet about intramammary treatment"], urgency: "High", confidence: 55 },
  { match: /fever|off (feed|food)|not eating|lethargic|depress|dull|weak/i, name: "General infection or tick-borne illness", causes: "Many infections start with fever and loss of appetite.", actions: ["Take rectal temperature (normal 38–39.5 °C)", "Isolate and offer water", "Check for ticks, swellings and discharge"], urgency: "Moderate", confidence: 40 },
  { match: /thin|losing weight|poor condition|emaciat|rough coat/i, name: "Poor body condition (nutrition, worms or chronic disease)", causes: "Low feed quality, internal parasites, or chronic illness.", actions: ["Review feed and mineral supply", "Weigh and compare with the herd", "Consider a worm-egg count"], urgency: "Low", confidence: 45 },
  { match: /snake|bite|bitten/i, name: "Possible snake bite", causes: "Venomous bite.", actions: ["Keep the animal calm and still", "Call the vet immediately"], urgency: "Emergency", confidence: 50 },
  { match: /calv(ing)? (difficult|problem|stuck)|dystocia|straining/i, name: "Calving difficulty (dystocia)", causes: "Large calf, malposition or weak labour.", actions: ["Call the vet now if no progress after 1 hour of hard straining", "Keep the cow calm and clean"], urgency: "Emergency", confidence: 60 },
];

const CROP_RULES: Rule[] = [
  { match: /yellow.*(lower|older|bottom)|older leaves.*yellow|pale green/i, name: "Nitrogen deficiency", causes: "Low nitrogen in the soil or waterlogging.", actions: ["Apply a nitrogen top-dressing (e.g. AN or urea) per local recommendation", "Check drainage"], urgency: "Moderate", confidence: 55 },
  { match: /orange|rust|pustule|powder.*(orange|brown)/i, name: "Rust (fungal)", causes: "Fungus favoured by warm, humid conditions.", actions: ["Apply a registered fungicide", "Avoid overhead irrigation late in the day", "Remove heavily infected plants"], urgency: "High", confidence: 55 },
  { match: /white.*(powder|coat)|mildew/i, name: "Powdery mildew", causes: "Fungus in dry days/cool nights and crowded plants.", actions: ["Improve airflow", "Apply sulphur or a registered fungicide"], urgency: "Moderate", confidence: 55 },
  { match: /hole|chewed|caterpillar|frass|whorl|armyworm|bore/i, name: "Insect damage (e.g. fall armyworm, stalk borer)", causes: "Caterpillars feeding on leaves and growing points.", actions: ["Scout 20 plants and count damaged ones", "Spray a registered insecticide into the whorl early morning or evening"], urgency: "High", confidence: 55 },
  { match: /wilt|droop|collapse/i, name: "Water stress or root/stem disease", causes: "Too little or too much water, root rot, bacterial wilt or pests at the roots.", actions: ["Check soil moisture and irrigation", "Dig up one plant to inspect roots and stem base"], urgency: "High", confidence: 45 },
  { match: /purple|reddish.*leaf|stunted/i, name: "Phosphorus deficiency", causes: "Low phosphorus or cold soils.", actions: ["Soil test", "Apply phosphate fertilizer"], urgency: "Moderate", confidence: 45 },
  { match: /brown spots?|leaf spot|blight|lesion|water.?soaked/i, name: "Leaf spot / blight (fungal or bacterial)", causes: "Splashing water and humid weather.", actions: ["Remove affected leaves", "Rotate crops", "Apply a registered fungicide if spreading"], urgency: "Moderate", confidence: 50 },
  { match: /curl|mosaic|mottl|distort/i, name: "Viral disease or herbicide drift", causes: "Viruses spread by aphids/whiteflies, or spray drift.", actions: ["Control insect vectors", "Remove infected plants", "Ask an agronomist to confirm"], urgency: "Moderate", confidence: 40 },
];

function guide(i: AiInput): AiResult {
  const rules = i.kind === "crop" ? CROP_RULES : LIVESTOCK_RULES;
  const text = `${i.symptoms} ${i.history ?? ""}`;
  const hits = rules.filter((r) => r.match.test(text));
  const order: Urgency[] = ["Low", "Moderate", "High", "Emergency"];
  const urgency = hits.reduce<Urgency>((u, r) => (order.indexOf(r.urgency) > order.indexOf(u) ? r.urgency : u), hits.length ? "Low" : "Moderate");
  const noImage = i.imageDataUrl ? "The photo could not be analysed offline, so this guidance uses your written description only. " : "";
  if (!hits.length) {
    return {
      source: "guide", urgency,
      summary: `${noImage}No clear match for the symptoms you described. Add more detail (what you see, where, since when, how many ${i.kind === "crop" ? "plants" : "animals"}).`,
      findings: [], immediateActions: i.kind === "crop" ? ["Photograph affected and healthy plants side by side", "Check soil moisture and look under leaves for pests"] : ["Take the animal’s temperature", "Isolate if it is off feed or breathing hard"],
      nextSteps: ["Describe symptoms in more detail and try again"], vetQuestions: i.kind === "livestock" ? ["What could cause these symptoms in this breed and age?", "Which tests would confirm the cause?"] : [],
      monitoring: "Check again in 24 hours.", seeProfessional: i.kind === "crop" ? "Contact an agronomist if it spreads or you are unsure." : "Call your veterinarian if the animal worsens, stops eating or drinking.",
    };
  }
  const top = hits.slice(0, 3);
  return {
    source: "guide", urgency,
    summary: `${noImage}Based on the symptoms described, the most likely issue${top.length > 1 ? "s are" : " is"} ${top.map((t) => t.name).join("; ")}.`,
    findings: top.map((t) => ({ name: t.name, confidence: t.confidence, causes: t.causes, symptoms: i.symptoms })),
    immediateActions: [...new Set(top.flatMap((t) => t.actions))],
    nextSteps: i.kind === "crop" ? ["Scout the rest of the field to see how widespread it is", "Record what you applied and when, then re-check in 5–7 days"] : ["Record temperature, appetite and any treatment given", "Re-check twice daily"],
    vetQuestions: i.kind === "livestock" ? [`Could this be ${top[0].name.toLowerCase()}? What tests confirm it?`, "What treatment and withdrawal period apply?", "Should other animals be isolated, tested or vaccinated?"] : [],
    monitoring: urgency === "Emergency" ? "Watch continuously until help arrives." : urgency === "High" ? "Re-check every few hours today and again tomorrow." : "Re-check daily for 3–5 days.",
    seeProfessional: urgency === "Emergency" || urgency === "High" ? (i.kind === "crop" ? "Contact an agronomist soon, before the problem spreads." : "Call your veterinarian today.") : i.kind === "crop" ? "Contact an agronomist if it spreads or does not improve in a week." : "Call your veterinarian if there is no improvement in 24–48 hours.",
  };
}

export const AI_DISCLAIMER_CROP = "AI output is a recommendation, not a definitive professional diagnosis. Confirm serious or spreading problems with an agronomist before spending on treatment.";
export const AI_DISCLAIMER_LIVESTOCK = "This is not a veterinary diagnosis and does not replace professional veterinary care. If an animal is in distress, call your veterinarian.";
