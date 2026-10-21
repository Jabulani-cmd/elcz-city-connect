# Project rules

- AI health checks (crop and livestock) go through `src/lib/ai.ts` `analyze()`, which calls the `farm-ai` function when `VITE_AI_ENDPOINT` is set and otherwise falls back to the built-in offline rules — keep both paths returning the same `AiResult` shape so the screens work with or without internet.
- Videos in the vet check are turned into still frames in the browser (`src/lib/vet.ts`) before sending — the AI model reads pictures, not video files.
- Every option in the vet symptom drop-down must be recognised by the offline livestock rules — `src/lib/vet.test.ts` enforces this so offline users never get "no match" for a listed symptom.
- Livestock results always carry `care` (isolate / how soon to see a vet / notifiable); `withCare()` never lets the AI recommend waiting longer than the urgency allows.
