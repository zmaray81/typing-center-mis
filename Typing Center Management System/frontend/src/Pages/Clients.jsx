import {
  getClients,
  createClient,
  updateClient,
  deleteClient
} from "@/services/clientsApi";

import React, { useState, useEffect } from 'react';
import { getUser, hasRole } from '@/services/authApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { 
  Plus, 
  Search, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/cardomponents/ui/label";
import { Badge } from "@/Components/ui/badge";
import { Textarea } from "@/Components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
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

const emirates = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'ras_al_khaimah', label: 'Ras Al Khaimah' },
  { value: 'fujairah', label: 'Fujairah' },
  { value: 'umm_al_quwain', label: 'Umm Al Quwain' },
];

const emptyClient = {
  client_type: 'company',
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  trade_license_number: '',
  emirate: 'dubai',
  address: '',
  is_new_client: true,
  notes: ''
};

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(emptyClient);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const queryClient = useQueryClient();
  const user = getUser();
  const isAdmin = hasRole('admin');

  const { data: clients = [], isLoading } = useQuery({
  queryKey: ['clients'],
  queryFn: getClients
});

  const createMutation = useMutation({
  mutationFn: createClient,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setShowForm(false);
    setFormData(emptyClient);
  }
});

  const updateMutation = useMutation({
  mutationFn: ({ id, data }) => updateClient(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setShowForm(false);
    setEditingClient(null);
    setFormData(emptyClient);
  }
});


  const softDeleteMutation = useMutation({
  mutationFn: ({ id }) => deleteClient(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setDeleteConfirm(null);
  }
});

  const handleDelete = () => {
  softDeleteMutation.mutate({ id: deleteConfirm.id });
};


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, []);

  const generateClientID = () => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    return `CLI-${year}-${seq}`;
  };

 const checkDuplicate = (name, phone, email) => {
  if (!clients || clients.length === 0) return null;
  
  const duplicate = clients.find(c => {
    // Skip the current editing client
    if (editingClient && c.id === editingClient.id) return false;
    
    // Check by phone (exact match)
    if (phone && c.phone && c.phone.trim() === phone.trim()) {
      console.log("Duplicate found by phone:", c);
      return true;
    }
    
    // Check by email (case-insensitive)
    if (email && c.email && c.email.toLowerCase().trim() === email.toLowerCase().trim()) {
      console.log("Duplicate found by email:", c);
      return true;
    }
    
    // Check by company name for company clients
    if (formData.client_type === 'company' && name && c.company_name) {
      if (c.company_name.toLowerCase().trim() === name.toLowerCase().trim()) {
        console.log("Duplicate found by company name:", c);
        return true;
      }
    }
    
    // Check by contact person for individual clients
    if (formData.client_type === 'individual' && name && c.contact_person) {
      if (c.contact_person.toLowerCase().trim() === name.toLowerCase().trim()) {
        console.log("Duplicate found by contact person:", c);
        return true;
      }
    }
    
    return false;
  });
  
  return duplicate || null;
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // First check for duplicates locally
  const duplicate = checkDuplicate(
    formData.client_type === 'company' ? formData.company_name : formData.contact_person,
    formData.phone,
    formData.email
  );

  if (duplicate) {
    setDuplicateWarning(duplicate);
    return;
  }

  try {
    const dataToSubmit = {
      ...formData,
    };

    if (editingClient) {
      await updateMutation.mutate({ id: editingClient.id, data: dataToSubmit });
    } else {
      await createMutation.mutate(dataToSubmit);
    }
  } catch (err) {
    console.error("Error creating client:", err);
    
    // Check if it's a duplicate error from backend
    if (err.message.includes("DUPLICATE") || err.message.includes("already exists")) {
      // Try to get duplicate info from backend
      try {
        // You might need to parse the error to get duplicate data
        // For now, we'll use the local check as fallback
        const localDuplicate = checkDuplicate(
          formData.client_type === 'company' ? formData.company_name : formData.contact_person,
          formData.phone,
          formData.email
        );
        
        if (localDuplicate) {
          setDuplicateWarning(localDuplicate);
        } else {
          alert("Client already exists. Please check the details.");
        }
      } catch {
        alert("A client with these details already exists.");
      }
      return;
    }
    
    alert(err.message || "Failed to save client");
  }
};

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData(client);
    setShowForm(true);
  };

  const filteredClients = clients.filter(client => {
    // backend already excludes deleted clients
    const searchLower = searchQuery.toLowerCase();
    return (
      client.client_code?.toLowerCase().includes(searchLower) ||
      client.company_name?.toLowerCase().includes(searchLower) ||
      client.contact_person?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
    {/* Header with Client Count */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-slate-500">Manage your clients and companies</p>
          <Badge variant="outline" className="text-xs">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'}
          </Badge>
        </div>
      </div>
      <Button 
        onClick={() => { setShowForm(true); setFormData(emptyClient); setEditingClient(null); }}
        className="bg-amber-500 hover:bg-amber-600"
      >
        <Plus className="w-4 h-4 mr-2" /> Add Client
      </Button>
    </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search by name, ID, phone..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredClients.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No clients found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                Add your first client
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      client.client_type === 'company' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {client.client_type === 'company' ? (
                        <Building2 className="w-5 h-5 text-amber-600" />
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {client.client_type === 'company' ? client.company_name : client.contact_person}
                      </p>
                      {client.client_type === 'company' && client.contact_person && (
                        <p className="text-sm text-slate-500">{client.contact_person}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(client)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      {isAdmin && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteConfirm(client)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {client.phone}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {client.email}
                    </div>
                  )}
                  {client.emirate && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {emirates.find(e => e.value === client.emirate)?.label}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  {client.client_code && (
                    <Badge variant="outline" className="text-xs">
                      {client.client_code}
                    </Badge>
                  )}
                  {client.trade_license_number && (
                    <Badge variant="outline" className="text-xs">
                      TL: {client.trade_license_number}
                    </Badge>
                  )}
                </div>
                {client.notes && (
                 <div className="mt-3 pt-3 border-t border-slate-100">
                   <p className="text-xs text-slate-500 mb-1">Notes:</p>
                   <p className="text-sm text-slate-700 line-clamp-2">{client.notes}</p>
                 </div>
                  )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingClient(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
            {editingClient ? 'Update client information' : 'Add a new client to the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Client Type</Label>
              <Select 
                value={formData.client_type} 
                onValueChange={(value) => setFormData({...formData, client_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.client_type === 'company' && (
              <div>
                <Label>Company Name *</Label>
                <Input 
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  required
                />
              </div>
            )}

            <div>
              <Label>Contact Person *</Label>
              <Input 
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone *</Label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Trade License No.</Label>
                <Input 
                  value={formData.trade_license_number}
                  onChange={(e) => setFormData({...formData, trade_license_number: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>New Client?</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={formData.is_new_client === true}
                    onChange={() => setFormData({...formData, is_new_client: true})}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={formData.is_new_client === false}
                    onChange={() => setFormData({...formData, is_new_client: false})}
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingClient ? 'Update' : 'Create'} Client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
<AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Client</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to remove this client from the clients list?
        <br />
        <span className="text-sm text-slate-500">
          This action only hides the client from the Clients module.
          Quotations, invoices, and applications remain unchanged.
        </span>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-500 hover:bg-red-600"
        onClick={handleDelete}
        disabled={softDeleteMutation.isPending}
      >
        Delete Client
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* Duplicate Warning */}
<AlertDialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Client Already Exists</AlertDialogTitle>
      <AlertDialogDescription>
        A client with similar details already exists in the system.
      </AlertDialogDescription>
    </AlertDialogHeader>
    {duplicateWarning && (
      <div className="py-4">
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
          <p className="font-medium text-slate-800">
            {duplicateWarning.client_type === 'company' 
              ? `Company: ${duplicateWarning.company_name}` 
              : `Individual: ${duplicateWarning.contact_person}`}
          </p>
          {duplicateWarning.phone && (
            <p className="text-sm text-slate-600 mt-1">
              📞 {duplicateWarning.phone}
            </p>
          )}
          {duplicateWarning.email && (
            <p className="text-sm text-slate-600">
              ✉️ {duplicateWarning.email}
            </p>
          )}
          {duplicateWarning.client_code && (
            <p className="text-xs text-slate-500 mt-1">
              ID: {duplicateWarning.client_code}
            </p>
          )}
        </div>
        
        <p className="text-sm text-slate-600 mb-4">
          Would you like to view the existing client record?
        </p>
      </div>
    )}
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      {duplicateWarning && (
        <AlertDialogAction onClick={() => {
          handleEdit(duplicateWarning);
          setDuplicateWarning(null);
        }}>
          View Existing Client
        </AlertDialogAction>
      )}
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </div>
  );
}