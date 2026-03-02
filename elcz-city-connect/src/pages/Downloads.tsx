import { useState } from "react";
import { Download, BookOpen, Book, FileText, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { languageNames, type Language } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

const Downloads = () => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const categoryLabels: Record<string, { label: string; icon: typeof BookOpen }> = {
    hymn_book: { label: t.downloads_hymn_book, icon: BookOpen },
    bible: { label: t.downloads_bible, icon: Book },
    minutes: { label: t.downloads_minutes, icon: FileText },
    church_documents: { label: t.downloads_church_docs, icon: FileText },
    other: { label: t.downloads_other, icon: FileText },
  };

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["downloadable-resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("downloadable_resources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group resources by language, then by category
  const byLanguage = (Object.keys(languageNames) as Language[]).map((lang) => {
    const langResources = resources.filter((r: any) => r.language === lang);
    const grouped = langResources.reduce((acc: Record<string, any[]>, r: any) => {
      const cat = r.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(r);
      return acc;
    }, {});
    return { lang, name: languageNames[lang], grouped, count: langResources.length };
  });

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.downloads_title}</h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t.downloads_subtitle}</p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : (
            byLanguage.map(({ lang, name, grouped, count }) => (
              <Collapsible key={lang} open={openSections[lang]} onOpenChange={() => toggleSection(lang)}>
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer border-border hover:shadow-medium transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h2 className="font-display text-lg font-semibold text-foreground">{name}</h2>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{count} {count === 1 ? "file" : "files"}</span>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openSections[lang] ? "rotate-180" : ""}`} />
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4 pl-4">
                  {count === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">{t.downloads_no_resources}</p>
                  ) : (
                    Object.entries(grouped).map(([category, items]) => {
                      const catInfo = categoryLabels[category] || categoryLabels.other;
                      const Icon = catInfo.icon;
                      return (
                        <div key={category}>
                          <h3 className="font-display text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />{catInfo.label}
                          </h3>
                          <div className="grid gap-2">
                            {(items as any[]).map((r) => (
                              <Card key={r.id} className="border-border shadow-soft hover:shadow-medium transition-shadow">
                                <CardContent className="p-3 flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-foreground text-sm truncate">{r.title}</h4>
                                    {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                                    {r.file_size_bytes && <span className="text-xs text-muted-foreground">{formatSize(r.file_size_bytes)}</span>}
                                  </div>
                                  <Button asChild size="sm" className="shrink-0">
                                    <a href={r.file_url} download target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4 mr-1" />{t.downloads_download}
                                    </a>
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Downloads;
