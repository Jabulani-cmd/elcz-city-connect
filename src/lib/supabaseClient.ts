import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authStorage } from "@/lib/authStorage";

/** Supabase projects that must never be used by this app (they hold the previous church website's data). */
const RETIRED_PROJECT_REFS = ["iakxbadawldjyshqlxzd"];

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const retired = !!rawUrl && RETIRED_PROJECT_REFS.some((ref) => rawUrl.includes(ref));
if (retired) console.warn("FarmHelper: the configured Supabase project belongs to the old church website and is ignored. Connect a new, empty project.");
const url = retired ? undefined : rawUrl;
const key = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined)?.trim();

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
