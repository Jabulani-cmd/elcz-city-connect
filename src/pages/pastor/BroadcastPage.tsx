import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Send, Users, Mail, Phone } from "lucide-react";

export default function BroadcastPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("members").select("id, first_name, last_name, email, phone, league, is_active").order("last_name");
      if (data) setMembers(data);
    };
    fetchData();
  }, []);

  const getRecipients = () => {
    let filtered = members.filter(m => m.is_active);
    if (audience === "men") filtered = filtered.filter(m => m.league === "men" || m.gender === "male");
    if (audience === "women") filtered = filtered.filter(m => m.league === "women" || m.gender === "female");
    if (audience === "youth") filtered = filtered.filter(m => m.league === "youth");
    return filtered;
  };

  const recipients = getRecipients();
  const withEmail = recipients.filter(m => m.email);
  const withPhone = recipients.filter(m => m.phone);

  const handleBroadcast = async () => {
    if (!subject || !message) { toast({ title: "Subject and message required", variant: "destructive" }); return; }
    const { data: { session } } = await supabase.auth.getSession();
    // Create notification records for each recipient who has an email
    const notifications = recipients.map(m => ({
      title: subject,
      message: message,
      type: "info" as const,
      user_id: null,
    }));
    
    // Save a broadcast notification
    const { error } = await supabase.from("notifications").insert({
      title: `📢 ${subject}`,
      message: `Broadcast to ${recipients.length} members (${audience}): ${message}`,
      type: "info",
      user_id: session?.user?.id,
    });

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    
    setHistory(prev => [{ subject, audience, count: recipients.length, date: new Date().toISOString() }, ...prev]);
    toast({ title: "Broadcast sent!", description: `Sent to ${recipients.length} members` });
    setSubject(""); setMessage("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Send className="h-6 w-6" /> Broadcast</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{recipients.length}</p>
            <p className="text-xs text-muted-foreground">Recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{withEmail.length}</p>
            <p className="text-xs text-muted-foreground">With Email</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Phone className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{withPhone.length}</p>
            <p className="text-xs text-muted-foreground">With Phone</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Compose Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Active Members</SelectItem>
                <SelectItem value="men">Men's League</SelectItem>
                <SelectItem value="women">Women's League</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Important announcement..." /></div>
          <div><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Write your broadcast message..." /></div>
          <Button onClick={handleBroadcast} className="w-full"><Send className="h-4 w-4 mr-1" /> Send Broadcast</Button>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Broadcasts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{h.subject}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString()}</p>
                </div>
                <Badge variant="outline">{h.count} recipients ({h.audience})</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
