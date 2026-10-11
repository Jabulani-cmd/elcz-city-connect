import { Download, RefreshCw, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwa } from "@/lib/pwa";

const KEY = "farmhelper.installDismissed";
const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

/** Install prompt (Android/desktop), iOS “Add to Home Screen” hint, and the “new version” bar. */
export function PwaBanner() {
  const pwa = usePwa();
  const [hidden, setHidden] = useState(read);
  useEffect(() => { if (pwa.offlineReady) { toast.success("Ready to work offline"); pwa.dismissOffline(); } }, [pwa.offlineReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const dismiss = () => { setHidden(true); try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } };
  return (
    <>
      {pwa.needRefresh && (
        <div role="status" className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-foreground p-3 text-background shadow-xl">
          <RefreshCw className="h-5 w-5 shrink-0" />
          <div className="flex-1 text-sm"><b>Update available</b><div className="opacity-80">Reload to get the latest version.</div></div>
          <Button size="sm" variant="secondary" onClick={pwa.update}>Update</Button>
          <button aria-label="Later" onClick={pwa.dismissUpdate} className="p-1 opacity-70"><X className="h-4 w-4" /></button>
        </div>
      )}
      {!pwa.installed && !hidden && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border bg-card p-3 shadow-sm">
          <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Install FarmHelper</div>
            {pwa.canInstall ? (
              <>
                <p className="text-sm text-muted-foreground">Add it to your home screen for one-tap access and offline use in the field.</p>
                <Button size="sm" className="mt-2" onClick={async () => { if (await pwa.install()) toast.success("Installed"); }}><Download className="mr-1.5 h-4 w-4" />Install app</Button>
              </>
            ) : pwa.ios ? (
              <p className="text-sm text-muted-foreground">Tap <Share className="inline h-4 w-4 align-text-bottom" /> Share, then <b>Add to Home Screen</b>, for one-tap access and offline use.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Use your browser menu (⋮) → <b>Install app</b> / <b>Add to Home screen</b>. Not showing? <Link to="/install" className="font-medium text-primary underline">Check why</Link>.</p>
            )}
          </div>
          <button aria-label="Dismiss" onClick={dismiss} className="p-1 text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
      )}
    </>
  );
}
