import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeesTable from '@/components/employees/EmployeesTable';

const AdminEmployees = () => {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage employee accounts</p>
        </div>
        <EmployeesTable />
      </div>
    </DashboardLayout>
  );
};

export default AdminEmployees;
