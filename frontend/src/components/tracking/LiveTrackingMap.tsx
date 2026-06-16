import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Play, Pause, Navigation, Clock, Banknote, MapPin, CheckCircle2, User, Camera, Receipt, Plus, X, Loader2, History } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RATE_PER_KM = 5; // ₹5 per km

function LocationAutocomplete({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!value || value.length < 3 || !showDropdown) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5&lat=19.1136&lon=72.8697`);
        const data = await res.json();
        if (data && data.features) {
          const formattedSuggestions = data.features.map((f: any) => {
            const props = f.properties;
            const name = props.name || props.street || value;
            const context = [props.city, props.state, props.country].filter(Boolean).join(', ');
            return {
              display_name: `${name}${context ? ', ' + context : ''}`,
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0]
            };
          });
          
          // Filter out duplicates
          const unique = formattedSuggestions.filter((v, i, a) => a.findIndex(t => (t.display_name === v.display_name)) === i);
          setSuggestions(unique);
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.error(e);
      }
    }, 500); // debounce 500ms
    return () => clearTimeout(timer);
  }, [value, showDropdown]);

  return (
    <div className="relative w-full">
      <Input 
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onFocus={() => {
          if (value.length >= 3) setShowDropdown(true);
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-md z-[2000] max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className="p-2 md:p-3 text-sm cursor-pointer hover:bg-slate-100 border-b border-slate-100 last:border-0 truncate"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent onBlur from firing before this
                onChange(s.display_name.split(',')[0]); // Take the primary name part
                setShowDropdown(false);
              }}
            >
              <div className="font-medium text-slate-800">{s.display_name.split(',')[0]}</div>
              <div className="text-xs text-muted-foreground truncate">{s.display_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveTrackingMap() {
  const [detailedRoute, setDetailedRoute] = useState<any[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [distance, setDistance] = useState(0); // km
  const [timeSpent, setTimeSpent] = useState(0); // minutes

  // Site Check-in States (OTP removed)
  const [visitedSites, setVisitedSites] = useState<number[]>([]);
  const [activeSite, setActiveSite] = useState<any>(null);
  const [isNearDestination, setIsNearDestination] = useState(false);
  const [arrivedSite, setArrivedSite] = useState<any>(null);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"checkin" | "checkout">("checkin");
  const [checkInPhoto, setCheckInPhoto] = useState<string | null>(null);

  // Dynamic Route States
  const [hasStartedTrip, setHasStartedTrip] = useState(() => {
    return localStorage.getItem(`tracking_${sessionStorage.getItem('employeeId')}_trip_info`) !== null;
  });
  const [showPreTripModal, setShowPreTripModal] = useState(false);
  const [startLocationInput, setStartLocationInput] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpenseHistoryModal, setShowExpenseHistoryModal] = useState(false);
  const [clientVisits, setClientVisits] = useState([{ id: 1, name: "" }]);
  const [dynamicDestinations, setDynamicDestinations] = useState<any[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [purposeInput, setPurposeInput] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");

  // Expense States
  const [expenseType, setExpenseType] = useState("Food");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePhoto, setExpensePhoto] = useState<string | null>(null);
  const [myExpenses, setMyExpenses] = useState<any[]>([]);

  // Route Planning State
  const [routeSummary, setRouteSummary] = useState<any[] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [plannedRouteData, setPlannedRouteData] = useState<any>(null);

  useEffect(() => {
    if (showExpenseHistoryModal) {
      const fetchExpenses = async () => {
        try {
          const employeeId = sessionStorage.getItem('employeeId');
          const res = await fetch(`/api/ops/expenses/?employeeId=${employeeId}`, { headers: authHeaders });
          if (res.ok) {
            const data = await res.json();
            setMyExpenses(Array.isArray(data) ? data : (data.results || []));
          }
        } catch (e) {
          console.error("Failed to fetch expenses:", e);
        }
      };
      fetchExpenses();
    }
  }, [showExpenseHistoryModal]);

  useEffect(() => {
    // Restore state from localStorage on mount
    const empId = sessionStorage.getItem('employeeId');
    if (!empId) return;

    const savedRoute = localStorage.getItem(`tracking_${empId}_route`);
    if (savedRoute) {
      try {
        setDetailedRoute(JSON.parse(savedRoute));
      } catch (e) {}
    }
    
    const savedDestinations = localStorage.getItem(`tracking_${empId}_destinations`);
    if (savedDestinations) {
      try {
        setDynamicDestinations(JSON.parse(savedDestinations));
      } catch (e) {}
    }

    const savedDist = localStorage.getItem(`tracking_${empId}_distance`);
    if (savedDist) setDistance(parseFloat(savedDist));

    const savedTime = localStorage.getItem(`tracking_${empId}_time`);
    if (savedTime) setTimeSpent(parseFloat(savedTime));
  }, []);

  const [tripStartTime, setTripStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem(`tracking_${sessionStorage.getItem('employeeId')}_start_time`);
    return saved ? new Date(saved) : null;
  });
  const [siteCheckInTime, setSiteCheckInTime] = useState<Date | null>(null);
  const [trackingEntryId, setTrackingEntryId] = useState<string | null>(() => {
    return localStorage.getItem(`tracking_${sessionStorage.getItem('employeeId')}_entry_id`) || null;
  });
  const [realRoute, setRealRoute] = useState<any[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);

  const userRole = sessionStorage.getItem("userRole") || "Employee";
  const empName = sessionStorage.getItem("userName") || "Current User";

  const authHeaders = {
    'X-User-Id': sessionStorage.getItem("userId") || "",
    'X-User-Role': (sessionStorage.getItem("userRole") || "").toUpperCase(),
    'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
  };

  const sendAlert = async (message: string, severity: 'high' | 'medium' | 'low') => {
    const employeeId = sessionStorage.getItem('employeeId');
    if (!employeeId) return;
    try {
      const authHeaders = {
        'X-User-Id': sessionStorage.getItem("userId") || "",
        'X-User-Role': (sessionStorage.getItem("userRole") || "").toUpperCase(),
        'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
      };
      await fetch(`/api/ops/alerts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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

  const [currentLocationMarker, setCurrentLocationMarker] = useState<any>(null);

  useEffect(() => {
    if (isPlaying) {
      if (simulationMode) {
        // Desktop Simulation Mode
        const timer = setInterval(() => {
          if (currentPathIndex < detailedRoute.length) {
            const nextPoint = detailedRoute[currentPathIndex];
            
            setCurrentLocationMarker(nextPoint);
            setCurrentPathIndex(prev => prev + 1);
            
            if (tripStartTime) {
              const mins = (new Date().getTime() - tripStartTime.getTime()) / 60000;
              setTimeSpent(mins);
            }

            const siteMatch = dynamicDestinations.find(loc => 
              getDistanceFromLatLonInKm(loc.lat, loc.lng, nextPoint.lat, nextPoint.lng) < 0.1
            );

            if (siteMatch && !visitedSites.includes(siteMatch.id)) {
              setIsPlaying(false);
              setArrivedSite(siteMatch);
              setIsNearDestination(true);
            }
          } else {
            setIsPlaying(false);
          }
        }, 50);
        return () => clearInterval(timer);
      } else {
        // Interval-based GPS Tracking (Ping every 5 minutes)
        // Send initial ping
        const pingLocation = () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                const newPoint = { lat: latitude, lng: longitude };
                setCurrentLocationMarker(newPoint);
                
                if (tripStartTime) {
                  const mins = (new Date().getTime() - tripStartTime.getTime()) / 60000;
                  setTimeSpent(mins);
                }

                // Check if near destination
                const siteMatch = dynamicDestinations.find(loc => 
                  getDistanceFromLatLonInKm(loc.lat, loc.lng, latitude, longitude) < 0.1
                );

                if (siteMatch && !visitedSites.includes(siteMatch.id)) {
                  setIsPlaying(false);
                  setArrivedSite(siteMatch);
                  setIsNearDestination(true);
                }

                // Sync the single point to backend silently
                if (trackingEntryId) {
                  fetch(`/api/ops/tracking-entries/${trackingEntryId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify({
                      currentLocation: `${latitude},${longitude}`,
                      status: "online",
                    })
                  }).catch(() => {});
                }
              },
              (error) => {
                console.error("Error getting position:", error);
              },
              { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
          }
        };

        pingLocation(); // initial ping
        const pingInterval = setInterval(pingLocation, 5 * 60 * 1000); // 5 minutes
        setWatchId(pingInterval as any);
      }
    } else {
      if (watchId !== null) {
        clearInterval(watchId as any);
        setWatchId(null);
      }
    }

    return () => {
      if (watchId !== null) clearInterval(watchId as any);
    };
  }, [isPlaying, simulationMode, tripStartTime, dynamicDestinations, visitedSites, currentPathIndex, detailedRoute, trackingEntryId]);

  // Sync to localStorage for Admin Mock & Backend
  useEffect(() => {
    const empId = sessionStorage.getItem('employeeId');
    if (empId) {
      localStorage.setItem(`tracking_${empId}_distance`, distance.toString());
      localStorage.setItem(`tracking_${empId}_time`, timeSpent.toString());
      
      let status = "Paused";
      if (isPlaying) status = "Traveling";
      else if (activeSite || isNearDestination) status = "On Site";
      
      localStorage.setItem(`tracking_${empId}_status`, status);
    }
  }, [distance, timeSpent, isPlaying, activeSite, isNearDestination]);

  const handleSiteCheckInCheckOut = () => {
    if (!checkInPhoto && modalType === "checkin") {
      toast.error("Please capture a site photo as proof before checking in.");
      return;
    }

    if (modalType === "checkin") {
       setCheckInModalOpen(false);
       setCheckInPhoto(null);
       setActiveSite(arrivedSite);
       setSiteCheckInTime(new Date());
       sendAlert(`${empName} has checked in at ${arrivedSite?.name || 'Site'}.`, 'medium');
       toast.success("Checked in successfully with photo proof!");
    } else if (modalType === "checkout") {
       setCheckInModalOpen(false);
       if (siteCheckInTime) {
         const minsSpent = (new Date().getTime() - siteCheckInTime.getTime()) / 60000;
         setTimeSpent(t => t + minsSpent);
       }
       setSiteCheckInTime(null);
       if (activeSite) setVisitedSites(prev => [...prev, activeSite.id]);
       setActiveSite(null);
       setArrivedSite(null);
       setIsNearDestination(false);
       setIsPlaying(true);
    }
  };

  const generateInterpolatedRoute = (waypoints: any[]) => {
    const route = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      
      const dist = getDistanceFromLatLonInKm(start.lat, start.lng, end.lat, end.lng);
      const steps = Math.max(Math.floor(dist / 0.05), 2);
      
      for (let j = 0; j < steps; j++) {
        const lat = start.lat + (end.lat - start.lat) * (j / steps);
        const lng = start.lng + (end.lng - start.lng) * (j / steps);
        route.push({ lat, lng });
      }
    }
    route.push(waypoints[waypoints.length - 1]);
    return route;
  };

  const geocodeAddress = async (address: string) => {
    try {
      // 1. Try Photon first (better for POI/buildings)
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lat=19.1136&lon=72.8697`);
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        return { lat: data.features[0].geometry.coordinates[1], lng: data.features[0].geometry.coordinates[0] };
      }
      
      // 2. Fallback to Nominatim
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=in`);
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        return { lat: parseFloat(nomData[0].lat), lng: parseFloat(nomData[0].lon) };
      }
    } catch (e) {
      console.error("Geocoding failed for", address, e);
    }
    
    // 3. Fallback to avoid breaking the app (Approximate Mumbai area)
    toast.warning(`Exact location for "${address}" not found, using approximate area.`);
    return {
      lat: 19.1136 + (Math.random() - 0.5) * 0.1,
      lng: 72.8697 + (Math.random() - 0.5) * 0.1
    };
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setStartLocationInput(data.display_name.split(',').slice(0, 3).join(', '));
            toast.success("Current location fetched!");
          }
        } catch(e) {
          setStartLocationInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setIsLocating(false);
      }, () => {
        toast.error("Failed to get location.");
        setIsLocating(false);
      });
    } else {
      setIsLocating(false);
    }
  };

  const handleCalculateRoute = async () => {
    if (!startLocationInput || clientVisits.some(v => !v.name)) {
      toast.error("Please fill in start location and all client visits");
      return;
    }
    if (!purposeInput.trim()) {
      toast.error("Please enter the purpose of the visit");
      return;
    }
    
    setIsGeocoding(true);
    const startCoords = await geocodeAddress(startLocationInput);
    if (!startCoords) {
      toast.error(`Could not find location: ${startLocationInput}`);
      setIsGeocoding(false);
      return;
    }
    
    const destinations = [];
    for (let i = 0; i < clientVisits.length; i++) {
      const coords = await geocodeAddress(clientVisits[i].name);
      if (!coords) {
         toast.error(`Could not find location: ${clientVisits[i].name}`);
         setIsGeocoding(false);
         return;
      }
      destinations.push({
         id: clientVisits[i].id,
         name: clientVisits[i].name,
         lat: coords.lat,
         lng: coords.lng
      });
    }
    
    // Calculate Summary Segments
    const summary = [];
    let currentPt = startCoords;
    let currentName = startLocationInput;
    let totalDist = 0;
    
    for (let i = 0; i < destinations.length; i++) {
      const dest = destinations[i];
      const dist = getDistanceFromLatLonInKm(currentPt.lat, currentPt.lng, dest.lat, dest.lng);
      totalDist += dist;
      
      // Try to get dynamic ETA if possible, else fallback
      let etaMins = (dist / 30) * 60;
      try {
        const etaRes = await fetch(`/api/predict-eta/?start_location=${encodeURIComponent(currentName)}&end_location=${encodeURIComponent(dest.name)}&distance_km=${dist}`);
        if (etaRes.ok) {
          const etaData = await etaRes.json();
          etaMins = etaData.eta_mins;
        }
      } catch(e) {}
      
      const vehicleRateBike = parseFloat(localStorage.getItem("vehicle_rate_bike") || "5");
      const vehicleRateCar = parseFloat(localStorage.getItem("vehicle_rate_car") || "12");
      const currentRate = vehicleType === "Car" ? vehicleRateCar : vehicleRateBike;
      
      const payoutCost = dist * currentRate;
      
      summary.push({
        startName: currentName,
        endName: dest.name,
        distance: dist,
        eta: etaMins,
        cost: payoutCost
      });
      
      currentPt = dest;
      currentName = dest.name;
    }
    
    setRouteSummary(summary);
    
    const allWaypoints = [startCoords, ...destinations];
    const newRoute = generateInterpolatedRoute(allWaypoints);
    setPlannedRouteData({ destinations, newRoute, totalDist });
    setIsGeocoding(false);
  };

  const handleConfirmAndStart = async () => {
    if (!plannedRouteData) return;
    const { destinations, newRoute, totalDist } = plannedRouteData;
    
    setDynamicDestinations(destinations);
    setDetailedRoute(newRoute);
    
    // Save Trip Info for Admin sync
    const tripInfo = {
      employeeId: sessionStorage.getItem('employeeId'),
      employeeName: empName,
      startLocation: startLocationInput,
      clientVisits: clientVisits.map(v => v.name),
      purpose: purposeInput,
      vehicleType: vehicleType,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_trip_info`, JSON.stringify(tripInfo));
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_route`, JSON.stringify(newRoute));
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_destinations`, JSON.stringify(destinations));
    
    setShowPreTripModal(false);
    setHasStartedTrip(true);
    
    // Set distance to planned total distance immediately
    setDistance(totalDist);
    
    const startTime = new Date();
    setTripStartTime(startTime);
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_start_time`, startTime.toISOString());
    
    // Create tracking entry in backend
    try {
      const res = await fetch(`/api/ops/tracking-entries/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          employeeId: sessionStorage.getItem('employeeId'),
          employeeName: empName,
          role: userRole,
          currentLocation: startLocationInput,
          checkInTime: new Date().toISOString(),
          status: "online",
          date: new Date().toISOString().split('T')[0],
          plannedRouteSummary: routeSummary, // Save the pre-calculated summary to the DB for Admin
          vehicleType: vehicleType,
          purpose: purposeInput,
          clientVisits: clientVisits.map(v => v.name)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTrackingEntryId(data.id);
        localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_entry_id`, data.id);
      }
    } catch(e) {
      console.error("Failed to create tracking entry", e);
    }
    
    toast.success("Route generated successfully! Tracking is active.");
  };

  const handleExpenseSubmit = async () => {
    if (!expenseAmount) {
      toast.error("Please enter the expense amount.");
      return;
    }
    
    try {
      const res = await fetch(`/api/ops/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: sessionStorage.getItem('employeeId'),
          employeeName: empName,
          type: expenseType,
          amount: parseFloat(expenseAmount),
          photo: expensePhoto,
          status: "pending"
        })
      });
      
      if (res.ok) {
        toast.success(`Expense of ₹${expenseAmount} for ${expenseType} sent to Admin for approval!`);
        setShowExpenseModal(false);
        setExpenseAmount("");
        setExpensePhoto(null);
      } else {
        toast.error("Failed to submit expense. Server returned an error.");
      }
    } catch (e) {
      console.error("Failed to submit expense:", e);
      toast.error("Network error. Failed to submit expense.");
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Compress large images to max 800px width/height
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Export heavily compressed WebP or JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setter(compressedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setCurrentPathIndex(0);
    setDistance(0);
    setTimeSpent(0);
    setIsPlaying(false);
    setVisitedSites([]);
    setActiveSite(null);
    setArrivedSite(null);
    setIsNearDestination(false);
    setCheckInModalOpen(false);
    setTripStartTime(null);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_start_time`);
    setSiteCheckInTime(null);
    setTrackingEntryId(null);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_entry_id`);
    setRouteSummary(null);
    setPlannedRouteData(null);
    setHasStartedTrip(false);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_trip_info`);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_route`);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_destinations`);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_distance`);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_time`);
  };

  const handleSimulate = async () => {
    if (!tripStartTime) {
      const startTime = new Date();
      setTripStartTime(startTime);
      localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_start_time`, startTime.toISOString());
    }
    setIsPlaying(!isPlaying);
  };

  const vehicleRateBike = parseFloat(localStorage.getItem("vehicle_rate_bike") || "5");
  const vehicleRateCar = parseFloat(localStorage.getItem("vehicle_rate_car") || "12");
  const currentRate = vehicleType === "Car" ? vehicleRateCar : vehicleRateBike;
  const reimbursement = (distance * currentRate).toFixed(2);

  const handleDepositEarnings = async () => {
    const employeeId = sessionStorage.getItem('employeeId');
    if (!employeeId) {
      alert("Please select or login as an employee first.");
      return;
    }
    
    let finalAmount = parseFloat(reimbursement) || 0;

    const penaltyThreshold = parseInt(localStorage.getItem("penalty_threshold") || "30", 10);
    const penaltyAmount = parseFloat(localStorage.getItem("penalty_amount") || "2"); // Default to Rs. 2 per min
    
    const endLoc = clientVisits.length > 0 ? clientVisits[clientVisits.length - 1].name : "Unknown Location";
    let etaMins = (distance / 30) * 60; // fallback

    try {
      const etaRes = await fetch(`/api/predict-eta/?start_location=${encodeURIComponent(startLocationInput)}&end_location=${encodeURIComponent(endLoc)}&distance_km=${distance}`);
      if (etaRes.ok) {
        const etaData = await etaRes.json();
        etaMins = etaData.eta_mins;
      }
    } catch(e) {
      console.error("Failed to fetch dynamic ETA", e);
    }
    
    const excessMins = timeSpent - etaMins;
    
    if (finalAmount > 0 && excessMins > penaltyThreshold) {
      const penaltyMinutes = excessMins - penaltyThreshold;
      const totalPenalty = penaltyMinutes * penaltyAmount;
      finalAmount = Math.max(0, finalAmount - totalPenalty);
      toast.error(`Timepass Penalty Applied! Expected ETA: ${etaMins.toFixed(0)} mins. Exceeded by ${excessMins.toFixed(0)} mins. Deducted ₹${totalPenalty.toFixed(2)}`);
    }

    const complianceScore = Math.max(0, Math.min(100, Math.round((etaMins / Math.max(timeSpent, 1)) * 100)));

    // Save trip to ML Engine (Route Analytics)
    try {
      await fetch(`/api/route-analytics/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_location: startLocationInput || "Unknown",
          end_location: endLoc,
          distance_km: distance,
          time_taken_mins: timeSpent
        })
      });
    } catch(e) {
      console.error("Failed to save route analytics", e);
    }

    try {
      if (finalAmount > 0) {
        const res = await fetch(`/api/ops/wallets/?employeeId=${employeeId}`, { headers: authHeaders });
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
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ employeeId: employeeId, balance: 0, totalEarned: 0, totalWithdrawn: 0 })
          });
          const newWallet = await createRes.json();
          walletId = newWallet.id;
        }
        if (walletId) {
          await fetch(`/api/ops/wallets/${walletId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              balance: parseFloat(currentBalance as any) + finalAmount,
              totalEarned: parseFloat(currentTotalEarned as any || 0) + finalAmount
            })
          });
        }
      }

      if (trackingEntryId) {
        await fetch(`/api/ops/tracking-entries/${trackingEntryId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            currentLocation: clientVisits.length > 0 ? clientVisits[clientVisits.length - 1].name : "Final Destination",
            checkOutTime: new Date().toISOString(),
            travelDistance: parseFloat(distance.toFixed(2)),
            planVsActual: complianceScore,
            reimbursementAmount: finalAmount,
            timeSpentOnSite: timeSpent,
            status: "completed",
          })
        });
        sendAlert(`${empName} has reached their final destination at ${clientVisits.length > 0 ? clientVisits[clientVisits.length - 1].name : "their final stop"}.`, 'high');
      }

      toast.success(finalAmount > 0 ? `₹${finalAmount.toFixed(2)} has been deposited to the wallet, and the trip log was finalized!` : `Trip log was finalized!`);
      reset();
    } catch(e) {
      console.error(e);
      alert('Failed to end trip.');
    }
  };

  const currentPath = detailedRoute.slice(0, currentPathIndex + 1);
  const currentLocation = currentPath[currentPathIndex];
  
  const nextDestination = dynamicDestinations.find(loc => !visitedSites.includes(loc.id) && loc.id !== activeSite?.id && loc.id !== arrivedSite?.id);
  let distanceToNext = 0;
  let etaToNext = 0;
  if (nextDestination && currentLocation) {
    distanceToNext = getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, nextDestination.lat, nextDestination.lng);
    etaToNext = (distanceToNext / 30) * 60;
  }

  const avatarUrl = `https://ui-avatars.com/api/?name=${empName}&background=0D8ABC&color=fff&size=128`;
  
  const customMarkerIcon = new L.DivIcon({
    className: 'custom-employee-marker',
    html: `<div class="w-12 h-12 rounded-full border-4 border-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] bg-primary flex items-center justify-center overflow-hidden transition-transform hover:scale-110">
             <img src="${avatarUrl}" alt="Employee" class="w-full h-full object-cover" />
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });

  return (
    <div className="relative w-full h-[600px] md:h-[700px] rounded-xl overflow-hidden shadow-xl border border-border">
      <MapContainer center={[19.1136, 72.8697]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {dynamicDestinations.map(loc => (
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
              <div className="font-semibold text-red-600">Client Visit</div>
              <div className="text-sm">{loc.name}</div>
            </Popup>
          </Marker>
        ))}

        <Polyline positions={detailedRoute.map(p => [p.lat, p.lng])} color="#3b82f6" weight={5} opacity={0.8} />
        
        {currentLocationMarker && (
          <Marker position={[currentLocationMarker.lat, currentLocationMarker.lng]} icon={customMarkerIcon}>
            <Popup>
              <div className="font-semibold">{empName}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>



      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-8 md:top-8 md:bottom-auto md:w-80 z-[10]">
        <Card className="glass-card shadow-2xl border border-white/20 backdrop-blur-md bg-white">
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Live Tracking
                <div className="flex items-center space-x-2 ml-4">
                  <Switch id="sim-mode" checked={simulationMode} onCheckedChange={setSimulationMode} disabled={isPlaying} />
                  <Label htmlFor="sim-mode" className="text-xs cursor-pointer text-muted-foreground">Demo Mode</Label>
                </div>
              </h3>
              <Badge variant={isPlaying ? "default" : "secondary"} className={isPlaying ? "animate-pulse bg-green-500 text-white" : ""}>
                {isPlaying ? "Tracking" : "Paused"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Navigation className="w-3 h-3" /> Distance
                </p>
                <p className="text-sm font-bold">{distance.toFixed(2)} km</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" /> Duration
                </p>
                <p className="text-sm font-bold">{Math.floor(timeSpent)} mins</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Banknote className="w-3 h-3 text-green-500" /> Est. Reimbursement (Per-Km Rate)
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₹{reimbursement}
              </p>
            </div>

            {hasStartedTrip && plannedRouteData && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Trip Details
                </p>
                <div className="text-xs text-slate-700 bg-blue-50 p-2 rounded border border-blue-100">
                  <span className="font-bold block mb-1">Purpose of Visit:</span>
                  {purposeInput || 'No purpose specified'}
                </div>
                
                {routeSummary && routeSummary.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {routeSummary.map((seg: any, i: number) => (
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
                
                {isNearDestination && !activeSite && !checkInModalOpen && (
                  <Button 
                    className="w-full mt-3 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setModalType("checkin");
                      setCheckInModalOpen(true);
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2 animate-pulse" />
                    Check-in at {arrivedSite?.name}
                  </Button>
                )}

                {activeSite && !checkInModalOpen && (
                  <Button 
                    variant="destructive"
                    className="w-full mt-3 shadow-sm"
                    onClick={() => {
                      setModalType("checkout");
                      setCheckInModalOpen(true);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Checkout from {activeSite?.name}
                  </Button>
                )}
              </div>
            )}

            {hasStartedTrip && (
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                <Button 
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                  onClick={handleDepositEarnings}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Deposit Reimbursement & End Route
                </Button>
                
              </div>
            )}
            
            {!hasStartedTrip && (
              <Button 
                className="w-full gradient-btn mt-2"
                onClick={() => setShowPreTripModal(true)}
              >
                Start New Route
              </Button>
            )}

            {/* Expenses panel is always visible */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-3 tracking-wider">Expenses & Reimbursements</p>
              <div className="flex gap-3">
                <Button 
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                  variant="outline"
                  onClick={() => setShowExpenseModal(true)}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Add Expense</span>
                </Button>
                <Button 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                  variant="outline"
                  onClick={() => setShowExpenseHistoryModal(true)}
                >
                  <History className="w-4 h-4" />
                  <span>My Expenses</span>
                </Button>
              </div>
            </div>

            {hasStartedTrip && (
              <Button 
                variant={isPlaying ? "destructive" : "default"}
                className={`w-full mt-2 ${isPlaying ? '' : 'bg-green-600 hover:bg-green-700'}`}
                onClick={handleSimulate}
              >
                {isPlaying ? (simulationMode ? "Pause Demo" : "Pause Tracking") : (simulationMode ? "Simulate Travel" : "Start Tracking")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPreTripModal && !hasStartedTrip} onOpenChange={setShowPreTripModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Start Travel Route
            </DialogTitle>
            <DialogDescription>
              Please provide details about your trip before starting the tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {!routeSummary ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Start Location</Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600" onClick={handleUseCurrentLocation} disabled={isLocating}>
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                      Use Current Location
                    </Button>
                  </div>
                  <LocationAutocomplete 
                    placeholder="e.g. Bandra West"
                    value={startLocationInput}
                    onChange={setStartLocationInput}
                  />
                </div>
                
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Client Visits</Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600" onClick={() => setClientVisits([...clientVisits, { id: clientVisits.length + 1, name: "" }])}>
                      <Plus className="w-3 h-3 mr-1" /> Add Visit
                    </Button>
                  </div>
                  {clientVisits.map((visit, index) => (
                    <div key={visit.id} className="flex items-center gap-2 mb-2">
                      <LocationAutocomplete 
                        placeholder={`Client Location ${index + 1}`}
                        value={visit.name}
                        onChange={(val) => {
                          const newVisits = [...clientVisits];
                          newVisits[index].name = val;
                          setClientVisits(newVisits);
                        }}
                      />
                      {clientVisits.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 flex-shrink-0" onClick={() => setClientVisits(clientVisits.filter((_, i) => i !== index))}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <Label>Purpose of Visit</Label>
                  <Textarea 
                    placeholder="e.g. Routine Inspection, Meeting with client..."
                    value={purposeInput}
                    onChange={(e) => setPurposeInput(e.target.value)}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <Label>Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bike">Bike</SelectItem>
                      <SelectItem value="Car">Car</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" /> Planned Route Summary
                  </h4>
                  <div className="space-y-3">
                    {routeSummary.map((seg, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-sm shadow-sm relative">
                        <div className="font-semibold text-slate-700 truncate pr-4">{seg.startName} <span className="text-muted-foreground mx-1">→</span> {seg.endName}</div>
                        <div className="flex gap-4 mt-2 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {seg.distance.toFixed(1)} km</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {seg.eta.toFixed(0)} min ETA</span>
                          <span className="flex items-center gap-1 text-green-600 font-medium"><Banknote className="w-3 h-3" /> ₹{seg.cost.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                    <span>Total Plan:</span>
                    <span className="text-blue-600">{plannedRouteData?.totalDist.toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {!routeSummary ? (
              <Button className="w-full gradient-btn" onClick={handleCalculateRoute} disabled={isGeocoding}>
                {isGeocoding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isGeocoding ? "Generating Route..." : "Calculate Route"}
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setRouteSummary(null)}>
                  Edit Plan
                </Button>
                <Button className="flex-1 gradient-btn" onClick={handleConfirmAndStart}>
                  Confirm & Start
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Add Travel Expense
            </DialogTitle>
            <DialogDescription>
              Submit an expense incurred during your travel today.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expense Type</Label>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food / Meals</SelectItem>
                  <SelectItem value="Fuel">Fuel / Travel</SelectItem>
                  <SelectItem value="Toll">Toll Tax</SelectItem>
                  <SelectItem value="Other">Other Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between items-center">
                <span>Upload Bill / Receipt</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Required</span>
              </Label>
              {!expensePhoto ? (
                <div className="relative mt-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    id="expense-camera"
                    className="hidden"
                    onChange={(e) => handleCameraCapture(e, setExpensePhoto)}
                  />
                  <Label 
                    htmlFor="expense-camera" 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                  >
                    <Camera className="w-8 h-8 text-primary mb-2" />
                    <span className="text-sm text-primary font-medium">Capture Bill</span>
                    <span className="text-xs text-muted-foreground mt-1">Live camera only</span>
                  </Label>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border h-32 group mt-1">
                  <img src={expensePhoto} alt="Bill Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Label htmlFor="expense-camera-retry" className="cursor-pointer text-white flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Retake
                    </Label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      id="expense-camera-retry"
                      className="hidden"
                      onChange={(e) => handleCameraCapture(e, setExpensePhoto)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button className="gradient-btn" onClick={handleExpenseSubmit}>
              Submit Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {checkInModalOpen && (
        <div className="absolute inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
          <Card className="w-full max-w-sm shadow-2xl border-white/20 glass-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                {modalType === "checkin" ? <MapPin className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                <h3 className="font-bold text-xl">
                  {modalType === "checkin" ? "Site Check-in" : "Site Check-out"}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                You have reached <strong>{activeSite?.name}</strong>. 
                Please {modalType === "checkin" ? "provide site proof to check in" : "confirm to check out"}.
              </p>

              {modalType === "checkin" && (
                <div className="space-y-3 mt-4 border-t border-border pt-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Live Site Proof Required
                  </p>
                  {!checkInPhoto ? (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        id="site-camera"
                        className="hidden"
                        onChange={(e) => handleCameraCapture(e, setCheckInPhoto)}
                      />
                      <Label 
                        htmlFor="site-camera" 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                      >
                        <Camera className="w-8 h-8 text-primary mb-2" />
                        <span className="text-sm text-primary font-medium">Tap to Open Camera</span>
                        <span className="text-xs text-muted-foreground mt-1">Live capture only</span>
                      </Label>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-border h-32 group">
                      <img src={checkInPhoto} alt="Site Proof" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Label htmlFor="site-camera-retry" className="cursor-pointer text-white flex items-center gap-2">
                          <Camera className="w-4 h-4" /> Retake
                        </Label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          id="site-camera-retry"
                          className="hidden"
                          onChange={(e) => handleCameraCapture(e, setCheckInPhoto)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full gradient-btn mt-4" onClick={handleSiteCheckInCheckOut}>
                {modalType === "checkin" ? "Confirm Check-in" : "Confirm Check-out"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showExpenseHistoryModal} onOpenChange={setShowExpenseHistoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              My Expenses
            </DialogTitle>
            <DialogDescription>
              View the status of your submitted travel expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto pr-2">
            {myExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                You haven't submitted any expenses yet.
              </div>
            ) : (
              [...myExpenses].reverse().map(exp => (
                <Card key={exp.id} className="overflow-hidden border-slate-200">
                  <div className="flex">
                    <div className="w-24 bg-slate-100 flex-shrink-0 cursor-pointer" onClick={() => window.open(exp.photo, "_blank")}>
                      <img src={exp.photo} alt="Bill" className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant="outline" className="mb-1">{exp.type}</Badge>
                          <p className="text-[10px] text-muted-foreground">{new Date(exp.timestamp).toLocaleString()}</p>
                        </div>
                        <Badge className={exp.status === "approved" ? "bg-green-100 text-green-800" : exp.status === "rejected" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}>
                          {exp.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-slate-800">₹{exp.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseHistoryModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
