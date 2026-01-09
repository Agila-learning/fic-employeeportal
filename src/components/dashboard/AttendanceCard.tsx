import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAttendance } from '@/hooks/useAttendance';
import { CheckCircle, XCircle, Clock, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const AttendanceCard = () => {
  const { todayAttendance, markAttendance, canMarkAttendance, loading } = useAttendance();
  const [marking, setMarking] = useState(false);

  const now = new Date();
  const cutoffHour = 11;
  const isBeforeCutoff = now.getHours() < cutoffHour;
  const timeRemaining = isBeforeCutoff 
    ? `${cutoffHour - now.getHours() - 1}h ${60 - now.getMinutes()}m remaining`
    : 'Time exceeded';

  const handleMarkAttendance = async (status: 'present' | 'absent') => {
    setMarking(true);
    await markAttendance(status);
    setMarking(false);
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
    <Card className={cn(
      "border-border/50 overflow-hidden transition-all duration-300",
      todayAttendance?.status === 'present' && "border-green-500/50 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10",
      todayAttendance?.status === 'absent' && "border-red-500/50 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayAttendance ? (
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              todayAttendance.status === 'present' 
                ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            )}>
              {todayAttendance.status === 'present' 
                ? <CheckCircle className="h-7 w-7" /> 
                : <XCircle className="h-7 w-7" />
              }
            </div>
            <div>
              <p className="font-semibold capitalize text-lg">
                {todayAttendance.status === 'present' ? 'Present' : 'Absent'}
              </p>
              <p className="text-sm text-muted-foreground">
                Marked at {new Date(todayAttendance.marked_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ) : isBeforeCutoff ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeRemaining}</span>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleMarkAttendance('present')}
                disabled={marking}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Present
              </Button>
              <Button 
                onClick={() => handleMarkAttendance('absent')}
                disabled={marking}
                variant="outline"
                className="flex-1 border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2"
              >
                <XCircle className="h-4 w-4" />
                Absent
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <XCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Attendance window closed</p>
            <p className="text-xs text-muted-foreground mt-1">Mark attendance before 11:00 AM</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;
