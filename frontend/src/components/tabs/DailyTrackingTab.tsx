import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, Clock, Navigation, User, Activity, AlertTriangle, Map, BarChart3, Settings,
  CheckCircle, XCircle, Timer, TrendingUp, Shield, Bell, Zap, Target, Gauge, FileText,
  UserCheck, UserX, AlarmClock, LogOut, Hourglass, Eye, Edit, Download
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DailyTrackingDetailModal } from "@/components/modals/DailyTrackingDetailModal";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useMasterData } from "@/contexts/MasterDataContext";
import { TrackingEntry, AttendanceEntry, GeoFenceAlert } from "@/data/sharedTypes";

// ============= INTERFACES =============



interface TrackingSettings {
  idleThreshold: number;
  geoFenceRadius: number;
  alertSeverity: "low" | "medium" | "high";
  approvalWorkflow: boolean;
  auditTrailEnabled: boolean;
}


// Sub tabs for Daily Tracking - Combined modules
const allSubTabs = [
  { id: "live-tracking", label: "Live Tracking / Route History", icon: MapPin },
  { id: "attendance", label: "Attendance Log", icon: Clock },
  { id: "geo-fence", label: "Geo-Fence Alerts", icon: Map, adminOnly: true },
  { id: "analytics-settings", label: "Tracking Analytics & Settings", icon: BarChart3, adminOnly: true },
];

export function DailyTrackingTab() {
  const { trackingEntries, attendanceEntries, geoFenceAlerts } = useMasterData();
  const userRole = sessionStorage.getItem("userRole") || "employee";
  const userName = sessionStorage.getItem("userName") || "";
  const isAdmin = userRole.toLowerCase() === "admin";

  const subTabs = allSubTabs.filter(tab => !tab.adminOnly || isAdmin);

  const trackingData = isAdmin ? trackingEntries : trackingEntries.filter((t: any) => t.employeeName === userName);
  const attendanceData = isAdmin ? attendanceEntries : attendanceEntries.filter((a: any) => a.employeeName === userName);

  const [selectedEmployee, setSelectedEmployee] = useState<TrackingEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("live-tracking");
  const [analyticsTab, setAnalyticsTab] = useState("settings");
  
  // Settings state
  const [settings, setSettings] = useState<TrackingSettings>({
    idleThreshold: 30,
    geoFenceRadius: 500,
    alertSeverity: "medium",
    approvalWorkflow: true,
    auditTrailEnabled: true,
  });

  const handleViewDetails = (entry: TrackingEntry) => {
    setSelectedEmployee(entry);
    setIsDetailModalOpen(true);
  };

  // ============= LIVE TRACKING COLUMNS =============
  const liveTrackingColumns: Column<TrackingEntry>[] = [
    {
      key: "employeeName",
      header: "Employee",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
              {row.employeeName.split(" ").map((n) => n[0]).join("")}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                row.status === "online"
                  ? "bg-success animate-pulse"
                  : row.status === "idle"
                  ? "bg-warning animate-pulse"
                  : "bg-muted-foreground"
              }`}
            />
          </div>
          <div>
            <p className="font-medium">{row.employeeName}</p>
            <p className="text-xs text-muted-foreground">{row.employeeCode} • {row.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: "currentLocation",
      header: "Current Location",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <MapPin className={`w-4 h-4 ${row.status === "online" ? "text-success" : "text-muted-foreground"}`} />
          <span className="text-sm max-w-[200px] truncate">{String(value)}</span>
        </div>
      ),
    },
    {
      key: "checkInTime",
      header: "Check In",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>{String(value)}</span>
        </div>
      ),
    },
    {
      key: "checkOutTime",
      header: "Check Out",
      render: (value) => (
        <span className={value ? "" : "text-muted-foreground italic"}>
          {value ? String(value) : "Active"}
        </span>
      ),
    },
    {
      key: "travelDistance",
      header: "Travel (km)",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          <span className="font-medium">{String(value)} km</span>
        </div>
      ),
    },
    {
      key: "idleTime",
      header: "Idle Time",
      render: (value) => (
        <span className={Number(value) > 30 ? "text-warning font-medium" : "text-muted-foreground"}>
          {String(value)} min
        </span>
      ),
    },
    {
      key: "planVsActual",
      header: "Plan vs Actual",
      render: (value) => {
        const percentage = Number(value);
        const color =
          percentage >= 100 ? "text-success" : percentage >= 80 ? "text-warning" : "text-destructive";
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage >= 100
                    ? "bg-success"
                    : percentage >= 80
                    ? "bg-warning"
                    : "bg-destructive"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className={`font-medium ${color}`}>{percentage}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value as "online" | "offline"} pulse={value === "online"} />,
    },
  ];

  // ============= ATTENDANCE COLUMNS =============
  const attendanceColumns: Column<AttendanceEntry>[] = [
    {
      key: "employeeName",
      header: "Employee",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
            {row.employeeName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-medium">{row.employeeName}</p>
            <p className="text-xs text-muted-foreground">{row.employeeCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      render: (value) => <span className="text-sm">{String(value)}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (value) => <span className="text-sm">{format(new Date(String(value)), "dd MMM yyyy")}</span>,
    },
    {
      key: "scheduledShift",
      header: "Scheduled Shift",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{String(value)}</span>
        </div>
      ),
    },
    {
      key: "actualCheckIn",
      header: "Check In",
      render: (value) => (
        <span className={value ? "text-success" : "text-muted-foreground italic"}>
          {value ? String(value) : "—"}
        </span>
      ),
    },
    {
      key: "actualCheckOut",
      header: "Check Out",
      render: (value) => (
        <span className={value ? "" : "text-muted-foreground italic"}>
          {value ? String(value) : "Active"}
        </span>
      ),
    },
    {
      key: "lateArrival",
      header: "Late (min)",
      render: (value) => (
        <span className={Number(value) > 0 ? "text-warning font-medium" : "text-muted-foreground"}>
          {Number(value) > 0 ? `+${value}` : "—"}
        </span>
      ),
    },
    {
      key: "earlyExit",
      header: "Early Exit (min)",
      render: (value) => (
        <span className={Number(value) > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
          {Number(value) > 0 ? `-${value}` : "—"}
        </span>
      ),
    },
    {
      key: "totalHoursWorked",
      header: "Hours Worked",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-primary" />
          <span className="font-medium">{String(value)} hrs</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => {
        const statusColors: Record<string, string> = {
          present: "bg-success/10 text-success border-success/20",
          absent: "bg-destructive/10 text-destructive border-destructive/20",
          "on-leave": "bg-accent/10 text-accent border-accent/20",
          "half-day": "bg-warning/10 text-warning border-warning/20",
        };
        const statusLabels: Record<string, string> = {
          present: "Present",
          absent: "Absent",
          "on-leave": "On Leave",
          "half-day": "Half Day",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[String(value)]}`}>
            {statusLabels[String(value)]}
          </span>
        );
      },
    },
  ];

  // ============= GEO-FENCE ALERTS COLUMNS =============
  const geoFenceColumns: Column<GeoFenceAlert>[] = [
    {
      key: "employeeName",
      header: "Employee",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
            {row.employeeName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-medium">{row.employeeName}</p>
            <p className="text-xs text-muted-foreground">{row.employeeCode} • {row.designation}</p>
          </div>
        </div>
      ),
    },
    {
      key: "currentLocation",
      header: "Current Location",
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-warning" />
          <span className="text-sm max-w-[180px] truncate">{String(value)}</span>
        </div>
      ),
    },
    {
      key: "assignedZone",
      header: "Assigned Zone",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm">{String(value)}</span>
        </div>
      ),
    },
    {
      key: "alertType",
      header: "Alert Type",
      render: (value) => {
        const alertLabels: Record<string, string> = {
          "zone-exit": "Zone Exit",
          "idle-breach": "Idle Breach",
          "restricted-entry": "Restricted Entry",
          "boundary-violation": "Boundary Violation",
        };
        const alertColors: Record<string, string> = {
          "zone-exit": "bg-destructive/10 text-destructive",
          "idle-breach": "bg-warning/10 text-warning",
          "restricted-entry": "bg-destructive/10 text-destructive",
          "boundary-violation": "bg-accent/10 text-accent",
        };
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${alertColors[String(value)]}`}>
            {alertLabels[String(value)]}
          </span>
        );
      },
    },
    {
      key: "alertTime",
      header: "Alert Time",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-warning" />
          <span>{String(value)}</span>
        </div>
      ),
    },
    {
      key: "idleDuration",
      header: "Idle Duration",
      render: (value) => (
        <span className={Number(value) > 0 ? "text-warning font-medium" : "text-muted-foreground"}>
          {Number(value) > 0 ? `${value} min` : "—"}
        </span>
      ),
    },
    {
      key: "planVsActual",
      header: "Plan vs Actual",
      render: (value) => {
        const percentage = Number(value);
        return <span className={percentage < 80 ? "text-destructive" : "text-foreground"}>{percentage}%</span>;
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (value) => {
        const priorityColors: Record<string, string> = {
          low: "bg-muted text-muted-foreground",
          medium: "bg-warning/10 text-warning",
          high: "bg-destructive/10 text-destructive",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${priorityColors[String(value)]}`}>
            {String(value)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value as "online" | "offline" | "idle"} pulse={value === "online"} />,
    },
    {
      key: "resolved",
      header: "Resolution",
      render: (value) => (
        <span className={`flex items-center gap-1 ${value ? "text-success" : "text-warning"}`}>
          {value ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {value ? "Resolved" : "Active"}
        </span>
      ),
    },
  ];

  // ============= STATISTICS =============
  
  // Live Tracking Stats
  const onlineCount = trackingData.filter((t) => t.status === "online").length;
  const avgPlanVsActual = Math.round(
    trackingData.reduce((sum, t) => sum + t.planVsActual, 0) / trackingData.length
  );
  const totalDistance = trackingData.reduce((sum, t) => sum + t.travelDistance, 0).toFixed(1);

  // Attendance Stats
  const presentToday = attendanceData.filter((a) => a.status === "present").length;
  const absentToday = attendanceData.filter((a) => a.status === "absent").length;
  const lateArrivals = attendanceData.filter((a) => a.lateArrival > 0).length;
  const earlyExits = attendanceData.filter((a) => a.earlyExit > 0).length;
  const avgHoursWorked = (attendanceData.reduce((sum, a) => sum + a.totalHoursWorked, 0) / attendanceData.filter(a => a.totalHoursWorked > 0).length).toFixed(1);

  // Geo-Fence Stats
  const totalAlerts = geoFenceAlerts.length;
  const activeViolations = geoFenceAlerts.filter((a) => !a.resolved).length;
  const resolvedAlerts = geoFenceAlerts.filter((a) => a.resolved).length;
  const highPriorityAlerts = geoFenceAlerts.filter((a) => a.priority === "high").length;
  const avgIdleTime = Math.round(
    geoFenceAlerts.filter(a => a.idleDuration > 0).reduce((sum, a) => sum + a.idleDuration, 0) / 
    Math.max(geoFenceAlerts.filter(a => a.idleDuration > 0).length, 1)
  );

  // Analytics Stats
  const avgDistancePerEmployee = (trackingData.reduce((sum, t) => sum + t.travelDistance, 0) / trackingData.length).toFixed(1);
  const overallAvgIdleTime = Math.round(trackingData.reduce((sum, t) => sum + t.idleTime, 0) / trackingData.length);
  const geoFenceBreachTrend = geoFenceAlerts.filter(a => !a.resolved).length;
  const attendanceComplianceRate = Math.round((presentToday / attendanceData.length) * 100);

  // Get section info based on active sub tab
  const getSectionInfo = () => {
    switch (activeSubTab) {
      case "live-tracking":
        return { title: "Live Tracking / Route History", description: "Real-time location monitoring and historical route data" };
      case "attendance":
        return { title: "Attendance Log", description: "Track employee check-in/out times, shift compliance, and attendance status" };
      case "geo-fence":
        return { title: "Geo-Fence Alerts", description: "Log alerts when employees breach assigned zones or idle beyond limits" };
      case "analytics-settings":
        return { title: "Tracking Analytics & Settings", description: "Configure tracking rules and analyze performance trends" };
      default:
        return { title: "Live Tracking / Route History", description: "Real-time location monitoring and historical route data" };
    }
  };

  const sectionInfo = getSectionInfo();

  // ============= RENDER DASHBOARD CARDS =============
  const renderDashboardCards = () => {
    if (activeSubTab === "live-tracking") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Now", value: `${onlineCount}/${trackingData.length}`, icon: User, color: "text-success" },
            { label: "Avg Performance", value: `${avgPlanVsActual}%`, icon: Activity, color: "text-primary" },
            { label: "Total Distance", value: `${totalDistance} km`, icon: Navigation, color: "text-accent" },
            { label: "Alerts Today", value: String(totalAlerts), icon: AlertTriangle, color: "text-warning" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    if (activeSubTab === "attendance") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Present Today", value: String(presentToday), icon: UserCheck, color: "text-success" },
            { label: "Absent Today", value: String(absentToday), icon: UserX, color: "text-destructive" },
            { label: "Late Arrivals", value: String(lateArrivals), icon: AlarmClock, color: "text-warning" },
            { label: "Early Exits", value: String(earlyExits), icon: LogOut, color: "text-accent" },
            { label: "Avg Hours Worked", value: `${avgHoursWorked} hrs`, icon: Hourglass, color: "text-primary" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    if (activeSubTab === "geo-fence") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Alerts Today", value: String(totalAlerts), icon: Bell, color: "text-primary" },
            { label: "Active Violations", value: String(activeViolations), icon: AlertTriangle, color: "text-destructive" },
            { label: "Resolved Alerts", value: String(resolvedAlerts), icon: CheckCircle, color: "text-success" },
            { label: "High Priority", value: String(highPriorityAlerts), icon: Zap, color: "text-warning" },
            { label: "Avg Idle Time", value: `${avgIdleTime} min`, icon: Timer, color: "text-accent" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    if (activeSubTab === "analytics-settings") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Avg Distance/Employee", value: `${avgDistancePerEmployee} km`, icon: Navigation, color: "text-primary" },
            { label: "Avg Idle Time", value: `${overallAvgIdleTime} min`, icon: Timer, color: "text-warning" },
            { label: "Geo-Fence Breaches", value: String(geoFenceBreachTrend), icon: Shield, color: "text-destructive" },
            { label: "Attendance Rate", value: `${attendanceComplianceRate}%`, icon: Target, color: "text-success" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    return null;
  };

  // ============= RENDER ANALYTICS & SETTINGS =============
  const renderAnalyticsSettings = () => {
    return (
      <div className="space-y-6">
        <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Tracking Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="idleThreshold">Idle Threshold (minutes)</Label>
                    <Input
                      id="idleThreshold"
                      type="number"
                      value={settings.idleThreshold}
                      onChange={(e) => setSettings({ ...settings, idleThreshold: Number(e.target.value) })}
                      placeholder="Default: 30 min"
                    />
                    <p className="text-xs text-muted-foreground">Alert when employee is idle beyond this duration</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geoFenceRadius">Geo-Fence Radius (meters)</Label>
                    <Input
                      id="geoFenceRadius"
                      type="number"
                      value={settings.geoFenceRadius}
                      onChange={(e) => setSettings({ ...settings, geoFenceRadius: Number(e.target.value) })}
                      placeholder="Per territory"
                    />
                    <p className="text-xs text-muted-foreground">Default boundary radius for geo-fence zones</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alertSeverity">Alert Severity Levels</Label>
                    <Select
                      value={settings.alertSeverity}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setSettings({ ...settings, alertSeverity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Default severity for new alerts</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Approval Workflow for Adjustments</Label>
                        <p className="text-xs text-muted-foreground">Enable manager approval for time adjustments</p>
                      </div>
                      <Switch
                        checked={settings.approvalWorkflow}
                        onCheckedChange={(checked) => setSettings({ ...settings, approvalWorkflow: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Audit Trail Enabled</Label>
                        <p className="text-xs text-muted-foreground">Track all changes with user/timestamp</p>
                      </div>
                      <Switch
                        checked={settings.auditTrailEnabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, auditTrailEnabled: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Distance Covered per Employee",
                  description: "Daily / Weekly / Monthly breakdown of travel distance",
                  icon: Navigation,
                  value: `${avgDistancePerEmployee} km avg`,
                },
                {
                  title: "Avg Idle Time per Employee",
                  description: "Performance metric tracking idle patterns",
                  icon: Timer,
                  value: `${overallAvgIdleTime} min avg`,
                },
                {
                  title: "Plan vs Actual Trends",
                  description: "Visual deviation tracking over time",
                  icon: TrendingUp,
                  value: `${avgPlanVsActual}% compliance`,
                },
                {
                  title: "Geo-Fence Breach Frequency",
                  description: "Compliance metric for zone violations",
                  icon: Shield,
                  value: `${geoFenceBreachTrend} active breaches`,
                },
                {
                  title: "Attendance Compliance %",
                  description: "HR metric for attendance tracking",
                  icon: UserCheck,
                  value: `${attendanceComplianceRate}% present`,
                },
              ].map((report, index) => (
                <motion.div
                  key={report.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <report.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{report.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                            <p className="text-lg font-bold text-primary mt-2">{report.value}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ============= RENDER DATA TABLE =============
  const renderDataTable = () => {
    if (activeSubTab === "live-tracking") {
      return (
        <DataTable
          data={trackingData}
          columns={liveTrackingColumns}
          onView={(entry) => handleViewDetails(entry)}
          searchPlaceholder="Search employees..."
        />
      );
    }

    if (activeSubTab === "attendance") {
      return (
        <DataTable
          data={attendanceData}
          columns={attendanceColumns}
          searchPlaceholder="Search attendance records..."
        />
      );
    }

    if (activeSubTab === "geo-fence") {
      return (
        <DataTable
          data={geoFenceAlerts}
          columns={geoFenceColumns}
          searchPlaceholder="Search alerts..."
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="bg-card/50 border border-border/50 rounded-xl p-2">
        <div className="flex flex-wrap gap-2">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">{sectionInfo.title}</h2>
          <p className="text-muted-foreground">{sectionInfo.description}</p>
        </div>
      </div>

      {/* Dashboard Cards */}
      {renderDashboardCards()}

      {/* Content */}
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeSubTab === "analytics-settings" ? renderAnalyticsSettings() : renderDataTable()}
      </motion.div>

      {/* Daily Tracking Detail Modal */}
      <DailyTrackingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEmployee(null);
        }}
        employeeId={selectedEmployee?.id || ""}
        date={format(new Date(), "MMMM d, yyyy")}
      />
    </div>
  );
}
