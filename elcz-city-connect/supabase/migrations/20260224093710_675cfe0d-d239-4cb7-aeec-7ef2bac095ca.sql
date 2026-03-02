
-- Create storage bucket for leader photos
INSERT INTO storage.buckets (id, name, public) VALUES ('leader-photos', 'leader-photos', true);

-- Storage policies for leader photos
CREATE POLICY "Anyone can view leader photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'leader-photos');

CREATE POLICY "Admins can upload leader photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'leader-photos' AND public.is_admin());

CREATE POLICY "Admins can update leader photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'leader-photos' AND public.is_admin());

CREATE POLICY "Admins can delete leader photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'leader-photos' AND public.is_admin());
