export type Table = { title: string; headers: string[]; rows: (string | number)[][] };

const esc = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function download(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
const html = (s: string | number) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function toCsv(t: Table): string {
  return [t.headers, ...t.rows].map((r) => r.map(esc).join(",")).join("\r\n");
}

export const exportCsv = (t: Table) => download(`${slug(t.title)}.csv`, "﻿" + toCsv(t), "text/csv;charset=utf-8");

/** Excel opens an HTML table saved as .xls, so no extra dependency is needed. */
export function exportExcel(t: Table) {
  const body = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${t.headers.map((h) => `<th>${html(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${html(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  download(`${slug(t.title)}.xls`, body, "application/vnd.ms-excel");
}

/** Opens a print-ready page; choose “Save as PDF” in the print dialog. */
export function exportPdf(t: Table, subtitle = "") {
  const w = window.open("", "_blank");
  if (!w) throw new Error("Allow pop-ups to export PDF");
  w.document.write(`<!doctype html><title>${html(t.title)}</title><style>body{font:13px system-ui,sans-serif;margin:24px;color:#111}h1{font-size:20px;margin:0}p{color:#555;margin:4px 0 16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:5px 8px;text-align:left}th{background:#eef3ee}tr:nth-child(even) td{background:#fafafa}</style><h1>${html(t.title)}</h1><p>${html(subtitle)} · Generated ${new Date().toLocaleString()}</p><table><thead><tr>${t.headers.map((h) => `<th>${html(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${html(c)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),200)</script>`);
  w.document.close();
}
