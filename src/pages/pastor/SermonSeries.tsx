import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function SermonSeries() {
  const [series, setSeries] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetch = async () => {
    const { data } = await supabase.from("sermon_series").select("*").order("start_date", { ascending: false });
    if (data) setSeries(data);
  };

  useEffect(() => { fetch(); }, []);

  const reset = () => { setTitle(""); setDescription(""); setStartDate(""); setEndDate(""); setEditing(null); };

  const handleSave = async () => {
    if (!title) return;
    const payload = { title, description, start_date: startDate || null, end_date: endDate || null };
    const { error } = editing
      ? await supabase.from("sermon_series").update(payload).eq("id", editing.id)
      : await supabase.from("sermon_series").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Updated!" : "Created!" });
    setOpen(false); reset(); fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this series?")) return;
    await supabase.from("sermon_series").delete().eq("id", id);
    fetch();
  };

  const openEdit = (s: any) => {
    setEditing(s); setTitle(s.title); setDescription(s.description || "");
    setStartDate(s.start_date || ""); setEndDate(s.end_date || "");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sermon Series</h2>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Series</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {series.map(s => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{s.description || "No description"}</p>
              <p className="text-xs text-muted-foreground">{s.start_date} → {s.end_date || "Ongoing"}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(s.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Series" : "New Series"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
