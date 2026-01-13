import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAttendance, Attendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarCheck, CheckCircle, XCircle, Search, Download, FileText, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AttendanceEditDialog from '@/components/attendance/AttendanceEditDialog';

const AdminAttendance = () => {
  const { attendance, loading, updateAttendance } = useAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const { toast } = useToast();

  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = a.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || a.date === dateFilter;
    const matchesMonth = !monthFilter || a.date.startsWith(monthFilter);
    return matchesSearch && matchesDate && matchesMonth;
  });

  const getStatusBadge = (status: string) => (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      status === 'present' 
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    )}>
      {status === 'present' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  );

  // Calculate stats for today
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(a => a.date === today);
  const presentToday = todayRecords.filter(a => a.status === 'present').length;
  const absentToday = todayRecords.filter(a => a.status === 'absent').length;

  // Export to CSV
  const exportToCSV = () => {
    const dataToExport = filteredAttendance.length > 0 ? filteredAttendance : attendance;
    
    if (dataToExport.length === 0) {
      toast({ title: 'No Data', description: 'No attendance records to export', variant: 'destructive' });
      return;
    }

    const headers = ['Employee Name', 'Date', 'Status', 'Marked At', 'Leave Reason'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(record => [
        `"${record.user_name || 'Unknown'}"`,
        record.date,
        record.status,
        new Date(record.marked_at).toLocaleString(),
        `"${record.leave_reason || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${monthFilter || dateFilter || today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Success', description: 'Attendance report exported successfully' });
  };

  // Generate monthly summary
  const getMonthlyStats = () => {
    const month = monthFilter || new Date().toISOString().slice(0, 7);
    const monthRecords = attendance.filter(a => a.date.startsWith(month));
    
    const employeeStats: { [key: string]: { name: string; present: number; absent: number } } = {};
    
    monthRecords.forEach(record => {
      const name = record.user_name || 'Unknown';
      if (!employeeStats[record.user_id]) {
        employeeStats[record.user_id] = { name, present: 0, absent: 0 };
      }
      if (record.status === 'present') {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
            <p className="text-muted-foreground mt-1">View, edit, and track employee attendance</p>
          </div>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{presentToday}</p>
                  <p className="text-sm text-muted-foreground">Present Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{absentToday}</p>
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
                    <TableHead className="text-center">Present Days</TableHead>
                    <TableHead className="text-center">Absent Days</TableHead>
                    <TableHead className="text-center">Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.map((stat, index) => {
                    const total = stat.present + stat.absent;
                    const percentage = total > 0 ? Math.round((stat.present / total) * 100) : 0;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="text-center text-green-600 font-semibold">{stat.present}</TableCell>
                        <TableCell className="text-center text-red-600 font-semibold">{stat.absent}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            percentage >= 80 ? 'bg-green-100 text-green-700' : 
                            percentage >= 60 ? 'bg-amber-100 text-amber-700' : 
                            'bg-red-100 text-red-700'
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
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
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
    </DashboardLayout>
  );
};

export default AdminAttendance;
