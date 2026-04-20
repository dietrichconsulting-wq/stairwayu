-- Migration 034: Raise free-tier college limit from 4 to 8
-- Most students apply to 8-12 schools. A 4-college cap makes the free tier
-- feel like a demo rather than a useful tool.

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

  -- Free tier: enforce 8-college limit
  select count(*) into v_count
  from public.user_colleges
  where user_id = new.user_id;

  if v_count >= 8 then
    raise exception 'Free plan allows up to 8 colleges. Upgrade to Pro for unlimited.' using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql security definer;
