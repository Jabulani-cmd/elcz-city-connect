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

## Installable app (PWA)

FarmHelper is a Progressive Web App: it installs to the home screen, opens full-screen like a native app and works offline.

**To install, open the app's own published `https://` address** (not an editor/preview frame and not a private/incognito window):
- **Android / Chrome, Edge:** tap the *Install app* card (or *More → Install app*, or the browser menu → *Install app*).
- **iPhone / iPad:** open in **Safari** → Share → *Add to Home Screen*.
- **Desktop:** install icon in the address bar.

Settings → *Install on your phone* tells you exactly why installing isn't offered (for example "inside another page" or "not https").

How it works: `public/manifest.webmanifest` (static, so it is also served by dev servers/previews) + a service worker generated at build time (`vite-plugin-pwa`) that precaches the whole app, so every screen opens with no signal; changes are saved on the device and sync later. It updates itself silently when a new version is deployed. App shortcuts: Quick record, Herd, Tasks, Alerts. The service worker only exists in production builds, so offline behaviour must be tested with `npm run build && npm run preview`.

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

## Sign-in and sign-out

Signed-out visitors land on a **home page** with Sign in / Create account buttons (the app itself is always behind sign-in), and there is Sign out in the account menu (top-right avatar), the *More* menu and the desktop sidebar. "Keep me signed in on this device" is off by default, so a closed and reopened app asks for the password again; tick it on a personal phone to skip that.

- **Without a cloud project** (default): accounts live on the device. The first run asks you to create the owner account (existing farm data on the device is kept and protected by it); the owner adds staff under *Settings → People who can sign in* with a role each. Passwords are stored only as salted PBKDF2 hashes. This keeps other people out of the app on a shared phone; it does **not** encrypt the farm records, and there is no password recovery (forgetting the owner password means erasing the device data). Staff phones don't share data.
- **With a Supabase project**: real accounts (email + password, reset by email), roles enforced by the database, data shared across devices — see below.
- Everyone can reach **My account** (`/account`) to change their password and sign out; Settings is owner-only.

## Going to production (accounts, teams, cloud sync)

Without configuration the app runs **local-only** (device accounts, data stays on the device). With a Supabase project it becomes a multi-user app: email/password sign-in, per-user roles enforced by the database, and background sync between devices.

**Using Lovable (easiest):** in Lovable open *Integrations → Supabase* and connect (Lovable Cloud, or your own Supabase project). Lovable then sets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for you – these are the names the app reads. Then run the three SQL files from `supabase/migrations` in order (ask Lovable to run them, or paste each into the Supabase **SQL editor**; `…_farm_core.sql` creates a trigger on `auth.users`, which the SQL editor allows if Lovable's migration tool refuses). Finally set the Site URL (step 1 below). The app's Supabase client lives in `src/lib/supabaseClient.ts` on purpose: Lovable regenerates `src/integrations/supabase/*`, so don't move it back there.

**Or by hand:**

1. **Create a Supabase project** (supabase.com). In *Authentication → URL Configuration* set the Site URL to your published app URL (used by confirmation and password-reset emails).
2. **Create the database.** Apply the migrations in `supabase/migrations` in order (`supabase link --project-ref <ref>` then `supabase db push`, or paste them into the SQL editor):
   - `…_farm_core.sql` – profiles, farms, membership, roles, invitations, helper functions
   - `…_farm_tables.sql` – 39 data tables **generated from `src/lib/schema.ts`** (`npx vite-node scripts/gen-schema.ts` regenerates it after you change fields), with row-level security
   - `…_storage_audit.sql` – private `farm-files` bucket for receipts/documents and the audit trail
3. **Point the app at it.** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API) in `.env`, or in Lovable via its Supabase integration. The publishable (anon) key is safe in the browser; row-level security is what protects the data.
4. **Optional – AI photo analysis.** `supabase functions deploy farm-ai`, set secrets `ANTHROPIC_API_KEY` and `AI_MODEL`, and set `VITE_AI_ENDPOINT=https://<ref>.supabase.co/functions/v1/farm-ai`. Signed-in users' tokens are sent automatically.
5. **Backups.** Turn on daily backups / point-in-time recovery in *Database → Backups*.

How it behaves:
- The first person to sign up and create a farm becomes its **Owner**. Owners invite others by email under *Settings → Team & access* and pick a role (Farm Manager, Veterinarian, Agronomist, Employee, Accountant, Viewer). The invited person creates an account with that email and the farm appears.
- Permissions are checked by the database (`can_write` in `farm_core.sql`), not just hidden in the UI, and mirror `src/lib/permissions.ts`. Farms are isolated from each other.
- Everything is saved on the device first and uploaded in the background (also after reconnecting). Edits made offline sync later; deletions are soft so other devices learn about them. If the server refuses a change (e.g. no permission) it is listed in *Settings → Data* instead of silently disappearing.
- Sign-in survives going offline; the first load of a new device needs a connection.
- Data previously saved on a device (before sign-in) can be uploaded to the account from a banner shown after sign-in. Sample data is never uploaded.

## Status — what is and isn't done

Done and tested: all modules above; sign-in, roles, team invitations, sync engine (unit-tested with a fake server), the SQL (tested on PostgreSQL 16: isolation between farms, per-role writes, invitations, last-owner protection, audit, and every field of the sample farm fits its table), and the browser client against a mock Supabase backend.

Not verified against a live Supabase project (none was available while building) – do a quick pass after step 3 above: sign up, create a farm, add an animal, then sign in on a second device.

Still to do:
- Email/SMS sending (preferences are saved; push works while the app is open) and IoT, satellite, marketplace and payment integrations from the roadmap.
- Realtime push updates (devices currently sync on change, on focus/reconnect and every minute).
- Conflict handling is "last write wins" per record.
