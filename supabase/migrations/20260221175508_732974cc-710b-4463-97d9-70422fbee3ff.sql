-- Add paid_to column to expenses table to track who was given the money
ALTER TABLE public.expenses ADD COLUMN paid_to text;