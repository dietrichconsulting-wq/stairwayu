-- Migration 007: Email preferences table + weekly nudge opt-in/out

create table public.email_preferences (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  weekly_nudge      boolean not null default true,
  unsubscribe_token text not null default encode(gen_random_bytes(32), 'hex'),
  last_nudge_sent   timestamptz,
  created_at        timestamptz default now()
);

alter table public.email_preferences enable row level security;

create policy "email_prefs: own" on public.email_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create email_preferences row when a new user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.subscriptions (user_id, tier, status, trial_end)
  values (new.id, 'pro', 'trialing', now() + interval '7 days');

  insert into public.email_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

-- Backfill existing users who don't yet have a preferences row
insert into public.email_preferences (user_id)
select id from public.profiles
where id not in (select user_id from public.email_preferences);
