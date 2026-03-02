
-- Create storage bucket for downloadable resources (hymn books, bibles)
INSERT INTO storage.buckets (id, name, public) VALUES ('downloads', 'downloads', true);

-- Storage policies for downloads bucket
CREATE POLICY "Anyone can view downloads" ON storage.objects FOR SELECT USING (bucket_id = 'downloads');
CREATE POLICY "Admins can upload downloads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'downloads' AND public.is_admin());
CREATE POLICY "Admins can update downloads" ON storage.objects FOR UPDATE USING (bucket_id = 'downloads' AND public.is_admin());
CREATE POLICY "Admins can delete downloads" ON storage.objects FOR DELETE USING (bucket_id = 'downloads' AND public.is_admin());

-- Table to track downloadable resources
CREATE TABLE public.downloadable_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'hymn_book',
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.downloadable_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources" ON public.downloadable_resources FOR SELECT USING (true);
CREATE POLICY "Admins can insert resources" ON public.downloadable_resources FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update resources" ON public.downloadable_resources FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete resources" ON public.downloadable_resources FOR DELETE USING (public.is_admin());

CREATE TRIGGER update_downloadable_resources_updated_at
  BEFORE UPDATE ON public.downloadable_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
