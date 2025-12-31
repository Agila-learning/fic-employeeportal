import React, { createContext, useContext, useState } from 'react';
import { Lead } from '@/types';

interface LeadsContextType {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  getLeadsByEmployee: (employeeId: string) => Lead[];
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_LEADS: Lead[] = [
  {
    id: '1',
    candidateId: 'CND001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 9876543210',
    qualification: 'B.Tech Computer Science',
    pastExperience: '2 years at TCS',
    currentCtc: '6 LPA',
    expectedCtc: '10 LPA',
    status: 'nc1',
    source: 'social_media',
    assignedTo: '2',
    notes: 'Interested in frontend development roles',
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-20'),
  },
  {
    id: '2',
    candidateId: 'CND002',
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91 8765432109',
    qualification: 'MBA Marketing',
    pastExperience: 'Fresher',
    currentCtc: 'N/A',
    expectedCtc: '5 LPA',
    status: 'follow_up',
    source: 'college',
    assignedTo: '2',
    createdAt: new Date('2024-12-19'),
    updatedAt: new Date('2024-12-21'),
  },
  {
    id: '3',
    candidateId: 'CND003',
    name: 'Amit Kumar',
    email: 'amit.kumar@email.com',
    phone: '+91 7654321098',
    qualification: 'M.Tech Data Science',
    pastExperience: '4 years at Infosys',
    currentCtc: '12 LPA',
    expectedCtc: '18 LPA',
    status: 'converted',
    source: 'referral',
    assignedTo: '3',
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-25'),
  },
  {
    id: '4',
    candidateId: 'CND004',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@email.com',
    phone: '+91 6543210987',
    qualification: 'BCA',
    pastExperience: '1 year at Wipro',
    currentCtc: '4 LPA',
    expectedCtc: '7 LPA',
    status: 'not_interested',
    source: 'job_portal',
    assignedTo: '3',
    createdAt: new Date('2024-12-18'),
    updatedAt: new Date('2024-12-22'),
  },
  {
    id: '5',
    candidateId: 'CND005',
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91 5432109876',
    qualification: 'B.Tech Mechanical',
    pastExperience: '3 years at L&T',
    currentCtc: '8 LPA',
    expectedCtc: '12 LPA',
    status: 'different_domain',
    source: 'own_source',
    assignedTo: '2',
    createdAt: new Date('2024-12-22'),
    updatedAt: new Date('2024-12-23'),
  },
];

export const LeadsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLeads(prev => [newLead, ...prev]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id 
        ? { ...lead, ...updates, updatedAt: new Date() }
        : lead
    ));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const getLeadsByEmployee = (employeeId: string) => {
    return leads.filter(lead => lead.assignedTo === employeeId);
  };

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, deleteLead, getLeadsByEmployee }}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
};
