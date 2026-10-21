import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { Credit } from "./Credit";
import livestock from "@/assets/landing/livestock.webp";
import crops from "@/assets/landing/crops.webp";
import logo from "@/assets/landing/logo.webp";
import field from "@/assets/landing/field.webp";

const SLIDES = [
  { src: livestock, alt: "Two farm workers recording cattle details on a phone at the loading bay", caption: "Livestock", focus: "60% 20%" },
  { src: crops, alt: "A grower checking a tomato plant for disease with a phone", caption: "Crops", focus: "55% 40%" },
  { src: field, alt: "A farmer using a phone in a maize field with irrigation behind him", caption: "Fields", focus: "42% 15%" },
];

/** Photo carousel across the top of the home page, fading into the green below (each photo has its own focal point so the people stay centred): fades between slides, pauses for reduced-motion users. */
function Carousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [i]);
  return (
    <>
      <div className="absolute inset-x-0 top-[7rem] -z-20 h-[52%] [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_14%,black_55%,transparent)]" role="group" aria-roledescription="carousel" aria-label="FarmHelper in use">
        {SLIDES.map((s, n) => (
          <img key={s.src} src={s.src} alt={s.alt} style={{ objectPosition: s.focus }} aria-hidden={n !== i} loading={n === 0 ? "eager" : "lazy"} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${n === i ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[hsl(150_55%_12%/0.5)] to-transparent" aria-hidden />
      <div className="mx-auto mt-6 flex w-full max-w-lg items-center gap-2" role="tablist" aria-label="Choose a photo">
        {SLIDES.map((s, n) => (
          <button key={s.caption} role="tab" aria-selected={n === i} aria-label={s.caption} onClick={() => setI(n)} className="flex h-8 flex-1 items-center">
            <span className={`h-1 w-full rounded-full transition-colors ${n === i ? "bg-white" : "bg-white/35"}`} />
          </button>
        ))}
      </div>
    </>
  );
}

/** Home page for visitors who are not signed in: one calm screen with two clear choices. */
export function Landing() {
  const { status } = useAuth();
  const canRegister = authMode === "cloud" || status === "setup";
  return (
    <div className="bg-hero relative isolate flex min-h-[100svh] flex-col overflow-hidden text-white">
      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-white/55 blur-xl" aria-hidden />
            <img src={logo} alt="Kurima Digital – empowering Zimbabwean farmers" className="relative h-32 w-auto drop-shadow-[0_0_2px_rgba(255,255,255,1)] sm:h-36" />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-end px-6 py-8 [@media(max-height:500px)]:py-3">
        <div className="mx-auto w-full max-w-lg">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl [@media(max-height:500px)]:text-3xl">One platform to manage the entire farm.</h1>
          <p className="mt-4 max-w-md text-lg text-white/85 sm:text-xl [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-base">Livestock, crops, money and your team, on your phone, even with no signal.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row [@media(max-height:500px)]:mt-4">
            <Button asChild size="lg" className="h-14 w-full bg-white text-lg font-semibold text-[hsl(142_60%_18%)] shadow-lg hover:bg-white/90"><Link to="/login">Sign in</Link></Button>
            {canRegister && <Button asChild size="lg" variant="outline" className="h-14 w-full border-2 border-white/70 bg-transparent text-lg font-semibold text-white hover:bg-white/15 hover:text-white"><Link to="/signup">{status === "setup" ? "Get started" : "Create an account"}</Link></Button>}
          </div>
          {canRegister && <p className="mt-3 text-center text-sm text-white/80">New here? Start with a <b>7-day free trial</b>.</p>}
          <Carousel />
        </div>
      </main>

      <footer className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-xs text-white/70">
        <div className="mx-auto flex max-w-lg items-end justify-between gap-4">
          <Credit />
          <Link to="/install" className="shrink-0 underline underline-offset-2">Install the app</Link>
        </div>
      </footer>
    </div>
  );
}
