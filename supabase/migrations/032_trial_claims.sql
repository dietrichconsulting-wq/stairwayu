-- Migration 032: Prevent trial abuse via account reset
-- Tracks a SHA-256 hash of every email that has ever claimed a 7-day trial.
-- Survives account deletion so re-signups with the same email get tier='free'
-- instead of a fresh 'trialing' subscription.

create extension if not exists pgcrypto;

create table if not exists public.trial_claims (
  email_hash       text primary key,
  first_claimed_at timestamptz not null default now()
);

-- Not touched by /api/account/delete — intentionally persists past user deletion.
comment on table public.trial_claims is
  'Records SHA-256 hashes of emails that have claimed a free trial. Never deleted, even on account removal, to prevent trial farming via delete-and-resignup.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_email_hash text;
  v_already_claimed boolean;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  v_email_hash := encode(digest(lower(trim(new.email)), 'sha256'), 'hex');

  select exists(select 1 from public.trial_claims where email_hash = v_email_hash)
    into v_already_claimed;

  if v_already_claimed then
    insert into public.subscriptions (user_id, tier, status, trial_end)
    values (new.id, 'free', null, null);
  else
    insert into public.subscriptions (user_id, tier, status, trial_end)
    values (new.id, 'pro', 'trialing', now() + interval '7 days');

    insert into public.trial_claims (email_hash)
    values (v_email_hash)
    on conflict (email_hash) do nothing;
  end if;

  return new;
end;
$$;
