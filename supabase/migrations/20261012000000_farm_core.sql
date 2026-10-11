-- FarmHelper core: accounts, farms, membership, roles, invitations. The data tables are in the next (generated) migration.

create type public.farm_role as enum ('owner','farm_manager','veterinarian','agronomist','employee','accountant','viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text, created_at timestamptz not null default now()
);

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null, location text, latitude numeric, longitude numeric, size_ha numeric, agri_ha numeric, pasture_ha numeric,
  farm_type text, manager text, phone text, email text, registration text, description text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.farm_members (
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.farm_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (farm_id, user_id)
);

create table public.farm_invites (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  email text not null, role public.farm_role not null default 'viewer',
  invited_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(), accepted_at timestamptz
);
create unique index farm_invites_pending_uniq on public.farm_invites (farm_id, lower(email)) where accepted_at is null;

-- helpers (security definer so policies can use them without recursing into RLS) ---------------------------------
create or replace function public.touch_row() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.farm_role_of(f uuid) returns public.farm_role language sql stable security definer set search_path = public as
$$ select role from public.farm_members where farm_id = f and user_id = auth.uid() $$;

-- Mirrors src/lib/permissions.ts: which roles may write which area.
create or replace function public.can_write(f uuid, area text) returns boolean language sql stable security definer set search_path = public as
$$ select case public.farm_role_of(f)
    when 'owner' then true
    when 'farm_manager' then area <> 'settings'
    when 'veterinarian' then area in ('livestock','documents','notifications')
    when 'agronomist' then area in ('agriculture','inventory','documents','notifications')
    when 'employee' then area in ('livestock','agriculture','tasks','notifications')
    when 'accountant' then area in ('finance','documents','notifications')
    else false end $$;

-- new user → profile ---------------------------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- creator of a farm becomes its owner ----------------------------------------------------------------------------
create or replace function public.add_farm_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.farm_members (farm_id, user_id, role) values (new.id, new.created_by, 'owner') on conflict do nothing;
  return new;
end $$;
create trigger farms_add_owner after insert on public.farms for each row execute function public.add_farm_owner();
create trigger farms_touch before update on public.farms for each row execute function public.touch_row();

-- a farm must always keep at least one owner ---------------------------------------------------------------------
create or replace function public.keep_one_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner')
     and not exists (select 1 from public.farm_members where farm_id = old.farm_id and role = 'owner' and user_id <> old.user_id)
     and exists (select 1 from public.farms where id = old.farm_id) then
    raise exception 'A farm must keep at least one owner';
  end if;
  return coalesce(new, old);
end $$;
create trigger members_keep_owner before update or delete on public.farm_members for each row execute function public.keep_one_owner();

-- invitations: called after sign-in; joins the user to every farm that invited their email ----------------------------
create or replace function public.accept_invites() returns integer language plpgsql security definer set search_path = public as $$
declare n integer := 0; me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or me = '' then return 0; end if;
  with joined as (
    insert into public.farm_members (farm_id, user_id, role)
    select farm_id, auth.uid(), role from public.farm_invites where lower(email) = me and accepted_at is null
    on conflict (farm_id, user_id) do nothing returning farm_id
  ) select count(*) into n from joined;
  update public.farm_invites set accepted_at = now() where lower(email) = me and accepted_at is null;
  return n;
end $$;
grant execute on function public.accept_invites() to authenticated;

-- row-level security ---------------------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.farm_invites enable row level security;

create policy profiles_read on public.profiles for select using (
  id = auth.uid() or exists (select 1 from public.farm_members a join public.farm_members b on a.farm_id = b.farm_id where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy farms_read on public.farms for select using (public.farm_role_of(id) is not null or created_by = auth.uid());
create policy farms_insert on public.farms for insert with check (created_by = auth.uid());
create policy farms_update on public.farms for update using (public.farm_role_of(id) in ('owner','farm_manager')) with check (public.farm_role_of(id) in ('owner','farm_manager'));
create policy farms_delete on public.farms for delete using (public.farm_role_of(id) = 'owner');

create policy members_read on public.farm_members for select using (public.farm_role_of(farm_id) is not null);
create policy members_insert on public.farm_members for insert with check (public.farm_role_of(farm_id) = 'owner');
create policy members_update on public.farm_members for update using (public.farm_role_of(farm_id) = 'owner') with check (public.farm_role_of(farm_id) = 'owner');
create policy members_delete on public.farm_members for delete using (public.farm_role_of(farm_id) = 'owner' or user_id = auth.uid());

create policy invites_owner on public.farm_invites for all using (public.farm_role_of(farm_id) = 'owner') with check (public.farm_role_of(farm_id) = 'owner');
