import { describe, expect, it } from "vitest";
import { isDemoPayment, methodLabel, money, niceDate, receiptSubject, receiptText, type ReceiptInput } from "../../supabase/functions/_shared/receipt";

const base: ReceiptInput = { farm: "Ndizvo Homestead", planName: "Starter", interval: "month", amountUsd: 10, method: "demo:ecocash", reference: "DEMO-AB12CD34", paidAt: "2026-11-19T16:20:00.000Z", activeUntil: "2026-12-19T16:20:00.000Z" };

describe("receipt", () => {
  it("states every fact the payer needs", () => {
    const t = receiptText(base);
    for (const s of ["Farm: Ndizvo Homestead", "Plan: Starter (monthly)", "Amount paid: $10.00 USD", "Reference: DEMO-AB12CD34", "Date: 19 Nov 2026", "Plan active until: 19 Dec 2026"]) expect(t).toContain(s);
  });
  it("is loudly marked as a demo when no real money moved", () => {
    expect(receiptText(base)).toMatch(/^DEMO RECEIPT – no real money was taken\./);
    expect(receiptText(base)).toContain("Paid with: EcoCash (demo)");
    expect(receiptSubject(base)).toBe("[DEMO] Your FarmHelper receipt – DEMO-AB12CD34");
  });
  it("is a plain receipt for a real payment", () => {
    const real = { ...base, method: "ecocash", reference: "FH-1", interval: "year" as const, amountUsd: 100 };
    const t = receiptText(real);
    expect(t).not.toContain("DEMO");
    expect(t).toContain("Plan: Starter (yearly)");
    expect(t).toContain("Paid with: EcoCash");
    expect(receiptSubject(real)).toBe("Your FarmHelper receipt – FH-1");
    expect(t.startsWith("FarmHelper receipt")).toBe(true);
  });
  it("labels payment methods and spots demo payments", () => {
    expect(methodLabel("demo:onemoney")).toBe("OneMoney");
    expect(methodLabel("web")).toMatch(/Card/);
    expect(methodLabel(null)).toBe("Online payment");
    expect(isDemoPayment("demo:web")).toBe(true);
    expect(isDemoPayment("web")).toBe(false);
    expect(isDemoPayment(null)).toBe(false);
  });
  it("formats money and dates without time-zone surprises", () => {
    expect(money(10)).toBe("$10.00 USD");
    expect(money(24.999)).toBe("$25.00 USD");
    expect(niceDate("2026-12-31T23:59:00.000Z")).toBe("31 Dec 2026");
    expect(niceDate(null)).toBe("–");
  });
});
