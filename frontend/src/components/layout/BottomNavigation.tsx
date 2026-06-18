import { useState } from "react";
import { LayoutDashboard, Compass, UserCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { allTabs } from "@/components/layout/TopNavigation";
import { useMasterData } from "@/contexts/MasterDataContext";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Filter tabs exactly like TopNavigation
  const rawRole = sessionStorage.getItem("userRole") || "employee";
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

  const { roles, rolePermissions } = useMasterData();
  const currentRole = roles.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());

  let tabs = allTabs.filter(tab => {
    if (tab.roles.includes("superadmin") && (isGlobalAdmin && !isImpersonating)) return true;
    if (tab.roles.includes("superadmin")) return false;
    
    const rolePerm = rolePermissions.find(p => p.roleId === currentRole?.id && p.module === tab.label);
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
    const alwaysActiveTabs = ["profile", "approvals", "admin-dashboard", "employee-dashboard", "product-booking", "admin-orders"];
    const moduleActive = (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(tab.label) || alwaysActiveTabs.includes(tab.id);
    
    if (userRole === "employee" && (tab.id === "employee-dashboard" || tab.id === "product-booking")) {
      return true;
    }
    
    return hasRole && moduleActive;
  });

  const rolePerms = rolePermissions.filter(rp => rp.roleId === currentRole?.id);
  const dynamicallyEnabledTabs = allTabs.filter(tab => {
    const rolePerm = rolePerms.find(rp => rp.module === tab.label);
    const moduleActive = (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(tab.label) || ["master-setup", "profile", "approvals"].includes(tab.id);
    return rolePerm?.view && moduleActive;
  });

  if (userRole === "superadmin") {
    tabs = allTabs.filter(tab => tab.roles.includes("superadmin"));
  }
  // We removed the explicit overrides for admin and regional manager
  // so that "modules based on role permission" is strictly followed.
  // Admins will still get their default admin tabs via the `hasRole` check earlier,
  // and dynamically enabled tabs are already included.

  const getDashboardId = () => {
    if (userRole === "superadmin") return "organizations";
    if (userRole === "admin") return "admin-dashboard";
    if (userRole === "manager" || rawRole.toLowerCase() === "regional manager" || rawRole.toLowerCase() === "regional_manager") return "rm-dashboard";
    return "employee-portal";
  };

  const handleNavClick = (id: string) => {
    onTabChange(id);
  };

  const dashboardId = getDashboardId();

  return (
    <div className="xl:hidden w-full shrink-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        
        {/* Overview */}
        <button
          onClick={() => handleNavClick(dashboardId)}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 focus:outline-none"
        >
          <LayoutDashboard 
            className={cn(
              "w-6 h-6 transition-colors duration-200", 
              activeTab === dashboardId ? "text-[#2563eb]" : "text-gray-400"
            )} 
            strokeWidth={activeTab === dashboardId ? 2.5 : 2}
          />
          <span 
            className={cn(
              "text-[10px] font-medium transition-colors duration-200",
              activeTab === dashboardId ? "text-[#2563eb]" : "text-gray-500"
            )}
          >
            Overview
          </span>
        </button>

        {/* Explore (Drawer) */}
        <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full space-y-1 focus:outline-none">
              <Compass className="w-6 h-6 text-gray-400 transition-colors duration-200" strokeWidth={2} />
              <span className="text-[10px] font-medium text-gray-500 transition-colors duration-200">
                Explore
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-white">
            <DrawerHeader className="text-left pb-2">
              <DrawerTitle className="text-lg font-bold text-[#1e293b]">All Modules</DrawerTitle>
            </DrawerHeader>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2 p-4 pb-8 max-h-[70vh] overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleNavClick(tab.id);
                      setIsMoreOpen(false);
                    }}
                    className="flex flex-col items-center justify-start space-y-2 focus:outline-none"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                      isActive ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}>
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium text-center leading-tight px-1",
                      isActive ? "text-[#2563eb]" : "text-slate-600"
                    )}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Profile */}
        <button
          onClick={() => handleNavClick("profile")}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 focus:outline-none"
        >
          <UserCircle 
            className={cn(
              "w-6 h-6 transition-colors duration-200", 
              activeTab === "profile" ? "text-[#2563eb]" : "text-gray-400"
            )} 
            strokeWidth={activeTab === "profile" ? 2.5 : 2}
          />
          <span 
            className={cn(
              "text-[10px] font-medium transition-colors duration-200",
              activeTab === "profile" ? "text-[#2563eb]" : "text-gray-500"
            )}
          >
            Profile
          </span>
        </button>

      </div>
    </div>
  );
}
