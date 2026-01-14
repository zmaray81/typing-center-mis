import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getQuotations, deleteQuotation } from "@/services/quotationsApi";
import { getClients } from "@/services/clientsApi";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Trash2 } from 'lucide-react';
import { getUser, hasRole } from '@/services/authApi';

import { 
  Plus, 
  Search, 
  FileText,
  MoreVertical,
  Pencil,
} from "lucide-react";

import { Card, CardContent } from "@/Components/ui/card";
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

import QuotationForm from "@/Components/quotations/QuotationForm.jsx";

export default function Quotations() {
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConverted, setShowConverted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const user = getUser();
  const isAdmin = hasRole('admin');

  const deleteMutation = useMutation({
  mutationFn: deleteQuotation,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    setDeleteConfirm(null);
  },
  onError: (error) => {
    console.error('Failed to delete quotation:', error);
    alert(error.message || 'Failed to delete quotation');
    setDeleteConfirm(null);
  }
});

 const { data: quotations = [], isLoading } = useQuery({
  queryKey: ["quotations"],
  queryFn: getQuotations,
});

  const location = useLocation();

useEffect(() => {
  if (location.state?.editId) {
    const q = quotations.find(q => q.id === location.state.editId);
    if (q) {
      setEditingQuotation(q);
      setShowForm(true);
    }
  }
}, [location.state, quotations]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "new") {
      setShowForm(true);
    }
  }, []);

  const filteredQuotations = quotations.filter((q) => {
  // Filter by converted status
  if (showConverted) {
    // Show Converted History = ONLY converted quotations
    if (q.converted_to_invoice !== 1) return false;
  } else {
    // Hide Converted = ONLY non-converted quotations
    if (q.converted_to_invoice === 1) return false;
  }
  
  // Then filter by search query
  const matchesSearch =
    q.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.quotation_number?.toLowerCase().includes(searchQuery.toLowerCase());

  return matchesSearch;
});

  if (showForm) {
    return (
      <QuotationForm
        quotation={editingQuotation}
        clients={clients}
        onClose={() => {
          setShowForm(false);
          setEditingQuotation(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
          setShowForm(false);
          setEditingQuotation(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold text-slate-800">Quotations</h1>
    <p className="text-slate-500 mt-1">Create and manage quotations</p>
  </div>

  <div className="flex gap-2">
    <Button
      variant="outline"
      onClick={() => setShowConverted(prev => !prev)}
    >
      {showConverted ? "Hide Converted" : "Show Converted History"}
    </Button>

    <Button
      onClick={() => {
        setShowForm(true);
        setEditingQuotation(null);
      }}
      className="bg-amber-500 hover:bg-amber-600"
    >
      <Plus className="w-4 h-4 mr-2" />
      Create Quotation
    </Button>
  </div>
</div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search quotations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No quotations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotations.map((q) => (
                  <TableRow key={q.id} className="hover:bg-slate-50">

<TableCell>
  {q.quotation_number}
  {q.converted_to_invoice === 1 && (
    <Badge className="ml-2 bg-green-100 text-green-700">
      Converted
    </Badge>
  )}
</TableCell>

                    <TableCell className="font-medium">
                      {q.client_name || "-"}</TableCell>
                    <TableCell>
                      {q.service_description || q.person_name || "-"}
                    </TableCell>
                    <TableCell>
                      {q.date ? format(new Date(q.date), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      AED {q.total?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        
  <DropdownMenuContent align="end">
  {/* VIEW QUOTATION */}
  <DropdownMenuItem
    onClick={() => navigate(`/quotations/${q.id}/view`)}
  >
    👁 View
  </DropdownMenuItem>

  {/* VIEW INVOICE (only if converted) */}
  {q.converted_to_invoice === 1 && q.invoice_id && (
    <DropdownMenuItem
      onClick={() => navigate(`/invoices?id=${q.invoice_id}`)}
    >
      📄 View Invoice
    </DropdownMenuItem>
  )}

  {/* EDIT (disabled if converted) */}
  <DropdownMenuItem
    disabled={q.converted_to_invoice === 1}
    onClick={() => {
      setEditingQuotation(q);
      setShowForm(true);
    }}
  >
    <Pencil className="w-4 h-4 mr-2" />
    Edit
  </DropdownMenuItem>

  {/* NEW: DELETE (disabled if converted) */}
  {isAdmin && (
  <DropdownMenuItem
    className="text-red-600"
    disabled={q.converted_to_invoice === 1}
    onClick={() => setDeleteConfirm(q)}
  >
    <Trash2 className="w-4 h-4 mr-2" />
    Delete
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

      {/* Delete Confirmation Dialog */}
<AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete quotation {deleteConfirm?.quotation_number}?
        {deleteConfirm?.converted_to_invoice === 1 && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded">
            ⚠️ Cannot delete quotation that has been converted to invoice.
          </div>
        )}
        <div className="mt-2">
          <strong>Client:</strong> {deleteConfirm?.client_name}<br />
          <strong>Amount:</strong> AED {deleteConfirm?.total?.toLocaleString()}
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        className="bg-red-500 hover:bg-red-600"
        onClick={() => deleteMutation.mutate(deleteConfirm.id)}
        disabled={deleteConfirm?.converted_to_invoice === 1}
      >
        Delete Quotation
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </div>
  );
}
