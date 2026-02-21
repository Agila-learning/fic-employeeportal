import { useState, useEffect, useRef, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { CalendarIcon, Download, TrendingDown, TrendingUp, Wallet, Users, CheckCircle, XCircle, ExternalLink, Clock, Plus, Trash2, IndianRupee, Upload, FileImage, UserCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx-js-style';

const CATEGORIES = [
  'Tea/Coffee', 'Snacks', 'Pooja Materials', 'Office Use Things',
  'Sanitary Products', 'Food', 'Transport', 'Travel',
  'Office Supplies', 'Courier Charges', 'Petrol', 'Others'
];

interface AdminExpenseRow {
  id: string;
  user_id: string;
  expense_date: string;
  amount: number;
  description: string;
  category: string;
  receipt_url: string | null;
  approval_status: string;
  paid_to: string | null;
  created_at: string;
}

interface AdminCreditRow {
  id: string;
  user_id: string;
  credit_date: string;
  amount: number;
  given_by: string;
  given_by_role: string;
  description: string | null;
  created_at: string;
}

interface ExpenseWithProfile {
  id: string;
  user_id: string;
  expense_date: string;
  amount: number;
  description: string;
  category: string;
  receipt_url: string | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  user_name?: string;
}

interface CreditWithProfile {
  id: string;
  user_id: string;
  credit_date: string;
  amount: number;
  given_by: string;
  given_by_role: string;
  description: string | null;
  user_name?: string;
}

// ─── Admin's Personal Expense Tracker ─────────────────────────────
const AdminMyExpenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<AdminExpenseRow[]>([]);
  const [credits, setCredits] = useState<AdminCreditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');

  const [expDate, setExpDate] = useState<Date>(new Date());
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Tea/Coffee');
  const [customCategory, setCustomCategory] = useState('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [credDate, setCredDate] = useState<Date>(new Date());
  const [credAmount, setCredAmount] = useState('');
  const [credGivenBy, setCredGivenBy] = useState('');
  const [credRole, setCredRole] = useState('manager');
  const [credDesc, setCredDesc] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [expRes, credRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('expense_date', { ascending: false }),
      supabase.from('expense_credits').select('*').eq('user_id', user.id).order('credit_date', { ascending: false }),
    ]);
    if (expRes.error) toast({ title: 'Error fetching expenses', description: expRes.error.message, variant: 'destructive' });
    else setExpenses(expRes.data || []);
    if (credRes.error) toast({ title: 'Error fetching credits', description: credRes.error.message, variant: 'destructive' });
    else setCredits(credRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('expense-receipts').upload(filePath, file, { upsert: false });
    if (error) { toast({ title: 'Error uploading receipt', description: error.message, variant: 'destructive' }); return null; }
    return filePath;
  };

  const handleAddExpense = async () => {
    if (!expAmount || !expDesc || !user) return;
    setUploading(true);
    let receiptPath: string | null = null;
    if (receiptFile) receiptPath = await uploadReceipt(receiptFile);
    const finalCategory = expCategory === 'Others' ? (customCategory || 'Others') : expCategory;
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id, expense_date: format(expDate, 'yyyy-MM-dd'), amount: parseFloat(expAmount),
      description: expDesc, category: finalCategory, receipt_url: receiptPath, approval_status: 'approved',
      paid_to: expPaidTo || null,
    });
    if (error) toast({ title: 'Error adding expense', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Expense added' }); fetchData(); }
    setExpAmount(''); setExpDesc(''); setExpPaidTo(''); setReceiptFile(null); setCustomCategory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Expense deleted' }); fetchData(); }
  };

  const handleAddCredit = async () => {
    if (!credAmount || !credGivenBy || !user) return;
    const { error } = await supabase.from('expense_credits').insert({
      user_id: user.id, credit_date: format(credDate, 'yyyy-MM-dd'), amount: parseFloat(credAmount),
      given_by: credGivenBy, given_by_role: credRole, description: credDesc || null,
    });
    if (error) toast({ title: 'Error adding credit', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Credit added' }); fetchData(); }
    setCredAmount(''); setCredGivenBy(''); setCredDesc('');
  };

  const handleDeleteCredit = async (id: string) => {
    const { error } = await supabase.from('expense_credits').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Credit deleted' }); fetchData(); }
  };

  const handleViewReceipt = async (path: string) => {
    const { data } = await supabase.storage.from('expense-receipts').createSignedUrl(path, 900);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const filterByTime = <T extends { expense_date?: string; credit_date?: string }>(items: T[], view: string): T[] => {
    if (view === 'all') return items;
    return items.filter(item => {
      const d = parseISO((item as any).expense_date || (item as any).credit_date);
      if (view === 'daily') return format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      if (view === 'weekly') return isWithinInterval(d, { start: weekStart, end: weekEnd });
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  };

  const filteredExpenses = filterByTime(expenses, timeView);
  const filteredCredits = filterByTime(credits, timeView);

  const totalDebit = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredit = filteredCredits.reduce((s, c) => s + Number(c.amount), 0);
  const balance = totalCredit - totalDebit;

  // Day/week/month summaries (always computed from all data)
  const dailyDebit = expenses.filter(e => format(parseISO(e.expense_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')).reduce((s, e) => s + Number(e.amount), 0);
  const weeklyDebit = expenses.filter(e => isWithinInterval(parseISO(e.expense_date), { start: weekStart, end: weekEnd })).reduce((s, e) => s + Number(e.amount), 0);
  const monthlyDebit = expenses.filter(e => isWithinInterval(parseISO(e.expense_date), { start: monthStart, end: monthEnd })).reduce((s, e) => s + Number(e.amount), 0);

  const dailyCredit = credits.filter(c => format(parseISO(c.credit_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')).reduce((s, c) => s + Number(c.amount), 0);
  const weeklyCredit = credits.filter(c => isWithinInterval(parseISO(c.credit_date), { start: weekStart, end: weekEnd })).reduce((s, c) => s + Number(c.amount), 0);
  const monthlyCredit = credits.filter(c => isWithinInterval(parseISO(c.credit_date), { start: monthStart, end: monthEnd })).reduce((s, c) => s + Number(c.amount), 0);

  // Category-wise breakdown for current time view
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filteredExpenses.forEach(e => {
      if (!map[e.category]) map[e.category] = { amount: 0, count: 0 };
      map[e.category].amount += Number(e.amount);
      map[e.category].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [filteredExpenses]);

  // Paid-to breakdown
  const paidToBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const key = e.paid_to || 'Not specified';
      map[key] = (map[key] || 0) + Number(e.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const hStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 }, fill: { fgColor: { rgb: '1A5276' } }, alignment: { horizontal: 'center' as const }, border: { bottom: { style: 'thin' as const, color: { rgb: '000000' } } } };

    const allDebit = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const allCredit = credits.reduce((s, c) => s + Number(c.amount), 0);
    const summaryData = [
      ['Admin Expense Report'], ['Generated:', format(new Date(), 'PPP')], [''],
      ['Period', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
      ['Today', dailyDebit, dailyCredit, dailyCredit - dailyDebit],
      ['This Week', weeklyDebit, weeklyCredit, weeklyCredit - weeklyDebit],
      ['This Month', monthlyDebit, monthlyCredit, monthlyCredit - monthlyDebit],
      ['All Time', allDebit, allCredit, allCredit - allDebit],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    if (ws1['A1']) ws1['A1'].s = { font: { bold: true, sz: 16, color: { rgb: '1A5276' } } };
    for (let c = 0; c < 4; c++) { const cell = XLSX.utils.encode_cell({ r: 3, c }); if (ws1[cell]) ws1[cell].s = hStyle; }
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    const expHeaders = ['Date', 'Category', 'Description', 'Paid To', 'Amount (₹)'];
    const expRows = expenses.map(e => [format(parseISO(e.expense_date), 'dd-MMM-yyyy'), e.category, e.description, e.paid_to || '-', Number(e.amount)]);
    const ws2 = XLSX.utils.aoa_to_sheet([expHeaders, ...expRows]);
    ws2['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 35 }, { wch: 20 }, { wch: 15 }];
    for (let c = 0; c < expHeaders.length; c++) { const cell = XLSX.utils.encode_cell({ r: 0, c }); if (ws2[cell]) ws2[cell].s = hStyle; }
    XLSX.utils.book_append_sheet(wb, ws2, 'Debit');

    const credHeaders = ['Date', 'Given By', 'Role', 'Description', 'Amount (₹)'];
    const credRows = credits.map(c => [format(parseISO(c.credit_date), 'dd-MMM-yyyy'), c.given_by, c.given_by_role, c.description || '-', Number(c.amount)]);
    const ws3 = XLSX.utils.aoa_to_sheet([credHeaders, ...credRows]);
    ws3['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 15 }];
    for (let c = 0; c < credHeaders.length; c++) { const cell = XLSX.utils.encode_cell({ r: 0, c }); if (ws3[cell]) ws3[cell].s = hStyle; }
    XLSX.utils.book_append_sheet(wb, ws3, 'Credit');

    XLSX.writeFile(wb, `Admin_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const timeLabel = timeView === 'daily' ? "Today's" : timeView === 'weekly' ? "This Week's" : timeView === 'monthly' ? "This Month's" : 'All Time';

  return (
    <div className="space-y-6">
      {/* Time filter + Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly', 'all'] as const).map(v => (
            <Button key={v} size="sm" variant={timeView === v ? 'default' : 'outline'} onClick={() => setTimeView(v)} className="capitalize">
              {v === 'all' ? 'All Time' : v}
            </Button>
          ))}
        </div>
        <Button onClick={exportExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* Summary Cards: Credit / Debit / Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> {timeLabel} Credit</div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCredit.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4" /> {timeLabel} Debit</div>
            <p className="text-2xl font-bold text-destructive mt-1">₹{totalDebit.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> {timeLabel} Balance</div>
            <p className={cn("text-2xl font-bold mt-1", balance >= 0 ? "text-emerald-600" : "text-destructive")}>₹{balance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Day / Week / Month spend overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Today</div>
            <div className="flex justify-between text-sm"><span className="text-emerald-600">Credit: ₹{dailyCredit.toLocaleString()}</span><span className="text-destructive">Debit: ₹{dailyDebit.toLocaleString()}</span></div>
            <div className={cn("text-right text-xs font-semibold mt-1", dailyCredit - dailyDebit >= 0 ? "text-emerald-600" : "text-destructive")}>Net: ₹{(dailyCredit - dailyDebit).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">This Week</div>
            <div className="flex justify-between text-sm"><span className="text-emerald-600">Credit: ₹{weeklyCredit.toLocaleString()}</span><span className="text-destructive">Debit: ₹{weeklyDebit.toLocaleString()}</span></div>
            <div className={cn("text-right text-xs font-semibold mt-1", weeklyCredit - weeklyDebit >= 0 ? "text-emerald-600" : "text-destructive")}>Net: ₹{(weeklyCredit - weeklyDebit).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">This Month</div>
            <div className="flex justify-between text-sm"><span className="text-emerald-600">Credit: ₹{monthlyCredit.toLocaleString()}</span><span className="text-destructive">Debit: ₹{monthlyDebit.toLocaleString()}</span></div>
            <div className={cn("text-right text-xs font-semibold mt-1", monthlyCredit - monthlyDebit >= 0 ? "text-emerald-600" : "text-destructive")}>Net: ₹{(monthlyCredit - monthlyDebit).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category-wise & Paid-to breakdown side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Category-wise Spending ({timeLabel})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Count</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No expenses in this period</TableCell></TableRow>
                ) : categoryBreakdown.map(([cat, data]) => (
                  <TableRow key={cat}>
                    <TableCell><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">{cat}</span></TableCell>
                    <TableCell className="text-center">{data.count}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">₹{data.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Paid To / Given To ({timeLabel})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person / Entity</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidToBreakdown.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No expenses in this period</TableCell></TableRow>
                ) : paidToBreakdown.map(([name, amount]) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">₹{amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense / Credit + Lists */}
      <Tabs defaultValue="debit">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="debit">Debit (Expenses)</TabsTrigger>
          <TabsTrigger value="credit">Credit (Received)</TabsTrigger>
        </TabsList>

        <TabsContent value="debit" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Add Expense (Debit)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                        <CalendarIcon className="mr-2 h-4 w-4" />{format(expDate, 'PPP')}
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
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {expCategory === 'Others' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Specify Category</label>
                    <Input placeholder="Enter category" value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <Input type="number" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="What was it for?" value={expDesc} onChange={e => setExpDesc(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Paid To / Given To</label>
                  <Input placeholder="Person or entity name" value={expPaidTo} onChange={e => setExpPaidTo(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-sm font-medium">Receipt (optional)</label>
                  <div className="flex gap-2">
                    <Input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="flex-1" />
                    {receiptFile && <span className="text-xs text-muted-foreground flex items-center gap-1"><FileImage className="h-3 w-3" />{receiptFile.name.slice(0, 20)}</span>}
                  </div>
                </div>
                <Button onClick={handleAddExpense} className="gap-2 sm:w-auto w-full" disabled={!expAmount || !expDesc || uploading}>
                  {uploading ? <><Upload className="h-4 w-4 animate-spin" /> Uploading...</> : <><Plus className="h-4 w-4" /> Add Debit</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Paid To</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No expenses in this period</TableCell></TableRow>
                  ) : filteredExpenses.map((e, i) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{format(parseISO(e.expense_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">{e.category}</span></TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>{e.paid_to || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {e.receipt_url ? (
                          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => handleViewReceipt(e.receipt_url!)}>
                            <ExternalLink className="h-3 w-3" /> View
                          </Button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">₹{Number(e.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(e.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Add Credit (Received)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                        <CalendarIcon className="mr-2 h-4 w-4" />{format(credDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={credDate} onSelect={(d) => d && setCredDate(d)} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <Input type="number" placeholder="0.00" value={credAmount} onChange={e => setCredAmount(e.target.value)} />
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
                      <SelectItem value="ceo">CEO</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="Optional note" value={credDesc} onChange={e => setCredDesc(e.target.value)} />
                </div>
              </div>
              <Button className="mt-3 gap-2" onClick={handleAddCredit} disabled={!credAmount || !credGivenBy}>
                <Plus className="h-4 w-4" /> Add Credit
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Given By</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredits.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No credits in this period</TableCell></TableRow>
                  ) : filteredCredits.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{format(parseISO(c.credit_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{c.given_by}</TableCell>
                      <TableCell><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium capitalize dark:bg-blue-900/30 dark:text-blue-400">{c.given_by_role}</span></TableCell>
                      <TableCell>{c.description || '-'}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">₹{Number(c.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCredit(c.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Employee Expense Management ──────────────────────────────────
const EmployeeExpenseManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseWithProfile[]>([]);
  const [credits, setCredits] = useState<CreditWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [employeeList, setEmployeeList] = useState<{ id: string; name: string }[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [expRes, credRes, profRes] = await Promise.all([
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      supabase.from('expense_credits').select('*').order('credit_date', { ascending: false }),
      supabase.from('profiles').select('user_id, name'),
    ]);

    const profMap: Record<string, string> = {};
    (profRes.data || []).forEach(p => { profMap[p.user_id] = p.name; });
    setEmployeeList((profRes.data || []).map(p => ({ id: p.user_id, name: p.name })));
    setExpenses((expRes.data || []).map(e => ({ ...e, user_name: profMap[e.user_id] || 'Unknown' })));
    setCredits((credRes.data || []).map(c => ({ ...c, user_name: profMap[c.user_id] || 'Unknown' })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    const { error } = await supabase.from('expenses').update({ approval_status: status, approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: `Expense ${status}` }); fetchAll(); }
  };

  const handleViewReceipt = async (path: string) => {
    const { data } = await supabase.storage.from('expense-receipts').createSignedUrl(path, 900);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const filteredExpenses = expenses.filter(e => {
    if (selectedEmployee !== 'all' && e.user_id !== selectedEmployee) return false;
    if (fromDate && parseISO(e.expense_date) < fromDate) return false;
    if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59); if (parseISO(e.expense_date) > end) return false; }
    return true;
  });

  const filteredCredits = credits.filter(c => {
    if (selectedEmployee !== 'all' && c.user_id !== selectedEmployee) return false;
    if (fromDate && parseISO(c.credit_date) < fromDate) return false;
    if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59); if (parseISO(c.credit_date) > end) return false; }
    return true;
  });

  const pendingExpenses = filteredExpenses.filter(e => e.approval_status === 'pending');
  const totalSpent = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredited = filteredCredits.reduce((s, c) => s + Number(c.amount), 0);

  const employeeSummary = Object.entries(
    filteredExpenses.reduce((acc, e) => {
      if (!acc[e.user_id]) acc[e.user_id] = { name: e.user_name || 'Unknown', spent: 0, credited: 0 };
      acc[e.user_id].spent += Number(e.amount);
      return acc;
    }, {} as Record<string, { name: string; spent: number; credited: number }>)
  );
  filteredCredits.forEach(c => {
    const existing = employeeSummary.find(([id]) => id === c.user_id);
    if (existing) existing[1].credited += Number(c.amount);
    else employeeSummary.push([c.user_id, { name: c.user_name || 'Unknown', spent: 0, credited: Number(c.amount) }]);
  });

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">Pending</Badge>;
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const hStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 }, fill: { fgColor: { rgb: '1A5276' } }, alignment: { horizontal: 'center' as const }, border: { bottom: { style: 'thin' as const, color: { rgb: '000000' } } } };

    const summaryRows = [
      ['Employee Expense Summary'], ['Generated:', format(new Date(), 'PPP')], [''],
      ['Employee', 'Total Spent (₹)', 'Total Credited (₹)', 'Balance (₹)'],
      ...employeeSummary.map(([, v]) => [v.name, v.spent, v.credited, v.credited - v.spent]),
      [''], ['Grand Total', totalSpent, totalCredited, totalCredited - totalSpent],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    if (ws1['A1']) ws1['A1'].s = { font: { bold: true, sz: 16, color: { rgb: '1A5276' } } };
    for (let c = 0; c < 4; c++) { const cell = XLSX.utils.encode_cell({ r: 3, c }); if (ws1[cell]) ws1[cell].s = hStyle; }
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    const expHeaders = ['Employee', 'Date', 'Category', 'Description', 'Amount (₹)', 'Status'];
    const expRows = filteredExpenses.map(e => [e.user_name, format(parseISO(e.expense_date), 'dd-MMM-yyyy'), e.category, e.description, Number(e.amount), e.approval_status]);
    const ws2 = XLSX.utils.aoa_to_sheet([expHeaders, ...expRows]);
    ws2['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 35 }, { wch: 15 }, { wch: 12 }];
    for (let c = 0; c < 6; c++) { const cell = XLSX.utils.encode_cell({ r: 0, c }); if (ws2[cell]) ws2[cell].s = hStyle; }
    XLSX.utils.book_append_sheet(wb, ws2, 'All Expenses');

    const credHeaders = ['Employee', 'Date', 'Given By', 'Role', 'Description', 'Amount (₹)'];
    const credRows = filteredCredits.map(c => [c.user_name, format(parseISO(c.credit_date), 'dd-MMM-yyyy'), c.given_by, c.given_by_role, c.description || '-', Number(c.amount)]);
    const ws3 = XLSX.utils.aoa_to_sheet([credHeaders, ...credRows]);
    ws3['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 15 }];
    for (let c = 0; c < 6; c++) { const cell = XLSX.utils.encode_cell({ r: 0, c }); if (ws3[cell]) ws3[cell].s = hStyle; }
    XLSX.utils.book_append_sheet(wb, ws3, 'All Credits');

    XLSX.writeFile(wb, `Employee_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employeeList.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                    <CalendarIcon className="mr-2 h-4 w-4" />{fromDate ? format(fromDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal hover:bg-accent">
                    <CalendarIcon className="mr-2 h-4 w-4" />{toDate ? format(toDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={toDate} onSelect={setToDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Clear</label>
              <Button variant="outline" className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50" onClick={() => { setFromDate(undefined); setToDate(undefined); setSelectedEmployee('all'); }} disabled={!fromDate && !toDate && selectedEmployee === 'all'}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Pending</div><p className="text-2xl font-bold text-amber-600 mt-1">{pendingExpenses.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4" /> Total Spent</div><p className="text-2xl font-bold text-destructive mt-1">₹{totalSpent.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Total Credited</div><p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalCredited.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> Net Balance</div><p className={cn("text-2xl font-bold mt-1", totalCredited - totalSpent >= 0 ? "text-emerald-600" : "text-destructive")}>₹{(totalCredited - totalSpent).toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={exportExcel} className="gap-2"><Download className="h-4 w-4" /> Export Employee Expenses</Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="gap-1"><Clock className="h-3 w-3" /> Pending ({pendingExpenses.length})</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          <TabsTrigger value="credits">All Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader><CardTitle>Pending Expense Approvals</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No pending approvals 🎉</TableCell></TableRow>
                  ) : pendingExpenses.map((e, i) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{e.user_name}</TableCell>
                      <TableCell>{format(parseISO(e.expense_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">{e.category}</span></TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>
                        {e.receipt_url ? (
                          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => handleViewReceipt(e.receipt_url!)}>
                            <ExternalLink className="h-3 w-3" /> View
                          </Button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">₹{Number(e.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20" onClick={() => handleApproval(e.id, 'approved')}>
                            <CheckCircle className="h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleApproval(e.id, 'rejected')}>
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader><CardTitle>Employee Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Spent (₹)</TableHead>
                    <TableHead className="text-right">Credited (₹)</TableHead>
                    <TableHead className="text-right">Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeSummary.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No expense data found</TableCell></TableRow>
                  ) : employeeSummary.map(([id, v], i) => (
                    <TableRow key={id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-right text-destructive font-semibold">₹{v.spent.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-semibold">₹{v.credited.toLocaleString()}</TableCell>
                      <TableCell className={cn("text-right font-bold", v.credited - v.spent >= 0 ? "text-emerald-600" : "text-destructive")}>₹{(v.credited - v.spent).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader><CardTitle>All Expenses</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No expenses found</TableCell></TableRow>
                  ) : filteredExpenses.map((e, i) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{e.user_name}</TableCell>
                      <TableCell>{format(parseISO(e.expense_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">{e.category}</span></TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>
                        {e.receipt_url ? (
                          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => handleViewReceipt(e.receipt_url!)}>
                            <ExternalLink className="h-3 w-3" /> View
                          </Button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{statusBadge(e.approval_status)}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">₹{Number(e.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardHeader><CardTitle>All Credits</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Given By</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredits.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No credits found</TableCell></TableRow>
                  ) : filteredCredits.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{c.user_name}</TableCell>
                      <TableCell>{format(parseISO(c.credit_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{c.given_by}</TableCell>
                      <TableCell><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium capitalize dark:bg-blue-900/30 dark:text-blue-400">{c.given_by_role}</span></TableCell>
                      <TableCell>{c.description || '-'}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">₹{Number(c.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Main Admin Expenses Page ─────────────────────────────────────
const AdminExpenses = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground text-sm">Manage admin and employee expenses separately</p>
        </div>

        <Tabs defaultValue="admin-expenses">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="admin-expenses" className="gap-2">
              <UserCircle className="h-4 w-4" /> Admin Expenses
            </TabsTrigger>
            <TabsTrigger value="employee-expenses" className="gap-2">
              <Users className="h-4 w-4" /> Employee Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin-expenses">
            <AdminMyExpenses />
          </TabsContent>

          <TabsContent value="employee-expenses">
            <EmployeeExpenseManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminExpenses;
