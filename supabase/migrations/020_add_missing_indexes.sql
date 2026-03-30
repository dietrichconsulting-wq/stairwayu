-- Add missing indexes for common query patterns
-- challenge_completions: queried on every dashboard load by (user_id, challenge_date)
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_date
  ON public.challenge_completions(user_id, challenge_date);

-- scholarships: filtered by (user_id, stage) in achievement logic
CREATE INDEX IF NOT EXISTS idx_scholarships_user_stage
  ON public.scholarships(user_id, stage);

-- tasks: used in readiness scoring with completed_at ordering
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed
  ON public.tasks(user_id, completed_at DESC);

-- Note: referral_completions(referred_id) is already indexed
-- via the UNIQUE(referred_id) constraint in migration 008.
