import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sha1Hex } from "./leakedPasswords";
import { addAccount, listAccounts, removeAccount, setAccountPassword, setAccountRole, verifyAccount } from "./localAuth";

beforeEach(() => localStorage.clear());

describe("local accounts", () => {
  it("never stores the password and verifies it", async () => {
    await addAccount("Thandi", "Thandi", "correct-horse-1", "Owner");
    expect(localStorage.getItem("farmhelper.accounts")).not.toContain("correct-horse-1");
    expect(await verifyAccount("  THANDI ", "correct-horse-1")).toMatchObject({ name: "Thandi", role: "Owner" });
    expect(await verifyAccount("thandi", "wrong-password")).toBeNull();
    expect(await verifyAccount("nobody", "correct-horse-1")).toBeNull();
  });
  it("salts: same password gives different hashes", async () => {
    await addAccount("A", "alice", "same-password-1", "Owner");
    await addAccount("B", "bobby", "same-password-1", "Employee");
    const [a, b] = listAccounts();
    expect(a.hash).not.toBe(b.hash);
  });
  it("validates input and unique usernames", async () => {
    await expect(addAccount("", "alice", "long-enough-1", "Owner")).rejects.toThrow(/name/i);
    await expect(addAccount("A", "al", "long-enough-1", "Owner")).rejects.toThrow(/username/i);
    await expect(addAccount("A", "alice", "short", "Owner")).rejects.toThrow(/8 characters/);
    await addAccount("A", "alice", "long-enough-1", "Owner");
    await expect(addAccount("A2", "ALICE", "long-enough-1", "Employee")).rejects.toThrow(/already used/);
  });
  it("password reset works and the old one stops working", async () => {
    const a = await addAccount("A", "alice", "old-password-1", "Owner");
    await setAccountPassword(a.id, "new-password-2");
    expect(await verifyAccount("alice", "old-password-1")).toBeNull();
    expect(await verifyAccount("alice", "new-password-2")).not.toBeNull();
  });
  it("always keeps one owner", async () => {
    const a = await addAccount("A", "alice", "long-enough-1", "Owner");
    const b = await addAccount("B", "bobby", "long-enough-1", "Employee");
    expect(() => setAccountRole(a.id, "Viewer")).toThrow(/at least one owner/);
    expect(() => removeAccount(a.id)).toThrow(/only owner/);
    setAccountRole(b.id, "Owner");
    expect(() => removeAccount(a.id)).not.toThrow();
    expect(listAccounts().map((x) => x.username)).toEqual(["bobby"]);
  });
});

describe("leaked passwords", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });
  /** Pretend the breach service knows this password. */
  const leaked = async (password: string) => {
    const suffix = (await sha1Hex(password)).slice(5);
    globalThis.fetch = (async () => new Response(`${suffix}:42\r\n`)) as unknown as typeof fetch;
  };

  it("refuses a new account whose password is known to be leaked, and saves nothing", async () => {
    await leaked("Passw0rd-leaked");
    await expect(addAccount("Thandi", "thandi", "Passw0rd-leaked", "Owner")).rejects.toThrow(/42 times in known data breaches/);
    expect(listAccounts()).toHaveLength(0);
  });
  it("refuses to change a password to a leaked one, and keeps the old one", async () => {
    const a = await addAccount("A", "alice", "old-password-1", "Owner");
    await leaked("Passw0rd-leaked");
    await expect(setAccountPassword(a.id, "Passw0rd-leaked")).rejects.toThrow(/data breaches/);
    expect(await verifyAccount("alice", "old-password-1")).not.toBeNull();
    expect(await verifyAccount("alice", "Passw0rd-leaked")).toBeNull();
  });
  it("still lets people in when the breach service can't be reached", async () => {
    globalThis.fetch = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    const a = await addAccount("A", "alice", "correct-horse-1", "Owner");
    expect(a.username).toBe("alice");
  });
  it("does not check on sign-in, so existing users are never locked out", async () => {
    await addAccount("A", "alice", "correct-horse-1", "Owner");
    await leaked("correct-horse-1");
    expect(await verifyAccount("alice", "correct-horse-1")).not.toBeNull();
  });
});
