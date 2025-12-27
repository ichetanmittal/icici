-- Add maker-checker workflow for discount acceptance

-- Add columns for discount maker approval
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS discount_maker_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS discount_maker_approved_at TIMESTAMP WITH TIME ZONE;

-- Add columns for discount checker approval
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS discount_checker_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS discount_checker_approved_at TIMESTAMP WITH TIME ZONE;

-- Add column for discount rejection reason
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS discount_rejection_reason TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ptt_requests_discount_maker_approved_by_idx ON ptt_requests(discount_maker_approved_by);
CREATE INDEX IF NOT EXISTS ptt_requests_discount_checker_approved_by_idx ON ptt_requests(discount_checker_approved_by);

-- Update status constraint to include discount_maker_approved
ALTER TABLE ptt_requests
DROP CONSTRAINT IF EXISTS ptt_requests_status_check;

ALTER TABLE ptt_requests
ADD CONSTRAINT ptt_requests_status_check
CHECK (status IN (
  'pending',
  'maker_approved',
  'issued',
  'transferred',
  'documents_uploaded',
  'documents_approved',
  'offered_for_discount',
  'discount_maker_approved',
  'discounted',
  'settled',
  'rejected',
  'cancelled',
  'expired',
  'timed_out'
));

-- Add comment explaining the discount workflow
COMMENT ON COLUMN ptt_requests.status IS 'Status flow: pending -> maker_approved -> issued -> transferred -> documents_uploaded -> documents_approved -> offered_for_discount -> discount_maker_approved -> discounted -> settled';
