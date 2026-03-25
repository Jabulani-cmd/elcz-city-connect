import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, User } from "lucide-react";

export default function UserManagement() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      if (p.data) setProfiles(p.data);
      if (r.data) setRoles(r.data);
    };
    fetchData();
  }, []);

  const getUserRoles = (userId: string) => roles.filter(r => r.user_id === userId).map(r => r.role);

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    pastor: "bg-blue-100 text-blue-800",
    user: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> User Management</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{profiles.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold">{roles.filter(r => r.role === "admin").length}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{roles.filter(r => r.role === "pastor").length}</p>
            <p className="text-xs text-muted-foreground">Pastors</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Registered Users</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {profiles.map(p => {
            const userRoles = getUserRoles(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {userRoles.length > 0 ? userRoles.map(r => (
                    <Badge key={r} className={roleColors[r] || ""}>{r}</Badge>
                  )) : <Badge variant="outline">No role</Badge>}
                </div>
              </div>
            );
          })}
          {profiles.length === 0 && <p className="text-sm text-muted-foreground">No users found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
