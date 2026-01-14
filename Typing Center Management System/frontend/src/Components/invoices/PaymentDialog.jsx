import React, { useState } from 'react';
import { createPayment } from "@/services/paymentsApi";
import { format } from 'date-fns';
import { CreditCard } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

export default function PaymentDialog({ invoice, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    amount: invoice.balance || 0,
    payment_method: 'cash',
    date: format(new Date(), 'yyyy-MM-dd'),
    reference: ''
  });

 const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  try {
    await createPayment({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,

      client_id: invoice.client_id || null,
      client_name: invoice.client_name,

      payment_date: formData.date,
      amount: Number(formData.amount),

      method: formData.payment_method,
      reference: formData.reference,
      notes: ""
    });

    onSuccess();
    onClose();
  } catch (err) {
    console.error("❌ Payment error:", err);
    alert("Failed to record payment");
  } finally {
    setSaving(false);
  }
};

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Record Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Invoice Total</span>
              <span className="font-medium">AED {invoice.total?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Already Paid</span>
              <span className="font-medium">AED {(invoice.amount_paid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Balance Due</span>
              <span className="font-bold text-red-600">AED {(invoice.balance || invoice.total)?.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label>Payment Amount *</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>

          <div>
            <Label>Payment Method *</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => setFormData({...formData, payment_method: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card / Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment Date</Label>
            <Input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div>
            <Label>Reference / Transaction ID</Label>
            <Input 
              value={formData.reference}
              onChange={(e) => setFormData({...formData, reference: e.target.value})}
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={saving}
            >
              {saving ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}