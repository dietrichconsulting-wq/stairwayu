-- Cache table for pre-computed Stairway Grades per program per school.
-- Populated lazily on first page visit; flushed via admin endpoint after
-- annual Scorecard data releases.
--
-- Renamed from 035_program_grades_cache.sql to 036 on 2026-05-01 to resolve
-- a numbering collision with 035_fix_handle_new_user_digest.sql. After
-- deploy, you can clean up the old tracking row in prod with:
--   delete from supabase_migrations.schema_migrations
--   where version = '035' and name = 'program_grades_cache';
-- (Adjust column names per your Supabase CLI version.)
--
-- All statements below are idempotent so re-applying to a database that
-- already ran the original 035_program_grades_cache.sql is safe.

create table if not exists program_grades (
  id          uuid primary key default gen_random_uuid(),
  ipeds_id    text not null,
  cip_code    text not null,
  score       smallint,          -- 0-100 composite score (null = insufficient data)
  grade       text,              -- letter grade: A+, A, A-, B+, B, B-, C (null if score is null)
  computed_at timestamptz not null default now(),

  unique (ipeds_id, cip_code)
);

-- Fast lookup by school (the college page query)
create index if not exists idx_program_grades_ipeds on program_grades (ipeds_id);

-- Enable RLS (no-op if already on)
alter table program_grades enable row level security;

-- Allow public read (these are non-sensitive, publicly derived scores)
drop policy if exists "Anyone can read program grades" on program_grades;
create policy "Anyone can read program grades"
  on program_grades for select using (true);

-- Only service role can write (API route uses createServiceClient)
drop policy if exists "Service role can insert/update program grades" on program_grades;
create policy "Service role can insert/update program grades"
  on program_grades for all using (true) with check (true);
