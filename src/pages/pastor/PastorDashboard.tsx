import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users, Heart, BookOpen, Calendar, DollarSign, Clock,
  PenTool, MapPin, CalendarDays, Plus
} from "lucide-react";

export default function PastorDashboard() {
  const [stats, setStats] = useState({
    members: 0, prayerRequests: 0, sermons: 0, events: 0,
    upcomingSessions: 0, pendingFollowUps: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [members, prayers, sermons, events, sessions, notes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("sermons").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }).gte("event_date", new Date().toISOString().split("T")[0]),
        supabase.from("counseling_sessions").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("pastoral_notes").select("id", { count: "exact", head: true }).not("follow_up_date", "is", null).gte("follow_up_date", new Date().toISOString().split("T")[0]),
      ]);
      setStats({
        members: members.count || 0,
        prayerRequests: prayers.count || 0,
        sermons: sermons.count || 0,
        events: events.count || 0,
        upcomingSessions: sessions.count || 0,
        pendingFollowUps: notes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Members", value: stats.members, icon: Users, color: "text-blue-500", link: "/pastor/members" },
    { label: "Active Prayers", value: stats.prayerRequests, icon: Heart, color: "text-rose-500", link: "/pastor/care/prayers" },
    { label: "Sermons", value: stats.sermons, icon: BookOpen, color: "text-emerald-500", link: "/pastor/sermons/library" },
    { label: "Upcoming Events", value: stats.events, icon: Calendar, color: "text-amber-500", link: "/pastor/events" },
    { label: "Scheduled Sessions", value: stats.upcomingSessions, icon: Clock, color: "text-purple-500", link: "/pastor/care/counseling" },
    { label: "Pending Follow-ups", value: stats.pendingFollowUps, icon: MapPin, color: "text-orange-500", link: "/pastor/care" },
  ];

  const quickActions = [
    { label: "New Sermon", icon: PenTool, link: "/pastor/sermons/builder" },
    { label: "Add Note", icon: Plus, link: "/pastor/care" },
    { label: "Schedule Event", icon: CalendarDays, link: "/pastor/events" },
    { label: "Record Giving", icon: DollarSign, link: "/pastor/giving/transactions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome, Pastor</h2>
        <p className="text-muted-foreground">Here's your church overview for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(s => (
          <Link to={s.link} key={s.label}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <s.icon className={`h-8 w-8 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {quickActions.map(a => (
            <Link to={a.link} key={a.label}>
              <Button variant="outline" className="gap-2">
                <a.icon className="h-4 w-4" />
                {a.label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
