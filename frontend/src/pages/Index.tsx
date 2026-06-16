import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Users,
  Activity,
  BarChart3,
  AlertTriangle,
  FileText,
  UserCircle,
  Package,
} from "lucide-react";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { KPICards } from "@/components/layout/KPICards";
import { MasterSetupTab } from "@/components/tabs/MasterSetupTab";
import { SalesExecutiveTab } from "@/components/tabs/SalesExecutiveTab";
// FIX: Using curly braces for the Named Export
import { EmployeePortalTab } from "@/components/tabs/EmployeePortalTab";
import InventoryManagementTab from "@/components/tabs/InventoryManagementTab";
import { DailyTrackingTab } from "@/components/tabs/DailyTrackingTab";
import { AlertsTab } from "@/components/tabs/AlertsTab";
import { ApprovalsTab } from "@/components/tabs/ApprovalsTab";
import { CommunicationTab } from "@/components/tabs/CommunicationTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { ReportsTab } from "@/components/tabs/ReportsTab";
import { MasterDataProvider } from "@/contexts/MasterDataContext";
import { LiveTrackingMap } from "@/components/tracking/LiveTrackingMap";
import { AdminLiveTracking } from "@/components/tracking/AdminLiveTracking";
import { ProjectsTab } from "@/components/tabs/ProjectsTab";
import { DocumentsTab } from "@/components/tabs/DocumentsTab";
import { PermissionsTab } from "@/components/tabs/PermissionsTab";
import { OrganizationsTab } from "@/components/tabs/OrganizationsTab";
import { SuperAdminSitesTab } from "@/components/tabs/SuperAdminSitesTab";
import { SuperAdminModulesTab } from "@/components/tabs/SuperAdminModulesTab";
import RMDashboard from "@/components/regional-manager/RMDashboard";
import RMTeamManagement from "@/components/regional-manager/RMTeamManagement";
import RMTerritory from "@/components/regional-manager/RMTerritory";
import RMDistributors from "@/components/regional-manager/RMDistributors";
import { EmployeeDashboard } from "@/components/employee/EmployeeDashboard";
import { EmployeeProductBooking } from "@/components/employee/EmployeeProductBooking";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";

const Index = () => {
  const rawRole = sessionStorage.getItem("userRole");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isImpersonating = isGlobalAdmin && sessionStorage.getItem("organizationId") && sessionStorage.getItem("organizationId") !== "null";
  
  const userRole = (isGlobalAdmin && !isImpersonating) ? "superadmin" : rawRole?.toLowerCase();
  const isAdmin = ["admin", "manager", "sr_mgr", "head"].includes((rawRole || "").toLowerCase());
  
  let storedDashboard = sessionStorage.getItem("defaultDashboard");
  if (storedDashboard && storedDashboard.startsWith("/")) {
      storedDashboard = storedDashboard.substring(1);
  }
  const initialTab = userRole === "superadmin" ? "organizations"
                   : storedDashboard && storedDashboard !== "admin" ? storedDashboard 
                   : userRole === "admin" ? "master-setup" 
                   : userRole === "wh_mgr" ? "inventory-management"
                   : (userRole === "manager" || userRole === "regional_manager" || rawRole?.toLowerCase() === "regional manager") ? "rm-dashboard"
                   : "employee-dashboard";
                   
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("changeTab", handleTabChange);
    return () => window.removeEventListener("changeTab", handleTabChange);
  }, []);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "organizations":
        return <OrganizationsTab />;
      case "superadmin-sites":
        return <SuperAdminSitesTab />;
      case "superadmin-modules":
        return <SuperAdminModulesTab />;
      case "master-setup":
        return <MasterSetupTab />;
      case "rm-dashboard":
        return <RMDashboard />;
      case "rm-team":
        return <RMTeamManagement />;
      case "rm-territory":
        return <RMTerritory />;
      case "rm-distributors":
        return <RMDistributors />;
      case "team-management":
        return <MasterSetupTab isTeamManagementView={true} defaultMaster="employees" />;
      case "sales-executive":
      case "territory-management":
      case "distributor-monitoring":
      case "sales-monitoring":
        const subTabMap: Record<string, string> = {
          "territory-management": "territory-setup",
          "distributor-monitoring": "distributor-linkage",
          "sales-monitoring": "targets-performance",
        };
        const initialSubTab = subTabMap[activeTab];
        return <SalesExecutiveTab defaultSubTab={initialSubTab} key={activeTab} />;
      // FIX: Matches the ID in TopNavigation
      case "admin-dashboard":
        return <AdminDashboard />;
      case "employees": 
        return <EmployeePortalTab />;
      case "employee-portal":
        return <EmployeePortalTab />;
      case "employee-dashboard":
        return <EmployeeDashboard />;
      case "product-booking":
        return <EmployeeProductBooking />;
      case "admin-orders":
        return <AdminOrdersTab />;
      case "inventory-management":
        return <InventoryManagementTab />;
      case "my-daily-tracking":
        return <DailyTrackingTab viewMode="self" />;
      case "team-daily-tracking":
        return <DailyTrackingTab viewMode="team" />;
      case "daily-tracking":
        return isAdmin ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Daily Tracking Management</h2>
                <p className="text-muted-foreground">Monitor team field operations, analytics, distances, and reimbursements.</p>
              </div>
            </div>
            <AdminLiveTracking />
          </div>
        ) : <DailyTrackingTab viewMode="self" />;
      case "team-tracking":
        return isAdmin ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Team Tracking Management</h2>
                <p className="text-muted-foreground">Monitor team field operations, analytics, distances, and reimbursements.</p>
              </div>
            </div>
            <AdminLiveTracking />
          </div>
        ) : <DailyTrackingTab viewMode="team" />;
      case "live-tracking":
      case "my-live-tracking":
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Live Tracking</h2>
                <p className="text-muted-foreground">Monitor your field operations, distances, and reimbursements.</p>
              </div>
            </div>
            {isAdmin ? <AdminLiveTracking /> : <LiveTrackingMap />}
          </div>
        );
      case "reports":
        return <ReportsTab />;
      case "alerts":
        return <AlertsTab />;
      case "documents":
        return <DocumentsTab />;
      case "communication":
        return <CommunicationTab />;
      case "projects":
        return <ProjectsTab />;
      case "permissions":
        return <PermissionsTab />;
      case "approvals":
        return <ApprovalsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <MasterSetupTab />;
    }
  };

  return (
    <MasterDataProvider>
      <div className="min-h-screen">
        <TopNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDark={isDark}
          onThemeToggle={handleThemeToggle}
        />

        <main className="pt-24 px-4 pb-24">
          <div className="max-w-7xl mx-auto">
            {activeTab === "master-setup" && <KPICards />}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </MasterDataProvider>
  );
};

export default Index;