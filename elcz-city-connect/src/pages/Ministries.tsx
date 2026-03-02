import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import roseLogo from "@/assets/umplogo2.png";

const Ministries = () => {
  const { t } = useTranslation();
  const [ministryPhotos, setMinistryPhotos] = useState<Record<string, any[]>>({});
  const [viewingPhotos, setViewingPhotos] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("ministry_photos").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        const grouped: Record<string, any[]> = {};
        data.forEach((p: any) => {
          if (!grouped[p.ministry]) grouped[p.ministry] = [];
          grouped[p.ministry].push(p);
        });
        setMinistryPhotos(grouped);
      }
    });
  }, []);

  const leagues = [
    { key: "youth", name: t.ministries_youth, desc: t.ministries_youth_desc },
    { key: "men", name: t.ministries_men, desc: t.ministries_men_desc },
    { key: "women", name: t.ministries_women, desc: t.ministries_women_desc },
    { key: "sunday_school", name: t.ministries_sunday_school, desc: t.ministries_sunday_school_desc },
  ];

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.ministries_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.ministries_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {leagues.map((l) => {
              const photos = ministryPhotos[l.key] || [];
              return (
                <Card key={l.name} className="shadow-soft border-border hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 rounded-lg p-3">
                        <img src={roseLogo} alt="" className="h-20 w-20 object-contain" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground">{l.name}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">{l.desc}</p>
                    {/* View Photos Button */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setViewingPhotos(l.key)}>
                        <ImageIcon className="h-4 w-4 mr-2" /> {t.ministries_view_photos} ({photos.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Photo Gallery Dialog */}
      <Dialog open={!!viewingPhotos} onOpenChange={() => setViewingPhotos(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {leagues.find(l => l.key === viewingPhotos)?.name} — Photos
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const photos = viewingPhotos ? (ministryPhotos[viewingPhotos] || []) : [];
            return photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="rounded-lg overflow-hidden">
                    <img src={p.image_url} alt={p.caption || ""} className="w-full h-40 object-cover" />
                    {p.caption && <p className="text-xs text-muted-foreground p-1">{p.caption}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 italic">{t.ministries_no_photos}</p>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Ministries;
