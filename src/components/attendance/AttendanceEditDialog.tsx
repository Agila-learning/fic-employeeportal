import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Attendance } from '@/hooks/useAttendance';

interface AttendanceEditDialogProps {
  attendance: Attendance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, status: 'present' | 'absent', leaveReason?: string) => Promise<{ error: Error | null }>;
}

const AttendanceEditDialog = ({ attendance, open, onOpenChange, onSave }: AttendanceEditDialogProps) => {
  const [status, setStatus] = useState<'present' | 'absent'>(attendance?.status || 'present');
  const [leaveReason, setLeaveReason] = useState(attendance?.leave_reason || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!attendance) return;
    setSaving(true);
    const result = await onSave(attendance.id, status, leaveReason);
    setSaving(false);
    if (!result.error) {
      onOpenChange(false);
    }
  };

  // Reset form when attendance changes
  useState(() => {
    if (attendance) {
      setStatus(attendance.status);
      setLeaveReason(attendance.leave_reason || '');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <p className="text-sm font-medium text-foreground">{attendance?.user_name}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <p className="text-sm font-medium text-foreground">
              {attendance?.date && new Date(attendance.date).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'present' | 'absent')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'absent' && (
            <div className="space-y-2">
              <Label>Leave Reason *</Label>
              <Textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Enter reason for leave..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceEditDialog;
