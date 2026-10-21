-- Hardening: trigger functions must not be callable through the API; pin search_path on the rest.
revoke execute on function public.add_farm_owner() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.keep_one_owner() from public, anon, authenticated;
revoke execute on function public.log_change() from public, anon, authenticated;
revoke execute on function public.accept_invites() from public, anon;
grant execute on function public.accept_invites() to authenticated;
alter function public.touch_row() set search_path = public;
alter function public.farm_changes(uuid, timestamptz, int) set search_path = public;
