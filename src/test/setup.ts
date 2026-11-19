import "@testing-library/jest-dom";
import { vi } from "vitest";

// The network is switched off in tests, so nothing depends on (or calls) a real website. Tests that need a reply give their own fetch.
vi.stubGlobal("fetch", () => Promise.reject(new Error("The network is switched off in tests")));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
