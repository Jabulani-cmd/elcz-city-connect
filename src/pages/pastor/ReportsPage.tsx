import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, DollarSign, UserCheck } from "lucide-react";

export default function ReportsPage() {
  const [stats, setStats] = useState({ members: 0, active: 0, baptized: 0, confirmed: 0, totalGiving: 0, volunteers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [m, g, v] = await Promise.all([
        supabase.from("members").select("is_active, baptized, confirmed_in_church"),
        supabase.from("giving_transactions").select("amount"),
        supabase.from("volunteer_assignments").select("id", { count: "exact", head: true }),
      ]);
      const members = m.data || [];
      setStats({
        members: members.length,
        active: members.filter(m => m.is_active).length,
        baptized: members.filter(m => m.baptized).length,
        confirmed: members.filter(m => m.confirmed_in_church).length,
        totalGiving: (g.data || []).reduce((s, t) => s + Number(t.amount), 0),
        volunteers: v.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Members", value: stats.members, icon: Users, color: "text-blue-500" },
    { label: "Active Members", value: stats.active, icon: Users, color: "text-green-500" },
    { label: "Baptized", value: stats.baptized, icon: Users, color: "text-cyan-500" },
    { label: "Confirmed", value: stats.confirmed, icon: Users, color: "text-indigo-500" },
    { label: "Total Giving", value: `$${stats.totalGiving.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
    { label: "Active Volunteers", value: stats.volunteers, icon: UserCheck, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Reports</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-6 text-center">
              <c.icon className={`h-10 w-10 mx-auto mb-3 ${c.color}`} />
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Detailed Reports</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed report builder with charts coming soon. Use the individual section pages for current data views.</p>
        </CardContent>
      </Card>
    </div>
  );
}
