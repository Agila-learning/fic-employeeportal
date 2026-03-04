import { useState, useMemo, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useLeads';
import { useEmployees } from '@/hooks/useEmployees';
import { INTERESTED_DOMAIN_OPTIONS, Lead } from '@/types';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { CalendarClock, AlertTriangle, Clock, Phone, Search, RefreshCw, Users } from 'lucide-react';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import { employeeService } from '@/api/employeeService';
import { toast } from 'sonner';

const MAX_FOLLOWUP_COUNT = 6;

const AdminFollowups = () => {
  const { leads, isLoading, refetchLeads } = useLeads();
  const { employees } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch employee names
  useEffect(() => {
    const fetchEmployeeNames = async () => {
      try {
        const data = await employeeService.getEmployees();
        const names: Record<string, string> = {};
        data.forEach((p: any) => { names[p.id || p._id || p.user_id] = p.name; });
        setEmployeeNames(names);
      } catch (error) {
        console.error('Error fetching employee names:', error);
      }
    };
    fetchEmployeeNames();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchLeads();
    setIsRefreshing(false);
    toast.success('Follow-ups refreshed');
  }, [refetchLeads]);

  const followupLeads = useMemo(() => {
    return leads.filter(lead => {
      if (lead.status !== 'follow_up') return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!lead.name.toLowerCase().includes(query) &&
          !lead.email.toLowerCase().includes(query) &&
          !lead.candidate_id.toLowerCase().includes(query) &&
          !lead.phone.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (domainFilter !== 'all' && lead.interested_domain !== domainFilter) return false;
      if (employeeFilter !== 'all' && lead.assigned_to !== employeeFilter) return false;
      if (dateFilter !== 'all' && lead.followup_date) {
        const followupDate = new Date(lead.followup_date);
        switch (dateFilter) {
          case 'overdue':
            if (!isPast(followupDate) || isToday(followupDate)) return false;
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
  }, [leads, searchQuery, domainFilter, employeeFilter, dateFilter]);

  const sortedLeads = useMemo(() => {
    return [...followupLeads].sort((a, b) => {
      const dateA = a.followup_date ? new Date(a.followup_date).getTime() : Infinity;
      const dateB = b.followup_date ? new Date(b.followup_date).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [followupLeads]);

  const groupedByEmployee = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    sortedLeads.forEach(lead => {
      const key = lead.assigned_to || 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(lead);
    });
    return groups;
  }, [sortedLeads]);

  const getFollowupStatus = (followupDate: string | null) => {
    if (!followupDate) return { status: 'none', color: 'bg-gray-100 text-gray-700' };
    const date = new Date(followupDate);
    if (isPast(date) && !isToday(date)) return { status: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' };
    if (isToday(date)) return { status: 'Today', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (isTomorrow(date)) return { status: 'Tomorrow', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    return { status: 'Upcoming', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogOpen(true);
  };

  const overdueCount = sortedLeads.filter(l => l.followup_date && isPast(new Date(l.followup_date)) && !isToday(new Date(l.followup_date))).length;
  const todayCount = sortedLeads.filter(l => l.followup_date && isToday(new Date(l.followup_date))).length;
  const maxedOutCount = sortedLeads.filter(l => (l.followup_count || 0) >= MAX_FOLLOWUP_COUNT).length;

  const allEmployees = useMemo(() => {
    return employees.filter(e => e.role === 'employee');
  }, [employees]);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-amber-500" />
              All Follow-ups
            </h1>
            <p className="text-muted-foreground">Monitor all employee follow-up activities</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
              <p className="text-xs text-orange-600 dark:text-orange-500">Max Attempts</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{Object.keys(groupedByEmployee).length}</div>
              <p className="text-xs text-purple-600 dark:text-purple-500">Employees Active</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {allEmployees.map(emp => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {INTERESTED_DOMAIN_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger><SelectValue placeholder="Date" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : sortedLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No follow-ups found</p>
                <p className="text-sm">Adjust your filters or check back later</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByEmployee).map(([employeeId, employeeLeads]) => (
              <Card key={employeeId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {employeeNames[employeeId] || 'Unknown Employee'}
                    <Badge variant="secondary" className="ml-2">{employeeLeads.length} follow-ups</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-border">
                    {employeeLeads.map((lead) => {
                      const { status: followupStatus, color } = getFollowupStatus(lead.followup_date);
                      const isMaxedOut = (lead.followup_count || 0) >= MAX_FOLLOWUP_COUNT;
                      const remainingAttempts = MAX_FOLLOWUP_COUNT - (lead.followup_count || 0);
                      return (
                        <div key={lead.id} className={`py-4 cursor-pointer hover:bg-muted/50 transition-colors px-2 -mx-2 rounded ${isMaxedOut ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`} onClick={() => handleOpenLead(lead)}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{lead.name}</span>
                                <Badge variant="outline" className="text-xs">{lead.candidate_id}</Badge>
                                <Badge className={color}>{followupStatus}</Badge>
                                {lead.interested_domain && (
                                  <Badge variant="secondary" className="text-xs">
                                    {INTERESTED_DOMAIN_OPTIONS.find(d => d.value === lead.interested_domain)?.label}
                                  </Badge>
                                )}
                                {isMaxedOut && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Max Attempts
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                                {lead.followup_date && (
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(lead.followup_date), 'MMM d, h:mm a')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: MAX_FOLLOWUP_COUNT }).map((_, i) => (
                                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (lead.followup_count || 0) ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                ))}
                              </div>
                              <span className={`text-xs ${isMaxedOut ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                {remainingAttempts}/{MAX_FOLLOWUP_COUNT}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      {dialogOpen && <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} lead={selectedLead || undefined} mode="view" onSave={handleRefresh} />}
    </DashboardLayout>
  );
};

export default AdminFollowups;
