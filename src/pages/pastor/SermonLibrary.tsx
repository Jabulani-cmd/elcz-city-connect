import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SermonLibrary() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetch = async () => {
    let q = supabase.from("sermons").select("*, sermon_series(title)").order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    if (data) setSermons(data);
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const filtered = sermons.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.scripture_references?.some((r: string) => r.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sermon?")) return;
    await supabase.from("sermons").delete().eq("id", id);
    toast({ title: "Deleted" }); fetch();
  };

  const statusColor: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    review: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sermon Library</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search sermons..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  <h3 className="font-semibold truncate">{s.title}</h3>
                  <Badge className={statusColor[s.status] || ""}>{s.status}</Badge>
                </div>
                {s.sermon_series && <p className="text-xs text-muted-foreground">Series: {s.sermon_series.title}</p>}
                {s.scripture_references?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">📖 {s.scripture_references.join(", ")}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {s.date_preached || "Not preached yet"} · {s.service_type?.replace(/_/g, " ")}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No sermons found.</p>}
      </div>
    </div>
  );
}
