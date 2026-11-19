import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PaymentRow } from "@/lib/billing";
import type { ReceiptInput } from "../../../supabase/functions/_shared/receipt";
import { emailLine, PaymentReceipt } from "./PaymentReceipt";

const data: ReceiptInput = { farm: "Ndizvo Homestead", planName: "Starter", interval: "month", amountUsd: 10, method: "demo:ecocash", reference: "DEMO-AB12CD34", paidAt: "2026-11-19T16:20:00.000Z", activeUntil: "2026-12-19T16:20:00.000Z" };
const pay = (over: Partial<PaymentRow> = {}): PaymentRow => ({ id: "p1", plan_code: "starter", billing_interval: "month", amount_usd: 10, method: "demo:ecocash", status: "paid", created_at: "2026-11-19T16:20:00.000Z", receipt_to: "owner@example.com", receipt_status: "demo", ...over });

describe("emailLine", () => {
  it("explains each outcome", () => {
    expect(emailLine(pay({ receipt_status: "sent" }))).toBe("A receipt was emailed to owner@example.com.");
    expect(emailLine(pay({ receipt_status: "demo" }))).toMatch(/simulated.*Recent messages/);
    expect(emailLine(pay({ receipt_status: "not_configured" }))).toMatch(/email isn’t set up/);
    expect(emailLine(pay({ receipt_status: "failed" }))).toMatch(/couldn’t email the receipt to owner@example.com/);
    expect(emailLine(pay({ receipt_status: "no_email", receipt_to: null }))).toMatch(/no email address/);
    expect(emailLine(pay({ receipt_status: null }))).toBe("Your receipt is being prepared.");
  });
});

describe("PaymentReceipt", () => {
  it("shows the transaction as successful with every detail", () => {
    render(<PaymentReceipt data={data} payment={pay()} onClose={() => {}} />);
    expect(screen.getByText("Payment successful")).toBeInTheDocument();
    for (const t of ["Starter (monthly)", "$10.00 USD", "EcoCash (demo)", "DEMO-AB12CD34", "19 Nov 2026", "19 Dec 2026"]) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByText(/Demo: no real money was taken/)).toBeInTheDocument();
    expect(screen.getByText(/receipt email to owner@example.com was simulated/)).toBeInTheDocument();
  });
  it("does not call a real payment a demo", () => {
    render(<PaymentReceipt data={{ ...data, method: "ecocash", reference: "FH-1" }} payment={pay({ method: "ecocash", receipt_status: "sent" })} onClose={() => {}} />);
    expect(screen.queryByText(/Demo: no real money/)).toBeNull();
    expect(screen.getByText("A receipt was emailed to owner@example.com.")).toBeInTheDocument();
  });
  it("closes with Done and offers the download", () => {
    const close = vi.fn();
    render(<PaymentReceipt data={data} payment={pay()} onClose={close} />);
    expect(screen.getByRole("button", { name: /Download receipt/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(close).toHaveBeenCalled();
  });
  it("renders nothing without a paid payment", () => {
    render(<PaymentReceipt data={null} payment={undefined} onClose={() => {}} />);
    expect(screen.queryByText("Payment successful")).toBeNull();
  });
});
