import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Church, Users, Import } from "lucide-react";
import { Link } from "react-router-dom";

export default function ChurchSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Settings</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Church className="h-4 w-4" /> Church Profile</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Manage church name, address, service times, and branding.</p>
            <p className="text-sm"><strong>Name:</strong> City Centre Bulawayo Congregation</p>
            <p className="text-sm"><strong>Pastor:</strong> Rev. M.P. Dube</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> User Management</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Manage user roles and permissions.</p>
            <Link to="/pastor/settings/users">
              <Button variant="outline" size="sm">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Import className="h-4 w-4" /> Data Import/Export</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Import or export member data, giving records, and more.</p>
            <Link to="/pastor/settings/data">
              <Button variant="outline" size="sm">Data Tools</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
