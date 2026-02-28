DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view success story videos'
  ) THEN
    CREATE POLICY "Anyone can view success story videos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'success-story-videos');
  END IF;
END $$;