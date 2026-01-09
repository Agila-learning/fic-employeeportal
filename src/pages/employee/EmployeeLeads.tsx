import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const EmployeeLeads = () => {
  const { user } = useAuth();
  const { leads, refetchLeads, getLeadsByEmployee } = useLeads();

  const myLeads = user ? getLeadsByEmployee(user.id) : [];

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Leads</h1>
            <p className="text-sm text-muted-foreground">Manage your assigned candidate leads</p>
          </div>
          <Link to="/employee/add-lead" className="w-full sm:w-auto">
            <Button className="gradient-primary gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add New Lead
            </Button>
          </Link>
        </div>
        <LeadsTable leads={myLeads} onRefresh={refetchLeads} />
      </div>
    </DashboardLayout>
  );
};

export default EmployeeLeads;