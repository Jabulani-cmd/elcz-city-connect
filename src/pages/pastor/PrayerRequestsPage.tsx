import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Heart, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function PrayerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const fetch = async () => {
    let q = supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
    if (filter === "active") q = q.eq("resolved", false);
    if (filter === "resolved") q = q.eq("resolved", true);
    const { data } = await q;
    if (data) setRequests(data);
  };

  useEffect(() => { fetch(); }, [filter]);

  const toggleResolved = async (id: string, current: boolean) => {
    await supabase.from("prayer_requests").update({ resolved: !current }).eq("id", id);
    toast({ title: !current ? "Marked as answered" : "Reopened" }); fetch();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Prayer Requests</h2>

      <div className="flex gap-2">
        {(["all", "active", "resolved"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map(r => (
          <Card key={r.id} className={r.resolved ? "opacity-60" : ""}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className={`h-4 w-4 ${r.resolved ? "text-green-500" : "text-rose-500"}`} />
                  <span className="text-sm font-medium">{r.requested_by || "Anonymous"}</span>
                  {r.is_public ? <Eye className="h-3 w-3 text-muted-foreground" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                  {r.resolved && <Badge className="bg-green-100 text-green-800">Answered</Badge>}
                </div>
                <p className="text-sm">{r.request}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleResolved(r.id, r.resolved)}>
                <CheckCircle className="h-4 w-4 mr-1" /> {r.resolved ? "Reopen" : "Answered"}
              </Button>
            </CardContent>
          </Card>
        ))}
        {requests.length === 0 && <p className="text-center text-muted-foreground py-8">No prayer requests found.</p>}
      </div>
    </div>
  );
}
