import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeeService } from '@/api/employeeService';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, User, IdCard, Shield } from 'lucide-react';

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateEmployeeDialog = ({ open, onOpenChange, onSuccess }: CreateEmployeeDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employee_id: '',
    role: 'employee' as 'admin' | 'employee'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Name, email, and password are required');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await employeeService.createEmployee({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        employee_id: formData.employee_id || null,
        role: formData.role
      });

      toast.success(`Employee ${formData.name} created successfully!`);
      setFormData({ name: '', email: '', password: '', employee_id: '', role: 'employee' });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create Employee Account
          </DialogTitle>
          <DialogDescription>
            Create a new employee account. They will be able to log in immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Full Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Password * (min 6 characters)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_id" className="flex items-center gap-2">
              <IdCard className="h-4 w-4 text-muted-foreground" />
              Employee ID (Optional)
            </Label>
            <Input
              id="employee_id"
              placeholder="e.g., EMP001"
              value={formData.employee_id}
              onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'admin' | 'employee') => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Create Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployeeDialog;
