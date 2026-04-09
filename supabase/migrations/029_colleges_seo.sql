-- Programmatic per-college SEO landing pages.
-- Each row backs a public URL like /colleges/<slug>.
-- Populated by scripts/ingest-colleges.mjs from College Scorecard.

create table if not exists public.colleges (
  ipeds_id              text primary key,            -- College Scorecard "id" (UNITID)
  slug                  text not null unique,        -- e.g. "university-of-texas-at-austin"
  name                  text not null,
  city                  text,
  state                 text,                        -- 2-letter
  url                   text,                        -- official .edu
  control               text,                        -- Public / Private Nonprofit / Private For-Profit
  is_public             boolean,
  -- Admissions
  admission_rate        integer,                     -- 0-100
  avg_sat               integer,
  sat_25                integer,
  sat_75                integer,
  act_midpoint          integer,
  -- Cost
  tuition_in_state      integer,
  tuition_out_of_state  integer,
  avg_net_price         integer,
  -- Students & outcomes
  enrollment            integer,
  retention_rate        integer,                     -- 0-100
  grad_rate_4yr         integer,                     -- 0-100
  median_earnings_10yr  integer,
  -- Generated SEO content (Gemini Flash, ~200 words, factual only)
  summary               text,
  -- Ranking signal for sitemap priority + generateStaticParams cutoff
  popularity            integer not null default 0,
  -- Bookkeeping
  data_source           text not null default 'scorecard',
  data_year             integer,
  ingested_at           timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Indexes for sitemap chunking, A-Z and by-state index pages, top-N rendering
create index if not exists colleges_state_idx       on public.colleges (state);
create index if not exists colleges_popularity_idx  on public.colleges (popularity desc);
create index if not exists colleges_name_idx        on public.colleges (lower(name));

-- Public can read; ingestion script uses the service role to write.
alter table public.colleges enable row level security;

drop policy if exists colleges_public_read on public.colleges;
create policy colleges_public_read
  on public.colleges
  for select
  to anon, authenticated
  using (true);

-- updated_at trigger
create or replace function public.colleges_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists colleges_updated_at on public.colleges;
create trigger colleges_updated_at
  before update on public.colleges
  for each row
  execute function public.colleges_set_updated_at();
