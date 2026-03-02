import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Trash2, Upload } from "lucide-react";

const ministries = ["youth", "men", "women", "sunday_school", "choir"];

const AdminMinistryPhotos = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState("youth");
  const [uploading, setUploading] = useState(false);

  const fetchPhotos = async () => {
    const { data } = await supabase.from("ministry_photos").select("*").order("created_at", { ascending: false });
    if (data) setPhotos(data);
  };

  useEffect(() => { fetchPhotos(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `${selectedMinistry}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("ministry-photos").upload(filePath, file);
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("ministry-photos").getPublicUrl(filePath);
    await supabase.from("ministry_photos").insert([{ ministry: selectedMinistry, image_url: urlData.publicUrl }]);
    fetchPhotos();
    setUploading(false);
    toast({ title: "Photo uploaded" });
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("ministry_photos").delete().eq("id", id);
    fetchPhotos();
    toast({ title: "Photo deleted" });
  };

  const filtered = photos.filter(p => p.ministry === selectedMinistry);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Ministry Photos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Ministry</Label>
              <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="youth">Youth League</SelectItem>
                  <SelectItem value="men">Men's League</SelectItem>
                  <SelectItem value="women">Women's League</SelectItem>
                  <SelectItem value="sunday_school">Sunday School</SelectItem>
                  <SelectItem value="choir">Choir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Upload Photo</Label>
              <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="relative group">
            <img src={p.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
            <Button size="sm" variant="destructive" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deletePhoto(p.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-muted-foreground text-sm italic">No photos for this ministry yet.</p>}
      </div>
    </div>
  );
};

export default AdminMinistryPhotos;
