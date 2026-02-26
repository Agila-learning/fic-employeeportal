import { useState } from 'react';
import { format, eachDayOfInterval, isSunday as dateFnsIsSunday } from 'date-fns';
import { createWorkbook, setColumnWidths, applyHeaderStyle, downloadWorkbook, styleCell, defaultBorder, getStatusColor } from '@/utils/excelExport';
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
      const wb = createWorkbook();

      // ===== Summary sheet =====
      const wsSummary = wb.addWorksheet('Summary');
      setColumnWidths(wsSummary, [28, 40]);

      const summaryData = [
        ['Employee Attendance Report', ''],
        ['', ''],
        ['Employee Name', employee.name],
        ['Email', employee.email],
        ['Report Period', `${format(fromDate, 'dd MMM yyyy')} - ${format(toDate, 'dd MMM yyyy')}`],
        ['Total Days', totalWorkingDays],
        ['', ''],
        ['Metric', 'Count'],
        ['Present Days', totalPresent],
        ['Half Days', totalHalfDay],
        ['Absent Days', totalAbsent],
        ['Sundays (Auto-Present)', totalSundays],
        ['Holidays (Auto-Present)', totalHolidays],
        ['', ''],
        ['Effective Present Days', effectivePresent],
        ['Attendance Percentage', `${attendancePercentage}%`],
      ];
      summaryData.forEach(row => wsSummary.addRow(row));

      // Merge & style title
      wsSummary.mergeCells('A1:B1');
      styleCell(wsSummary.getRow(1).getCell(1), {
        fillColor: '1A5276',
        fontBold: true,
        fontColor: 'FFFFFF',
        fontSize: 14,
        horizontal: 'center',
        vertical: 'middle',
      });

      // Style metric header row (row 8)
      applyHeaderStyle(wsSummary, 2, '1A5276', 8);

      // Color the attendance % row (row 16)
      const pctBg = attendancePercentage >= 80 ? 'D5F5E3' : attendancePercentage >= 60 ? 'FEF9E7' : 'FADBD8';
      for (let c = 1; c <= 2; c++) {
        styleCell(wsSummary.getRow(16).getCell(c), {
          fillColor: pctBg,
          fontBold: true,
          fontSize: 12,
          horizontal: 'center',
          vertical: 'middle',
          border: defaultBorder,
        });
      }

      // ===== Details sheet =====
      const wsDetails = wb.addWorksheet('Attendance Details');
      const detailCols = ['Date', 'Day', 'Status', 'Work Location', 'Marked At', 'Location Verified', 'Remarks'];
      setColumnWidths(wsDetails, [12, 12, 22, 18, 12, 16, 40]);
      wsDetails.addRow(detailCols);
      applyHeaderStyle(wsDetails, 7, '1A5276');

      excelData.forEach(row => {
        const dataRow = wsDetails.addRow([row['Date'], row['Day'], row['Status'], row['Work Location'], row['Marked At'], row['Location Verified'], row['Remarks']]);
        const bgColor = getStatusColor(row['Status']);
        for (let c = 1; c <= 7; c++) {
          styleCell(dataRow.getCell(c), {
            fillColor: bgColor,
            horizontal: 'center',
            vertical: 'middle',
            border: defaultBorder,
          });
        }
      });

      // Generate filename
      const fileName = `${employee.name.replace(/\s+/g, '_')}_Attendance_${format(fromDate, 'yyyyMMdd')}_to_${format(toDate, 'yyyyMMdd')}.xlsx`;
      
      // Download
      await downloadWorkbook(wb, fileName);

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
