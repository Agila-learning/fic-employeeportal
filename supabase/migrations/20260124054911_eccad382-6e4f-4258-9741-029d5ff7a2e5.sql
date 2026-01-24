-- Create holidays table
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('govt', 'festival')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Admins can manage holidays
CREATE POLICY "Admins can manage holidays"
ON public.holidays
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view holidays
CREATE POLICY "Authenticated users can view holidays"
ON public.holidays
FOR SELECT
USING (auth.uid() IS NOT NULL);