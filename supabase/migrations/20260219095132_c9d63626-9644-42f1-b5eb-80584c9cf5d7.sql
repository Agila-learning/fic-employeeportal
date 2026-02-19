
-- Create expenses table for daily expense tracking
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_credits table for money received from manager/CEO
CREATE TABLE public.expense_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  given_by TEXT NOT NULL,
  given_by_role TEXT NOT NULL DEFAULT 'manager',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_credits ENABLE ROW LEVEL SECURITY;

-- Expenses RLS
CREATE POLICY "Employees can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Employees can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employees can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Employees can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all expenses" ON public.expenses FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all expenses" ON public.expenses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Credits RLS
CREATE POLICY "Employees can view their own credits" ON public.expense_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Employees can insert their own credits" ON public.expense_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employees can update their own credits" ON public.expense_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Employees can delete their own credits" ON public.expense_credits FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all credits" ON public.expense_credits FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all credits" ON public.expense_credits FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
