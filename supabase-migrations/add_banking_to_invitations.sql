-- Migration: Add bank account details to invitations table
-- This allows banks to pre-fill banking information when inviting importers

-- Add new columns to invitations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invitations' AND column_name='bank_account_number') THEN
    ALTER TABLE invitations ADD COLUMN bank_account_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invitations' AND column_name='swift_code') THEN
    ALTER TABLE invitations ADD COLUMN swift_code TEXT;
  END IF;
END $$;

-- Add comment to document the purpose
COMMENT ON COLUMN invitations.bank_account_number IS 'Bank account number provided by the bank for the importer';
COMMENT ON COLUMN invitations.swift_code IS 'IFSC/SWIFT code provided by the bank for the importer';
