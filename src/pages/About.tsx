import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import roseLogo from "@/assets/umplogo2.png";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


const leaders = [
  { name: "Rev. M.P. Dube", role: "Pastor in Charge" },
  { name: "Mrs. P. Ngwenya", role: "Chairperson" },
  { name: "Mr. P. Ndou", role: "Vice-Chairperson" },
  { name: "Mrs. T. Dube", role: "Secretary" },
  { name: "Mrs. T. Ncube", role: "Treasurer" },
  { name: "Mr. L. Jamela", role: "Church Elder" },
  { name: "Mrs. S. Jamela", role: "Church Elder" },
  { name: "Miss M. Mangena", role: "Church Elder" },
];

const About = () => {
  const { t } = useTranslation();
  const [leaderPhotos, setLeaderPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase.storage.from("leader-photos").list();
      if (data) {
        const photoMap: Record<string, string> = {};
        data.forEach((file) => {
          const name = file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
          const { data: urlData } = supabase.storage.from("leader-photos").getPublicUrl(file.name);
          photoMap[name.toLowerCase()] = `${urlData.publicUrl}?t=${Date.now()}`;
        });
        setLeaderPhotos(photoMap);
      }
    };
    fetchPhotos();
  }, []);

  const beliefs = [
    { title: t.about_grace, desc: t.about_grace_desc },
    { title: t.about_scripture, desc: t.about_scripture_desc },
    { title: t.about_faith, desc: t.about_faith_desc },
    { title: t.about_community, desc: t.about_community_desc },
  ];

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.about_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.about_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 max-w-3xl">
          <SectionHeading title={t.about_history_title} />
          <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-4">
            <p>{t.about_history_p1}</p>
            <p>{t.about_history_p2}</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <SectionHeading title={t.about_beliefs_title} subtitle={t.about_beliefs_subtitle} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {beliefs.map((b) => (
              <Card key={b.title} className="text-center shadow-soft border-border">
                <CardContent className="pt-6">
                  <img src={roseLogo} alt="Rose Logo" className="h-20 w-20 object-contain mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <SectionHeading title={t.about_leadership_title} subtitle={t.about_leadership_subtitle} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {leaders.map((l) => {
              const normalizedName = l.name.toLowerCase().replace(/\./g, "");
              const photoUrl = leaderPhotos[normalizedName];
              return (
                <Card key={l.name} className="shadow-soft border-border">
                  <CardContent className="pt-6 text-center">
                    <Avatar className="w-28 h-28 mx-auto mb-4">
                      {photoUrl ? (
                        <AvatarImage src={photoUrl} alt={l.name} />
                      ) : null}
                      <AvatarFallback className="text-lg bg-muted text-muted-foreground">
                        {l.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-display font-semibold text-foreground">{l.name}</h3>
                    <p className="text-sm text-primary font-medium">{l.role}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
