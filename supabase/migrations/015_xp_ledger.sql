-- XP ledger: one row per XP-earning action
create table if not exists xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,          -- e.g. 'complete_task', 'generate_strategy'
  xp int not null,
  ref_id text,                   -- optional: id of the task/essay/etc that earned XP
  created_at timestamptz not null default now()
);

-- RLS
alter table xp_ledger enable row level security;

create policy "Users can read own xp"
  on xp_ledger for select
  using (auth.uid() = user_id);

create policy "Users can insert own xp"
  on xp_ledger for insert
  with check (auth.uid() = user_id);

-- Index for total-XP aggregation
create index idx_xp_ledger_user on xp_ledger (user_id);

-- Unique constraint to prevent double-awarding for the same ref_id + action
create unique index idx_xp_ledger_dedup
  on xp_ledger (user_id, action, ref_id)
  where ref_id is not null;
