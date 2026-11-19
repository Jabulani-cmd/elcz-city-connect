import { describe, expect, it, vi } from "vitest";
import { assertNotLeaked, breachCount, LeakedPasswordError, sha1Hex } from "./leakedPasswords";

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const PREFIX = "5BAA6", SUFFIX = "1E4C9B93F3F0682250B6CF8331B7EE68FD8";
const reply = (body: string, status = 200) => vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch;
const range = `0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${SUFFIX}:10434004\r\n011053FD0102E94D6AE2F8B83D76FAF94F6:1\r\n`;

describe("sha1Hex", () => {
  it("scrambles text the way the breach service expects", async () => {
    expect(await sha1Hex("password")).toBe(PREFIX + SUFFIX);
  });
});

describe("breachCount", () => {
  it("finds a leaked password and says how often it appeared", async () => {
    expect(await breachCount("password", { fetchImpl: reply(range) })).toBe(10434004);
  });
  it("sends only the first 5 characters of the scrambled password, never the password", async () => {
    const f = reply(range);
    await breachCount("password", { fetchImpl: f });
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${PREFIX}`);
    const u = new URL(url);
    expect(u.pathname).toBe(`/range/${PREFIX}`); // nothing but the 5-character prefix
    expect(u.search).toBe("");
    expect(url).not.toContain(SUFFIX);
    expect(init.headers).toBeUndefined(); // a plain request: no custom headers
  });
  it("returns 0 for a password that is not in the list", async () => {
    expect(await breachCount("password", { fetchImpl: reply("0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n") })).toBe(0);
  });
  it("matches regardless of letter case and line endings", async () => {
    expect(await breachCount("password", { fetchImpl: reply(`${SUFFIX.toLowerCase()}:7\n`) })).toBe(7);
  });
  it("returns null when the check could not be done", async () => {
    expect(await breachCount("password", { fetchImpl: reply("nope", 503) })).toBeNull();
    expect(await breachCount("password", { fetchImpl: (async () => { throw new Error("offline"); }) as unknown as typeof fetch })).toBeNull();
  });
  it("gives up after the time limit instead of making someone wait", async () => {
    const hang = ((_u: string, init: RequestInit) => new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new Error("aborted"))))) as unknown as typeof fetch;
    const started = Date.now();
    expect(await breachCount("password", { fetchImpl: hang, timeoutMs: 30 })).toBeNull();
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe("assertNotLeaked", () => {
  it("refuses a leaked password with a friendly message", async () => {
    const err = await assertNotLeaked("password", { fetchImpl: reply(range) }).catch((e) => e);
    expect(err).toBeInstanceOf(LeakedPasswordError);
    expect(err.message).toMatch(/10,434,004 times in known data breaches/);
    expect(err.message).toMatch(/choose a different one/);
  });
  it("words a single appearance correctly", async () => {
    const err = await assertNotLeaked("password", { fetchImpl: reply(`${SUFFIX}:1`) }).catch((e) => e);
    expect(err.message).toMatch(/appeared once in known data breaches/);
  });
  it("accepts a password that is not leaked", async () => {
    await expect(assertNotLeaked("password", { fetchImpl: reply("0018A45C4D1DEF81644B54AB7F969B88D65:1") })).resolves.toBeUndefined();
  });
  it("accepts the password when the check can't run (never locks anyone out)", async () => {
    await expect(assertNotLeaked("password", { fetchImpl: reply("down", 500) })).resolves.toBeUndefined();
  });
  it("its message never trips the app's other error wordings", () => {
    const m = new LeakedPasswordError(3).message;
    expect(m).not.toMatch(/password.*(short|least|weak)/i); // see friendly() in AuthScreen
    expect(m).not.toMatch(/fetch|network|load failed|timed out|abort/i);
  });
});
