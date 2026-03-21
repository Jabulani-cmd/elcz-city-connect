
-- is_pastor helper function
CREATE OR REPLACE FUNCTION public.is_pastor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'pastor')
$$;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin() OR public.is_pastor());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles auto-insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  head_of_household_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  address TEXT,
  home_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage families" ON public.families FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view families" ON public.families FOR SELECT USING (true);

-- Add family_id to members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE SET NULL;

-- Pastoral notes
CREATE TABLE IF NOT EXISTS public.pastoral_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  follow_up_date DATE,
  is_confidential BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pastoral_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage pastoral notes" ON public.pastoral_notes FOR ALL USING (public.is_admin() OR public.is_pastor());

-- Counseling sessions
CREATE TABLE IF NOT EXISTS public.counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_date TIMESTAMPTZ NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'individual',
  topics TEXT[],
  notes TEXT,
  action_items TEXT,
  next_session_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage counseling" ON public.counseling_sessions FOR ALL USING (public.is_admin() OR public.is_pastor());

-- Sermon series
CREATE TABLE IF NOT EXISTS public.sermon_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sermon_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage sermon series" ON public.sermon_series FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view sermon series" ON public.sermon_series FOR SELECT USING (true);

-- Sermons
CREATE TABLE IF NOT EXISTS public.sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.sermon_series(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scripture_references TEXT[],
  date_preached DATE,
  service_type TEXT DEFAULT 'sunday_worship',
  draft_content TEXT,
  published_content TEXT,
  outline TEXT,
  illustrations TEXT,
  application_points TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  video_url TEXT,
  audio_url TEXT,
  slides_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage sermons" ON public.sermons FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view published sermons" ON public.sermons FOR SELECT USING (status = 'published');

-- Ministry teams
CREATE TABLE IF NOT EXISTS public.ministry_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'users',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ministry_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage teams" ON public.ministry_teams FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view teams" ON public.ministry_teams FOR SELECT USING (true);

-- Volunteer assignments
CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.ministry_teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  skills TEXT[],
  availability TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage volunteers" ON public.volunteer_assignments FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view volunteers" ON public.volunteer_assignments FOR SELECT USING (true);

-- Service schedules
CREATE TABLE IF NOT EXISTS public.service_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date DATE NOT NULL,
  service_time TEXT,
  service_type TEXT NOT NULL DEFAULT 'sunday_worship',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage schedules" ON public.service_schedules FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view schedules" ON public.service_schedules FOR SELECT USING (true);

-- Schedule assignments
CREATE TABLE IF NOT EXISTS public.schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.service_schedules(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.ministry_teams(id) ON DELETE SET NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage assignments" ON public.schedule_assignments FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view assignments" ON public.schedule_assignments FOR SELECT USING (true);

-- Song library
CREATE TABLE IF NOT EXISTS public.song_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  ccli_number TEXT,
  key TEXT,
  lyrics TEXT,
  chord_chart_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.song_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage songs" ON public.song_library FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view songs" ON public.song_library FOR SELECT USING (true);

-- Service plans
CREATE TABLE IF NOT EXISTS public.service_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.service_schedules(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  element_type TEXT NOT NULL DEFAULT 'song',
  song_id UUID REFERENCES public.song_library(id) ON DELETE SET NULL,
  title TEXT,
  notes TEXT,
  duration_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage plans" ON public.service_plans FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view plans" ON public.service_plans FOR SELECT USING (true);

-- Event registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  quantity INTEGER DEFAULT 1,
  amount_paid NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage registrations" ON public.event_registrations FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can register for events" ON public.event_registrations FOR INSERT WITH CHECK (true);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Pastors and admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin() OR public.is_pastor());

-- Giving funds
CREATE TABLE IF NOT EXISTS public.giving_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.giving_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage funds" ON public.giving_funds FOR ALL USING (public.is_admin() OR public.is_pastor());
CREATE POLICY "Anyone can view active funds" ON public.giving_funds FOR SELECT USING (is_active = true);

-- Giving transactions
CREATE TABLE IF NOT EXISTS public.giving_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  fund_id UUID REFERENCES public.giving_funds(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  transaction_ref TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.giving_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage transactions" ON public.giving_transactions FOR ALL USING (public.is_admin() OR public.is_pastor());

-- Giving pledges
CREATE TABLE IF NOT EXISTS public.giving_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES public.giving_funds(id) ON DELETE SET NULL,
  pledge_amount NUMERIC NOT NULL,
  pledge_frequency TEXT DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.giving_pledges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pastors and admins can manage pledges" ON public.giving_pledges FOR ALL USING (public.is_admin() OR public.is_pastor());
