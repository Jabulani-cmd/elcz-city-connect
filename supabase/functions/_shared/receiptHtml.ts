// The emailed receipt: a professional, table-based HTML page with inline styles (the only kind mail programs reliably show).
// Plain TypeScript with no Deno or npm imports. Everything that came from a person (farm name, email…) is escaped.
import { COMPANY, companyLines, type Company } from "./company.ts";
import { isDemoPayment, methodLabel, money, niceDate, niceDateTime, periodText, planDescription, type ReceiptInput } from "./receipt.ts";

export const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function receiptHtml(r: ReceiptInput, c: Company = COMPANY): string {
  const demo = isDemoPayment(r.method);
  const billed = [r.farm, r.billedToName, r.billedToEmail, r.farmLocation].filter(Boolean).map((l, i) => (i === 0 ? `<strong style="font-size:15px;color:#111827">${esc(l)}</strong>` : esc(l)));
  const details: [string, string][] = [
    ["Receipt no.", r.reference],
    ["Date issued", niceDateTime(r.paidAt)],
    ["Paid with", `${methodLabel(r.method)}${demo ? " (demo)" : ""}`],
    ...(r.transactionRef ? ([["Transaction ref.", r.transactionRef]] as [string, string][]) : []),
  ];
  const row = (k: string, v: string) => `<tr><td style="padding:3px 0;color:#6b7280;font-size:13px">${esc(k)}</td><td style="padding:3px 0 3px 12px;text-align:right;font-size:13px;color:#111827;font-weight:600">${esc(v)}</td></tr>`;
  const from = companyLines(c).map((l) => esc(l)).join("<br>");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(`Receipt ${r.reference}`)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:${FONT};color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">

  <tr><td style="background:${c.brandDark};padding:22px 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="68" valign="middle"><img src="${esc(c.logoUrl)}" width="60" height="60" alt="${esc(c.name)}" style="display:block;border-radius:12px;background:#ffffff"></td>
      <td valign="middle" style="padding-left:14px"><div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:.2px">${esc(c.name)}</div><div style="font-size:12px;color:#bbf7d0;margin-top:2px">${esc(c.product)} · ${esc(c.tagline)}</div></td>
      <td valign="middle" align="right"><div style="font-size:11px;letter-spacing:2px;color:#bbf7d0">OFFICIAL</div><div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:1px">RECEIPT</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:${c.accent};height:4px;line-height:4px;font-size:4px">&nbsp;</td></tr>

  ${demo ? `<tr><td style="padding:14px 28px 0"><div style="border:2px dashed ${c.accent};background:#fffbeb;border-radius:10px;padding:10px 14px;font-size:13px;color:#92400e;text-align:center"><strong>DEMO RECEIPT</strong> – no real money was taken. This is not a tax invoice.</div></td></tr>` : ""}

  <tr><td style="padding:24px 28px 8px;text-align:center">
    <span style="display:inline-block;background:#dcfce7;color:#166534;font-size:12px;font-weight:700;letter-spacing:2px;padding:5px 16px;border-radius:999px">&#10003; PAID</span>
    <div style="font-size:34px;font-weight:800;color:${c.brandDark};margin-top:10px">${esc(money(r.amountUsd))}</div>
    <div style="font-size:13px;color:#6b7280;margin-top:2px">Thank you for your payment</div>
  </td></tr>

  <tr><td style="padding:16px 28px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="50%" valign="top" style="padding-right:12px">
        <div style="font-size:11px;letter-spacing:1.5px;color:#6b7280;font-weight:700;margin-bottom:6px">BILLED TO</div>
        <div style="font-size:13px;line-height:1.6;color:#374151">${billed.join("<br>")}</div>
      </td>
      <td width="50%" valign="top" style="padding-left:12px">
        <div style="font-size:11px;letter-spacing:1.5px;color:#6b7280;font-weight:700;margin-bottom:6px">RECEIPT DETAILS</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${details.map(([k, v]) => row(k, v)).join("")}</table>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:22px 28px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr style="background:#f0fdf4">
        <th align="left" style="padding:10px 12px;font-size:11px;letter-spacing:1px;color:${c.brandDark};border-bottom:2px solid ${c.brand}">DESCRIPTION</th>
        <th align="center" style="padding:10px 8px;font-size:11px;letter-spacing:1px;color:${c.brandDark};border-bottom:2px solid ${c.brand}">QTY</th>
        <th align="right" style="padding:10px 12px;font-size:11px;letter-spacing:1px;color:${c.brandDark};border-bottom:2px solid ${c.brand}">AMOUNT</th>
      </tr>
      <tr>
        <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827"><strong>${esc(planDescription(r, c))}</strong><div style="font-size:12px;color:#6b7280;margin-top:3px">Period covered: ${esc(periodText(r))}</div></td>
        <td align="center" style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font-size:14px">1</td>
        <td align="right" style="padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;white-space:nowrap">${esc(money(r.amountUsd))}</td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
      <tr><td></td><td width="220"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("Subtotal", money(r.amountUsd))}
        <tr><td colspan="2" style="border-top:1px solid #e5e7eb;height:6px;line-height:6px;font-size:6px">&nbsp;</td></tr>
        <tr><td style="font-size:15px;font-weight:800;color:${c.brandDark}">Total paid</td><td style="text-align:right;font-size:15px;font-weight:800;color:${c.brandDark};padding-left:12px;white-space:nowrap">${esc(money(r.amountUsd))}</td></tr>
        ${row("Balance due", money(0))}
      </table></td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:24px 28px 0"><div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;font-size:13px;color:#374151;line-height:1.6">
    <strong>Your plan is active until ${esc(niceDate(r.activeUntil))}.</strong> Your records stay safe and synced on every device. This plan does not renew automatically: renew it from <em>Plan &amp; billing</em> in ${esc(c.product)} before it ends. You can download this receipt as a PDF there at any time.
  </div></td></tr>

  <tr><td style="padding:24px 28px 26px">
    <div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#6b7280;line-height:1.7;text-align:center">
      <strong style="color:#374151">${esc(c.legalName || c.name)}</strong><br>${from}<br>
      <span style="color:#9ca3af">This is a computer-generated receipt and does not need a signature.</span>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}
