import { useState, useEffect } from 'react';
import { Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  mode: 'add' | 'edit';
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const EmployeeFormDialog = ({ open, onOpenChange, employee, mode }: EmployeeFormDialogProps) => {
  const { setEmployees } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        password: '',
        isActive: employee.isActive,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        isActive: true,
      });
    }
  }, [employee, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (mode === 'add') {
      if (!formData.password) {
        toast.error('Password is required for new employees');
        return;
      }
      
      const newEmployee: Employee = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        role: 'employee',
        isActive: formData.isActive,
        createdAt: new Date(),
        leadsCount: 0,
      };
      
      setEmployees(prev => [...prev, newEmployee]);
      toast.success('Employee added successfully');
    } else if (employee) {
      setEmployees(prev => prev.map(emp => 
        emp.id === employee.id 
          ? { ...emp, name: formData.name, email: formData.email, isActive: formData.isActive }
          : emp
      ));
      toast.success('Employee updated successfully');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === 'add' ? 'Add New Employee' : 'Edit Employee'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@bda.com"
            />
          </div>

          {mode === 'add' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label htmlFor="isActive" className="font-medium">Account Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.isActive ? 'Employee can login' : 'Employee cannot login'}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary">
              {mode === 'add' ? 'Add Employee' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
