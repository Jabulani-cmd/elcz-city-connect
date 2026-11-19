import { describe, expect, it } from "vitest";
import { COMPANY } from "../../supabase/functions/_shared/company";
import type { ReceiptInput } from "../../supabase/functions/_shared/receipt";
import { buildReceiptPdf, buildReceiptPdfBytes, receiptFileName } from "./receiptPdf";

const base: ReceiptInput = { farm: "Ndizvo Homestead", planName: "Starter", interval: "month", amountUsd: 10, method: "ecocash", reference: "FH-AB12CD34", paidAt: "2026-11-19T16:20:00.000Z", activeUntil: "2026-12-19T16:20:00.000Z", billedToName: "Francis Moyo", billedToEmail: "owner@example.com", farmLocation: "Mashonaland East", transactionRef: "PN-123" };
const text = (b: ArrayBuffer) => new TextDecoder("latin1").decode(new Uint8Array(b));

describe("receipt PDF", () => {
  it("is a real one-page A4 PDF with the receipt's details", async () => {
    const t = text(await buildReceiptPdfBytes(base));
    expect(t.startsWith("%PDF-")).toBe(true);
    expect((t.match(/\/Type \/Page\b/g) ?? []).length).toBe(1);
    expect(t).toMatch(/\/MediaBox \[0 0 595\.2\d* 841\.8\d*\]/); // A4
    for (const s of ["Kurima Digital", "RECEIPT", "OFFICIAL", "PAID", "$10.00 USD", "Ndizvo Homestead", "Francis Moyo", "owner@example.com", "FH-AB12CD34", "PN-123", "FarmHelper Starter plan", "Period covered", "Total paid", "Balance due", "MavingTech Business Solutions", "14601 Isiliwane Crescent", "info@mavingtech.com", "115409A0252026", "2002517356", "does not need a signature"]) expect(t, s).toContain(s);
  });
  it("has a demo banner and watermark only for demo payments", async () => {
    expect(text(await buildReceiptPdfBytes(base))).not.toContain("DEMO");
    const demo = text(await buildReceiptPdfBytes({ ...base, method: "demo:ecocash" }));
    expect(demo).toContain("DEMO RECEIPT");
    expect(demo).toContain("(DEMO)");
  });
  it("still works when the logo can't be used, and with a long seller block", async () => {
    const t = text(await buildReceiptPdfBytes(base, { logo: "not-an-image", company: { ...COMPANY, addressLines: ["1 Road", "Town", "Zimbabwe"], email: "a@b.co", registration: "1", tin: "3", vatNumber: "2" } }));
    expect(t.startsWith("%PDF-")).toBe(true);
    expect(t).toContain("Zimbabwe");
  });
  it("is delivered as a PDF file with a sensible name", async () => {
    const blob = await buildReceiptPdf(base);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(2000);
    expect(receiptFileName(base)).toBe("FarmHelper-receipt-FH-AB12CD34.pdf");
  });
});
