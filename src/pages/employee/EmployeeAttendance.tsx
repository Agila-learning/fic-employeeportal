import DashboardLayout from '@/components/layout/DashboardLayout';
import AttendanceCard from '@/components/dashboard/AttendanceCard';
import { CalendarCheck, Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EmployeeAttendance = () => {
  return (
    <DashboardLayout requiredRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-green-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
          
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <CalendarCheck className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Attendance</h1>
              <p className="text-white/70 text-sm mt-1">Mark your daily attendance before 12:00 PM</p>
            </div>
          </div>
        </div>

        {/* Leave Policy Notice */}
        <Alert className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Leave Policy:</strong> If you need to take leave, please send an email at least 
            <strong> 1 day before </strong> to{' '}
            <a 
              href="mailto:info@forgeindiaconnect.com" 
              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            >
              <Mail className="h-3.5 w-3.5" />
              info@forgeindiaconnect.com
            </a>
          </AlertDescription>
        </Alert>

        {/* Attendance Card - Full Width */}
        <div className="max-w-2xl mx-auto">
          <AttendanceCard />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeAttendance;
