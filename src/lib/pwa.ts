import { useCallback, useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallEvent | null = null;
const subs = new Set<() => void>();
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let needRefresh = false;
let offlineReady = false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallEvent; subs.forEach((f) => f()); });
  window.addEventListener("appinstalled", () => { deferred = null; subs.forEach((f) => f()); });
  updateSW = registerSW({
    onNeedRefresh() { needRefresh = true; subs.forEach((f) => f()); },
    onOfflineReady() { offlineReady = true; subs.forEach((f) => f()); },
    onRegisterError() { /* offline caching is a bonus; the app still works online */ },
  });
}

const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

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
