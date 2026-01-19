import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAttendance } from '@/hooks/useAttendance';
import { CheckCircle, XCircle, Clock, CalendarCheck, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const AttendanceCard = () => {
  const { todayAttendance, markAttendance, attendanceSummary, loading } = useAttendance();
  const [marking, setMarking] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const now = new Date();
  const cutoffHour = 10;
  const cutoffMinute = 30;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const cutoffMinutes = cutoffHour * 60 + cutoffMinute;
  const isBeforeCutoff = currentMinutes < cutoffMinutes;
  const minutesRemaining = cutoffMinutes - currentMinutes;
  const hoursLeft = Math.floor(minutesRemaining / 60);
  const minsLeft = minutesRemaining % 60;
  const timeRemaining = isBeforeCutoff 
    ? `${hoursLeft}h ${minsLeft}m remaining`
    : 'Time exceeded';

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const handleMarkPresent = async () => {
    setMarking(true);
    await markAttendance('present');
    setMarking(false);
  };

  const handleMarkAbsent = async () => {
    if (!leaveReason.trim()) return;
    setMarking(true);
    await markAttendance('absent', leaveReason);
    setMarking(false);
    setShowLeaveDialog(false);
    setLeaveReason('');
  };

  if (loading) {
    return (
      <Card className="border-border/50 animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(
        "border-border/50 overflow-hidden transition-all duration-300",
        todayAttendance?.status === 'present' && "border-green-500/50 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10",
        todayAttendance?.status === 'absent' && "border-red-500/50 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10"
      )}>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">Today's Attendance</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSummary(true)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Summary
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 px-3 sm:px-6">
          {todayAttendance ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn(
                "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0",
                todayAttendance.status === 'present' 
                  ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                  : "bg-red-500/20 text-red-600 dark:text-red-400"
              )}>
                {todayAttendance.status === 'present' 
                  ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> 
                  : <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                }
              </div>
              <div className="min-w-0">
                <p className="font-semibold capitalize text-sm sm:text-base">
                  {todayAttendance.status === 'present' ? 'Present' : 'On Leave'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Marked at {new Date(todayAttendance.marked_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : isBeforeCutoff ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate">{timeRemaining}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleMarkPresent}
                  disabled={marking}
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 gap-1 text-[10px] sm:text-xs h-7 sm:h-8"
                >
                  <CheckCircle className="h-3 w-3" />
                  Present
                </Button>
                <Button 
                  onClick={() => setShowLeaveDialog(true)}
                  disabled={marking}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1 text-[10px] sm:text-xs h-7 sm:h-8"
                >
                  <XCircle className="h-3 w-3" />
                  Leave
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs sm:text-sm text-muted-foreground">Window closed</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Mark before 10:30 AM</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Attendance Summary
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Month Stats */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{currentMonthName} (Current Month)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Present</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {attendanceSummary.currentMonthPresent}
                  </p>
                  <p className="text-[10px] text-green-600/70 dark:text-green-400/70">days</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">Absent</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {attendanceSummary.currentMonthAbsent}
                  </p>
                  <p className="text-[10px] text-red-600/70 dark:text-red-400/70">days</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* All Time Stats */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">All Time</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Total Present</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {attendanceSummary.totalPresent}
                  </p>
                  <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">days</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Total Absent</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {attendanceSummary.totalAbsent}
                  </p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">days</p>
                </div>
              </div>
            </div>

            {/* Attendance Rate */}
            {(attendanceSummary.totalPresent + attendanceSummary.totalAbsent) > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
                  <span className="text-lg font-bold text-primary">
                    {Math.round((attendanceSummary.totalPresent / (attendanceSummary.totalPresent + attendanceSummary.totalAbsent)) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.round((attendanceSummary.totalPresent / (attendanceSummary.totalPresent + attendanceSummary.totalAbsent)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Reason Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leave-reason">Please provide a reason for your leave *</Label>
              <Textarea
                id="leave-reason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Enter your leave reason..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLeaveDialog(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMarkAbsent}
                disabled={marking || !leaveReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {marking ? 'Marking...' : 'Confirm Leave'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttendanceCard;
