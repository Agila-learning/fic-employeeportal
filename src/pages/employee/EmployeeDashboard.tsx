import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import FollowupNotifications from '@/components/leads/FollowupNotifications';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { FileSpreadsheet, CheckCircle, Clock, XCircle, Plus, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import LeadStatusBadge from '@/components/leads/LeadStatusBadge';
import { STATUS_OPTIONS, Lead } from '@/types';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { leads, getLeadsByEmployee, refetchLeads } = useLeads();
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const myLeads = user ? getLeadsByEmployee(user.id) : [];
  const totalLeads = myLeads.length;
  const convertedLeads = myLeads.filter(l => l.status === 'converted').length;
  const pendingLeads = myLeads.filter(l => ['nc1', 'nc2', 'nc3', 'follow_up'].includes(l.status)).length;
  const rejectedLeads = myLeads.filter(l => ['rejected', 'not_interested', 'not_interested_paid', 'different_domain'].includes(l.status)).length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const recentLeads = [...myLeads].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
  const statusDistribution = STATUS_OPTIONS.map(status => ({ ...status, count: myLeads.filter(l => l.status === status.value).length })).filter(s => s.count > 0);

  // Get followup leads for notifications
  const followupLeads = myLeads.filter(l => l.followup_date);

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground">Here's your lead management overview</p>
          </div>
          <div className="flex items-center gap-3">
            <FollowupNotifications leads={myLeads} onViewLead={(lead) => setViewingLead(lead)} />
            <Link to="/employee/add-lead">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 gap-2">
                <Plus className="h-4 w-4" />
                Add New Lead
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Leads" value={totalLeads} icon={FileSpreadsheet} iconClassName="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatsCard title="Converted" value={convertedLeads} icon={CheckCircle} trend={{ value: conversionRate, isPositive: true }} iconClassName="bg-gradient-to-br from-green-500 to-green-600" />
          <StatsCard title="Pending" value={pendingLeads} icon={Clock} iconClassName="bg-gradient-to-br from-amber-500 to-amber-600" />
          <StatsCard title="Closed (No)" value={rejectedLeads} icon={XCircle} iconClassName="bg-gradient-to-br from-red-500 to-red-600" />
        </div>

        {/* Followup Alerts */}
        {followupLeads.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Bell className="h-5 w-5" />
                Upcoming Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {followupLeads.slice(0, 6).map(lead => (
                  <div 
                    key={lead.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setViewingLead(lead)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.candidate_id}</p>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {lead.followup_date && new Date(lead.followup_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
              <Link to="/employee/leads"><Button variant="ghost" size="sm">View All</Button></Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLeads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No leads yet. Start by adding your first lead!</p>
                ) : recentLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setViewingLead(lead)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.candidate_id}</p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-lg font-semibold">Your Lead Status</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusDistribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No leads to show distribution</p>
                ) : statusDistribution.map(status => (
                  <div key={status.value} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{status.label}</span>
                        <span className="text-sm text-muted-foreground">{status.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600" style={{ width: `${totalLeads > 0 ? (status.count / totalLeads) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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

export default EmployeeDashboard;