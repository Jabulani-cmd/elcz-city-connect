
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-videos', 'gallery-videos', true);

CREATE POLICY "Anyone can view gallery videos" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-videos');
CREATE POLICY "Admins can upload gallery videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery-videos' AND public.is_admin());
CREATE POLICY "Admins can delete gallery videos" ON storage.objects FOR DELETE USING (bucket_id = 'gallery-videos' AND public.is_admin());
