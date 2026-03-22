-- Referral codes and tracking
create table public.referrals (
  id              uuid primary key default uuid_generate_v4(),
  referrer_id     uuid not null references public.profiles(id) on delete cascade,
  referral_code   text not null unique,
  created_at      timestamptz default now()
);

create index referrals_code_idx on public.referrals(referral_code);
create index referrals_referrer_idx on public.referrals(referrer_id);

-- Track each successful referral
create table public.referral_completions (
  id                      uuid primary key default uuid_generate_v4(),
  referral_code           text not null references public.referrals(referral_code),
  referrer_id             uuid not null references public.profiles(id),
  referred_id             uuid not null references public.profiles(id),
  referrer_bonus_applied  boolean default false,
  referred_bonus_applied  boolean default false,
  created_at              timestamptz default now(),
  unique(referred_id)  -- each user can only be referred once
);

create index referral_completions_referrer_idx on public.referral_completions(referrer_id);

-- RLS
alter table public.referrals enable row level security;
alter table public.referral_completions enable row level security;

-- Users can read their own referral code
create policy "referrals: read own" on public.referrals
  for select using (auth.uid() = referrer_id);
create policy "referrals: insert own" on public.referrals
  for insert with check (auth.uid() = referrer_id);

-- Users can read their own completions (as referrer)
create policy "completions: read own" on public.referral_completions
  for select using (auth.uid() = referrer_id);
