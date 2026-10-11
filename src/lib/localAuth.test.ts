import { beforeEach, describe, expect, it } from "vitest";
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
