import { afterEach, describe, expect, it, vi } from "vitest";

const load = async (url: string, key = "anon", localOnly = "") => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", url);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", key);
  vi.stubEnv("VITE_FARMHELPER_LOCAL_ONLY", localOnly);
  return import("./supabaseClient");
};
afterEach(() => vi.unstubAllEnvs());

const OWN = "kpqhrvpglhporpjrgicr.supabase.co";

describe("cloud configuration", () => {
  it("uses the FarmHelper project when .env is empty (Lovable blanks it)", async () => {
    const m = await load("", "");
    expect(m.cloudEnabled).toBe(true);
    expect(m.cloudHost).toBe(OWN);
  });
  it("uses a different project when both values are set", async () => {
    const m = await load("https://abcdefghijklmno.supabase.co");
    expect(m.cloudEnabled).toBe(true);
    expect(m.cloudHost).toBe("abcdefghijklmno.supabase.co");
  });
  it("replaces the retired church-website project with the FarmHelper project", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const m = await load("https://iakxbadawldjyshqlxzd.supabase.co", "church-key");
    expect(m.cloudEnabled).toBe(true);
    expect(m.cloudHost).toBe(OWN);
    expect(warn).toHaveBeenCalled();
  });
  it("can be forced to local-only", async () => {
    const m = await load("", "", "true");
    expect(m.cloudEnabled).toBe(false);
    expect(m.supabase).toBeNull();
  });
});
