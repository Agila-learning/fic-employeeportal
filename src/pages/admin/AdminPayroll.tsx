import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { operationService } from '@/api/operationService';
import { toast } from 'sonner';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PayslipTemplate from '@/components/payroll/PayslipTemplate';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AdminPayroll = () => {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [payslips, setPayslips] = useState<any[]>([]);
  const [viewPayslip, setViewPayslip] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    designation: '', department: '', basicSalary: '', hra: '',
    conveyanceAllowance: '', medicalAllowance: '', specialAllowance: '',
    otherEarnings: '', pfEmployee: '', pfEmployer: '', esiEmployee: '',
    esiEmployer: '', professionalTax: '', tds: '', otherDeductions: '',
    ctc: '', bankName: '', bankAccountNumber: '', panNumber: '',
    uanNumber: '', totalWorkingDays: '30', daysWorked: '30', leaveDays: '0',
  });

  const activeEmployees = employees.filter(e => e.is_active !== false && e.role === 'employee');

  const handleEmployeeSelect = async (userId: string) => {
    setSelectedEmployee(userId);
    try {
      const data = await operationService.getLatestPayslip(userId);
      if (data) {
        setForm({
          designation: data.designation || '',
          department: data.department || '',
          basicSalary: data.basic_salary?.toString() || '',
          hra: data.hra?.toString() || '',
          conveyanceAllowance: data.conveyance_allowance?.toString() || '',
          medicalAllowance: data.medical_allowance?.toString() || '',
          specialAllowance: data.special_allowance?.toString() || '',
          otherEarnings: data.other_earnings?.toString() || '',
          pfEmployee: data.pf_employee?.toString() || '',
          pfEmployer: data.pf_employer?.toString() || '',
          esiEmployee: data.esi_employee?.toString() || '',
          esiEmployer: data.esi_employer?.toString() || '',
          professionalTax: data.professional_tax?.toString() || '',
          tds: data.tds?.toString() || '',
          otherDeductions: data.other_deductions?.toString() || '',
          ctc: data.ctc?.toString() || '',
          bankName: data.bank_name || '',
          bankAccountNumber: data.bank_account_number || '',
          panNumber: data.pan_number || '',
          uanNumber: data.uan_number || '',
          totalWorkingDays: data.total_working_days?.toString() || '30',
          daysWorked: data.days_worked?.toString() || '30',
          leaveDays: data.leave_days?.toString() || '0',
        });
        toast.info('Previous payslip details loaded');
      }
    } catch (error) {
      setForm({
        designation: '', department: '', basicSalary: '', hra: '',
        conveyanceAllowance: '', medicalAllowance: '', specialAllowance: '',
        otherEarnings: '', pfEmployee: '', pfEmployer: '', esiEmployee: '',
        esiEmployer: '', professionalTax: '', tds: '', otherDeductions: '',
        ctc: '', bankName: '', bankAccountNumber: '', panNumber: '',
        uanNumber: '', totalWorkingDays: '30', daysWorked: '30', leaveDays: '0',
      });
    }
  };

  const fetchPayslips = async () => {
    try {
      const data = await operationService.getAllPayslips();
      setPayslips(data || []);
    } catch (error) {
      toast.error('Failed to fetch payslips');
    }
  };

  useEffect(() => { fetchPayslips(); }, []);

  const handleFieldChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const basicSalaryValue = parseFloat(form.basicSalary) || 0;
  const hraValue = parseFloat(form.hra) || 0;
  const conveyanceValue = parseFloat(form.conveyanceAllowance) || 0;
  const medicalValue = parseFloat(form.medicalAllowance) || 0;
  const specialValue = parseFloat(form.specialAllowance) || 0;
  const otherEarnValue = parseFloat(form.otherEarnings) || 0;
  const grossSalary = basicSalaryValue + hraValue + conveyanceValue + medicalValue + specialValue + otherEarnValue;

  const pfEmp = parseFloat(form.pfEmployee) || 0;
  const pt = parseFloat(form.professionalTax) || 0;
  const tds = parseFloat(form.tds) || 0;
  const esiEmp = parseFloat(form.esiEmployee) || 0;
  const otherDed = parseFloat(form.otherDeductions) || 0;
  const totalDeductions = pfEmp + pt + tds + esiEmp + otherDed;
  const netSalary = grossSalary - totalDeductions;

  const handleGenerate = async () => {
    if (!selectedEmployee) { toast.error('Please select an employee'); return; }
    const emp = activeEmployees.find(e => e.user_id === selectedEmployee || (e as any)._id === selectedEmployee);
    if (!emp) return;

    setIsSubmitting(true);
    try {
      await operationService.createPayslip({
        user_id: selectedEmployee,
        employee_name: emp.name,
        employee_id: emp.employee_id || '',
        department: form.department,
        designation: form.designation,
        month: parseInt(month),
        year: parseInt(year),
        basic_salary: basicSalaryValue,
        hra: hraValue,
        conveyance_allowance: conveyanceValue,
        medical_allowance: medicalValue,
        special_allowance: specialValue,
        other_earnings: otherEarnValue,
        pf_employee: pfEmp,
        pf_employer: parseFloat(form.pfEmployer) || 0,
        esi_employee: esiEmp,
        esi_employer: parseFloat(form.esiEmployer) || 0,
        professional_tax: pt,
        tds,
        other_deductions: otherDed,
        gross_salary: grossSalary,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        ctc: parseFloat(form.ctc) || 0,
        bank_name: form.bankName,
        bank_account_number: form.bankAccountNumber,
        pan_number: form.panNumber,
        uan_number: form.uanNumber,
        total_working_days: parseInt(form.totalWorkingDays) || 30,
        days_worked: parseInt(form.daysWorked) || 30,
        leave_days: parseInt(form.leaveDays) || 0,
        generated_by: user?.id
      });
      toast.success('Payslip generated');
      fetchPayslips();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await operationService.deletePayslip(id);
      toast.success('Deleted');
      fetchPayslips();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading">Payroll Management</h1>
          <p className="text-sm text-muted-foreground">Manage employee salaries and payslips</p>
        </div>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Generate Payslip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger className="bg-background/50 border-border/50"><SelectValue placeholder="Choose employee" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(emp => (
                      <SelectItem key={emp.user_id || (emp as any)._id} value={emp.user_id || (emp as any)._id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m, i) => (<SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={year} onChange={e => setYear(e.target.value)} className="bg-background/50 border-border/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Basic Salary</Label>
                <Input type="number" value={form.basicSalary} onChange={e => handleFieldChange('basicSalary', e.target.value)} placeholder="₹" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>HRA</Label>
                <Input type="number" value={form.hra} onChange={e => handleFieldChange('hra', e.target.value)} placeholder="₹" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Conveyance</Label>
                <Input type="number" value={form.conveyanceAllowance} onChange={e => handleFieldChange('conveyanceAllowance', e.target.value)} placeholder="₹" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Medical</Label>
                <Input type="number" value={form.medicalAllowance} onChange={e => handleFieldChange('medicalAllowance', e.target.value)} placeholder="₹" className="bg-background/50 border-border/50" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div>
                <p className="text-lg font-bold text-primary font-heading">Net Salary: ₹{netSalary.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Gross: ₹{grossSalary.toLocaleString('en-IN')} - Ded: ₹{totalDeductions.toLocaleString('en-IN')}</p>
              </div>
              <Button onClick={handleGenerate} disabled={isSubmitting} className="gradient-primary shadow-lg shadow-primary/20 min-w-[140px]">
                {isSubmitting ? 'Generating...' : 'Generate Payslip'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-lg">Generated Payslips</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map(ps => (
                    <TableRow key={ps.id || ps._id} className="border-border/50 group">
                      <TableCell className="font-medium">{ps.employee_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 transition-colors border-none">{MONTHS[ps.month - 1]} {ps.year}</Badge></TableCell>
                      <TableCell className="font-semibold text-emerald-600">₹{Number(ps.net_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setViewPayslip(ps)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(ps.id || ps._id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payslips.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No payslips found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewPayslip} onOpenChange={() => setViewPayslip(null)}>
        <DialogContent className="max-w-4xl border-none p-0 overflow-hidden shadow-2xl">
          <div className="p-6 bg-card">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-heading">Payslip Preview</DialogTitle>
            </DialogHeader>
            <div className="border rounded-xl overflow-hidden shadow-inner bg-slate-50">
              {viewPayslip && <PayslipTemplate payslip={viewPayslip} />}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewPayslip(null)}>Close</Button>
              <Button className="gradient-primary" onClick={() => window.print()}>Download PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPayroll;
