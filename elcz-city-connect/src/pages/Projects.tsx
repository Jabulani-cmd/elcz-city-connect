import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const Projects = () => {
  const { t } = useTranslation();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPhotos } = useQuery({
    queryKey: ["project-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getPhotos = (projectId: string) =>
    allPhotos?.filter((p) => p.project_id === projectId) || [];

  return (
    <Layout>
      <section className="bg-gradient-purple py-12 sm:py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">{t.nav_projects}</h1>
          <p className="text-primary-foreground/70 text-base sm:text-lg max-w-2xl mx-auto">{t.home_explore_projects_desc}</p>
        </div>
      </section>
      <section className="py-10 sm:py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading projects...</p>
          ) : !projects?.length ? (
            <p className="text-center text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {projects.map((project) => {
                const percent = project.target_amount > 0
                  ? Math.min(100, (Number(project.amount_raised) / Number(project.target_amount)) * 100)
                  : 0;
                const photos = getPhotos(project.id);
                return (
                  <Card key={project.id} className="shadow-soft border-border hover:shadow-medium transition-shadow overflow-hidden">
                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-0.5">
                        {photos.slice(0, 4).map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.image_url}
                            alt={photo.caption || project.title}
                            className={`w-full object-cover ${photos.length === 1 ? 'col-span-2 h-48' : 'h-28'}`}
                          />
                        ))}
                      </div>
                    )}
                    <CardContent className="p-6">
                      <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-3">
                        {project.status}
                      </span>
                      <h3 className="font-display font-semibold text-foreground text-lg mb-2">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Raised</span>
                          <span className="font-semibold text-foreground">
                            ${Number(project.amount_raised).toLocaleString()}
                            {project.target_amount > 0 && <span className="text-muted-foreground font-normal"> / ${Number(project.target_amount).toLocaleString()}</span>}
                          </span>
                        </div>
                        {project.target_amount > 0 && <Progress value={percent} className="h-2" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Projects;
