import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenses } from '@/hooks/useExpenses';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Download, IndianRupee, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx-js-style';

const CATEGORIES = ['Travel', 'Food', 'Office Supplies', 'Communication', 'Transport', 'Miscellaneous'];

const EmployeeExpenses = () => {
  const { expenses, credits, loading, addExpense, deleteExpense, addCredit, deleteCredit } = useExpenses();
  
  // Expense form
  const [expDate, setExpDate] = useState<Date>(new Date());
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Travel');
  
  // Credit form
  const [credDate, setCredDate] = useState<Date>(new Date());
  const [credAmount, setCredAmount] = useState('');
  const [credGivenBy, setCredGivenBy] = useState('');
  const [credRole, setCredRole] = useState('manager');
  const [credDesc, setCredDesc] = useState('');

  const handleAddExpense = async () => {
    if (!expAmount || !expDesc) return;
    await addExpense({ expense_date: format(expDate, 'yyyy-MM-dd'), amount: parseFloat(expAmount), description: expDesc, category: expCategory });
    setExpAmount(''); setExpDesc('');
  };

  const handleAddCredit = async () => {
    if (!credAmount || !credGivenBy) return;
    await addCredit({ credit_date: format(credDate, 'yyyy-MM-dd'), amount: parseFloat(credAmount), given_by: credGivenBy, given_by_role: credRole, description: credDesc || undefined });
    setCredAmount(''); setCredGivenBy(''); setCredDesc('');
  };

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const filterExpensesByRange = (items: typeof expenses, range: 'daily' | 'weekly' | 'monthly') => {
    return items.filter(item => {
      const d = parseISO(item.expense_date);
      if (range === 'daily') return format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      if (range === 'weekly') return isWithinInterval(d, { start: weekStart, end: weekEnd });
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  };

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredited = credits.reduce((s, c) => s + Number(c.amount), 0);
  const dailySpent = filterExpensesByRange(expenses, 'daily').reduce((s, e) => s + Number(e.amount), 0);
  const weeklySpent = filterExpensesByRange(expenses, 'weekly').reduce((s, e) => s + Number(e.amount), 0);
  const monthlySpent = filterExpensesByRange(expenses, 'monthly').reduce((s, e) => s + Number(e.amount), 0);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 }, fill: { fgColor: { rgb: '1A5276' } }, alignment: { horizontal: 'center' as const }, border: { bottom: { style: 'thin' as const, color: { rgb: '000000' } } } };
    
    // Summary sheet
    const summaryData = [
      ['Expense Summary Report'],
      ['Generated:', format(new Date(), 'PPP')],
      [''],
      ['Metric', 'Amount (₹)'],
      ['Total Spent', totalSpent],
      ['Total Credited', totalCredited],
      ['Balance Remaining', totalCredited - totalSpent],
      [''],
      ['Daily Spent', dailySpent],
      ['Weekly Spent', weeklySpent],
      ['Monthly Spent', monthlySpent],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];
    // Style title
    if (ws1['A1']) ws1['A1'].s = { font: { bold: true, sz: 16, color: { rgb: '1A5276' } } };
    // Style headers
    if (ws1['A4']) ws1['A4'].s = headerStyle;
    if (ws1['B4']) ws1['B4'].s = headerStyle;
    // Color balance
    const balance = totalCredited - totalSpent;
    if (ws1['B7']) ws1['B7'].s = { font: { bold: true, color: { rgb: balance >= 0 ? '27AE60' : 'E74C3C' } }, fill: { fgColor: { rgb: balance >= 0 ? 'D5F5E3' : 'FADBD8' } } };
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Expenses sheet
    const expHeaders = ['Date', 'Category', 'Description', 'Amount (₹)'];
    const expRows = expenses.map(e => [format(parseISO(e.expense_date), 'dd-MMM-yyyy'), e.category, e.description, Number(e.amount)]);
    const ws2 = XLSX.utils.aoa_to_sheet([expHeaders, ...expRows]);
    ws2['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 35 }, { wch: 15 }];
    for (let c = 0; c < expHeaders.length; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (ws2[cell]) ws2[cell].s = headerStyle;
    }
    // Alternate row colors
    expRows.forEach((_, i) => {
      const bgColor = i % 2 === 0 ? 'F8F9FA' : 'FFFFFF';
      for (let c = 0; c < 4; c++) {
        const cell = XLSX.utils.encode_cell({ r: i + 1, c });
        if (ws2[cell]) ws2[cell].s = { fill: { fgColor: { rgb: bgColor } }, border: { bottom: { style: 'thin' as const, color: { rgb: 'DEE2E6' } } } };
      }
    });
    XLSX.utils.book_append_sheet(wb, ws2, 'Expenses');

    // Credits sheet
    const credHeaders = ['Date', 'Given By', 'Role', 'Description', 'Amount (₹)'];
    const credRows = credits.map(c => [format(parseISO(c.credit_date), 'dd-MMM-yyyy'), c.given_by, c.given_by_role, c.description || '-', Number(c.amount)]);
    const ws3 = XLSX.utils.aoa_to_sheet([credHeaders, ...credRows]);
    ws3['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 15 }];
    for (let c = 0; c < credHeaders.length; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (ws3[cell]) ws3[cell].s = headerStyle;
    }
    credRows.forEach((_, i) => {
      const bgColor = i % 2 === 0 ? 'EBF5FB' : 'FFFFFF';
      for (let c = 0; c < 5; c++) {
        const cell = XLSX.utils.encode_cell({ r: i + 1, c });
        if (ws3[cell]) ws3[cell].s = { fill: { fgColor: { rgb: bgColor } }, border: { bottom: { style: 'thin' as const, color: { rgb: 'DEE2E6' } } } };
      }
    });
    XLSX.utils.book_append_sheet(wb, ws3, 'Credits');

    XLSX.writeFile(wb, `My_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expense Tracker</h1>
            <p className="text-muted-foreground text-sm">Track your daily office expenses and credits</p>
          </div>
          <Button onClick={exportExcel} className="gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4" /> Total Spent</div>
              <p className="text-2xl font-bold text-destructive mt-1">₹{totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Total Credited</div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCredited.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> Balance</div>
              <p className={cn("text-2xl font-bold mt-1", totalCredited - totalSpent >= 0 ? "text-emerald-600" : "text-destructive")}>₹{(totalCredited - totalSpent).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><IndianRupee className="h-4 w-4" /> Today</div>
              <p className="text-2xl font-bold mt-1">₹{dailySpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Week: ₹{weeklySpent.toLocaleString()} · Month: ₹{monthlySpent.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="expenses">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="credits">Credits Received</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            {/* Add Expense Form */}
            <Card>
              <CardHeader><CardTitle className="text-base">Add Expense</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(expDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={expDate} onSelect={(d) => d && setExpDate(d)} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={expCategory} onValueChange={setExpCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input type="number" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <Input placeholder="What was it for?" value={expDesc} onChange={e => setExpDesc(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium invisible">Add</label>
                    <Button onClick={handleAddExpense} className="w-full gap-2" disabled={!expAmount || !expDesc}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : expenses.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No expenses recorded yet</TableCell></TableRow>
                    ) : expenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{format(parseISO(e.expense_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">{e.category}</span></TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">₹{Number(e.amount).toLocaleString()}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteExpense(e.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="space-y-4">
            {/* Add Credit Form */}
            <Card>
              <CardHeader><CardTitle className="text-base">Add Credit Received</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(credDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={credDate} onSelect={(d) => d && setCredDate(d)} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Given By</label>
                    <Input placeholder="Name" value={credGivenBy} onChange={e => setCredGivenBy(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={credRole} onValueChange={setCredRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="ceo">CEO</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input type="number" placeholder="0.00" value={credAmount} onChange={e => setCredAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium invisible">Add</label>
                    <Button onClick={handleAddCredit} className="w-full gap-2" disabled={!credAmount || !credGivenBy}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <Input placeholder="Description (optional)" value={credDesc} onChange={e => setCredDesc(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Credits Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Given By</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No credits recorded yet</TableCell></TableRow>
                    ) : credits.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{format(parseISO(c.credit_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{c.given_by}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium capitalize dark:bg-blue-900/30 dark:text-blue-400">{c.given_by_role}</span></TableCell>
                        <TableCell>{c.description || '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">₹{Number(c.amount).toLocaleString()}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteCredit(c.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeExpenses;
