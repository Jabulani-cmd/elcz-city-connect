import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";

export default function SermonBuilder() {
  const [title, setTitle] = useState("");
  const [outline, setOutline] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [illustrations, setIllustrations] = useState("");
  const [scriptureRefs, setScriptureRefs] = useState<string[]>([""]);
  const [applicationPoints, setApplicationPoints] = useState<string[]>([""]);
  const [seriesId, setSeriesId] = useState("");
  const [serviceType, setServiceType] = useState("sunday_worship");
  const [datePreached, setDatePreached] = useState("");
  const [status, setStatus] = useState("draft");
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("sermon_series").select("*").order("start_date", { ascending: false }).then(({ data }) => {
      if (data) setSeriesList(data);
    });
  }, []);

  const handleSave = async () => {
    if (!title) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("sermons").insert({
      title,
      outline,
      draft_content: draftContent,
      illustrations,
      scripture_references: scriptureRefs.filter(Boolean),
      application_points: applicationPoints.filter(Boolean),
      series_id: seriesId || null,
      service_type: serviceType,
      date_preached: datePreached || null,
      status,
    });
    setSaving(false);
    if (error) { toast({ title: "Error saving", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sermon saved!" });
    setTitle(""); setOutline(""); setDraftContent(""); setIllustrations("");
    setScriptureRefs([""]); setApplicationPoints([""]); setSeriesId(""); setDatePreached("");
  };

  const updateArray = (arr: string[], i: number, val: string, setter: (a: string[]) => void) => {
    const copy = [...arr]; copy[i] = val; setter(copy);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Sermon Builder</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Sermon title" />
        </div>
        <div>
          <Label>Series</Label>
          <Select value={seriesId} onValueChange={setSeriesId}>
            <SelectTrigger><SelectValue placeholder="Select series (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No series</SelectItem>
              {seriesList.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date Preached</Label>
          <Input type="date" value={datePreached} onChange={e => setDatePreached(e.target.value)} />
        </div>
        <div>
          <Label>Service Type</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sunday_worship">Sunday Worship</SelectItem>
              <SelectItem value="wednesday_bible_study">Wednesday Bible Study</SelectItem>
              <SelectItem value="special_service">Special Service</SelectItem>
              <SelectItem value="funeral">Funeral</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scripture References */}
      <Card>
        <CardHeader><CardTitle className="text-base">Scripture References</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {scriptureRefs.map((ref, i) => (
            <div key={i} className="flex gap-2">
              <Input value={ref} onChange={e => updateArray(scriptureRefs, i, e.target.value, setScriptureRefs)} placeholder="e.g. John 3:16" />
              {scriptureRefs.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => setScriptureRefs(scriptureRefs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setScriptureRefs([...scriptureRefs, ""])}><Plus className="h-4 w-4 mr-1" /> Add Reference</Button>
        </CardContent>
      </Card>

      {/* Outline */}
      <div>
        <Label>Outline</Label>
        <Textarea value={outline} onChange={e => setOutline(e.target.value)} placeholder="Sermon outline..." rows={6} />
      </div>

      {/* Content */}
      <div>
        <Label>Draft Content</Label>
        <Textarea value={draftContent} onChange={e => setDraftContent(e.target.value)} placeholder="Full sermon content..." rows={12} />
      </div>

      {/* Illustrations */}
      <div>
        <Label>Illustrations</Label>
        <Textarea value={illustrations} onChange={e => setIllustrations(e.target.value)} placeholder="Stories, analogies..." rows={4} />
      </div>

      {/* Application Points */}
      <Card>
        <CardHeader><CardTitle className="text-base">Application Points</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {applicationPoints.map((pt, i) => (
            <div key={i} className="flex gap-2">
              <Input value={pt} onChange={e => updateArray(applicationPoints, i, e.target.value, setApplicationPoints)} placeholder="Application point" />
              {applicationPoints.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => setApplicationPoints(applicationPoints.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setApplicationPoints([...applicationPoints, ""])}><Plus className="h-4 w-4 mr-1" /> Add Point</Button>
        </CardContent>
      </Card>

      {/* Status & Save */}
      <div className="flex items-center gap-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Sermon"}
        </Button>
      </div>
    </div>
  );
}
