import { useState, useMemo } from 'react';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AttendanceCard = () => {
  const { todayAttendance, markAttendance, attendanceSummary, myAttendance, loading } = useAttendance();
  const [marking, setMarking] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Create maps for present and absent dates
  const { presentDates, absentDates } = useMemo(() => {
    const present: Date[] = [];
    const absent: Date[] = [];
    myAttendance.forEach((record) => {
      const date = parseISO(record.date);
      if (record.status === 'present') {
        present.push(date);
      } else if (record.status === 'absent') {
        absent.push(date);
      }
    });
    return { presentDates: present, absentDates: absent };
  }, [myAttendance]);

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
        todayAttendance?.status === 'present' && "border-success/50 bg-success/5",
        todayAttendance?.status === 'absent' && "border-destructive/50 bg-destructive/5"
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
                  ? "bg-success/20 text-success" 
                  : "bg-destructive/20 text-destructive"
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
                  className="flex-1 bg-success hover:bg-success/90 gap-1 text-[10px] sm:text-xs h-7 sm:h-8"
                >
                  <CheckCircle className="h-3 w-3" />
                  Present
                </Button>
                <Button 
                  onClick={() => setShowLeaveDialog(true)}
                  disabled={marking}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 gap-1 text-[10px] sm:text-xs h-7 sm:h-8"
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Attendance Summary
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="space-y-4 mt-4">
              {/* Current Month Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{currentMonthName} (Current Month)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs font-medium text-success">Present</span>
                    </div>
                    <p className="text-2xl font-bold text-success">
                      {attendanceSummary.currentMonthPresent}
                    </p>
                    <p className="text-[10px] text-success/70">days</p>
                  </div>
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-xs font-medium text-destructive">Absent</span>
                    </div>
                    <p className="text-2xl font-bold text-destructive">
                      {attendanceSummary.currentMonthAbsent}
                    </p>
                    <p className="text-[10px] text-destructive/70">days</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* All Time Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">All Time</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Total Present</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {attendanceSummary.totalPresent}
                    </p>
                    <p className="text-[10px] text-primary/70">days</p>
                  </div>
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-warning" />
                      <span className="text-xs font-medium text-warning">Total Absent</span>
                    </div>
                    <p className="text-2xl font-bold text-warning">
                      {attendanceSummary.totalAbsent}
                    </p>
                    <p className="text-[10px] text-warning/70">days</p>
                  </div>
                </div>
              </div>

              {/* Attendance Rate */}
              {(attendanceSummary.totalPresent + attendanceSummary.totalAbsent) > 0 && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
                    <span className="text-lg font-bold text-primary">
                      {Math.round((attendanceSummary.totalPresent / (attendanceSummary.totalPresent + attendanceSummary.totalAbsent)) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-success to-success/80 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.round((attendanceSummary.totalPresent / (attendanceSummary.totalPresent + attendanceSummary.totalAbsent)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-4">
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
              </div>
              
              {/* Calendar */}
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    present: presentDates,
                    absent: absentDates,
                  }}
                  modifiersClassNames={{
                    present: "bg-success/20 text-success font-semibold hover:bg-success/30",
                    absent: "bg-destructive/20 text-destructive font-semibold hover:bg-destructive/30",
                  }}
                  disabled={(date) => date > new Date()}
                />
              </div>
              
              {/* Selected Month Stats */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  {format(calendarMonth, 'MMMM yyyy')}: {' '}
                  <span className="text-success font-medium">
                    {presentDates.filter(d => d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()).length} present
                  </span>
                  {' · '}
                  <span className="text-destructive font-medium">
                    {absentDates.filter(d => d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()).length} absent
                  </span>
                </p>
              </div>
            </TabsContent>
          </Tabs>
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
                className="flex-1 bg-destructive hover:bg-destructive/90"
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
