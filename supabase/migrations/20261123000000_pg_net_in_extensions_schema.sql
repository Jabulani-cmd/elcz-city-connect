-- pg_net was installed in the public schema (security advisor: extension_in_public). It can't be moved, so recreate it in `extensions`.
-- Only the daily digest job uses it, and that calls net.http_post, which lives in the extension's own `net` schema either way.
do $$
begin
  if exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_net' and n.nspname = 'public') then
    drop extension pg_net;
    create extension pg_net with schema extensions;
  end if;
end $$;
