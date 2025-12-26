-- Add document management and discount functionality to PTT workflow

-- Update status constraint to include new statuses
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
  'discounted',
  'settled',
  'rejected',
  'cancelled',
  'expired',
  'timed_out'
));

-- Add document and discount related columns
ALTER TABLE ptt_requests
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS transferred_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS documents_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS documents_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS documents_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS document_urls TEXT[], -- Array of document URLs
ADD COLUMN IF NOT EXISTS document_names TEXT[], -- Array of document names
ADD COLUMN IF NOT EXISTS offered_for_discount_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS discounted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discounted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS importer_notes TEXT,
ADD COLUMN IF NOT EXISTS exporter_notes TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS ptt_requests_transferred_at_idx ON ptt_requests(transferred_at);
CREATE INDEX IF NOT EXISTS ptt_requests_status_transferred_idx ON ptt_requests(status) WHERE status = 'transferred';
CREATE INDEX IF NOT EXISTS ptt_requests_status_offered_idx ON ptt_requests(status) WHERE status = 'offered_for_discount';

-- Add comment for status flow
COMMENT ON COLUMN ptt_requests.status IS 'Status flow: pending -> maker_approved -> issued -> transferred -> documents_uploaded -> documents_approved -> offered_for_discount -> discounted -> settled';

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'ptt_requests_status_check';
