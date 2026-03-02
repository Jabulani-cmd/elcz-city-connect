import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  category: string;
  created_at: string;
}

interface GalleryVideo {
  id: string;
  title: string;
  caption: string | null;
  video_url: string;
  category: string;
}

const getEmbedUrl = (url: string) => {
  const ytMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  if (url.includes("facebook.com")) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  return url;
};

const Gallery = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Photo | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<GalleryVideo[]>([]);

  useEffect(() => {
    supabase.from("gallery_photos").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setPhotos(data as Photo[]); });
    supabase.from("gallery_videos").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setVideos(data as GalleryVideo[]); });
  }, []);

  const filteredPhotos = filter === "all" ? photos : photos.filter((p) => p.category === filter);
  const filteredVideos = filter === "all" ? videos : videos.filter((v) => v.category === filter);

  const albums = [
    { name: t.gallery_worship, category: "worship" },
    { name: t.gallery_fellowship, category: "fellowship" },
    { name: t.gallery_outreach, category: "outreach" },
    { name: t.gallery_league, category: "league" },
    { name: t.gallery_choir, category: "choir" },
  ];

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.gallery_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.gallery_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-primary text-primary-foreground hover:bg-purple-dark" : ""}>{t.gallery_all}</Button>
            {albums.map((a) => (
              <Button key={a.category} variant={filter === a.category ? "default" : "outline"} size="sm"
                onClick={() => setFilter(a.category)}
                className={filter === a.category ? "bg-primary text-primary-foreground hover:bg-purple-dark" : ""}>{a.name}</Button>
            ))}
          </div>

          <Tabs defaultValue="photos" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="photos">{t.gallery_photos_tab}</TabsTrigger>
              <TabsTrigger value="videos">{t.gallery_videos_tab}</TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              {filteredPhotos.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">{t.gallery_no_photos}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPhotos.map((item) => (
                    <button key={item.id} onClick={() => setSelected(item)}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform relative group">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 text-sm font-medium text-white bg-black/50 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="videos">
              {filteredVideos.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">{t.gallery_no_videos}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredVideos.map((v) => (
                    <div key={v.id} className="rounded-lg overflow-hidden border border-border shadow-soft">
                      <div className="aspect-video">
                        <iframe src={getEmbedUrl(v.video_url)} title={v.title} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-display font-semibold text-foreground text-sm">{v.title}</h3>
                        {v.caption && <p className="text-xs text-muted-foreground mt-1">{v.caption}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {selected && (
            <div>
              <img src={selected.image_url} alt={selected.title} className="w-full max-h-[70vh] object-contain bg-black" />
              <div className="p-4">
                <h3 className="font-display text-xl font-bold">{selected.title}</h3>
                {selected.caption && <p className="text-muted-foreground mt-1">{selected.caption}</p>}
                <p className="text-xs text-muted-foreground capitalize mt-2">{selected.category}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Gallery;
