-- Add followup_count column to leads table to track how many times followup date has been changed
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS followup_count integer DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.leads.followup_count IS 'Tracks how many times the followup date has been changed. Max 6 times allowed before auto-rejection.';