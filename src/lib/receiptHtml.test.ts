import { describe, expect, it } from "vitest";
import { COMPANY } from "../../supabase/functions/_shared/company";
import type { ReceiptInput } from "../../supabase/functions/_shared/receipt";
import { esc, receiptHtml } from "../../supabase/functions/_shared/receiptHtml";

const base: ReceiptInput = { farm: "Ndizvo Homestead", planName: "Starter", interval: "month", amountUsd: 10, method: "ecocash", reference: "FH-AB12CD34", paidAt: "2026-11-19T16:20:00.000Z", activeUntil: "2026-12-19T16:20:00.000Z", billedToName: "Francis Moyo", billedToEmail: "owner@example.com", farmLocation: "Mashonaland East", transactionRef: "PN-123" };

describe("receiptHtml", () => {
  const html = receiptHtml(base);
  it("is a complete, self-contained page with the logo", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(`<img src="${COMPANY.logoUrl}"`);
    expect(html).not.toMatch(/<link |<script|@import/);
  });
  it("carries everything an official receipt should", () => {
    for (const s of ["Kurima Digital", "OFFICIAL", "RECEIPT", "PAID", "$10.00 USD", "BILLED TO", "Ndizvo Homestead", "Francis Moyo", "owner@example.com", "Mashonaland East", "FH-AB12CD34", "19 Nov 2026, 16:20 UTC", "EcoCash", "PN-123",
      "FarmHelper Starter plan – monthly subscription", "Period covered: 19 Nov 2026 to 19 Dec 2026", "Subtotal", "Total paid", "Balance due", "$0.00 USD", "active until 19 Dec 2026", "+263 78 982 4741", "www.kurima-mavingtech.online", "does not need a signature"]) expect(html, s).toContain(s);
  });
  it("only shows the demo banner for demo payments", () => {
    expect(html).not.toContain("DEMO RECEIPT");
    const demo = receiptHtml({ ...base, method: "demo:ecocash" });
    expect(demo).toContain("DEMO RECEIPT");
    expect(demo).toContain("not a tax invoice");
    expect(demo).toContain("EcoCash (demo)");
  });
  it("cannot be broken or abused by what people type into their farm details", () => {
    const evil = receiptHtml({ ...base, farm: `<script>alert(1)</script>`, billedToName: `"><img src=x onerror=alert(2)>`, billedToEmail: "a&b@example.com" });
    expect(evil).not.toContain("<script>alert");
    expect(evil).not.toContain("<img src=x");
    expect(evil).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(evil).toContain("a&amp;b@example.com");
    expect(esc(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });
  it("leaves out unknown details instead of printing placeholders", () => {
    const bare = receiptHtml({ ...base, billedToName: undefined, billedToEmail: undefined, farmLocation: undefined, transactionRef: undefined });
    expect(bare).not.toMatch(/undefined|null|Transaction ref/);
    expect(bare).not.toMatch(/Reg \/ TIN|VAT No/);
  });
  it("shows the full seller details when they are filled in", () => {
    const full = receiptHtml(base, { ...COMPANY, addressLines: ["12 Example Road", "Harare"], email: "hello@example.com", registration: "123", vatNumber: "456" });
    for (const s of ["12 Example Road", "Harare", "hello@example.com", "Reg / TIN: 123", "VAT No: 456"]) expect(full, s).toContain(s);
  });
});
