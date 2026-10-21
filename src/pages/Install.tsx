import { CheckCircle2, Copy, Download, ExternalLink, Loader2, XCircle } from "lucide-react";
import logoFull from "@/assets/logo-full.webp";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isPreviewEnvironment } from "@/lib/env";
import { BUILD_ID, installBlocker, usePwa } from "@/lib/pwa";

type Check = { label: string; ok: boolean | null; detail: string };

function browserInfo() {
  const ua = navigator.userAgent;
  const inApp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|; wv\)|GSA\//i.test(ua);
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /android/i.test(ua);
  const name = /edg\//i.test(ua) ? "Edge" : /samsungbrowser/i.test(ua) ? "Samsung Internet" : /firefox|fxios/i.test(ua) ? "Firefox" : /opr\//i.test(ua) ? "Opera" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "Unknown";
  const iosNotSafari = ios && /crios|fxios|edgios|opios/i.test(ua);
  return { ua, inApp, ios, android, name, iosNotSafari };
}

async function runChecks(canInstall: boolean): Promise<Check[]> {
  const out: Check[] = [];
  const b = browserInfo();
  out.push({ label: "Secure address (https)", ok: window.isSecureContext, detail: window.isSecureContext ? location.origin : `${location.origin} is not secure. Installing needs https.` });
  out.push({ label: "Opened directly (not inside another page)", ok: window.self === window.top, detail: window.self === window.top ? "Yes" : "This is inside a frame (e.g. an editor preview). Open the address on its own." });
  const onPreviewHost = /(lovableproject\.com|id-preview--)/.test(location.hostname);
  out.push({ label: "Published address (not a preview)", ok: !onPreviewHost, detail: onPreviewHost ? "This is the editor preview address. Use the Published address (Publish button → the link it shows)." : location.hostname });
  out.push({ label: `Browser: ${b.name}${b.ios ? " on iPhone/iPad" : b.android ? " on Android" : ""}`, ok: b.inApp ? false : b.ios ? !b.iosNotSafari : b.name !== "Firefox" && b.name !== "Unknown", detail: b.inApp ? "This looks like an in-app browser (WhatsApp, Facebook, etc.). Open the link in Chrome or Safari." : b.iosNotSafari ? "On iPhone/iPad only Safari can add web apps to the home screen." : b.name === "Firefox" ? "Firefox on phones can’t install web apps. Use Chrome." : "OK" });
  try {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href;
    if (!href) throw new Error("No manifest link in the page");
    const res = await fetch(href, { cache: "no-store" });
    const type = res.headers.get("content-type") ?? "";
    const text = await res.text();
    let json: { name?: string; start_url?: string; icons?: { src: string; sizes: string }[] };
    try { json = JSON.parse(text); } catch { throw new Error(`The manifest address returned ${res.status} ${type || "unknown type"} but not valid manifest data${/<html/i.test(text) ? " (it returned a web page instead)" : ""}`); }
    const sizes = (json.icons ?? []).map((i) => i.sizes);
    const has = (s: string) => sizes.some((x) => x.split(" ").includes(s));
    const iconRes = await Promise.all((json.icons ?? []).filter((i) => i.sizes !== "any").slice(0, 3).map((i) => fetch(new URL(i.src, href), { cache: "no-store" }).then((r) => ({ src: i.src, ok: r.ok && /image\//.test(r.headers.get("content-type") ?? "") })).catch(() => ({ src: i.src, ok: false }))));
    const bad = iconRes.filter((i) => !i.ok);
    out.push({ label: "Web app manifest", ok: res.ok && !!json.name && !!json.start_url && has("192x192") && has("512x512") && bad.length === 0, detail: bad.length ? `Icon not loading: ${bad.map((b) => b.src).join(", ")}` : !has("192x192") || !has("512x512") ? "Needs 192×192 and 512×512 icons" : `${json.name} · content-type ${type || "?"}` });
  } catch (e) { out.push({ label: "Web app manifest", ok: false, detail: e instanceof Error ? e.message : "Could not load the manifest" }); }
  if (!("serviceWorker" in navigator)) out.push({ label: "Offline support (service worker)", ok: false, detail: "Not supported by this browser" });
  else if (isPreviewEnvironment() || /(lovableproject\.com|id-preview--)/.test(location.hostname)) out.push({ label: "Offline support (service worker)", ok: null, detail: "Switched off on preview addresses on purpose. It runs on the published site." });
  else { const reg = await navigator.serviceWorker.getRegistration(); out.push({ label: "Offline support (service worker)", ok: !!reg?.active, detail: reg?.active ? (navigator.serviceWorker.controller ? "Active and controlling this page" : "Active (reload once to take control)") : "Not active yet – wait a few seconds and reload. Requires the published build." }); }
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  out.push({ label: "Running as an installed app", ok: standalone ? true : null, detail: standalone ? "Yes" : "No – you’re in the browser" });
  out.push({ label: "Browser is offering installation", ok: canInstall ? true : null, detail: canInstall ? "Yes – use the Install button below" : b.ios ? "iPhone/iPad never show a button: use Share → Add to Home Screen" : "Not yet. Chrome may not show a prompt on its own – use the browser menu (⋮) → Install app / Add to Home screen." });
  return out;
}

export default function Install() {
  const pwa = usePwa();
  const [checks, setChecks] = useState<Check[] | null>(null);
  useEffect(() => { void runChecks(pwa.canInstall).then(setChecks); }, [pwa.canInstall]);
  const b = browserInfo();
  const blocked = installBlocker(pwa.canInstall);
  const report = () => `FarmHelper install report\nVersion: ${BUILD_ID}\nAddress: ${location.href}\nBrowser: ${navigator.userAgent}\n\n${(checks ?? []).map((c) => `${c.ok === true ? "PASS" : c.ok === false ? "FAIL" : "INFO"}: ${c.label} – ${c.detail}`).join("\n")}`;

  return (
    <div className="mx-auto min-h-screen max-w-xl p-4 pb-16 pt-safe">
      <div className="mb-4 text-center"><img src={logoFull} alt="Kurima Digital – empowering Zimbabwean farmers" className="mx-auto mb-3 h-32 w-auto mix-blend-multiply" /><h1 className="text-2xl font-bold">Install FarmHelper</h1><p className="text-sm text-muted-foreground">Version {BUILD_ID}</p></div>

      {pwa.installed ? <p className="mb-4 rounded-xl bg-success/10 p-3 text-sm">You’re already using the installed app.</p> : (
        <div className="mb-4 space-y-3 rounded-2xl border bg-card p-4">
          {pwa.canInstall && <Button size="lg" className="h-12 w-full text-base" onClick={() => pwa.install()}><Download className="mr-2 h-5 w-5" />Install app</Button>}
          {window.self !== window.top && <Button size="lg" variant="outline" className="h-12 w-full text-base" onClick={() => window.open(location.href, "_blank", "noopener")}><ExternalLink className="mr-2 h-5 w-5" />Open in its own tab, then install</Button>}
          {blocked && <p className="text-sm">{blocked}</p>}
          <div className="space-y-2 text-sm">
            <h2 className="font-semibold">How to install by hand</h2>
            <p><b>Android (Chrome):</b> tap the ⋮ menu → <b>Install app</b> (or <b>Add to Home screen</b>).</p>
            <p><b>iPhone / iPad:</b> open this address in <b>Safari</b> → tap <b>Share</b> → <b>Add to Home Screen</b> → Add.{b.iosNotSafari && <span className="font-semibold text-danger"> You’re not in Safari – copy the address and open it in Safari.</span>}</p>
            <p><b>Computer (Chrome/Edge):</b> install icon at the right of the address bar, or menu → <b>Install FarmHelper</b>.</p>
            <p className="text-muted-foreground">It only works on the <b>published https address</b>, in a normal (not private) window.</p>
          </div>
        </div>
      )}

      <h2 className="mb-2 font-semibold">Checks on this device</h2>
      {!checks ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking…</p> : (
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-3 rounded-xl border bg-card p-3 text-sm">
              {c.ok === true ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : c.ok === false ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" /> : <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-muted-foreground/40" />}
              <div><div className="font-medium">{c.label}</div><div className="text-muted-foreground">{c.detail}</div></div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(report()).then(() => toast.success("Report copied – paste it in a message"), () => toast.error("Couldn’t copy")); }}><Copy className="mr-1.5 h-4 w-4" />Copy report</Button>
        <Button variant="ghost" asChild><Link to="/">Back to the app</Link></Button>
      </div>
    </div>
  );
}
