import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Clock, MapPin, Video, Users, Search, MoreVertical, X, Check, Camera, FileText, MessageSquare, CheckSquare, CalendarDays, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMasterData } from "@/contexts/MasterDataContext";
import { TimePickerDialog } from "@/components/ui/time-picker-dialog";

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
  priority?: string;
  createdAt?: string;
}

export function MeetingsTab() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
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
  const [momFormData, setMomFormData] = useState({ agenda: "", actionItems: "", followUpDate: "", comments: "" });
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
  
  const { trackingEntries, regularizationRequests, employees } = useMasterData();
  const userId = sessionStorage.getItem("userId") || "";
  const today = new Date().toISOString().split('T')[0];
  const userRole = sessionStorage.getItem("userRole") || "Employee";
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isManagement = ["admin", "manager", "sr_mgr", "head"].includes(userRole.toLowerCase());
  const isAdmin = userRole.toLowerCase() === "admin" || isGlobalAdmin;
  const bypassCheckIn = isManagement || isGlobalAdmin;
  const sessionEmpId = sessionStorage.getItem("employeeId") || "";
  
  const isRegularizedToday = regularizationRequests.some(r => 
    (r.employeeId === sessionEmpId || r.employeeId === userId) && 
    r.date === today && 
    r.status === 'Approved'
  );
  const isCheckedInToday = bypassCheckIn || trackingEntries.some(t => (t.employeeId === userId || t.employeeId === sessionEmpId) && t.checkInTime.startsWith(today)) || isRegularizedToday;

  // Capture Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureType, setCaptureType] = useState<"start" | "end">("start");
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const employeeId = sessionStorage.getItem("employeeId") || "EMP-UNKNOWN";
  const employeeName = sessionStorage.getItem("userName") || "Unknown User";

  const [formData, setFormData] = useState<Partial<Meeting>>({
    type: "client",
    mode: "in-person",
    startTime: (() => {
      const d = new Date();
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    })(),
    endTime: (() => {
      const d = new Date();
      d.setHours(d.getHours() + 1);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    })(),
    reminder: "15min",
    organizer: employeeName,
    organizerId: employeeId,
    attendees: [],
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

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`/api/ops/meetings/`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.location) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        agenda: formData.agenda || "Client Meeting",
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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhotoData(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const handleLiveAction = (meetingId: string, type: "start" | "end") => {
    if (!isCheckedInToday) {
      toast({ title: "Check-in Required", description: `You must check in for the day before you can ${type} a meeting.`, variant: "destructive" });
      return;
    }
    setActiveMeetingId(meetingId);
    setCaptureType(type);
    setPhotoData(null);
    setIsCaptureModalOpen(true);
    setTimeout(startCamera, 100);
  };

  const submitLiveAction = async () => {
    if (!photoData || !activeMeetingId) return;
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
            ? { status: "in-progress", actualStartTime: now, startPhoto: photoData, startLocationLat: lat, startLocationLng: lng, startLocationName: locationName }
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

  const filterOptions = ["All", "Upcoming", "In Progress", "Completed", "Cancelled"];

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
                if (!isCheckedInToday) {
                  toast({ title: "Check-in Required", description: "You must check in for the day before creating a meeting.", variant: "destructive" });
                  return;
                }
                const now = new Date();
                const currTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                now.setHours(now.getHours() + 1);
                const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                
                setFormData({ type: "client", mode: "in-person", startTime: currTime, endTime: endTime, reminder: "15min", organizer: employeeName, organizerId: employeeId, attendees: [] });
                setLocationSuggestions([]);
                setIsModalOpen(true);
              }} 
              className="h-12 rounded-full px-5 shadow-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center gap-2 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">New Meeting</span>
            </Button>
          </div>

          {/* Filter Pills */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
            {filterOptions.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                  activeFilter === filter 
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
                        className={`text-[10px] h-5 px-2 font-semibold border-0 shadow-none rounded capitalize ${
                          meeting.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          meeting.status === "cancelled" ? "bg-red-100 text-red-700" :
                          meeting.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {meeting.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground -mr-2"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start Time</div>
                      <div className="flex items-center text-[13px] text-slate-800 font-bold gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary/60" />
                        {meeting.startTime.substring(0,5)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">End Time</div>
                      <div className="flex items-center text-[13px] text-slate-800 font-bold gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary/60" />
                        {meeting.endTime.substring(0,5)}
                      </div>
                    </div>
                  </div>

                  {/* Actions - Always visible */}
                  {((meeting.mode === "online" && meeting.meetingLink && !isAdmin) || (meeting.mode !== "online" && meeting.status !== "completed" && !isAdmin)) && (
                    <div className="flex items-center justify-end mb-3 gap-2">
                      {meeting.mode === "online" && meeting.meetingLink && !isAdmin && (
                        <Button variant="outline" size="sm" className="h-8 text-[11px] px-4 bg-primary/5 hover:bg-primary/10 border-primary/20 font-semibold" onClick={() => {
                          if (!isCheckedInToday) {
                            toast({ title: "Check-in Required", description: "You must check in for the day before joining a meeting.", variant: "destructive" });
                            return;
                          }
                          window.open(meeting.meetingLink, '_blank');
                        }}>
                          Join
                        </Button>
                      )}
                      {meeting.mode !== "online" && meeting.status !== "completed" && !isAdmin && (
                        <Button 
                          variant={meeting.status === "in-progress" ? "destructive" : "default"} 
                          size="sm" 
                          className="h-8 text-[11px] px-5 font-semibold" 
                          onClick={() => handleLiveAction(meeting.id, meeting.status === "in-progress" ? "end" : "start")}
                        >
                          {meeting.status === "in-progress" ? "End" : "Start"}
                        </Button>
                      )}
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
                {(meeting.startPhoto || meeting.endPhoto || meeting.actualStartTime || meeting.actualEndTime) && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Camera className="w-3 h-3" /> Camera Proofs
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {meeting.startPhoto && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-100 shadow-sm min-w-[140px]">
                          <img src={meeting.startPhoto} alt="Start" className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200" />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Start</span>
                            {meeting.actualStartTime && (
                              <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-primary/60" /> {new Date(meeting.actualStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                      {meeting.endPhoto && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-100 shadow-sm min-w-[140px] max-w-[200px]">
                          <img src={meeting.endPhoto} alt="End" className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200" />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">End</span>
                            {meeting.actualEndTime && (
                              <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-primary/60" /> {new Date(meeting.actualEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                    </div>
                  </div>
                )}

                {/* Duration Section */}
                {meeting.actualStartTime && meeting.actualEndTime && (
                  <div className="mt-3 flex items-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/80 rounded-full border border-indigo-100/80">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[11px] font-bold text-indigo-700">
                        Duration: {calculateDuration(meeting.actualStartTime, meeting.actualEndTime)}
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
                              setActiveMomMeetingId(meeting.id);
                              setMomFormData({ agenda: "", actionItems: "", followUpDate: "", comments: "" });
                              setMomModalOpen(true);
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
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-2xl font-bold">Schedule New Meeting</h2>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gradient-btn" disabled={isSaving}>
                {isSaving ? "Saving..." : "Schedule Meeting"}
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Meeting Title <span className="text-destructive">*</span></Label>
                <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Weekly Sync" />
              </div>

              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Sync</SelectItem>
                    <SelectItem value="client">Client Meeting</SelectItem>
                    <SelectItem value="sales">Sales Pitch</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={formData.date || ""} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label>Assign To (Employee)</Label>
                  <Select 
                    value={formData.organizerId} 
                    onValueChange={(val) => {
                      const selectedEmp = employees.find(e => e.employeeId === val);
                      if (selectedEmp) {
                        setFormData({ 
                          ...formData, 
                          organizerId: selectedEmp.employeeId, 
                          organizer: selectedEmp.fullName
                        });
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
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

              <div className="space-y-2">
                <Label>Start Time <span className="text-destructive">*</span></Label>
                <div className="relative cursor-pointer" onClick={() => { setActiveTimeField('startTime'); setPickerOpen(true); }}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><Clock className="w-4 h-4 text-muted-foreground" /></div>
                  <Input type="text" readOnly value={formData.startTime || ""} className="pl-9 cursor-pointer caret-transparent" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>End Time <span className="text-destructive">*</span></Label>
                <div className="relative cursor-pointer" onClick={() => { setActiveTimeField('endTime'); setPickerOpen(true); }}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><Clock className="w-4 h-4 text-muted-foreground" /></div>
                  <Input type="text" readOnly value={formData.endTime || ""} className="pl-9 cursor-pointer caret-transparent" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2 relative">
                <Label>Client Location <span className="text-destructive">*</span></Label>
                <Input value={formData.location || ""} onChange={handleLocationChange} placeholder="Search Client Address or Name..." />
                
                {locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg overflow-hidden top-[100%] max-h-48 overflow-y-auto">
                    {locationSuggestions.map((s, i) => (
                      <div 
                        key={i} 
                        className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => {
                          setFormData({ ...formData, location: s.display_name });
                          setLocationSuggestions([]);
                        }}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Agenda / Description</Label>
                <Textarea value={formData.agenda || ""} onChange={e => setFormData({ ...formData, agenda: e.target.value })} placeholder="What's the meeting about?" className="min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <Label>Reminder</Label>
                <Select value={formData.reminder} onValueChange={v => setFormData({ ...formData, reminder: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No reminder</SelectItem>
                    <SelectItem value="15min">15 minutes before</SelectItem>
                    <SelectItem value="30min">30 minutes before</SelectItem>
                    <SelectItem value="1hour">1 hour before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Capture Modal */}
      <Dialog open={isCaptureModalOpen} onOpenChange={(open) => {
        setIsCaptureModalOpen(open);
        if (!open) {
          stopCamera();
          setPhotoData(null);
        }
      }}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{captureType === "start" ? "Start Meeting" : "End Meeting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 flex flex-col items-center justify-center">
            <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 shadow-inner flex items-center justify-center">
              {!photoData ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-4 border-dashed border-white/40 pointer-events-none rounded-xl" />
                  
                  {/* Camera overlay UI */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button 
                      onClick={capturePhoto} 
                      className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/40 backdrop-blur-md border-2 border-white shadow-lg p-0 flex items-center justify-center"
                    >
                      <div className="w-10 h-10 bg-white rounded-full"></div>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="relative w-full h-full">
                  <img src={photoData} alt="Captured" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="text-white flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-sm">Photo Captured</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-slate-500 text-center px-4">
              {captureType === "start" 
                ? "Please take a photo at the client location to start the meeting. Your GPS coordinates will be automatically recorded." 
                : "Please take a photo to end the meeting. Your current GPS coordinates will be recorded as proof of completion."}
            </p>
          </div>
          <DialogFooter className="sm:justify-between flex-row">
            {photoData ? (
              <Button variant="outline" onClick={() => {
                setPhotoData(null);
                startCamera();
              }}>Retake Photo</Button>
            ) : (
              <div />
            )}
            
            <Button 
              onClick={submitLiveAction} 
              disabled={!photoData || isUploading}
              className={captureType === "start" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {isUploading ? "Processing..." : (captureType === "start" ? "Start & Record Location" : "End & Record Location")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Minutes of Meeting (MOM)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMomModalOpen(false)}>Cancel</Button>
            <Button onClick={submitMomForm} disabled={isSubmittingMom || !momFormData.agenda.trim()}>
              {isSubmittingMom ? "Submitting..." : "Submit MOM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
