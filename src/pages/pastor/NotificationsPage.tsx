import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Bell, CheckCircle, Circle } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [link, setLink] = useState("");

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("notifications").select("*").order("sent_at", { ascending: false }).limit(100);
    if (data) setNotifications(data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSend = async () => {
    if (!title) return;
    const { error } = await supabase.from("notifications").insert({
      title, message, type, link: link || null, user_id: null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Notification sent!" }); setOpen(false); setTitle(""); setMessage(""); setLink(""); fetchData();
  };

  const typeColors: Record<string, string> = {
    info: "text-blue-500", warning: "text-amber-500", success: "text-green-500", urgent: "text-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Notification</Button>
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
            <CardContent className="p-4 flex items-start gap-3">
              <Bell className={`h-4 w-4 mt-0.5 ${typeColors[n.type] || "text-muted-foreground"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{n.title}</span>
                  <Badge variant="outline" className="text-xs">{n.type}</Badge>
                  {n.is_read ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Circle className="h-3 w-3 text-muted-foreground" />}
                </div>
                {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.sent_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && <p className="text-center text-muted-foreground py-8">No notifications yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} /></div>
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Link (optional)</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="/pastor/events" /></div>
            <Button onClick={handleSend} className="w-full">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
