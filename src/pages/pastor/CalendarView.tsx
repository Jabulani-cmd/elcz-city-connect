import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function CalendarView() {
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString().split("T")[0];
      const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
      const { data } = await supabase.from("events").select("*")
        .gte("event_date", start).lte("event_date", end).order("event_date");
      if (data) setEvents(data);
    };
    fetchEvents();
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.event_date === dateStr);
  };

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const categoryColors: Record<string, string> = {
    Worship: "bg-blue-500", Youth: "bg-green-500", Outreach: "bg-orange-500",
    Fellowship: "bg-purple-500", Conference: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" /> Calendar</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[150px] text-center">{monthName}</span>
          <Button size="sm" variant="outline" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-px">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {days.map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              return (
                <div key={idx} className={`min-h-[80px] border border-border p-1 ${day ? "" : "bg-muted/30"} ${isToday(day || 0) ? "bg-primary/10 border-primary" : ""}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-medium ${isToday(day) ? "text-primary font-bold" : ""}`}>{day}</span>
                      <div className="space-y-0.5 mt-1">
                        {dayEvents.slice(0, 3).map(e => (
                          <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded text-white truncate ${categoryColors[e.category] || "bg-muted-foreground"}`}>
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events list */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Events This Month</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events this month.</p>
          ) : (
            events.map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.event_date} {e.event_time && `at ${e.event_time}`} {e.location && `· ${e.location}`}</p>
                </div>
                <Badge variant="outline">{e.category}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
