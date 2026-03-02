
-- Add unique constraint on members to prevent duplicates (by first_name + last_name + phone or first_name + last_name + email)
CREATE UNIQUE INDEX idx_members_unique_name_phone ON public.members (lower(first_name), lower(last_name), phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX idx_members_unique_name_email ON public.members (lower(first_name), lower(last_name), email) WHERE email IS NOT NULL;

-- Create carousel_images table for admin-managed hero carousel
CREATE TABLE public.carousel_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active carousel images" ON public.carousel_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert carousel images" ON public.carousel_images FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update carousel images" ON public.carousel_images FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete carousel images" ON public.carousel_images FOR DELETE USING (is_admin());

CREATE TRIGGER update_carousel_images_updated_at BEFORE UPDATE ON public.carousel_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
