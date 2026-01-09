import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';
import { useLeads } from '@/hooks/useLeads';

const AdminLeads = () => {
  const { leads, refetchLeads } = useLeads();

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Leads</h1>
          <p className="text-muted-foreground">View and manage all candidate leads across the team</p>
        </div>
        <LeadsTable leads={leads} showAssignee onRefresh={refetchLeads} />
      </div>
    </DashboardLayout>
  );
};

export default AdminLeads;