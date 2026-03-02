import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Trash2, Check, X, Upload, Plus, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Video } from "lucide-react";

const AdminChoir = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [performances, setPerformances] = useState<any[]>([]);
  const [newMember, setNewMember] = useState({ first_name: "", last_name: "", phone: "", email: "", voice_part: "soprano" });
  const [newSchedule, setNewSchedule] = useState({ practice_day: "", practice_time: "", location: "", notes: "" });
  const [newPerformance, setNewPerformance] = useState({ title: "", video_url: "", caption: "" });
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const fetchMembers = async () => {
    const { data } = await supabase.from("choir_members").select("*").order("created_at", { ascending: false });
    if (data) setMembers(data);
  };

  const fetchPhotos = async () => {
    const { data } = await supabase.from("choir_photos").select("*").order("created_at", { ascending: false });
    if (data) setPhotos(data);
  };

  const fetchSchedule = async () => {
    const { data } = await supabase.from("choir_practice_schedule").select("*").order("created_at", { ascending: false });
    if (data) setSchedule(data);
  };

  const fetchPerformances = async () => {
    const { data } = await supabase.from("gallery_videos").select("*").eq("category", "choir").order("created_at", { ascending: false });
    if (data) setPerformances(data);
  };

  useEffect(() => { fetchMembers(); fetchPhotos(); fetchSchedule(); fetchPerformances(); }, []);

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from("choir_members").update({ is_approved: !current }).eq("id", id);
    fetchMembers();
    toast({ title: !current ? "Member approved" : "Member unapproved" });
  };

  const deleteMember = async (id: string) => {
    await supabase.from("choir_members").delete().eq("id", id);
    fetchMembers();
    toast({ title: "Member removed" });
  };

  const addMember = async () => {
    if (!newMember.first_name || !newMember.last_name) return;
    await supabase.from("choir_members").insert([{ ...newMember, is_approved: true }]);
    setNewMember({ first_name: "", last_name: "", phone: "", email: "", voice_part: "soprano" });
    fetchMembers();
    toast({ title: "Member added" });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGroupPhoto: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("choir-photos").upload(filePath, file);
    if (uploadError) { toast({ title: "Upload failed", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("choir-photos").getPublicUrl(filePath);
    await supabase.from("choir_photos").insert([{ image_url: urlData.publicUrl, is_group_photo: isGroupPhoto, caption: isGroupPhoto ? "Choir group photo" : "" }]);
    fetchPhotos();
    setUploading(false);
    toast({ title: "Photo uploaded" });
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("choir_photos").delete().eq("id", id);
    fetchPhotos();
    toast({ title: "Photo deleted" });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="schedule"><Clock className="h-4 w-4 mr-1" /> Practice Schedule</TabsTrigger>
          <TabsTrigger value="performances"><Video className="h-4 w-4 mr-1" /> Performances</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Add Member */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Add Choir Member</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Input placeholder="First Name" value={newMember.first_name} onChange={(e) => setNewMember({ ...newMember, first_name: e.target.value })} />
                <Input placeholder="Last Name" value={newMember.last_name} onChange={(e) => setNewMember({ ...newMember, last_name: e.target.value })} />
                <Input placeholder="Phone" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
                <Select value={newMember.voice_part} onValueChange={(v) => setNewMember({ ...newMember, voice_part: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soprano">Soprano</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="tenor">Tenor</SelectItem>
                    <SelectItem value="bass">Bass</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addMember}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card>
            <CardHeader><CardTitle className="text-lg">All Choir Members ({members.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Voice Part</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.first_name} {m.last_name}</TableCell>
                      <TableCell className="capitalize">{m.voice_part}</TableCell>
                      <TableCell>{m.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.is_approved ? "default" : "secondary"}>{m.is_approved ? "Approved" : "Pending"}</Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleApproval(m.id, m.is_approved)}>
                          {m.is_approved ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMember(m.id)}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Upload Photos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Group Photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} disabled={uploading} />
              </div>
              <div>
                <Label>Additional Photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} disabled={uploading} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="relative group">
                <img src={p.image_url} alt={p.caption || "Choir"} className="w-full h-32 object-cover rounded-lg" />
                {p.is_group_photo && <Badge className="absolute top-1 left-1">Group</Badge>}
                <Button size="sm" variant="destructive" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deletePhoto(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add Practice Session</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Day</Label>
                  <Input placeholder="e.g. Wednesday" value={newSchedule.practice_day} onChange={(e) => setNewSchedule({ ...newSchedule, practice_day: e.target.value })} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input placeholder="e.g. 5:00 PM - 7:00 PM" value={newSchedule.practice_time} onChange={(e) => setNewSchedule({ ...newSchedule, practice_time: e.target.value })} />
                </div>
                <div>
                  <Label>Location (optional)</Label>
                  <Input placeholder="e.g. Church Hall" value={newSchedule.location} onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })} />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input placeholder="e.g. Bring hymn books" value={newSchedule.notes} onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })} />
                </div>
              </div>
              <Button className="mt-3" onClick={async () => {
                if (!newSchedule.practice_day || !newSchedule.practice_time) return;
                await supabase.from("choir_practice_schedule").insert([newSchedule]);
                setNewSchedule({ practice_day: "", practice_time: "", location: "", notes: "" });
                fetchSchedule();
                toast({ title: "Practice session added" });
              }}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Current Schedule ({schedule.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.practice_day}</TableCell>
                      <TableCell>{s.practice_time}</TableCell>
                      <TableCell>{s.location || "—"}</TableCell>
                      <TableCell>{s.notes || "—"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          await supabase.from("choir_practice_schedule").delete().eq("id", s.id);
                          fetchSchedule();
                          toast({ title: "Session removed" });
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performances" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add Performance Video</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Title</Label>
                  <Input placeholder="e.g. Easter Sunday Performance" value={newPerformance.title} onChange={(e) => setNewPerformance({ ...newPerformance, title: e.target.value })} />
                </div>
                <div>
                  <Label>Caption (optional)</Label>
                  <Input placeholder="Short description" value={newPerformance.caption} onChange={(e) => setNewPerformance({ ...newPerformance, caption: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>YouTube / Facebook Video URL</Label>
                <Input placeholder="https://youtube.com/watch?v=..." value={newPerformance.video_url} onChange={(e) => setNewPerformance({ ...newPerformance, video_url: e.target.value })} />
              </div>
              <Button onClick={async () => {
                if (!newPerformance.title || !newPerformance.video_url) return;
                await supabase.from("gallery_videos").insert([{ ...newPerformance, category: "choir" }]);
                setNewPerformance({ title: "", video_url: "", caption: "" });
                fetchPerformances();
                toast({ title: "Performance video added" });
              }}><Plus className="h-4 w-4 mr-1" /> Add Video</Button>

              <div className="border-t pt-4 mt-4">
                <Label>Or Upload a Video File</Label>
                <Input type="file" accept="video/*" disabled={videoUploading} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setVideoUploading(true);
                  const filePath = `choir/${Date.now()}-${file.name}`;
                  const { error } = await supabase.storage.from("gallery-videos").upload(filePath, file);
                  if (error) { toast({ title: "Upload failed", variant: "destructive" }); setVideoUploading(false); return; }
                  const { data: urlData } = supabase.storage.from("gallery-videos").getPublicUrl(filePath);
                  const title = prompt("Enter a title for this video:") || file.name;
                  await supabase.from("gallery_videos").insert([{ title, video_url: urlData.publicUrl, category: "choir" }]);
                  fetchPerformances();
                  setVideoUploading(false);
                  toast({ title: "Video uploaded" });
                }} />
                {videoUploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Choir Performances ({performances.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Caption</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performances.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.title}</TableCell>
                      <TableCell>{v.caption || "—"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          await supabase.from("gallery_videos").delete().eq("id", v.id);
                          fetchPerformances();
                          toast({ title: "Video removed" });
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {performances.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground italic">No performance videos yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminChoir;
