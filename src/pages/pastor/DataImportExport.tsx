import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, Users, DollarSign, Calendar } from "lucide-react";

export default function DataImportExport() {
  const [loading, setLoading] = useState<string | null>(null);

  const exportTable = async (tableName: string, label: string) => {
    setLoading(tableName);
    try {
      const { data, error } = await supabase.from(tableName as any).select("*");
      if (error) throw error;
      if (!data || data.length === 0) { toast({ title: "No data to export" }); return; }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map(row => headers.map(h => {
          const val = (row as any)[h];
          const str = val === null ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${tableName}_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast({ title: `${label} exported!`, description: `${data.length} records` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleImportMembers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading("import");
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast({ title: "File is empty or has no data rows" }); return; }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
      const firstIdx = headers.indexOf("first_name");
      const lastIdx = headers.indexOf("last_name");
      if (firstIdx === -1 || lastIdx === -1) {
        toast({ title: "CSV must have 'first_name' and 'last_name' columns", variant: "destructive" }); return;
      }

      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, any> = {};
        headers.forEach((h, i) => {
          if (["first_name", "last_name", "email", "phone", "address", "gender", "league"].includes(h)) {
            row[h] = vals[i] || null;
          }
        });
        return row;
      }).filter(r => r.first_name && r.last_name);

      if (rows.length === 0) { toast({ title: "No valid rows found", variant: "destructive" }); return; }

      const { error } = await supabase.from("members").insert(rows as any);
      if (error) throw error;
      toast({ title: "Import successful!", description: `${rows.length} members imported` });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
      e.target.value = "";
    }
  };

  const exports = [
    { table: "members", label: "Members", icon: Users, color: "text-blue-500" },
    { table: "giving_transactions", label: "Giving Transactions", icon: DollarSign, color: "text-green-500" },
    { table: "events", label: "Events", icon: Calendar, color: "text-amber-500" },
    { table: "prayer_requests", label: "Prayer Requests", icon: FileSpreadsheet, color: "text-rose-500" },
    { table: "volunteer_assignments", label: "Volunteer Assignments", icon: Users, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="h-6 w-6" /> Data Import/Export</h2>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="h-5 w-5" /> Import Data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Import members from a CSV file. The file must include <code>first_name</code> and <code>last_name</code> columns. Optional: <code>email</code>, <code>phone</code>, <code>address</code>, <code>gender</code>, <code>league</code>.</p>
            <label className="inline-block">
              <input type="file" accept=".csv" onChange={handleImportMembers} className="hidden" />
              <Button variant="outline" asChild disabled={loading === "import"}>
                <span><Upload className="h-4 w-4 mr-1" /> {loading === "import" ? "Importing..." : "Import Members CSV"}</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Download className="h-5 w-5" /> Export Data</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exports.map(e => (
              <Button
                key={e.table} variant="outline" className="justify-start gap-2 h-auto py-3"
                onClick={() => exportTable(e.table, e.label)} disabled={loading === e.table}
              >
                <e.icon className={`h-4 w-4 ${e.color}`} />
                <div className="text-left">
                  <p className="text-sm font-medium">{e.label}</p>
                  <p className="text-xs text-muted-foreground">Export as CSV</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
