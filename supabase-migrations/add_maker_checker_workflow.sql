-- Add maker-checker approval columns to ptt_requests table

-- Add new columns for maker approval
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS maker_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS maker_approved_at TIMESTAMP WITH TIME ZONE;

-- Add new columns for checker approval
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS checker_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS checker_approved_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ptt_requests_maker_approved_by_idx ON ptt_requests(maker_approved_by);
CREATE INDEX IF NOT EXISTS ptt_requests_checker_approved_by_idx ON ptt_requests(checker_approved_by);

-- Update existing PTT numbers to be generated on creation (we'll handle this in the app)
-- The ptt_number column already exists, we just need to populate it on creation now

-- Add comment explaining the status flow
COMMENT ON COLUMN ptt_requests.status IS 'Status flow: pending -> maker_approved -> issued -> settled. Can also be: rejected, cancelled, expired, timed_out';

-- Add check constraint to ensure status values are valid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ptt_requests_status_check'
  ) THEN
    ALTER TABLE ptt_requests
    ADD CONSTRAINT ptt_requests_status_check
    CHECK (status IN ('pending', 'maker_approved', 'approved', 'rejected', 'issued', 'settled', 'cancelled', 'expired', 'timed_out'));
  END IF;
END $$;
