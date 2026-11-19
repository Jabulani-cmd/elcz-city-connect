# FarmHelper

One platform to manage the entire farm: crops and livestock, with shared finance, employees, inventory, reports, notifications and documents. Mobile-first and **offline-first**: everything is saved on the device and works without a connection.

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
| Reports | 28 reports, exportable to PDF (print), Excel and CSV |
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
- **With a Supabase project**: real accounts (email + password, reset by email), roles enforced by the database, data shared across devices. See below.
- Everyone can reach **My account** (`/account`) to change their password and sign out; Settings is owner-only.

## Going to production (accounts, teams, cloud sync)

Without configuration the app runs **local-only** (device accounts, data stays on the device). With a Supabase project it becomes a multi-user app: email/password sign-in, per-user roles enforced by the database, and background sync between devices.

**Using Lovable (easiest):** in Lovable open *Integrations → Supabase* and connect (Lovable Cloud, or your own Supabase project). Lovable then sets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for you – these are the names the app reads. Then run the four SQL files from `supabase/migrations` in order (ask Lovable to run them, or paste each into the Supabase **SQL editor**; `…_farm_core.sql` creates a trigger on `auth.users`, which the SQL editor allows if Lovable's migration tool refuses). Finally set the Site URL (step 1 below). The app's Supabase client lives in `src/lib/supabaseClient.ts` on purpose: Lovable regenerates `src/integrations/supabase/*`, so don't move it back there.

**Or by hand:**

1. **Create a Supabase project** (supabase.com). In *Authentication → URL Configuration* set the Site URL to your published app URL (used by confirmation and password-reset emails).
2. **Create the database.** Apply the migrations in `supabase/migrations` in order (`supabase link --project-ref <ref>` then `supabase db push`, or paste them into the SQL editor):
   - `…_farm_core.sql` – profiles, farms, membership, roles, invitations, helper functions
   - `…_farm_tables.sql` – 39 data tables **generated from `src/lib/schema.ts`** (`npx vite-node scripts/gen-schema.ts` regenerates it after you change fields), with row-level security
   - `…_storage_audit.sql` – private `farm-files` bucket for receipts/documents and the audit trail
   - `…_harden_functions.sql` – locks trigger functions away from the API
3. **Point the app at it.** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API) in `.env`, or in Lovable via its Supabase integration. The publishable (anon) key is safe in the browser; row-level security is what protects the data.
4. **Optional – AI photo analysis.** `supabase functions deploy farm-ai`, set secrets `ANTHROPIC_API_KEY` and `AI_MODEL`, and set `VITE_AI_ENDPOINT=https://<ref>.supabase.co/functions/v1/farm-ai`. Signed-in users' tokens are sent automatically.
5. **Backups.** Turn on daily backups / point-in-time recovery in *Database → Backups*.

How it behaves:
- The first person to sign up and create a farm becomes its **Owner**. Owners invite others by email under *Settings → Team & access* and pick a role (Farm Manager, Veterinarian, Agronomist, Employee, Accountant, Viewer). The invited person creates an account with that email and the farm appears.
- Permissions are checked by the database (`can_write` in `farm_core.sql`), not just hidden in the UI, and mirror `src/lib/permissions.ts`. Farms are isolated from each other.
- Everything is saved on the device first and uploaded in the background (also after reconnecting). Edits made offline sync later; deletions are soft so other devices learn about them. If the server refuses a change (e.g. no permission) it is listed in *Settings → Data* instead of silently disappearing.
- Sign-in survives going offline; the first load of a new device needs a connection.
- Data previously saved on a device (before sign-in) can be uploaded to the account from a banner shown after sign-in. Sample data is never uploaded.

## Subscriptions and online payments (Paynow)

- **7-day free trial.** The first farm a person creates gets 7 days free, counted by the server from the moment the farm is first saved (it can't be reset from the device). Further farms created by the same person start without a trial.
- **After the trial the farm is read-only.** Everyone can still sign in, view and export their records, but nothing can be added or changed until the farm owner chooses a plan. This is enforced by the database (`can_write()` checks `farm_active()`), not just hidden in the screens. The owner gets a "choose a plan" prompt.
- **Plans (per farm, owner pays), USD:** Starter $10/month (2 people), Standard $25/month (10 people), Pro $50/month (unlimited); yearly is 10x monthly (2 months free). Change prices or limits in the `plans` table; the app reads them from there. A trial has no team limit.
- **Paying.** *Plan & billing* (account menu) lists plans; the owner pays with EcoCash, OneMoney or InnBucks (approve on the phone) or card/ZimSwitch (Paynow's page). `supabase/functions/paynow` talks to Paynow. The price is taken from the `plans` table, and a payment only counts after the function asks Paynow directly and Paynow reports "Paid" for the right amount (a forged webhook does nothing).

To switch payments on:
1. Open a merchant account at paynow.co.zw and create an *integration* (you get an Integration ID and Key).
2. In Supabase → Edge Functions → Secrets add `PAYNOW_ID` and `PAYNOW_KEY` (and, only while Paynow is in test mode, `PAYNOW_AUTH_EMAIL` = your Paynow login email).
3. In the Paynow integration, set the Result URL to `https://<project-ref>.supabase.co/functions/v1/paynow` (the function is deployed without JWT verification on purpose; user calls are authenticated inside it).
4. Pay a real $1-style test amount (temporarily lower a price in `plans`) before announcing it.

**Demo mode (show the whole app without real money).** In Supabase → Edge Functions → Secrets add `PAYMENTS_MODE` = `demo`. Payments are then simulated: no Paynow account is needed and nothing is charged. On *Plan & billing* a banner says so and lists test numbers (EcoCash/OneMoney `0771234567` succeeds after a few seconds, `0773333333` is cancelled, `0774444444` fails), and two buttons let the owner end the trial or restart the 7 days to show the full story. **Delete the secret before real customers use the app**: in demo mode any farm owner can "pay" for free.

Until the keys are added the *Pay* button answers "Online payments are not switched on yet", and nothing else breaks.

## Status: what is and isn't done

Done and tested: all modules above; sign-in, roles, team invitations, sync engine (unit-tested with a fake server), the SQL (tested on PostgreSQL 16: isolation between farms, per-role writes, invitations, last-owner protection, audit, and every field of the sample farm fits its table), and the browser client against a mock Supabase backend.

The production project (`kpqhrvpglhporpjrgicr`) has all four migrations applied and its security rules were checked with rolled-back tests on the live database. The browser-to-server round trip could not be run from the build sandbox – do a quick pass after step 3 above: sign up, create a farm, add an animal, then sign in on a second device.

Still to do:
- Email/SMS sending (preferences are saved; push works while the app is open) and IoT, satellite, marketplace and payment integrations from the roadmap.
- Realtime push updates (devices currently sync on change, on focus/reconnect and every minute).
- Conflict handling is "last write wins" per record.

### WhatsApp, SMS and email notifications

Owners and farm managers add people under **Notifications → Who receives messages** (name, phone, email, and which channels / kinds they want). The app then messages them about **all farm activity** (records added, changed or removed – sent once the change reaches the server, so offline work notifies when the phone reconnects) and about **urgent / soon-due alerts** for the kinds switched on in the table below it (WhatsApp, SMS, Email columns). Each alert is sent once when it first needs attention, and a **daily digest** (07:00 Zimbabwe time) reminds people of everything still outstanding.

1. Run `supabase/migrations/20261120000000_notifications.sql`.
2. `supabase functions deploy notify`
3. Set secrets (only the channels you set up will send; others are skipped):
   - WhatsApp + SMS via Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (e.g. `whatsapp:+14155238886`), `TWILIO_SMS_FROM`. For real use, WhatsApp needs an approved message template: create one with a single variable `{{1}}` and set `TWILIO_WHATSAPP_CONTENT_SID`. Without a template WhatsApp only delivers to people who messaged your number in the last 24 h (fine for the Twilio sandbox).
   - Email via Resend: `RESEND_API_KEY`, `NOTIFY_EMAIL_FROM`.
   - Optional: `DEFAULT_COUNTRY_CODE` (default `263`), `APP_URL`.
4. Use **Send a test message** on the Notifications page.

The function only lets signed-in farm members who can write trigger a message, takes recipients from the database (never from the browser), and caps a farm at 300 messages per hour.

**Daily digest set-up** (one message per person each morning, covering vaccinations, vet visits, tasks, calvings, expiring/low-stock items – only sent when something needs attention):
1. Run `supabase/migrations/20261121000000_daily_digest.sql` (enables `pg_cron` and `pg_net`; if your plan doesn't allow them, enable them under Database → Extensions first).
2. `supabase functions deploy notify-digest --no-verify-jwt`
3. Run `supabase/migrations/20261122000000_digest_secret_check.sql`, then in the SQL editor store the function URL and a random secret in Vault (commands at the top of the daily digest migration; the secret lives only in Vault – there is no `CRON_SECRET` function secret). Until they exist the daily job does nothing.

### Daily and weekly CSV reports

**Reports → Daily & weekly**: choose Daily (Today, Yesterday or any date) or Weekly (This week, Last week or the week around any date; weeks run Monday–Sunday), then tap **CSV** next to any report. You get a *Farm summary* (money, livestock, crops, tasks and app activity for the period), an *Activity log* (who added, changed or removed what, from the audit trail), and every report in the catalogue limited to the same dates. Reports that show the farm as it is now (herd list, weights, yields…) are marked "as of today". Files are named like `farm-name_farm-summary_2026-11-16_to_2026-11-22.csv`. Everything is built on the phone from the farm's records, so it works offline. Emailing these automatically is not set up.

### Demonstrating notifications and payments (no real messages, no real money)

Both demos are switched on by a Supabase **Edge Function secret** (Project → Edge Functions → Secrets). Neither needs a provider account.

| Secret | Value | What it does |
| --- | --- | --- |
| `NOTIFY_MODE` | `demo` | Nothing is sent to Twilio or Resend. Every WhatsApp, SMS and email is simulated and appears under **Notifications → Recent messages** with the label "Demo – not actually sent" and the exact text that would have gone out. |
| `PAYMENTS_MODE` | `demo` | Subscription payments are pretend: nothing goes to Paynow and no money moves. The Billing page shows a "Demo mode" banner, EcoCash/OneMoney number `0771234567` succeeds after a few seconds (`…3333333` cancels, `…4444444` fails for insufficient funds), and the owner gets buttons to end the trial or start a fresh one. |

**Turn `PAYMENTS_MODE` off (delete the secret) before real customers use the app:** while it is on, any farm owner can "pay" for free. `NOTIFY_MODE=demo` is harmless but means no real messages go out until you remove it and add the provider keys.

Demo script: sign in with a cloud account → Notifications → add yourself as a contact → **Send a test message** → watch it appear in Recent messages. Change a record (for example add an expense) and, after it syncs, an activity message appears too. Then Billing → choose a plan → pay with the demo number.

### Weekly report by email (Mondays)

Every Monday morning (07:00 Zimbabwe time) the daily digest function also emails **last week's report (Monday–Sunday) as a CSV attachment** to every notification contact who has **Email** and **Weekly report** switched on (both on by default; each contact can turn it off on Notifications → Who receives messages). The email body lists income, expenses and net for the week; the CSV is the full *Farm summary* (money, livestock, crops and tasks). It is sent once per person per week, even if the job runs twice.

- Needs the email provider (`RESEND_API_KEY`, `NOTIFY_EMAIL_FROM`) – or `NOTIFY_MODE=demo`, where the email is simulated and appears under Recent messages with the file name.
- The weekly figures come from the database, so they only include records that have synced to the cloud. The "App activity" rows of the in-app Farm summary are left out because they come from the phone's own change log.
- To send last week's report right now (for example to test it): call the digest function with `{"force_weekly": true}` and the digest secret, as the scheduled job does.

### Payments demo and receipts (updated)

**Payments are in demo mode by default until Paynow is connected.** If `PAYNOW_ID` and `PAYNOW_KEY` are not set (and `PAYMENTS_MODE` is not set), the Billing page works in demo mode: nothing goes to Paynow and no money moves, a banner says so, and a payment succeeds a few seconds after you press Pay. Adding the Paynow keys switches to real payments by itself. `PAYMENTS_MODE=demo` forces the demo, and `PAYMENTS_MODE=live` forces real payments. **Until the Paynow keys are added, any farm owner can "pay" for free**, so add them (or set `PAYMENTS_MODE=live`) before real customers use the app.

**Receipts.** The moment a payment succeeds, the payer gets a success screen (plan, amount, reference, date, "plan active until") with a download button, and a receipt is emailed to them once. Paid rows in the payment history have a **Receipt** button. The email needs `RESEND_API_KEY` and `NOTIFY_EMAIL_FROM`; until then a demo payment's receipt email is simulated and appears under Notifications → Recent messages as "Demo – not actually sent" with the full text. A real payment with no email account connected shows "couldn't email the receipt" and still offers the download.
