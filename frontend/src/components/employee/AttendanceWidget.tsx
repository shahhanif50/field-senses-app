import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, CheckCircle2, Clock, X, Navigation, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMasterData } from '@/contexts/MasterDataContext';
import { AttendanceEntry, PortalEmployee as Employee } from '@/data/sharedTypes';
import { RegularizationDrawer } from './RegularizationDrawer';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTransparentLogo } from '@/hooks/useTransparentLogo';

const WorkTimer = ({ checkInTime, checkOutTime }: { checkInTime?: string | null, checkOutTime?: string | null }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!checkInTime) return;

    // Handle HH:mm format OR ISO string
    let start = 0;
    if (checkInTime.includes(':') && !checkInTime.includes('T')) {
      const now = new Date();
      const [hours, minutes] = checkInTime.split(':');
      now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      start = now.getTime();
    } else {
      start = new Date(checkInTime).getTime();
    }
    
    if (checkOutTime) {
      let end = 0;
      if (checkOutTime.includes(':') && !checkOutTime.includes('T')) {
        const now = new Date();
        const [hours, minutes] = checkOutTime.split(':');
        now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        end = now.getTime();
      } else {
        end = new Date(checkOutTime).getTime();
      }
      setElapsed(Math.max(0, end - start));
      return;
    }

    // Live counting
    const updateTimer = () => {
      const now = new Date().getTime();
      setElapsed(Math.max(0, now - start));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [checkInTime, checkOutTime]);

  if (!checkInTime) return null;

  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return (
    <div className="font-mono text-xl font-bold text-primary tabular-nums tracking-tight mt-1 flex items-center gap-2 bg-primary/5 p-2 rounded-lg w-fit border border-primary/10">
      <Clock className="w-5 h-5 text-primary/70" />
      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      <span className="text-xs font-medium text-primary/60 uppercase tracking-wider ml-1">worked</span>
    </div>
  );
};

export function AttendanceWidget() {
  const { employees, attendanceEntries, setAttendanceEntries, trackingEntries, setTrackingEntries } = useMasterData();
  const userId = sessionStorage.getItem("userId") || "";
  const employeeId = sessionStorage.getItem("employeeId") || "";
  
  const currentEmployee = useMemo(() => employees.find(e => e.id === userId), [employees, userId]);
  
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Find today's latest attendance entry for this user
  const todayEntry = useMemo(() => {
    const todayEntries = attendanceEntries.filter(
      entry => (entry.employeeCode === employeeId || entry.employeeCode === userId || entry.employeeName === currentEmployee?.fullName) && entry.date === today
    );
    
    if (todayEntries.length === 0) return undefined;
    
    // Sort by checkInTime descending (newest first) to get the most recent session
    return todayEntries.sort((a, b) => {
      const timeA = a.actualCheckIn || "";
      const timeB = b.actualCheckIn || "";
      return timeB.localeCompare(timeA);
    })[0];
  }, [attendanceEntries, employeeId, userId, currentEmployee, today]);

  const todayTracking = useMemo(() => {
    if (!employeeId) return undefined;
    // We want the most recent check-in for today
    const todays = trackingEntries.filter(e => 
      (e.employeeId === employeeId || e.employeeName === currentEmployee?.fullName) && 
      e.checkInTime && 
      e.checkInTime.startsWith(today)
    );
    return todays.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())[0];
  }, [trackingEntries, employeeId, currentEmployee, today]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegularizationOpen, setIsRegularizationOpen] = useState(false);
  const [mode, setMode] = useState<"checkIn" | "checkOut">("checkIn");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const logoSrc = useTransparentLogo();
  const [locationData, setLocationData] = useState<{lat: number, lng: number, address?: string} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const isCheckedIn = !!todayEntry?.actualCheckIn;
  const isCheckedOut = !!todayEntry?.actualCheckOut;

  useEffect(() => {
    // If modal closes, stop camera
    if (!isModalOpen && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [isModalOpen, stream]);

  // Only show if attendance is required
  if (!currentEmployee?.attendanceRequired) {
    return null;
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Could not access camera. Please allow permissions.");
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
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Scale is directly the device pixel ratio, making text mathematically identical to CSS
        const scale = dpr;
        const leftX = 16 * scale;
        
        const now = new Date();
        const timeStr = format(now, "hh:mm a");
        const dateStr = format(now, "EEE, MMM dd, yyyy");
        const locationStr = locationData?.address || "Unknown Location";
        const type = mode === "checkIn" ? "CLOCK IN" : "CLOCK OUT";
        
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPhotoData(dataUrl);
            // Stop stream after capture to save resources
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              setStream(null);
            }
          });
        });
      }
    }
  };

  const retakePhoto = () => {
    setPhotoData(null);
    startCamera();
  };

  const getLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          try {
            // Try Nominatim first
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.display_name) {
                address = data.display_name;
              }
            }
          } catch (e) {
            console.error("Nominatim failed, trying fallback...", e);
            try {
              const fbRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
              const fbData = await fbRes.json();
              if (fbData.city || fbData.locality || fbData.principalSubdivision) {
                const fbParts = [
                  fbData.locality || fbData.city,
                  fbData.principalSubdivision,
                  fbData.countryName
                ].filter(Boolean);
                if (fbParts.length > 0) address = fbParts.join(', ');
              }
            } catch (fbErr) {
              console.error("Fallback reverse geocoding also failed", fbErr);
            }
          }

          setLocationData({
            lat,
            lng,
            address
          });
          setIsLocating(false);
          toast.success("Location acquired successfully", { position: "top-center", duration: 2000 });
        },
        (error) => {
          setIsLocating(false);
          toast.error("Failed to get location: " + error.message, { position: "top-center", duration: 3000 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      toast.error("Geolocation is not supported by your browser", { position: "top-center", duration: 3000 });
    }
  };

  const openCheckInModal = () => {
    setMode("checkIn");
    setPhotoData(null);
    setLocationData(null);
    setIsModalOpen(true);
    startCamera();
    getLocation();
  };

  const openCheckOutModal = () => {
    setMode("checkOut");
    setPhotoData(null);
    setLocationData(null);
    setIsModalOpen(true);
    startCamera();
    getLocation();
  };

  const handleSubmit = async () => {
    if (!photoData) {
      toast.error("Please capture a photo for proof.");
      return;
    }
    if (!locationData) {
      toast.error("Please allow location access to continue.");
      return;
    }

    const timeString = format(new Date(), "HH:mm");

    if (mode === "checkIn") {
      const newEntry: AttendanceEntry = {
        id: `att-${Date.now()}`,
        employeeName: currentEmployee.fullName,
        employeeCode: employeeId,
        designation: currentEmployee.designation || "Employee",
        date: today,
        scheduledShift: "09:00 - 18:00",
        actualCheckIn: timeString,
        actualCheckOut: null,
        lateArrival: 0,
        earlyExit: 0,
        totalHoursWorked: 0,
        status: "present",
        checkInPhoto: photoData,
        checkInLocationLat: locationData.lat,
        checkInLocationLng: locationData.lng,
      };

      const newTrackingEntry = {
        id: `trk-${Date.now()}`,
        employeeId: employeeId,
        employeeName: currentEmployee.fullName,
        role: currentEmployee.designation || "Employee",
        currentLocation: `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`,
        checkInTime: new Date().toISOString(),
        checkOutTime: null,
        travelDistance: 0,
        idleTime: 0,
        planVsActual: 0,
        purpose: "Daily Routine",
        clientVisits: [],
        plannedRouteSummary: [],
        routePath: [],
        vehicleType: "Bike",
        reimbursementAmount: 0,
        timeSpentOnSite: 0,
        status: "online" as const,
        date: today,
        checkInPhoto: photoData,
      };
      
      // Update local state optimistically
      setAttendanceEntries(prev => [newEntry, ...prev]);
      setTrackingEntries(prev => [newTrackingEntry, ...prev]);
      
      // Make API call
      try {
        const attRes = await fetch('/api/ops/attendance/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify(newEntry)
        });
        if (attRes.ok) {
          const savedAtt = await attRes.json();
          setAttendanceEntries(prev => prev.map(e => e.id === newEntry.id ? savedAtt : e));
        }

        const trkRes = await fetch('/api/ops/tracking-entries/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify(newTrackingEntry)
        });
        if (trkRes.ok) {
          const savedTrk = await trkRes.json();
          setTrackingEntries(prev => prev.map(e => e.id === newTrackingEntry.id ? savedTrk : e));
        }
        
        toast.success("Checked in successfully!");
      } catch (error) {
        toast.error("Saved locally. Backend sync failed.");
      }
    } else {
      // Check Out
      const calculateHours = (inTimeStr: string, outTimeStr: string) => {
        try {
          const parseTime = (timeStr: string) => {
            if (!timeStr) return new Date();
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            let hrs = parseInt(hours, 10);
            if (modifier === 'PM' && hrs < 12) hrs += 12;
            if (modifier === 'AM' && hrs === 12) hrs = 0;
            const d = new Date();
            d.setHours(hrs, parseInt(minutes, 10), 0, 0);
            return d;
          };
          const start = parseTime(inTimeStr);
          const end = parseTime(outTimeStr);
          const diffMs = end.getTime() - start.getTime();
          if (diffMs < 0) return 0;
          return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        } catch (e) {
          return 0;
        }
      };

      const calculatedHours = calculateHours(todayEntry?.actualCheckIn || "", timeString);

      if (todayEntry) {
        const updatedEntry = {
          ...todayEntry,
          actualCheckOut: timeString,
          checkOutPhoto: photoData,
          checkOutLocationLat: locationData.lat,
          checkOutLocationLng: locationData.lng,
          totalHoursWorked: calculatedHours
        };

        if (todayTracking) {
          const updatedTracking = {
            ...todayTracking,
            checkOutTime: new Date().toISOString(),
            status: "completed" as const,
            checkOutPhoto: photoData,
          };
          setTrackingEntries(prev => prev.map(e => e.id === todayTracking.id ? updatedTracking : e));
          
          fetch(`/api/ops/tracking-entries/${todayTracking.id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify({
              checkOutTime: updatedTracking.checkOutTime,
              status: updatedTracking.status,
              checkOutPhoto: updatedTracking.checkOutPhoto
            })
          }).catch(console.error);
        } else {
          // Recovery: If tracking entry doesn't exist due to previous bug, create it on checkout
          const newTrackingEntry = {
            id: `trk-${Date.now()}`,
            employeeId: employeeId,
            employeeName: currentEmployee.fullName,
            role: currentEmployee.designation || "Employee",
            currentLocation: `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`,
            checkInTime: new Date().toISOString(),
            checkOutTime: new Date().toISOString(),
            travelDistance: 0,
            idleTime: 0,
            planVsActual: 0,
            purpose: "Daily Routine",
            clientVisits: [],
            plannedRouteSummary: [],
            routePath: [],
            vehicleType: "Bike",
            reimbursementAmount: 0,
            timeSpentOnSite: 0,
            status: "completed" as const,
            date: today,
            checkInPhoto: null,
            checkOutPhoto: photoData,
          };
          setTrackingEntries(prev => [newTrackingEntry, ...prev]);
          fetch('/api/ops/tracking-entries/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify(newTrackingEntry)
          }).catch(console.error);
        }

        setAttendanceEntries(prev => prev.map(e => e.id === todayEntry.id ? updatedEntry : e));

        try {
          await fetch(`/api/ops/attendance/${todayEntry.id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify(updatedEntry)
          });
          toast.success("Checked out successfully!");
        } catch (error) {
          toast.error("Saved locally. Backend sync failed.");
        }
      }
    }

    setIsModalOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Daily Attendance</h3>
            <p className="text-sm text-muted-foreground">
              {isCheckedOut 
                ? "Attendance completed for today." 
                : isCheckedIn 
                  ? `Checked in at ${todayEntry?.actualCheckIn}. Ready to wrap up?` 
                  : "Please check in to start your day."}
            </p>
            {(isCheckedIn || isCheckedOut) && (
              <WorkTimer 
                checkInTime={todayTracking?.checkInTime || todayEntry?.actualCheckIn} 
                checkOutTime={todayTracking?.checkOutTime || todayEntry?.actualCheckOut} 
              />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          {!isCheckedIn && (
            <Button onClick={openCheckInModal} className="w-full sm:w-auto bg-primary text-primary-foreground">
              <Camera className="w-4 h-4 mr-2 shrink-0" />
              <span className="whitespace-nowrap">Check In</span>
            </Button>
          )}
          {isCheckedIn && !isCheckedOut && (
            <Button onClick={openCheckOutModal} variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/5">
              <Camera className="w-4 h-4 mr-2 shrink-0" />
              <span className="whitespace-nowrap">Check Out</span>
            </Button>
          )}
          {isCheckedOut && (
            <Button size="lg" variant="outline" disabled className="w-full sm:w-auto">
              Completed
            </Button>
          )}
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => setIsRegularizationOpen(true)} 
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Regularize
          </Button>
        </div>
      </motion.div>

      {/* Check In / Out Modal */}
      {isModalOpen && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col m-0 p-0 overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-primary flex items-center px-4 shrink-0 text-primary-foreground gap-4 z-10 relative pt-safe border-b border-white/10 shadow-sm">
              <button onClick={() => setIsModalOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-medium text-lg tracking-tight">Camera</span>
            </div>
            
            {/* Camera Area */}
            <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
              {!photoData ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                      <Camera className="w-8 h-8 mb-2 animate-pulse" />
                      <span className="text-sm">Initializing camera...</span>
                    </div>
                  )}
                  {/* Live Watermark Overlay (Only visible before capturing) */}
                  {logoSrc && (
                    <img 
                      src={logoSrc} 
                      alt="Logo" 
                      className="absolute top-4 right-4 h-12 w-auto object-contain z-10 pointer-events-none"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  <div className="absolute bottom-56 left-4 right-4 flex flex-col items-start gap-3 pointer-events-none z-10">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-1.5 py-1.5 rounded-lg border border-white/10 shadow-lg">
                      <div className="bg-blue-600 px-2 py-0.5 rounded text-white font-bold text-[11px] tracking-wide">
                        {mode === "checkIn" ? "CLOCK IN" : "CLOCK OUT"}
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
                        {locationData?.address || (isLocating ? "Locating..." : "Unknown Location")}
                      </span>
                    </div>
                  </div>
                  
                  {/* Capture Button Overlay */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                     <button onClick={capturePhoto} disabled={!stream} className="w-16 h-16 rounded-full border-2 border-white bg-transparent flex items-center justify-center hover:bg-white/10 transition-colors">
                       <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                         <Camera className="w-6 h-6 text-white" />
                       </div>
                     </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={photoData} alt="Proof" className="absolute inset-0 w-full h-full object-cover" />
                  <button onClick={retakePhoto} className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 z-50">
                    <X className="w-5 h-5" />
                  </button>
                  
                  {/* Submit Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24 z-10">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 mb-4 flex items-center gap-3 text-white border border-white/20">
                      <div className={`p-2 rounded-lg ${locationData ? 'bg-success/20 text-green-400' : 'bg-warning/20 text-yellow-400'}`}>
                        {isLocating ? <Navigation className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="text-sm flex-1">
                        <p className="font-medium">{locationData ? "Location acquired" : isLocating ? "Getting location..." : "Location required"}</p>
                        {locationData && (
                          <p className="text-xs text-white/80 line-clamp-2" title={locationData.address || `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`}>
                            {locationData.address || `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`}
                          </p>
                        )}
                      </div>
                      {!locationData && !isLocating && (
                        <Button variant="ghost" size="sm" onClick={getLocation} className="text-white hover:bg-white/20">Retry</Button>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1 bg-black/40 border-white/20 text-white hover:bg-white/20 h-12" onClick={retakePhoto}>
                        Retake
                      </Button>
                      <Button className="flex-1 bg-white text-black hover:bg-slate-200 h-12" onClick={handleSubmit} disabled={!locationData || isLocating}>
                        Submit
                      </Button>
                    </div>
                  </div>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        , document.body)}

      {/* Regularization Drawer */}
      <RegularizationDrawer 
        open={isRegularizationOpen} 
        onOpenChange={setIsRegularizationOpen} 
      />
    </>
  );
}
