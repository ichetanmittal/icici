-- Migration: Update RLS policies to allow users to read other profiles
-- This allows importers to see exporters and vice versa

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

-- Create new policy that allows users to read all profiles
CREATE POLICY "Users can read profiles"
  ON user_profiles FOR SELECT
  USING (
    -- Users can read their own profile
    auth.uid() = user_id
    OR
    -- Users can read profiles of exporters and importers (for business relationships)
    role IN ('exporter', 'importer')
    OR
    -- Bank and funder users can read all profiles
    auth.uid() IN (
      SELECT user_id FROM user_profiles
      WHERE role IN ('dbs_bank_maker', 'dbs_bank_checker', 'gift_ibu_maker', 'gift_ibu_checker')
    )
  );

COMMENT ON POLICY "Users can read profiles" ON user_profiles IS 'Allows users to read their own profile and profiles of exporters/importers for business relationships';
