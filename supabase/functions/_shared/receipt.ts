// Receipt text for subscription payments. Plain TypeScript with no Deno or npm imports, so the unit tests can run it.

export type ReceiptInput = {
  farm: string;
  planName: string;
  interval: "month" | "year";
  amountUsd: number;
  method: string | null; // e.g. "ecocash", "demo:ecocash", "web"
  reference: string;
  paidAt: string; // ISO timestamp
  activeUntil: string | null; // ISO timestamp
};

const METHODS: Record<string, string> = { ecocash: "EcoCash", onemoney: "OneMoney", innbucks: "InnBucks", web: "Card / ZimSwitch (Paynow)" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const isDemoPayment = (method: string | null) => !!method && method.startsWith("demo");
export const methodLabel = (method: string | null) => METHODS[(method ?? "").replace(/^demo:/, "")] ?? "Online payment";
export const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)} USD`;
/** "19 Nov 2026" – built from the date text so the time zone can never shift the day (times are UTC). */
export const niceDate = (iso: string | null) => { if (!iso) return "–"; const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

export function receiptSubject(r: Pick<ReceiptInput, "reference" | "method">) {
  return `${isDemoPayment(r.method) ? "[DEMO] " : ""}Your FarmHelper receipt – ${r.reference}`;
}

export function receiptText(r: ReceiptInput): string {
  const demo = isDemoPayment(r.method);
  return [
    demo ? "DEMO RECEIPT – no real money was taken." : "",
    "FarmHelper receipt",
    "",
    `Farm: ${r.farm}`,
    `Plan: ${r.planName} (${r.interval === "year" ? "yearly" : "monthly"})`,
    `Amount paid: ${money(r.amountUsd)}`,
    `Paid with: ${methodLabel(r.method)}${demo ? " (demo)" : ""}`,
    `Reference: ${r.reference}`,
    `Date: ${niceDate(r.paidAt)}`,
    `Plan active until: ${niceDate(r.activeUntil)}`,
    "",
    "Thank you for using FarmHelper.",
  ].filter((l, i, a) => l !== "" || (i > 0 && a[i - 1] !== "")).join("\n");
}
