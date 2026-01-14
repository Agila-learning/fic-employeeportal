import { useState, useEffect } from 'react';
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
import { CalendarIcon, Download, RefreshCw, FileSpreadsheet, Users, Building2, User, Phone, MapPin, Briefcase, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type Department = 'BDA' | 'HR' | 'Tech' | 'Ops' | 'Marketing' | 'Finance' | 'Other';

interface EmployeeReport {
  id: string;
  user_id: string;
  report_date: string;
  department: Department;
  morning_description: string | null;
  afternoon_description: string | null;
  candidate_name: string | null;
  agent_name: string | null;
  mobile_number: string | null;
  location: string | null;
  domain: string | null;
  comments: string | null;
  candidates_screened: number | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
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
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const fetchProfiles = async () => {
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
  };

  const fetchReports = async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('employee_reports')
        .select('*')
        .eq('report_date', dateStr)
        .order('created_at', { ascending: false });

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
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchReports();
    }
  }, [user, selectedDate, selectedDepartment, selectedEmployee, profiles]);

  // Group reports by department
  const reportsByDepartment = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = reports.filter(r => r.department === dept);
    return acc;
  }, {} as Record<Department, EmployeeReport[]>);

  // Calculate total candidates screened for HR
  const totalCandidatesScreened = reports
    .filter(r => r.department === 'HR' && r.candidates_screened)
    .reduce((sum, r) => sum + (r.candidates_screened || 0), 0);

  const exportToExcel = () => {
    if (reports.length === 0) {
      toast.error('No reports to export');
      return;
    }

    const exportData = reports.map(report => ({
      'Date': format(new Date(report.report_date), 'dd/MM/yyyy'),
      'Employee Name': report.employee_name,
      'Department': report.department,
      'Morning Report': report.morning_description || '-',
      'Afternoon Report': report.afternoon_description || '-',
      'Candidate Name': report.candidate_name || '-',
      'Agent Name': report.agent_name || '-',
      'Mobile Number': report.mobile_number || '-',
      'Location': report.location || '-',
      'Domain': report.domain || '-',
      'Candidates Screened': report.candidates_screened ?? '-',
      'Comments': report.comments || '-',
      'Submitted At': format(new Date(report.created_at), 'dd/MM/yyyy HH:mm'),
      'Last Updated': format(new Date(report.updated_at), 'dd/MM/yyyy HH:mm'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');

    // Auto-size columns
    const colWidths = [
      { wch: 12 },
      { wch: 25 },
      { wch: 12 },
      { wch: 50 },
      { wch: 50 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
    ];
    ws['!cols'] = colWidths;

    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    XLSX.writeFile(wb, `Daily_Reports_${format(selectedDate, 'yyyy-MM-dd')}_exported_${timestamp}.xlsx`);
    toast.success('Report exported successfully');
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
                  <p className="text-xs text-muted-foreground">Reports Today</p>
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
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
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
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
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
            <CardTitle>Reports for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reports found for this date
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Morning Report</TableHead>
                      <TableHead>Afternoon Report</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const isBDAorHR = report.department === 'BDA' || report.department === 'HR';
                      
                      return (
                        <TableRow key={report.id}>
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
                            {isBDAorHR ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedReport(report)}
                                  >
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Briefcase className="h-5 w-5 text-primary" />
                                      {report.department} Report Details
                                    </DialogTitle>
                                  </DialogHeader>
                                  <ScrollArea className="max-h-[60vh]">
                                    <div className="space-y-4 p-1">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="h-3 w-3" /> Employee
                                          </p>
                                          <p className="font-medium">{report.employee_name}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" /> Date
                                          </p>
                                          <p className="font-medium">{format(new Date(report.report_date), 'dd MMM yyyy')}</p>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4">
                                        <h4 className="font-medium mb-3 text-sm text-muted-foreground">Candidate / Agent Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <User className="h-3 w-3" /> Candidate Name
                                            </p>
                                            <p className="font-medium">{report.candidate_name || '-'}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <User className="h-3 w-3" /> Agent Name
                                            </p>
                                            <p className="font-medium">{report.agent_name || '-'}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Phone className="h-3 w-3" /> Mobile
                                            </p>
                                            <p className="font-medium">{report.mobile_number || '-'}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <MapPin className="h-3 w-3" /> Location
                                            </p>
                                            <p className="font-medium">{report.location || '-'}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Briefcase className="h-3 w-3" /> Domain
                                            </p>
                                            <p className="font-medium">{report.domain || '-'}</p>
                                          </div>
                                          {report.department === 'HR' && (
                                            <div className="space-y-1">
                                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="h-3 w-3" /> Candidates Screened
                                              </p>
                                              <p className="font-medium text-primary">{report.candidates_screened ?? '-'}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {report.comments && (
                                        <div className="border-t pt-4">
                                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                            <MessageSquare className="h-3 w-3" /> Comments
                                          </p>
                                          <p className="text-sm bg-muted p-3 rounded-lg">{report.comments}</p>
                                        </div>
                                      )}

                                      <div className="border-t pt-4">
                                        <h4 className="font-medium mb-3 text-sm text-muted-foreground">Work Reports</h4>
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Morning</p>
                                            <p className="text-sm bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                                              {report.morning_description || '-'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Afternoon</p>
                                            <p className="text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                                              {report.afternoon_description || '-'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="border-t pt-4 text-xs text-muted-foreground">
                                        Submitted: {format(new Date(report.created_at), 'dd MMM yyyy, HH:mm')}
                                        {report.updated_at !== report.created_at && (
                                          <span className="ml-2">
                                            | Updated: {format(new Date(report.updated_at), 'dd MMM yyyy, HH:mm')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(report.created_at), 'HH:mm')}
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
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
