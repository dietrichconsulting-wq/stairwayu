-- Enable RLS on service-role-only tables.
--
-- Both tables are written/read exclusively from server-side code via
-- createServiceClient (which bypasses RLS). Without RLS enabled, the anon
-- and authenticated roles inherit Supabase's default SELECT grant on public
-- tables, which means:
--
--   trial_claims          : email enumeration via SHA-256 hash precomputation
--                            (compute hash for any email, check if row exists)
--   stripe_webhook_events : leaks billing volume and event timestamps
--
-- Fix: enable RLS with no policies. Default-deny for anon/authenticated;
-- service role bypasses RLS so application code is unaffected.
--
-- Idempotent: ENABLE ROW LEVEL SECURITY is a no-op if already enabled.

alter table public.trial_claims enable row level security;

alter table public.stripe_webhook_events enable row level security;

-- Verification (run manually after deploy):
--   select tablename, rowsecurity from pg_tables
--   where schemaname = 'public'
--     and tablename in ('trial_claims', 'stripe_webhook_events');
-- Both rows should show rowsecurity = true.
--
-- Negative test (should return 0 rows or permission error, not real data):
--   With anon-key client:
--     select count(*) from trial_claims;
--     select count(*) from stripe_webhook_events;
