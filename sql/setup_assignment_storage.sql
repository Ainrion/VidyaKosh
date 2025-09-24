-- Setup Supabase storage bucket for assignment files
-- Run this in your Supabase SQL Editor

-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-files',
  'assignment-files',
  true,
  26214400, -- 25MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for assignment files bucket
CREATE POLICY "Assignment files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'assignment-files');

CREATE POLICY "Authenticated users can upload assignment files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assignment-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own assignment files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'assignment-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own assignment files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'assignment-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify bucket creation
SELECT 
  'Storage Bucket Created' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'assignment-files';

-- Show RLS policies
SELECT 
  'RLS Policies Created' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%assignment%'
ORDER BY policyname;
