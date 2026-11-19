/**
 * Leaked-password check. When someone chooses a new password we ask the free "Have I Been Pwned" Pwned Passwords service whether
 * it appears in known data breaches, and refuse it if so.
 *
 * Privacy: the password never leaves the device. We scramble it with SHA-1 and send only the first 5 characters of that scrambled
 * value (the service's "k-anonymity" range lookup); the service replies with every scrambled ending that shares those 5 characters
 * and we look for ours locally.
 *
 * It fails open: if the service can't be reached (offline, slow, down) the password is accepted, so nobody is ever locked out of
 * creating an account. This is a protection for people using the app; Supabase's own server-side setting (a Pro plan feature)
 * would also cover direct calls to the API.
 */
const API = "https://api.pwnedpasswords.com/range/";

export async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

type Options = { fetchImpl?: typeof fetch; timeoutMs?: number };

/** How many times the password appears in known breaches: 0 = not found, null = the check could not be done. */
export async function breachCount(password: string, opts: Options = {}): Promise<number | null> {
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5), suffix = hash.slice(5);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 4000);
    try {
      // a plain GET with no custom headers, so the browser needs no extra permission to make the request
      const res = await (opts.fetchImpl ?? fetch)(API + prefix, { signal: ctl.signal });
      if (!res.ok) return null;
      for (const line of (await res.text()).split(/\r?\n/)) {
        const [s, c] = line.trim().split(":");
        if (s && s.toUpperCase() === suffix) return Number(c) || 0;
      }
      return 0;
    } finally { clearTimeout(timer); }
  } catch { return null; }
}

export class LeakedPasswordError extends Error {
  constructor(public count: number) {
    super(`That password has appeared ${count > 1 ? `${count.toLocaleString("en")} times` : "once"} in known data breaches, so it isn’t safe to use. Please choose a different one.`);
    this.name = "LeakedPasswordError";
  }
}

/** Throws a friendly error when the password is known to be leaked; does nothing when it isn't, or when the check can't be done. */
export async function assertNotLeaked(password: string, opts: Options = {}): Promise<void> {
  const n = await breachCount(password, opts);
  if (n && n > 0) throw new LeakedPasswordError(n);
}
