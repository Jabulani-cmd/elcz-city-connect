import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clockOut, publishEmployeeFix, useShift } from "@/lib/shift";
import { useStore } from "@/lib/store";
import { mayShare, type Fix } from "@/lib/tracking";

/** While an employee is clocked in (and has consented) this watches GPS and shares it; it always shows a visible indicator with a Stop button. */
export function ShiftTracker() {
  const shift = useShift();
  const farmId = useStore((s) => s.activeFarmId);
  const active = mayShare(shift) && shift?.farmId === farmId;
  const last = useRef<Fix | null>(null);

  useEffect(() => {
    if (!active || !navigator.geolocation) return;
    let wake: WakeLockSentinel | null = null;
    const hold = () => { try { void navigator.wakeLock?.request("screen").then((w) => { wake = w; }).catch(() => {}); } catch { /* not supported */ } };
    hold();
    const onVisible = () => { if (document.visibilityState === "visible") hold(); };
    document.addEventListener("visibilitychange", onVisible);
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const fix: Fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() };
        if (publishEmployeeFix(fix, last.current)) last.current = fix;
      },
      (e) => { if (e.code === e.PERMISSION_DENIED) { toast.error("Location permission was denied – you are no longer sharing."); clockOut(); } },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 30_000 },
    );
    return () => { navigator.geolocation.clearWatch(id); document.removeEventListener("visibilitychange", onVisible); void wake?.release().catch(() => {}); last.current = null; };
  }, [active]);

  if (!active) return null;
  return (
    <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-sm">
      <span className="flex items-center gap-2"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" /></span><MapPin className="h-4 w-4" /><b>Sharing your location with the farm</b> while you are clocked in. Keep this app open.</span>
      <Button size="sm" variant="outline" onClick={() => { clockOut(); toast.success("Clocked out – location sharing stopped"); }}>Clock out &amp; stop</Button>
    </div>
  );
}
