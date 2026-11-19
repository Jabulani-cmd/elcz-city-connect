-- The digest function proves a call comes from the scheduler by sending the secret held in Vault; the check happens here so the secret
-- never has to be copied into function settings.
create or replace function public.digest_secret_ok(s text) returns boolean language sql stable security definer set search_path = public, vault as $$
  select s is not null and s <> '' and exists (select 1 from vault.decrypted_secrets where name = 'notify_digest_secret' and decrypted_secret = s)
$$;
revoke all on function public.digest_secret_ok(text) from public, anon, authenticated;
grant execute on function public.digest_secret_ok(text) to service_role;
