
-- Preaching schedule table
CREATE TABLE public.preaching_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preacher_name TEXT NOT NULL,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'sunday_worship',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.preaching_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view preaching schedule" ON public.preaching_schedule FOR SELECT USING (true);
CREATE POLICY "Admins can insert preaching schedule" ON public.preaching_schedule FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update preaching schedule" ON public.preaching_schedule FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete preaching schedule" ON public.preaching_schedule FOR DELETE USING (is_admin());

-- Thursday home prayer locations table
CREATE TABLE public.home_prayer_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_date DATE NOT NULL,
  host_name TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.home_prayer_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prayer locations" ON public.home_prayer_locations FOR SELECT USING (true);
CREATE POLICY "Admins can insert prayer locations" ON public.home_prayer_locations FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update prayer locations" ON public.home_prayer_locations FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete prayer locations" ON public.home_prayer_locations FOR DELETE USING (is_admin());

-- Gallery videos table
CREATE TABLE public.gallery_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  video_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery videos" ON public.gallery_videos FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery videos" ON public.gallery_videos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update gallery videos" ON public.gallery_videos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete gallery videos" ON public.gallery_videos FOR DELETE USING (is_admin());
