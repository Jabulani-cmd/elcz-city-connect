// Receipt content for subscription payments: the facts, the plain-text version, and formatting helpers.
// Plain TypeScript with no Deno or npm imports, so the unit tests, the app and the edge functions can all use it.
import { COMPANY, companyLines, type Company } from "./company.ts";

export type ReceiptInput = {
  farm: string;
  planName: string;
  interval: "month" | "year";
  amountUsd: number;
  method: string | null; // e.g. "ecocash", "demo:ecocash", "web"
  reference: string; // also the receipt number
  paidAt: string; // ISO timestamp
  activeUntil: string | null; // ISO timestamp
  /** Optional extras – shown when known. */
  billedToName?: string;
  billedToEmail?: string;
  farmLocation?: string;
  transactionRef?: string | null; // the payment provider's own reference
};

const METHODS: Record<string, string> = { ecocash: "EcoCash", onemoney: "OneMoney", innbucks: "InnBucks", web: "Card / ZimSwitch (Paynow)" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const isDemoPayment = (method: string | null) => !!method && method.startsWith("demo");
export const methodLabel = (method: string | null) => METHODS[(method ?? "").replace(/^demo:/, "")] ?? "Online payment";
export const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)} USD`;
/** "19 Nov 2026" – built from the date text so the time zone can never shift the day (times are UTC). */
export const niceDate = (iso: string | null) => { if (!iso) return "–"; const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
/** "19 Nov 2026, 16:20 UTC" */
export const niceDateTime = (iso: string | null) => (iso && iso.length >= 16 ? `${niceDate(iso)}, ${iso.slice(11, 16)} UTC` : niceDate(iso));
export const planDescription = (r: Pick<ReceiptInput, "planName" | "interval">, c: Company = COMPANY) =>
  `${c.product} ${r.planName} plan – ${r.interval === "year" ? "yearly" : "monthly"} subscription`;
export const periodText = (r: Pick<ReceiptInput, "paidAt" | "activeUntil">) => `${niceDate(r.paidAt)} to ${niceDate(r.activeUntil)}`;

export function receiptSubject(r: Pick<ReceiptInput, "reference" | "method">) {
  return `${isDemoPayment(r.method) ? "[DEMO] " : ""}Your FarmHelper receipt – ${r.reference}`;
}

/** Plain-text version (the part shown by mail programs that don't show HTML, and kept in the message log). */
export function receiptText(r: ReceiptInput, c: Company = COMPANY): string {
  const demo = isDemoPayment(r.method);
  const lines = [
    demo ? "DEMO RECEIPT – no real money was taken. This is not a tax invoice." : "",
    "",
    `${c.name.toUpperCase()} – OFFICIAL RECEIPT`,
    ...companyLines(c),
    "",
    `Receipt no: ${r.reference}`,
    `Date issued: ${niceDateTime(r.paidAt)}`,
    "",
    "BILLED TO",
    r.farm,
    r.billedToName ?? "",
    r.billedToEmail ?? "",
    r.farmLocation ?? "",
    "",
    "DETAILS",
    `${planDescription(r, c)}`,
    `Period covered: ${periodText(r)}`,
    `Amount paid: ${money(r.amountUsd)}`,
    `Paid with: ${methodLabel(r.method)}${demo ? " (demo)" : ""}`,
    r.transactionRef ? `Transaction reference: ${r.transactionRef}` : "",
    `Status: PAID`,
    "",
    "Thank you for using FarmHelper.",
    "This is a computer-generated receipt and does not need a signature.",
  ];
  return lines.filter((l, i, a) => l !== "" || (i > 0 && a[i - 1] !== "")).join("\n").trim();
}
