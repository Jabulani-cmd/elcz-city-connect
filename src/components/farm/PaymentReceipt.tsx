import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PaymentRow } from "@/lib/billing";
import { isDemoPayment, methodLabel, money, niceDate, receiptText, type ReceiptInput } from "../../../supabase/functions/_shared/receipt";

/** What happened to the receipt email, in words the payer can act on. */
export function emailLine(p: Pick<PaymentRow, "receipt_status" | "receipt_to">): string {
  switch (p.receipt_status) {
    case "sent": return `A receipt was emailed to ${p.receipt_to}.`;
    case "demo": return `Demo: a receipt email to ${p.receipt_to} was simulated, because no email account is connected yet. You can see it under Notifications → Recent messages.`;
    case "not_configured": return "We couldn’t email the receipt because email isn’t set up yet. Download it below.";
    case "failed": return `We couldn’t email the receipt to ${p.receipt_to}. Download it below.`;
    case "no_email": return "There is no email address on your account, so no receipt was emailed. Download it below.";
    default: return "Your receipt is being prepared.";
  }
}

function downloadReceipt(r: ReceiptInput) {
  const url = URL.createObjectURL(new Blob(["﻿" + receiptText(r)], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = `receipt-${r.reference}.txt`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Shown right after a payment goes through (and from "Receipt" in the payment history). */
export function PaymentReceipt({ data, payment, onClose }: { data: ReceiptInput | null; payment: PaymentRow | undefined; onClose: () => void }) {
  const open = !!data && !!payment;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        {data && payment && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-success/10"><CheckCircle2 className="h-9 w-9 text-success" aria-hidden /></div>
              <DialogTitle className="text-center">Payment successful</DialogTitle>
              <DialogDescription className="text-center">Thank you! Your plan is active.</DialogDescription>
            </DialogHeader>
            {isDemoPayment(data.method) && <p role="note" className="rounded-xl border border-dashed border-warning bg-warning/10 p-2 text-center text-xs font-medium">Demo: no real money was taken.</p>}
            <dl className="divide-y rounded-xl border text-sm">
              {([
                ["Plan", `${data.planName} (${data.interval === "year" ? "yearly" : "monthly"})`],
                ["Amount paid", money(data.amountUsd)],
                ["Paid with", `${methodLabel(data.method)}${isDemoPayment(data.method) ? " (demo)" : ""}`],
                ["Reference", data.reference],
                ["Date", niceDate(data.paidAt)],
                ["Plan active until", niceDate(data.activeUntil)],
              ] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">{emailLine(payment)}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 flex-1" onClick={() => downloadReceipt(data)}><Download className="mr-1.5 h-4 w-4" />Download receipt</Button>
              <Button className="h-12 flex-1" onClick={onClose}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
