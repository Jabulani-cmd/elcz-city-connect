
-- Allow pastors to read members (currently only admins can)
CREATE POLICY "Pastors can view members"
ON public.members
FOR SELECT
TO authenticated
USING (is_pastor());

-- Allow pastors to update members
CREATE POLICY "Pastors can update members"
ON public.members
FOR UPDATE
TO authenticated
USING (is_pastor());

-- Allow pastors to insert members
CREATE POLICY "Pastors can insert members"
ON public.members
FOR INSERT
TO authenticated
WITH CHECK (is_pastor());

-- Allow pastors to manage prayer requests
CREATE POLICY "Pastors can manage prayer requests"
ON public.prayer_requests
FOR ALL
TO authenticated
USING (is_pastor());

-- Allow pastors to manage announcements
CREATE POLICY "Pastors can manage announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (is_pastor());

-- Allow pastors to manage events
CREATE POLICY "Pastors can manage events"
ON public.events
FOR ALL
TO authenticated
USING (is_pastor());
