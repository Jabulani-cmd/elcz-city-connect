import { useEffect, useState } from "react";
import { FarmPhoto } from "@/components/farm/Media";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { FARMING_SLIDES } from "@/lib/media";
import { cn } from "@/lib/utils";

const canAutoplay = () => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches && !c?.saveData;
};

/** Swipeable photo strip of real farming: 1 slide on phones, 2 on tablets, 3 on desktop. */
export function FarmingCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    const sync = () => { setIndex(api.selectedScrollSnap()); setCount(api.scrollSnapList().length); };
    sync();
    api.on("select", sync).on("reInit", sync);
    if (!canAutoplay()) return;
    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    const root = api.rootNode();
    root.addEventListener("pointerdown", pause);
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);
    root.addEventListener("touchend", () => setTimeout(resume, 5000));
    const t = window.setInterval(() => { if (!paused && !document.hidden) api.scrollNext(); }, 5000);
    return () => { window.clearInterval(t); root.removeEventListener("pointerdown", pause); root.removeEventListener("mouseenter", pause); root.removeEventListener("mouseleave", resume); };
  }, [api]);

  return (
    <section aria-label="Farming across Zimbabwe" className="mx-auto max-w-6xl px-5 pt-14 sm:pt-20">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Real farms</p>
      <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Farming across Zimbabwe</h2>
      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} className="mt-6">
        <CarouselContent className="-ml-4">
          {FARMING_SLIDES.map((s, i) => (
            <CarouselItem key={s.src} className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3">
              <figure>
                <FarmPhoto photo={s} eager={i === 0} sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] rounded-3xl shadow-md" />
                <figcaption className="mt-2.5 px-1 text-sm font-medium">{s.caption}</figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 top-[40%] hidden bg-card/90 sm:flex" />
        <CarouselNext className="right-2 top-[40%] hidden bg-card/90 sm:flex" />
      </Carousel>
      <div className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <button key={i} type="button" aria-label={`Go to photo ${i + 1}`} aria-current={i === index} onClick={() => api?.scrollTo(i)}
            className={cn("h-2.5 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-2.5 bg-primary/25 hover:bg-primary/50")} />
        ))}
      </div>
    </section>
  );
}
