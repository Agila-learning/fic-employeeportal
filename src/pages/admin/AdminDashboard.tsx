import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useEmployees } from '@/hooks/useEmployees';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { Users, FileSpreadsheet, UserCheck, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_OPTIONS } from '@/types';

const AdminDashboard = () => {
  const { employees } = useEmployees();
  const { leads } = useLeads();

  const activeEmployees = employees.filter(e => e.is_active).length;
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const pendingLeads = leads.filter(l => ['nc1', 'nc2', 'nc3', 'follow_up'].includes(l.status)).length;

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const statusDistribution = STATUS_OPTIONS.map(status => ({
    ...status,
    count: leads.filter(l => l.status === status.value).length
  })).sort((a, b) => b.count - a.count);

  const employeePerformance = employees.map(emp => ({
    ...emp,
    converted: leads.filter(l => l.assigned_to === emp.user_id && l.status === 'converted').length,
    total: leads.filter(l => l.assigned_to === emp.user_id).length
  })).sort((a, b) => b.converted - a.converted).slice(0, 5);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your team's performance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Employees" value={employees.length} icon={Users} iconClassName="gradient-primary" />
          <StatsCard title="Active Employees" value={activeEmployees} icon={UserCheck} iconClassName="gradient-secondary" />
          <StatsCard title="Total Leads" value={totalLeads} icon={FileSpreadsheet} iconClassName="bg-amber-500" />
          <StatsCard title="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} iconClassName="bg-green-500" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-lg font-semibold">Lead Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusDistribution.map(status => (
                  <div key={status.value} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{status.label}</span>
                        <span className="text-sm text-muted-foreground">{status.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${totalLeads > 0 ? (status.count / totalLeads) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-lg font-semibold">Top Performers</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeePerformance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No employee data yet</p>
                ) : employeePerformance.map((emp, index) => (
                  <div key={emp.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">{index + 1}</div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-secondary">
                      <span className="text-sm font-semibold text-secondary-foreground">{emp.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.total} leads assigned</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-success"><CheckCircle className="h-4 w-4" /><span className="font-semibold">{emp.converted}</span></div>
                      <p className="text-xs text-muted-foreground">converted</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
