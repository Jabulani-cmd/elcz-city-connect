import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface PreachingEntry {
  id: string;
  preacher_name: string;
  service_date: string;
  service_type: string;
  notes: string | null;
}

const PreachingSchedule = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PreachingEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    supabase
      .from("preaching_schedule")
      .select("*")
      .order("service_date", { ascending: true })
      .then(({ data }) => { if (data) setEntries(data as PreachingEntry[]); });
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0=Sun

  const today = new Date(new Date().toDateString());

  const getEntriesForDate = (date: Date) => {
    if (date < today) return [];
    return entries.filter((e) => isSameDay(new Date(e.service_date + "T00:00:00"), date));
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">{t.preaching_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
            {t.preaching_subtitle}
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
            {/* Empty cells for days before month start */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const isSunday = getDay(day) === 0;
              const dayEntries = isSunday ? getEntriesForDate(day) : [];
              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square border rounded-lg p-1 flex flex-col items-center justify-start text-xs
                    ${isSunday ? "bg-primary/5 border-primary/20" : "border-border"}
                    ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}
                  `}
                >
                  <span className={`font-semibold ${isSunday ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {dayEntries.map((entry) => (
                    <span key={entry.id} className={`text-[10px] sm:text-xs text-center leading-tight mt-0.5 font-medium truncate w-full ${entry.service_type === "bible_study" ? "text-accent-foreground" : "text-primary"}`}>
                      {entry.service_type === "bible_study" ? "📖 " : "⛪ "}{entry.preacher_name}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          {/* List view for upcoming */}
          <div className="mt-10">
            <SectionHeading title={t.preaching_upcoming} />
            <div className="space-y-3">
              {entries
                .filter((e) => new Date(e.service_date) >= new Date(new Date().toDateString()))
                .slice(0, 10)
                .map((entry) => (
                  <Card key={entry.id} className="border-border shadow-soft">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="bg-primary/10 rounded-xl w-14 h-14 shrink-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground bg-primary w-full text-center py-0.5 rounded-t-xl">
                          {format(new Date(entry.service_date + "T00:00:00"), "MMM").toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-primary leading-none mt-0.5">
                          {format(new Date(entry.service_date + "T00:00:00"), "d")}
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-semibold text-foreground">
                          {entry.service_type === "bible_study" ? "📖 " : "⛪ "}{entry.preacher_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.service_date + "T00:00:00"), "EEEE, dd MMMM yyyy")} · {entry.service_type === "bible_study" ? "Bible Study" : "Worship Service"}
                        </p>
                        {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {entries.filter((e) => new Date(e.service_date) >= new Date(new Date().toDateString())).length === 0 && (
                <p className="text-muted-foreground text-center py-8">{t.preaching_none}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PreachingSchedule;
