import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

export default function MinistryTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const fetch = async () => {
    const { data } = await supabase.from("ministry_teams").select("*").order("name");
    if (data) setTeams(data);
  };

  useEffect(() => { fetch(); }, []);

  const reset = () => { setName(""); setDescription(""); setColor("#3B82F6"); setEditing(null); };

  const handleSave = async () => {
    if (!name) return;
    const payload = { name, description, color };
    const { error } = editing
      ? await supabase.from("ministry_teams").update(payload).eq("id", editing.id)
      : await supabase.from("ministry_teams").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Updated!" : "Created!" });
    setOpen(false); reset(); fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    await supabase.from("ministry_teams").delete().eq("id", id);
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ministry Teams</h2>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Team</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(t => (
          <Card key={t.id} className="border-l-4" style={{ borderLeftColor: t.color }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: t.color }} />
                {t.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.description || "No description"}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => { setEditing(t); setName(t.name); setDescription(t.description || ""); setColor(t.color); setOpen(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Team" : "New Team"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><Label>Color</Label><Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-20" /></div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
