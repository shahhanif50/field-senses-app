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
  PackageCheck,
  ShoppingCart,
  UserPlus,
  Navigation,
  LogOut,
  FolderKanban,
  CheckCircle2,
  Contact,
  ClipboardEdit,
  ClipboardList,
  MapPin,
  Map,
  Calendar,
  MessageSquare,
  UserCheck,
  Target,
  CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "./NotificationBell";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";

const API = "";

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export const allTabs = [
  { id: "organizations", label: "Organizations", icon: Building2, roles: ["superadmin"] },
  { id: "superadmin-sites", label: "Sites Management", icon: MapPin, roles: ["superadmin"] },
  { id: "superadmin-modules", label: "Modules Access", icon: CreditCard, roles: ["superadmin"] },
  { id: "admin-dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin"] },
  { id: "employee-dashboard", label: "Dashboard", icon: Activity, roles: ["employee"] },
  { id: "product-booking", label: "Product Booking", icon: ShoppingCart, roles: ["employee"] },
  { id: "master-setup", label: "Master Setup", icon: Settings, roles: ["admin"] },
  { id: "sales-executive", label: "Sales Executive", icon: Users, roles: ["admin", "manager"] },
  { id: "employee-portal", label: "Employee Portal", icon: Contact, roles: ["manager", "employee", "WH_MGR"] },
  { id: "inventory-management", label: "Inventory Management", icon: Package, roles: ["admin", "manager", "WH_MGR"] },
  { id: "admin-orders", label: "Admin Orders", icon: ClipboardList, roles: ["admin", "manager"] },
  { id: "daily-tracking", label: "Daily Tracking", icon: MapPin, roles: ["admin"] },
  { id: "team-tracking", label: "Team Tracking", icon: Users, roles: ["admin", "manager"] },
  { id: "live-tracking", label: "Live Tracking", icon: Navigation, roles: ["admin", "manager", "employee"] },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3, roles: ["admin", "manager", "employee"] },
  { id: "alerts", label: "Alerts", icon: AlertTriangle, roles: ["admin", "manager"] },
  { id: "projects", label: "Projects & Tasks", icon: FolderKanban, roles: ["manager", "employee"] },
  { id: "communication", label: "Communication & Meetings", icon: MessageSquare, roles: ["manager", "employee", "WH_MGR"] },
  { id: "documents", label: "Documents", icon: FileText, roles: ["admin", "manager", "employee"] },
  { id: "permissions", label: "Permission Requests", icon: CheckCircle2, roles: ["manager", "employee"] },
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
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const currentOrgId = sessionStorage.getItem("organizationId");
  const isImpersonating = isGlobalAdmin && currentOrgId && currentOrgId !== "null";
  
  const userRole = (isGlobalAdmin && !isImpersonating) ? "superadmin"
                 : ["ADMIN", "admin"].includes(rawRole) ? "admin" 
                 : ["WH_MGR"].includes(rawRole) ? "WH_MGR" 
                 : ["MANAGER", "manager", "SR_MGR", "HEAD"].includes(rawRole) ? "manager" 
                 : "employee";

  let modulesEnabled: string[] = [];
  try {
    modulesEnabled = JSON.parse(sessionStorage.getItem("modulesEnabled") || "[]");
  } catch(e) {}

  const { roles, rolePermissions, employees } = useMasterData();
  const currentRole = roles.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());

  let tabs = allTabs.filter(tab => {
    // Superadmin sees Organizations
    if (tab.roles.includes("superadmin") && (isGlobalAdmin && !isImpersonating)) return true;
    if (tab.roles.includes("superadmin")) return false;
    
    // Check RBAC database permission
    const rolePerm = rolePermissions.find(p => p.roleId === currentRole?.id && p.module === tab.label);
    
    // Strict Role checking: Tenant Admin has implicit access to default modules, 
    // and can be granted additional access via Role Permissions.
    let hasRole = (userRole.toLowerCase() === "admin" && tab.roles.includes("admin")) || !!rolePerm?.view;
    if (!hasRole && rolePermissions) {
      if (tab.id === "inventory-management") {
        hasRole = rolePermissions.some(p => p.roleId === currentRole?.id && ["Product Setup", "Stock Management", "Sales & Billing", "Inventory Management"].includes(p.module) && p.view);
      } else if (tab.id === "sales-executive") {
        hasRole = rolePermissions.some(p => p.roleId === currentRole?.id && ["Territory Management", "Distributor Linkage", "Sales Monitoring", "Sales Executive"].includes(p.module) && p.view);
      } else if (tab.id === "master-setup") {
        hasRole = rolePermissions.some(p => p.roleId === currentRole?.id && ["Role Management", "Organization Chart", "Site Master", "Distributor Master"].includes(p.module) && p.view);
      }
    }
    
    // If Global Admin or the module is enabled at the organization level
    const effectiveModuleLabel = tab.label;

    const alwaysActiveTabs = ["profile", "approvals", "admin-dashboard", "employee-dashboard", "product-booking", "admin-orders"];
    const moduleActive = (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(effectiveModuleLabel) || alwaysActiveTabs.includes(tab.id);
    
    // Explicitly grant employee default tabs
    if (userRole === "employee" && (tab.id === "employee-dashboard" || tab.id === "product-booking")) {
      return true;
    }
    
    return hasRole && moduleActive;
  });

  // Dynamically append any additional modules granted via Role Permissions
  const rolePerms = rolePermissions.filter(rp => rp.roleId === currentRole?.id);
  const dynamicallyEnabledTabs = allTabs.filter(tab => {
    const rolePerm = rolePerms.find(rp => rp.module === tab.label);
    const moduleActive = (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(tab.label) || ["master-setup", "profile", "approvals"].includes(tab.id);
    return rolePerm?.view && moduleActive;
  });

  // Explicit override for requested roles
  if (userRole === "superadmin") {
    tabs = allTabs.filter(tab => tab.roles.includes("superadmin"));
  } else if (userRole.toLowerCase() === "admin") {
    tabs = [
      { id: "admin-dashboard", label: "Dashboard", icon: Activity, roles: ["admin"] },
      { id: "master-setup", label: "Master Setup", icon: Settings, roles: ["admin"] },
      { id: "sales-executive", label: "Sales Executive Setup", icon: Users, roles: ["admin"] },
      { id: "inventory-management", label: "Inventory Management", icon: Package, roles: ["admin"] },
      { id: "admin-orders", label: "Admin Orders", icon: ClipboardList, roles: ["admin"] },
      { id: "team-daily-tracking", label: "Daily Tracking Monitoring", icon: ClipboardEdit, roles: ["admin"] },
      { id: "reports", label: "Reports & Analytics", icon: BarChart3, roles: ["admin"] },
      { id: "alerts", label: "Alerts & Escalation", icon: AlertTriangle, roles: ["admin"] },
      { id: "documents", label: "Documents & Logs", icon: FileText, roles: ["admin"] },
      { id: "profile", label: "My Profile", icon: UserCircle, roles: ["admin"] },
    ].filter(tab => {
        let moduleName = tab.label;
        if (tab.label === "Dashboard" || tab.id === "profile") return true;
        if (tab.label === "Sales Executive Setup") moduleName = "Sales Executive";
        if (tab.label === "Daily Tracking Monitoring") moduleName = "Daily Tracking";
        if (tab.label === "Reports & Analytics") moduleName = "Reports";
        if (tab.label === "Alerts & Escalation") moduleName = "Alerts";
        if (tab.label === "Documents & Logs") moduleName = "Documents";
        if (tab.id === "admin-orders") return true;
        return (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(moduleName);
    });
    dynamicallyEnabledTabs.forEach(dTab => {
        if (!tabs.find(t => t.id === dTab.id)) tabs.push(dTab);
    });
  } else if (rawRole.toLowerCase() === "regional manager" || rawRole.toLowerCase() === "regional_manager" || currentRole?.roleName?.toLowerCase() === "regional manager") {
    tabs = [
      { id: "rm-dashboard", label: "Dashboard", icon: Activity, roles: ["manager"] },
      { id: "rm-team", label: "Team Management", icon: Users, roles: ["manager"] },
      { id: "rm-territory", label: "Territory Management", icon: MapPin, roles: ["manager"] },
      { id: "rm-distributors", label: "Distributor Monitoring", icon: Package, roles: ["manager"] },
      { id: "reports", label: "Reports", icon: BarChart3, roles: ["manager"] },
      { id: "alerts", label: "Alerts", icon: AlertTriangle, roles: ["manager"] },
      { id: "documents", label: "Documents", icon: FileText, roles: ["manager"] },
      { id: "profile", label: "My Profile", icon: UserCircle, roles: ["manager"] },
    ].filter(tab => {
        let moduleName = tab.label;
        if (tab.label === "Dashboard" || tab.id === "profile") return true;
        if (tab.label === "Team Management") moduleName = "Team Tracking";
        if (tab.label === "Territory Management") moduleName = "Master Setup";
        if (tab.label === "Distributor Monitoring") moduleName = "Sales Executive";
        return (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(moduleName);
    });
    dynamicallyEnabledTabs.forEach(dTab => {
        if (!tabs.find(t => t.id === dTab.id)) tabs.push(dTab);
    });
  }
  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const { getEmployeeNameById, sites } = useMasterData();
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
              <p className="text-xs text-muted-foreground capitalize">
                {userName === "Superadmin" || userName === "System Admin" ? "Superadmin" : `${userName} • ${rawRole.toLowerCase()}`}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center justify-center gap-2 overflow-x-auto no-scrollbar flex-1 mx-4 px-2 py-1">
            {/* 1. Dashboard Tab(s) */}
            {tabs.filter(t => t.id.includes('dashboard') || t.label.toLowerCase() === 'dashboard').map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  title={tab.label}
                  className={`nav-link flex items-center gap-2 shrink-0 ${
                    isActive ? "active" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs whitespace-nowrap font-medium">{tab.label}</span>
                </button>
              );
            })}

            {/* 3. Rest of the Tabs */}
            {tabs.filter(t => !t.id.includes('dashboard') && t.label.toLowerCase() !== 'dashboard').map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  title={tab.label}
                  className={`nav-link flex items-center gap-2 shrink-0 ${
                    isActive ? "active" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs whitespace-nowrap font-medium">{tab.label}</span>
                </button>
              );
            })}

          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {isImpersonating && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2"
                onClick={() => {
                  sessionStorage.setItem("organizationId", "null");
                  toast.success("Returned to Global View");
                  setTimeout(() => window.location.reload(), 1000);
                }}
                title="Exit Tenant View"
              >
                <LogOut className="w-4 h-4 rotate-180" />
                <span className="hidden sm:inline">Exit Tenant View</span>
              </Button>
            )}

            <NotificationBell 
              onNotificationClick={handleTabClick} 
              isMuted={isMuted} 
              onToggleMute={toggleMute} 
            />
            <Button variant="ghost" size="icon" onClick={onThemeToggle} title="Toggle Theme" className="rounded-full">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full">
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