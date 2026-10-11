# FarmHelper

One platform to manage the entire farm — crops and livestock, with shared finance, employees, inventory, reports, notifications and documents. Mobile-first and **offline-first**: everything is saved on the device and works without a connection.

## Run it

```sh
npm install
npm run dev        # http://localhost:8080
npm test           # calculation + analytics tests
npm run build
```

On first launch a demo farm ("Green Valley Farm") is loaded so every screen has data. Remove it under **Settings → Data**.

## What's in it

| Area | Highlights |
|---|---|
| Dashboard | Farm / money / livestock / crop KPIs, colour-coded alerts, charts, period filter |
| Agricultural Farming | Crops (auto revenue, cost, profit), fields, planting, harvest, fertilizer, crop protection, irrigation, AI crop-disease check |
| Livestock Farming | Herd registry + animal profiles, herd statistics over time, weights (auto gain/ADG), pastures with rotational moves and warnings, health, vaccinations, quarantine, AI health assistant, feed stock, feedlot analytics, purchases, sales, breeding, births, mortality analytics |
| Tasks | List, calendar and kanban board |
| Farm Map | SVG map from GPS coordinates (fields, pastures, dams, barns…) |
| Finance | Income/expenses with receipts, budgets, profitability by crop/field/animal/herd/pasture/feedlot/cycle/month/year |
| Reports | 30 reports, exportable to PDF (print), Excel and CSV |
| AI Farm Assistant | Answers questions from the farm's own records |
| Notifications | Automatic alerts + per-type channel preferences, browser push |
| Settings | Farm profile, multiple farms, roles, audit log, backup/restore |

Business rules live in `src/lib/rules.ts` (e.g. a purchase creates the animal and an expense; a sale marks the animal Sold and books income; a birth adds the calf; weights recompute gain and ADG). Pure maths is in `src/lib/calc.ts` with tests.

## Architecture

- `src/lib/schema.ts` – declarative definition of every record type (fields, derived columns, labels). Adding a module is mostly a new entry here plus a tab.
- `src/lib/store.ts` – local-first store (localStorage + IndexedDB for files), outbox of pending changes, audit log, farm-level isolation.
- `src/lib/sync.ts` – sync adapter hook that drains the outbox when online.
- Agriculture and Livestock are separate modules sharing finance, employees, inventory, reports, notifications and users.
- `supabase/migrations` – relational schema (all the entities in the brief), role-based RLS, audit triggers.

## Status — what is and isn't connected

Built and working in the browser: everything above, using on-device storage.

Not connected yet (needs a backend you configure):
- **Sign-in and per-user enforcement.** Roles are enforced in the UI and in the SQL policies, but the app has no login yet, so the role selector in Settings is a preview, not a security boundary.
- **Cloud sync.** The outbox and `registerSyncAdapter` are in place; no adapter pushes to the Supabase schema yet.
- **AI photo analysis.** Deploy `supabase/functions/farm-ai` (secrets `ANTHROPIC_API_KEY`, `AI_MODEL`) and set `VITE_AI_ENDPOINT` / `VITE_AI_KEY`. Until then the AI screens use a built-in offline symptom guide (text only, no photo analysis). All AI output is labelled as advice, not a diagnosis.
- **Email / SMS sending** (preferences are saved) and IoT, satellite, marketplace and payment integrations from the roadmap.
- **Encryption at rest and automatic backups** come from the hosted database; the app offers manual backup/restore.
