import { useSyncExternalStore } from "react";
import { cloudEnabled, supabase } from "@/integrations/supabase/client";

export type AuthStatus = "loading" | "signedOut" | "signedIn" | "recovery";
export type AuthState = { status: AuthStatus; userId: string; email: string; name: string };

const LAST = "farmhelper.lastUser";
let state: AuthState = { status: cloudEnabled ? "loading" : "signedOut", userId: "", email: "", name: "" };
const subs = new Set<() => void>();
const set = (s: AuthState) => { state = s; subs.forEach((f) => f()); };
const readLast = (): Pick<AuthState, "userId" | "email" | "name"> | null => { try { return JSON.parse(localStorage.getItem(LAST) ?? "null"); } catch { return null; } };
const writeLast = (v: unknown) => { try { if (v) localStorage.setItem(LAST, JSON.stringify(v)); else localStorage.removeItem(LAST); } catch { /* ignore */ } };

type SessionUser = { id: string; email?: string; user_metadata?: { full_name?: string } };
const fromUser = (u: SessionUser): AuthState => ({ status: "signedIn", userId: u.id, email: u.email ?? "", name: u.user_metadata?.full_name ?? (u.email ?? "").split("@")[0] });

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") return set({ ...state, status: "recovery" });
    if (event === "SIGNED_OUT") { writeLast(null); return set({ status: "signedOut", userId: "", email: "", name: "" }); }
    if (session?.user) { const s = fromUser(session.user); writeLast({ userId: s.userId, email: s.email, name: s.name }); if (state.status !== "recovery") set(s); }
  });
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) { const s = fromUser(data.session.user); writeLast({ userId: s.userId, email: s.email, name: s.name }); if (state.status !== "recovery") set(s); return; }
    // Offline with a remembered account: keep working; the session refreshes when the connection returns.
    const last = readLast();
    if (last && !navigator.onLine) set({ status: "signedIn", ...last });
    else if (state.status === "loading") set({ status: "signedOut", userId: "", email: "", name: "" });
  }).catch(() => {
    const last = readLast();
    set(last ? { status: "signedIn", ...last } : { status: "signedOut", userId: "", email: "", name: "" });
  });
}

export const useAuth = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state);
export const getAuth = () => state;

const need = () => { if (!supabase) throw new Error("Sign-in is not configured"); return supabase; };

export async function signIn(email: string, password: string) {
  const { error } = await need().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Returns true when the account is created and signed in, false when email confirmation is required first. */
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await need().auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin } });
  if (error) throw error;
  return !!data.session;
}

export async function signOut() {
  await need().auth.signOut();
}

export async function sendPasswordReset(email: string) {
  const { error } = await need().auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
  if (error) throw error;
}

export async function setNewPassword(password: string) {
  const { error } = await need().auth.updateUser({ password });
  if (error) throw error;
  set({ ...state, status: "signedIn" });
}

export async function getAccessToken(): Promise<string | undefined> {
  if (!supabase) return undefined;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
