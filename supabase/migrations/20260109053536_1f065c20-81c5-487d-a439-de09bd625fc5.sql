-- Add followup_date and payment_slip_url columns to leads table
ALTER TABLE public.leads 
ADD COLUMN followup_date timestamp with time zone DEFAULT NULL,
ADD COLUMN payment_slip_url text DEFAULT NULL;

-- Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for payment slips bucket
CREATE POLICY "Users can view payment slips of their leads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-slips' AND (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.assigned_to = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  )
));

CREATE POLICY "Users can upload payment slips" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment-slips' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update payment slips" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'payment-slips' AND auth.uid() IS NOT NULL);

-- Create RLS policies for resumes bucket
CREATE POLICY "Users can view resumes of their leads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'resumes' AND (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.assigned_to = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  )
));

CREATE POLICY "Users can upload resumes" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update resumes" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);