import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, Clock, Navigation, User, Activity, AlertTriangle, Map, BarChart3, Settings,
  CheckCircle, XCircle, Timer, TrendingUp, Shield, Bell, Zap, Target, Gauge, FileText,
  UserCheck, UserX, AlarmClock, LogOut, Hourglass, Eye, Edit, Download, Camera
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DailyTrackingDetailModal } from "@/components/modals/DailyTrackingDetailModal";
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
  { id: "geo-fence", label: "Geo-Fence Alerts", icon: Map, adminOnly: true },
  { id: "analytics-settings", label: "Tracking Analytics & Settings", icon: BarChart3, adminOnly: true },
];

const LocationCell = ({ value, status }: { value: string, status: string }) => {
  const [address, setAddress] = useState<string | null>(null);
  const isCoords = value && value.match(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/);
  
  useEffect(() => {
    if (isCoords) {
      const [lat, lng] = value.split(',').map(s => s.trim());
      const cacheKey = `geocode_${lat}_${lng}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAddress(cached);
        return;
      }
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const parts = [];
          if (data.address.suburb) parts.push(data.address.suburb);
          if (data.address.city || data.address.town || data.address.village) parts.push(data.address.city || data.address.town || data.address.village);
          if (data.address.state) parts.push(data.address.state);
          const shortAddress = parts.join(', ') || data.display_name;
          setAddress(shortAddress);
          sessionStorage.setItem(cacheKey, shortAddress);
        } else {
          setAddress("Unknown Location");
        }
      })
      .catch(() => setAddress("Unknown Location"));
    } else {
      setAddress(value);
    }
  }, [value, isCoords]);

  const displayLocation = address || (isCoords ? "Loading..." : value);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <MapPin className={`w-4 h-4 ${status === "online" ? "text-success" : "text-muted-foreground"}`} />
        {isCoords ? (
          <a 
            href={`https://www.google.com/maps?q=${value.replace(/\s+/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm max-w-[200px] truncate text-primary hover:underline"
            title="View on Maps"
          >
            {displayLocation}
          </a>
        ) : (
          <span className="text-sm max-w-[200px] truncate">{displayLocation}</span>
        )}
      </div>
      {isCoords && address && (
        <span className="text-[10px] text-muted-foreground ml-6">({value})</span>
      )}
    </div>
  );
};

export function DailyTrackingTab({ viewMode = "team" }: { viewMode?: "self" | "team" }) {
  const { trackingEntries, attendanceEntries, geoFenceAlerts, roles, rolePermissions, employees } = useMasterData();
  const rawRole = sessionStorage.getItem("userRole") || "EMPLOYEE";
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  // --- PERMISSION CHECKS ---
  const currentRole = roles?.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const trackingPerm = rolePermissions?.find(p => p.roleId === currentRole?.id && p.module === "Daily Tracking");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = rawRole.toLowerCase() === "admin" || isGlobalAdmin;

  const canCreate = isAdmin || trackingPerm?.create;
  const canEdit = isAdmin || trackingPerm?.edit;
  const canDelete = isAdmin || trackingPerm?.delete;
  const canExport = !!(isAdmin || trackingPerm?.export);
  // -----------------------

  const userRole = rawRole;
  const userName = sessionStorage.getItem("userName") || "";
  const employeeId = sessionStorage.getItem("employeeId") || "";
  const isManager = viewMode === "team";

  const subTabs = allSubTabs.filter(tab => !tab.adminOnly || isManager);

  const attendanceData = [...attendanceEntries]
    .filter(entry => {
      if (entry.date !== selectedDate) return false;
      return viewMode === "team" || 
        entry.employeeCode === employeeId || 
        entry.employeeName.toLowerCase() === userName.toLowerCase() ||
        entry.employeeName.toLowerCase().split(' ').sort().join(' ') === userName.toLowerCase().split(' ').sort().join(' ');
    })
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      const timeA = a.actualCheckIn || "";
      const timeB = b.actualCheckIn || "";
      return timeB.localeCompare(timeA);
    });

  const trackingData = [...trackingEntries]
    .filter(entry => {
      const entryDate = entry.checkInTime ? entry.checkInTime.split('T')[0] : "";
      if (entryDate !== selectedDate) return false;
      return viewMode === "team" || 
        entry.employeeId === employeeId || 
        entry.employeeId === sessionStorage.getItem("userId") || 
        entry.employeeName.toLowerCase() === userName.toLowerCase() ||
        entry.employeeName.toLowerCase().split(' ').sort().join(' ') === userName.toLowerCase().split(' ').sort().join(' ');
    })
    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
    .map(tracking => {
      const matchingAttendance = attendanceData.find(a => a.employeeCode === tracking.employeeId);
      return {
        ...tracking,
        checkInTime: matchingAttendance?.actualCheckIn || tracking.checkInTime,
        checkOutTime: matchingAttendance?.actualCheckOut || tracking.checkOutTime,
        status: matchingAttendance?.actualCheckOut ? 'completed' : tracking.status,
        checkInLocation: matchingAttendance?.checkInLocationLat && matchingAttendance?.checkInLocationLng 
          ? `${matchingAttendance.checkInLocationLat},${matchingAttendance.checkInLocationLng}` 
          : null,
        checkOutLocation: matchingAttendance?.checkOutLocationLat && matchingAttendance?.checkOutLocationLng 
          ? `${matchingAttendance.checkOutLocationLat},${matchingAttendance.checkOutLocationLng}` 
          : null,
        checkInPhoto: matchingAttendance?.checkInPhoto || (tracking as any).checkInPhoto,
        checkOutPhoto: matchingAttendance?.checkOutPhoto || (tracking as any).checkOutPhoto,
      };
    });

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
            <p className="text-xs text-muted-foreground">{row.employeeId} • {row.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: "currentLocation",
      header: "Route / Location",
      render: (value, row) => <LocationCell value={String(value)} status={row.status} />
    },
    {
      key: "checkInTime",
      header: "Check In",
      render: (value, row) => {
        let formattedTime = String(value);
        try {
          // Sometimes time string is just HH:mm instead of ISO datetime
          if (value && !String(value).includes('T') && String(value).includes(':')) {
            formattedTime = String(value);
          } else if (value) {
            formattedTime = format(new Date(String(value)), "dd MMM yy, hh:mm a");
          }
        } catch (e) {}
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm">{formattedTime}</span>
            </div>
            {(row as any).checkInLocation && (
              <LocationCell value={(row as any).checkInLocation} status={row.status} />
            )}
            {(row as any).checkInPhoto && (
              <div className="flex items-center gap-2 mt-1">
                <img src={(row as any).checkInPhoto} alt="Check In Proof" className="w-10 h-10 object-cover rounded-md border" />
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: "checkOutTime",
      header: "Check Out",
      render: (value, row) => {
        let formattedTime = String(value);
        try {
          if (value && !String(value).includes('T') && String(value).includes(':')) {
            formattedTime = String(value);
          } else if (value) {
            formattedTime = format(new Date(String(value)), "dd MMM yy, hh:mm a");
          }
        } catch (e) {}
        return (
          <div className="flex flex-col gap-2">
            <span className={value ? "text-sm" : "text-muted-foreground italic text-sm"}>
              {value ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formattedTime}</span>
                </div>
              ) : "Active"}
            </span>
            {value && (row as any).checkOutLocation && (
              <LocationCell value={(row as any).checkOutLocation} status="completed" />
            )}
            {value && (row as any).checkOutPhoto && (
              <div className="flex items-center gap-2 mt-1">
                <img src={(row as any).checkOutPhoto} alt="Check Out Proof" className="w-10 h-10 object-cover rounded-md border" />
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value as "online" | "offline" | "completed"} pulse={value === "online"} />,
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
      key: "proof",
      header: "Proof",
      render: (_, row) => (
        <div className="flex gap-2">
          {row.checkInPhoto && (
            <div className="flex flex-col items-center gap-1" title={`Check In: ${row.checkInLocationLat}, ${row.checkInLocationLng}`}>
              <img src={row.checkInPhoto} alt="Check In" className="w-10 h-10 object-cover rounded-md border" />
              <span className="text-[10px] text-muted-foreground font-medium">In</span>
            </div>
          )}
          {row.checkOutPhoto && (
            <div className="flex flex-col items-center gap-1" title={`Check Out: ${row.checkOutLocationLat}, ${row.checkOutLocationLng}`}>
              <img src={row.checkOutPhoto} alt="Check Out" className="w-10 h-10 object-cover rounded-md border" />
              <span className="text-[10px] text-muted-foreground font-medium">Out</span>
            </div>
          )}
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
      const completedCount = attendanceData.filter(a => a.actualCheckOut !== null).length;
      
      // Calculate team size using `employees` or fallback to attendance records if employees not populated yet
      const teamSize = employees && employees.length > 0 ? employees.length : attendanceData.length;
      const forgotCheckInCount = Math.max(0, teamSize - attendanceData.length);

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Now", value: `${onlineCount}/${teamSize}`, icon: User, color: "text-success" },
            { label: "Completed", value: String(completedCount), icon: CheckCircle, color: "text-primary" },
            { label: "Forgot Check In", value: String(forgotCheckInCount), icon: UserX, color: "text-destructive" },
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

                {canEdit && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline">Reset to Defaults</Button>
                    <Button>Save Settings</Button>
                  </div>
                )}
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
          onView={isAdmin ? (entry) => handleViewDetails(entry) : undefined}
          searchPlaceholder="Search employees..."
          showExport={canExport}
          onExport={canExport ? () => alert("Exporting data...") : undefined}
        />
      );
    }

    if (activeSubTab === "attendance") {
      return (
        <DataTable
          data={attendanceData}
          columns={attendanceColumns}
          searchPlaceholder="Search attendance records..."
          showExport={canExport}
          onExport={canExport ? () => alert("Exporting data...") : undefined}
        />
      );
    }

    if (activeSubTab === "geo-fence") {
      return (
        <DataTable
          data={geoFenceAlerts}
          columns={geoFenceColumns}
          searchPlaceholder="Search alerts..."
          showExport={canExport}
          onExport={canExport ? () => alert("Exporting data...") : undefined}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs and Date Filter */}
      <div className="bg-card/50 border border-border/50 rounded-xl p-2 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
        <div className="flex items-center gap-2 px-2">
          <Label htmlFor="date-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">Date:</Label>
          <Input 
            id="date-filter" 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto h-9"
          />
        </div>
      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        employeeId={selectedEmployee?.employeeId || ""}
        date={new Date().toISOString().split('T')[0]}
      />
    </div>
  );
}
