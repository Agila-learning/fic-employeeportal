import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee_name?: string;
}

export const useLeaveRequests = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaveRequests = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If admin, fetch employee names
      if (user.role === 'admin' && data) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
        const enriched = data.map(r => ({
          ...r,
          status: r.status as LeaveRequest['status'],
          employee_name: profileMap.get(r.user_id) || 'Unknown',
        }));
        setLeaveRequests(enriched);
      } else {
        setLeaveRequests((data || []).map(r => ({ ...r, status: r.status as LeaveRequest['status'] })));
      }
    } catch (err: any) {
      console.error('Error fetching leave requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const createLeaveRequest = async (leaveDate: string, reason: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user.id,
        leave_date: leaveDate,
        reason: reason.trim(),
      });
      if (error) throw error;
      toast.success('Leave request submitted successfully!');
      await fetchLeaveRequests();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave request');
      return false;
    }
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Leave request ${status}!`);
      await fetchLeaveRequests();
      return true;
    } catch (err: any) {
      toast.error(err.message || `Failed to ${status} leave request`);
      return false;
    }
  };

  return { leaveRequests, isLoading, createLeaveRequest, updateLeaveStatus, refetch: fetchLeaveRequests };
};
