
CREATE TABLE public.choir_practice_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_day TEXT NOT NULL,
  practice_time TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.choir_practice_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active choir practice schedule" ON public.choir_practice_schedule FOR SELECT USING (true);
CREATE POLICY "Admins can insert choir practice schedule" ON public.choir_practice_schedule FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update choir practice schedule" ON public.choir_practice_schedule FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete choir practice schedule" ON public.choir_practice_schedule FOR DELETE USING (is_admin());

CREATE TRIGGER update_choir_practice_updated_at
BEFORE UPDATE ON public.choir_practice_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
