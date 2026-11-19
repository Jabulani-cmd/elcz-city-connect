-- Demo mode for notifications: the log keeps what each message said (preview), so the app can show a "Recent messages" list, and
-- messages simulated in demo mode (NOTIFY_MODE=demo, nothing is actually sent) are logged with status 'demo'.
alter table public.notification_log add column if not exists preview text;
