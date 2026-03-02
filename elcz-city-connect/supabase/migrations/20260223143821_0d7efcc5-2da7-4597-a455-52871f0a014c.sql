
-- Church members table
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Only admins can manage members
CREATE POLICY "Admins can view members" ON public.members FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert members" ON public.members FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update members" ON public.members FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE TO authenticated USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
