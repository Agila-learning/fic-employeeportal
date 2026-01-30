import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAttendance } from '@/hooks/useAttendance';
import { useHolidays } from '@/hooks/useHolidays';
import { CheckCircle, XCircle, Clock, CalendarCheck, Calendar, TrendingUp, Sun, PartyPopper } from 'lucide-react';
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
import { format, isSameDay, parseISO, isSunday as checkIsSunday } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LocationSelector from '@/components/attendance/LocationSelector';
import FaceCapture from '@/components/attendance/FaceCapture';
import { WorkLocation, getLocationDisplayName } from '@/utils/geolocation';

const AttendanceCard = () => {
  const { todayAttendance, markAttendance, attendanceSummary, myAttendance, loading } = useAttendance();
  const { holidays, isSunday, isHoliday, getDateStatus } = useHolidays();
  const [marking, setMarking] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);

  // Check if today is Sunday or a holiday
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStatus = getDateStatus(todayStr);
  const isTodaySunday = todayStatus.type === 'sunday';
  const isTodayHoliday = todayStatus.type === 'holiday';
  const todayHoliday = todayStatus.holiday;

  // Create maps for present, absent, half-day, sunday, and holiday dates
  const { presentDates, absentDates, halfDayDates, sundayDates, holidayDates } = useMemo(() => {
    const present: Date[] = [];
    const absent: Date[] = [];
    const halfDay: Date[] = [];
    const sundays: Date[] = [];
    const holidayList: Date[] = [];

    // Get all Sundays in calendar range (current year)
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);
    for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
      if (checkIsSunday(d)) {
        sundays.push(new Date(d));
      }
    }

    // Add holidays
    holidays.forEach((h) => {
      holidayList.push(parseISO(h.date));
    });

    myAttendance.forEach((record) => {
      const date = parseISO(record.date);
      if (record.half_day) {
        halfDay.push(date);
      } else if (record.status === 'present') {
        present.push(date);
      } else if (record.status === 'absent') {
        absent.push(date);
      }
    });
    return { presentDates: present, absentDates: absent, halfDayDates: halfDay, sundayDates: sundays, holidayDates: holidayList };
  }, [myAttendance, holidays]);

  const now = new Date();
  const cutoffHour = 12; // Temporarily extended for testing
  const cutoffMinute = 0;
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
    if (!selectedLocation || !capturedFaceImage) return;
    setMarking(true);
    await markAttendance('present', undefined, selectedLocation, isHalfDay, capturedFaceImage);
    setMarking(false);
    setShowMarkDialog(false);
    setSelectedLocation(null);
    setIsHalfDay(false);
    setCapturedFaceImage(null);
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
        (isTodaySunday || isTodayHoliday) && "border-primary/50 bg-primary/5",
        todayAttendance?.status === 'present' && !isTodaySunday && !isTodayHoliday && "border-success/50 bg-success/5",
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
          {/* Sunday - Auto Present */}
          {isTodaySunday ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0 bg-primary/20 text-primary">
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base text-primary">Sunday - Day Off</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  ✓ Automatically counted as present
                </p>
              </div>
            </div>
          ) : isTodayHoliday ? (
            /* Holiday - Auto Present */
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0 bg-primary/20 text-primary">
                <PartyPopper className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base text-primary">
                  {todayHoliday?.name || 'Holiday'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  ✓ Automatically counted as present
                </p>
              </div>
            </div>
          ) : todayAttendance ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn(
                "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0",
                todayAttendance.half_day
                  ? "bg-warning/20 text-warning"
                  : todayAttendance.status === 'present' 
                    ? "bg-success/20 text-success" 
                    : "bg-destructive/20 text-destructive"
              )}>
                {todayAttendance.half_day 
                  ? <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  : todayAttendance.status === 'present' 
                    ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> 
                    : <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                }
              </div>
              <div className="min-w-0">
                <p className="font-semibold capitalize text-sm sm:text-base">
                  {todayAttendance.half_day 
                    ? 'Half Day' 
                    : todayAttendance.status === 'present' 
                      ? 'Present' 
                      : 'On Leave'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {todayAttendance.work_location && (
                    <span className="mr-1">📍 {getLocationDisplayName(todayAttendance.work_location)} •</span>
                  )}
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
                  onClick={() => setShowMarkDialog(true)}
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
              <p className="text-[10px] sm:text-xs text-muted-foreground">Mark before 12:00 PM</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Mark Attendance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <LocationSelector
              value={selectedLocation}
              onChange={setSelectedLocation}
              disabled={marking}
            />

            <Separator />

            {/* Face Capture */}
            <FaceCapture
              onCapture={setCapturedFaceImage}
              disabled={marking}
              capturedImage={capturedFaceImage}
            />

            <Separator />

            {/* Half Day Option */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-sm font-medium">Half Day</p>
                  <p className="text-xs text-muted-foreground">Mark as half-day attendance</p>
                </div>
              </div>
              <Button
                variant={isHalfDay ? "default" : "outline"}
                size="sm"
                onClick={() => setIsHalfDay(!isHalfDay)}
                className={cn(isHalfDay && "bg-warning hover:bg-warning/90")}
              >
                {isHalfDay ? 'Yes' : 'No'}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMarkDialog(false);
                  setSelectedLocation(null);
                  setIsHalfDay(false);
                  setCapturedFaceImage(null);
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMarkPresent}
                disabled={marking || !selectedLocation || !capturedFaceImage}
                className={cn(
                  "flex-1",
                  isHalfDay ? "bg-warning hover:bg-warning/90" : "bg-success hover:bg-success/90"
                )}
              >
                {marking ? 'Marking...' : isHalfDay ? 'Mark Half Day' : 'Mark Present'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span className="text-[10px] font-medium text-success">Present</span>
                    </div>
                    <p className="text-xl font-bold text-success">
                      {attendanceSummary.currentMonthPresent}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-warning" />
                      <span className="text-[10px] font-medium text-warning">Half Day</span>
                    </div>
                    <p className="text-xl font-bold text-warning">
                      {attendanceSummary.currentMonthHalfDays}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-1 mb-1">
                      <XCircle className="h-3 w-3 text-destructive" />
                      <span className="text-[10px] font-medium text-destructive">Absent</span>
                    </div>
                    <p className="text-xl font-bold text-destructive">
                      {attendanceSummary.currentMonthAbsent}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* All Time Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">All Time</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-medium text-primary">Present</span>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      {attendanceSummary.totalPresent}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-warning" />
                      <span className="text-[10px] font-medium text-warning">Half Day</span>
                    </div>
                    <p className="text-xl font-bold text-warning">
                      {attendanceSummary.totalHalfDays}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-1 mb-1">
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">Absent</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {attendanceSummary.totalAbsent}
                    </p>
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
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-xs text-muted-foreground">Half Day</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Sunday</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-xs text-muted-foreground">Holiday</span>
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
                    halfDay: halfDayDates,
                    sunday: sundayDates,
                    holiday: holidayDates,
                  }}
                  modifiersClassNames={{
                    present: "bg-success/20 text-success font-semibold hover:bg-success/30",
                    absent: "bg-destructive/20 text-destructive font-semibold hover:bg-destructive/30",
                    halfDay: "bg-warning/20 text-warning font-semibold hover:bg-warning/30",
                    sunday: "bg-primary/20 text-primary font-semibold hover:bg-primary/30",
                    holiday: "bg-secondary/50 text-secondary-foreground font-semibold hover:bg-secondary/70",
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
                  <span className="text-warning font-medium">
                    {halfDayDates.filter(d => d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()).length} half-day
                  </span>
                  {' · '}
                  <span className="text-destructive font-medium">
                    {absentDates.filter(d => d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()).length} absent
                  </span>
                  {' · '}
                  <span className="text-primary font-medium">
                    {sundayDates.filter(d => d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()).length} sundays
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
