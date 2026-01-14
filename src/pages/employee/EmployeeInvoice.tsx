import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Download, Plus, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

const GST_NUMBER = '33AAGCF4763Q1Z3';
const GST_RATE = 18;

const generateUniqueId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FIC-INV-${timestamp}-${random}`;
};

const EmployeeInvoice = () => {
  const { user } = useAuth();
  const [invoiceId] = useState(generateUniqueId());
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientGst, setClientGst] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      description: '', 
      quantity: 1, 
      rate: 0 
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateGst = () => {
    return (calculateSubtotal() * GST_RATE) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGst();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const generateAndDownloadPDF = () => {
    if (!clientName.trim()) {
      toast.error('Please enter client name');
      return;
    }

    if (items.some(item => !item.description.trim() || item.rate <= 0)) {
      toast.error('Please fill all item details with valid rates');
      return;
    }

    const invoiceDate = format(new Date(), 'dd/MM/yyyy');
    const subtotal = calculateSubtotal();
    const gstAmount = calculateGst();
    const total = calculateTotal();

    // Create a print-friendly HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 20px;
            color: #1a1a1a;
            font-size: 12px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 3px solid #f59e0b; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
          }
          .company-info h1 { 
            font-size: 24px; 
            color: #1e293b; 
            margin-bottom: 5px;
            font-weight: 700;
          }
          .company-info p { 
            color: #64748b; 
            font-size: 11px;
            line-height: 1.4;
          }
          .invoice-title { 
            text-align: right; 
          }
          .invoice-title h2 { 
            font-size: 28px; 
            color: #f59e0b; 
            font-weight: 800;
            letter-spacing: 2px;
          }
          .invoice-title p { 
            font-size: 11px; 
            color: #64748b;
            margin-top: 5px;
          }
          .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 25px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
          }
          .detail-box h3 { 
            font-size: 10px; 
            color: #94a3b8; 
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .detail-box p { 
            font-size: 12px; 
            color: #1e293b;
            line-height: 1.5;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          .items-table th { 
            background: #1e293b; 
            color: white; 
            padding: 10px 12px; 
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table th:last-child { text-align: right; }
          .items-table td { 
            padding: 12px; 
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
          }
          .items-table td:last-child { text-align: right; }
          .items-table tr:nth-child(even) { background: #f8fafc; }
          .totals { 
            display: flex; 
            justify-content: flex-end; 
            margin-top: 20px;
          }
          .totals-box { 
            width: 280px;
            background: #f8fafc;
            border-radius: 8px;
            overflow: hidden;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 15px;
            border-bottom: 1px solid #e2e8f0;
          }
          .total-row.final { 
            background: #1e293b; 
            color: white;
            font-weight: 700;
            font-size: 14px;
          }
          .gst-info { 
            background: #fef3c7; 
            padding: 12px; 
            border-radius: 6px; 
            margin-top: 20px;
            border-left: 4px solid #f59e0b;
          }
          .gst-info p { 
            font-size: 11px; 
            color: #92400e;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          .footer p { 
            font-size: 10px; 
            color: #94a3b8;
          }
          .signature-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 40px;
            padding-top: 20px;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #1e293b;
            margin-top: 40px;
            padding-top: 8px;
            font-size: 11px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>Forge India Connect Pvt. Ltd.</h1>
            <p>Building Future Together</p>
            <p style="margin-top: 8px;"><strong>GST:</strong> ${GST_NUMBER}</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${invoiceId}</p>
            <p><strong>Date:</strong> ${invoiceDate}</p>
          </div>
        </div>

        <div class="invoice-details">
          <div class="detail-box">
            <h3>Bill To</h3>
            <p><strong>${clientName}</strong></p>
            <p>${clientAddress.replace(/\n/g, '<br>')}</p>
            ${clientGst ? `<p style="margin-top: 5px;"><strong>GST:</strong> ${clientGst}</p>` : ''}
          </div>
          <div class="detail-box" style="text-align: right;">
            <h3>Generated By</h3>
            <p>${user?.name || 'Employee'}</p>
            <p>${user?.email || ''}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Description</th>
              <th style="width: 80px;">Qty</th>
              <th style="width: 120px;">Rate</th>
              <th style="width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.rate)}</td>
                <td>${formatCurrency(item.quantity * item.rate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="total-row">
              <span>GST (${GST_RATE}%)</span>
              <span>${formatCurrency(gstAmount)}</span>
            </div>
            <div class="total-row final">
              <span>Total</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div class="gst-info">
          <p><strong>GST Registration:</strong> ${GST_NUMBER}</p>
          <p>Tax calculated at ${GST_RATE}% GST on total taxable value.</p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Authorized Signature</div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="margin-top: 5px;">Forge India Connect Pvt. Ltd. | info@forgeindiaconnect.com | www.forgeindiaconnect.com</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.print();
      };
      
      toast.success('Invoice generated! Use "Save as PDF" in the print dialog for compressed download.');
    } else {
      toast.error('Please allow popups to generate the invoice');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice Generator</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and download professional invoices with GST
            </p>
          </div>
          <Button 
            onClick={generateAndDownloadPDF}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
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
                    <Input 
                      value={invoiceId} 
                      disabled 
                      className="bg-muted font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <Input 
                      value={format(new Date(), 'dd/MM/yyyy')} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Bill To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Client Name *</Label>
                  <Input 
                    placeholder="Enter client/company name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Client Address</Label>
                  <Textarea 
                    placeholder="Enter client address"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Client GST Number</Label>
                  <Input 
                    placeholder="Enter client GST (optional)"
                    value={clientGst}
                    onChange={(e) => setClientGst(e.target.value.toUpperCase())}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
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
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/50 rounded-lg">
                    <div className="col-span-12 md:col-span-5">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Input 
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <Input 
                        value={formatCurrency(item.quantity * item.rate)}
                        disabled
                        className="bg-muted font-medium"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
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
                      <span className="font-bold text-lg text-amber-600">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    GST Registration
                  </p>
                  <p className="text-sm font-mono mt-1 text-amber-900 dark:text-amber-300">
                    {GST_NUMBER}
                  </p>
                </div>

                <Button 
                  onClick={generateAndDownloadPDF}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Use "Save as PDF" in print dialog for compressed download
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeInvoice;
