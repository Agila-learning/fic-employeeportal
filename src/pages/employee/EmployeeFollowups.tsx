import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { INTERESTED_DOMAIN_OPTIONS, Lead } from '@/types';
import { format, isToday, isTomorrow, isPast, isThisWeek, addDays } from 'date-fns';
import { CalendarClock, AlertTriangle, Clock, Phone, Mail, User, Filter, Search, RefreshCw } from 'lucide-react';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { toast } from 'sonner';

const MAX_FOLLOWUP_COUNT = 6;

const EmployeeFollowups = () => {
  const { user } = useAuth();
  const { leads, isLoading, refetchLeads, updateLead } = useLeads();
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter leads for current employee that have follow_up status
  const followupLeads = useMemo(() => {
    return leads.filter(lead => {
      // Only show leads assigned to current employee
      if (lead.assigned_to !== user?.id) return false;
      
      // Only show leads with follow_up status
      if (lead.status !== 'follow_up') return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!lead.name.toLowerCase().includes(query) &&
            !lead.email.toLowerCase().includes(query) &&
            !lead.candidate_id.toLowerCase().includes(query) &&
            !lead.phone.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Domain filter
      if (domainFilter !== 'all' && lead.interested_domain !== domainFilter) {
        return false;
      }
      
      // Time filter
      if (timeFilter !== 'all' && lead.followup_date) {
        const followupDate = new Date(lead.followup_date);
        switch (timeFilter) {
          case 'overdue':
            if (!isPast(followupDate)) return false;
            break;
          case 'today':
            if (!isToday(followupDate)) return false;
            break;
          case 'tomorrow':
            if (!isTomorrow(followupDate)) return false;
            break;
          case 'this_week':
            if (!isThisWeek(followupDate)) return false;
            break;
        }
      }
      
      return true;
    });
  }, [leads, user?.id, searchQuery, domainFilter, timeFilter]);

  // Sort by followup date (overdue first, then by date)
  const sortedLeads = useMemo(() => {
    return [...followupLeads].sort((a, b) => {
      const dateA = a.followup_date ? new Date(a.followup_date).getTime() : Infinity;
      const dateB = b.followup_date ? new Date(b.followup_date).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [followupLeads]);

  const getFollowupStatus = (followupDate: string | null) => {
    if (!followupDate) return { status: 'none', color: 'bg-gray-100 text-gray-700' };
    const date = new Date(followupDate);
    
    if (isPast(date) && !isToday(date)) {
      return { status: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (isToday(date)) {
      return { status: 'Today', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (isTomorrow(date)) {
      return { status: 'Tomorrow', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    return { status: 'Upcoming', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogOpen(true);
  };

  const handleMarkRejected = async (lead: Lead) => {
    if ((lead.followup_count || 0) >= MAX_FOLLOWUP_COUNT) {
      const success = await updateLead(lead.id, { status: 'rejected' }, lead.status);
      if (success) {
        toast.success('Lead marked as rejected due to max follow-up attempts');
        refetchLeads();
      }
    }
  };

  const overdueCount = sortedLeads.filter(l => l.followup_date && isPast(new Date(l.followup_date)) && !isToday(new Date(l.followup_date))).length;
  const todayCount = sortedLeads.filter(l => l.followup_date && isToday(new Date(l.followup_date))).length;
  const maxedOutCount = sortedLeads.filter(l => (l.followup_count || 0) >= MAX_FOLLOWUP_COUNT).length;

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-amber-500" />
              Follow-up Candidates
            </h1>
            <p className="text-muted-foreground">Manage your scheduled follow-ups</p>
          </div>
          <Button onClick={() => refetchLeads()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{sortedLeads.length}</div>
              <p className="text-xs text-amber-600 dark:text-amber-500">Total Follow-ups</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{overdueCount}</div>
              <p className="text-xs text-red-600 dark:text-red-500">Overdue</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{todayCount}</div>
              <p className="text-xs text-blue-600 dark:text-blue-500">Due Today</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{maxedOutCount}</div>
              <p className="text-xs text-orange-600 dark:text-orange-500">Max Attempts (6)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {INTERESTED_DOMAIN_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Followup List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : sortedLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No follow-ups scheduled</p>
                <p className="text-sm">Leads with follow-up status will appear here</p>
              </CardContent>
            </Card>
          ) : (
            sortedLeads.map((lead) => {
              const { status: followupStatus, color } = getFollowupStatus(lead.followup_date);
              const isMaxedOut = (lead.followup_count || 0) >= MAX_FOLLOWUP_COUNT;
              const remainingAttempts = MAX_FOLLOWUP_COUNT - (lead.followup_count || 0);
              
              return (
                <Card 
                  key={lead.id} 
                  className={`cursor-pointer hover:shadow-md transition-all ${isMaxedOut ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                  onClick={() => handleOpenLead(lead)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{lead.name}</h3>
                          <Badge variant="outline" className="text-xs">{lead.candidate_id}</Badge>
                          <Badge className={color}>{followupStatus}</Badge>
                          {lead.interested_domain && (
                            <Badge variant="secondary" className="text-xs">
                              {INTERESTED_DOMAIN_OPTIONS.find(d => d.value === lead.interested_domain)?.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.phone}
                          </span>
                        </div>
                        {lead.followup_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                              {format(new Date(lead.followup_date), 'MMM d, yyyy')} at {format(new Date(lead.followup_date), 'h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-sm font-medium ${isMaxedOut ? 'text-red-600' : remainingAttempts <= 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                          {isMaxedOut ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              Max attempts reached
                            </span>
                          ) : (
                            `${remainingAttempts} attempts left`
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: MAX_FOLLOWUP_COUNT }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${i < (lead.followup_count || 0) ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            />
                          ))}
                        </div>
                        {isMaxedOut && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRejected(lead);
                            }}
                          >
                            Mark as Rejected
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Lead Dialog */}
      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead || undefined}
        mode="edit"
        onSave={refetchLeads}
      />
    </DashboardLayout>
  );
};

export default EmployeeFollowups;
