import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, RefreshCw, FileSpreadsheet, Users, Building2, User, Phone, MapPin, Briefcase, MessageSquare, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type Department = 'BDA' | 'HR' | 'Tech' | 'Ops' | 'Marketing' | 'Finance' | 'Other';

interface EmployeeReport {
  id: string;
  user_id: string;
  report_date: string;
  department: Department;
  morning_description: string | null;
  afternoon_description: string | null;
  candidates_screened: number | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
}

interface CandidateEntry {
  id: string;
  candidate_name: string;
  mobile_number: string;
  domain: string;
  agent_name: string | null;
  location: string | null;
  comments: string | null;
}

interface Profile {
  user_id: string;
  name: string;
}

const DEPARTMENTS: Department[] = ['BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other'];

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EmployeeReport | null>(null);
  const [viewCandidates, setViewCandidates] = useState<CandidateEntry[]>([]);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching profiles:', error);
      }
    }
  }, []);

  const fetchReports = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('employee_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply date filter if selected
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('report_date', dateStr);
      }

      if (selectedDepartment !== 'all') {
        query = query.eq('department', selectedDepartment as Department);
      }

      if (selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Enrich with employee names
      const enrichedReports = (data || []).map(report => ({
        ...report,
        employee_name: profiles.find(p => p.user_id === report.user_id)?.name || 'Unknown',
      })) as EmployeeReport[];

      setReports(enrichedReports);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching reports:', error);
      }
      toast.error('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate, selectedDepartment, selectedEmployee, profiles]);

  const fetchCandidateEntries = async (reportId: string, reportDate: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bda_candidate_entries')
        .select('*')
        .eq('report_date', reportDate)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as CandidateEntry[];
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching candidate entries:', error);
      }
      return [];
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchReports();
    }
  }, [fetchReports, profiles]);

  const handleViewReport = async (report: EmployeeReport) => {
    setSelectedReport(report);
    if (report.department === 'BDA' || report.department === 'HR') {
      const entries = await fetchCandidateEntries(report.id, report.report_date, report.user_id);
      setViewCandidates(entries);
    } else {
      setViewCandidates([]);
    }
  };

  // Group reports by department
  const reportsByDepartment = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = reports.filter(r => r.department === dept);
    return acc;
  }, {} as Record<Department, EmployeeReport[]>);

  // Calculate total candidates screened for HR
  const totalCandidatesScreened = reports
    .filter(r => r.department === 'HR' && r.candidates_screened)
    .reduce((sum, r) => sum + (r.candidates_screened || 0), 0);

  const exportToExcel = async () => {
    if (reports.length === 0) {
      toast.error('No reports to export');
      return;
    }

    // Fetch all candidate entries for BDA/HR reports
    const bdaHrReports = reports.filter(r => r.department === 'BDA' || r.department === 'HR');
    const allCandidateEntries: { report: EmployeeReport; entries: CandidateEntry[] }[] = [];

    for (const report of bdaHrReports) {
      const entries = await fetchCandidateEntries(report.id, report.report_date, report.user_id);
      allCandidateEntries.push({ report, entries });
    }

    // Main reports sheet
    const mainExportData = reports.map(report => ({
      'Date': format(new Date(report.report_date), 'dd/MM/yyyy'),
      'Employee Name': report.employee_name,
      'Department': report.department,
      'Morning Report': report.morning_description || '-',
      'Afternoon Report': report.afternoon_description || '-',
      'Candidates Screened (HR)': report.candidates_screened ?? '-',
      'Submitted At': format(new Date(report.created_at), 'dd/MM/yyyy HH:mm'),
      'Last Updated': format(new Date(report.updated_at), 'dd/MM/yyyy HH:mm'),
    }));

    // Candidate entries sheet (for BDA/HR)
    const candidateExportData: any[] = [];
    for (const { report, entries } of allCandidateEntries) {
      for (const entry of entries) {
        candidateExportData.push({
          'Date': format(new Date(report.report_date), 'dd/MM/yyyy'),
          'Employee Name': report.employee_name,
          'Department': report.department,
          'Candidate Name': entry.candidate_name,
          'Mobile Number': entry.mobile_number,
          'Domain': entry.domain,
          'Agent Name': entry.agent_name || '-',
          'Location': entry.location || '-',
          'Comments': entry.comments || '-',
        });
      }
    }

    const wb = XLSX.utils.book_new();
    
    // Main reports sheet
    const ws1 = XLSX.utils.json_to_sheet(mainExportData);
    ws1['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 50 }, { wch: 50 },
      { wch: 20 }, { wch: 18 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Reports');

    // Candidate entries sheet
    if (candidateExportData.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(candidateExportData);
      ws2['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 40 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'BDA-HR Candidates');
    }

    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const dateLabel = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'all-dates';
    XLSX.writeFile(wb, `Daily_Reports_${dateLabel}_exported_${timestamp}.xlsx`);
    toast.success('Report exported successfully');
  };

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedDepartment('all');
    setSelectedEmployee('all');
  };

  const totalReports = reports.length;
  const departmentsWithReports = DEPARTMENTS.filter(d => reportsByDepartment[d].length > 0).length;
  const bdaHrReports = reports.filter(r => r.department === 'BDA' || r.department === 'HR').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Department Reports</h1>
            <p className="text-muted-foreground">Daily employee work reports by department</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={exportToExcel} disabled={reports.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalReports}</p>
                  <p className="text-xs text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Building2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departmentsWithReports}</p>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bdaHrReports}</p>
                  <p className="text-xs text-muted-foreground">BDA/HR Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <User className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCandidatesScreened}</p>
                  <p className="text-xs text-muted-foreground">Screened (HR)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : 'All Dates'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Reports {selectedDate ? `for ${format(selectedDate, 'MMMM d, yyyy')}` : '(All Dates)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reports found for the selected filters
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Morning Report</TableHead>
                      <TableHead>Afternoon Report</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const isBDAorHR = report.department === 'BDA' || report.department === 'HR';
                      
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(report.report_date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">{report.employee_name}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                isBDAorHR && "bg-primary/10 text-primary border-primary/20"
                              )}
                            >
                              {report.department}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="text-sm truncate">
                              {report.morning_description || <span className="text-muted-foreground">-</span>}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="text-sm truncate">
                              {report.afternoon_description || <span className="text-muted-foreground">-</span>}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Report Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Report Details
              </DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Employee
                      </p>
                      <p className="font-medium">{selectedReport.employee_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Date
                      </p>
                      <p className="font-medium">{format(new Date(selectedReport.report_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Department</p>
                      <Badge>{selectedReport.department}</Badge>
                    </div>
                    {selectedReport.department === 'HR' && selectedReport.candidates_screened && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Candidates Screened</p>
                        <Badge variant="secondary">{selectedReport.candidates_screened}</Badge>
                      </div>
                    )}
                  </div>

                  {/* Candidate Entries for BDA/HR */}
                  {(selectedReport.department === 'BDA' || selectedReport.department === 'HR') && viewCandidates.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                        Candidate Entries ({viewCandidates.length})
                      </h4>
                      <div className="space-y-2">
                        {viewCandidates.map((entry, index) => (
                          <Card key={entry.id || index} className="p-3 bg-muted/50">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" /> Candidate
                                </span>
                                <span className="font-medium">{entry.candidate_name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> Mobile
                                </span>
                                <span className="font-medium">{entry.mobile_number}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" /> Domain
                                </span>
                                <Badge variant="outline">{entry.domain}</Badge>
                              </div>
                              {entry.agent_name && (
                                <div>
                                  <span className="text-muted-foreground">Agent</span>
                                  <p>{entry.agent_name}</p>
                                </div>
                              )}
                              {entry.location && (
                                <div>
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Location
                                  </span>
                                  <p>{entry.location}</p>
                                </div>
                              )}
                              {entry.comments && (
                                <div className="col-span-full">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> Comments
                                  </span>
                                  <p>{entry.comments}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedReport.department === 'BDA' || selectedReport.department === 'HR') && viewCandidates.length === 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No candidate entries found for this report.
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        Morning Report
                      </h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedReport.morning_description || 'No morning report submitted.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <Moon className="h-4 w-4 text-blue-500" />
                        Afternoon Report
                      </h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                        {selectedReport.afternoon_description || 'No afternoon report submitted.'}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
