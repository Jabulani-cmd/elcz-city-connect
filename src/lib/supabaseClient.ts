import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authStorage } from "@/lib/authStorage";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined)?.trim();

/** True when a Supabase project is configured. Otherwise the app runs local-only, without sign-in. */
export const cloudEnabled = !!(url && key);

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "farmhelper.auth", storage: authStorage } })
  : null;
