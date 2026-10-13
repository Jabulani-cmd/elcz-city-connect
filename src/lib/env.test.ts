import { describe, expect, it } from "vitest";
import { isPreviewEnvironment } from "./env";

describe("isPreviewEnvironment", () => {
  it("skips service worker in frames and Lovable preview hosts", () => {
    expect(isPreviewEnvironment("example.com", true)).toBe(true);
    expect(isPreviewEnvironment("abc.lovableproject.com", false)).toBe(true);
    expect(isPreviewEnvironment("id-preview--abc.lovable.app", false)).toBe(true);
  });
  it("allows the real site", () => {
    expect(isPreviewEnvironment("farmhelper.lovable.app", false)).toBe(false);
    expect(isPreviewEnvironment("localhost", false)).toBe(false);
  });
});
