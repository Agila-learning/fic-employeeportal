import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, AppRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Employee extends Profile {
  role: AppRole;
  leads_count: number;
}

export const useEmployees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmployees = async () => {
    if (!user || user.role !== 'admin') return;

    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get lead counts per employee
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('assigned_to');

      if (leadsError) throw leadsError;

      // Combine data
      const employeesWithData = (profiles || []).map((profile) => {
        const roleData = roles?.find((r) => r.user_id === profile.user_id);
        const leadsCount = leads?.filter((l) => l.assigned_to === profile.user_id).length || 0;

        return {
          ...profile,
          role: roleData?.role as AppRole || 'employee',
          leads_count: leadsCount,
        };
      });

      setEmployees(employeesWithData);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const updateEmployee = async (userId: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      setEmployees((prev) =>
        prev.map((e) => (e.user_id === userId ? { ...e, ...updates } : e))
      );
      return true;
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'Failed to update employee');
      return false;
    }
  };

  const updateEmployeeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;

      setEmployees((prev) =>
        prev.map((e) => (e.user_id === userId ? { ...e, role } : e))
      );
      return true;
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
      return false;
    }
  };

  const toggleEmployeeStatus = async (userId: string, isActive: boolean) => {
    return updateEmployee(userId, { is_active: isActive });
  };

  const deleteEmployee = async (userId: string) => {
    try {
      // Note: This will cascade delete the profile and role due to FK constraints
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      // If admin API fails, just deactivate
      if (error) {
        return toggleEmployeeStatus(userId, false);
      }

      setEmployees((prev) => prev.filter((e) => e.user_id !== userId));
      return true;
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee. Deactivating instead.');
      return toggleEmployeeStatus(userId, false);
    }
  };

  return {
    employees,
    isLoading,
    updateEmployee,
    updateEmployeeRole,
    toggleEmployeeStatus,
    deleteEmployee,
    refetchEmployees: fetchEmployees,
  };
};
