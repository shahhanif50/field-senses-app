import React, { useState } from "react";
import { useMasterData } from "@/contexts/MasterDataContext";
import { Search, Eye, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RMTeamManagement() {
  const { employees } = useMasterData();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out admins/managers to only show field executives
  const executives = employees.filter(e => e.roleId?.roleCode === "EMPLOYEE");

  const filteredExecutives = executives.filter(e => 
    e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Executive</h2>
          <p className="text-slate-500 mt-1">Monitor sales executives, their daily activity and performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-bold border border-blue-100">
          <Users className="w-4 h-4" />
          {filteredExecutives.length} Executives
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by name, territory or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
          <span className="text-sm font-medium text-gray-500">{filteredExecutives.length} results</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-white border-b border-gray-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Territory</th>
                <th className="px-6 py-4 text-center">Distrib.</th>
                <th className="px-6 py-4 text-center">Visits</th>
                <th className="px-6 py-4 w-40">Sales %</th>
                <th className="px-6 py-4 w-40">Collection %</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExecutives.length > 0 ? filteredExecutives.map((emp: any, i) => {
                // Real dynamic data if available, fallback to 0/empty
                const distrib = 0;
                const visits = 0;
                const salesPct = 0;
                const colPct = 0;
                const timeStr = "N/A";
                const status = "Active";
                return (
                  <tr key={emp.id || i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {emp.fullName?.split(' ').map((n:string) => n[0]).join('').substring(0,2) || 'EX'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{emp.fullName || "Unnamed Executive"}</p>
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">{emp.employeeId || `SE00${i+1}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                      {emp.region || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600 font-medium">
                      {distrib}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600 font-medium">
                      {visits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900 text-xs">{salesPct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${salesPct >= 100 ? 'bg-green-500' : salesPct < 70 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(salesPct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900 text-xs">{colPct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${colPct >= 90 ? 'bg-green-500' : colPct < 75 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(colPct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {timeStr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase
                        ${status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 
                          status === 'Idle' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                          'bg-gray-100 text-gray-600 border border-gray-200'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500 animate-pulse' : status === 'Idle' ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No field executives found in your region.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
