-- Allow public member self-registration (no auth required)
CREATE POLICY "Anyone can register as a member"
ON public.members
FOR INSERT
WITH CHECK (true);
