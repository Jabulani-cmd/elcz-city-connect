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
import { Plus, Heart, Clock, User } from "lucide-react";

export default function CareDashboard() {
  const [notes, setNotes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);

  const fetchData = async () => {
    const [notesRes, membersRes] = await Promise.all([
      supabase.from("pastoral_notes").select("*, members(first_name, last_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("members").select("id, first_name, last_name").order("last_name"),
    ]);
    if (notesRes.data) setNotes(notesRes.data);
    if (membersRes.data) setMembers(membersRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!content || !memberId) { toast({ title: "Member and content required", variant: "destructive" }); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("pastoral_notes").insert({
      member_id: memberId, author_id: session?.user?.id, note_type: noteType,
      title, content, follow_up_date: followUpDate || null, is_confidential: isConfidential,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Note added!" });
    setOpen(false); setContent(""); setTitle(""); setFollowUpDate(""); fetchData();
  };

  const noteTypes: Record<string, string> = {
    general: "General", visit: "Visit", phone_call: "Phone Call",
    hospital: "Hospital Visit", bereavement: "Bereavement", counseling: "Counseling",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pastoral Care Dashboard</h2>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Note</Button>
      </div>

      {/* Follow-up needed */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /> Pending Follow-ups</CardTitle></CardHeader>
        <CardContent>
          {notes.filter(n => n.follow_up_date && new Date(n.follow_up_date) >= new Date()).length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending follow-ups</p>
          ) : (
            <div className="space-y-2">
              {notes.filter(n => n.follow_up_date).map(n => (
                <div key={n.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{n.members?.first_name} {n.members?.last_name}</span>
                  <Badge variant="outline">{noteTypes[n.note_type] || n.note_type}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{n.follow_up_date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent notes */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Notes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notes.slice(0, 20).map(n => (
            <div key={n.id} className="border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-rose-400" />
                <span className="font-medium text-sm">{n.members?.first_name} {n.members?.last_name}</span>
                <Badge variant="outline" className="text-xs">{noteTypes[n.note_type] || n.note_type}</Badge>
                {n.is_confidential && <Badge variant="destructive" className="text-xs">Confidential</Badge>}
              </div>
              {n.title && <p className="text-sm font-medium">{n.title}</p>}
              <p className="text-sm text-muted-foreground">{n.content}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Pastoral Note</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(noteTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title (optional)</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} /></div>
            <div><Label>Follow-up Date</Label><Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isConfidential} onChange={e => setIsConfidential(e.target.checked)} id="confidential" />
              <Label htmlFor="confidential">Confidential</Label>
            </div>
            <Button onClick={handleSave} className="w-full">Save Note</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
