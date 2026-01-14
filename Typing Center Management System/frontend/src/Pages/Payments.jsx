import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPayments } from "@/services/paymentsApi";
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Search, 
  CreditCard,
  Download,
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

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function Payments() {
  const currentDate = new Date();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [methodFilter, setMethodFilter] = useState('all');

const { data: payments = [], isLoading } = useQuery({
  queryKey: ["payments"],
  queryFn: getPayments
});


  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

  const filteredPayments = payments.filter(payment => {
  const rawDate = payment.payment_date || payment.created_at;
  if (!rawDate) return false;

  const payDate = parseISO(rawDate);
  const monthMatch = format(payDate, 'MM') === selectedMonth;
  const yearMatch = format(payDate, 'yyyy') === selectedYear;

    const searchMatch = 
      payment.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const methodMatch = methodFilter === 'all' || payment.method === methodFilter;
    
    return monthMatch && yearMatch && searchMatch && methodMatch;
  });

  // Calculate totals
  const totalCash = filteredPayments
    .filter(p => p.method === 'cash')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalBankTransfer = filteredPayments
    .filter(p => p.method === 'bank_transfer')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalCard = filteredPayments
    .filter(p => p.method === 'card' || p.method === 'cheque')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500 mt-1">Track all payment records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-5">
            <p className="text-amber-100 text-sm">Total Collections</p>
            <p className="text-2xl font-bold mt-1">AED {totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-slate-500 text-sm">Cash</p>
            <p className="text-2xl font-bold text-green-600 mt-1">AED {totalCash.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-slate-500 text-sm">Bank Transfer</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">AED {totalBankTransfer.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-slate-500 text-sm">Card / Cheque</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">AED {totalCard.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by client or invoice..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="card">Card / Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
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
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No payments found for this period
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.payment_date ? format(parseISO(payment.payment_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="font-medium">{payment.invoice_number}</TableCell>
                    <TableCell>{payment.client_name}</TableCell>
                    <TableCell className="font-semibold">AED {payment.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={methodColors[payment.method]}>
                        {payment.method?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{payment.reference || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}