import { useEffect, useState } from "react";
import { Download, FileText, Printer, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { generateFinancialReport, generateHealthReport, generateOperationalReport, type FarmReport } from "@/lib/reports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** Bookkeeping fields that mean nothing to a reader. */
const HIDDEN = new Set(["id", "farmId", "createdAt", "updatedAt", "deletedAt", "deleted", "synced", "version", "createdBy", "updatedBy"]);

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<"finance" | "health" | "ops">("finance");
  const [isGenerating, setIsGenerating] = useState(false);

  const getReportData = () => {
    if (activeReport === "finance") return generateFinancialReport();
    if (activeReport === "health") return generateHealthReport();
    return generateOperationalReport();
  };

  const exportPDF = async () => {
    setIsGenerating(true);
    try {
      const report = getReportData();
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text(report.title, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${report.date}`, 14, 30);

      let currentY = 40;

      report.sections.forEach((section) => {
        // Section Title
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(section.title, 14, currentY);
        currentY += 6;

        // Summary Data
        if (section.data.length > 0) {
          section.data.forEach((item) => {
            doc.setFontSize(11);
            doc.text(`${item.label}: ${item.value}`, 14, currentY);
            currentY += 7;
          });
          currentY += 4;
        }

        // Table for Details
        if (section.details && section.details.length > 0) {
          const columns = Object.keys(section.details[0]).filter(k => !HIDDEN.has(k));
          const rows = section.details.map(row => columns.map(col => String(row[col] ?? "")));

          autoTable(doc, {
            startY: currentY,
            head: [columns.map(c => c.charAt(0).toUpperCase() + c.slice(1))],
            body: rows,
            theme: "striped",
            headStyles: { fillColor: [40, 80, 40] },
            margin: { left: 14, right: 14 },
          });

          currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        } else {
          currentY += 10;
        }
      });

      doc.save(`${activeReport}_report.pdf`);
      toast.success("Report downloaded successfully");
    } catch (e) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const report = getReportData();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-l-4 border-accent pl-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Farm Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Audits for financial and operational compliance.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" onClick={() => window.print()} className="h-11 sm:h-10">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={exportPDF} disabled={isGenerating} className="h-11 sm:h-10">
            {isGenerating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 sm:inline-grid sm:w-auto" role="tablist" aria-label="Report">
        {(["finance", "health", "ops"] as const).map((t) => (
          <Button
            key={t}
            role="tab"
            aria-selected={activeReport === t}
            variant={activeReport === t ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveReport(t)}
            className="h-10 rounded-lg px-3"
          >
            {t === "ops" ? "Operations" : t === "finance" ? "Finance" : "Animal health"}
          </Button>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 sm:gap-6">
        {report.sections.map((s, i) => (
          <Card key={i} className="min-w-0 rounded-2xl p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-bold sm:mb-4 sm:text-xl">{s.title}</h2>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-4">
              {s.data.map((d, j) => (
                <div key={j} className="min-w-0 rounded-xl border bg-muted/50 p-3">
                  <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d.label}</div>
                  <div className="truncate text-lg font-bold tabular-nums sm:text-2xl">{d.value}</div>
                </div>
              ))}
            </div>
            {s.details && s.details.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-medium">
                    <tr>
                      {Object.keys(s.details[0]).filter(k => !HIDDEN.has(k)).map(col => (
                        <th key={col} className="whitespace-nowrap px-3 py-2 capitalize">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {s.details.map((row, j) => (
                      <tr key={j} className="hover:bg-muted/30">
                        {Object.entries(row).filter(([k]) => !HIDDEN.has(k)).map(([k, v]) => (
                          <td key={k} className="whitespace-nowrap px-3 py-2">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
