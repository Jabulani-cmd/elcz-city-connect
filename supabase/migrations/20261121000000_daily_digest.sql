-- Daily alert digest: every morning the database calls the `notify-digest` edge function, which messages each farm's contacts.
-- 05:00 UTC = 07:00 in Zimbabwe. Change the schedule with:  select cron.alter_job((select jobid from cron.job where jobname = 'farmhelper-daily-digest'), schedule => '0 4 * * *');
--
-- One-time set-up after deploying the function (SQL editor), with your own project URL and a long random secret:
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/notify-digest', 'notify_digest_url');
--   select vault.create_secret('<a long random value>', 'notify_digest_secret');
-- Until both exist the job does nothing, so running this migration first is harmless.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.run_notify_digest() returns void language plpgsql security definer set search_path = public, extensions as $$
declare u text; s text;
begin
  select decrypted_secret into u from vault.decrypted_secrets where name = 'notify_digest_url';
  select decrypted_secret into s from vault.decrypted_secrets where name = 'notify_digest_secret';
  if u is null or s is null then return; end if;
  perform net.http_post(url := u, headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', s), body := '{}'::jsonb);
end $$;
revoke all on function public.run_notify_digest() from public, anon, authenticated;

select cron.unschedule('farmhelper-daily-digest') where exists (select 1 from cron.job where jobname = 'farmhelper-daily-digest');
select cron.schedule('farmhelper-daily-digest', '0 5 * * *', 'select public.run_notify_digest()');
