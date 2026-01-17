import React from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Building2, User } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";

export default function MonthlyRevenueDetail({ invoices, monthStart, monthEnd, onClose }) {
  const monthlyInvoices = invoices.filter(inv => {
    if (!inv.date) return false;
    const invDate = parseISO(inv.date);
    return invDate >= monthStart && invDate <= monthEnd;
  });

  // Group by client
  const clientGroups = {};
  monthlyInvoices.forEach(inv => {
    if (!clientGroups[inv.client_name]) {
      clientGroups[inv.client_name] = {
        client_name: inv.client_name,
        client_id: inv.client_id,
        invoices: []
      };
    }
    clientGroups[inv.client_name].invoices.push(inv);
  });

  const totalRevenue = monthlyInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalReceived = monthlyInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalReceivable = monthlyInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {format(monthStart, 'MMMM yyyy')} Revenue Breakdown
          </h1>
          <p className="text-slate-500">{monthlyInvoices.length} invoice(s) • {Object.keys(clientGroups).length} client(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-slate-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-amber-600">AED {Math.round(totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-slate-500 text-sm">Received</p>
            <p className="text-2xl font-bold text-green-600">AED {Math.round(totalReceived).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-slate-500 text-sm">Receivable</p>
            <p className="text-2xl font-bold text-red-600">AED {Math.round(totalReceivable).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
      </div>

      {Object.values(clientGroups).map((group) => {
        const clientTotal = group.invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const clientPaid = group.invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
        const clientBalance = group.invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

        return (
          <Card key={group.client_name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.client_name}</CardTitle>
                    <p className="text-sm text-slate-500">{group.invoices.length} invoice(s) • AED {Math.round(clientTotal).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Services Provided</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.date ? format(parseISO(inv.date), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs">
                          {inv.items?.map((item, i) => (
                            <div key={i} className="text-slate-600">{item.description}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">AED {Math.round(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right text-green-600">AED {Math.round(inv.amount_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right text-red-600">AED {Math.round(inv.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
