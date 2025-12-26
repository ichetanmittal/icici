-- Add foreign key constraints for exporter_id and importer_id

-- Drop existing constraints if they exist (separate statements)
ALTER TABLE ptt_requests
DROP CONSTRAINT IF EXISTS ptt_requests_exporter_id_fkey;

ALTER TABLE ptt_requests
DROP CONSTRAINT IF EXISTS ptt_requests_importer_id_fkey;

-- Add foreign key for exporter_id
ALTER TABLE ptt_requests
ADD CONSTRAINT ptt_requests_exporter_id_fkey
FOREIGN KEY (exporter_id)
REFERENCES user_profiles(user_id)
ON DELETE SET NULL;

-- Add foreign key for importer_id
ALTER TABLE ptt_requests
ADD CONSTRAINT ptt_requests_importer_id_fkey
FOREIGN KEY (importer_id)
REFERENCES user_profiles(user_id)
ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS ptt_requests_exporter_id_idx ON ptt_requests(exporter_id);
CREATE INDEX IF NOT EXISTS ptt_requests_importer_id_idx ON ptt_requests(importer_id);

-- Verify the foreign keys were created
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN ('ptt_requests_exporter_id_fkey', 'ptt_requests_importer_id_fkey');
