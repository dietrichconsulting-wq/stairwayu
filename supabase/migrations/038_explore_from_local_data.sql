-- Serve the Explore page from local data instead of live College Scorecard
-- API calls (faster, immune to Scorecard outages/rate limits, less egress).
--
-- 1) Widen `colleges` with the extra fields Explore's mapRichResult() needs.
-- 2) New `college_programs` table: bachelor's-level (credential level 3)
--    program data per school per 4-digit CIP code — completions and median
--    earnings, the inputs to the Program Strength score.
--
-- Populated by scripts/ingest-colleges.mjs / collegeIngest.ts (monthly via
-- GitHub Actions). All statements are idempotent.

alter table public.colleges
  add column if not exists locale               integer,  -- school.locale (11=large city ... 43=rural remote)
  add column if not exists region_id            integer,  -- school.region_id (0-9)
  add column if not exists cost_of_attendance   integer,  -- in-state sticker: tuition + fees + R&B + books
  add column if not exists grad_rate_overall    integer,  -- 0-100, fallback when grad_rate_4yr is null
  add column if not exists median_earnings_6yr  integer,
  add column if not exists net_price_by_income  jsonb;    -- {"0-30k": n, "30-48k": n, "48-75k": n, "75-110k": n, "110k+": n}

create index if not exists colleges_region_idx on public.colleges (region_id);

create table if not exists public.college_programs (
  ipeds_id     text not null references public.colleges (ipeds_id) on delete cascade,
  cip_code     text not null,  -- 4-digit CIP, e.g. '1101' = Computer Science
  title        text,
  completions  integer,        -- ipeds_awards1: bachelor's degrees awarded/yr
  earnings_1yr integer,        -- overall_median_earnings 1yr after completion
  earnings_4yr integer,
  ingested_at  timestamptz not null default now(),
  primary key (ipeds_id, cip_code)
);

-- Explore queries filter by CIP code first
create index if not exists college_programs_cip_idx on public.college_programs (cip_code);

alter table public.college_programs enable row level security;

-- Non-sensitive public federal data: anyone can read, service role writes.
drop policy if exists college_programs_public_read on public.college_programs;
create policy college_programs_public_read
  on public.college_programs
  for select
  to anon, authenticated
  using (true);
