-- Drop existing storage policies and create more restrictive ones
DROP POLICY IF EXISTS "Users can view resumes of their leads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment slips of their leads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload payment slips" ON storage.objects;
DROP POLICY IF EXISTS "Users can update resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update payment slips" ON storage.objects;

-- Resumes: Only authenticated users can upload to their own folder
-- Admins and lead owners can view resumes via signed URLs
CREATE POLICY "Authenticated users upload resumes to their folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Resumes: Only admins and employees with assigned leads can view
CREATE POLICY "Authorized users can view resumes" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'resumes' 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.assigned_to = auth.uid()
    )
  )
);

-- Payment slips: Only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users upload payment slips to their folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-slips' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Payment slips: Only admins and employees with assigned leads can view
CREATE POLICY "Authorized users can view payment slips" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'payment-slips' 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.assigned_to = auth.uid()
    )
  )
);

-- Update policies: users can update their own files
CREATE POLICY "Users update their own resumes" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update their own payment slips" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'payment-slips' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);