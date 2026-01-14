import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { createApplication, updateApplication } from "@/services/applicationsApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

const emirates = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'ras_al_khaimah', label: 'Ras Al Khaimah' },
  { value: 'fujairah', label: 'Fujairah' },
  { value: 'umm_al_quwain', label: 'Umm Al Quwain' },
];

const applicationTypes = [
  { value: 'new_visa_inside', label: 'New Visa (Inside)' },
  { value: 'new_visa_outside', label: 'New Visa (Outside)' },
  { value: 'visa_renewal', label: 'Visa Renewal' },
  { value: 'visa_cancellation', label: 'Visa Cancellation' },
  { value: 'new_license', label: 'Company License New' },
  { value: 'license_renewal', label: 'Company License Renewal' },
  { value: 'labour_card_formation', label: 'Labour Card Formation' },
  { value: 'labour_card_cancellation', label: 'Labour Card Cancellation' },
  { value: 'contract_modification', label: 'Contract Modification' },
  { value: 'other', label: 'Other' },
];

const APPLICATION_STEPS = {
  new_visa_inside: [
    'first_visit',
    'labour_insurance',
    'second_visit',
    'evisa_inside',
    'change_status',
    'medical_application',
    'eid_application',
    'third_visit',
    'iloe_insurance',
    'stamping',
    'completed',
  ],

  new_visa_outside: [
    'first_visit',
    'labour_insurance',
    'second_visit',
    'evisa_outside',
    'medical_application',
    'eid_application',
    'third_visit',
    'iloe_insurance',
    'stamping',
    'completed',
  ],

  visa_renewal: [
    'labour_card_renewal',
    'labour_insurance',
    'iloe_insurance_renewal',
    'medical_and_id',
    'stamping',
    'completed',
  ],

  visa_cancellation: [
    'labour_cancellation_typing',
    'labour_cancellation_submission',
    'immigration_cancellation',
    'completed',
  ],

  new_license: [
    'initial_approval',
    'trade_name_reservation',
    'ejari',
    'moa_typing',
    'payment_voucher',
    'license_issuance',
    'new_establishment_card',
    'labour_file_opening',
    'completed',
  ],

  license_renewal: [
    'followup_receipt',
    'new_moa_typing',
    'payment_voucher',
    'license_issuance',
    'establishment_card_renewal',
    'update_establishment_labour',
    'completed',
  ],

  labour_card_cancellation: [
    'labour_card_cancellation_typing',
    'labour_card_cancellation_submission',
    'completed',
  ],

  labour_card_formation: [
    'labour_card_typing',
    'labour_card_submission',
    'labour_insurance',
    'work_permit_payment',
    'completed',
  ],

  contract_modification: [
    'modify_work_permit',
    'submission',
    'completed',
  ],

  other: []
};


export default function ApplicationForm({ application, clients, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    person_name: '',
    pre_approval_mb_number: '',
    application_type: 'new_visa_inside',
    application_type_description: '',
    emirate: 'dubai',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    expected_completion: '',
    notes: ''
  });

  useEffect(() => {
    if (application) {
      setFormData({
        client_id: application.client_id || '',
        client_name: application.client_name || '',
        person_name: application.person_name || '',
        pre_approval_mb_number: application.pre_approval_mb_number || '',
        application_type: application.application_type || 'new_visa_inside',
        application_type_description: application.application_type_description || '',
        emirate: application.emirate || 'dubai',
        start_date: application.start_date || format(new Date(), 'yyyy-MM-dd'),
        expected_completion: application.expected_completion || '',
        notes: application.notes || ''
      });
    }
  }, [application]);

  const handleClientChange = (clientId) => {
  const id = Number(clientId); // 🔴 CRITICAL
  const client = clients.find(c => c.id === id);

  if (client) {
    setFormData(prev => ({
      ...prev,
      client_id: id, // INTEGER
      client_name:
        client.client_type === 'company'
          ? client.company_name
          : client.contact_person,
      emirate: client.emirate || 'dubai'
    }));
  }
};

  const generateApplicationNumber = () => {
    const dateStr = format(new Date(), 'yyMMdd');
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `APP-${dateStr}-${seq}`;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  try {
    const steps = APPLICATION_STEPS[formData.application_type] || [];
    const firstStep = steps.length > 0 ? steps[0] : null;

    // ✅ Prepare data properly
    const applicationData = {
      ...formData,
      // Convert client_id to integer or null
      client_id: formData.client_id ? parseInt(formData.client_id) : null,
      application_number: application?.application_number || generateApplicationNumber(),
      current_step: firstStep,
      steps_completed: [],
      status: 'in_progress',
      completion_date: null,
      // Ensure required fields are not empty
      client_name: formData.client_name || 'Walk-in Customer',
      person_name: formData.person_name || 'Not Specified',
      // Handle other fields
      application_type_description: formData.application_type === 'other' 
        ? formData.application_type_description 
        : null
    };

    console.log("📤 Sending application data:", applicationData);

    if (application) {
      await updateApplication(application.id, applicationData);
    } else {
      await createApplication(applicationData);
    }

    onSuccess();
  } catch (err) {
    console.error("❌ Application save failed:", err);
    console.error("❌ Server response:", err.response?.data);
    
    // Show user-friendly error message
    const errorMsg = err.response?.data?.error || 
                    err.response?.data?.details || 
                    err.message || 
                    "Failed to save application";
    
    alert(`Error: ${errorMsg}`);
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
            {application ? 'Edit Application' : 'New Application'}
          </h1>
          <p className="text-slate-500">Track visa or company service</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Client</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_type === 'company' ? client.company_name : client.contact_person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Or Enter Client/Company Name *</Label>
                <Input 
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>Person/Applicant Name *</Label>
                <Input 
                  value={formData.person_name}
                  onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                  placeholder="Name of the person for visa/service"
                  required
                />
              </div>

              <div>
                <Label>Pre-Approval MB Number</Label>
                <Input 
                  value={formData.pre_approval_mb_number}
                  onChange={(e) => setFormData({...formData, pre_approval_mb_number: e.target.value})}
                  placeholder="MB Number"
                />
              </div>

              <div>
                <Label>Emirate</Label>
                <Select 
                  value={formData.emirate} 
                  onValueChange={(value) => setFormData({...formData, emirate: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emirates.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Application Type *</Label>
                <Select 
                  value={formData.application_type} 
                  onValueChange={(value) => setFormData({...formData, application_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applicationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.application_type === 'other' && (
                <div>
                  <Label>Application Description *</Label>
                  <Input 
                    value={formData.application_type_description}
                    onChange={(e) => setFormData({...formData, application_type_description: e.target.value})}
                    placeholder="Describe the application type"
                    required
                  />
                </div>
              )}

              <div>
                <Label>Date of Application Created</Label>
                <Input 
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>

              <div>
  <Label>Expected Completion Date</Label>
  <Input
    type="date"
    value={formData.expected_completion}
    onChange={(e) =>
      setFormData({ ...formData, expected_completion: e.target.value })
    }
  />
</div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-amber-500 hover:bg-amber-600"
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : (application ? 'Update' : 'Create')} Application
          </Button>
        </div>
      </form>
    </div>
  );
}