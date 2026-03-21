import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Plus, TrendingUp } from "lucide-react";

export default function GivingDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [fundId, setFundId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [fundName, setFundName] = useState("");
  const [fundDesc, setFundDesc] = useState("");

  const fetchData = async () => {
    const [t, f, m] = await Promise.all([
      supabase.from("giving_transactions").select("*, members(first_name, last_name), giving_funds(name)").order("transaction_date", { ascending: false }).limit(100),
      supabase.from("giving_funds").select("*").order("name"),
      supabase.from("members").select("id, first_name, last_name").order("last_name"),
    ]);
    if (t.data) setTransactions(t.data);
    if (f.data) setFunds(f.data);
    if (m.data) setMembers(m.data);
  };

  useEffect(() => { fetchData(); }, []);

  const totalGiving = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleSaveTransaction = async () => {
    if (!amount || !fundId) return;
    const { error } = await supabase.from("giving_transactions").insert({
      member_id: memberId || null, fund_id: fundId, amount: Number(amount),
      payment_method: paymentMethod, transaction_date: transactionDate,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Transaction recorded!" }); setOpen(false); setAmount(""); fetchData();
  };

  const handleSaveFund = async () => {
    if (!fundName) return;
    const { error } = await supabase.from("giving_funds").insert({ name: fundName, description: fundDesc });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Fund created!" }); setFundOpen(false); setFundName(""); setFundDesc(""); fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Giving Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFundOpen(true)}>New Fund</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Record Giving</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">${totalGiving.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Giving</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{transactions.length}</p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{funds.length}</p>
            <p className="text-xs text-muted-foreground">Active Funds</p>
          </CardContent>
        </Card>
      </div>

      {/* Funds */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Funds</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {funds.map(f => (
              <div key={f.id} className="px-3 py-2 rounded-md bg-muted text-sm">
                <p className="font-medium">{f.name}</p>
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.slice(0, 20).map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{t.members ? `${t.members.first_name} ${t.members.last_name}` : "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{t.giving_funds?.name} · {t.payment_method} · {t.transaction_date}</p>
                </div>
                <p className="font-semibold text-green-600">${Number(t.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Record Transaction Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Giving</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Member (optional)</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Anonymous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fund</Label>
              <Select value={fundId} onValueChange={setFundId}>
                <SelectTrigger><SelectValue placeholder="Select fund" /></SelectTrigger>
                <SelectContent>{funds.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Date</Label><Input type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} /></div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="ecocash">EcoCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveTransaction} className="w-full">Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Fund Dialog */}
      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Fund</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={fundName} onChange={e => setFundName(e.target.value)} /></div>
            <div><Label>Description</Label><Input value={fundDesc} onChange={e => setFundDesc(e.target.value)} /></div>
            <Button onClick={handleSaveFund} className="w-full">Create Fund</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
