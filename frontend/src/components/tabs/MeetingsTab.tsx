import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Plus, Calendar, Clock, MapPin, Video, Users, Search, MoreVertical, X, Check, Camera, FileText, MessageSquare, CheckSquare, CalendarDays, MessageCircle, ChevronDown, ChevronUp, ChevronLeft, CheckCircle2, SwitchCamera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMasterData } from "@/contexts/MasterDataContext";
import { TimePickerDialog } from "@/components/ui/time-picker-dialog";
import { format } from "date-fns";
import { useTransparentLogo } from "@/hooks/useTransparentLogo";

interface Meeting {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  organizer: string;
  organizerId: string;
  location: string;
  mode: string;
  meetingLink?: string;
  agenda: string;
  reminder: string;
  attendees: any[];
  status: string;
  actualStartTime?: string;
  actualEndTime?: string;
  startLocationLat?: number;
  startLocationLng?: number;
  endLocationLat?: number;
  endLocationLng?: number;
  startPhoto?: string;
  endPhoto?: string;
  startLocationName?: string;
  endLocationName?: string;
  momData?: any;
  recurring?: string;
  cancelReason?: string;
  priority?: string;
  createdAt?: string;
  vehicleType?: string;
  vehicleRate?: number;
  vehicleMeterPhoto?: string;
  startMeterPhoto?: string | null;
  endMeterPhoto?: string | null;
  startMeterLocationLat?: number | null;
  startMeterLocationLng?: number | null;
  startMeterLocationName?: string | null;
  endMeterLocationLat?: number | null;
  endMeterLocationLng?: number | null;
  endMeterLocationName?: string | null;
  startMeterTime?: string | null;
  endMeterTime?: string | null;
  calculatedDistanceKms?: number;
}

const LiveMeetingDuration = ({ startTime, endTime }: { startTime: string; endTime?: string }) => {
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    const calculate = () => {
      const end = endTime ? new Date(endTime) : new Date();
      const diff = end.getTime() - new Date(startTime).getTime();
      if (diff <= 0) return "0 mins";
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      if (hrs > 0) return `${hrs}h ${mins % 60}m`;
      return `${mins} mins`;
    };

    setDuration(calculate());

    if (!endTime) {
      const interval = setInterval(() => {
        setDuration(calculate());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime]);

  return <>{duration}{!endTime ? " (Ongoing)" : ""}</>;
};

export function MeetingsTab() {
  const logoSrc = useTransparentLogo();
  const { meetings, setMeetings, trackingEntries, regularizationRequests, employees, attendanceEntries } = useMasterData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [expandedMom, setExpandedMom] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'startTime' | 'endTime'>('startTime');
  const [momModalOpen, setMomModalOpen] = useState(false);
  const [activeMomMeetingId, setActiveMomMeetingId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [momFormData, setMomFormData] = useState({
    agenda: "", actionItems: "", followUpDate: "", comments: "",
    expenses: { local: "", hotel: "", other: "", localBill: "", hotelBill: "", otherBill: "", status: "pending" }
  });
  const [isSubmittingMom, setIsSubmittingMom] = useState(false);

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff <= 0) return "0 mins";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins} mins`;
  };
  const userId = sessionStorage.getItem("userId") || "";
  const sessionEmpId = sessionStorage.getItem("employeeId") || "";

  const haversine = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const getMeetingDistance = (meeting: Meeting) => {
    if (meeting.calculatedDistanceKms && meeting.calculatedDistanceKms > 0) {
      return `${meeting.calculatedDistanceKms.toFixed(2)} km (from Start Meter to End Meter)`;
    }

    if (!meeting.startLocationLat || !meeting.startLocationLng) return null;

    // Find meetings for the same date and same employee that have started, ordered by start time
    const dayMeetings = meetings
      .filter(m => m.date === meeting.date && m.organizerId === meeting.organizerId && (m.status === 'in-progress' || m.status === 'completed'))
      .sort((a, b) => new Date(a.actualStartTime || "").getTime() - new Date(b.actualStartTime || "").getTime());

    const idx = dayMeetings.findIndex(m => m.id === meeting.id);
    if (idx === -1) return null;

    if (idx === 0) {
      // First meeting of the day -> Distance from check-in
      const currentEmp = employees.find(e => e.id === meeting.organizerId);
      let att = attendanceEntries.find(a => (a.employeeCode === meeting.organizerId || (a as any).employeeId === meeting.organizerId || (currentEmp && a.employeeName === currentEmp.fullName)) && a.date === meeting.date);
      
      const getLocalDate = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      const localToday = getLocalDate();

      // Fallback to today's check-in if meeting date check-in is missing
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
        const dist = haversine(checkInLat, checkInLng, meeting.startLocationLat, meeting.startLocationLng);
        return dist ? `${dist} km (from Check-in to ${meeting.title || "meeting"})` : null;
      } else {
        return "N/A (No Check-in)";
      }
    } else {
      // Subsequent meeting -> Distance from previous meeting end (or start if missing end)
      const prev = dayMeetings[idx - 1];
      const prevLat = prev.endLocationLat || prev.startLocationLat;
      const prevLng = prev.endLocationLng || prev.startLocationLng;
      if (prevLat && prevLng) {
        const dist = haversine(prevLat, prevLng, meeting.startLocationLat, meeting.startLocationLng);
        return dist ? `${dist} km (from ${prev.title || "previous meeting"} to ${meeting.title || "this meeting"})` : null;
      }
    }
    return null;
  };

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const today = getLocalDate();
  const userRole = sessionStorage.getItem("userRole") || "Employee";
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isManagement = ["admin", "manager", "sr_mgr", "head"].includes(userRole.toLowerCase());
  const isAdmin = userRole.toLowerCase() === "admin" || isGlobalAdmin;
  const bypassCheckIn = isManagement || isGlobalAdmin;


  const userTrackingForToday = trackingEntries.find(t => (t.employeeId === userId || t.employeeId === sessionEmpId) && t.checkInTime.startsWith(today));
  const userAttendanceForToday = attendanceEntries.find(a => (a.employeeCode === userId || a.employeeCode === sessionEmpId || (a as any).employeeId === userId || (a as any).employeeId === sessionEmpId) && a.date === today);
  const hasTrackedCheckIn = !!userTrackingForToday || !!userAttendanceForToday?.actualCheckIn;
  const hasTrackedCheckOut = !!(userTrackingForToday as any)?.checkOutTime || !!userAttendanceForToday?.actualCheckOut;

  const todayRegularizations = regularizationRequests.filter(r =>
    (r.employeeId === sessionEmpId || r.employeeId === userId) &&
    r.date === today &&
    r.status === 'Approved'
  );

  const hasRegCheckIn = todayRegularizations.some(r => r.type === 'Check In' || r.type === 'Both');
  const hasRegCheckOut = todayRegularizations.some(r => r.type === 'Check Out' || r.type === 'Both');
  const hasApprovedRegularizationToday = todayRegularizations.length > 0;

  const isCheckedInToday = bypassCheckIn || hasTrackedCheckIn || hasRegCheckIn;
  const isCheckedOutToday = !bypassCheckIn && (hasTrackedCheckOut || hasRegCheckOut);

  // Capture Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureType, setCaptureType] = useState<"start" | "end" | "localBill" | "hotelBill" | "otherBill" | "vehicleMeter" | "startMeter" | "endMeter">("start");
  const [pendingMeterPhoto, setPendingMeterPhoto] = useState<string | null>(null);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>("Locating...");
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string, title: string } | null>(null);
  const [cancelMeetingId, setCancelMeetingId] = useState<string | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const employeeId = sessionStorage.getItem("employeeId") || "EMP-UNKNOWN";
  const employeeName = sessionStorage.getItem("userName") || "Unknown User";

  const [formData, setFormData] = useState<any>({
    clientName: "",
    title: "",
    type: "client",
    checklist: "",
    dateTime: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    })(),
    location: "",
    priority: "medium",
    agenda: "",
    organizer: employeeName,
    organizerId: employeeId,
    attendees: [],
    mode: "in-person",
  });

  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const locationDebounceRef = useRef<any>(null);

  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    try {
      // Using Photon API with lat/lon bias for Mumbai (19.0760, 72.8777) to prioritize local results
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=19.0760&lon=72.8777`);
      const data = await res.json();

      if (data.features) {
        const formattedSuggestions = data.features.map((f: any) => {
          const p = f.properties;
          // Build a readable address string
          const addressParts = [
            p.name,
            p.street,
            p.city || p.town || p.village,
            p.state,
            p.country
          ].filter(Boolean);

          return {
            display_name: addressParts.join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0]
          };
        });

        // Filter out duplicates that might occur due to formatting
        const uniqueSuggestions = Array.from(new Map(formattedSuggestions.map((item: any) => [item.display_name, item])).values());
        setLocationSuggestions(uniqueSuggestions);
      } else {
        setLocationSuggestions([]);
      }
    } catch (e) {
      console.error(e);
      setLocationSuggestions([]);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, location: val });

    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = setTimeout(() => {
      searchLocation(val);
    }, 500);
  };


  const fetchVehicles = async () => {
    try {
      const res = await fetch(`/api/ops/vehicles/`);
      if (res.ok) {
        const data = await res.json(); setVehicles(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`/api/ops/meetings/`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchMeetings();
    const intervalId = setInterval(() => {
      fetchMeetings();
    }, 5000); // Auto-refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleSave = async () => {
    if (!formData.title || !formData.dateTime || !formData.location) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const dt = new Date(formData.dateTime);
      const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const startTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      
      const endDt = new Date(dt.getTime() + 60 * 60 * 1000); // Default to +1 hour
      const endTime = `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`;

      const fullTitle = formData.clientName ? `${formData.clientName} - ${formData.title}` : formData.title;
      const fullAgenda = formData.checklist ? `Checklist: ${formData.checklist}\n\n${formData.agenda || ""}` : (formData.agenda || "");

      const payload: any = {
        ...formData,
        title: fullTitle,
        date,
        startTime,
        endTime,
        agenda: fullAgenda || "Client Meeting",
        recurring: formData.recurring || "none",
        priority: formData.priority || "medium",
      };

      const attendees = payload.attendees || [];
      const isOrganizerIncluded = attendees.some((a: any) => a.id === formData.organizerId);
      if (!isOrganizerIncluded && formData.organizerId) {
        attendees.push({
          id: formData.organizerId,
          name: formData.organizer,
          type: "employee"
        });
      }
      payload.attendees = attendees;

      const res = await fetch(`/api/ops/meetings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Meeting scheduled successfully!" });
        setIsModalOpen(false);
        fetchMeetings();
      } else {
        toast({ title: "Error", description: "Failed to schedule meeting.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

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
      toast({ title: "Camera Error", description: "Could not access camera.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video.videoWidth || !video.videoHeight) {
        toast({ title: "Camera Error", description: "Camera is still initializing, please wait.", variant: "destructive" });
        return;
      }

      const containerWidth = video.clientWidth > 100 ? video.clientWidth : (window.innerWidth > 0 ? window.innerWidth : 375);
      const containerHeight = video.clientHeight > 100 ? video.clientHeight : (window.innerHeight > 0 ? window.innerHeight : 812);
      const dpr = window.devicePixelRatio || 2;

      // Canvas must be physical device pixels for crisp text rendering
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

        // Scale is directly the device pixel ratio, making text mathematically identical to CSS
        const scale = dpr;
        const leftX = 16 * scale;

        const now = new Date();
        const timeStr = format(now, "hh:mm a");
        const dateStr = format(now, "EEE, MMM dd, yyyy");
        const locationStr = currentLocationName || "Unknown Location";
        const type = captureType === "start" ? "MEETING START" : (captureType === "end" ? "MEETING END" : "EXPENSE BILL");

        // Move up to bottom-56 (224px) to avoid being covered by the tall submit banner
        let currentY = canvas.height - (224 * scale) - (64 * scale);

        // 1. Draw badge background
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

        // Primary pill inside badge
        ctx.fillStyle = '#2563eb';
        const pillWidth = typeWidth + (16 * scale);
        const pillHeight = 18 * scale;
        const pillX = leftX + (6 * scale);
        const pillY = currentY + (4 * scale);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 4 * scale);
        else ctx.rect(pillX, pillY, pillWidth, pillHeight);
        ctx.fill();

        // Type Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${11 * scale}px 'Inter', sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(type, pillX + pillWidth / 2, pillY + pillHeight / 2 + (1 * scale));

        // Time Text
        ctx.textAlign = 'left';
        ctx.font = `600 ${14 * scale}px 'Inter', sans-serif`;
        ctx.fillText(timeStr, pillX + pillWidth + (8 * scale), currentY + badgeHeight / 2 + (1 * scale));

        currentY += badgeHeight + (12 * scale); // gap-3

        // 2. Draw vertical line
        ctx.fillStyle = '#2563eb';
        const lineHeight = 36 * scale;
        ctx.fillRect(leftX, currentY, 3 * scale, lineHeight);

        // 3. Draw text with shadow for readability
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
            setPhotoData(canvas.toDataURL('image/jpeg', 0.8));
            stopCamera();
          });
        });
      }
    }
  };


  const handleCaptureVehicleMeter = () => {
    setCaptureType("vehicleMeter");
    setPhotoData(null);
    setCurrentLocationName("Locating...");
    setIsCaptureModalOpen(true);
    setTimeout(startCamera, 100);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
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

  const handleCaptureBill = (type: "localBill" | "hotelBill" | "otherBill") => {
    setCaptureType(type);
    setPhotoData(null);
    setCurrentLocationName("Locating...");
    setIsCaptureModalOpen(true);
    setTimeout(startCamera, 100);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
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

  const handleLiveAction = (meetingId: string, type: "start" | "end") => {
    if (!isCheckedInToday) {
      toast({ title: "Check-in Required", description: `You must check in for the day before you can ${type} a meeting.`, variant: "destructive" });
      return;
    }
    setActiveMeetingId(meetingId);
    
    const activeMeeting = meetings.find(m => m.id === meetingId);
    if (type === "start" && activeMeeting?.vehicleType && activeMeeting.vehicleType !== "none" && activeMeeting.vehicleType !== "") {
      setCaptureType("endMeter");
    } else {
      setCaptureType(type);
    }
    
    setPendingMeterPhoto(null);
    setPhotoData(null);
    setCurrentLocationName("Locating...");
    setIsCaptureModalOpen(true);
    setTimeout(startCamera, 100);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          if (res.ok) {
            const data = await res.json();
            setCurrentLocationName(data.display_name || "Unknown Location");
          } else {
            setCurrentLocationName("Unknown Location");
          }
        } catch (e) {
          setCurrentLocationName("Unknown Location");
        }
      }, () => {
        setCurrentLocationName("Location Access Denied");
      });
    }
  };

  useEffect(() => {
    const handleStartFromTracking = (e: any) => {
      if (e.detail?.meetingId) {
        handleLiveAction(e.detail.meetingId, "start");
      }
    };
    window.addEventListener('startMeetingFromTracking', handleStartFromTracking);
    return () => window.removeEventListener('startMeetingFromTracking', handleStartFromTracking);
  }, [isCheckedInToday, meetings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === "vehicleMeterPhoto") {
          setFormData({
            ...formData,
            vehicleMeterPhoto: base64
          });
        } else if (["localBill", "hotelBill", "otherBill"].includes(type)) {
          setMomFormData({
            ...momFormData,
            expenses: { ...momFormData.expenses, [type]: base64 }
          });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const submitLiveAction = async () => {
    if (!photoData) return;

    if (captureType === "endMeter") {
      setPendingMeterPhoto(photoData);
      setCaptureType("start");
      setPhotoData(null);
      setTimeout(startCamera, 100);
      return;
    }

    if (captureType === "vehicleMeter") {
      setFormData({
        ...formData,
        vehicleMeterPhoto: photoData
      });
      setTimeout(() => {
        setIsCaptureModalOpen(false);
        setPhotoData(null);
      }, 800);
      return;
    }

    if (captureType === "localBill" || captureType === "hotelBill" || captureType === "otherBill") {
      setMomFormData({
        ...momFormData,
        expenses: { ...momFormData.expenses, [captureType]: photoData }
      });
      setTimeout(() => {
        setIsCaptureModalOpen(false);
        setPhotoData(null);
      }, 800);
      return;
    }

    if (!activeMeetingId) return;
    setIsUploading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const now = new Date().toISOString();
          let locationName = "Unknown Location";
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              locationName = geoData.display_name || "Unknown Location";
            }
          } catch (e) {
            console.error("Geocoding failed", e);
          }

          const patchData: any = captureType === "start"
            ? { status: "in-progress", actualStartTime: now, startPhoto: photoData, startLocationLat: lat, startLocationLng: lng, startLocationName: locationName, endMeterPhoto: pendingMeterPhoto }
            : { status: "completed", actualEndTime: now, endPhoto: photoData, endLocationLat: lat, endLocationLng: lng, endLocationName: locationName };

          const res = await fetch(`/api/ops/meetings/${activeMeetingId}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchData),
          });

          if (res.ok) {
            toast({ title: "Success", description: `Meeting ${captureType === 'start' ? 'started' : 'ended'} successfully!` });
            setIsCaptureModalOpen(false);
            setPhotoData(null);
            setPendingMeterPhoto(null);
            fetchMeetings();
          } else {
            toast({ title: "Error", description: "Failed to update meeting.", variant: "destructive" });
          }
        } catch (e) {
          toast({ title: "Error", description: "Network error.", variant: "destructive" });
        } finally {
          setIsUploading(false);
        }
      },
      (err) => {
        toast({ title: "Location Error", description: "Please enable location services.", variant: "destructive" });
        setIsUploading(false);
      }
    );
  };

  const handleCancelMeeting = async () => {
    if (!cancelMeetingId || !cancelReasonText.trim()) return;
    setIsUploading(true);

    try {
      const res = await fetch(`/api/ops/meetings/${cancelMeetingId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: cancelReasonText }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Meeting cancelled successfully." });
        setCancelMeetingId(null);
        setCancelReasonText("");
        fetchMeetings();
      } else {
        toast({ title: "Error", description: "Failed to cancel meeting.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error. Failed to cancel meeting.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const openMomModal = (meetingId: string) => {
    setActiveMomMeetingId(meetingId);
    
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting && meeting.momData && Object.keys(meeting.momData).length > 0) {
      setMomFormData(meeting.momData);
    } else {
      setMomFormData({
        agenda: "",
        actionItems: "",
        followUpDate: "",
        comments: "",
        expenses: {
          status: "pending",
          local: "",
          hotel: "",
          other: "",
          localBill: "",
          hotelBill: "",
          otherBill: ""
        }
      });
    }
    
    setMomModalOpen(true);
  };

  useEffect(() => {
    const pendingMomId = localStorage.getItem('pendingMomMeetingId');
    if (pendingMomId && meetings.some(m => m.id === pendingMomId)) {
      openMomModal(pendingMomId);
      localStorage.removeItem('pendingMomMeetingId');
    }
  }, [meetings]);

  const submitMomForm = async () => {
    if (!activeMomMeetingId) return;
    setIsSubmittingMom(true);
    try {
      const res = await fetch(`/api/ops/meetings/${activeMomMeetingId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ momData: momFormData }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "MOM submitted successfully!" });
        setMomModalOpen(false);
        fetchMeetings();
      } else {
        toast({ title: "Error", description: "Failed to submit MOM.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setIsSubmittingMom(false);
    }
  };

  const handleExpenseApproval = async (meetingId: string, status: 'approved' | 'denied' | 'pending') => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting || !meeting.momData || !meeting.momData.expenses) return;

    try {
      const updatedMomData = {
        ...meeting.momData,
        expenses: {
          ...meeting.momData.expenses,
          status
        }
      };

      const res = await fetch(`/api/ops/meetings/${meetingId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ momData: updatedMomData }),
      });

      if (res.ok) {
        toast({ title: "Success", description: `Expenses ${status} successfully!` });
        fetchMeetings();
      } else {
        toast({ title: "Error", description: "Failed to update expense status.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.agenda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.organizer?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "All") return true;
    if (activeFilter === "Upcoming") return m.status !== "completed" && m.status !== "cancelled" && m.status !== "in-progress";
    if (activeFilter === "In Progress") return m.status === "in-progress";
    if (activeFilter === "Completed") return m.status === "completed";
    if (activeFilter === "Cancelled") return m.status === "cancelled";
    if (activeFilter === "Expenses") {
      return m.momData?.expenses &&
        (Number(m.momData.expenses.local || 0) > 0 ||
          Number(m.momData.expenses.hotel || 0) > 0 ||
          Number(m.momData.expenses.other || 0) > 0 ||
          !!m.momData.expenses.localBill ||
          !!m.momData.expenses.hotelBill ||
          !!m.momData.expenses.otherBill);
    }

    return true;
  }).sort((a, b) => {
    // Sort by createdAt (descending) if available
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Fallback: Sort by date (descending) then start time (descending)
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return b.startTime.localeCompare(a.startTime);
  });

  const filterOptions = ["All", "Upcoming", "In Progress", "Completed", "Cancelled", "Expenses"];

  return (
    <div className="space-y-6">
      {!isModalOpen ? (
        <div className="relative min-h-[calc(100vh-200px)] pb-4">
          {/* Top Actions */}
          <div className="flex gap-3 mb-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search clients, locations..."
                className="pl-12 rounded-full h-12 bg-background border-muted-foreground/30 shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* New Meeting Button */}
            <Button
              onClick={() => {
                if (isCheckedOutToday) {
                  toast({ title: "Checked Out", description: "You have checked out for the day and cannot create new meetings.", variant: "destructive" });
                  return;
                }
                if (!isCheckedInToday) {
                  toast({ title: "Check-in Required", description: "You must check in for the day before creating a meeting.", variant: "destructive" });
                  return;
                }
                const now = new Date();
                const currTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                now.setHours(now.getHours() + 1);
                const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                setFormData({ type: "client", mode: "in-person", startTime: currTime, endTime: endTime, reminder: "15min", organizer: employeeName, organizerId: employeeId, attendees: [], date: today });
                setLocationSuggestions([]);
                setIsModalOpen(true);
              }}
              className="h-12 rounded-full px-5 shadow-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center gap-2 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">New Meeting</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 mb-4 px-1">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1.5 px-3">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Total Travel Today: {(() => {
                let total = 0;
                const relevantMeetings = meetings.filter(m => m.date === today && (m.status === 'in-progress' || m.status === 'completed') && (
                  m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  m.agenda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  m.organizer?.toLowerCase().includes(searchTerm.toLowerCase())
                ));
                
                const grouped: Record<string, Meeting[]> = {};
                relevantMeetings.forEach(m => {
                  if (!grouped[m.organizerId]) grouped[m.organizerId] = [];
                  grouped[m.organizerId].push(m);
                });

                Object.keys(grouped).forEach(orgId => {
                  const mList = grouped[orgId].sort((a, b) => new Date(a.actualStartTime || "").getTime() - new Date(b.actualStartTime || "").getTime());
                  mList.forEach((m, idx) => {
                    if (idx === 0) {
                      const currentEmp = employees.find(e => e.id === orgId);
                      const att = attendanceEntries.find(a => (a.employeeCode === orgId || (a as any).employeeId === orgId || (currentEmp && a.employeeName === currentEmp.fullName)) && a.date === today);
                      let checkInLat = att?.checkInLocationLat;
                      let checkInLng = att?.checkInLocationLng;
                      if (!checkInLat || !checkInLng) {
                        const trk = trackingEntries.find(t => (t.employeeId === orgId || (currentEmp && t.employeeName === currentEmp.fullName)) && t.checkInTime.startsWith(today));
                        if (trk?.currentLocation && typeof trk.currentLocation === 'string' && trk.currentLocation.includes(',')) {
                          const parts = trk.currentLocation.split(',');
                          checkInLat = parseFloat(parts[0].trim());
                          checkInLng = parseFloat(parts[1].trim());
                        }
                      }
                      if (checkInLat && checkInLng && m.startLocationLat && m.startLocationLng) {
                        const dist = haversine(checkInLat, checkInLng, m.startLocationLat, m.startLocationLng);
                        if (dist) total += parseFloat(dist);
                      }
                    } else {
                      const prev = mList[idx - 1];
                      const prevLat = prev.endLocationLat || prev.startLocationLat;
                      const prevLng = prev.endLocationLng || prev.startLocationLng;
                      if (prevLat && prevLng && m.startLocationLat && m.startLocationLng) {
                        const dist = haversine(prevLat, prevLng, m.startLocationLat, m.startLocationLng);
                        if (dist) total += parseFloat(dist);
                      }
                    }
                  });
                });
                return total > 0 ? total.toFixed(2) + " km" : "0 km";
              })()}
            </Badge>
          </div>

          {/* Filter Pills */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
            {filterOptions.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border text-foreground hover:bg-muted"
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex flex-col mt-4 space-y-4">
            {filteredMeetings.map((meeting, i) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-row overflow-hidden relative transition-all active:scale-[0.98] mb-3"
              >
                {/* Static primary colored border */}
                <div className="w-1.5 shrink-0 bg-primary"></div>

                <div className="flex-1 p-3.5">
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-[15px] tracking-tight line-clamp-1">{meeting.title}</h3>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal bg-primary/5 border-primary/10 text-primary">{meeting.type}</Badge>
                      </div>
                      <div className="flex items-center text-[11px] text-slate-500 font-medium">
                        <Calendar className="w-3 h-3 mr-1 text-primary/60" /> {meeting.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-2 font-semibold border-0 shadow-none rounded capitalize ${meeting.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          meeting.status === "cancelled" ? "bg-red-100 text-red-700" :
                            meeting.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {meeting.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground -mr-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {(meeting.status === "scheduled" || meeting.status === "in-progress") && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setCancelMeetingId(meeting.id)}
                            >
                              Cancel Meeting
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setExpandedDetails(prev => ({ ...prev, [meeting.id]: !prev[meeting.id] }))}>
                            {expandedDetails[meeting.id] ? "Hide Details" : "View Details"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start Time</div>
                      <div className="flex items-center text-[13px] text-slate-800 font-bold gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary/60" />
                        {meeting.startTime.substring(0, 5)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">End Time</div>
                      <div className="flex items-center text-[13px] text-slate-800 font-bold gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary/60" />
                        {meeting.endTime.substring(0, 5)}
                      </div>
                    </div>
                  </div>

                  {meeting.status === "cancelled" && meeting.cancelReason && (
                    <div className="flex items-start mb-3 p-2.5 bg-red-50 border border-red-100 rounded-md text-red-800 text-[11px]">
                      <span className="font-bold mr-1 shrink-0 uppercase tracking-wider text-[10px] mt-0.5">Cancel Reason:</span>
                      <span className="font-medium">{meeting.cancelReason}</span>
                    </div>
                  )}

                  {/* Actions - Always visible */}
                  {((meeting.mode === "online" && meeting.meetingLink && !isAdmin) || (meeting.status === "scheduled" && !isAdmin)) && (
                    <div className="flex items-center justify-end mb-3 gap-2">
                      {meeting.mode === "online" && meeting.meetingLink && !isAdmin && (
                        <Button variant="outline" size="sm" className="h-8 text-[11px] px-4 bg-primary/5 hover:bg-primary/10 border-primary/20 font-semibold" onClick={() => {
                          if (isCheckedOutToday) {
                            toast({ title: "Checked Out", description: "You have checked out for the day and cannot join meetings.", variant: "destructive" });
                            return;
                          }
                          if (!isCheckedInToday) {
                            toast({ title: "Check-in Required", description: "You must check in for the day before joining a meeting.", variant: "destructive" });
                            return;
                          }
                          window.open(meeting.meetingLink, '_blank');
                        }}>
                          Join
                        </Button>
                      )}
                      {meeting.status === "scheduled" && !isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px] px-4 font-semibold text-destructive hover:bg-destructive/10 border-destructive/20"
                          onClick={() => setCancelMeetingId(meeting.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}

                  {activeFilter === "Expenses" && meeting.momData?.expenses && (
                    <div className="px-0 pb-2 mt-1">
                      <div className="pt-3 border-t border-slate-100">
                        {(() => {
                          const meetEmp = employees.find(e => e.employeeId === meeting.organizerId);
                          return (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {meetEmp?.profilePhoto ? (
                                    <img src={meetEmp.profilePhoto} alt={meetEmp.fullName} className="w-5 h-5 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                                      {(meetEmp?.fullName || meeting.organizer || "U").charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-xs font-semibold text-slate-700">{meetEmp?.fullName || meeting.organizer}</span>
                                </div>
                                <Badge variant={meeting.momData.expenses.status === 'approved' ? 'default' : meeting.momData.expenses.status === 'denied' ? 'destructive' : 'secondary'} className="text-[9px] h-4 px-1.5 py-0">
                                  {meeting.momData.expenses.status.toUpperCase()}
                                </Badge>
                              </div>

                              <div className="flex justify-between items-start bg-slate-50 p-2.5 rounded-md border border-slate-100">
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex gap-4 text-[11px] text-slate-700 font-medium pb-1.5 border-b border-slate-200/60 w-full mb-0.5">
                                    {Number(meeting.momData.expenses.local) > 0 && <span>Local: ₹{meeting.momData.expenses.local}</span>}
                                    {Number(meeting.momData.expenses.hotel) > 0 && <span>Hotel: ₹{meeting.momData.expenses.hotel}</span>}
                                    {Number(meeting.momData.expenses.other) > 0 && <span>Other: ₹{meeting.momData.expenses.other}</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Total:</span>
                                    <span className="font-bold text-primary text-sm">₹{(Number(meeting.momData.expenses.local) || 0) + (Number(meeting.momData.expenses.hotel) || 0) + (Number(meeting.momData.expenses.other) || 0)}</span>
                                  </div>
                                </div>


                                {isAdmin && meeting.momData.expenses.status !== 'pending' && (
                                  <div className="flex gap-1.5 mt-2">
                                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 font-semibold" onClick={() => handleExpenseApproval(meeting.id, 'pending')}>
                                      Cancel Decision
                                    </Button>
                                  </div>
                                )}
                                {isAdmin && (!meeting.momData.expenses.status || meeting.momData.expenses.status === 'pending') && (
                                  <div className="flex gap-1.5 mt-2">
                                    <Button size="sm" className="h-6 text-[10px] px-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleExpenseApproval(meeting.id, 'approved')}>
                                      Approve
                                    </Button>
                                    <Button size="sm" className="h-6 text-[10px] px-2 font-semibold bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleExpenseApproval(meeting.id, 'rejected')}>
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                {meeting.momData.expenses.localBill && (
                                  <div className="relative w-10 h-10 rounded border border-slate-200 overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary transition-all" onClick={() => setPreviewPhoto({ url: meeting.momData.expenses.localBill, title: "Local Conveyance Bill" })}>
                                    <img src={meeting.momData.expenses.localBill} alt="Local Bill" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {meeting.momData.expenses.hotelBill && (
                                  <div className="relative w-10 h-10 rounded border border-slate-200 overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary transition-all" onClick={() => setPreviewPhoto({ url: meeting.momData.expenses.hotelBill, title: "Hotel Expense Bill" })}>
                                    <img src={meeting.momData.expenses.hotelBill} alt="Hotel Bill" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {meeting.momData.expenses.otherBill && (
                                  <div className="relative w-10 h-10 rounded border border-slate-200 overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary transition-all" onClick={() => setPreviewPhoto({ url: meeting.momData.expenses.otherBill, title: "Other Expense Bill" })}>
                                    <img src={meeting.momData.expenses.otherBill} alt="Other Bill" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center -mx-3.5 border-t border-slate-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] text-muted-foreground w-full hover:bg-slate-50/50 rounded-none flex items-center justify-center gap-1 mt-1 font-medium tracking-wide uppercase"
                      onClick={() => setExpandedDetails(prev => ({ ...prev, [meeting.id]: !prev[meeting.id] }))}
                    >
                      {expandedDetails[meeting.id] ? "Hide Details" : "View Details"}
                    </Button>
                  </div>

                  {expandedDetails[meeting.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground mb-1 pt-2">
                        <div className="flex items-start">
                          {meeting.mode === "online" ? (
                            <><Video className="w-3.5 h-3.5 mr-1.5 text-primary/60 shrink-0" /> <span>Online Meeting</span></>
                          ) : (
                            <><MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0 text-primary/60" /> <span className="line-clamp-1">{meeting.location || "TBD"}</span></>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1.5 text-primary/60 shrink-0" />
                          <span className="line-clamp-1">{meeting.organizer}</span>
                        </div>
                      </div>



                      {/* Proof and Details Section */}
                      {(meeting.startPhoto || meeting.endPhoto || meeting.startMeterPhoto || meeting.endMeterPhoto || meeting.actualStartTime || meeting.actualEndTime) && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Camera className="w-3 h-3" /> Camera Proofs
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {meeting.startPhoto && (
                              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-100 shadow-sm min-w-[140px]">
                                <img
                                  src={meeting.startPhoto}
                                  alt="Start"
                                  className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); setPreviewPhoto({ url: meeting.startPhoto!, title: `Start Photo - ${meeting.title}` }); }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Start</span>
                                  {meeting.actualStartTime && (
                                    <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-primary/60" /> {new Date(meeting.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  {meeting.startLocationLat && meeting.startLocationLng && (
                                    <a
                                      href={`https://maps.google.com/?q=${meeting.startLocationLat},${meeting.startLocationLng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9px] text-blue-600 hover:underline flex items-start gap-1 mt-0.5 max-w-[120px]"
                                      onClick={(e) => e.stopPropagation()}
                                      title={meeting.startLocationName || "View Location"}
                                    >
                                      <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2 leading-tight">{meeting.startLocationName || "View Location"}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            {meeting.startMeterPhoto && (
                              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-100 shadow-sm min-w-[140px]">
                                <img
                                  src={meeting.startMeterPhoto}
                                  alt="Start Meter"
                                  className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); setPreviewPhoto({ url: meeting.startMeterPhoto!, title: `Start Meter Photo - ${meeting.title}` }); }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Start Meter</span>
                                  {(meeting.startMeterTime || meeting.actualStartTime) && (
                                    <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-primary/60" /> {new Date((meeting.startMeterTime || meeting.actualStartTime) as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  {meeting.startMeterLocationLat && meeting.startMeterLocationLng && (
                                    <a
                                      href={`https://maps.google.com/?q=${meeting.startMeterLocationLat},${meeting.startMeterLocationLng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9px] text-blue-600 hover:underline flex items-start gap-1 mt-0.5 max-w-[120px]"
                                      onClick={(e) => e.stopPropagation()}
                                      title={meeting.startMeterLocationName || "View Location"}
                                    >
                                      <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2 leading-tight">{meeting.startMeterLocationName || "View Location"}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            {meeting.endPhoto && (
                              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-100 shadow-sm min-w-[140px] max-w-[200px]">
                                <img
                                  src={meeting.endPhoto}
                                  alt="End"
                                  className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); setPreviewPhoto({ url: meeting.endPhoto!, title: `End Photo - ${meeting.title}` }); }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">End</span>
                                  {meeting.actualEndTime && (
                                    <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-primary/60" /> {new Date(meeting.actualEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  {meeting.endLocationLat && meeting.endLocationLng && (
                                    <a
                                      href={`https://maps.google.com/?q=${meeting.endLocationLat},${meeting.endLocationLng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9px] text-blue-600 hover:underline flex items-start gap-1 mt-0.5 max-w-[120px]"
                                      onClick={(e) => e.stopPropagation()}
                                      title={meeting.endLocationName || "View Location"}
                                    >
                                      <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2 leading-tight">{meeting.endLocationName || "View Location"}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            {meeting.endMeterPhoto && (
                              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-100 shadow-sm min-w-[140px] max-w-[200px]">
                                <img
                                  src={meeting.endMeterPhoto}
                                  alt="End Meter"
                                  className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); setPreviewPhoto({ url: meeting.endMeterPhoto!, title: `End Meter Photo - ${meeting.title}` }); }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">End Meter</span>
                                  {(meeting.endMeterTime || meeting.actualStartTime || meeting.actualEndTime) && (
                                    <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-primary/60" /> {new Date((meeting.endMeterTime || meeting.actualStartTime || meeting.actualEndTime) as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  {meeting.endMeterLocationLat && meeting.endMeterLocationLng && (
                                    <a
                                      href={`https://maps.google.com/?q=${meeting.endMeterLocationLat},${meeting.endMeterLocationLng}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9px] text-blue-600 hover:underline flex items-start gap-1 mt-0.5 max-w-[120px]"
                                      onClick={(e) => e.stopPropagation()}
                                      title={meeting.endMeterLocationName || "View Location"}
                                    >
                                      <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2 leading-tight">{meeting.endMeterLocationName || "View Location"}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Duration Section */}
                      {meeting.actualStartTime && (
                        <div className="mt-3 flex items-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/80 rounded-full border border-indigo-100/80">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[11px] font-bold text-indigo-700">
                              Duration: <LiveMeetingDuration startTime={meeting.actualStartTime} endTime={meeting.actualEndTime} />
                            </span>
                          </div>
                        </div>
                      )}

                      {getMeetingDistance(meeting) && (
                        <div className="mt-2 flex items-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50/80 rounded-full border border-green-100/80">
                            <MapPin className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-[11px] font-bold text-green-700">
                              Travel: {getMeetingDistance(meeting)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* MOM Section */}
                      {meeting.status === 'completed' && (
                        <div className="mt-4">
                          {meeting.momData ? (
                            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                              <div
                                className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMom(prev => ({ ...prev, [meeting.id]: !prev[meeting.id] }));
                                }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-primary" />
                                  <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                    Minutes of Meeting
                                  </h5>
                                </div>
                                {expandedMom[meeting.id] ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>

                              {expandedMom[meeting.id] && (
                                <div className="p-3 space-y-3 text-[12px] bg-slate-50/30">
                                  {meeting.momData.agenda && (
                                    <div className="flex gap-2.5">
                                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-semibold text-slate-700 block mb-0.5">Topics Discussed</span>
                                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{meeting.momData.agenda}</p>
                                      </div>
                                    </div>
                                  )}
                                  {meeting.momData.actionItems && (
                                    <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                                      <CheckSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-semibold text-slate-700 block mb-0.5">Action Items</span>
                                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{meeting.momData.actionItems}</p>
                                      </div>
                                    </div>
                                  )}
                                  {meeting.momData.followUpDate && (
                                    <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                                      <CalendarDays className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-semibold text-slate-700 block mb-0.5">Follow-up Date</span>
                                        <p className="text-slate-600">{meeting.momData.followUpDate}</p>
                                      </div>
                                    </div>
                                  )}
                                  {meeting.momData.comments && (
                                    <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                                      <MessageCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-semibold text-slate-700 block mb-0.5">Comments / Feedback</span>
                                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{meeting.momData.comments}</p>
                                      </div>
                                    </div>
                                  )}
                                  {meeting.momData.expenses && (
                                    <div className="pt-3 mt-3 border-t border-slate-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-slate-700">Expenses Declared</span>
                                        <Badge variant={meeting.momData.expenses.status === 'approved' ? 'default' : meeting.momData.expenses.status === 'denied' ? 'destructive' : 'secondary'}>
                                          {meeting.momData.expenses.status.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm mb-3 bg-slate-50 p-2 rounded-md border border-slate-100">
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Local Conv:</span>
                                          <span className="font-medium">₹{meeting.momData.expenses.local || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Hotel:</span>
                                          <span className="font-medium">₹{meeting.momData.expenses.hotel || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Other:</span>
                                          <span className="font-medium">₹{meeting.momData.expenses.other || 0}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 col-span-2">
                                          <span className="font-semibold text-slate-700">Total:</span>
                                          <span className="font-bold text-primary">₹{(Number(meeting.momData.expenses.local) || 0) + (Number(meeting.momData.expenses.hotel) || 0) + (Number(meeting.momData.expenses.other) || 0)}</span>
                                        </div>
                                      </div>

                                      <div className="flex gap-4 mb-3">
                                        {meeting.momData.expenses.localBill && (
                                          <div>
                                            <span className="font-medium text-slate-700 text-xs block mb-1">Local Conveyance Bill</span>
                                            <div
                                              className="relative w-20 h-20 rounded-md border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                              onClick={() => setPreviewPhoto({ url: meeting.momData.expenses.localBill, title: "Local Conveyance Bill" })}
                                            >
                                              <img src={meeting.momData.expenses.localBill} alt="Local Bill" className="w-full h-full object-cover" />
                                            </div>
                                          </div>
                                        )}
                                        {meeting.momData.expenses.hotelBill && (
                                          <div>
                                            <span className="font-medium text-slate-700 text-xs block mb-1">Hotel Bill</span>
                                            <div
                                              className="relative w-20 h-20 rounded-md border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                              onClick={() => setPreviewPhoto({ url: meeting.momData.expenses.hotelBill, title: "Hotel Expense Bill" })}
                                            >
                                              <img src={meeting.momData.expenses.hotelBill} alt="Hotel Bill" className="w-full h-full object-cover" />
                                            </div>
                                          </div>
                                        )}
                                        {meeting.momData.expenses.otherBill && (
                                          <div>
                                            <span className="font-medium text-slate-700 text-xs block mb-1">Other Exp Bill</span>
                                            <div
                                              className="relative w-20 h-20 rounded-md border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                              onClick={() => setPreviewPhoto({ url: meeting.momData.expenses.otherBill, title: "Other Expense Bill" })}
                                            >
                                              <img src={meeting.momData.expenses.otherBill} alt="Other Bill" className="w-full h-full object-cover" />
                                            </div>
                                          </div>
                                        )}
                                      </div>


                                      {isAdmin && meeting.momData.expenses.status !== 'pending' && (
                                        <div className="mt-2">
                                          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleExpenseApproval(meeting.id, 'pending')}>
                                            Cancel Decision
                                          </Button>
                                        </div>
                                      )}
                                      {isAdmin && (!meeting.momData.expenses.status || meeting.momData.expenses.status === 'pending') && (
                                        <div className="mt-2 flex gap-2">
                                          <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleExpenseApproval(meeting.id, 'approved')}>
                                            Approve
                                          </Button>
                                          <Button size="sm" className="w-full text-xs bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleExpenseApproval(meeting.id, 'rejected')}>
                                            Reject
                                          </Button>
                                        </div>
                                      )}
                                      <div className="mt-4 pt-3 border-t border-slate-200">
                                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); openMomModal(meeting.id); }}>
                                          Edit MOM
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            !isAdmin && (
                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs h-9 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openMomModal(meeting.id);
                                  }}
                                >
                                  <FileText className="w-3.5 h-3.5 mr-2" /> Complete Minutes of Meeting
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredMeetings.length === 0 && (
              <div className="col-span-full py-16 text-center flex flex-col items-center justify-center">
                <h3 className="text-[17px] font-bold mb-1 text-foreground">No Meeting Available</h3>
                <p className="text-sm text-muted-foreground">No meetings are scheduled for today.</p>
              </div>
            )}
          </div>


        </div>
      ) : (
        <div className="space-y-5 px-1 pb-8 max-w-md mx-auto">
          <div className="flex items-center gap-3 pb-2 pt-2">
            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-100 -ml-2">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </Button>
            <h2 className="text-xl font-medium text-slate-800">Plan my day</h2>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Client Name</Label>
              <Input value={formData.clientName || ""} onChange={e => setFormData({ ...formData, clientName: e.target.value })} placeholder="e.g. Acme Logistics" className="rounded-full h-12 px-5 border-slate-200 bg-white text-[15px]" />
            </div>

            <div className="flex flex-col">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Meeting Title</Label>
              <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Quarterly Review" className="rounded-full h-12 px-5 border-slate-200 bg-white text-[15px]" />
            </div>

            <div className="flex flex-col">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Type</Label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {['client', 'demo', 'audit', 'sales'].map((t) => {
                   const labelMap: any = { client: 'Client Visit', demo: 'Demo', audit: 'Audit', sales: 'Sales Call' };
                   const isActive = formData.type === t;
                   return (
                     <button
                       key={t}
                       type="button"
                       onClick={() => setFormData({ ...formData, type: t })}
                       className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[14px] transition-colors ${isActive ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-700'}`}
                     >
                       {labelMap[t]}
                     </button>
                   );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Checklist</Label>
              <Select value={formData.checklist} onValueChange={v => setFormData({ ...formData, checklist: v })}>
                <SelectTrigger className="rounded-full h-12 px-5 border-slate-200 bg-white text-[15px]"><SelectValue placeholder="Select Checklist" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial-discussion">Initial Discussion</SelectItem>
                  <SelectItem value="requirements-gathering">Requirements Gathering</SelectItem>
                  <SelectItem value="proposal-presentation">Proposal Presentation</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Date & Time</Label>
              <Input type="datetime-local" value={formData.dateTime || ""} onChange={e => setFormData({ ...formData, dateTime: e.target.value })} className="rounded-full h-12 px-5 border-slate-200 bg-white block w-full text-[15px]" />
            </div>

            <div className="flex flex-col relative">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Destination</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input value={formData.location || ""} onChange={handleLocationChange} placeholder="Search Location" className="rounded-full h-12 pl-11 pr-5 border-slate-200 bg-white text-[15px]" />
              </div>
              {locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden top-[100%] max-h-48 overflow-y-auto">
                  {locationSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer text-sm text-slate-700"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          location: s.display_name,
                          startLocationLat: s.lat,
                          startLocationLng: s.lng
                        });
                        setLocationSuggestions([]);
                      }}
                    >
                      {s.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Priority</Label>
              <div className="flex gap-3">
                {['low', 'medium', 'high'].map((p) => {
                   const isActive = formData.priority === p;
                   return (
                     <button
                       key={p}
                       type="button"
                       onClick={() => setFormData({ ...formData, priority: p })}
                       className={`capitalize px-6 py-2.5 rounded-full text-[14px] transition-colors ${isActive ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-700'}`}
                     >
                       {p}
                     </button>
                   );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</Label>
              <Textarea value={formData.agenda || ""} onChange={e => setFormData({ ...formData, agenda: e.target.value })} placeholder="e.g. Describe the purpose" className="rounded-2xl p-4 border-slate-200 bg-white min-h-[100px] resize-none text-[15px]" />
            </div>

            <div className="pt-4 pb-12">
              <Button onClick={handleSave} className="w-full rounded-full h-14 bg-[#2563eb] hover:bg-blue-700 text-white font-medium text-[16px] shadow-lg shadow-blue-500/25" disabled={isSaving}>
                {isSaving ? "Saving..." : "Plan for the day"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Live Capture Modal */}
      {isCaptureModalOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col m-0 p-0 overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="h-14 bg-primary flex items-center px-4 shrink-0 text-primary-foreground gap-4 z-10 relative pt-safe border-b border-white/10 shadow-sm">
            <button onClick={() => { setIsCaptureModalOpen(false); stopCamera(); setPhotoData(null); }} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-medium text-lg tracking-tight">Camera</span>
          </div>

          {/* Camera Area */}
          <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
            {!photoData ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`} />
                <canvas ref={canvasRef} className="hidden" />

                {/* Live Watermark Overlay (Only visible before capturing) */}
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
                      {captureType === "start" ? "MEETING START" : 
                       captureType === "end" ? "MEETING END" : 
                       (captureType === "vehicleMeter" || captureType === "startMeter") ? "VEHICLE START METER" :
                       captureType === "endMeter" ? "VEHICLE END METER" :
                       "EXPENSE BILL"}
                    </div>
                    <div className="font-semibold text-sm text-white pr-2">
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex flex-col pl-3 border-l-[3px] border-blue-600">
                    <span className="font-medium text-[15px] text-white drop-shadow-md">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[13px] text-white/90 drop-shadow-md line-clamp-2 mt-0.5">
                      {currentLocationName}
                    </span>
                  </div>
                </div>

                {/* Top Actions */}
                <div className="absolute top-4 left-4 flex gap-3 z-50">
                  <button onClick={() => {
                    const newMode = facingMode === "user" ? "environment" : "user";
                    startCamera(newMode);
                  }} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 shadow-lg border border-white/20">
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                  <button onClick={() => { stopCamera(); setIsCaptureModalOpen(false); }} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 shadow-lg border border-white/20">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Overlay Text */}
                <div className="absolute top-8 left-4 right-24 text-center z-10 pointer-events-none">
                  <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 text-white/90 text-sm border border-white/10 inline-block shadow-xl">
                    {captureType === "start" ? "Capture photo to start meeting & log coordinates" : 
                     captureType === "end" ? "Capture photo to end meeting & log coordinates" : 
                     captureType === "startMeter" ? "Capture starting vehicle meter photo" : 
                     captureType === "endMeter" ? "Capture ending vehicle meter photo" : 
                     captureType === "vehicleMeter" ? "Capture vehicle meter photo" : 
                     "Capture photo of bill & log coordinates"}
                  </div>
                </div>

                {/* Capture Button Overlay */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                  <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-2 border-white bg-transparent flex items-center justify-center hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <img src={photoData} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
                <button onClick={() => { setPhotoData(null); startCamera(); }} className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 z-50">
                  <X className="w-5 h-5" />
                </button>

                {/* Submit Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24 z-10 pb-safe">
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" className="flex-1 bg-black/40 border-white/20 text-white hover:bg-white/20 h-12" onClick={() => {
                      setPhotoData(null);
                      startCamera();
                    }}>
                      Retake
                    </Button>
                    <Button type="button" className="flex-1 bg-white text-black hover:bg-slate-200 h-12 flex items-center justify-center" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      submitLiveAction();
                    }} disabled={isUploading}>
                      {isUploading ? "Processing..." : "Submit"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        , document.body)}

      <TimePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={activeTimeField === 'startTime' ? (formData.startTime || "") : (formData.endTime || "")}
        onChange={(val) => {
          if (activeTimeField === 'startTime') {
            setFormData({ ...formData, startTime: val });
          } else {
            setFormData({ ...formData, endTime: val });
          }
        }}
      />
      {/* MOM Form Modal */}
      <Dialog open={momModalOpen} onOpenChange={setMomModalOpen}>
        <DialogContent 
          className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col" 
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>Minutes of Meeting (MOM)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1 -mx-1">
            <div className="space-y-2">
              <Label>Topics Discussed (Agenda) *</Label>
              <Textarea
                placeholder="What was discussed in the meeting?"
                value={momFormData.agenda}
                onChange={(e) => setMomFormData({ ...momFormData, agenda: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Action Items</Label>
              <Textarea
                placeholder="List any action items or tasks assigned..."
                value={momFormData.actionItems}
                onChange={(e) => setMomFormData({ ...momFormData, actionItems: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={momFormData.followUpDate}
                onChange={(e) => setMomFormData({ ...momFormData, followUpDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Comments / Feedback</Label>
              <Textarea
                placeholder="Any client feedback or other remarks..."
                value={momFormData.comments}
                onChange={(e) => setMomFormData({ ...momFormData, comments: e.target.value })}
                rows={2}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-sm mb-3 text-slate-800">Add Expenses (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Label className="text-sm font-semibold text-slate-700">Local Conveyance (₹)</Label>
                  <Input
                    type="number" min="0" placeholder="0" className="bg-white"
                    value={momFormData.expenses.local}
                    onChange={(e) => setMomFormData({
                      ...momFormData,
                      expenses: { ...momFormData.expenses, local: e.target.value }
                    })}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Upload Bill Image</Label>
                    {momFormData.expenses.localBill ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto({ url: momFormData.expenses.localBill, title: "Bill Image" })}>
                          <img src={momFormData.expenses.localBill} alt="Bill" className="w-full h-full object-cover" />
                        </div>
                        <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setMomFormData({ ...momFormData, expenses: { ...momFormData.expenses, localBill: "" } })}>Clear</Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" className="w-full text-[11px] h-9 bg-white hover:bg-slate-50" onClick={() => handleCaptureBill("localBill")}>
                        <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture Bill Photo
                      </Button>
                    )}
                    {momFormData.expenses.localBill && (
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Label className="text-sm font-semibold text-slate-700">Hotel Expenses (₹)</Label>
                  <Input
                    type="number" min="0" placeholder="0" className="bg-white"
                    value={momFormData.expenses.hotel}
                    onChange={(e) => setMomFormData({
                      ...momFormData,
                      expenses: { ...momFormData.expenses, hotel: e.target.value }
                    })}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Upload Bill Image</Label>
                    {momFormData.expenses.hotelBill ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto({ url: momFormData.expenses.hotelBill, title: "Bill Image" })}>
                          <img src={momFormData.expenses.hotelBill} alt="Bill" className="w-full h-full object-cover" />
                        </div>
                        <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setMomFormData({ ...momFormData, expenses: { ...momFormData.expenses, hotelBill: "" } })}>Clear</Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" className="w-full text-[11px] h-9 bg-white hover:bg-slate-50" onClick={() => handleCaptureBill("hotelBill")}>
                        <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture Bill Photo
                      </Button>
                    )}
                    {momFormData.expenses.hotelBill && (
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Label className="text-sm font-semibold text-slate-700">Mobile/Other (₹)</Label>
                  <Input
                    type="number" min="0" placeholder="0" className="bg-white"
                    value={momFormData.expenses.other}
                    onChange={(e) => setMomFormData({
                      ...momFormData,
                      expenses: { ...momFormData.expenses, other: e.target.value }
                    })}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Upload Bill Image</Label>
                    {momFormData.expenses.otherBill ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden cursor-pointer" onClick={() => setPreviewPhoto({ url: momFormData.expenses.otherBill, title: "Bill Image" })}>
                          <img src={momFormData.expenses.otherBill} alt="Bill" className="w-full h-full object-cover" />
                        </div>
                        <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setMomFormData({ ...momFormData, expenses: { ...momFormData.expenses, otherBill: "" } })}>Clear</Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" className="w-full text-[11px] h-9 bg-white hover:bg-slate-50" onClick={() => handleCaptureBill("otherBill")}>
                        <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture Bill Photo
                      </Button>
                    )}
                    {momFormData.expenses.otherBill && (
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setMomModalOpen(false)}>Cancel</Button>
            <Button onClick={submitMomForm} disabled={isSubmittingMom || !momFormData.agenda.trim()} className="bg-blue-600 hover:bg-blue-700">
              {isSubmittingMom ? "Submitting..." : "Submit MOM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal */}
      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md md:max-w-xl p-0 overflow-hidden bg-black/95 border-none" aria-describedby={undefined}>
          <DialogHeader className="p-4 bg-black/50 absolute top-0 left-0 right-0 pointer-events-none border-b border-white/10">
            <DialogTitle className="text-white text-sm font-medium">{previewPhoto?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-0 min-h-[50vh] max-h-[85vh]">
            {previewPhoto && (
              <img src={previewPhoto.url} alt="Preview" className="max-w-full h-auto max-h-[85vh] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Meeting Modal */}
      <Dialog open={!!cancelMeetingId} onOpenChange={(open) => !open && setCancelMeetingId(null)}>
        <DialogContent className="sm:max-w-[425px] w-[90vw] rounded-2xl border-0 overflow-hidden shadow-2xl p-0" aria-describedby={undefined}>
          <DialogHeader className="p-6 pb-0 border-b-0 space-y-3">
            <DialogTitle className="text-xl font-bold tracking-tight text-destructive">Cancel Meeting</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to cancel this meeting? Please provide a reason for cancellation.
            </p>
            <div className="space-y-2">
              <Label className="font-semibold">Reason for Cancellation <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Enter the reason here..."
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="p-4 pt-0 border-t-0 flex flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setCancelMeetingId(null)}>Close</Button>
            <Button variant="destructive" onClick={handleCancelMeeting} disabled={!cancelReasonText.trim() || isUploading}>
              {isUploading ? "Cancelling..." : "Cancel Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingsTab;
