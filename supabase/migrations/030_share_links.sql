-- Shareable college profile links for family gifting / 529 contributions.
-- Each token backs a public URL: /share/<token>

create table if not exists public.share_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  token         text not null unique,            -- 12-char URL-safe random
  label         text,                            -- "For Grandma", etc.
  -- Privacy controls: student decides what's visible
  show_schools  boolean not null default true,
  show_odds     boolean not null default true,
  show_costs    boolean not null default true,
  show_progress boolean not null default false,  -- journey milestones
  -- Analytics
  view_count    integer not null default 0,
  gift_clicks   integer not null default 0,
  -- Lifecycle
  expires_at    timestamptz,                     -- null = never
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists share_links_user_idx  on public.share_links (user_id);
create index if not exists share_links_token_idx on public.share_links (token);

alter table public.share_links enable row level security;

-- Owner can CRUD their own links.
create policy share_links_owner_all
  on public.share_links
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public can read active links (needed for /share/[token] page).
create policy share_links_public_read
  on public.share_links
  for select
  to anon
  using (active = true);

-- updated_at trigger
create or replace function public.share_links_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger share_links_updated_at
  before update on public.share_links
  for each row execute function public.share_links_set_updated_at();
