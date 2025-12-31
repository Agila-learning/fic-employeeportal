import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/contexts/LeadsContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { Users, FileSpreadsheet, UserCheck, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_OPTIONS } from '@/types';

const AdminDashboard = () => {
  const { employees } = useAuth();
  const { leads } = useLeads();

  const activeEmployees = employees.filter(e => e.isActive).length;
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const pendingLeads = leads.filter(l => ['nc1', 'nc2', 'nc3', 'follow_up'].includes(l.status)).length;

  const conversionRate = totalLeads > 0 
    ? Math.round((convertedLeads / totalLeads) * 100) 
    : 0;

  // Status distribution
  const statusDistribution = STATUS_OPTIONS.map(status => ({
    ...status,
    count: leads.filter(l => l.status === status.value).length
  })).sort((a, b) => b.count - a.count);

  // Top performers
  const employeePerformance = employees.map(emp => ({
    ...emp,
    converted: leads.filter(l => l.assignedTo === emp.id && l.status === 'converted').length,
    total: leads.filter(l => l.assignedTo === emp.id).length
  })).sort((a, b) => b.converted - a.converted).slice(0, 5);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your team's performance</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            iconClassName="gradient-primary"
          />
          <StatsCard
            title="Active Employees"
            value={activeEmployees}
            icon={UserCheck}
            iconClassName="gradient-accent"
          />
          <StatsCard
            title="Total Leads"
            value={totalLeads}
            icon={FileSpreadsheet}
            trend={{ value: 8, isPositive: true }}
            iconClassName="bg-amber-500"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
            iconClassName="bg-green-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status Distribution */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Lead Status Distribution</CardTitle>
            </CardHeader>
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
                        <div 
                          className={`h-full rounded-full ${status.color.replace('text', 'bg').replace('-700', '-500').replace('-800', '-600').replace('-900', '-700')}`}
                          style={{ width: `${totalLeads > 0 ? (status.count / totalLeads) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeePerformance.map((emp, index) => (
                  <div key={emp.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-accent">
                      <span className="text-sm font-semibold text-accent-foreground">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.total} leads assigned
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">{emp.converted}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">converted</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{convertedLeads}</p>
                  <p className="text-sm text-muted-foreground">Converted Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingLeads}</p>
                  <p className="text-sm text-muted-foreground">Pending Follow-ups</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees.length - activeEmployees}</p>
                  <p className="text-sm text-muted-foreground">Inactive Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
