-- Idempotency table for Stripe webhook deduplication
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  created_at timestamptz not null default now()
);

-- Auto-clean events older than 7 days (Stripe retries for up to 3 days)
-- Run via pg_cron or manual cleanup; index supports efficient deletion.
create index idx_stripe_webhook_events_created_at
  on public.stripe_webhook_events (created_at);
