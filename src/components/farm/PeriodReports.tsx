import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { todayISO } from "@/lib/calc";
import { exportCsv, slug } from "@/lib/export";
import { periodFileName, periodFor, periodReports, presets, type PeriodKind } from "@/lib/periodReports";
import { useFarm, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GROUPS = ["Overview", "Livestock", "Agriculture", "Financial"];

/** Daily and weekly CSV reports: pick today / yesterday / this week / last week (or any date), then download any report for exactly those dates. */
export function PeriodReports() {
  const data = useStore((s) => s.data);
  const farm = useFarm();
  const [kind, setKind] = useState<PeriodKind>("daily");
  const [anchor, setAnchor] = useState(todayISO());
  const period = useMemo(() => periodFor(kind, anchor || todayISO()), [kind, anchor]);
  const reports = useMemo(() => periodReports(period).map((r) => ({ ...r, table: r.build() })), [period, data]); // eslint-disable-line react-hooks/exhaustive-deps
  const download = (i: number) => {
    const r = reports[i];
    try { exportCsv(r.table, `${farm?.name ? slug(farm.name) + "_" : ""}${periodFileName(r.title, period)}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Download failed"); }
  };
  const pick = (k: PeriodKind, a: string) => { setKind(k); setAnchor(a); };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Pick a day or a week, then download any report as a CSV (opens in Excel or Google Sheets). Weeks run Monday to Sunday.</p>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:inline-grid sm:w-auto" role="tablist" aria-label="Report period">
        {(["daily", "weekly"] as const).map((k) => (
          <Button key={k} role="tab" aria-selected={kind === k} variant={kind === k ? "default" : "ghost"} size="sm" className="h-10 rounded-lg px-4" onClick={() => pick(k, todayISO())}>{k === "daily" ? "Daily" : "Weekly"}</Button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {presets(kind).map((p) => (
          <Button key={p.name} variant={anchor === p.anchor ? "secondary" : "outline"} className="h-11 rounded-full px-4" onClick={() => setAnchor(p.anchor)}>{p.name}</Button>
        ))}
        <label className="text-sm">Other date<Input type="date" className="mt-1 h-11 w-44" value={anchor} max={todayISO()} onChange={(e) => e.target.value && setAnchor(e.target.value)} /></label>
      </div>
      <div className="rounded-xl border bg-card p-3"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Showing</div><div className="font-semibold">{period.label}</div></div>
      {GROUPS.map((g) => (
        <section key={g} aria-label={g}>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</h2>
          <Card className="divide-y overflow-hidden">
            {reports.map((r, i) => r.group === g && (
              <div key={r.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium leading-snug">{r.title}</div>
                  <div className={cn("text-xs text-muted-foreground")}>{r.table.rows.length} row{r.table.rows.length === 1 ? "" : "s"}{r.snapshot ? " · as of today" : ""}</div>
                </div>
                <Button variant="outline" className="h-11 shrink-0" disabled={r.table.rows.length === 0} onClick={() => download(i)} aria-label={`Download ${r.title} as CSV`}><Download className="mr-1.5 h-4 w-4" />CSV</Button>
              </div>
            ))}
          </Card>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">Reports marked “as of today” show how the farm looks now, so they don’t change with the dates. Times in the activity log are UTC.</p>
    </div>
  );
}
