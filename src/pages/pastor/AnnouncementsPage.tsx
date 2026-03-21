import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Megaphone, Pencil, Trash2 } from "lucide-react";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  };

  useEffect(() => { fetch(); }, []);

  const reset = () => { setTitle(""); setContent(""); setPublished(false); setEditing(null); };

  const handleSave = async () => {
    if (!title || !content) return;
    const payload = { title, content, published };
    const { error } = editing
      ? await supabase.from("announcements").update(payload).eq("id", editing.id)
      : await supabase.from("announcements").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Updated!" : "Created!" }); setOpen(false); reset(); fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements</h2>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New</Button>
      </div>

      <div className="space-y-3">
        {announcements.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{a.title}</h3>
                  <Badge variant={a.published ? "default" : "secondary"}>{a.published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setTitle(a.title); setContent(a.content); setPublished(a.published); setOpen(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label>Published</Label>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
