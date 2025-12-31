export type LeadStatus = 
  | 'nc1' 
  | 'nc2' 
  | 'nc3' 
  | 'rejected' 
  | 'not_interested' 
  | 'not_interested_paid' 
  | 'different_domain'
  | 'converted'
  | 'follow_up';

export type LeadSource = 
  | 'social_media' 
  | 'own_source' 
  | 'college' 
  | 'referral' 
  | 'job_portal' 
  | 'website'
  | 'other';

export interface Lead {
  id: string;
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  pastExperience: string;
  currentCtc: string;
  expectedCtc: string;
  status: LeadStatus;
  source: LeadSource;
  resumeUrl?: string;
  notes?: string;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  isActive: boolean;
  createdAt: Date;
  leadsCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
}

export const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'nc1', label: 'NC1 - First Contact', color: 'bg-blue-100 text-blue-700' },
  { value: 'nc2', label: 'NC2 - Second Contact', color: 'bg-blue-200 text-blue-800' },
  { value: 'nc3', label: 'NC3 - Third Contact', color: 'bg-blue-300 text-blue-900' },
  { value: 'follow_up', label: 'Follow Up', color: 'bg-amber-100 text-amber-700' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-gray-100 text-gray-700' },
  { value: 'not_interested_paid', label: 'Not Interested (Paid)', color: 'bg-orange-100 text-orange-700' },
  { value: 'different_domain', label: 'Different Domain', color: 'bg-purple-100 text-purple-700' },
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
