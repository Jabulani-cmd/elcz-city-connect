-- Keys that let GPS collars / tags / gateways post positions to the device-ingest edge function (supabase/functions/device-ingest).
-- Only the SHA-256 hash of a key is stored. No policies: the table is reachable only with the service role (the function), never from the app.
create table public.device_ingest_keys (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  label text,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.device_ingest_keys enable row level security;

-- To create a key (run in the SQL editor as an admin; keep the plain key, it cannot be recovered):
--   select 'fk_' || encode(gen_random_bytes(24), 'hex') as key \gset
--   insert into public.device_ingest_keys (farm_id, label, key_hash) values ('<farm uuid>', 'Collar gateway', encode(digest(:'key', 'sha256'), 'hex'));
--   select :'key';
