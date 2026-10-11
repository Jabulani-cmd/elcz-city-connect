import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Empty, PageHeader } from "@/components/farm/kit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { exportCsv, exportExcel, exportPdf } from "@/lib/export";
import { REPORTS } from "@/lib/reports";
import { useFarm, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GROUPS = ["Livestock", "Agriculture", "Financial"] as const;

export default function Reports() {
  const data = useStore((s) => s.data);
  const farm = useFarm();
  const [id, setId] = useState(REPORTS[0].id);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const def = REPORTS.find((r) => r.id === id)!;
  const table = useMemo(() => def.build({ from, to }), [def, from, to, data]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = (fn: () => void) => { try { fn(); } catch (e) { toast.error(e instanceof Error ? e.message : "Export failed"); } };
  const sub = `${farm?.name ?? ""}${from || to ? ` · ${from || "start"} to ${to || "today"}` : ""}`;
  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Choose a report, optionally limit the dates, then view it or export to PDF, Excel or CSV." />
      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-6">
        <nav aria-label="Reports" className="mb-4 space-y-4 lg:mb-0">
          {GROUPS.map((g) => (
            <div key={g}>
              <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</div>
              <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
                {REPORTS.filter((r) => r.group === g).map((r) => (
                  <button key={r.id} onClick={() => setId(r.id)} aria-current={r.id === id ? "true" : undefined} className={cn("rounded-full border px-3 py-1.5 text-left text-sm lg:rounded-lg lg:border-0", r.id === id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted lg:bg-transparent")}>{r.title}</button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <h2 className="mr-auto text-lg font-semibold">{def.title}</h2>
            <label className="text-sm">From<Input type="date" className="mt-1 h-10 w-40" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-sm">To<Input type="date" className="mt-1 h-10 w-40" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => run(() => exportPdf(table, sub))}><FileText className="mr-1.5 h-4 w-4" />PDF</Button>
            <Button variant="outline" onClick={() => run(() => exportExcel(table))}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Excel</Button>
            <Button variant="outline" onClick={() => run(() => exportCsv(table))}><Download className="mr-1.5 h-4 w-4" />CSV</Button>
          </div>
          {table.rows.length === 0 ? <Empty>No data for this report{from || to ? " in the chosen dates" : " yet"}.</Empty> : (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{table.headers.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y">{table.rows.map((r, i) => <tr key={i} className={String(r[0]).match(/^(INCOME|EXPENSES|NET PROFIT|Total)/) ? "bg-muted/40 font-semibold" : ""}>{r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2">{typeof c === "number" ? c.toLocaleString(undefined, { maximumFractionDigits: 2 }) : c}</td>)}</tr>)}</tbody>
              </table>
            </Card>
          )}
          <p className="text-xs text-muted-foreground">PDF opens a print-ready page – choose “Save as PDF” in the print dialog.</p>
        </div>
      </div>
    </div>
  );
}
