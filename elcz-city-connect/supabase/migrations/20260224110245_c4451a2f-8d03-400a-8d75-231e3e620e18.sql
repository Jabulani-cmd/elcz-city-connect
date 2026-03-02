
CREATE TABLE public.livestream_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'youtube',
  event_date DATE NOT NULL,
  description TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.livestream_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view livestream videos" ON public.livestream_videos FOR SELECT USING (true);
CREATE POLICY "Admins can insert livestream videos" ON public.livestream_videos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update livestream videos" ON public.livestream_videos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete livestream videos" ON public.livestream_videos FOR DELETE USING (is_admin());
