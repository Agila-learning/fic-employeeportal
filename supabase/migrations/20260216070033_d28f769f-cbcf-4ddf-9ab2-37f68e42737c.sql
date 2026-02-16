-- Allow admins to delete attendance records
CREATE POLICY "Admins can delete attendance"
ON public.attendance
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
