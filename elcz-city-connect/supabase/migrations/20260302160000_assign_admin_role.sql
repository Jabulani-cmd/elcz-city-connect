-- Assign admin role to admin@citycentre-elcz.org
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@citycentre-elcz.org'
ON CONFLICT (user_id, role) DO NOTHING;
