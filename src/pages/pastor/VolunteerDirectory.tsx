import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, UserCheck, Search } from "lucide-react";

export default function VolunteerDirectory() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState("member");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    const [a, t, m] = await Promise.all([
      supabase.from("volunteer_assignments").select("*, members(first_name, last_name), ministry_teams(name, color)").order("created_at", { ascending: false }),
      supabase.from("ministry_teams").select("*").order("name"),
      supabase.from("members").select("id, first_name, last_name").order("last_name"),
    ]);
    if (a.data) setAssignments(a.data);
    if (t.data) setTeams(t.data);
    if (m.data) setMembers(m.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!memberId || !teamId) return;
    const { error } = await supabase.from("volunteer_assignments").insert({ member_id: memberId, team_id: teamId, role });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Volunteer assigned!" }); setOpen(false); fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("volunteer_assignments").delete().eq("id", id);
    fetchData();
  };

  const filtered = assignments.filter(a =>
    `${a.members?.first_name} ${a.members?.last_name} ${a.ministry_teams?.name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Volunteer Directory</h2>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Assign Volunteer</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{a.members?.first_name} {a.members?.last_name}</span>
                <Badge style={{ backgroundColor: a.ministry_teams?.color + "20", color: a.ministry_teams?.color }}>{a.ministry_teams?.name}</Badge>
                <Badge variant="outline">{a.role}</Badge>
                <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Volunteer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Role</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Leader, Member" /></div>
            <Button onClick={handleSave} className="w-full">Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
