import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Calendar, Users } from "lucide-react";

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

const leagues: Record<string, string> = {
  none: "No League",
  youth: "Youth League",
  men: "Men's League",
  women: "Women's League",
  sunday_school: "Sunday School",
};

interface MemberDetailDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberDetailDialog = ({ member, open, onOpenChange }: MemberDetailDialogProps) => {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {member.first_name} {member.last_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={member.is_active ? "default" : "secondary"}>
              {member.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">{leagues[member.league] || member.league}</Badge>
            {member.gender && <Badge variant="outline">{member.gender === "male" ? "Male" : "Female"}</Badge>}
            {member.baptized && <Badge className="bg-accent/50 text-accent-foreground">Baptized</Badge>}
            {member.confirmed_in_church && <Badge className="bg-accent/50 text-accent-foreground">Confirmed</Badge>}
          </div>

          <div className="space-y-3 text-sm">
            {member.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{member.address}</span>
              </div>
            )}
            {member.date_of_birth && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{member.date_of_birth}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span>Registered: {new Date(member.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {member.notes && (
            <div className="bg-muted rounded-md p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{member.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailDialog;
