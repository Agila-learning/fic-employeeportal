import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementSchema, validateInput } from '@/utils/validation';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async (announcement: { title: string; message: string }) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Validate input data
    const validation = validateInput(AnnouncementSchema, announcement);
    if (!validation.success) {
      toast({ title: 'Validation Error', description: validation.error, variant: 'destructive' });
      return { error: new Error(validation.error) };
    }

    const validatedData = validation.data;
    const { error } = await supabase.from('announcements').insert({
      title: validatedData.title,
      message: validatedData.message,
      created_by: user.id
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Announcement posted successfully' });
    fetchAnnouncements();
    return { error: null };
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Announcement deleted' });
    fetchAnnouncements();
    return { error: null };
  };

  const toggleAnnouncementStatus = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    fetchAnnouncements();
    return { error: null };
  };

  useEffect(() => {
    if (user) fetchAnnouncements();
  }, [user]);

  return { announcements, loading, fetchAnnouncements, createAnnouncement, deleteAnnouncement, toggleAnnouncementStatus };
};
