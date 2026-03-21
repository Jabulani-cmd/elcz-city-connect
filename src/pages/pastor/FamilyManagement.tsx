import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, UsersRound, Trash2 } from "lucide-react";

export default function FamilyManagement() {
  const [families, setFamilies] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [headId, setHeadId] = useState("");
  const [address, setAddress] = useState("");
  const [homePhone, setHomePhone] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    const [f, m] = await Promise.all([
      supabase.from("families").select("*, members!families_head_of_household_id_fkey(first_name, last_name)").order("created_at", { ascending: false }),
      supabase.from("members").select("id, first_name, last_name, family_id").order("last_name"),
    ]);
    if (f.data) setFamilies(f.data);
    if (m.data) setMembers(m.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const { error } = await supabase.from("families").insert({
      head_of_household_id: headId || null, address, home_phone: homePhone, notes,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Family created!" });
    setOpen(false); fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this family?")) return;
    await supabase.from("families").delete().eq("id", id);
    fetchData();
  };

  const getFamilyMembers = (familyId: string) => members.filter(m => m.family_id === familyId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Family Management</h2>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Family</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {families.map(f => {
          const familyMembers = getFamilyMembers(f.id);
          return (
            <Card key={f.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-primary" />
                  {f.members?.first_name} {f.members?.last_name} Family
                </CardTitle>
              </CardHeader>
              <CardContent>
                {f.address && <p className="text-sm text-muted-foreground">{f.address}</p>}
                {f.home_phone && <p className="text-sm text-muted-foreground">📞 {f.home_phone}</p>}
                <p className="text-sm mt-2">Members: {familyMembers.length}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleDelete(f.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Family</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Head of Household</Label>
              <Select value={headId} onValueChange={setHeadId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
            <div><Label>Home Phone</Label><Input value={homePhone} onChange={e => setHomePhone(e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <Button onClick={handleSave} className="w-full">Create Family</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
