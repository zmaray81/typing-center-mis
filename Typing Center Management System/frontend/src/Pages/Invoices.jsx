import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, deleteInvoice } from "@/services/invoicesApi";
import { getClients } from "@/services/clientsApi";
import { format } from 'date-fns';
import { getUser, hasRole } from '@/services/authApi';
import { 
  Plus, 
  Search, 
  Receipt,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  Eye,
  CreditCard,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
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
import InvoiceForm from '@/Components/invoices/InvoiceForm.jsx';
import InvoicePreview from '@/Components/invoices/InvoicePreview.jsx';
import PaymentDialog from '@/Components/invoices/PaymentDialog.jsx';

const paymentStatusColors = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700'
};

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();
  const user = getUser();
  const isAdmin = hasRole('admin');

  const { data: invoices = [], isLoading } = useQuery({
  queryKey: ['invoices'],
  queryFn: getInvoices
});

  const { data: clients = [] } = useQuery({
  queryKey: ['clients'],
  queryFn: getClients
});

  const deleteMutation = useMutation({
  mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice. Please try again.');
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
      const invoice = invoices.find(i => i.id === viewId);
      if (invoice) setViewingInvoice(invoice);
    }
  }, [invoices]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.person_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (showForm) {
    return (
      <InvoiceForm 
        invoice={editingInvoice}
        clients={clients}
        onClose={() => { setShowForm(false); setEditingInvoice(null); }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          setShowForm(false);
          setEditingInvoice(null);
        }}
      />
    );
  }

  if (viewingInvoice) {
    return (
      <InvoicePreview 
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        onEdit={() => {
          setEditingInvoice(viewingInvoice);
          setViewingInvoice(null);
          setShowForm(true);
        }}
        onRecordPayment={() => {
          setPaymentInvoice(viewingInvoice);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
          <p className="text-slate-500 mt-1">Manage invoices and track payments</p>
        </div>
        <Button 
          onClick={() => { setShowForm(true); setEditingInvoice(null); }}
          className="bg-amber-500 hover:bg-amber-600"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search invoices..." 
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
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
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
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setViewingInvoice(invoice)}
                  >
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client_name}</TableCell>
                    <TableCell>{invoice.person_name || '-'}</TableCell>
                    <TableCell>{invoice.date ? format(new Date(invoice.date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="font-semibold">AED {invoice.total?.toLocaleString()}</TableCell>
                    <TableCell className={invoice.balance > 0 ? 'text-red-600 font-semibold' : ''}>
                      AED {(invoice.balance || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentStatusColors[invoice.payment_status]}>
                        {invoice.payment_status}
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
                          <DropdownMenuItem onClick={() => setViewingInvoice(invoice)}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingInvoice(invoice);
                            setShowForm(true);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {invoice.payment_status !== 'paid' && (
                            <DropdownMenuItem onClick={() => setPaymentInvoice(invoice)}>
                              <CreditCard className="w-4 h-4 mr-2" /> Record Payment
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteConfirm(invoice)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
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

      {/* Payment Dialog */}
      {paymentInvoice && (
        <PaymentDialog 
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setPaymentInvoice(null);
            if (viewingInvoice?.id === paymentInvoice.id) {
              // Refresh viewing invoice
              const refreshed = invoices.find(i => i.id === paymentInvoice.id);
              if (refreshed) setViewingInvoice(refreshed);
            }
          }}
        />
      )}
    </div>
  );
}