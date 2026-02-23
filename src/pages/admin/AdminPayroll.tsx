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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, Eye, Trash2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PayslipTemplate from '@/components/payroll/PayslipTemplate';
import { format } from 'date-fns';

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
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Salary form fields
  const [form, setForm] = useState({
    designation: '',
    department: '',
    basicSalary: '',
    hra: '',
    conveyanceAllowance: '',
    medicalAllowance: '',
    specialAllowance: '',
    otherEarnings: '',
    pfEmployee: '',
    pfEmployer: '',
    esiEmployee: '',
    esiEmployer: '',
    professionalTax: '',
    tds: '',
    otherDeductions: '',
    ctc: '',
    bankName: '',
    bankAccountNumber: '',
    panNumber: '',
    uanNumber: '',
    totalWorkingDays: '30',
    daysWorked: '30',
    leaveDays: '0',
  });

  const activeEmployees = employees.filter(e => e.is_active !== false && e.role === 'employee');

  // Auto-populate form from last payslip when employee is selected
  const handleEmployeeSelect = async (userId: string) => {
    setSelectedEmployee(userId);
    const { data } = await supabase
      .from('payslips')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const ps = data[0];
      setForm({
        designation: ps.designation || '',
        department: ps.department || '',
        basicSalary: ps.basic_salary?.toString() || '',
        hra: ps.hra?.toString() || '',
        conveyanceAllowance: ps.conveyance_allowance?.toString() || '',
        medicalAllowance: ps.medical_allowance?.toString() || '',
        specialAllowance: ps.special_allowance?.toString() || '',
        otherEarnings: ps.other_earnings?.toString() || '',
        pfEmployee: ps.pf_employee?.toString() || '',
        pfEmployer: ps.pf_employer?.toString() || '',
        esiEmployee: ps.esi_employee?.toString() || '',
        esiEmployer: ps.esi_employer?.toString() || '',
        professionalTax: ps.professional_tax?.toString() || '',
        tds: ps.tds?.toString() || '',
        otherDeductions: ps.other_deductions?.toString() || '',
        ctc: ps.ctc?.toString() || '',
        bankName: ps.bank_name || '',
        bankAccountNumber: ps.bank_account_number || '',
        panNumber: ps.pan_number || '',
        uanNumber: ps.uan_number || '',
        totalWorkingDays: ps.total_working_days?.toString() || '30',
        daysWorked: ps.days_worked?.toString() || '30',
        leaveDays: ps.leave_days?.toString() || '0',
      });
      toast.info('Previous payslip details loaded automatically');
    } else {
      // Reset form for new employee
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
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (!error && data) setPayslips(data);
  };

  useEffect(() => { fetchPayslips(); }, []);

  const handleFieldChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Auto-calculate
  const basicSalary = parseFloat(form.basicSalary) || 0;
  const hra = parseFloat(form.hra) || 0;
  const conveyance = parseFloat(form.conveyanceAllowance) || 0;
  const medical = parseFloat(form.medicalAllowance) || 0;
  const special = parseFloat(form.specialAllowance) || 0;
  const otherEarn = parseFloat(form.otherEarnings) || 0;
  const grossSalary = basicSalary + hra + conveyance + medical + special + otherEarn;

  const pfEmp = parseFloat(form.pfEmployee) || 0;
  const pfEr = parseFloat(form.pfEmployer) || 0;
  const esiEmp = parseFloat(form.esiEmployee) || 0;
  const esiEr = parseFloat(form.esiEmployer) || 0;
  const pt = parseFloat(form.professionalTax) || 0;
  const tds = parseFloat(form.tds) || 0;
  const otherDed = parseFloat(form.otherDeductions) || 0;
  const totalDeductions = pfEmp + esiEmp + pt + tds + otherDed;
  const netSalary = grossSalary - totalDeductions;

  const handleGenerate = async () => {
    if (!selectedEmployee) { toast.error('Please select an employee'); return; }
    if (grossSalary <= 0) { toast.error('Please enter salary details'); return; }

    const emp = activeEmployees.find(e => e.user_id === selectedEmployee);
    if (!emp) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('payslips').upsert({
        user_id: selectedEmployee,
        employee_name: emp.name,
        employee_id: emp.employee_id || '',
        department: form.department,
        designation: form.designation,
        month: parseInt(month),
        year: parseInt(year),
        basic_salary: basicSalary,
        hra,
        conveyance_allowance: conveyance,
        medical_allowance: medical,
        special_allowance: special,
        other_earnings: otherEarn,
        pf_employee: pfEmp,
        pf_employer: pfEr,
        esi_employee: esiEmp,
        esi_employer: esiEr,
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
        generated_by: user!.id,
      }, { onConflict: 'user_id,month,year' });

      if (error) throw error;
      toast.success(`Payslip generated for ${emp.name} - ${MONTHS[parseInt(month) - 1]} ${year}`);
      fetchPayslips();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate payslip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!user) return;
    setIsBulkGenerating(true);
    let generated = 0;
    let skipped = 0;

    try {
      for (const emp of activeEmployees) {
        // Get latest payslip for this employee
        const { data } = await supabase
          .from('payslips')
          .select('*')
          .eq('user_id', emp.user_id)
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1);

        if (!data || data.length === 0) {
          skipped++;
          continue;
        }

        const ps = data[0];

        // Check if payslip already exists for this month/year
        const { data: existing } = await supabase
          .from('payslips')
          .select('id')
          .eq('user_id', emp.user_id)
          .eq('month', parseInt(month))
          .eq('year', parseInt(year))
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        const gross = (ps.basic_salary || 0) + (ps.hra || 0) + (ps.conveyance_allowance || 0) +
          (ps.medical_allowance || 0) + (ps.special_allowance || 0) + (ps.other_earnings || 0);
        const deductions = (ps.pf_employee || 0) + (ps.esi_employee || 0) +
          (ps.professional_tax || 0) + (ps.tds || 0) + (ps.other_deductions || 0);

        const { error } = await supabase.from('payslips').insert({
          user_id: emp.user_id,
          employee_name: emp.name,
          employee_id: emp.employee_id || '',
          department: ps.department,
          designation: ps.designation,
          month: parseInt(month),
          year: parseInt(year),
          basic_salary: ps.basic_salary,
          hra: ps.hra,
          conveyance_allowance: ps.conveyance_allowance,
          medical_allowance: ps.medical_allowance,
          special_allowance: ps.special_allowance,
          other_earnings: ps.other_earnings,
          pf_employee: ps.pf_employee,
          pf_employer: ps.pf_employer,
          esi_employee: ps.esi_employee,
          esi_employer: ps.esi_employer,
          professional_tax: ps.professional_tax,
          tds: ps.tds,
          other_deductions: ps.other_deductions,
          gross_salary: gross,
          total_deductions: deductions,
          net_salary: gross - deductions,
          ctc: ps.ctc,
          bank_name: ps.bank_name,
          bank_account_number: ps.bank_account_number,
          pan_number: ps.pan_number,
          uan_number: ps.uan_number,
          total_working_days: parseInt(form.totalWorkingDays) || 30,
          days_worked: parseInt(form.daysWorked) || 30,
          leave_days: parseInt(form.leaveDays) || 0,
          generated_by: user.id,
        });

        if (!error) generated++;
      }

      if (generated > 0) {
        toast.success(`Bulk generated ${generated} payslip(s) for ${MONTHS[parseInt(month) - 1]} ${year}`);
        fetchPayslips();
      }
      if (skipped > 0) {
        toast.info(`${skipped} employee(s) skipped (no previous data or already exists)`);
      }
      if (generated === 0 && skipped === 0) {
        toast.warning('No active employees found');
      }
    } catch (err: any) {
      toast.error(err.message || 'Bulk generation failed');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('payslips').delete().eq('id', id);
    if (!error) { toast.success('Payslip deleted'); fetchPayslips(); }
    else toast.error('Failed to delete');
  };

  const getEmployeeName = (userId: string) => {
    return employees.find(e => e.user_id === userId)?.name || 'Unknown';
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-sm text-muted-foreground">Generate and manage employee payslips</p>
        </div>

        {/* Generate Payslip Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Generate Payslip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee & Period Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Select Employee *</Label>
                <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map(emp => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.name} {emp.employee_id ? `(${emp.employee_id})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Month *</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CTC (Annual)</Label>
                <Input type="number" placeholder="₹" value={form.ctc} onChange={e => handleFieldChange('ctc', e.target.value)} />
              </div>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={form.department} onChange={e => handleFieldChange('department', e.target.value)} placeholder="e.g. BDA, HR" />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={form.designation} onChange={e => handleFieldChange('designation', e.target.value)} placeholder="e.g. Executive" />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={form.bankName} onChange={e => handleFieldChange('bankName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bank Account No.</Label>
                <Input value={form.bankAccountNumber} onChange={e => handleFieldChange('bankAccountNumber', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>PAN Number</Label>
                <Input value={form.panNumber} onChange={e => handleFieldChange('panNumber', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>UAN Number</Label>
                <Input value={form.uanNumber} onChange={e => handleFieldChange('uanNumber', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Working Days</Label>
                <Input type="number" value={form.totalWorkingDays} onChange={e => handleFieldChange('totalWorkingDays', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Days Worked</Label>
                <Input type="number" value={form.daysWorked} onChange={e => handleFieldChange('daysWorked', e.target.value)} />
              </div>
            </div>

            {/* Earnings */}
            <div>
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3">💰 Earnings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Basic Salary *</Label>
                  <Input type="number" placeholder="₹" value={form.basicSalary} onChange={e => handleFieldChange('basicSalary', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>HRA</Label>
                  <Input type="number" placeholder="₹" value={form.hra} onChange={e => handleFieldChange('hra', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Conveyance Allowance</Label>
                  <Input type="number" placeholder="₹" value={form.conveyanceAllowance} onChange={e => handleFieldChange('conveyanceAllowance', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Medical Allowance</Label>
                  <Input type="number" placeholder="₹" value={form.medicalAllowance} onChange={e => handleFieldChange('medicalAllowance', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Special Allowance</Label>
                  <Input type="number" placeholder="₹" value={form.specialAllowance} onChange={e => handleFieldChange('specialAllowance', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Other Earnings</Label>
                  <Input type="number" placeholder="₹" value={form.otherEarnings} onChange={e => handleFieldChange('otherEarnings', e.target.value)} />
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-emerald-600">Gross Salary: ₹{grossSalary.toLocaleString('en-IN')}</p>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">📉 Deductions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>PF (Employee)</Label>
                  <Input type="number" placeholder="₹" value={form.pfEmployee} onChange={e => handleFieldChange('pfEmployee', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>PF (Employer)</Label>
                  <Input type="number" placeholder="₹" value={form.pfEmployer} onChange={e => handleFieldChange('pfEmployer', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ESI (Employee)</Label>
                  <Input type="number" placeholder="₹" value={form.esiEmployee} onChange={e => handleFieldChange('esiEmployee', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ESI (Employer)</Label>
                  <Input type="number" placeholder="₹" value={form.esiEmployer} onChange={e => handleFieldChange('esiEmployer', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Professional Tax</Label>
                  <Input type="number" placeholder="₹" value={form.professionalTax} onChange={e => handleFieldChange('professionalTax', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>TDS</Label>
                  <Input type="number" placeholder="₹" value={form.tds} onChange={e => handleFieldChange('tds', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Other Deductions</Label>
                  <Input type="number" placeholder="₹" value={form.otherDeductions} onChange={e => handleFieldChange('otherDeductions', e.target.value)} />
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-red-600">Total Deductions: ₹{totalDeductions.toLocaleString('en-IN')}</p>
            </div>

            {/* Net Salary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-primary/10 border">
              <div>
                <p className="text-lg font-bold text-foreground">Net Salary: ₹{netSalary.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Gross: ₹{grossSalary.toLocaleString('en-IN')} - Deductions: ₹{totalDeductions.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={isSubmitting} className="gradient-primary">
                  <FileText className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Generating...' : 'Generate Payslip'}
                </Button>
                <Button onClick={handleBulkGenerate} disabled={isBulkGenerating} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  {isBulkGenerating ? 'Generating All...' : 'Bulk Generate All'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Payslips List */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payslips generated yet</TableCell></TableRow>
                  ) : payslips.map((ps, idx) => (
                    <TableRow key={ps.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{ps.employee_name}</TableCell>
                      <TableCell><Badge variant="outline">{MONTHS[ps.month - 1]} {ps.year}</Badge></TableCell>
                      <TableCell>₹{Number(ps.gross_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-red-600">₹{Number(ps.total_deductions).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">₹{Number(ps.net_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewPayslip(ps)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(ps.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Payslip Dialog */}
      <Dialog open={!!viewPayslip} onOpenChange={() => setViewPayslip(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip Preview</DialogTitle>
          </DialogHeader>
          {viewPayslip && <PayslipTemplate payslip={viewPayslip} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPayroll;
