import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Target,
  MapPin,
  Shield,
  Info,
  Eye,
  Pencil,
  Search,
  Download,
  Bell,
  CheckCircle2,
  Navigation,
  Phone,
  Link2,
  TrendingUp,
  Activity,
  Star,
  Clock,
  Filter,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlassModal } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useMasterData,
  SalesExecutive,
  Territory,
  SalesTarget,
  Alert,
  DistributorLink,
} from "@/contexts/MasterDataContext";
import { DistributorLinkageTab } from "@/components/sales/DistributorLinkageTab";
import type { DistributorLinkExtended } from "@/components/sales/DistributorLinkageTab";

// Interfaces now imported from MasterDataContext

// ============= Mock Data =============

const mockDistricts: Record<string, string[]> = {
  North: ["Delhi", "Chandigarh", "Lucknow", "Jaipur", "Dehradun"],
  South: ["Chennai", "Bangalore", "Hyderabad", "Kochi", "Mysore"],
  East: ["Kolkata", "Bhubaneswar", "Patna", "Ranchi", "Guwahati"],
  West: ["Mumbai", "Pune", "Ahmedabad", "Surat", "Nagpur"],
};

// Mock data now comes from MasterDataContext



// Sales targets and alerts now come from MasterDataContext



// ============= Sub Tabs =============

const subTabs = [
  { id: "sales-assignment", label: "Sales Executive Assignment", icon: Users },
  { id: "territory-setup", label: "Territory Setup", icon: MapPin },
  { id: "distributor-linkage", label: "Distributor Linkage", icon: Link2 },
  { id: "targets-performance", label: "Sales Targets & Performance", icon: Target },
  { id: "reporting-alerts", label: "Reporting & Alerts", icon: Bell },
];

// ============= Component =============

export function SalesExecutiveTab({ defaultSubTab }: { defaultSubTab?: string }) {
  let initialSubTabs = subTabs;
  try {
    const modulesEnabled: string[] = JSON.parse(sessionStorage.getItem("modulesEnabled") || "[]");
    const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
    
    if (!isGlobalAdmin && !modulesEnabled.includes("All")) {
      const tabToModuleMap: Record<string, string[]> = {
        "sales-assignment": ["territory_management"],
        "territory-setup": ["territory_management"],
        "distributor-linkage": ["distributor_linkage"],
        "targets-performance": ["sales_monitoring"],
        "reporting-alerts": ["sales_monitoring"]
      };
      
      initialSubTabs = subTabs.filter(tab => {
        const requiredModules = tabToModuleMap[tab.id] || [];
        return requiredModules.some(m => modulesEnabled.includes(m));
      });
    }
  } catch (e) {}

  const defaultActiveTab = defaultSubTab || (initialSubTabs.length > 0 ? initialSubTabs[0].id : "sales-assignment");
  const [activeSubTab, setActiveSubTab] = useState(defaultActiveTab);

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);
  
  // Shared data from context (synced across all modules)
  const { 
    employees,
    salesExecutives, setSalesExecutives,
    territories, setTerritories,
    salesTargets, setSalesTargets,
    alerts, setAlerts,
    distributorLinks,
    distributors,
    getEmployeeNameById,
    getTerritoryNameById,
    getSalesExecutiveNameById,
    getDistributorNameById,
    roles,
    rolePermissions,
  } = useMasterData();

  // --- PERMISSION CHECKS ---
  const rawRole = sessionStorage.getItem("userRole") || "employee";
  const currentRole = roles?.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const salesPerm = rolePermissions?.find(p => p.roleId === currentRole?.id && p.module === "Sales Executive");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = rawRole.toLowerCase() === "admin" || isGlobalAdmin;

  const canCreate = isAdmin || salesPerm?.create;
  const canEdit = isAdmin || salesPerm?.edit;
  const canDelete = isAdmin || salesPerm?.delete;
  const canExport = !!(isAdmin || salesPerm?.export);
  // -----------------------

  // Local state for distributor links view (extends context data)
  const [localDistributorLinks, setLocalDistributorLinks] = useState<DistributorLinkExtended[]>([]);

  // Sync distributor links with context
  useEffect(() => {
    if (distributorLinks && distributorLinks.length > 0) {
      setLocalDistributorLinks(distributorLinks as any);
    }
  }, [distributorLinks]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // ID generation
  const generateId = (prefix: string, list: any[]) => {
    return `${prefix}-${list.length + 1}`;
  };

  // Helper functions
  const getSalesExecutiveName = (id: string): string => {
    return salesExecutives.find((se) => se.id === id)?.fullName || "Unassigned";
  };

  const getTerritoryName = (id: string): string => {
    return territories.find((t) => t.id === id)?.name || "Unknown";
  };

  const getReportingManagerName = (id: string): string => {
    return employees.find((e) => e.id === id)?.fullName || "Unknown";
  };


  // Modal handlers
  const resetFormData = () => setFormData({});

  const openModal = (mode: "create" | "edit" | "view", item?: any) => {
    setModalMode(mode);
    setSelectedItem(item);
    if (mode === "create") {
      resetFormData();
      if (activeSubTab === "sales-assignment") {
        setFormData({ id: generateId("se", salesExecutives), gpsTracking: true, status: "Active" });
      } else if (activeSubTab === "territory-setup") {
        setFormData({ id: generateId("t", territories), geoFencing: true, linkedDistributorIds: [] });
      } else if (activeSubTab === "distributor-linkage") {
        setFormData({ id: generateId("dl", distributorLinks) });
      } else if (activeSubTab === "targets-performance") {
        setFormData({ id: generateId("st", salesTargets) });
      }
    } else if (item) {
      setFormData(
        activeSubTab === "territory-setup"
          ? {
              ...item,
              linkedDistributorIds: item.linkedDistributorIds || item.linkedDistributors || [],
            }
          : { ...item }
      );
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    resetFormData();
  };

  // Export handlers
  const handleExport = (format: "csv" | "excel" | "pdf") => {
    const data = getCurrentData();
    if (data.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    // Create CSV content
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          let val = row[header as keyof typeof row];
          if (val === null || val === undefined) val = "";
          // Handle arrays (e.g. linkedDistributorIds) and escape commas/quotes
          if (Array.isArray(val)) val = val.join(" | ");
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
      )
    ].join("\n");
    
    // Trigger download
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeSubTab}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  // Get section title and description
  const getSectionInfo = () => {
    switch (activeSubTab) {
      case "sales-assignment":
        return {
          title: "Sales Executive Assignment",
          description: "Manage all sales executives, their roles, and GPS tracking settings",
          addLabel: "Add Sales Executive",
        };
      case "territory-setup":
        return {
          title: "Territory Setup",
          description: "Configure territories, assign executives, and set geo-fencing rules",
          addLabel: "Add Territory",
        };
      case "distributor-linkage":
        return {
          title: "Distributor Linkage",
          description: "Link distributors to territories and verify license compliance",
          addLabel: "Add Distributor Link",
        };
      case "targets-performance":
        return {
          title: "Sales Targets & Performance",
          description: "Set targets, track achievements, and monitor performance metrics",
          addLabel: "Add Target",
        };
      default:
        return {
          title: "Reporting & Alerts",
          description: "View reports, activity logs, and system alerts",
          addLabel: "",
        };
    }
  };

  // ============= Sales Executive Assignment =============

  const salesExecutiveColumns: Column<SalesExecutive>[] = [
    {
      key: "id",
      header: "SE ID",
      className: "w-20",
      render: (value) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{String(value)}</span>
      ),
    },
    {
      key: "fullName",
      header: "Full Name",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {row.fullName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-medium">{row.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          value === "Regional Manager"
            ? "bg-violet-500/10 text-violet-500"
            : value === "Territory Manager"
            ? "bg-blue-500/10 text-blue-500"
            : "bg-emerald-500/10 text-emerald-500"
        }`}>
          {String(value)}
        </span>
      ),
    },
    { key: "department", header: "Department" },
    {
      key: "phone",
      header: "Contact",
      render: (_, row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="w-3 h-3" />
            {row.phone}
          </div>
        </div>
      ),
    },
    {
      key: "gpsTracking",
      header: "GPS",
      render: (value) => (
        <div className={`flex items-center gap-1 ${value ? "text-emerald-500" : "text-muted-foreground"}`}>
          <Navigation className={`w-4 h-4 ${value ? "animate-pulse" : ""}`} />
          <span className="text-xs">{value ? "On" : "Off"}</span>
        </div>
      ),
    },
    {
      key: "workMode",
      header: "Work Mode",
      render: (value) => (
        <span className="px-2 py-1 bg-muted rounded-lg text-xs">{String(value)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <StatusBadge
          status={value === "Active" ? "active" : value === "On Leave" ? "pending" : "inactive"}
          label={String(value)}
        />
      ),
    },
  ];

  const renderSalesExecutiveForm = () => (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-primary">Sales Executive Assignment</p>
          <p className="text-muted-foreground">
            Register sales team members with their roles, contact info, and tracking preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Sales Executive ID</Label>
          <Input value={formData.id || ""} disabled className="bg-muted font-mono" />
        </div>

        <div className="space-y-2">
          <Label>Employee *</Label>
          <Select
            value={formData.employeeId || ""}
            onValueChange={(v) => {
              const emp = employees.find(e => e.id === v);
              setFormData({ 
                ...formData, 
                employeeId: v, 
                fullName: emp?.fullName || "",
                email: emp?.email || formData.email,
                phone: emp?.mobileNumber || formData.phone,
              });
            }}
            disabled={modalMode === "view" || modalMode === "edit"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.filter(e => e.accountStatus).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Role *</Label>
          <Select
            value={formData.role || ""}
            onValueChange={(v) => setFormData({ ...formData, role: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sales Executive">Sales Executive</SelectItem>
              <SelectItem value="Territory Manager">Territory Manager</SelectItem>
              <SelectItem value="Regional Manager">Regional Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Department *</Label>
          <Select
            value={formData.department || ""}
            onValueChange={(v) => setFormData({ ...formData, department: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Logistics">Logistics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Reporting Manager *</Label>
          <Select
            value={formData.reportingManagerId || ""}
            onValueChange={(v) => setFormData({ ...formData, reportingManagerId: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {employees
                .filter((e) => e.accountStatus)
                .map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} - {emp.designation}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Work Mode *</Label>
          <Select
            value={formData.workMode || ""}
            onValueChange={(v) => setFormData({ ...formData, workMode: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select work mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Field">Field</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            value={formData.status || "Active"}
            onValueChange={(v) => setFormData({ ...formData, status: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div>
            <Label>GPS Tracking</Label>
            <p className="text-sm text-muted-foreground">Enable location tracking</p>
          </div>
          <Switch
            checked={formData.gpsTracking ?? true}
            onCheckedChange={(v) => setFormData({ ...formData, gpsTracking: v })}
            disabled={modalMode === "view"}
          />
        </div>
      </div>
    </div>
  );

  // ============= Territory Setup =============

  const territoryColumns: Column<Territory>[] = [
    {
      key: "id",
      header: "Territory ID",
      className: "w-24",
      render: (value) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{String(value)}</span>
      ),
    },
    { key: "name", header: "Territory Name" },
    {
      key: "region",
      header: "Region",
      render: (value) => (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
          value === "North"
            ? "bg-blue-500/10 text-blue-500"
            : value === "South"
            ? "bg-emerald-500/10 text-emerald-500"
            : value === "East"
            ? "bg-amber-500/10 text-amber-500"
            : "bg-violet-500/10 text-violet-500"
        }`}>
          {String(value)}
        </span>
      ),
    },
    { key: "district", header: "District" },
    {
      key: "assignedSalesExecutiveId",
      header: "Assigned SE",
      render: (value) => getSalesExecutiveName(String(value)),
    },
    {
      key: "linkedDistributorIds",
      header: "Distributors",
      render: (value) => {
        const linkedDistributorIds = Array.isArray(value) ? value : [];
        return (
          <span className="px-2 py-1 bg-accent/10 text-accent-foreground rounded-lg text-sm">
            {linkedDistributorIds.length} linked
          </span>
        );
      },
    },
    {
      key: "geoFencing",
      header: "Geo-Fencing",
      render: (value) => (
        <StatusBadge
          status={value ? "active" : "inactive"}
          label={value ? "Enabled" : "Disabled"}
        />
      ),
    },
  ];

  const renderTerritoryForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Territory ID</Label>
          <Input value={formData.id || ""} disabled className="bg-muted font-mono" />
        </div>

        <div className="space-y-2">
          <Label>Territory Name *</Label>
          <Input
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter territory name"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2">
          <Label>Region *</Label>
          <Select
            value={formData.region || ""}
            onValueChange={(v) => setFormData({ ...formData, region: v, district: "" })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>District *</Label>
          <Select
            value={formData.district || ""}
            onValueChange={(v) => setFormData({ ...formData, district: v })}
            disabled={modalMode === "view" || !formData.region}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {(mockDistricts[formData.region as keyof typeof mockDistricts] || []).map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assigned Sales Executive *</Label>
          <Select
            value={formData.assignedSalesExecutiveId || ""}
            onValueChange={(v) => setFormData({ ...formData, assignedSalesExecutiveId: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sales executive" />
            </SelectTrigger>
            <SelectContent>
              {salesExecutives
                .filter((se) => se.status === "Active")
                .map((se) => (
                  <SelectItem key={se.id} value={se.id}>
                    {se.fullName} ({se.role})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Linked Distributors</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-xl min-h-[60px]">
            {distributors.map((dist) => {
              const isSelected = (formData.linkedDistributorIds || []).includes(dist.id);
              return (
                <button
                  key={dist.id}
                  type="button"
                  onClick={() => {
                    if (modalMode === "view") return;
                    const current = formData.linkedDistributorIds || [];
                    const updated = isSelected
                      ? current.filter((id: string) => id !== dist.id)
                      : [...current, dist.id];
                    setFormData({ ...formData, linkedDistributorIds: updated });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {dist.firmName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Coverage Area</Label>
          <Textarea
            value={formData.coverageArea || ""}
            onChange={(e) => setFormData({ ...formData, coverageArea: e.target.value })}
            placeholder="Describe coverage area or paste map coordinates"
            disabled={modalMode === "view"}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl md:col-span-2">
          <div>
            <Label>Geo-Fencing Rules</Label>
            <p className="text-sm text-muted-foreground">Auto-trigger alerts if executive exits assigned area</p>
          </div>
          <Switch
            checked={formData.geoFencing ?? true}
            onCheckedChange={(v) => setFormData({ ...formData, geoFencing: v })}
            disabled={modalMode === "view"}
          />
        </div>
      </div>
    </div>
  );

  // ============= Distributor Linkage - Now uses dedicated component =============
  // The distributorLinkColumns and renderDistributorLinkForm are replaced by DistributorLinkageTab component

  const renderDistributorLinkForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Distributor *</Label>
          <Select
            value={formData.distributorId || ""}
            onValueChange={(v) => {
              const dist = distributors.find((d) => d.id === v);
              setFormData({ ...formData, distributorId: v, firmName: dist?.firmName || "" });
            }}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select distributor" />
            </SelectTrigger>
            <SelectContent>
              {distributors.map((dist) => (
                <SelectItem key={dist.id} value={dist.id}>
                  {dist.firmName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Firm Name</Label>
          <Input value={formData.firmName || ""} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>Assigned Territory *</Label>
          <Select
            value={formData.assignedTerritoryId || ""}
            onValueChange={(v) => {
              const territory = territories.find((t) => t.id === v);
              setFormData({
                ...formData,
                assignedTerritoryId: v,
                assignedSalesExecutiveId: territory?.assignedSalesExecutiveId || "",
              });
            }}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select territory" />
            </SelectTrigger>
            <SelectContent>
              {territories.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.region})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assigned Sales Executive</Label>
          <Input
            value={getSalesExecutiveName(formData.assignedSalesExecutiveId || "")}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label>Retailer Network Count</Label>
          <Input
            type="number"
            value={formData.retailerNetworkCount || ""}
            onChange={(e) => setFormData({ ...formData, retailerNetworkCount: parseInt(e.target.value) || 0 })}
            placeholder="Enter count"
            disabled={modalMode === "view"}
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label>License Compliance</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
            <Checkbox
              id="seedLicense"
              checked={formData.seedLicense ?? false}
              onCheckedChange={(v) => setFormData({ ...formData, seedLicense: v })}
              disabled={modalMode === "view"}
            />
            <Label htmlFor="seedLicense" className="cursor-pointer">Seed License Verified</Label>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
            <Checkbox
              id="fertiliserLicense"
              checked={formData.fertiliserLicense ?? false}
              onCheckedChange={(v) => setFormData({ ...formData, fertiliserLicense: v })}
              disabled={modalMode === "view"}
            />
            <Label htmlFor="fertiliserLicense" className="cursor-pointer">Fertiliser License Verified</Label>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
            <Checkbox
              id="pesticideLicense"
              checked={formData.pesticideLicense ?? false}
              onCheckedChange={(v) => setFormData({ ...formData, pesticideLicense: v })}
              disabled={modalMode === "view"}
            />
            <Label htmlFor="pesticideLicense" className="cursor-pointer">Pesticide License Verified</Label>
          </div>
        </div>
      </div>
    </div>
  );

  // ============= Sales Targets & Performance =============

  const salesTargetColumns: Column<SalesTarget>[] = [
    {
      key: "id",
      header: "Target ID",
      render: (value) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{String(value)}</span>
      ),
    },
    {
      key: "employeeId",
      header: "Sales Executive",
      render: (value) => getSalesExecutiveName(String(value)),
    },
    {
      key: "territoryId",
      header: "Territory",
      render: (value) => getTerritoryName(String(value)),
    },
    {
      key: "productCategory",
      header: "Category",
      render: (value) => (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
          value === "Fertiliser"
            ? "bg-emerald-500/10 text-emerald-500"
            : value === "Seed"
            ? "bg-blue-500/10 text-blue-500"
            : "bg-amber-500/10 text-amber-500"
        }`}>
          {String(value)}
        </span>
      ),
    },
    {
      key: "targetValue",
      header: "Target (₹)",
      render: (value) => `₹${Number(value).toLocaleString()}`,
    },
    {
      key: "achievementValue",
      header: "Achievement (₹)",
      render: (value) => `₹${Number(value).toLocaleString()}`,
    },
    {
      key: "achievementValue",
      header: "Achievement %",
      render: (_, row) => {
        const percent = row.targetValue > 0 ? Math.round((row.achievementValue / row.targetValue) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  percent >= 100 ? "bg-emerald-500" : percent >= 70 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              percent >= 100 ? "text-emerald-500" : percent >= 70 ? "text-amber-500" : "text-rose-500"
            }`}>
              {percent}%
            </span>
          </div>
        );
      },
    },
    {
      key: "siteVisits",
      header: "Visits",
      render: (value) => (
        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">{String(value)}</span>
      ),
    },
    {
      key: "feedbackScore",
      header: "Feedback",
      render: (value) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>{String(value)}</span>
        </div>
      ),
    },
    {
      key: "pendingApprovals",
      header: "Pending",
      render: (value) => (
        <span className={`px-2 py-1 rounded text-sm ${
          Number(value) > 0 ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"
        }`}>
          {String(value)}
        </span>
      ),
    },
  ];

  const renderSalesTargetForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Target ID</Label>
          <Input value={formData.id || ""} disabled className="bg-muted font-mono" />
        </div>

        <div className="space-y-2">
          <Label>Sales Executive *</Label>
          <Select
            value={formData.employeeId || ""}
            onValueChange={(v) => setFormData({ ...formData, employeeId: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sales executive" />
            </SelectTrigger>
            <SelectContent>
              {salesExecutives
                .filter((se) => se.status === "Active")
                .map((se) => (
                  <SelectItem key={se.id} value={se.id}>
                    {se.fullName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Territory *</Label>
          <Select
            value={formData.territoryId || ""}
            onValueChange={(v) => setFormData({ ...formData, territoryId: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select territory" />
            </SelectTrigger>
            <SelectContent>
              {territories.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product Category *</Label>
          <Select
            value={formData.productCategory || ""}
            onValueChange={(v) => setFormData({ ...formData, productCategory: v })}
            disabled={modalMode === "view"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fertiliser">Fertiliser</SelectItem>
              <SelectItem value="Seed">Seed</SelectItem>
              <SelectItem value="Chemical">Chemical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Value (₹) *</Label>
          <Input
            type="number"
            value={formData.targetValue || ""}
            onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
            placeholder="Enter target value"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2">
          <Label>Achievement Value (₹)</Label>
          <Input
            type="number"
            value={formData.achievementValue || ""}
            onChange={(e) => setFormData({ ...formData, achievementValue: parseInt(e.target.value) || 0 })}
            placeholder="Enter achievement value"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2">
          <Label>Site Visits</Label>
          <Input
            type="number"
            value={formData.siteVisits || ""}
            onChange={(e) => setFormData({ ...formData, siteVisits: parseInt(e.target.value) || 0 })}
            placeholder="Number of visits"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2">
          <Label>Customer Feedback Score (1-5)</Label>
          <Input
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={formData.feedbackScore || ""}
            onChange={(e) => setFormData({ ...formData, feedbackScore: parseFloat(e.target.value) || 0 })}
            placeholder="Enter score"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2">
          <Label>Pending Approvals</Label>
          <Input
            type="number"
            value={formData.pendingApprovals || ""}
            onChange={(e) => setFormData({ ...formData, pendingApprovals: parseInt(e.target.value) || 0 })}
            placeholder="Number of pending"
            disabled={modalMode === "view"}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Remarks (Manager Comments)</Label>
          <Textarea
            value={formData.remarks || ""}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Add manager comments or remarks"
            disabled={modalMode === "view"}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // ============= Reporting & Alerts =============

  const renderReportingAlerts = () => (
    <div className="space-y-6">
      {/* Activity Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border rounded-xl bg-gradient-to-br from-primary/5 to-transparent"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Daily Activity Log</h3>
              <p className="text-xs text-muted-foreground">Auto-generated</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Site visits, meetings, and sales activities logged today.</p>
          <Button variant="outline" size="sm" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 border rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold">Territory Performance</h3>
              <p className="text-xs text-muted-foreground">Auto-generated</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Sales vs targets analysis by territory.</p>
          <Button variant="outline" size="sm" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 border rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold">Compliance Report</h3>
              <p className="text-xs text-muted-foreground">Auto-generated</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">License and stock status of distributors.</p>
          <Button variant="outline" size="sm" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </motion.div>
      </div>

      {/* Alerts Section */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">System Alerts</h3>
          </div>
          <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-medium">
            {alerts.filter((a) => !a.resolved).length} Active
          </span>
        </div>
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 flex items-start gap-4 ${alert.resolved ? "bg-muted/30" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                alert.severity === "high"
                  ? "bg-rose-500/10"
                  : alert.severity === "medium"
                  ? "bg-amber-500/10"
                  : "bg-blue-500/10"
              }`}>
                {alert.type === "low_achievement" && (
                  <TrendingUp className={`w-5 h-5 ${
                    alert.severity === "high" ? "text-rose-500" : "text-amber-500"
                  }`} />
                )}
                {alert.type === "inactive_gps" && (
                  <Navigation className="w-5 h-5 text-blue-500" />
                )}
                {alert.type === "pending_approval" && (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
                {alert.type === "compliance" && (
                  <Shield className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-medium ${alert.resolved ? "text-muted-foreground" : ""}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                  </div>
                  {alert.resolved ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolved
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, resolved: true } : a)));
                      }}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============= Render Helpers =============

  const getModalTitle = () => {
    const prefix = modalMode === "create" ? "Add" : modalMode === "edit" ? "Edit" : "View";
    switch (activeSubTab) {
      case "sales-assignment":
        return `${prefix} Sales Executive`;
      case "territory-setup":
        return `${prefix} Territory`;
      case "distributor-linkage":
        return `${prefix} Distributor Link`;
      case "targets-performance":
        return `${prefix} Sales Target`;
      default:
        return prefix;
    }
  };

  const renderModalContent = () => {
    switch (activeSubTab) {
      case "sales-assignment":
        return renderSalesExecutiveForm();
      case "territory-setup":
        return renderTerritoryForm();
      case "distributor-linkage":
        return renderDistributorLinkForm();
      case "targets-performance":
        return renderSalesTargetForm();
      default:
        return null;
    }
  };

    const getHeaders = () => ({
    "Content-Type": "application/json",
    "X-User-Id": sessionStorage.getItem("userId") || "",
    "X-User-Role": sessionStorage.getItem("userRole") || "",
    "X-Organization-Id": sessionStorage.getItem("organizationId") || "",
  });

  const handleSave = async () => {
    const BASE_CRM = `/api/crm`;
    switch (activeSubTab) {
      case "sales-assignment":
        if (modalMode === "create") {
          try {
            const res = await fetch(`${BASE_CRM}/sales-executives/`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(formData),
            });
            if (res.ok) {
              const saved = await res.json();
              setSalesExecutives([...salesExecutives, saved]);
            } else {
              const err = await res.json();
              alert("Error: " + JSON.stringify(err));
            }
          } catch { alert("Network error."); }
        } else if (modalMode === "edit" && selectedItem) {
          try {
            const res = await fetch(`${BASE_CRM}/sales-executives/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: getHeaders(),
              body: JSON.stringify(formData),
            });
            if (res.ok) {
              const updated = await res.json();
              setSalesExecutives(salesExecutives.map((se) => (se.id === selectedItem.id ? updated : se)));
            } else {
              const err = await res.json();
              alert("Error: " + JSON.stringify(err));
            }
          } catch { alert("Network error."); }
        }
        break;
      case "territory-setup":
        if (modalMode === "create") {
          try {
            const res = await fetch(`${BASE_CRM}/territories/`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(formData),
            });
            if (res.ok) {
              const saved = await res.json();
              setTerritories([...territories, saved]);
            } else {
              const err = await res.json();
              alert("Error: " + JSON.stringify(err));
            }
          } catch { alert("Network error."); }
        } else if (modalMode === "edit" && selectedItem) {
          try {
            const res = await fetch(`${BASE_CRM}/territories/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: getHeaders(),
              body: JSON.stringify(formData),
            });
            if (res.ok) {
              const updated = await res.json();
              setTerritories(territories.map((t) => (t.id === selectedItem.id ? updated : t)));
            } else {
              const err = await res.json();
              alert("Error: " + JSON.stringify(err));
            }
          } catch { alert("Network error."); }
        }
        break;
      case "targets-performance":
        if (modalMode === "create") {
          try {
            const res = await fetch(`${BASE_CRM}/sales-targets/`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(formData),
            });
            if (res.ok) {
              const saved = await res.json();
              setSalesTargets([...salesTargets, saved]);
            } else {
              const err = await res.json();
              alert("Error: " + JSON.stringify(err));
            }
          } catch { alert("Network error."); }
        } else if (modalMode === "edit" && selectedItem) {
          try {
            const res = await fetch(`${BASE_CRM}/sales-targets/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: getHeaders(),
              body: JSON.stringify(formData),
            });
            if (res.ok) {
              const updated = await res.json();
              setSalesTargets(salesTargets.map((st) => (st.id === selectedItem.id ? updated : st)));
            } else {
              const err = await res.json();
              alert("Error: " + JSON.stringify(err));
            }
          } catch { alert("Network error."); }
        }
        break;
    }
    closeModal();
  };

  const handleDelete = async (item: any) => {
    const BASE_CRM = `/api/crm`;
    if (!confirm(`Are you sure you want to delete this item?`)) return;
    switch (activeSubTab) {
      case "sales-assignment":
        try {
          const res = await fetch(`${BASE_CRM}/sales-executives/${item.id}/`, { method: 'DELETE', headers: getHeaders() });
          if (res.ok) setSalesExecutives(salesExecutives.filter((se) => se.id !== item.id));
          else alert("Failed to delete sales executive.");
        } catch { alert("Network error."); }
        break;
      case "territory-setup":
        try {
          const res = await fetch(`${BASE_CRM}/territories/${item.id}/`, { method: 'DELETE', headers: getHeaders() });
          if (res.ok) setTerritories(territories.filter((t) => t.id !== item.id));
          else alert("Failed to delete territory.");
        } catch { alert("Network error."); }
        break;
      case "distributor-linkage":
        try {
          const res = await fetch(`${BASE_CRM}/distributor-links/${item.id}/`, { method: 'DELETE', headers: getHeaders() });
          if (res.ok) setLocalDistributorLinks(localDistributorLinks.filter((dl) => dl.id !== item.id));
          else alert("Failed to delete distributor link.");
        } catch { alert("Network error."); }
        break;
      case "targets-performance":
        try {
          const res = await fetch(`${BASE_CRM}/sales-targets/${item.id}/`, { method: 'DELETE', headers: getHeaders() });
          if (res.ok) setSalesTargets(salesTargets.filter((st) => st.id !== item.id));
          else alert("Failed to delete sales target.");
        } catch { alert("Network error."); }
        break;
    }
  };

  const getCurrentData = () => {
    switch (activeSubTab) {
      case "sales-assignment":
        return salesExecutives.filter((se) => {
          const matchesStatus = filterStatus === "all" || se.status === filterStatus;
          const matchesRole = filterCategory === "all" || se.role === filterCategory;
          return matchesStatus && matchesRole;
        });
      case "territory-setup":
        return territories.filter((t) => {
          const matchesStatus = filterStatus === "all" || t.status === filterStatus;
          const matchesRegion = filterRegion === "all" || t.region === filterRegion;
          return matchesStatus && matchesRegion;
        });
      case "distributor-linkage":
        return distributorLinks;
      case "targets-performance":
        return salesTargets.filter((st) => {
          const matchesStatus = filterStatus === "all" || st.status === filterStatus;
          return matchesStatus;
        });
      default:
        return [];
    }
  };

  const renderFilters = () => {
    if (activeSubTab === "sales-assignment") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Senior Sales Executive">Senior Sales Executive</SelectItem>
                <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                <SelectItem value="Trainee">Trainee</SelectItem>
                <SelectItem value="Area Manager">Area Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    } else if (activeSubTab === "territory-setup") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Region</Label>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger><SelectValue placeholder="All Regions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="West">West</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    } else if (activeSubTab === "targets-performance") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="On Track">On Track</SelectItem>
                <SelectItem value="Behind">Behind</SelectItem>
                <SelectItem value="Achieved">Achieved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    return null;
  };

  const getCurrentColumns = (): Column<any>[] => {
    switch (activeSubTab) {
      case "sales-assignment":
        return salesExecutiveColumns;
      case "territory-setup":
        return territoryColumns;
      case "targets-performance":
        return salesTargetColumns;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs - Hidden if controlled by top navigation */}
      {!defaultSubTab && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-xl border border-border/50">
          {initialSubTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
      )}

      {/* Section Header - Hide for distributor-linkage as it has its own */}
      {activeSubTab !== "distributor-linkage" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {getSectionInfo().title}
            </h2>
            <p className="text-muted-foreground">
              {getSectionInfo().description}
            </p>
          </div>
          {activeSubTab !== "reporting-alerts" && canCreate && (
            <Button onClick={() => openModal("create")} className="gap-2">
              <Plus className="w-4 h-4" />
              {getSectionInfo().addLabel}
            </Button>
          )}
        </div>
      )}


      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === "reporting-alerts" ? (
            renderReportingAlerts()
          ) : activeSubTab === "distributor-linkage" ? (
            <DistributorLinkageTab
              distributorLinks={localDistributorLinks}
              territories={territories}
              salesExecutives={salesExecutives}
              onUpdate={setLocalDistributorLinks}
              getSalesExecutiveName={getSalesExecutiveName}
              getTerritoryName={getTerritoryName}
            />
          ) : (
            <DataTable
              columns={getCurrentColumns()}
              data={getCurrentData()}
              onView={(row) => openModal("view", row)}
              onEdit={canEdit ? (row) => openModal("edit", row) : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              showExport={canExport}
              onExport={canExport ? () => handleExport("csv") : undefined}
              filterContent={renderFilters()}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={getModalTitle()}
        size="lg"
      >
        {renderModalContent()}
        {modalMode !== "view" && (
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {modalMode === "create" ? "Create" : "Save Changes"}
            </Button>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
