-- Add maker-checker workflow for settlement

-- Add columns for settlement maker approval
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS settlement_maker_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS settlement_maker_approved_at TIMESTAMP WITH TIME ZONE;

-- Add columns for settlement checker approval
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS settlement_checker_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS settlement_checker_approved_at TIMESTAMP WITH TIME ZONE;

-- Add column for actual settlement date
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ptt_requests_settlement_maker_approved_by_idx ON ptt_requests(settlement_maker_approved_by);
CREATE INDEX IF NOT EXISTS ptt_requests_settlement_checker_approved_by_idx ON ptt_requests(settlement_checker_approved_by);
CREATE INDEX IF NOT EXISTS ptt_requests_settled_at_idx ON ptt_requests(settled_at);

-- Update status constraint to include settlement_maker_approved
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
  'settlement_maker_approved',
  'settled',
  'rejected',
  'cancelled',
  'expired',
  'timed_out'
));

-- Add comment explaining the settlement workflow
COMMENT ON COLUMN ptt_requests.settled_at IS 'Settlement workflow: discounted PTTs reach maturity -> settlement_maker_approved -> settlement_checker_approved -> settled';
