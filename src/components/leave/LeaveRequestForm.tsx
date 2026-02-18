import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';

const LeaveRequestForm = () => {
  const [date, setDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createLeaveRequest } = useLeaveRequests();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason.trim()) return;
    setIsSubmitting(true);
    const success = await createLeaveRequest(format(date, 'yyyy-MM-dd'), reason);
    if (success) {
      setDate(undefined);
      setReason('');
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border-border/50 overflow-hidden animate-fade-in">
      <CardHeader className="border-b border-border/50 bg-muted/30 pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-orange-500" />
          Request Leave
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Reason for Leave</Label>
            <Textarea
              placeholder="Enter reason for leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!date || !reason.trim() || isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 gap-2"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Request Leave
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestForm;
