import React from "react";
import { useMasterData } from "@/contexts/MasterDataContext";
import { Users, Truck, Home, MapPin, TrendingUp, IndianRupee, Clock, AlertTriangle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const performanceData = [
  { name: "Jan", target: 40, achieved: 35 },
  { name: "Feb", target: 45, achieved: 42 },
  { name: "Mar", target: 50, achieved: 48 },
  { name: "Apr", target: 55, achieved: 60 },
  { name: "May", target: 60, achieved: 58 },
  { name: "Jun", target: 65, achieved: 70 },
];

export default function RMDashboard() {
  const { employees, distributors, territories, distributorLinks } = useMasterData();

  // Get current user and their region
  const userId = sessionStorage.getItem("userId") || "";
  const userName = sessionStorage.getItem("userName") || "User";
  const currentUser = employees.find(e => e.id === userId || e.employeeId === userId);
  
  // Use user's region, defaulting to 'North' if not set
  const regionName = currentUser?.region || "North";

  // Filter entities by region
  const myRegionTerritories = territories.filter(t => t.region === regionName);
  const myRegionEmployees = employees.filter(e => e.region === regionName);
  
  // Distributors are linked via Territories
  const myRegionDistributorLinks = distributorLinks ? distributorLinks.filter(dl => 
    myRegionTerritories.some(t => t.id === dl.assignedTerritoryId)
  ) : [];
  
  const myRegionDistributorIds = new Set(myRegionDistributorLinks.map(dl => dl.distributorId));
  const myRegionDistributors = distributors.filter(d => 
    myRegionDistributorIds.has(d.id) || d.region === regionName
  );

  // Dynamic calculations based on real backend data
  const totalSalesExecutives = myRegionEmployees.filter(e => {
    // Handle both string ID or object for role
    const roleCode = typeof e.roleId === 'object' ? (e.roleId as any)?.roleCode : e.role;
    return roleCode !== "ADMIN" && roleCode !== "REGIONAL_MANAGER";
  }).length;
  
  const activeDistributors = myRegionDistributors.filter(d => d.status === "Active").length;
  
  // Using default 0 for missing backend models
  const retailersCovered = 0;
  const todaysVisits = 0;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Regional Overview</h2>
        <p className="text-slate-500 mt-1">Welcome back, {userName}. Here's how the {regionName} region is performing today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "SALES EXECUTIVES", value: totalSalesExecutives || 0, icon: Users, change: "", color: "text-blue-500", bg: "bg-blue-50", positive: null },
          { title: "ACTIVE DISTRIBUTORS", value: activeDistributors || 0, icon: Truck, change: "", color: "text-indigo-500", bg: "bg-indigo-50", positive: null },
          { title: "RETAILERS COVERED", value: retailersCovered || 0, icon: Home, change: "", color: "text-indigo-400", bg: "bg-indigo-50", positive: null },
          { title: "TODAY'S VISITS", value: todaysVisits || 0, icon: MapPin, change: "", color: "text-blue-400", bg: "bg-blue-50", positive: null },
          { title: "MONTHLY SALES", value: "₹0", icon: TrendingUp, change: "", color: "text-blue-500", bg: "bg-blue-50", positive: null },
          { title: "COLLECTIONS", value: "₹0", icon: IndianRupee, change: "", color: "text-indigo-400", bg: "bg-indigo-50", positive: null },
          { title: "PENDING FOLLOW-UPS", value: "0", icon: Clock, change: "", color: "text-indigo-500", bg: "bg-indigo-50", positive: null },
          { title: "OPEN ALERTS", value: "0", icon: AlertTriangle, change: "", color: "text-blue-500", bg: "bg-blue-50", positive: null },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-xs font-bold text-gray-500 tracking-wider">{kpi.title}</p>
            </div>
            <div className="mt-auto">
              <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{kpi.value}</h3>
              <div className="flex items-center gap-1.5">
                {kpi.positive !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpi.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {kpi.positive ? '↗' : '↘'}
                  </span>
                )}
                <span className={`text-xs ${kpi.positive === true ? 'text-green-600' : kpi.positive === false ? 'text-red-500' : 'text-gray-500'}`}>
                  {kpi.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Sales Performance — Target vs Achievement</h3>
              <p className="text-sm text-gray-500">Last 6 months · in ₹</p>
            </div>
            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
              FY 2026
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAchieved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val}L`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`₹${value}L`, '']}
                />
                <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="achieved" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAchieved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-1">Alert Summary</h3>
          <p className="text-sm text-gray-500 mb-6">Exceptions needing attention</p>
          
          <div className="space-y-4 flex-1">
            {/* Dynamic alerts will be mapped here */}
            <div className="text-center py-8 text-gray-400 text-sm">
              No active alerts.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Territory Performance */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Territory Performance</h3>
          <p className="text-sm text-gray-500 mb-6">Achievement % across active territories</p>
          
          <div className="space-y-5">
            {myRegionTerritories.length > 0 ? myRegionTerritories.slice(0,5).map((t: any, i) => {
              const achievement = t.achievement || 0;
              const isOver = achievement >= 100;
              const isLow = achievement > 0 && achievement < 70;
              
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <div>
                      <span className="font-bold text-gray-900">{t.name}</span>
                      <p className="text-xs text-gray-500 mt-0.5">Assigned</p>
                    </div>
                    <span className={`font-bold ${isOver ? 'text-green-600' : isLow ? 'text-red-500' : 'text-blue-600'}`}>{achievement}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isOver ? 'bg-green-500' : isLow ? 'bg-red-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(achievement, 100)}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No territories found.
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Executives */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Top Performing Sales Executives</h3>
          <p className="text-sm text-gray-500 mb-6">Ranked by sales achievement</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
                <tr>
                  <th className="pb-3 font-medium">Executive</th>
                  <th className="pb-3 font-medium text-right">Sales</th>
                  <th className="pb-3 font-medium text-right">Collect</th>
                  <th className="pb-3 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {myRegionEmployees.filter(e => {
                  const roleCode = typeof e.roleId === 'object' ? (e.roleId as any)?.roleCode : e.role;
                  return roleCode !== 'ADMIN' && roleCode !== 'REGIONAL_MANAGER';
                }).slice(0, 5).length > 0 
                  ? myRegionEmployees.filter(e => {
                    const roleCode = typeof e.roleId === 'object' ? (e.roleId as any)?.roleCode : e.role;
                    return roleCode !== 'ADMIN' && roleCode !== 'REGIONAL_MANAGER';
                  }).slice(0, 5).map((emp: any, i) => {
                  const sales = 0;
                  const collect = 0;
                  const score = 0;
                  
                  return (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {emp.fullName.split(' ').map((n:string) => n[0]).join('').substring(0,2)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{emp.fullName}</p>
                            <p className="text-[11px] text-gray-500">{emp.region || "Territory"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900">{sales}%</td>
                      <td className="py-3 text-right font-medium text-gray-600">{collect}%</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${score >= 90 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {score}
                        </span>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                      No sales executives found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
