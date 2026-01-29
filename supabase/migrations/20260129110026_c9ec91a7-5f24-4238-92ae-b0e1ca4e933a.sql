-- Make email column optional (nullable) in leads table
ALTER TABLE public.leads ALTER COLUMN email DROP NOT NULL;