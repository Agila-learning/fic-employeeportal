-- Add DELETE policies for admins on storage buckets
CREATE POLICY "Admins can delete files from resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete files from payment-slips"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-slips' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Also allow users to delete their own files
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND 
  (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can delete their own payment slips"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-slips' AND 
  (storage.foldername(name))[1] = (auth.uid())::text
);