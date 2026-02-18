import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useEmployees } from '@/hooks/useEmployees';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { Users, FileSpreadsheet, UserCheck, TrendingUp, CheckCircle, Clock, Bell, ArrowRight, Trophy, CreditCard, Briefcase } from 'lucide-react';
import AdminLeaveRequests from '@/components/leave/AdminLeaveRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STATUS_OPTIONS, STATUS_OPTIONS_ADMIN, Lead, INTERESTED_DOMAIN_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { leads, refetchLeads } = useLeads();
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const activeEmployees = employees.filter(e => e.is_active).length;
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const successLeads = leads.filter(l => l.status === 'success').length;
  const pendingLeads = leads.filter(l => ['nc1', 'nc2', 'nc3', 'follow_up'].includes(l.status)).length;
  
  // Payment stage counts
  const registrationDone = leads.filter(l => l.payment_stage === 'registration_done').length;
  const initialPaymentDone = leads.filter(l => l.payment_stage === 'initial_payment_done').length;
  const fullPaymentDone = leads.filter(l => l.payment_stage === 'full_payment_done').length;
  
  // Domain-wise payment counts
  const itPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'it').length;
  const nonItPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'non_it').length;
  const bankingPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'banking').length;

  // Calculate conversion rate based on employee success conversions only
  const totalEmployeeSuccess = employees.reduce((acc, emp) => {
    return acc + leads.filter(l => l.assigned_to === emp.user_id && l.status === 'success').length;
  }, 0);
  const totalEmployeeLeads = employees.reduce((acc, emp) => {
    return acc + leads.filter(l => l.assigned_to === emp.user_id).length;
  }, 0);
  const conversionRate = totalEmployeeLeads > 0 ? Math.round((totalEmployeeSuccess / totalEmployeeLeads) * 100) : 0;

  const statusDistribution = STATUS_OPTIONS_ADMIN.map(status => ({
    ...status,
    count: leads.filter(l => l.status === status.value).length
  })).sort((a, b) => b.count - a.count);

  const employeePerformance = employees.map(emp => ({
    ...emp,
    successCount: leads.filter(l => l.assigned_to === emp.user_id && l.status === 'success').length,
    converted: leads.filter(l => l.assigned_to === emp.user_id && (l.status === 'converted' || l.status === 'success')).length,
    total: leads.filter(l => l.assigned_to === emp.user_id).length
  })).sort((a, b) => b.successCount - a.successCount).slice(0, 5);

  // Get recent leads
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back, {user?.name}! Here's your team's overview.</p>
          </div>
        </div>

        {/* Stats Cards with staggered animation */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-5">
          <StatsCard 
            title="Total Employees" 
            value={employees.length} 
            icon={Users} 
            iconClassName="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0}
          />
          <StatsCard 
            title="Active Employees" 
            value={activeEmployees} 
            icon={UserCheck} 
            iconClassName="bg-gradient-to-br from-amber-500 to-amber-600"
            delay={100}
          />
          <StatsCard 
            title="Total Leads" 
            value={totalLeads} 
            icon={FileSpreadsheet} 
            iconClassName="bg-gradient-to-br from-purple-500 to-purple-600"
            delay={150}
          />
          <StatsCard 
            title="Success" 
            value={successLeads} 
            icon={Trophy} 
            iconClassName="bg-gradient-to-br from-green-500 to-green-600"
            delay={200}
          />
          <StatsCard 
            title="Conversion Rate" 
            value={`${conversionRate}%`} 
            icon={TrendingUp} 
            trend={{ value: conversionRate, isPositive: conversionRate > 0 }}
            iconClassName="bg-gradient-to-br from-teal-500 to-teal-600"
            delay={300}
          />
        </div>

        {/* Payment Stage Stats */}
        {(registrationDone > 0 || initialPaymentDone > 0 || fullPaymentDone > 0) && (
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 animate-fade-in">
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 shrink-0">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium truncate">Registration</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">{registrationDone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 shrink-0">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium truncate">Initial Pay</p>
                    <p className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-300">{initialPaymentDone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 col-span-2 sm:col-span-1">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium truncate">Full Pay</p>
                    <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">{fullPaymentDone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Domain-wise Payment Stats */}
        {fullPaymentDone > 0 && (
          <Card className="border-border/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Full Payment by Domain</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-center">
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{itPaidCount}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">IT</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-center">
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{nonItPaidCount}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Non-IT</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-center">
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{bankingPaidCount}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Banking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Status Distribution */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-1">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Lead Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {statusDistribution.map((status, index) => {
                  const percentage = totalLeads > 0 ? (status.count / totalLeads) * 100 : 0;
                  return (
                    <div 
                      key={status.value} 
                      className="group/item cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium group-hover/item:text-primary transition-colors">{status.label}</span>
                        <span className="text-sm text-muted-foreground font-mono">{status.count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            status.color || "bg-gradient-to-r from-primary to-primary/70"
                          )}
                          style={{ 
                            width: `${percentage}%`,
                            transitionDelay: `${index * 100}ms`
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-2">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Top Performers
                </CardTitle>
                <Link to="/admin/employees">
                  <Button variant="ghost" size="sm" className="gap-1 group/btn">
                    View All
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {employeePerformance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No employee data yet</p>
                ) : employeePerformance.map((emp, index) => (
                  <div 
                    key={emp.id} 
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer group/emp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                      index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30" :
                      index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700" :
                      index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md group-hover/emp:shadow-lg group-hover/emp:scale-105 transition-all duration-300">
                      <span className="text-sm font-bold text-white">{emp.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover/emp:text-primary transition-colors">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.total} leads assigned</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-xl font-bold">{emp.converted}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">converted</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/50 overflow-hidden hover:shadow-lg transition-all duration-500 animate-slide-up stagger-3">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <Link to="/admin/leads">
                <Button variant="ghost" size="sm" className="gap-1 group/btn">
                  View All Leads
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : recentLeads.map((lead, index) => (
                <div 
                  key={lead.id} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] group/lead"
                  onClick={() => setViewingLead(lead)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover/lead:bg-primary/20 transition-colors">
                    <span className="text-sm font-bold text-primary">{lead.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover/lead:text-primary transition-colors">{lead.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{lead.candidate_id}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    STATUS_OPTIONS.find(s => s.value === lead.status)?.color || "bg-muted"
                  )}>
                    {STATUS_OPTIONS.find(s => s.value === lead.status)?.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(lead.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Management */}
        <AdminLeaveRequests />
      </div>

      {/* View Lead Dialog */}
      {viewingLead && (
        <LeadFormDialog
          open={!!viewingLead}
          onOpenChange={(open) => !open && setViewingLead(null)}
          lead={viewingLead}
          mode="view"
          onSave={refetchLeads}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;