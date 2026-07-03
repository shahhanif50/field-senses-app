import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMasterData } from '@/contexts/MasterDataContext';
import { KPICards } from '@/components/layout/KPICards';
import { Users, AlertTriangle, FolderKanban } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export function AdminDashboard() {
  const { employees, alerts, projects, roles, territories } = useMasterData();
  const userName = sessionStorage.getItem("userName") || "Admin";

  // Chart 1: Employee Distribution by Role
  const roleDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      // emp.role contains role name like 'Admin', 'Employee'
      const roleName = emp.role || 'Unassigned';
      counts[roleName] = (counts[roleName] || 0) + 1;
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    })).filter(item => item.value > 0);
  }, [employees]);

  // Chart 2: Alerts Status Overview
  const alertsData = useMemo(() => {
    const resolved = alerts.filter(a => a.resolved).length;
    const active = alerts.length - resolved;
    return [
      { name: 'Active Alerts', value: active, color: '#ef4444' },
      { name: 'Resolved Alerts', value: resolved, color: '#10b981' }
    ].filter(item => item.value > 0);
  }, [alerts]);

  // Chart 3: Project Pipeline
  const projectPipelineData = useMemo(() => {
    const counts: Record<string, number> = {
      'Planning': 0,
      'Active': 0,
      'Completed': 0,
      'Delayed': 0
    };
    
    projects.forEach(p => {
      const status = p.status || 'Active';
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts['Active']++; // Default bucket
      }
    });

    return [
      { name: 'Planning', count: counts['Planning'] },
      { name: 'Active', count: counts['Active'] },
      { name: 'Completed', count: counts['Completed'] },
      { name: 'Delayed', count: counts['Delayed'] }
    ];
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {userName}. Here's the high-level overview of your operations.</p>
        </div>
      </div>

      {/* High-level Global KPIs */}
      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Employee Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Employee Distribution
          </h3>
          <div className="h-[250px] w-full">
            {roleDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No employee data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Alerts Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Alerts Status
          </h3>
          <div className="h-[250px] w-full">
            {alertsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {alertsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No alerts recorded
              </div>
            )}
          </div>
        </motion.div>

        {/* Project Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 lg:col-span-1 md:col-span-2"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-500" />
            Project Pipeline
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectPipelineData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                <XAxis 
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}
                  cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                />
                <Bar 
                  dataKey="count" 
                  name="Projects"
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                >
                  {projectPipelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'Completed' ? '#10b981' : 
                        entry.name === 'Delayed' ? '#ef4444' : 
                        entry.name === 'Planning' ? '#3b82f6' : '#8b5cf6'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Territory Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="font-bold text-gray-900 mb-1 dark:text-gray-100">Territory Performance</h3>
          <p className="text-sm text-gray-500 mb-6">Achievement % across active territories</p>
          
          <div className="space-y-5">
            {territories.length > 0 ? territories.slice(0,5).map((t: any, i) => {
              const achievement = t.achievement || 0;
              const isOver = achievement >= 100;
              const isLow = achievement > 0 && achievement < 70;
              
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{t.name}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{t.region || "Assigned"}</p>
                    </div>
                    <span className={`font-bold ${isOver ? 'text-green-600' : isLow ? 'text-red-500' : 'text-blue-600'}`}>{achievement}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
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
        </motion.div>

        {/* Top Performing Executives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-sm"
        >
          <h3 className="font-bold text-gray-900 mb-1 dark:text-gray-100">Top Performing Sales Executives</h3>
          <p className="text-sm text-gray-500 mb-6">Ranked by sales achievement</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-transparent border-b border-border/50">
                <tr>
                  <th className="pb-3 font-medium">Executive</th>
                  <th className="pb-3 font-medium text-right">Sales</th>
                  <th className="pb-3 font-medium text-right">Collect</th>
                  <th className="pb-3 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => {
                  const roleCode = typeof e.roleId === 'object' ? (e.roleId as any)?.roleCode : e.role;
                  return roleCode !== 'ADMIN' && roleCode !== 'REGIONAL_MANAGER';
                }).slice(0, 5).length > 0 
                  ? employees.filter(e => {
                    const roleCode = typeof e.roleId === 'object' ? (e.roleId as any)?.roleCode : e.role;
                    return roleCode !== 'ADMIN' && roleCode !== 'REGIONAL_MANAGER';
                  }).slice(0, 5).map((emp: any, i) => {
                  const sales = 0;
                  const collect = 0;
                  const score = 0;
                  
                  return (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {emp.fullName?.split(' ').map((n:string) => n[0]).join('').substring(0,2) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{emp.fullName}</p>
                            <p className="text-[11px] text-gray-500">{emp.region || "Territory"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900 dark:text-gray-100">{sales}%</td>
                      <td className="py-3 text-right font-medium text-gray-600 dark:text-gray-400">{collect}%</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${score >= 90 ? 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
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
        </motion.div>
      </div>
    </div>
  );
}
