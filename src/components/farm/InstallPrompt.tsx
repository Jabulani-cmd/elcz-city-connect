import { Download, MoreVertical, Share, WifiOff, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { isPreviewEnvironment, usePwa } from "@/lib/pwa";

const KEY = "farmhelper.installPromptAt";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const snoozed = () => { try { return Date.now() - Number(localStorage.getItem(KEY) ?? 0) < SNOOZE_MS; } catch { return false; } };

/** Opens when someone visits the link in a browser: offers to install FarmHelper on their device. Not shown once installed. */
export function InstallPrompt() {
  const pwa = usePwa();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const eligible = !pwa.installed && !isPreviewEnvironment() && window.self === window.top && pathname !== "/install";

  useEffect(() => { const t = setTimeout(() => setReady(true), 1500); return () => clearTimeout(t); }, []);
  useEffect(() => { if (ready && eligible && !snoozed()) setOpen(true); }, [ready, eligible]);

  const later = () => { setOpen(false); try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ } };
  if (!eligible) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) later(); }}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="" className="h-14 w-14 rounded-2xl shadow" />
          <div>
            <SheetTitle className="text-xl">Install FarmHelper</SheetTitle>
            <SheetDescription>Put the app on your home screen.</SheetDescription>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Opens in one tap, like any other app</li>
          <li className="flex items-center gap-2"><WifiOff className="h-4 w-4 text-primary" />Keeps working with no signal in the field</li>
        </ul>
        {pwa.canInstall ? (
          <Button size="lg" className="mt-5 h-14 w-full text-base" onClick={async () => { if (await pwa.install()) { toast.success("FarmHelper installed"); setOpen(false); } }}>
            <Download className="mr-2 h-5 w-5" />Install app
          </Button>
        ) : pwa.ios ? (
          <p className="mt-5 rounded-2xl bg-muted p-3 text-sm">Tap <Share className="inline h-4 w-4 align-text-bottom" /> <b>Share</b> at the bottom of Safari, then choose <b>Add to Home Screen</b>.</p>
        ) : (
          <p className="mt-5 rounded-2xl bg-muted p-3 text-sm">Open your browser menu <MoreVertical className="inline h-4 w-4 align-text-bottom" /> and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>
        )}
        <Button variant="ghost" className="mt-2 w-full" onClick={later}>Not now</Button>
      </SheetContent>
    </Sheet>
  );
}
