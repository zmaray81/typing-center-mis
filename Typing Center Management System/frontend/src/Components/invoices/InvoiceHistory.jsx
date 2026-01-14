import React from 'react';
import { format } from 'date-fns';
import { History, User, Edit, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";

const actionIcons = {
  created: <Plus className="w-4 h-4 text-green-600" />,
  updated: <Edit className="w-4 h-4 text-blue-600" />,
  deleted: <Trash2 className="w-4 h-4 text-red-600" />
};

const actionColors = {
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  deleted: "bg-red-100 text-red-800"
};

export default function InvoiceHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No edit history found for this invoice.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Edit History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((log, index) => (
            <div key={log.id} className="border-l-2 border-blue-200 pl-4 pb-4 relative">
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full" />
              
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {actionIcons[log.action]}
                  <Badge className={actionColors[log.action]}>
                    {log.action.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    by {log.changed_by || 'System'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>

              {/* Changed fields */}
              {log.changed_fields && log.changed_fields.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Changed fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {log.changed_fields.map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Before/After comparison for important fields */}
              {log.action === 'updated' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Client Name */}
                  {log.old_data?.client_name !== log.new_data?.client_name && (
                    <>
                      <div className="bg-red-50 p-2 rounded">
                        <p className="font-medium text-red-700">Client:</p>
                        <p className="line-through">{log.old_data?.client_name}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="font-medium text-green-700">→ Client:</p>
                        <p>{log.new_data?.client_name}</p>
                      </div>
                    </>
                  )}

                  {/* Total Amount */}
                  {log.old_data?.total !== log.new_data?.total && (
                    <>
                      <div className="bg-red-50 p-2 rounded">
                        <p className="font-medium text-red-700">Total:</p>
                        <p className="line-through">AED {log.old_data?.total}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="font-medium text-green-700">→ Total:</p>
                        <p>AED {log.new_data?.total}</p>
                      </div>
                    </>
                  )}

                  {/* Payment Status */}
                  {log.old_data?.payment_status !== log.new_data?.payment_status && (
                    <>
                      <div className="bg-red-50 p-2 rounded">
                        <p className="font-medium text-red-700">Status:</p>
                        <Badge className="bg-red-100 text-red-800">
                          {log.old_data?.payment_status}
                        </Badge>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="font-medium text-green-700">→ Status:</p>
                        <Badge className="bg-green-100 text-green-800">
                          {log.new_data?.payment_status}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* IP Address info */}
              {log.ip_address && log.ip_address !== 'unknown' && (
                <p className="text-xs text-gray-500 mt-2">
                  IP: {log.ip_address}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}