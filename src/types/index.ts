import { Database } from '@/integrations/supabase/types';

export type LeadStatus = Database['public']['Enums']['lead_status'];
export type LeadSource = Database['public']['Enums']['lead_source'];
export type PaymentStage = 'registration_done' | 'initial_payment_done' | 'full_payment_done';
export type InterestedDomain = 'it' | 'non_it' | 'banking';
export type AppRole = Database['public']['Enums']['app_role'];

export interface Lead {
  id: string;
  candidate_id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string | null;
  past_experience: string | null;
  current_ctc: string | null;
  expected_ctc: string | null;
  status: LeadStatus;
  source: LeadSource;
  resume_url: string | null;
  notes: string | null;
  followup_date: string | null;
  payment_slip_url: string | null;
  payment_stage: PaymentStage | null;
  interested_domain: InterestedDomain | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadComment {
  id: string;
  lead_id: string;
  user_id: string | null;
  comment: string;
  created_at: string;
  user_name?: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  changed_by: string | null;
  old_status: LeadStatus | null;
  new_status: LeadStatus;
  notes: string | null;
  created_at: string;
  changed_by_name?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  employee_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  employee_id?: string | null;
  is_active?: boolean | null;
}

export const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'nc1', label: 'NC1 - First Contact', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'nc2', label: 'NC2 - Second Contact', color: 'bg-blue-200 text-blue-800 border-blue-300' },
  { value: 'nc3', label: 'NC3 - Third Contact', color: 'bg-blue-300 text-blue-900 border-blue-400' },
  { value: 'follow_up', label: 'Follow Up', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'success', label: 'Success', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'not_interested_paid', label: 'Not Interested (Paid)', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'different_domain', label: 'Different Domain', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export const PAYMENT_STAGE_OPTIONS: { value: PaymentStage; label: string }[] = [
  { value: 'registration_done', label: 'Registration Done' },
  { value: 'initial_payment_done', label: 'Initial Payment Done' },
  { value: 'full_payment_done', label: 'Full Payment Done' },
];

export const INTERESTED_DOMAIN_OPTIONS: { value: InterestedDomain; label: string }[] = [
  { value: 'it', label: 'IT' },
  { value: 'non_it', label: 'Non-IT' },
  { value: 'banking', label: 'Banking' },
];

export const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'own_source', label: 'Own Source' },
  { value: 'college', label: 'College' },
  { value: 'referral', label: 'Referral' },
  { value: 'job_portal', label: 'Job Portal' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];
