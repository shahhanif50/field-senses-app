import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, CheckCircle2, Clock, X, Navigation, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMasterData } from '@/contexts/MasterDataContext';
import { AttendanceEntry, PortalEmployee as Employee } from '@/data/sharedTypes';
import { RegularizationDrawer } from './RegularizationDrawer';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoData(dataUrl);
        // Stop stream after capture to save resources
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
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
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await res.json();
            if (data.city || data.locality || data.principalSubdivision) {
              const addressParts = [
                data.locality || data.city,
                data.principalSubdivision,
                data.countryName
              ].filter(Boolean);
              if (addressParts.length > 0) {
                address = addressParts.join(', ');
              }
            }
          } catch (e) {
            console.error("Reverse geocoding failed", e);
          }

          setLocationData({
            lat,
            lng,
            address
          });
          setIsLocating(false);
          toast.success("Location acquired successfully");
        },
        (error) => {
          setIsLocating(false);
          toast.error("Failed to get location: " + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      toast.error("Geolocation is not supported by your browser");
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
      if (todayEntry) {
        const updatedEntry = {
          ...todayEntry,
          actualCheckOut: timeString,
          checkOutPhoto: photoData,
          checkOutLocationLat: locationData.lat,
          checkOutLocationLng: locationData.lng,
          totalHoursWorked: 8.5 // Mock calculated hours
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
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md max-h-[95dvh] overflow-y-auto rounded-2xl shadow-xl flex flex-col border border-border"
            >
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  {mode === "checkIn" ? "Check In Proof" : "Check Out Proof"}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4 flex flex-col items-center gap-4 bg-muted/30 flex-1">
                {!photoData ? (
                  <div className="relative w-full h-[40vh] min-h-[240px] max-h-[350px] bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {!stream && (
                      <div className="text-white/50 flex flex-col items-center">
                        <Camera className="w-8 h-8 mb-2 animate-pulse" />
                        <span className="text-sm">Initializing camera...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-[40vh] min-h-[240px] max-h-[350px] rounded-xl overflow-hidden border-2 border-primary/20 shadow-md">
                    <img src={photoData} alt="Proof" className="w-full h-full object-cover" />
                    <Button 
                      onClick={retakePhoto}
                      variant="secondary" 
                      size="sm" 
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
                    >
                      Retake Photo
                    </Button>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="w-full bg-card border rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${locationData ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {isLocating ? <Navigation className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{locationData ? "Location acquired" : isLocating ? "Getting location..." : "Location required"}</p>
                      {locationData && (
                        <p className="text-xs text-muted-foreground line-clamp-2" title={locationData.address || `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`}>
                          {locationData.address || `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {!locationData && !isLocating && (
                    <Button variant="ghost" size="sm" onClick={getLocation}>Retry</Button>
                  )}
                </div>
              </div>

              <div className="p-4 border-t bg-card flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                {!photoData ? (
                  <Button onClick={capturePhoto} disabled={!stream}>
                    <Camera className="w-4 h-4 mr-2" />
                    Capture
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!locationData} className="bg-primary text-primary-foreground">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit {mode === "checkIn" ? "Check In" : "Check Out"}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Regularization Drawer */}
      <RegularizationDrawer 
        open={isRegularizationOpen} 
        onOpenChange={setIsRegularizationOpen} 
      />
    </>
  );
}
