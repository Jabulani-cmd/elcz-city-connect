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
import { Plus, Calendar, CheckCircle, Clock } from "lucide-react";

export default function CounselingPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionType, setSessionType] = useState("individual");
  const [notes, setNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [nextSessionDate, setNextSessionDate] = useState("");

  const fetchData = async () => {
    const [s, m] = await Promise.all([
      supabase.from("counseling_sessions").select("*, members(first_name, last_name)").order("session_date", { ascending: false }),
      supabase.from("members").select("id, first_name, last_name").order("last_name"),
    ]);
    if (s.data) setSessions(s.data);
    if (m.data) setMembers(m.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!memberId || !sessionDate) { toast({ title: "Member and date required", variant: "destructive" }); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("counseling_sessions").insert({
      member_id: memberId, counselor_id: session?.user?.id, session_date: sessionDate,
      session_type: sessionType, notes, action_items: actionItems,
      next_session_date: nextSessionDate || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Session recorded!" });
    setOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("counseling_sessions").update({ status }).eq("id", id);
    fetchData();
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Counseling Sessions</h2>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Session</Button>
      </div>

      <div className="space-y-3">
        {sessions.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">{s.members?.first_name} {s.members?.last_name}</span>
                  <Badge className={statusColors[s.status] || ""}>{s.status}</Badge>
                  <Badge variant="outline">{s.session_type}</Badge>
                </div>
                <div className="flex gap-1">
                  {s.status === "scheduled" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "completed")}><CheckCircle className="h-3 w-3 mr-1" /> Complete</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "cancelled")}>Cancel</Button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{new Date(s.session_date).toLocaleString()}</p>
              {s.notes && <p className="text-sm mt-2">{s.notes}</p>}
              {s.action_items && <p className="text-sm text-primary mt-1">📋 {s.action_items}</p>}
              {s.next_session_date && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Next: {new Date(s.next_session_date).toLocaleDateString()}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Counseling Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Session Date & Time</Label><Input type="datetime-local" value={sessionDate} onChange={e => setSessionDate(e.target.value)} /></div>
            <div>
              <Label>Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="couples">Couples</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="premarital">Pre-marital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
            <div><Label>Action Items</Label><Textarea value={actionItems} onChange={e => setActionItems(e.target.value)} rows={2} /></div>
            <div><Label>Next Session Date</Label><Input type="datetime-local" value={nextSessionDate} onChange={e => setNextSessionDate(e.target.value)} /></div>
            <Button onClick={handleSave} className="w-full">Save Session</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
