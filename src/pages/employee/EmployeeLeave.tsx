import DashboardLayout from '@/components/layout/DashboardLayout';
import LeaveRequestForm from '@/components/leave/LeaveRequestForm';
import LeaveRequestsList from '@/components/leave/LeaveRequestsList';

const EmployeeLeave = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Leave Request</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeaveRequestForm />
          <LeaveRequestsList />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeLeave;
