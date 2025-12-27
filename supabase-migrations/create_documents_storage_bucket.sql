-- Create a storage bucket for PTT documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,  -- Make it public so users can access document URLs
  52428800,  -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the documents bucket

-- Policy: Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'ptt-documents'
);

-- Policy: Allow public read access to documents
CREATE POLICY "Allow public read access to documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy: Allow users to update their own documents
CREATE POLICY "Allow users to update their documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Policy: Allow users to delete their own documents
CREATE POLICY "Allow users to delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
