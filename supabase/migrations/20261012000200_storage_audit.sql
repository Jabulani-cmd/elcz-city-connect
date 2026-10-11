-- Receipts / documents (Storage) and the audit trail.

insert into storage.buckets (id, name, public) values ('farm-files', 'farm-files', false) on conflict (id) do nothing;

-- Files are stored under  <farm_id>/<file_id>; access follows farm membership.
create policy farm_files_read on storage.objects for select using (
  bucket_id = 'farm-files' and public.farm_role_of(((storage.foldername(name))[1])::uuid) is not null);
create policy farm_files_insert on storage.objects for insert with check (
  bucket_id = 'farm-files' and public.farm_role_of(((storage.foldername(name))[1])::uuid) not in ('viewer'));
create policy farm_files_update on storage.objects for update using (
  bucket_id = 'farm-files' and public.farm_role_of(((storage.foldername(name))[1])::uuid) not in ('viewer'));
create policy farm_files_delete on storage.objects for delete using (
  bucket_id = 'farm-files' and public.farm_role_of(((storage.foldername(name))[1])::uuid) in ('owner','farm_manager'));

create table public.audit_logs (
  id bigint generated always as identity primary key,
  farm_id uuid references public.farms(id) on delete cascade,
  user_id uuid default auth.uid(), action text not null, table_name text not null, row_id uuid, changes jsonb,
  at timestamptz not null default now()
);
create index on public.audit_logs (farm_id, at desc);
alter table public.audit_logs enable row level security;
create policy audit_read on public.audit_logs for select using (public.farm_role_of(farm_id) in ('owner','farm_manager'));
-- no insert/update/delete policies: only the trigger below writes (it runs as the table owner).

create or replace function public.log_change() returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_logs (farm_id, action, table_name, row_id, changes)
  values ((r ->> 'farm_id')::uuid, case when tg_op = 'UPDATE' and r ->> 'deleted_at' is not null then 'DELETE' else tg_op end, tg_table_name, (r ->> 'id')::uuid, r - 'extra');
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['animals','livestock_sales','livestock_purchases','mortality_records','income','expenses','salary_payments','employees','documents'] loop
    execute format('create trigger %I after insert or update on public.%I for each row execute function public.log_change()', t || '_audit', t);
  end loop;
end $$;
-- Backups: enable daily backups / point-in-time recovery in the Supabase project settings (Database → Backups).
