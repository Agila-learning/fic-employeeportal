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

      // ===== Color helpers =====
      const headerStyle = {
        fill: { fgColor: { rgb: '1A5276' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center' as const, vertical: 'center' as const },
        border: { top: { style: 'thin' as const, color: { rgb: '000000' } }, bottom: { style: 'thin' as const, color: { rgb: '000000' } }, left: { style: 'thin' as const, color: { rgb: '000000' } }, right: { style: 'thin' as const, color: { rgb: '000000' } } }
      };
      const getStatusColor = (status: string) => {
        if (status === 'Present') return 'D5F5E3';
        if (status === 'Half Day') return 'FEF9E7';
        if (status === 'Absent' || status === 'Not Marked') return 'FADBD8';
        if (status.includes('Sunday')) return 'D6EAF8';
        if (status.includes('Holiday')) return 'E8DAEF';
        return 'FFFFFF';
      };
      const cellBorder = {
        top: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
        bottom: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
        left: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
        right: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
      };

      // ===== Summary sheet with styling =====
      const summaryData = [
        ['Employee Attendance Report'],
        [],
        ['Employee Name', employee.name],
        ['Email', employee.email],
        ['Report Period', `${format(fromDate, 'dd MMM yyyy')} - ${format(toDate, 'dd MMM yyyy')}`],
        ['Total Days', totalWorkingDays],
        [],
        ['Metric', 'Count'],
        ['Present Days', totalPresent],
        ['Half Days', totalHalfDay],
        ['Absent Days', totalAbsent],
        ['Sundays (Auto-Present)', totalSundays],
        ['Holidays (Auto-Present)', totalHolidays],
        [],
        ['Effective Present Days', effectivePresent],
        ['Attendance Percentage', `${attendancePercentage}%`],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 40 }];
      // Merge title row
      wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      // Style title
      const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (wsSummary[titleCell]) {
        wsSummary[titleCell].s = {
          fill: { fgColor: { rgb: '1A5276' } },
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
      // Style metric header row (row 7)
      for (let c = 0; c < 2; c++) {
        const ref = XLSX.utils.encode_cell({ r: 7, c });
        if (wsSummary[ref]) wsSummary[ref].s = headerStyle;
      }
      // Color the attendance % row
      const pctRow = 15;
      const pctBg = attendancePercentage >= 80 ? 'D5F5E3' : attendancePercentage >= 60 ? 'FEF9E7' : 'FADBD8';
      for (let c = 0; c < 2; c++) {
        const ref = XLSX.utils.encode_cell({ r: pctRow, c });
        if (wsSummary[ref]) wsSummary[ref].s = {
          fill: { fgColor: { rgb: pctBg } },
          font: { bold: true, sz: 12 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: cellBorder,
        };
      }
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // ===== Details sheet with color coding =====
      const detailCols = ['Date', 'Day', 'Status', 'Work Location', 'Marked At', 'Location Verified', 'Remarks'];
      const wsDetails = XLSX.utils.aoa_to_sheet([detailCols]);
      wsDetails['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 40 },
      ];
      // Style header
      for (let c = 0; c < 7; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        if (wsDetails[ref]) wsDetails[ref].s = headerStyle;
      }

      excelData.forEach((row, idx) => {
        const rowData = [row['Date'], row['Day'], row['Status'], row['Work Location'], row['Marked At'], row['Location Verified'], row['Remarks']];
        XLSX.utils.sheet_add_aoa(wsDetails, [rowData], { origin: idx + 1 });
        const bgColor = getStatusColor(row['Status']);
        for (let c = 0; c < 7; c++) {
          const ref = XLSX.utils.encode_cell({ r: idx + 1, c });
          if (wsDetails[ref]) {
            wsDetails[ref].s = {
              fill: { fgColor: { rgb: bgColor } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: cellBorder,
            };
          }
        }
      });

      wsDetails['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: excelData.length, c: 6 } });
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
