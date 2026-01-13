import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadComment, LeadStatusHistory, LeadStatus, LeadSource, InterestedDomain } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LeadSchema, LeadUpdateSchema, CommentSchema, validateInput } from '@/utils/validation';

// Audit logging function for tracking lead data access
const logLeadAccess = async (
  userId: string,
  leadId: string | null,
  action: 'view' | 'create' | 'update' | 'delete' | 'export',
  accessedFields?: string[]
) => {
  try {
    await supabase.from('lead_access_audit').insert({
      user_id: userId,
      lead_id: leadId,
      action,
      accessed_fields: accessedFields || null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    // Silently fail audit logging to not interrupt main operations
    if (import.meta.env.DEV) {
      console.error('[DEV] Audit log error:', error);
    }
  }
};

export const useLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Log bulk view access for audit trail
      if (data && data.length > 0) {
        // Log individual lead views for compliance
        for (const lead of data.slice(0, 10)) { // Log first 10 for batch views
          logLeadAccess(user.id, lead.id, 'view', ['name', 'email', 'phone', 'status']);
        }
      }
      
      // Fetch creator names for all leads
      const uniqueCreatorIds = [...new Set((data || []).map(lead => lead.created_by).filter(Boolean))];
      let creatorNames: Record<string, string> = {};
      
      if (uniqueCreatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', uniqueCreatorIds);
        
        if (profiles) {
          creatorNames = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Attach creator name to each lead
      const leadsWithCreatorNames = (data || []).map(lead => ({
        ...lead,
        created_by_name: lead.created_by ? creatorNames[lead.created_by] || 'Unknown' : 'Unknown'
      }));
      
      setLeads(leadsWithCreatorNames);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching leads:', error);
      }
      toast.error('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const addLead = async (leadData: Partial<Lead>) => {
    if (!user) return null;

    // Validate input data
    const validation = validateInput(LeadSchema, {
      candidate_id: leadData.candidate_id,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      qualification: leadData.qualification,
      past_experience: leadData.past_experience,
      current_ctc: leadData.current_ctc,
      expected_ctc: leadData.expected_ctc,
      notes: leadData.notes,
      status: leadData.status || 'nc1',
      source: leadData.source || 'other',
      interested_domain: leadData.interested_domain,
      payment_stage: leadData.payment_stage,
      resume_url: leadData.resume_url,
      payment_slip_url: leadData.payment_slip_url,
      followup_date: leadData.followup_date,
    });

    if (!validation.success) {
      toast.error(validation.error);
      return null;
    }

    const validatedData = validation.data;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          candidate_id: validatedData.candidate_id,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          qualification: validatedData.qualification || null,
          past_experience: validatedData.past_experience || null,
          current_ctc: validatedData.current_ctc || null,
          expected_ctc: validatedData.expected_ctc || null,
          status: validatedData.status || 'nc1',
          source: validatedData.source || 'other',
          notes: validatedData.notes || null,
          resume_url: validatedData.resume_url || null,
          followup_date: validatedData.followup_date || null,
          payment_slip_url: validatedData.payment_slip_url || null,
          payment_stage: validatedData.payment_stage || null,
          interested_domain: validatedData.interested_domain || null,
          assigned_to: user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial status history
      await supabase.from('lead_status_history').insert({
        lead_id: data.id,
        changed_by: user.id,
        new_status: data.status,
        notes: 'Lead created',
      });

      // Log lead creation for audit
      logLeadAccess(user.id, data.id, 'create', ['all_fields']);

      setLeads((prev) => [data, ...prev]);
      return data;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error adding lead:', error);
      }
      toast.error(error.message || 'Failed to add lead');
      return null;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>, oldStatus?: LeadStatus, incrementFollowup?: boolean) => {
    if (!user) return false;

    try {
      // If incrementing followup, first get current lead to check count
      if (incrementFollowup) {
        const currentLead = leads.find(l => l.id === id);
        const currentCount = currentLead?.followup_count || 0;
        
        if (currentCount >= 6) {
          toast.error('Maximum follow-up attempts (6) reached. Please reject or convert this lead.');
          return false;
        }
        
        updates.followup_count = currentCount + 1;
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add status history if status changed
      if (oldStatus && updates.status && oldStatus !== updates.status) {
        await supabase.from('lead_status_history').insert({
          lead_id: id,
          changed_by: user.id,
          old_status: oldStatus,
          new_status: updates.status,
        });
      }

      // Log lead update for audit
      logLeadAccess(user.id, id, 'update', Object.keys(updates));

      setLeads((prev) => prev.map((l) => (l.id === id ? data : l)));
      return true;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error updating lead:', error);
      }
      toast.error(error.message || 'Failed to update lead');
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    if (!user) return false;
    
    try {
      // Log deletion for audit before actually deleting
      logLeadAccess(user.id, id, 'delete', ['all_fields']);
      
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      setLeads((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error deleting lead:', error);
      }
      toast.error(error.message || 'Failed to delete lead');
      return false;
    }
  };

  const getLeadsByEmployee = (employeeId: string) => {
    return leads.filter((l) => l.assigned_to === employeeId);
  };

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    getLeadsByEmployee,
    refetchLeads: fetchLeads,
  };
};

export const useLeadComments = (leadId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names for comments
      const commentsWithNames = await Promise.all(
        (data || []).map(async (comment) => {
          if (comment.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', comment.user_id)
              .single();
            return { ...comment, user_name: profile?.name || 'Unknown' };
          }
          return { ...comment, user_name: 'Unknown' };
        })
      );

      setComments(commentsWithNames);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching comments:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchComments();
    }
  }, [leadId]);

  const addComment = async (comment: string) => {
    if (!user) return null;

    const validation = validateInput(CommentSchema, { comment });
    if (!validation.success) {
      toast.error(validation.error);
      return null;
    }

    const validatedComment = validation.data.comment;

    try {
      const { data, error } = await supabase
        .from('lead_comments')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          comment: validatedComment,
        })
        .select()
        .single();

      if (error) throw error;

      const newComment = { ...data, user_name: user.name };
      setComments((prev) => [newComment, ...prev]);
      return data;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error adding comment:', error);
      }
      toast.error('Failed to add comment');
      return null;
    }
  };

  return { comments, isLoading, addComment, refetchComments: fetchComments };
};

export const useLeadStatusHistory = (leadId: string) => {
  const [history, setHistory] = useState<LeadStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_status_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names for history
      const historyWithNames = await Promise.all(
        (data || []).map(async (item) => {
          if (item.changed_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', item.changed_by)
              .single();
            return { ...item, changed_by_name: profile?.name || 'Unknown' };
          }
          return { ...item, changed_by_name: 'System' };
        })
      );

      setHistory(historyWithNames);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching status history:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchHistory();
    }
  }, [leadId]);

  return { history, isLoading, refetchHistory: fetchHistory };
};
