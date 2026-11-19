-- Payment receipts: when a payment succeeds the payment function emails the payer a receipt (once). The payments row records who it went
-- to and what happened to it, so the Billing page can say "Receipt emailed to …". receipt_sent_at is claimed atomically so two
-- overlapping status checks can never send two receipts.
alter table public.payments add column if not exists receipt_sent_at timestamptz;
alter table public.payments add column if not exists receipt_to text;
alter table public.payments add column if not exists receipt_status text; -- sent | demo | not_configured | failed | no_email

-- Messages that go to a person who is not a notification contact (receipts) show their address in Recent messages.
alter table public.notification_log add column if not exists recipient text;
