import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { Credit } from "./Credit";
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
    <figure className="flex h-[40svh] min-h-60 flex-col lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-full lg:min-h-[100svh]" role="group" aria-roledescription="carousel" aria-label="FarmHelper in use">
      <div className="flex" role="tablist" aria-label="Choose a photo">
        {SLIDES.map((s, n) => (
          <button key={s.caption} type="button" role="tab" aria-selected={n === i} onClick={() => setI(n)}
            className={`h-11 flex-1 border-b-4 text-sm font-semibold transition-colors motion-reduce:transition-none ${n === i ? "border-accent text-white" : "border-transparent text-white/70 hover:text-white"}`}>{s.caption}</button>
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
    <div className="bg-hero grid min-h-[100svh] text-white lg:grid-cols-2 lg:grid-rows-[auto_1fr_auto]">
      <header className="px-6 pb-3 pt-[max(1rem,env(safe-area-inset-top))] lg:col-start-1 lg:px-14 lg:pt-8">
        <img src={logo} alt="Kurima Digital – empowering Zimbabwean farmers" className="h-20 w-auto rounded-2xl bg-white p-1.5 lg:h-24" />
      </header>

      <Carousel />

      <main className="px-6 py-8 lg:col-start-1 lg:flex lg:items-center lg:px-14 lg:py-12">
        <div className="max-w-xl">
          <h1 className="text-[2.25rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Records for every animal, field and dollar on your farm.
          </h1>
          <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-white/85 sm:text-xl">
            FarmHelper works on your phone, even when there is no signal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-accent px-8 text-base font-semibold text-accent-foreground hover:bg-accent/90">
              <Link to="/signup">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/60 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          {canRegister && <p className="mt-3 text-sm text-white/80">7 days free.</p>}
        </div>
      </main>

      <footer className="px-6 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] pt-2 text-white/75 lg:col-start-1 lg:px-14 lg:pb-8">
        <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-white">
          <Link to="/install" className="underline underline-offset-4">Install the app</Link>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Chat on WhatsApp</a>
        </div>
        <Credit />
      </footer>
      <LandingAssistant />
    </div>
  );
}
