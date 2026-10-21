import { Check, CreditCard, Loader2, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Empty, PageHeader, Panel } from "@/components/farm/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { authMode } from "@/lib/auth";
import { checkPayment, demoSetTrial, paymentsConfig, refreshBilling, startCheckout, useBilling, type CheckoutInput, type Plan } from "@/lib/billing";
import { useUser } from "@/lib/store";

const METHODS: { id: CheckoutInput["method"]; label: string; hint: string; phone?: boolean }[] = [
  { id: "ecocash", label: "EcoCash", hint: "Approve on your phone", phone: true },
  { id: "onemoney", label: "OneMoney", hint: "Approve on your phone", phone: true },
  { id: "innbucks", label: "InnBucks", hint: "Pay with a code" },
  { id: "web", label: "Card, ZimSwitch or other", hint: "Opens the secure Paynow page" },
];
const usd = (n: number) => `$${n % 1 ? n.toFixed(2) : n}`;
const dateText = (d: Date | null) => (d ? d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "");

type Waiting = { id: string; text: string; code: string | null };

export default function Billing() {
  const { status, daysLeft, endsAt, plan, plans, payments, farmId } = useBilling();
  const owner = useUser().role === "Owner";
  const [interval, setInterval_] = useState<"month" | "year">("month");
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [method, setMethod] = useState<CheckoutInput["method"]>("ecocash");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const [params, setParams] = useSearchParams();
  const polling = useRef(false);
  const [cfg, setCfg] = useState<{ demo: boolean; configured: boolean } | null>(null);
  useEffect(() => { void paymentsConfig().then(setCfg); }, []);

  useEffect(() => { if (farmId) void refreshBilling(farmId); }, [farmId]);

  /** Ask Paynow every few seconds until the payment is paid, refused or 3 minutes pass. */
  const watch = async (id: string, text: string, code: string | null) => {
    if (polling.current) return;
    polling.current = true;
    setWaiting({ id, text, code });
    try {
      for (let i = 0; i < 45; i++) {
        const s = await checkPayment(id).catch(() => "pending" as const);
        if (s === "paid") { toast.success("Payment received. Thank you!"); setWaiting(null); setChosen(null); return; }
        if (s === "failed" || s === "cancelled") { toast.error(s === "cancelled" ? "The payment was cancelled." : "The payment didn’t go through."); setWaiting(null); return; }
        await new Promise((r) => setTimeout(r, 4000));
      }
      toast.message("Still waiting for the payment. If you approved it, it will show here shortly.");
      setWaiting(null);
    } finally { polling.current = false; void refreshBilling(farmId); }
  };

  // coming back from the Paynow page
  const returned = params.get("payment");
  useEffect(() => {
    if (!returned || !farmId) return;
    params.delete("payment"); setParams(params, { replace: true });
    void watch(returned, "Checking your payment…", null);
  }, [returned, farmId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authMode !== "cloud") return <Navigate to="/" replace />;

  const pay = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      const r = await startCheckout({ farmId, plan: chosen.code, interval, method, phone });
      if (r.redirect) { location.href = r.redirect; return; }
      void watch(r.payment_id, r.instructions ?? "Approve the payment on your phone.", r.innbucks_code);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn’t start the payment"); }
    finally { setBusy(false); }
  };

  const statusLine = status === "trial" ? `Free trial: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left (ends ${dateText(endsAt)})`
    : status === "active" ? `${plans.find((p) => p.code === plan)?.name ?? "Plan"} plan is active until ${dateText(endsAt)}`
    : status === "expired" ? "Your trial has ended: records are read-only until you choose a plan"
    : "Loading…";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Plan & billing" description="One plan covers the whole farm and everyone on it." />
      {cfg?.demo && (
        <div role="note" className="mb-4 rounded-2xl border-2 border-dashed border-warning bg-warning/10 p-4 text-sm">
          <b>Demo mode: no real money is taken.</b> Payments are pretend so you can see how everything works. For EcoCash or OneMoney use <b>0771234567</b> (succeeds after a few seconds), <b>0773333333</b> (cancelled) or <b>0774444444</b> (not enough money).
          {owner && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => demoSetTrial(farmId, "expire").then(() => toast.success("Trial ended. Records are now read-only.")).catch((e) => toast.error(e.message))}>Demo: end the trial now</Button>
              <Button size="sm" variant="outline" onClick={() => demoSetTrial(farmId, "trial").then(() => toast.success("Fresh 7-day trial started.")).catch((e) => toast.error(e.message))}>Demo: restart the 7-day trial</Button>
            </div>
          )}
        </div>
      )}
      {cfg && !cfg.configured && <div role="note" className="mb-4 rounded-2xl border border-warning/50 bg-warning/10 p-4 text-sm"><b>Online payments are not switched on yet.</b> You can look at the plans, but paying opens once the payment account is connected.</div>}
      <div className={`mb-5 rounded-2xl border p-4 text-sm font-medium ${status === "expired" ? "border-danger/40 bg-danger/10" : "bg-card"}`}>{statusLine}</div>

      {!owner && <Empty>Only the farm owner can choose or pay for a plan. Ask them to open Plan &amp; billing.</Empty>}

      {owner && (
        <>
          <div className="mb-4 inline-flex rounded-full border bg-card p-1 text-sm" role="group" aria-label="Billing period">
            {(["month", "year"] as const).map((i) => (
              <button key={i} onClick={() => setInterval_(i)} aria-pressed={interval === i} className={`min-h-[40px] rounded-full px-4 font-medium ${interval === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{i === "month" ? "Monthly" : "Yearly · 2 months free"}</button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => {
              const price = interval === "year" ? p.yearly_usd : p.monthly_usd;
              const current = status === "active" && plan === p.code;
              return (
                <div key={p.code} className={`flex flex-col rounded-2xl border bg-card p-5 shadow-sm ${p.code === "standard" ? "ring-2 ring-primary" : ""}`}>
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <div className="mt-2"><span className="text-3xl font-extrabold">{usd(price)}</span><span className="text-sm text-muted-foreground"> / {interval === "year" ? "year" : "month"}</span></div>
                  <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p.description}</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Crops, livestock, finance and reports</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Works offline, syncs on every device</li>
                  </ul>
                  <Button size="lg" className="mt-4 h-12" variant={p.code === "standard" ? "default" : "outline"} onClick={() => { setChosen(p); setMethod("ecocash"); }}>{current ? "Renew" : `Choose ${p.name}`}</Button>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Prices are in US dollars. Pay online with EcoCash, OneMoney, InnBucks, Visa/Mastercard or ZimSwitch through Paynow.</p>

          <div className="mt-6">
            <Panel title="Payment history">
              {payments.length === 0 ? <Empty>No payments yet.</Empty> : (
                <ul className="divide-y text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span><b className="capitalize">{p.plan_code}</b> · {p.billing_interval === "year" ? "yearly" : "monthly"}{p.method?.startsWith("demo") ? " · demo" : ""}<br /><span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span></span>
                      <span className="text-right"><b>{usd(p.amount_usd)}</b><br /><span className={`text-xs font-medium capitalize ${p.status === "paid" ? "text-success" : p.status === "pending" ? "text-muted-foreground" : "text-danger"}`}>{p.status}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      <Dialog open={!!chosen} onOpenChange={(o) => { if (!o && !busy && !waiting) setChosen(null); }}>
        <DialogContent className="max-w-md">
          {waiting ? (
            <>
              <DialogHeader><DialogTitle>Waiting for your payment</DialogTitle><DialogDescription>Keep this page open.</DialogDescription></DialogHeader>
              <div className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm"><Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" /><div>{waiting.text}{waiting.code && <div className="mt-2 text-2xl font-bold tracking-widest">{waiting.code}</div>}</div></div>
            </>
          ) : chosen && (
            <>
              <DialogHeader>
                <DialogTitle>Pay for {chosen.name}</DialogTitle>
                <DialogDescription>{usd(interval === "year" ? chosen.yearly_usd : chosen.monthly_usd)} {interval === "year" ? "for one year" : "for one month"}. Choose how to pay.{cfg?.demo && <b className="mt-1 block text-warning">Demo: no real money is taken.</b>}</DialogDescription>
              </DialogHeader>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as CheckoutInput["method"])} className="gap-2">
                {METHODS.map((m) => (
                  <Label key={m.id} htmlFor={`m-${m.id}`} className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border p-3 ${method === m.id ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem id={`m-${m.id}`} value={m.id} />
                    {m.id === "web" ? <CreditCard className="h-5 w-5 text-primary" /> : <Smartphone className="h-5 w-5 text-primary" />}
                    <span><span className="block font-semibold">{m.label}</span><span className="block text-xs font-normal text-muted-foreground">{m.hint}</span></span>
                  </Label>
                ))}
              </RadioGroup>
              {METHODS.find((m) => m.id === method)?.phone && (
                <div><Label htmlFor="pay-phone" className="mb-1.5 block">Mobile number to pay from</Label><Input id="pay-phone" className="h-12 text-base" inputMode="tel" autoComplete="tel" placeholder="0771 234 567" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              )}
              <Button size="lg" className="h-14 text-base" disabled={busy || cfg?.configured === false} onClick={pay}>{busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}Pay {usd(interval === "year" ? chosen.yearly_usd : chosen.monthly_usd)}</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
