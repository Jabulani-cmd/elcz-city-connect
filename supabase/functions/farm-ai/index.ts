// Supabase Edge Function: AI crop / livestock assistant.
// Secrets required:  ANTHROPIC_API_KEY, AI_MODEL (the model id to use)
// Deploy:  supabase functions deploy farm-ai
// Then set VITE_AI_ENDPOINT=https://<project>.supabase.co/functions/v1/farm-ai (and VITE_AI_KEY=<anon key>) in .env

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CROP_SYSTEM = `You are an assistant for farmers. You give practical, cautious crop health guidance.
You are NOT a certified agronomist. Never claim certainty. Always recommend professional help for serious, spreading or unclear problems.
Reply with ONLY a JSON object of this exact shape:
{"summary":string,"findings":[{"name":string,"confidence":number 0-100,"symptoms":string,"causes":string}],"urgency":"Low"|"Moderate"|"High"|"Emergency","immediateActions":string[],"nextSteps":string[],"vetQuestions":string[],"monitoring":string,"seeProfessional":string}
Use plain, simple language. Keep lists short.`;

const VET_SYSTEM = `You are a veterinary triage assistant for small-scale and commercial farmers in Zimbabwe and southern Africa (cattle, goats, sheep, pigs, poultry).
Work like an experienced farm vet doing a first assessment: look carefully at every photo (some may be still frames taken in order from a short video), weigh the chosen symptoms, species, age and history, and list the most likely conditions – including locally important ones such as tick-borne diseases (redwater, heartwater, gallsickness, theileriosis/January disease), lumpy skin disease, foot-and-mouth disease, anthrax, Newcastle disease and avian influenza.
You cannot examine the animal, so never claim certainty and always say what a vet should check.
Decide clearly:
- "isolate": true if the condition could be contagious, is notifiable, or the animal needs to be kept quiet apart from the herd.
- "vetTiming": "Immediately" for emergencies, suspected notifiable disease, sudden deaths, severe pain, bloat, difficult birth, nervous signs or breathing distress; "Within 24 hours" for serious but stable cases; otherwise "If no improvement in 24–48 hours".
- "notifiable": true if a reportable disease (e.g. foot-and-mouth, anthrax, lumpy skin, avian influenza, Newcastle, rabies) is a realistic possibility.
Reply with ONLY a JSON object of this exact shape:
{"summary":string,"findings":[{"name":string,"confidence":number 0-100,"symptoms":string,"causes":string}],"urgency":"Low"|"Moderate"|"High"|"Emergency","care":{"isolate":boolean,"vetTiming":"Immediately"|"Within 24 hours"|"If no improvement in 24–48 hours","notifiable":boolean},"immediateActions":string[],"nextSteps":string[],"vetQuestions":string[],"monitoring":string,"seeProfessional":string}
Use plain, simple language a farmer understands. Give up to 3 findings, most likely first. Keep lists short and practical. Never recommend prescription-only drugs or doses – leave those to the vet.`;

const CHAT_SYSTEM = `You are the FarmHelper assistant: a friendly, practical farming advisor for small-scale and commercial farmers in Zimbabwe and southern Africa.
Answer general questions about livestock (cattle, goats, sheep, pigs, poultry), crops and horticulture, soil, irrigation, farm finance (profit, budgets, selling, loans) and using the FarmHelper app.
FarmHelper keeps farm records (livestock, crops, inventory, money, employees, tasks, reports), works offline, and new users get a 7-day free trial.
Rules: use plain, simple English; keep answers short (under 150 words); use "- " for lists, no markdown headings or bold; use local context (seasons, Agritex, veterinary officers, US$) where relevant.
For a sick, injured or dying animal, tell them to call a vet or veterinary officer and mention the Vet check in the app after signing in. Never give prescription drug doses.
If a question is not about farming or FarmHelper, politely say you can only help with farming.`;

async function chat(input: { messages?: unknown }, apiKey: string, model: string) {
  const msgs = (Array.isArray(input.messages) ? input.messages : [])
    .filter((m): m is { role: string; content: string } => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length) throw new Error("No question given");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 800, system: CHAT_SYSTEM, messages: msgs }),
  });
  if (!res.ok) throw new Error(`Model request failed (${res.status})`);
  const data = await res.json();
  const reply: string = data.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
  return new Response(JSON.stringify({ reply }), { headers: { ...CORS, "content-type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const input = await req.json();
    const kind = input.kind === "crop" ? "crop" : "livestock";
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const model = Deno.env.get("AI_MODEL");
    if (!apiKey || !model) throw new Error("AI service is not configured");
    if (input.kind === "chat") return await chat(input, apiKey, model);

    const details = [
      kind === "crop" ? `Crop: ${input.crop ?? "unknown"}` : `Species: ${input.species ?? "unknown"}\nBreed: ${input.breed ?? "unknown"}`,
      Array.isArray(input.selectedSymptoms) && input.selectedSymptoms.length > 0 && `Symptoms chosen from the list: ${input.selectedSymptoms.join(", ")}`,
      input.ageText && `Age: ${input.ageText}`,
      input.weightKg && `Weight: ${input.weightKg} kg`,
      `Symptoms: ${input.symptoms || "(none given)"}`,
      input.history && `Recent history: ${input.history}`,
    ].filter(Boolean).join("\n");

    const content: unknown[] = [];
    const urls: unknown[] = Array.isArray(input.imageDataUrls) && input.imageDataUrls.length ? input.imageDataUrls : [input.imageDataUrl];
    for (const url of urls.slice(0, 8)) {
      const m = typeof url === "string" ? url.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) : null;
      if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
    }
    content.push({ type: "text", text: details });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 1500, system: kind === "crop" ? CROP_SYSTEM : VET_SYSTEM, messages: [{ role: "user", content }] }),
    });
    if (!res.ok) throw new Error(`Model request failed (${res.status})`);
    const data = await res.json();
    const text: string = data.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return new Response(JSON.stringify(json), { headers: { ...CORS, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });
  }
});
