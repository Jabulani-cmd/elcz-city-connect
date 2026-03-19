import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Upload, ImageIcon, X } from "lucide-react";

const AdminProjects = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [targetAmount, setTargetAmount] = useState("");
  const [amountRaised, setAmountRaised] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPhotos } = useQuery({
    queryKey: ["admin-project-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        title,
        description,
        status,
        target_amount: parseFloat(targetAmount) || 0,
        amount_raised: parseFloat(amountRaised) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      setTitle("");
      setDescription("");
      setStatus("Planning");
      setTargetAmount("");
      setAmountRaised("");
      toast({ title: "Project added successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project-photos"] });
      toast({ title: "Project deleted" });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !uploadingFor) return;
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${uploadingFor}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(filePath, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("project-photos")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("project_photos").insert({
      project_id: uploadingFor,
      image_url: publicUrl.publicUrl,
      caption: caption || null,
    });

    if (insertError) {
      toast({ title: "Error saving photo", description: insertError.message, variant: "destructive" });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["admin-project-photos"] });
    setCaption("");
    setUploadingFor(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: "Photo uploaded successfully" });
  };

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-project-photos"] });
      toast({ title: "Photo deleted" });
    },
  });

  const getPhotosForProject = (projectId: string) =>
    allPhotos?.filter((p) => p.project_id === projectId) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Add New Project</h3>
          <Input placeholder="Project Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Target Amount" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            <Input type="number" placeholder="Amount Raised" value={amountRaised} onChange={(e) => setAmountRaised(e.target.value)} />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!title || addMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" /> Add Project
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-4">
          {projects?.map((p) => {
            const photos = getPhotosForProject(p.id);
            return (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.status}</span>
                      <h4 className="font-semibold mt-1">{p.title}</h4>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                      <p className="text-sm mt-1">
                        Raised: <strong>${Number(p.amount_raised).toLocaleString()}</strong>
                        {p.target_amount > 0 && <> / ${Number(p.target_amount).toLocaleString()}</>}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Photo upload section */}
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Project Photos ({photos.length})</span>
                    </div>

                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative group rounded-md overflow-hidden aspect-square">
                            <img
                              src={photo.image_url}
                              alt={photo.caption || "Project photo"}
                              className="w-full h-full object-cover"
                            />
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                {photo.caption}
                              </div>
                            )}
                            <button
                              onClick={() => deletePhotoMutation.mutate(photo.id)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {uploadingFor === p.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Caption (optional)"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={() => { setUploadingFor(null); setCaption(""); }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setUploadingFor(p.id)}>
                        <Upload className="h-4 w-4 mr-2" /> Add Photo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
