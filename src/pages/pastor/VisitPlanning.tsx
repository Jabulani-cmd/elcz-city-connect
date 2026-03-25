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
import { Plus, MapPin, CheckCircle, Clock, User } from "lucide-react";

export default function VisitPlanning() {
  const [notes, setNotes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [noteType, setNoteType] = useState("visit");
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const fetchData = async () => {
    let q = supabase.from("pastoral_notes").select("*, members(first_name, last_name)")
      .in("note_type", ["visit", "hospital", "bereavement"])
      .order("follow_up_date", { ascending: true });
    
    const today = new Date().toISOString().split("T")[0];
    if (filter === "upcoming") q = q.gte("follow_up_date", today);
    if (filter === "past") q = q.lt("follow_up_date", today);

    const [notesRes, membersRes] = await Promise.all([
      q,
      supabase.from("members").select("id, first_name, last_name, address").order("last_name"),
    ]);
    if (notesRes.data) setNotes(notesRes.data);
    if (membersRes.data) setMembers(membersRes.data);
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleSave = async () => {
    if (!content || !memberId) { toast({ title: "Member and details required", variant: "destructive" }); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("pastoral_notes").insert({
      member_id: memberId, author_id: session?.user?.id, note_type: noteType,
      title, content, follow_up_date: followUpDate || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Visit planned!" });
    setOpen(false); setContent(""); setTitle(""); setFollowUpDate(""); fetchData();
  };

  const markComplete = async (id: string) => {
    await supabase.from("pastoral_notes").update({ follow_up_date: null, tags: ["completed"] }).eq("id", id);
    toast({ title: "Visit marked complete" }); fetchData();
  };

  const visitTypes: Record<string, string> = { visit: "Home Visit", hospital: "Hospital Visit", bereavement: "Bereavement" };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Visit Planning</h2>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Plan Visit</Button>
      </div>

      <div className="flex gap-2">
        {(["upcoming", "past", "all"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {notes.map(n => (
          <Card key={n.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{n.members?.first_name} {n.members?.last_name}</span>
                  <Badge variant="outline">{visitTypes[n.note_type] || n.note_type}</Badge>
                </div>
                {n.title && <p className="text-sm font-medium">{n.title}</p>}
                <p className="text-sm text-muted-foreground">{n.content}</p>
                {n.follow_up_date && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(n.follow_up_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              {n.follow_up_date && (
                <Button size="sm" variant="outline" onClick={() => markComplete(n.id)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Done
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && <p className="text-center text-muted-foreground py-8">No visits found.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Plan Visit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visit Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(visitTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Purpose</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Check on family" /></div>
            <div><Label>Details</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={3} /></div>
            <div><Label>Visit Date</Label><Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} /></div>
            <Button onClick={handleSave} className="w-full">Schedule Visit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
