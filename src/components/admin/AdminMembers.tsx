import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users, Search, Eye, Printer, Download } from "lucide-react";
import MemberDetailDialog from "./MemberDetailDialog";

const leagues = [
  { value: "none", label: "No League" },
  { value: "youth", label: "Youth League" },
  { value: "men", label: "Men's League" },
  { value: "women", label: "Women's League" },
  { value: "sunday_school", label: "Sunday School" },
];

const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  league: string;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  baptized: boolean;
  confirmed_in_church: boolean;
  created_at: string;
}

const AdminMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [filterLeague, setFilterLeague] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterBaptized, setFilterBaptized] = useState("all");
  const [filterConfirmed, setFilterConfirmed] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [league, setLeague] = useState("none");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [baptized, setBaptized] = useState(false);
  const [confirmedInChurch, setConfirmedInChurch] = useState(false);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("last_name", { ascending: true });
    if (data) setMembers(data as Member[]);
  };

  useEffect(() => { fetchMembers(); }, []);

  const reset = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone("");
    setLeague("none"); setGender(""); setDob(""); setAddress("");
    setNotes(""); setIsActive(true); setBaptized(false); setConfirmedInChurch(false); setEditing(null);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setFirstName(m.first_name); setLastName(m.last_name);
    setEmail(m.email || ""); setPhone(m.phone || "");
    setLeague(m.league); setGender(m.gender || "");
    setDob(m.date_of_birth || ""); setAddress(m.address || "");
    setNotes(m.notes || ""); setIsActive(m.is_active);
    setBaptized(m.baptized); setConfirmedInChurch(m.confirmed_in_church);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        league,
        gender: gender || null,
        date_of_birth: dob || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        is_active: isActive,
        baptized,
        confirmed_in_church: confirmedInChurch,
      };

      if (editing) {
        const { error } = await supabase.from("members").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Member updated" });
      } else {
        const { error } = await supabase.from("members").insert(payload);
        if (error) {
          if (error.message.includes("duplicate") || error.code === "23505") {
            toast({ title: "Duplicate Member", description: "A member with these details already exists.", variant: "destructive" });
            return;
          }
          throw error;
        }
        toast({ title: "Member registered" });
      }
      setOpen(false); reset(); fetchMembers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Member removed" }); fetchMembers(); }
  };

  const filtered = members.filter((m) => {
    if (filterLeague !== "all" && m.league !== filterLeague) return false;
    if (filterStatus === "active" && !m.is_active) return false;
    if (filterStatus === "inactive" && m.is_active) return false;
    if (filterGender !== "all" && m.gender !== filterGender) return false;
    if (filterBaptized === "yes" && !m.baptized) return false;
    if (filterBaptized === "no" && m.baptized) return false;
    if (filterConfirmed === "yes" && !m.confirmed_in_church) return false;
    if (filterConfirmed === "no" && m.confirmed_in_church) return false;
    if (search) {
      const q = search.toLowerCase();
      return `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q));
    }
    return true;
  });

  const leagueLabel = (value: string) => leagues.find((l) => l.value === value)?.label || value;

  const leagueCounts = leagues.reduce((acc, l) => {
    acc[l.value] = members.filter((m) => m.league === l.value).length;
    return acc;
  }, {} as Record<string, number>);

  // Print filtered members
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = filtered.map((m) =>
      `<tr>
        <td style="padding:6px;border:1px solid #ddd">${m.first_name} ${m.last_name}</td>
        <td style="padding:6px;border:1px solid #ddd">${m.phone || "-"}</td>
        <td style="padding:6px;border:1px solid #ddd">${m.email || "-"}</td>
        <td style="padding:6px;border:1px solid #ddd">${leagueLabel(m.league)}</td>
        <td style="padding:6px;border:1px solid #ddd">${m.gender || "-"}</td>
        <td style="padding:6px;border:1px solid #ddd">${m.baptized ? "Yes" : "No"}</td>
        <td style="padding:6px;border:1px solid #ddd">${m.confirmed_in_church ? "Yes" : "No"}</td>
        <td style="padding:6px;border:1px solid #ddd">${m.is_active ? "Active" : "Inactive"}</td>
      </tr>`
    ).join("");
    printWindow.document.write(`
      <html><head><title>Members List</title></head><body>
      <h2>Church Members (${filtered.length})</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:12px">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Name</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Phone</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Email</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">League</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Gender</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Baptized</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Confirmed</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left">Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Download filtered members as CSV
  const handleDownload = () => {
    const header = "Name,Phone,Email,League,Gender,Date of Birth,Address,Baptized,Confirmed,Status,Notes\n";
    const csvRows = filtered.map((m) =>
      [
        `"${m.first_name} ${m.last_name}"`,
        `"${m.phone || ""}"`,
        `"${m.email || ""}"`,
        `"${leagueLabel(m.league)}"`,
        `"${m.gender || ""}"`,
        `"${m.date_of_birth || ""}"`,
        `"${(m.address || "").replace(/"/g, '""')}"`,
        m.baptized ? "Yes" : "No",
        m.confirmed_in_church ? "Yes" : "No",
        m.is_active ? "Active" : "Inactive",
        `"${(m.notes || "").replace(/"/g, '""')}"`,
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Church Members</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={filtered.length === 0}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Download CSV
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Register</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "Register"} Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={100} /></div>
                  <div><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={100} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} /></div>
                  <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>League</Label>
                    <Select value={league} onValueChange={setLeague}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {leagues.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {genders.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Date of Birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
                  <div className="flex items-end gap-2 pb-1">
                    <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
                    <Label htmlFor="active">Active Member</Label>
                  </div>
                </div>
                <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={255} /></div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} /></div>
                <div className="flex items-center gap-3 pt-1">
                  <input type="checkbox" id="admin-baptized" checked={baptized} onChange={(e) => setBaptized(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  <Label htmlFor="admin-baptized" className="cursor-pointer text-sm">Baptized</Label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="admin-confirmed" checked={confirmedInChurch} onChange={(e) => setConfirmedInChurch(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  <Label htmlFor="admin-confirmed" className="cursor-pointer text-sm">Confirmed in Church</Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : editing ? "Update Member" : "Register Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="cursor-pointer" onClick={() => setFilterLeague("all")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{members.length}</p>
            <p className="text-xs text-muted-foreground">All Members</p>
          </CardContent>
        </Card>
        {leagues.filter(l => l.value !== "none").map((l) => (
          <Card key={l.value} className="cursor-pointer" onClick={() => setFilterLeague(l.value)}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{leagueCounts[l.value] || 0}</p>
              <p className="text-xs text-muted-foreground">{l.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterLeague} onValueChange={setFilterLeague}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBaptized} onValueChange={setFilterBaptized}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Baptized: All</SelectItem>
              <SelectItem value="yes">Baptized</SelectItem>
              <SelectItem value="no">Not Baptized</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterConfirmed} onValueChange={setFilterConfirmed}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Confirmed: All</SelectItem>
              <SelectItem value="yes">Confirmed</SelectItem>
              <SelectItem value="no">Not Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">Showing {filtered.length} of {members.length} members</p>

      {/* Member list */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          {members.length === 0 ? "No members registered yet." : "No members match your filters."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className={!m.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => { setViewMember(m); setViewOpen(true); }}>
                  <div className="bg-primary/10 rounded-full p-2 shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{m.first_name} {m.last_name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      {m.phone && <span>{m.phone}</span>}
                      {m.email && <span>{m.email}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                       <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{leagueLabel(m.league)}</span>
                       {m.baptized && <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">Baptized</span>}
                       {m.confirmed_in_church && <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-full">Confirmed</span>}
                       {!m.is_active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setViewMember(m); setViewOpen(true); }}><Eye className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MemberDetailDialog member={viewMember} open={viewOpen} onOpenChange={setViewOpen} />
    </div>
  );
};

export default AdminMembers;
