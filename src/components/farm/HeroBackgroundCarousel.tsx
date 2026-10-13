import { useEffect, useState } from "react";
import { HERO_BG_SLIDES } from "@/lib/media";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 5000;

type Connection = { saveData?: boolean; effectiveType?: string };

/** Photos crossfading behind the hero. One static photo when reduced motion or Data Saver is on. */
export function HeroBackgroundCarousel() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const c = (navigator as Navigator & { connection?: Connection }).connection;
    if (reduced || c?.saveData || !navigator.onLine || HERO_BG_SLIDES.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % HERO_BG_SLIDES.length), INTERVAL_MS);
    const reset = () => setIndex(0);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", reset);
    };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {HERO_BG_SLIDES.map((p, i) =>
        failed[i] ? null : (
          <img
            key={p.src}
            src={p.src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailed((f) => ({ ...f, [i]: true }))}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
              i === index ? "opacity-100" : "opacity-0",
            )}
          />
        ),
      )}
    </div>
  );
}
