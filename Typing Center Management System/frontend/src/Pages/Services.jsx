import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  Search, 
  Settings,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { Textarea } from "@/Components/ui/textarea";
import { Switch } from "@/Components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";

const categories = [
  { value: 'visa_service', label: 'Visa Service' },
  { value: 'company_service', label: 'Company Service' },
  { value: 'labour_service', label: 'Labour Service' },
  { value: 'other', label: 'Other' },
];

const serviceTypes = [
  { value: 'job_offer', label: 'Job Offer' },
  { value: 'labour_insurance', label: 'Labour Insurance' },
  { value: 'labour_payment', label: 'Labour Payment' },
  { value: 'evisa_inside', label: 'E-Visa Inside' },
  { value: 'evisa_outside', label: 'E-Visa Outside' },
  { value: 'change_status', label: 'Change Status' },
  { value: 'medical_eid', label: 'Medical EID' },
  { value: 'contract_submission', label: 'Contract Submission' },
  { value: 'stamping', label: 'Stamping' },
  { value: 'license_renewal', label: 'License Renewal' },
  { value: 'new_license', label: 'New License' },
  { value: 'establishment_card', label: 'Establishment Card' },
  { value: 'labour_card', label: 'Labour Card' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'contract_modification', label: 'Contract Modification' },
  { value: 'trade_name', label: 'Trade Name' },
  { value: 'ejari', label: 'Ejari' },
  { value: 'payment_voucher', label: 'Payment Voucher' },
  { value: 'memorandum_signing', label: 'Memorandum Signing' },
  { value: 'health_certificate', label: 'Health Certificate' },
  { value: 'service_charge', label: 'Service Charge' },
  { value: 'other', label: 'Other' },
];

const emptyService = {
  name: '',
  category: 'visa_service',
  service_type: 'other',
  default_price_dubai: 0,
  default_price_other_emirates: 0,
  is_active: true,
  description: ''
};

export default function Services() {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(emptyService);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setFormData(emptyService);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setEditingService(null);
      setFormData(emptyService);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteConfirm(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData(service);
    setShowForm(true);
  };

  const toggleActive = async (service) => {
    await base44.entities.Service.update(service.id, { is_active: !service.is_active });
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryColors = {
    visa_service: 'bg-blue-100 text-blue-700',
    company_service: 'bg-amber-100 text-amber-700',
    labour_service: 'bg-green-100 text-green-700',
    other: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Services</h1>
          <p className="text-slate-500 mt-1">Manage service catalog and default pricing</p>
        </div>
        <Button 
          onClick={() => { setShowForm(true); setFormData(emptyService); setEditingService(null); }}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Service
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search services..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Dubai (AED)</TableHead>
                <TableHead className="text-right">Other Emirates</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-16">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    <Settings className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No services found
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id} className={!service.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge className={categoryColors[service.category]}>
                        {categories.find(c => c.value === service.category)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{service.service_type?.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-right">{service.default_price_dubai?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-right">{service.default_price_other_emirates?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={service.is_active}
                        onCheckedChange={() => toggleActive(service)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(service)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteConfirm(service)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
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

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingService(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Service Name *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Type</Label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => setFormData({...formData, service_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Default Price - Dubai (AED)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.default_price_dubai || ''}
                  onChange={(e) => setFormData({...formData, default_price_dubai: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Default Price - Other Emirates</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.default_price_other_emirates || ''}
                  onChange={(e) => setFormData({...formData, default_price_other_emirates: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
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
                {editingService ? 'Update' : 'Create'} Service
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
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