import type { Role } from "./types";

/**
 * Accounts that live on this device (used when no cloud project is connected). Passwords are never stored: only a salted
 * PBKDF2 hash. This keeps casual users out of the app on a shared phone; it does NOT encrypt the farm data on the device.
 */
export type LocalAccount = { id: string; name: string; username: string; role: Role; salt: string; hash: string; createdAt: string };

const KEY = "farmhelper.accounts";
const ITER = 150_000;

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const normUser = (u: string) => u.trim().toLowerCase();

export async function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("This browser can’t secure passwords here. Open the app over https.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromB64(salt), iterations: ITER, hash: "SHA-256" }, key, 256);
  return toB64(new Uint8Array(bits));
}

export function listAccounts(): LocalAccount[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
const save = (a: LocalAccount[]) => localStorage.setItem(KEY, JSON.stringify(a));

const newSalt = () => toB64(crypto.getRandomValues(new Uint8Array(16)));
const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function validate(name: string, username: string, password: string) {
  if (!name.trim()) throw new Error("Please enter a name");
  if (normUser(username).length < 3) throw new Error("Username must be at least 3 characters");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
}

export async function addAccount(name: string, username: string, password: string, role: Role): Promise<LocalAccount> {
  validate(name, username, password);
  const all = listAccounts();
  if (all.some((a) => a.username === normUser(username))) throw new Error("That username is already used");
  const salt = newSalt();
  const acc: LocalAccount = { id: newId(), name: name.trim(), username: normUser(username), role, salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
  save([...all, acc]);
  return acc;
}

export async function verifyAccount(username: string, password: string): Promise<LocalAccount | null> {
  const acc = listAccounts().find((a) => a.username === normUser(username));
  // do the work even for unknown users so response time doesn't reveal which usernames exist
  const hash = await hashPassword(password, acc?.salt ?? toB64(new Uint8Array(16)));
  return acc && hash === acc.hash ? acc : null;
}

export async function setAccountPassword(id: string, password: string) {
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const salt = newSalt();
  const hash = await hashPassword(password, salt);
  save(listAccounts().map((a) => (a.id === id ? { ...a, salt, hash } : a)));
}

export function setAccountRole(id: string, role: Role) {
  const all = listAccounts();
  const target = all.find((a) => a.id === id);
  if (target?.role === "Owner" && role !== "Owner" && all.filter((a) => a.role === "Owner").length < 2) throw new Error("There must be at least one owner");
  save(all.map((a) => (a.id === id ? { ...a, role } : a)));
}

export function removeAccount(id: string) {
  const all = listAccounts();
  const target = all.find((a) => a.id === id);
  if (target?.role === "Owner" && all.filter((a) => a.role === "Owner").length < 2) throw new Error("You can’t remove the only owner");
  save(all.filter((a) => a.id !== id));
}

export const wipeAccounts = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
