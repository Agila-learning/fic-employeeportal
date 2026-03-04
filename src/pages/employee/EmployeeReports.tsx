import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService } from '@/api/employeeService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { FileText, Send, History, CheckCircle, Clock, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const DEPARTMENTS = ['BDA', 'HR', 'Tech', 'Ops', 'Marketing', 'Finance', 'Other'];

const EmployeeReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [department, setDepartment] = useState('Other');
  const [morningDesc, setMorningDesc] = useState('');
  const [afternoonDesc, setAfternoonDesc] = useState('');
  const [candidatesScreened, setCandidatesScreened] = useState('0');

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await (employeeService as any).getMyReports();
      setReports(data || []);
    } catch (error) {
      toast.error('Failed to fetch report history');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReports();
      // Automatically set department if available in profile
      if ((user as any).department && DEPARTMENTS.includes((user as any).department)) {
        setDepartment((user as any).department);
      }
    }
  }, [user, fetchReports]);

  const handleSubmit = async () => {
    if (!user || !morningDesc || !afternoonDesc) {
      toast.error('Please fill in all required descriptions');
      return;
    }

    setSubmitting(true);
    try {
      await (employeeService as any).createReport({
        report_date: format(reportDate, 'yyyy-MM-dd'),
        department,
        morning_description: morningDesc,
        afternoon_description: afternoonDesc,
        candidates_screened: parseInt(candidatesScreened)
      });
      toast.success('Report submitted successfully');
      fetchReports();
      setMorningDesc('');
      setAfternoonDesc('');
      setCandidatesScreened('0');
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground font-heading flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Daily Work Report
          </h1>
          <p className="text-muted-foreground">Submit and track your daily department work reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Form */}
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-4 w-4" /> New Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal border-border/50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(reportDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={reportDate} onSelect={(d) => d && setReportDate(d)} className="p-3" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Morning Session Description</label>
                <Textarea
                  placeholder="Describe your morning work..."
                  className="min-h-[100px] border-border/50"
                  value={morningDesc}
                  onChange={(e) => setMorningDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Afternoon Session Description</label>
                <Textarea
                  placeholder="Describe your afternoon work..."
                  className="min-h-[100px] border-border/50"
                  value={afternoonDesc}
                  onChange={(e) => setAfternoonDesc(e.target.value)}
                />
              </div>

              {department === 'BDA' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Candidates Screened</label>
                  <Input
                    type="number"
                    value={candidatesScreened}
                    onChange={(e) => setCandidatesScreened(e.target.value)}
                    className="border-border/50"
                  />
                </div>
              )}

              <Button onClick={handleSubmit} className="w-full gap-2 shadow-lg shadow-primary/20" disabled={submitting}>
                {submitting ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Report
              </Button>
            </CardContent>
          </Card>

          {/* Report History */}
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4" /> Report History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center p-12 text-muted-foreground">Loading history...</div>
                ) : reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <History className="h-8 w-8 mb-2 opacity-50" />
                    <p>No reports submitted yet</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {reports.map((report) => (
                      <div key={report._id || report.id} className="p-4 rounded-xl border border-border/50 bg-background/50 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/5">{format(parseISO(report.report_date), 'dd MMM yyyy')}</Badge>
                            <Badge>{report.department}</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Morning</p>
                            <p className="text-sm line-clamp-2">{report.morning_description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Afternoon</p>
                            <p className="text-sm line-clamp-2">{report.afternoon_description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeReports;
