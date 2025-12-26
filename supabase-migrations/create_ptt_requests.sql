-- Migration: Create PTT requests table
-- This table stores all Post-Shipment Trade Token requests from importers

-- Create PTT requests table
CREATE TABLE IF NOT EXISTS ptt_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Request details
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  maturity_days INTEGER NOT NULL,
  incoterms TEXT NOT NULL,

  -- Parties involved
  importer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  importer_bank TEXT NOT NULL, -- DBS Bank, ICICI, etc.
  exporter_bank TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued', 'settled', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- PTT details (populated after approval)
  ptt_number TEXT UNIQUE,
  issue_date TIMESTAMP WITH TIME ZONE,
  maturity_date TIMESTAMP WITH TIME ZONE,
  discount_rate DECIMAL(5, 2),
  discounted_amount DECIMAL(15, 2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS ptt_requests_importer_id_idx ON ptt_requests(importer_id);
CREATE INDEX IF NOT EXISTS ptt_requests_exporter_id_idx ON ptt_requests(exporter_id);
CREATE INDEX IF NOT EXISTS ptt_requests_status_idx ON ptt_requests(status);
CREATE INDEX IF NOT EXISTS ptt_requests_importer_bank_idx ON ptt_requests(importer_bank);

-- Enable Row Level Security
ALTER TABLE ptt_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for ptt_requests
DROP POLICY IF EXISTS "Users can read own PTT requests" ON ptt_requests;
CREATE POLICY "Users can read own PTT requests"
  ON ptt_requests FOR SELECT
  USING (
    auth.uid() = importer_id
    OR auth.uid() = exporter_id
    OR auth.uid() IN (
      SELECT user_id FROM user_profiles
      WHERE role IN ('dbs_bank_maker', 'dbs_bank_checker', 'gift_ibu_maker', 'gift_ibu_checker')
    )
  );

DROP POLICY IF EXISTS "Importers can create PTT requests" ON ptt_requests;
CREATE POLICY "Importers can create PTT requests"
  ON ptt_requests FOR INSERT
  WITH CHECK (auth.uid() = importer_id);

DROP POLICY IF EXISTS "Bank users can update PTT requests" ON ptt_requests;
CREATE POLICY "Bank users can update PTT requests"
  ON ptt_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles
      WHERE role IN ('dbs_bank_maker', 'dbs_bank_checker', 'gift_ibu_maker', 'gift_ibu_checker')
    )
  );

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_ptt_requests_updated_at ON ptt_requests;
CREATE TRIGGER update_ptt_requests_updated_at
  BEFORE UPDATE ON ptt_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ptt_requests IS 'Stores Post-Shipment Trade Token requests from importers';
COMMENT ON COLUMN ptt_requests.status IS 'Status: pending, approved, rejected, issued, settled, cancelled';
COMMENT ON COLUMN ptt_requests.importer_bank IS 'Bank providing financing to the importer (DBS Bank, etc.)';
