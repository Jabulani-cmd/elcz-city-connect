import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar, MapPin, Trash2, Pencil } from "lucide-react";

export default function EventManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Worship");

  const fetch = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (data) setEvents(data);
  };

  useEffect(() => { fetch(); }, []);

  const reset = () => { setTitle(""); setDescription(""); setEventDate(""); setEventTime(""); setLocation(""); setCategory("Worship"); setEditing(null); };

  const handleSave = async () => {
    if (!title || !eventDate) return;
    const payload = { title, description, event_date: eventDate, event_time: eventTime, location, category };
    const { error } = editing
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Updated!" : "Created!" }); setOpen(false); reset(); fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Event</Button>
      </div>

      <div className="space-y-3">
        {events.map(e => (
          <Card key={e.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{e.title}</h3>
                  <Badge variant="outline">{e.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{e.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>📅 {e.event_date}</span>
                  {e.event_time && <span>🕐 {e.event_time}</span>}
                  {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(e); setTitle(e.title); setDescription(e.description || ""); setEventDate(e.event_date); setEventTime(e.event_time || ""); setLocation(e.location || ""); setCategory(e.category); setOpen(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(e.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
              <div><Label>Time</Label><Input value={eventTime} onChange={e => setEventTime(e.target.value)} placeholder="e.g. 10:00 AM" /></div>
            </div>
            <div><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Worship">Worship</SelectItem>
                  <SelectItem value="Youth">Youth</SelectItem>
                  <SelectItem value="Outreach">Outreach</SelectItem>
                  <SelectItem value="Fellowship">Fellowship</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
