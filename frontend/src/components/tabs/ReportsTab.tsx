import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
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
  | "meeting-travel";

interface ReportConfig {
  module: ReportModule;
  title: string;
  icon: React.ElementType;
  color: string;
  focus: string;
  metrics: string[];
}

const IconMap: Record<string, any> = {
  Activity, Target, MapPin, Building2, UserCheck, CheckCircle2, TrendingUp, Calendar, Package, AlertTriangle, RefreshCw, Clock, Navigation, Shield, Bell, FileText, FolderOpen
};

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
    module: "meeting-travel",
    title: "Travelling Expenses",
    icon: Briefcase,
    color: "indigo",
    focus: "Distance Traveled, Fuel Costs, Daily Allowance",
    metrics: ["Total KMs", "Fuel Amount", "Allowances", "Final Total"],
  },
];




export const ReportsTab = () => {
  const { employees, territories, distributors, roles, rolePermissions } = useMasterData();
  const [selectedModule, setSelectedModule] = useState<ReportModule>("sales-executive");
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ from: formatDate(firstDay), to: formatDate(today) });
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

  // --- PERMISSION CHECKS ---
  const rawRole = sessionStorage.getItem("userRole") || "employee";
  const userName = sessionStorage.getItem("userName") || "";
  const currentRole = roles?.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const reportsPerm = rolePermissions?.find(p => p.roleId === currentRole?.id && p.module === "Reports");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = rawRole.toLowerCase() === "admin" || isGlobalAdmin;

  const canExport = !!(isAdmin || reportsPerm?.export);
  // -----------------------

  const currentModuleConfig = reportModules.find(m => m.module === selectedModule)!;
  const [reportData, setReportData] = useState<any[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoadingData(true);
      try {
        const queryParams = new URLSearchParams({
          module: selectedModule,
          from: dateRange.from,
          to: dateRange.to,
          employee: selectedEmployee,
          territory: selectedTerritory,
          distributor: selectedDistributor
        });
        
        const response = await fetch(`/api/ops/reports/?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          let finalData = data.data;
          if (!isAdmin) {
             finalData = finalData.filter((row: any) => row.employee === userName || row.assignee === userName);
          }
          setReportData(finalData);
          setSummaryMetrics(data.summary);
        }
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchReportData();
  }, [selectedModule, dateRange, selectedEmployee, selectedTerritory, selectedDistributor, isAdmin, userName]);

  // Filter employees dropdown if not admin
  const availableEmployees = isAdmin ? employees : employees.filter(e => e.fullName === userName);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedReport(true);
      setShowPreview(true);
    }, 2000);
  };

  const handleExport = async (format: "pdf" | "excel") => {
    const fileName = `Report_${currentModuleConfig.title.replace(/\s+/g, "_")}_${dateRange.from}_to_${dateRange.to}${selectedEmployee !== "all" ? `_${selectedEmployee}` : ""}`;
    
    // Calculate Grand Total for meeting-travel
    let totalRow: string[] | null = null;
    if (currentModuleConfig.module === 'meeting-travel' && reportData.length > 0) {
      let tKms = 0, tFuel = 0, tDaily = 0, tLocal = 0, tHotel = 0, tOther = 0, tTotal = 0;
      reportData.forEach(row => {
        tKms += Number(row.kms) || 0;
        tFuel += Number(row.fuel) || 0;
        tDaily += Number(row.daily) || 0;
        tLocal += Number(row.local) || 0;
        tHotel += Number(row.hotel) || 0;
        tOther += Number(row.other) || 0;
        tTotal += Number(row.total) || 0;
      });
      totalRow = [
        "", "", "", "Grand Total:", "", "",
        tKms.toFixed(2), tFuel.toFixed(2), tDaily.toFixed(2),
        tLocal.toFixed(2), tHotel.toFixed(2), tOther.toFixed(2), tTotal.toFixed(2)
      ];
    }
    
    if (format === 'excel') {
      let worksheet;
      if (currentModuleConfig.module === 'meeting-travel') {
        const emp = employees.find(e => e.id === selectedEmployee) || employees.find(e => e.fullName === selectedEmployee);
        const headerData = [
          ["CROPRISE AGROCHEM LIMITED"],
          ["Travelling Expenses"],
          [
            `Name: ${emp?.fullName || 'All'}`, 
            `Designation: ${emp?.designation || '-'}`, 
            `Dept: ${emp?.departmentId || '-'}`, 
            `Code: ${emp?.employeeId || '-'}`, 
            `HQ/State: ${emp?.region || '-'}`
          ],
          [`From: ${dateRange.from}`, `To: ${dateRange.to}`],
          []
        ];
        
        const tableColumn = Object.keys(reportData[0] || {}).filter(k => k !== 'proofs');
        const tableRows = reportData.map(row => {
          const rowData = { ...row };
          delete rowData.proofs;
          return Object.values(rowData).map(val => String(val).replace(/₹/g, 'Rs. '));
        });
        if (totalRow) tableRows.push(totalRow);
        
        const aoa = [...headerData, tableColumn, ...tableRows];
        
        worksheet = XLSX.utils.aoa_to_sheet(aoa);
      } else {
        worksheet = XLSX.utils.json_to_sheet(reportData);
      }
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
      const doc = new jsPDF();
      let startY = 30;
      
      if (currentModuleConfig.module === 'meeting-travel') {
        const emp = employees.find(e => e.id === selectedEmployee) || employees.find(e => e.fullName === selectedEmployee);
        
        doc.setFontSize(14);
        doc.text("CROPRISE AGROCHEM LIMITED", 14, 15);
        doc.setFontSize(12);
        doc.text("Travelling Expenses", 14, 22);
        
        doc.setFontSize(10);
        doc.text(`Name: ${emp?.fullName || 'All'}`, 14, 30);
        doc.text(`Designation: ${emp?.designation || '-'}`, 80, 30);
        doc.text(`Dept: ${emp?.departmentId || '-'}`, 140, 30);
        
        doc.text(`Code: ${emp?.employeeId || '-'}`, 14, 36);
        doc.text(`HQ/State: ${emp?.region || '-'}`, 80, 36);
        
        doc.text(`From: ${dateRange.from}    To: ${dateRange.to}`, 14, 42);
        
        startY = 50;
      } else {
        doc.text(`${currentModuleConfig.title} Report`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 14, 22);
      }
      
      const tableColumn = Object.keys(reportData[0] || {}).filter(k => k !== 'proofs');
      const tableRows = reportData.map(row => {
        const rowData = { ...row };
        delete rowData.proofs;
        return Object.values(rowData).map(val => String(val).replace(/₹/g, 'Rs. '));
      });
      if (totalRow) tableRows.push(totalRow);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || startY + 50;
      doc.setFontSize(10);
      doc.text("Signature: ___________________", doc.internal.pageSize.getWidth() - 70, finalY + 30);
      
      if (currentModuleConfig.module === 'meeting-travel') {
        for (const row of reportData) {
          if (row.proofs && Array.isArray(row.proofs) && row.proofs.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text(`Meeting & Expense Proofs`, 14, 20);
            
            doc.setFontSize(10);
            const details = [
              `Date: ${row.date || 'N/A'}`,
              `Employee: ${row.employee || 'N/A'}`,
              `Station: ${row.station || 'N/A'}`,
              `Mode: ${row.mode || '-'} | KMs: ${row.kms || '0'} | Fuel: Rs ${row.fuel || '0'} | Daily: Rs ${row.daily || '0'}`,
              `Local: Rs ${row.local || '0'} | Hotel: Rs ${row.hotel || '0'} | Other: Rs ${row.other || '0'}`,
              `Total: Rs ${row.total || '0'}`,
            ];
            
            let detailsY = 28;
            details.forEach(d => {
              doc.text(d, 14, detailsY);
              detailsY += 6;
            });
            
            let currentX = 14;
            let currentY = detailsY + 5;
            
            const imgMaxWidth = 55;
            const imgMaxHeight = 85;
            
            for (const proof of row.proofs) {
              try {
                let base64 = proof.url;
                if (!base64.startsWith('data:')) {
                  const res = await fetch(proof.url);
                  const blob = await res.blob();
                  base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                }
                
                const format = proof.url.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
                
                const img = new Image();
                img.src = base64;
                await new Promise((resolve) => { img.onload = resolve; });
                
                let width = img.width;
                let height = img.height;
                const ratio = Math.min(imgMaxWidth / width, imgMaxHeight / height);
                width = width * ratio;
                height = height * ratio;
                
                if (currentX + imgMaxWidth > 200) {
                   currentX = 14;
                   currentY += imgMaxHeight + 15;
                }
                
                doc.setFontSize(9);
                doc.text(proof.type, currentX, currentY - 2);
                doc.addImage(base64, format, currentX, currentY, width, height);
                currentX += imgMaxWidth + 5;
              } catch (e) {
                console.error("Failed to add proof image to PDF", e);
              }
            }
          }
        }
      }
      
      doc.save(`${fileName}.pdf`);
    }
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
      "meeting-travel": [
        { label: "Total Distance", value: "245 km", trend: "+12%", icon: Navigation },
        { label: "Fuel Expenses", value: "₹2,150", trend: "+5%", icon: MapPin },
        { label: "Daily Allowances", value: "₹950", trend: "-", icon: Briefcase },
        { label: "Total Cost", value: "₹3,100", trend: "+4%", icon: Activity },
      ],
    };
    return metrics[selectedModule as keyof typeof metrics] || [];
  };

  const getTableColumns = () => {
    const columns: Record<ReportModule, string[]> = {
      "sales-executive": ["Employee ID", "Employee", "Territory", "Visits", "Target (₹)", "Achieved (₹)", "Coverage"],
      "employee-portal": ["Employee ID", "Employee", "Attendance", "Tasks Completed", "KPI Score", "Leaves"],
      "inventory": ["Item", "SKU", "Opening", "Inward", "Outward", "Closing", "Value"],
      "meeting-travel": ["Date", "Time (Dep-Arr)", "Employee", "Station Visited", "Type of Vehicle", "Rate per KM", "KMs Covered", "Fuel (Rs)", "Daily Allowance (Rs)", "Local Conveyances (Rs)", "Hotel Exp (Rs)", "Mobile/Other (Rs)", "Total (Rs)"]
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
      indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20" },
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
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                    {availableEmployees.map((emp) => (
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
                    onClick={() => {
                      setExportFormat("pdf");
                      if (reportData.length > 0) handleExport("pdf");
                    }}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant={exportFormat === "excel" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setExportFormat("excel");
                      if (reportData.length > 0) handleExport("excel");
                    }}
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Report Preview</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentModuleConfig.title} • {dateRange.from} to {dateRange.to}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canExport && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                            <FileText className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Excel
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Header */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
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
                        <Badge variant="secondary">Employee: {employees.find(e => e.id === selectedEmployee)?.fullName || "Unknown"}</Badge>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-3">
                      {summaryMetrics.map((metric, index) => (
                        <motion.div
                          key={metric.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {(() => { 
                               const Icon = typeof metric.icon === 'string' ? IconMap[metric.icon] || Activity : metric.icon; 
                               return <Icon className="w-4 h-4 text-primary" />; 
                             })()}
                            <span className="text-xs text-muted-foreground">{metric.label}</span>
                          </div>
                          <div className="flex items-end justify-between">
                            <span className="text-xl font-bold">{metric.value}</span>
                            {metric.trend && (
                              <span className="text-xs font-medium text-emerald-500">
                                {metric.trend}
                              </span>
                            )}
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
                          
                          {/* Grand Total Row */}
                          {selectedModule === 'meeting-travel' && reportData.length > 0 && (
                            <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200 hover:bg-slate-50">
                               <TableCell colSpan={6} className="text-right py-3 pr-4 text-slate-700">Grand Total:</TableCell>
                               <TableCell className="py-3 text-sm">{reportData.reduce((sum, row) => sum + (Number(row.kms) || 0), 0).toFixed(2)}</TableCell>
                               <TableCell className="py-3 text-sm">₹{reportData.reduce((sum, row) => sum + (Number(row.fuel) || 0), 0).toFixed(2)}</TableCell>
                               <TableCell className="py-3 text-sm">₹{reportData.reduce((sum, row) => sum + (Number(row.daily) || 0), 0).toFixed(2)}</TableCell>
                               <TableCell className="py-3 text-sm">₹{reportData.reduce((sum, row) => sum + (Number(row.local) || 0), 0).toFixed(2)}</TableCell>
                               <TableCell className="py-3 text-sm">₹{reportData.reduce((sum, row) => sum + (Number(row.hotel) || 0), 0).toFixed(2)}</TableCell>
                               <TableCell className="py-3 text-sm">₹{reportData.reduce((sum, row) => sum + (Number(row.other) || 0), 0).toFixed(2)}</TableCell>
                               <TableCell className="py-3 text-sm text-primary">₹{reportData.reduce((sum, row) => sum + (Number(row.total) || 0), 0).toFixed(2)}</TableCell>
                            </TableRow>
                          )}
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-[300px] rounded-lg border bg-card p-4">
                          <h5 className="text-sm font-medium text-center mb-4">
                            {selectedModule === 'sales-executive' ? 'Target vs Achievement' :
                             selectedModule === 'employee-portal' ? 'KPI Scores' :
                             selectedModule === 'inventory' ? 'Stock Values' :
                             'Performance Trend'}
                          </h5>
                          <ResponsiveContainer width="100%" height="100%">
                            {selectedModule === 'sales-executive' ? (
                              <BarChart data={reportData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="employee" tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="target" fill="#8884d8" name="Target" />
                                <Bar dataKey="achieved" fill="#82ca9d" name="Achieved" />
                              </BarChart>
                            ) : selectedModule === 'employee-portal' ? (
                              <LineChart data={reportData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="employee" tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="kpiScore" stroke="#8884d8" name="KPI Score" strokeWidth={2} />
                                <Line type="monotone" dataKey="tasksCompleted" stroke="#82ca9d" name="Tasks" strokeWidth={2} />
                              </LineChart>
                            ) : (
                              <BarChart data={reportData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={reportData[0]?.employee ? "employee" : "item"} tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey={Object.keys(reportData[0] || {}).find(k => k !== 'empId' && k !== 'employee' && k !== 'item' && typeof reportData[0]?.[k] === 'number') || "value"} fill="#8884d8" name="Value" />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                        <div className="h-[300px] rounded-lg border bg-card p-4">
                          <h5 className="text-sm font-medium text-center mb-4">Distribution Metrics</h5>
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={reportData.slice(0, 5).map(d => ({
                                  name: d.employee || d.item || d.alert || d.document || 'Item',
                                  value: Number(d.tasksCompleted || d.visits || d.distance || d.opening || d.leaves || 10)
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {reportData.slice(0, 5).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
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
                          {canExport && (
                            <Button variant="ghost" size="icon" onClick={() => handleExport(report.format.toLowerCase() as "pdf" | "excel")}>
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
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
