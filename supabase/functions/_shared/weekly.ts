// Weekly report maths for the `notify-digest` function. Plain TypeScript with no Deno or npm imports, so the unit tests can run it.
// The numbers mirror "Farm summary" in the app (src/lib/periodReports.ts) except the "App activity" rows, which come from the phone's own change log.

export type Week = { from: string; to: string; label: string };
export type Rows = Record<string, unknown>[];

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parse = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const nice = (iso: string) => { const [, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]}`; };

/** 0 = Monday … 6 = Sunday */
export const weekday = (iso: string) => (new Date(parse(iso)).getUTCDay() + 6) % 7;
export const isMonday = (iso: string) => weekday(iso) === 0;

/** The last complete Monday–Sunday week before `today`. On a Monday that is the week that just ended. */
export function previousWeek(today: string): Week {
  const from = fmt(parse(today) - (weekday(today) + 7) * DAY);
  const to = fmt(parse(from) + 6 * DAY);
  return { from, to, label: `${nice(from)} – ${nice(to)} ${to.slice(0, 4)}` };
}

export const inWeek = (date: unknown, w: Week) => typeof date === "string" && date.slice(0, 10) >= w.from && date.slice(0, 10) <= w.to;

/** Which column holds the date for each table the report reads. */
export const DATE_COLUMN = {
  income: "date", expenses: "date", sales: "date", purchases: "date", births: "birth_date", deaths: "date", health: "date",
  vaccinations: "date", harvests: "harvest_date", fertilizer: "application_date", irrigation: "date", tasks: "due_date",
} as const;
export type WeeklyData = Record<keyof typeof DATE_COLUMN, Rows>;

const money = (rows: Rows) => Math.round(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0) * 100) / 100;

export function summaryRows(d: WeeklyData, w: Week): (string | number)[][] {
  const pick = (k: keyof WeeklyData) => d[k].filter((r) => inWeek(r[DATE_COLUMN[k]], w));
  const income = money(pick("income")), expenses = money(pick("expenses"));
  const tasks = pick("tasks");
  const done = tasks.filter((t) => t.status === "Done").length;
  return [
    ["Money", "Income", income],
    ["Money", "Expenses", expenses],
    ["Money", "Net (income – expenses)", Math.round((income - expenses) * 100) / 100],
    ["Money", "Animals sold", pick("sales").length],
    ["Livestock", "Births", pick("births").length],
    ["Livestock", "Animals bought", pick("purchases").length],
    ["Livestock", "Deaths", pick("deaths").length],
    ["Livestock", "Health cases recorded", pick("health").length],
    ["Livestock", "Vaccinations given", pick("vaccinations").length],
    ["Crops", "Harvests recorded", pick("harvests").length],
    ["Crops", "Fertilizer applications", pick("fertilizer").length],
    ["Crops", "Irrigation events", pick("irrigation").length],
    ["Tasks", "Due in the week", tasks.length],
    ["Tasks", "…of which done", done],
    ["Tasks", "…of which not done", tasks.length - done],
  ];
}

const esc = (v: string | number) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** CSV with a byte-order mark so Excel reads the "–" and other symbols correctly. */
export const toCsv = (headers: string[], rows: (string | number)[][]) => "﻿" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");

export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const weeklyFileName = (farm: string, w: Week) => {
  const slug = farm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "farm";
  return `${slug}_weekly-report_${w.from}_to_${w.to}.csv`;
};
