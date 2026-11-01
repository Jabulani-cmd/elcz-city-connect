import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwa } from "@/lib/pwa";

const KEY = "farmhelper.installDismissed";
const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

/** Install prompt (Android/desktop) and iOS “Add to Home Screen” hint shown inside the app. Kept to one short row so page content stays on screen. */
export function PwaBanner() {
  const pwa = usePwa();
  const [hidden, setHidden] = useState(read);
  useEffect(() => { if (pwa.offlineReady) { toast.success("Ready to work offline"); pwa.dismissOffline(); } }, [pwa.offlineReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const dismiss = () => { setHidden(true); try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } };
  if (pwa.installed || hidden) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 shadow-sm">
      <img src="/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 text-sm leading-snug">
        <div className="font-semibold">Install FarmHelper</div>
        {pwa.canInstall ? (
          <p className="text-muted-foreground">One tap to open, works with no signal.</p>
        ) : pwa.ios ? (
          <p className="text-muted-foreground">Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" /> Share → <b>Add to Home Screen</b>.</p>
        ) : (
          <p className="text-muted-foreground">Browser menu (⋮) → <b>Install app</b>. <Link to="/install" className="font-medium text-primary underline">Help</Link></p>
        )}
      </div>
      {pwa.canInstall && <Button size="sm" className="h-9 shrink-0" onClick={async () => { if (await pwa.install()) toast.success("Installed"); }}><Download className="h-4 w-4" />Install</Button>}
      <button aria-label="Dismiss" onClick={dismiss} className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"><X className="h-4 w-4" /></button>
    </div>
  );
}
