-- Add weighted GPA column (5.0 scale) alongside existing unweighted GPA (4.0 scale)
alter table public.profiles
  add column if not exists gpa_weighted numeric(3,2);
