ALTER TABLE public.success_stories
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'success-story-videos',
  'success-story-videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload success story videos'
  ) THEN
    CREATE POLICY "Admins can upload success story videos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'success-story-videos'
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update success story videos'
  ) THEN
    CREATE POLICY "Admins can update success story videos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'success-story-videos'
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    )
    WITH CHECK (
      bucket_id = 'success-story-videos'
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete success story videos'
  ) THEN
    CREATE POLICY "Admins can delete success story videos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'success-story-videos'
      AND public.has_role(auth.uid(), 'admin'::public.app_role)
    );
  END IF;
END $$;