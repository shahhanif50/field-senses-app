import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMasterData } from '@/contexts/MasterDataContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
import { Play, Pause, Navigation, Clock, Banknote, MapPin, CheckCircle2, User, Camera, Receipt, Plus, X, Loader2, History, ChevronLeft, SwitchCamera, FileText } from 'lucide-react';
import { SiteVisitReportFormModal, SiteVisitReportData } from '@/components/modals/SiteVisitReportFormModal';
import { format } from "date-fns";
import { useTransparentLogo } from "@/hooks/useTransparentLogo";
import { Meeting } from "@/data/sharedTypes";

// Fix for default marker icons in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RATE_PER_KM = 5; // ₹5 per km
import { ChevronDown, Calendar, Briefcase } from "lucide-react";

function MapResizer({ isFullScreen }: { isFullScreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map, isFullScreen]);
  return null;
}

function LocationAutocomplete({ value, onChange, placeholder, meetings = [] }: { value: string, onChange: (val: string, meetingObj?: any, coords?: any) => void, placeholder: string, meetings?: any[] }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    let meetingSuggestions = [];
    if (meetings && meetings.length > 0) {
      meetingSuggestions = meetings.map(m => ({
        display_name: m.title || `Meeting with ${m.clientName || 'Client'}`,
        isMeeting: true,
        time: m.startTime,
        meetingObj: m
      })).filter(m => !value || m.display_name.toLowerCase().includes(value.toLowerCase()));
    }

    if (!value || value.length < 3) {
      setSuggestions(meetingSuggestions);
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
          setSuggestions([...meetingSuggestions, ...unique]);
        } else {
          setSuggestions(meetingSuggestions);
        }
      } catch (e) {
        console.error(e);
        setSuggestions(meetingSuggestions);
      }
    }, 500); // debounce 500ms
    return () => clearTimeout(timer);
  }, [value, showDropdown, meetings]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input 
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onClick={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onFocus={() => setShowDropdown(true)}
          className="pr-8"
        />
        <button 
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl z-[2000] max-h-72 overflow-y-auto overflow-x-hidden p-1">
          {suggestions.filter(s => s.isMeeting).length > 0 && (
            <div className="mb-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Scheduled Meetings
              </div>
              {suggestions.filter(s => s.isMeeting).map((s, i) => (
                <div 
                  key={`meeting-${i}`} 
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between group"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent onBlur from firing before this
                    onChange(s.display_name.split(',')[0], s.meetingObj, null);
                    setShowDropdown(false);
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="font-semibold text-slate-700 group-hover:text-blue-700 flex items-center gap-2 transition-colors">
                      {s.display_name.split(',')[0]}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{s.display_name}</div>
                  </div>
                  {s.time && <div className="text-[10px] font-medium bg-white border border-blue-100 shadow-sm text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap">{s.time}</div>}
                </div>
              ))}
            </div>
          )}
          
          {suggestions.filter(s => !s.isMeeting).length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mt-1 border-t border-slate-100 pt-2">
                <MapPin className="w-3 h-3" /> Locations
              </div>
              {suggestions.filter(s => !s.isMeeting).map((s, i) => (
                <div 
                  key={`location-${i}`} 
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent onBlur from firing before this
                    onChange(s.display_name.split(',')[0], null, { lat: s.lat, lng: s.lon });
                    setShowDropdown(false);
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="font-medium text-slate-700 flex items-center gap-2">
                      {s.display_name.split(',')[0]}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{s.display_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveTrackingMap() {
  const { meetings, setMeetings, attendanceEntries, employees, trackingEntries } = useMasterData();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("none");
  const lastDistanceRef = useRef<number | null>(null);

  const empId = sessionStorage.getItem('employeeId') || sessionStorage.getItem('userId');
  const currentDateStr = new Date().toISOString().split('T')[0];
  const userMeetings = meetings.filter((m: any) => {
    const isOrganizer = m.organizerId === empId;
    const isAttendee = m.attendees?.some((a: any) => a.id === empId) || m.participants?.includes(empId);
    // For demo/testing with mock data, we relax the date check to just show their meetings.
    const hasRole = isOrganizer || isAttendee || empId === "1" || !empId;
    const status = (m.status || '').toLowerCase();
    return hasRole && (status === 'scheduled' || status === 'pending');
  }).sort((a: any, b: any) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    const dateCompare = new Date(b.date || '1970-01-01').getTime() - new Date(a.date || '1970-01-01').getTime();
    if (dateCompare !== 0) return dateCompare;
    
    const timeA = a.startTime || '00:00';
    const timeB = b.startTime || '00:00';
    return timeB.localeCompare(timeA);
  });

  const [detailedRoute, setDetailedRoute] = useState<any[]>([]);
  const getSaved = (key: string, def: any) => {
    try {
      const v = localStorage.getItem(`tracking_${sessionStorage.getItem('employeeId')}_${key}`);
      return v !== null ? JSON.parse(v) : def;
    } catch { return def; }
  };

  const [currentPathIndex, setCurrentPathIndex] = useState(() => getSaved('currentPathIndex', 0));
  const [isPlaying, setIsPlaying] = useState(() => getSaved('isPlaying', false));
  const [simulationMode, setSimulationMode] = useState(() => getSaved('simulationMode', false));
  const [distance, setDistance] = useState(() => getSaved('distance', 0)); // km
  const [timeSpent, setTimeSpent] = useState(() => getSaved('timeSpent', 0)); // minutes

  // Site Check-in States (OTP removed)
  const [visitedSites, setVisitedSites] = useState<number[]>(() => getSaved('visitedSites', []));
  const [activeSite, setActiveSite] = useState<any>(() => getSaved('activeSite', null));
  const [isNearDestination, setIsNearDestination] = useState(() => getSaved('isNearDestination', false));
  const [arrivedSite, setArrivedSite] = useState<any>(() => getSaved('arrivedSite', null));
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"checkin" | "checkout">("checkin");
  const [checkInPhoto, setCheckInPhoto] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  // Dynamic Route States
  const [hasStartedTrip, setHasStartedTrip] = useState(() => {
    return localStorage.getItem(`tracking_${sessionStorage.getItem('employeeId')}_trip_info`) !== null;
  });
  const [showPreTripModal, setShowPreTripModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [endTripNextAction, setEndTripNextAction] = useState<"endMeter" | "endMeterForStartMeeting">("endMeter");
  const [showAdhocModal, setShowAdhocModal] = useState(false);
  const [adhocTitle, setAdhocTitle] = useState("");
  const [adhocDestination, setAdhocDestination] = useState("");
  const [startLocationInput, setStartLocationInput] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpenseHistoryModal, setShowExpenseHistoryModal] = useState(false);
  const [clientVisits, setClientVisits] = useState<any[]>([{ id: 1, name: "", lat: undefined, lng: undefined, meetingId: undefined }]);
  const [dynamicDestinations, setDynamicDestinations] = useState<any[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [purposeInput, setPurposeInput] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [meterPhoto, setMeterPhoto] = useState<string | null>(null);
  const [startMeterReading, setStartMeterReading] = useState<string>("");
  const [endMeterReading, setEndMeterReading] = useState<string>("");

  // Camera State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureType, setCaptureType] = useState<"startMeter" | "siteCheckIn" | "expense" | "startMeeting" | "endMeeting" | "endMeter" | "endMeterForStartMeeting">("startMeter");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>("Locating...");
  const [currentLocationLat, setCurrentLocationLat] = useState<number | null>(null);
  const [currentLocationLng, setCurrentLocationLng] = useState<number | null>(null);
  const [pendingMeterPhoto, setPendingMeterPhoto] = useState<string | null>(null);
  const [pendingMeterLocation, setPendingMeterLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const logoSrc = useTransparentLogo();
  
  const inProgressMeeting = meetings.find(m => m.organizerId === empId && m.status === 'in-progress');
  const activeTripMeetingId = clientVisits[0]?.meetingId || arrivedSite?.meetingId || inProgressMeeting?.id;
  let activeTripMeeting = activeTripMeetingId ? meetings.find(m => String(m.id) === String(activeTripMeetingId)) : undefined;
  if (!activeTripMeeting && hasStartedTrip && clientVisits.length > 0) {
    activeTripMeeting = {
        id: "adhoc_active_trip",
        title: purposeInput || clientVisits[0].name || "Ad-hoc Visit",
        status: "scheduled",
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        organizerId: empId
    } as any;
  }
  const destinationMeeting = arrivedSite?.meetingId ? meetings.find(m => String(m.id) === String(arrivedSite.meetingId)) : undefined;
  const isMeetingCompleted = destinationMeeting?.status === 'completed' || activeTripMeeting?.status === 'completed';
  const isFullScreenTrip = hasStartedTrip && !isMeetingCompleted;

  const startCamera = async (mode?: "user" | "environment") => {
    try {
      const activeMode = mode || facingMode;
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: activeMode } } });
      setStream(mediaStream);
      setFacingMode(activeMode);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Could not access camera.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const openCamera = (type: "startMeter" | "siteCheckIn" | "expense" | "startMeeting" | "endMeeting" | "endMeter" | "endMeterForStartMeeting") => {
    setCaptureType(type);
    setIsCaptureModalOpen(true);
    setTimeout(startCamera, 100);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        setCurrentLocationLat(pos.coords.latitude);
        setCurrentLocationLng(pos.coords.longitude);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          if (res.ok) {
            const geoData = await res.json();
            setCurrentLocationName(geoData.display_name || "Unknown Location");
          }
        } catch (e) {
          setCurrentLocationName(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        }
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video.videoWidth || !video.videoHeight) {
        toast.error("Camera is still initializing, please wait.");
        return;
      }

      const containerWidth = video.clientWidth > 100 ? video.clientWidth : (window.innerWidth > 0 ? window.innerWidth : 375);
      const containerHeight = video.clientHeight > 100 ? video.clientHeight : (window.innerHeight > 0 ? window.innerHeight : 812);
      const dpr = window.devicePixelRatio || 2;

      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;

      const targetRatio = containerWidth / containerHeight;
      const videoRatio = video.videoWidth / video.videoHeight;

      let sWidth = video.videoWidth;
      let sHeight = video.videoHeight;
      let sx = 0;
      let sy = 0;

      if (videoRatio > targetRatio) {
        sWidth = video.videoHeight * targetRatio;
        sx = (video.videoWidth - sWidth) / 2;
      } else {
        sHeight = video.videoWidth / targetRatio;
        sy = (video.videoHeight - sHeight) / 2;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const scale = dpr;
        const leftX = 16 * scale;

        const now = new Date();
        const timeStr = format(now, "hh:mm a");
        const dateStr = format(now, "EEE, MMM dd, yyyy");
        const locationStr = currentLocationName || "Unknown Location";
        const type = captureType === "startMeter" ? "VEHICLE START METER" : (captureType === "siteCheckIn" ? "SITE CHECK-IN" : captureType === "startMeeting" ? "MEETING START" : captureType === "endMeeting" ? "MEETING END" : captureType === "endMeter" || captureType === "endMeterForStartMeeting" ? "VEHICLE END METER" : "EXPENSE BILL");

        let currentY = canvas.height - (224 * scale) - (64 * scale);

        ctx.font = `bold ${11 * scale}px 'Inter', sans-serif`;
        const typeWidth = ctx.measureText(type).width;
        ctx.font = `600 ${14 * scale}px 'Inter', sans-serif`;
        const timeWidth = ctx.measureText(timeStr).width;

        const badgeWidth = typeWidth + timeWidth + (38 * scale);
        const badgeHeight = 26 * scale;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(leftX, currentY, badgeWidth, badgeHeight, 8 * scale);
        else ctx.rect(leftX, currentY, badgeWidth, badgeHeight);
        ctx.fill();

        ctx.fillStyle = '#2563eb';
        const pillWidth = typeWidth + (16 * scale);
        const pillHeight = 18 * scale;
        const pillX = leftX + (6 * scale);
        const pillY = currentY + (4 * scale);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 4 * scale);
        else ctx.rect(pillX, pillY, pillWidth, pillHeight);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${11 * scale}px 'Inter', sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(type, pillX + pillWidth / 2, pillY + pillHeight / 2 + (1 * scale));

        ctx.textAlign = 'left';
        ctx.font = `600 ${14 * scale}px 'Inter', sans-serif`;
        ctx.fillText(timeStr, pillX + pillWidth + (8 * scale), currentY + badgeHeight / 2 + (1 * scale));

        currentY += badgeHeight + (12 * scale);

        ctx.fillStyle = '#2563eb';
        const lineHeight = 36 * scale;
        ctx.fillRect(leftX, currentY, 3 * scale, lineHeight);

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4 * scale;
        ctx.shadowOffsetX = 1 * scale;
        ctx.shadowOffsetY = 1 * scale;

        ctx.fillStyle = '#ffffff';
        ctx.font = `500 ${15 * scale}px 'Inter', sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(dateStr, leftX + (12 * scale), currentY);

        ctx.font = `400 ${13 * scale}px 'Inter', sans-serif`;
        const maxLocLength = 50;
        const shortLoc = locationStr.length > maxLocLength ? locationStr.substring(0, maxLocLength) + '...' : locationStr;
        ctx.fillText(shortLoc, leftX + (12 * scale), currentY + (20 * scale));

        import('@/lib/watermark').then(({ addWatermarkToCanvas }) => {
          addWatermarkToCanvas(ctx, canvas.width, canvas.height).then(() => {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            if (captureType === "startMeter") {
              setMeterPhoto(dataUrl);
            }
            else if (captureType === "endMeterForStartMeeting" && activeMeetingId) {
              setPendingMeterPhoto(dataUrl);
              setPendingMeterLocation({ lat: currentLocationLat || 0, lng: currentLocationLng || 0, name: currentLocationName });
              setIsCaptureModalOpen(false);
              return;
            }
            else if (captureType === "siteCheckIn") setCheckInPhoto(dataUrl);
            else if (captureType === "expense") setExpensePhoto(dataUrl);
            else if (captureType === "endMeter" && activeMeetingId) {
              setPendingMeterPhoto(dataUrl);
              setCaptureType("endMeeting");
              return;
            }
            else if (captureType === "startMeeting" && activeMeetingId) {
              const processStartMeeting = async () => {
                const now = new Date().toISOString();
                
                if (String(activeMeetingId).startsWith("adhoc")) {
                   toast.success("Meeting started successfully!");
                   setMeetings(prev => {
                     const exists = prev.find(m => String(m.id) === String(activeMeetingId));
                     if (exists) {
                       return prev.map(m => String(m.id) === String(activeMeetingId) ? { ...m, status: 'in-progress' } : m);
                     }
                     return [...prev, { id: activeMeetingId, status: 'in-progress', title: activeTripMeeting?.title || "Ad-hoc Visit", organizerId: empId, date: now.split('T')[0] } as Meeting];
                   });
                   window.dispatchEvent(new CustomEvent('meetingUpdated'));
                   setIsCaptureModalOpen(false);
                   return;
                }
                
                let calcDist = 0;
                const empId = sessionStorage.getItem('employeeId');
                let startLat = 0, startLng = 0, startName = "", startPhotoStr = null, startMeterTimestamp = null;
                
                if (empId) {
                  const infoStr = localStorage.getItem(`tracking_${empId}_trip_info`);
                  if (infoStr) {
                     const info = JSON.parse(infoStr);
                     if (info.meterPhoto) {
                       startPhotoStr = info.meterPhoto;
                     }
                     if (info.timestamp) {
                       startMeterTimestamp = info.timestamp;
                     }
                     
                     // Use last known meter location or the original start meter location
                     const refLat = info.lastMeterLocationLat || info.startMeterLocationLat;
                     const refLng = info.lastMeterLocationLng || info.startMeterLocationLng;
                     
                     if (refLat && refLng && pendingMeterLocation?.lat && pendingMeterLocation?.lng) {
                       calcDist = await getRoadDistanceKms(refLat, refLng, pendingMeterLocation.lat, pendingMeterLocation.lng);
                     }
                     
                     if (info.startMeterLocationLat && info.startMeterLocationLng) {
                       startLat = info.startMeterLocationLat;
                       startLng = info.startMeterLocationLng;
                       startName = info.startMeterLocationName;
                     }
                     
                     // Update total accumulated distance with this segment
                     setDistance(prevDist => {
                       const newTotal = prevDist + calcDist;
                       localStorage.setItem(`tracking_${empId}_distance`, newTotal.toString());
                       return newTotal;
                     });
                     
                     // Update last meter location for the next segment
                     info.lastMeterLocationLat = pendingMeterLocation?.lat;
                     info.lastMeterLocationLng = pendingMeterLocation?.lng;
                     localStorage.setItem(`tracking_${empId}_trip_info`, JSON.stringify(info));
                  }
                }
  
                const patchData: any = { 
                  status: "in-progress", 
                  actualStartTime: now, 
                  startPhoto: dataUrl, 
                  startMeterPhoto: startPhotoStr,
                  startMeterLocationLat: startLat || null,
                  startMeterLocationLng: startLng || null,
                  startMeterLocationName: startName || null,
                  endMeterLocationLat: pendingMeterLocation?.lat || null,
                  endMeterLocationLng: pendingMeterLocation?.lng || null,
                  endMeterLocationName: pendingMeterLocation?.name || null,
                  startMeterTime: startMeterTimestamp,
                  endMeterTime: now,
                  calculatedDistanceKms: calcDist
                };
                if (pendingMeterPhoto) {
                  patchData.endMeterPhoto = pendingMeterPhoto;
                }
                
                fetch(`/api/ops/meetings/${activeMeetingId}/`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(patchData),
                }).then(res => {
                  if (res.ok) {
                    toast.success(`Meeting started! (+${calcDist.toFixed(1)} km)`);
                    setMeetings(prev => prev.map(m => String(m.id) === String(activeMeetingId) ? { ...m, status: 'in-progress' } : m));
                    window.dispatchEvent(new CustomEvent('meetingUpdated'));
                  } else {
                    toast.error("Failed to start meeting.");
                  }
                }).catch(() => toast.error("Network error."));
                
                setActiveMeetingId(null);
                setPendingMeterPhoto(null);
                setPendingMeterLocation(null);
                setIsCaptureModalOpen(false);
              };
              processStartMeeting();
            }
            else if (captureType === "endMeeting" && activeMeetingId) {
              const now = new Date().toISOString();
              
              if (String(activeMeetingId).startsWith("adhoc")) {
                 toast.success("Meeting ended successfully!");
                 setMeetings(prev => prev.map(m => String(m.id) === String(activeMeetingId) ? { ...m, status: 'completed' } : m));
                 window.dispatchEvent(new CustomEvent('meetingUpdated'));
                 setIsCaptureModalOpen(false);
                 return;
              }
              
              const calcDist = (Number(endMeterReading) - Number(startMeterReading)) || 0;
              const patchData: any = { 
                status: "completed", 
                actualEndTime: now, 
                endPhoto: dataUrl, 
                startMeterReading: startMeterReading,
                endMeterReading: endMeterReading,
                calculatedDistanceKms: calcDist,
                vehicleType: vehicleType
              };
              if (pendingMeterPhoto) {
                patchData.endMeterPhoto = pendingMeterPhoto;
              }
              
              fetch(`/api/ops/meetings/${activeMeetingId}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patchData),
              }).then(res => {
                if (res.ok) {
                  toast.success("Meeting ended successfully!");
                  setMeetings(prev => prev.map(m => String(m.id) === String(activeMeetingId) ? { ...m, status: 'completed' } : m));
                  window.dispatchEvent(new CustomEvent('meetingUpdated'));
                  
                  localStorage.setItem('pendingMomMeetingId', activeMeetingId);
                  window.dispatchEvent(new CustomEvent('changeTab', { detail: 'meetings' }));
                } else {
                  toast.error("Failed to end meeting.");
                }
              }).catch(() => toast.error("Network error."));
              
              setActiveMeetingId(null);
              
              setActiveMeetingId(null);
              setPendingMeterPhoto(null);
            }
            
            stopCamera();
            setIsCaptureModalOpen(false);
          });
        });
      }
    }
  };

  // Expense States
  const [expenseType, setExpenseType] = useState("Food");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePhoto, setExpensePhoto] = useState<string | null>(null);
  const [myExpenses, setMyExpenses] = useState<any[]>([]);

  // Route Planning State
  const [routeSummary, setRouteSummary] = useState<any[] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [plannedRouteData, setPlannedRouteData] = useState<any>(null);

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const localToday = getLocalDate();

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

    const savedTripInfoStr = localStorage.getItem(`tracking_${empId}_trip_info`);
    if (savedTripInfoStr) {
      try {
        const info = JSON.parse(savedTripInfoStr);
        if (info.vehicleType) setVehicleType(info.vehicleType);
        if (info.startMeterReading) setStartMeterReading(info.startMeterReading);
        if (info.purpose) setPurposeInput(info.purpose);
        if (info.startLocation) setStartLocationInput(info.startLocation);
        
        const savedVisits = localStorage.getItem(`tracking_${empId}_client_visits`);
        if (savedVisits) setClientVisits(JSON.parse(savedVisits));
        
        const savedSummary = localStorage.getItem(`tracking_${empId}_route_summary`);
        if (savedSummary) setRouteSummary(JSON.parse(savedSummary));

        const savedPlanned = localStorage.getItem(`tracking_${empId}_planned_data`);
        if (savedPlanned) {
          const parsed = JSON.parse(savedPlanned);
          setPlannedRouteData(parsed);
          
          if (parsed.newRoute && parsed.newRoute.length > 0) {
            setDetailedRoute(parsed.newRoute);
          }
        }
        
      } catch(e) {
        console.error("Error restoring tracking state:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (hasStartedTrip) {
      const empId = sessionStorage.getItem('employeeId');
      if (!empId) return;
      const savedTripInfoStr = localStorage.getItem(`tracking_${empId}_trip_info`);
      if (savedTripInfoStr) {
        try {
          const info = JSON.parse(savedTripInfoStr);
          if (info.meetingId) {
            const meeting = meetings.find((m: any) => String(m.id) === String(info.meetingId));
            if (!meeting || meeting.status === 'cancelled') {
              toast.error("The scheduled meeting for this trip has been cancelled. Resetting travel route.");
              
              setIsPlaying(false);
              setSimulationMode(false);
              
              setHasStartedTrip(false);
              setRouteSummary(null);
              setPlannedRouteData(null);
              setDetailedRoute([]);
              setCurrentPathIndex(0);
              setClientVisits([{ id: 1, name: "", lat: undefined, lng: undefined, meetingId: undefined }]);
              setDistance(0);
              setTimeSpent(0);
              setTripStartTime(null);
              setTrackingEntryId(null);
              setMeterPhoto(null);
              
              localStorage.removeItem(`tracking_${empId}_trip_info`);
              localStorage.removeItem(`tracking_${empId}_route`);
              localStorage.removeItem(`tracking_${empId}_destinations`);
              localStorage.removeItem(`tracking_${empId}_client_visits`);
              localStorage.removeItem(`tracking_${empId}_route_summary`);
              localStorage.removeItem(`tracking_${empId}_planned_data`);
              localStorage.removeItem(`tracking_${empId}_distance`);
              localStorage.removeItem(`tracking_${empId}_time`);
              localStorage.removeItem(`tracking_${empId}_start_time`);
              localStorage.removeItem(`tracking_${empId}_currentPathIndex`);
              localStorage.removeItem(`tracking_${empId}_isPlaying`);
              localStorage.removeItem(`tracking_${empId}_simulationMode`);
              localStorage.removeItem(`tracking_${empId}_visitedSites`);
              localStorage.removeItem(`tracking_${empId}_activeSite`);
              localStorage.removeItem(`tracking_${empId}_isNearDestination`);
              localStorage.removeItem(`tracking_${empId}_arrivedSite`);
              localStorage.removeItem(`tracking_${empId}_status`);
              
              setIsNearDestination(false);
              setArrivedSite(null);
              setVisitedSites([]);
              setActiveSite(null);
              setActiveMeetingId(null);
              localStorage.removeItem(`tracking_${empId}_entry_id`);
            }
          }
        } catch(e) {}
      }
    }
  }, [meetings, hasStartedTrip]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`/api/ops/vehicles/`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(Array.isArray(data) ? data : (data.results || []));
        }
      } catch (e) {
        console.error("Failed to fetch vehicles", e);
      }
    };
    fetchVehicles();
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

  const getRoadDistanceKms = async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].distance / 1000;
      }
    } catch (e) {
      console.error("OSRM error:", e);
    }
    return getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
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

  // Dedicated timer for updating duration continuously
  useEffect(() => {
    let timer: any;
    if (tripStartTime && !isMeetingCompleted) {
      // Run once immediately to fix initial 0 mins bug if enough time has passed
      const initialMins = (new Date().getTime() - tripStartTime.getTime()) / 60000;
      setTimeSpent(initialMins);
      
      timer = setInterval(() => {
        const mins = (new Date().getTime() - tripStartTime.getTime()) / 60000;
        setTimeSpent(mins);
      }, 30000); // update every 30 seconds
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tripStartTime, isMeetingCompleted]);

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

            // Route Deviation Check (Simulation)
            if (dynamicDestinations.length > 0) {
              const mainDest = dynamicDestinations[0];
              const currentDist = getDistanceFromLatLonInKm(mainDest.lat, mainDest.lng, nextPoint.lat, nextPoint.lng);
              if (lastDistanceRef.current !== null) {
                if (currentDist > lastDistanceRef.current + 0.5) {
                  sendAlert(`Route Deviation Detected! Employee is moving away from destination.`, 'high');
                  lastDistanceRef.current = currentDist;
                } else if (currentDist < lastDistanceRef.current) {
                  lastDistanceRef.current = currentDist;
                }
              } else {
                lastDistanceRef.current = currentDist;
              }
            }

            const siteMatch = dynamicDestinations.find(loc => 
              getDistanceFromLatLonInKm(loc.lat, loc.lng, nextPoint.lat, nextPoint.lng) < 0.1
            );

            if (siteMatch && !visitedSites.includes(siteMatch.id)) {
              setIsPlaying(false);
              setArrivedSite(siteMatch);
              setIsNearDestination(true);
            }
            
            // Sync to backend every 20 ticks (1 second of simulation)
            if (trackingEntryId && currentPathIndex % 20 === 0) {
              fetch(`/api/ops/tracking-entries/${trackingEntryId}/sync-route/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                  routePath: [[nextPoint.lat, nextPoint.lng]]
                })
              }).catch(() => {});
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

                // Route Deviation Check (GPS)
                if (dynamicDestinations.length > 0) {
                  const mainDest = dynamicDestinations[0];
                  const currentDist = getDistanceFromLatLonInKm(mainDest.lat, mainDest.lng, latitude, longitude);
                  if (lastDistanceRef.current !== null) {
                    if (currentDist > lastDistanceRef.current + 0.5) {
                      sendAlert(`Route Deviation Detected! Employee is moving away from destination.`, 'high');
                      lastDistanceRef.current = currentDist;
                    } else if (currentDist < lastDistanceRef.current) {
                      lastDistanceRef.current = currentDist;
                    }
                  } else {
                    lastDistanceRef.current = currentDist;
                  }
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
                  
                  fetch(`/api/ops/tracking-entries/${trackingEntryId}/sync-route/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify({
                      routePath: [[latitude, longitude]]
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
      localStorage.setItem(`tracking_${empId}_time`, JSON.stringify(timeSpent));
      localStorage.setItem(`tracking_${empId}_distance`, JSON.stringify(distance));
      localStorage.setItem(`tracking_${empId}_currentPathIndex`, JSON.stringify(currentPathIndex));
      localStorage.setItem(`tracking_${empId}_isPlaying`, JSON.stringify(isPlaying));
      localStorage.setItem(`tracking_${empId}_simulationMode`, JSON.stringify(simulationMode));
      localStorage.setItem(`tracking_${empId}_visitedSites`, JSON.stringify(visitedSites));
      localStorage.setItem(`tracking_${empId}_activeSite`, JSON.stringify(activeSite));
      localStorage.setItem(`tracking_${empId}_isNearDestination`, JSON.stringify(isNearDestination));
      localStorage.setItem(`tracking_${empId}_arrivedSite`, JSON.stringify(arrivedSite));
      
      let status = "Paused";
      if (isPlaying) status = "Traveling";
      else if (activeSite || isNearDestination) status = "On Site";
      
      localStorage.setItem(`tracking_${empId}_status`, status);
    }
  }, [distance, timeSpent, isPlaying, activeSite, isNearDestination, currentPathIndex, simulationMode, visitedSites, arrivedSite]);

  const handleSiteCheckInCheckOut = async () => {
    if (modalType === "checkin") {
       try {
         const authHeaders = {
            'X-User-Id': sessionStorage.getItem("userId") || "",
            'X-User-Role': (sessionStorage.getItem("userRole") || "").toUpperCase(),
            'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
         };
         
         const taskRes = await fetch(`/api/ops/employee-tasks/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              employeeId: sessionStorage.getItem('employeeId'),
              taskTitle: arrivedSite?.name || "Site Visit",
              taskType: 'Visit',
              status: 'in-progress',
              proofUploaded: false,
              deadline: new Date().toISOString().split('T')[0],
              assignedDate: new Date().toISOString().split('T')[0],
              assignedBy: sessionStorage.getItem('employeeId') || "self",
              startTime: new Date().toTimeString().split(' ')[0],
              location: arrivedSite?.name,
              latitude: arrivedSite?.lat,
              longitude: arrivedSite?.lng,
              description: "Checked in via Live Tracking"
            })
         });
         const data = await taskRes.json();
         if (data.id) setCurrentTaskId(data.id);
       } catch (e) {
         console.error("Failed to create visit task", e);
       }

       setCheckInModalOpen(false);
       setCheckInPhoto(null);
       setActiveSite(arrivedSite);
       setSiteCheckInTime(new Date());
       sendAlert(`${empName} has checked in at ${arrivedSite?.name || 'Site'}.`, 'medium');
       toast.success("Checked in successfully!");
    } else if (modalType === "checkout") {
       setCheckInModalOpen(false);
       setShowReportModal(true);
    }
  };

  const handleCheckoutReportSubmit = async (formData: SiteVisitReportData, photoBase64: string | null) => {
    try {
      if (currentTaskId) {
        const authHeaders = {
           'X-User-Id': sessionStorage.getItem("userId") || "",
           'X-User-Role': (sessionStorage.getItem("userRole") || "").toUpperCase(),
           'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
        };
        
        await fetch(`/api/ops/employee-tasks/${currentTaskId}/`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json', ...authHeaders },
           body: JSON.stringify({
             status: 'completed',
             endTime: new Date().toTimeString().split(' ')[0],
             notes: JSON.stringify(formData),
             proofUrl: photoBase64 || undefined,
             distance: formData.distance,
             fuelExpense: formData.fuelCost,
             foodExpense: formData.foodCost
           })
        });
      }
    } catch (e) {
      console.error("Failed to update visit task", e);
    }

    setShowReportModal(false);
    setCurrentTaskId(null);

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
    toast.success("Checked out successfully with report!");
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

  useEffect(() => {
    if (showPreTripModal && !startLocationInput && !hasStartedTrip) {
      handleUseCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreTripModal]);

  const handleCalculateRoute = async () => {
    let startCoords: { lat: number; lng: number } | null = null;
    
    if (selectedMeetingId !== "none" && !startLocationInput) {
       const meeting = meetings.find(x => x.id === selectedMeetingId);
       let foundCoords = false;
       
       if (meeting) {
         const dayMeetings = meetings
           .filter(m => m.date === meeting.date && m.organizerId === meeting.organizerId)
           .sort((a, b) => new Date(a.startTime || a.actualStartTime || "").getTime() - new Date(b.startTime || b.actualStartTime || "").getTime());
         
         const idx = dayMeetings.findIndex(m => m.id === meeting.id);
         
         if (idx === 0) {
           const currentEmp = employees.find(e => e.id === meeting.organizerId);
           let att = attendanceEntries.find(a => (a.employeeCode === meeting.organizerId || (a as any).employeeId === meeting.organizerId || (currentEmp && a.employeeName === currentEmp.fullName)) && a.date === meeting.date);
           if (!att) {
             att = attendanceEntries.find(a => (a.employeeCode === meeting.organizerId || (a as any).employeeId === meeting.organizerId || (currentEmp && a.employeeName === currentEmp.fullName)) && a.date === localToday);
           }
           let checkInLat = att?.checkInLocationLat;
           let checkInLng = att?.checkInLocationLng;
           
           if (!checkInLat || !checkInLng) {
             let trk = trackingEntries.find(t => (t.employeeId === meeting.organizerId || (currentEmp && t.employeeName === currentEmp.fullName)) && t.checkInTime.startsWith(meeting.date));
             if (!trk) {
               trk = trackingEntries.find(t => (t.employeeId === meeting.organizerId || (currentEmp && t.employeeName === currentEmp.fullName)) && t.checkInTime.startsWith(localToday));
             }
             if (trk?.currentLocation && typeof trk.currentLocation === 'string' && trk.currentLocation.includes(',')) {
               const parts = trk.currentLocation.split(',');
               checkInLat = parseFloat(parts[0].trim());
               checkInLng = parseFloat(parts[1].trim());
             }
           }
           
           if (checkInLat && checkInLng) {
             startCoords = { lat: checkInLat, lng: checkInLng };
             setStartLocationInput("Check-In Location");
             foundCoords = true;
           }
         } else if (idx > 0) {
           const prev = dayMeetings[idx - 1];
           const prevLat = prev.endLocationLat || prev.startLocationLat;
           const prevLng = prev.endLocationLng || prev.startLocationLng;
           if (prevLat && prevLng) {
              startCoords = { lat: prevLat, lng: prevLng };
              setStartLocationInput(`Previous: ${prev.title || "Meeting"}`);
              foundCoords = true;
           }
         }
       }
       
       if (!foundCoords && navigator.geolocation) {
         try {
           setIsGeocoding(true);
           const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
             navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
           });
           startCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
           setStartLocationInput("Current Location");
         } catch(e) {
           toast.error("Failed to get current location. Please allow location access.");
           setIsGeocoding(false);
           return;
         }
       } else if (!foundCoords) {
         toast.error("Geolocation not supported and no previous location found.");
         return;
       }
    } else {
      if (!startLocationInput) {
        if (navigator.geolocation) {
          try {
            setIsGeocoding(true);
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            startCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setStartLocationInput("Current Location");
          } catch(e) {
            toast.error("Failed to get current location. Please allow location access.");
            setIsGeocoding(false);
            return;
          }
        } else {
          toast.error("Geolocation not supported and no start location provided.");
          return;
        }
      } else {
        setIsGeocoding(true);
        startCoords = await geocodeAddress(startLocationInput);
      }
    }
    
    if (!startCoords) {
      toast.error(`Could not find location: ${startLocationInput}`);
      setIsGeocoding(false);
      return;
    }
    
    const destinations = [];
    for (let i = 0; i < clientVisits.length; i++) {
       let coords = null;
       
       if (clientVisits[i].lat && clientVisits[i].lng) {
          coords = { lat: clientVisits[i].lat, lng: clientVisits[i].lng };
       }
       
       if (selectedMeetingId !== "none" && i === 0 && !coords) {
          const meeting = meetings.find(x => x.id === selectedMeetingId);
          if (meeting && meeting.startLocationLat && meeting.startLocationLng) {
             coords = { lat: meeting.startLocationLat, lng: meeting.startLocationLng };
          }
       }
       
       if (!coords) {
         coords = await geocodeAddress(clientVisits[i].fallbackAddress || clientVisits[i].name);
       }
       
       if (!coords) {
          toast.error(`Could not find location: ${clientVisits[i].name}`);
          setIsGeocoding(false);
          return;
       }
       destinations.push({
          id: clientVisits[i].id,
          name: clientVisits[i].name,
          lat: coords.lat,
          lng: coords.lng,
          meetingId: clientVisits[i].meetingId
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
      
      const selectedVehicle = vehicles.find(v => v.name === vehicleType);
      const currentRate = selectedVehicle ? selectedVehicle.ratePerKm : RATE_PER_KM;
      
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

  useEffect(() => {
    if (showPreTripModal && !routeSummary && !isGeocoding && clientVisits.length > 0 && clientVisits[0].name.trim() !== "") {
      handleCalculateRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreTripModal, routeSummary, isGeocoding, clientVisits, startLocationInput]);

  const handleConfirmAndStart = async () => {
    if (!plannedRouteData) return;
    
    if (!vehicleType) {
      toast.error("Please select a vehicle type for travel");
      return;
    }

    if (!meterPhoto) {
      toast.error("Please capture the live meter photo");
      return;
    }

    const { destinations, newRoute, totalDist } = plannedRouteData;
    
    setDynamicDestinations(destinations);
    setDetailedRoute(newRoute);
    
    // Save Trip Info for Admin sync
    const tripInfo = {
      employeeId: sessionStorage.getItem('employeeId'),
      employeeName: empName,
      startLocation: startLocationInput,
      clientVisits: clientVisits.map(v => v.name),
      meetingId: clientVisits[0]?.meetingId,
      purpose: purposeInput,
      vehicleType: vehicleType,
      startMeterReading: startMeterReading,
      meterPhoto: meterPhoto,
      startMeterLocationLat: currentLocationLat,
      startMeterLocationLng: currentLocationLng,
      startMeterLocationName: currentLocationName,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_trip_info`, JSON.stringify(tripInfo));
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_route`, JSON.stringify(newRoute));
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_destinations`, JSON.stringify(destinations));
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_client_visits`, JSON.stringify(clientVisits));
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_route_summary`, JSON.stringify(routeSummary));
    localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_planned_data`, JSON.stringify({ destinations, newRoute, totalDist }));
    
    setShowPreTripModal(false);
    setHasStartedTrip(true);
    
    // Set distance to 0 at the start of the trip (accumulates based on meter photos)
    setDistance(0);
    setCurrentPathIndex(0);
    setIsNearDestination(false);
    setArrivedSite(null);
    setVisitedSites([]);
    setActiveSite(null);
    setActiveMeetingId(null);
    
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
          startMeterReading: startMeterReading,
          meterPhoto: meterPhoto,
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
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Add watermark
            import('@/lib/watermark').then(({ addWatermarkToCanvas }) => {
              addWatermarkToCanvas(ctx, width, height).then(() => {
                // Export heavily compressed WebP or JPEG
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                setter(compressedDataUrl);
              });
            });
          }
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
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_client_visits`);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_route_summary`);
    localStorage.removeItem(`tracking_${sessionStorage.getItem('employeeId')}_planned_data`);
  };

  const handleSimulate = async () => {
    if (!tripStartTime) {
      const startTime = new Date();
      setTripStartTime(startTime);
      localStorage.setItem(`tracking_${sessionStorage.getItem('employeeId')}_start_time`, startTime.toISOString());
    }
    setIsPlaying(!isPlaying);
  };

  const selectedVehicleForCalc = vehicles.find(v => v.name === vehicleType);
  const currentRate = selectedVehicleForCalc ? parseFloat(selectedVehicleForCalc.ratePerKm) : RATE_PER_KM;
  const reimbursement = (distance * currentRate).toFixed(2);

  const handleEndRoute = async () => {
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

      toast.success(`Trip log was finalized!`);
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


  const mapContent = (
    <div className={
      isFullScreenTrip 
        ? "fixed inset-0 z-[100] w-full h-[100dvh] bg-slate-50" 
        : "relative w-full h-[calc(100dvh-5rem)] md:h-[calc(100dvh-7rem)] min-h-[500px] rounded-none md:rounded-2xl overflow-hidden md:shadow-2xl border-0 md:border border-slate-200/60 bg-slate-50 flex flex-col md:block"
    }>
      <div className={isFullScreenTrip ? "absolute inset-0 z-0" : "flex-1 md:absolute md:inset-0 z-0 relative"}>
        <MapContainer center={[19.1136, 72.8697]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
          <MapResizer isFullScreen={isFullScreenTrip || false} />
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
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

          {detailedRoute.length > 0 && (
            <>
              <Polyline positions={detailedRoute.slice(0, Math.max(1, Math.floor(detailedRoute.length * 0.85))).map(p => [p.lat, p.lng])} color="#10b981" weight={6} opacity={0.9} />
              <Polyline positions={detailedRoute.slice(Math.max(0, Math.floor(detailedRoute.length * 0.85) - 1)).map(p => [p.lat, p.lng])} color="#ef4444" weight={6} opacity={0.9} />
            </>
          )}
          
          {currentLocationMarker && (
            <Marker position={[currentLocationMarker.lat, currentLocationMarker.lng]} icon={customMarkerIcon}>
              <Popup>
                <div className="font-semibold">{empName}</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {isFullScreenTrip ? (
        <>
          {/* Top Floating Content */}
          <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-auto flex flex-col gap-3">
            <div className="relative flex items-center justify-center h-12">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-0 h-12 w-12 rounded-full bg-white shadow-md hover:bg-slate-50 border border-slate-100" 
                onClick={() => { if(window.confirm("Cancel this trip?")) { setIsPlaying(false); setSimulationMode(false); setHasStartedTrip(false); setMeterPhoto(null); } }}
              >
                <ChevronLeft className="h-6 w-6 text-[#3b66f5]" />
              </Button>
              <div className="bg-white rounded-full px-6 py-2.5 shadow-sm border border-slate-100/60 font-semibold text-[15px] text-slate-800 tracking-tight">
                Meeting Details
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-0 h-12 w-12 rounded-full shadow-md border transition-colors ${simulationMode ? 'bg-[#3b66f5] text-white hover:bg-blue-600 border-blue-600' : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-slate-100'}`}
                onClick={() => {
                  const newMode = !simulationMode;
                  setSimulationMode(newMode);
                  if (newMode && !isPlaying) setIsPlaying(true);
                  toast.success(newMode ? "Demo Mode Enabled" : "Demo Mode Disabled");
                }}
                title="Toggle Demo Mode"
              >
                <Play className="h-5 w-5 fill-current" />
              </Button>
            </div>

            {/* Main White Card */}
            <div className="bg-white rounded-[24px] shadow-lg p-4 flex flex-col border border-slate-100 mt-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-emerald-50 rounded-[10px] flex items-center justify-center border border-emerald-100/50">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="font-bold text-[17px] text-slate-800 tracking-tight">{activeTripMeeting?.title || purposeInput || "Trip"}</span>
                </div>
                <div className="bg-[#fff7e6] text-[#d97706] text-[11px] font-bold px-3 py-1 rounded-full border border-[#fef08a]/50">
                  {inProgressMeeting ? "In Meeting" : "In Progress"}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col px-2 w-[45%]">
                  <span className="text-[12px] text-slate-400 font-semibold mb-0.5">Distance</span>
                  <span className="font-bold text-[15px] text-slate-800">{distance.toFixed(1)} km</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-100 mx-2" />
                <div className="flex flex-col items-end px-2 w-[45%]">
                  <span className="text-[12px] text-slate-400 font-semibold mb-0.5">ETA</span>
                  <span className="font-bold text-[15px] text-slate-800">
                    {routeSummary ? routeSummary.reduce((acc: number, seg: any) => acc + (seg.eta || 0), 0).toFixed(0) : "0"} mins
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Control floating */}
          <div className="absolute top-[280px] right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-12 h-12 shadow-lg bg-white" 
              onClick={() => {
                const dest = dynamicDestinations.find(loc => String(loc.meetingId) === String(activeTripMeeting?.id)) || dynamicDestinations[0];
                if (dest && dest.lat && dest.lng) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
                  window.open(url, '_blank');
                } else {
                  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeTripMeeting?.title || purposeInput || "Destination")}`;
                  window.open(url, '_blank');
                }
              }}
            >
               <Navigation className="w-5 h-5 text-blue-600" />
            </Button>
          </div>

          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[36px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pt-6 flex flex-col pointer-events-auto max-h-[320px]">
            <div className="px-6 overflow-y-auto pb-[100px] no-scrollbar">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <p className="text-center text-[13px] font-semibold text-slate-400 mb-6 tracking-tight">Swipe up for details</p>
            <div className="flex items-center gap-4 mb-6">
               <div className="w-[54px] h-[54px] rounded-full bg-[#3b66f5] text-white flex items-center justify-center font-medium text-[26px] shadow-sm shrink-0">
                 {(activeTripMeeting?.title || purposeInput || "T").charAt(0).toUpperCase()}
               </div>
               <div className="flex-1 flex flex-col justify-center">
                 <h3 className="font-bold text-xl leading-tight text-slate-900 mb-0.5">{activeTripMeeting?.title || purposeInput || "Trip"}</h3>
                 <p className="text-[14px] font-medium text-slate-400">Client Visit</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col">
                 <div className="flex items-center gap-2 mb-2">
                   <Calendar className="w-[18px] h-[18px] text-[#3b66f5]" />
                   <span className="text-[13px] font-semibold text-slate-400">Date</span>
                 </div>
                 <p className="font-bold text-[16px] text-slate-800">{activeTripMeeting?.date ? new Date(activeTripMeeting.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</p>
               </div>
               <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col">
                 <div className="flex items-center gap-2 mb-2">
                   <Clock className="w-[18px] h-[18px] text-[#3b66f5]" />
                   <span className="text-[13px] font-semibold text-slate-400">Time</span>
                 </div>
                 <p className="font-bold text-[16px] text-slate-800">
                   {activeTripMeeting?.actualStartTime || activeTripMeeting?.time || new Date().toLocaleTimeString()}
                 </p>
               </div>
               <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-[18px] h-[18px] text-[#3b66f5] flex items-center justify-center border-2 border-[#3b66f5] rounded-full">
                     <div className="w-1.5 h-1.5 bg-[#3b66f5] rounded-full" />
                   </div>
                   <span className="text-[13px] font-semibold text-slate-400">Traffic</span>
                 </div>
                 <p className="font-bold text-[16px] text-slate-800">Light</p>
               </div>
               <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-[18px] h-[18px] text-[#3b66f5] flex items-center justify-center font-bold">!</div>
                   <span className="text-[13px] font-semibold text-slate-400">Priority</span>
                 </div>
                 <p className="font-bold text-[16px] text-slate-800">Medium</p>
               </div>
             </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 rounded-b-[36px]">
              {inProgressMeeting ? (
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md h-[56px] text-[17px] tracking-wide font-medium rounded-[20px]"
                  onClick={() => {
                    setActiveMeetingId(inProgressMeeting.id);
                    openCamera("endMeeting");
                  }}
                >
                  End Meeting
                </Button>
              ) : isNearDestination ? (
                !pendingMeterPhoto ? (
                  <Button 
                    className="w-full bg-[#3b66f5] hover:bg-blue-700 text-white shadow-md h-[56px] text-[17px] tracking-wide font-medium rounded-[20px] transition-transform active:scale-[0.98]"
                    onClick={() => {
                      if (arrivedSite?.meetingId) {
                        setActiveMeetingId(arrivedSite.meetingId);
                        setEndTripNextAction("endMeterForStartMeeting");
                        setShowEndTripModal(true);
                      } else {
                        // Fallback to simulate check-in
                        setActiveMeetingId(activeTripMeeting?.id);
                        setEndTripNextAction("endMeterForStartMeeting");
                        setShowEndTripModal(true);
                      }
                    }}
                  >
                    Reached
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md h-[56px] text-[17px] tracking-wide font-medium rounded-[20px] transition-transform active:scale-[0.98]"
                    onClick={() => {
                      if (arrivedSite?.meetingId) {
                        setActiveMeetingId(arrivedSite.meetingId);
                      } else {
                        setActiveMeetingId(activeTripMeeting?.id);
                      }
                      openCamera("startMeeting");
                    }}
                  >
                    Start Meeting
                  </Button>
                )
              ) : !isPlaying ? (
                <Button 
                  className="w-full bg-[#3b66f5] hover:bg-blue-700 text-white shadow-md h-[56px] text-[17px] tracking-wide font-medium rounded-[20px] transition-transform active:scale-[0.98]"
                  onClick={handleSimulate}
                >
                  Start Travel
                </Button>
              ) : (
                <Button 
                  disabled
                  className="w-full bg-slate-400 text-white shadow-md h-[56px] text-[17px] tracking-wide font-medium rounded-[20px]"
                >
                  Traveling...
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
      <div className="relative md:absolute md:top-4 md:left-4 z-40 w-full md:w-[380px] bg-white/95 md:bg-white/75 backdrop-blur-2xl md:border border-white/50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] md:shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-t-3xl md:rounded-2xl overflow-y-auto flex flex-col p-6 max-h-[55vh] md:max-h-[calc(100%-2rem)] transition-all duration-300">
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
            <h3 className="font-bold text-xl flex items-center gap-2.5 text-slate-800 tracking-tight">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl shadow-inner border border-blue-200/50">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              Live Tracking
              <div className="flex items-center space-x-2 ml-4">
                <Switch id="sim-mode" checked={simulationMode} onCheckedChange={setSimulationMode} disabled={isPlaying} />
              </div>
            </h3>
            <Badge variant={isPlaying ? "default" : "secondary"} className={`shadow-sm px-3 py-1 ${isPlaying ? "bg-green-500 hover:bg-green-600 text-white animate-pulse" : "bg-slate-100 text-slate-600"}`}>
              {isPlaying ? "Tracking" : "Paused"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 p-4 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:bg-white">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <Navigation className="w-3.5 h-3.5" /> Distance
              </p>
              <p className="text-lg font-black text-slate-800">{distance.toFixed(2)} <span className="text-sm font-medium text-slate-500">km</span></p>
            </div>
            <div className="bg-white/80 p-4 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:bg-white">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Duration
              </p>
              <p className="text-lg font-black text-slate-800">{Math.floor(timeSpent)} <span className="text-sm font-medium text-slate-500">mins</span></p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
              <p className="text-xs font-medium text-emerald-50 flex items-center gap-1.5 mb-1 tracking-wide uppercase">
                <Banknote className="w-4 h-4" /> Estimated Reimbursement
              </p>
              <p className="text-3xl font-black tracking-tight">
                ₹{reimbursement}
              </p>
            </div>
          </div>

          {hasStartedTrip && plannedRouteData && (
            <div className="pt-4 border-t border-slate-200/60 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> Trip Details
              </p>
              <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 shadow-sm">
                <span className="font-bold block mb-1 text-slate-800">Purpose of Visit:</span>
                {purposeInput || 'No purpose specified'}
              </div>
              
              {routeSummary && routeSummary.length > 0 && (
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {routeSummary.map((seg: any, i: number) => (
                    <div key={i} className="text-sm bg-white border border-slate-200/60 p-3 rounded-lg shadow-sm relative pl-5 before:content-[''] before:absolute before:left-1.5 before:top-4 before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full after:content-[''] after:absolute after:left-[8px] after:top-6 after:w-[1px] after:h-full after:bg-slate-200 last:after:hidden transition-all hover:border-blue-200">
                      <div className="font-bold truncate text-slate-800">{seg.startName} → {seg.endName}</div>
                      <div className="flex justify-between mt-1.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Navigation className="w-3 h-3"/> {seg.distance.toFixed(1)} km</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {seg.eta.toFixed(0)} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasStartedTrip && isNearDestination && !inProgressMeeting && (
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">You have arrived at destination</p>
              <div className="flex flex-col gap-2">
                {isMeetingCompleted ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex flex-col items-center justify-center text-center space-y-2 shadow-sm">
                       <CheckCircle2 className="w-8 h-8 text-green-500 mb-1" />
                       <span className="text-sm font-bold text-green-800 tracking-tight">Meeting Completed!</span>
                       <p className="text-xs text-green-700 font-medium leading-relaxed">You can fill out the Minutes of Meeting (MOM) now or save it for later.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md flex flex-col h-auto py-3 transition-all hover:-translate-y-0.5"
                        onClick={async () => {
                          await handleEndRoute();
                          localStorage.setItem('pendingMomMeetingId', destinationMeeting.id);
                          window.dispatchEvent(new CustomEvent('changeTab', { detail: 'meetings' }));
                        }}
                      >
                        <FileText className="w-5 h-5 mb-1.5" />
                        <span className="text-xs font-bold tracking-wide">Fill MOM Now</span>
                      </Button>
                      <Button 
                        className="w-full bg-white hover:bg-slate-50 text-slate-700 shadow-sm border border-slate-200 flex flex-col h-auto py-3 transition-all hover:-translate-y-0.5"
                        onClick={handleEndRoute}
                      >
                        <Clock className="w-5 h-5 mb-1.5 text-slate-500" />
                        <span className="text-xs font-bold tracking-wide">Fill Later</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button 
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
                      onClick={handleEndRoute}
                    >
                      End Route
                    </Button>
                    {!inProgressMeeting && (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        onClick={() => {
                          if (arrivedSite?.meetingId) {
                            setActiveMeetingId(arrivedSite.meetingId);
                            if (!pendingMeterPhoto) {
                              setEndTripNextAction("endMeterForStartMeeting");
                              setShowEndTripModal(true);
                            } else {
                              openCamera("startMeeting");
                            }
                          } else {
                            toast.error("No meeting associated with this destination.");
                          }
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {pendingMeterPhoto ? "Start Meeting" : "Reached & Start Meeting"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {inProgressMeeting ? (
            <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                <span className="text-sm font-bold text-blue-900 tracking-tight uppercase">Meeting In Progress</span>
              </div>
              <p className="text-xs font-semibold text-blue-800 line-clamp-2 leading-relaxed">{inProgressMeeting.title}</p>
              <Button
                variant="destructive"
                className="w-full text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all"
                onClick={() => {
                  setActiveMeetingId(inProgressMeeting.id);
                  openCamera("endMeeting");
                }}
              >
                End Meeting
              </Button>
            </div>
          ) : !hasStartedTrip && (
            <Button 
              className="w-full gradient-btn mt-2 shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                const scheduledMeeting = userMeetings.find(m => m.status === 'scheduled');
                if (scheduledMeeting) {
                  setClientVisits([{
                    id: 1,
                    name: scheduledMeeting.location || scheduledMeeting.title || "Meeting Location",
                    lat: scheduledMeeting.startLocationLat,
                    lng: scheduledMeeting.startLocationLng,
                    meetingId: scheduledMeeting.id
                  }]);
                  setPurposeInput(scheduledMeeting.title || "");
                  setShowPreTripModal(true);
                } else {
                  toast.error("There is no scheduled meeting available. Please schedule a meeting first.");
                }
              }}
            >
              Start New Route
            </Button>
          )}

          {hasStartedTrip && !inProgressMeeting && (
            <div className="flex flex-col gap-2 mt-4">
              {!isMeetingCompleted && (
                <Button 
                  variant={isPlaying ? "destructive" : "default"}
                  className={`w-full h-12 shadow-lg transition-all duration-300 active:scale-[0.98] ${isPlaying ? 'hover:shadow-red-500/25' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/25 border-0'}`}
                  onClick={handleSimulate}
                >
                  <div className="flex items-center justify-center gap-2 font-bold tracking-wide text-[15px]">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    {isPlaying ? (simulationMode ? "Pause Demo" : "Pause Tracking") : (simulationMode ? "Simulate Travel" : "Start Tracking")}
                  </div>
                </Button>
              )}
              <Button
                variant={isMeetingCompleted ? "default" : "outline"}
                className={isMeetingCompleted 
                  ? "w-full text-white bg-[#3b66f5] hover:bg-blue-700 h-12 shadow-md transition-all font-bold text-[15px]" 
                  : "w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-10 shadow-sm transition-all"}
                onClick={() => {
                  if(isMeetingCompleted || window.confirm("Are you sure you want to cancel this trip?")) {
                    const empId = sessionStorage.getItem('employeeId');
                    setIsPlaying(false);
                    setSimulationMode(false);
                    setHasStartedTrip(false);
                    setRouteSummary(null);
                    setPlannedRouteData(null);
                    setDetailedRoute([]);
                    setCurrentPathIndex(0);
                    setClientVisits([{ id: 1, name: "", lat: undefined, lng: undefined, meetingId: undefined }]);
                    setDistance(0);
                    setTimeSpent(0);
                    setTripStartTime(null);
                    setTrackingEntryId(null);
                    setMeterPhoto(null);
                    
                    if(empId) {
                      localStorage.removeItem(`tracking_${empId}_trip_info`);
                      localStorage.removeItem(`tracking_${empId}_route`);
                      localStorage.removeItem(`tracking_${empId}_destinations`);
                      localStorage.removeItem(`tracking_${empId}_client_visits`);
                      localStorage.removeItem(`tracking_${empId}_route_summary`);
                      localStorage.removeItem(`tracking_${empId}_planned_data`);
                      localStorage.removeItem(`tracking_${empId}_distance`);
                      localStorage.removeItem(`tracking_${empId}_time`);
                      localStorage.removeItem(`tracking_${empId}_start_time`);
                      localStorage.removeItem(`tracking_${empId}_currentPathIndex`);
                      localStorage.removeItem(`tracking_${empId}_isPlaying`);
                      localStorage.removeItem(`tracking_${empId}_simulationMode`);
                      localStorage.removeItem(`tracking_${empId}_entry_id`);
                      localStorage.removeItem(`tracking_${empId}_visitedSites`);
                      localStorage.removeItem(`tracking_${empId}_activeSite`);
                      localStorage.removeItem(`tracking_${empId}_isNearDestination`);
                      localStorage.removeItem(`tracking_${empId}_arrivedSite`);
                      localStorage.removeItem(`tracking_${empId}_status`);
                    }
                    
                    setIsNearDestination(false);
                    setArrivedSite(null);
                    setVisitedSites([]);
                    setActiveSite(null);
                    setActiveMeetingId(null);

                    toast.success(isMeetingCompleted ? "Tracking session ended successfully." : "Trip has been cancelled and reset.");
                  }
                }}
              >
                {!isMeetingCompleted && <X className="w-4 h-4 mr-2" />} {isMeetingCompleted ? "End Tracking Session" : "Cancel Trip"}
              </Button>
            </div>
          )}
        </div>
      </div>
      )}

      <Dialog modal={false} open={showPreTripModal && !hasStartedTrip} onOpenChange={setShowPreTripModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogDescription className="sr-only">Pre-trip details</DialogDescription>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Start Travel Route
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Your route details have been calculated automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {!routeSummary ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2 shadow-inner">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Calculating Route</h3>
                <p className="text-sm text-slate-500 text-center max-w-[250px]">
                  Please wait while we determine the best path to your destination...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-1 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Navigation className="w-24 h-24" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 relative z-10 text-white space-y-6">
                    
                    <div>
                      <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Meeting Title</p>
                      <h3 className="text-2xl font-bold leading-tight">
                        {purposeInput || clientVisits[0]?.name || "Upcoming Meeting"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                      <div>
                        <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> Total Distance
                        </p>
                        <p className="text-3xl font-black">{plannedRouteData?.totalDist.toFixed(1)} <span className="text-base font-medium opacity-80">km</span></p>
                      </div>
                      
                      <div>
                        <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Est. Travel Time
                        </p>
                        <p className="text-3xl font-black">
                          {routeSummary.reduce((acc: number, seg: any) => acc + (seg.eta || 0), 0).toFixed(0)} <span className="text-base font-medium opacity-80">mins</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type <span className="text-destructive">*</span></Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v: any) => (
                        <SelectItem key={v.id} value={v.name}>{v.name} ({v.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>



                {vehicleType && (
                  <div className="space-y-2 pb-2">
                    <Label>Meter Photo <span className="text-destructive">*</span></Label>
                    {!meterPhoto ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => openCamera("startMeter")}
                        className="w-full flex items-center justify-center border-blue-200 text-blue-600 hover:bg-blue-50 relative h-14 rounded-xl border-dashed border-2"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        <span className="font-semibold text-sm">Capture Live Meter Photo</span>
                      </Button>
                    ) : (
                      <div className="relative w-full h-40 rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm group">
                        <img src={meterPhoto} alt="Meter" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/20" onClick={() => openCamera("startMeter")}>
                            <Camera className="w-4 h-4 mr-2" /> Retake Photo
                          </Button>
                        </div>
                        <button 
                          onClick={() => setMeterPhoto(null)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t-0 pt-0 sm:pt-0">
            {routeSummary ? (
              <Button className="w-full h-14 text-lg font-bold shadow-lg shadow-blue-500/30 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-0.5" onClick={handleConfirmAndStart}>
                Start Journey
              </Button>
            ) : (
              <Button variant="outline" className="w-full h-14 rounded-xl" onClick={() => setShowPreTripModal(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog modal={false} open={showEndTripModal} onOpenChange={setShowEndTripModal}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogDescription className="sr-only">End trip details</DialogDescription>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Complete Journey
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-slate-500 text-center py-2">
              Please continue to capture the final meter reading photo.
            </p>
          </div>
          
          <DialogFooter className="border-t-0 pt-0 sm:pt-0">
            <Button 
              className="w-full h-14 text-lg font-bold shadow-lg shadow-blue-500/30 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-0.5" 
              onClick={() => {

                setShowEndTripModal(false);
                openCamera(endTripNextAction);
              }}
            >
              Continue to Photo Capture
            </Button>
            <Button variant="outline" className="w-full h-14 rounded-xl mt-2" onClick={() => setShowEndTripModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog modal={false} open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogDescription className="sr-only">Expense Details</DialogDescription>
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
                  <button 
                    type="button"
                    onClick={() => openCamera("expense")}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                  >
                    <Camera className="w-8 h-8 text-primary mb-2" />
                    <span className="text-sm text-primary font-medium">Capture Bill</span>
                    <span className="text-xs text-muted-foreground mt-1">Live camera only</span>
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border h-32 group mt-1">
                  <img src={expensePhoto} alt="Bill Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => openCamera("expense")}
                      className="cursor-pointer text-white flex items-center gap-2 bg-transparent border-none"
                    >
                      <Camera className="w-4 h-4" /> Retake
                    </button>
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
          <Card className="w-full max-w-sm shadow-2xl border-white/20 glass-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary mb-2">
                {modalType === "checkin" ? <MapPin className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                <h3 className="font-bold text-xl">
                  {modalType === "checkin" ? "Site Check-in" : "Site Check-out"}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                You have reached <strong>{modalType === "checkin" ? arrivedSite?.name : activeSite?.name}</strong>. 
                Please {modalType === "checkin" ? "confirm to check in" : "confirm to check out"}.
              </p>

              <Button className="w-full gradient-btn mt-4" onClick={handleSiteCheckInCheckOut}>
                {modalType === "checkin" ? "Confirm Check-in" : "Confirm Check-out"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <SiteVisitReportFormModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)}
        onSubmit={handleCheckoutReportSubmit}
        siteName={activeSite?.name || "Site"}
        initialDistance={distance}
      />

      <Dialog modal={false} open={showExpenseHistoryModal} onOpenChange={setShowExpenseHistoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogDescription className="sr-only">Expense History</DialogDescription>
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

      {/* Camera Capture Modal */}
      <Dialog modal={false} open={isCaptureModalOpen} onOpenChange={(open) => {
        if (!open) {
          stopCamera();
          setIsCaptureModalOpen(false);
        }
      }}>
        <DialogContent className="!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !border-none !rounded-none !bg-black !p-0 !m-0 !z-[9999] !flex !flex-col !gap-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Camera</DialogTitle>
          <DialogDescription className="sr-only">Capture photo</DialogDescription>
          <div className="h-14 bg-primary flex items-center px-4 shrink-0 text-primary-foreground gap-4 z-10 relative pt-safe border-b border-white/10 shadow-sm">
            <button onClick={() => { stopCamera(); setIsCaptureModalOpen(false); }} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-medium text-lg tracking-tight">Camera</span>
          </div>

          <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`} />
            <canvas ref={canvasRef} className="hidden" />

            {logoSrc && (
              <img 
                src={logoSrc} 
                alt="Logo" 
                className="absolute top-4 right-4 h-20 w-auto object-contain z-10 pointer-events-none"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
            <div className="absolute bottom-56 left-4 right-4 flex flex-col items-start gap-3 pointer-events-none z-10">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-1.5 py-1.5 rounded-lg border border-white/10 shadow-lg">
                <div className="bg-blue-600 px-2 py-0.5 rounded text-white font-bold text-[11px] tracking-wide">
                  {captureType === "startMeter" ? "VEHICLE START METER" : (captureType === "siteCheckIn" ? "SITE CHECK-IN" : captureType === "startMeeting" ? "MEETING START" : captureType === "endMeeting" ? "MEETING END" : captureType === "endMeter" || captureType === "endMeterForStartMeeting" ? "VEHICLE END METER" : "EXPENSE BILL")}
                </div>
                <div className="font-semibold text-sm text-white pr-2">
                  {format(new Date(), "hh:mm a")}
                </div>
              </div>

              <div className="flex flex-col pl-3 border-l-[3px] border-blue-600">
                <span className="font-medium text-[15px] text-white drop-shadow-md">
                  {format(new Date(), "EEE, MMM dd, yyyy")}
                </span>
                <span className="text-[13px] text-white/90 drop-shadow-md line-clamp-2 mt-0.5">
                  {currentLocationName}
                </span>
              </div>
            </div>

            <div className="absolute top-4 left-4 flex gap-3 z-50">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newMode = facingMode === "user" ? "environment" : "user";
                  startCamera(newMode);
                }} 
                className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 shadow-lg border border-white/20"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); stopCamera(); setIsCaptureModalOpen(false); }} 
                className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 shadow-lg border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute top-8 left-4 right-24 text-center z-10 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 text-white/90 text-sm border border-white/10 inline-block shadow-xl">
                {captureType === "startMeter" ? "Capture starting vehicle meter photo" : 
                 captureType === "siteCheckIn" ? "Capture site check-in proof" : 
                 captureType === "startMeeting" ? "Capture meeting start proof" :
                 captureType === "endMeeting" ? "Capture meeting end proof" :
                 captureType === "endMeter" ? "Capture vehicle end meter photo" :
                 "Capture expense bill"}
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); capturePhoto(); }} 
                disabled={!stream} 
                className="w-20 h-20 rounded-full border-4 border-white bg-transparent flex items-center justify-center hover:bg-white/10 transition-colors shadow-xl"
              >
                <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isFullScreenTrip) {
    return createPortal(mapContent, document.body);
  }

  return mapContent;
}
