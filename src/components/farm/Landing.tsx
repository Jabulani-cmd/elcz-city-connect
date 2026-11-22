import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { Credit } from "./Credit";
import { LandingAssistant } from "./LandingAssistant";
import { whatsappLink } from "./WhatsAppButton";
import livestock from "@/assets/landing/livestock.webp";
import logo from "@/assets/landing/logo.webp";

/**
 * Home page for visitors who are not signed in. The photo and the words never overlap:
 * on a phone the photo sits above the headline, on a wide screen it fills the right half.
 */
export function Landing() {
  const { status } = useAuth();
  const canRegister = authMode === "cloud" || status === "setup";
  return (
    <div className="grid min-h-[100svh] bg-background text-foreground lg:grid-cols-2 lg:grid-rows-[auto_1fr_auto]">
      <header className="px-6 pb-3 pt-[max(1rem,env(safe-area-inset-top))] lg:col-start-1 lg:px-14 lg:pt-8">
        <img src={logo} alt="Kurima Digital – empowering Zimbabwean farmers" className="h-20 w-auto lg:h-24" />
      </header>

      <figure className="h-[38svh] min-h-56 overflow-hidden lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-full lg:min-h-[100svh]">
        <img
          src={livestock}
          alt="Two farm workers recording cattle details on a phone at the loading bay"
          style={{ objectPosition: "60% 20%" }}
          className="h-full w-full object-cover"
        />
      </figure>

      <main className="px-6 py-8 lg:col-start-1 lg:flex lg:items-center lg:px-14 lg:py-12">
        <div className="max-w-xl">
          <h1 className="text-[2.25rem] font-extrabold leading-[1.05] tracking-tight text-primary sm:text-5xl lg:text-6xl">
            Records for every animal, field and dollar on your farm.
          </h1>
          <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-foreground/80 sm:text-xl">
            FarmHelper works on your phone, even when there is no signal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
              <Link to="/signup">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          {canRegister && <p className="mt-3 text-sm text-muted-foreground">7 days free.</p>}
        </div>
      </main>

      <footer className="px-6 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] pt-2 text-muted-foreground lg:col-start-1 lg:px-14 lg:pb-8">
        <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-foreground">
          <Link to="/install" className="underline underline-offset-4">Install the app</Link>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Chat on WhatsApp</a>
        </div>
        <Credit />
      </footer>
      <LandingAssistant />
    </div>
  );
}
