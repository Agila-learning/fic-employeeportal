import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SuccessStory {
  id: string;
  candidate_name: string;
  package: string;
  location: string;
  domain: string;
  motivation_words: string;
  video_url: string | null;
  video_path: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useSuccessStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories((data as unknown as SuccessStory[]) || []);
    } catch (error: any) {
      toast.error('Failed to fetch success stories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStories();
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel('success_stories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'success_stories' }, () => {
        fetchStories();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const uploadVideo = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('success-story-videos')
      .upload(path, file, { contentType: file.type });
    if (error) { toast.error('Failed to upload video'); return null; }
    return path;
  };

  const deleteVideoFile = async (videoPath: string) => {
    await supabase.storage.from('success-story-videos').remove([videoPath]);
  };

  const getVideoPublicUrl = (videoPath: string) => {
    const { data } = supabase.storage.from('success-story-videos').getPublicUrl(videoPath);
    return data.publicUrl;
  };

  const addStory = async (story: Omit<SuccessStory, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('success_stories')
        .insert({ ...story, created_by: user.id } as any);
      if (error) throw error;
      toast.success('Success story added!');
      fetchStories();
    } catch (error: any) {
      toast.error('Failed to add success story');
    }
  };

  const updateStory = async (id: string, updates: Partial<Omit<SuccessStory, 'id' | 'created_at' | 'created_by'>>) => {
    try {
      const { error } = await supabase
        .from('success_stories')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('Success story updated!');
      fetchStories();
    } catch (error: any) {
      toast.error('Failed to update success story');
    }
  };

  const deleteStory = async (id: string) => {
    const story = stories.find(s => s.id === id);
    try {
      if (story?.video_path) await deleteVideoFile(story.video_path);
      const { error } = await supabase
        .from('success_stories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Success story deleted!');
      fetchStories();
    } catch (error: any) {
      toast.error('Failed to delete success story');
    }
  };

  return { stories, isLoading, addStory, updateStory, deleteStory, uploadVideo, deleteVideoFile, getVideoPublicUrl, refetch: fetchStories };
};
