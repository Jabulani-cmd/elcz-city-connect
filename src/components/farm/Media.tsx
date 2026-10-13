import { useEffect, useRef, useState } from "react";
import { FarmScene } from "@/components/farm/FarmScene";
import type { Clip, Photo } from "@/lib/media";
import { cn } from "@/lib/utils";

/** A photo that lazy-loads, fades in over the illustrated scene, and quietly falls back to it if it can't load. */
export function FarmPhoto({ photo, className, eager = false, sizes = "(min-width: 1024px) 560px, 100vw" }: { photo?: Photo; className?: string; eager?: boolean; sizes?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "failed">("loading");
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth > 0) setState("ok"); }, []);
  return (
    <div className={cn("relative overflow-hidden bg-[hsl(142_45%_16%)]", className)}>
      <FarmScene className="absolute inset-0 h-full w-full" />
      {photo && state !== "failed" && (
        <img
          ref={ref}
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={sizes}
          alt={photo.alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("failed")}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", state === "ok" ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}

type Connection = { saveData?: boolean; effectiveType?: string };

/** Short background clip. Plays only on a decent connection, never with Data Saver or reduced motion, and never preloads. */
function useCanPlayClip() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: Connection }).connection;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setOk(!reduced && navigator.onLine && !c?.saveData && !/(^|-)(2g|3g)$/.test(c?.effectiveType ?? ""));
  }, []);
  return ok;
}

export function HeroBackdrop({ clip, photo, className }: { clip?: Clip; photo?: Photo; className?: string }) {
  const canPlay = useCanPlayClip();
  const [playing, setPlaying] = useState(false);
  return (
    <div className={cn("absolute inset-0", className)} aria-hidden={!photo}>
      <FarmPhoto photo={clip ? { src: clip.poster, alt: "", credit: clip.credit, license: clip.license, sourceUrl: clip.sourceUrl } : photo} eager className="absolute inset-0 h-full w-full" sizes="100vw" />
      {clip && canPlay && (
        <video
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-1000", playing ? "opacity-100" : "opacity-0")}
          autoPlay muted loop playsInline preload="none" poster={clip.poster} onPlaying={() => setPlaying(true)} onError={() => setPlaying(false)}
        >
          {clip.webm && <source src={clip.webm} type="video/webm" />}
          <source src={clip.mp4} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
