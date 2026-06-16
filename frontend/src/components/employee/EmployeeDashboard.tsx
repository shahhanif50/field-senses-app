import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMasterData } from '@/contexts/MasterDataContext';
import { KPICard } from '@/components/layout/KPICards';
import { CheckCircle2, Clock, MapPin, AlertTriangle, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export function EmployeeDashboard() {
  const { trackingEntries, employeeTasks, alerts, meetings } = useMasterData();
  const userId = sessionStorage.getItem("userId") || "";

  // Compute KPIs
  const myTasks = employeeTasks.filter(t => t.assignedTo === userId || t.employeeId === userId);
  const completedTasks = myTasks.filter(t => t.status === "completed").length;
  const pendingTasks = myTasks.filter(t => t.status === "pending" || t.status === "in-progress").length;
  
  const today = new Date().toISOString().split('T')[0];
  const myTracking = trackingEntries.filter(t => t.employeeId === userId && t.checkInTime.startsWith(today));
  const distanceToday = myTracking.reduce((acc, curr) => acc + (curr.travelDistance || 0), 0);

  const myAlerts = alerts.filter(a => a.relatedEntityId === userId && !a.resolved).length;
  const myMeetings = meetings.filter(m => m.attendees?.some(a => a.id === userId) && m.date >= today).length;

  // Chart Data: Task Status
  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: myTasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Pending', value: myTasks.filter(t => t.status === 'pending').length, color: '#f59e0b' },
    { name: 'Overdue', value: myTasks.filter(t => t.status === 'overdue').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Chart Data: Distance over last 7 days
  const distanceData = useMemo(() => {
    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayTracking = trackingEntries.filter(t => t.employeeId === userId && t.checkInTime.startsWith(date));
      const dist = dayTracking.reduce((acc, curr) => acc + (curr.travelDistance || 0), 0);
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        distance: dist
      };
    });
  }, [trackingEntries, userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Dashboard</h2>
          <p className="text-muted-foreground">Overview of your daily field activities, tasks, and alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Tasks Completed" 
          value={completedTasks.toString()} 
          subtitle={`${pendingTasks} pending tasks`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        <KPICard 
          title="Distance Today" 
          value={`${distanceToday} km`} 
          subtitle="Total distance covered"
          icon={<MapPin className="w-5 h-5" />}
          color="text-indigo-600 dark:text-indigo-400"
          bgColor="bg-indigo-500/10"
        />
        <KPICard 
          title="My Alerts" 
          value={myAlerts.toString()} 
          subtitle="Requires attention"
          icon={<AlertTriangle className="w-5 h-5" />}
          color={myAlerts > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}
          bgColor={myAlerts > 0 ? "bg-rose-500/10" : "bg-muted"}
        />
        <KPICard 
          title="Upcoming Meetings" 
          value={myMeetings.toString()} 
          subtitle="Scheduled for you"
          icon={<CalendarIcon className="w-5 h-5" />}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500/10"
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
