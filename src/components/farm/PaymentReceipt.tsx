import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/landing/logo.webp";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { PaymentRow } from "@/lib/billing";
import { buildReceiptPdf, logoForPdf, receiptFileName } from "@/lib/receiptPdf";
import { COMPANY, companyLines } from "../../../supabase/functions/_shared/company";
import { isDemoPayment, methodLabel, money, niceDate, niceDateTime, periodText, planDescription, type ReceiptInput } from "../../../supabase/functions/_shared/receipt";

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

async function savePdf(r: ReceiptInput) {
  const blob = await buildReceiptPdf(r, { logo: await logoForPdf(logo) });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = receiptFileName(r); document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The official receipt: shown right after a payment goes through, and from "Receipt" in the payment history. */
export function PaymentReceipt({ data, payment, onClose }: { data: ReceiptInput | null; payment: PaymentRow | undefined; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const open = !!data && !!payment;
  const download = async () => {
    if (!data) return;
    setBusy(true);
    try { await savePdf(data); } catch { toast.error("Couldn’t create the PDF. Please try again."); } finally { setBusy(false); }
  };
  const demo = !!data && isDemoPayment(data.method);
  const rows: [string, string][] = data ? [
    ["Receipt no.", data.reference],
    ["Date issued", niceDateTime(data.paidAt)],
    ["Paid with", `${methodLabel(data.method)}${demo ? " (demo)" : ""}`],
    ...(data.transactionRef ? ([["Transaction ref.", data.transactionRef]] as [string, string][]) : []),
  ] : [];
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-md grid-cols-[minmax(0,1fr)] gap-0 overflow-x-hidden overflow-y-auto p-0 [&>button]:text-white [&>button]:opacity-90">
        {data && payment && (
          <>
            <div className="border-b-4 border-accent bg-[#14532d] py-4 pl-5 pr-12 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white"><img src={logo} alt="" className="h-11 w-auto" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-lg font-bold leading-tight">{COMPANY.name}</div><div className="truncate text-xs text-green-200">{COMPANY.product}<span className="hidden sm:inline"> · {COMPANY.tagline}</span></div></div>
                <div className="text-right"><div className="text-[10px] tracking-[0.2em] text-green-200">OFFICIAL</div><div className="text-lg font-extrabold leading-none tracking-wide">RECEIPT</div></div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <DialogDescription className="sr-only">Your payment receipt</DialogDescription>
              {demo && <p role="note" className="rounded-xl border-2 border-dashed border-accent bg-amber-50 p-2 text-center text-xs text-amber-900"><b>DEMO RECEIPT</b> – no real money was taken. This is not a tax invoice.</p>}
              <div className="text-center">
                <span className="inline-block rounded-full bg-green-100 px-4 py-1 text-xs font-bold tracking-widest text-green-800">✓ PAID</span>
                <DialogTitle className="mt-2 text-3xl font-extrabold text-[#14532d]">{money(data.amountUsd)}</DialogTitle>
                <p className="text-sm text-muted-foreground">Payment successful. Thank you!</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="min-w-0"><div className="mb-1 text-[11px] font-bold tracking-widest text-muted-foreground">BILLED TO</div>
                  <div className="break-words font-semibold">{data.farm}</div>
                  {[data.billedToName, data.billedToEmail, data.farmLocation].filter(Boolean).map((l) => <div key={l} className="break-words text-muted-foreground">{l}</div>)}</div>
                <div className="min-w-0"><div className="mb-1 text-[11px] font-bold tracking-widest text-muted-foreground">RECEIPT DETAILS</div>
                  {rows.map(([k, v]) => <div key={k} className="mb-1"><div className="text-xs text-muted-foreground">{k}</div><div className="break-words font-medium">{v}</div></div>)}</div>
              </div>
              <div className="overflow-hidden rounded-xl border text-sm">
                <div className="flex justify-between bg-green-50 px-3 py-2 text-[11px] font-bold tracking-widest text-[#14532d]"><span>DESCRIPTION</span><span>AMOUNT</span></div>
                <div className="flex justify-between gap-3 px-3 py-3"><div className="min-w-0"><div className="font-semibold">{planDescription(data)}</div><div className="text-xs text-muted-foreground">Period covered: {periodText(data)}</div></div><div className="shrink-0 font-medium">{money(data.amountUsd)}</div></div>
                <div className="space-y-1 border-t px-3 py-2">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(data.amountUsd)}</span></div>
                  <div className="flex justify-between text-base font-extrabold text-[#14532d]"><span>Total paid</span><span>{money(data.amountUsd)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Balance due</span><span>{money(0)}</span></div>
                </div>
              </div>
              <p className="rounded-xl border bg-muted/40 p-3 text-sm"><b>Your plan is active until {niceDate(data.activeUntil)}.</b> It doesn’t renew automatically: renew it from Plan &amp; billing before it ends.</p>
              <p className="text-sm text-muted-foreground">{emailLine(payment)}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="h-12 flex-1" disabled={busy} onClick={download}>{busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}Download PDF receipt</Button>
                <Button className="h-12 flex-1" onClick={onClose}>Done</Button>
              </div>
              <div className="border-t pt-3 text-center text-xs text-muted-foreground">{companyLines().map((l) => <div key={l}>{l}</div>)}<div className="mt-1 text-[11px]">This is a computer-generated receipt and does not need a signature.</div></div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
