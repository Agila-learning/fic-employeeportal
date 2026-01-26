import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Employee } from '@/hooks/useEmployees';
import LocationSelector from '@/components/attendance/LocationSelector';
import { WorkLocation } from '@/utils/geolocation';
import { Separator } from '@/components/ui/separator';

interface AdminMarkAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSave: (
    employeeId: string,
    status: 'present' | 'absent',
    date: string,
    leaveReason?: string,
    isHalfDay?: boolean,
    workLocation?: WorkLocation
  ) => Promise<{ error: Error | null }>;
}

const AdminMarkAttendanceDialog = ({
  open,
  onOpenChange,
  employees,
  onSave,
}: AdminMarkAttendanceDialogProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [status, setStatus] = useState<'present' | 'absent'>('present');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [workLocation, setWorkLocation] = useState<WorkLocation | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedEmployee('');
      setStatus('present');
      setDate(new Date().toISOString().split('T')[0]);
      setLeaveReason('');
      setIsHalfDay(false);
      setWorkLocation(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!selectedEmployee) return;

    setSaving(true);
    const result = await onSave(
      selectedEmployee,
      status,
      date,
      status === 'absent' ? leaveReason : undefined,
      isHalfDay,
      status !== 'absent' ? workLocation || undefined : undefined
    );
    setSaving(false);

    if (!result.error) {
      onOpenChange(false);
    }
  };

  // Filter to only active employees
  const activeEmployees = employees.filter((e) => e.is_active !== false);

  const showLocationSelector = status === 'present' || isHalfDay;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Employee Attendance</DialogTitle>
          <DialogDescription>
            Manually mark attendance for an employee (bypasses time and GPS restrictions)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.user_id} value={emp.user_id}>
                    {emp.name || emp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={status === 'present' && !isHalfDay ? 'default' : 'outline'}
                onClick={() => { setStatus('present'); setIsHalfDay(false); }}
                className={
                  status === 'present' && !isHalfDay
                    ? 'bg-success hover:bg-success/90'
                    : ''
                }
                size="sm"
              >
                Present
              </Button>
              <Button
                type="button"
                variant={status === 'present' && isHalfDay ? 'default' : 'outline'}
                onClick={() => { setStatus('present'); setIsHalfDay(true); }}
                className={
                  status === 'present' && isHalfDay
                    ? 'bg-warning hover:bg-warning/90'
                    : ''
                }
                size="sm"
              >
                Half Day
              </Button>
              <Button
                type="button"
                variant={status === 'absent' ? 'default' : 'outline'}
                onClick={() => { setStatus('absent'); setIsHalfDay(false); setWorkLocation(null); }}
                className={
                  status === 'absent'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : ''
                }
                size="sm"
              >
                Absent
              </Button>
            </div>
          </div>

          {isHalfDay && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning">
                Half-day attendance will be recorded. This is typically used when an employee works for half the day (morning/afternoon).
              </p>
            </div>
          )}

          {showLocationSelector && (
            <>
              <Separator />
              <LocationSelector
                value={workLocation}
                onChange={setWorkLocation}
                disabled={saving}
              />
            </>
          )}

          {status === 'absent' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Leave Reason (Required)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for leave..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !selectedEmployee ||
              saving ||
              (status === 'absent' && !leaveReason.trim()) ||
              (showLocationSelector && !workLocation)
            }
          >
            {saving ? 'Saving...' : 'Mark Attendance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMarkAttendanceDialog;
