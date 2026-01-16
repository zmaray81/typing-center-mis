import { useParams, useNavigate } from "react-router-dom";
import { createInvoiceFromQuotation } from "@/services/invoicesApi";
import { useQuery } from "@tanstack/react-query";
import { getQuotationById } from "../../services/quotationsApi";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useState, useEffect } from "react";
import { Download, Mail, MessageSquare, Copy } from "lucide-react";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/Components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";

export default function QuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [converting, setConverting] = useState(false);

  const handleConfirmConvert = async () => {
    if (!quotation || quotation.converted_to_invoice === true) return;

    try {
      setConverting(true);
      const res = await createInvoiceFromQuotation(quotation.id);
      navigate(`/invoices?id=${res.id}`, {
        state: { fromQuotation: true }
      });
    } catch (err) {
      console.error("Convert to invoice failed:", err);
    } finally {
      setConverting(false);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => getQuotationById(id),
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Failed to load quotation</div>;

  const quotation = data;
  const items = Array.isArray(quotation.items) ? quotation.items : [];

  const SERVICE_LABELS = {
    full_visa_inside: "Full Visa Inside",
    full_visa_outside: "Full Visa Outside",
    labour_card_new_renewal: "Labour Card New / Renewal",
    visa_cancellation: "Visa Cancellation",
    labour_card_cancellation: "Labour Card Cancellation",
    contract_modification: "Contract Modification",
    company_license_renewal: "Company License Renewal",
    new_license: "New License",
    other: "Other Service",
  };

  const amountToWords = (amount) => {
    if (!amount) return "AED Zero Only";

    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
      "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000)
        return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
      return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    };

    return "AED " + convert(Math.floor(amount)) + " Only";
  };

  return (
    <div className="print-a4">
      {/* ACTION BUTTONS */}
      <div className="flex justify-between mb-4 no-print">
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
          
          <Button
            disabled={quotation.converted_to_invoice === true}
            onClick={() => navigate("/quotations", { state: { editId: id } })}
          >
            Edit
          </Button>

          {/* Download PDF Button */}
          <Button 
            variant="outline" 
            onClick={() => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  window.open(`${API_BASE}/api/quotations/${id}/pdf`, '_blank');
}}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>

{/* Working Gmail Button */}
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">
      <Mail className="w-4 h-4 mr-2" />
      Send via Gmail
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Send Quotation via Email</DialogTitle>
      <DialogDescription>
        Easy email sending process
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Simple Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold text-lg text-blue-800 mb-3">📧 How to Send:</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Download the PDF</p>
              <Button 
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  window.open(`${API_BASE}/api/quotations/${id}/pdf`, '_blank');
  alert('📥 PDF download started!\n\nNext: Click "Step 2" below');
}}
              >
                <Download className="w-4 h-4 mr-2" />
                Click to Download PDF
              </Button>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Open Gmail with Template</p>
              <Button 
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const subject = `Quotation ${quotation.quotation_number} - Bab Alyusr Business Setup`;
                  const body = `Dear ${quotation.client_name},\n\nPlease find your quotation ${quotation.quotation_number} attached.\n\nTotal Amount: AED ${quotation.total}\n\nThank you for your business!\n\nBest regards,\nBab Alyusr Business Setup Services\nOffice No. 12, Dubai, UAE\nTel: 045528083 | Mobile: 0501348974`;
                  
                  // Open Gmail compose
                  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.open(gmailUrl, '_blank');
                  
                  // Show success message
                  setTimeout(() => {
                    alert('✅ Gmail opened!\n\nNow:\n1. Attach the downloaded PDF\n2. Add recipient email\n3. Send the email');
                  }, 1000);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Open Gmail with Template
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Copy Options */}
      <div className="border rounded-lg p-3">
        <h4 className="font-medium mb-2">📋 Quick Copy Options:</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              const subject = `Quotation ${quotation.quotation_number} - Bab Alyusr Business Setup`;
              navigator.clipboard.writeText(subject);
              alert('Subject copied!');
            }}
          >
            Copy Subject
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              const fileName = `Quotation-${quotation.quotation_number}.pdf`;
              navigator.clipboard.writeText(fileName);
              alert('Filename copied!');
            }}
          >
            Copy Filename
          </Button>
        </div>
      </div>
      
      {/* Tips */}
      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
        <h4 className="font-medium text-amber-800 mb-1">💡 Tips:</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Make sure you're logged into Gmail</li>
          <li>• The PDF downloads as: <code className="bg-amber-100 px-1 rounded">Quotation-{quotation.quotation_number}.pdf</code></li>
          <li>• Attach the PDF before sending</li>
        </ul>
      </div>
    </div>
  </DialogContent>
</Dialog>

          {/* WhatsApp Button */}
         <Button 
  variant="outline"
  onClick={() => {
    // For production on Render
    const pdfUrl = `https://typing-center-mis.onrender.com/api/quotations/${id}/pdf`;
    
    const message = `QUOTATION

Quotation: ${quotation.quotation_number}
Client: ${quotation.client_name}
Date: ${quotation.date}
Total: AED ${quotation.total}

Download PDF here:
${pdfUrl}

Thank you!
Bab Alyusr Business Setup Services`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }}
>
  <MessageSquare className="w-4 h-4 mr-2" />
  Send WhatsApp
</Button>

          {quotation.converted_to_invoice === true ? (
            <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
              <button
                onClick={() => navigate(`/invoices?id=${quotation.invoice_id}`)}
                className="text-green-700 hover:underline font-medium"
              >
                Converted to Invoice #{quotation.invoice_number}
              </button>
            </div>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  Convert to Invoice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Convert quotation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This quotation will be locked and moved to invoices.
                    You will not be able to edit it again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleConfirmConvert}
                    disabled={converting}
                  >
                    {converting ? "Converting..." : "Convert"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* QUOTATION CONTENT */}
      <Card className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between border-b pb-4">
          <div>
            <h1 className="text-xl font-bold">Bab Alyusr Business Setup Services</h1>
            <p className="text-sm text-muted-foreground">Business Setup & Typing Services</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Quotation No</div>
            <div className="text-lg font-semibold">{quotation.quotation_number}</div>
          </div>
        </div>

        {quotation.converted_to_invoice === true && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            Converted to Invoice #{quotation.invoice_number}
          </div>
        )}

        {/* CLIENT INFO */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Client:</strong> {quotation.client_name}</div>
          <div><strong>Status:</strong> {quotation.status}</div>
          <div><strong>Date:</strong> {quotation.date}</div>
          <div>
            <strong>Service Type:</strong>{" "}
            {SERVICE_LABELS[quotation.service_category] || "-"}
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full border text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="border px-2 py-1 text-left">Service</th>
              <th className="border px-2 py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="px-2 py-1">{item.description}</td>
                <td className="px-2 py-1 text-right">
                  {(item.line_total ?? item.amount ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end text-sm">
          <div className="w-64 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{quotation.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>VAT</span><span>{quotation.vat_amount.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{quotation.total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="text-sm">
          <strong>Amount in Words:</strong> {amountToWords(quotation.total)}
        </div>

        {quotation.notes && (
          <div className="text-sm"><strong>Notes:</strong> {quotation.notes}</div>
        )}

        {/* FOOTER */}
        <div className="print-footer border-t pt-4 text-sm text-muted-foreground">
          <p>📍 Office No. 12, Dubai, UAE</p>
          <p>📞 Tel: 045528083 | Mobile: 0501348974</p>
          <p>✉️ bab.al.yusr81@gmail.com</p>
        </div>
      </Card>
    </div>
  );
}
