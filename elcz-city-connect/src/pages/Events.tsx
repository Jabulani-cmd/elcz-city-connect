import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";



const Events = () => {
  const { t } = useTranslation();
  const [dbEvents, setDbEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      if (data) setDbEvents(data);
    };
    fetch();
  }, []);

  const allEvents = dbEvents.map((e) => ({
    title: e.title,
    date: e.event_date,
    time: e.event_time || "",
    location: e.location || "",
    desc: e.description || "",
    category: e.category,
  }));

  const categoryMap: Record<string, string> = {
    All: t.events_all,
    Worship: t.events_worship,
    Fellowship: t.events_fellowship,
    Outreach: t.events_outreach,
    Youth: t.events_youth,
  };
  const categories = ["All", "Worship", "Fellowship", "Outreach", "Youth"];
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? allEvents : allEvents.filter((e) => e.category === filter);

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.events_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.events_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((cat) => (
              <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm" onClick={() => setFilter(cat)}
                className={filter === cat ? "bg-primary text-primary-foreground hover:bg-purple-dark" : ""}>
                {categoryMap[cat]}
              </Button>
            ))}
          </div>
          <div className="space-y-4">
            {filtered.map((e, i) => (
              <Card key={i} className="shadow-soft border-border hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {(() => {
                      const parsedDate = new Date(e.date);
                      const hasDate = !isNaN(parsedDate.getTime());
                      const monthStr = hasDate ? parsedDate.toLocaleString("en", { month: "short" }).toUpperCase() : "";
                      const dayStr = hasDate ? parsedDate.getDate().toString() : "";
                      return (
                        <div className="bg-primary/10 rounded-xl w-14 h-14 shrink-0 flex flex-col items-center justify-center overflow-hidden">
                          {hasDate ? (
                            <>
                              <span className="text-[10px] font-bold text-primary-foreground bg-primary w-full text-center py-0.5">{monthStr}</span>
                              <span className="text-lg font-bold text-primary leading-none mt-0.5">{dayStr}</span>
                            </>
                          ) : (
                            <span className="text-2xl">☀️</span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-semibold text-foreground">{e.title}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{e.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.location}</span>
                      </div>
                      <p className="mt-3 text-muted-foreground">{e.desc}</p>
                      <span className="inline-block mt-3 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{categoryMap[e.category]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Events;
