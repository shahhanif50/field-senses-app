import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Navigation, Clock, MapPin, User, Navigation2, Fuel, Calendar, History, Settings, Receipt, CheckCircle2, X, ArrowLeft, AlertTriangle, Banknote, Activity, TrendingUp, BarChart3, Shield } from 'lucide-react';
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DailyTrackingDetailModal } from "@/components/modals/DailyTrackingDetailModal";
import { TrackingEntry } from "@/data/sharedTypes";
import { useMasterData } from '@/contexts/MasterDataContext';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function AdminLiveTracking({ preSelectedEmployeeId }: { preSelectedEmployeeId?: string }) {
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [distance, setDistance] = useState(0); // km
  const [timeSpent, setTimeSpent] = useState(0); // minutes
  
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preSelectedEmployeeId || "");
  
  const { employees, roles, rolePermissions, trackingEntries, sites } = useMasterData();
  
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [modalEmployeeId, setModalEmployeeId] = useState("");
const [filterDate, setFilterDate] = useState<string>("");
  const filteredTrackingData = [...trackingEntries]
    .filter(entry => filterDate ? (entry.checkInTime || "").startsWith(filterDate) : true)
    .filter(entry => {
      if (!selectedEmployeeId) return true;
      const selectedEmp = employees.find(e => e.employeeId === selectedEmployeeId || e.id === selectedEmployeeId);
      if (!selectedEmp) return false;
      return entry.employeeId === selectedEmp.id || entry.employeeId === selectedEmp.employeeId;
    })
    .map(entry => {
       // Backend returns employeeId, map it to the actual employee data
       const emp = employees.find(e => e.id === entry.employeeId || e.employeeId === entry.employeeId);
       return {
         ...entry,
         employeeName: emp ? emp.fullName : "Unknown Employee",
         employeeCode: emp ? emp.employeeId : entry.employeeId,
         role: (emp?.roleId as any)?.roleName || (emp?.roleId as any)?.roleCode || "Employee",
       };
    })
    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

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
                  ? "bg-green-500 animate-pulse"
                  : row.status === "idle"
                  ? "bg-orange-500 animate-pulse"
                  : "bg-slate-400"
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
      header: "Location",
      render: (value, row) => {
        let locString = "Unknown";
        try {
          if (typeof value === 'string' && value.startsWith('{')) {
            const parsed = JSON.parse(value);
            locString = `${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}`;
          } else if (value) {
            locString = String(value);
          }
        } catch (e) {
          locString = "Location Data";
        }
        return (
          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${row.status === "online" ? "text-green-500" : "text-slate-400"}`} />
            <span className="text-sm max-w-[150px] truncate">{locString}</span>
          </div>
        );
      },
    },
    {
      key: "checkInTime",
      header: "Last Update",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>{String(value)}</span>
        </div>
      ),
    },
    {
      key: "travelDistance",
      header: "Travel (km)",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{String(value)} km</span>
        </div>
      ),
    },
    {
      key: "vehicleType",
      header: "Travel Mode",
      render: (value) => (
        <div className="flex items-center gap-2 font-medium">
          {String(value || "Bike")}
        </div>
      ),
    },
    {
      key: "planVsActual",
      header: "Plan vs Actual",
      render: (value) => {
        const numValue = Number(value || 0);
        let barColor = "bg-green-500";
        if (numValue < 80) barColor = "bg-red-500";
        else if (numValue < 100) barColor = "bg-orange-500";
        return (
          <div className="flex items-center gap-3 w-32">
            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, numValue)}%` }} />
            </div>
            <span className={`text-xs font-bold ${barColor.replace('bg-', 'text-')}`}>{numValue}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge status={value as "online" | "offline" | "completed"} pulse={value === "online"} />,
    },
  ];

  const rawRole = sessionStorage.getItem("userRole") || "";

  const currentRole = roles.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const rolePerm = rolePermissions.find(p => p.roleId === currentRole?.id && p.module === "Team Live Tracking");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = isGlobalAdmin || rawRole.toLowerCase() === "admin";
  const canApprove = isAdmin || rolePerm?.approve;
  const canEdit = isAdmin || rolePerm?.edit;

  // Custom icon for current location using DivIcon to prevent broken image links
  const currentLocationIcon = new L.DivIcon({
    className: 'custom-current-location',
    html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md relative">
             <div class="absolute inset-0 rounded-full border-2 border-blue-600 animate-ping opacity-75"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  const [status, setStatus] = useState("Paused");
  const [dynamicEta, setDynamicEta] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchEta = async () => {
      try {
        const res = await fetch(`/api/predict-eta/?distance_km=${distance}`);
        if (res.ok) {
          const data = await res.json();
          setDynamicEta(data.eta_mins);
        }
      } catch(e) {}
    };
    // Debounce ETA fetch to avoid spamming
    const timer = setTimeout(fetchEta, 2000);
    return () => clearTimeout(timer);
  }, [distance]);
  
  // New States for History Feature
  const [viewMode, setViewMode] = useState<"live" | "history">("live");
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>("");
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);

  // Admin Penalty Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [penaltyThreshold, setPenaltyThreshold] = useState(() => localStorage.getItem("penalty_threshold") || "30");
  const [penaltyAmount, setPenaltyAmount] = useState(() => {
    return localStorage.getItem("penalty_amount") || "2"; // Default to Rs. 2 per min
  });
  const [vehicleRateBike, setVehicleRateBike] = useState(() => localStorage.getItem("vehicle_rate_bike") || "5");
  const [vehicleRateCar, setVehicleRateCar] = useState(() => localStorage.getItem("vehicle_rate_car") || "12");

  // Admin Expense Approval State
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [expenseHistory, setExpenseHistory] = useState<any[]>([]);
  const [expenseTab, setExpenseTab] = useState<"pending" | "history">("pending");
  const [showExpenseQueue, setShowExpenseQueue] = useState(false);
  
  // Live Trip Info State
  const [currentTripInfo, setCurrentTripInfo] = useState<any>(null);
  const [dynamicRoute, setDynamicRoute] = useState<any[]>([]);
  const [plannedRouteSummary, setPlannedRouteSummary] = useState<any[] | null>(null);

  const saveSettings = () => {
    localStorage.setItem("penalty_threshold", penaltyThreshold);
    localStorage.setItem("penalty_amount", penaltyAmount);
    localStorage.setItem("vehicle_rate_bike", vehicleRateBike);
    localStorage.setItem("vehicle_rate_car", vehicleRateCar);
    setShowSettings(false);
  };

  // Read the simulation progress from localStorage (same browser) and backend (cross-device)
  useEffect(() => {
    if (!selectedEmployeeId || viewMode === "history") return;
    const BASE = "";

    const fetchState = async () => {
      try {
        const authHeaders = {
          'X-User-Id': sessionStorage.getItem("userId") || "",
          'X-User-Role': (sessionStorage.getItem("userRole") || "").toUpperCase(),
          'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
        };
        const res = await fetch(`${BASE}/api/ops/tracking-entries/?employeeId=${selectedEmployeeId}&ordering=-checkInTime&limit=1&_t=${Date.now()}`, { headers: authHeaders });
        const data = await res.json();
        const latest = Array.isArray(data) ? data[0] : (data.results ? data.results[0] : null);
        
        if (latest) {
          setDistance(latest.travelDistance || 0);
          setTimeSpent(latest.timeSpentOnSite || 0);
          setStatus(latest.status === "online" ? "Traveling" : latest.status === "completed" ? "Completed" : "Offline");
          
          if (latest.routePath && Array.isArray(latest.routePath) && latest.routePath.length > 0) {
            setDynamicRoute(prev => JSON.stringify(prev) === JSON.stringify(latest.routePath) ? prev : latest.routePath);
          } else if (latest.routePath && latest.routePath.length === 0) {
            setDynamicRoute(prev => prev.length === 0 ? prev : []);
          }

          const newTripInfo = {
            startLocation: latest.currentLocation || '',
            clientVisits: latest.clientVisits || [],
            purpose: latest.purpose || '',
            vehicleType: latest.vehicleType || 'Bike'
          };
          setCurrentTripInfo(prev => JSON.stringify(prev) === JSON.stringify(newTripInfo) ? prev : newTripInfo);

          if (latest.plannedRouteSummary && Array.isArray(latest.plannedRouteSummary) && latest.plannedRouteSummary.length > 0) {
            setPlannedRouteSummary(prev => JSON.stringify(prev) === JSON.stringify(latest.plannedRouteSummary) ? prev : latest.plannedRouteSummary);
          } else {
            setPlannedRouteSummary(null);
          }
        }
      } catch (_) {}

      try {
        const res = await fetch(`${BASE}/api/ops/expenses/`);
        if (res.ok) {
          const data = await res.json();
          const expenses = Array.isArray(data) ? data : (data.results || []);
          const pending = expenses.filter((e: any) => e.status === "pending");
          const history = expenses.filter((e: any) => e.status !== "pending");
          setPendingExpenses(prev => JSON.stringify(prev) === JSON.stringify(pending) ? prev : pending);
          setExpenseHistory(prev => JSON.stringify(prev) === JSON.stringify(history) ? prev : history);
        }
      } catch (e) {
        console.error("Failed to fetch expenses", e);
      }
    };
    
    fetchState();

    const fetchHistory = async () => {
      try {
        const authHeaders = {
          'X-User-Id': sessionStorage.getItem("userId") || "",
          'X-User-Role': (sessionStorage.getItem("userRole") || "").toUpperCase(),
          'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
        };
        const res = await fetch(`${BASE}/api/ops/tracking-entries/?employeeId=${selectedEmployeeId}&ordering=-checkInTime`, { headers: authHeaders });
        const data = await res.json();
        const entries = Array.isArray(data) ? data : (data.results || []);
        // Don't show the currently active trip in the history list (or show it as "Today Live")
        setTrackingHistory(entries);
        
        if (entries.length > 0 && !selectedHistoryDate) {
          setSelectedHistoryDate(entries[0].id);
        }
      } catch (e) {}
    };
    fetchHistory();

    // Poll every 1 second to stay in sync with the Employee's simulation tab
    const interval = setInterval(fetchState, 1000);

    return () => clearInterval(interval);
  }, [selectedEmployeeId]); // Removed viewMode dependency so it keeps polling even in history mode (to keep live data updated in background)

  const handleApproveExpense = async (expense: any) => {
    try {
      // 1. Give money to employee wallet
      const res = await fetch(`/api/ops/wallets/?employeeId=${expense.employeeId}`);
      const data = await res.json();
      let walletId = null;
      let currentBalance = 0;
      let currentTotalEarned = 0;

      if (data && data.length > 0) {
        walletId = data[0].id;
        currentBalance = data[0].balance;
        currentTotalEarned = data[0].totalEarned;
      } else {
        const createRes = await fetch(`/api/ops/wallets/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: expense.employeeId, balance: 0, totalEarned: 0, totalWithdrawn: 0 })
        });
        const newWallet = await createRes.json();
        walletId = newWallet.id;
      }

      await fetch(`/api/ops/wallets/${walletId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: currentBalance + expense.amount,
          totalEarned: currentTotalEarned + expense.amount
        })
      });

      // 2. Update expense status in backend
      await fetch(`/api/ops/expenses/${expense.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });

      // 3. Update local state
      setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
      setExpenseHistory(prev => [{ ...expense, status: "approved", timestamp: new Date().toISOString() }, ...prev]);
      
    } catch(e) {
      console.error(e);
    }
  };

  const handleRejectExpense = async (expense: any) => {
    try {
      await fetch(`/api/ops/expenses/${expense.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      // Update local state
      setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
      setExpenseHistory(prev => [{ ...expense, status: "rejected", timestamp: new Date().toISOString() }, ...prev]);
    } catch(e) {
      console.error(e);
    }
  };

  // Derived state based on Live vs History mode
  // Derived state based on Live vs History mode
  const currentHistoryRecord = trackingHistory.find(d => d.id === selectedHistoryDate);
  
  const displayDistance = viewMode === "history" && currentHistoryRecord 
    ? (currentHistoryRecord.travelDistance || 0) 
    : distance;
    
  const displayTime = viewMode === "history" && currentHistoryRecord 
    ? (currentHistoryRecord.timeSpentOnSite || 0) 
    : timeSpent;

  const displayStatus = viewMode === "history" ? "Historical" : status;

  const displayRoute = viewMode === "history" && currentHistoryRecord && Array.isArray(currentHistoryRecord.routePath)
    ? currentHistoryRecord.routePath
    : dynamicRoute;

  const displayPlannedRoute = viewMode === "history" && currentHistoryRecord
    ? currentHistoryRecord.plannedRouteSummary
    : plannedRouteSummary;

  const displayPurpose = viewMode === "history" && currentHistoryRecord
    ? currentHistoryRecord.purpose
    : currentTripInfo?.purpose;

  const hasTripDetails = viewMode === "history" ? !!currentHistoryRecord : !!currentTripInfo;

  const currentLocation = displayRoute.length > 0 ? displayRoute[displayRoute.length - 1] : null;
  
  // Find if currently at a site
  const activeSite = sites.find(site => 
    currentLocation && site.latitude && site.longitude &&
    Math.abs(site.latitude - currentLocation.lat) < 0.001 && 
    Math.abs(site.longitude - currentLocation.lng) < 0.001
  );

  const selectedEmployeeData = employees.find(e => e.employeeId === selectedEmployeeId);

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] bg-slate-50 relative rounded-2xl overflow-hidden border border-slate-200 flex-col lg:flex-row">
        {/* Left Content */}
        <div className="flex-[6] bg-white overflow-y-auto flex flex-col relative z-10 border-r border-slate-200">
          <div className="p-6">
            {/* Headers */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
              <div className="w-1/2 pr-4">
                <h2 className="text-2xl font-bold text-slate-800">Daily Operations Log</h2>
                <p className="text-sm text-slate-500 mt-1">Review check-in/out records, attendance logs, and geofence breach reports.</p>
              </div>
              <div className="w-1/2 pl-4 border-l border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800">Live Tracking & Route History</h2>
                <p className="text-sm text-slate-500 mt-1">Monitor field operations, calculate distances, and automate travel reimbursements.</p>
              </div>
            </div>

            {/* Tabs & Content */}
            <Tabs defaultValue="tracking" className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="tracking" className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"><Navigation className="w-4 h-4 mr-2"/> Live Tracking / Route History</TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"><BarChart3 className="w-4 h-4 mr-2"/> Tracking Analytics & Settings</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-500 font-medium">Date:</div>
                  <Input 
                    type="date" 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-[150px] bg-slate-50 border-slate-200 h-9"
                  />
                  {filterDate && (
                    <Button variant="ghost" size="sm" onClick={() => setFilterDate('')} className="h-8 px-2 text-xs">Clear</Button>
                  )}
                </div>
              </div>

              <TabsContent value="tracking" className="mt-0 space-y-6">
                {/* Live Tracking KPI Cards */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Live Tracking / Route History</h3>
                  <p className="text-slate-500 text-sm mb-4">Real-time location monitoring and historical route data</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-green-50 rounded-lg"><Activity className="w-4 h-4 text-green-600" /></div>
                          <span className="text-xs font-semibold text-slate-500">Active Now</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {filteredTrackingData.filter(d => d.status === 'online').length}/{filteredTrackingData.length}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
                          <span className="text-xs font-semibold text-slate-500">Avg Performance</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {filteredTrackingData.length > 0 
                            ? Math.round(filteredTrackingData.reduce((acc, curr) => acc + Number(curr.planVsActual || 0), 0) / filteredTrackingData.length) 
                            : 0}%
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-indigo-50 rounded-lg"><Navigation2 className="w-4 h-4 text-indigo-600" /></div>
                          <span className="text-xs font-semibold text-slate-500">Total Distance</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {filteredTrackingData.reduce((acc, curr) => acc + Number(curr.travelDistance || 0), 0).toFixed(1)} <span className="text-sm text-slate-500">km</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-orange-50 rounded-lg"><Fuel className="w-4 h-4 text-orange-600" /></div>
                          <span className="text-xs font-semibold text-slate-500">Total Fuel Cost</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          ₹{(filteredTrackingData.reduce((acc, curr) => acc + Number(curr.travelDistance || 0), 0) * 3).toFixed(0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                          <span className="text-xs font-semibold text-slate-500">Alerts Today</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {filteredTrackingData.filter(d => Number(d.idleTime || 0) > 30).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <DataTable
                    data={filteredTrackingData}
                    columns={liveTrackingColumns}
                    onView={(entry) => {
                      setModalEmployeeId(entry.employeeId);
                      setIsDetailModalOpen(true);
                    }}
                    searchPlaceholder="Search employees..."
                    showExport={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 space-y-6">
                {/* Analytics KPI Cards */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Tracking Analytics & Settings</h3>
                  <p className="text-slate-500 text-sm mb-4">Configure tracking rules and analyze performance trends</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-blue-50 rounded-xl"><Navigation className="w-5 h-5 text-blue-600" /></div>
                          <span className="text-sm font-semibold text-slate-500">Avg Distance/Employee</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800 mt-2">
                          {filteredTrackingData.length > 0 
                            ? (filteredTrackingData.reduce((acc, curr) => acc + Number(curr.travelDistance || 0), 0) / filteredTrackingData.length).toFixed(1) 
                            : "0.0"} <span className="text-lg text-slate-500">km</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-orange-50 rounded-xl"><Clock className="w-5 h-5 text-orange-600" /></div>
                          <span className="text-sm font-semibold text-slate-500">Avg Idle Time</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800 mt-2">
                          {filteredTrackingData.length > 0 
                            ? Math.round(filteredTrackingData.reduce((acc, curr) => acc + Number(curr.idleTime || 0), 0) / filteredTrackingData.length) 
                            : 0} <span className="text-lg text-slate-500">min</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-xl">
                      <CardContent className="p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-red-50 rounded-xl"><Shield className="w-5 h-5 text-red-600" /></div>
                          <span className="text-sm font-semibold text-slate-500">Geo-Fence Breaches</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800 mt-2">0</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Configuration Sub-tabs */}
                <Tabs defaultValue="settings" className="w-full">
                  <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 mb-6">
                    <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-6 py-3"><Settings className="w-4 h-4 mr-2"/> Settings</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-6 py-3"><BarChart3 className="w-4 h-4 mr-2"/> Analytics Reports</TabsTrigger>
                  </TabsList>

                  <TabsContent value="settings" className="mt-0">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h4 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <Settings className="w-5 h-5 text-slate-700"/> Tracking Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <Label className="text-base font-semibold text-slate-800">Idle Threshold (minutes)</Label>
                            <Input type="number" value="30" className="mt-2 bg-slate-50" readOnly/>
                            <p className="text-xs text-slate-500 mt-1">Alert when employee is idle beyond this duration</p>
                          </div>
                          <div>
                            <Label className="text-base font-semibold text-slate-800">Alert Severity Levels</Label>
                            <Select defaultValue="medium">
                              <SelectTrigger className="mt-2 bg-slate-50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 mt-1">Default severity for new alerts</p>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <Label className="text-base font-semibold text-slate-800">Geo-Fence Radius (meters)</Label>
                            <Input type="number" value="500" className="mt-2 bg-slate-50" readOnly/>
                            <p className="text-xs text-slate-500 mt-1">Default boundary radius for geo-fence zones</p>
                          </div>
                          <div className="pt-2 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-base font-semibold text-slate-800">Approval Workflow for Adjustments</Label>
                                <p className="text-xs text-slate-500">Enable manager approval for time adjustments</p>
                              </div>
                              <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-base font-semibold text-slate-800">Audit Trail Enabled</Label>
                                <p className="text-xs text-slate-500">Track all changes with user/timestamp</p>
                              </div>
                              <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                        <Button variant="outline">Reset to Defaults</Button>
                        <Button className="bg-blue-600 text-white">Save Settings</Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reports">
                    <div className="py-12 text-center text-slate-500">Analytics reports will be visualized here.</div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {/* Right Content (Map & Live Tracking Card) */}
        <div className="w-full lg:w-[40%] flex flex-col h-[400px] lg:h-auto relative z-0 bg-slate-100">
          <div className="flex-1 relative">
            <MapContainer 
              center={displayRoute.length > 0 ? displayRoute[displayRoute.length - 1] : { lat: 19.0596, lng: 72.8295 }} 
              zoom={12} 
              className="w-full h-full z-0"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              <Polyline positions={displayRoute} color={viewMode === "history" ? "#64748b" : "#2563eb"} weight={5} dashArray={viewMode === "history" ? "10, 10" : undefined} />

              {sites.filter(s => s.latitude && s.longitude).map((site) => (
                <Marker key={site.id} position={[site.latitude, site.longitude]}>
                  <Popup className="font-sans">
                    <div className="font-bold text-slate-800 mb-1">{site.name}</div>
                    <div className="text-xs text-slate-500">Designated Site</div>
                  </Popup>
                </Marker>
              ))}

              {/* Show specific selected employee's current location */}
              {selectedEmployeeId && currentLocation && (
                <Marker 
                  position={[currentLocation.lat, currentLocation.lng]} 
                  icon={currentLocationIcon}
                >
                  <Popup>
                    <div className="font-bold mb-1">{selectedEmployeeData?.fullName || "Employee"}</div>
                    <div className="text-xs text-slate-500">Current Location</div>
                  </Popup>
                </Marker>
              )}

              {/* Show ALL active employees if no specific employee is selected */}
              {!selectedEmployeeId && filteredTrackingData.map((entry, idx) => {
                if (!entry.currentLocation || entry.status !== "online") return null;
                try {
                  const loc = typeof entry.currentLocation === 'string' 
                    ? JSON.parse(entry.currentLocation) 
                    : entry.currentLocation;
                  
                  if (loc && loc.lat && loc.lng) {
                    return (
                      <Marker 
                        key={entry.id || idx}
                        position={[loc.lat, loc.lng]} 
                        icon={currentLocationIcon}
                      >
                        <Popup>
                          <div className="font-bold mb-1">{entry.employeeName}</div>
                          <div className="text-xs text-slate-500">{entry.role}</div>
                          <div className="text-xs font-bold text-green-600 mt-1">Live Tracking</div>
                        </Popup>
                      </Marker>
                    );
                  }
                } catch (e) {}
                return null;
              })}
            </MapContainer>
          </div>
          
          {/* Live Tracking Controls Card */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" /> Live Tracking
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-slate-500 text-sm">Select Date</Label>
                <Input 
                  type="date" 
                  value={filterDate} 
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-slate-500 text-sm">Select Employee to Track</Label>
                <Select value={selectedEmployeeId || "none"} onValueChange={(val) => setSelectedEmployeeId(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full border-slate-200 bg-slate-50">
                    <SelectValue placeholder="None (Stop Tracking)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Stop Tracking)</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                            {(emp.fullName || "U").charAt(0)}
                          </div>
                          <span>{emp.fullName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Reimbursement & Penalty Configuration
            </DialogTitle>
            <DialogDescription>
              Set the per-kilometer vehicle rates and the rules for penalizing employees who exceed their ETA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bike Rate (₹/km)</Label>
                <Input 
                  type="number" 
                  value={vehicleRateBike}
                  onChange={(e) => setVehicleRateBike(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Car Rate (₹/km)</Label>
                <Input 
                  type="number" 
                  value={vehicleRateCar}
                  onChange={(e) => setVehicleRateCar(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delay Threshold (Minutes)</Label>
              <Input 
                type="number" 
                value={penaltyThreshold}
                onChange={(e) => setPenaltyThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Apply penalty if time exceeds ETA by this many minutes.</p>
            </div>
            <div className="space-y-2">
              <Label>Penalty Amount per Minute (₹/min)</Label>
              <Input 
                type="number" 
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Amount to deduct per minute after the threshold is exceeded.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveSettings}>Save Rules</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExpenseQueue} onOpenChange={setShowExpenseQueue}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-600" />
              Expense Approvals
            </DialogTitle>
            <DialogDescription>
              Review and manage employee travel expenses.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={expenseTab} onValueChange={(val) => setExpenseTab(val as "pending" | "history")} className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pending">
                Pending 
                {pendingExpenses.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">{pendingExpenses.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-0">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {pendingExpenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending expenses to review.
                  </div>
                ) : (
                  pendingExpenses.map(exp => (
                    <Card key={exp.id} className="overflow-hidden border-orange-100">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/3 bg-slate-100 relative group cursor-pointer" onClick={() => window.open(exp.photo, "_blank")}>
                          <img src={exp.photo} alt="Bill Photo" className="w-full h-32 md:h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                            Click to enlarge
                          </div>
                        </div>
                        <div className="w-full md:w-2/3 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-lg">{exp.employeeName}</h4>
                                <p className="text-sm text-muted-foreground">{new Date(exp.timestamp).toLocaleString()}</p>
                              </div>
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">
                                {exp.type}
                              </Badge>
                            </div>
                            <p className="text-2xl font-bold text-slate-800 mb-4">₹{exp.amount.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveExpense(exp)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Pay
                            </Button>
                            <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleRejectExpense(exp)}>
                              <X className="w-4 h-4 mr-2" /> Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {expenseHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expense history available.
                  </div>
                ) : (
                  [...expenseHistory].reverse().map(exp => (
                    <Card key={exp.id} className="overflow-hidden border-slate-200">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/3 bg-slate-100 relative group cursor-pointer" onClick={() => window.open(exp.photo, "_blank")}>
                          <img src={exp.photo} alt="Bill Photo" className="w-full h-24 md:h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <div className="w-full md:w-2/3 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-lg">{exp.employeeName}</h4>
                                <p className="text-xs text-muted-foreground">{new Date(exp.timestamp).toLocaleString()}</p>
                              </div>
                              <Badge className={exp.status === "approved" ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                                {exp.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                              <Badge variant="outline" className="text-slate-500">{exp.type}</Badge>
                              <p className="text-xl font-bold text-slate-800">₹{exp.amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseQueue(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DailyTrackingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setModalEmployeeId("");
        }}
        employeeId={modalEmployeeId}
        date={filterDate || new Date().toISOString().split('T')[0]}
      />
    </>
  );
}
