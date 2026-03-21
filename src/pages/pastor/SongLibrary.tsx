import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Music, Trash2, Search, Pencil } from "lucide-react";

export default function SongLibrary() {
  const [songs, setSongs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [search, setSearch] = useState("");

  const fetch = async () => {
    const { data } = await supabase.from("song_library").select("*").order("title");
    if (data) setSongs(data);
  };

  useEffect(() => { fetch(); }, []);

  const reset = () => { setTitle(""); setArtist(""); setKey(""); setLyrics(""); setEditing(null); };

  const handleSave = async () => {
    if (!title) return;
    const payload = { title, artist, key, lyrics };
    const { error } = editing
      ? await supabase.from("song_library").update(payload).eq("id", editing.id)
      : await supabase.from("song_library").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Updated!" : "Added!" }); setOpen(false); reset(); fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this song?")) return;
    await supabase.from("song_library").delete().eq("id", id);
    fetch();
  };

  const filtered = songs.filter(s =>
    `${s.title} ${s.artist || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Song Library</h2>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Song</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search songs..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Music className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.artist || "Unknown"}</p>
                </div>
                {s.key && <Badge variant="outline">{s.key}</Badge>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setTitle(s.title); setArtist(s.artist || ""); setKey(s.key || ""); setLyrics(s.lyrics || ""); setOpen(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Song" : "Add Song"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Artist</Label><Input value={artist} onChange={e => setArtist(e.target.value)} /></div>
            <div><Label>Key</Label><Input value={key} onChange={e => setKey(e.target.value)} placeholder="e.g. G, Am, D" /></div>
            <div><Label>Lyrics</Label><Textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={8} /></div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Add Song"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
