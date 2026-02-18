import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import FollowupNotifications from '@/components/leads/FollowupNotifications';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import AttendanceCard from '@/components/dashboard/AttendanceCard';
import AnnouncementsCard from '@/components/dashboard/AnnouncementsCard';
import TasksCard from '@/components/dashboard/TasksCard';
import AnnouncementNotification from '@/components/dashboard/AnnouncementNotification';
import TaskRemindersNotification from '@/components/dashboard/TaskRemindersNotification';
import LeaveRequestForm from '@/components/leave/LeaveRequestForm';
import LeaveRequestsList from '@/components/leave/LeaveRequestsList';

import { FileSpreadsheet, CheckCircle, Clock, XCircle, Plus, Bell, ArrowRight, TrendingUp, Sparkles, Trophy, CreditCard, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import LeadStatusBadge from '@/components/leads/LeadStatusBadge';
import { STATUS_OPTIONS, Lead, INTERESTED_DOMAIN_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import { getRandomQuote } from '@/utils/motivationalQuotes';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { leads, getLeadsByEmployee, refetchLeads } = useLeads();
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [greeting, setGreeting] = useState('');
  const [quote, setQuote] = useState('');

  const myLeads = user ? getLeadsByEmployee(user.id) : [];
  const totalLeads = myLeads.length;
  const convertedLeads = myLeads.filter(l => l.status === 'converted').length;
  const successLeads = myLeads.filter(l => l.status === 'success').length;
  const pendingLeads = myLeads.filter(l => ['nc1', 'nc2', 'nc3', 'follow_up'].includes(l.status)).length;
  const rejectedLeads = myLeads.filter(l => ['rejected', 'not_interested', 'not_interested_paid'].includes(l.status)).length;
  
  // Payment stage counts
  const registrationDone = myLeads.filter(l => l.payment_stage === 'registration_done').length;
  const initialPaymentDone = myLeads.filter(l => l.payment_stage === 'initial_payment_done').length;
  const fullPaymentDone = myLeads.filter(l => l.payment_stage === 'full_payment_done').length;
  
  // Domain-wise payment counts
  const itPaidCount = myLeads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'it').length;
  const nonItPaidCount = myLeads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'non_it').length;
  const bankingPaidCount = myLeads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'banking').length;
  
  const conversionRate = totalLeads > 0 ? Math.round(((convertedLeads + successLeads) / totalLeads) * 100) : 0;

  const recentLeads = [...myLeads].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
  const statusDistribution = STATUS_OPTIONS.map(status => ({ ...status, count: myLeads.filter(l => l.status === status.value).length })).filter(s => s.count > 0);

  // Get followup leads for notifications - exclude success and full_payment_done leads
  // Only show leads with follow_up status that are not success/full_payment_done
  const followupLeads = myLeads.filter(l => 
    l.followup_date && 
    l.status === 'follow_up' && 
    l.payment_stage !== 'full_payment_done'
  );

  // Dynamic greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    
    setQuote(getRandomQuote());
  }, []);

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6 md:space-y-8">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8 text-white animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <p className="text-amber-400 font-medium animate-float-in">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold animate-float-in-delay">{user?.name}</h1>
              <div className="flex items-start gap-2 text-white/70 animate-float-in-delay-2">
                <Sparkles className="h-4 w-4 mt-1 text-amber-400 shrink-0" />
                <p className="text-xs sm:text-sm italic">{quote}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <AnnouncementNotification />
              <TaskRemindersNotification />
              <FollowupNotifications leads={myLeads} onViewLead={(lead) => setViewingLead(lead)} />
              <Link to="/employee/add-lead" className="w-full sm:w-auto">
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 gap-2 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 w-full sm:w-auto text-sm sm:text-base">
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">Add New Lead</span>
                  <span className="xs:hidden">Add Lead</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-5">
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
            iconClassName="bg-gradient-to-br from-amber-500 to-amber-600"
            delay={100}
          />
          <StatsCard 
            title="Success" 
            value={successLeads} 
            icon={Trophy} 
            trend={{ value: conversionRate, isPositive: true }} 
            iconClassName="bg-gradient-to-br from-green-500 to-green-600"
            delay={150}
          />
          <StatsCard 
            title="Pending" 
            value={pendingLeads} 
            icon={Clock} 
            iconClassName="bg-gradient-to-br from-purple-500 to-purple-600"
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

        {/* Attendance, Tasks, and Announcements Row */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <AttendanceCard />
          <TasksCard />
          <AnnouncementsCard />
        </div>

        {/* Leave Request Section */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <LeaveRequestForm />
          <LeaveRequestsList />
        </div>

        {/* Followup Alerts with animation */}
        {followupLeads.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 overflow-hidden animate-scale-in">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 animate-bounce-soft" />
                <span className="truncate">Upcoming Follow-ups</span>
                <span className="ml-auto sm:ml-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold shrink-0">
                  {followupLeads.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {followupLeads.slice(0, 6).map((lead, index) => (
                  <div 
                    key={lead.id} 
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    onClick={() => setViewingLead(lead)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium truncate text-sm sm:text-base">{lead.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{lead.candidate_id}</p>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full shrink-0">
                      {lead.followup_date && new Date(lead.followup_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-xl transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-1">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Recent Leads
              </CardTitle>
              <Link to="/employee/leads">
                <Button variant="ghost" size="sm" className="gap-1 group/btn text-xs sm:text-sm h-7 sm:h-8">
                  View All
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <FileSpreadsheet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm sm:text-base text-muted-foreground">No leads yet. Start by adding your first lead!</p>
                    <Link to="/employee/add-lead" className="mt-4 inline-block">
                      <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm">
                        <Plus className="h-4 w-4" />
                        Add Lead
                      </Button>
                    </Link>
                  </div>
                ) : recentLeads.map((lead, index) => (
                  <div 
                    key={lead.id} 
                    className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-muted/50 transition-all duration-300 cursor-pointer group/lead"
                    onClick={() => setViewingLead(lead)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 group-hover/lead:bg-primary/20 group-hover/lead:scale-110 transition-all duration-300 shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-primary">{lead.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover/lead:text-primary transition-colors text-sm sm:text-base">{lead.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">{lead.candidate_id}</p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Status Distribution */}
          <Card className="border-border/50 overflow-hidden group hover:shadow-xl transition-all duration-500 hover:border-primary/20 animate-slide-up stagger-2">
            <CardHeader className="border-b border-border/50 bg-muted/30 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                Your Lead Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {statusDistribution.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">No leads to show distribution</p>
                ) : statusDistribution.map((status, index) => {
                  const percentage = totalLeads > 0 ? (status.count / totalLeads) * 100 : 0;
                  return (
                    <div key={status.value} className="group/item" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium group-hover/item:text-primary transition-colors truncate">{status.label}</span>
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          <span className="text-xs sm:text-sm text-muted-foreground font-mono">{status.count}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 sm:h-3 rounded-full bg-muted overflow-hidden">
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
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">Your Conversion Rate</span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{conversionRate}%</span>
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