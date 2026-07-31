import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Calendar, Clock, MapPin, Image as ImageIcon, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface DailyTrackingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  date: string;
  initialData?: any;
}

const LocationCell = ({ value, label }: { value: string | null; label: string }) => {
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

  if (!value) return <span className="text-sm text-muted-foreground">Not recorded</span>;

  const displayLocation = address || (isCoords ? "Loading..." : value);

  return (
    <div className="flex items-start gap-2 mt-2">
      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label} Location</p>
        {isCoords ? (
          <a 
            href={`https://www.google.com/maps?q=${value.replace(/\s+/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
            title="View on Maps"
          >
            {displayLocation}
          </a>
        ) : (
          <span className="text-sm font-medium">{displayLocation}</span>
        )}
      </div>
    </div>
  );
};

export function DailyTrackingDetailModal({
  isOpen,
  onClose,
  employeeId,
  date,
  initialData,
}: DailyTrackingDetailModalProps) {
  const [modalDate, setModalDate] = useState(date);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen && date) {
      setModalDate(date);
    }
  }, [isOpen, date]);

  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["dailyTracking", employeeId, modalDate],
    queryFn: async () => {
      const response = await api.get(`/api/ops/tracking-entries/daily-tracking/${employeeId}/?date=${modalDate}`);
      return response.data;
    },
    enabled: isOpen && !!employeeId && !!modalDate,
  });

  const apiEmployee = trackingData?.employee || {};
  
  // Use initialData if we are viewing the same date it was clicked on, 
  // because initialData contains the EXACT entry clicked (handling multiple entries per day)
  const isSameDate = initialData && initialData.date === modalDate;
  const employee = isSameDate ? {
    name: initialData.employeeName || apiEmployee.name || "",
    role: initialData.role || apiEmployee.role || "",
    department: initialData.department || apiEmployee.department || "",
    checkInTime: initialData.checkInTime || apiEmployee.checkInTime || "",
    checkOutTime: initialData.checkOutTime || apiEmployee.checkOutTime || "",
    checkInLocation: initialData.checkInLocation || apiEmployee.checkInLocation || null,
    checkOutLocation: initialData.checkOutLocation || apiEmployee.checkOutLocation || null,
    checkInPhoto: initialData.checkInPhoto || apiEmployee.checkInPhoto || null,
    checkOutPhoto: initialData.checkOutPhoto || apiEmployee.checkOutPhoto || null,
    meterPhoto: initialData.meterPhoto || apiEmployee.meterPhoto || null,
  } : apiEmployee;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-card border border-border shadow-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
            <div>
              <h2 className="text-2xl font-bold">{employee.name || "Loading..."}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{employee.role || "Employee"}</span>
                {employee.department && (
                  <>
                    <span>&bull;</span>
                    <span>{employee.department}</span>
                  </>
                )}
                <span>&bull;</span>
                <div className="flex items-center gap-2 bg-background border px-2 py-1 rounded-md">
                  <Calendar className="w-4 h-4 text-primary" />
                  <Input 
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="h-6 text-xs w-auto border-0 bg-transparent p-0 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Check In Card */}
                <Card className="border-border shadow-sm overflow-hidden">
                  <div className="bg-success/10 py-3 px-6 border-b border-success/20">
                    <h3 className="font-semibold text-success-700 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Check In Details
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Time</p>
                          <p className="text-xl font-bold">{employee.checkInTime || "Not Checked In"}</p>
                        </div>
                      </div>

                      <LocationCell value={employee.checkInLocation} label="Check-in" />
                      
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          Camera Proofs
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                          {employee.checkInPhoto && (
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-100 shadow-sm min-w-[140px]">
                              <img
                                src={employee.checkInPhoto}
                                alt="Check In"
                                className="w-10 h-10 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setFullScreenPhoto(employee.checkInPhoto)}
                              />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Check-in</span>
                                <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary/60" /> {employee.checkInTime}
                                </span>
                              </div>
                            </div>
                          )}

                          {employee.meterPhoto && (
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-100 shadow-sm min-w-[140px]">
                              <img
                                src={employee.meterPhoto}
                                alt="Start Meter"
                                className="w-10 h-10 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setFullScreenPhoto(employee.meterPhoto)}
                              />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Start Meter</span>
                                <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary/60" /> {employee.checkInTime}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {!employee.checkInPhoto && !employee.meterPhoto && (
                            <div className="rounded-lg w-full border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center h-32">
                              <p className="text-sm text-muted-foreground">No photos available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Check Out Card */}
                <Card className="border-border shadow-sm overflow-hidden">
                  <div className="bg-warning/10 py-3 px-6 border-b border-warning/20">
                    <h3 className="font-semibold text-warning-700 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Check Out Details
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Time</p>
                          <p className="text-xl font-bold">{employee.checkOutTime || "Not Checked Out"}</p>
                        </div>
                      </div>

                      <LocationCell value={employee.checkOutLocation} label="Check-out" />
                      
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          Camera Proofs
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {employee.checkOutPhoto ? (
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-100 shadow-sm min-w-[140px]">
                              <img
                                src={employee.checkOutPhoto}
                                alt="Check Out"
                                className="w-10 h-10 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setFullScreenPhoto(employee.checkOutPhoto)}
                              />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Check-out</span>
                                <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary/60" /> {employee.checkOutTime}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg w-full border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center h-32">
                              <p className="text-sm text-muted-foreground">No photo available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Full Screen Photo Portal */}
      {fullScreenPhoto && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center backdrop-blur-sm" onClick={() => setFullScreenPhoto(null)}>
          <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors" onClick={() => setFullScreenPhoto(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={fullScreenPhoto} alt="Full Screen" className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl" />
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
}
