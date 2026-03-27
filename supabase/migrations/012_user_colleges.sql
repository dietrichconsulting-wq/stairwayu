-- ─── user_colleges junction table ────────────────────────────────────────────
-- Replaces the hardcoded school1_name … school9_name columns on profiles.
-- Each row is one college on a user's list.  sort_order preserves the
-- ordering the user chose (1 = top choice).

CREATE TABLE public.user_colleges (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_name text NOT NULL,
  college_id   text,            -- College Scorecard unit ID (optional)
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, college_name) -- prevent duplicates per user
);

CREATE INDEX user_colleges_user_id_idx ON public.user_colleges(user_id);

-- Updated-at trigger (reuses existing function)
CREATE TRIGGER user_colleges_updated_at
  BEFORE UPDATE ON public.user_colleges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.user_colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_colleges: own"
  ON public.user_colleges
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Migrate existing data ───────────────────────────────────────────────────
-- For every profile row that has at least one school, insert into user_colleges.
INSERT INTO public.user_colleges (user_id, college_name, college_id, sort_order)
SELECT id, school_name, school_id, sort_order
FROM (
  SELECT id, school1_name AS school_name, school1_id AS school_id, 1 AS sort_order FROM public.profiles WHERE school1_name IS NOT NULL
  UNION ALL
  SELECT id, school2_name, school2_id, 2 FROM public.profiles WHERE school2_name IS NOT NULL
  UNION ALL
  SELECT id, school3_name, school3_id, 3 FROM public.profiles WHERE school3_name IS NOT NULL
  UNION ALL
  SELECT id, school4_name, school4_id, 4 FROM public.profiles WHERE school4_name IS NOT NULL
  UNION ALL
  SELECT id, school5_name, school5_id, 5 FROM public.profiles WHERE school5_name IS NOT NULL
  UNION ALL
  SELECT id, school6_name, school6_id, 6 FROM public.profiles WHERE school6_name IS NOT NULL
  UNION ALL
  SELECT id, school7_name, school7_id, 7 FROM public.profiles WHERE school7_name IS NOT NULL
  UNION ALL
  SELECT id, school8_name, school8_id, 8 FROM public.profiles WHERE school8_name IS NOT NULL
  UNION ALL
  SELECT id, school9_name, school9_id, 9 FROM public.profiles WHERE school9_name IS NOT NULL
) AS legacy
ON CONFLICT (user_id, college_name) DO NOTHING;

-- ─── Drop old columns ────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS school1_name,
  DROP COLUMN IF EXISTS school1_id,
  DROP COLUMN IF EXISTS school2_name,
  DROP COLUMN IF EXISTS school2_id,
  DROP COLUMN IF EXISTS school3_name,
  DROP COLUMN IF EXISTS school3_id,
  DROP COLUMN IF EXISTS school4_name,
  DROP COLUMN IF EXISTS school4_id,
  DROP COLUMN IF EXISTS school5_name,
  DROP COLUMN IF EXISTS school5_id,
  DROP COLUMN IF EXISTS school6_name,
  DROP COLUMN IF EXISTS school6_id,
  DROP COLUMN IF EXISTS school7_name,
  DROP COLUMN IF EXISTS school7_id,
  DROP COLUMN IF EXISTS school8_name,
  DROP COLUMN IF EXISTS school8_id,
  DROP COLUMN IF EXISTS school9_name,
  DROP COLUMN IF EXISTS school9_id;
