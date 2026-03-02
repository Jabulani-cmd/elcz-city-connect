
-- Choir members table
CREATE TABLE public.choir_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  voice_part TEXT NOT NULL DEFAULT 'soprano',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.choir_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved choir members" ON public.choir_members FOR SELECT USING ((is_approved = true) OR is_admin());
CREATE POLICY "Anyone can submit choir application" ON public.choir_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update choir members" ON public.choir_members FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete choir members" ON public.choir_members FOR DELETE USING (is_admin());

CREATE TRIGGER update_choir_members_updated_at BEFORE UPDATE ON public.choir_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Choir group photo table (single photo or gallery)
CREATE TABLE public.choir_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_group_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ministry_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ministry photos" ON public.ministry_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert ministry photos" ON public.ministry_photos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update ministry photos" ON public.ministry_photos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete ministry photos" ON public.ministry_photos FOR DELETE USING (is_admin());

-- Storage bucket for choir photos
INSERT INTO storage.buckets (id, name, public) VALUES ('choir-photos', 'choir-photos', true);

CREATE POLICY "Anyone can view choir photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'choir-photos');
CREATE POLICY "Admins can upload choir photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'choir-photos' AND (SELECT is_admin()));
CREATE POLICY "Admins can delete choir photos storage" ON storage.objects FOR DELETE USING (bucket_id = 'choir-photos' AND (SELECT is_admin()));

-- Storage bucket for ministry photos
INSERT INTO storage.buckets (id, name, public) VALUES ('ministry-photos', 'ministry-photos', true);

CREATE POLICY "Anyone can view ministry photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'ministry-photos');
CREATE POLICY "Admins can upload ministry photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ministry-photos' AND (SELECT is_admin()));
CREATE POLICY "Admins can delete ministry photos storage" ON storage.objects FOR DELETE USING (bucket_id = 'ministry-photos' AND (SELECT is_admin()));
