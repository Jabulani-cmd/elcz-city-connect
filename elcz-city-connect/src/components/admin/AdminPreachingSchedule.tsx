import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface PreachingEntry {
  id: string;
  preacher_name: string;
  service_date: string;
  service_type: string;
  notes: string | null;
}

const AdminPreachingSchedule = () => {
  const [entries, setEntries] = useState<PreachingEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PreachingEntry | null>(null);
  const [preacherName, setPreacherName] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceType, setServiceType] = useState("sunday_worship");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from("preaching_schedule")
      .select("*")
      .order("service_date", { ascending: true });
    if (data) setEntries(data as PreachingEntry[]);
  };

  useEffect(() => { fetchEntries(); }, []);

  const resetForm = () => {
    setPreacherName("");
    setServiceDate("");
    setServiceType("sunday_worship");
    setNotes("");
    setEditing(null);
  };

  const openEdit = (entry: PreachingEntry) => {
    setEditing(entry);
    setPreacherName(entry.preacher_name);
    setServiceDate(entry.service_date);
    setServiceType(entry.service_type);
    setNotes(entry.notes || "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const { error } = await supabase.from("preaching_schedule").update({
          preacher_name: preacherName,
          service_date: serviceDate,
          service_type: serviceType,
          notes: notes || null,
        }).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Schedule updated" });
      } else {
        const { error } = await supabase.from("preaching_schedule").insert({
          preacher_name: preacherName,
          service_date: serviceDate,
          service_type: serviceType,
          notes: notes || null,
        });
        if (error) throw error;
        toast({ title: "Preacher added to schedule" });
      }
      setOpen(false);
      resetForm();
      fetchEntries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this entry?")) return;
    const { error } = await supabase.from("preaching_schedule").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Entry removed" }); fetchEntries(); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Preaching Schedule</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Preacher</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Entry" : "Add to Schedule"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{serviceType === "bible_study" ? "Facilitator Name" : "Preacher Name"}</Label>
                <Input value={preacherName} onChange={(e) => setPreacherName(e.target.value)} required />
              </div>
              <div>
                <Label>Service Type</Label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="sunday_worship">Sunday Worship Service</option>
                  <option value="bible_study">Bible Study</option>
                </select>
              </div>
              <div>
                <Label>Service Date (Sunday)</Label>
                <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} required />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Theme, Scripture reference" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editing ? "Update" : "Add to Schedule"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No preaching schedule entries yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                <p className="font-semibold text-foreground">{entry.preacher_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(entry.service_date + "T00:00:00"), "EEEE, dd MMMM yyyy")} · {entry.service_type === "bible_study" ? "Bible Study" : "Worship Service"}
                  </p>
                  {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(entry)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPreachingSchedule;
