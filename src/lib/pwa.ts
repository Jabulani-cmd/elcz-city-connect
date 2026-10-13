import { useCallback, useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { isPreviewEnvironment } from "./env";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallEvent | null = null;
const subs = new Set<() => void>();
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let needRefresh = false;
let offlineReady = false;

export { isPreviewEnvironment };

/** `caches` does not exist in insecure contexts or some embedded frames, so never reference it bare. */
async function clearCaches() {
  const store = (globalThis as { caches?: CacheStorage }).caches;
  if (!store) return;
  await Promise.all((await store.keys()).map((k) => store.delete(k)));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallEvent; subs.forEach((f) => f()); });
  window.addEventListener("appinstalled", () => { deferred = null; subs.forEach((f) => f()); });
  if (isPreviewEnvironment()) {
    // remove anything an earlier build registered here so the preview always shows the latest code
    void navigator.serviceWorker?.getRegistrations().then((rs) => Promise.all(rs.map((r) => r.unregister()))).catch(() => undefined);
    void clearCaches();
  } else {
    updateSW = registerSW({
      onNeedRefresh() { needRefresh = true; subs.forEach((f) => f()); },
      onOfflineReady() { offlineReady = true; subs.forEach((f) => f()); },
      // re-check for a new version hourly and whenever the app is reopened, so long-lived installed sessions still get updates
      onRegisteredSW(_url, reg) {
        if (!reg) return;
        const check = () => { if (navigator.onLine) void reg.update().catch(() => undefined); };
        setInterval(check, 60 * 60 * 1000);
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
      },
      onRegisterError() { /* offline caching is a bonus; the app still works online */ },
    });
  }
}

const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

export const BUILD_ID = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "dev";

/** Remove the offline cache and service worker, then reload to fetch the newest version. Saved farm data is not touched. */
export async function refreshApp() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    await clearCaches();
  } finally {
    location.reload();
  }
}

/** Why the browser can't offer “Install” right now, in plain words (empty when it can or already is installed). */
export function installBlocker(canInstall: boolean): string {
  if (typeof window === "undefined" || isStandalone() || canInstall) return "";
  if (window.self !== window.top) return "This page is inside another page (for example an editor preview). Open the app’s own web address directly in your browser, then install.";
  if (!window.isSecureContext) return "Installing needs a secure (https) address. Open the published https link.";
  if (isIos()) return "";
  if (!("serviceWorker" in navigator)) return "This browser can’t install web apps. Try Chrome, Edge or Safari.";
  return "Your browser hasn’t offered installation yet. Use the browser menu → “Install app” / “Add to Home screen”. (Installing only works on the published https site, not in private/incognito windows.)";
}

export function usePwa() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    subs.forEach((f) => f());
    return outcome === "accepted";
  }, []);
  const update = useCallback(() => updateSW?.(true), []);
  const dismissUpdate = useCallback(() => { needRefresh = false; subs.forEach((f) => f()); }, []);
  const dismissOffline = useCallback(() => { offlineReady = false; subs.forEach((f) => f()); }, []);
  return { canInstall: !!deferred, installed: isStandalone(), ios: isIos() && !isStandalone(), blocker: installBlocker(!!deferred), needRefresh, offlineReady, install, update, dismissUpdate, dismissOffline };
}
