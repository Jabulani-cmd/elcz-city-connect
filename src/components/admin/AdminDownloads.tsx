import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, Loader2 } from "lucide-react";
import { languageNames, type Language } from "@/contexts/LanguageContext";

const categories = [
  { value: "hymn_book", label: "Hymn Book" },
  { value: "bible", label: "Bible" },
  { value: "minutes", label: "Minutes of Meetings" },
  { value: "church_documents", label: "Church Documents" },
  { value: "other", label: "Other" },
];

const AdminDownloads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [category, setCategory] = useState("hymn_book");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["admin-downloadable-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("downloadable_resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("downloadable_resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-downloadable-resources"] });
      toast({ title: "Resource deleted" });
    },
    onError: () => toast({ title: "Error deleting resource", variant: "destructive" }),
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({ title: "Please provide a title and file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${language}/${category}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("downloads")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("downloads").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("downloadable_resources").insert({
        title: title.trim(),
        description: description.trim() || null,
        language,
        category,
        file_url: urlData.publicUrl,
        file_size_bytes: file.size,
      });
      if (insertError) throw insertError;

      setTitle("");
      setDescription("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-downloadable-resources"] });
      toast({ title: "Resource uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Resource</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lutheran Hymn Book" />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(languageNames) as [Language, string][]).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File (PDF)</Label>
              <Input type="file" accept=".pdf,.epub,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the resource" />
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload Resource
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Resources</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : resources.length === 0 ? (
            <p className="text-muted-foreground">No resources uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{languageNames[r.language as Language] || r.language}</TableCell>
                    <TableCell className="capitalize">{r.category?.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDownloads;
