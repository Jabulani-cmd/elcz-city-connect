import { BarChart3, Boxes, Check, ChevronRight, Download, PawPrint, Share, Smartphone, Sprout, Users, Wallet, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { FarmPhoto, HeroBackdrop } from "@/components/farm/Media";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { LANDING_MEDIA, mediaCredits } from "@/lib/media";
import { BUILD_ID } from "@/lib/pwa";
import { PAYMENT_METHODS, PLANS, TRIAL_DAYS, yearlyPrice } from "@/lib/plans";

const FEATURES = [
  { icon: PawPrint, title: "Livestock", text: "Cattle, goats, sheep, pigs and poultry. Herd registry, weights and growth, grazing and pastures, dipping, vaccinations, breeding, sales and purchases." },
  { icon: Sprout, title: "Crops & fields", text: "Maize, tobacco, soya beans, cotton, wheat, groundnuts and horticulture. Track fields, planting, fertilizer, chemicals, irrigation and harvests, with cost and profit worked out for you." },
  { icon: Wallet, title: "Money", text: "Income and expenses in US dollars, with receipts, budgets, and profit by crop, field, animal, herd or season." },
  { icon: Users, title: "Your team", text: "Staff records, attendance, tasks on a board or calendar, and a role for everyone so they only see what they should." },
  { icon: BarChart3, title: "Reports", text: "30 ready reports you can export to PDF, Excel or CSV, plus a farm assistant that answers questions from your own records." },
  { icon: Boxes, title: "Stock & alerts", text: "Feed and supplies with low-stock warnings, and alerts for vaccinations, calving, harvest, payments and overdue jobs." },
];

const DARK_GREEN = "text-[hsl(142_60%_18%)]";
const SECTION = "mx-auto max-w-6xl px-5";

const STATS = [
  { value: `${TRIAL_DAYS} days`, label: "free trial, no card" },
  { value: "30", label: "ready-made reports" },
  { value: "Offline", label: "records saved on your phone" },
  { value: "US$", label: "plans from US$5 a month" },
];

const FAQ = [
  ["Does it work without internet?", "Yes. Record weights, treatments, costs and tasks in the field with no signal. Everything is saved on your phone and syncs when you are back online."],
  ["How do I put it on my phone?", "Open FarmHelper in Chrome (Android) or Safari (iPhone), then add it to your home screen. It opens full screen like any other app and needs no app store. The steps are above."],
  ["Will it use a lot of data?", "No. The app is small, pictures load only when you scroll to them, and videos never play on slow or Data Saver connections."],
  ["How do I pay?", `After your free trial, pay in US dollars through Paynow with ${PAYMENT_METHODS.join(", ")}. Pay for a year and get 2 months free. Cancel any time.`],
  ["Can my workers use it?", "Yes. Add your team and give each person a role, so a herdsman sees animals and tasks while only you and your manager see the money."],
];

/** Home page shown to visitors who are not signed in. */
export function Landing() {
  const { status } = useAuth();
  const canRegister = authMode === "cloud" || status === "setup";
  const m = LANDING_MEDIA;
  const credits = mediaCredits();
  const signup = status === "setup" ? "Get started" : "Create an account";
  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      <header className="fixed inset-x-0 top-0 z-30 glass border-b border-border/50 pt-safe">
        <div className={`${SECTION} flex h-14 items-center justify-between`}>
          <Link to="/" className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sprout className="h-5 w-5" /></span><span className="text-lg font-bold">FarmHelper</span></Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex" aria-label="Sections">
            <a href="#features" className="hover:text-foreground">Features</a><a href="#install" className="hover:text-foreground">Install</a><a href="#pricing" className="hover:text-foreground">Pricing</a><a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
            {canRegister && <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/signup">Start free</Link></Button>}
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-hero pt-safe text-white">
        <HeroBackdrop clip={m.heroClip} photo={m.hero} />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(150_55%_8%/0.6)] via-[hsl(150_55%_8%/0.35)] to-[hsl(150_55%_8%/0.75)] lg:bg-gradient-to-r lg:from-[hsl(150_55%_8%/0.85)] lg:via-[hsl(150_55%_8%/0.45)] lg:to-[hsl(150_55%_8%/0.1)]" />
        <div className={`${SECTION} relative grid items-center gap-10 pb-24 pt-28 sm:pb-28 sm:pt-36 lg:grid-cols-[1.1fr_0.9fr]`}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur sm:text-sm"><span aria-hidden="true">🇿🇼</span>Made for farmers in Zimbabwe</p>
            <h1 className="mt-5 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Run your whole farm from your phone.</h1>
            <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">Crops, cattle, goats, poultry, money, stock and workers in one simple app. Works in the field with no network, and installs on Android and iPhone like a real app.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {canRegister
                ? <Button asChild size="lg" className={`h-[3.25rem] bg-accent px-8 text-base font-bold text-accent-foreground shadow-lg shadow-black/20 hover:bg-accent/90`}><Link to="/signup">{signup}: free for {TRIAL_DAYS} days</Link></Button>
                : <Button asChild size="lg" className={`h-[3.25rem] bg-white px-8 text-base font-bold ${DARK_GREEN} hover:bg-white/90`}><Link to="/login">Sign in</Link></Button>}
              <Button asChild size="lg" variant="outline" className="h-[3.25rem] border-white/40 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white"><a href="#install"><Smartphone className="mr-2 h-5 w-5" />Install on your phone</a></Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
              {["No card needed", "Works offline", "Prices in US dollars"].map((t) => <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" />{t}</li>)}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[19rem] lg:max-w-sm" aria-hidden="true">
            <div className="rotate-2 rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
              <div className="rounded-[1.5rem] bg-background p-4 text-foreground">
                <p className="text-xs text-muted-foreground">Good morning</p>
                <p className="text-lg font-bold">Mutasa Family Farm</p>
                <p className="text-xs text-muted-foreground">Mashonaland East · Mixed farm</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[["64", "Animals"], ["3", "Alerts"], ["5", "Tasks"]].map(([v, l]) => <div key={l} className="rounded-xl bg-primary/10 py-2"><div className="text-lg font-bold text-primary">{v}</div><div className="text-[10px] text-muted-foreground">{l}</div></div>)}
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-2"><PawPrint className="h-4 w-4 text-warning" />Dipping due for 12 cattle</div>
                  <div className="flex items-center gap-2 rounded-lg border p-2"><Sprout className="h-4 w-4 text-primary" />Maize top dressing: field 2</div>
                  <div className="flex items-center gap-2 rounded-lg border p-2"><Wallet className="h-4 w-4 text-primary" />Profit this season: US$2,480</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="At a glance" className="relative z-10 -mt-8">
        <ul className={`${SECTION} grid grid-cols-2 overflow-hidden rounded-2xl border bg-card shadow-lg sm:grid-cols-4 [&>li]:border-border [&>li:nth-child(odd)]:border-r [&>li:nth-child(-n+2)]:border-b sm:[&>li]:border-b-0 sm:[&>li:not(:last-child)]:border-r`}>
          {STATS.map((s) => <li key={s.label} className="px-4 py-5 text-center"><div className="text-2xl font-extrabold text-primary sm:text-3xl">{s.value}</div><div className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{s.label}</div></li>)}
        </ul>
      </section>

      <section id="features" className={`${SECTION} scroll-mt-20 py-16 sm:py-24`}>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Everything in one place</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">From the first rains to the day you sell</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Built for people who work outdoors: big buttons, simple forms and no jargon.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><f.icon className="h-6 w-6" /></div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Livestock and crops" className="bg-secondary/60 py-16 sm:py-24">
        <div className={`${SECTION} space-y-16 sm:space-y-24`}>
          {[
            { photo: m.livestock, title: "Know every animal in your herd", text: "Tag numbers, weights and growth, dipping and vaccination dates, breeding and calving, all in one record per animal. Get a reminder before foot-and-mouth, anthrax or Newcastle disease shots are due.", points: ["Herd registry and grazing", "Dipping and vaccination alerts", "Sales, purchases and mortality"], flip: false },
            { photo: m.crops, title: "See what each field really earns", text: "Record planting, fertilizer, chemicals, irrigation and harvest for maize, tobacco, soya beans and more. FarmHelper works out cost and profit for every crop, field and season.", points: ["Follows the Zimbabwean season", "Cost and profit per field", "Harvest and marketing records"], flip: true },
          ].map((b) => (
            <div key={b.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <FarmPhoto photo={b.photo} className={`aspect-[4/3] rounded-3xl shadow-xl ${b.flip ? "lg:order-2" : ""}`} />
              <div>
                <h2 className="text-2xl font-extrabold sm:text-3xl">{b.title}</h2>
                <p className="mt-3 text-muted-foreground">{b.text}</p>
                <ul className="mt-5 space-y-2.5">{b.points.map((p) => <li key={p} className="flex items-center gap-2.5 font-medium"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>{p}</li>)}</ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="install" className={`${SECTION} scroll-mt-20 py-16 sm:py-24`}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Android and iPhone</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Install it like an app. No app store.</h2>
            <p className="mt-3 text-muted-foreground">FarmHelper opens full screen from your home screen and keeps working when the network drops, so poor signal and load-shedding never stop your records.</p>
            <div className="mt-6 flex gap-3 rounded-2xl border bg-card p-4"><WifiOff className="mt-0.5 h-6 w-6 shrink-0 text-primary" /><p className="text-sm text-muted-foreground"><b className="text-foreground">Works offline.</b> Record weights, treatments and tasks with no connection. Everything syncs when you are back online.</p></div>
            <Button asChild variant="outline" className="mt-5"><Link to="/install"><Download className="mr-2 h-4 w-4" />Check if your phone can install it</Link></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { os: "Android", browser: "Chrome", steps: ["Open FarmHelper in Chrome.", "Tap the ⋮ menu at the top right.", "Tap Install app (or Add to Home screen).", "Open FarmHelper from your home screen."] },
              { os: "iPhone", browser: "Safari", steps: ["Open FarmHelper in Safari.", "Tap the Share button.", "Choose Add to Home Screen.", "Tap Add, then open it from your home screen."] },
            ].map((g) => (
              <div key={g.os} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{g.os}</h3><span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{g.os === "iPhone" ? <Share className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}{g.browser}</span></div>
                <ol className="mt-3 space-y-2.5 text-sm">{g.steps.map((t, i) => <li key={t} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span><span className="pt-0.5">{t}</span></li>)}</ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-hero py-16 text-white sm:py-24">
        <div className={SECTION}>
          <h2 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">Made for farming in Zimbabwe</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Follows the farming season: land preparation, planting after the first rains, top dressing, harvest and marketing.",
              "The crops you grow: maize, tobacco, soya beans, cotton, wheat, sorghum, groundnuts, sugar beans and vegetables.",
              "Cattle, goats, sheep, pigs and poultry, with dipping and vaccination reminders.",
              "Money in US dollars, with space for ZiG and EcoCash notes, and records you can show a buyer, bank or ZIMRA.",
              "Syncs when you find a signal, so poor network and load-shedding do not stop you.",
              "Small screens, big buttons and plain English, so everyone on the farm can use it.",
            ].map((t) => <li key={t} className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur"><Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />{t}</li>)}
          </ul>
        </div>
      </section>

      <section id="how" className={`${SECTION} scroll-mt-20 py-16 sm:py-24`}>
        <h2 className="text-3xl font-extrabold sm:text-4xl">Up and running in minutes</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {[["1", "Create your account", `Sign up and start your ${TRIAL_DAYS}-day free trial straight away.`], ["2", "Add your farm", "Enter your fields, animals, stock and workers. A short guide walks you through it."], ["3", "Record every day", "Log work, costs and sales as they happen and see your profit by crop, field and herd."]].map(([n, t, d]) => (
            <li key={n} className="relative rounded-2xl border bg-card p-6 shadow-sm"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{n}</div><h3 className="text-lg font-bold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="scroll-mt-20 bg-secondary/60 py-16 sm:py-24">
        <div className={SECTION}>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Simple plans for every farm</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Every new account gets a free {TRIAL_DAYS}-day trial of the Farmer plan. Prices are in US dollars per month; pay for a year and get 2 months free.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.id} className={`relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm sm:p-7 ${p.highlight ? "border-primary shadow-xl ring-2 ring-primary lg:-translate-y-3" : ""}`}>
                {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">Most popular</span>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
                <p className="mt-5"><span className="text-5xl font-extrabold tracking-tight">US${p.monthly}</span><span className="text-muted-foreground"> / month</span></p>
                <p className="text-xs text-muted-foreground">or US${yearlyPrice(p.monthly)} a year</p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul>
                {canRegister && <Button asChild className="mt-7 h-12 text-base" variant={p.highlight ? "default" : "outline"}><Link to="/signup">Start {TRIAL_DAYS}-day free trial</Link></Button>}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">Pay with {PAYMENT_METHODS.join(", ")} through Paynow. Cancel any time.</p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-16 sm:py-24">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Questions farmers ask</h2>
        <Accordion type="single" collapsible className="mt-6">
          {FAQ.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-base font-semibold">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
        </Accordion>
      </section>

      <section className={`${SECTION} pb-16 sm:pb-24`}>
        <div className="relative isolate overflow-hidden rounded-3xl bg-hero p-8 text-center text-white sm:p-14">
          <FarmPhoto photo={m.community} className="absolute inset-0 -z-10 opacity-30" />
          <h2 className="text-3xl font-extrabold sm:text-4xl">Start your {TRIAL_DAYS}-day free trial</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">Put your farm records on your phone today. No card needed.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {canRegister && <Button asChild size="lg" className="h-[3.25rem] bg-accent px-8 text-base font-bold text-accent-foreground hover:bg-accent/90"><Link to="/signup">{signup}</Link></Button>}
            <Button asChild size="lg" variant="outline" className="h-[3.25rem] border-white/40 bg-white/5 px-8 text-base font-semibold text-white hover:bg-white/15 hover:text-white"><Link to="/login">Sign in</Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t px-5 py-8 pb-safe text-center text-xs text-muted-foreground">
        {credits.length > 0 && <p className="mx-auto mb-3 max-w-2xl">Photos and video: {credits.map((c) => `${c.credit} (${c.license})`).join(", ")}.</p>}
        FarmHelper · version {BUILD_ID}
      </footer>

      {canRegister && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t glass px-4 py-3 pb-safe sm:hidden">
          <Button asChild size="lg" className="h-12 w-full text-base font-bold"><Link to="/signup">{signup} <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
      )}
    </div>
  );
}
