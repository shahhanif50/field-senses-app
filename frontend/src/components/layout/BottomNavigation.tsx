import { useState } from "react";
import { LayoutDashboard, Compass, UserCircle, MoreHorizontal, Activity, Settings, MapPin, Users, Package, ShoppingCart, ClipboardList, ClipboardEdit, BarChart3, AlertTriangle, FileText } from "lucide-react";
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
  const matchingRoles = roles.filter(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const matchingRoleIds = matchingRoles.map(r => r.id);
  const currentRole = matchingRoles[0];

  let tabs = allTabs.filter(tab => {
    // Superadmin sees Organizations
    if (tab.roles.includes("superadmin") && (isGlobalAdmin && !isImpersonating)) return true;
    if (tab.roles.includes("superadmin")) return false;
    
    // Check RBAC database permission
    const rolePerm = rolePermissions.find(p => matchingRoleIds.includes(p.roleId) && p.module === tab.label);
    
    // Strict Role checking
    let hasRole = (userRole.toLowerCase() === "admin" && tab.roles.includes("admin")) || !!rolePerm?.view;
    if (!hasRole && rolePermissions) {
      if (tab.id === "inventory-management") {
        hasRole = rolePermissions.some(p => matchingRoleIds.includes(p.roleId) && ["Product Setup", "Stock Management", "Sales & Billing", "Inventory Management"].includes(p.module) && p.view);
      } else if (tab.id === "sales-executive") {
        hasRole = rolePermissions.some(p => matchingRoleIds.includes(p.roleId) && ["Territory Management", "Distributor Linkage", "Sales Monitoring", "Sales Executive"].includes(p.module) && p.view);
      } else if (tab.id === "master-setup") {
        hasRole = rolePermissions.some(p => matchingRoleIds.includes(p.roleId) && ["Role Management", "Organization Chart", "Site Master", "Distributor Master"].includes(p.module) && p.view);
      }
    }
    
    // If Global Admin or the module is enabled at the organization level
    const effectiveModuleLabel = tab.label;

    const alwaysActiveTabs = ["profile", "approvals", "admin-dashboard", "employee-dashboard", "product-booking", "admin-orders", "superadmin-sites"];
    let moduleId = effectiveModuleLabel;
    if (effectiveModuleLabel === "Master Setup") moduleId = "master_setup";
    if (effectiveModuleLabel === "Inventory Management") moduleId = "inventory_management";
    if (effectiveModuleLabel === "Product Catalog") moduleId = "product_catalog_module";
    if (effectiveModuleLabel === "Sales Executive Setup" || effectiveModuleLabel === "Sales Executive") moduleId = "sales_executive";
    if (effectiveModuleLabel === "Daily Tracking") moduleId = "daily_tracking";
    if (effectiveModuleLabel === "Team Tracking") moduleId = "team_tracking";
    if (effectiveModuleLabel === "Live Tracking") moduleId = "live_tracking";
    if (effectiveModuleLabel === "Reports & Analytics") moduleId = "reports";
    if (effectiveModuleLabel === "Alerts") moduleId = "alerts";
    if (effectiveModuleLabel === "Projects & Tasks") moduleId = "projects_tasks";
    if (effectiveModuleLabel === "Communication & Meetings") moduleId = "communication";
    if (effectiveModuleLabel === "Meeting Scheduler") moduleId = "meetings";
    if (effectiveModuleLabel === "Documents") moduleId = "documents";
    const isProductCatalogAllowed = effectiveModuleLabel === "Product Catalog" && (modulesEnabled.includes("product_catalog") || modulesEnabled.includes("Inventory Management") || modulesEnabled.includes("inventory_management"));
    const moduleActive = (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(effectiveModuleLabel) || modulesEnabled.includes(moduleId) || isProductCatalogAllowed || alwaysActiveTabs.includes(tab.id);
    
    // Fully Dynamic: If the admin explicitly granted view permission for this role, it MUST be visible.
    if (rolePerm?.view) {
      return true;
    }

    // Explicitly grant employee default tabs
    if (userRole === "employee" && tab.id === "employee-dashboard") {
      return true;
    }
    
    return hasRole && moduleActive;
  });

  // Dynamically append any additional modules granted via Role Permissions
  const rolePerms = rolePermissions.filter(rp => matchingRoleIds.includes(rp.roleId));
  const dynamicallyEnabledTabs = allTabs.filter(tab => {
    const rolePerm = rolePerms.find(rp => rp.module === tab.label);
    let moduleId = tab.label;
    if (tab.label === "Master Setup") moduleId = "master_setup";
    if (tab.label === "Inventory Management") moduleId = "inventory_management";
    if (tab.label === "Product Catalog") moduleId = "product_catalog_module";
    if (tab.label === "Sales Executive") moduleId = "sales_executive";
    if (tab.label === "Daily Tracking") moduleId = "daily_tracking";
    if (tab.label === "Team Tracking") moduleId = "team_tracking";
    if (tab.label === "Live Tracking") moduleId = "live_tracking";
    if (tab.label === "Reports & Analytics") moduleId = "reports";
    if (tab.label === "Alerts") moduleId = "alerts";
    if (tab.label === "Projects & Tasks") moduleId = "projects_tasks";
    if (tab.label === "Communication & Meetings") moduleId = "communication";
    if (tab.label === "Meeting Scheduler") moduleId = "meetings";
    if (tab.label === "Documents") moduleId = "documents";

    const isProductCatalogAllowed = tab.label === "Product Catalog" && (modulesEnabled.includes("product_catalog") || modulesEnabled.includes("Inventory Management") || modulesEnabled.includes("inventory_management"));
    const moduleActive = (isGlobalAdmin && !isImpersonating) || modulesEnabled.includes("All") || modulesEnabled.includes(tab.label) || modulesEnabled.includes(moduleId) || isProductCatalogAllowed || ["master-setup", "profile", "approvals"].includes(tab.id);
    return rolePerm?.view && moduleActive;
  });

  // Explicit override for requested roles
  if (userRole === "superadmin") {
    tabs = allTabs.filter(tab => tab.roles.includes("superadmin"));
  } else if (userRole.toLowerCase() === "admin") {
    tabs = [
      { id: "admin-dashboard", label: "Dashboard", icon: Activity, roles: ["admin"] },
      { id: "master-setup", label: "Master Setup", icon: Settings, roles: ["admin"] },
      { id: "superadmin-sites", label: "Sites Management", icon: MapPin, roles: ["admin"] },
      { id: "sales-executive", label: "Sales Executive Setup", icon: Users, roles: ["admin"] },
      { id: "inventory-management", label: "Inventory Management", icon: Package, roles: ["admin"] },
      { id: "product-booking", label: "Product Catalog", icon: ShoppingCart, roles: ["admin"] },
      { id: "admin-orders", label: "Admin Orders", icon: ClipboardList, roles: ["admin"] },
      { id: "daily-tracking", label: "Daily Tracking", icon: Activity, roles: ["admin"] },
      { id: "team-tracking", label: "Team Tracking", icon: ClipboardEdit, roles: ["admin"] },
      { id: "reports", label: "Reports & Analytics", icon: BarChart3, roles: ["admin"] },
      { id: "alerts", label: "Alerts & Escalation", icon: AlertTriangle, roles: ["admin"] },
      { id: "documents", label: "Documents & Logs", icon: FileText, roles: ["admin"] },
      { id: "profile", label: "My Profile", icon: UserCircle, roles: ["admin"] },
    ].filter(tab => {
        let moduleName = tab.label;
        // Always show these tabs for admin
        if (tab.label === "Dashboard" || tab.id === "profile") return true;
        if (tab.id === "master-setup") return true;
        if (tab.id === "admin-orders") return true;
        if (tab.id === "superadmin-sites") return true;
        if (tab.label === "Sales Executive Setup") moduleName = "Sales Executive";
        if (tab.label === "Team Tracking") moduleName = "Team Tracking";
        if (tab.label === "Reports & Analytics") moduleName = "Reports";
        if (tab.label === "Alerts & Escalation") moduleName = "Alerts";
        if (tab.label === "Documents & Logs") moduleName = "Documents";
        let moduleId = moduleName;
        if (moduleName === "Master Setup") moduleId = "master_setup";
        if (moduleName === "Inventory Management") moduleId = "inventory_management";
        if (moduleName === "Product Catalog") moduleId = "product_catalog";
        if (moduleName === "Sales Executive") moduleId = "sales_executive";
        if (moduleName === "Daily Tracking") moduleId = "daily_tracking";
        if (moduleName === "Team Tracking") moduleId = "team_tracking";
        if (moduleName === "Reports") moduleId = "reports";
        if (moduleName === "Alerts") moduleId = "alerts";
        if (moduleName === "Documents") moduleId = "documents";
        // Show if modulesEnabled includes the module OR if explicitly granted via role permissions
        const hasModuleAccess = modulesEnabled.includes("All") || modulesEnabled.includes(moduleName) || modulesEnabled.includes(moduleId);
        const hasPermAccess = rolePermissions.some(p => matchingRoleIds.includes(p.roleId) && p.module === moduleName && p.view);
        return (isGlobalAdmin && !isImpersonating) || hasModuleAccess || hasPermAccess;
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
  } else {
    // For normal employees
    const allAllowedTabs = [...tabs];
    dynamicallyEnabledTabs.forEach(dTab => {
      if (!allAllowedTabs.find(t => t.id === dTab.id)) {
        allAllowedTabs.push(dTab);
      }
    });
    tabs = allAllowedTabs;
  }

  const getDashboardId = () => {
    if (userRole === "superadmin") return "organizations";
    if (userRole === "admin") return "admin-dashboard";
    if (userRole === "manager" || rawRole.toLowerCase() === "regional manager" || rawRole.toLowerCase() === "regional_manager") return "rm-dashboard";
    return "employee-dashboard";
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
            <button 
              onClick={(e) => e.currentTarget.blur()}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 focus:outline-none"
            >
              <Compass className="w-6 h-6 text-gray-400 transition-colors duration-200" strokeWidth={2} />
              <span className="text-[10px] font-medium text-gray-500 transition-colors duration-200">
                Explore
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-white" aria-describedby={undefined}>
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
