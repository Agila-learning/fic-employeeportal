import { useState } from 'react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAttendance, Attendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useHolidays } from '@/hooks/useHolidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarCheck, CheckCircle, XCircle, Search, Download, FileText, Pencil, UserPlus, Clock, MapPin, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AttendanceEditDialog from '@/components/attendance/AttendanceEditDialog';
import AdminMarkAttendanceDialog from '@/components/attendance/AdminMarkAttendanceDialog';
import HolidayManagement from '@/components/admin/HolidayManagement';
import EmployeeAttendanceExport from '@/components/attendance/EmployeeAttendanceExport';
import AttendanceMapView from '@/components/attendance/AttendanceMapView';
import LocationTrendReport from '@/components/attendance/LocationTrendReport';
import { getLocationDisplayName } from '@/utils/geolocation';
import { createWorkbook, setColumnWidths, applyHeaderStyle, applyRowStyles, downloadWorkbook, styleCell, defaultBorder, solidBorder } from '@/utils/excelExport';

const AdminAttendance = () => {
  const { attendance, loading, updateAttendance, adminMarkAttendance } = useAttendance();
  const { employees } = useEmployees();
  const { holidays } = useHolidays();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'half_day' | 'absent'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [exportFromDate, setExportFromDate] = useState<Date | undefined>(undefined);
  const [exportToDate, setExportToDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  };

  // Calculate stats for today
  const today = new Date().toISOString().split('T')[0];

  const filteredAttendance = attendance.filter(a => {
    // Exclude admin users from attendance display
    const emp = employees.find(e => e.user_id === a.user_id);
    if (emp && emp.role === 'admin') return false;

    const matchesSearch = a.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || a.date === dateFilter;
    const matchesMonth = !monthFilter || a.date.startsWith(monthFilter);
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'present') matchesStatus = a.status === 'present' && !a.half_day;
    else if (statusFilter === 'half_day') matchesStatus = a.half_day === true;
    else if (statusFilter === 'absent') matchesStatus = a.status === 'absent';

    // Period filter
    let matchesPeriod = true;
    if (periodFilter === 'today') {
      matchesPeriod = a.date === today;
    } else if (periodFilter === 'week') {
      const { start, end } = getWeekRange();
      const recordDate = new Date(a.date);
      matchesPeriod = recordDate >= start && recordDate <= end;
    } else if (periodFilter === 'month') {
      const { start, end } = getMonthRange();
      const recordDate = new Date(a.date);
      matchesPeriod = recordDate >= start && recordDate <= end;
    }

    return matchesSearch && matchesDate && matchesMonth && matchesStatus && matchesPeriod;
  });

  const getStatusBadge = (record: Attendance) => {
    if (record.half_day) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
          <Clock className="h-3 w-3" />
          Half Day
        </span>
      );
    }
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        record.status === 'present' 
          ? 'bg-success/20 text-success' 
          : 'bg-destructive/20 text-destructive'
      )}>
        {record.status === 'present' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {record.status}
      </span>
    );
  };

  const todayRecords = attendance.filter(a => {
    const emp = employees.find(e => e.user_id === a.user_id);
    return a.date === today && (!emp || emp.role !== 'admin');
  });
  const presentToday = todayRecords.filter(a => a.status === 'present' && !a.half_day).length;
  const halfDayToday = todayRecords.filter(a => a.half_day === true).length;
  const absentToday = todayRecords.filter(a => a.status === 'absent').length;

  // Helper functions are now imported from excelExport utility

  // Export to Excel with summary + detailed sheets with colors
  const exportToExcel = async () => {
    let dataToExport = filteredAttendance.length > 0 ? filteredAttendance : attendance;
    
    // Apply export date range filter
    if (exportFromDate || exportToDate) {
      dataToExport = dataToExport.filter(a => {
        const recordDate = new Date(a.date + 'T00:00:00');
        if (exportFromDate && recordDate < exportFromDate) return false;
        if (exportToDate) {
          const endOfDay = new Date(exportToDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (recordDate > endOfDay) return false;
        }
        return true;
      });
    }

    if (dataToExport.length === 0) {
      toast({ title: 'No Data', description: 'No attendance records to export for selected range', variant: 'destructive' });
      return;
    }

    const wb = createWorkbook();

    // ===== SHEET 1: Employee Summary =====
    const empMap: Record<string, { name: string; present: number; halfDay: number; absent: number; totalDays: number }> = {};
    dataToExport.forEach(record => {
      const name = record.user_name || 'Unknown';
      if (!empMap[record.user_id]) {
        empMap[record.user_id] = { name, present: 0, halfDay: 0, absent: 0, totalDays: 0 };
      }
      empMap[record.user_id].totalDays++;
      if (record.half_day) {
        empMap[record.user_id].halfDay++;
      } else if (record.status === 'present') {
        empMap[record.user_id].present++;
      } else {
        empMap[record.user_id].absent++;
      }
    });

    const summaryRows = Object.values(empMap).map(e => {
      const effectivePresent = e.present + (e.halfDay * 0.5);
      const pct = e.totalDays > 0 ? Math.round((effectivePresent / e.totalDays) * 100) : 0;
      return [e.name, e.totalDays, e.present, e.halfDay, e.absent, effectivePresent, `${pct}%`];
    });

    const summarySheet = wb.addWorksheet('Employee Summary');
    const summaryHeaders = ['Employee Name', 'Total Days', 'Present Days', 'Half Days', 'Absent Days', 'Effective Present', 'Attendance %'];
    setColumnWidths(summarySheet, [25, 12, 14, 12, 13, 16, 14]);
    summarySheet.addRow(summaryHeaders);
    applyHeaderStyle(summarySheet, 7, '2E86C1');
    summaryRows.forEach((row, idx) => {
      const dataRow = summarySheet.addRow(row);
      const pctStr = row[6] as string;
      const pct = parseInt(pctStr);
      const bgColor = pct >= 80 ? 'D5F5E3' : pct >= 60 ? 'FEF9E7' : 'FADBD8';
      for (let c = 1; c <= 7; c++) {
        const cell = dataRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bgColor}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = defaultBorder;
      }
    });

    // ===== SHEET 2: All Records (Grouped by Date) =====
    const mapRecord = (record: Attendance) => ({
      'Employee Name': record.user_name || 'Unknown',
      'Date': record.date,
      'Day': new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
      'Status': record.half_day ? 'Half Day' : (record.status === 'present' ? 'Present' : 'Absent'),
      'Work Location': getLocationDisplayName(record.work_location),
      'Marked At': new Date(record.marked_at).toLocaleTimeString(),
      'Leave Reason': record.status === 'absent' ? (record.leave_reason || '-') : '-',
      'Location Verified': record.location_verified ? 'Yes' : 'No'
    });

    const colWidths = [25, 14, 12, 12, 20, 14, 40, 16];
    const cols = ['Employee Name', 'Date', 'Day', 'Status', 'Work Location', 'Marked At', 'Leave Reason', 'Location Verified'];

    const allSheet = wb.addWorksheet('All Records');
    setColumnWidths(allSheet, colWidths);
    allSheet.addRow(cols);
    applyHeaderStyle(allSheet, 8, '1A5276');

    // Group records by date
    const sortedData = [...dataToExport].sort((a, b) => a.date.localeCompare(b.date));
    const dateGroups: Record<string, Attendance[]> = {};
    sortedData.forEach(record => {
      if (!dateGroups[record.date]) dateGroups[record.date] = [];
      dateGroups[record.date].push(record);
    });

    const sortedDates = Object.keys(dateGroups).sort();
    sortedDates.forEach((date, dateIdx) => {
      // Add blank separator row before each date group (except the first)
      if (dateIdx > 0) {
        allSheet.addRow([]);
      }

      // Date header row
      const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      const dateLabel = `📅  ${date}  —  ${dayName}  (${dateGroups[date].length} employees)`;
      const dateRow = allSheet.addRow([dateLabel]);
      allSheet.mergeCells(dateRow.number, 1, dateRow.number, 8);
      for (let c = 1; c <= 8; c++) {
        styleCell(dateRow.getCell(c), {
          fillColor: '1B4F72',
          fontBold: true,
          fontColor: 'FFFFFF',
          fontSize: 12,
          horizontal: 'left',
          vertical: 'middle',
          border: solidBorder,
        });
      }

      // Employee rows for this date
      dateGroups[date].forEach(record => {
        const mapped = mapRecord(record);
        const row = cols.map(c => mapped[c as keyof typeof mapped]);
        const dataRow = allSheet.addRow(row);
        let bgColor = 'FFFFFF';
        if (mapped['Status'] === 'Present') bgColor = 'D5F5E3';
        else if (mapped['Status'] === 'Half Day') bgColor = 'FEF9E7';
        else if (mapped['Status'] === 'Absent') bgColor = 'FADBD8';
        for (let c = 1; c <= 8; c++) {
          styleCell(dataRow.getCell(c), {
            fillColor: bgColor,
            horizontal: 'center',
            vertical: 'middle',
            border: defaultBorder,
          });
        }
      });
    });

    // ===== SHEET 3: Present =====
    const addFilteredSheet = (sheetName: string, records: ReturnType<typeof mapRecord>[], headerColor: string) => {
      if (records.length === 0) return;
      const ws = wb.addWorksheet(sheetName);
      setColumnWidths(ws, colWidths);
      ws.addRow(cols);
      applyHeaderStyle(ws, 8, headerColor);
      records.forEach((rec, idx) => {
        const row = ws.addRow(cols.map(c => rec[c as keyof typeof rec]));
        applyRowStyles(ws, row.number, row.number, 8);
      });
    };

    addFilteredSheet('Present', dataToExport.filter(a => a.status === 'present' && !a.half_day).map(mapRecord), '1E8449');
    addFilteredSheet('Half Day', dataToExport.filter(a => a.half_day === true).map(mapRecord), 'D4AC0D');
    addFilteredSheet('Absent', dataToExport.filter(a => a.status === 'absent').map(mapRecord), 'C0392B');

    const periodLabel = exportFromDate && exportToDate 
      ? `${format(exportFromDate, 'yyyyMMdd')}_to_${format(exportToDate, 'yyyyMMdd')}`
      : periodFilter !== 'all' ? periodFilter : (monthFilter || dateFilter || today);
    const statusLabel = statusFilter !== 'all' ? `_${statusFilter}` : '';
    await downloadWorkbook(wb, `attendance_report_${periodLabel}${statusLabel}.xlsx`);

    toast({ title: 'Success', description: 'Attendance report exported with summary & color coding' });
  };

  // Generate monthly summary
  const getMonthlyStats = () => {
    const month = monthFilter || new Date().toISOString().slice(0, 7);
    const monthRecords = attendance.filter(a => {
      if (!a.date.startsWith(month)) return false;
      // Exclude admin users from monthly summary
      const emp = employees.find(e => e.user_id === a.user_id);
      return emp && emp.role !== 'admin';
    });
    const employeeStats: { [key: string]: { name: string; present: number; halfDay: number; absent: number } } = {};
    
    monthRecords.forEach(record => {
      const name = record.user_name || 'Unknown';
      if (!employeeStats[record.user_id]) {
        employeeStats[record.user_id] = { name, present: 0, halfDay: 0, absent: 0 };
      }
      if (record.half_day) {
        employeeStats[record.user_id].halfDay++;
      } else if (record.status === 'present') {
        employeeStats[record.user_id].present++;
      } else {
        employeeStats[record.user_id].absent++;
      }
    });

    return Object.values(employeeStats);
  };

  const monthlyStats = getMonthlyStats();

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
            <p className="text-muted-foreground mt-1">View, edit, and track employee attendance</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Button onClick={() => setShowMarkDialog(true)} variant="default" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Mark Attendance
            </Button>
          </div>
        </div>

        {/* Export with Date Range */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Overall Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportFromDate ? format(exportFromDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportFromDate}
                      onSelect={setExportFromDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportToDate ? format(exportToDate, 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportToDate}
                      onSelect={setExportToDate}
                      disabled={(date) => date > new Date() || (exportFromDate ? date < exportFromDate : false)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium invisible">Action</label>
                <Button onClick={exportToExcel} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium invisible">Clear</label>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                  onClick={() => { setExportFromDate(undefined); setExportToDate(undefined); }}
                  disabled={!exportFromDate && !exportToDate}
                >
                  Clear Dates
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Leave dates empty to export all available records. Filters (status, period) are also applied.
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayRecords.length}</p>
                  <p className="text-sm text-muted-foreground">Marked Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{presentToday}</p>
                  <p className="text-sm text-muted-foreground">Present Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{halfDayToday}</p>
                  <p className="text-sm text-muted-foreground">Half Day Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{absentToday}</p>
                  <p className="text-sm text-muted-foreground">Absent Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Monthly Summary
            </CardTitle>
            <div className="mt-2">
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            {monthlyStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No data for selected month</p>
            ) : (
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">S.No</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Half Day</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyStats.map((stat, index) => {
                      // Half days count as 0.5 for percentage calculation
                      const effectivePresent = stat.present + (stat.halfDay * 0.5);
                      const total = stat.present + stat.halfDay + stat.absent;
                      const percentage = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{stat.name}</TableCell>
                          <TableCell className="text-center text-success font-semibold">{stat.present}</TableCell>
                          <TableCell className="text-center text-warning font-semibold">{stat.halfDay}</TableCell>
                          <TableCell className="text-center text-destructive font-semibold">{stat.absent}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              percentage >= 80 ? 'bg-success/20 text-success' : 
                              percentage >= 60 ? 'bg-warning/20 text-warning' : 
                              'bg-destructive/20 text-destructive'
                            )}>
                              {percentage}%
                            </span>
                          </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Location Trend Report */}
        <LocationTrendReport attendance={attendance} />

        {/* Location Map View */}
        <AttendanceMapView attendance={attendance} selectedDate={dateFilter || new Date().toISOString().split('T')[0]} />

        {/* Individual Employee Export */}
        <EmployeeAttendanceExport employees={employees} holidays={holidays} />

        {/* Holiday Management */}
        <HolidayManagement />

        {/* Detailed Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked At</TableHead>
                    <TableHead>Leave Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.user_name}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      <TableCell>{new Date(record.marked_at).toLocaleTimeString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.leave_reason || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingAttendance(record)}
                          className="h-8 w-8 hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <AttendanceEditDialog
        attendance={editingAttendance}
        open={!!editingAttendance}
        onOpenChange={(open) => !open && setEditingAttendance(null)}
        onSave={updateAttendance}
      />

      {/* Mark Attendance Dialog */}
      <AdminMarkAttendanceDialog
        open={showMarkDialog}
        onOpenChange={setShowMarkDialog}
        employees={employees}
        onSave={adminMarkAttendance}
      />
    </DashboardLayout>
  );
};

export default AdminAttendance;
