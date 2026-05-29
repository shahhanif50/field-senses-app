import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FolderKanban, MapPin, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
  isLoading?: boolean;
  color?: string;
}

function KPICard({ title, value, subtitle, icon, trend, delay = 0, isLoading, color = "text-primary" }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {isLoading ? (
            <div className="flex items-center gap-2 h-9">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <p className="text-3xl font-display font-bold">{value}</p>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export function KPICards() {
  const [loading, setLoading] = useState(true);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(0);
  const [trackingToday, setTrackingToday] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch(`${API}/api/employees/`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/ops/tracking-entries/?date=${today}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/ops/alerts/`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/projects/`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([employees, tracking, alerts, projects]) => {
      setEmployeeCount(Array.isArray(employees) ? employees.length : 0);
      const trackingArr = Array.isArray(tracking) ? tracking : [];
      setOnlineCount(trackingArr.filter((t: any) => t.status === "online").length);
      setTrackingToday(trackingArr.length);
      const alertArr = Array.isArray(alerts) ? alerts : [];
      setAlertCount(alertArr.filter((a: any) => !a.resolved).length);
      setHighPriorityAlerts(alertArr.filter((a: any) => !a.resolved && a.severity === "high").length);
      const projArr = Array.isArray(projects) ? projects : [];
      setActiveProjects(projArr.filter((p: any) => p.status === "active" || p.status === "in-progress").length);
      setLoading(false);
    });
  }, []);

  const kpis = [
    {
      title: "Employees Online",
      value: loading ? "—" : `${onlineCount}/${employeeCount}`,
      subtitle: `${employeeCount} total registered`,
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-500",
    },
    {
      title: "Active Projects",
      value: loading ? "—" : activeProjects,
      subtitle: "Live in database",
      icon: <FolderKanban className="w-6 h-6" />,
      color: "text-purple-500",
    },
    {
      title: "Today's Site Visits",
      value: loading ? "—" : trackingToday,
      subtitle: `${onlineCount} currently active`,
      icon: <MapPin className="w-6 h-6" />,
      color: "text-green-500",
    },
    {
      title: "Pending Alerts",
      value: loading ? "—" : alertCount,
      subtitle: `${highPriorityAlerts} high priority`,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: alertCount > 0 ? "text-red-500" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.title} {...kpi} delay={index * 0.1} isLoading={loading} />
      ))}
    </div>
  );
}
