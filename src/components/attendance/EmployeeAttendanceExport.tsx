import { useState } from 'react';
import { format, eachDayOfInterval, isSunday as dateFnsIsSunday } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, FileUser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Holiday } from '@/hooks/useHolidays';

interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface EmployeeAttendanceExportProps {
  employees: Employee[];
  holidays: Holiday[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  half_day: boolean | null;
  leave_reason: string | null;
  marked_at: string;
  location_verified: boolean | null;
}

const EmployeeAttendanceExport = ({ employees, holidays }: EmployeeAttendanceExportProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const isHoliday = (date: string): Holiday | null => {
    return holidays.find(h => h.date === date) || null;
  };

  const getAttendanceForDateRange = async (employeeId: string, from: Date, to: Date) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', employeeId)
      .gte('date', format(from, 'yyyy-MM-dd'))
      .lte('date', format(to, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []) as AttendanceRecord[];
  };

  const handleExport = async () => {
    if (!selectedEmployee || !fromDate || !toDate) {
      toast({ title: 'Error', description: 'Please select employee and date range', variant: 'destructive' });
      return;
    }

    if (fromDate > toDate) {
      toast({ title: 'Error', description: 'From date must be before To date', variant: 'destructive' });
      return;
    }

    setExporting(true);
    try {
      const employee = employees.find(e => e.user_id === selectedEmployee);
      if (!employee) {
        toast({ title: 'Error', description: 'Employee not found', variant: 'destructive' });
        return;
      }

      // Fetch attendance records for the date range
      const attendanceRecords = await getAttendanceForDateRange(selectedEmployee, fromDate, toDate);
      
      // Create a map for quick lookup
      const attendanceMap = new Map<string, AttendanceRecord>();
      attendanceRecords.forEach(record => {
        attendanceMap.set(record.date, record);
      });

      // Generate all dates in the range
      const allDates = eachDayOfInterval({ start: fromDate, end: toDate });

      // Build export data including Sundays and holidays
      const excelData: any[] = [];
      let totalPresent = 0;
      let totalHalfDay = 0;
      let totalAbsent = 0;
      let totalSundays = 0;
      let totalHolidays = 0;

      allDates.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isSundayDate = dateFnsIsSunday(date);
        const holidayInfo = isHoliday(dateStr);
        const record = attendanceMap.get(dateStr);

        let status = '';
        let remarks = '';

        if (isSundayDate) {
          status = 'Sunday (Auto-Present)';
          remarks = 'Weekly Off';
          totalSundays++;
        } else if (holidayInfo) {
          status = 'Holiday (Auto-Present)';
          remarks = `${holidayInfo.name} (${holidayInfo.type === 'govt' ? 'Govt' : 'Festival'})`;
          totalHolidays++;
        } else if (record) {
          if (record.half_day) {
            status = 'Half Day';
            totalHalfDay++;
          } else if (record.status === 'present') {
            status = 'Present';
            totalPresent++;
          } else {
            status = 'Absent';
            remarks = record.leave_reason || '';
            totalAbsent++;
          }
        } else {
          status = 'Not Marked';
          totalAbsent++;
        }

        excelData.push({
          'Date': format(date, 'dd/MM/yyyy'),
          'Day': format(date, 'EEEE'),
          'Status': status,
          'Work Location': (record as any)?.work_location || '-',
          'Marked At': record ? format(new Date(record.marked_at), 'hh:mm a') : '-',
          'Location Verified': record?.location_verified ? 'Yes' : (isSundayDate || holidayInfo ? 'N/A' : 'No'),
          'Remarks': remarks || '-',
        });
      });

      // Calculate effective attendance
      const effectivePresent = totalPresent + (totalHalfDay * 0.5) + totalSundays + totalHolidays;
      const totalWorkingDays = allDates.length;
      const attendancePercentage = totalWorkingDays > 0 ? Math.round((effectivePresent / totalWorkingDays) * 100) : 0;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        { 'Metric': 'Employee Name', 'Value': employee.name },
        { 'Metric': 'Email', 'Value': employee.email },
        { 'Metric': 'Report Period', 'Value': `${format(fromDate, 'dd MMM yyyy')} - ${format(toDate, 'dd MMM yyyy')}` },
        { 'Metric': 'Total Days', 'Value': totalWorkingDays },
        { 'Metric': '', 'Value': '' },
        { 'Metric': 'Present Days', 'Value': totalPresent },
        { 'Metric': 'Half Days', 'Value': totalHalfDay },
        { 'Metric': 'Absent Days', 'Value': totalAbsent },
        { 'Metric': 'Sundays (Auto-Present)', 'Value': totalSundays },
        { 'Metric': 'Holidays (Auto-Present)', 'Value': totalHolidays },
        { 'Metric': '', 'Value': '' },
        { 'Metric': 'Effective Present Days', 'Value': effectivePresent },
        { 'Metric': 'Attendance Percentage', 'Value': `${attendancePercentage}%` },
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Details sheet
      const wsDetails = XLSX.utils.json_to_sheet(excelData);
      wsDetails['!cols'] = [
        { wch: 12 }, // Date
        { wch: 12 }, // Day
        { wch: 20 }, // Status
        { wch: 18 }, // Work Location
        { wch: 12 }, // Marked At
        { wch: 16 }, // Location Verified
        { wch: 40 }, // Remarks
      ];
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Attendance Details');

      // Generate filename
      const fileName = `${employee.name.replace(/\s+/g, '_')}_Attendance_${format(fromDate, 'yyyyMMdd')}_to_${format(toDate, 'yyyyMMdd')}.xlsx`;
      
      // Download
      XLSX.writeFile(wb, fileName);

      toast({ title: 'Success', description: `Attendance report exported for ${employee.name}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to export', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUser className="h-5 w-5" />
          Export Individual Employee Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Employee Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.user_id} value={emp.user_id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  disabled={(date) => date > new Date() || (fromDate ? date < fromDate : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Export Button */}
          <div className="space-y-2">
            <label className="text-sm font-medium invisible">Action</label>
            <Button 
              onClick={handleExport} 
              disabled={exporting || !selectedEmployee || !fromDate || !toDate}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Export includes Sundays and holidays counted as auto-present days with summary statistics.
        </p>
      </CardContent>
    </Card>
  );
};

export default EmployeeAttendanceExport;
