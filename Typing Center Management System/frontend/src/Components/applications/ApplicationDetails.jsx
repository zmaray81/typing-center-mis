import React, { useState } from 'react';
import { format } from 'date-fns';
import { updateApplication } from "@/services/applicationsApi";
import { Input } from "@/Components/ui/input";

import { 
  ArrowLeft, 
  Pencil, 
  CheckCircle2, 
  Circle,
  Clock,
  MapPin,
  Building2,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Textarea } from "@/Components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";

const statusColors = {
  
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  
};

const APPLICATION_STEPS = {
  new_visa_inside: [
    { value: 'first_visit', label: 'First Visit', description: 'Initial client visit' },
    { value: 'labour_insurance', label: 'Labour Insurance', description: 'Labour insurance processing' },
    { value: 'second_visit', label: 'Second Visit', description: 'Follow-up visit' },
    { value: 'evisa_inside', label: 'E-Visa (Inside)', description: 'E-Visa issuance (inside)' },
    { value: 'change_status', label: 'Change Status', description: 'Visa status change' },
    { value: 'medical_application', label: 'Medical Application', description: 'Medical test application' },
    { value: 'eid_application', label: 'Emirates ID Application', description: 'EID submission' },
    { value: 'third_visit', label: 'Third Visit', description: 'Final visit' },
    { value: 'iloe_insurance', label: 'ILOE Insurance', description: 'ILOE insurance' },
    { value: 'stamping', label: 'Stamping', description: 'Passport stamping' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  new_visa_outside: [
    { value: 'first_visit', label: 'First Visit', description: 'Initial client visit' },
    { value: 'labour_insurance', label: 'Labour Insurance', description: 'Labour insurance processing' },
    { value: 'second_visit', label: 'Second Visit', description: 'Follow-up visit' },
    { value: 'evisa_outside', label: 'E-Visa (Outside)', description: 'E-Visa issuance (outside)' },
    { value: 'medical_application', label: 'Medical Application', description: 'Medical test application' },
    { value: 'eid_application', label: 'Emirates ID Application', description: 'EID submission' },
    { value: 'third_visit', label: 'Third Visit', description: 'Final visit' },
    { value: 'iloe_insurance', label: 'ILOE Insurance', description: 'ILOE insurance' },
    { value: 'stamping', label: 'Stamping', description: 'Passport stamping' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  visa_renewal: [
    { value: 'labour_card_renewal', label: 'Labour Card Renewal', description: 'Labour card renewal' },
    { value: 'labour_insurance', label: 'Labour Insurance', description: 'Labour insurance' },
    { value: 'iloe_insurance', label: 'ILOE Insurance Renewal', description: 'ILOE renewal' },
    { value: 'medical_and_id', label: 'Medical and ID', description: 'Medical test & EID' },
    { value: 'stamping', label: 'Stamping', description: 'Passport stamping' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  visa_cancellation: [
    { value: 'labour_cancellation_typing', label: 'Labour Cancellation Typing', description: 'Typing labour cancellation' },
    { value: 'labour_cancellation_submission', label: 'Labour Cancellation Submission', description: 'Submit labour cancellation' },
    { value: 'immigration_cancellation', label: 'Immigration Cancellation', description: 'Immigration cancellation' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  new_license: [
    { value: 'initial_approval', label: 'Initial Approval', description: 'Partners & activities approval' },
    { value: 'trade_name', label: 'Trade Name Reservation', description: 'Reserve trade name' },
    { value: 'ejari', label: 'Ejari', description: 'Virtual or physical ejari' },
    { value: 'moa', label: 'MOA Typing & Signing', description: 'Memorandum preparation' },
    { value: 'payment_voucher', label: 'Payment Voucher', description: 'Voucher generation' },
    { value: 'license_issuance', label: 'Licence Issuance', description: 'License issued' },
    { value: 'establishment_card', label: 'Establishment Card', description: 'New establishment card' },
    { value: 'labour_file', label: 'Labour File Opening', description: 'Open labour file' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  license_renewal: [
    { value: 'followup_receipt', label: 'Followup Receipt Generation', description: 'Remove partner / location change' },
    { value: 'moa', label: 'New MOA Typing & Signing', description: 'MOA update' },
    { value: 'payment_voucher', label: 'Payment Voucher', description: 'Voucher generation' },
    { value: 'license_issuance', label: 'Licence Issuance', description: 'License renewal' },
    { value: 'establishment_card_renewal', label: 'Establishment Card Renewal', description: 'Renew establishment card' },
    { value: 'labour_update', label: 'Update Establishment in Labour', description: 'Labour update' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  labour_card_cancellation: [
    { value: 'labour_card_typing', label: 'Labour Card Cancellation Typing', description: 'Typing cancellation' },
    { value: 'labour_card_submission', label: 'Labour Card Cancellation Submission', description: 'Submit cancellation' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  labour_card_formation: [
    { value: 'labour_card_typing', label: 'Labour Card Typing', description: 'Typing labour card' },
    { value: 'labour_card_submission', label: 'Labour Card Submission', description: 'Submit labour card' },
    { value: 'labour_insurance', label: 'Labour Insurance', description: 'Insurance processing' },
    { value: 'work_permit_payment', label: 'Work Permit Payment', description: 'Payment transaction' },
    { value: 'completed', label: 'Completed', description: 'Process completed' }
  ],

  contract_modification: [
    { value: 'modify_work_permit', label: 'Modify Work Permit', description: 'Work permit modification' },
    { value: 'submission', label: 'Submission', description: 'Submission to authority' }
  ],

  other: []
};

export default function ApplicationDetails({ application, onClose, onEdit, onUpdate }) {
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepNote, setStepNote] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [updating, setUpdating] = useState(false);

  const steps = APPLICATION_STEPS[application.application_type] || [];
  const isOtherType =
  application.application_type === 'other';


const effectiveCurrentStep =
  typeof application.current_step === 'string'
    ? application.current_step
    : steps.length > 0
    ? steps[0].value
    : null;

  const getStepIndex = (stepValue) => steps.findIndex(s => s.value === stepValue);
  const currentStepIndex = getStepIndex(effectiveCurrentStep);

  const isStepCompleted = (stepValue) => {
    return application.steps_completed?.some(s => s.step === stepValue) || 
           getStepIndex(stepValue) < currentStepIndex;
  };

  const handleCompleteStep = async () => {
  setUpdating(true);

  const newStepsCompleted = [
  ...(application.steps_completed || []),
  {
    step: selectedStep,
    completed_date: format(new Date(), 'yyyy-MM-dd'),
    notes: stepNote,
    updated_by: updatedBy,
    updated_at: new Date().toISOString()
  }
];

  const currentIndex = steps.findIndex(s => s.value === selectedStep);
  const nextStep =
    currentIndex < steps.length - 1
      ? steps[currentIndex + 1].value
      : 'completed';

  await updateApplication(application.id, {
    steps_completed: newStepsCompleted,
    current_step: nextStep,
    status: nextStep === 'completed' ? 'completed' : 'in_progress',
    completion_date:
      nextStep === 'completed'
        ? format(new Date(), 'yyyy-MM-dd')
        : null
  });

  setShowStepDialog(false);
  setStepNote('');
  setSelectedStep(null);
  setUpdatedBy('');
  setUpdating(false);
  onUpdate();
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{application.person_name}</h1>
            <p className="text-slate-500">{application.application_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={statusColors[application.status]} size="lg">
            {application.status?.replace(/_/g, ' ')}
          </Badge>
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Cards */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Client</p>
                <p className="font-semibold">{application.client_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Person</p>
                <p className="font-semibold">{application.person_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Emirate</p>
                <p className="font-semibold capitalize">{application.emirate?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium capitalize">{application.application_type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Start Date</span>
                <span className="font-medium">
                  {application.start_date ? format(new Date(application.start_date), 'dd/MM/yyyy') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected</span>
                <span className="font-medium">
                  {application.expected_completion ? format(new Date(application.expected_completion), 'dd/MM/yyyy') : '-'}
                </span>
              </div>
              {application.completion_date && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-medium text-green-600">
                    {format(new Date(application.completion_date), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {application.notes && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-2">Notes</p>
              <p className="text-slate-700">{application.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Process Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Process Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">

{/* OTHER TYPE MANUAL COMPLETION */}
{isOtherType && application.status !== 'completed' && (
  <div className="mb-6">
    <Button
      className="bg-green-600 hover:bg-green-700"
      onClick={async () => {
        await updateApplication(application.id, {
          status: 'completed',
          completion_date: format(new Date(), 'yyyy-MM-dd')
        });
        onUpdate();
      }}
    >
      Mark as Completed
    </Button>
  </div>
)}

            {steps.map((step, index) => {
              const isCompleted = isStepCompleted(step.value);
              const isCurrent = effectiveCurrentStep === step.value;
              const completedData = application.steps_completed?.find(s => s.step === step.value);

              return (
                <div key={step.value} className="flex gap-4 pb-6 last:pb-0">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500' : isCurrent ? 'bg-amber-500' : 'bg-slate-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <Clock className="w-5 h-5 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-semibold ${
                          isCompleted ? 'text-green-700' : isCurrent ? 'text-amber-700' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </h3>
                        <p className="text-sm text-slate-500">{step.description}</p>
                      </div>
                      {isCurrent && application.status !== 'completed' && (
                        <Button 
                          size="sm" 
                          className="bg-amber-500 hover:bg-amber-600"
                          onClick={() => {
                            setSelectedStep(step.value);
                            setShowStepDialog(true);
                          }}
                        >
                          Complete Step
                        </Button>
                      )}
                    </div>
                    {completedData && (
  <div className="mt-2 p-3 bg-green-50 rounded-lg text-sm space-y-1">
    <p className="text-green-700">
      Completed on {format(new Date(completedData.completed_date), 'dd MMM yyyy')}
    </p>
    <p className="text-slate-600">
      Updated by: <strong>{completedData.updated_by}</strong>
    </p>
    {completedData.notes && (
      <p className="text-slate-600">{completedData.notes}</p>
    )}
  </div>
)}

                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

{/* Complete Step Dialog */}
<Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
  <DialogContent aria-describedby="step-dialog-description">
    <DialogHeader>
      <DialogTitle>Complete Step</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <p id="step-dialog-description" className="text-slate-600">
        Mark "{steps.find(s => s.value === selectedStep)?.label}" as completed?
      </p>
      
      <div>
        <label className="text-sm font-medium text-slate-700">
          Updated By <span className="text-red-500">*</span>
        </label>
        <Input
          value={updatedBy}
          onChange={(e) => setUpdatedBy(e.target.value)}
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Notes <span className="text-red-500">*</span>
        </label>
        <Textarea 
          value={stepNote}
          onChange={(e) => setStepNote(e.target.value)}
          placeholder="Explain what was done in this step..."
          rows={3}
          required
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowStepDialog(false)}
          className="flex-1"
        >
          Cancel
        </Button>

        <Button 
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleCompleteStep}
          disabled={
            updating ||
            !stepNote.trim() ||
            !updatedBy.trim()
          }
        >
          {updating ? 'Updating...' : 'Complete Step'}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );

}
