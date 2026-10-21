// Supabase Edge Function: online subscription payments through Paynow (Zimbabwe: EcoCash, OneMoney, InnBucks,
// Visa/Mastercard, ZimSwitch). One function, three jobs, chosen by the request:
//   { action: "checkout", farm_id, plan, interval: "month"|"year", method: "ecocash"|"onemoney"|"innbucks"|"web", phone?, return_url }
//   { action: "status", payment_id }                       – asks Paynow whether a payment has gone through
//   a form POST from Paynow (no JSON)                      – Paynow's "result URL" webhook
// Secrets required:  PAYNOW_ID, PAYNOW_KEY      (Paynow dashboard → your integration)
// DEMO MODE:         PAYMENTS_MODE=demo          – no Paynow account needed and NO real money moves: payments are simulated so the whole
//                    app can be demonstrated. EcoCash/OneMoney numbers: ...3333333 = cancelled, ...4444444 = insufficient funds, any other = success
//                    after a few seconds. Remove the secret (or set it to anything else) before real customers use the app: in demo mode any
//                    farm owner can "pay" for free.
// Optional:          PAYNOW_AUTH_EMAIL           (Paynow in test mode only accepts the merchant's own email)
// Deploy without JWT verification (the webhook has none; user calls are checked below):  supabase functions deploy paynow --no-verify-jwt
// Paynow's result URL is then  https://<project>.supabase.co/functions/v1/paynow
// Money is never taken on trust from the browser: the price comes from the plans table, and a payment only counts after
// the function asks Paynow directly (using the poll URL it stored) and Paynow says "Paid" for at least the right amount.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const PAYNOW = "https://www.paynow.co.zw/interface";
const PAID = ["paid", "awaiting delivery", "delivered"];
const DEAD = ["cancelled", "refunded", "disputed"];

async function sha512(s: string) {
  const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Paynow replies with a url-encoded body. Its hash covers every value except "hash", in the order sent, plus the key. */
async function parseReply(text: string, key: string) {
  const entries = [...new URLSearchParams(text).entries()];
  const map: Record<string, string> = {};
  for (const [k, v] of entries) map[k.toLowerCase()] = v;
  const got = (map.hash ?? "").toUpperCase();
  const want = await sha512(entries.filter(([k]) => k.toLowerCase() !== "hash").map(([, v]) => v).join("") + key);
  return { map, valid: got !== "" && got === want };
}

async function post(url: string, fields: [string, string][], key: string) {
  const hash = await sha512(fields.map(([, v]) => v).join("") + key);
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams([...fields, ["hash", hash]]) });
  return parseReply(await res.text(), key);
}

type Payment = { id: string; reference: string; status: string; amount_usd: number; poll_url: string | null; created_at?: string };

/** Ask Paynow directly what happened to this payment and record the result. Safe to call repeatedly. */
async function settle(p: Payment, key: string, demo = false): Promise<string> {
  if (p.status !== "pending") return p.status;
  if (p.poll_url?.startsWith("demo:")) {
    // simulated payment: only ever settled while demo mode is on
    if (!demo) return "pending";
    const outcome = p.poll_url.slice(5);
    if (outcome === "cancelled" || outcome === "failed") {
      await admin.from("payments").update({ status: outcome }).eq("id", p.id).eq("status", "pending");
      return outcome;
    }
    if (Date.now() - Date.parse(p.created_at ?? "") < 5000) return "pending";
    await admin.from("payments").update({ paynow_reference: "DEMO" }).eq("id", p.id);
    const { error } = await admin.rpc("apply_payment", { ref: p.reference });
    if (error) throw new Error(error.message);
    return "paid";
  }
  if (!p.poll_url || new URL(p.poll_url).hostname !== "www.paynow.co.zw") return "pending";
  const { map, valid } = await post(p.poll_url, [], key);
  if (!valid) return "pending";
  const status = (map.status ?? "").toLowerCase();
  if (PAID.includes(status) && Number(map.amount) + 0.001 >= Number(p.amount_usd)) {
    await admin.from("payments").update({ paynow_reference: map.paynowreference ?? null }).eq("id", p.id);
    const { error } = await admin.rpc("apply_payment", { ref: p.reference });
    if (error) throw new Error(error.message);
    return "paid";
  }
  if (DEAD.includes(status)) {
    await admin.from("payments").update({ status: status === "cancelled" ? "cancelled" : "failed" }).eq("id", p.id).eq("status", "pending");
    return status === "cancelled" ? "cancelled" : "failed";
  }
  return "pending";
}

async function userFrom(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const id = Deno.env.get("PAYNOW_ID");
  const key = Deno.env.get("PAYNOW_KEY");
  const contentType = req.headers.get("content-type") ?? "";
  const demo = Deno.env.get("PAYMENTS_MODE") === "demo";

  try {
    // ---- Paynow's result URL (form post) -------------------------------------------------------------------------
    if (!contentType.includes("application/json")) {
      if (!key) return new Response("not configured", { status: 503 });
      if (demo) return new Response("ok");
      const body = new URLSearchParams(await req.text());
      const ref = body.get("reference");
      if (ref) {
        const { data: p } = await admin.from("payments").select("id, reference, status, amount_usd, poll_url").eq("reference", ref).maybeSingle();
        if (p) await settle(p as Payment, key, false); // the posted status is ignored; we ask Paynow ourselves
      }
      return new Response("ok");
    }

    const input = await req.json();
    const user = await userFrom(req);
    if (!user) return json({ error: "Please sign in again." }, 401);
    if (input.action === "config") return json({ demo, configured: demo || !!(id && key) });
    if (!demo && (!id || !key)) return json({ error: "Online payments are not switched on yet.", code: "not_configured" }, 503);

    // ---- demo helpers: let the owner show the trial ending and starting again ----------------------------------------
    if (input.action === "demo") {
      if (!demo) return json({ error: "Demo mode is off." }, 403);
      const farmId = String(input.farm_id ?? "");
      const { data: m } = await admin.from("farm_members").select("role").eq("farm_id", farmId).eq("user_id", user.id).maybeSingle();
      if (m?.role !== "owner") return json({ error: "Only the farm owner can do this." }, 403);
      const trial = input.state === "expire" ? new Date(Date.now() - 86_400_000) : new Date(Date.now() + 7 * 86_400_000);
      await admin.from("subscriptions").update({ trial_ends_at: trial.toISOString(), paid_until: null, plan_code: null, billing_interval: null, updated_at: new Date().toISOString() }).eq("farm_id", farmId);
      return json({ ok: true });
    }

    // ---- status ---------------------------------------------------------------------------------------------------
    if (input.action === "status") {
      const { data: p } = await admin.from("payments").select("id, farm_id, reference, status, amount_usd, poll_url, created_at").eq("id", String(input.payment_id)).maybeSingle();
      if (!p) return json({ error: "Payment not found." }, 404);
      const { data: m } = await admin.from("farm_members").select("role").eq("farm_id", p.farm_id).eq("user_id", user.id).maybeSingle();
      if (!m) return json({ error: "Payment not found." }, 404);
      return json({ status: await settle(p as Payment, key ?? "", demo) });
    }

    // ---- checkout -------------------------------------------------------------------------------------------------
    if (input.action === "checkout") {
      const farmId = String(input.farm_id ?? "");
      const interval = input.interval === "year" ? "year" : "month";
      const method = ["ecocash", "onemoney", "innbucks", "web"].includes(input.method) ? String(input.method) : "web";
      const phone = String(input.phone ?? "").replace(/[^\d]/g, "");
      const back = String(input.return_url ?? "");
      if (!/^https?:\/\//.test(back)) return json({ error: "Missing return address." }, 400);

      const { data: m } = await admin.from("farm_members").select("role").eq("farm_id", farmId).eq("user_id", user.id).maybeSingle();
      if (m?.role !== "owner") return json({ error: "Only the farm owner can pay for the plan." }, 403);
      const { data: plan } = await admin.from("plans").select("code, name, monthly_usd, yearly_usd").eq("code", String(input.plan)).maybeSingle();
      if (!plan) return json({ error: "Unknown plan." }, 400);
      if ((method === "ecocash" || method === "onemoney") && phone.length < 9) return json({ error: "Enter the mobile number to pay from." }, 400);

      if (demo) {
        const outcome = phone.endsWith("3333333") ? "cancelled" : phone.endsWith("4444444") ? "failed" : "ok";
        const ref = `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const amt = Number(interval === "year" ? plan.yearly_usd : plan.monthly_usd);
        const { data: d, error: de } = await admin.from("payments").insert({ farm_id: farmId, plan_code: plan.code, billing_interval: interval, amount_usd: amt, method: `demo:${method}`, reference: ref, poll_url: `demo:${outcome}`, created_by: user.id }).select("id").single();
        if (de || !d) throw new Error(de?.message ?? "Could not start the payment");
        return json({ demo: true, payment_id: d.id, redirect: method === "web" ? `${back}${back.includes("?") ? "&" : "?"}payment=${d.id}` : null, instructions: method === "web" ? null : method === "innbucks" ? "DEMO: pretend you are paying with this InnBucks code." : `DEMO: pretend ${phone} approved the payment on the phone. No money is taken.`, innbucks_code: method === "innbucks" ? "DEMO-1234" : null });
      }

      const amount = Number(interval === "year" ? plan.yearly_usd : plan.monthly_usd);
      const reference = `FH-${crypto.randomUUID().slice(0, 8).toUpperCase()}-${Date.now()}`;
      const { data: pay, error: insErr } = await admin.from("payments").insert({ farm_id: farmId, plan_code: plan.code, billing_interval: interval, amount_usd: amount, method, reference, created_by: user.id }).select("id").single();
      if (insErr || !pay) throw new Error(insErr?.message ?? "Could not start the payment");

      const fields: [string, string][] = [
        ["id", id], ["reference", reference], ["amount", amount.toFixed(2)],
        ["additionalinfo", `FarmHelper ${plan.name} (${interval === "year" ? "yearly" : "monthly"})`],
        ["returnurl", `${back}${back.includes("?") ? "&" : "?"}payment=${pay.id}`],
        ["resulturl", `${SB_URL}/functions/v1/paynow`],
        ["authemail", Deno.env.get("PAYNOW_AUTH_EMAIL") ?? user.email ?? ""],
      ];
      const mobile = method !== "web";
      if (mobile) fields.push(["phone", phone], ["method", method]);
      fields.push(["status", "Message"]);

      const { map, valid } = await post(`${PAYNOW}/${mobile ? "remotetransaction" : "initiatetransaction"}`, fields, key);
      if ((map.status ?? "").toLowerCase() !== "ok" || !valid) {
        await admin.from("payments").update({ status: "failed" }).eq("id", pay.id);
        return json({ error: map.error || "Paynow did not accept the payment. Please try again.", payment_id: pay.id }, 400);
      }
      await admin.from("payments").update({ poll_url: map.pollurl }).eq("id", pay.id);
      return json({ payment_id: pay.id, redirect: map.browserurl ?? null, instructions: map.instructions ?? null, innbucks_code: map.authorizationcode ?? null });
    }

    return json({ error: "Unknown request." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
