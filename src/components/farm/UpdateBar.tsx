import { RefreshCw, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePwa } from "@/lib/pwa";

/** “New version” bar, available on every screen. Visitors who are not signed in have nothing to lose, so they get the update automatically. */
export function UpdateBar() {
  const pwa = usePwa();
  const { status } = useAuth();
  const signedOut = status === "signedOut" || status === "setup";
  useEffect(() => { if (pwa.needRefresh && signedOut) pwa.update(); }, [pwa.needRefresh, signedOut]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!pwa.needRefresh) return null;
  return (
    <div role="status" className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-foreground p-3 text-background shadow-xl">
      <RefreshCw className="h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm"><b>Update available</b><div className="opacity-80">Reload to get the latest version.</div></div>
      <Button size="sm" variant="secondary" onClick={pwa.update}>Update</Button>
      <button aria-label="Later" onClick={pwa.dismissUpdate} className="p-1 opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
}
