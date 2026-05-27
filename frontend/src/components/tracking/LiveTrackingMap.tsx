import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Navigation, Clock, Banknote, MapPin, CheckCircle2, LogOut, User } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock Route Data (Mumbai area)
const FULL_ROUTE = [
  { lat: 19.0596, lng: 72.8295 }, // Bandra (Start)
  { lat: 19.0800, lng: 72.8350 }, // Santacruz
  { lat: 19.0980, lng: 72.8450 }, // Vile Parle
  { lat: 19.1136, lng: 72.8697 }, // Andheri (Site 1)
  { lat: 19.1350, lng: 72.8480 }, // Jogeshwari
  { lat: 19.1650, lng: 72.8550 }, // Goregaon
  { lat: 19.1850, lng: 72.8450 }, // Malad
  { lat: 19.2050, lng: 72.8550 }, // Kandivali
  { lat: 19.2307, lng: 72.8567 }, // Borivali (Site 2)
  { lat: 19.2500, lng: 72.8600 }, // Dahisar (End)
];

// Predefined Checkpoints (Store or Customer locations the employee MUST visit)
const PREDEFINED_LOCATIONS = [
  { id: 1, name: "Site 1 - Andheri East", lat: 19.1136, lng: 72.8697 },
  { id: 2, name: "Site 2 - Borivali West", lat: 19.2307, lng: 72.8567 }
];

const RATE_PER_KM = 5; // ₹5 per km

export function LiveTrackingMap() {
  const [currentPath, setCurrentPath] = useState<any[]>([FULL_ROUTE[0]]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [distance, setDistance] = useState(0); // km
  const [timeSpent, setTimeSpent] = useState(0); // minutes

  // OTP State
  const [visitedSites, setVisitedSites] = useState<number[]>([]);
  const [activeSite, setActiveSite] = useState<any>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpType, setOtpType] = useState<"checkin" | "checkout" | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [siteCheckInTime, setSiteCheckInTime] = useState<Date | null>(null);
  const [trackingEntryId, setTrackingEntryId] = useState<string | null>(null);

  const userRole = sessionStorage.getItem("userRole") || "Employee";
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const sendAlert = async (message: string, severity: 'high' | 'medium' | 'low') => {
    const employeeId = userRole === "Admin" ? selectedEmployeeId : sessionStorage.getItem('employeeId');
    if (!employeeId) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/alerts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tracking_update',
          message: message,
          severity: severity,
          relatedEntityId: employeeId,
          relatedEntityType: 'employee'
        })
      });
    } catch(e) {
      console.error("Failed to send alert", e);
    }
  };

  useEffect(() => {
    if (userRole === "Admin") {
      fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/employees/`)
        .then(res => res.json())
        .then(data => setEmployees(data))
        .catch(console.error);
    }
  }, [userRole]);

  // Haversine formula to calculate distance
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying && currentPath.length < FULL_ROUTE.length) {
      interval = setInterval(() => {
        setCurrentPath(prev => {
          const nextIndex = prev.length;
          const nextPoint = FULL_ROUTE[nextIndex];
          const lastPoint = prev[prev.length - 1];
          
          if (lastPoint && nextPoint) {
             const dist = getDistanceFromLatLonInKm(lastPoint.lat, lastPoint.lng, nextPoint.lat, nextPoint.lng);
             setDistance(d => d + dist);
             setTimeSpent(t => t + 5); // Add 5 mins per segment

             // Check if we hit a predefined site
             const siteMatch = PREDEFINED_LOCATIONS.find(loc => 
               Math.abs(loc.lat - nextPoint.lat) < 0.0001 && Math.abs(loc.lng - nextPoint.lng) < 0.0001
             );

             if (siteMatch && !visitedSites.includes(siteMatch.id)) {
               setTimeout(() => {
                 setIsPlaying(false);
                 setActiveSite(siteMatch);
                 setOtpType("checkin");
                 setOtpModalOpen(true);
               }, 0);
             }
          }
          return [...prev, nextPoint];
        });
      }, 2000); // Add a point every 2 seconds
    } else if (currentPath.length >= FULL_ROUTE.length) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentPath, visitedSites]);

  const handleVerifyOtp = () => {
    if (otpInput === "1234") {
      setOtpError("");
      if (otpType === "checkin") {
         setOtpModalOpen(false);
         setOtpInput("");
         setSiteCheckInTime(new Date());
         const empName = userRole === "Admin" ? employees.find(e => e.employeeId === selectedEmployeeId)?.fullName || selectedEmployeeId : (sessionStorage.getItem("userName") || "Current User");
         sendAlert(`${empName} has checked in at ${activeSite.name}.`, 'medium');
      } else if (otpType === "checkout") {
         setOtpModalOpen(false);
         setOtpInput("");
         if (siteCheckInTime) {
           const minsSpent = (new Date().getTime() - siteCheckInTime.getTime()) / 60000;
           setTimeSpent(t => t + minsSpent);
         }
         setSiteCheckInTime(null);
         setVisitedSites(prev => [...prev, activeSite.id]);
         setActiveSite(null);
         setIsPlaying(true); // Resume simulation
      }
    } else {
      setOtpError("Invalid OTP. Try '1234'.");
    }
  };

  const reset = () => {
    setCurrentPath([FULL_ROUTE[0]]);
    setDistance(0);
    setTimeSpent(0);
    setIsPlaying(false);
    setVisitedSites([]);
    setActiveSite(null);
    setOtpModalOpen(false);
    setTripStartTime(null);
    setSiteCheckInTime(null);
    setTrackingEntryId(null);
  };

  const handleSimulate = async () => {
    if (!tripStartTime) {
      const startTime = new Date();
      setTripStartTime(startTime);
      
      // Create DB Entry Immediately!
      const employeeId = userRole === "Admin" ? selectedEmployeeId : sessionStorage.getItem('employeeId');
      const empName = userRole === "Admin" ? employees.find(e => e.employeeId === employeeId)?.fullName || employeeId : (sessionStorage.getItem("userName") || "Current User");
      
      if (employeeId) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/tracking-entries/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: employeeId,
              employeeName: empName,
              role: userRole,
              currentLocation: "Bandra",
              checkInTime: startTime.toISOString(),
              travelDistance: 0,
              idleTime: 0,
              planVsActual: 0,
              reimbursementAmount: 0,
              timeSpentOnSite: 0,
              status: "online",
              date: startTime.toISOString().split('T')[0]
            })
          });
          const newEntry = await res.json();
          setTrackingEntryId(newEntry.id);
          sendAlert(`${empName} has started their trip from Bandra.`, 'medium');
        } catch(e) {
          console.error(e);
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const reimbursement = (distance * RATE_PER_KM).toFixed(2);

  const handleDepositEarnings = async () => {
    const employeeId = userRole === "Admin" ? selectedEmployeeId : sessionStorage.getItem('employeeId');
    if (!employeeId) {
      alert("Please select or login as an employee first.");
      return;
    }
    
    const amount = parseFloat(reimbursement);
    if (amount <= 0) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/wallets/?employeeId=${employeeId}`);
      const data = await res.json();
      let walletId = null;
      let currentBalance = 0;
      let currentTotalEarned = 0;

      if (data && data.length > 0) {
        walletId = data[0].id;
        currentBalance = data[0].balance;
        currentTotalEarned = data[0].totalEarned;
      } else {
         const createRes = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/wallets/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: employeeId, balance: 0, totalEarned: 0, totalWithdrawn: 0 })
        });
        const newWallet = await createRes.json();
        walletId = newWallet.id;
      }

      await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/wallets/${walletId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: currentBalance + amount,
          totalEarned: currentTotalEarned + amount
        })
      });

      // Update Real-time Tracking Entry Log
      const empName = userRole === "Admin" ? employees.find(e => e.employeeId === employeeId)?.fullName || employeeId : (sessionStorage.getItem("userName") || "Current User");
      if (trackingEntryId) {
        await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/ops/tracking-entries/${trackingEntryId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLocation: "Dahisar",
            checkOutTime: new Date().toISOString(),
            travelDistance: parseFloat(distance.toFixed(2)),
            planVsActual: 100,
            reimbursementAmount: amount,
            timeSpentOnSite: timeSpent,
            status: "offline",
          })
        });
        sendAlert(`${empName} has reached their final destination at Dahisar.`, 'high');
      }

      alert(`₹${amount} has been deposited to the wallet, and the trip log was finalized!`);
      setDistance(0);
    } catch(e) {
      console.error(e);
      alert('Failed to deposit earnings');
    }
  };
  const currentLocation = currentPath[currentPath.length - 1];

  return (
    <div className="relative w-full h-[600px] md:h-[700px] rounded-xl overflow-hidden shadow-xl border border-border">
      <MapContainer center={[19.1136, 72.8697]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {/* Predefined Location Checkpoints */}
        {PREDEFINED_LOCATIONS.map(loc => (
          <Marker 
            key={loc.id} 
            position={[loc.lat, loc.lng]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="font-semibold text-red-600">Checkpoint</div>
              <div className="text-sm">{loc.name}</div>
            </Popup>
          </Marker>
        ))}

        {/* Route Line */}
        <Polyline positions={currentPath.map(p => [p.lat, p.lng])} color="#3b82f6" weight={5} />
        
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>
              <div className="font-semibold">Amit Patel</div>
              <div className="text-sm text-muted-foreground">Moving...</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* OTP Modal Overlay */}
      {otpModalOpen && (
        <div className="absolute inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
          <Card className="w-full max-w-sm shadow-2xl border-white/20 glass-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                {otpType === "checkin" ? <MapPin className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                <h3 className="font-bold text-xl">
                  {otpType === "checkin" ? "Site Check-in" : "Site Check-out"}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                You have reached <strong>{activeSite?.name}</strong>. 
                Please enter the OTP to {otpType === "checkin" ? "login to the site" : "logout from the site"}.
              </p>
              
              <div className="space-y-2">
                <Input 
                  type="text" 
                  placeholder="Enter 4-digit OTP (1234)" 
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  maxLength={4}
                  className="text-center text-lg tracking-widest bg-background"
                />
                {otpError && <p className="text-sm text-red-500 text-center">{otpError}</p>}
              </div>

              <Button className="w-full gradient-btn" onClick={handleVerifyOtp}>
                Verify & {otpType === "checkin" ? "Login" : "Logout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Overlay */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-8 md:top-8 md:bottom-auto md:w-80 z-[10]">
        <Card className="glass-card shadow-2xl border border-white/20 dark:border-white/10 backdrop-blur-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Live Tracking
              </h3>
              <Badge variant={isPlaying ? "default" : "secondary"} className={isPlaying ? "animate-pulse bg-success" : ""}>
                {isPlaying ? "Traveling" : activeSite ? "On Site" : "Paused"}
              </Badge>
            </div>

            {userRole === "Admin" && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Select Employee to Track
                </p>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="bg-background w-full">
                    <SelectValue placeholder="Select an Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Distance
                </p>
                <p className="font-semibold text-lg">{distance.toFixed(2)} km</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duration
                </p>
                <p className="font-semibold text-lg">{timeSpent} mins</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Banknote className="w-3 h-3 text-green-500" /> Estimated Payout (₹{RATE_PER_KM}/km)
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{reimbursement}
              </p>
            </div>

            {/* Check-out UI when at Site */}
            {activeSite && !otpModalOpen && (
              <div className="pt-3 border-t border-border">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mb-3">
                  <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Currently At Site
                  </p>
                  <p className="text-xs text-muted-foreground">{activeSite.name}</p>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    setOtpType("checkout");
                    setOtpModalOpen(true);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Initiate Check-out
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1 gradient-btn" 
                onClick={handleSimulate}
                disabled={currentPath.length >= FULL_ROUTE.length || !!activeSite || (userRole === "Admin" && !selectedEmployeeId)}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? "Pause" : "Simulate"}
              </Button>
              <Button variant="outline" onClick={reset}>Reset</Button>
            </div>
            
            {parseFloat(reimbursement) > 0 && currentPath.length >= FULL_ROUTE.length && (
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white mt-2" onClick={handleDepositEarnings}>
                <Banknote className="w-4 h-4 mr-2" /> Deposit Earnings
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
