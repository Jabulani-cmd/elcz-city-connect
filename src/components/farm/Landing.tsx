import { BarChart3, Boxes, Download, PawPrint, Sprout, Users, Wallet, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { BUILD_ID } from "@/lib/pwa";

const FEATURES = [
  { icon: PawPrint, title: "Livestock", text: "Herd registry, weights and growth, pastures and grazing, health, vaccinations, breeding, feedlot, sales and purchases." },
  { icon: Sprout, title: "Crops & fields", text: "Fields, planting, fertilizer, crop protection, irrigation and harvests, with cost and profit worked out for you." },
  { icon: Wallet, title: "Money", text: "Income and expenses with receipts, budgets, and profit by crop, field, animal, herd or month." },
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
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">Crops, livestock, money and people in one simple app that works on your phone, even when there’s no signal in the field.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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

        <div className="mt-12 rounded-3xl bg-hero p-8 text-center text-white sm:p-10">
          <h2 className="text-2xl font-bold">Ready when you are</h2>
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
