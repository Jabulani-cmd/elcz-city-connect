
-- Fix gallery_photos policies
DROP POLICY IF EXISTS "Anyone can view gallery" ON public.gallery_photos;
DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_photos;
DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_photos;
DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_photos;

CREATE POLICY "Anyone can view gallery" ON public.gallery_photos FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery" ON public.gallery_photos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update gallery" ON public.gallery_photos FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete gallery" ON public.gallery_photos FOR DELETE USING (is_admin());

-- Fix announcements policies
DROP POLICY IF EXISTS "Anyone can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

CREATE POLICY "Anyone can view published announcements" ON public.announcements FOR SELECT USING ((published = true) OR is_admin());
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (is_admin());

-- Fix carousel_images policies
DROP POLICY IF EXISTS "Anyone can view active carousel images" ON public.carousel_images;
DROP POLICY IF EXISTS "Admins can insert carousel images" ON public.carousel_images;
DROP POLICY IF EXISTS "Admins can update carousel images" ON public.carousel_images;
DROP POLICY IF EXISTS "Admins can delete carousel images" ON public.carousel_images;

CREATE POLICY "Anyone can view active carousel images" ON public.carousel_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert carousel images" ON public.carousel_images FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update carousel images" ON public.carousel_images FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete carousel images" ON public.carousel_images FOR DELETE USING (is_admin());

-- Fix events policies
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (is_admin());

-- Fix downloadable_resources policies
DROP POLICY IF EXISTS "Anyone can view resources" ON public.downloadable_resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.downloadable_resources;
DROP POLICY IF EXISTS "Admins can update resources" ON public.downloadable_resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON public.downloadable_resources;

CREATE POLICY "Anyone can view resources" ON public.downloadable_resources FOR SELECT USING (true);
CREATE POLICY "Admins can insert resources" ON public.downloadable_resources FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update resources" ON public.downloadable_resources FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete resources" ON public.downloadable_resources FOR DELETE USING (is_admin());

-- Fix prayer_requests policies
DROP POLICY IF EXISTS "Anyone can view public prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Admins can insert prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Admins can update prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Admins can delete prayer requests" ON public.prayer_requests;

CREATE POLICY "Anyone can view public prayer requests" ON public.prayer_requests FOR SELECT USING ((is_public = true) OR is_admin());
CREATE POLICY "Admins can insert prayer requests" ON public.prayer_requests FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update prayer requests" ON public.prayer_requests FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete prayer requests" ON public.prayer_requests FOR DELETE USING (is_admin());

-- Fix members policies
DROP POLICY IF EXISTS "Admins can view members" ON public.members;
DROP POLICY IF EXISTS "Admins can insert members" ON public.members;
DROP POLICY IF EXISTS "Admins can update members" ON public.members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.members;
DROP POLICY IF EXISTS "Anyone can register as a member" ON public.members;

CREATE POLICY "Admins can view members" ON public.members FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert members" ON public.members FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update members" ON public.members FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE USING (is_admin());
CREATE POLICY "Anyone can register as a member" ON public.members FOR INSERT WITH CHECK (true);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;

CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT USING (is_admin());
