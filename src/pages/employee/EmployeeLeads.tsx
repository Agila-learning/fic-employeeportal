import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/contexts/LeadsContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const EmployeeLeads = () => {
  const { user } = useAuth();
  const { getLeadsByEmployee } = useLeads();

  const myLeads = user ? getLeadsByEmployee(user.id) : [];

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Leads</h1>
            <p className="text-muted-foreground">Manage your assigned candidate leads</p>
          </div>
          <Link to="/employee/add-lead">
            <Button className="gradient-primary gap-2">
              <Plus className="h-4 w-4" />
              Add New Lead
            </Button>
          </Link>
        </div>
        <LeadsTable leads={myLeads} />
      </div>
    </DashboardLayout>
  );
};

export default EmployeeLeads;
