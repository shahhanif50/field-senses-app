import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Clock, MapPin, Video, Users, Search, MoreVertical, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

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
}

export function MeetingsTab() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const employeeId = sessionStorage.getItem("employeeId") || "EMP-UNKNOWN";
  const employeeName = sessionStorage.getItem("userName") || "Unknown User";

  const [formData, setFormData] = useState<Partial<Meeting>>({
    type: "internal",
    mode: "online",
    reminder: "15min",
    organizer: employeeName,
    organizerId: employeeId,
    attendees: [],
  });

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
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/ops/meetings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.agenda?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {!isModalOpen ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Meeting Scheduler</h2>
              <p className="text-muted-foreground mt-1">Plan, schedule, and manage your meetings and appointments.</p>
            </div>
            <Button onClick={() => {
              setFormData({ type: "internal", mode: "online", reminder: "15min", organizer: employeeName, organizerId: employeeId, attendees: [] });
              setIsModalOpen(true);
            }} className="gradient-btn gap-2">
              <Plus className="w-4 h-4" /> Schedule Meeting
            </Button>
          </div>

          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search meetings..." 
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredMeetings.map((meeting, i) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-primary group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="bg-primary/5">{meeting.type}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                    <h3 className="font-bold text-lg mb-4 text-foreground line-clamp-1">{meeting.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2 text-primary" /> {meeting.date}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2 text-primary" /> {meeting.startTime} - {meeting.endTime}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {meeting.mode === "online" ? (
                           <><Video className="w-4 h-4 mr-2 text-primary" /> Online Meeting</>
                        ) : (
                           <><MapPin className="w-4 h-4 mr-2 text-primary" /> {meeting.location || "TBD"}</>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{meeting.organizer} + {meeting.attendees?.length || 0}</span>
                      </div>
                      {meeting.mode === "online" && meeting.meetingLink && (
                        <Button variant="outline" size="sm" className="h-7 text-xs bg-primary/5 hover:bg-primary/10 border-primary/20" onClick={() => window.open(meeting.meetingLink, '_blank')}>
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {filteredMeetings.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-1">No Meetings Found</h3>
                <p className="text-muted-foreground">There are no upcoming meetings matching your criteria.</p>
              </div>
            )}
          </div>
        </>
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
                <Label>Mode</Label>
                <Select value={formData.mode} onValueChange={v => setFormData({ ...formData, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online / Virtual</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={formData.date || ""} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time <span className="text-destructive">*</span></Label>
                  <Input type="time" value={formData.startTime || ""} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Time <span className="text-destructive">*</span></Label>
                  <Input type="time" value={formData.endTime || ""} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>

              {formData.mode !== "in-person" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Meeting Link</Label>
                  <Input value={formData.meetingLink || ""} onChange={e => setFormData({ ...formData, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." />
                </div>
              )}

              {formData.mode !== "online" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Location / Room</Label>
                  <Input value={formData.location || ""} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Conference Room A..." />
                </div>
              )}

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
    </div>
  );
}
