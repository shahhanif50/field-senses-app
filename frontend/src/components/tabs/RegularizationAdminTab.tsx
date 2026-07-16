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

  const handleApproveAll = () => {
    setRegularizationRequests(prev => prev.map(req => req.status === 'Pending' ? { ...req, status: 'Approved' } : req));
    toast.success("All pending requests approved");
  };

  const handleDenyAll = () => {
    setRegularizationRequests(prev => prev.map(req => req.status === 'Pending' ? { ...req, status: 'Denied' } : req));
    toast.success("All pending requests denied");
  };

  const pendingCount = regularizationRequests.filter(req => req.status === 'Pending').length;

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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Pending Requests</h3>
          <p className="text-sm text-slate-500">You have {pendingCount} pending requests to review</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
            disabled={pendingCount === 0}
            onClick={handleDenyAll}
          >
            <X className="w-4 h-4 mr-2" /> Deny All
          </Button>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            disabled={pendingCount === 0}
            onClick={handleApproveAll}
          >
            <Check className="w-4 h-4 mr-2" /> Approve All
          </Button>
        </div>
      </div>

      <DataTable
        data={[...regularizationRequests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        columns={columns}
        searchPlaceholder="Search regularization requests..."
      />
    </div>
  );
}
