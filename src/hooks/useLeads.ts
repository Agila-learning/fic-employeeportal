import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadComment, LeadStatusHistory, LeadStatus, LeadSource, InterestedDomain } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
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

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          candidate_id: leadData.candidate_id!,
          name: leadData.name!,
          email: leadData.email!,
          phone: leadData.phone!,
          qualification: leadData.qualification,
          past_experience: leadData.past_experience,
          current_ctc: leadData.current_ctc,
          expected_ctc: leadData.expected_ctc,
          status: leadData.status || 'nc1',
          source: leadData.source || 'other',
          notes: leadData.notes,
          resume_url: leadData.resume_url,
          followup_date: leadData.followup_date,
          payment_slip_url: leadData.payment_slip_url,
          payment_stage: leadData.payment_stage,
          interested_domain: leadData.interested_domain,
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

      setLeads((prev) => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast.error(error.message || 'Failed to add lead');
      return null;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>, oldStatus?: LeadStatus) => {
    if (!user) return false;

    try {
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

      setLeads((prev) => prev.map((l) => (l.id === id ? data : l)));
      return true;
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast.error(error.message || 'Failed to update lead');
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      setLeads((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting lead:', error);
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
      console.error('Error fetching comments:', error);
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

    try {
      const { data, error } = await supabase
        .from('lead_comments')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          comment,
        })
        .select()
        .single();

      if (error) throw error;

      const newComment = { ...data, user_name: user.name };
      setComments((prev) => [newComment, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
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
      console.error('Error fetching status history:', error);
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
