import React, { useState, useEffect } from 'react';
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";
import { RegularizationRequest } from "@/data/sharedTypes";

export function RegularizationAdminTab() {
  // Use local state, fetch from API
  const [requests, setRequests] = useState<RegularizationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { employees } = useMasterData();

  useEffect(() => {
    fetchRequests(true);
    const intervalId = setInterval(() => {
      fetchRequests(false);
    }, 5000); // Auto-refresh every 5 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchRequests = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await fetch('/api/ops/regularization-requests/', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: RegularizationRequest['status']) => {
    try {
      const res = await fetch(`/api/ops/regularization-requests/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    await updateRequestStatus(id, 'Approved');
    toast.success("Request approved successfully");
  };

  const handleDeny = async (id: string) => {
    await updateRequestStatus(id, 'Denied');
    toast.success("Request denied");
  };

  const handleApproveAll = async () => {
    const pending = requests.filter(req => req.status === 'Pending');
    for (const req of pending) {
      await updateRequestStatus(req.id, 'Approved');
    }
    toast.success("All pending requests approved");
  };

  const handleDenyAll = async () => {
    const pending = requests.filter(req => req.status === 'Pending');
    for (const req of pending) {
      await updateRequestStatus(req.id, 'Denied');
    }
    toast.success("All pending requests denied");
  };

  const pendingCount = requests.filter(req => req.status === 'Pending').length;

  const columns: Column<RegularizationRequest>[] = [
    { 
      header: "Employee", 
      key: "employeeName",
      render: (value: unknown, row: RegularizationRequest) => {
        const emp = employees.find(e => e.employeeId === row.employeeId);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
              {emp?.profilePhoto ? (
                <img src={emp.profilePhoto} alt={row.employeeName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-slate-500">{row.employeeName?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">{row.employeeName}</span>
              {row.employeeId && <span className="text-[10px] uppercase font-bold text-slate-400">{row.employeeId}</span>}
            </div>
          </div>
        );
      }
    },
    { header: "Date", key: "date" },
    { header: "Request Type", key: "type" },
    { header: "Requested Time", key: "requestedTime" },
    { header: "Reason", key: "reason" },
    {
      header: "Status",
      key: "status",
      render: (value: unknown) => <StatusBadge status={value as any} />
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

      {loading ? (
        <div className="flex justify-center p-8 text-slate-500">Loading requests...</div>
      ) : (
        <DataTable
          data={[...requests].sort((a: any, b: any) => {
            if (a.timestamp && b.timestamp) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          })}
          columns={columns}
          searchPlaceholder="Search regularization requests..."
        />
      )}
    </div>
  );
}
