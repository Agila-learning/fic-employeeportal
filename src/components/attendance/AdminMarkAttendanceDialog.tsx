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

interface AdminMarkAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSave: (
    employeeId: string,
    status: 'present' | 'absent',
    date: string,
    leaveReason?: string
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
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedEmployee('');
      setStatus('present');
      setDate(new Date().toISOString().split('T')[0]);
      setLeaveReason('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!selectedEmployee) return;

    setSaving(true);
    const result = await onSave(
      selectedEmployee,
      status,
      date,
      status === 'absent' ? leaveReason : undefined
    );
    setSaving(false);

    if (!result.error) {
      onOpenChange(false);
    }
  };

  // Filter to only active employees
  const activeEmployees = employees.filter((e) => e.is_active !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Employee Attendance</DialogTitle>
          <DialogDescription>
            Manually mark attendance for an employee (bypasses time restrictions)
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
            <div className="flex gap-4">
              <Button
                type="button"
                variant={status === 'present' ? 'default' : 'outline'}
                onClick={() => setStatus('present')}
                className={
                  status === 'present'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }
              >
                Present
              </Button>
              <Button
                type="button"
                variant={status === 'absent' ? 'default' : 'outline'}
                onClick={() => setStatus('absent')}
                className={
                  status === 'absent'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
                }
              >
                Absent
              </Button>
            </div>
          </div>

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
              (status === 'absent' && !leaveReason.trim())
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
