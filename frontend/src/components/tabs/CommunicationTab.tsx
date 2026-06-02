import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Calendar, Users, Send, Plus, Video, MapPin, Clock, Search, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassModal } from '@/components/ui/GlassModal';
import { useMasterData } from '@/contexts/MasterDataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

interface Message {
  id: string;
  senderId: string;
  receiverId?: string | null;
  groupName?: string | null;
  content: string;
  timestamp: string;
  readBy?: { userId: string; readAt: string }[];
}

interface Meeting {
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  organizer: string;
  organizerId: string;
  attendees: any[];
  mode: string;
  meetingLink?: string;
}

export function CommunicationTab() {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'meetings'>('chat');
  const { employees } = useMasterData();
  const userId = sessionStorage.getItem('userId') || '';
  const userName = sessionStorage.getItem('userName') || 'Me';
  const userRole = sessionStorage.getItem('userRole') || 'employee';

  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [activeChat, setActiveChat] = useState<{ type: 'group' | 'direct', id: string, name: string }>({ type: 'group', id: 'global', name: 'Company Wide' });
  const [newMessage, setNewMessage] = useState('');
  
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState<Partial<Meeting>>({ type: 'internal', mode: 'online' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/api/ops/messages/`, { headers: { 'X-User-Id': userId }});
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.results || []);
        setAllMessages(data);
        
        // Filter for activeChat
        let activeData = data;
        if (activeChat.type === 'group') {
            activeData = data.filter((m: Message) => m.groupName === activeChat.id);
        } else {
            activeData = data.filter((m: Message) => 
              (m.senderId === userId && m.receiverId === activeChat.id) ||
              (m.senderId === activeChat.id && m.receiverId === userId)
            );
        }
        setMessages(activeData);
        
        // Mark unread messages in active chat as read
        activeData.forEach(async (m: Message) => {
            const readByArray = Array.isArray(m.readBy) ? m.readBy : [];
            if (m.senderId !== userId && !readByArray.some(r => r.userId === userId)) {
                try {
                    await fetch(`${API}/api/ops/messages/${m.id}/mark_read/`, { method: 'POST', headers: { 'X-User-Id': userId }});
                } catch {}
            }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API}/api/ops/meetings/`, { headers: { 'X-User-Id': userId }});
      if (res.ok) {
        const json = await res.json();
        setMeetings(Array.isArray(json) ? json : (json.results || []));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'chat') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    } else {
      fetchMeetings();
    }
  }, [activeSubTab, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await fetch(`${API}/api/ops/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          senderId: userId,
          receiverId: activeChat.type === 'direct' ? activeChat.id : null,
          groupName: activeChat.type === 'group' ? activeChat.id : null,
          content: newMessage
        })
      });
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingForm.title || !meetingForm.date || !meetingForm.startTime || !meetingForm.endTime) {
      alert('Please fill in all required fields: Title, Date, Start Time, End Time.');
      return;
    }
    try {
      const res = await fetch(`${API}/api/ops/meetings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          ...meetingForm,
          organizer: userName,
          organizerId: userId,
          attendees: meetingForm.attendees || [],
          agenda: meetingForm.agenda || 'No agenda provided',
          location: meetingForm.location || 'Online',
          externalGuests: [],
          attachments: [],
          reminder: meetingForm.reminder || 'none',
          recurring: meetingForm.recurring || 'none',
          priority: meetingForm.priority || 'medium',
          status: 'scheduled'
        })
      });
      if (res.ok) {
        setIsMeetingModalOpen(false);
        setMeetingForm({ type: 'internal', mode: 'online' });
        fetchMeetings();
      } else {
        const err = await res.json();
        console.error('Meeting creation failed:', err);
        alert('Failed to create meeting: ' + JSON.stringify(err));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getUserName = (id: string) => {
    if (id === userId) return userName;
    const emp = (employees || []).find(e => e.id === id);
    return emp ? emp.fullName : id;
  };

  const safeFormatTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const safeFormatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Communication</h2>
          <p className="text-muted-foreground mt-1">Chat with your team and schedule meetings.</p>
        </div>
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
          <Button
            variant={activeSubTab === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSubTab('chat')}
            className={activeSubTab === 'chat' ? 'shadow-sm' : ''}
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Chat
          </Button>
          <Button
            variant={activeSubTab === 'meetings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSubTab('meetings')}
            className={activeSubTab === 'meetings' ? 'shadow-sm' : ''}
          >
            <Calendar className="w-4 h-4 mr-2" /> Meetings
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'chat' ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[700px]"
          >
            {/* Sidebar */}
            <div className="bg-card border border-border/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search contacts..." className="pl-9 bg-secondary/50 border-none" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Groups</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveChat({ type: 'group', id: 'global', name: 'Company Wide' })}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${activeChat.id === 'global' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-left">Company Wide</span>
                      {allMessages.filter(m => m.groupName === 'global' && m.senderId !== userId && !(Array.isArray(m.readBy) ? m.readBy : []).some(r => r.userId === userId)).length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      )}
                    </button>
                    {(userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'manager') && (
                      <button
                        onClick={() => setActiveChat({ type: 'group', id: 'managers', name: 'Managers Only' })}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${activeChat.id === 'managers' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-left">Managers Only</span>
                        {allMessages.filter(m => m.groupName === 'managers' && m.senderId !== userId && !(Array.isArray(m.readBy) ? m.readBy : []).some(r => r.userId === userId)).length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Direct Messages</h3>
                  <div className="space-y-1">
                    {(employees || []).filter(e => e.id !== userId).map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => setActiveChat({ type: 'direct', id: emp.id, name: emp.fullName || 'User' })}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${activeChat.id === emp.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-medium text-xs">
                            {(emp.fullName || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card bg-green-500" />
                        </div>
                        <div className="flex-1 text-left truncate">
                          <p className="text-sm truncate">{emp.fullName}</p>
                        </div>
                        {allMessages.filter(m => m.senderId === emp.id && m.receiverId === userId && !(Array.isArray(m.readBy) ? m.readBy : []).some(r => r.userId === userId)).length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-3 bg-card border border-border/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center gap-3">
                {activeChat.type === 'group' ? (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium">
                    {(activeChat.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">{activeChat.name}</h3>
                  <p className="text-xs text-muted-foreground">{activeChat.type === 'group' ? 'Group Chat' : 'Direct Message'}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(!messages || messages.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === userId;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && activeChat.type === 'group' && (
                            <span className="text-xs text-muted-foreground ml-1">{getUserName(msg.senderId)}</span>
                          )}
                          <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-secondary-foreground rounded-tl-sm'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground px-1">
                            {safeFormatTime(msg.timestamp)}
                          </span>
                          {isMe && Array.isArray(msg.readBy) && msg.readBy.length > 0 && (
                            <span className="text-[10px] text-green-500 px-1 flex items-center justify-end">
                              <CheckCheck className="w-3 h-3 mr-1" /> Seen {activeChat.type === 'group' ? `by ${msg.readBy.length}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border/50 bg-secondary/20">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeChat.name}...`}
                    className="flex-1 bg-card"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()} className="rounded-xl shadow-lg">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="meetings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Upcoming Meetings</h3>
              <Button onClick={() => setIsMeetingModalOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Schedule Meeting
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(!meetings || meetings.length === 0) ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-card/40 border border-border/50 rounded-2xl border-dashed">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p>No upcoming meetings scheduled.</p>
                </div>
              ) : (
                meetings.map(meeting => (
                  <div key={meeting.id} className="bg-card border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg text-foreground">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <span className="capitalize">{meeting.type}</span> • <span className="capitalize">{meeting.mode}</span>
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        {meeting.mode === 'online' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/30 p-2.5 rounded-xl">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{safeFormatDate(meeting.date)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/30 p-2.5 rounded-xl">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{meeting.startTime ? meeting.startTime.substring(0, 5) : '--:--'} - {meeting.endTime ? meeting.endTime.substring(0, 5) : '--:--'}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">Organizer: <span className="font-medium text-foreground">{meeting.organizer}</span></p>
                      {meeting.mode === 'online' && meeting.meetingLink && (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => window.open(meeting.meetingLink, '_blank')}>
                          Join Link
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassModal isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} title="Schedule Meeting">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meeting Title</Label>
            <Input value={meetingForm.title || ''} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} placeholder="e.g. Weekly Sync" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={meetingForm.date || ''} onChange={e => setMeetingForm({...meetingForm, date: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="time" value={meetingForm.startTime || ''} onChange={e => setMeetingForm({...meetingForm, startTime: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="time" value={meetingForm.endTime || ''} onChange={e => setMeetingForm({...meetingForm, endTime: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={meetingForm.type || 'internal'} onValueChange={v => setMeetingForm({...meetingForm, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={meetingForm.mode || 'online'} onValueChange={v => setMeetingForm({...meetingForm, mode: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {meetingForm.mode !== 'in-person' && (
            <div className="space-y-2">
              <Label>Meeting Link (Zoom / Meet)</Label>
              <Input value={meetingForm.meetingLink || ''} onChange={e => setMeetingForm({...meetingForm, meetingLink: e.target.value})} placeholder="https://..." />
            </div>
          )}
          {meetingForm.mode !== 'online' && (
            <div className="space-y-2">
              <Label>Location / Room</Label>
              <Input value={meetingForm.location || ''} onChange={e => setMeetingForm({...meetingForm, location: e.target.value})} placeholder="e.g. Conference Room A" />
            </div>
          )}
          <Button onClick={handleScheduleMeeting} className="w-full mt-4">Schedule Meeting</Button>
        </div>
      </GlassModal>
    </div>
  );
}
