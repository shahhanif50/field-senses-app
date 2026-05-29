import { useState } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

const allTabs = [
  { id: "master-setup", label: "Master Setup", icon: Settings, roles: ["admin"] },
  { id: "sales-executive", label: "Sales Executive", icon: Users, roles: ["admin", "manager"] },
  { id: "employee-portal", label: "Employee Portal", icon: UserCircle, roles: ["admin", "manager", "employee", "WH_MGR"] },
  { id: "employees", label: "Employees", icon: UserPlus, roles: ["admin"] }, 
  { id: "inventory-management", label: "Inventory Management", icon: Package, roles: ["admin", "manager", "WH_MGR"] },
  { id: "daily-tracking", label: "Daily Tracking", icon: Activity, roles: ["admin", "manager"] },
  { id: "live-tracking", label: "Live Tracking", icon: Navigation, roles: ["admin", "manager", "WH_MGR", "employee"] },
  { id: "reports", label: "Reports", icon: BarChart3, roles: ["admin", "manager"] },
  { id: "alerts", label: "Alerts", icon: AlertTriangle, roles: ["admin", "manager"] },
  { id: "documents", label: "Documents", icon: FileText, roles: ["admin", "manager"] },
  { id: "approvals", label: "Approvals", icon: UserPlus, roles: ["admin"] },
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

  // Helper to handle navigation: if it's the new route, use navigate(), otherwise use tab state
  const handleTabClick = (tabId: string) => {
    if (tabId === "employees") {
      navigate("/employees");
    } else {
      onTabChange(tabId);
    }
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
              const isActive = activeTab === tab.id || (tab.id === "employees" && window.location.pathname === "/employees");
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
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
                const isActive = activeTab === tab.id || (tab.id === "employees" && window.location.pathname === "/employees");
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
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