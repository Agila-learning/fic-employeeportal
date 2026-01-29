-- Add face_photo_url column to store attendance selfie
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS face_photo_url TEXT;

-- Create storage bucket for face photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attendance-faces', 'attendance-faces', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for attendance-faces bucket - users can upload their own photos
CREATE POLICY "Users can upload own face photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-faces' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own photos
CREATE POLICY "Users can view own face photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-faces' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all face photos
CREATE POLICY "Admins can view all face photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-faces' 
  AND public.has_role(auth.uid(), 'admin')
);