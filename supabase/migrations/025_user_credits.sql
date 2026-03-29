-- Credits system: 1000 credits/mo with subscription, 400 credits for $5 add-on
-- 20 credits per AI call = 50 calls/month

-- Store each user's current credit balance
create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

create policy "Users can read own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- Audit log for every credit change
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,          -- positive = grant, negative = spend
  balance_after integer not null,
  reason text not null,             -- 'subscription_grant', 'credit_pack', 'ai_call', 'trial_grant'
  stripe_session_id text,           -- for purchases, links back to Stripe
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can read own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- Index for fast balance lookups and transaction history
create index if not exists idx_credit_transactions_user_id
  on public.credit_transactions(user_id, created_at desc);

-- Grant 1000 credits to new users on signup (alongside trial)
create or replace function public.grant_trial_credits()
returns trigger as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 1000)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, amount, balance_after, reason)
  values (new.id, 1000, 1000, 'trial_grant');

  return new;
end;
$$ language plpgsql security definer;

-- Fire after user creation (same event as trial grant)
drop trigger if exists on_auth_user_created_grant_credits on auth.users;
create trigger on_auth_user_created_grant_credits
  after insert on auth.users
  for each row execute function public.grant_trial_credits();

-- Atomic deduct: returns true if successful, false if insufficient balance
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text default 'ai_call'
)
returns boolean as $$
declare
  v_new_balance integer;
begin
  update public.user_credits
  set balance = balance - p_amount,
      updated_at = now()
  where user_id = p_user_id
    and balance >= p_amount
  returning balance into v_new_balance;

  if not found then
    return false;
  end if;

  insert into public.credit_transactions (user_id, amount, balance_after, reason)
  values (p_user_id, -p_amount, v_new_balance, p_reason);

  return true;
end;
$$ language plpgsql security definer;

-- Grant credits: upserts balance and logs transaction
create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_stripe_session_id text default null
)
returns boolean as $$
declare
  v_new_balance integer;
begin
  insert into public.user_credits (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set balance = user_credits.balance + p_amount,
        updated_at = now()
  returning balance into v_new_balance;

  insert into public.credit_transactions (user_id, amount, balance_after, reason, stripe_session_id)
  values (p_user_id, p_amount, v_new_balance, p_reason, p_stripe_session_id);

  return true;
end;
$$ language plpgsql security definer;
