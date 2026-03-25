import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, MoveUp, MoveDown, Printer, ScrollText } from "lucide-react";

interface OrderItem {
  id: string;
  title: string;
  details: string;
  time: string;
}

export default function OrderOfService() {
  const [serviceTitle, setServiceTitle] = useState("Sunday Worship Service");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", title: "Call to Worship", details: "Opening hymn and invocation", time: "10:00" },
    { id: "2", title: "Prayer of Confession", details: "", time: "10:10" },
    { id: "3", title: "Scripture Reading", details: "", time: "10:20" },
    { id: "4", title: "Hymn", details: "", time: "10:30" },
    { id: "5", title: "Sermon", details: "", time: "10:40" },
    { id: "6", title: "Offering", details: "", time: "11:10" },
    { id: "7", title: "Announcements", details: "", time: "11:20" },
    { id: "8", title: "Closing Hymn & Benediction", details: "", time: "11:30" },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newTime, setNewTime] = useState("");

  const addItem = () => {
    if (!newTitle) return;
    setItems([...items, { id: Date.now().toString(), title: newTitle, details: newDetails, time: newTime }]);
    setNewTitle(""); setNewDetails(""); setNewTime("");
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const moveItem = (idx: number, dir: "up" | "down") => {
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
    setItems(copy);
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handlePrint = () => {
    const printContent = `
      <html><head><title>${serviceTitle}</title>
      <style>body{font-family:Georgia,serif;max-width:600px;margin:40px auto;padding:20px}
      h1{text-align:center;border-bottom:2px solid #333;padding-bottom:10px}
      .date{text-align:center;color:#666;margin-bottom:30px}
      .item{display:flex;padding:8px 0;border-bottom:1px solid #eee}
      .time{width:60px;color:#666;font-size:14px}.title{font-weight:bold;flex:1}
      .details{color:#666;font-size:13px;margin-top:2px}</style></head>
      <body><h1>${serviceTitle}</h1><p class="date">${new Date(serviceDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      ${items.map(i => `<div class="item"><span class="time">${i.time}</span><div><div class="title">${i.title}</div>${i.details ? `<div class="details">${i.details}</div>` : ""}</div></div>`).join("")}
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2"><ScrollText className="h-6 w-6" /> Order of Service</h2>
        <Button onClick={handlePrint} variant="outline"><Printer className="h-4 w-4 mr-1" /> Print</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div><Label>Service Title</Label><Input value={serviceTitle} onChange={e => setServiceTitle(e.target.value)} /></div>
        <div><Label>Date</Label><Input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} /></div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Order</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveItem(idx, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><MoveUp className="h-3 w-3" /></button>
                <button onClick={() => moveItem(idx, "down")} disabled={idx === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><MoveDown className="h-3 w-3" /></button>
              </div>
              <Input className="w-16" value={item.time} onChange={e => updateItem(item.id, "time", e.target.value)} placeholder="Time" />
              <Input className="flex-1" value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} />
              <Input className="flex-1" value={item.details} onChange={e => updateItem(item.id, "details", e.target.value)} placeholder="Details (optional)" />
              <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Add New Element</p>
          <div className="flex gap-2 items-end flex-wrap">
            <div><Label>Time</Label><Input className="w-20" value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="11:00" /></div>
            <div className="flex-1"><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Doxology" /></div>
            <div className="flex-1"><Label>Details</Label><Input value={newDetails} onChange={e => setNewDetails(e.target.value)} placeholder="Optional" /></div>
            <Button onClick={addItem}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
