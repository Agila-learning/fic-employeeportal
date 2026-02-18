
-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  leave_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees can create their own leave requests
CREATE POLICY "Employees can create their own leave requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Employees can view their own leave requests
CREATE POLICY "Employees can view their own leave requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all leave requests
CREATE POLICY "Admins can view all leave requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update leave requests (approve/reject)
CREATE POLICY "Admins can update leave requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete leave requests
CREATE POLICY "Admins can delete leave requests"
ON public.leave_requests FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
