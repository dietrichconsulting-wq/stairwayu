-- Fix referral_completions foreign keys: add ON DELETE CASCADE
-- Without CASCADE, deleting a profile or referral row fails due to RESTRICT default.

-- referral_code → referrals(referral_code)
alter table public.referral_completions
  drop constraint referral_completions_referral_code_fkey,
  add constraint referral_completions_referral_code_fkey
    foreign key (referral_code) references public.referrals(referral_code) on delete cascade;

-- referrer_id → profiles(id)
alter table public.referral_completions
  drop constraint referral_completions_referrer_id_fkey,
  add constraint referral_completions_referrer_id_fkey
    foreign key (referrer_id) references public.profiles(id) on delete cascade;

-- referred_id → profiles(id)
alter table public.referral_completions
  drop constraint referral_completions_referred_id_fkey,
  add constraint referral_completions_referred_id_fkey
    foreign key (referred_id) references public.profiles(id) on delete cascade;
