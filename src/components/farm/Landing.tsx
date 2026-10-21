import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { BUILD_ID } from "@/lib/pwa";

/** Home page for visitors who are not signed in: one calm screen with two clear choices. */
export function Landing() {
  const { status } = useAuth();
  const canRegister = authMode === "cloud" || status === "setup";
  return (
    <div className="bg-hero relative isolate flex min-h-[100svh] flex-col overflow-hidden text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-[hsl(38_90%_52%/0.18)] blur-3xl" aria-hidden />

      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><Sprout className="h-6 w-6" /></div>
          <span className="text-xl font-bold tracking-tight">FarmHelper</span>
        </div>
      </header>

      <main className="flex flex-1 items-center px-6 py-8 [@media(max-height:500px)]:py-3">
        <div className="mx-auto w-full max-w-lg">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl [@media(max-height:500px)]:text-3xl">One platform to manage the entire farm.</h1>
          <p className="mt-4 max-w-md text-lg text-white/85 sm:text-xl [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-base">Livestock, crops, money and your team, on your phone, even with no signal.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row [@media(max-height:500px)]:mt-4">
            <Button asChild size="lg" className="h-14 w-full bg-white text-lg font-semibold text-[hsl(142_60%_18%)] shadow-lg hover:bg-white/90"><Link to="/login">Sign in</Link></Button>
            {canRegister && <Button asChild size="lg" variant="outline" className="h-14 w-full border-2 border-white/70 bg-transparent text-lg font-semibold text-white hover:bg-white/15 hover:text-white"><Link to="/signup">{status === "setup" ? "Get started" : "Create an account"}</Link></Button>}
          </div>
        </div>
      </main>

      <footer className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-xs text-white/70">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link to="/install" className="underline underline-offset-2">Install the app</Link>
          <span>v {BUILD_ID.split(" · ")[1] ?? BUILD_ID}</span>
        </div>
      </footer>
    </div>
  );
}
