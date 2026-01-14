import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import ReceivablesDetail from '@/Components/dashboard/ReceivablesDetail.jsx';
import MonthlyRevenueDetail from '@/Components/dashboard/MonthlyRevenueDetail.jsx';

import { getInvoices, deleteInvoice } from "@/services/invoicesApi";
import { getClients } from "@/services/clientsApi";
import { getPayments } from "@/services/paymentsApi";
import { getApplications, deleteApplication } from "@/services/applicationsApi";


import { 
  TrendingUp, 
  TrendingDown,
  Receipt, 
  Users, 
  ClipboardList, 
  CreditCard,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Skeleton } from "@/Components/ui/skeleton";

export default function Dashboard() {
  const [showReceivables, setShowReceivables] = useState(false);
  const [showMonthlyRevenue, setShowMonthlyRevenue] = useState(false);

  const queryClient = useQueryClient();

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id) => {
      return await deleteInvoice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id) => {
      await deleteApplication(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
    refetchOnMount: true
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    refetchOnMount: true
  });

  const { data: applications = [], isLoading: loadingApplications } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications,
    refetchOnMount: true
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: getPayments,
    refetchOnMount: true
  });

  const isLoading = loadingInvoices || loadingClients || loadingApplications || loadingPayments;

  // Calculate stats
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthlyInvoices = invoices.filter(inv => {
    const invDate = parseISO(inv.date);
    return invDate >= monthStart && invDate <= monthEnd;
  });

  const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalReceivables = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const pendingApplications = applications.filter(app => app.status === 'pending' || app.status === 'in_progress').length;

  const monthlyPayments = payments.filter(pay => {
    const rawDate = pay.payment_date || pay.created_at;
if (!rawDate) return false;

const payDate = parseISO(rawDate);

    return payDate >= monthStart && payDate <= monthEnd;
  });

  const monthlyCollections = monthlyPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);

  const recentInvoices = invoices.slice(0, 5);
  const recentApplications = applications.slice(0, 5);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    on_hold: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const paymentStatusColors = {
    unpaid: 'bg-red-100 text-red-700',
    partial: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700'
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showReceivables) {
    return <ReceivablesDetail invoices={invoices} onClose={() => setShowReceivables(false)} />;
  }

  if (showMonthlyRevenue) {
    return <MonthlyRevenueDetail invoices={invoices} monthStart={monthStart} monthEnd={monthEnd} onClose={() => setShowMonthlyRevenue(false)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg shadow-amber-500/20 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setShowMonthlyRevenue(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold mt-1">AED {monthlyRevenue.toLocaleString()}</p>
                <p className="text-amber-100 text-xs mt-1">Click for breakdown</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Collections</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">AED {monthlyCollections.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowReceivables(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Receivables</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">AED {totalReceivables.toLocaleString()}</p>
                <p className="text-slate-400 text-xs mt-1">Click for details</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Link to={createPageUrl('Applications')}>
          <Card className="bg-white border border-slate-200 cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Active Applications</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{pendingApplications}</p>
                  <p className="text-slate-400 text-xs mt-1">Click to view</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to={createPageUrl('Quotations') + '?action=new'}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <span className="font-medium text-slate-700">New Quotation</span>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl('Invoices') + '?action=new'}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-slate-700">New Invoice</span>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl('Applications') + '?action=new'}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-slate-700">New Application</span>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl('Clients') + '?action=new'}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium text-slate-700">New Client</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
            <Link to={createPageUrl('Invoices')}>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No invoices yet</p>
              ) : (
                recentInvoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <Link 
                      to={createPageUrl('Invoices') + `?id=${invoice.id}`}
                      className="flex-1 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{invoice.client_name}</p>
                        <p className="text-sm text-slate-500">{invoice.invoice_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">AED {invoice.total?.toLocaleString()}</p>
                        <Badge className={paymentStatusColors[invoice.payment_status]}>
                          {invoice.payment_status}
                        </Badge>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Delete this invoice?')) {
                          deleteInvoiceMutation.mutate(invoice.id);
                        }
                      }}
                      className="ml-2 p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Active Applications</CardTitle>
            <Link to={createPageUrl('Applications')}>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentApplications.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No applications yet</p>
              ) : (
                recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <Link 
                      to={createPageUrl('Applications') + `?id=${app.id}`}
                      className="flex-1 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{app.person_name}</p>
                        <p className="text-sm text-slate-500">{app.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 capitalize">{app.application_type?.replace(/_/g, ' ')}</p>
                        <Badge className={statusColors[app.status]}>
                          {app.status?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Delete this application?')) {
                          deleteApplicationMutation.mutate(app.id);
                        }
                      }}
                      className="ml-2 p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}