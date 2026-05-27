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
import { KPICards } from "@/components/layout/KPICards";
import { MasterSetupTab } from "@/components/tabs/MasterSetupTab";
import { SalesExecutiveTab } from "@/components/tabs/SalesExecutiveTab";
// FIX: Using curly braces for the Named Export
import { EmployeePortalTab } from "@/components/tabs/EmployeePortalTab";
import InventoryManagementTab from "@/components/tabs/InventoryManagementTab";
import { DailyTrackingTab } from "@/components/tabs/DailyTrackingTab";
import { PlaceholderTab } from "@/components/tabs/PlaceholderTab";
import { ReportsTab } from "@/components/tabs/ReportsTab";
import { MasterDataProvider } from "@/contexts/MasterDataContext";
import { LiveTrackingMap } from "@/components/tracking/LiveTrackingMap";

const Index = () => {
  const userRole = sessionStorage.getItem("userRole");
  const initialTab = userRole === "admin" ? "master-setup" 
                   : userRole === "WH_MGR" ? "inventory-management"
                   : "employee-portal";
                   
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "master-setup":
        return <MasterSetupTab />;
      case "sales-executive":
        return <SalesExecutiveTab />;
      // FIX: Matches the ID in TopNavigation
      case "employees": 
        return <EmployeePortalTab />;
      case "employee-portal":
        return <EmployeePortalTab />;
      case "inventory-management":
        return <InventoryManagementTab />;
      case "daily-tracking":
        return <DailyTrackingTab />;
      case "live-tracking":
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Live Tracking & Route History</h2>
                <p className="text-muted-foreground">Monitor field operations, calculate distances, and automate travel reimbursements.</p>
              </div>
            </div>
            <LiveTrackingMap />
          </div>
        );
      case "reports":
        return <ReportsTab />;
      case "alerts":
        return (
          <PlaceholderTab
            title="Alerts & Escalation"
            description="Set up automated alerts for missed meetings, delayed tasks, and performance thresholds."
            icon={AlertTriangle}
          />
        );
      case "documents":
        return (
          <PlaceholderTab
            title="Documents & Logs"
            description="Manage all project documents, visit photos, task proofs, and activity logs."
            icon={FileText}
          />
        );
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
            <KPICards />

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
      </div>
    </MasterDataProvider>
  );
};

export default Index;