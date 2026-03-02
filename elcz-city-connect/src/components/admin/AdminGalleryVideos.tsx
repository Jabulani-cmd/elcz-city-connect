import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Video, Upload } from "lucide-react";

const categories = ["worship", "fellowship", "outreach", "league", "general"];

interface GalleryVideo {
  id: string;
  title: string;
  caption: string | null;
  video_url: string;
  category: string;
}

const AdminGalleryVideos = () => {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryVideo | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchVideos = async () => {
    const { data } = await supabase.from("gallery_videos").select("*").order("created_at", { ascending: false });
    if (data) setVideos(data as GalleryVideo[]);
  };

  useEffect(() => { fetchVideos(); }, []);

  const resetForm = () => {
    setTitle(""); setCaption(""); setVideoUrl(""); setCategory("general");
    setEditing(null); setUploadMode("url"); setVideoFile(null); setUploadProgress(0);
  };

  const openEdit = (v: GalleryVideo) => {
    setEditing(v); setTitle(v.title); setCaption(v.caption || ""); setVideoUrl(v.video_url);
    setCategory(v.category); setUploadMode("url"); setOpen(true);
  };

  const uploadVideoFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    setUploadProgress(10);
    const { error } = await supabase.storage.from("gallery-videos").upload(filePath, file);
    if (error) throw error;
    setUploadProgress(90);

    const { data: urlData } = supabase.storage.from("gallery-videos").getPublicUrl(filePath);
    setUploadProgress(100);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalUrl = videoUrl;

      if (uploadMode === "file" && videoFile) {
        finalUrl = await uploadVideoFile(videoFile);
      }

      if (!finalUrl) {
        toast({ title: "Error", description: "Please provide a video URL or upload a file.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (editing) {
        const { error } = await supabase.from("gallery_videos").update({ title, caption, video_url: finalUrl, category }).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Video updated" });
      } else {
        const { error } = await supabase.from("gallery_videos").insert({ title, caption, video_url: finalUrl, category });
        if (error) throw error;
        toast({ title: "Video added" });
      }
      setOpen(false); resetForm(); fetchVideos();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from("gallery_videos").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Video deleted" }); fetchVideos(); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Gallery Videos</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Video</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Video" : "Add Video"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
              <div><Label>Caption</Label><Input value={caption} onChange={(e) => setCaption(e.target.value)} /></div>

              {/* Upload mode toggle */}
              <div>
                <Label className="mb-2 block">Video Source</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === "url" ? "default" : "outline"}
                    onClick={() => setUploadMode("url")}
                  >
                    <Video className="h-4 w-4 mr-1" /> Paste URL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={uploadMode === "file" ? "default" : "outline"}
                    onClick={() => setUploadMode("file")}
                  >
                    <Upload className="h-4 w-4 mr-1" /> Upload File
                  </Button>
                </div>
              </div>

              {uploadMode === "url" ? (
                <div>
                  <Label>Video URL (YouTube, Facebook, etc.)</Label>
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required={uploadMode === "url"} placeholder="https://youtube.com/watch?v=..." />
                </div>
              ) : (
                <div>
                  <Label>Browse Video File</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    required={uploadMode === "file" && !editing}
                  />
                  {videoFile && <p className="text-xs text-muted-foreground mt-1">Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</p>}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (uploadMode === "file" ? "Uploading..." : "Saving...") : editing ? "Update" : "Add Video"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {videos.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No gallery videos yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-primary" />
                  <p className="font-medium text-sm truncate">{v.title}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">{v.video_url}</p>
                <p className="text-xs text-muted-foreground capitalize">{v.category}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(v)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(v.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGalleryVideos;
