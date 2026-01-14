import React from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Building2 } from 'lucide-react';
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

export default function ReceivablesDetail({ invoices, onClose }) {
  const receivableInvoices = invoices.filter(inv => (inv.balance || 0) > 0);
  
  // Group by client
  const clientGroups = {};
  receivableInvoices.forEach(inv => {
    if (!clientGroups[inv.client_name]) {
      clientGroups[inv.client_name] = {
        client_name: inv.client_name,
        client_id: inv.client_id,
        invoices: []
      };
    }
    clientGroups[inv.client_name].invoices.push(inv);
  });

  const totalReceivables = receivableInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Receivables Breakdown</h1>
          <p className="text-slate-500">Total: AED {totalReceivables.toLocaleString()}</p>
        </div>
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
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.client_name}</CardTitle>
                    <p className="text-sm text-slate-500">{group.invoices.length} invoice(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Receivable</p>
                  <p className="text-xl font-bold text-red-600">AED {clientBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-lg font-semibold">AED {clientTotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Paid Amount</p>
                  <p className="text-lg font-semibold text-green-600">AED {clientPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Balance</p>
                  <p className="text-lg font-semibold text-red-600">AED {clientBalance.toLocaleString()}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.date ? format(parseISO(inv.date), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {inv.items?.slice(0, 2).map((item, i) => (
                            <div key={i} className="text-slate-600">{item.description}</div>
                          ))}
                          {inv.items?.length > 2 && (
                            <div className="text-slate-400">+{inv.items.length - 2} more</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">AED {inv.total?.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">AED {inv.amount_paid?.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">AED {inv.balance?.toLocaleString()}</TableCell>
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