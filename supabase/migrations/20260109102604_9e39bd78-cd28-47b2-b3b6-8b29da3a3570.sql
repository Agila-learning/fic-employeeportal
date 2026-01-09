-- Create enum for interested domain
CREATE TYPE public.interested_domain AS ENUM ('it', 'non_it', 'banking');

-- Add interested_domain column to leads table
ALTER TABLE public.leads ADD COLUMN interested_domain public.interested_domain DEFAULT 'it';