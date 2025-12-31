import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';
import { useLeads } from '@/contexts/LeadsContext';

const AdminLeads = () => {
  const { leads } = useLeads();

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Leads</h1>
          <p className="text-muted-foreground">View and manage all candidate leads across the team</p>
        </div>
        <LeadsTable leads={leads} showAssignee />
      </div>
    </DashboardLayout>
  );
};

export default AdminLeads;
