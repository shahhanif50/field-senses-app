import React from "react";
import { useMasterData } from "@/contexts/MasterDataContext";
import { MapPin, Map, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const coverageData = [
  { week: "W1", coverage: 72 },
  { week: "W2", coverage: 75 },
  { week: "W3", coverage: 78 },
  { week: "W4", coverage: 82 },
  { week: "W5", coverage: 85 },
  { week: "W6", coverage: 89 },
];

export default function RMTerritory() {
  const { territories, employees } = useMasterData();

  const simulatedPerformances = territories.map((t, i) => ({
    ...t,
    achievement: 0 // Default until real data is available
  }));

  const bestTerritory = simulatedPerformances.reduce((prev, current) => (prev && prev.achievement > current.achievement) ? prev : current, null as any);
  const worstTerritory = simulatedPerformances.reduce((prev, current) => (prev && prev.achievement < current.achievement) ? prev : current, null as any);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Territory Management</h2>
        <p className="text-slate-500 mt-1">Monitor assigned territories and coverage performance.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">TOTAL TERRITORIES</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{territories.length || 8}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50">
              <Map className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">ACTIVE TERRITORIES</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{territories.length}</h3>
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Data based on active territories</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-50">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">TOP TERRITORY</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2 line-clamp-1">{bestTerritory?.name || "N/A"}</h3>
            <span className="text-xs text-gray-500">Highest achievement</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 tracking-wider">LOW PERFORMING</p>
          </div>
          <div className="mt-auto">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2 line-clamp-1">{worstTerritory?.name || "N/A"}</h3>
            <span className="text-xs text-gray-500">Needs focus</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Territory Roster */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Territory Roster</h3>
          <p className="text-sm text-gray-500 mb-6">Coverage, executive and achievement per territory</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
                <tr>
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Territory</th>
                  <th className="pb-3 font-medium">Sales Executive</th>
                  <th className="pb-3 font-medium text-center">Distrib.</th>
                  <th className="pb-3 font-medium text-center">Retailers</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium w-32">Achievement</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {territories.length > 0 ? territories.map((t: any, i) => {
                  const execName = employees.find(e => e.region === t.name)?.fullName || "Unassigned";
                  const code = `TR-${(i+1).toString().padStart(3, '0')}`;
                  
                  // Real dynamic data if available, fallback to 0/empty
                  const distrib = 0;
                  const retailers = 0;
                  const target = 0;
                  const formattedTarget = "₹0";
                  const pct = 0;
                  const isLow = false;

                  return (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-mono text-xs text-gray-500">{code}</td>
                      <td className="py-3 font-bold text-gray-900">{t.name}</td>
                      <td className="py-3 text-gray-700">{execName}</td>
                      <td className="py-3 text-center font-medium text-gray-600">{distrib}</td>
                      <td className="py-3 text-center font-medium text-gray-600">{retailers}</td>
                      <td className="py-3 text-gray-600">{formattedTarget}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 flex-1">
                            <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-green-500' : isLow ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-900 w-8">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${isLow ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {isLow ? 'Low' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">
                      No territories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column Charts */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Coverage Trend</h3>
            <p className="text-sm text-gray-500 mb-6">Retailer coverage across last 6 weeks</p>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coverageData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="coverage" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-blue-500 tracking-wider mb-4 uppercase">Territory Map</h3>
            <div className="bg-blue-50 rounded-xl h-40 flex flex-col items-center justify-center border-2 border-dashed border-blue-200">
              <Map className="w-8 h-8 text-blue-300 mb-2" />
              <span className="text-sm font-medium text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm">Map visualization requires GIS integration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
