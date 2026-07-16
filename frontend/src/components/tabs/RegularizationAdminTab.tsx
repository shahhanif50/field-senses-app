import React from 'react';
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";
import { RegularizationRequest } from "@/data/sharedTypes";

export function RegularizationAdminTab() {
  const { regularizationRequests, setRegularizationRequests } = useMasterData();

  const handleApprove = (id: string) => {
    setRegularizationRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Approved' } : req));
    toast.success("Request approved successfully");
  };

  const handleDeny = (id: string) => {
    setRegularizationRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Denied' } : req));
    toast.success("Request denied");
  };

  const columns: Column<RegularizationRequest>[] = [
    { 
      header: "Employee", 
      key: "employeeName",
      render: (value: unknown, row: RegularizationRequest) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.employeeName}</span>
          {row.employeeId && <span className="text-xs text-slate-500">{row.employeeId}</span>}
        </div>
      )
    },
    { header: "Date", key: "date" },
    { header: "Request Type", key: "type" },
    { header: "Requested Time", key: "requestedTime" },
    { header: "Reason", key: "reason" },
    {
      header: "Status",
      key: "status",
      render: (value: unknown) => <StatusBadge status={value as string} />
    },
    {
      header: "Actions",
      key: "id",
      render: (value: unknown, row: RegularizationRequest) => (
        row.status === 'Pending' ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); handleApprove(value as string); }}>
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); handleDeny(value as string); }}>
              <X className="w-4 h-4 mr-1" /> Deny
            </Button>
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">Resolved</span>
        )
      )
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={regularizationRequests}
        columns={columns}
        searchPlaceholder="Search regularization requests..."
      />
    </div>
  );
}
