import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Filter,
  Plus,
  Eye,
  Pencil,
  CheckCircle2,
  XCircle,
  Building2,
  Store,
  Truck,
  Monitor,
  Wifi,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  X,
  ChevronDown,
  Upload,
  File,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { GlassModal } from "@/components/ui/GlassModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ============= Interfaces =============

export interface DistributorLinkExtended {
  id: string;
  distributorId: string;
  firmName: string;
  assignedTerritoryId: string;
  assignedSalesExecutiveIds: string[]; // Changed to array for multi-select
  // License Compliance
  seedLicense: boolean;
  seedLicenseNumber?: string;
  seedLicenseExpiry?: string;
  fertiliserLicense: boolean;
  fertiliserLicenseNumber?: string;
  fertiliserLicenseExpiry?: string;
  pesticideLicense: boolean;
  pesticideLicenseNumber?: string;
  pesticideLicenseExpiry?: string;
  // Retailer Network
  retailerNetworkCount: number;
  retailers: Retailer[];
  // Infrastructure
  godownSpace: number; // in sq ft
  shopSpace: number; // in sq ft
  vehicleCount: number;
  hasComputer: boolean;
  hasInternet: boolean;
  // Status - expanded options
  status: "Submitted" | "Forwarded" | "Approved" | "Rejected" | "Active" | "Inactive";
  statusHistory: StatusHistoryEntry[];
  // Contact
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  // Supporting Documents
  supportingDocuments?: SupportingDocument[];
}

interface SupportingDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface Retailer {
  id: string;
  name: string;
  phone: string;
  location: string;
  status: "Active" | "Inactive";
}

interface StatusHistoryEntry {
  status: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface Territory {
  id: string;
  name: string;
  region: string;
  assignedSalesExecutiveId: string;
}

interface SalesExecutive {
  id: string;
  fullName: string;
}

interface DistributorLinkageTabProps {
  distributorLinks: DistributorLinkExtended[];
  territories: Territory[];
  salesExecutives: SalesExecutive[];
  onUpdate: (links: DistributorLinkExtended[]) => void;
  getSalesExecutiveName: (id: string) => string;
  getTerritoryName: (id: string) => string;
}

// ============= Mock Distributors =============

const mockDistributors = [
  { id: "d1", name: "Agri Fresh Distributors" },
  { id: "d2", name: "Green Valley Fertilizers" },
  { id: "d3", name: "Farm Plus Seeds" },
  { id: "d4", name: "Kisan Seva Center" },
  { id: "d5", name: "Harvest King Supplies" },
  { id: "d6", name: "Bio Grow Distributors" },
  { id: "d7", name: "Crop Care Solutions" },
  { id: "d8", name: "Agro World Traders" },
];

// Status options
const statusOptions = [
  { value: "Submitted", label: "📝 Submitted", color: "bg-blue-500" },
  { value: "Forwarded", label: "➡️ Forwarded", color: "bg-indigo-500" },
  { value: "Approved", label: "✅ Approved", color: "bg-emerald-500" },
  { value: "Rejected", label: "❌ Rejected", color: "bg-rose-500" },
  { value: "Active", label: "🟢 Active", color: "bg-green-500" },
  { value: "Inactive", label: "⚫ Inactive", color: "bg-gray-500" },
];

// ============= Component =============

export function DistributorLinkageTab({
  distributorLinks,
  territories,
  salesExecutives,
  onUpdate,
  getSalesExecutiveName,
  getTerritoryName,
}: DistributorLinkageTabProps) {
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLicense, setFilterLicense] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRetailerRange, setFilterRetailerRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");
  const [selectedItem, setSelectedItem] = useState<DistributorLinkExtended | null>(null);
  const [formData, setFormData] = useState<Partial<DistributorLinkExtended>>({});
  
  // Validation states
  const [phoneError, setPhoneError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate ID
  const generateId = () => `dl-${distributorLinks.length + 1}`;

  // Validation functions
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    const isValid = phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    setPhoneError(isValid ? "" : "Please enter a valid phone number (min 10 digits)");
    return isValid;
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailError(isValid ? "" : "Please enter a valid email address");
    return isValid;
  };

  // Filter data
  const getFilteredData = (): DistributorLinkExtended[] => {
    if (!distributorLinks || !Array.isArray(distributorLinks)) return [];
    return distributorLinks.filter((item) => {
      // Search filter
      const seNames = (item.assignedSalesExecutiveIds || []).map(id => getSalesExecutiveName(id)).join(" ");
      const matchesSearch =
        searchQuery === "" ||
        (item.firmName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.distributorId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTerritoryName(item.assignedTerritoryId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        seNames.toLowerCase().includes(searchQuery.toLowerCase());

      // License filter
      const matchesLicense =
        filterLicense === "all" ||
        (filterLicense === "seed" && item.seedLicense) ||
        (filterLicense === "fertiliser" && item.fertiliserLicense) ||
        (filterLicense === "pesticide" && item.pesticideLicense) ||
        (filterLicense === "incomplete" && (!item.seedLicense || !item.fertiliserLicense || !item.pesticideLicense));

      // Status filter
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;

      // Retailer count filter
      let matchesRetailerRange = true;
      if (filterRetailerRange === "0-10") matchesRetailerRange = item.retailerNetworkCount >= 0 && item.retailerNetworkCount <= 10;
      else if (filterRetailerRange === "11-25") matchesRetailerRange = item.retailerNetworkCount >= 11 && item.retailerNetworkCount <= 25;
      else if (filterRetailerRange === "26-50") matchesRetailerRange = item.retailerNetworkCount >= 26 && item.retailerNetworkCount <= 50;
      else if (filterRetailerRange === "50+") matchesRetailerRange = item.retailerNetworkCount > 50;

      return matchesSearch && matchesLicense && matchesStatus && matchesRetailerRange;
    });
  };

  // Modal handlers
  const openModal = (mode: "create" | "edit" | "view", item?: DistributorLinkExtended) => {
    setModalMode(mode);
    setSelectedItem(item || null);
    setPhoneError("");
    setEmailError("");
    if (mode === "create") {
      setFormData({
        id: generateId(),
        status: "Submitted",
        assignedSalesExecutiveIds: [],
        retailerNetworkCount: 0,
        retailers: [],
        godownSpace: 0,
        shopSpace: 0,
        vehicleCount: 0,
        hasComputer: false,
        hasInternet: false,
        seedLicense: false,
        fertiliserLicense: false,
        pesticideLicense: false,
        statusHistory: [],
        supportingDocuments: [],
      });
    } else if (item) {
      // Handle legacy data with single SE
      const formDataWithArray = {
        ...item,
        assignedSalesExecutiveIds: item.assignedSalesExecutiveIds || 
          ((item as any).assignedSalesExecutiveId ? [(item as any).assignedSalesExecutiveId] : []),
      };
      setFormData(formDataWithArray);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormData({});
    setPhoneError("");
    setEmailError("");
  };

  const openRetailerModal = (item: DistributorLinkExtended) => {
    setSelectedItem(item);
    setIsRetailerModalOpen(true);
  };

  // File upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newDocs: SupportingDocument[] = Array.from(files).map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }));
    
    setFormData({
      ...formData,
      supportingDocuments: [...(formData.supportingDocuments || []), ...newDocs],
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeDocument = (docId: string) => {
    setFormData({
      ...formData,
      supportingDocuments: (formData.supportingDocuments || []).filter((d) => d.id !== docId),
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Toggle SE in multi-select
  const toggleSalesExecutive = (seId: string) => {
    const currentIds = formData.assignedSalesExecutiveIds || [];
    const newIds = currentIds.includes(seId)
      ? currentIds.filter((id) => id !== seId)
      : [...currentIds, seId];
    setFormData({ ...formData, assignedSalesExecutiveIds: newIds });
  };

  const handleSave = async () => {
    const BASE_CRM = `${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/crm`;
    if (modalMode === "create") {
      const newItem: DistributorLinkExtended = {
        ...formData,
        id: formData.id || generateId(),
        retailers: formData.retailers || [],
        statusHistory: [
          {
            status: formData.status || "Pending",
            changedBy: "Admin",
            changedAt: new Date().toISOString(),
            reason: "Initial creation",
          },
        ],
      } as DistributorLinkExtended;
      try {
        const res = await fetch(`${BASE_CRM}/distributor-links/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        if (res.ok) {
          const saved = await res.json();
          onUpdate([...distributorLinks, saved]);
        } else {
          const err = await res.json();
          alert("Error: " + JSON.stringify(err));
        }
      } catch { alert("Network error."); }
    } else if (modalMode === "edit" && selectedItem) {
      const updatedItem = {
        ...selectedItem,
        ...formData,
        statusHistory:
          selectedItem.status !== formData.status
            ? [
                ...selectedItem.statusHistory,
                {
                  status: formData.status || selectedItem.status,
                  changedBy: "Admin",
                  changedAt: new Date().toISOString(),
                  reason: "Status updated",
                },
              ]
            : selectedItem.statusHistory,
      };
      try {
        const res = await fetch(`${BASE_CRM}/distributor-links/${selectedItem.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
        if (res.ok) {
          const updated = await res.json();
          onUpdate(distributorLinks.map((dl) => (dl.id === selectedItem.id ? updated : dl)));
        } else {
          const err = await res.json();
          alert("Error: " + JSON.stringify(err));
        }
      } catch { alert("Network error."); }
    }
    closeModal();
  };

  const handleDelete = async (item: DistributorLinkExtended) => {
    const BASE_CRM = `${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/crm`;
    if (!confirm(`Are you sure you want to delete this distributor link?`)) return;
    try {
      const res = await fetch(`${BASE_CRM}/distributor-links/${item.id}/`, { method: 'DELETE' });
      if (res.ok) {
        onUpdate(distributorLinks.filter((dl) => dl.id !== item.id));
      } else {
        alert("Failed to delete distributor link.");
      }
    } catch { alert("Network error."); }
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    console.log(`Exporting as ${format}...`);
    // In real implementation, this would generate and download the file
  };

  const clearFilters = () => {
    setFilterLicense("all");
    setFilterStatus("all");
    setFilterRetailerRange("all");
    setSearchQuery("");
  };

  const hasActiveFilters = filterLicense !== "all" || filterStatus !== "all" || filterRetailerRange !== "all";

  // ============= License Compliance Badge =============
  const renderLicenseCompliance = (item: DistributorLinkExtended) => (
    <div className="flex flex-wrap gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          item.seedLicense
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        }`}
      >
        {item.seedLicense ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        Seed
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          item.fertiliserLicense
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        }`}
      >
        {item.fertiliserLicense ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        Fertiliser
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          item.pesticideLicense
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        }`}
      >
        {item.pesticideLicense ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        Pesticide
      </span>
    </div>
  );

  // ============= Infrastructure Icons =============
  const renderInfrastructure = (item: DistributorLinkExtended) => (
    <div className="flex flex-wrap gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg text-xs hover:bg-muted/80 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>{item.godownSpace > 0 ? `${item.godownSpace.toLocaleString()} sqft` : "-"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 text-sm bg-popover">
          <p className="font-medium">Godown Space</p>
          <p className="text-muted-foreground">{item.godownSpace > 0 ? `${item.godownSpace.toLocaleString()} sq ft` : "Not available"}</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg text-xs hover:bg-muted/80 transition-colors">
            <Store className="w-3.5 h-3.5 text-purple-500" />
            <span>{item.shopSpace > 0 ? `${item.shopSpace} sqft` : "-"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 text-sm bg-popover">
          <p className="font-medium">Shop Space</p>
          <p className="text-muted-foreground">{item.shopSpace > 0 ? `${item.shopSpace.toLocaleString()} sq ft` : "Not available"}</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg text-xs hover:bg-muted/80 transition-colors">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>{item.vehicleCount}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 text-sm bg-popover">
          <p className="font-medium">Vehicles</p>
          <p className="text-muted-foreground">{item.vehicleCount} vehicles available</p>
        </PopoverContent>
      </Popover>

      {item.hasComputer && (
        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg text-xs text-emerald-600 dark:text-emerald-400">
          <Monitor className="w-3.5 h-3.5" />
        </span>
      )}

      {item.hasInternet && (
        <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-lg text-xs text-blue-600 dark:text-blue-400">
          <Wifi className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );

  // ============= Status Badge =============
  const renderStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; dot: string }> = {
      Submitted: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
      Forwarded: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
      Approved: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
      Rejected: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
      Active: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
      Inactive: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-500" },
      Pending: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
    };
    const c = config[status] || config.Submitted;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {status}
      </span>
    );
  };

  // ============= Render Sales Executives =============
  const renderSalesExecutives = (item: DistributorLinkExtended) => {
    const ids = item.assignedSalesExecutiveIds || [];
    if (ids.length === 0) return <span className="text-muted-foreground">-</span>;
    if (ids.length === 1) return getSalesExecutiveName(ids[0]);
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-left hover:text-primary transition-colors">
            {getSalesExecutiveName(ids[0])} <span className="text-muted-foreground">+{ids.length - 1}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 text-sm bg-popover">
          <p className="font-medium mb-2">Assigned Sales Executives</p>
          <ul className="space-y-1">
            {ids.map((id) => (
              <li key={id} className="text-muted-foreground">{getSalesExecutiveName(id)}</li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    );
  };

  // ============= Retailer Click Handler =============
  const renderRetailerCount = (item: DistributorLinkExtended) => (
    <button
      onClick={() => openRetailerModal(item)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer"
    >
      <Users className="w-4 h-4" />
      {item.retailerNetworkCount}
    </button>
  );

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Distributor Linkage</h2>
          <p className="text-muted-foreground">
            Link distributors to territories and verify license compliance
          </p>
        </div>
        <Button onClick={() => openModal("create")} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Distributor Link
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search distributors, territories, executives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2 bg-popover">
                <div className="space-y-1">
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    PDF
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">License Compliance</Label>
                    <Select value={filterLicense} onValueChange={setFilterLicense}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Licenses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Licenses</SelectItem>
                        <SelectItem value="seed">Seed License</SelectItem>
                        <SelectItem value="fertiliser">Fertiliser License</SelectItem>
                        <SelectItem value="pesticide">Pesticide License</SelectItem>
                        <SelectItem value="incomplete">Incomplete Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Distributor Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Forwarded">Forwarded</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Retailer Count Range</Label>
                    <Select value={filterRetailerRange} onValueChange={setFilterRetailerRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Ranges" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ranges</SelectItem>
                        <SelectItem value="0-10">0-10 Retailers</SelectItem>
                        <SelectItem value="11-25">11-25 Retailers</SelectItem>
                        <SelectItem value="26-50">26-50 Retailers</SelectItem>
                        <SelectItem value="50+">50+ Retailers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2 text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredData.length} of {distributorLinks.length} distributors
        </span>
      </div>

      {/* Data Table */}
      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Firm Name</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Sales Executive</TableHead>
                <TableHead className="text-center">Retailers</TableHead>
                <TableHead>Licenses</TableHead>
                <TableHead>Infrastructure</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {item.distributorId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.firmName}</p>
                      {item.contactPerson && (
                        <p className="text-xs text-muted-foreground">{item.contactPerson}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTerritoryName(item.assignedTerritoryId)}</TableCell>
                  <TableCell>{renderSalesExecutives(item)}</TableCell>
                  <TableCell className="text-center">{renderRetailerCount(item)}</TableCell>
                  <TableCell>{renderLicenseCompliance(item)}</TableCell>
                  <TableCell>{renderInfrastructure(item)}</TableCell>
                  <TableCell className="text-center">{renderStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal("view", item)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal("edit", item)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No distributors found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail/Edit Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === "create"
            ? "Add Distributor Link"
            : modalMode === "edit"
            ? "Edit Distributor"
            : "View Distributor"
        }
        size="lg"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Distributor Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Distributor Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distributor *</Label>
                <Select
                  value={formData.distributorId || ""}
                  onValueChange={(v) => {
                    const dist = mockDistributors.find((d) => d.id === v);
                    setFormData({ ...formData, distributorId: v, firmName: dist?.name || "" });
                  }}
                  disabled={modalMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select from approved Distributor Master" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDistributors.map((dist) => (
                      <SelectItem key={dist.id} value={dist.id}>
                        {dist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Firm Name</Label>
                <Input
                  value={formData.firmName || ""}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  placeholder="Auto-populated, editable if needed"
                  disabled={modalMode === "view"}
                />
              </div>

              <div className="space-y-2">
                <Label>Assigned Territory *</Label>
                <Select
                  value={formData.assignedTerritoryId || ""}
                  onValueChange={(v) => setFormData({ ...formData, assignedTerritoryId: v })}
                  disabled={modalMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select from Territory Setup" />
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
                <Label>Assigned Sales Executive(s)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      disabled={modalMode === "view"}
                    >
                      {(formData.assignedSalesExecutiveIds?.length || 0) > 0
                        ? `${formData.assignedSalesExecutiveIds?.length} selected`
                        : "Select Sales Executives"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 bg-popover" align="start">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {salesExecutives.map((se) => (
                        <div
                          key={se.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => toggleSalesExecutive(se.id)}
                        >
                          <Checkbox
                            checked={formData.assignedSalesExecutiveIds?.includes(se.id) || false}
                            onCheckedChange={() => toggleSalesExecutive(se.id)}
                          />
                          <span className="text-sm">{se.fullName}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {(formData.assignedSalesExecutiveIds?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.assignedSalesExecutiveIds?.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                      >
                        {getSalesExecutiveName(id)}
                        {modalMode !== "view" && (
                          <button
                            type="button"
                            onClick={() => toggleSalesExecutive(id)}
                            className="hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={formData.status || "Submitted"}
                  onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                  disabled={modalMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Retailer Network Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.retailerNetworkCount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, retailerNetworkCount: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Enter count"
                  disabled={modalMode === "view"}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Contact Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Contact Person</Label>
                <Input
                  value={formData.contactPerson || ""}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Enter name"
                  disabled={modalMode === "view"}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Phone</Label>
                <Input
                  type="tel"
                  value={formData.contactPhone || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, contactPhone: e.target.value });
                    if (e.target.value) validatePhone(e.target.value);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={modalMode === "view"}
                  className={phoneError ? "border-destructive" : ""}
                />
                {phoneError && (
                  <p className="text-xs text-destructive">{phoneError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input
                  type="email"
                  value={formData.contactEmail || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, contactEmail: e.target.value });
                    if (e.target.value) validateEmail(e.target.value);
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={modalMode === "view"}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>
            </div>
          </div>

          {/* License Compliance */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">License Compliance</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Seed License */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="seedLicense"
                    checked={formData.seedLicense ?? false}
                    onCheckedChange={(v) => setFormData({ ...formData, seedLicense: !!v })}
                    disabled={modalMode === "view"}
                  />
                  <Label htmlFor="seedLicense" className="cursor-pointer font-medium">
                    Seed License
                  </Label>
                </div>
                {formData.seedLicense && (
                  <>
                    <Input
                      placeholder="License Number"
                      value={formData.seedLicenseNumber || ""}
                      onChange={(e) => setFormData({ ...formData, seedLicenseNumber: e.target.value })}
                      disabled={modalMode === "view"}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      value={formData.seedLicenseExpiry || ""}
                      onChange={(e) => setFormData({ ...formData, seedLicenseExpiry: e.target.value })}
                      disabled={modalMode === "view"}
                      className="text-sm"
                    />
                  </>
                )}
              </div>

              {/* Fertiliser License */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="fertiliserLicense"
                    checked={formData.fertiliserLicense ?? false}
                    onCheckedChange={(v) => setFormData({ ...formData, fertiliserLicense: !!v })}
                    disabled={modalMode === "view"}
                  />
                  <Label htmlFor="fertiliserLicense" className="cursor-pointer font-medium">
                    Fertiliser License
                  </Label>
                </div>
                {formData.fertiliserLicense && (
                  <>
                    <Input
                      placeholder="License Number"
                      value={formData.fertiliserLicenseNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, fertiliserLicenseNumber: e.target.value })
                      }
                      disabled={modalMode === "view"}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      value={formData.fertiliserLicenseExpiry || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, fertiliserLicenseExpiry: e.target.value })
                      }
                      disabled={modalMode === "view"}
                      className="text-sm"
                    />
                  </>
                )}
              </div>

              {/* Pesticide License */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="pesticideLicense"
                    checked={formData.pesticideLicense ?? false}
                    onCheckedChange={(v) => setFormData({ ...formData, pesticideLicense: !!v })}
                    disabled={modalMode === "view"}
                  />
                  <Label htmlFor="pesticideLicense" className="cursor-pointer font-medium">
                    Pesticide License
                  </Label>
                </div>
                {formData.pesticideLicense && (
                  <>
                    <Input
                      placeholder="License Number"
                      value={formData.pesticideLicenseNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, pesticideLicenseNumber: e.target.value })
                      }
                      disabled={modalMode === "view"}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      value={formData.pesticideLicenseExpiry || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, pesticideLicenseExpiry: e.target.value })
                      }
                      disabled={modalMode === "view"}
                      className="text-sm"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Infrastructure Summary</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Godown (sq ft)
                </Label>
                <Input
                  type="number"
                  value={formData.godownSpace || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, godownSpace: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  disabled={modalMode === "view"}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-500" />
                  Shop (sq ft)
                </Label>
                <Input
                  type="number"
                  value={formData.shopSpace || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, shopSpace: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  disabled={modalMode === "view"}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  Vehicles
                </Label>
                <Input
                  type="number"
                  value={formData.vehicleCount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleCount: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  disabled={modalMode === "view"}
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Checkbox
                  id="hasComputer"
                  checked={formData.hasComputer ?? false}
                  onCheckedChange={(v) => setFormData({ ...formData, hasComputer: !!v })}
                  disabled={modalMode === "view"}
                />
                <Label htmlFor="hasComputer" className="cursor-pointer flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Computer
                </Label>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Checkbox
                  id="hasInternet"
                  checked={formData.hasInternet ?? false}
                  onCheckedChange={(v) => setFormData({ ...formData, hasInternet: !!v })}
                  disabled={modalMode === "view"}
                />
                <Label htmlFor="hasInternet" className="cursor-pointer flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Internet
                </Label>
              </div>
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Supporting Documents</Label>
            <p className="text-sm text-muted-foreground">
              Upload license scans, infrastructure proof, photos (optional)
            </p>
            
            {modalMode !== "view" && (
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </Button>
                <span className="text-xs text-muted-foreground">
                  Supported: PDF, JPG, PNG, DOC
                </span>
              </div>
            )}

            {(formData.supportingDocuments?.length || 0) > 0 && (
              <div className="space-y-2 mt-3">
                {formData.supportingDocuments?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {modalMode !== "view" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(formData.supportingDocuments?.length || 0) === 0 && modalMode === "view" && (
              <p className="text-sm text-muted-foreground italic">No documents uploaded</p>
            )}
          </div>

          {/* Status History (View Mode) */}
          {modalMode === "view" && selectedItem?.statusHistory && selectedItem.statusHistory.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-semibold">Status Audit Trail</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedItem.statusHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {renderStatusBadge(entry.status)}
                      <span className="text-muted-foreground">by {entry.changedBy}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.changedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
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

      {/* Retailer List Modal */}
      <GlassModal
        isOpen={isRetailerModalOpen}
        onClose={() => setIsRetailerModalOpen(false)}
        title={`Retailer Network - ${selectedItem?.firmName || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Retailers: <span className="font-semibold text-foreground">{selectedItem?.retailerNetworkCount || 0}</span>
            </p>
          </div>

          {selectedItem?.retailers && selectedItem.retailers.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedItem.retailers.map((retailer) => (
                <div
                  key={retailer.id}
                  className="p-3 border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{retailer.name}</p>
                    <p className="text-sm text-muted-foreground">{retailer.phone}</p>
                    <p className="text-xs text-muted-foreground">{retailer.location}</p>
                  </div>
                  <StatusBadge
                    status={retailer.status === "Active" ? "active" : "inactive"}
                    label={retailer.status}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No retailers linked yet</p>
              <p className="text-sm">Add retailers to this distributor's network</p>
            </div>
          )}
        </div>
      </GlassModal>
    </div>
  );
}
