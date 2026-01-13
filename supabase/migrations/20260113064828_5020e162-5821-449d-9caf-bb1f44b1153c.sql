-- Create lead_access_audit table for tracking all lead data access
CREATE TABLE public.lead_access_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'view', 'update', 'create', 'delete', 'export'
  accessed_fields TEXT[], -- which fields were accessed
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.lead_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (security team access)
CREATE POLICY "Only admins can view audit logs"
ON public.lead_access_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert their own audit logs
CREATE POLICY "Authenticated users can create audit entries"
ON public.lead_access_audit
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create index for efficient querying
CREATE INDEX idx_lead_access_audit_user_id ON public.lead_access_audit(user_id);
CREATE INDEX idx_lead_access_audit_lead_id ON public.lead_access_audit(lead_id);
CREATE INDEX idx_lead_access_audit_accessed_at ON public.lead_access_audit(accessed_at DESC);

-- Add comment explaining the table purpose
COMMENT ON TABLE public.lead_access_audit IS 'Audit log for tracking all access to sensitive lead data for compliance and security monitoring';