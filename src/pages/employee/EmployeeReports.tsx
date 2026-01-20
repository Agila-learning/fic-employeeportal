import { useState, useEffect, useCallback } from 'react';
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
import { CalendarIcon, FileText, Sun, Moon, Save, RefreshCw, Lock, User, Phone, MapPin, Briefcase, MessageSquare, Users, Plus, Trash2, Eye } from 'lucide-react';
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
}

interface CandidateEntry {
  id?: string;
  candidate_name: string;
  mobile_number: string;
  domain: string;
  agent_name: string;
  location: string;
  comments: string;
}

const DEPARTMENTS: Department[] = ['BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other'];
const DOMAINS = ['IT', 'Non-IT', 'Banking', 'Finance', 'Healthcare', 'Education', 'Other'];

const emptyCandidateEntry: CandidateEntry = {
  candidate_name: '',
  mobile_number: '',
  domain: '',
  agent_name: '',
  location: '',
  comments: '',
};

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
  
  // BDA/HR candidate entries (multiple)
  const [candidateEntries, setCandidateEntries] = useState<CandidateEntry[]>([{ ...emptyCandidateEntry }]);
  const [candidatesScreened, setCandidatesScreened] = useState<number | ''>('');
  
  // View dialog for history
  const [viewReport, setViewReport] = useState<EmployeeReport | null>(null);
  const [viewCandidates, setViewCandidates] = useState<CandidateEntry[]>([]);

  const isBDAorHR = department === 'BDA' || department === 'HR';
  const isReportLocked = !isToday(selectedDate);

  const fetchReports = useCallback(async () => {
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
  }, [user]);

  const fetchCandidateEntries = async (reportDate: string) => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('bda_candidate_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('report_date', reportDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(entry => ({
        id: entry.id,
        candidate_name: entry.candidate_name,
        mobile_number: entry.mobile_number,
        domain: entry.domain,
        agent_name: entry.agent_name || '',
        location: entry.location || '',
        comments: entry.comments || '',
      }));
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error fetching candidate entries:', error);
      }
      return [];
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Load existing report and candidate entries when date changes
  useEffect(() => {
    const loadReportData = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingReport = reports.find(r => r.report_date === dateStr);
      
      if (existingReport) {
        setExistingReportId(existingReport.id);
        setDepartment(existingReport.department);
        setMorningDescription(existingReport.morning_description || '');
        setAfternoonDescription(existingReport.afternoon_description || '');
        setCandidatesScreened(existingReport.candidates_screened ?? '');
        
        // Load candidate entries for BDA/HR
        if (existingReport.department === 'BDA' || existingReport.department === 'HR') {
          const entries = await fetchCandidateEntries(dateStr);
          setCandidateEntries(entries.length > 0 ? entries : [{ ...emptyCandidateEntry }]);
        }
      } else {
        setExistingReportId(null);
        setMorningDescription('');
        setAfternoonDescription('');
        setCandidatesScreened('');
        setCandidateEntries([{ ...emptyCandidateEntry }]);
      }
    };

    loadReportData();
  }, [selectedDate, reports]);

  const addCandidateEntry = () => {
    setCandidateEntries([...candidateEntries, { ...emptyCandidateEntry }]);
  };

  const removeCandidateEntry = (index: number) => {
    if (candidateEntries.length > 1) {
      setCandidateEntries(candidateEntries.filter((_, i) => i !== index));
    }
  };

  const updateCandidateEntry = (index: number, field: keyof CandidateEntry, value: string) => {
    const updated = [...candidateEntries];
    updated[index] = { ...updated[index], [field]: value };
    setCandidateEntries(updated);
  };

  const validateCandidateEntries = (): boolean => {
    for (let i = 0; i < candidateEntries.length; i++) {
      const entry = candidateEntries[i];
      if (!entry.candidate_name.trim()) {
        toast.error(`Candidate Name is required for entry ${i + 1}`);
        return false;
      }
      if (!entry.mobile_number.trim()) {
        toast.error(`Mobile Number is required for entry ${i + 1}`);
        return false;
      }
      if (!entry.domain) {
        toast.error(`Domain is required for entry ${i + 1}`);
        return false;
      }
    }
    return true;
  };

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

    if (isBDAorHR && !validateCandidateEntries()) {
      return;
    }

    setIsSaving(true);
    try {
      const reportDate = format(selectedDate, 'yyyy-MM-dd');
      const reportData: any = {
        user_id: user.id,
        report_date: reportDate,
        department,
        morning_description: morningDescription.trim() || null,
        afternoon_description: afternoonDescription.trim() || null,
        candidates_screened: department === 'HR' && candidatesScreened !== '' ? Number(candidatesScreened) : null,
      };

      let reportId = existingReportId;

      if (existingReportId) {
        const { error } = await supabase
          .from('employee_reports')
          .update(reportData)
          .eq('id', existingReportId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('employee_reports')
          .insert(reportData)
          .select('id')
          .single();

        if (error) throw error;
        reportId = data.id;
      }

      // Handle BDA/HR candidate entries
      if (isBDAorHR && reportId) {
        // Delete existing entries for this date
        await supabase
          .from('bda_candidate_entries')
          .delete()
          .eq('user_id', user.id)
          .eq('report_date', reportDate);

        // Insert new entries
        const entryData = candidateEntries.map(entry => ({
          report_id: reportId,
          user_id: user.id,
          report_date: reportDate,
          candidate_name: entry.candidate_name.trim(),
          mobile_number: entry.mobile_number.trim(),
          domain: entry.domain,
          agent_name: entry.agent_name.trim() || null,
          location: entry.location.trim() || null,
          comments: entry.comments.trim() || null,
        }));

        const { error: entryError } = await supabase
          .from('bda_candidate_entries')
          .insert(entryData);

        if (entryError) throw entryError;
      }

      toast.success(existingReportId ? 'Report updated successfully' : 'Report submitted successfully');
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

  const handleViewReport = async (report: EmployeeReport) => {
    setViewReport(report);
    if (report.department === 'BDA' || report.department === 'HR') {
      const entries = await fetchCandidateEntries(report.report_date);
      setViewCandidates(entries);
    } else {
      setViewCandidates([]);
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

            {/* BDA/HR Candidate Entries */}
            {isBDAorHR && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>{department === 'BDA' ? 'Candidate Details' : 'HR Screening Details'}</span>
                      <Badge variant="secondary">{candidateEntries.length} entries</Badge>
                    </CardTitle>
                    {!isReportLocked && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addCandidateEntry}
                        className="flex items-center gap-1 w-full sm:w-auto justify-center"
                      >
                        <Plus className="h-4 w-4" />
                        Add Candidate
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidateEntries.map((entry, index) => (
                    <Card key={index} className="p-4 border-dashed relative">
                      {candidateEntries.length > 1 && !isReportLocked && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeCandidateEntry(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Candidate Name - Required */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            Candidate Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={entry.candidate_name}
                            onChange={(e) => updateCandidateEntry(index, 'candidate_name', e.target.value)}
                            placeholder="Enter candidate name"
                            disabled={isReportLocked}
                          />
                        </div>

                        {/* Mobile Number - Required */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            Mobile Number <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={entry.mobile_number}
                            onChange={(e) => updateCandidateEntry(index, 'mobile_number', e.target.value)}
                            placeholder="Enter mobile number"
                            disabled={isReportLocked}
                          />
                        </div>

                        {/* Domain - Required */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Briefcase className="h-3 w-3" />
                            Domain <span className="text-destructive">*</span>
                          </Label>
                          <Select 
                            value={entry.domain} 
                            onValueChange={(v) => updateCandidateEntry(index, 'domain', v)}
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

                        {/* Agent Name - Optional */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            Agent Name
                          </Label>
                          <Input
                            value={entry.agent_name}
                            onChange={(e) => updateCandidateEntry(index, 'agent_name', e.target.value)}
                            placeholder="Enter agent name"
                            disabled={isReportLocked}
                          />
                        </div>

                        {/* Location - Optional */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            Location
                          </Label>
                          <Input
                            value={entry.location}
                            onChange={(e) => updateCandidateEntry(index, 'location', e.target.value)}
                            placeholder="Enter location"
                            disabled={isReportLocked}
                          />
                        </div>

                        {/* Comments - Optional */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            Comments
                          </Label>
                          <Input
                            value={entry.comments}
                            onChange={(e) => updateCandidateEntry(index, 'comments', e.target.value)}
                            placeholder="Add comments"
                            disabled={isReportLocked}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Candidates Screened (HR only) */}
                  {department === 'HR' && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        Total Candidates Screened
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={candidatesScreened}
                        onChange={(e) => setCandidatesScreened(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Number of candidates screened"
                        disabled={isReportLocked}
                        className="max-w-xs"
                      />
                    </div>
                  )}
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
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow 
                        key={report.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          const reportDate = new Date(report.report_date);
                          if (isToday(reportDate)) {
                            setSelectedDate(reportDate);
                          } else {
                            handleViewReport(report);
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(report.report_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            (report.department === 'BDA' || report.department === 'HR') && "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {report.department}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <p className="text-sm truncate">
                            {report.morning_description || <span className="text-muted-foreground">-</span>}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <p className="text-sm truncate">
                            {report.afternoon_description || <span className="text-muted-foreground">-</span>}
                          </p>
                        </TableCell>
                        <TableCell>
                          {isToday(new Date(report.report_date)) ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Editable
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(report);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Report Dialog */}
        <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Report Details - {viewReport && format(new Date(viewReport.report_date), 'dd MMM yyyy')}
              </DialogTitle>
            </DialogHeader>
            {viewReport && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 p-1">
                  <div className="flex items-center gap-2">
                    <Badge>{viewReport.department}</Badge>
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Read Only
                    </Badge>
                  </div>

                  {/* Candidate Entries for BDA/HR */}
                  {(viewReport.department === 'BDA' || viewReport.department === 'HR') && viewCandidates.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Candidate Entries ({viewCandidates.length})</h4>
                      <div className="space-y-2">
                        {viewCandidates.map((entry, index) => (
                          <Card key={index} className="p-3 bg-muted/50">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Name:</span>{' '}
                                <span className="font-medium">{entry.candidate_name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Mobile:</span>{' '}
                                <span className="font-medium">{entry.mobile_number}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Domain:</span>{' '}
                                <Badge variant="outline" className="ml-1">{entry.domain}</Badge>
                              </div>
                              {entry.agent_name && (
                                <div>
                                  <span className="text-muted-foreground">Agent:</span>{' '}
                                  <span>{entry.agent_name}</span>
                                </div>
                              )}
                              {entry.location && (
                                <div>
                                  <span className="text-muted-foreground">Location:</span>{' '}
                                  <span>{entry.location}</span>
                                </div>
                              )}
                              {entry.comments && (
                                <div className="col-span-full">
                                  <span className="text-muted-foreground">Comments:</span>{' '}
                                  <span>{entry.comments}</span>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                      {viewReport.department === 'HR' && viewReport.candidates_screened && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground">Total Screened:</span>{' '}
                          <Badge>{viewReport.candidates_screened}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        Morning Report
                      </h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                        {viewReport.morning_description || 'No morning report submitted.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <Moon className="h-4 w-4 text-blue-500" />
                        Afternoon Report
                      </h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                        {viewReport.afternoon_description || 'No afternoon report submitted.'}
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

export default EmployeeReports;
