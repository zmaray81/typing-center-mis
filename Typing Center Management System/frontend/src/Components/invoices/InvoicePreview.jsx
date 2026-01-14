import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import InvoiceHistory from './InvoiceHistory';
import { 
  ArrowLeft, 
  Pencil,
  CreditCard,
  Printer,
  Building2,
  Download,
  Mail,
  MessageSquare,
  History // Add this import
} from 'lucide-react';
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";

const paymentStatusColors = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700'
};

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
  };
  
  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);
  
  let result = convert(wholePart);
  if (decimalPart > 0) {
    result += ' and ' + convert(decimalPart) + ' Fils';
  }
  return result + ' Only';
}

export default function InvoicePreview({ invoice, onClose, onEdit, onRecordPayment }) {
  const printRef = useRef();
  const [showHistory, setShowHistory] = useState(false);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Function to load history
  const loadAuditHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`http://localhost:4000/api/invoices/${invoice.id}/audit`);
      const data = await response.json();
      setAuditHistory(data);
    } catch (error) {
      console.error('Failed to load audit history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePrint = () => {
    document.title = `Invoice ${invoice.invoice_number}`;
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{invoice.invoice_number}</h1>
            <p className="text-slate-500">{invoice.client_name}</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          {/* History Button */}
          <Button 
            variant="outline"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && auditHistory.length === 0) {
                loadAuditHistory();
              }
            }}
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide History' : 'View History'}
          </Button>

          {/* Download PDF Button */}
          <Button 
            variant="outline" 
            onClick={() => {
              window.open(`http://localhost:4000/api/invoices/${invoice.id}/pdf`, '_blank');
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>

          {/* Email Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Invoice via Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Button 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => {
                    window.open(`http://localhost:4000/api/invoices/${invoice.id}/pdf`, '_blank');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Step 1: Download PDF
                </Button>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    const subject = `Invoice ${invoice.invoice_number} - Bab Alyusr Business Setup`;
                    const body = `Dear ${invoice.client_name},\n\nPlease find your invoice ${invoice.invoice_number} attached.\n\nTotal Amount: AED ${invoice.total}\n\nPayment Status: ${invoice.payment_status}\n\nThank you for your business!\n\nBest regards,\nBab Alyusr Business Setup Services`;
                    
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.open(gmailUrl, '_blank');
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Step 2: Open Gmail
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* WhatsApp Button */}
          <Button 
            variant="outline"
            onClick={() => {
              const pdfUrl = `http://localhost:4000/api/invoices/${invoice.id}/pdf`;
              const message = `Invoice ${invoice.invoice_number} from Bab Alyusr Business Setup Services\n` +
                             `Client: ${invoice.client_name}\n` +
                             `Total Amount: AED ${invoice.total}\n` +
                             `Payment Status: ${invoice.payment_status}\n` +
                             `Download PDF: ${pdfUrl}`;
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send WhatsApp
          </Button>

          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          
          {invoice.payment_status !== 'paid' && (
            <Button
              variant="outline"
              onClick={() => {
                onRecordPayment();
                onClose();
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Record Payment
            </Button>
          )}
          
          <Button onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      {/* Display History */}
      {showHistory && (
        <div className="mt-6">
          <InvoiceHistory history={auditHistory} />
        </div>
      )}

      {/* Invoice Preview */}
<Card>
  <CardContent className="p-8">
    <div ref={printRef} className="invoice-page">

      {/* ================= HEADER ================= */}
      <div className="invoice-header">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-600">BAB ALYUSR</h2>
              <p className="text-slate-500 text-xs">BUSINESS SETUP SERVICES</p>
            </div>
          </div>

          <div className="text-right text-sm">
            <div className="text-slate-500">Invoice #</div>
            <div className="font-bold">{invoice.invoice_number}</div>
            <div className="text-slate-500 mt-1">Date</div>
            <div>
              {invoice.date
                ? format(new Date(invoice.date), 'MMMM d, yyyy')
                : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="invoice-body">

        {/* Bill To */}
        <div className="mb-6 p-4 bg-amber-50 rounded-lg text-sm">
          <div className="text-slate-500 mb-1">Bill To:</div>
          <div className="font-semibold text-base">{invoice.client_name}</div>

          {invoice.service_type && (
            <div className="text-slate-600 mt-1">
              <span className="font-medium">Service Type:</span>{" "}
              {invoice.service_type.replace(/_/g, " ").toUpperCase()}
            </div>
          )}

          {invoice.license_type && (
            <div className="text-slate-600">
              <span className="font-medium">License Type:</span>{" "}
              {invoice.license_type}
            </div>
          )}

          {invoice.activity && (
            <div className="text-slate-600">
              <span className="font-medium">Activity:</span>{" "}
              {invoice.activity}
            </div>
          )}
        </div>

        {/* Intro */}
        <p className="text-slate-600 text-sm mb-4">
          Dear Sir/Madam,<br />
          Respectfully we at this moment submit our invoice for the
          below-mentioned services.
        </p>

        {/* Items Table */}
        <table className="w-full mb-5 text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2">Sr. No</th>
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Amount (AED)</th>
            </tr>
          </thead>

          <tbody>
            {invoice.person_name && (
              <tr>
                <td className="py-1">•</td>
                <td className="py-1 font-semibold italic text-amber-700">
                  {invoice.person_name}
                </td>
                <td />
              </tr>
            )}

            {invoice.items?.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="py-1">•</td>
                <td className="py-1 uppercase">{item.description}</td>
                <td className="py-1 text-right">
                  {item.amount?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            {invoice.include_vat && (
              <>
                <tr>
                  <td colSpan={2} className="text-right py-1 font-medium">
                    Subtotal
                  </td>
                  <td className="text-right py-1">
                    {invoice.subtotal?.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-right py-1 font-medium">
                    VAT (5%)
                  </td>
                  <td className="text-right py-1">
                    {invoice.vat_amount?.toLocaleString()}
                  </td>
                </tr>
              </>
            )}

            <tr className="border-t-2 border-slate-300 bg-amber-50">
              <td colSpan={2} className="py-2 font-semibold">
                AED {numberToWords(invoice.total || 0)}
              </td>
              <td className="py-2 text-right font-bold">
                {invoice.total?.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment Status */}
          {invoice.amount_paid > 0 && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span>Payment Received in Cash</span>
                <span>{invoice.payments?.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0)?.toLocaleString() || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Payment Received Via Bank Transfer</span>
                <span>{invoice.payments?.filter(p => p.method === 'bank_transfer').reduce((s, p) => s + p.amount, 0)?.toLocaleString() || '-'}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg bg-amber-50 px-2 rounded">
                <span>Balance</span>
                <span className={invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                  {invoice.balance?.toLocaleString()}
                </span>
              </div>
            </div>
          )}

        {/* Closing */}
        <div className="mt-6 pt-4 border-t text-sm">
          <p className="text-slate-600 mb-3">
            We assure you our best services to keep developing a long-lasting
            relationship. Your earliest settlement will be trustworthy.
          </p>

          <p className="font-semibold">Thanks & Best Regards,</p>
          <p className="text-slate-600">Accounts Department</p>

          <div className="mt-4 p-3 bg-slate-50 rounded text-xs">
            <p className="font-semibold">Account Details</p>
            <p>ADCB</p>
            <p>Al Dayera Al Naqiya Typing Services</p>
            <p>AE070030011476691820001</p>
          </div>
        </div>

      </div>

           {/* ================= FOOTER ================= */}
      <div className="invoice-footer">
        <p className="font-medium text-sm">
          Mob.: +97150 134 8974 - Office S22, Bur Dubai, PO Box: 88878, Dubai - UAE, Email: bab.al.yusr81@gmail.com
        </p>
      </div>

    </div>
  </CardContent>
</Card>

{/* Internal Notes - Only show if notes exist */}
{invoice.notes && (
  <Card className="no-print bg-blue-50 border-blue-200">
    <CardContent className="p-4">
      <h4 className="font-semibold text-blue-800 mb-2">📝 Internal Notes:</h4>
      <p className="text-sm text-blue-700 whitespace-pre-line">{invoice.notes}</p>
    </CardContent>
  </Card>
)}

      {/* Payment History */}
      {invoice.payments?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Payment History</h3>
            <div className="space-y-3">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">AED {payment.amount?.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">
                      {payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : '-'} • 
                      <span className="capitalize"> {payment.method?.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  {payment.reference && (
                    <Badge variant="outline">{payment.reference}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}