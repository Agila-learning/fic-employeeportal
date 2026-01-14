import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, FileText, Sun, Moon, Save, RefreshCw, Lock, User, Phone, MapPin, Briefcase, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';

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
}

const DEPARTMENTS: Department[] = ['BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other'];
const DOMAINS = ['IT', 'Non-IT', 'Banking', 'Finance', 'Healthcare', 'Education', 'Other'];

const EmployeeReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState<Department>('BDA');
  const [morningDescription, setMorningDescription] = useState('');
  const [afternoonDescription, setAfternoonDescription] = useState('');
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  
  // BDA/HR specific fields
  const [candidateName, setCandidateName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [location, setLocation] = useState('');
  const [domain, setDomain] = useState('');
  const [comments, setComments] = useState('');
  const [candidatesScreened, setCandidatesScreened] = useState<number | ''>('');

  const isBDAorHR = department === 'BDA' || department === 'HR';
  const isReportLocked = !isToday(selectedDate);

  const fetchReports = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false });

      if (error) throw error;
      setReports((data || []) as EmployeeReport[]);
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
    fetchReports();
  }, [user]);

  // Load existing report when date changes
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingReport = reports.find(r => r.report_date === dateStr);
    
    if (existingReport) {
      setExistingReportId(existingReport.id);
      setDepartment(existingReport.department);
      setMorningDescription(existingReport.morning_description || '');
      setAfternoonDescription(existingReport.afternoon_description || '');
      setCandidateName(existingReport.candidate_name || '');
      setAgentName(existingReport.agent_name || '');
      setMobileNumber(existingReport.mobile_number || '');
      setLocation(existingReport.location || '');
      setDomain(existingReport.domain || '');
      setComments(existingReport.comments || '');
      setCandidatesScreened(existingReport.candidates_screened ?? '');
    } else {
      setExistingReportId(null);
      setMorningDescription('');
      setAfternoonDescription('');
      setCandidateName('');
      setAgentName('');
      setMobileNumber('');
      setLocation('');
      setDomain('');
      setComments('');
      setCandidatesScreened('');
    }
  }, [selectedDate, reports]);

  const handleSubmit = async () => {
    if (!user) return;
    
    if (isReportLocked) {
      toast.error('Cannot edit reports from previous days');
      return;
    }
    
    if (!morningDescription.trim() && !afternoonDescription.trim()) {
      toast.error('Please add at least one description');
      return;
    }

    setIsSaving(true);
    try {
      const reportData: any = {
        user_id: user.id,
        report_date: format(selectedDate, 'yyyy-MM-dd'),
        department,
        morning_description: morningDescription.trim() || null,
        afternoon_description: afternoonDescription.trim() || null,
      };

      // Add BDA/HR specific fields
      if (isBDAorHR) {
        reportData.candidate_name = candidateName.trim() || null;
        reportData.agent_name = agentName.trim() || null;
        reportData.mobile_number = mobileNumber.trim() || null;
        reportData.location = location.trim() || null;
        reportData.domain = domain || null;
        reportData.comments = comments.trim() || null;
        
        if (department === 'HR') {
          reportData.candidates_screened = candidatesScreened !== '' ? Number(candidatesScreened) : null;
        }
      }

      if (existingReportId) {
        const { error } = await supabase
          .from('employee_reports')
          .update(reportData)
          .eq('id', existingReportId);

        if (error) throw error;
        toast.success('Report updated successfully');
      } else {
        const { error } = await supabase
          .from('employee_reports')
          .insert(reportData);

        if (error) throw error;
        toast.success('Report submitted successfully');
      }

      await fetchReports();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error saving report:', error);
      }
      toast.error(error.message || 'Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Reports</h1>
            <p className="text-muted-foreground">Submit your morning and afternoon work reports</p>
          </div>
          <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {existingReportId ? 'Edit Report' : 'Submit New Report'}
              </div>
              {isReportLocked && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Locked (Past Date)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Report Date</Label>
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

              {/* Department */}
              <div className="space-y-2">
                <Label>Department</Label>
                <Select 
                  value={department} 
                  onValueChange={(v) => setDepartment(v as Department)}
                  disabled={isReportLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* BDA/HR Specific Fields */}
            {isBDAorHR && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {department === 'BDA' ? 'Sales & Candidate Details' : 'HR & Screening Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Candidate Name */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Candidate Name
                      </Label>
                      <Input
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Enter candidate name"
                        disabled={isReportLocked}
                      />
                    </div>

                    {/* Agent Name */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Agent Name
                      </Label>
                      <Input
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="Enter agent name"
                        disabled={isReportLocked}
                      />
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        Mobile Number
                      </Label>
                      <Input
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Enter mobile number"
                        disabled={isReportLocked}
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Location
                      </Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter location"
                        disabled={isReportLocked}
                      />
                    </div>

                    {/* Domain */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        Domain
                      </Label>
                      <Select 
                        value={domain} 
                        onValueChange={setDomain}
                        disabled={isReportLocked}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOMAINS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Candidates Screened (HR only) */}
                    {department === 'HR' && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Candidates Screened
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={candidatesScreened}
                          onChange={(e) => setCandidatesScreened(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Number of candidates screened"
                          disabled={isReportLocked}
                        />
                      </div>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      Comments / Notes
                    </Label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add any additional comments or notes..."
                      rows={3}
                      disabled={isReportLocked}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Morning Report */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                Morning Report
              </Label>
              <Textarea
                value={morningDescription}
                onChange={(e) => setMorningDescription(e.target.value)}
                placeholder="Describe your morning work activities..."
                rows={4}
                disabled={isReportLocked}
              />
            </div>

            {/* Afternoon Report */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                Afternoon Report
              </Label>
              <Textarea
                value={afternoonDescription}
                onChange={(e) => setAfternoonDescription(e.target.value)}
                placeholder="Describe your afternoon work activities..."
                rows={4}
                disabled={isReportLocked}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isSaving || isReportLocked} 
              className="w-full md:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : existingReportId ? 'Update Report' : 'Submit Report'}
            </Button>
            
            {isReportLocked && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Reports from previous days cannot be edited. Only today's report can be modified.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reports History */}
        <Card>
          <CardHeader>
            <CardTitle>My Report History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No reports submitted yet</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Morning</TableHead>
                      <TableHead>Afternoon</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const reportDate = new Date(report.report_date);
                      const locked = !isToday(reportDate);
                      return (
                        <TableRow 
                          key={report.id} 
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            locked && "opacity-75"
                          )}
                          onClick={() => setSelectedDate(reportDate)}
                        >
                          <TableCell className="font-medium">
                            {format(reportDate, 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.department}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {report.morning_description || '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {report.afternoon_description || '-'}
                          </TableCell>
                          <TableCell>
                            {locked ? (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <Lock className="h-3 w-3" />
                                Locked
                              </Badge>
                            ) : (
                              <Badge variant="default" className="w-fit">Editable</Badge>
                            )}
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

export default EmployeeReports;
