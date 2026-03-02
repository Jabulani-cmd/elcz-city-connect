import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Video, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LivestreamVideo {
  id: string;
  title: string;
  video_url: string;
  video_type: string;
  event_date: string;
  description: string | null;
  is_live: boolean;
  created_at: string;
}

const AdminLivestream = () => {
  const [videos, setVideos] = useState<LivestreamVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    video_url: "",
    video_type: "youtube",
    event_date: "",
    description: "",
    is_live: false,
  });

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("livestream_videos")
      .select("*")
      .order("event_date", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const resetForm = () => {
    setForm({ title: "", video_url: "", video_type: "youtube", event_date: "", description: "", is_live: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.video_url || !form.event_date) {
      toast({ title: "Missing fields", description: "Title, URL and date are required.", variant: "destructive" });
      return;
    }

    if (editingId) {
      const { error } = await supabase.from("livestream_videos").update(form).eq("id", editingId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Updated", description: "Video updated successfully." });
      }
    } else {
      const { error } = await supabase.from("livestream_videos").insert(form);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Added", description: "Video added successfully." });
      }
    }
    resetForm();
    fetchVideos();
  };

  const handleEdit = (video: LivestreamVideo) => {
    setForm({
      title: video.title,
      video_url: video.video_url,
      video_type: video.video_type,
      event_date: video.event_date,
      description: video.description || "",
      is_live: video.is_live,
    });
    setEditingId(video.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("livestream_videos").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Video removed." });
      fetchVideos();
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-foreground">Livestream Videos</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Video
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Video" : "Add New Video"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Sunday Worship – Feb 24, 2026" />
              </div>
              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Video URL *</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={form.video_type} onValueChange={(v) => setForm({ ...form, video_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_live} onCheckedChange={(v) => setForm({ ...form, is_live: v })} />
              <Label>Currently Live</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="gap-2"><Save className="h-4 w-4" /> {editingId ? "Update" : "Save"}</Button>
              <Button variant="outline" onClick={resetForm} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {videos.length === 0 && <p className="text-muted-foreground text-sm">No livestream videos added yet.</p>}
        {videos.map((video) => (
          <Card key={video.id} className="border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.event_date} · {video.video_type}{video.is_live ? " · 🔴 LIVE" : ""}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(video)}><Edit2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(video.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminLivestream;
