import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface CarouselImage {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const AdminCarousel = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [open, setOpen] = useState(false);
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    const { data } = await supabase
      .from("carousel_images")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setImages(data as CarouselImage[]);
  };

  useEffect(() => { fetchImages(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `carousel/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);

      const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.sort_order)) + 1 : 0;

      const { error } = await supabase.from("carousel_images").insert({
        image_url: urlData.publicUrl,
        alt_text: altText || "Church image",
        sort_order: maxOrder,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Carousel image added" });
      setOpen(false);
      setAltText("");
      setFile(null);
      fetchImages();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this carousel image?")) return;
    const { error } = await supabase.from("carousel_images").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Image removed" }); fetchImages(); }
  };

  const toggleActive = async (img: CarouselImage) => {
    const { error } = await supabase.from("carousel_images").update({ is_active: !img.is_active }).eq("id", img.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchImages();
  };

  const moveOrder = async (img: CarouselImage, direction: "up" | "down") => {
    const idx = images.findIndex(i => i.id === img.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= images.length) return;

    const other = images[swapIdx];
    await Promise.all([
      supabase.from("carousel_images").update({ sort_order: other.sort_order }).eq("id", img.id),
      supabase.from("carousel_images").update({ sort_order: img.sort_order }).eq("id", other.id),
    ]);
    fetchImages();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Carousel Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Image</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Carousel Image</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Alt Text</Label>
                <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image" />
              </div>
              <div>
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !file}>
                {loading ? "Uploading..." : "Add Image"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No carousel images. The default images will be used. Add images to customize the hero carousel.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <Card key={img.id} className={`overflow-hidden ${!img.is_active ? "opacity-50" : ""}`}>
              <img src={img.image_url} alt={img.alt_text} className="aspect-video object-cover w-full" />
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium truncate">{img.alt_text}</p>
                <div className="flex items-center gap-2">
                  <Switch checked={img.is_active} onCheckedChange={() => toggleActive(img)} />
                  <span className="text-xs text-muted-foreground">{img.is_active ? "Active" : "Hidden"}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => moveOrder(img, "up")} disabled={idx === 0}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveOrder(img, "down")} disabled={idx === images.length - 1}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(img.id)}>
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

export default AdminCarousel;
