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
  user_name?: string;
}

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

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
          user_name: profiles?.find(p => p.user_id === a.user_id)?.name || 'Unknown'
        })) || [];

        setAttendance(attendanceWithNames);
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
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (status: 'present' | 'absent') => {
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

    const { error } = await supabase.from('attendance').insert({
      user_id: user.id,
      status,
      date: new Date().toISOString().split('T')[0]
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: `Attendance marked as ${status}` });
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

  return { attendance, todayAttendance, loading, fetchAttendance, markAttendance, canMarkAttendance };
};
