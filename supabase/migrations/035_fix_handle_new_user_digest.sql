-- Migration 035: Fix handle_new_user trigger — digest() not found
-- Root cause: Migration 033 set search_path=public, but pgcrypto's digest()
-- lives in the extensions schema. Every non-counselor signup failed with
-- "Database error saving new user" since April 13, 2026.
--
-- Fix: add extensions to search_path AND fully-qualify the digest() call
-- (belt-and-suspenders).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
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

  IF v_user_type = 'counselor' THEN
    INSERT INTO public.subscriptions (user_id, tier, status, trial_end)
    VALUES (new.id, 'free', NULL, NULL);
  ELSE
    v_email_hash := encode(extensions.digest(lower(trim(new.email)), 'sha256'), 'hex');

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
