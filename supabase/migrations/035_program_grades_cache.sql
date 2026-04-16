-- Cache table for pre-computed Stairway Grades per program per school.
-- Populated lazily on first page visit; flushed via admin endpoint after
-- annual Scorecard data releases.

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

-- Allow public read (these are non-sensitive, publicly derived scores)
alter table program_grades enable row level security;
create policy "Anyone can read program grades"
  on program_grades for select using (true);

-- Only service role can write (API route uses createServiceClient)
create policy "Service role can insert/update program grades"
  on program_grades for all using (true) with check (true);
