-- Add BDA/HR specific fields to employee_reports table
ALTER TABLE public.employee_reports
ADD COLUMN candidate_name TEXT,
ADD COLUMN agent_name TEXT,
ADD COLUMN mobile_number TEXT,
ADD COLUMN location TEXT,
ADD COLUMN domain TEXT,
ADD COLUMN comments TEXT,
ADD COLUMN candidates_screened INTEGER;