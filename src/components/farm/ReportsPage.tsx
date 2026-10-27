import { useEffect, useState } from "react";
import { Download, FileText, Printer, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { generateFinancialReport, generateHealthReport, generateOperationalReport, type FarmReport } from "@/lib/reports";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
          const columns = Object.keys(section.details[0]).filter(k => k !== "id" && k !== "farmId");
          const rows = section.details.map(row => columns.map(col => String(row[col] ?? "")));

          autoTable(doc, {
            startY: currentY,
            head: [columns.map(c => c.charAt(0).toUpperCase() + c.slice(1))],
            body: rows,
            theme: "striped",
            headStyles: { fillColor: [40, 80, 40] },
            margin: { left: 14, right: 14 },
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farm Reports</h1>
          <p className="text-muted-foreground">Professional audits for financial and operational compliance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print Page
          </Button>
          <Button onClick={exportPDF} disabled={isGenerating} className="gap-2">
            {isGenerating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        {(["finance", "health", "ops"] as const).map((t) => (
          <Button
            key={t}
            variant={activeReport === t ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveReport(t)}
            className="capitalize"
          >
            {t === "ops" ? "Operations" : t}
          </Button>
        ))}
      </div>

      <div className="grid gap-6">
        {report.sections.map((s, i) => (
          <Card key={i} className="p-6">
            <h2 className="text-xl font-bold mb-4">{s.title}</h2>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              {s.data.map((d, j) => (
                <div key={j} className="p-3 rounded-xl bg-muted/50 border">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">{d.label}</div>
                  <div className="text-2xl font-bold">{d.value}</div>
                </div>
              ))}
            </div>
            {s.details && s.details.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-medium">
                    <tr>
                      {Object.keys(s.details[0]).filter(k => k !== "id" && k !== "farmId").map(col => (
                        <th key={col} className="px-4 py-2 capitalize">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {s.details.map((row, j) => (
                      <tr key={j} className="hover:bg-muted/30">
                        {Object.entries(row).filter(([k]) => k !== "id" && k !== "farmId").map(([_, v]) => (
                          <td key={v} className="px-4 py-2">{String(v)}</td>
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
