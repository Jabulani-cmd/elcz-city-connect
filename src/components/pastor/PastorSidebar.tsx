import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Heart, Users, UserCheck, Music, Church,
  MessageSquare, Calendar, DollarSign, BarChart3, Settings, LogOut,
  ChevronDown, ChevronRight, FileText, PenTool, Library, HandHeart,
  ClipboardList, MapPin, UserPlus, UsersRound, Clock, ListMusic,
  Megaphone, Bell, Send, CalendarDays, PieChart, TrendingUp,
  Import, BookOpenCheck, ScrollText, Milestone
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import logo from "@/assets/umplogo2.png";

interface NavSection {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: { label: string; icon: React.ElementType; path: string }[];
}

const navSections: NavSection[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/pastor" },
  {
    label: "Sermons", icon: BookOpen,
    children: [
      { label: "AI Sermon Builder", icon: Sparkles, path: "/pastor/sermons/ai-builder" },
      { label: "Sermon Builder", icon: PenTool, path: "/pastor/sermons/builder" },
      { label: "Sermon Series", icon: Library, path: "/pastor/sermons/series" },
      { label: "Sermon Library", icon: BookOpen, path: "/pastor/sermons/library" },
    ]
  },
  {
    label: "Pastoral Care", icon: Heart,
    children: [
      { label: "Care Dashboard", icon: HandHeart, path: "/pastor/care" },
      { label: "Counseling", icon: ClipboardList, path: "/pastor/care/counseling" },
      { label: "Prayer Requests", icon: Heart, path: "/pastor/care/prayers" },
      { label: "Visit Planning", icon: MapPin, path: "/pastor/care/visits" },
    ]
  },
  {
    label: "Members", icon: Users,
    children: [
      { label: "Member Directory", icon: Users, path: "/pastor/members" },
      { label: "Family Management", icon: UsersRound, path: "/pastor/members/families" },
    ]
  },
  {
    label: "Volunteers", icon: UserCheck,
    children: [
      { label: "Ministry Teams", icon: UserPlus, path: "/pastor/volunteers/teams" },
      { label: "Volunteer Directory", icon: UserCheck, path: "/pastor/volunteers" },
      { label: "Service Scheduler", icon: Clock, path: "/pastor/volunteers/scheduler" },
    ]
  },
  {
    label: "Service Planning", icon: Music,
    children: [
      { label: "Service Plans", icon: FileText, path: "/pastor/services/plans" },
      { label: "Song Library", icon: ListMusic, path: "/pastor/services/songs" },
    ]
  },
  {
    label: "Digital Resources", icon: Church,
    children: [
      { label: "Bible", icon: BookOpenCheck, path: "/pastor/resources/bible" },
      { label: "Order of Service", icon: ScrollText, path: "/pastor/resources/order" },
      { label: "Almanac", icon: Milestone, path: "/pastor/resources/almanac" },
    ]
  },
  {
    label: "Communication", icon: MessageSquare,
    children: [
      { label: "Announcements", icon: Megaphone, path: "/pastor/communication/announcements" },
      { label: "Notifications", icon: Bell, path: "/pastor/communication/notifications" },
      { label: "Broadcast", icon: Send, path: "/pastor/communication/broadcast" },
    ]
  },
  {
    label: "Events", icon: Calendar,
    children: [
      { label: "Event Management", icon: CalendarDays, path: "/pastor/events" },
      { label: "Calendar", icon: Calendar, path: "/pastor/events/calendar" },
    ]
  },
  {
    label: "Giving", icon: DollarSign,
    children: [
      { label: "Giving Dashboard", icon: PieChart, path: "/pastor/giving" },
      { label: "Transactions", icon: DollarSign, path: "/pastor/giving/transactions" },
      { label: "Statements", icon: FileText, path: "/pastor/giving/statements" },
    ]
  },
  {
    label: "Reports", icon: BarChart3,
    children: [
      { label: "Attendance", icon: Users, path: "/pastor/reports/attendance" },
      { label: "Membership", icon: TrendingUp, path: "/pastor/reports/membership" },
      { label: "Giving Reports", icon: DollarSign, path: "/pastor/reports/giving" },
      { label: "Volunteer Reports", icon: UserCheck, path: "/pastor/reports/volunteers" },
    ]
  },
  {
    label: "Settings", icon: Settings,
    children: [
      { label: "Church Settings", icon: Church, path: "/pastor/settings" },
      { label: "User Management", icon: Users, path: "/pastor/settings/users" },
      { label: "Data Import/Export", icon: Import, path: "/pastor/settings/data" },
    ]
  },
];

export default function PastorSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (label: string) => {
    setOpenSections(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (section: NavSection) =>
    section.path ? isActive(section.path) : section.children?.some(c => isActive(c.path));

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className={cn(
      "bg-card border-r border-border flex flex-col h-full transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-8 w-8 object-contain flex-shrink-0" />
        {!collapsed && (
          <div className="truncate">
            <p className="text-sm font-semibold text-foreground truncate">Pastor Portal</p>
            <p className="text-xs text-muted-foreground truncate">City Centre Bulawayo</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navSections.map((section) => {
          const Icon = section.icon;
          const active = isSectionActive(section);
          const isOpen = openSections.includes(section.label) || active;

          if (section.path) {
            return (
              <Link
                key={section.label}
                to={section.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive(section.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? section.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{section.label}</span>}
              </Link>
            );
          }

          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full transition-colors",
                  active
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? section.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.label}</span>
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </>
                )}
              </button>
              {!collapsed && isOpen && section.children && (
                <div className="ml-4 pl-3 border-l border-border space-y-0.5 mt-0.5">
                  {section.children.map(child => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors",
                          isActive(child.path)
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
