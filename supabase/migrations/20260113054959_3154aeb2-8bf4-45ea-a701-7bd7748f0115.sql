-- Fix announcements policy to require authentication
DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.announcements;

-- Only authenticated users can view active announcements
CREATE POLICY "Authenticated users can view active announcements" 
ON public.announcements 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);