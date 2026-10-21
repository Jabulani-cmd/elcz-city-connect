import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "./supabaseClient";
import { authMode } from "./auth";
import { setReadOnly } from "./permissions";
import { useFarm } from "./store";

/** One subscription per farm, kept on the server. The trial starts when the farm is first saved to the cloud. */
export type Sub = { farm_id: string; plan_code: string | null; billing_interval: "month" | "year" | null; trial_ends_at: string; paid_until: string | null };
export type Plan = { code: string; name: string; monthly_usd: number; yearly_usd: number; max_members: number | null; description: string; sort: number };
export type PaymentRow = { id: string; plan_code: string; billing_interval: "month" | "year"; amount_usd: number; method: string | null; status: "pending" | "paid" | "failed" | "cancelled"; created_at: string };
export type BillingStatus = "unknown" | "trial" | "active" | "expired";
export type Billing = { status: BillingStatus; daysLeft: number; endsAt: Date | null; plan: string | null };

/** Shown until the server's list arrives (and when offline). The server's prices always win at payment time. */
export const FALLBACK_PLANS: Plan[] = [
  { code: "starter", name: "Starter", monthly_usd: 10, yearly_usd: 100, max_members: 2, description: "Up to 2 people on your farm", sort: 1 },
  { code: "standard", name: "Standard", monthly_usd: 25, yearly_usd: 250, max_members: 10, description: "Up to 10 people on your farm", sort: 2 },
  { code: "pro", name: "Pro", monthly_usd: 50, yearly_usd: 500, max_members: null, description: "Unlimited people on your farm", sort: 3 },
];

const DAY = 86_400_000;
export function computeBilling(sub: Sub | null, now = Date.now()): Billing {
  if (!sub) return { status: "unknown", daysLeft: 0, endsAt: null, plan: null };
  const paid = sub.paid_until ? Date.parse(sub.paid_until) : 0;
  const trial = Date.parse(sub.trial_ends_at);
  if (paid > now) return { status: "active", daysLeft: Math.ceil((paid - now) / DAY), endsAt: new Date(paid), plan: sub.plan_code };
  if (trial > now) return { status: "trial", daysLeft: Math.ceil((trial - now) / DAY), endsAt: new Date(trial), plan: null };
  return { status: "expired", daysLeft: 0, endsAt: new Date(Math.max(paid, trial)), plan: sub.plan_code };
}

type State = { farmId: string; sub: Sub | null; plans: Plan[]; payments: PaymentRow[]; tick: number };
let state: State = { farmId: "", sub: null, plans: FALLBACK_PLANS, payments: [], tick: 0 };
const subs = new Set<() => void>();
const set = (s: Partial<State>) => { state = { ...state, ...s, tick: state.tick + 1 }; subs.forEach((f) => f()); };
const cacheKey = (farmId: string) => `farmhelper.sub.${farmId}`;
const readCache = (farmId: string): Sub | null => { try { return JSON.parse(localStorage.getItem(cacheKey(farmId)) ?? "null"); } catch { return null; } };

/** Reload the farm's subscription, the plan list and (for the owner) the payment history. Falls back to what was saved on this device when offline. */
export async function refreshBilling(farmId: string): Promise<void> {
  if (authMode !== "cloud" || !supabase || !farmId) return;
  if (state.farmId !== farmId) set({ farmId, sub: readCache(farmId), payments: [] });
  try {
    const [s, p, pay] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("farm_id", farmId).maybeSingle(),
      supabase.from("plans").select("*").order("sort"),
      supabase.from("payments").select("id, plan_code, billing_interval, amount_usd, method, status, created_at").eq("farm_id", farmId).order("created_at", { ascending: false }).limit(20),
    ]);
    if (s.error) return;
    const sub = (s.data as Sub | null) ?? null;
    try { if (sub) localStorage.setItem(cacheKey(farmId), JSON.stringify(sub)); } catch { /* ignore */ }
    set({ farmId, sub, plans: p.data?.length ? (p.data as Plan[]).map((x) => ({ ...x, monthly_usd: Number(x.monthly_usd), yearly_usd: Number(x.yearly_usd) })) : state.plans, payments: (pay.data as PaymentRow[] | null)?.map((x) => ({ ...x, amount_usd: Number(x.amount_usd) })) ?? [] });
  } catch { /* offline: keep the saved copy */ }
}

export function useBilling() {
  useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state.tick);
  const farm = useFarm();
  const mine = state.farmId === farm?.id ? state.sub : null;
  const billing = authMode === "cloud" ? computeBilling(mine) : computeBilling(null);
  return { ...billing, plans: state.plans, payments: state.payments, sub: mine, farmId: farm?.id ?? "" };
}

/** Keeps the subscription fresh for the open farm and switches the app to read-only once it has lapsed. Mount once, inside the signed-in app. */
export function useBillingSync() {
  const farm = useFarm();
  const { status } = useBilling();
  const farmId = farm?.id ?? "";
  useEffect(() => {
    if (authMode !== "cloud" || !farmId) return;
    void refreshBilling(farmId);
    const again = () => { if (navigator.onLine) void refreshBilling(farmId); };
    const t = setInterval(again, 10 * 60 * 1000);
    window.addEventListener("online", again);
    const vis = () => { if (document.visibilityState === "visible") again(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); window.removeEventListener("online", again); document.removeEventListener("visibilitychange", vis); };
  }, [farmId]);
  // a brand-new farm reaches the server (and gets its trial) a moment after it is created: keep asking until it shows up
  useEffect(() => {
    if (authMode !== "cloud" || !farmId || status !== "unknown") return;
    let tries = 0;
    const t = setInterval(() => { if (++tries > 15) clearInterval(t); else if (navigator.onLine) void refreshBilling(farmId); }, 4000);
    return () => clearInterval(t);
  }, [farmId, status]);
  useEffect(() => { setReadOnly(status === "expired"); return () => setReadOnly(false); }, [status]);
}

export type CheckoutInput = { farmId: string; plan: string; interval: "month" | "year"; method: "ecocash" | "onemoney" | "innbucks" | "web"; phone?: string };
export type CheckoutResult = { payment_id: string; redirect: string | null; instructions: string | null; innbucks_code: string | null };

/** Ask the server to open a Paynow payment. Errors carry a plain-language message. */
export async function startCheckout(i: CheckoutInput): Promise<CheckoutResult> {
  if (!supabase) throw new Error("Payments need an online account.");
  const { data, error } = await supabase.functions.invoke("paynow", { body: { action: "checkout", farm_id: i.farmId, plan: i.plan, interval: i.interval, method: i.method, phone: i.phone, return_url: `${location.origin}/billing` } });
  if (error) throw new Error(await reason(error));
  return data as CheckoutResult;
}

export async function checkPayment(paymentId: string): Promise<"pending" | "paid" | "failed" | "cancelled"> {
  if (!supabase) return "pending";
  const { data, error } = await supabase.functions.invoke("paynow", { body: { action: "status", payment_id: paymentId } });
  if (error) throw new Error(await reason(error));
  const s = (data as { status: string }).status;
  if (s === "paid") await refreshBilling(state.farmId);
  return s === "paid" || s === "failed" || s === "cancelled" ? s : "pending";
}

/** Is online payment switched on, and is it the no-money demo? Falls back to "on, real" if the server can't be asked. */
export async function paymentsConfig(): Promise<{ demo: boolean; configured: boolean }> {
  if (!supabase) return { demo: false, configured: false };
  try {
    const { data, error } = await supabase.functions.invoke("paynow", { body: { action: "config" } });
    if (error) return { demo: false, configured: true };
    return data as { demo: boolean; configured: boolean };
  } catch { return { demo: false, configured: true }; }
}

/** Demo mode only: end the trial now, or start a fresh 7 days, so the whole story can be shown. */
export async function demoSetTrial(farmId: string, state: "expire" | "trial"): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("paynow", { body: { action: "demo", farm_id: farmId, state } });
  if (error) throw new Error(await reason(error));
  await refreshBilling(farmId);
}

async function reason(e: unknown): Promise<string> {
  const ctx = (e as { context?: Response }).context;
  try { const j = await ctx?.json(); if (j?.error) return String(j.error); } catch { /* fall through */ }
  return navigator.onLine ? "Couldn’t reach the payment service. Please try again." : "You’re offline. Connect to the internet to pay.";
}
