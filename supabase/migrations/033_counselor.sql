-- Migration 033: Counselor support
-- Adds user_type to profiles, counselor invite codes, counselor-student linking,
-- and RLS policies for counselor read access to linked student data.

-- 1. Add user_type column to profiles (default 'student' for all existing rows)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'student'
  CHECK (user_type IN ('student', 'counselor'));

-- 2. Counselor invite codes
CREATE TABLE public.counselor_invite_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code         text NOT NULL UNIQUE,
  max_uses     integer NOT NULL DEFAULT 100,
  use_count    integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX counselor_invite_codes_counselor_idx ON public.counselor_invite_codes(counselor_id);
CREATE INDEX counselor_invite_codes_code_idx ON public.counselor_invite_codes(code);

ALTER TABLE public.counselor_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "counselor_invite_codes: own"
  ON public.counselor_invite_codes FOR ALL
  USING (auth.uid() = counselor_id)
  WITH CHECK (auth.uid() = counselor_id);

-- Anyone can look up a code to redeem it (SELECT only, by code value)
CREATE POLICY "counselor_invite_codes: redeem_lookup"
  ON public.counselor_invite_codes FOR SELECT
  USING (active = true);

-- 3. Counselor-student linking
CREATE TABLE public.counselor_students (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code_id uuid REFERENCES public.counselor_invite_codes(id) ON DELETE SET NULL,
  linked_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(counselor_id, student_id)
);

CREATE INDEX counselor_students_counselor_idx ON public.counselor_students(counselor_id);
CREATE INDEX counselor_students_student_idx ON public.counselor_students(student_id);

ALTER TABLE public.counselor_students ENABLE ROW LEVEL SECURITY;

-- Counselor reads their own links
CREATE POLICY "counselor_students: counselor_read"
  ON public.counselor_students FOR SELECT
  USING (auth.uid() = counselor_id);

-- Student reads their own links
CREATE POLICY "counselor_students: student_read"
  ON public.counselor_students FOR SELECT
  USING (auth.uid() = student_id);

-- Student can link themselves (insert)
CREATE POLICY "counselor_students: student_insert"
  ON public.counselor_students FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Student can unlink themselves (delete)
CREATE POLICY "counselor_students: student_delete"
  ON public.counselor_students FOR DELETE
  USING (auth.uid() = student_id);

-- 4. RLS: counselor can SELECT profiles of linked students
CREATE POLICY "profiles: counselor_read_students"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.counselor_students cs
      WHERE cs.counselor_id = auth.uid() AND cs.student_id = profiles.id
    )
  );

-- 5. RLS: counselor can SELECT user_colleges of linked students
CREATE POLICY "user_colleges: counselor_read_students"
  ON public.user_colleges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.counselor_students cs
      WHERE cs.counselor_id = auth.uid() AND cs.student_id = user_colleges.user_id
    )
  );

-- 6. Update handle_new_user trigger to support counselor signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email_hash text;
  v_already_claimed boolean;
  v_user_type text;
BEGIN
  v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'student');
  IF v_user_type NOT IN ('student', 'counselor') THEN
    v_user_type := 'student';
  END IF;

  INSERT INTO public.profiles (id, display_name, user_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_user_type
  );

  -- Counselors get free tier, no trial
  IF v_user_type = 'counselor' THEN
    INSERT INTO public.subscriptions (user_id, tier, status, trial_end)
    VALUES (new.id, 'free', NULL, NULL);
  ELSE
    v_email_hash := encode(digest(lower(trim(new.email)), 'sha256'), 'hex');

    SELECT EXISTS(SELECT 1 FROM public.trial_claims WHERE email_hash = v_email_hash)
      INTO v_already_claimed;

    IF v_already_claimed THEN
      INSERT INTO public.subscriptions (user_id, tier, status, trial_end)
      VALUES (new.id, 'free', NULL, NULL);
    ELSE
      INSERT INTO public.subscriptions (user_id, tier, status, trial_end)
      VALUES (new.id, 'pro', 'trialing', now() + interval '7 days');

      INSERT INTO public.trial_claims (email_hash)
      VALUES (v_email_hash)
      ON CONFLICT (email_hash) DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$;
