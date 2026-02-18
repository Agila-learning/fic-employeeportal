import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLeaveRequestsComponent from '@/components/leave/AdminLeaveRequests';

const AdminLeaveRequests = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Leave Requests Management</h1>
        <AdminLeaveRequestsComponent />
      </div>
    </DashboardLayout>
  );
};

export default AdminLeaveRequests;
