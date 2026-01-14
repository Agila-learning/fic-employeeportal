-- Add RLS policy for admins to insert attendance for any user
CREATE POLICY "Admins can insert attendance for any user"
ON public.attendance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update any attendance record
CREATE POLICY "Admins can update any attendance"
ON public.attendance
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for employees to update their own attendance (if needed for self-corrections)
CREATE POLICY "Employees can update their own attendance"
ON public.attendance
FOR UPDATE
USING (user_id = auth.uid());