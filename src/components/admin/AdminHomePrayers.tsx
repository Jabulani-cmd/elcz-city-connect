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

interface PrayerLocation {
  id: string;
  prayer_date: string;
  host_name: string;
  address: string;
  notes: string | null;
}

const AdminHomePrayers = () => {
  const [entries, setEntries] = useState<PrayerLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PrayerLocation | null>(null);
  const [prayerDate, setPrayerDate] = useState("");
  const [hostName, setHostName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from("home_prayer_locations")
      .select("*")
      .order("prayer_date", { ascending: true });
    if (data) setEntries(data as PrayerLocation[]);
  };

  useEffect(() => { fetchEntries(); }, []);

  const resetForm = () => {
    setPrayerDate("");
    setHostName("");
    setAddress("");
    setNotes("");
    setEditing(null);
  };

  const openEdit = (entry: PrayerLocation) => {
    setEditing(entry);
    setPrayerDate(entry.prayer_date);
    setHostName(entry.host_name);
    setAddress(entry.address);
    setNotes(entry.notes || "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const { error } = await supabase.from("home_prayer_locations").update({
          prayer_date: prayerDate,
          host_name: hostName,
          address,
          notes: notes || null,
        }).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Prayer location updated" });
      } else {
        const { error } = await supabase.from("home_prayer_locations").insert({
          prayer_date: prayerDate,
          host_name: hostName,
          address,
          notes: notes || null,
        });
        if (error) throw error;
        toast({ title: "Prayer location added" });
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
    const { error } = await supabase.from("home_prayer_locations").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Entry removed" }); fetchEntries(); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Thursday Home Prayers</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Prayer Location" : "Add Prayer Location"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Thursday Date</Label>
                <Input type="date" value={prayerDate} onChange={(e) => setPrayerDate(e.target.value)} required />
              </div>
              <div>
                <Label>Host Name</Label>
                <Input value={hostName} onChange={(e) => setHostName(e.target.value)} required placeholder="e.g. Mr. & Mrs. Moyo" />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="e.g. Stand 12345, City Centre" />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Time, directions" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editing ? "Update" : "Add Location"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No home prayer locations added yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{entry.host_name}</p>
                  <p className="text-sm text-muted-foreground">{entry.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(entry.prayer_date + "T00:00:00"), "EEEE, dd MMMM yyyy")}
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

export default AdminHomePrayers;
