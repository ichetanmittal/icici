-- Migration: Add invited_role to invitations table
-- This allows us to distinguish between exporter and importer invitations

-- Add invited_role column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invitations' AND column_name='invited_role') THEN
    ALTER TABLE invitations ADD COLUMN invited_role TEXT DEFAULT 'importer' CHECK (invited_role IN ('importer', 'exporter'));
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN invitations.invited_role IS 'Role the invitee will have: importer or exporter';
