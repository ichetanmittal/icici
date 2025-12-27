-- Create blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL, -- References user_profiles.id
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('Exporter', 'Importer', 'Funder')),
  reason TEXT NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blacklist_entity_id ON blacklist(entity_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_entity_type ON blacklist(entity_type);
CREATE INDEX IF NOT EXISTS idx_blacklist_added_by ON blacklist(added_by);

-- Add RLS policies
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow bank and funder users to read blacklist
CREATE POLICY "Allow bank and funder users to read blacklist"
ON blacklist FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('dbs_bank_maker', 'dbs_bank_checker', 'gift_ibu_maker', 'gift_ibu_checker')
  )
);

-- Policy: Allow bank and funder makers to insert blacklist entries
CREATE POLICY "Allow bank and funder makers to insert blacklist"
ON blacklist FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('dbs_bank_maker', 'gift_ibu_maker')
  )
);

-- Policy: Allow bank and funder makers to delete blacklist entries
CREATE POLICY "Allow bank and funder makers to delete blacklist"
ON blacklist FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('dbs_bank_maker', 'gift_ibu_maker')
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blacklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blacklist_updated_at
BEFORE UPDATE ON blacklist
FOR EACH ROW
EXECUTE FUNCTION update_blacklist_updated_at();
