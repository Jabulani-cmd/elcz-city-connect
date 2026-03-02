import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Facebook, Play, Calendar, ExternalLink } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface LivestreamVideo {
  id: string;
  title: string;
  video_url: string;
  video_type: string;
  event_date: string;
  description: string | null;
  is_live: boolean;
}

const getEmbedUrl = (url: string, type: string) => {
  if (type === "youtube") {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }
  if (type === "facebook") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  }
  return url;
};

const Livestream = () => {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<LivestreamVideo[]>([]);
  const [liveVideo, setLiveVideo] = useState<LivestreamVideo | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<LivestreamVideo | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("livestream_videos")
        .select("*")
        .order("event_date", { ascending: false });
      if (data) {
        const live = (data as LivestreamVideo[]).find((v) => v.is_live);
        setLiveVideo(live || null);
        setVideos((data as LivestreamVideo[]).filter((v) => !v.is_live));
      }
    };
    fetch();
  }, []);

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.livestream_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.livestream_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 max-w-4xl">
          <SectionHeading title={t.livestream_watch_live} subtitle={t.livestream_watch_subtitle} />
          <Card className="shadow-medium border-border mb-8">
            <CardContent className="p-0">
              {liveVideo ? (
                <div className="aspect-video rounded-t-lg overflow-hidden">
                  <iframe
                    src={getEmbedUrl(liveVideo.video_url, liveVideo.video_type)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={liveVideo.title}
                  />
                </div>
              ) : selectedVideo ? (
                <div className="aspect-video rounded-t-lg overflow-hidden">
                  <iframe
                    src={getEmbedUrl(selectedVideo.video_url, selectedVideo.video_type)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo.title}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-purple-deep rounded-t-lg flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <Play className="h-16 w-16 mx-auto mb-4 text-accent" />
                    <h3 className="font-display text-xl font-semibold">{t.livestream_live_stream}</h3>
                    <p className="text-primary-foreground/60 mt-2">{t.livestream_next_service}</p>
                  </div>
                </div>
              )}
              <div className="p-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-[hsl(0,100%,40%)] hover:bg-[hsl(0,100%,35%)] text-white gap-2"><Youtube className="h-4 w-4" /> {t.livestream_youtube}</Button>
                <Button className="bg-[hsl(220,70%,45%)] hover:bg-[hsl(220,70%,38%)] text-white gap-2"><Facebook className="h-4 w-4" /> {t.livestream_facebook}</Button>
              </div>
            </CardContent>
          </Card>
          <div className="bg-muted rounded-lg p-4 text-center mb-4">
            <div className="flex items-center justify-center gap-2 text-foreground font-medium">
              <Calendar className="h-4 w-4 text-primary" />{t.livestream_schedule}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t.livestream_schedule_times}</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <SectionHeading title={t.livestream_past_title} subtitle={t.livestream_past_subtitle} />
          {videos.length === 0 ? (
            <p className="text-center text-muted-foreground">{t.livestream_no_past}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((s) => (
                <Card key={s.id} className="shadow-soft border-border hover:shadow-medium transition-shadow cursor-pointer" onClick={() => setSelectedVideo(s)}>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-purple-deep/90 rounded-t-lg flex items-center justify-center group">
                      <Play className="h-12 w-12 text-accent group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-foreground text-sm">{s.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{s.event_date}</p>
                      {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4" /> {t.livestream_subscribe}</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Livestream;
