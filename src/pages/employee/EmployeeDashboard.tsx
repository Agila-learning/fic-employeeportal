import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import FollowupNotifications from '@/components/leads/FollowupNotifications';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { FileSpreadsheet, CheckCircle, Clock, XCircle, Plus, Bell, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import LeadStatusBadge from '@/components/leads/LeadStatusBadge';
import { STATUS_OPTIONS, Lead } from '@/types';
import { cn } from '@/lib/utils';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { leads, getLeadsByEmployee, refetchLeads } = useLeads();
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [greeting, setGreeting] = useState('');

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

  // Dynamic greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-8">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-amber-400 font-medium animate-slide-down">{greeting}</p>
              <h1 className="text-3xl font-bold animate-slide-up">{user?.name}</h1>
              <p className="text-white/60 animate-slide-up stagger-1">Here's your lead management overview for today</p>
            </div>
            <div className="flex items-center gap-3">
              <FollowupNotifications leads={myLeads} onViewLead={(lead) => setViewingLead(lead)} />
              <Link to="/employee/add-lead">
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 gap-2 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105">
                  <Plus className="h-4 w-4" />
                  Add New Lead
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Leads" 
            value={totalLeads} 
            icon={FileSpreadsheet} 
            iconClassName="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0}
          />
          <StatsCard 
            title="Converted" 
            value={convertedLeads} 
            icon={CheckCircle} 
            trend={{ value: conversionRate, isPositive: true }} 
            iconClassName="bg-gradient-to-br from-green-500 to-green-600"
            delay={100}
          />
          <StatsCard 
            title="Pending" 
            value={pendingLeads} 
            icon={Clock} 
            iconClassName="bg-gradient-to-br from-amber-500 to-amber-600"
            delay={200}
          />
          <StatsCard 
            title="Closed (No)" 
            value={rejectedLeads} 
            icon={XCircle} 
            iconClassName="bg-gradient-to-br from-red-500 to-red-600"
            delay={300}
          />
        </div>

        {/* Followup Alerts with animation */}
        {followupLeads.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 overflow-hidden animate-scale-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Bell className="h-5 w-5 animate-bounce-soft" />
                Upcoming Follow-ups
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                  {followupLeads.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {followupLeads.slice(0, 6).map((lead, index) => (
                  <div 
                    key={lead.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    onClick={() => setViewingLead(lead)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{lead.candidate_id}</p>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">
                      {lead.followup_date && new Date(lead.followup_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-xl transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-1">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Recent Leads
              </CardTitle>
              <Link to="/employee/leads">
                <Button variant="ghost" size="sm" className="gap-1 group/btn">
                  View All
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No leads yet. Start by adding your first lead!</p>
                    <Link to="/employee/add-lead" className="mt-4 inline-block">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Lead
                      </Button>
                    </Link>
                  </div>
                ) : recentLeads.map((lead, index) => (
                  <div 
                    key={lead.id} 
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-all duration-300 cursor-pointer group/lead"
                    onClick={() => setViewingLead(lead)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover/lead:bg-primary/20 group-hover/lead:scale-110 transition-all duration-300">
                      <span className="text-sm font-bold text-primary">{lead.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover/lead:text-primary transition-colors">{lead.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{lead.candidate_id}</p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Status Distribution */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-xl transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-2">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Your Lead Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {statusDistribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No leads to show distribution</p>
                ) : statusDistribution.map((status, index) => {
                  const percentage = totalLeads > 0 ? (status.count / totalLeads) * 100 : 0;
                  return (
                    <div key={status.value} className="group/item" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium group-hover/item:text-primary transition-colors">{status.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-mono">{status.count}</span>
                          <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            "bg-gradient-to-r from-amber-500 to-amber-600"
                          )}
                          style={{ 
                            width: `${percentage}%`,
                            transitionDelay: `${index * 150}ms`
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conversion Rate Display */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Your Conversion Rate</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{conversionRate}%</span>
                </div>
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