import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';
import { useLeads } from '@/hooks/useLeads';
import { useSearchParams } from 'react-router-dom';

const AdminLeads = () => {
  const { leads, refetchLeads } = useLeads();
  const [searchParams] = useSearchParams();
  const paymentStageFilter = searchParams.get('payment_stage') || undefined;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Leads</h1>
          <p className="text-muted-foreground">View and manage all candidate leads across the team</p>
        </div>
        <LeadsTable leads={leads} showAssignee onRefresh={refetchLeads} defaultPaymentStageFilter={paymentStageFilter} />
      </div>
    </DashboardLayout>
  );
};

export default AdminLeads;