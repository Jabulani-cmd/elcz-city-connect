import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authStorage } from "@/lib/authStorage";

/** Supabase projects that must never be used by this app (they hold the previous church website's data). */
const RETIRED_PROJECT_REFS = ["iakxbadawldjyshqlxzd"];

/** FarmHelper's own Supabase project. Lovable rewrites `.env` (it has put the retired church project back more than once), so the app
 *  carries its real project here and uses it whenever `.env` is empty or points at a retired project. The publishable key is public by
 *  design: row-level security is what protects the data. To use a different project set both VITE_ variables; to run with no cloud at all
 *  set VITE_FARMHELPER_LOCAL_ONLY=true. */
const DEFAULT_URL = "https://kpqhrvpglhporpjrgicr.supabase.co";
const DEFAULT_KEY = "sb_publishable_BvUY-vTaQvtJB4kuZB8XJw_dPmhhLQ2";

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envKey = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined)?.trim();
const localOnly = import.meta.env.VITE_FARMHELPER_LOCAL_ONLY === "true";
const retired = !!envUrl && RETIRED_PROJECT_REFS.some((ref) => envUrl.includes(ref));
if (retired) console.warn("FarmHelper: .env points at the old church website project, which is ignored. Using the FarmHelper project instead.");
const useEnv = !!envUrl && !!envKey && !retired;
const url = localOnly ? undefined : useEnv ? envUrl : DEFAULT_URL;
const key = localOnly ? undefined : useEnv ? envKey : DEFAULT_KEY;

/** True when a Supabase project is configured. Otherwise the app runs local-only, without sign-in. */
export const cloudEnabled = !!(url && key);

/** Host name of the configured project, for error messages (never the key). */
export const cloudHost = url ? new URL(url).host : "";

/** Is the cloud server answering? Used to give an honest message instead of "no internet". */
export async function pingCloud(): Promise<boolean> {
  if (!url || !key) return false;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key }, signal: ctl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "farmhelper.auth", storage: authStorage } })
  : null;
