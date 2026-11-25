import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { LandingAssistant } from "./LandingAssistant";
import { whatsappLink } from "./WhatsAppButton";
import livestock from "@/assets/landing/livestock.webp";
import crops from "@/assets/landing/crops.webp";
import field from "@/assets/landing/field.webp";
import logo from "@/assets/landing/logo.webp";

const SLIDES = [
  { src: livestock, alt: "Two farm workers recording cattle details on a phone at the loading bay", caption: "Livestock", focus: "60% 20%" },
  { src: crops, alt: "A grower checking a tomato plant for disease with a phone", caption: "Crops", focus: "55% 40%" },
  { src: field, alt: "A farmer using a phone in a maize field with irrigation behind him", caption: "Fields", focus: "42% 15%" },
];

/** Photo carousel: fades between slides every 5 seconds (paused for reduced-motion users). The photo is never covered by text; the slide names above it double as the controls. */
function Carousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [i]);
  return (
    <figure className="flex h-[33svh] min-h-48 flex-col lg:col-start-2 lg:row-start-2 lg:h-full lg:min-h-0" role="group" aria-roledescription="carousel" aria-label="FarmHelper in use">
      <div className="flex" role="tablist" aria-label="Choose a photo">
        {SLIDES.map((s, n) => (
          <button key={s.caption} type="button" role="tab" aria-selected={n === i} onClick={() => setI(n)}
            className={`h-11 flex-1 border-b-4 text-sm font-semibold transition-colors motion-reduce:transition-none ${n === i ? "border-accent text-primary" : "border-transparent text-foreground/65 hover:text-foreground"}`}>{s.caption}</button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {SLIDES.map((s, n) => (
          <img key={s.src} src={s.src} alt={s.alt} style={{ objectPosition: s.focus }} aria-hidden={n !== i} loading={n === 0 ? "eager" : "lazy"} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${n === i ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
    </figure>
  );
}

/**
 * Home page for visitors who are not signed in. The photos and the words never overlap:
 * on a phone the photo sits above the headline, on a wide screen it fills the right half.
 */
export function Landing() {
  const { status } = useAuth();
  const canRegister = authMode === "cloud" || status === "setup";
  return (
    <div className="grid min-h-[100svh] bg-[linear-gradient(160deg,hsl(98_44%_84%)_0%,hsl(103_40%_72%)_100%)] text-foreground lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
      <header className="flex justify-center px-6 pb-3 pt-[max(1rem,env(safe-area-inset-top))] lg:col-span-2 lg:px-14 lg:pt-8">
        <img src={logo} alt="Kurima Digital – empowering Zimbabwean farmers" className="h-20 w-auto rounded-2xl bg-white p-1.5 lg:h-28" />
      </header>

      <Carousel />

      <main className="px-6 pb-28 pt-6 lg:col-start-1 lg:row-start-2 lg:flex lg:items-center lg:px-14 lg:py-12">
        <div className="max-w-xl">
          <h1 className="text-[2.25rem] font-extrabold leading-[1.05] tracking-tight text-primary sm:text-5xl lg:text-6xl">
            Records for every animal, field and dollar on your farm.
          </h1>
          <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-foreground/80 sm:text-xl">
            FarmHelper works on your phone, even when there is no signal.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
              <Link to="/signup">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-primary/50 bg-white/60 px-8 text-base font-semibold text-primary hover:bg-white">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            {canRegister && <p className="text-foreground/80">7 days free trial</p>}
            <Link to="/install" className="font-medium text-foreground underline underline-offset-4">Install the app</Link>
          </div>
        </div>
      </main>

      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-background/20 hover:brightness-95 sm:left-6">
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M16.004 3C9.38 3 4 8.376 4 14.998c0 2.12.553 4.19 1.604 6.015L4 29l8.2-1.576a12 12 0 0 0 3.804.616h.004C22.62 28.04 28 22.664 28 16.04 28 9.376 22.628 3 16.004 3Zm0 21.99h-.003a9.95 9.95 0 0 1-5.07-1.39l-.364-.216-4.866.935.97-4.74-.236-.376a9.94 9.94 0 0 1-1.52-5.2c0-5.5 4.48-9.98 9.99-9.98 2.665 0 5.17 1.04 7.05 2.926a9.9 9.9 0 0 1 2.92 7.06c-.003 5.5-4.48 9.98-9.99 9.98Zm5.48-7.47c-.3-.15-1.777-.877-2.052-.977-.275-.1-.475-.15-.675.15-.2.3-.775.977-.95 1.177-.175.2-.35.225-.65.075-.3-.15-1.268-.467-2.416-1.49-.893-.797-1.496-1.78-1.67-2.08-.175-.3-.018-.462.132-.612.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.627-.925-2.227-.243-.585-.49-.506-.675-.515l-.575-.01c-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.116 3.23 5.126 4.53.716.31 1.275.495 1.71.633.72.228 1.375.196 1.892.12.577-.086 1.777-.726 2.027-1.427.25-.7.25-1.3.175-1.427-.075-.125-.275-.2-.575-.35Z" />
        </svg>
      </a>
      <LandingAssistant />
    </div>
  );
}
