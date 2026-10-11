/**
 * Where the sign-in session lives. By default it is kept only for the current browser session, so the app opens at the
 * login page each time it is launched. “Keep me signed in” stores it on the device instead.
 */
const KEEP = "farmhelper.keepSignedIn";

export const getKeepSignedIn = () => { try { return localStorage.getItem(KEEP) === "1"; } catch { return false; } };
export function setKeepSignedIn(v: boolean) { try { localStorage.setItem(KEEP, v ? "1" : "0"); } catch { /* ignore */ } }

const area = (): Storage | undefined => { try { return getKeepSignedIn() ? localStorage : sessionStorage; } catch { return undefined; } };
const other = (): Storage | undefined => { try { return getKeepSignedIn() ? sessionStorage : localStorage; } catch { return undefined; } };

/** Storage adapter for supabase-js and for the small values we remember ourselves. */
export const authStorage = {
  getItem: (k: string) => area()?.getItem(k) ?? null,
  setItem: (k: string, v: string) => { area()?.setItem(k, v); other()?.removeItem(k); },
  removeItem: (k: string) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* ignore */ } },
};

/** A session left in permanent storage by an earlier version (or an unticked “keep me signed in”) must not skip the login page. */
export function dropStalePersistentSession(keys: string[]) {
  if (getKeepSignedIn()) return;
  try { for (const k of keys) localStorage.removeItem(k); } catch { /* ignore */ }
}
