-- Drop existing blacklist policies
DROP POLICY IF EXISTS "Allow bank and funder users to read blacklist" ON blacklist;
DROP POLICY IF EXISTS "Allow bank and funder makers to insert blacklist" ON blacklist;
DROP POLICY IF EXISTS "Allow bank and funder makers to delete blacklist" ON blacklist;

-- Recreate policies with correct lowercase role names
CREATE POLICY "Allow bank and funder users to read blacklist"
ON blacklist FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('dbs_bank_maker', 'dbs_bank_checker', 'gift_ibu_maker', 'gift_ibu_checker')
  )
);

CREATE POLICY "Allow bank and funder makers to insert blacklist"
ON blacklist FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('dbs_bank_maker', 'gift_ibu_maker')
  )
);

CREATE POLICY "Allow bank and funder makers to delete blacklist"
ON blacklist FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('dbs_bank_maker', 'gift_ibu_maker')
  )
);
