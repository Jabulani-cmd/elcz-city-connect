import { describe, expect, it } from "vitest";
import { COMPANY, companyLines } from "../../supabase/functions/_shared/company";
import { isDemoPayment, methodLabel, money, niceDate, niceDateTime, periodText, planDescription, receiptSubject, receiptText, type ReceiptInput } from "../../supabase/functions/_shared/receipt";

const base: ReceiptInput = { farm: "Ndizvo Homestead", planName: "Starter", interval: "month", amountUsd: 10, method: "demo:ecocash", reference: "DEMO-AB12CD34", paidAt: "2026-11-19T16:20:00.000Z", activeUntil: "2026-12-19T16:20:00.000Z", billedToName: "Francis Moyo", billedToEmail: "owner@example.com", farmLocation: "Mashonaland East" };

describe("receipt text", () => {
  it("states every fact an official receipt needs", () => {
    const t = receiptText(base);
    for (const s of [
      "KURIMA DIGITAL – OFFICIAL RECEIPT", "Receipt no: DEMO-AB12CD34", "Date issued: 19 Nov 2026, 16:20 UTC", "BILLED TO", "Ndizvo Homestead", "Francis Moyo", "owner@example.com", "Mashonaland East",
      "FarmHelper Starter plan – monthly subscription", "Period covered: 19 Nov 2026 to 19 Dec 2026", "Amount paid: $10.00 USD", "Paid with: EcoCash (demo)", "Status: PAID", "does not need a signature",
    ]) expect(t, s).toContain(s);
  });
  it("is loudly marked as a demo when no real money moved", () => {
    expect(receiptText(base)).toMatch(/^DEMO RECEIPT – no real money was taken\. This is not a tax invoice\./);
    expect(receiptSubject(base)).toBe("[DEMO] Your FarmHelper receipt – DEMO-AB12CD34");
  });
  it("is a plain receipt for a real payment, with the provider's reference", () => {
    const real = { ...base, method: "ecocash", reference: "FH-1", interval: "year" as const, amountUsd: 100, transactionRef: "PN-123" };
    const t = receiptText(real);
    expect(t).not.toContain("DEMO");
    expect(t).toContain("FarmHelper Starter plan – yearly subscription");
    expect(t).toContain("Paid with: EcoCash\n");
    expect(t).toContain("Transaction reference: PN-123");
    expect(receiptSubject(real)).toBe("Your FarmHelper receipt – FH-1");
  });
  it("never prints placeholders for details that aren't known", () => {
    const t = receiptText({ ...base, billedToName: undefined, billedToEmail: undefined, farmLocation: undefined });
    expect(t).not.toMatch(/undefined|null/);
    expect(t).not.toMatch(/\n\n\n/);
  });
});

describe("seller details", () => {
  it("leaves out whatever isn't filled in", () => {
    const lines = companyLines(COMPANY);
    const all = lines.join("\n");
    expect(all).toContain("14601 Isiliwane Crescent, Selbourne Park");
    expect(all).toContain("Bulawayo, Zimbabwe");
    expect(all).toContain("+263 78 982 4741");
    expect(all).toContain("info@mavingtech.com");
    expect(all).toContain("www.mavingtech.com");
    expect(all).toContain("Company Reg No: 115409A0252026");
    expect(all).toContain("ZIMRA TIN: 2002517356");
    expect(all).not.toMatch(/VAT No/); // no VAT number yet, so none is printed
    expect(lines.every((l) => l.trim() !== "")).toBe(true);
  });
  it("is issued in the name of Kurima Digital, and doesn't name any other business", () => {
    expect(COMPANY.name).toBe("Kurima Digital");
    expect(COMPANY.legalName).toBe("Kurima Digital");
    expect(receiptText(base)).toContain("KURIMA DIGITAL – OFFICIAL RECEIPT");
    expect(receiptText(base)).not.toMatch(/MavingTech Business|Issued by/);
  });
  it("prints a VAT number once there is one, and leaves details off when they are empty", () => {
    expect(companyLines({ ...COMPANY, vatNumber: "456" }).join("\n")).toContain("VAT No: 456");
    const bare = companyLines({ ...COMPANY, addressLines: [], email: "", registration: "", tin: "", vatNumber: "" }).join("\n");
    expect(bare).not.toMatch(/Reg No|TIN|VAT|undefined/);
  });
});

describe("helpers", () => {
  it("labels payment methods and spots demo payments", () => {
    expect(methodLabel("demo:onemoney")).toBe("OneMoney");
    expect(methodLabel("web")).toMatch(/Card/);
    expect(methodLabel(null)).toBe("Online payment");
    expect(isDemoPayment("demo:web")).toBe(true);
    expect(isDemoPayment("web")).toBe(false);
    expect(isDemoPayment(null)).toBe(false);
  });
  it("formats money, dates and periods without time-zone surprises", () => {
    expect(money(10)).toBe("$10.00 USD");
    expect(money(24.999)).toBe("$25.00 USD");
    expect(niceDate("2026-12-31T23:59:00.000Z")).toBe("31 Dec 2026");
    expect(niceDate(null)).toBe("–");
    expect(niceDateTime("2026-11-19T16:20:00.000Z")).toBe("19 Nov 2026, 16:20 UTC");
    expect(periodText(base)).toBe("19 Nov 2026 to 19 Dec 2026");
    expect(planDescription({ planName: "Pro", interval: "year" })).toBe("FarmHelper Pro plan – yearly subscription");
  });
});
