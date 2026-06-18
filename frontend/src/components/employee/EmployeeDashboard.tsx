import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMasterData } from '@/contexts/MasterDataContext';
import { Activity, TrendingUp, Navigation, MapPin, AlertTriangle, Calendar as CalendarIcon, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

function EmployeeKPICard({ title, value, icon, colorClass, bgClass }: { title: React.ReactNode, value: string, icon: React.ReactNode, colorClass: string, bgClass: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-card border border-border/50 shadow-sm rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">
          {title}
        </span>
        <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
          {value}
        </span>
      </div>
    </motion.div>
  );
}

export function EmployeeDashboard() {
  const { trackingEntries, employeeTasks, alerts, meetings } = useMasterData();
  const userId = sessionStorage.getItem("userId") || "";

  // Base Data
  const myTasks = employeeTasks.filter(t => t.assignedTo === userId || t.employeeId === userId);
  const today = new Date().toISOString().split('T')[0];
  const myTracking = trackingEntries.filter(t => t.employeeId === userId && t.checkInTime.startsWith(today));
  const myAlerts = alerts.filter(a => a.relatedEntityId === userId && !a.resolved).length;
  
  // Presentation Demo Mode: Use dummy data if actual data is completely empty
  const isDemoMode = myTasks.length === 0 && myTracking.length === 0;

  // Compute KPIs
  const totalTasks = isDemoMode ? 21 : myTasks.length;
  const completedTasks = isDemoMode ? 12 : myTasks.filter(t => t.status === "completed").length;
  const inProgressTasks = isDemoMode ? 5 : myTasks.filter(t => t.status === "in-progress" || t.status === "active").length;
  const pendingTasks = isDemoMode ? 3 : myTasks.filter(t => t.status === "pending" || t.status === "in-progress").length;
  const overdueTasks = isDemoMode ? 1 : myTasks.filter(t => t.status === "overdue").length;
  
  const avgPerformance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const distanceToday = isDemoMode ? 14.2 : myTracking.reduce((acc, curr) => acc + (curr.travelDistance || 0), 0);
  const totalFuelCost = Math.round(distanceToday * 8); // Assuming ₹8 per km

  const activeAlerts = isDemoMode ? 2 : myAlerts;
  const myMeetings = meetings.filter(m => m.attendees?.some(a => a.id === userId) && m.date >= today).length;

  // Chart Data: Task Status
  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'Pending', value: isDemoMode ? 3 : myTasks.filter(t => t.status === 'pending').length, color: '#f59e0b' },
    { name: 'Overdue', value: overdueTasks, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Chart Data: Distance over last 7 days
  const distanceData = useMemo(() => {
    const dummyDistances = [5.0, 12.5, 8.2, 15.1, 4.0, 10.4, 14.2];
    
    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map((date, index) => {
      const dayTracking = trackingEntries.filter(t => t.employeeId === userId && t.checkInTime.startsWith(date));
      const dist = dayTracking.reduce((acc, curr) => acc + (curr.travelDistance || 0), 0);
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        distance: isDemoMode ? dummyDistances[index] : dist
      };
    });
  }, [trackingEntries, userId, isDemoMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Dashboard</h2>
          <p className="text-muted-foreground">Overview of your daily field activities, tasks, and alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <EmployeeKPICard 
          title={<>Active<br/>Now</>} 
          value={`${inProgressTasks}/${totalTasks || 1}`} 
          icon={<Activity className="w-6 h-6" strokeWidth={2.5} />}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <EmployeeKPICard 
          title={<>Avg<br/>Performance</>} 
          value={`${avgPerformance}%`} 
          icon={<TrendingUp className="w-6 h-6" strokeWidth={2.5} />}
          colorClass="text-blue-500"
          bgClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <EmployeeKPICard 
          title={<>Total<br/>Distance</>} 
          value={`${distanceToday.toFixed(1)} km`} 
          icon={<Navigation className="w-6 h-6" strokeWidth={2.5} />}
          colorClass="text-indigo-500"
          bgClass="bg-indigo-50 dark:bg-indigo-500/10"
        />
        <EmployeeKPICard 
          title={<>Total Fuel<br/>Cost</>} 
          value={`₹${totalFuelCost}`} 
          icon={<MapPin className="w-6 h-6" strokeWidth={2.5} />}
          colorClass="text-amber-500"
          bgClass="bg-amber-50 dark:bg-amber-500/10"
        />
        <EmployeeKPICard 
          title={<>Alerts<br/>Today</>} 
          value={activeAlerts.toString()} 
          icon={<AlertTriangle className="w-6 h-6" strokeWidth={2.5} />}
          colorClass="text-rose-500"
          bgClass="bg-rose-50 dark:bg-rose-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Task Status Breakdown
          </h3>
          <div className="h-[300px] w-full">
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
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
                No active tasks to display
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Distance Travelled (Last 7 Days)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distanceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  dx={-10}
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}
                  cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                />
                <Bar 
                  dataKey="distance" 
                  name="Distance (km)"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
