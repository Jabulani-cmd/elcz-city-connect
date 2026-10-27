import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { authMode, useAuth } from "@/lib/auth";
import { Credit } from "./Credit";
import { LandingAssistant } from "./LandingAssistant";
import livestock from "@/assets/landing/livestock.webp";
import crops from "@/assets/landing/crops.webp";
import logo from "@/assets/landing/logo.webp";
import field from "@/assets/landing/field.webp";
import { CheckCircle2, ArrowRight, Smartphone, ShieldCheck, Zap } from "lucide-react";

const SLIDES = [
  { src: livestock, alt: "Two farm workers recording cattle details on a phone at the loading bay", caption: "Livestock", focus: "60% 20%" },
  { src: crops, alt: "A grower checking a tomato plant for disease with a phone", caption: "Crops", focus: "55% 40%" },
  { src: field, alt: "A farmer using a phone in a maize field with irrigation behind him", caption: "Fields", focus: "42% 15%" },
];

function Carousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [i]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-20 h-full [mask-image:linear-gradient(to_bottom,black_20%,black_60%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_14%,black_55%,transparent)]" role="group" aria-roledescription="carousel" aria-label="FarmHelper in use">
        {SLIDES.map((s, n) => (
          <motion.img
            key={s.src}
            src={s.src}
            alt={s.alt}
            style={{ objectPosition: s.focus }}
            initial={{ opacity: 0 }}
            animate={{ opacity: n === i ? 1 : 0 }}
            transition={{ duration: 1.2 }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${n === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
      <div className="mx-auto mt-12 flex w-full max-w-lg items-center justify-center gap-2" role="tablist" aria-label="Choose a photo">
        {SLIDES.map((s, n) => (
          <button key={s.caption} role="tab" aria-selected={n === i} aria-label={s.caption} onClick={() => setI(n)} className="flex h-1 transition-all duration-500 rounded-full overflow-hidden bg-white/30">
            <div className={`h-full transition-all duration-500 ${n === i ? "w-8 bg-white" : "w-4"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Landing() {
  const { status } = useAuth();
  const canRegister = authMode === "cloud" || status === "setup";

  return (
    <div className="bg-background relative isolate flex min-h-screen flex-col overflow-hidden text-foreground font-sans">
      {/* Organic Background Accents */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-1/2 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <header className="relative z-10 px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-white/55 blur-xl" aria-hidden />
              <img src={logo} alt="Kurima Digital – empowering Zimbabwean farmers" className="relative h-16 w-auto drop-shadow-sm sm:h-20" />
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign in</Link>
            {canRegister && (
              <Button asChild size="sm" className="bg-primary text-white hover:bg-primary/90">
                <Link to="/signup">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 py-12 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary w-fit">
              <Zap className="h-3 w-3" />
              <span>Zimbabwe's Leading Farm Manager</span>
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Precision farming, <span className="text-primary">simplified.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Ditch the paper records. Manage your livestock, crops, and finance in one professional platform that works anywhere — even in the furthest fields without signal.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold shadow-xl transition-all hover:scale-105 active:scale-95">
                <Link to="/signup">Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold backdrop-blur-sm bg-white/50">
                <Link to="/login">Sign in to Account</Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(n => (
                  <div key={n} className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold">F{n}</div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Joined by <span className="font-bold text-foreground">500+</span> Zimbabwean farms
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl border-8 border-white shadow-2xl overflow-hidden aspect-square max-w-lg mx-auto">
              <Carousel />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold">Offline-First Sync</div>
                    <div className="text-xs text-muted-foreground truncate">Data saves locally, syncs when online.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] text-xs text-muted-foreground sm:pb-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Credit />
            <Link to="/install" className="underline underline-offset-2 hover:text-primary transition-colors">Install the app</Link>
          </div>
          <div className="text-right">
            © {new Date().getFullYear()} Kurima Digital. All rights reserved.
          </div>
        </div>
      </footer>
      <LandingAssistant />
    </div>
  );
}
