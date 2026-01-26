-- Add work_location column to attendance table
-- This stores where the employee is working from (krishnagiri, chennai, bangalore, wfh)
ALTER TABLE public.attendance 
ADD COLUMN work_location TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.attendance.work_location IS 'Work location: krishnagiri (GPS required), chennai, bangalore, or wfh (work from home)';

-- Create an index for faster filtering by location
CREATE INDEX idx_attendance_work_location ON public.attendance(work_location);