import { useState, useEffect } from 'react';
import { Employee } from '@/hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

const EmployeeFormDialog = ({ open, onOpenChange, employee, onSuccess }: EmployeeFormDialogProps & { onSuccess?: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', employee_id: '', is_active: true });

  useEffect(() => {
    if (employee && open) {
      setFormData({ 
        name: employee.name, 
        email: employee.email, 
        employee_id: employee.employee_id || '', 
        is_active: employee.is_active ?? true 
      });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { 
      toast.error('Please fill in all required fields'); 
      return; 
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: formData.name, 
          email: formData.email, 
          employee_id: formData.employee_id || null, 
          is_active: formData.is_active 
        })
        .eq('user_id', employee.user_id);
      
      if (error) throw error;
      
      toast.success('Employee updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Edit Employee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2"><Label>Full Name *</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Enter full name" /></div>
          <div className="space-y-2"><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@company.com" /></div>
          <div className="space-y-2"><Label>Employee ID</Label><Input value={formData.employee_id} onChange={(e) => setFormData(p => ({ ...p, employee_id: e.target.value }))} placeholder="EMP001" /></div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div><Label className="font-medium">Account Status</Label><p className="text-sm text-muted-foreground">{formData.is_active ? 'Employee can login' : 'Employee cannot login'}</p></div>
            <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="gradient-primary" disabled={isSubmitting}>{isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
