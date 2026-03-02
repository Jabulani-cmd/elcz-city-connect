import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const categories = ["worship", "fellowship", "outreach", "league", "choir", "general"];

interface Photo {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  category: string;
  created_at: string;
}

const AdminGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPhotos = async () => {
    const { data } = await supabase.from("gallery_photos").select("*").order("created_at", { ascending: false });
    if (data) setPhotos(data as Photo[]);
  };

  useEffect(() => { fetchPhotos(); }, []);

  const resetForm = () => {
    setTitle("");
    setCaption("");
    setCategory("general");
    setFile(null);
    setEditing(null);
  };

  const openEdit = (photo: Photo) => {
    setEditing(photo);
    setTitle(photo.title);
    setCaption(photo.caption || "");
    setCategory(photo.category);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = editing?.image_url || "";

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      if (!image_url) {
        toast({ title: "Please select an image", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (editing) {
        const { error } = await supabase.from("gallery_photos").update({ title, caption, category, ...(file ? { image_url } : {}) }).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Photo updated" });
      } else {
        const { error } = await supabase.from("gallery_photos").insert({ title, caption, category, image_url });
        if (error) throw error;
        toast({ title: "Photo added" });
      }

      setOpen(false);
      resetForm();
      fetchPhotos();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Delete this photo?")) return;
    const { error } = await supabase.from("gallery_photos").delete().eq("id", photo.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Photo deleted" });
      fetchPhotos();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Gallery Management</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Photo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Photo" : "Add Photo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <Label>Caption</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Image {editing ? "(leave empty to keep current)" : ""}</Label>
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required={!editing} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editing ? "Update" : "Add Photo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No photos yet. Add your first photo!</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <img src={photo.image_url} alt={photo.title} className="aspect-square object-cover w-full" />
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{photo.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{photo.category}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(photo)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(photo)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
