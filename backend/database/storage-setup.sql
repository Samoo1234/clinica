-- VisionCare Storage Setup
-- Execute this script in Supabase SQL Editor after running schema.sql

-- Create storage bucket for medical record attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for attachments bucket
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;