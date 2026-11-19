-- WhatsApp / SMS / email notifications.
-- notification_contacts: the people (and numbers / addresses) who receive messages for a farm. Only owners and farm managers manage it.
-- notification_log: one row per message attempt. Written only by the `notify` edge function (service role). It is also what stops the
--   same alert being sent twice (dedupe_key) and caps how many messages a farm can send per hour.

create table public.notification_contacts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  phone text,                         -- any local or international format; the function turns it into +<country><number>
  email text,
  via_whatsapp boolean not null default true,
  via_sms boolean not null default false,
  via_email boolean not null default true,
  want_activity boolean not null default true,   -- "Jane added an animal", "Payment recorded", ...
  want_alerts boolean not null default true,     -- vaccinations due, low feed, overdue tasks, ...
  created_at timestamptz not null default now()
);
create index on public.notification_contacts (farm_id);
alter table public.notification_contacts enable row level security;
create policy contacts_read on public.notification_contacts for select using (public.farm_role_of(farm_id) in ('owner','farm_manager'));
create policy contacts_insert on public.notification_contacts for insert with check (public.farm_role_of(farm_id) in ('owner','farm_manager'));
create policy contacts_update on public.notification_contacts for update using (public.farm_role_of(farm_id) in ('owner','farm_manager')) with check (public.farm_role_of(farm_id) in ('owner','farm_manager'));
create policy contacts_delete on public.notification_contacts for delete using (public.farm_role_of(farm_id) in ('owner','farm_manager'));

create table public.notification_log (
  id bigint generated always as identity primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  contact_id uuid references public.notification_contacts(id) on delete set null,
  channel text not null check (channel in ('whatsapp','sms','email')),
  kind text not null,                 -- 'activity' | 'alert' | 'test'
  dedupe_key text,
  status text not null,               -- 'sent' | 'failed' | 'not_configured' | 'skipped'
  error text,
  at timestamptz not null default now()
);
create index on public.notification_log (farm_id, at desc);
create unique index notification_log_dedupe on public.notification_log (farm_id, contact_id, channel, dedupe_key) where dedupe_key is not null and status = 'sent';
alter table public.notification_log enable row level security;
create policy notification_log_read on public.notification_log for select using (public.farm_role_of(farm_id) in ('owner','farm_manager'));
-- no insert/update/delete policies: only the edge function (service role) writes.

-- Per-kind WhatsApp switch next to the existing in-app / push / email / SMS ones (Notifications page).
alter table public.notification_prefs add column if not exists whatsapp text;
