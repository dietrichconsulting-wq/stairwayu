-- Freemium model: replace credit balance with daily AI usage tracking
-- Free tier: 4 colleges, 3 AI calls/day
-- Pro tier: unlimited colleges, unlimited AI calls

-- Track daily AI usage per user (resets each day automatically)
create table if not exists public.daily_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  call_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, usage_date)
);

alter table public.daily_ai_usage enable row level security;

create policy "Users can read own daily usage"
  on public.daily_ai_usage for select
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_daily_ai_usage_user_date
  on public.daily_ai_usage(user_id, usage_date desc);

-- Atomic increment: returns the new call count for today
create or replace function public.record_ai_usage(p_user_id uuid)
returns integer as $$
declare
  v_count integer;
begin
  insert into public.daily_ai_usage (user_id, usage_date, call_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set call_count = daily_ai_usage.call_count + 1
  returning call_count into v_count;

  return v_count;
end;
$$ language plpgsql security definer;

-- Get today's usage count for a user
create or replace function public.get_daily_ai_usage(p_user_id uuid)
returns integer as $$
declare
  v_count integer;
begin
  select call_count into v_count
  from public.daily_ai_usage
  where user_id = p_user_id and usage_date = current_date;

  return coalesce(v_count, 0);
end;
$$ language plpgsql security definer;

-- Enforce college limit for free-tier users via RLS
-- Free users can only have up to 4 colleges
create or replace function public.check_college_limit()
returns trigger as $$
declare
  v_tier text;
  v_status text;
  v_trial_end timestamptz;
  v_count integer;
begin
  -- Get user's subscription tier
  select tier, status, trial_end into v_tier, v_status, v_trial_end
  from public.subscriptions
  where user_id = new.user_id;

  -- Check if user is Pro (active or valid trial)
  if v_tier = 'pro' and (v_status = 'active' or (v_status = 'trialing' and v_trial_end > now())) then
    return new;
  end if;

  -- Free tier: enforce 4-college limit
  select count(*) into v_count
  from public.user_colleges
  where user_id = new.user_id;

  if v_count >= 4 then
    raise exception 'Free plan allows up to 4 colleges. Upgrade to Pro for unlimited.' using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_college_limit on public.user_colleges;
create trigger enforce_college_limit
  before insert on public.user_colleges
  for each row execute function public.check_college_limit();

-- Remove the credit-grant trigger on signup (no longer needed)
drop trigger if exists on_auth_user_created_grant_credits on auth.users;

-- Clean up: we keep user_credits and credit_transactions tables for historical data
-- but stop the signup trigger from creating new credit rows
