// Admin Invoice Generator with Company GST Number and Without options
import { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Download, Plus, Trash2, FileText, Receipt, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const companyLogo = '/images/company-logo.jpeg';
const signatureImage = '/images/signature.jpeg';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

const GST_NUMBER = '33AAGCF4763Q1Z3';
const GST_RATE = 18;

const getSequentialInvoiceNumber = (invoiceType: 'with-gst-number' | 'without-gst-number') => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const financialYear = month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  
  const prefix = invoiceType === 'with-gst-number' ? 'FIC-GST' : 'FIC';
  const fyKey = `invoice_fy_counter_${invoiceType}_${financialYear}`;
  let fyCounter = parseInt(localStorage.getItem(fyKey) || '0', 10);
  fyCounter += 1;
  localStorage.setItem(fyKey, fyCounter.toString());
  
  return `${prefix}/${financialYear}/${fyCounter.toString().padStart(4, '0')}`;
};

const AdminInvoice = () => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceType, setInvoiceType] = useState<'with-gst-number' | 'without-gst-number'>('with-gst-number');
  const [invoiceId, setInvoiceId] = useState(() => getSequentialInvoiceNumber('with-gst-number'));
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientGst, setClientGst] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0 }
  ]);

  const handleInvoiceTypeChange = (type: 'with-gst-number' | 'without-gst-number') => {
    setInvoiceType(type);
    setInvoiceId(getSequentialInvoiceNumber(type));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const calculateGst = () => (calculateSubtotal() * GST_RATE) / 100;
  const calculateTotal = () => calculateSubtotal() + calculateGst();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  const generateAndDownloadPDF = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter client name');
      return;
    }
    if (items.some(item => !item.description.trim() || item.rate <= 0)) {
      toast.error('Please fill all item details with valid rates');
      return;
    }
    if (!invoiceRef.current) {
      toast.error('Invoice preview not ready');
      return;
    }

    setIsGenerating(true);
    toast.loading('Generating PDF...');

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      const finalHeight = Math.min(imgHeight, pdfHeight);
      const scaleFactor = finalHeight / imgHeight;
      const finalWidth = imgWidth * scaleFactor;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, finalWidth, finalHeight, undefined, 'FAST');
      pdf.save(`Invoice_${invoiceId.replace(/\//g, '-')}.pdf`);

      toast.dismiss();
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const invoiceDate = format(new Date(), 'dd/MM/yyyy');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice Generator</h1>
            <p className="text-muted-foreground text-sm mt-1">Create professional invoices with 18% GST</p>
          </div>
          <Button onClick={generateAndDownloadPDF} disabled={isGenerating} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Download Invoice'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Type Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-amber-500" />
                  Invoice Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={invoiceType} 
                  onValueChange={(value) => handleInvoiceTypeChange(value as 'with-gst-number' | 'without-gst-number')}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Label 
                    htmlFor="with-gst-number" 
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      invoiceType === 'with-gst-number' 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' 
                        : 'border-border hover:border-amber-300'
                    }`}
                  >
                    <RadioGroupItem value="with-gst-number" id="with-gst-number" />
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-semibold">With Company GST Number</p>
                        <p className="text-xs text-muted-foreground">Shows company GST: {GST_NUMBER}</p>
                      </div>
                    </div>
                  </Label>
                  <Label 
                    htmlFor="without-gst-number" 
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      invoiceType === 'without-gst-number' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <RadioGroupItem value="without-gst-number" id="without-gst-number" />
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">Without Company GST Number</p>
                        <p className="text-xs text-muted-foreground">Invoice without company GST details</p>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Invoice ID</Label>
                    <Input value={invoiceId} disabled className="bg-muted font-mono text-sm" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <Input value={invoiceDate} disabled className="bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Bill To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Client Name *</Label>
                  <Input placeholder="Enter client/company name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Client Address</Label>
                  <Textarea placeholder="Enter client address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={3} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Client GST Number</Label>
                  <Input placeholder="Enter client GST (optional)" value={clientGst} onChange={(e) => setClientGst(e.target.value.toUpperCase())} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Items</CardTitle>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/50 rounded-lg">
                    <div className="col-span-12 md:col-span-5">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Input placeholder="Item description" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                      <Input type="number" min="0" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <Input value={formatCurrency(item.quantity * item.rate)} disabled className="bg-muted font-medium" />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-lg">
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST ({GST_RATE}%)</span>
                    <span className="font-medium">{formatCurrency(calculateGst())}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="font-bold text-lg text-amber-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
                {invoiceType === 'with-gst-number' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Company GST Registration</p>
                    <p className="text-sm font-mono mt-1 text-amber-900 dark:text-amber-300">{GST_NUMBER}</p>
                  </div>
                )}
                {invoiceType === 'without-gst-number' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Invoice Type</p>
                    <p className="text-sm mt-1 text-blue-900 dark:text-blue-300">Without Company GST Number</p>
                  </div>
                )}
                <Button onClick={generateAndDownloadPDF} disabled={isGenerating} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate & Download'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">PDF will be downloaded directly to your device</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden Invoice Preview for PDF */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={invoiceRef} style={{ width: '794px', minHeight: '1123px', padding: '40px', backgroundColor: '#ffffff', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#1a1a1a', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #f59e0b', paddingBottom: '20px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={companyLogo} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} crossOrigin="anonymous" />
                <div>
                  <h1 style={{ fontSize: '22px', color: '#1e40af', marginBottom: '4px', fontWeight: 700, margin: 0 }}>Forge India Connect Pvt. Ltd.</h1>
                  <p style={{ color: '#f59e0b', fontSize: '12px', margin: '4px 0 0 0', fontWeight: 600 }}>Shaping Future</p>
                  {invoiceType === 'with-gst-number' && (
                    <p style={{ color: '#64748b', fontSize: '11px', margin: '8px 0 0 0' }}><strong>GST:</strong> {GST_NUMBER}</p>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '32px', color: '#f59e0b', fontWeight: 800, letterSpacing: '3px', margin: 0 }}>INVOICE</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0' }}><strong>Invoice #:</strong> {invoiceId}</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}><strong>Date:</strong> {invoiceDate}</p>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
              <div>
                <h3 style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Bill To</h3>
                <p style={{ fontSize: '14px', color: '#1e293b', fontWeight: 600, margin: 0 }}>{clientName || 'Client Name'}</p>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', whiteSpace: 'pre-line', margin: '4px 0 0 0' }}>{clientAddress || 'Client Address'}</p>
                {clientGst && <p style={{ fontSize: '12px', color: '#1e293b', margin: '8px 0 0 0' }}><strong>GST:</strong> {clientGst}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Generated By</h3>
                <p style={{ fontSize: '12px', color: '#1e293b', margin: 0, fontWeight: 600 }}>Forge India Connect</p>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', width: '40px' }}>#</th>
                  <th style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', width: '80px' }}>Qty</th>
                  <th style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', width: '120px' }}>Rate</th>
                  <th style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', width: '120px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>{item.description || '-'}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(item.quantity * item.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <div style={{ width: '280px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <span>GST ({GST_RATE}%)</span>
                  <span>{formatCurrency(calculateGst())}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#1e293b', color: 'white', fontWeight: 700, fontSize: '15px' }}>
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* GST Info - only for invoices with company GST number */}
            {invoiceType === 'with-gst-number' && (
              <div style={{ backgroundColor: '#fef3c7', padding: '12px 16px', borderRadius: '6px', marginTop: '20px', borderLeft: '4px solid #f59e0b' }}>
                <p style={{ fontSize: '11px', color: '#92400e', margin: 0 }}><strong>GST Registration:</strong> {GST_NUMBER}</p>
                <p style={{ fontSize: '11px', color: '#92400e', margin: '4px 0 0 0' }}>Tax calculated at {GST_RATE}% GST on total taxable value.</p>
              </div>
            )}

            <div style={{ flexGrow: 1, minHeight: '40px' }} />

            {/* Signature */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <div style={{ textAlign: 'center', width: '180px' }}>
                <img src={signatureImage} alt="Signature" style={{ width: '100px', height: '50px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.2)', display: 'block', margin: '0 auto' }} crossOrigin="anonymous" />
                <div style={{ borderTop: '2px solid #1e293b', marginTop: '4px', paddingTop: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#1e293b', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>Authorised Signatory</p>
                  <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0 0', lineHeight: 1.2 }}>Forge India Connect Pvt. Ltd.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: 500 }}>Thank you for your business!</p>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '6px 0 0 0' }}>Forge India Connect Pvt. Ltd. | info@forgeindiaconnect.com | www.forgeindiaconnect.com</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminInvoice;
