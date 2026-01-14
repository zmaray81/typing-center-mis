import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getApplications, deleteApplication } from '@/services/applicationsApi';
import { getClients } from "@/services/clientsApi";
import { getUser, hasRole } from '@/services/authApi';
import { 
  Plus, 
  Search, 
  ClipboardList,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'; // Added CheckCircle and XCircle
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/cardcomponents/ui/input";
import { Badge } from "@/Components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import ApplicationForm from '@/Components/applications/ApplicationForm.jsx';
import ApplicationDetails from '@/Components/applications/ApplicationDetails.jsx';

const statusColors = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const applicationTypes = {
  new_visa_inside: 'New Visa (Inside)',
  new_visa_outside: 'New Visa (Outside)',
  visa_renewal: 'Visa Renewal',
  visa_cancellation: 'Visa Cancellation',
  new_license: 'Company License (New)',
  license_renewal: 'Company License Renewal',
  labour_card_formation: 'Labour Card Formation',
  labour_card_cancellation: 'Labour Card Cancellation',
  contract_modification: 'Contract Modification',
  other: 'Other'
};

const STEP_LABELS = {
  first_visit: 'First Visit',
  labour_insurance: 'Labour Insurance',
  second_visit: 'Second Visit',
  evisa_inside: 'E-Visa (Inside)',
  evisa_outside: 'E-Visa (Outside)',
  change_status: 'Change Status',
  medical_application: 'Medical Application',
  eid_application: 'Emirates ID Application',
  third_visit: 'Third Visit',
  iloe_insurance: 'ILOE Insurance',
  stamping: 'Stamping',

  labour_card_renewal: 'Labour Card Renewal',
  iloe_insurance_renewal: 'ILOE Insurance Renewal',
  medical_and_id: 'Medical & ID',

  labour_cancellation_typing: 'Labour Cancellation Typing',
  labour_cancellation_submission: 'Labour Cancellation Submission',
  immigration_cancellation: 'Immigration Cancellation',

  initial_approval: 'Initial Approval',
  trade_name_reservation: 'Trade Name Reservation',
  ejari: 'Ejari',
  moa_typing: 'MOA Typing & Signing',
  payment_voucher: 'Payment Voucher',
  license_issuance: 'Licence Issuance',
  new_establishment_card: 'New Establishment Card',
  labour_file_opening: 'Labour File Opening',

  followup_receipt: 'Follow-up Receipt',
  new_moa_typing: 'New MOA Typing & Signing',
  establishment_card_renewal: 'Establishment Card Renewal',
  update_establishment_labour: 'Update Establishment in Labour',

  labour_card_typing: 'Labour Card Typing',
  labour_card_submission: 'Labour Card Submission',
  work_permit_payment: 'Work Permit Payment',

  labour_card_cancellation_typing: 'Labour Card Cancellation Typing',
  labour_card_cancellation_submission: 'Labour Card Cancellation Submission',

  modify_work_permit: 'Modify Work Permit',
  submission: 'Submission',

  completed: 'Completed'
};


export default function Applications() {
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [viewingApplication, setViewingApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false); // NEW STATE
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();
  const user = getUser();
  const isAdmin = hasRole('admin');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeleteConfirm(null);
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
    const viewId = urlParams.get('id');
    if (viewId) {
      const app = applications.find(a => a.id === viewId);
      if (app) setViewingApplication(app);
    }
  }, [applications]);

  // UPDATED FILTER LOGIC
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.person_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.application_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesType = typeFilter === 'all' || app.application_type === typeFilter;
    
    // NEW: Hide completed if showCompleted is false
    if (app.status === 'completed' && !showCompleted) {
      return false;
    }
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (showForm) {
    return (
      <ApplicationForm 
        application={editingApplication}
        clients={clients}
        onClose={() => { setShowForm(false); setEditingApplication(null); }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          setShowForm(false);
          setEditingApplication(null);
        }}
      />
    );
  }

  if (viewingApplication) {
    return (
      <ApplicationDetails 
        application={viewingApplication}
        onClose={() => setViewingApplication(null)}
        onEdit={() => {
          setEditingApplication(viewingApplication);
          setViewingApplication(null);
          setShowForm(true);
        }}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['applications'] });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Applications</h1>
          <p className="text-slate-500 mt-1">Track visa and company service applications</p>
        </div>
        <div className="flex gap-2"> {/* ADDED DIV WRAPPER */}
          {/* NEW TOGGLE BUTTON */}
          <Button 
            variant="outline"
            onClick={() => setShowCompleted(!showCompleted)}
            className={`flex items-center gap-2 ${showCompleted ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
          >
            {showCompleted ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {showCompleted ? 'Showing Completed' : 'Hide Completed'}
          </Button>
          
          <Button 
            onClick={() => { setShowForm(true); setEditingApplication(null); }}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" /> New Application
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search applications..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            
            <SelectItem value="in_progress">In Progress</SelectItem>
            
            <SelectItem value="completed">Completed</SelectItem>
            
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(applicationTypes).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>MB Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Current Step</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="h-16">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow 
                    key={app.id} 
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setViewingApplication(app)}
                  >
                    <TableCell className="font-medium">{app.person_name}</TableCell>
                    <TableCell>{app.client_name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{app.pre_approval_mb_number || '-'}</TableCell>
                    <TableCell>{applicationTypes[app.application_type] || app.application_type}</TableCell>
                    
                    <TableCell className="font-medium">
  {app.current_step
    ? STEP_LABELS[app.current_step] || 'In Progress'
    : 'In Progress'}
</TableCell>

                    <TableCell>{app.start_date ? format(new Date(app.start_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status]}>
                        {app.status?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingApplication(app)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingApplication(app);
                            setShowForm(true);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {isAdmin && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteConfirm(app)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                          )}
                          </DropdownMenuContent>
                          </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

}
