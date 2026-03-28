-- Daily discovery challenge completions
create table public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_key text not null,
  challenge_date date not null default current_date,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, challenge_key, challenge_date)
);

alter table public.challenge_completions enable row level security;

create policy "Users can read their own challenge completions"
  on public.challenge_completions for select using (auth.uid() = user_id);

create policy "Users can insert their own challenge completions"
  on public.challenge_completions for insert with check (auth.uid() = user_id);
