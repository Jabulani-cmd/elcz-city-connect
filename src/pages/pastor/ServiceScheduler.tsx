import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Clock, Calendar, Trash2, Users } from "lucide-react";

export default function ServiceScheduler() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [schedOpen, setSchedOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [serviceDate, setServiceDate] = useState("");
  const [serviceTime, setServiceTime] = useState("10:00");
  const [serviceType, setServiceType] = useState("sunday_worship");
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [assignRole, setAssignRole] = useState("");

  const fetchData = async () => {
    const [s, a, t, m] = await Promise.all([
      supabase.from("service_schedules").select("*").order("service_date", { ascending: false }).limit(50),
      supabase.from("schedule_assignments").select("*, members(first_name, last_name), ministry_teams(name, color)").order("created_at", { ascending: false }),
      supabase.from("ministry_teams").select("*").order("name"),
      supabase.from("members").select("id, first_name, last_name").order("last_name"),
    ]);
    if (s.data) setSchedules(s.data);
    if (a.data) setAssignments(a.data);
    if (t.data) setTeams(t.data);
    if (m.data) setMembers(m.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateSchedule = async () => {
    if (!serviceDate) return;
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("service_schedules").insert({
      service_date: serviceDate, service_time: serviceTime, service_type: serviceType,
      created_by: session?.user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Schedule created!" }); setSchedOpen(false); setServiceDate(""); fetchData();
  };

  const handleAssign = async () => {
    if (!selectedSchedule || !selectedMember) return;
    const { error } = await supabase.from("schedule_assignments").insert({
      schedule_id: selectedSchedule, member_id: selectedMember,
      team_id: selectedTeam || null, role: assignRole || "Volunteer",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Assigned!" }); setAssignOpen(false); fetchData();
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    await supabase.from("service_schedules").delete().eq("id", id);
    fetchData();
  };

  const deleteAssignment = async (id: string) => {
    await supabase.from("schedule_assignments").delete().eq("id", id);
    fetchData();
  };

  const serviceTypes: Record<string, string> = {
    sunday_worship: "Sunday Worship", evening_service: "Evening Service",
    midweek: "Midweek Service", special: "Special Service",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Service Scheduler</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignOpen(true)}><Users className="h-4 w-4 mr-1" /> Assign</Button>
          <Button onClick={() => setSchedOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Schedule</Button>
        </div>
      </div>

      <div className="space-y-4">
        {schedules.map(s => {
          const schedAssignments = assignments.filter(a => a.schedule_id === s.id);
          return (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(s.service_date).toLocaleDateString()} — {serviceTypes[s.service_type] || s.service_type}
                    {s.service_time && <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{s.service_time}</Badge>}
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => deleteSchedule(s.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {schedAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {schedAssignments.map(a => (
                      <Badge key={a.id} variant="secondary" className="gap-1 pr-1">
                        {a.members?.first_name} {a.members?.last_name} ({a.role})
                        <button onClick={() => deleteAssignment(a.id)} className="ml-1 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {schedules.length === 0 && <p className="text-center text-muted-foreground py-8">No schedules created yet.</p>}
      </div>

      <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Service Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Date</Label><Input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} /></div>
            <div><Label>Time</Label><Input value={serviceTime} onChange={e => setServiceTime(e.target.value)} placeholder="e.g. 10:00" /></div>
            <div>
              <Label>Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(serviceTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateSchedule} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign to Service</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service</Label>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {schedules.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {new Date(s.service_date).toLocaleDateString()} — {serviceTypes[s.service_type] || s.service_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team (optional)</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Role</Label><Input value={assignRole} onChange={e => setAssignRole(e.target.value)} placeholder="e.g. Usher, Reader" /></div>
            <Button onClick={handleAssign} className="w-full">Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
