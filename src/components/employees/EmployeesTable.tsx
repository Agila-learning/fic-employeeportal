import { useState } from 'react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import EmployeeFormDialog from './EmployeeFormDialog';
import CreateEmployeeDialog from './CreateEmployeeDialog';
import { MoreHorizontal, Pencil, UserX, UserCheck, Search, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EmployeesTable = () => {
  const { employees, toggleEmployeeStatus, deleteEmployee, isLoading, refetchEmployees } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (emp: Employee) => {
    const success = await toggleEmployeeStatus(emp.user_id, !emp.is_active);
    if (success) toast.success(`${emp.name} has been ${emp.is_active ? 'deactivated' : 'activated'}`);
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to permanently delete ${emp.name}?`)) return;
    const success = await deleteEmployee(emp.user_id);
    if (success) toast.success(`${emp.name} has been deleted`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Create Employee
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Employee ID</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Leads</TableHead>
              <TableHead className="font-semibold">Joined</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No employees found</TableCell></TableRow>
            ) : filteredEmployees.map((employee) => (
              <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-secondary">
                      <span className="text-sm font-semibold text-secondary-foreground">{employee.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <p className="font-medium">{employee.name}</p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{employee.employee_id || '-'}</TableCell>
                <TableCell className="text-sm">{employee.email}</TableCell>
                <TableCell><Badge variant={employee.is_active ? 'default' : 'destructive'}>{employee.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell className="capitalize text-sm">{employee.role}</TableCell>
                <TableCell className="font-medium">{employee.leads_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(employee.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => setEditingEmployee(employee)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(employee)}>
                        {employee.is_active ? <><UserX className="mr-2 h-4 w-4" />Deactivate</> : <><UserCheck className="mr-2 h-4 w-4" />Activate</>}
                      </DropdownMenuItem>
                      {!employee.is_active && (
                        <DropdownMenuItem onClick={() => handleDelete(employee)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingEmployee && <EmployeeFormDialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)} employee={editingEmployee} onSuccess={refetchEmployees} />}
      
      <CreateEmployeeDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        onSuccess={refetchEmployees} 
      />
    </div>
  );
};

export default EmployeesTable;
