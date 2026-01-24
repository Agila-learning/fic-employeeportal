import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type HolidayType = 'govt' | 'festival';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: HolidayType;
  created_at: string;
  created_by: string;
}

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays((data || []) as Holiday[]);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = async (date: string, name: string, type: HolidayType) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    const { error } = await supabase.from('holidays').insert({
      date,
      name,
      type,
      created_by: user.id
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'A holiday already exists on this date', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return { error };
    }

    toast({ title: 'Success', description: 'Holiday added successfully' });
    fetchHolidays();
    return { error: null };
  };

  const deleteHoliday = async (id: string) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    const { error } = await supabase.from('holidays').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Holiday deleted successfully' });
    fetchHolidays();
    return { error: null };
  };

  // Check if a specific date is a holiday
  const isHoliday = (date: string): Holiday | null => {
    return holidays.find(h => h.date === date) || null;
  };

  // Check if a date is Sunday
  const isSunday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getDay() === 0;
  };

  // Get attendance status for a date (considering Sundays and holidays)
  const getDateStatus = (date: string): { type: 'sunday' | 'holiday' | 'working'; holiday?: Holiday } => {
    const d = new Date(date);
    if (isSunday(d)) {
      return { type: 'sunday' };
    }
    const holiday = isHoliday(date);
    if (holiday) {
      return { type: 'holiday', holiday };
    }
    return { type: 'working' };
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  return {
    holidays,
    loading,
    fetchHolidays,
    addHoliday,
    deleteHoliday,
    isHoliday,
    isSunday,
    getDateStatus
  };
};
