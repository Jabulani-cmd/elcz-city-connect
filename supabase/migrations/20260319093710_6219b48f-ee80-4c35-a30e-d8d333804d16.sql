
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project photos" ON public.project_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert project photos" ON public.project_photos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can delete project photos" ON public.project_photos FOR DELETE USING (is_admin());

INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true);

CREATE POLICY "Anyone can view project photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'project-photos');
CREATE POLICY "Admins can upload project photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-photos' AND public.is_admin());
CREATE POLICY "Admins can delete project photos storage" ON storage.objects FOR DELETE USING (bucket_id = 'project-photos' AND public.is_admin());
