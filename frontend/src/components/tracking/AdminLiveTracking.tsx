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
import { Navigation, Clock, MapPin, User, Navigation2, Fuel, Calendar, History, Settings, Receipt, CheckCircle2, X, ArrowLeft, AlertTriangle, Banknote } from 'lucide-react';
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
         role: emp?.roleId?.roleName || emp?.roleId?.roleCode || "Employee",
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
        <div className="flex items-center gap-2 text-muted-foreground italic">
          {value ? <span>{String(value)}</span> : <span>Active</span>}
        </div>
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
        <div className="flex items-center gap-2">
          <span className={`${Number(value) > 30 ? 'text-orange-500 font-bold' : 'text-slate-500'}`}>{String(value || 0)} min</span>
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
      <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50 relative rounded-2xl overflow-hidden border border-slate-200">
      
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-[300px] border-slate-300 font-semibold text-slate-800">
              <SelectValue placeholder="Search & Select Employee..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.employeeId} value={emp.employeeId}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {(emp.fullName || "U").charAt(0)}
                    </div>
                    <span>{emp.fullName}</span>
                    <span className="text-xs text-slate-400 ml-2">({emp.employeeId})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 border-l pl-4 ml-2 border-slate-200">
            <Label className="text-slate-500 text-sm whitespace-nowrap">Date:</Label>
            <Input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto h-9"
            />
            {filterDate && (
              <Button variant="ghost" size="sm" onClick={() => setFilterDate("")} className="h-8 px-2 text-xs">Clear</Button>
            )}
          </div>


          {selectedEmployeeId && (
            <Badge className={`ml-4 ${displayStatus === "Traveling" ? "animate-pulse bg-green-500 text-white" : displayStatus === "Completed" ? "bg-green-600 text-white" : displayStatus === "Offline" ? "bg-slate-500" : "bg-blue-500"}`}>
              {displayStatus}
            </Badge>
          )}
        </div>
            <div className="flex items-center gap-3">
              <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => setIsMapModalOpen(true)}>
                <MapPin className="w-4 h-4 mr-2" /> View Live Map
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" /> Penalty Config
                </Button>
              )}
              {canApprove && (
                <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50 relative" onClick={() => setShowExpenseQueue(true)}>
                  <Receipt className="w-4 h-4 mr-2" /> Approvals
                  {pendingExpenses.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingExpenses.length}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden flex-col lg:flex-row-reverse relative border-b">
            
            {/* Map Section */}
            <div className="w-full lg:w-[40%] h-[400px] lg:h-auto relative z-0 border-b lg:border-b-0 lg:border-l border-slate-200 bg-slate-100">
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
                  <Marker key={site.id} position={[site.latitude!, site.longitude!]}>
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

            {/* Left Content (Table & Analytics) */}
            <div className="flex-[6] bg-white overflow-y-auto flex flex-col relative z-10">
              
              {/* The Tracking List */}
              <div className="w-full p-6 border-b border-slate-200 shadow-sm shrink-0">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Employee Tracking List
                </h3>
                <DataTable
                  data={filteredTrackingData}
                  columns={liveTrackingColumns}
                  onView={(entry) => {
                    setModalEmployeeId(entry.employeeId);
                    setIsDetailModalOpen(true);
                  }}
                  searchPlaceholder="Search tracking entries..."
                />
              </div>

              {/* Analytics Dashboard Section */}
              <Tabs defaultValue="analytics" className="w-full flex-1 flex flex-col shrink-0">
                <div className="p-4 border-b shrink-0">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="analytics" onClick={() => { setViewMode("live"); setSelectedHistoryDate(""); }}>Trip Analytics</TabsTrigger>
                    <TabsTrigger value="history">Route History</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="analytics" className="p-6 m-0 flex-1 overflow-y-auto">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    {viewMode === "history" ? "Historical Trip Data" : "Live Trip Analytics"}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" /> Distance
                      </p>
                      <p className="font-bold text-xl">{displayDistance.toFixed(2)} km</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" /> Duration
                      </p>
                      <p className="font-bold text-xl">{displayTime.toFixed(0)} mins</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <User className="w-3 h-3" /> Vehicle Type
                      </p>
                      <p className="font-bold text-xl">{currentTripInfo?.vehicleType || 'Bike'}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-xs text-green-700 flex items-center gap-1 mb-1">
                        <Banknote className="w-3 h-3" /> Est. Reimbursement
                      </p>
                      <p className="font-bold text-xl text-green-700">₹{(displayDistance * (currentTripInfo?.vehicleType === 'Car' ? parseFloat(vehicleRateCar) : parseFloat(vehicleRateBike))).toFixed(2)}</p>
                    </div>
                  </div>

              {(() => {
                const expectedTime = dynamicEta !== null ? dynamicEta : (displayDistance / 30) * 60;
                const excessMins = displayTime - expectedTime;
                const thresh = parseInt(penaltyThreshold.toString(), 10) || 30;
                const amt = parseFloat(penaltyAmount.toString()) || 50;
                const isOverdue = excessMins > 0;
                const isPenalized = excessMins > thresh;
                
                return (
                  <div className="mb-8 p-5 rounded-xl border shadow-sm bg-white">
                    <h4 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Live Time Tracker
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Estimated Due Time</span>
                        <span className="font-bold text-slate-800">{expectedTime.toFixed(0)} mins</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Time Elapsed</span>
                        <span className="font-bold text-slate-800">{displayTime.toFixed(0)} mins</span>
                      </div>

                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isOverdue ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (displayTime / expectedTime) * 100)}%` }}
                        />
                      </div>

                      <div className={`p-3 rounded-lg border flex justify-between items-center ${isOverdue ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        <span className="font-semibold text-sm">
                          {isOverdue ? 'Time Overdue' : 'Time Remaining'}
                        </span>
                        <span className="font-bold text-lg">
                          {Math.abs(excessMins).toFixed(0)} mins {isOverdue ? 'Late' : 'Left'}
                        </span>
                      </div>
                      
                      {isPenalized && (
                        <div className="mt-2 p-3 rounded-lg bg-red-100 border border-red-300">
                          <p className="text-sm text-red-800 font-bold mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Penalty Applied!
                          </p>
                          <p className="text-xs text-red-600 mb-2">Exceeded grace period by {(excessMins - thresh).toFixed(0)}m</p>
                          <div className="flex justify-between items-center font-bold text-sm text-red-800">
                            <span>Deduction:</span>
                            <span>-₹{((excessMins - thresh) * amt).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {hasTripDetails && (
                <div className="pt-3 border-t border-slate-100 space-y-2 mb-6">
                  <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1">
                    <Navigation2 className="w-3 h-3" /> Trip Details
                  </p>
                  
                  <div className="text-xs text-slate-700 bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="font-bold block mb-1">Purpose of Visit:</span>
                    {displayPurpose || 'No purpose specified'}
                  </div>
                  
                  {displayPlannedRoute && displayPlannedRoute.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {displayPlannedRoute.map((seg: any, i: number) => (
                        <div key={i} className="text-xs bg-white border border-slate-100 p-2 rounded shadow-sm relative pl-4 before:content-[''] before:absolute before:-left-1 before:top-2 before:w-2 before:h-2 before:bg-blue-500 before:rounded-full">
                          <div className="font-bold truncate text-slate-800">{seg.startName} → {seg.endName}</div>
                          <div className="flex justify-between mt-1 text-slate-500">
                            <span>{seg.distance.toFixed(1)} km</span>
                            <span>{seg.eta.toFixed(0)} min ETA</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSite && (
                    <div className="w-full mt-3 shadow-sm bg-green-50 text-green-700 border border-green-200 p-2 rounded text-center text-xs font-bold flex items-center justify-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-4 h-4" />
                      Checked-in at {activeSite.name}
                    </div>
                  )}
                </div>
              )}
              </TabsContent>

                <TabsContent value="history" className="p-0 m-0 flex-1 overflow-y-auto bg-slate-50">
                  <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0 z-10">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-600" />
                      Trip History
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {trackingHistory.length === 0 ? (
                      <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No historical trips found.</p>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Past Trips</h4>
                        <div className="space-y-3">
                          {trackingHistory.map((trip) => {
                            const dateObj = new Date(trip.checkInTime);
                            const isToday = new Date().toDateString() === dateObj.toDateString();
                            
                            return (
                              <div 
                                key={trip.id} 
                                onClick={() => {
                                  setSelectedHistoryDate(trip.id);
                                  setViewMode("history");
                                }}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                  selectedHistoryDate === trip.id 
                                    ? "bg-blue-50 border-blue-200 shadow-sm" 
                                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-bold text-slate-800">
                                    {isToday ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </div>
                                  <Badge variant="outline" className={trip.status === "online" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-600"}>
                                    {trip.status === "online" ? "Active" : "Completed"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2 mt-3">
                                  <div className="flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span className="font-medium">Check-In:</span> {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {trip.checkOutTime && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">Out:</span> {new Date(trip.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span className="font-medium">Dist:</span> {trip.travelDistance || 0} km
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3 text-slate-400" />
                                      <span className="font-medium">Vehicle:</span> {trip.vehicleType || "N/A"}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Navigation2 className="w-3 h-3 text-slate-400" />
                                      <span className="font-medium">Idle:</span> {trip.idleTime || 0} min
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-orange-600">
                                      <Fuel className="w-3 h-3" />
                                      <span className="font-medium">Fuel:</span> {((trip.travelDistance || 0) / 40).toFixed(1)} L
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600">
                                      <Banknote className="w-3 h-3" />
                                      <span className="font-medium">Reimb:</span> ₹{(trip.reimbursementAmount || 0).toFixed(2)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span className="font-medium">Site Time:</span> {trip.timeSpentOnSite || 0} hrs
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span className="font-medium">Plan vs Act:</span> {trip.planVsActual || 0}%
                                    </div>
                                  </div>

                                  {trip.purpose && (
                                    <div className="text-xs text-slate-600 pt-1">
                                      <span className="font-medium text-slate-700">Purpose: </span> 
                                      <span className="italic">{trip.purpose}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  

        </div>

                </TabsContent>
              </Tabs>
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
