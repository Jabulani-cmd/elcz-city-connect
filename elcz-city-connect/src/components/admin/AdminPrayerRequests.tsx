import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check } from "lucide-react";

interface PrayerRequest {
  id: string;
  request: string;
  requested_by: string | null;
  is_public: boolean;
  resolved: boolean;
  created_at: string;
}

const AdminPrayerRequests = () => {
  const [items, setItems] = useState<PrayerRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PrayerRequest | null>(null);
  const [request, setRequest] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as PrayerRequest[]);
  };

  useEffect(() => { fetchItems(); }, []);

  const reset = () => { setRequest(""); setRequestedBy(""); setIsPublic(true); setResolved(false); setEditing(null); };

  const openEdit = (item: PrayerRequest) => {
    setEditing(item); setRequest(item.request); setRequestedBy(item.requested_by || ""); setIsPublic(item.is_public); setResolved(item.resolved); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { request, requested_by: requestedBy || null, is_public: isPublic, resolved };
      if (editing) {
        const { error } = await supabase.from("prayer_requests").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Updated" });
      } else {
        const { error } = await supabase.from("prayer_requests").insert(payload);
        if (error) throw error;
        // Auto-create a published announcement for public prayer requests
        if (isPublic) {
          const announcementTitle = `Prayer Request${requestedBy ? ` from ${requestedBy}` : ""}`;
          await supabase.from("announcements").insert({
            title: announcementTitle,
            content: request,
            published: true,
          });
        }
        toast({ title: "Prayer request added" });
      }
      setOpen(false); reset(); fetchItems();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prayer request?")) return;
    const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchItems(); }
  };

  const toggleResolved = async (item: PrayerRequest) => {
    const { error } = await supabase.from("prayer_requests").update({ resolved: !item.resolved }).eq("id", item.id);
    if (!error) fetchItems();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Prayer Requests</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Prayer Request</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Prayer Request</Label><Textarea value={request} onChange={(e) => setRequest(e.target.value)} required rows={4} /></div>
              <div><Label>Requested By (optional)</Label><Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} /></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} id="isPublic" />
                  <Label htmlFor="isPublic">Public</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={resolved} onCheckedChange={setResolved} id="resolved" />
                  <Label htmlFor="resolved">Resolved</Label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No prayer requests yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={item.resolved ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className={`text-sm ${item.resolved ? "line-through" : ""}`}>{item.request}</p>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    {item.requested_by && <span>By: {item.requested_by}</span>}
                    <span className={`px-2 py-0.5 rounded-full ${item.is_public ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                      {item.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant={item.resolved ? "secondary" : "outline"} onClick={() => toggleResolved(item)}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPrayerRequests;
