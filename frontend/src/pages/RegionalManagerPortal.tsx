import { useState } from "react";
import { LayoutDashboard, Users, Package, Activity, FileText, Bell, FileBox, Search, BellRing, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RMDashboard from "@/components/regional-manager/RMDashboard";
import RMTeamManagement from "@/components/regional-manager/RMTeamManagement";
import InventoryManagementTab from "@/components/tabs/InventoryManagementTab";
import { AdminLiveTracking } from "@/components/tracking/AdminLiveTracking";
import ReportsTab from "@/components/tabs/ReportsTab";
import { AlertsTab } from "@/components/tabs/AlertsTab";
import { DocumentsTab } from "@/components/tabs/DocumentsTab";
import { ProfileTab } from "@/components/tabs/ProfileTab";

export default function RegionalManagerPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <RMDashboard />;
      case "sales_executive":
        return <RMTeamManagement />;
      case "inventory":
        return <InventoryManagementTab />;
      case "tracking":
        return <AdminLiveTracking />;
      case "report":
        return <ReportsTab />;
      case "alerts":
        return <AlertsTab />;
      case "document":
        return <DocumentsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <RMDashboard />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales_executive", label: "Sales Executive", icon: Users },
    { id: "inventory", label: "Inventory Management", icon: Package },
    { id: "tracking", label: "Daily Tracking", icon: Activity },
    { id: "report", label: "Report", icon: FileText },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "document", label: "Document", icon: FileBox },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white">
            <span className="font-bold text-sm">fs</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-base leading-tight">Field Sense</h1>
            <span className="text-[10px] font-bold text-[#2563eb] tracking-wide">REGIONAL MANAGER PORTAL</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                activeTab === item.id 
                  ? "bg-[#2563eb] text-white" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-[#2563eb] rounded-xl p-4 text-white shadow-md">
            <div className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-2 uppercase tracking-wider">
              View-Only Role
            </div>
            <h3 className="font-bold text-sm mb-1">Regional Monitoring Access</h3>
            <p className="text-xs text-blue-100 leading-tight">
              Employee, role, product & system settings are managed by Admin.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-[#2563eb]" 
                placeholder="Search executives, distributors, territories, orders..." 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
              <BellRing className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                AS
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900 leading-none">Amit Sharma</p>
                <p className="text-[11px] text-gray-500 mt-1">Regional Manager</p>
              </div>
              <Settings className="w-4 h-4 text-gray-400 ml-2 cursor-pointer hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-auto p-6 bg-[#f8fafc]">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-300">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
