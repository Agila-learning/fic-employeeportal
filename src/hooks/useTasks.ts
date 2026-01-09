import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch assignee names
      const userIds = [...new Set(data?.map(t => t.assigned_to) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const tasksWithNames = data?.map(task => ({
        ...task,
        status: task.status as 'pending' | 'in_progress' | 'completed',
        assignee_name: profiles?.find(p => p.user_id === task.assigned_to)?.name || 'Unknown'
      })) || [];

      setTasks(tasksWithNames);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: { title: string; description?: string; assigned_to: string; due_date?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase.from('tasks').insert({
      title: task.title,
      description: task.description || null,
      assigned_to: task.assigned_to,
      assigned_by: user.id,
      due_date: task.due_date || null
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Task assigned successfully' });
    fetchTasks();
    return { error: null };
  };

  const updateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Task status updated' });
    fetchTasks();
    return { error: null };
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Task deleted' });
    fetchTasks();
    return { error: null };
  };

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  return { tasks, loading, fetchTasks, createTask, updateTaskStatus, deleteTask };
};
