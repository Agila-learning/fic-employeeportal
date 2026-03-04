import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationService } from '@/api/operationService';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeaveRequestForm from '@/components/leave/LeaveRequestForm';
import LeaveRequestsList from '@/components/leave/LeaveRequestsList';

const EmployeeLeave = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await operationService.getMyLeaveRequests();
      setLeaves(data || []);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground font-heading">Leave Management</h1>
          <p className="text-muted-foreground">Request and track your leave applications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeaveRequestForm onSubmitted={fetchLeaves} />
          <LeaveRequestsList leaves={leaves} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeLeave;
