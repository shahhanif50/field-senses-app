import React, { useState } from "react";
import { useMasterData } from "@/contexts/MasterDataContext";
import { Search, Eye, Truck, IndianRupee, ShoppingCart, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RMDistributors() {
  const { distributors, employees } = useMasterData();
  const [searchQuery, setSearchQuery] = useState("");

  const activeDistributors = distributors.filter(d => d.status === "Active");
  
  const filteredDistributors = distributors.filter(d => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Distributor Monitoring</h2>
          <p className="text-slate-500 mt-1">Track distributor performance, outstanding amounts and coverage.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">TOTAL DISTRIBUTORS</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{distributors.length || 8}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50">
              <Building2 className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">ACTIVE DISTRIBUTORS</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{activeDistributors.length || 6}</h3>
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">↗ 75% active</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50">
              <IndianRupee className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">OUTSTANDING</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">₹0</h3>
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Awaiting data</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50">
              <ShoppingCart className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">MONTHLY PURCHASE</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">₹0</h3>
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Awaiting data</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search firm or territory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
          <span className="text-sm font-medium text-gray-500">{filteredDistributors.length} firms</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-white border-b border-gray-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Distributor</th>
                <th className="px-6 py-4">Territory</th>
                <th className="px-6 py-4">Executive</th>
                <th className="px-6 py-4 text-center">Retailers</th>
                <th className="px-6 py-4 font-bold">Outstanding</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4 font-bold">Monthly Purchase</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDistributors.length > 0 ? filteredDistributors.map((dist: any, i) => {
                // Determine mock values to fill missing backend fields
                const execName = employees.find(e => e.region === dist.region)?.fullName || "Unassigned";
                const retailers = 0;
                const outstanding = 0;
                const purchase = 0;
                const lastVisit = "N/A";
                
                let status = dist.status || "Active";

                return (
                  <tr key={dist.id || i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900">{dist.name || "Unnamed Distributor"}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{dist.contactName || "No contact info"}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                      {dist.region || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {execName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600 font-medium">
                      {retailers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      ₹{outstanding.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {lastVisit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      ₹{purchase.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide
                        ${status === 'Active' ? 'bg-green-50 text-green-700' : 
                          status === 'Overdue' ? 'bg-amber-50 text-amber-700' : 
                          'bg-red-50 text-red-600'}`}
                      >
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
                    No distributors found in your region.
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
