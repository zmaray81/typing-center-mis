import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

const serviceCategories = [
  { value: 'full_visa_inside', label: 'Full Visa Inside' },
  { value: 'full_visa_outside', label: 'Full Visa Outside' },
  { value: 'labour_card_new_renewal', label: 'Labour Card New/Renewal' },
  { value: 'visa_cancellation', label: 'Visa Cancellation' },
  { value: 'labour_card_cancellation', label: 'Labour Card Cancellation' },
  { value: 'contract_modification', label: 'Contract Modification' },
  { value: 'company_license_renewal', label: 'Company License Renewal' },
  { value: 'new_license', label: 'New License' },
  { value: 'other', label: 'Other' }
];

const serviceTemplates = {
  visa_cancellation: [
    { description: 'CANCELLATION WITHOUT OTP', amount: 0 },
    { description: 'LABOR AND IMMIGRATION CANCELLATION', amount: 0 },
    { description: 'SERVICE CHARGES', amount: 0 }
  ],
  full_visa_inside: [
    { description: 'JOB OFFER', amount: 0 },
    { description: 'LABOUR INSURANCE', amount: 0 },
    { description: 'LABOUR RENEWAL FEE', amount: 0 },
    { description: 'MEDICAL & EID', amount: 0 },
    { description: 'STAMPING', amount: 0 },
    { description: 'SERVICE CHARGE', amount: 0 }
  ],
  full_visa_outside: [
    { description: 'JOB OFFER', amount: 0 },
    { description: 'LABOUR INSURANCE', amount: 0 },
    { description: 'LABOUR PAYMENT', amount: 0 },
    { description: 'EVISA OUTSIDE', amount: 0 },
    { description: 'MEDICAL & EID', amount: 0 },
    { description: 'CONTRACT SUBMISSION', amount: 0 },
    { description: 'ILEO INSURANCE', amount: 0 },
    { description: 'STAMPING', amount: 0 },
    { description: 'SERVICE CHARGE', amount: 0 }
  ],
  company_license_renewal: [
    { description: 'PAYMENT VOUCHER GENERATING', amount: 0 },
    { description: 'PAYMENT VOUCHER FEES', amount: 0 },
    { description: 'LABOUR UPDATE', amount: 0 },
    { description: 'ESTABLISHMENT CARD UPDATE', amount: 0 },
    { description: 'EJARI', amount: 0 },
    { description: 'SERVICE CHARGES', amount: 0 }
  ],
  new_license: [
    { description: 'DUBAI INVEST USER CREATION', amount: 0 },
    { description: 'INITIAL APPROVAL', amount: 0 },
    { description: 'TRADE NAME TRANSACTION', amount: 0 },
    { description: 'TRADE NAME RESERVATION', amount: 0 },
    { description: 'MEMORANDUM SIGNING', amount: 0 },
    { description: 'PAYMENT VOUCHER GENERATING', amount: 0 },
    { description: 'PAYMENT VOUCHER FEES APROX', amount: 0 },
    { description: 'LABOUR AND ESTABLISHMENT CARD UPDATE', amount: 0 },
    { description: 'SERVICE CHARGE', amount: 0 }
  ]
};

export default function QuotationForm({ quotation, clients, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    description: '',
    person_name: '',
    service_description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    license_type: '',
    activity: '',
    service_category: '',
    items: [{ description: '', amount: 0 }],
    include_vat: false,
    status: 'draft',
    notes: ''
  });

  useEffect(() => {
  if (quotation) {
    setFormData({
      client_id: quotation.client_id || '',
      client_name: quotation.client_name || '',
      person_name: quotation.person_name || '',
      date: quotation.date || format(new Date(), 'yyyy-MM-dd'),
      license_type: quotation.license_type || '',
      activity: quotation.activity || '',
      service_category: quotation.service_category || '',
      service_description: quotation.service_description || '',
      description: quotation.description || '',

      items: quotation.items?.length > 0
        ? quotation.items
        : [{ description: '', amount: 0 }],

      include_vat: quotation.include_vat || false,
      status: quotation.status || 'draft',
      notes: quotation.notes || ''
    });
  }
}, [quotation]);


  const handleServiceCategoryChange = (category) => {
    const template = serviceTemplates[category];
    setFormData({
      ...formData,
      service_category: category,
      items: template || [{ description: '', amount: 0 }]
    });
  };

  const handleClientChange = (clientId) => {
  const client = clients.find(c => String(c.id) === String(clientId));
  if (client) {
    setFormData({
      ...formData,
      client_id: client.id,
      client_name:
        client.client_type === 'company'
          ? client.company_name
          : client.contact_person
    });
  }
};


  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', amount: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? parseFloat(value) || 0 : value };
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const vatAmount = formData.include_vat ? subtotal * 0.05 : 0;
  const total = subtotal + vatAmount;

  const generateQuotationNumber = () => {
    const dateStr = format(new Date(formData.date), 'ddMMyyyy');
    const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    return `QT-${dateStr}/${seq}`;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  try {
    const quotationData = {
      ...formData,
      quotation_number: quotation?.quotation_number || generateQuotationNumber(),
      subtotal,
      vat_amount: vatAmount,
      total,
    };

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const res = await fetch(
  quotation ? `${API_BASE}/api/quotations/${quotation.id}` 
            : `${API_BASE}/api/quotations`,
  {
    method: quotation ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quotationData),
  }
);

    if (!res.ok) {
      throw new Error("Failed to save quotation");
    }

    onSuccess();
  } catch (err) {
    console.error(err);
    alert("Failed to save quotation");
  } finally {
    setSaving(false);
  }
};


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {quotation ? 'Edit Quotation' : 'Create Quotation'}
          </h1>
          <p className="text-slate-500">Fill in the quotation details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Select Existing Client */}
  <div>
    <Label>Select Existing Client</Label>
    <Select
      value={formData.client_id ? String(formData.client_id) : ''}
      onValueChange={(clientId) => {
        const client = clients.find(c => String(c.id) === String(clientId));
        if (client) {
          setFormData({
            ...formData,
            client_id: client.id,
            client_name:
              client.client_type === 'company'
                ? client.company_name
                : client.contact_person
          });
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a client (optional)" />
      </SelectTrigger>
      <SelectContent>
        {clients.map(client => (
          <SelectItem key={client.id} value={String(client.id)}>
            {client.client_type === 'company'
              ? client.company_name
              : client.contact_person}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Manual Client Name */}
  <div>
    <Label>Client Name (Manual)</Label>
    <Input
      value={formData.client_name || ''}
      onChange={(e) =>
        setFormData({
          ...formData,
          client_id: '',
          client_name: e.target.value
        })
      }
      placeholder="Company or individual name"
    />
  </div>
</div>


                <div>
                  <Label>Service Category *</Label>
                  <Select 
                    value={formData.service_category} 
                    onValueChange={handleServiceCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.service_category === 'other' && (
                  <div>
                    <Label>Service Description *</Label>
                    <Input 
                      value={formData.service_description || ''}
                      onChange={(e) => setFormData({...formData, service_description: e.target.value})}
                      placeholder="Describe the service"
                      required
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>License Type</Label>
                                    <Input 
                                      value={formData.license_type || ''}
                                      onChange={(e) => setFormData({...formData, license_type: e.target.value})}
                                      placeholder="Professional/Commercial"
                                    />
                                  </div>
                                  <div>
                                    <Label>Activity</Label>
                                    <Input 
                                      value={formData.activity || ''}
                                      onChange={(e) => setFormData({...formData, activity: e.target.value})}
                                      placeholder="Business activity"
                                    />
                                  </div>
                                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Description</Label>
                    <Input 
                      value={formData.person_name || ''}
                      onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                      placeholder="Applicant name"
                    />
                  </div>
                  <div>
                    <Label>Quotation Date</Label>
                    <Input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input 
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Service description"
                      />
                    </div>
                    <div className="w-32">
                      <Input 
                        type="number"
                        step="0.01"
                        value={item.amount || ''}
                        onChange={(e) => updateItem(index, 'amount', e.target.value)}
                        placeholder="Amount"
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Terms and conditions..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Include VAT (5%)</Label>
                  <Switch 
                    checked={formData.include_vat}
                    onCheckedChange={(checked) => setFormData({...formData, include_vat: checked})}
                  />
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>AED {subtotal.toLocaleString()}</span>
                  </div>
                  {formData.include_vat && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT (5%)</span>
                      <span>AED {vatAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>AED {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : (quotation ? 'Update Quotation' : 'Create Quotation')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );

}
