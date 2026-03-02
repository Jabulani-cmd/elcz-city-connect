import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Crop } from "lucide-react";
import Cropper, { Area } from "react-easy-crop";

const leaders = [
  "Rev. M. Ndlovu",
  "Mrs. P. Ngwenya",
  "Mr. P. Ndou",
  "Mrs. T. Dube",
  "Mrs. T. Ncube",
  "Mr. L. Jamela",
  "Mrs. S. Jamela",
  "Miss M. Mangena",
];

interface LeaderPhoto {
  name: string;
  fileName: string;
  url: string;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    if (!url.startsWith("data:")) {
      image.setAttribute("crossOrigin", "anonymous");
    }
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
  });
}

const AdminLeaderPhotos = () => {
  const [photos, setPhotos] = useState<LeaderPhoto[]>([]);
  const [selectedLeader, setSelectedLeader] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const fetchPhotos = async () => {
    const { data } = await supabase.storage.from("leader-photos").list();
    if (data) {
      const items: LeaderPhoto[] = data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => {
          const name = f.name.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
          const { data: urlData } = supabase.storage.from("leader-photos").getPublicUrl(f.name);
          return { name, fileName: f.name, url: `${urlData.publicUrl}?t=${Date.now()}` };
        });
      setPhotos(items);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(selected);
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !selectedLeader) {
      toast({ title: "Please select a leader first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setCropDialogOpen(false);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `${selectedLeader.replace(/\s+/g, "-").replace(/\./g, "")}.jpeg`;

      const existing = photos.find((p) => p.name.toLowerCase() === selectedLeader.toLowerCase());
      if (existing) {
        await supabase.storage.from("leader-photos").remove([existing.fileName]);
      }

      const { error } = await supabase.storage.from("leader-photos").upload(fileName, croppedBlob, {
        upsert: true,
        contentType: "image/jpeg",
      });
      if (error) throw error;

      toast({ title: "Photo uploaded successfully" });
      setFile(null);
      setImageSrc(null);
      setSelectedLeader("");
      fetchPhotos();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadWithoutCrop = async () => {
    if (!selectedLeader || !file) {
      toast({ title: "Please select a leader and an image", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${selectedLeader.replace(/\s+/g, "-").replace(/\./g, "")}.${ext}`;
      const existing = photos.find((p) => p.name.toLowerCase() === selectedLeader.toLowerCase());
      if (existing) {
        await supabase.storage.from("leader-photos").remove([existing.fileName]);
      }
      const { error } = await supabase.storage.from("leader-photos").upload(fileName, file, { upsert: true });
      if (error) throw error;
      toast({ title: "Photo uploaded successfully" });
      setFile(null);
      setImageSrc(null);
      setSelectedLeader("");
      fetchPhotos();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photo: LeaderPhoto) => {
    if (!confirm(`Remove photo for ${photo.name}?`)) return;
    const { error } = await supabase.storage.from("leader-photos").remove([photo.fileName]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Photo removed" });
      fetchPhotos();
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">Leader Photos</h2>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Select Leader</Label>
            <Select value={selectedLeader} onValueChange={setSelectedLeader}>
              <SelectTrigger><SelectValue placeholder="Choose a leader..." /></SelectTrigger>
              <SelectContent>
                {leaders.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Photo (selecting opens crop tool)</Label>
            <Input type="file" accept="image/*" onChange={handleFileSelect} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => imageSrc && setCropDialogOpen(true)} disabled={!imageSrc || !selectedLeader} variant="outline">
              <Crop className="h-4 w-4 mr-2" /> Re-crop
            </Button>
            <Button onClick={handleUploadWithoutCrop} disabled={loading || !selectedLeader || !file} variant="secondary">
              <Upload className="h-4 w-4 mr-2" /> Upload Original
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Photo</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-72 bg-muted rounded-md overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Label className="shrink-0 text-sm">Zoom</Label>
            <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCropConfirm} disabled={loading || !selectedLeader}>
              {loading ? "Uploading..." : "Crop & Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.fileName} className="overflow-hidden">
            <CardContent className="p-4 text-center">
              <Avatar className="w-24 h-24 mx-auto mb-3">
                <AvatarImage src={photo.url} alt={photo.name} />
                <AvatarFallback>{photo.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm text-foreground capitalize">{photo.name}</p>
              <Button size="sm" variant="destructive" className="mt-2" onClick={() => handleDelete(photo)}>
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </CardContent>
          </Card>
        ))}
        {photos.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">No leader photos uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminLeaderPhotos;
