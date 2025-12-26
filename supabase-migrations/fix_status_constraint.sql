-- Fix the status check constraint to include maker_approved

-- Drop the existing constraint
ALTER TABLE ptt_requests
DROP CONSTRAINT IF EXISTS ptt_requests_status_check;

-- Add the updated constraint with maker_approved included
ALTER TABLE ptt_requests
ADD CONSTRAINT ptt_requests_status_check
CHECK (status IN ('pending', 'maker_approved', 'approved', 'rejected', 'issued', 'settled', 'cancelled', 'expired', 'timed_out'));

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'ptt_requests_status_check';
