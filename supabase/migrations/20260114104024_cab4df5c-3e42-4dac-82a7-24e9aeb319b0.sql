-- Create a separate table for BDA candidate entries (multiple per day)
CREATE TABLE public.bda_candidate_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.employee_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  candidate_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  agent_name TEXT,
  location TEXT,
  domain TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bda_candidate_entries ENABLE ROW LEVEL SECURITY;

-- Policies for employees (can CRUD their own entries)
CREATE POLICY "Employees can view their own candidate entries"
ON public.bda_candidate_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Employees can create their own candidate entries"
ON public.bda_candidate_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employees can update their own candidate entries same day"
ON public.bda_candidate_entries
FOR UPDATE
USING (auth.uid() = user_id AND report_date = CURRENT_DATE);

CREATE POLICY "Employees can delete their own candidate entries same day"
ON public.bda_candidate_entries
FOR DELETE
USING (auth.uid() = user_id AND report_date = CURRENT_DATE);

-- Admin policies
CREATE POLICY "Admins can view all candidate entries"
ON public.bda_candidate_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all candidate entries"
ON public.bda_candidate_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add index for faster lookups
CREATE INDEX idx_bda_candidate_entries_user_date ON public.bda_candidate_entries(user_id, report_date);
CREATE INDEX idx_bda_candidate_entries_report ON public.bda_candidate_entries(report_id);