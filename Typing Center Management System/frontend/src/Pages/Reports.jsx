import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from "@/services/invoicesApi";
import { getPayments } from "@/services/paymentsApi";
import { getClients } from "@/services/clientsApi";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Receipt,
  AlertCircle,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { data: invoices = [] } = useQuery({
  queryKey: ['invoices'],
  queryFn: getInvoices,
  refetchOnMount: true
});

const { data: payments = [] } = useQuery({
  queryKey: ['payments'],
  queryFn: getPayments,
  refetchOnMount: true
});

const { data: clients = [] } = useQuery({
  queryKey: ['clients'],
  queryFn: getClients,
  refetchOnMount: true
});
  // Available years (current and past 2 years)
    const years = Array.from({ length: 3 }, (_, i) => String(currentYear - i));

  // Monthly data for selected year
  const monthsOfYear = eachMonthOfInterval({
    start: startOfYear(new Date(parseInt(selectedYear), 0, 1)),
    end: endOfYear(new Date(parseInt(selectedYear), 0, 1))
  });

  const monthlyData = monthsOfYear.map(monthDate => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthInvoices = invoices.filter(inv => {
      if (!inv.date) return false;
      const invDate = parseISO(inv.date);
      return invDate >= monthStart && invDate <= monthEnd;
    });

    const monthPayments = payments.filter(pay => {
      const rawDate = pay.payment_date || pay.created_at;
if (!rawDate) return false;
const payDate = parseISO(rawDate);
      return payDate >= monthStart && payDate <= monthEnd;
    });

    const amount = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const receivables = monthInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
    const collections = monthPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const cashCollections = monthPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + (p.amount || 0), 0);
    const bankCollections = monthPayments.filter(p => p.method === 'bank_transfer').reduce((sum, p) => sum + (p.amount || 0), 0);
    const cardCollections = monthPayments.filter(p => ['card', 'cheque'].includes(p.method)).reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      month: format(monthDate, 'MMM'),
      fullMonth: format(monthDate, 'MMMM'),
      amount,
      receivables,
      collections,
      cash: cashCollections,
      bank: bankCollections,
      card: cardCollections
    };
  });

  // Yearly totals
  const yearlyTotals = monthlyData.reduce((acc, m) => ({
    amount: acc.amount + m.amount,
    receivables: acc.receivables + m.receivables,
    collections: acc.collections + m.collections,
    cash: acc.cash + m.cash,
    bank: acc.bank + m.bank,
    card: acc.card + m.card
  }), { amount: 0, receivables: 0, collections: 0, cash: 0, bank: 0, card: 0 });

  // Client Summary (Invoice-driven, ERP-grade)
const clientSummaryMap = {};

// Build from invoices (single source of truth)
invoices.forEach(inv => {
  const key =
    inv.client_id ||
    inv.client_name ||
    'walk-in';

  if (!clientSummaryMap[key]) {
    clientSummaryMap[key] = {
      id: inv.client_id || `walk-in-${key}`,
      name: inv.client_name || 'Walk-in Customer',
      invoiceCount: 0,
      totalAmount: 0,
      receivables: 0,
      totalPaid: 0,
      isWalkIn: !inv.client_id
    };
  }

  clientSummaryMap[key].invoiceCount += 1;
  clientSummaryMap[key].totalAmount += inv.total || 0;
  clientSummaryMap[key].receivables += inv.balance || 0;
});

// Finalize totals
const clientSummary = Object.values(clientSummaryMap)
  .map(c => ({
    ...c,
    totalPaid: c.totalAmount - c.receivables
  }))
  .sort((a, b) => b.totalAmount - a.totalAmount);


  // Payment method distribution
  const paymentDistribution = [
    { name: 'Cash', value: yearlyTotals.cash, color: '#10b981' },
    { name: 'Bank Transfer', value: yearlyTotals.bank, color: '#3b82f6' },
    { name: 'Card/Cheque', value: yearlyTotals.card, color: '#8b5cf6' },
  ].filter(p => p.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-500 mt-1">Financial overview and analytics</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Yearly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-amber-100 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">AED {yearlyTotals.amount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-slate-500 text-sm">Collections</p>
                <p className="text-2xl font-bold text-green-600">AED {yearlyTotals.collections.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-slate-500 text-sm">Receivables</p>
                <p className="text-2xl font-bold text-red-600">AED {yearlyTotals.receivables.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-slate-500 text-sm">Active Clients</p>
                <p className="text-2xl font-bold text-blue-600">{clientSummary.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          <TabsTrigger value="clients">Client Summary</TabsTrigger>
          <TabsTrigger value="payments">Payment Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue & Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value) => `AED ${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Bar dataKey="amount" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collections" name="Collections" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Receivables</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Bank Transfer</TableHead>
                    <TableHead className="text-right">Card/Cheque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.fullMonth}</TableCell>
                      <TableCell className="text-right font-semibold">AED {m.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">{m.receivables.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">{m.cash.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-blue-600">{m.bank.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-purple-600">{m.card.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">AED {yearlyTotals.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600">{yearlyTotals.receivables.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">{yearlyTotals.cash.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">{yearlyTotals.bank.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-purple-600">{yearlyTotals.card.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Receivables</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientSummary.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-center">{client.invoiceCount}</TableCell>
                      <TableCell className="text-right font-semibold">AED {client.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">{client.totalPaid.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">{client.receivables.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {client.receivables === 0 ? (
                          <Badge className="bg-green-100 text-green-700">Paid</Badge>
                        ) : client.totalPaid > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Unpaid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip formatter={(value) => `AED ${value.toLocaleString()}`} />
                      <Line 
                        type="monotone" 
                        dataKey="collections" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}