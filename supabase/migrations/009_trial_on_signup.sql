-- Migration 006: Auto-start 7-day Pro trial on signup
-- Updates handle_new_user() to create subscriptions with 'pro' tier and 'trialing' status

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.subscriptions (user_id, tier, status, trial_end)
  values (new.id, 'pro', 'trialing', now() + interval '7 days');

  return new;
end;
$$;

-- Also update existing free users who never had a trial
update public.subscriptions
set tier = 'pro',
    status = 'trialing',
    trial_end = now() + interval '7 days'
where tier = 'free'
  and trial_end is null
  and stripe_subscription_id is null;
