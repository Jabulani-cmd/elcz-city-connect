# Project rules

- AI health checks (crop and livestock) go through `src/lib/ai.ts` `analyze()`, which calls the `farm-ai` function when `VITE_AI_ENDPOINT` is set and otherwise falls back to the built-in offline rules — keep both paths returning the same `AiResult` shape so the screens work with or without internet.
- Videos in the vet check are turned into still frames in the browser (`src/lib/vet.ts`) before sending — the AI model reads pictures, not video files.
- Every option in the vet symptom drop-down must be recognised by the offline livestock rules — `src/lib/vet.test.ts` enforces this so offline users never get "no match" for a listed symptom.
- Livestock results always carry `care` (isolate / how soon to see a vet / notifiable); `withCare()` never lets the AI recommend waiting longer than the urgency allows.
- The home page assistant (`src/lib/farmChat.ts`) uses the same `farm-ai` function with `kind: "chat"` and falls back to built-in answers; every suggested question must have a built-in answer (`farmChat.test.ts`), and sick-animal questions always point to a vet.
- Offline worker (`vite.config.ts`, `src/lib/pwa.ts`): page loads are network-first (`navigateFallback: null`, `directoryIndex: null`, runtime NetworkFirst with precache fallback) so an installed app shows the newest publish when opened online; never go back to serving the HTML from the precache first. A new worker found right after launch (nothing typed yet) is applied at once; otherwise the Update bar asks, so half-filled forms aren't lost.
