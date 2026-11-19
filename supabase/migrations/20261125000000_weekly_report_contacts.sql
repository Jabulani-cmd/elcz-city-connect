-- Weekly CSV report: each Monday the daily digest function emails last week's report (as a CSV attachment) to every contact
-- with email switched on and this flag set. Contacts can switch it off individually.
alter table public.notification_contacts add column if not exists want_weekly boolean not null default true;
