import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Music, BookOpen, MoveUp, MoveDown, FileText } from "lucide-react";

export default function ServicePlanBuilder() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [open, setOpen] = useState(false);
  const [elementType, setElementType] = useState("song");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [songId, setSongId] = useState("");
  const [duration, setDuration] = useState("5");

  const fetchData = async () => {
    const [s, p, so] = await Promise.all([
      supabase.from("service_schedules").select("*").order("service_date", { ascending: false }).limit(20),
      supabase.from("service_plans").select("*, song_library(title, artist, key)").order("sort_order"),
      supabase.from("song_library").select("id, title, artist, key").order("title"),
    ]);
    if (s.data) setSchedules(s.data);
    if (p.data) setPlans(p.data);
    if (so.data) setSongs(so.data);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredPlans = selectedSchedule ? plans.filter(p => p.schedule_id === selectedSchedule) : [];
  const totalDuration = filteredPlans.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);

  const handleAdd = async () => {
    if (!selectedSchedule) return;
    const maxOrder = filteredPlans.length > 0 ? Math.max(...filteredPlans.map(p => p.sort_order)) + 1 : 0;
    const { error } = await supabase.from("service_plans").insert({
      schedule_id: selectedSchedule, element_type: elementType,
      title: elementType === "song" ? null : title, notes,
      song_id: elementType === "song" && songId ? songId : null,
      duration_minutes: Number(duration) || 5, sort_order: maxOrder,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Element added!" }); setOpen(false); setTitle(""); setNotes(""); setSongId(""); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("service_plans").delete().eq("id", id);
    fetchData();
  };

  const moveItem = async (id: string, direction: "up" | "down") => {
    const idx = filteredPlans.findIndex(p => p.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filteredPlans.length) return;
    const a = filteredPlans[idx], b = filteredPlans[swapIdx];
    await Promise.all([
      supabase.from("service_plans").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("service_plans").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    fetchData();
  };

  const elementTypes: Record<string, { label: string; icon: typeof Music }> = {
    song: { label: "Song", icon: Music },
    prayer: { label: "Prayer", icon: BookOpen },
    scripture: { label: "Scripture Reading", icon: BookOpen },
    sermon: { label: "Sermon", icon: FileText },
    announcement: { label: "Announcement", icon: FileText },
    other: { label: "Other", icon: FileText },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Service Plan Builder</h2>
        <Button onClick={() => setOpen(true)} disabled={!selectedSchedule}><Plus className="h-4 w-4 mr-1" /> Add Element</Button>
      </div>

      <div>
        <Label>Select Service</Label>
        <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
          <SelectTrigger><SelectValue placeholder="Choose a service schedule" /></SelectTrigger>
          <SelectContent>
            {schedules.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {new Date(s.service_date).toLocaleDateString()} — {s.service_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSchedule && (
        <>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{filteredPlans.length} elements</Badge>
            <Badge variant="outline">~{totalDuration} min total</Badge>
          </div>

          <div className="space-y-2">
            {filteredPlans.map((p, idx) => {
              const type = elementTypes[p.element_type] || elementTypes.other;
              const Icon = type.icon;
              return (
                <Card key={p.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveItem(p.id, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><MoveUp className="h-3 w-3" /></button>
                      <button onClick={() => moveItem(p.id, "down")} disabled={idx === filteredPlans.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><MoveDown className="h-3 w-3" /></button>
                    </div>
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.song_library ? `${p.song_library.title} (${p.song_library.key || "?"})` : p.title || type.label}
                      </p>
                      {p.notes && <p className="text-xs text-muted-foreground truncate">{p.notes}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">{p.duration_minutes}m</Badge>
                    <Badge variant="secondary" className="text-xs">{type.label}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </CardContent>
                </Card>
              );
            })}
            {filteredPlans.length === 0 && <p className="text-center text-muted-foreground py-8">No elements yet. Add elements to build the service plan.</p>}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Service Element</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Element Type</Label>
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(elementTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {elementType === "song" ? (
              <div>
                <Label>Song</Label>
                <Select value={songId} onValueChange={setSongId}>
                  <SelectTrigger><SelectValue placeholder="Select song" /></SelectTrigger>
                  <SelectContent>
                    {songs.map(s => <SelectItem key={s.id} value={s.id}>{s.title} {s.key ? `(${s.key})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            )}
            <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
            <div><Label>Duration (minutes)</Label><Input type="number" value={duration} onChange={e => setDuration(e.target.value)} /></div>
            <Button onClick={handleAdd} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
