import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Printer, DollarSign } from "lucide-react";

export default function GivingStatements() {
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("members").select("id, first_name, last_name").order("last_name");
      if (data) setMembers(data);
    };
    fetch();
  }, []);

  const fetchTransactions = async () => {
    if (!selectedMember) return;
    const { data } = await supabase.from("giving_transactions")
      .select("*, giving_funds(name)")
      .eq("member_id", selectedMember)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: false });
    if (data) setTransactions(data);
  };

  useEffect(() => { if (selectedMember) fetchTransactions(); }, [selectedMember, startDate, endDate]);

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const member = members.find(m => m.id === selectedMember);

  const handlePrint = () => {
    if (!member) return;
    const content = `
      <html><head><title>Giving Statement</title>
      <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:20px}
      h1{text-align:center}h2{text-align:center;color:#666;margin-top:0}
      table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f5f5f5}tfoot td{font-weight:bold;background:#f9f9f9}
      .header{text-align:center;margin-bottom:30px}.period{color:#666;font-size:14px}</style></head>
      <body><div class="header"><h1>ELCZ City Centre Bulawayo</h1><h2>Giving Statement</h2>
      <p><strong>${member.first_name} ${member.last_name}</strong></p>
      <p class="period">${startDate} to ${endDate}</p></div>
      <table><thead><tr><th>Date</th><th>Fund</th><th>Method</th><th>Amount</th></tr></thead>
      <tbody>${transactions.map(t => `<tr><td>${t.transaction_date}</td><td>${t.giving_funds?.name || "-"}</td><td>${t.payment_method || "-"}</td><td>$${Number(t.amount).toFixed(2)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="3">Total</td><td>$${total.toFixed(2)}</td></tr></tfoot></table>
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(content); w.document.close(); w.print(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Giving Statements</h2>
        {selectedMember && transactions.length > 0 && (
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print Statement</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>From</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><Label>To</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {selectedMember && (
        <>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-3xl font-bold">${total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total giving for selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Transactions</CardTitle></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions found for this period.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{t.giving_funds?.name || "General"}</p>
                        <p className="text-xs text-muted-foreground">{t.transaction_date} · {t.payment_method}</p>
                      </div>
                      <p className="font-semibold text-green-600">${Number(t.amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
