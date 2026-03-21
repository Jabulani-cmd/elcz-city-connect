import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Phone, Mail, Grid, List } from "lucide-react";

export default function MemberDirectory() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    supabase.from("members").select("*").order("last_name").then(({ data }) => {
      if (data) setMembers(data);
    });
  }, []);

  const filtered = members.filter(m => {
    const match = `${m.first_name} ${m.last_name} ${m.email || ""} ${m.phone || ""}`.toLowerCase().includes(search.toLowerCase());
    const league = leagueFilter === "all" || m.league === leagueFilter;
    return match && league;
  });

  const handleExport = () => {
    const csv = ["First Name,Last Name,Email,Phone,League,Status"]
      .concat(filtered.map(m => `${m.first_name},${m.last_name},${m.email || ""},${m.phone || ""},${m.league},${m.is_active ? "Active" : "Inactive"}`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "members.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Member Directory</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setView(view === "grid" ? "list" : "grid")}>
            {view === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>Export CSV</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={leagueFilter} onValueChange={setLeagueFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leagues</SelectItem>
            <SelectItem value="men">Men</SelectItem>
            <SelectItem value="women">Women</SelectItem>
            <SelectItem value="youth">Youth</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} members found</p>

      {view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {m.first_name[0]}{m.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{m.first_name} {m.last_name}</p>
                    <Badge variant="outline" className="text-xs">{m.league}</Badge>
                  </div>
                </div>
                {m.phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {m.phone}</p>}
                {m.email && <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</p>}
                <div className="flex gap-1 mt-2">
                  {m.baptized && <Badge className="bg-blue-100 text-blue-700 text-xs">Baptized</Badge>}
                  {m.confirmed_in_church && <Badge className="bg-green-100 text-green-700 text-xs">Confirmed</Badge>}
                  {!m.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-3 rounded-md border border-border hover:bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {m.first_name[0]}{m.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{m.first_name} {m.last_name}</p>
              </div>
              <Badge variant="outline" className="text-xs">{m.league}</Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">{m.phone || "—"}</span>
              <span className="text-sm text-muted-foreground hidden md:inline">{m.email || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
