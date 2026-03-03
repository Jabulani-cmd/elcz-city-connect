import { Link } from "react-router-dom";
import { MapPin, Calendar, BookOpen, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { useEffect, useCallback, useState, useMemo } from "react";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslation } from "@/hooks/useTranslation";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { supabase } from "@/integrations/supabase/client";
import heroImage1 from "@/assets/hero-church.jpg";
import heroImage2 from "@/assets/hero-church-2.jpg";
import heroImage3 from "@/assets/hero-church-3.jpg";
import heroImage4 from "@/assets/hero-church-4.jpg";
import roseLogo from "@/assets/umplogo2.png";
import blackClock from "@/assets/black-clock.png";


const defaultHeroSlides = [
  { image: heroImage1, alt: "City Centre Congregation church exterior" },
  { image: heroImage2, alt: "Beautiful church interior with stained glass" },
  { image: heroImage3, alt: "Congregation worshipping together" },
  { image: heroImage4, alt: "Community outreach and fellowship" },
];


const Index = () => {
  const { t } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<{image: string; alt: string}[]>([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [pastorImageUrl, setPastorImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch carousel images from DB
    supabase
      .from("carousel_images")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHeroSlides(data.map((img: any) => ({ image: img.image_url, alt: img.alt_text })));
        } else {
          setHeroSlides(defaultHeroSlides);
        }
        setSlidesLoaded(true);
      });

    supabase
      .from("announcements")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setAnnouncements(data); });

    supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        const sundayService = { title: "Sunday Worship Service", date: "Every Sunday", time: "10:00 AM", category: "Worship", recurringIcon: "☀️" };
        const dbEvents = (data || []).map((e: any) => ({
          title: e.title,
          date: e.event_date,
          time: e.event_time || "",
          category: e.category,
        }));
        setUpcomingEvents([sundayService, ...dbEvents]);
      });

    // Fetch pastor photo from storage
    supabase.storage.from("leader-photos").list().then(({ data }) => {
      if (data) {
        const pastorFile = data.find((f) =>
          f.name.toLowerCase().replace(/\./g, "").replace(/-/g, " ").replace(/\.[^/.]+$/, "").includes("rev m ndlovu")
        );
        if (pastorFile) {
          const { data: urlData } = supabase.storage.from("leader-photos").getPublicUrl(pastorFile.name);
          setPastorImageUrl(`${urlData.publicUrl}?t=${Date.now()}`);
        }
      }
    });
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(interval);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const quickLinks = [
    { label: t.home_explore_ministries, desc: t.home_explore_ministries_desc, to: "/ministries" },
    { label: t.home_explore_livestream, desc: t.home_explore_livestream_desc, to: "/livestream" },
    { label: t.home_explore_projects, desc: t.home_explore_projects_desc, to: "/projects" },
    { label: t.home_explore_events, desc: t.home_explore_events_desc, to: "/events" },
  ];

  const eventDates = useMemo(() => {
    return upcomingEvents
      .map((e) => {
        const parsed = new Date(e.date);
        return isNaN(parsed.getTime()) ? null : parsed;
      })
      .filter(Boolean) as Date[];
  }, [upcomingEvents]);

  return (
    <Layout>
      {/* Hero Carousel */}
      <section className="relative h-[70vh] sm:h-[80vh] lg:h-[85vh] min-h-[450px] overflow-hidden">
        {slidesLoaded && heroSlides.length > 0 && (
          <div className="absolute inset-0" ref={emblaRef}>
            <div className="flex h-full">
              {heroSlides.map((slide, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
                  <img src={slide.image} alt={slide.alt} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/25 z-10" />
        <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-20">
          <img src={roseLogo} alt="City Centre Congregation Rose Logo" className="h-[45px] sm:h-[55px] md:h-[65px] w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
        </div>
        <div className="relative z-20 h-full flex items-end justify-center pb-16 sm:pb-20">
          <div className="text-center px-4 max-w-3xl animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm sm:text-base px-6 sm:px-8 shadow-medium">
                <Link to="/register">{t.home_join_us}</Link>
              </Button>
              <Button asChild size="lg" className="border-2 border-white text-white bg-white/10 hover:bg-white/20 text-sm sm:text-base px-6 sm:px-8 font-semibold">
                <Link to="/livestream">{t.home_watch_live}</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, index) => (
            <button key={index} onClick={() => emblaApi?.scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all ${selectedIndex === index ? "bg-primary-foreground scale-110" : "bg-primary-foreground/40 hover:bg-primary-foreground/60"}`}
              aria-label={`Go to slide ${index + 1}`} />
          ))}
        </div>
      </section>

      {/* Welcome Title Section */}
      <section className="py-8 sm:py-12 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <img src={roseLogo} alt="City Centre Congregation Rose Logo" className="h-[60px] sm:h-[80px] md:h-[100px] w-auto mx-auto mb-3 object-contain" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-tight tracking-tight">
            {t.home_hero_title_prefix} ELCZ City Centre {t.home_hero_title_suffix}
          </h1>
          <p className="mt-3 text-lg sm:text-xl md:text-2xl text-foreground/80 font-serif font-semibold leading-relaxed max-w-2xl mx-auto">
            {t.home_hero_subtitle}
          </p>
        </div>
      </section>

      {/* Service Times */}
      <section className="py-10 sm:py-16 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading title={t.home_worship_title} subtitle={t.home_worship_subtitle} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { day: t.home_intercession, time: "8:00 AM" },
              { day: t.home_bible_study, time: "9:00 AM" },
              { day: t.home_sunday_worship, time: "10:00 AM" },
              { day: t.home_sunday_school, time: "10:00 AM" },
            ].map((s) => (
              <Card key={s.day} className="text-center shadow-soft border-border hover:shadow-medium transition-shadow">
                <CardContent className="pt-6">
                  <h3 className="font-display font-semibold text-foreground">{s.day}</h3>
                  <p className="text-muted-foreground mt-1">{s.time}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8 flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>City Centre, Bulawayo, Zimbabwe</span>
          </div>
        </div>
      </section>

      {/* Pastor Welcome */}
      <section className="py-10 sm:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          {pastorImageUrl && (
            <img src={pastorImageUrl} alt="Rev. M. Ndlovu - Pastor in Charge" className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mx-auto mb-6 shadow-medium border-4 border-primary/20" />
          )}
          <SectionHeading title={t.home_pastor_title} />
          <blockquote className="text-lg md:text-xl text-muted-foreground italic leading-relaxed">{t.home_pastor_quote}</blockquote>
         <p className="mt-6 font-display font-semibold text-foreground">Rev. M.P. Dube</p>
          <p className="text-sm text-muted-foreground">{t.home_senior_pastor}</p>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-10 sm:py-16 bg-background">
        <div className="container mx-auto px-4">
          <SectionHeading title={t.home_announcements_title} subtitle={t.home_announcements_subtitle} />
          <div className="max-w-3xl mx-auto space-y-4">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <Card key={a.id} className="shadow-soft border-border hover:shadow-medium transition-shadow">
                  <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                    <div className="bg-accent/10 rounded-lg p-2.5 sm:p-3 shrink-0">
                      <Megaphone className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{a.content}</p>
                      <span className="text-xs text-muted-foreground/70 mt-2 block">
                        {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground italic">{t.home_no_announcements}</p>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-10 sm:py-16 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading title={t.home_events_title} subtitle={t.home_events_subtitle} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Calendar Widget */}
            <Card className="shadow-soft border-border flex justify-center items-start p-4">
              <CalendarWidget
                mode="multiple"
                selected={eventDates}
                className="pointer-events-auto"
              />
            </Card>
            {/* Event List */}
            <div className="flex flex-col gap-4">
              {upcomingEvents.map((e) => {
                const parsedDate = new Date(e.date);
                const hasDate = !isNaN(parsedDate.getTime());
                const monthStr = hasDate ? parsedDate.toLocaleString("en", { month: "short" }).toUpperCase() : "";
                const dayStr = hasDate ? parsedDate.getDate().toString() : "";
                return (
                <Card key={e.title} className="shadow-soft hover:shadow-medium transition-shadow border-border">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="bg-primary/10 rounded-xl w-14 h-14 shrink-0 flex flex-col items-center justify-center overflow-hidden">
                      {hasDate ? (
                        <>
                          <span className="text-[10px] font-bold text-primary-foreground bg-primary w-full text-center py-0.5">{monthStr}</span>
                          <span className="text-lg font-bold text-primary leading-none mt-0.5">{dayStr}</span>
                        </>
                      ) : (
                        <span className="text-2xl">{"recurringIcon" in e ? (e as any).recurringIcon : "📅"}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{e.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{e.date} · {e.time}</p>
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{e.category}</span>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline"><Link to="/events">{t.home_view_all_events}</Link></Button>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-10 sm:py-16 bg-background">
        <div className="container mx-auto px-4">
          <SectionHeading title={t.home_explore_title} subtitle={t.home_explore_subtitle} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {quickLinks.map((l) => (
              <Link key={l.to} to={l.to} className="group">
                <Card className="text-center shadow-soft hover:shadow-purple transition-all border-border group-hover:border-primary/30 h-full">
                  <CardContent className="pt-6">
                    <img src={roseLogo} alt="" className="h-20 w-20 mx-auto mb-3 object-contain group-hover:scale-110 transition-transform" />
                    <h3 className="font-display font-semibold text-foreground text-sm">{l.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* Appointments CTA */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <img src={roseLogo} alt="Rose Logo" className="h-[98px] w-[98px] mx-auto mb-4 object-contain" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">{t.home_explore_appointments}</h2>
          <p className="text-muted-foreground mb-6">{t.home_explore_appointments_desc}</p>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-purple-light font-semibold">
            <Link to="/appointments">{t.appointments_book_title}</Link>
          </Button>
        </div>
      </section>

      <FloatingWhatsApp />
    </Layout>
  );
};

export default Index;
