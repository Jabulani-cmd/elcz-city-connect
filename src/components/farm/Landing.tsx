import { BarChart3, Boxes, Check, Download, PawPrint, Sprout, Users, Wallet, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
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

/** Home page shown to visitors who are not signed in. */
export function Landing() {
  const { status } = useAuth();
  const canRegister = authMode === "cloud" || status === "setup";
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero pt-safe text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Sprout className="h-5 w-5" /></div><span className="text-lg font-bold">FarmHelper</span></div>
          <Button asChild variant="secondary" size="sm" className="bg-white text-[hsl(142_60%_18%)] hover:bg-white/90"><Link to="/login">Sign in</Link></Button>
        </div>
        <div className="mx-auto max-w-5xl px-5 pb-14 pt-8 sm:pb-20 sm:pt-14">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">One platform to manage the entire farm.</h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">FarmHelper is a farm record-keeping and management app made for Zimbabwe. Keep your crops, livestock, money, stock and workers in one place on your phone, even where there is no network.</p>
          <p className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">Free for {TRIAL_DAYS} days when you create an account. No card needed.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-white px-8 text-base font-semibold text-[hsl(142_60%_18%)] hover:bg-white/90"><Link to="/login">Sign in</Link></Button>
            {canRegister && <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"><Link to="/signup">{status === "setup" ? "Get started" : "Create an account"}</Link></Button>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Everything you need to run the farm</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Built for farmers who work in the field, with big buttons, simple forms and no jargon.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-4 rounded-2xl border bg-card p-5"><WifiOff className="mt-0.5 h-6 w-6 shrink-0 text-primary" /><div><h3 className="font-semibold">Works offline</h3><p className="mt-1 text-sm text-muted-foreground">Record weights, treatments and tasks with no connection. Everything saves on your phone and syncs when you’re back online.</p></div></div>
          <div className="flex gap-4 rounded-2xl border bg-card p-5"><Download className="mt-0.5 h-6 w-6 shrink-0 text-primary" /><div><h3 className="font-semibold">Install it like an app</h3><p className="mt-1 text-sm text-muted-foreground">Add FarmHelper to your home screen for one-tap access. <Link to="/install" className="font-medium text-primary underline">How to install</Link></p></div></div>
        </div>

        <h2 className="mt-14 text-2xl font-bold sm:text-3xl">Made for farming in Zimbabwe</h2>
        <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {[
            "Follows the Zimbabwean farming season: land preparation, planting after the first rains, top dressing, harvest and marketing.",
            "Crops you actually grow: maize, tobacco, soya beans, cotton, wheat, sorghum, groundnuts, sugar beans and vegetables.",
            "Livestock records for cattle, goats, sheep, pigs and poultry, with dipping and vaccination reminders (foot-and-mouth, anthrax, Newcastle disease).",
            "Money kept in US dollars, with space to note ZiG and EcoCash payments, plus records you can show a buyer, bank or ZIMRA.",
            "Works offline in the field and syncs when you find a signal, so poor network and load-shedding do not stop you.",
            "Small screens, big buttons and plain English, so everyone on the farm can use it.",
          ].map((t) => <li key={t} className="flex gap-2.5 rounded-xl border bg-card p-4"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t}</li>)}
        </ul>

        <h2 id="how" className="mt-14 text-2xl font-bold sm:text-3xl">How it works</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[["1", "Create your account", `Sign up and start your ${TRIAL_DAYS}-day free trial straight away.`], ["2", "Add your farm", "Enter your fields, animals, stock and workers. A short guide walks you through it."], ["3", "Record every day", "Log work, costs and sales as they happen and see your profit by crop, field and herd."]].map(([n, t, d]) => (
            <li key={n} className="rounded-2xl border bg-card p-5"><div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{n}</div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>
          ))}
        </ol>

        <h2 id="pricing" className="mt-14 text-2xl font-bold sm:text-3xl">Simple plans for every farm</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Every new account gets a free {TRIAL_DAYS}-day trial of the Farmer plan. After the trial, choose a plan to keep going. Prices are in US dollars per month; pay for a year and get 2 months free.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm ${p.highlight ? "border-primary ring-2 ring-primary" : ""}`}>
              {p.highlight && <span className="mb-2 w-fit rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Most popular</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-4"><span className="text-4xl font-extrabold">US${p.monthly}</span><span className="text-muted-foreground"> / month</span></p>
              <p className="text-xs text-muted-foreground">or US${yearlyPrice(p.monthly)} a year</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul>
              {canRegister && <Button asChild className="mt-6 h-11" variant={p.highlight ? "default" : "outline"}><Link to="/signup">Start {TRIAL_DAYS}-day free trial</Link></Button>}
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">Pay with {PAYMENT_METHODS.join(", ")} through Paynow. Cancel any time.</p>

        <div className="mt-12 rounded-3xl bg-hero p-8 text-center text-white sm:p-10">
          <h2 className="text-2xl font-bold">Start your {TRIAL_DAYS}-day free trial</h2>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-white px-8 text-base font-semibold text-[hsl(142_60%_18%)] hover:bg-white/90"><Link to="/login">Sign in</Link></Button>
            {canRegister && <Button asChild size="lg" variant="outline" className="h-12 border-white/50 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"><Link to="/signup">{status === "setup" ? "Get started" : "Create an account"}</Link></Button>}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 pb-safe text-center text-xs text-muted-foreground">FarmHelper · version {BUILD_ID}</footer>
    </div>
  );
}
