-- Add school5 through school9 columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school5_name text,
  ADD COLUMN IF NOT EXISTS school5_id   text,
  ADD COLUMN IF NOT EXISTS school6_name text,
  ADD COLUMN IF NOT EXISTS school6_id   text,
  ADD COLUMN IF NOT EXISTS school7_name text,
  ADD COLUMN IF NOT EXISTS school7_id   text,
  ADD COLUMN IF NOT EXISTS school8_name text,
  ADD COLUMN IF NOT EXISTS school8_id   text,
  ADD COLUMN IF NOT EXISTS school9_name text,
  ADD COLUMN IF NOT EXISTS school9_id   text;
