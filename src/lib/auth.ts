import { useSyncExternalStore } from "react";
import { cloudEnabled, supabase } from "@/lib/supabaseClient";
import { authStorage, dropStalePersistentSession, setKeepSignedIn } from "./authStorage";
import { addAccount, listAccounts, setAccountPassword, verifyAccount, wipeAccounts, type LocalAccount } from "./localAuth";
import type { Role } from "./types";

/**
 * One sign-in model for both modes:
 *  - cloud (Supabase configured): real accounts, roles come from the database
 *  - local (no cloud): accounts stored on this device, so the app still opens at a login page and has a sign-out
 */
export type AuthStatus = "loading" | "setup" | "signedOut" | "signedIn" | "recovery";
export type AuthState = { status: AuthStatus; userId: string; email: string; name: string; role?: Role };
export const authMode: "cloud" | "local" = cloudEnabled ? "cloud" : "local";

const LAST = "farmhelper.lastUser";
const SESSION = "farmhelper.localSession";
const OUT: AuthState = { status: "signedOut", userId: "", email: "", name: "" };

const subs = new Set<() => void>();
let state: AuthState = { status: "loading", userId: "", email: "", name: "" };
const set = (s: AuthState) => { state = s; subs.forEach((f) => f()); };

const readLast = (): Pick<AuthState, "userId" | "email" | "name"> | null => { try { return JSON.parse(authStorage.getItem(LAST) ?? "null"); } catch { return null; } };
const writeLast = (v: unknown) => { try { if (v) authStorage.setItem(LAST, JSON.stringify(v)); else authStorage.removeItem(LAST); } catch { /* ignore */ } };

/* ---------- cloud ---------- */
type SessionUser = { id: string; email?: string; user_metadata?: { full_name?: string } };
const fromUser = (u: SessionUser): AuthState => ({ status: "signedIn", userId: u.id, email: u.email ?? "", name: u.user_metadata?.full_name ?? (u.email ?? "").split("@")[0] });

if (supabase) {
  dropStalePersistentSession(["farmhelper.auth", "farmhelper.auth-code-verifier", LAST]);
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") return set({ ...state, status: "recovery" });
    if (event === "SIGNED_OUT") { writeLast(null); return set(OUT); }
    if (session?.user) { const s = fromUser(session.user); writeLast({ userId: s.userId, email: s.email, name: s.name }); if (state.status !== "recovery") set(s); }
  });
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) { const s = fromUser(data.session.user); writeLast({ userId: s.userId, email: s.email, name: s.name }); if (state.status !== "recovery") set(s); return; }
    // Offline with a remembered account: keep working; the session refreshes when the connection returns.
    const last = readLast();
    if (last && !navigator.onLine) set({ status: "signedIn", ...last });
    else if (state.status === "loading") set(OUT);
  }).catch(() => {
    const last = readLast();
    set(last ? { status: "signedIn", ...last } : OUT);
  });
}

/* ---------- local ---------- */
const asState = (a: LocalAccount): AuthState => ({ status: "signedIn", userId: a.id, email: a.username, name: a.name, role: a.role });
function initLocal() {
  const accounts = listAccounts();
  if (!accounts.length) return set({ ...OUT, status: "setup" });
  try {
    dropStalePersistentSession([SESSION]);
    const id = authStorage.getItem(SESSION);
    const acc = accounts.find((a) => a.id === id);
    set(acc ? asState(acc) : OUT);
  } catch { set(OUT); }
}
if (!supabase) initLocal();

export const useAuth = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state);
export const getAuth = () => state;

/* ---------- actions ---------- */
const need = () => { if (!supabase) throw new Error("Sign-in is not configured"); return supabase; };

export async function signInWithMagicLink(email: string) {
  const { error } = await need().auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}

export async function signIn(identifier: string, password: string, keep = false) {
  setKeepSignedIn(keep);
  if (authMode === "local") {
    const acc = await verifyAccount(identifier, password);
    if (!acc) throw new Error("Invalid login credentials");
    authStorage.setItem(SESSION, acc.id);
    return set(asState(acc));
  }
  const { error } = await need().auth.signInWithPassword({ email: identifier.trim(), password });
  if (error) throw error;
}

/** Cloud: returns true when signed in, false when email confirmation is required first. */
export async function signUp(email: string, password: string, fullName: string, keep = false) {
  setKeepSignedIn(keep);
  const { data, error } = await need().auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin } });
  if (error) throw error;
  return !!data.session;
}

/** Local: the very first account becomes the owner. */
export async function createOwnerAccount(name: string, username: string, password: string, keep = false) {
  if (listAccounts().length) throw new Error("An owner already exists");
  setKeepSignedIn(keep);
  const acc = await addAccount(name, username, password, "Owner");
  authStorage.setItem(SESSION, acc.id);
  set(asState(acc));
}

export async function signOut() {
  if (authMode === "local") { authStorage.removeItem(SESSION); return set(OUT); }
  await need().auth.signOut();
  set(OUT);
}

/** Local only: forgotten owner password. Accounts are removed (the farm data on the device is handled by the caller). */
export function resetLocalAccounts() { wipeAccounts(); authStorage.removeItem(SESSION); set({ ...OUT, status: "setup" }); }

export async function sendPasswordReset(email: string) {
  const { error } = await need().auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
  if (error) throw error;
}

export async function setNewPassword(password: string) {
  const { error } = await need().auth.updateUser({ password });
  if (error) throw error;
  set({ ...state, status: "signedIn" });
}

/** Change the signed-in user's own password. */
export async function changeMyPassword(current: string, next: string) {
  if (authMode === "local") {
    const acc = listAccounts().find((a) => a.id === state.userId);
    if (!acc || !(await verifyAccount(acc.username, current))) throw new Error("Your current password isn’t right");
    return setAccountPassword(acc.id, next);
  }
  const { error: e1 } = await need().auth.signInWithPassword({ email: state.email, password: current });
  if (e1) throw new Error("Your current password isn’t right");
  const { error } = await need().auth.updateUser({ password: next });
  if (error) throw error;
}

/** Re-read local accounts after changes (e.g. the signed-in user's role was edited). */
export function refreshLocalSession() {
  if (authMode !== "local" || state.status !== "signedIn") return;
  const acc = listAccounts().find((a) => a.id === state.userId);
  set(acc ? asState(acc) : OUT);
}

export async function getAccessToken(): Promise<string | undefined> {
  if (!supabase) return undefined;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
