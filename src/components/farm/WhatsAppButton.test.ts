import { describe, expect, it } from "vitest";
import { whatsappLink } from "./WhatsAppButton";

describe("whatsappLink", () => {
  it("opens a chat with the number (digits only) and a ready-typed message", () => {
    const url = new URL(whatsappLink("263789824741", "Hi, FarmHelper?"));
    expect(url.origin + url.pathname).toBe("https://wa.me/263789824741");
    expect(url.searchParams.get("text")).toBe("Hi, FarmHelper?");
  });
  it("defaults to the Zimbabwe number", () => {
    expect(whatsappLink()).toContain("wa.me/263789824741");
  });
});
