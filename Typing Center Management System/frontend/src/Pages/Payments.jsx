import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPayments } from "@/services/paymentsApi";
import { format, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  CreditCard,
  Download,
  PieChart,
  FileText,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Building2,
  Filter,
  Calendar
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

const methodColors = {
  cash: 'bg-green-100 text-green-700',
  bank_transfer: 'bg-blue-100 text-blue-700',
  card: 'bg-purple-100 text-purple-700',
  cheque: 'bg-orange-100 text-orange-700'
};

const methodIcons = {
  cash: <DollarSign className="w-4 h-4" />,
  bank_transfer: <TrendingUp className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  cheque: <FileText className="w-4 h-4" />
};

const QUICK_DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'All Time', value: 'all_time' }
];

export default function Payments() {
  const navigate = useNavigate();
  const currentDate = new Date();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [methodFilter, setMethodFilter] = useState('all');
  const [quickDateFilter, setQuickDateFilter] = useState('this_month');
  const [showChart, setShowChart] = useState(false);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments
  });

  // Apply quick date filters
  const applyQuickDateFilter = (filter) => {
    const today = new Date();
    
    switch (filter) {
      case 'today':
        setSelectedMonth(String(today.getMonth() + 1).padStart(2, '0'));
        setSelectedYear(String(today.getFullYear()));
        // We'll handle day filtering differently in filteredPayments
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setSelectedMonth(String(yesterday.getMonth() + 1).padStart(2, '0'));
        setSelectedYear(String(yesterday.getFullYear()));
        break;
      case 'this_month':
        setSelectedMonth(String(today.getMonth() + 1).padStart(2, '0'));
        setSelectedYear(String(today.getFullYear()));
        break;
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        setSelectedMonth(String(lastMonth.getMonth() + 1).padStart(2, '0'));
        setSelectedYear(String(lastMonth.getFullYear()));
        break;
      case 'last_3_months':
        // Show all payments from last 3 months
        setSelectedMonth('all');
        setSelectedYear('all');
        break;
      case 'all_time':
        setSelectedMonth('all');
        setSelectedYear('all');
        break;
      default:
        setSelectedMonth(String(today.getMonth() + 1).padStart(2, '0'));
        setSelectedYear(String(today.getFullYear()));
    }
    
    setQuickDateFilter(filter);
  };

  // Get years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    // Date filter
    const rawDate = payment.payment_date || payment.created_at;
    if (!rawDate) return false;

    const payDate = parseISO(rawDate);
    
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      const monthMatch = format(payDate, 'MM') === selectedMonth;
      const yearMatch = format(payDate, 'yyyy') === selectedYear;
      
      // If filtering for "today"
      if (quickDateFilter === 'today') {
        const today = new Date();
        const isToday = 
          payDate.getDate() === today.getDate() &&
          payDate.getMonth() === today.getMonth() &&
          payDate.getFullYear() === today.getFullYear();
        if (!isToday) return false;
      }
      
      if (!monthMatch || !yearMatch) return false;
    }

    // Search filter
    const searchMatch = 
      payment.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(searchQuery.toLowerCase());

    // Method filter
    const methodMatch = methodFilter === 'all' || payment.method === methodFilter;
    
    return searchMatch && methodMatch;
  });

  // Calculate statistics
  const stats = {
    total: filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    cash: filteredPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + (p.amount || 0), 0),
    bankTransfer: filteredPayments.filter(p => p.method === 'bank_transfer').reduce((sum, p) => sum + (p.amount || 0), 0),
    cardCheque: filteredPayments.filter(p => p.method === 'card' || p.method === 'cheque').reduce((sum, p) => sum + (p.amount || 0), 0),
    count: filteredPayments.length,
    uniqueClients: new Set(filteredPayments.map(p => p.client_name)).size
  };

  // Format amount without decimals
  const formatAmount = (amount) => {
    return Math.round(amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Invoice #', 'Client', 'Amount', 'Method', 'Reference', 'Notes'];
    const csvData = filteredPayments.map(payment => [
      format(parseISO(payment.payment_date || payment.created_at), 'dd/MM/yyyy'),
      payment.invoice_number,
      payment.client_name,
      payment.amount,
      payment.method?.replace(/_/g, ' '),
      payment.reference || '-',
      payment.notes || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Handle row click - navigate to invoice
  const handleRowClick = (payment) => {
    if (payment.invoice_id) {
      navigate(`/invoices?id=${payment.invoice_id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500 mt-1">Track and manage all payment records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowChart(!showChart)}>
            <PieChart className="w-4 h-4 mr-2" />
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Collections</p>
                <p className="text-2xl font-bold mt-1">AED {formatAmount(stats.total)}</p>
                <p className="text-amber-100 text-xs mt-1">{stats.count} payments</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Cash</p>
                <p className="text-2xl font-bold text-green-600 mt-1">AED {formatAmount(stats.cash)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Bank Transfer</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">AED {formatAmount(stats.bankTransfer)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Card / Cheque</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">AED {formatAmount(stats.cardCheque)}</p>
                <p className="text-slate-400 text-xs mt-1">{stats.uniqueClients} clients</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section (if enabled) */}
      {showChart && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Payment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-16 h-16 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">Chart visualization coming soon</p>
                <p className="text-sm text-slate-400">Would show payment method distribution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by client, invoice, or reference..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Quick Date Filters */}
              <div className="flex flex-wrap gap-2">
                {QUICK_DATE_FILTERS.map(filter => (
                  <Button
                    key={filter.value}
                    variant={quickDateFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyQuickDateFilter(filter.value)}
                    className={quickDateFilter === filter.value ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Month/Year Selection */}
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-36">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    <SelectItem value="01">January</SelectItem>
                    <SelectItem value="02">February</SelectItem>
                    <SelectItem value="03">March</SelectItem>
                    <SelectItem value="04">April</SelectItem>
                    <SelectItem value="05">May</SelectItem>
                    <SelectItem value="06">June</SelectItem>
                    <SelectItem value="07">July</SelectItem>
                    <SelectItem value="08">August</SelectItem>
                    <SelectItem value="09">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Method Filter */}
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Summary */}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-700">{filteredPayments.length}</span> payments
                {selectedMonth !== 'all' && selectedYear !== 'all' && (
                  <span className="ml-2">
                    for {selectedMonth}/{selectedYear}
                  </span>
                )}
              </div>
              <div className="text-right">
                Total: <span className="font-bold text-amber-600">AED {formatAmount(stats.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Payment Records</CardTitle>
            <div className="text-sm text-slate-500">
              {filteredPayments.length} record{filteredPayments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No payments found for the selected filters
                    <p className="text-sm text-slate-400 mt-1">
                      Try changing your search or date range
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow 
                    key={payment.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    onClick={() => handleRowClick(payment)}
                  >
                    <TableCell className="font-medium">
                      {payment.payment_date ? format(parseISO(payment.payment_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium hover:text-amber-600 transition-colors">
                        {payment.invoice_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {payment.client_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      AED {formatAmount(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={methodColors[payment.method]} variant="outline">
                        <span className="flex items-center gap-1">
                          {methodIcons[payment.method]}
                          {payment.method?.replace(/_/g, ' ')}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {payment.reference || '-'}
                      {payment.notes && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">
                          {payment.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(payment);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer Summary */}
      {filteredPayments.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-500">Total Payments</p>
              <p className="text-xl font-bold text-slate-800">{stats.count}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Unique Clients</p>
              <p className="text-xl font-bold text-slate-800">{stats.uniqueClients}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-xl font-bold text-amber-600">AED {formatAmount(stats.total)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
