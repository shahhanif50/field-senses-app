import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  MapPin,
  Building2,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Eye,
  Settings,
  ChevronDown,
  ChevronRight,
  Target,
  UserCheck,
  Navigation,
  Shield,
  Bell,
  FolderOpen,
  RefreshCw,
  X,
  Check,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useMasterData } from "@/contexts/MasterDataContext";

// Report module types
type ReportModule = 
  | "sales-executive"
  | "employee-portal"
  | "inventory"
  | "daily-tracking"
  | "alerts"
  | "documents";

interface ReportConfig {
  module: ReportModule;
  title: string;
  icon: React.ElementType;
  color: string;
  focus: string;
  metrics: string[];
}

const reportModules: ReportConfig[] = [
  {
    module: "sales-executive",
    title: "Sales & Territory",
    icon: Target,
    color: "emerald",
    focus: "Targets vs Achievement, Visit Logs, Distributor Coverage",
    metrics: ["Total Visits", "Target Achievement %", "Distributor Coverage", "Territory Performance"],
  },
  {
    module: "employee-portal",
    title: "Employee Portal",
    icon: UserCheck,
    color: "blue",
    focus: "Attendance, Task Completion, KPI Trends",
    metrics: ["Attendance Rate", "Tasks Completed", "Avg KPI Score", "Leave Balance"],
  },
  {
    module: "inventory",
    title: "Inventory Management",
    icon: Package,
    color: "amber",
    focus: "Stock Movement, Low Stock Alerts, Billing Summary",
    metrics: ["Stock Value", "Items Below Minimum", "Monthly Movement", "Billing Total"],
  },
  {
    module: "daily-tracking",
    title: "Daily Tracking",
    icon: Navigation,
    color: "violet",
    focus: "Distance Covered, Idle Time, Geo-Fence Breaches",
    metrics: ["Total Distance", "Avg Idle Time", "Geo-Fence Breaches", "Route Compliance"],
  },
  {
    module: "alerts",
    title: "Alerts & Escalation",
    icon: Bell,
    color: "red",
    focus: "High Priority Alerts, Resolution Status",
    metrics: ["Active Alerts", "Resolved Today", "Avg Resolution Time", "Escalation Rate"],
  },
  {
    module: "documents",
    title: "Documents & Logs",
    icon: FolderOpen,
    color: "cyan",
    focus: "Uploaded Docs, Expiry Status, Approval Logs",
    metrics: ["Total Documents", "Expiring Soon", "Pending Approvals", "Storage Used"],
  },
];

// Mock data for reports
const mockEmployees = [
  { id: "EMP001", name: "Rajesh Kumar", territory: "North Zone", role: "Territory Manager" },
  { id: "EMP002", name: "Priya Sharma", territory: "South Zone", role: "Sales Executive" },
  { id: "EMP003", name: "Amit Patel", territory: "East Zone", role: "Sales Executive" },
  { id: "EMP004", name: "Sunita Verma", territory: "West Zone", role: "Agronomist" },
  { id: "EMP005", name: "Vikram Singh", territory: "Central Zone", role: "Territory Manager" },
];

const mockTerritories = ["North Zone", "South Zone", "East Zone", "West Zone", "Central Zone"];
const mockDistributors = ["Agri Solutions Pvt Ltd", "Green Fields Traders", "Krishi Mart", "Farmers Hub", "Seed World"];

// Mock report data
const generateMockReportData = (module: ReportModule) => {
  const baseData = {
    "sales-executive": [
      { employee: "Rajesh Kumar", territory: "North Zone", visits: 45, target: 100000, achieved: 92000, coverage: "85%" },
      { employee: "Priya Sharma", territory: "South Zone", visits: 38, target: 85000, achieved: 78000, coverage: "78%" },
      { employee: "Amit Patel", territory: "East Zone", visits: 52, target: 90000, achieved: 95000, coverage: "92%" },
      { employee: "Sunita Verma", territory: "West Zone", visits: 41, target: 75000, achieved: 68000, coverage: "72%" },
      { employee: "Vikram Singh", territory: "Central Zone", visits: 48, target: 110000, achieved: 105000, coverage: "88%" },
    ],
    "employee-portal": [
      { employee: "Rajesh Kumar", attendance: "96%", tasksCompleted: 42, kpiScore: 87, leaves: 2 },
      { employee: "Priya Sharma", attendance: "92%", tasksCompleted: 38, kpiScore: 82, leaves: 4 },
      { employee: "Amit Patel", attendance: "98%", tasksCompleted: 51, kpiScore: 94, leaves: 1 },
      { employee: "Sunita Verma", attendance: "88%", tasksCompleted: 35, kpiScore: 76, leaves: 6 },
      { employee: "Vikram Singh", attendance: "95%", tasksCompleted: 45, kpiScore: 89, leaves: 3 },
    ],
    "inventory": [
      { item: "Nitrogen Fertilizer (50kg)", sku: "NF-50-001", opening: 500, inward: 200, outward: 350, closing: 350, value: "₹2,45,000" },
      { item: "Phosphorus Compound", sku: "PC-25-002", opening: 300, inward: 150, outward: 280, closing: 170, value: "₹1,87,000" },
      { item: "Hybrid Wheat Seeds", sku: "HWS-10-003", opening: 1000, inward: 500, outward: 800, closing: 700, value: "₹4,20,000" },
      { item: "Pesticide Spray (5L)", sku: "PS-5L-004", opening: 200, inward: 100, outward: 180, closing: 120, value: "₹96,000" },
      { item: "Organic Manure", sku: "OM-50-005", opening: 400, inward: 300, outward: 450, closing: 250, value: "₹1,25,000" },
    ],
    "daily-tracking": [
      { employee: "Rajesh Kumar", date: "2024-01-15", distance: "78 km", idleTime: "45 min", breaches: 0, compliance: "95%" },
      { employee: "Priya Sharma", date: "2024-01-15", distance: "65 km", idleTime: "62 min", breaches: 1, compliance: "88%" },
      { employee: "Amit Patel", date: "2024-01-15", distance: "92 km", idleTime: "28 min", breaches: 0, compliance: "98%" },
      { employee: "Sunita Verma", date: "2024-01-15", distance: "54 km", idleTime: "78 min", breaches: 2, compliance: "75%" },
      { employee: "Vikram Singh", date: "2024-01-15", distance: "71 km", idleTime: "35 min", breaches: 0, compliance: "92%" },
    ],
    "alerts": [
      { alert: "Low Stock - Fertilizer", priority: "High", raised: "2024-01-15", status: "Active", assignee: "Inventory Team" },
      { alert: "Geo-Fence Breach", priority: "Medium", raised: "2024-01-15", status: "Resolved", assignee: "Priya Sharma" },
      { alert: "Target Deviation", priority: "High", raised: "2024-01-14", status: "Active", assignee: "Sales Manager" },
      { alert: "Document Expiry", priority: "Low", raised: "2024-01-13", status: "Resolved", assignee: "Admin" },
      { alert: "Attendance Issue", priority: "Medium", raised: "2024-01-12", status: "Active", assignee: "HR Team" },
    ],
    "documents": [
      { document: "GST Certificate", type: "License", uploaded: "2024-01-01", expiry: "2024-12-31", status: "Valid", approver: "Admin" },
      { document: "Fertilizer License", type: "Permit", uploaded: "2023-06-15", expiry: "2024-06-15", status: "Expiring Soon", approver: "HOD" },
      { document: "Trade Agreement", type: "Contract", uploaded: "2024-01-10", expiry: "2025-01-10", status: "Valid", approver: "Legal" },
      { document: "Insurance Policy", type: "Insurance", uploaded: "2023-04-01", expiry: "2024-04-01", status: "Expiring Soon", approver: "Finance" },
      { document: "Quality Cert", type: "Certificate", uploaded: "2024-01-05", expiry: "2025-01-05", status: "Valid", approver: "QA Team" },
    ],
  };
  return baseData[module] || [];
};

export const ReportsTab = () => {
  const { employees, territories, distributors } = useMasterData();
  const [selectedModule, setSelectedModule] = useState<ReportModule>("sales-executive");
  const [dateRange, setDateRange] = useState({ from: "2024-01-01", to: "2024-01-31" });
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedDistributor, setSelectedDistributor] = useState<string>("all");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRemarks, setIncludeRemarks] = useState(false);
  const [groupBy, setGroupBy] = useState<"employee" | "territory" | "distributor">("employee");
  const [remarks, setRemarks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState(false);

  const currentModuleConfig = reportModules.find(m => m.module === selectedModule)!;
  const reportData = generateMockReportData(selectedModule);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedReport(true);
      setShowPreview(true);
    }, 2000);
  };

  const handleExport = (format: "pdf" | "excel") => {
    const fileName = `Report_${currentModuleConfig.title.replace(/\s+/g, "_")}_${dateRange.from}_to_${dateRange.to}${selectedEmployee !== "all" ? `_${selectedEmployee}` : ""}.${format === "pdf" ? "pdf" : "xlsx"}`;
    
    // Create mock download
    const blob = new Blob([`Mock ${format.toUpperCase()} Report Data`], { type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSummaryMetrics = () => {
    const metrics = {
      "sales-executive": [
        { label: "Total Visits", value: "224", trend: "+12%", icon: Activity },
        { label: "Avg Achievement", value: "92.4%", trend: "+5%", icon: Target },
        { label: "Coverage Rate", value: "83%", trend: "+3%", icon: MapPin },
        { label: "Active Distributors", value: "48", trend: "+2", icon: Building2 },
      ],
      "employee-portal": [
        { label: "Avg Attendance", value: "93.8%", trend: "+2%", icon: UserCheck },
        { label: "Tasks Completed", value: "211", trend: "+18", icon: CheckCircle2 },
        { label: "Avg KPI Score", value: "85.6", trend: "+4", icon: TrendingUp },
        { label: "Leave Utilization", value: "16 days", trend: "-", icon: Calendar },
      ],
      "inventory": [
        { label: "Total Stock Value", value: "₹10.73L", trend: "+8%", icon: Package },
        { label: "Items Below Min", value: "3", trend: "-2", icon: AlertTriangle },
        { label: "Monthly Turnover", value: "₹8.45L", trend: "+15%", icon: RefreshCw },
        { label: "Avg Days Stock", value: "18 days", trend: "-3", icon: Clock },
      ],
      "daily-tracking": [
        { label: "Total Distance", value: "360 km", trend: "+25 km", icon: Navigation },
        { label: "Avg Idle Time", value: "49.6 min", trend: "-8 min", icon: Clock },
        { label: "Geo Breaches", value: "3", trend: "-1", icon: Shield },
        { label: "Route Compliance", value: "89.6%", trend: "+4%", icon: CheckCircle2 },
      ],
      "alerts": [
        { label: "Active Alerts", value: "12", trend: "-3", icon: Bell },
        { label: "Resolved Today", value: "8", trend: "+2", icon: CheckCircle2 },
        { label: "Avg Resolution", value: "4.2 hrs", trend: "-1.5 hrs", icon: Clock },
        { label: "Escalation Rate", value: "15%", trend: "-5%", icon: AlertTriangle },
      ],
      "documents": [
        { label: "Total Documents", value: "156", trend: "+12", icon: FileText },
        { label: "Expiring Soon", value: "8", trend: "+2", icon: AlertTriangle },
        { label: "Pending Approval", value: "5", trend: "-3", icon: Clock },
        { label: "Storage Used", value: "2.4 GB", trend: "+0.3 GB", icon: FolderOpen },
      ],
    };
    return metrics[selectedModule] || [];
  };

  const getTableColumns = () => {
    const columns: Record<ReportModule, string[]> = {
      "sales-executive": ["Employee", "Territory", "Visits", "Target (₹)", "Achieved (₹)", "Coverage"],
      "employee-portal": ["Employee", "Attendance", "Tasks Completed", "KPI Score", "Leaves"],
      "inventory": ["Item", "SKU", "Opening", "Inward", "Outward", "Closing", "Value"],
      "daily-tracking": ["Employee", "Date", "Distance", "Idle Time", "Breaches", "Compliance"],
      "alerts": ["Alert", "Priority", "Raised", "Status", "Assignee"],
      "documents": ["Document", "Type", "Uploaded", "Expiry", "Status", "Approver"],
    };
    return columns[selectedModule];
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
      blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
      violet: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" },
      rose: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
      red: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
      cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20" },
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Generate comprehensive reports with filters and export options</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          {generatedReport && (
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* Module Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {reportModules.map((module) => {
          const colorClasses = getColorClasses(module.color);
          const isSelected = selectedModule === module.module;
          return (
            <motion.button
              key={module.module}
              onClick={() => {
                setSelectedModule(module.module);
                setGeneratedReport(false);
                setShowPreview(false);
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.text}`
                  : "border-border hover:border-primary/50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <module.icon className={`w-6 h-6 mb-2 ${isSelected ? colorClasses.text : "text-muted-foreground"}`} />
              <p className={`text-sm font-medium ${isSelected ? "" : "text-foreground"}`}>{module.title}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Report Focus */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Report Focus</p>
              <p className="text-sm font-medium">{currentModuleConfig.focus}</p>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Filters</Label>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Territory</Label>
                <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Territories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Territories</SelectItem>
                    {territories.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Distributor</Label>
                <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Distributors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Distributors</SelectItem>
                    {distributors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.firmName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">Export Settings</Label>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Format</Label>
                <div className="flex gap-2">
                  <Button
                    variant={exportFormat === "pdf" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExportFormat("pdf")}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant={exportFormat === "excel" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExportFormat("excel")}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Group By</Label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="territory">Territory</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Include Charts</Label>
                <Switch checked={includeCharts} onCheckedChange={setIncludeCharts} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Include Remarks</Label>
                <Switch checked={includeRemarks} onCheckedChange={setIncludeRemarks} />
              </div>

              {includeRemarks && (
                <Textarea
                  placeholder="Add manager comments or notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-20 text-sm"
                />
              )}
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview / Quick Stats */}
        <Card className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {showPreview && generatedReport ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Report Preview</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentModuleConfig.title} • {dateRange.from} to {dateRange.to}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                        <FileText className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                        <FileSpreadsheet className="w-4 h-4 mr-1" />
                        Excel
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Header */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">Agri Distribution Company</h3>
                        <p className="text-sm text-muted-foreground">{currentModuleConfig.title} Report</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{dateRange.from} to {dateRange.to}</p>
                        <p className="text-muted-foreground">Generated by: Admin</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {selectedEmployee !== "all" && (
                        <Badge variant="secondary">Employee: {mockEmployees.find(e => e.id === selectedEmployee)?.name}</Badge>
                      )}
                      {selectedTerritory !== "all" && (
                        <Badge variant="secondary">Territory: {selectedTerritory}</Badge>
                      )}
                      {selectedDistributor !== "all" && (
                        <Badge variant="secondary">Distributor: {selectedDistributor}</Badge>
                      )}
                      <Badge variant="outline">Grouped by: {groupBy}</Badge>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-primary" />
                      Summary Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {getSummaryMetrics().map((metric, index) => (
                        <motion.div
                          key={metric.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <metric.icon className="w-4 h-4 text-primary" />
                            <span className="text-xs text-muted-foreground">{metric.label}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold">{metric.value}</span>
                            <span className={`text-xs ${metric.trend.includes("+") ? "text-emerald-500" : metric.trend.includes("-") ? "text-red-500" : "text-muted-foreground"}`}>
                              {metric.trend}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Data Table */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Detailed Data
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            {getTableColumns().map((col) => (
                              <TableHead key={col} className="text-xs font-semibold">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.map((row, index) => (
                            <TableRow key={index} className="hover:bg-muted/30">
                              {Object.values(row).map((value, i) => (
                                <TableCell key={i} className="text-sm py-2">
                                  {typeof value === "string" && (value === "High" || value === "Active" || value === "Expiring Soon") ? (
                                    <Badge variant={value === "High" || value === "Expiring Soon" ? "destructive" : value === "Active" ? "default" : "secondary"} className="text-xs">
                                      {value}
                                    </Badge>
                                  ) : typeof value === "string" && (value === "Resolved" || value === "Completed" || value === "Valid") ? (
                                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                                      {value}
                                    </Badge>
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Charts Placeholder */}
                  {includeCharts && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Performance Charts
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-40 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="w-10 h-10 text-primary/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">KPI Trend Chart</p>
                          </div>
                        </div>
                        <div className="h-40 rounded-lg border bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 flex items-center justify-center">
                          <div className="text-center">
                            <PieChart className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Distribution Chart</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Remarks Section */}
                  {includeRemarks && remarks && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Manager Remarks
                      </h4>
                      <div className="p-4 rounded-lg border bg-muted/30">
                        <p className="text-sm">{remarks}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                    <span>Generated: {new Date().toLocaleString()}</span>
                    <span>Format: {exportFormat.toUpperCase()}</span>
                  </div>
                </CardContent>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <currentModuleConfig.icon className={`w-5 h-5 ${getColorClasses(currentModuleConfig.color).text}`} />
                    {currentModuleConfig.title} Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getSummaryMetrics().map((metric, index) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl border bg-gradient-to-br from-card to-muted/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg ${getColorClasses(currentModuleConfig.color).bg} flex items-center justify-center`}>
                            <metric.icon className={`w-4 h-4 ${getColorClasses(currentModuleConfig.color).text}`} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className={`text-xs mt-1 ${metric.trend.includes("+") ? "text-emerald-500" : metric.trend.includes("-") && !metric.trend.includes("min") && !metric.trend.includes("hrs") ? "text-red-500" : "text-emerald-500"}`}>
                          {metric.trend}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Available Metrics */}
                  <div>
                    <h4 className="font-semibold mb-3">Available Metrics in This Report</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentModuleConfig.metrics.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recent Reports */}
                  <div>
                    <h4 className="font-semibold mb-3">Recent Reports</h4>
                    <div className="space-y-2">
                      {[
                        { name: `${currentModuleConfig.title} - Weekly`, date: "Jan 14, 2024", format: "PDF" },
                        { name: `${currentModuleConfig.title} - Monthly`, date: "Jan 01, 2024", format: "Excel" },
                        { name: `${currentModuleConfig.title} - Quarterly`, date: "Dec 31, 2023", format: "PDF" },
                      ].map((report, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              {report.format === "PDF" ? <FileText className="w-4 h-4 text-primary" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{report.name}</p>
                              <p className="text-xs text-muted-foreground">{report.date}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generate Prompt */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-center">
                    <BarChart3 className="w-10 h-10 text-primary/50 mx-auto mb-2" />
                    <p className="text-sm font-medium">Configure filters and click "Generate Report"</p>
                    <p className="text-xs text-muted-foreground mt-1">Reports can be exported as PDF or Excel</p>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Report Types Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            All Report Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportModules.map((module, index) => {
              const colorClasses = getColorClasses(module.color);
              return (
                <motion.div
                  key={module.module}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border hover:shadow-md transition-all cursor-pointer ${
                    selectedModule === module.module ? `${colorClasses.bg} ${colorClasses.border}` : ""
                  }`}
                  onClick={() => {
                    setSelectedModule(module.module);
                    setGeneratedReport(false);
                    setShowPreview(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colorClasses.bg} flex items-center justify-center flex-shrink-0`}>
                      <module.icon className={`w-5 h-5 ${colorClasses.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{module.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{module.focus}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {module.metrics.slice(0, 2).map((m) => (
                          <Badge key={m} variant="outline" className="text-[10px] px-1.5 py-0">
                            {m}
                          </Badge>
                        ))}
                        {module.metrics.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{module.metrics.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
