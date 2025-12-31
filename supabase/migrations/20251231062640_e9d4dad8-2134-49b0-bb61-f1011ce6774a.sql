-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create lead_status enum
CREATE TYPE public.lead_status AS ENUM (
  'nc1', 'nc2', 'nc3', 'rejected', 'not_interested', 
  'not_interested_paid', 'different_domain', 'converted', 'follow_up'
);

-- Create lead_source enum
CREATE TYPE public.lead_source AS ENUM (
  'social_media', 'own_source', 'college', 'referral', 'job_portal', 'website', 'other'
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE(user_id, role)
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  qualification TEXT,
  past_experience TEXT,
  current_ctc TEXT,
  expected_ctc TEXT,
  status lead_status NOT NULL DEFAULT 'nc1',
  source lead_source NOT NULL DEFAULT 'other',
  resume_url TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create lead_comments table
CREATE TABLE public.lead_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create lead_status_history table for tracking status changes
CREATE TABLE public.lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_status lead_status,
  new_status lead_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Leads policies
CREATE POLICY "Employees can view their assigned leads"
ON public.leads FOR SELECT
TO authenticated
USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can update their assigned leads"
ON public.leads FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Lead comments policies
CREATE POLICY "Users can view comments on their leads"
ON public.lead_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_comments.lead_id 
    AND (leads.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can add comments"
ON public.lead_comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_comments.lead_id 
    AND (leads.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Lead status history policies
CREATE POLICY "Users can view history of their leads"
ON public.lead_status_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_status_history.lead_id 
    AND (leads.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can add history entries"
ON public.lead_status_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_status_history.lead_id 
    AND (leads.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Default role is employee
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();