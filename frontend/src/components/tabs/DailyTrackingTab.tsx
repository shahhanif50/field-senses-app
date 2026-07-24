import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, Clock, Navigation, User, Activity, AlertTriangle, Map, BarChart3, Settings,
  CheckCircle, XCircle, Timer, TrendingUp, Shield, Bell, Zap, Target, Gauge, FileText,
  UserCheck, UserX, AlarmClock, LogOut, Hourglass, Eye, Edit, Download, Camera, Calendar, Users, Car
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MeetingsTab } from "@/components/tabs/MeetingsTab";
import { RegularizationAdminTab } from "@/components/tabs/RegularizationAdminTab";
import { VehicleManagementSettings } from "@/components/tabs/VehicleManagementSettings";

import { useMasterData } from "@/contexts/MasterDataContext";
import { TrackingEntry, AttendanceEntry, GeoFenceAlert } from "@/data/sharedTypes";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  { id: "live-tracking", label: "Attendance & Live Tracking", icon: MapPin },
  { id: "geo-fence", label: "Geo-Fence Alerts", icon: Map, adminOnly: true },
  { id: "meeting-scheduler", label: "Meeting Scheduler", icon: Calendar },
  { id: "regularization", label: "Regularization", icon: Clock, adminOnly: true },
  { id: "vehicle-management", label: "Vehicle Management", icon: Car, adminOnly: true },
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
          setAddress(shortAddress || `Coordinates: ${lat}, ${lng}`);
          sessionStorage.setItem(cacheKey, shortAddress || `Coordinates: ${lat}, ${lng}`);
        } else {
          setAddress(`Coordinates: ${lat}, ${lng}`);
        }
      })
      .catch(() => setAddress(`Coordinates: ${lat}, ${lng}`));
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

  const handleExport = () => {
    if (!trackingData || trackingData.length === 0) {
      alert("No data available to export");
      return;
    }

    const headers = [
      "Date",
      "Employee ID",
      "Employee Name",
      "Role",
      "Department",
      "Check-In Time",
      "Check-Out Time",
      "Check-In Location",
      "Check-Out Location",
      "Status",
    ];

    const csvContent = [
      headers.join(","),
      ...trackingData.map((row) => {
        return [
          row.date || selectedDate,
          row.employeeId || "",
          `"${row.employeeName || ""}"`,
          `"${row.role || ""}"`,
          `"${(row as any).department || ""}"`,
          row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString() : "",
          row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString() : "",
          `"${row.checkInLocation || ""}"`,
          `"${row.checkOutLocation || ""}"`,
          row.status || "",
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Live_Tracking_${selectedDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedEmployee, setSelectedEmployee] = useState<TrackingEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [proofModalData, setProofModalData] = useState<{ employeeName: string, checkIn?: string, checkOut?: string } | null>(null);
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



  // ============= LIVE TRACKING COLUMNS =============
  const liveTrackingColumns: Column<TrackingEntry>[] = [
    {
      key: "employeeName",
      header: "Employee",
      render: (_, row) => {
        const emp = employees?.find(e => e.employeeId === row.employeeId || e.id === row.employeeId);
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              {emp?.profilePhoto ? (
                <img src={emp.profilePhoto} alt={row.employeeName} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                  {row.employeeName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
              )}
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
        );
      },
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
      key: "totalTime",
      header: "Total Time",
      render: (_, row) => {
        if (!row.checkInTime) return <span className="text-muted-foreground">-</span>;
        
        let start = 0;
        if (String(row.checkInTime).includes(':') && !String(row.checkInTime).includes('T')) {
          const now = new Date();
          const [hours, minutes] = String(row.checkInTime).split(':');
          now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          start = now.getTime();
        } else {
          start = new Date(String(row.checkInTime)).getTime();
        }

        let end = new Date().getTime();
        if (row.checkOutTime) {
          if (String(row.checkOutTime).includes(':') && !String(row.checkOutTime).includes('T')) {
            const now = new Date();
            const [hours, minutes] = String(row.checkOutTime).split(':');
            now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            end = now.getTime();
          } else {
            end = new Date(String(row.checkOutTime)).getTime();
          }
        }

        const elapsed = Math.max(0, end - start);
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        
        return (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm">
              {hours}h {minutes}m
            </span>
            {!row.checkOutTime && <span className="text-[10px] uppercase font-bold text-success animate-pulse">Running</span>}
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value as "online" | "offline" | "completed"} pulse={value === "online"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => {
        const hasPhoto = (row as any).checkInPhoto || (row as any).checkOutPhoto;
        if (!hasPhoto) return <span className="text-muted-foreground text-xs italic">No Proofs</span>;
        
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setProofModalData({
                employeeName: row.employeeName,
                checkIn: (row as any).checkInPhoto,
                checkOut: (row as any).checkOutPhoto
              });
            }}
          >
            <Camera className="w-3.5 h-3.5" />
            View Proofs
          </Button>
        );
      }
    }
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
        return { title: "Attendance & Live Tracking", description: "Real-time location monitoring and historical route data" };
      case "attendance":
        return { title: "Attendance Log", description: "Track employee check-in/out times, shift compliance, and attendance status" };
      case "geo-fence":
        return { title: "Geo-Fence Alerts", description: "Log alerts when employees breach assigned zones or idle beyond limits" };
      case "vehicle-management":
        return { title: "Vehicle Management", description: "Configure company vehicles and standard reimbursement rates" };
      case "meeting-scheduler":
        return { title: "Meeting Scheduler", description: "Manage and schedule team and client meetings" };
      default:
        return { title: "Attendance & Live Tracking", description: "Real-time location monitoring and historical route data" };
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

    if (activeSubTab === "vehicle-management") {
      return <VehicleManagementSettings />;
    }
    
    return null;
  };

  // ============= RENDER DATA TABLE =============
  const renderDataTable = () => {
    if (activeSubTab === "live-tracking") {
      return (
        <DataTable
          data={trackingData}
          columns={liveTrackingColumns}
          searchPlaceholder="Search employees..."
          showExport={canExport}
          onExport={canExport ? handleExport : undefined}
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
          onExport={canExport ? handleExport : undefined}
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
          onExport={canExport ? handleExport : undefined}
        />
      );
    }

    if (activeSubTab === "meeting-scheduler") {
      return <MeetingsTab />;
    }

    if (activeSubTab === "regularization") {
      return <RegularizationAdminTab />;
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
        {activeSubTab === "vehicle-management" ? null : renderDataTable()}
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
        initialData={selectedEmployee}
      />

      {/* Proof Images Modal */}
      {proofModalData && (
        <Dialog open={!!proofModalData} onOpenChange={(open) => !open && setProofModalData(null)}>
          <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold">Attendance Proofs - {proofModalData.employeeName}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-4">
              {proofModalData.checkIn ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Check-In Photo</span>
                  <img src={proofModalData.checkIn} className="w-full max-w-[280px] h-auto rounded-lg shadow-md border border-border" alt="Check In" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <span className="font-semibold text-sm uppercase tracking-wider">Check-In Photo</span>
                  <div className="w-[280px] h-[373px] flex items-center justify-center bg-muted/50 border border-dashed rounded-lg">No Check-In Photo</div>
                </div>
              )}
              {proofModalData.checkOut ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Check-Out Photo</span>
                  <img src={proofModalData.checkOut} className="w-full max-w-[280px] h-auto rounded-lg shadow-md border border-border" alt="Check Out" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <span className="font-semibold text-sm uppercase tracking-wider">Check-Out Photo</span>
                  <div className="w-[280px] h-[373px] flex items-center justify-center bg-muted/50 border border-dashed rounded-lg">No Check-Out Photo</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
