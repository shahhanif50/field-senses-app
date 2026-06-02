import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Users,
  UserCog,
  Activity,
  BarChart3,
  AlertTriangle,
  FileText,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  Building2,
  UserCircle,
  Package,
  UserPlus, // Added this icon for the new tab
  Navigation, // For Live Tracking
  LogOut,
  FolderKanban,
  CheckCircle2,
  Contact,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "./NotificationBell";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

const allTabs = [
  { id: "master-setup", label: "Master Setup", icon: Settings, roles: ["admin"] },
  { id: "sales-executive", label: "Sales Executive", icon: Users, roles: ["admin", "manager"] },
  { id: "employee-portal", label: "Employee Portal", icon: Contact, roles: ["admin", "manager", "employee", "WH_MGR"] },
  { id: "employees", label: "Employees", icon: UserPlus, roles: ["admin"] }, 
  { id: "inventory-management", label: "Inventory Management", icon: Package, roles: ["admin", "manager", "WH_MGR"] },
  { id: "daily-tracking", label: "Daily Tracking", icon: Activity, roles: ["admin", "manager", "employee"] },
  { id: "live-tracking", label: "Live Tracking", icon: Navigation, roles: ["admin", "manager", "WH_MGR", "employee"] },
  { id: "reports", label: "Reports", icon: BarChart3, roles: ["admin", "manager", "employee"] },
  { id: "alerts", label: "Alerts", icon: AlertTriangle, roles: ["admin", "manager"] },
  { id: "attendance-leaves", label: "Attendance & Leaves", icon: Calendar, roles: ["admin", "manager", "employee"] },
  { id: "projects", label: "Projects & Tasks", icon: FolderKanban, roles: ["admin", "manager", "employee"] },
  { id: "communication", label: "Communication & Meetings", icon: MessageSquare, roles: ["admin", "manager", "employee", "WH_MGR"] },
  { id: "documents", label: "Documents", icon: FileText, roles: ["admin", "manager", "employee"] },
  { id: "permissions", label: "Permission Requests", icon: CheckCircle2, roles: ["admin", "manager", "employee"] },
  { id: "approvals", label: "Registration Approvals", icon: UserPlus, roles: ["admin"] },
  { id: "profile", label: "My Profile", icon: UserCircle, roles: ["admin", "manager", "WH_MGR", "employee"] },
];

export function TopNavigation({
  activeTab,
  onTabChange,
  isDark,
  onThemeToggle,
}: TopNavigationProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications] = useState(3);
  
  const rawRole = sessionStorage.getItem("userRole") || "employee";
  const userName = sessionStorage.getItem("userName") || "User";
  
  // Normalize the backend roleCode to match our frontend tab permissions
  const userRole = ["ADMIN", "admin"].includes(rawRole) ? "admin" 
                 : ["WH_MGR"].includes(rawRole) ? "WH_MGR" 
                 : ["MANAGER", "manager"].includes(rawRole) ? "manager" 
                 : "employee";

  const tabs = allTabs.filter(tab => tab.roles.includes(userRole) || tab.roles.includes("admin") && userRole === "admin");

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminLoggedIn");
    navigate("/login");
  };

  const { getEmployeeNameById } = useMasterData();
  const userId = sessionStorage.getItem("userId") || "";
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [lastMeetingId, setLastMeetingId] = useState<string | null>(null);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(localStorage.getItem('notificationsMuted') === 'true');
  
  // Use ref so polling intervals always have the latest value without re-creating intervals
  const isMutedRef = useRef(isMuted);
  const lastMessageIdRef = useRef(lastMessageId);
  const lastMeetingIdRef = useRef(lastMeetingId);
  const lastAlertIdRef = useRef(lastAlertId);

  const toggleMute = () => {
    const val = !isMuted;
    setIsMuted(val);
    isMutedRef.current = val;
    localStorage.setItem('notificationsMuted', String(val));
  };

  // Poll for new messages globally
  useEffect(() => {
    if (!userId) return;
    
    const checkNewMessages = async () => {
      try {
        const res = await fetch(`${API}/api/ops/messages/`, { headers: { 'X-User-Id': userId }});
        if (res.ok) {
          const json = await res.json();
          const allMsgs = Array.isArray(json) ? json : (json.results || []);
          // Filter to messages received by this user (not sent by this user)
          const received = allMsgs.filter((m: any) => m.senderId !== userId);
          if (received.length > 0) {
            const latest = received[received.length - 1];
            const currentLastId = lastMessageIdRef.current;
            // If it's a new message we haven't seen in this session
            if (currentLastId && latest.id !== currentLastId) {
              const readByArray = Array.isArray(latest.readBy) ? latest.readBy : [];
              const isUnread = !readByArray.some((r: any) => r.userId === userId);
              if (isUnread && !isMutedRef.current) {
                const senderName = getEmployeeNameById(latest.senderId) || 'Someone';
                const messagePreview = (latest.content || '').substring(0, 60) + ((latest.content || '').length > 60 ? '...' : '');
                
                toast(`💬 New message from ${senderName}`, {
                  description: messagePreview,
                  duration: 6000,
                  action: {
                    label: 'View Chat',
                    onClick: () => onTabChange('communication')
                  }
                });

                if ("Notification" in window && Notification.permission === "granted") {
                  new Notification(`New message from ${senderName}`, { body: messagePreview, icon: '/favicon.ico' });
                } else if ("Notification" in window && Notification.permission !== "denied") {
                  Notification.requestPermission().then(perm => {
                    if (perm === "granted") {
                      new Notification(`New message from ${senderName}`, { body: messagePreview, icon: '/favicon.ico' });
                    }
                  });
                }
              }
            }
            lastMessageIdRef.current = latest.id;
            setLastMessageId(latest.id);
          }
        }
      } catch {
        // Ignore network errors during polling
      }
    };

    checkNewMessages();
    const int = setInterval(checkNewMessages, 5000);
    return () => clearInterval(int);
  }, [userId, getEmployeeNameById, onTabChange]);

  // Poll for new meetings
  useEffect(() => {
    if (!userId) return;

    const checkNewMeetings = async () => {
      try {
        const res = await fetch(`${API}/api/ops/meetings/`, { headers: { 'X-User-Id': userId }});
        if (res.ok) {
          const json = await res.json();
          const allMeets = Array.isArray(json) ? json : (json.results || []);
          const now = new Date();
          const upcoming = allMeets.filter((m: any) => {
            const dt = m.date && m.startTime ? new Date(`${m.date}T${m.startTime}`) : null;
            const isAttendee = (m.attendees || []).some((a: any) => a.id === userId || a.id === String(userId));
            return dt && dt > now && isAttendee;
          });

          if (upcoming.length > 0) {
            const latest = upcoming[upcoming.length - 1];
            const currentLastId = lastMeetingIdRef.current;
            if (currentLastId && latest.id !== currentLastId && !isMutedRef.current) {
              toast(`📅 New meeting scheduled: ${latest.title}`, {
                description: `${latest.date} at ${latest.startTime ? latest.startTime.substring(0, 5) : ''}`,
                duration: 6000,
                action: {
                  label: 'View',
                  onClick: () => onTabChange('communication')
                }
              });
            }
            lastMeetingIdRef.current = latest.id;
            setLastMeetingId(latest.id);
          }
        }
      } catch {
        // Ignore
      }
    };

    checkNewMeetings();
    const int = setInterval(checkNewMeetings, 10000);
    return () => clearInterval(int);
  }, [userId, onTabChange]);

  // Poll for general alerts (new employee, money alert, etc.)
  useEffect(() => {
    if (!userId) return;

    const checkNewAlerts = async () => {
      try {
        const res = await fetch(`${API}/api/ops/alerts/?resolved=False`);
        if (res.ok) {
          const data = await res.json();
          const unhandledAlerts = Array.isArray(data) ? data.filter(a => !a.resolved) : [];

          if (unhandledAlerts.length > 0) {
            const latest = unhandledAlerts[unhandledAlerts.length - 1];
            const currentLastId = lastAlertIdRef.current;
            
            if (currentLastId && latest.id !== currentLastId && !isMutedRef.current) {
              // Determine icon based on alert type
              const icon = latest.type === 'pending_approval' ? '⏳' 
                         : latest.type === 'tracking_update' ? '📍' 
                         : '🔔';
                         
              toast(`${icon} New Alert`, {
                description: latest.message,
                duration: 6000,
              });

              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`New Alert`, { body: latest.message, icon: '/favicon.ico' });
              }
            }
            lastAlertIdRef.current = latest.id;
            setLastAlertId(latest.id);
          }
        }
      } catch {
        // Ignore network errors
      }
    };

    checkNewAlerts();
    const int = setInterval(checkNewAlerts, 10000);
    return () => clearInterval(int);
  }, [userId]);

  // Helper to handle navigation
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card mx-4 mt-4 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-lg gradient-text">Field Senses</h1>
              <p className="text-xs text-muted-foreground capitalize">{userName} • {rawRole.toLowerCase()}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  title={tab.label}
                  className={`nav-link flex items-center gap-2 ${
                    isActive ? "active" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden 2xl:inline text-xs">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ... (Keep the rest of your Right Actions div exactly as it is) ... */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            {/* Notifications */}
            <NotificationBell 
              onNotificationClick={handleTabClick} 
              isMuted={isMuted} 
              onToggleMute={toggleMute} 
            />
            <Button variant="ghost" size="icon" onClick={onThemeToggle} title="Toggle Theme">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="xl:hidden absolute top-full left-4 right-4 mt-2 p-4 glass-card rounded-xl border border-border/50 shadow-lg"
          >
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    title={tab.label}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}