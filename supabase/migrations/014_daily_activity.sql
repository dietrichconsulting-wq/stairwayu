-- Track one row per user per calendar day for streak calculation
create table if not exists daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

-- RLS
alter table daily_activity enable row level security;

create policy "Users can read own activity"
  on daily_activity for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity"
  on daily_activity for insert
  with check (auth.uid() = user_id);

-- Index for streak queries (recent dates first)
create index idx_daily_activity_user_date
  on daily_activity (user_id, activity_date desc);
