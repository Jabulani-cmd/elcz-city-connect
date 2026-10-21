-- Subscriptions: every farm gets a 7-day free trial, then needs a paid plan. Billing is per farm and the farm owner pays.
-- After the trial (or a paid period) ends the farm becomes READ-ONLY: members can still sign in and see their records, but
-- the database refuses writes (can_write() below). Payments are recorded by the Paynow edge functions with the service role.

create table public.plans (
  code text primary key,
  name text not null,
  monthly_usd numeric(8,2) not null,
  yearly_usd numeric(8,2) not null,
  max_members integer,            -- team members per farm; null = unlimited
  description text,
  sort integer not null default 0
);
insert into public.plans (code, name, monthly_usd, yearly_usd, max_members, description, sort) values
  ('starter',  'Starter',   10,  100, 2,    'Up to 2 people on your farm',   1),
  ('standard', 'Standard',  25,  250, 10,   'Up to 10 people on your farm',  2),
  ('pro',      'Pro',       50,  500, null, 'Unlimited people on your farm', 3);

create table public.subscriptions (
  farm_id uuid primary key references public.farms(id) on delete cascade,
  plan_code text references public.plans(code),
  billing_interval text check (billing_interval in ('month','year')),
  trial_ends_at timestamptz not null,
  paid_until timestamptz,
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  plan_code text not null references public.plans(code),
  billing_interval text not null check (billing_interval in ('month','year')),
  amount_usd numeric(8,2) not null,
  method text,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  reference text not null unique,
  poll_url text,
  paynow_reference text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on public.payments (farm_id, created_at desc);

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
create policy plans_read on public.plans for select to authenticated using (true);
create policy subscriptions_read on public.subscriptions for select using (public.farm_role_of(farm_id) is not null);
create policy payments_read on public.payments for select using (public.farm_role_of(farm_id) = 'owner');
-- no insert/update/delete policies: only the trigger below and the payment functions (service role) change these tables.

-- Is the farm inside its trial or a paid period? --------------------------------------------------------------------
create or replace function public.farm_active(f uuid) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select greatest(trial_ends_at, coalesce(paid_until, trial_ends_at)) > now() from public.subscriptions where farm_id = f), false) $$;

-- New farm → subscription row. The first farm a person creates gets 7 days free; any further farm they create starts
-- with no trial (so a new trial can't be had just by adding another farm).
create or replace function public.start_trial() returns trigger language plpgsql security definer set search_path = public as $$
declare had_one boolean;
begin
  select exists (select 1 from public.farms where created_by = new.created_by and id <> new.id) into had_one;
  insert into public.subscriptions (farm_id, trial_ends_at) values (new.id, case when had_one then now() else now() + interval '7 days' end)
  on conflict (farm_id) do nothing;
  return new;
end $$;
create trigger farms_start_trial after insert on public.farms for each row execute function public.start_trial();

-- farms that already exist get the standard 7 days from now
insert into public.subscriptions (farm_id, trial_ends_at) select id, now() + interval '7 days' from public.farms on conflict do nothing;

-- Writes are only allowed while the farm is active (same role rules as before). ---------------------------------------
create or replace function public.can_write(f uuid, area text) returns boolean language sql stable security definer set search_path = public as
$$ select public.farm_active(f) and case public.farm_role_of(f)
    when 'owner' then true
    when 'farm_manager' then area <> 'settings'
    when 'veterinarian' then area in ('livestock','documents','notifications')
    when 'agronomist' then area in ('agriculture','inventory','documents','notifications')
    when 'employee' then area in ('livestock','agriculture','tasks','notifications')
    when 'accountant' then area in ('finance','documents','notifications')
    else false end $$;

-- (alter, not drop/create: dropping policies on storage.objects can wait forever on the storage service's locks)
alter policy farm_files_insert on storage.objects with check (
  bucket_id = 'farm-files' and public.farm_active(((storage.foldername(name))[1])::uuid)
  and public.farm_role_of(((storage.foldername(name))[1])::uuid) not in ('viewer'));
alter policy farm_files_update on storage.objects using (
  bucket_id = 'farm-files' and public.farm_active(((storage.foldername(name))[1])::uuid)
  and public.farm_role_of(((storage.foldername(name))[1])::uuid) not in ('viewer'));

-- Team size follows the plan (a trial has no limit). Checked when someone is invited and when they join. ---------------
create or replace function public.plan_member_limit(f uuid) returns integer language sql stable security definer set search_path = public as
$$ select p.max_members from public.subscriptions s join public.plans p on p.code = s.plan_code
   where s.farm_id = f and s.paid_until is not null and s.paid_until > now() $$;

create or replace function public.check_team_size() returns trigger language plpgsql security definer set search_path = public as $$
declare lim integer := public.plan_member_limit(new.farm_id); used integer;
begin
  if lim is null then return new; end if;
  -- people already on the farm; an invitation also counts the invitations still waiting (a joining member's own invitation is already counted as theirs)
  select count(*) into used from public.farm_members where farm_id = new.farm_id;
  if tg_table_name = 'farm_invites' then
    used := used + (select count(*) from public.farm_invites where farm_id = new.farm_id and accepted_at is null);
  end if;
  if used >= lim then raise exception 'Your plan allows % people on this farm. Upgrade the plan to add more.', lim using errcode = 'P0001'; end if;
  return new;
end $$;
create trigger members_team_size before insert on public.farm_members for each row execute function public.check_team_size();
create trigger invites_team_size before insert on public.farm_invites for each row execute function public.check_team_size();

-- Called only by the payment functions (service role) once Paynow confirms a payment. Safe to call twice. -------------
create or replace function public.apply_payment(ref text) returns void language plpgsql security definer set search_path = public as $$
declare p public.payments;
begin
  select * into p from public.payments where reference = ref for update;
  if not found or p.status = 'paid' then return; end if;
  update public.payments set status = 'paid', paid_at = now() where id = p.id;
  update public.subscriptions
     set plan_code = p.plan_code, billing_interval = p.billing_interval,
         paid_until = greatest(coalesce(paid_until, now()), now()) + case when p.billing_interval = 'year' then interval '1 year' else interval '1 month' end,
         updated_at = now()
   where farm_id = p.farm_id;
end $$;
revoke execute on function public.apply_payment(text) from public, anon, authenticated;
revoke execute on function public.start_trial() from public, anon, authenticated;
revoke execute on function public.check_team_size() from public, anon, authenticated;
revoke execute on function public.farm_active(uuid) from public, anon;
grant execute on function public.farm_active(uuid) to authenticated;
revoke execute on function public.plan_member_limit(uuid) from public, anon, authenticated;
