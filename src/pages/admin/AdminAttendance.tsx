import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAttendance, Attendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useHolidays } from '@/hooks/useHolidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarCheck, CheckCircle, XCircle, Search, Download, FileText, Pencil, UserPlus, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AttendanceEditDialog from '@/components/attendance/AttendanceEditDialog';
import AdminMarkAttendanceDialog from '@/components/attendance/AdminMarkAttendanceDialog';
import HolidayManagement from '@/components/admin/HolidayManagement';
import EmployeeAttendanceExport from '@/components/attendance/EmployeeAttendanceExport';
import AttendanceMapView from '@/components/attendance/AttendanceMapView';
import LocationTrendReport from '@/components/attendance/LocationTrendReport';
import { getLocationDisplayName } from '@/utils/geolocation';
import * as XLSX from 'xlsx';

const AdminAttendance = () => {
  const { attendance, loading, updateAttendance, adminMarkAttendance } = useAttendance();
  const { employees } = useEmployees();
  const { holidays } = useHolidays();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const { toast } = useToast();

  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = a.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || a.date === dateFilter;
    const matchesMonth = !monthFilter || a.date.startsWith(monthFilter);
    return matchesSearch && matchesDate && matchesMonth;
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

  // Calculate stats for today
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(a => a.date === today);
  const presentToday = todayRecords.filter(a => a.status === 'present' && !a.half_day).length;
  const halfDayToday = todayRecords.filter(a => a.half_day === true).length;
  const absentToday = todayRecords.filter(a => a.status === 'absent').length;

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredAttendance.length > 0 ? filteredAttendance : attendance;
    
    if (dataToExport.length === 0) {
      toast({ title: 'No Data', description: 'No attendance records to export', variant: 'destructive' });
      return;
    }

    // Prepare data for Excel
    const excelData = dataToExport.map(record => ({
      'Employee Name': record.user_name || 'Unknown',
      'Date': record.date,
      'Status': record.half_day ? 'Half Day' : (record.status === 'present' ? 'Present' : 'Absent'),
      'Work Location': getLocationDisplayName(record.work_location),
      'Marked At': new Date(record.marked_at).toLocaleTimeString(),
      'Leave Reason': record.status === 'absent' ? (record.leave_reason || '-') : '-',
      'Location Verified': record.location_verified ? 'Yes' : 'No'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Employee Name
      { wch: 12 }, // Date
      { wch: 10 }, // Status
      { wch: 20 }, // Work Location
      { wch: 12 }, // Marked At
      { wch: 40 }, // Leave Reason
      { wch: 15 }, // Location Verified
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    // Generate filename
    const fileName = `attendance_report_${monthFilter || dateFilter || today}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, fileName);

    toast({ title: 'Success', description: 'Attendance report exported successfully' });
  };

  // Generate monthly summary
  const getMonthlyStats = () => {
    const month = monthFilter || new Date().toISOString().slice(0, 7);
    const monthRecords = attendance.filter(a => a.date.startsWith(month));
    
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
          <div className="flex gap-2">
            <Button onClick={() => setShowMarkDialog(true)} variant="default" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Mark Attendance
            </Button>
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

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
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
