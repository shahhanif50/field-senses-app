import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FolderKanban, MapPin, AlertTriangle, TrendingUp, TrendingDown, Loader2, Route, Receipt, CalendarOff, Clock } from "lucide-react";
import { useMasterData } from "@/contexts/MasterDataContext";

const API = "";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
  isLoading?: boolean;
  color?: string;
  bgColor?: string;
}

export function KPICard({ title, value, subtitle, icon, trend, delay = 0, isLoading, color = "text-primary", bgColor = "bg-primary/10" }: KPICardProps) {
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
            <p className="text-3xl font-display font-bold tracking-tight">{value}</p>
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
        <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center ${color} shadow-sm border border-white/5`}>
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
  const [distanceToday, setDistanceToday] = useState(0);
  const [delayedProjects, setDelayedProjects] = useState(0);
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const userRole = sessionStorage.getItem("userRole") || "";
    const userId = sessionStorage.getItem("userId") || "";
    const orgId = sessionStorage.getItem("organizationId") || "";

    const headers = {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      "X-User-Role": userRole,
      "X-Organization-Id": orgId,
    };

    Promise.all([
      fetch(`${API}/api/employees/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/ops/tracking-entries/?date=${today}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/ops/alerts/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/projects/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/ops/expenses/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/ops/leave-requests/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([employees, tracking, alerts, projects, expenses, leaves]) => {
      setEmployeeCount(Array.isArray(employees) ? employees.length : 0);
      const trackingArr = Array.isArray(tracking) ? tracking : [];
      setOnlineCount(trackingArr.filter((t: any) => t.status === "online").length);
      setTrackingToday(trackingArr.length);
      const dist = trackingArr.reduce((sum: number, t: any) => sum + (parseFloat(t.travelDistance) || 0), 0);
      setDistanceToday(Math.round(dist * 10) / 10);
      
      const alertArr = Array.isArray(alerts) ? alerts : [];
      setAlertCount(alertArr.filter((a: any) => !a.resolved).length);
      setHighPriorityAlerts(alertArr.filter((a: any) => !a.resolved && a.severity === "high").length);
      
      const projArr = Array.isArray(projects) ? projects : [];
      setActiveProjects(projArr.filter((p: any) => p.status?.toLowerCase() === "active" || p.status?.toLowerCase() === "in-progress").length);
      setDelayedProjects(projArr.filter((p: any) => p.status?.toLowerCase() === "delayed").length);
      
      const expArr = Array.isArray(expenses) ? expenses : [];
      setPendingExpenses(expArr.filter((e: any) => e.status?.toLowerCase() === "pending").length);
      
      const leaveArr = Array.isArray(leaves) ? leaves : [];
      setPendingLeaves(leaveArr.filter((l: any) => l.status?.toLowerCase() === "pending").length);
      
      setLoading(false);
    });
  }, []);

  const kpis = [
    {
      title: "Employees Online",
      value: loading ? "—" : `${onlineCount}/${employeeCount}`,
      subtitle: `${employeeCount} total registered`,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Projects",
      value: loading ? "—" : activeProjects,
      subtitle: "Live in database",
      icon: <FolderKanban className="w-5 h-5" />,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Today's Site Visits",
      value: loading ? "—" : trackingToday,
      subtitle: `${onlineCount} currently active`,
      icon: <MapPin className="w-5 h-5" />,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Pending Alerts",
      value: loading ? "—" : alertCount,
      subtitle: `${highPriorityAlerts} high priority`,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: alertCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
      bgColor: alertCount > 0 ? "bg-rose-500/10" : "bg-muted",
    },
    {
      title: "Total Distance Today",
      value: loading ? "—" : `${distanceToday} km`,
      subtitle: "Combined team travel",
      icon: <Route className="w-5 h-5" />,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Delayed Projects",
      value: loading ? "—" : delayedProjects,
      subtitle: "Requires attention",
      icon: <Clock className="w-5 h-5" />,
      color: delayedProjects > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      bgColor: delayedProjects > 0 ? "bg-amber-500/10" : "bg-muted",
    },
    {
      title: "Pending Reimbursements",
      value: loading ? "—" : pendingExpenses,
      subtitle: "Awaiting approval",
      icon: <Receipt className="w-5 h-5" />,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-500/10",
    },
    {
      title: "Pending Leave Requests",
      value: loading ? "—" : pendingLeaves,
      subtitle: "Awaiting approval",
      icon: <CalendarOff className="w-5 h-5" />,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-500/10",
    },
  ];

  const { roles, rolePermissions } = useMasterData();
  const userRoleRaw = sessionStorage.getItem("userRole") || "";
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const orgId = sessionStorage.getItem("organizationId");
  const isGlobalView = isGlobalAdmin && (!orgId || orgId === "null");
  const isAdmin = isGlobalAdmin || userRoleRaw.toUpperCase() === "ADMIN";
  
  const currentRole = roles.find(r => r.roleCode?.toUpperCase() === userRoleRaw.toUpperCase());
  
  const hasPermission = (kpiTitle: string) => {
    // If SuperAdmin is in Global View, only show the 4 most relevant KPIs
    if (isGlobalView) {
      const globalKpis = ["Employees Online", "Active Projects", "Today's Site Visits", "Pending Alerts"];
      return globalKpis.includes(kpiTitle);
    }

    if (roles.length === 0) return false; // Prevent flicker while roles are loading
    
    // If the role has configured visible KPIs, respect that selection
    if (currentRole && Array.isArray(currentRole.visibleKpis) && currentRole.visibleKpis.length > 0) {
      return currentRole.visibleKpis.includes(kpiTitle);
    }

    // Default fallback for Admin if no custom KPIs are selected: show the core KPIs
    if (isAdmin) {
      const adminDefaultKpis = ["Employees Online", "Active Projects", "Today's Site Visits"];
      const modulesStr = sessionStorage.getItem("modulesEnabled") || "[]";
      try {
        const modules = JSON.parse(modulesStr);
        if (modules.includes("All") || modules.includes("Alerts") || (sessionStorage.getItem("isGlobalAdmin") === "true" && !sessionStorage.getItem("impersonating"))) {
          adminDefaultKpis.push("Pending Alerts");
        }
      } catch(e) {}
      adminDefaultKpis.push("Delayed Projects");
      return adminDefaultKpis.includes(kpiTitle);
    }
    
    if (currentRole && !currentRole.visibleKpis) return true; // Default fallback if field is missing
    return currentRole?.visibleKpis?.includes(kpiTitle) || false;
  };

  const filteredKpis = kpis.filter(kpi => hasPermission(kpi.title));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {filteredKpis.map((kpi, index) => (
        <KPICard key={kpi.title} {...kpi} delay={index * 0.1} isLoading={loading} />
      ))}
    </div>
  );
}
