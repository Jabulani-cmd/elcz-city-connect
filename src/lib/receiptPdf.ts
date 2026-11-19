import { COMPANY, companyLines, type Company } from "../../supabase/functions/_shared/company";
import { isDemoPayment, methodLabel, money, niceDate, niceDateTime, periodText, planDescription, type ReceiptInput } from "../../supabase/functions/_shared/receipt";

/**
 * The official receipt as a PDF (A4): logo and seller details, receipt number, who it is billed to, the itemised charge, totals,
 * payment details and a PAID mark. Demo receipts also get a faint diagonal "DEMO" watermark and a banner. Built in the browser,
 * so it works offline. The PDF libraries are big, so they load only when someone actually downloads a receipt.
 */
const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

export async function buildReceiptPdfBytes(r: ReceiptInput, opts: { company?: Company; logo?: string } = {}): Promise<ArrayBuffer> {
  const c = opts.company ?? COMPANY;
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: `Receipt ${r.reference}`, subject: `${c.product} subscription receipt`, author: c.name });
  const demo = isDemoPayment(r.method);
  const W = 210, M = 15, R = W - M;
  const brand = rgb(c.brand), dark = rgb(c.brandDark), accent = rgb(c.accent);
  const gray: [number, number, number] = [107, 114, 128], ink: [number, number, number] = [17, 24, 39];

  // faint watermark first, so everything else is drawn over it
  if (demo) {
    doc.setTextColor(236, 238, 240);
    doc.setFont("helvetica", "bold"); doc.setFontSize(110);
    doc.text("DEMO", W / 2, 175, { align: "center", angle: 35 });
  }

  // header band
  doc.setFillColor(...dark); doc.rect(0, 0, W, 40, "F");
  doc.setFillColor(...accent); doc.rect(0, 40, W, 1.6, "F");
  doc.setFillColor(255, 255, 255); doc.roundedRect(M, 8, 24, 24, 3, 3, "F");
  if (opts.logo) { try { doc.addImage(opts.logo, opts.logo.startsWith("data:image/jpeg") ? "JPEG" : "PNG", M + 3.4, 9.6, 17.2, 21); } catch { /* the receipt is still valid without the logo */ } }
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text(c.name, M + 30, 19);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(187, 247, 208);
  doc.text(`${c.product}  ·  ${c.tagline}`, M + 30, 26);
  doc.setFontSize(8.5); doc.text("OFFICIAL", R, 15, { align: "right" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(23); doc.setTextColor(255, 255, 255);
  doc.text("RECEIPT", R, 26, { align: "right" });

  let y = 50;
  if (demo) {
    doc.setFillColor(255, 251, 235); doc.setDrawColor(...accent); doc.setLineWidth(0.5); doc.setLineDashPattern([1.6, 1.6], 0);
    doc.roundedRect(M, y, R - M, 10, 2, 2, "FD"); doc.setLineDashPattern([], 0);
    doc.setTextColor(146, 64, 14); doc.setFontSize(9.5);
    const lead = "DEMO RECEIPT", rest = "  -  no real money was taken. This is not a tax invoice.";
    doc.setFont("helvetica", "bold"); const w1 = doc.getTextWidth(lead);
    doc.setFont("helvetica", "normal"); const w2 = doc.getTextWidth(rest);
    const x0 = W / 2 - (w1 + w2) / 2;
    doc.setFont("helvetica", "bold"); doc.text(lead, x0, y + 6.3);
    doc.setFont("helvetica", "normal"); doc.text(rest, x0 + w1, y + 6.3);
    y += 16;
  }

  // PAID mark + amount
  y += 6;
  doc.setFillColor(220, 252, 231); doc.roundedRect(W / 2 - 14, y, 28, 8, 4, 4, "F");
  doc.setTextColor(22, 101, 52); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("PAID", W / 2, y + 5.5, { align: "center" });
  doc.setTextColor(...dark); doc.setFontSize(27); doc.text(money(r.amountUsd), W / 2, y + 19, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...gray); doc.text("Thank you for your payment", W / 2, y + 25, { align: "center" });
  y += 36;

  // billed to / receipt details
  const label = (t: string, x: number, yy: number) => { doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gray); doc.text(t, x, yy, { charSpace: 0.8 }); };
  label("BILLED TO", M, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...ink); doc.text(r.farm, M, y + 6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(55, 65, 81);
  [r.billedToName, r.billedToEmail, r.farmLocation].filter(Boolean).forEach((l, i) => doc.text(String(l), M, y + 12 + i * 5));

  label("RECEIPT DETAILS", 112, y);
  const details: [string, string][] = [
    ["Receipt no.", r.reference], ["Date issued", niceDateTime(r.paidAt)], ["Paid with", `${methodLabel(r.method)}${demo ? " (demo)" : ""}`],
    ...(r.transactionRef ? ([["Transaction ref.", r.transactionRef]] as [string, string][]) : []), ["Status", "PAID"],
  ];
  details.forEach(([k, v], i) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...gray); doc.text(k, 112, y + 6 + i * 5.4);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...ink); doc.text(v, R, y + 6 + i * 5.4, { align: "right" });
  });
  y += 12 + Math.max(details.length * 5.4, 24);

  // itemised charge
  const align = ["left", "center", "right", "right"] as const;
  autoTable(doc, {
    startY: y, margin: { left: M, right: M }, theme: "plain",
    head: [["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]],
    body: [
      [{ content: planDescription(r, c), styles: { fontStyle: "bold" } }, "1", money(r.amountUsd), money(r.amountUsd)],
      [{ content: `Period covered: ${periodText(r)}`, colSpan: 4, styles: { fontSize: 8.5, textColor: [...gray], cellPadding: { top: 0, bottom: 4, left: 3, right: 3 } } }],
    ],
    styles: { font: "helvetica", fontSize: 10, cellPadding: { top: 4, bottom: 2, left: 3, right: 3 }, textColor: [...ink] },
    headStyles: { fillColor: [240, 253, 244], textColor: [...dark], fontStyle: "bold", fontSize: 8, lineWidth: 0, cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 } },
    columnStyles: { 0: { cellWidth: 92 }, 1: { halign: "center", cellWidth: 16 }, 2: { halign: "right", cellWidth: 36 }, 3: { halign: "right", cellWidth: 36 } },
    didParseCell: (d) => { if (d.section === "head") d.cell.styles.halign = align[d.column.index]; },
    didDrawCell: (d) => {
      const bottom = d.cell.y + d.cell.height;
      if (d.section === "head" && d.column.index === 0) { doc.setDrawColor(...brand); doc.setLineWidth(0.6); doc.line(M, bottom, R, bottom); }
      if (d.section === "body" && d.row.index === 1) { doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.2); doc.line(M, bottom, R, bottom); }
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // totals
  const total = (k: string, v: string, yy: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(bold ? 12 : 10); doc.setTextColor(...(bold ? dark : gray));
    doc.text(k, 128, yy); doc.setTextColor(...(bold ? dark : ink)); doc.text(v, R, yy, { align: "right" });
  };
  total("Subtotal", money(r.amountUsd), y);
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.line(128, y + 3, R, y + 3);
  total("Total paid", money(r.amountUsd), y + 10, true);
  total("Balance due", money(0), y + 17);
  y += 28;

  // plan note
  doc.setFillColor(249, 250, 251); doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.roundedRect(M, y, R - M, 24, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...ink); doc.text(`Your plan is active until ${niceDate(r.activeUntil)}.`, M + 5, y + 7);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(55, 65, 81);
  doc.text(`Your records stay safe and synced on every device. This plan does not renew automatically: renew it from Plan & billing in ${c.product} before it ends. You can download this receipt again there at any time.`, M + 5, y + 13, { maxWidth: R - M - 10 });

  // footer: sits higher when there are many seller lines (address, registration…) so nothing runs off the page
  const lines = companyLines(c);
  const fy = Math.min(262, 291 - (11 + lines.length * 4.2 + 6));
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.line(M, fy, R, fy);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(55, 65, 81); doc.text(c.name, W / 2, fy + 6, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...gray);
  lines.forEach((l, i) => doc.text(l, W / 2, fy + 11 + i * 4.2, { align: "center" }));
  doc.setFontSize(8); doc.setTextColor(156, 163, 175);
  doc.text("This is a computer-generated receipt and does not need a signature.", W / 2, fy + 11 + lines.length * 4.2 + 2, { align: "center" });

  return doc.output("arraybuffer");
}

export async function buildReceiptPdf(r: ReceiptInput, opts: { company?: Company; logo?: string } = {}): Promise<Blob> {
  return new Blob([await buildReceiptPdfBytes(r, opts)], { type: "application/pdf" });
}

/**
 * The logo as a small picture the PDF can embed (PDFs can't use the app's WebP file). Flattened onto white and saved as JPEG so the
 * receipt stays a few KB instead of a megabyte. Browser only; undefined if it can't be loaded.
 */
export function logoForPdf(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const k = Math.min(1, 300 / img.naturalHeight);
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        const g = c.getContext("2d")!;
        g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.92));
      } catch { resolve(undefined); }
    };
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

export const receiptFileName = (r: Pick<ReceiptInput, "reference">) => `FarmHelper-receipt-${r.reference}.pdf`;
