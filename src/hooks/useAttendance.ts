import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_at: string;
  leave_reason?: string | null;
  user_name?: string;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  currentMonthPresent: number;
  currentMonthAbsent: number;
}

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    totalPresent: 0,
    totalAbsent: 0,
    currentMonthPresent: 0,
    currentMonthAbsent: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // For admin, fetch all attendance
      if (user.role === 'admin') {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;

        // Fetch user names
        const userIds = [...new Set(data?.map(a => a.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        const attendanceWithNames = data?.map(a => ({
          ...a,
          status: a.status as 'present' | 'absent',
          leave_reason: a.leave_reason,
          user_name: profiles?.find(p => p.user_id === a.user_id)?.name || 'Unknown'
        })) || [];

        setAttendance(attendanceWithNames);
      }

      // Fetch employee's own attendance history
      const { data: myData, error: myError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!myError && myData) {
        const myAttendanceData = myData.map(a => ({
          ...a,
          status: a.status as 'present' | 'absent'
        }));
        setMyAttendance(myAttendanceData);

        // Calculate summary
        const totalPresent = myAttendanceData.filter(a => a.status === 'present').length;
        const totalAbsent = myAttendanceData.filter(a => a.status === 'absent').length;
        
        const currentMonthAttendance = myAttendanceData.filter(a => {
          const date = new Date(a.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const currentMonthPresent = currentMonthAttendance.filter(a => a.status === 'present').length;
        const currentMonthAbsent = currentMonthAttendance.filter(a => a.status === 'absent').length;

        setAttendanceSummary({
          totalPresent,
          totalAbsent,
          currentMonthPresent,
          currentMonthAbsent
        });
      }

      // Check if user has marked attendance today
      const { data: todayData, error: todayError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (!todayError && todayData) {
        setTodayAttendance({
          ...todayData,
          status: todayData.status as 'present' | 'absent'
        });
      } else {
        setTodayAttendance(null);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (status: 'present' | 'absent', leaveReason?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Check if it's past 11 AM
    const now = new Date();
    const cutoffHour = 11;
    
    if (now.getHours() >= cutoffHour) {
      toast({ 
        title: 'Time Exceeded', 
        description: 'Attendance can only be marked before 11:00 AM', 
        variant: 'destructive' 
      });
      return { error: new Error('Time exceeded') };
    }

    // Check if already marked
    if (todayAttendance) {
      toast({ 
        title: 'Already Marked', 
        description: 'You have already marked your attendance for today', 
        variant: 'destructive' 
      });
      return { error: new Error('Already marked') };
    }

    // Require leave reason for absent status
    if (status === 'absent' && !leaveReason?.trim()) {
      toast({ 
        title: 'Reason Required', 
        description: 'Please provide a reason for leave', 
        variant: 'destructive' 
      });
      return { error: new Error('Leave reason required') };
    }

    const { error } = await supabase.from('attendance').insert({
      user_id: user.id,
      status,
      date: new Date().toISOString().split('T')[0],
      leave_reason: status === 'absent' ? leaveReason : null
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: `Attendance marked as ${status}` });
    fetchAttendance();
    return { error: null };
  };

  // Admin function to update attendance
  const updateAttendance = async (id: string, status: 'present' | 'absent', leaveReason?: string) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    // Require leave reason for absent status
    if (status === 'absent' && !leaveReason?.trim()) {
      toast({ 
        title: 'Reason Required', 
        description: 'Please provide a reason for leave', 
        variant: 'destructive' 
      });
      return { error: new Error('Leave reason required') };
    }

    const { error } = await supabase
      .from('attendance')
      .update({
        status,
        leave_reason: status === 'absent' ? leaveReason : null
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Attendance updated successfully' });
    fetchAttendance();
    return { error: null };
  };

  // Admin function to manually mark attendance for an employee (bypasses time restriction)
  const adminMarkAttendance = async (
    employeeId: string, 
    status: 'present' | 'absent', 
    date: string,
    leaveReason?: string
  ) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    // Require leave reason for absent status
    if (status === 'absent' && !leaveReason?.trim()) {
      toast({ 
        title: 'Reason Required', 
        description: 'Please provide a reason for leave', 
        variant: 'destructive' 
      });
      return { error: new Error('Leave reason required') };
    }

    // Check if attendance already exists for this employee on this date
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', employeeId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('attendance')
        .update({
          status,
          leave_reason: status === 'absent' ? leaveReason : null
        })
        .eq('id', existing.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return { error };
      }

      toast({ title: 'Success', description: 'Attendance updated successfully' });
    } else {
      // Create new record
      const { error } = await supabase.from('attendance').insert({
        user_id: employeeId,
        status,
        date,
        leave_reason: status === 'absent' ? leaveReason : null
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return { error };
      }

      toast({ title: 'Success', description: 'Attendance marked successfully' });
    }

    fetchAttendance();
    return { error: null };
  };

  const canMarkAttendance = () => {
    const now = new Date();
    return now.getHours() < 11 && !todayAttendance;
  };

  useEffect(() => {
    if (user) fetchAttendance();
  }, [user]);

  return { 
    attendance, 
    myAttendance,
    todayAttendance, 
    attendanceSummary,
    loading, 
    fetchAttendance, 
    markAttendance, 
    updateAttendance, 
    adminMarkAttendance,
    canMarkAttendance 
  };
};
