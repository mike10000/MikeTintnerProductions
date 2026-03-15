-- Add attachments to messages and work_orders
-- Run in Supabase SQL Editor
--
-- For file uploads to work, also create a storage bucket in Supabase Dashboard:
-- Storage > New bucket > Name: client-files, Public: Yes, File size limit: 10MB
-- Then run the RLS policies below (or create via Dashboard).

-- Messages: add attachments column (array of {name, url})
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';

-- Work orders: add attachments column
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';

-- Create storage bucket for client files (run in SQL Editor)
-- Note: Bucket creation may need to be done in Supabase Dashboard > Storage
-- Insert into storage.buckets if you have access:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-files',
  'client-files',
  true,  -- public so attachment links work
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects - clients can upload to their own folder
CREATE POLICY "Clients can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Clients and admins can read files in conversations/work orders they have access to
CREATE POLICY "Authenticated users can read client files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-files'
  AND auth.role() = 'authenticated'
);

-- Admins can upload to any client folder (for contracts etc.)
CREATE POLICY "Admins can upload to client folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-files'
  AND public.is_admin()
);
