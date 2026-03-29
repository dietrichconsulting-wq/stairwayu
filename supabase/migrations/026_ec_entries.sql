-- Add structured extracurricular entries (JSON array of {name, tier})
-- Used by the admission chancing engine to factor in extracurricular strength.
-- The existing `extracurriculars` text column is preserved for scholarship matching.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ec_entries jsonb DEFAULT NULL;

COMMENT ON COLUMN profiles.ec_entries IS 'Structured extracurricular activities: [{name: string, tier: 1|2|3|4}]. Tier 1=national, 4=participation.';
