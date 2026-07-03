import { useState, useEffect } from "react";
import { Bell, BellOff, Clock, CheckCircle2, AlertTriangle, UserCircle, MessageSquare, Calendar } from "lucide-react";
import { useMasterData } from "@/contexts/MasterDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const API = "";

interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: string;
  resolved: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: any;
}

interface NotificationBellProps {
  onNotificationClick: (tabId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function NotificationBell({ onNotificationClick, isMuted, onToggleMute }: NotificationBellProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [replyingToAlert, setReplyingToAlert] = useState<Alert | null>(null);
  const [replyText, setReplyText] = useState('');
  const { getEmployeeNameById } = useMasterData();
  const userId = sessionStorage.getItem("userId") || "";
  const [dismissedMeetingIds, setDismissedMeetingIds] = useState<string[]>(() => JSON.parse(localStorage.getItem(`dismissedMeetings_${userId}`) || "[]"));

  // Re-fetch when opened, and on interval
  const fetchAlerts = async () => {
    try {
      const userRole = sessionStorage.getItem("userRole") || "employee";
      const isAdminOrManager = ["admin", "manager", "sr_mgr", "head"].includes(userRole.toLowerCase());
      const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
      const canSeeApprovals = isAdminOrManager || isGlobalAdmin;

      let combinedAlerts: Alert[] = [];

      // 1. Fetch backend global alerts
      const res = await fetch(`${API}/api/ops/alerts/?resolved=False`, {
        headers: {
          'X-User-Id': userId,
          'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          let systemAlerts = [...data.filter(a => !a.resolved)];
          if (!canSeeApprovals) {
             systemAlerts = systemAlerts.filter(a => a.type !== "pending_approval");
          }
          combinedAlerts = [...systemAlerts];
        }
      }

      if (userId) {
        // 2. Fetch unread messages
        const msgRes = await fetch(`${API}/api/ops/messages/`, { headers: { 'X-User-Id': userId }});
        if (msgRes.ok) {
          const json = await msgRes.json();
          const allMsgs = Array.isArray(json) ? json : (json.results || []);
          const unreadMsgs = allMsgs.filter((m: any) => m.senderId !== userId && !(Array.isArray(m.readBy) ? m.readBy : []).some((r: any) => r.userId === userId));
          
          unreadMsgs.forEach((m: any) => {
            combinedAlerts.push({
              id: `msg-${m.id}`,
              type: 'message',
              message: `New message from ${getEmployeeNameById(m.senderId) || 'someone'}: "${m.content ? (m.content.substring(0,40) + (m.content.length > 40 ? '...' : '')) : ''}"`,
              timestamp: m.timestamp,
              severity: 'info',
              resolved: false,
              relatedEntityId: m.id,
              relatedEntityType: 'message',
              metadata: { senderId: m.senderId, groupName: m.groupName }
            });
          });
        }

        // 3. Fetch upcoming new meetings
        const meetRes = await fetch(`${API}/api/ops/meetings/`, { headers: { 'X-User-Id': userId }});
        if (meetRes.ok) {
          const json = await meetRes.json();
          const allMeets = Array.isArray(json) ? json : (json.results || []);
          const now = new Date();
          const activeMeets = allMeets.filter((m: any) => {
            // startTime is time-only (e.g. "09:00:00"), combine with date
            const meetingDateTime = m.date && m.startTime ? new Date(`${m.date}T${m.startTime}`) : null;
            const isFuture = meetingDateTime ? meetingDateTime > now : false;
            const isScheduled = m.status === 'scheduled' || !m.status;
            const isAttendee = (m.attendees || []).some((a: any) => a.id === userId || a.id === String(userId));
            return isFuture && isScheduled && isAttendee;
          });

          activeMeets.forEach((m: any) => {
            if (!dismissedMeetingIds.includes(m.id)) {
              combinedAlerts.push({
                id: `meet-${m.id}`,
                type: 'meeting',
                message: `Meeting: "${m.title}" on ${m.date} at ${m.startTime ? m.startTime.substring(0, 5) : ''}`,
                timestamp: m.createdAt || new Date().toISOString(),
                severity: 'info',
                resolved: false,
                relatedEntityId: m.id,
                relatedEntityType: 'meeting'
              });
            }
          });
        }
      }


      // Sort by timestamp desc
      combinedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlerts(combinedAlerts);

    } catch (e) {
      console.error("Failed to fetch alerts", e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkResolved = async (alert: Alert) => {
    if (alert.type === 'message' && alert.relatedEntityId) {
      try {
        await fetch(`${API}/api/ops/messages/${alert.relatedEntityId}/mark_read/`, { method: 'POST', headers: { 'X-User-Id': userId }});
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      } catch (e) {}
    } else if (alert.type === 'meeting' && alert.relatedEntityId) {
      const newDismissed = [...dismissedMeetingIds, alert.relatedEntityId];
      setDismissedMeetingIds(newDismissed);
      localStorage.setItem(`dismissedMeetings_${userId}`, JSON.stringify(newDismissed));
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    } else {
      try {
        await fetch(`${API}/api/ops/alerts/${alert.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved: true })
        });
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingToAlert) return;
    const { senderId, groupName } = replyingToAlert.metadata || {};
    try {
      const payload = {
        senderId: userId,
        content: replyText,
        ...(groupName ? { groupName } : { receiverId: senderId })
      };
      await fetch(`${API}/api/ops/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload)
      });
      await handleMarkResolved(replyingToAlert);
      setReplyingToAlert(null);
      setReplyText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (alert: Alert) => {
    // 1. Mark as resolved
    await handleMarkResolved(alert);
    
    // 2. Navigate based on message content
    if (alert.type === 'message' || alert.type === 'meeting') {
      onNotificationClick("communication");
    } else {
      const msg = alert.message.toLowerCase();
      if (msg.includes("leave") || msg.includes("payout") || msg.includes("order")) {
        onNotificationClick("approvals");
      } else if (msg.includes("employee") || msg.includes("leaver")) {
        onNotificationClick("master-setup");
      } else {
        onNotificationClick("alerts");
      }
    }
    setIsOpen(false);
  };

  const handleClearAll = async () => {
    if (alerts.length === 0) return;
    try {
      await Promise.all(alerts.map(alert => handleMarkResolved(alert)));
    } catch (e) {
      console.error("Failed to clear all notifications", e);
    }
  };

  const pendingCount = alerts.length;

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) fetchAlerts();
    }}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          title="Notifications"
          onMouseEnter={() => { setIsOpen(true); fetchAlerts(); }}
        >
          {isMuted ? <BellOff className="w-5 h-5 text-muted-foreground" /> : <Bell className="w-5 h-5" />}
          {!isMuted && pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden shadow-lg border-border/50">
        <div className="bg-muted/50 p-3 border-b border-border/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm">Notifications</h4>
            <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-transparent" onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute"}>
               {isMuted ? <BellOff className="w-3 h-3 text-muted-foreground" /> : <Bell className="w-3 h-3 text-muted-foreground" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <>
                <Badge variant="secondary" className="text-xs">{pendingCount} New</Badge>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={handleClearAll}>Clear All</Button>
              </>
            )}
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {pendingCount === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <AnimatePresence>
              {alerts.map(alert => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 border-b border-border/50 hover:bg-muted/30 transition-colors flex gap-3 text-sm group"
                >
                  <div className="shrink-0 mt-0.5">
                    {alert.type === 'pending_approval' ? (
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    ) : alert.type === 'message' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : alert.type === 'meeting' ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground leading-tight mb-1 cursor-pointer hover:underline" onClick={() => handleNotificationClick(alert)}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    {alert.type === 'pending_approval' && (
                      <div className="flex gap-2 mt-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(alert); }}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-6 px-2 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(alert); }}
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                    {alert.type === 'message' && replyingToAlert?.id !== alert.id && (
                      <div className="flex gap-2 mt-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 px-2 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); setReplyingToAlert(alert); }}
                        >
                          Reply
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleMarkResolved(alert); }}
                        >
                          Ignore
                        </Button>
                      </div>
                    )}
                    {replyingToAlert?.id === alert.id && (
                      <form onSubmit={handleReplySubmit} className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                        <Input 
                          autoFocus
                          size={1}
                          className="h-7 text-xs flex-1" 
                          placeholder="Type reply..." 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <Button type="submit" size="sm" className="h-7 px-2 text-[10px]">Send</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => { setReplyingToAlert(null); setReplyText(''); }}>Cancel</Button>
                      </form>
                    )}
                  </div>
                  {!replyingToAlert && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); handleMarkResolved(alert); }}
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
