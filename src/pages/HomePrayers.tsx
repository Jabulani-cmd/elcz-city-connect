import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface PrayerLocation {
  id: string;
  prayer_date: string;
  host_name: string;
  address: string;
  notes: string | null;
}

const HomePrayers = () => {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<PrayerLocation[]>([]);

  useEffect(() => {
    supabase
      .from("home_prayer_locations")
      .select("*")
      .order("prayer_date", { ascending: true })
      .then(({ data }) => { if (data) setLocations(data as PrayerLocation[]); });
  }, []);

  const upcoming = locations.filter((l) => new Date(l.prayer_date) >= new Date(new Date().toDateString()));
  const past = locations.filter((l) => new Date(l.prayer_date) < new Date(new Date().toDateString()));

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">{t.home_prayers_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
            {t.home_prayers_subtitle}
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <SectionHeading title={t.home_prayers_upcoming} />
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t.home_prayers_none}</p>
          ) : (
            <div className="space-y-4">
              {upcoming.map((loc) => (
                <Card key={loc.id} className="border-border shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="bg-primary/10 rounded-xl w-14 h-14 shrink-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-foreground bg-primary w-full text-center py-0.5 rounded-t-xl">
                        {format(new Date(loc.prayer_date + "T00:00:00"), "MMM").toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-primary leading-none mt-0.5">
                        {format(new Date(loc.prayer_date + "T00:00:00"), "d")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-foreground">{loc.host_name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground">{loc.address}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(loc.prayer_date + "T00:00:00"), "EEEE, dd MMMM yyyy")}
                        </p>
                      </div>
                      {loc.notes && <p className="text-xs text-muted-foreground mt-2">{loc.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="mt-12">
              <SectionHeading title={t.home_prayers_past} />
              <div className="space-y-3 opacity-60">
                {past.slice(-5).reverse().map((loc) => (
                  <Card key={loc.id} className="border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{loc.host_name} — {loc.address}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(loc.prayer_date + "T00:00:00"), "dd MMMM yyyy")}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default HomePrayers;
