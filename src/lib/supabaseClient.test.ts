import { afterEach, describe, expect, it, vi } from "vitest";

const load = async (url: string, key = "anon") => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", url);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", key);
  return import("./supabaseClient");
};
afterEach(() => vi.unstubAllEnvs());

describe("cloud configuration", () => {
  it("is off when nothing is configured", async () => {
    const m = await load("", "");
    expect(m.cloudEnabled).toBe(false);
    expect(m.supabase).toBeNull();
  });
  it("is on for a new project", async () => {
    const m = await load("https://abcdefghijklmno.supabase.co");
    expect(m.cloudEnabled).toBe(true);
    expect(m.cloudHost).toBe("abcdefghijklmno.supabase.co");
  });
  it("ignores the retired church-website project", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const m = await load("https://iakxbadawldjyshqlxzd.supabase.co");
    expect(m.cloudEnabled).toBe(false);
    expect(m.supabase).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});
