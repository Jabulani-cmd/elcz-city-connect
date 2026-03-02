
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Convenience function for current user
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- user_roles RLS
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT USING (is_admin());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Gallery photos table
CREATE TABLE public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gallery" ON public.gallery_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery" ON public.gallery_photos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update gallery" ON public.gallery_photos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete gallery" ON public.gallery_photos FOR DELETE USING (is_admin());
CREATE TRIGGER update_gallery_photos_updated_at BEFORE UPDATE ON public.gallery_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published announcements" ON public.announcements FOR SELECT USING ((published = true) OR is_admin());
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (is_admin());
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'Worship',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (is_admin());
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prayer requests table
CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request TEXT NOT NULL,
  requested_by TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public prayer requests" ON public.prayer_requests FOR SELECT USING ((is_public = true) OR is_admin());
CREATE POLICY "Admins can insert prayer requests" ON public.prayer_requests FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update prayer requests" ON public.prayer_requests FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete prayer requests" ON public.prayer_requests FOR DELETE USING (is_admin());
CREATE TRIGGER update_prayer_requests_updated_at BEFORE UPDATE ON public.prayer_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  league TEXT NOT NULL DEFAULT 'none',
  gender TEXT,
  date_of_birth DATE,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  confirmed_in_church BOOLEAN NOT NULL DEFAULT false,
  baptized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view members" ON public.members FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert members" ON public.members FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update members" ON public.members FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE USING (is_admin());
CREATE POLICY "Anyone can register as a member" ON public.members FOR INSERT WITH CHECK (true);
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE UNIQUE INDEX idx_members_unique_name_phone ON public.members (lower(first_name), lower(last_name), phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX idx_members_unique_name_email ON public.members (lower(first_name), lower(last_name), email) WHERE email IS NOT NULL;

-- Downloadable resources table
CREATE TABLE public.downloadable_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'hymn_book',
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.downloadable_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view resources" ON public.downloadable_resources FOR SELECT USING (true);
CREATE POLICY "Admins can insert resources" ON public.downloadable_resources FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update resources" ON public.downloadable_resources FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete resources" ON public.downloadable_resources FOR DELETE USING (is_admin());
CREATE TRIGGER update_downloadable_resources_updated_at BEFORE UPDATE ON public.downloadable_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Carousel images table
CREATE TABLE public.carousel_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active carousel images" ON public.carousel_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert carousel images" ON public.carousel_images FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update carousel images" ON public.carousel_images FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete carousel images" ON public.carousel_images FOR DELETE USING (is_admin());
CREATE TRIGGER update_carousel_images_updated_at BEFORE UPDATE ON public.carousel_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Livestream videos table
CREATE TABLE public.livestream_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'youtube',
  event_date DATE NOT NULL,
  description TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.livestream_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view livestream videos" ON public.livestream_videos FOR SELECT USING (true);
CREATE POLICY "Admins can insert livestream videos" ON public.livestream_videos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update livestream videos" ON public.livestream_videos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete livestream videos" ON public.livestream_videos FOR DELETE USING (is_admin());

-- Preaching schedule table
CREATE TABLE public.preaching_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preacher_name TEXT NOT NULL,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'sunday_worship',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.preaching_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view preaching schedule" ON public.preaching_schedule FOR SELECT USING (true);
CREATE POLICY "Admins can insert preaching schedule" ON public.preaching_schedule FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update preaching schedule" ON public.preaching_schedule FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete preaching schedule" ON public.preaching_schedule FOR DELETE USING (is_admin());

-- Home prayer locations table
CREATE TABLE public.home_prayer_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_date DATE NOT NULL,
  host_name TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gallery videos" ON public.gallery_videos FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery videos" ON public.gallery_videos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update gallery videos" ON public.gallery_videos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete gallery videos" ON public.gallery_videos FOR DELETE USING (is_admin());

-- Choir members table
CREATE TABLE public.choir_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  voice_part TEXT NOT NULL DEFAULT 'soprano',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.choir_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved choir members" ON public.choir_members FOR SELECT USING ((is_approved = true) OR is_admin());
CREATE POLICY "Anyone can submit choir application" ON public.choir_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update choir members" ON public.choir_members FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete choir members" ON public.choir_members FOR DELETE USING (is_admin());
CREATE TRIGGER update_choir_members_updated_at BEFORE UPDATE ON public.choir_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Choir photos table
CREATE TABLE public.choir_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_group_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.choir_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view choir photos" ON public.choir_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert choir photos" ON public.choir_photos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update choir photos" ON public.choir_photos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete choir photos" ON public.choir_photos FOR DELETE USING (is_admin());

-- Ministry photos table
CREATE TABLE public.ministry_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ministry_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ministry photos" ON public.ministry_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert ministry photos" ON public.ministry_photos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update ministry photos" ON public.ministry_photos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete ministry photos" ON public.ministry_photos FOR DELETE USING (is_admin());

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Planning',
  target_amount NUMERIC(12,2) DEFAULT 0,
  amount_raised NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Admins can insert projects" ON public.projects FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update projects" ON public.projects FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING (is_admin());
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Choir practice schedule table
CREATE TABLE public.choir_practice_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_day TEXT NOT NULL,
  practice_time TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.choir_practice_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active choir practice schedule" ON public.choir_practice_schedule FOR SELECT USING (true);
CREATE POLICY "Admins can insert choir practice schedule" ON public.choir_practice_schedule FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update choir practice schedule" ON public.choir_practice_schedule FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete choir practice schedule" ON public.choir_practice_schedule FOR DELETE USING (is_admin());
CREATE TRIGGER update_choir_practice_updated_at BEFORE UPDATE ON public.choir_practice_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('downloads', 'downloads', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('leader-photos', 'leader-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('choir-photos', 'choir-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ministry-photos', 'ministry-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-videos', 'gallery-videos', true);

-- Storage policies for gallery
CREATE POLICY "Anyone can view gallery images" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND public.is_admin());
CREATE POLICY "Admins can update gallery images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery' AND public.is_admin());
CREATE POLICY "Admins can delete gallery images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND public.is_admin());

-- Storage policies for downloads
CREATE POLICY "Anyone can view downloads" ON storage.objects FOR SELECT USING (bucket_id = 'downloads');
CREATE POLICY "Admins can upload downloads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'downloads' AND public.is_admin());
CREATE POLICY "Admins can update downloads" ON storage.objects FOR UPDATE USING (bucket_id = 'downloads' AND public.is_admin());
CREATE POLICY "Admins can delete downloads" ON storage.objects FOR DELETE USING (bucket_id = 'downloads' AND public.is_admin());

-- Storage policies for leader-photos
CREATE POLICY "Anyone can view leader photos" ON storage.objects FOR SELECT USING (bucket_id = 'leader-photos');
CREATE POLICY "Admins can upload leader photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'leader-photos' AND public.is_admin());
CREATE POLICY "Admins can update leader photos" ON storage.objects FOR UPDATE USING (bucket_id = 'leader-photos' AND public.is_admin());
CREATE POLICY "Admins can delete leader photos" ON storage.objects FOR DELETE USING (bucket_id = 'leader-photos' AND public.is_admin());

-- Storage policies for choir-photos
CREATE POLICY "Anyone can view choir photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'choir-photos');
CREATE POLICY "Admins can upload choir photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'choir-photos' AND (SELECT is_admin()));
CREATE POLICY "Admins can delete choir photos storage" ON storage.objects FOR DELETE USING (bucket_id = 'choir-photos' AND (SELECT is_admin()));

-- Storage policies for ministry-photos
CREATE POLICY "Anyone can view ministry photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'ministry-photos');
CREATE POLICY "Admins can upload ministry photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ministry-photos' AND (SELECT is_admin()));
CREATE POLICY "Admins can delete ministry photos storage" ON storage.objects FOR DELETE USING (bucket_id = 'ministry-photos' AND (SELECT is_admin()));

-- Storage policies for gallery-videos
CREATE POLICY "Anyone can view gallery videos storage" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-videos');
CREATE POLICY "Admins can upload gallery videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery-videos' AND public.is_admin());
CREATE POLICY "Admins can delete gallery videos" ON storage.objects FOR DELETE USING (bucket_id = 'gallery-videos' AND public.is_admin());
