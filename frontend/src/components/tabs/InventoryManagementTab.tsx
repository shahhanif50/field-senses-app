import React, { useState } from "react";
import { Package, FolderTree, Ruler, Warehouse, Users, Receipt, PackageOpen, AlertTriangle, ClipboardList, FileText, Monitor, BarChart3, Plus, Edit, Trash2, Eye, Download, User, Building2, Tag, DollarSign, Settings, MapPin, Phone, CreditCard, Calendar, Shield, Layers, Search, Filter, ShoppingCart, Truck, Camera, X } from "lucide-react";
import POSDashboard from "@/components/pos/POSDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { GlassModal } from "@/components/ui/GlassModal";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";

// Interfaces
interface Product {
  id: string;
  productId: string; // System-generated PID-XXXX
  sku: string; // System-generated SKU code
  barcode: string; // Auto-generated from SKU
  name: string;
  category: string;
  brand: string;
  uom: string;
  sellingPrice: number;
  taxCategory: string;
  trackInventory: boolean;
  allowDiscount: boolean;
  serialBatchTracking: boolean;
  expiryTracking: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  parentCategory: string;
  type: "Physical" | "Service";
  description: string;
  status: "Active" | "Inactive";
  linkedProducts?: number; // For deletion prevention check
  createdAt?: string;
  updatedAt?: string;
}

interface UOM {
  id: string;
  name: string;
  shortCode: string;
  conversionFactor: number;
  baseUnit: string; // Reference to base unit
  isBaseUnit: boolean;
  inUse?: boolean; // For edit prevention check
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

interface Location {
  id: string;
  name: string;
  type: "Warehouse" | "Branch" | "Van" | "Store";
  address: string;
  geoCoordinates?: string;
  gpsEnabled: boolean;
  geoFenceEnabled: boolean;
  gpsRequired: boolean;
  maxCapacity: number;
  currentUtilization?: number;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

interface Vendor {
  id: string;
  name: string;
  type: "Distributor" | "Dealer" | "Reseller";
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstId: string;
  creditLimit: number;
  paymentTerms: number;
  linkedWarehouse: string;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

interface TaxSetting {
  id: string;
  code: string;
  name: string;
  percentage: number;
  priceType: "Inclusive" | "Exclusive";
  applyOn: "Product" | "Category";
  roundingRule: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: "Active" | "Inactive";
}

interface OpeningStock {
  id: string;
  product: string;
  location: string;
  batchSerial: string;
  quantity: number;
  purchaseRate: number;
  stockValue: number;
  stockDate: string;
  remarks: string;
  locked: boolean;
}

interface MinStockRule {
  id: string;
  product: string;
  location: string;
  minQuantity: number;
  maxQuantity: number;
  reorderQuantity: number;
  alertChannel: "App" | "Email" | "Both";
  notifyRoles: string[];
  status: "Active" | "Inactive";
}

interface BillingConfig {
  id: string;
  invoicePrefix: string;
  invoiceFormat: string;
  financialYear: string;
  gstInvoiceType: "Regular" | "Simplified" | "Export" | "Non-GST";
  defaultPaymentModes: string[];
  autoGeneration: boolean;
  creditSaleAllowed: boolean;
  returnRefundEnabled: boolean;
  approvalRequired: boolean;
  multiCurrency: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

// ID counters for auto-generation
let categoryCounter = 6;
let uomCounter = 6;
let locationCounter = 5;
let vendorCounter = 4;
let taxCounter = 5;
let stockCounter = 4;
let ruleCounter = 4;
let billingCounter = 4;

// Generate IDs for different modules
const generateRandomSuffix = () => Math.floor(10000 + Math.random() * 90000).toString();
const generateCategoryId = () => `CAT-${generateRandomSuffix()}`;
const generateUomId = () => `UOM-${generateRandomSuffix()}`;
const generateLocationId = () => `LOC-${generateRandomSuffix()}`;
const generateVendorId = () => `VND-${generateRandomSuffix()}`;
const generateTaxId = () => `TAX-${generateRandomSuffix()}`;
const generateStockId = () => `OS-${generateRandomSuffix()}`;
const generateRuleId = () => `MSR-${generateRandomSuffix()}`;
const generateBillingId = () => `BIL-${generateRandomSuffix()}`;

// Sample Data - Categories (Agriculture)
const sampleCategories: Category[] = [
  { id: "CAT-00001", name: "Pesticides & Chemicals", parentCategory: "", type: "Physical", description: "Crop protection chemicals including insecticides, fungicides, herbicides", status: "Active", linkedProducts: 1, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
  { id: "CAT-00002", name: "Seeds", parentCategory: "", type: "Physical", description: "Hybrid and traditional seeds for various crops", status: "Active", linkedProducts: 1, createdAt: "2024-01-16", updatedAt: "2024-01-16" },
  { id: "CAT-00003", name: "Fertilizers", parentCategory: "", type: "Physical", description: "Organic and inorganic fertilizers for soil enrichment", status: "Active", linkedProducts: 1, createdAt: "2024-01-17", updatedAt: "2024-01-17" },
  { id: "CAT-00004", name: "Plant Growth Regulators", parentCategory: "", type: "Physical", description: "Hormones and growth boosters for crops", status: "Active", linkedProducts: 1, createdAt: "2024-01-18", updatedAt: "2024-01-18" },
];

// Sample Data - UOMs (Agriculture)
const sampleUoms: UOM[] = [
  { id: "UOM-00001", name: "Liter", shortCode: "LTR", conversionFactor: 1, baseUnit: "", isBaseUnit: true, inUse: true, status: "Active", createdAt: "2024-01-10", updatedAt: "2024-01-10" },
  { id: "UOM-00002", name: "Kilogram", shortCode: "KG", conversionFactor: 1, baseUnit: "", isBaseUnit: true, inUse: true, status: "Active", createdAt: "2024-01-10", updatedAt: "2024-01-10" },
  { id: "UOM-00003", name: "Milliliter", shortCode: "ML", conversionFactor: 0.001, baseUnit: "UOM-00001", isBaseUnit: false, inUse: true, status: "Active", createdAt: "2024-01-10", updatedAt: "2024-01-10" },
  { id: "UOM-00004", name: "Gram", shortCode: "GM", conversionFactor: 0.001, baseUnit: "UOM-00002", isBaseUnit: false, inUse: true, status: "Active", createdAt: "2024-01-11", updatedAt: "2024-01-11" },
];

// Sample Data - Locations (Agriculture)
const sampleLocations: Location[] = [
  { id: "LOC-00001", name: "Central Godown - Indore", type: "Warehouse", address: "Plot 45, Industrial Area, Indore, MP", geoCoordinates: "22.7196,75.8577", gpsEnabled: true, geoFenceEnabled: true, gpsRequired: false, maxCapacity: 50000, currentUtilization: 65, status: "Active", createdAt: "2024-01-05", updatedAt: "2024-01-05" },
  { id: "LOC-00002", name: "Dewas Branch", type: "Branch", address: "Agro Market, Station Road, Dewas", geoCoordinates: "22.9676,76.0534", gpsEnabled: true, geoFenceEnabled: false, gpsRequired: false, maxCapacity: 15000, currentUtilization: 45, status: "Active", createdAt: "2024-01-06", updatedAt: "2024-01-06" },
  { id: "LOC-00003", name: "Field Van - Route 1", type: "Van", address: "Route: Indore-Ujjain-Ratlam", geoCoordinates: "", gpsEnabled: true, geoFenceEnabled: false, gpsRequired: true, maxCapacity: 2000, currentUtilization: 80, status: "Active", createdAt: "2024-01-07", updatedAt: "2024-01-07" },
  { id: "LOC-00004", name: "Retail Counter - Mhow", type: "Store", address: "Main Market, Mhow, MP", geoCoordinates: "22.5547,75.7571", gpsEnabled: false, geoFenceEnabled: false, gpsRequired: false, maxCapacity: 5000, currentUtilization: 55, status: "Active", createdAt: "2024-01-08", updatedAt: "2024-01-08" },
];

// Sample Data - Vendors (Agriculture)
const sampleVendors: Vendor[] = [
  { id: "VND-00001", name: "Syngenta India Pvt Ltd", type: "Distributor", contactPerson: "Manoj Agarwal", phone: "+91-9876543210", email: "manoj@syngenradist.com", address: "Agrochemical Hub, Pune", gstId: "27AADCS1234B1ZQ", creditLimit: 1000000, paymentTerms: 45, linkedWarehouse: "LOC-00001", status: "Active", createdAt: "2024-01-20", updatedAt: "2024-01-20" },
  { id: "VND-00002", name: "Mahyco Seeds Dealer", type: "Dealer", contactPerson: "Ramesh Patidar", phone: "+91-9876543211", email: "ramesh@mahycodealer.com", address: "Seed Market, Jalgaon", gstId: "27AADCM5678C2ZP", creditLimit: 500000, paymentTerms: 30, linkedWarehouse: "LOC-00001", status: "Active", createdAt: "2024-01-21", updatedAt: "2024-01-21" },
  { id: "VND-00003", name: "IFFCO Fertilizers", type: "Distributor", contactPerson: "Suresh Sharma", phone: "+91-9876543212", email: "suresh@iffcodist.in", address: "Fertilizer Complex, Kandla", gstId: "24AADCI9012D3ZO", creditLimit: 2000000, paymentTerms: 60, linkedWarehouse: "LOC-00001", status: "Active", createdAt: "2024-01-22", updatedAt: "2024-01-22" },
  { id: "VND-00004", name: "Bayer CropScience", type: "Distributor", contactPerson: "Vikram Singh", phone: "+91-9876543213", email: "vikram@bayercrop.com", address: "Agro Park, Mumbai", gstId: "27AADCB3456E4ZN", creditLimit: 1500000, paymentTerms: 45, linkedWarehouse: "LOC-00002", status: "Active", createdAt: "2024-01-23", updatedAt: "2024-01-23" },
];

// Sample Data - Tax Settings (Agriculture)
const sampleTaxSettings: TaxSetting[] = [
  { id: "TAX-00001", code: "GST-18", name: "GST 18% (Chemicals)", percentage: 18, priceType: "Exclusive", applyOn: "Category", roundingRule: "Round to nearest", effectiveFrom: "2024-01-01", effectiveTo: "2025-12-31", status: "Active" },
  { id: "TAX-00002", code: "GST-12", name: "GST 12% (Fertilizers)", percentage: 12, priceType: "Exclusive", applyOn: "Category", roundingRule: "Round up", effectiveFrom: "2024-01-01", effectiveTo: "2025-12-31", status: "Active" },
  { id: "TAX-00003", code: "GST-5", name: "GST 5% (Seeds)", percentage: 5, priceType: "Inclusive", applyOn: "Category", roundingRule: "Round down", effectiveFrom: "2024-01-01", effectiveTo: "2025-12-31", status: "Active" },
  { id: "TAX-00004", code: "EXEMPT", name: "Tax Exempt (Organic)", percentage: 0, priceType: "Exclusive", applyOn: "Product", roundingRule: "No rounding", effectiveFrom: "2024-01-01", effectiveTo: "2025-12-31", status: "Active" },
];

// Sample Data - Products (Agriculture - 4 items)
const sampleProducts: Product[] = [
  { id: "PID-00001", productId: "PID-00001", sku: "SKU-PEST001", barcode: "BCSKUPEST001", name: "Chlorpyrifos 20% EC (Insecticide)", category: "CAT-00001", brand: "Syngenta", uom: "UOM-00001", sellingPrice: 580, taxCategory: "TAX-00001", trackInventory: true, allowDiscount: true, serialBatchTracking: true, expiryTracking: true, status: "Active", createdAt: "2024-02-01", updatedAt: "2024-02-01" },
  { id: "PID-00002", productId: "PID-00002", sku: "SKU-SEED001", barcode: "BCSKUSEED001", name: "Hybrid Tomato Seeds (Namdhari 585)", category: "CAT-00002", brand: "Namdhari Seeds", uom: "UOM-00004", sellingPrice: 1650, taxCategory: "TAX-00003", trackInventory: true, allowDiscount: true, serialBatchTracking: true, expiryTracking: true, status: "Active", createdAt: "2024-02-02", updatedAt: "2024-02-02" },
  { id: "PID-00003", productId: "PID-00003", sku: "SKU-FERT001", barcode: "BCSKUFERT001", name: "DAP Fertilizer (Di-Ammonium Phosphate)", category: "CAT-00003", brand: "IFFCO", uom: "UOM-00002", sellingPrice: 1490, taxCategory: "TAX-00002", trackInventory: true, allowDiscount: false, serialBatchTracking: false, expiryTracking: false, status: "Active", createdAt: "2024-02-03", updatedAt: "2024-02-03" },
  { id: "PID-00004", productId: "PID-00004", sku: "SKU-PGR001", barcode: "BCSKUPGR001", name: "Gibberellic Acid 0.001% (Growth Booster)", category: "CAT-00004", brand: "Bayer", uom: "UOM-00003", sellingPrice: 395, taxCategory: "TAX-00001", trackInventory: true, allowDiscount: true, serialBatchTracking: true, expiryTracking: true, status: "Active", createdAt: "2024-02-04", updatedAt: "2024-02-04" },
];

// Sample Data - Opening Stocks (Agriculture)
const sampleOpeningStocks: OpeningStock[] = [
  { id: "OS-00001", product: "PID-00001", location: "LOC-00001", batchSerial: "BATCH-SYN-2024-001", quantity: 200, purchaseRate: 450, stockValue: 90000, stockDate: "2024-02-01", remarks: "Initial stock from Syngenta", locked: true },
  { id: "OS-00002", product: "PID-00002", location: "LOC-00001", batchSerial: "BATCH-NAM-2024-001", quantity: 50, purchaseRate: 1200, stockValue: 60000, stockDate: "2024-02-01", remarks: "Tomato seeds - Rabi season stock", locked: true },
  { id: "OS-00003", product: "PID-00003", location: "LOC-00002", batchSerial: "BATCH-IFF-2024-001", quantity: 500, purchaseRate: 1350, stockValue: 675000, stockDate: "2024-02-02", remarks: "DAP stock - Dewas Branch", locked: false },
  { id: "OS-00004", product: "PID-00004", location: "LOC-00001", batchSerial: "BATCH-BAY-2024-001", quantity: 100, purchaseRate: 280, stockValue: 28000, stockDate: "2024-02-03", remarks: "PGR stock from Bayer", locked: false },
];

// Sample Data - Min Stock Rules (Agriculture)
const sampleMinStockRules: MinStockRule[] = [
  { id: "MSR-00001", product: "PID-00001", location: "LOC-00001", minQuantity: 50, maxQuantity: 500, reorderQuantity: 100, alertChannel: "Both", notifyRoles: ["Warehouse Manager", "Purchase Team"], status: "Active" },
  { id: "MSR-00002", product: "PID-00002", location: "LOC-00001", minQuantity: 20, maxQuantity: 200, reorderQuantity: 50, alertChannel: "Email", notifyRoles: ["Warehouse Manager"], status: "Active" },
  { id: "MSR-00003", product: "PID-00003", location: "LOC-00002", minQuantity: 100, maxQuantity: 1000, reorderQuantity: 200, alertChannel: "App", notifyRoles: ["Sales Manager", "Warehouse Manager"], status: "Active" },
  { id: "MSR-00004", product: "PID-00004", location: "LOC-00001", minQuantity: 30, maxQuantity: 300, reorderQuantity: 75, alertChannel: "Both", notifyRoles: ["Agronomist", "Warehouse Manager"], status: "Active" },
];

// Sample Data - Billing Configurations (Agriculture)
const sampleBillingConfigs: BillingConfig[] = [
  { id: "BIL-00001", invoicePrefix: "AGR-", invoiceFormat: "YYYY-MM-####", financialYear: "2024-25", gstInvoiceType: "Regular", defaultPaymentModes: ["Cash", "UPI", "Credit"], autoGeneration: true, creditSaleAllowed: true, returnRefundEnabled: true, approvalRequired: false, multiCurrency: false, status: "Active", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "BIL-00002", invoicePrefix: "DLR-", invoiceFormat: "YYYY-####", financialYear: "2024-25", gstInvoiceType: "Regular", defaultPaymentModes: ["Bank Transfer", "Cheque"], autoGeneration: false, creditSaleAllowed: true, returnRefundEnabled: true, approvalRequired: true, multiCurrency: false, status: "Active", createdAt: "2024-01-15", updatedAt: "2024-01-15" },
  { id: "BIL-00003", invoicePrefix: "RET-", invoiceFormat: "MM-YYYY-####", financialYear: "2024-25", gstInvoiceType: "Regular", defaultPaymentModes: ["Cash", "UPI"], autoGeneration: true, creditSaleAllowed: false, returnRefundEnabled: true, approvalRequired: false, multiCurrency: false, status: "Active", createdAt: "2024-02-01", updatedAt: "2024-02-01" },
  { id: "BIL-00004", invoicePrefix: "FLD-", invoiceFormat: "DD-MM-####", financialYear: "2024-25", gstInvoiceType: "Simplified", defaultPaymentModes: ["Cash"], autoGeneration: true, creditSaleAllowed: false, returnRefundEnabled: false, approvalRequired: false, multiCurrency: false, status: "Active", createdAt: "2024-02-05", updatedAt: "2024-02-05" },
];

const mainSections = [
  { id: "product-setup", label: "Product Setup", icon: Package },
  { id: "stock-management", label: "Stock Management", icon: Layers },
  { id: "sales-billing", label: "Sales & Billing", icon: DollarSign },
];

const subModulesData: Record<string, any[]> = {
  "product-setup": [
    { id: "product-master", label: "Product Master", description: "Configure product details and inventory settings", icon: Package },
    { id: "category-master", label: "Category Master", description: "Manage product categories and hierarchy", icon: FolderTree },
    { id: "uom", label: "Unit of Measure", description: "Define units of measurement for products", icon: Ruler },
    { id: "vendor-setup", label: "Vendor Setup", description: "Manage distributors, dealers and resellers", icon: Users },
    { id: "tax-price", label: "Tax & Price Settings", description: "Configure tax rates and pricing rules", icon: Receipt },
  ],
  "stock-management": [
    { id: "warehouse", label: "Warehouse Master", description: "Configure warehouse and storage locations", icon: Warehouse },
    { id: "opening-stock", label: "Opening Stock Setup", description: "Manage initial inventory levels", icon: PackageOpen },
    { id: "min-stock", label: "Stock Rules", description: "Minimum rules and alerts", icon: AlertTriangle },
    { id: "inventory-master", label: "Inventory Settings", description: "Global inventory preferences", icon: ClipboardList },
  ],
  "sales-billing": [
    { id: "order-management", label: "Order Management", description: "Manage sales orders", icon: ShoppingCart },
    { id: "billing", label: "Billing & Invoicing", description: "Configure invoice formats and payment settings", icon: FileText },
    { id: "dispatch-management", label: "Dispatch Management", description: "Manage shipments and delivery", icon: Truck },
    { id: "payment-tracking", label: "Payment Tracking", description: "Track payments and outstanding dues", icon: CreditCard },
  ]
};

// Generate system IDs
const generateProductId = () => `PID-${Math.floor(10000 + Math.random() * 90000).toString()}`;
const generateSKU = (prefix: string = "SKU") => `${prefix}-${Date.now().toString(36).toUpperCase()}`;
const generateBarcode = (sku: string) => `BC${sku.replace(/-/g, '')}`;

export default function InventoryManagementTab() {
  const [activeSection, setActiveSection] = useState("");
  const [activeModule, setActiveModule] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Data state arrays - linked in real-time to all forms and lists (hydrated from backend or local fallback)
  const {
    products, setProducts,
    categories, setCategories,
    uoms, setUoms,
    locations, setLocations,
    vendors, setVendors,
    roles,
    rolePermissions,
  } = useMasterData();
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>(sampleTaxSettings);
  const [openingStocks, setOpeningStocks] = useState<OpeningStock[]>(sampleOpeningStocks);
  const [minStockRules, setMinStockRules] = useState<MinStockRule[]>(sampleMinStockRules);
  const [billingConfigs, setBillingConfigs] = useState<BillingConfig[]>(sampleBillingConfigs);

  // Form states for different modules
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [uomForm, setUomForm] = useState<Partial<UOM>>({});
  const [locationForm, setLocationForm] = useState<Partial<Location>>({});
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({});
  const [taxForm, setTaxForm] = useState<Partial<TaxSetting>>({});
  const [stockForm, setStockForm] = useState<Partial<OpeningStock>>({});
  const [ruleForm, setRuleForm] = useState<Partial<MinStockRule>>({});
  const [billingForm, setBillingForm] = useState<Partial<BillingConfig>>({});

  // Settings states
  const [inventorySettings, setInventorySettings] = useState({
    valuationMethod: "FIFO",
    allowNegativeStock: false,
    stockApprovalRequired: false,
    autoStockDeduction: true,
    damageHandling: "Separate",
    stockFreezePeriod: "End of Day",
    auditTrailEnabled: true,
  });

  const [billingSettings, setBillingSettings] = useState({
    invoicePrefix: "INV-",
    invoiceFormat: "YYYY-MM-####",
    financialYear: "2024-25",
    autoGeneration: true,
    multiCurrency: false,
    defaultPaymentModes: ["Cash", "Card", "UPI"],
    creditSaleAllowed: true,
    approvalRequired: false,
    gstInvoiceType: "Regular",
    returnRefundEnabled: true,
  });

  const [posSettings, setPosSettings] = useState({
    posEnabled: true,
    posType: "Web",
    offlineBillingAllowed: true,
    syncInterval: 5,
    defaultLocation: "",
    autoStockSync: true,
    barcodeScanner: true,
    receiptPrinter: "",
    userRoleMapping: "",
  });

  const [analyticsSettings, setAnalyticsSettings] = useState({
    inventoryAnalytics: true,
    salesAnalytics: true,
    partnerPerformance: true,
    reportPeriod: "Monthly",
    autoReportEmail: false,
    lowStockThreshold: 10,
    deadStockDays: 90,
    dashboardWidgets: ["Stock Levels", "Sales Trend", "Top Products"],
    dataRetention: "12 Months",
    exportFormats: ["PDF", "Excel"],
  });

  // --- PERMISSION CHECKS ---
  const rawRole = sessionStorage.getItem("userRole") || "employee";
  const currentRole = roles.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = rawRole.toLowerCase() === "admin" || isGlobalAdmin;

  const filteredMainSections = React.useMemo(() => {
    return mainSections.filter(section => {
      if (isAdmin) return true;
      const perm = rolePermissions.find(p => p.roleId === currentRole?.id && p.module === section.label);
      return perm?.view;
    });
  }, [rolePermissions, currentRole, isAdmin]);

  React.useEffect(() => {
    if (filteredMainSections.length > 0 && !filteredMainSections.find(s => s.id === activeSection)) {
      const firstSection = filteredMainSections[0];
      setActiveSection(firstSection.id);
      if (subModulesData[firstSection.id] && subModulesData[firstSection.id].length > 0) {
        setActiveModule(subModulesData[firstSection.id][0].id);
      }
    }
  }, [filteredMainSections, activeSection]);

  const activeSectionLabel = mainSections.find(s => s.id === activeSection)?.label;
  const activePerm = rolePermissions.find(p => p.roleId === currentRole?.id && p.module === activeSectionLabel);
  const isRegionalManager = rawRole?.toLowerCase() === "regional_manager" || rawRole?.toLowerCase() === "regional manager";

  let canCreate = !isRegionalManager && (isAdmin || activePerm?.create);
  let canEdit = !isRegionalManager && (isAdmin || activePerm?.edit);
  let canDelete = !isRegionalManager && (isAdmin || activePerm?.delete);
  const canExport = !!(isAdmin || activePerm?.export);
  const canApprove = !isRegionalManager && (isAdmin || activePerm?.approve);

  // Enforce strictly that only Admins can add/edit/delete Product Master items
  if (activeModule === "product-master") {
    canCreate = isAdmin;
    canEdit = isAdmin;
    canDelete = isAdmin;
  }
  // -----------------------

  const handleAdd = () => {
    setModalMode("add");
    setSelectedItem(null);
    setFormErrors({});
    resetForms();
    
    const now = new Date().toISOString().split('T')[0];
    
    // Pre-populate system-generated fields for each module
    const currentModule = activeModule;
    switch (currentModule) {
      case "product-master":
        const newProductId = generateProductId();
        const newSku = generateSKU("SKU");
        setProductForm({
          productId: newProductId,
          sku: newSku,
          barcode: generateBarcode(newSku),
          trackInventory: true,
          allowDiscount: true,
          serialBatchTracking: false,
          expiryTracking: false,
          status: "Active",
          createdAt: now,
          updatedAt: now,
        });
        break;
      case "category-master":
        setCategoryForm({
          id: generateCategoryId(),
          status: "Active",
          createdAt: now,
          updatedAt: now,
        });
        break;
      case "uom":
        setUomForm({
          id: generateUomId(),
          isBaseUnit: false,
          conversionFactor: 1,
          status: "Active",
          createdAt: now,
          updatedAt: now,
        });
        break;
      case "warehouse":
        setLocationForm({
          id: generateLocationId(),
          gpsEnabled: false,
          geoFenceEnabled: false,
          gpsRequired: false,
          status: "Active",
          createdAt: now,
          updatedAt: now,
        });
        break;
      case "vendor-setup":
        setVendorForm({
          id: generateVendorId(),
          status: "Active",
          createdAt: now,
          updatedAt: now,
        });
        break;
      case "tax-price":
        setTaxForm({
          id: generateTaxId(),
          status: "Active",
          effectiveFrom: now,
        });
        break;
      case "opening-stock":
        setStockForm({
          id: generateStockId(),
          stockDate: now,
          locked: false,
        });
        break;
      case "min-stock":
        setRuleForm({
          id: generateRuleId(),
          alertChannel: "App",
          status: "Active",
        });
        break;
      case "billing":
        setBillingForm({
          id: generateBillingId(),
          autoGeneration: true,
          creditSaleAllowed: true,
          returnRefundEnabled: true,
          approvalRequired: false,
          multiCurrency: false,
          status: "Active",
          createdAt: now,
          updatedAt: now,
        });
        break;
    }
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormErrors({});
    populateForm(item);
    setShowModal(true);
  };

  const handleView = (item: any) => {
    setModalMode("view");
    setSelectedItem(item);
    setFormErrors({});
    populateForm(item);
    setShowModal(true);
  };

  const resetForms = () => {
    setProductForm({});
    setCategoryForm({});
    setUomForm({});
    setLocationForm({});
    setVendorForm({});
    setTaxForm({});
    setStockForm({});
    setRuleForm({});
    setBillingForm({});
    setFormErrors({});
  };

  const populateForm = (item: any) => {
    switch (activeModule) {
      case "product-master":
        setProductForm(item);
        break;
      case "category-master":
        setCategoryForm(item);
        break;
      case "uom":
        setUomForm(item);
        break;
      case "warehouse":
        setLocationForm(item);
        break;
      case "vendor-setup":
        setVendorForm(item);
        break;
      case "tax-price":
        setTaxForm(item);
        break;
      case "opening-stock":
        setStockForm(item);
        break;
      case "min-stock":
        setRuleForm(item);
        break;
      case "billing":
        setBillingForm(item);
        break;
    }
  };

  // Validation for Product form
  const validateProductForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!productForm.name?.trim()) {
      errors.name = "Product Name is required";
    }
    if (!productForm.category) {
      errors.category = "Category is required";
    }
    if (!productForm.uom) {
      errors.uom = "Unit of Measure is required";
    }
    if (!productForm.sellingPrice || productForm.sellingPrice <= 0) {
      errors.sellingPrice = "Valid Selling Price is required";
    }
    if (!productForm.taxCategory) {
      errors.taxCategory = "Tax Category is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper functions to get names from IDs for display
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const getUomName = (id: string) => {
    const uom = uoms.find(u => u.id === id);
    return uom ? `${uom.name} (${uom.shortCode})` : id;
  };
  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || id;
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;
  const getTaxName = (id: string) => {
    const tax = taxSettings.find(t => t.id === id);
    return tax ? `${tax.name} (${tax.percentage}%)` : id;
  };

  const handleSave = async () => {
    const now = new Date().toISOString().split('T')[0];
    const BASE_INV = `/api/inventory`;
    
    switch (activeModule) {
      case "product-master":
        if (!validateProductForm()) {
          toast.error("Please fix the validation errors");
          return;
        }
        if (modalMode === "add") {
          const newProduct: Product = {
            id: productForm.productId || generateProductId(),
            productId: productForm.productId || "",
            sku: productForm.sku || "",
            barcode: productForm.barcode || "",
            name: productForm.name || "",
            category: productForm.category || "",
            brand: productForm.brand || "",
            uom: productForm.uom || "",
            sellingPrice: productForm.sellingPrice || 0,
            taxCategory: productForm.taxCategory || "",
            trackInventory: productForm.trackInventory || false,
            allowDiscount: productForm.allowDiscount || false,
            serialBatchTracking: productForm.serialBatchTracking || false,
            expiryTracking: productForm.expiryTracking || false,
            productImage: productForm.productImage,
            status: productForm.status || "Active",
            createdAt: productForm.createdAt || now,
            updatedAt: now,
          };
          try {
            const res = await fetch(`${BASE_INV}/products/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newProduct),
            });
            if (res.ok) {
              const saved = await res.json();
              setProducts([...products, saved]);
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        } else {
          try {
            const res = await fetch(`${BASE_INV}/products/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...productForm, updatedAt: now }),
            });
            if (res.ok) {
              const updated = await res.json();
              setProducts(products.map(p => p.id === selectedItem.id ? updated : p));
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        }
        break;
        
      case "category-master":
        if (!categoryForm.name?.trim()) {
          toast.error("Category Name is required");
          return;
        }
        if (modalMode === "add") {
          const newCategory: Category = {
            id: categoryForm.id || generateCategoryId(),
            name: categoryForm.name || "",
            parentCategory: categoryForm.parentCategory || "",
            type: categoryForm.type || "Physical",
            description: categoryForm.description || "",
            status: categoryForm.status || "Active",
            linkedProducts: 0,
            createdAt: categoryForm.createdAt || now,
            updatedAt: now,
          };
          try {
            const res = await fetch(`${BASE_INV}/categories/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newCategory),
            });
            if (res.ok) {
              const saved = await res.json();
              setCategories([...categories, saved]);
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        } else {
          try {
            const res = await fetch(`${BASE_INV}/categories/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...categoryForm, updatedAt: now }),
            });
            if (res.ok) {
              const updated = await res.json();
              setCategories(categories.map(c => c.id === selectedItem.id ? updated : c));
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        }
        break;
        
      case "uom":
        if (!uomForm.name?.trim()) {
          toast.error("UOM Name is required");
          return;
        }
        if (!uomForm.shortCode?.trim()) {
          toast.error("Short Code is required");
          return;
        }
        if (modalMode === "add") {
          const newUom: UOM = {
            id: uomForm.id || generateUomId(),
            name: uomForm.name || "",
            shortCode: uomForm.shortCode || "",
            conversionFactor: uomForm.conversionFactor || 1,
            baseUnit: uomForm.baseUnit || "",
            isBaseUnit: uomForm.isBaseUnit || false,
            inUse: false,
            status: uomForm.status || "Active",
            createdAt: uomForm.createdAt || now,
            updatedAt: now,
          };
          try {
            const res = await fetch(`${BASE_INV}/uoms/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUom),
            });
            if (res.ok) {
              const saved = await res.json();
              setUoms([...uoms, saved]);
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        } else {
          try {
            const res = await fetch(`${BASE_INV}/uoms/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...uomForm, updatedAt: now }),
            });
            if (res.ok) {
              const updated = await res.json();
              setUoms(uoms.map(u => u.id === selectedItem.id ? updated : u));
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        }
        break;
        
      case "warehouse":
        if (!locationForm.name?.trim()) {
          toast.error("Location Name is required");
          return;
        }
        if (modalMode === "add") {
          const newLocation: Location = {
            id: locationForm.id || generateLocationId(),
            name: locationForm.name || "",
            type: locationForm.type || "Warehouse",
            address: locationForm.address || "",
            geoCoordinates: locationForm.geoCoordinates,
            gpsEnabled: locationForm.gpsEnabled || false,
            geoFenceEnabled: locationForm.geoFenceEnabled || false,
            gpsRequired: locationForm.gpsRequired || false,
            maxCapacity: locationForm.maxCapacity || 0,
            currentUtilization: 0,
            status: locationForm.status || "Active",
            createdAt: locationForm.createdAt || now,
            updatedAt: now,
          };
          try {
            const res = await fetch(`${BASE_INV}/locations/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newLocation),
            });
            if (res.ok) {
              const saved = await res.json();
              setLocations([...locations, saved]);
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        } else {
          try {
            const res = await fetch(`${BASE_INV}/locations/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...locationForm, updatedAt: now }),
            });
            if (res.ok) {
              const updated = await res.json();
              setLocations(locations.map(l => l.id === selectedItem.id ? updated : l));
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        }
        break;
        
      case "vendor-setup":
        if (!vendorForm.name?.trim()) { toast.error("Vendor Name is required"); return; }
        if (!vendorForm.contactPerson?.trim()) { toast.error("Contact Person is required"); return; }
        if (!vendorForm.phone?.trim()) { toast.error("Phone Number is required"); return; }
        if (!vendorForm.email?.trim()) { toast.error("Email is required"); return; }
        if (!vendorForm.address?.trim()) { toast.error("Address is required"); return; }
        if (!vendorForm.gstId?.trim()) { toast.error("GST ID is required"); return; }
        if (!vendorForm.linkedWarehouse?.trim()) { toast.error("Linked Warehouse is required"); return; }
        if (modalMode === "add") {
          const newVendor: Vendor = {
            id: vendorForm.id || generateVendorId(),
            name: vendorForm.name || "",
            type: vendorForm.type || "Distributor",
            contactPerson: vendorForm.contactPerson || "",
            phone: vendorForm.phone || "",
            email: vendorForm.email || "",
            address: vendorForm.address || "",
            gstId: vendorForm.gstId || "",
            creditLimit: vendorForm.creditLimit || 0,
            paymentTerms: vendorForm.paymentTerms || 0,
            linkedWarehouse: vendorForm.linkedWarehouse || "",
            status: vendorForm.status || "Active",
            createdAt: vendorForm.createdAt || now,
            updatedAt: now,
          };
          try {
            const res = await fetch(`${BASE_INV}/vendors/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newVendor),
            });
            if (res.ok) {
              const saved = await res.json();
              setVendors([...vendors, saved]);
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        } else {
          try {
            const res = await fetch(`${BASE_INV}/vendors/${selectedItem.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...vendorForm, updatedAt: now }),
            });
            if (res.ok) {
              const updated = await res.json();
              setVendors(vendors.map(p => p.id === selectedItem.id ? updated : p));
            } else {
              const err = await res.json();
              toast.error("Error: " + JSON.stringify(err));
              return;
            }
          } catch { toast.error("Network error."); return; }
        }
        break;
        
      case "tax-price":
        if (!taxForm.name?.trim()) {
          toast.error("Tax Name is required");
          return;
        }
        if (!taxForm.code?.trim()) {
          toast.error("Tax Code is required");
          return;
        }
        if (modalMode === "add") {
          const newTax: TaxSetting = {
            id: taxForm.id || generateTaxId(),
            code: taxForm.code || "",
            name: taxForm.name || "",
            percentage: taxForm.percentage || 0,
            priceType: taxForm.priceType || "Exclusive",
            applyOn: taxForm.applyOn || "Product",
            roundingRule: taxForm.roundingRule || "",
            effectiveFrom: taxForm.effectiveFrom || now,
            effectiveTo: taxForm.effectiveTo || "",
            status: taxForm.status || "Active",
          };
          setTaxSettings([...taxSettings, newTax]);
        } else {
          setTaxSettings(taxSettings.map(t => t.id === selectedItem.id ? { ...t, ...taxForm } : t));
        }
        break;
        
      case "opening-stock":
        if (!stockForm.product) {
          toast.error("Product is required");
          return;
        }
        if (!stockForm.location) {
          toast.error("Location is required");
          return;
        }
        if (modalMode === "add") {
          const newStock: OpeningStock = {
            id: stockForm.id || generateStockId(),
            product: stockForm.product || "",
            location: stockForm.location || "",
            batchSerial: stockForm.batchSerial || "",
            quantity: stockForm.quantity || 0,
            purchaseRate: stockForm.purchaseRate || 0,
            stockValue: (stockForm.quantity || 0) * (stockForm.purchaseRate || 0),
            stockDate: stockForm.stockDate || now,
            remarks: stockForm.remarks || "",
            locked: stockForm.locked || false,
          };
          setOpeningStocks([...openingStocks, newStock]);
        } else {
          setOpeningStocks(openingStocks.map(s => s.id === selectedItem.id ? { 
            ...s, 
            ...stockForm, 
            stockValue: (stockForm.quantity || 0) * (stockForm.purchaseRate || 0) 
          } : s));
        }
        break;
        
      case "min-stock":
        if (!ruleForm.product) {
          toast.error("Product is required");
          return;
        }
        if (!ruleForm.location) {
          toast.error("Location is required");
          return;
        }
        if (modalMode === "add") {
          const newRule: MinStockRule = {
            id: ruleForm.id || generateRuleId(),
            product: ruleForm.product || "",
            location: ruleForm.location || "",
            minQuantity: ruleForm.minQuantity || 0,
            maxQuantity: ruleForm.maxQuantity || 0,
            reorderQuantity: ruleForm.reorderQuantity || 0,
            alertChannel: ruleForm.alertChannel || "App",
            notifyRoles: ruleForm.notifyRoles || [],
            status: ruleForm.status || "Active",
          };
          setMinStockRules([...minStockRules, newRule]);
        } else {
          setMinStockRules(minStockRules.map(r => r.id === selectedItem.id ? { ...r, ...ruleForm } : r));
        }
        break;
        
      case "billing":
        if (!billingForm.invoicePrefix) {
          toast.error("Invoice Prefix is required");
          return;
        }
        if (!billingForm.invoiceFormat) {
          toast.error("Invoice Format is required");
          return;
        }
        if (!billingForm.financialYear) {
          toast.error("Financial Year is required");
          return;
        }
        if (modalMode === "add") {
          const newBilling: BillingConfig = {
            id: billingForm.id || generateBillingId(),
            invoicePrefix: billingForm.invoicePrefix || "",
            invoiceFormat: billingForm.invoiceFormat || "",
            financialYear: billingForm.financialYear || "",
            gstInvoiceType: billingForm.gstInvoiceType || "Regular",
            defaultPaymentModes: billingForm.defaultPaymentModes || ["Cash"],
            autoGeneration: billingForm.autoGeneration || false,
            creditSaleAllowed: billingForm.creditSaleAllowed || false,
            returnRefundEnabled: billingForm.returnRefundEnabled || false,
            approvalRequired: billingForm.approvalRequired || false,
            multiCurrency: billingForm.multiCurrency || false,
            status: billingForm.status || "Active",
            createdAt: billingForm.createdAt || now,
            updatedAt: now,
          };
          setBillingConfigs([...billingConfigs, newBilling]);
        } else {
          setBillingConfigs(billingConfigs.map(b => b.id === selectedItem.id ? { ...b, ...billingForm, updatedAt: now } : b));
        }
        break;
    }
    
    toast.success(`${modalMode === "add" ? "Added" : "Updated"} successfully`);
    setShowModal(false);
    resetForms();
  };

  const handleDelete = async (item: any) => {
    const BASE_INV = `/api/inventory`;
    if (!confirm("Are you sure you want to delete this item?")) return;

    switch (activeModule) {
      case "product-master":
        try {
          const res = await fetch(`${BASE_INV}/products/${item.id}/`, { method: 'DELETE' });
          if (res.ok) {
            setProducts(products.filter(p => p.id !== item.id));
          } else {
            toast.error("Failed to delete product.");
            return;
          }
        } catch { toast.error("Network error."); return; }
        break;
      case "category-master":
        // Check if linked to products
        const linkedProducts = products.filter(p => p.category === item.id).length;
        if (linkedProducts > 0) {
          toast.error(`Cannot delete: ${linkedProducts} product(s) are linked to this category`);
          return;
        }
        try {
          const res = await fetch(`${BASE_INV}/categories/${item.id}/`, { method: 'DELETE' });
          if (res.ok) {
            setCategories(categories.filter(c => c.id !== item.id));
          } else {
            toast.error("Failed to delete category.");
            return;
          }
        } catch { toast.error("Network error."); return; }
        break;
      case "uom":
        // Check if in use
        const uomInUse = products.filter(p => p.uom === item.id).length;
        if (uomInUse > 0) {
          toast.error(`Cannot delete: ${uomInUse} product(s) are using this UOM`);
          return;
        }
        try {
          const res = await fetch(`${BASE_INV}/uoms/${item.id}/`, { method: 'DELETE' });
          if (res.ok) {
            setUoms(uoms.filter(u => u.id !== item.id));
          } else {
            toast.error("Failed to delete UOM.");
            return;
          }
        } catch { toast.error("Network error."); return; }
        break;
      case "warehouse":
        // Check if linked to vendors or stock
        const vendorsLinked = vendors.filter(p => p.linkedWarehouse === item.id).length;
        const stockLinked = openingStocks.filter(s => s.location === item.id).length;
        if (vendorsLinked > 0 || stockLinked > 0) {
          toast.error(`Cannot delete: Location is linked to ${vendorsLinked} vendor(s) and ${stockLinked} stock record(s)`);
          return;
        }
        try {
          const res = await fetch(`${BASE_INV}/locations/${item.id}/`, { method: 'DELETE' });
          if (res.ok) {
            setLocations(locations.filter(l => l.id !== item.id));
          } else {
            toast.error("Failed to delete location.");
            return;
          }
        } catch { toast.error("Network error."); return; }
        break;
      case "vendor-setup":
        try {
          const res = await fetch(`${BASE_INV}/vendors/${item.id}/`, { method: 'DELETE' });
          if (res.ok) {
            setVendors(vendors.filter(p => p.id !== item.id));
          } else {
            toast.error("Failed to delete vendor.");
            return;
          }
        } catch { toast.error("Network error."); return; }
        break;
      case "tax-price":
        // Check if in use
        const taxInUse = products.filter(p => p.taxCategory === item.id).length;
        if (taxInUse > 0) {
          toast.error(`Cannot delete: ${taxInUse} product(s) are using this tax setting`);
          return;
        }
        setTaxSettings(taxSettings.filter(t => t.id !== item.id));
        break;
      case "opening-stock":
        if (item.locked) {
          toast.error("Cannot delete locked opening stock entry");
          return;
        }
        setOpeningStocks(openingStocks.filter(s => s.id !== item.id));
        break;
      case "min-stock":
        setMinStockRules(minStockRules.filter(r => r.id !== item.id));
        break;
      case "billing":
        setBillingConfigs(billingConfigs.filter(b => b.id !== item.id));
        break;
    }
    toast.success("Deleted successfully");
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting to ${format}...`);
  };

  // Product Master columns - linked to Category, UOM, Tax masters
  const productColumns: Column<Product>[] = [
    { key: "productId", header: "Product ID", sortable: true },
    { key: "sku", header: "SKU Code/ Batch Number", sortable: true },
    { key: "name", header: "Product Name", sortable: true, render: (value: unknown, row: Product) => (
      <div className="flex items-center gap-3">
        {row.productImage ? (
          <img src={row.productImage} alt={value as string} className="w-8 h-8 rounded object-cover border" />
        ) : (
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center border">
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <span className="font-medium">{value as string}</span>
      </div>
    )},
    { key: "category", header: "Category", sortable: true, render: (value: unknown) => (
      <span className="text-sm">{getCategoryName(value as string)}</span>
    )},
    { key: "uom", header: "UOM", render: (value: unknown) => (
      <span className="text-sm">{getUomName(value as string)}</span>
    )},
    { key: "sellingPrice", header: "Selling Price", render: (value: unknown) => (
      <span className="font-mono text-primary font-medium">₹{(value as number)?.toFixed(2) || '0.00'}</span>
    )},
    { key: "taxCategory", header: "Tax", render: (value: unknown) => (
      <span className="text-sm">{getTaxName(value as string)}</span>
    )},
    { key: "trackInventory", header: "Inventory", render: (value: unknown) => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${(value as boolean) ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
        {(value as boolean) ? "Tracked" : "Untracked"}
      </span>
    )},
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${(value as string) === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${(value as string) === "Active" ? "bg-green-500" : "bg-red-500"}`} />
        {value as string}
      </span>
    )},
  ];

  // Category columns - linked to parent categories
  const categoryColumns: Column<Category>[] = [
    { key: "id", header: "Category ID", sortable: true },
    { key: "name", header: "Category Name", sortable: true },
    { key: "parentCategory", header: "Parent Category", render: (value: unknown) => (
      <span className="text-sm">{value ? getCategoryName(value as string) : <span className="text-muted-foreground">Root</span>}</span>
    )},
    { key: "type", header: "Type", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${(value as string) === "Physical" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}>
        {value as string}
      </span>
    )},
    { key: "linkedProducts", header: "Products", render: (value: unknown, row: Category) => {
      const count = products.filter(p => p.category === row.id).length;
      return <span className="text-sm font-medium">{count}</span>;
    }},
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`px-2 py-1 rounded-full text-xs ${(value as string) === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
        {value as string}
      </span>
    )},
  ];

  // UOM columns - linked to base units
  const uomColumns: Column<UOM>[] = [
    { key: "id", header: "UOM ID", sortable: true },
    { key: "name", header: "UOM Name", sortable: true },
    { key: "shortCode", header: "Short Code" },
    { key: "baseUnit", header: "Base Unit", render: (value: unknown, row: UOM) => (
      row.isBaseUnit 
        ? <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">This is Base</span>
        : <span className="text-sm">{value ? getUomName(value as string) : '-'}</span>
    )},
    { key: "conversionFactor", header: "Factor", render: (value: unknown, row: UOM) => (
      <span className="font-mono text-sm">{row.isBaseUnit ? '1.00' : (value as number)?.toFixed(4) || '1.00'}</span>
    )},
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`px-2 py-1 rounded-full text-xs ${(value as string) === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
        {value as string}
      </span>
    )},
  ];

  // Location columns
  const locationColumns: Column<Location>[] = [
    { key: "id", header: "Location ID", sortable: true },
    { key: "name", header: "Location Name", sortable: true },
    { key: "type", header: "Type", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${
        (value as string) === "Warehouse" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
        (value as string) === "Branch" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
        (value as string) === "Van" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      }`}>
        {value as string}
      </span>
    )},
    { key: "address", header: "Address", render: (value: unknown) => (
      <span className="text-sm truncate max-w-[200px] block">{(value as string) || '-'}</span>
    )},
    { key: "maxCapacity", header: "Capacity", render: (value: unknown) => (
      <span className="font-mono text-sm">{(value as number)?.toLocaleString() || '0'}</span>
    )},
    { key: "geoFenceEnabled", header: "Geo-Fence", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${(value as boolean) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
        {(value as boolean) ? "Enabled" : "Disabled"}
      </span>
    )},
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`px-2 py-1 rounded-full text-xs ${(value as string) === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
        {value as string}
      </span>
    )},
  ];

  // Vendor columns - linked to Warehouse
  const vendorColumns: Column<Vendor>[] = [
    { key: "id", header: "Vendor ID", sortable: true },
    { key: "name", header: "Vendor Name", sortable: true },
    { key: "type", header: "Type", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${
        (value as string) === "Distributor" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
        (value as string) === "Dealer" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      }`}>
        {value as string}
      </span>
    )},
    { key: "contactPerson", header: "Contact Person" },
    { key: "phone", header: "Phone" },
    { key: "linkedWarehouse", header: "Warehouse", render: (value: unknown) => (
      <span className="text-sm">{value ? getLocationName(value as string) : <span className="text-muted-foreground">None</span>}</span>
    )},
    { key: "creditLimit", header: "Credit Limit", render: (value: unknown) => (
      <span className="font-mono">₹{(value as number)?.toLocaleString() || '0'}</span>
    )},
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`px-2 py-1 rounded-full text-xs ${(value as string) === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
        {value as string}
      </span>
    )},
  ];

  // Tax Settings columns
  const taxColumns: Column<TaxSetting>[] = [
    { key: "code", header: "Tax Code", sortable: true },
    { key: "name", header: "Tax Name", sortable: true },
    { key: "percentage", header: "Percentage", render: (value: unknown) => (
      <span className="font-mono font-medium">{value as number}%</span>
    )},
    { key: "priceType", header: "Price Type", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${(value as string) === "Inclusive" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
        {value as string}
      </span>
    )},
    { key: "applyOn", header: "Apply On" },
    { key: "effectiveFrom", header: "Effective From" },
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`px-2 py-1 rounded-full text-xs ${(value as string) === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
        {value as string}
      </span>
    )},
  ];

  // Opening Stock columns - linked to Product and Location
  const openingStockColumns: Column<OpeningStock>[] = [
    { key: "id", header: "Stock ID", sortable: true },
    { key: "product", header: "Product", sortable: true, render: (value: unknown) => (
      <span className="text-sm font-medium">{getProductName(value as string)}</span>
    )},
    { key: "location", header: "Location", sortable: true, render: (value: unknown) => (
      <span className="text-sm">{getLocationName(value as string)}</span>
    )},
    { key: "batchSerial", header: "Batch/Serial", render: (value: unknown) => (
      <span className="text-sm">{(value as string) || '-'}</span>
    )},
    { key: "quantity", header: "Quantity", render: (value: unknown) => (
      <span className="font-mono font-medium">{(value as number)?.toLocaleString() || '0'}</span>
    )},
    { key: "purchaseRate", header: "Rate", render: (value: unknown) => (
      <span className="font-mono">₹{(value as number)?.toFixed(2) || '0.00'}</span>
    )},
    { key: "stockValue", header: "Value", render: (value: unknown) => (
      <span className="font-mono text-primary font-medium">₹{(value as number)?.toFixed(2) || '0.00'}</span>
    )},
    { key: "locked", header: "Locked", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${(value as boolean) ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
        {(value as boolean) ? "Locked" : "Open"}
      </span>
    )},
  ];

  // Min Stock Rules columns - linked to Product and Location
  const minStockColumns: Column<MinStockRule>[] = [
    { key: "id", header: "Rule ID", sortable: true },
    { key: "product", header: "Product", sortable: true, render: (value: unknown) => (
      <span className="text-sm font-medium">{getProductName(value as string)}</span>
    )},
    { key: "location", header: "Location", render: (value: unknown) => (
      <span className="text-sm">{getLocationName(value as string)}</span>
    )},
    { key: "minQuantity", header: "Min Qty", render: (value: unknown) => (
      <span className="font-mono text-red-600 dark:text-red-400">{(value as number)?.toLocaleString() || '0'}</span>
    )},
    { key: "maxQuantity", header: "Max Qty", render: (value: unknown) => (
      <span className="font-mono text-green-600 dark:text-green-400">{(value as number)?.toLocaleString() || '0'}</span>
    )},
    { key: "reorderQuantity", header: "Reorder Qty", render: (value: unknown) => (
      <span className="font-mono text-blue-600 dark:text-blue-400">{(value as number)?.toLocaleString() || '0'}</span>
    )},
    { key: "alertChannel", header: "Alert", render: (value: unknown) => (
      <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        {value as string}
      </span>
    )},
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`px-2 py-1 rounded-full text-xs ${(value as string) === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
        {value as string}
      </span>
    )},
  ];

  // Billing Config columns
  const billingColumns: Column<BillingConfig>[] = [
    { key: "id", header: "Config ID", sortable: true },
    { key: "invoicePrefix", header: "Invoice Prefix", sortable: true, render: (value: unknown) => (
      <span className="font-mono font-medium">{value as string}</span>
    )},
    { key: "invoiceFormat", header: "Format", render: (value: unknown) => (
      <span className="font-mono text-sm">{value as string}</span>
    )},
    { key: "financialYear", header: "Financial Year", sortable: true },
    { key: "gstInvoiceType", header: "Invoice Type", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${
        (value as string) === "Regular" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
        (value as string) === "Export" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
        (value as string) === "Simplified" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
      }`}>
        {value as string}
      </span>
    )},
    { key: "defaultPaymentModes", header: "Payment Modes", render: (value: unknown) => (
      <span className="text-sm">{(value as string[])?.join(", ") || '-'}</span>
    )},
    { key: "autoGeneration", header: "Auto Invoice", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${(value as boolean) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
        {(value as boolean) ? "Yes" : "No"}
      </span>
    )},
    { key: "creditSaleAllowed", header: "Credit Sales", render: (value: unknown) => (
      <span className={`px-2 py-0.5 rounded text-xs ${(value as boolean) ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
        {(value as boolean) ? "Allowed" : "No"}
      </span>
    )},
    { key: "status", header: "Status", render: (value: unknown) => (
      <span className={`px-2 py-1 rounded-full text-xs ${(value as string) === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
        {value as string}
      </span>
    )},
  ];

  // Render Product Form
  const renderProductForm = () => (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Basic Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Product ID</Label>
            <Input 
              value={productForm.productId || ""} 
              disabled 
              className="bg-muted/50 font-mono"
              placeholder="Auto-generated"
            />
          </div>
          <div className="col-span-full md:col-span-2 space-y-2">
            <Label>Product Photo</Label>
            <div className="flex items-center gap-4">
              {productForm.productImage ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={productForm.productImage} alt="Product" className="w-full h-full object-cover" />
                  {modalMode !== "view" && (
                    <button 
                      onClick={() => setProductForm({ ...productForm, productImage: undefined })}
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              {modalMode !== "view" && (
                <div className="space-y-2">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Image size must be less than 5MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProductForm({ ...productForm, productImage: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="max-w-[250px] cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">Recommended: Square image, max 5MB</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Product Name <span className="text-destructive">*</span></Label>
            <Input 
              value={productForm.name || ""} 
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
              disabled={modalMode === "view"}
              className={formErrors.name ? "border-destructive" : ""}
              placeholder="Enter product name"
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input 
              value={productForm.brand || ""} 
              onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="Enter brand name"
            />
          </div>
          <div className="space-y-2">
            <Label>SKU Code/ Batch Number</Label>
            <Input 
              value={productForm.sku || ""} 
              disabled 
              className="bg-muted/50 font-mono"
              placeholder="Auto-generated"
            />
            <p className="text-xs text-muted-foreground">System-generated based on prefix and sequence</p>
          </div>
          <div className="space-y-2">
            <Label>Barcode / QR Code</Label>
            <Input 
              value={productForm.barcode || ""} 
              onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
              disabled={modalMode === "view" || modalMode === "edit"}
              className={`font-mono ${modalMode !== "add" ? "bg-muted/50" : ""}`}
              placeholder="Auto-generated from SKU"
            />
            <p className="text-xs text-muted-foreground">Optional manual override available</p>
          </div>
          <div className="space-y-2">
            <Label>Category <span className="text-destructive">*</span></Label>
            <Select value={productForm.category} onValueChange={(v) => setProductForm({ ...productForm, category: v })} disabled={modalMode === "view"}>
              <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="none" disabled>No categories available</SelectItem>
                ) : (
                  categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                )}
              </SelectContent>
            </Select>
            {formErrors.category ? (
              <p className="text-xs text-destructive">{formErrors.category}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Categories are managed in Category Master</p>
            )}
          </div>
        </div>
      </div>

      {/* Measurement Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Ruler className="w-4 h-4 text-primary" />
          Measurement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Unit of Measure <span className="text-destructive">*</span></Label>
            <Select value={productForm.uom} onValueChange={(v) => setProductForm({ ...productForm, uom: v })} disabled={modalMode === "view"}>
              <SelectTrigger className={formErrors.uom ? "border-destructive" : ""}>
                <SelectValue placeholder="Select UOM" />
              </SelectTrigger>
              <SelectContent>
                {uoms.length === 0 ? (
                  <SelectItem value="none" disabled>No UOM available</SelectItem>
                ) : (
                  uoms.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.shortCode})</SelectItem>)
                )}
              </SelectContent>
            </Select>
            {formErrors.uom ? (
              <p className="text-xs text-destructive">{formErrors.uom}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Units are managed in UOM Master</p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Pricing & Tax
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Default Selling Price <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input 
                type="number" 
                value={productForm.sellingPrice || ""} 
                onChange={(e) => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) })} 
                disabled={modalMode === "view"}
                className={`pl-7 ${formErrors.sellingPrice ? "border-destructive" : ""}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            {formErrors.sellingPrice && <p className="text-xs text-destructive">{formErrors.sellingPrice}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tax Category <span className="text-destructive">*</span></Label>
            <Select value={productForm.taxCategory} onValueChange={(v) => setProductForm({ ...productForm, taxCategory: v })} disabled={modalMode === "view"}>
              <SelectTrigger className={formErrors.taxCategory ? "border-destructive" : ""}>
                <SelectValue placeholder="Select tax category" />
              </SelectTrigger>
              <SelectContent>
                {taxSettings.length === 0 ? (
                  <SelectItem value="none" disabled>No tax settings available</SelectItem>
                ) : (
                  taxSettings.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.percentage}%)</SelectItem>)
                )}
              </SelectContent>
            </Select>
            {formErrors.taxCategory ? (
              <p className="text-xs text-destructive">{formErrors.taxCategory}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Tax categories are managed in Tax & Price Settings</p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Behavior Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Inventory Behavior Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Track Inventory</Label>
              <p className="text-xs text-muted-foreground">Enable stock tracking for this product</p>
            </div>
            <Switch 
              checked={productForm.trackInventory || false} 
              onCheckedChange={(v) => setProductForm({ ...productForm, trackInventory: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Allow Discount</Label>
              <p className="text-xs text-muted-foreground">Enable discounts on this product</p>
            </div>
            <Switch 
              checked={productForm.allowDiscount || false} 
              onCheckedChange={(v) => setProductForm({ ...productForm, allowDiscount: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Serial / Batch Tracking</Label>
              <p className="text-xs text-muted-foreground">Track individual units or batches</p>
            </div>
            <Switch 
              checked={productForm.serialBatchTracking || false} 
              onCheckedChange={(v) => setProductForm({ ...productForm, serialBatchTracking: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Expiry Date Tracking</Label>
              <p className="text-xs text-muted-foreground">Track expiration dates for perishables</p>
            </div>
            <Switch 
              checked={productForm.expiryTracking || false} 
              onCheckedChange={(v) => setProductForm({ ...productForm, expiryTracking: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div>
          <Label className="font-medium">Status</Label>
          <p className="text-xs text-muted-foreground">Set product as active or inactive</p>
        </div>
        <Select value={productForm.status} onValueChange={(v) => setProductForm({ ...productForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render Category Form - Hierarchical Category Master with tree support
  const renderCategoryForm = () => (
    <div className="space-y-6">
      {/* System Generated Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category ID</Label>
            <Input 
              value={categoryForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="CAT-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated unique identifier</p>
          </div>
          {modalMode !== "add" && (
            <>
              <div className="space-y-2">
                <Label>Created At</Label>
                <Input 
                  value={categoryForm.createdAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input 
                  value={categoryForm.updatedAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Basic Info Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-primary" />
          Category Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category Name <span className="text-destructive">*</span></Label>
            <Input 
              value={categoryForm.name || ""} 
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="Enter unique category name"
            />
            <p className="text-xs text-muted-foreground">Must be unique across all categories</p>
          </div>
          <div className="space-y-2">
            <Label>Category Type <span className="text-destructive">*</span></Label>
            <Select value={categoryForm.type} onValueChange={(v) => setCategoryForm({ ...categoryForm, type: v as "Physical" | "Service" })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Physical">
                  <div className="flex flex-col">
                    <span>Physical</span>
                    <span className="text-xs text-muted-foreground">Tangible inventory items</span>
                  </div>
                </SelectItem>
                <SelectItem value="Service">
                  <div className="flex flex-col">
                    <span>Service</span>
                    <span className="text-xs text-muted-foreground">Non-physical service items</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Determines inventory tracking behavior</p>
          </div>
          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select value={categoryForm.parentCategory} onValueChange={(v) => setCategoryForm({ ...categoryForm, parentCategory: v })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select parent category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4" />
                    <span>None (Root Category)</span>
                  </div>
                </SelectItem>
                {categories.filter(c => c.id !== categoryForm.id).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">└</span>
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Leave empty to create root-level category</p>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Additional Information
        </h3>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea 
            value={categoryForm.description || ""} 
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} 
            disabled={modalMode === "view"}
            placeholder="Enter detailed category description for reference..."
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">Optional description for internal reference</p>
        </div>
      </div>

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Integration Information
        </h4>
        <p className="text-xs text-muted-foreground">
          This category can be linked to: <span className="text-foreground">Product Master</span>, <span className="text-foreground">Tax & Price Settings</span>, and <span className="text-foreground">Analytics modules</span>.
          {categoryForm.linkedProducts && categoryForm.linkedProducts > 0 && (
            <span className="text-amber-600 dark:text-amber-400 ml-2">
              ⚠ {categoryForm.linkedProducts} products linked - cannot be deleted
            </span>
          )}
        </p>
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div>
          <Label className="font-medium">Status</Label>
          <p className="text-xs text-muted-foreground">Active categories are available for product assignment</p>
        </div>
        <Select value={categoryForm.status} onValueChange={(v) => setCategoryForm({ ...categoryForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="Inactive">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render UOM Form - Unit of Measure Master with conversion support
  const renderUOMForm = () => (
    <div className="space-y-6">
      {/* System Generated Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>UOM ID</Label>
            <Input 
              value={uomForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="UOM-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated unique identifier</p>
          </div>
          {modalMode !== "add" && (
            <>
              <div className="space-y-2">
                <Label>Created At</Label>
                <Input 
                  value={uomForm.createdAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input 
                  value={uomForm.updatedAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Basic Info Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Ruler className="w-4 h-4 text-primary" />
          Unit Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>UOM Name <span className="text-destructive">*</span></Label>
            <Input 
              value={uomForm.name || ""} 
              onChange={(e) => setUomForm({ ...uomForm, name: e.target.value })} 
              disabled={modalMode === "view" || (modalMode === "edit" && uomForm.inUse)}
              placeholder="e.g., Kilogram, Piece, Box"
              className={modalMode === "edit" && uomForm.inUse ? "bg-muted/50" : ""}
            />
            <p className="text-xs text-muted-foreground">Full name of the unit of measure</p>
          </div>
          <div className="space-y-2">
            <Label>Short Code <span className="text-destructive">*</span></Label>
            <Input 
              value={uomForm.shortCode || ""} 
              onChange={(e) => setUomForm({ ...uomForm, shortCode: e.target.value.toUpperCase() })} 
              disabled={modalMode === "view" || (modalMode === "edit" && uomForm.inUse)}
              placeholder="e.g., KG, PCS, BOX"
              className={`uppercase ${modalMode === "edit" && uomForm.inUse ? "bg-muted/50" : ""}`}
              maxLength={5}
            />
            <p className="text-xs text-muted-foreground">System-friendly abbreviation (max 5 chars)</p>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Base Unit</Label>
              <p className="text-xs text-muted-foreground">Mark this as a base unit for conversions</p>
            </div>
            <Switch 
              checked={uomForm.isBaseUnit || false} 
              onCheckedChange={(v) => {
                setUomForm({ 
                  ...uomForm, 
                  isBaseUnit: v,
                  conversionFactor: v ? 1 : uomForm.conversionFactor,
                  baseUnit: v ? "" : uomForm.baseUnit
                });
              }} 
              disabled={modalMode === "view"} 
            />
          </div>
        </div>
      </div>

      {/* Conversion Settings Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Conversion Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Base Unit {!uomForm.isBaseUnit && <span className="text-destructive">*</span>}</Label>
            <Select 
              value={uomForm.baseUnit} 
              onValueChange={(v) => setUomForm({ ...uomForm, baseUnit: v })} 
              disabled={modalMode === "view" || uomForm.isBaseUnit}
            >
              <SelectTrigger className={uomForm.isBaseUnit ? "bg-muted/50" : ""}>
                <SelectValue placeholder={uomForm.isBaseUnit ? "N/A (This is base unit)" : "Select base unit"} />
              </SelectTrigger>
              <SelectContent>
                {uoms.filter(u => u.isBaseUnit && u.id !== uomForm.id).length === 0 ? (
                  <SelectItem value="none" disabled>No base units defined</SelectItem>
                ) : (
                  uoms.filter(u => u.isBaseUnit && u.id !== uomForm.id).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.shortCode})</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {uomForm.isBaseUnit ? "Base units don't need conversion reference" : "Reference unit for conversion"}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Conversion Factor {!uomForm.isBaseUnit && <span className="text-destructive">*</span>}</Label>
            <Input 
              type="number" 
              value={uomForm.isBaseUnit ? 1 : (uomForm.conversionFactor || "")} 
              onChange={(e) => setUomForm({ ...uomForm, conversionFactor: parseFloat(e.target.value) })} 
              disabled={modalMode === "view" || uomForm.isBaseUnit}
              placeholder="1.0"
              min="0.0001"
              step="0.0001"
              className={uomForm.isBaseUnit ? "bg-muted/50" : ""}
            />
            <p className="text-xs text-muted-foreground">
              {uomForm.isBaseUnit 
                ? "Base units always have factor of 1" 
                : "How many base units equal 1 of this unit"
              }
            </p>
          </div>
          {!uomForm.isBaseUnit && uomForm.conversionFactor && uomForm.baseUnit && (
            <div className="p-4 bg-muted/30 rounded-xl border border-dashed flex flex-col justify-center">
              <p className="text-sm font-medium text-primary">Conversion Preview</p>
              <p className="text-xs text-muted-foreground mt-1">
                1 {uomForm.shortCode || "[Unit]"} = {uomForm.conversionFactor} {uoms.find(u => u.id === uomForm.baseUnit)?.shortCode || "[Base]"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Warning */}
      {modalMode === "edit" && uomForm.inUse && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Limited Editing</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            This UOM is in use by products. Name and short code cannot be changed.
          </p>
        </div>
      )}

      {/* Multi-unit Compatibility Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          Multi-Unit Product Compatibility
        </h4>
        <p className="text-xs text-muted-foreground">
          Products can use multiple UOMs for sales vs. stock tracking. Ensure proper conversion factors for accurate inventory calculations.
        </p>
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div>
          <Label className="font-medium">Status</Label>
          <p className="text-xs text-muted-foreground">Active UOMs are available for product configuration</p>
        </div>
        <Select value={uomForm.status} onValueChange={(v) => setUomForm({ ...uomForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="Inactive">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render Location Form - Warehouse / Location Master with GPS integration
  const renderLocationForm = () => (
    <div className="space-y-6">
      {/* System Generated Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Location ID</Label>
            <Input 
              value={locationForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="LOC-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated unique identifier</p>
          </div>
          {modalMode !== "add" && (
            <>
              <div className="space-y-2">
                <Label>Created At</Label>
                <Input 
                  value={locationForm.createdAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input 
                  value={locationForm.updatedAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Basic Info Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-primary" />
          Location Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Warehouse / Location Name <span className="text-destructive">*</span></Label>
            <Input 
              value={locationForm.name || ""} 
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="Enter location name"
            />
            <p className="text-xs text-muted-foreground">Unique name for this storage location</p>
          </div>
          <div className="space-y-2">
            <Label>Type <span className="text-destructive">*</span></Label>
            <Select value={locationForm.type} onValueChange={(v) => setLocationForm({ ...locationForm, type: v as "Warehouse" | "Branch" | "Van" | "Store" })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Warehouse">
                  <div className="flex flex-col">
                    <span>Warehouse</span>
                    <span className="text-xs text-muted-foreground">Main storage facility</span>
                  </div>
                </SelectItem>
                <SelectItem value="Branch">
                  <div className="flex flex-col">
                    <span>Branch</span>
                    <span className="text-xs text-muted-foreground">Regional office with storage</span>
                  </div>
                </SelectItem>
                <SelectItem value="Van">
                  <div className="flex flex-col">
                    <span>Van</span>
                    <span className="text-xs text-muted-foreground">Mobile storage unit</span>
                  </div>
                </SelectItem>
                <SelectItem value="Store">
                  <div className="flex flex-col">
                    <span>Store</span>
                    <span className="text-xs text-muted-foreground">Retail point of sale</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Determines location behavior in transactions</p>
          </div>
          <div className="space-y-2">
            <Label>Max Storage Capacity</Label>
            <Input 
              type="number" 
              value={locationForm.maxCapacity || ""} 
              onChange={(e) => setLocationForm({ ...locationForm, maxCapacity: parseInt(e.target.value) })} 
              disabled={modalMode === "view"}
              placeholder="e.g., 10000"
              min="0"
            />
            <p className="text-xs text-muted-foreground">Maximum units this location can hold</p>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Address & Geo-Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Address</Label>
            <Textarea 
              value={locationForm.address || ""} 
              onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="Enter complete address including city, state, and PIN code..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">Optional physical address for delivery and logistics</p>
          </div>
          <div className="space-y-2">
            <Label>GPS Coordinates</Label>
            <Input 
              value={locationForm.geoCoordinates || ""} 
              onChange={(e) => setLocationForm({ ...locationForm, geoCoordinates: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="e.g., 12.9716° N, 77.5946° E"
            />
            <p className="text-xs text-muted-foreground">Latitude, Longitude for GPS tracking</p>
          </div>
        </div>
      </div>

      {/* Capacity Indicator */}
      {locationForm.maxCapacity && locationForm.currentUtilization !== undefined && (
        <div className="p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Utilization</span>
            <span className="text-sm text-muted-foreground">
              {locationForm.currentUtilization} / {locationForm.maxCapacity} units
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                (locationForm.currentUtilization / locationForm.maxCapacity) > 0.9 
                  ? 'bg-red-500' 
                  : (locationForm.currentUtilization / locationForm.maxCapacity) > 0.7 
                    ? 'bg-amber-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((locationForm.currentUtilization / locationForm.maxCapacity) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round((locationForm.currentUtilization / locationForm.maxCapacity) * 100)}% capacity used
          </p>
        </div>
      )}

      {/* GPS & Security Settings Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          GPS & Security Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">GPS Enabled</Label>
              <p className="text-xs text-muted-foreground">Enable GPS tracking for this location</p>
            </div>
            <Switch 
              checked={locationForm.gpsEnabled || false} 
              onCheckedChange={(v) => setLocationForm({ ...locationForm, gpsEnabled: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Geo-Fencing Enabled</Label>
              <p className="text-xs text-muted-foreground">Define virtual boundary for alerts</p>
            </div>
            <Switch 
              checked={locationForm.geoFenceEnabled || false} 
              onCheckedChange={(v) => setLocationForm({ ...locationForm, geoFenceEnabled: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Transaction GPS Mandatory</Label>
              <p className="text-xs text-muted-foreground">Require GPS for all transactions</p>
            </div>
            <Switch 
              checked={locationForm.gpsRequired || false} 
              onCheckedChange={(v) => setLocationForm({ ...locationForm, gpsRequired: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Integration & Linking
        </h4>
        <p className="text-xs text-muted-foreground">
          This location can be linked to: <span className="text-foreground">Employees</span>, <span className="text-foreground">POS Systems</span>, <span className="text-foreground">Vendors</span>, and <span className="text-foreground">Opening Stock</span>.
          Supports location-wise inventory tracking and reporting.
        </p>
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div>
          <Label className="font-medium">Status</Label>
          <p className="text-xs text-muted-foreground">Active locations appear in inventory transactions</p>
        </div>
        <Select value={locationForm.status} onValueChange={(v) => setLocationForm({ ...locationForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="Inactive">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render Vendor Form - Distributor, Dealer, Reseller Master
  const renderVendorForm = () => (
    <div className="space-y-6">
      {/* System Generated Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Vendor ID</Label>
            <Input 
              value={vendorForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="VND-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated unique identifier</p>
          </div>
          {modalMode !== "add" && (
            <>
              <div className="space-y-2">
                <Label>Created At</Label>
                <Input 
                  value={vendorForm.createdAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input 
                  value={vendorForm.updatedAt || new Date().toISOString().split('T')[0]} 
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Basic Info Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Vendor Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Vendor Name <span className="text-destructive">*</span></Label>
            <Input 
              value={vendorForm.name || ""} 
              onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="Enter company or vendor name"
            />
            <p className="text-xs text-muted-foreground">Business or company name</p>
          </div>
          <div className="space-y-2">
            <Label>Vendor Type <span className="text-destructive">*</span></Label>
            <Select value={vendorForm.type} onValueChange={(v) => setVendorForm({ ...vendorForm, type: v as "Distributor" | "Dealer" | "Reseller" })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Distributor">
                  <div className="flex flex-col">
                    <span>Distributor</span>
                    <span className="text-xs text-muted-foreground">Primary wholesale vendor</span>
                  </div>
                </SelectItem>
                <SelectItem value="Dealer">
                  <div className="flex flex-col">
                    <span>Dealer</span>
                    <span className="text-xs text-muted-foreground">Authorized dealer vendor</span>
                  </div>
                </SelectItem>
                <SelectItem value="Reseller">
                  <div className="flex flex-col">
                    <span>Reseller</span>
                    <span className="text-xs text-muted-foreground">Retail resale vendor</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Determines pricing and credit terms</p>
          </div>
          <div className="space-y-2">
            <Label>Contact Person <span className="text-destructive">*</span></Label>
            <Input 
              value={vendorForm.contactPerson || ""} 
              onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="Primary contact name"
            />
            <p className="text-xs text-muted-foreground">Main point of contact</p>
          </div>
        </div>
      </div>

      {/* Contact Details Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Phone Number <span className="text-destructive">*</span></Label>
            <Input 
              value={vendorForm.phone || ""} 
              onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="+91 XXXXX XXXXX"
            />
            <p className="text-xs text-muted-foreground">Primary business phone</p>
          </div>
          <div className="space-y-2">
            <Label>Email Address <span className="text-destructive">*</span></Label>
            <Input 
              type="email" 
              value={vendorForm.email || ""} 
              onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="vendor@company.com"
            />
            <p className="text-xs text-muted-foreground">Business email for communications</p>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input 
              value={vendorForm.address || ""} 
              onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="Business address"
            />
            <p className="text-xs text-muted-foreground">Optional business location</p>
          </div>
        </div>
      </div>

      {/* Financial Details Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Financial & Credit Terms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>GST / Tax ID</Label>
            <Input 
              value={vendorForm.gstId || ""} 
              onChange={(e) => setVendorForm({ ...vendorForm, gstId: e.target.value.toUpperCase() })} 
              disabled={modalMode === "view"}
              placeholder="e.g., 29AABCT1234F1ZV"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">GSTIN for tax compliance</p>
          </div>
          <div className="space-y-2">
            <Label>Credit Limit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input 
                type="number" 
                value={vendorForm.creditLimit || ""} 
                onChange={(e) => setVendorForm({ ...vendorForm, creditLimit: parseFloat(e.target.value) })} 
                disabled={modalMode === "view"}
                className="pl-7"
                placeholder="0.00"
                min="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">Maximum outstanding credit allowed</p>
          </div>
          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Select 
              value={vendorForm.paymentTerms?.toString()} 
              onValueChange={(v) => setVendorForm({ ...vendorForm, paymentTerms: parseInt(v) })} 
              disabled={modalMode === "view"}
            >
              <SelectTrigger><SelectValue placeholder="Select payment terms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Immediate (0 days)</SelectItem>
                <SelectItem value="7">Net 7 days</SelectItem>
                <SelectItem value="15">Net 15 days</SelectItem>
                <SelectItem value="30">Net 30 days</SelectItem>
                <SelectItem value="45">Net 45 days</SelectItem>
                <SelectItem value="60">Net 60 days</SelectItem>
                <SelectItem value="90">Net 90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Invoice payment due period</p>
          </div>
        </div>
      </div>

      {/* Warehouse Assignment Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Warehouse Assignment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Linked Warehouse</Label>
            <Select value={vendorForm.linkedWarehouse} onValueChange={(v) => setVendorForm({ ...vendorForm, linkedWarehouse: v })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">None (No warehouse assigned)</span>
                </SelectItem>
                {locations.filter(l => l.type === "Warehouse" && l.status === "Active").length === 0 ? (
                  <SelectItem value="no-warehouses" disabled>No active warehouses available</SelectItem>
                ) : (
                  locations.filter(l => l.type === "Warehouse" && l.status === "Active").map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-3 h-3" />
                        {l.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Primary warehouse for inventory allocation</p>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          System Integration
        </h4>
        <p className="text-xs text-muted-foreground">
          Vendors integrate with: <span className="text-foreground">Billing & Invoicing</span>, <span className="text-foreground">Inventory Allocation</span>, <span className="text-foreground">Sales Reports</span>, and <span className="text-foreground">Analytics</span>.
          Vendor-specific pricing and credit terms will apply to all transactions.
        </p>
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div>
          <Label className="font-medium">Vendor Status</Label>
          <p className="text-xs text-muted-foreground">Active vendors can be assigned to transactions and orders</p>
        </div>
        <Select value={vendorForm.status} onValueChange={(v) => setVendorForm({ ...vendorForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="Inactive">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render Tax Form - Enhanced with all required fields
  const renderTaxForm = () => (
    <div className="space-y-6">
      {/* System Information Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tax Code ID</Label>
            <Input 
              value={taxForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="TAX-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated unique identifier</p>
          </div>
          <div className="space-y-2">
            <Label>Tax Code <span className="text-destructive">*</span></Label>
            <Input 
              value={taxForm.code || ""} 
              onChange={(e) => setTaxForm({ ...taxForm, code: e.target.value.toUpperCase() })} 
              disabled={modalMode === "view"}
              placeholder="e.g., GST18, SGST9"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">Short code for quick reference</p>
          </div>
          <div className="space-y-2">
            <Label>Tax Name <span className="text-destructive">*</span></Label>
            <Input 
              value={taxForm.name || ""} 
              onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="e.g., GST 18%, CGST 9%"
            />
            <p className="text-xs text-muted-foreground">Descriptive name for this tax</p>
          </div>
        </div>
      </div>

      {/* Tax Rate Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          Tax Rate & Application
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tax Rate (%) <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input 
                type="number" 
                value={taxForm.percentage || ""} 
                onChange={(e) => setTaxForm({ ...taxForm, percentage: parseFloat(e.target.value) })} 
                disabled={modalMode === "view"}
                placeholder="0.00"
                className="pr-8"
                min="0"
                max="100"
                step="0.01"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Percentage rate for this tax</p>
          </div>
          <div className="space-y-2">
            <Label>Applicability Level <span className="text-destructive">*</span></Label>
            <Select value={taxForm.applyOn} onValueChange={(v) => setTaxForm({ ...taxForm, applyOn: v as "Product" | "Category" })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Product">
                  <div className="flex flex-col">
                    <span>Product Level</span>
                    <span className="text-xs text-muted-foreground">Apply to individual products</span>
                  </div>
                </SelectItem>
                <SelectItem value="Category">
                  <div className="flex flex-col">
                    <span>Category Level</span>
                    <span className="text-xs text-muted-foreground">Apply to entire category</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Where this tax applies</p>
          </div>
          <div className="space-y-2">
            <Label>Pricing Type <span className="text-destructive">*</span></Label>
            <Select value={taxForm.priceType} onValueChange={(v) => setTaxForm({ ...taxForm, priceType: v as "Inclusive" | "Exclusive" })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Inclusive">
                  <div className="flex flex-col">
                    <span>Inclusive</span>
                    <span className="text-xs text-muted-foreground">Tax included in price</span>
                  </div>
                </SelectItem>
                <SelectItem value="Exclusive">
                  <div className="flex flex-col">
                    <span>Exclusive</span>
                    <span className="text-xs text-muted-foreground">Tax added to price</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How tax is calculated with price</p>
          </div>
        </div>
      </div>

      {/* Rounding & Validity Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Rounding & Validity Period
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Rounding Rule</Label>
            <Select value={taxForm.roundingRule || "Round"} onValueChange={(v) => setTaxForm({ ...taxForm, roundingRule: v })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select rule" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Round">Round (Nearest)</SelectItem>
                <SelectItem value="Round Up">Round Up (Ceiling)</SelectItem>
                <SelectItem value="Round Down">Round Down (Floor)</SelectItem>
                <SelectItem value="No Rounding">No Rounding</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How to handle decimal values</p>
          </div>
          <div className="space-y-2">
            <Label>Effective From <span className="text-destructive">*</span></Label>
            <Input 
              type="date" 
              value={taxForm.effectiveFrom || ""} 
              onChange={(e) => setTaxForm({ ...taxForm, effectiveFrom: e.target.value })} 
              disabled={modalMode === "view"}
            />
            <p className="text-xs text-muted-foreground">Start date for this tax rule</p>
          </div>
          <div className="space-y-2">
            <Label>Effective To</Label>
            <Input 
              type="date" 
              value={taxForm.effectiveTo || ""} 
              onChange={(e) => setTaxForm({ ...taxForm, effectiveTo: e.target.value })} 
              disabled={modalMode === "view"}
            />
            <p className="text-xs text-muted-foreground">Leave empty for indefinite</p>
          </div>
        </div>
      </div>

      {/* Tax Calculation Preview */}
      {taxForm.percentage && (
        <div className="p-4 bg-muted/30 rounded-xl border">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            Tax Calculation Preview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-background rounded-lg">
              <span className="text-muted-foreground">If Base Price is ₹100:</span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Tax Amount:</span>
                  <span className="font-mono font-medium">₹{taxForm.percentage?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total ({taxForm.priceType === "Inclusive" ? "incl." : "excl."}):</span>
                  <span className="font-mono font-medium text-primary">
                    ₹{taxForm.priceType === "Inclusive" ? "100.00" : (100 + (taxForm.percentage || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <span className="text-muted-foreground">If Base Price is ₹1000:</span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Tax Amount:</span>
                  <span className="font-mono font-medium">₹{((taxForm.percentage || 0) * 10).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total ({taxForm.priceType === "Inclusive" ? "incl." : "excl."}):</span>
                  <span className="font-mono font-medium text-primary">
                    ₹{taxForm.priceType === "Inclusive" ? "1000.00" : (1000 + ((taxForm.percentage || 0) * 10)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          System Integration
        </h4>
        <p className="text-xs text-muted-foreground">
          This tax setting integrates with: <span className="text-foreground">Product Master</span>, <span className="text-foreground">Billing & Invoicing</span>, and <span className="text-foreground">POS</span>.
          Changes to tax rules will affect all linked products and future invoices.
        </p>
      </div>

      {/* Status Section */}
      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div>
          <Label className="font-medium">Tax Status</Label>
          <p className="text-xs text-muted-foreground">Active tax rules apply to new transactions</p>
        </div>
        <Select value={taxForm.status} onValueChange={(v) => setTaxForm({ ...taxForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="Inactive">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render Opening Stock Form - Enhanced with audit safety and linking
  const renderOpeningStockForm = () => (
    <div className="space-y-6">
      {/* System Information Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Opening Stock ID</Label>
            <Input 
              value={stockForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="OS-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated unique identifier</p>
          </div>
          <div className="space-y-2">
            <Label>Stock Date <span className="text-destructive">*</span></Label>
            <Input 
              type="date" 
              value={stockForm.stockDate || ""} 
              onChange={(e) => setStockForm({ ...stockForm, stockDate: e.target.value })} 
              disabled={modalMode === "view" || stockForm.locked}
            />
            <p className="text-xs text-muted-foreground">Date of opening stock entry</p>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Entry Locked</Label>
              <p className="text-xs text-muted-foreground">Locked for audit safety</p>
            </div>
            <Switch 
              checked={stockForm.locked || false} 
              onCheckedChange={(v) => setStockForm({ ...stockForm, locked: v })} 
              disabled={modalMode === "view" || (modalMode === "edit" && stockForm.locked)} 
            />
          </div>
        </div>
      </div>

      {stockForm.locked && modalMode === "edit" && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Entry Locked</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            This opening stock entry is locked for audit safety and cannot be modified.
          </p>
        </div>
      )}

      {/* Product & Location Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Product & Location Selection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Product <span className="text-destructive">*</span></Label>
            <Select 
              value={stockForm.product} 
              onValueChange={(v) => setStockForm({ ...stockForm, product: v })} 
              disabled={modalMode === "view" || stockForm.locked}
            >
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.filter(p => p.status === "Active" && p.trackInventory).length === 0 ? (
                  <SelectItem value="none" disabled>No inventory-tracked products available</SelectItem>
                ) : (
                  products.filter(p => p.status === "Active" && p.trackInventory).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.sku}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only inventory-tracked products shown</p>
          </div>
          <div className="space-y-2">
            <Label>Location <span className="text-destructive">*</span></Label>
            <Select 
              value={stockForm.location} 
              onValueChange={(v) => setStockForm({ ...stockForm, location: v })} 
              disabled={modalMode === "view" || stockForm.locked}
            >
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {locations.filter(l => l.status === "Active").length === 0 ? (
                  <SelectItem value="none" disabled>No active locations available</SelectItem>
                ) : (
                  locations.filter(l => l.status === "Active").map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-3 h-3" />
                        <span>{l.name}</span>
                        <span className="text-xs text-muted-foreground">({l.type})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Warehouse or storage location</p>
          </div>
          <div className="space-y-2">
            <Label>Batch / Serial Number</Label>
            <Input 
              value={stockForm.batchSerial || ""} 
              onChange={(e) => setStockForm({ ...stockForm, batchSerial: e.target.value })} 
              disabled={modalMode === "view" || stockForm.locked}
              placeholder="Optional - for batch tracking"
            />
            <p className="text-xs text-muted-foreground">Required if product has batch tracking</p>
          </div>
        </div>
      </div>

      {/* Stock Quantity & Value Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Quantity & Valuation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Opening Quantity <span className="text-destructive">*</span></Label>
            <Input 
              type="number" 
              value={stockForm.quantity || ""} 
              onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) })} 
              disabled={modalMode === "view" || stockForm.locked}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">Initial stock quantity</p>
          </div>
          <div className="space-y-2">
            <Label>Purchase Rate <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input 
                type="number" 
                value={stockForm.purchaseRate || ""} 
                onChange={(e) => setStockForm({ ...stockForm, purchaseRate: parseFloat(e.target.value) })} 
                disabled={modalMode === "view" || stockForm.locked}
                className="pl-7"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">Cost per unit</p>
          </div>
          <div className="space-y-2">
            <Label>Total Stock Value</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input 
                type="text" 
                value={((stockForm.quantity || 0) * (stockForm.purchaseRate || 0)).toFixed(2)} 
                disabled 
                className="pl-7 bg-muted/50 font-mono font-medium text-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">Auto-calculated (Qty × Rate)</p>
          </div>
        </div>

        {/* Value Summary */}
        {stockForm.quantity && stockForm.purchaseRate && (
          <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Stock Value Summary</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {stockForm.quantity} units × ₹{stockForm.purchaseRate?.toFixed(2)} per unit
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">
                  ₹{((stockForm.quantity || 0) * (stockForm.purchaseRate || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Remarks Section */}
      <div className="space-y-2">
        <Label>Remarks / Notes</Label>
        <Textarea 
          value={stockForm.remarks || ""} 
          onChange={(e) => setStockForm({ ...stockForm, remarks: e.target.value })} 
          disabled={modalMode === "view" || stockForm.locked}
          placeholder="Add any notes about this opening stock entry (e.g., source, verification status)"
          className="min-h-[80px]"
        />
        <p className="text-xs text-muted-foreground">Optional notes for reference</p>
      </div>

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Integration & Audit
        </h4>
        <p className="text-xs text-muted-foreground">
          Opening stock integrates with: <span className="text-foreground">Inventory & Stock Master</span>, <span className="text-foreground">Billing & Invoicing</span>.
          Once locked, entries cannot be modified to ensure audit compliance. Use stock adjustments for corrections.
        </p>
      </div>
    </div>
  );

  // Render Min Stock Rule Form - Enhanced with alert triggers and notifications
  const renderMinStockRuleForm = () => (
    <div className="space-y-6">
      {/* System Information Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          Rule Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Rule ID</Label>
            <Input 
              value={ruleForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="MSR-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated unique identifier</p>
          </div>
          <div className="space-y-2">
            <Label>Product <span className="text-destructive">*</span></Label>
            <Select value={ruleForm.product} onValueChange={(v) => setRuleForm({ ...ruleForm, product: v })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.filter(p => p.status === "Active" && p.trackInventory).length === 0 ? (
                  <SelectItem value="none" disabled>No inventory-tracked products available</SelectItem>
                ) : (
                  products.filter(p => p.status === "Active" && p.trackInventory).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.sku}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Product to monitor</p>
          </div>
          <div className="space-y-2">
            <Label>Location <span className="text-destructive">*</span></Label>
            <Select value={ruleForm.location} onValueChange={(v) => setRuleForm({ ...ruleForm, location: v })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {locations.filter(l => l.status === "Active").length === 0 ? (
                  <SelectItem value="none" disabled>No active locations available</SelectItem>
                ) : (
                  locations.filter(l => l.status === "Active").map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-3 h-3" />
                        <span>{l.name}</span>
                        <span className="text-xs text-muted-foreground">({l.type})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Location to monitor</p>
          </div>
        </div>
      </div>

      {/* Quantity Thresholds Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Stock Thresholds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Minimum Stock <span className="text-destructive">*</span></Label>
            <Input 
              type="number" 
              value={ruleForm.minQuantity || ""} 
              onChange={(e) => setRuleForm({ ...ruleForm, minQuantity: parseInt(e.target.value) })} 
              disabled={modalMode === "view"}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">Low stock alert</span> when below this level
            </p>
          </div>
          <div className="space-y-2">
            <Label>Maximum Stock</Label>
            <Input 
              type="number" 
              value={ruleForm.maxQuantity || ""} 
              onChange={(e) => setRuleForm({ ...ruleForm, maxQuantity: parseInt(e.target.value) })} 
              disabled={modalMode === "view"}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-500">High stock alert</span> when above this level
            </p>
          </div>
          <div className="space-y-2">
            <Label>Reorder Quantity <span className="text-destructive">*</span></Label>
            <Input 
              type="number" 
              value={ruleForm.reorderQuantity || ""} 
              onChange={(e) => setRuleForm({ ...ruleForm, reorderQuantity: parseInt(e.target.value) })} 
              disabled={modalMode === "view"}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">Suggested quantity to reorder</p>
          </div>
        </div>

        {/* Threshold Visualization */}
        {(ruleForm.minQuantity || ruleForm.maxQuantity) && (
          <div className="mt-4 p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-500" />
                <span>Low: {ruleForm.minQuantity || 0}</span>
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-red-500 via-green-500 to-amber-500 rounded" />
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>High: {ruleForm.maxQuantity || '∞'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert & Notification Settings */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Alert & Notification Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Notification Channel <span className="text-destructive">*</span></Label>
            <Select value={ruleForm.alertChannel} onValueChange={(v) => setRuleForm({ ...ruleForm, alertChannel: v as "App" | "Email" | "Both" })} disabled={modalMode === "view"}>
              <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="App">
                  <div className="flex flex-col">
                    <span>App Notification</span>
                    <span className="text-xs text-muted-foreground">In-app alerts only</span>
                  </div>
                </SelectItem>
                <SelectItem value="Email">
                  <div className="flex flex-col">
                    <span>Email</span>
                    <span className="text-xs text-muted-foreground">Email notifications only</span>
                  </div>
                </SelectItem>
                <SelectItem value="Both">
                  <div className="flex flex-col">
                    <span>Both (App + Email)</span>
                    <span className="text-xs text-muted-foreground">Recommended for critical items</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How to send alerts</p>
          </div>
          <div className="col-span-2 flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Rule Status</Label>
              <p className="text-xs text-muted-foreground">Active rules monitor stock levels continuously</p>
            </div>
            <Select value={ruleForm.status} onValueChange={(v) => setRuleForm({ ...ruleForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="Inactive">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          Alert Behavior
        </h4>
        <p className="text-xs text-muted-foreground">
          When stock falls below minimum or exceeds maximum thresholds, alerts are triggered based on the selected notification channel.
          This rule integrates with: <span className="text-foreground">Inventory Dashboard</span>, <span className="text-foreground">Analytics</span>, and <span className="text-foreground">Purchase Order</span> suggestions.
        </p>
      </div>
    </div>
  );

  // Render Billing Configuration Form
  const renderBillingForm = () => (
    <div className="space-y-6">
      {/* System Information Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Config ID</Label>
            <Input 
              value={billingForm.id || ""} 
              disabled
              className="bg-muted/50 font-mono text-sm"
              placeholder="BIL-XXXXX (Auto-generated)"
            />
            <p className="text-xs text-muted-foreground">System-generated identifier</p>
          </div>
          <div className="space-y-2">
            <Label>Created On</Label>
            <Input 
              value={billingForm.createdAt || ""} 
              disabled
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Last Updated</Label>
            <Input 
              value={billingForm.updatedAt || ""} 
              disabled
              className="bg-muted/50"
            />
          </div>
        </div>
      </div>

      {/* Invoice Configuration Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          Invoice Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Invoice Prefix <span className="text-destructive">*</span></Label>
            <Input 
              value={billingForm.invoicePrefix || ""} 
              onChange={(e) => setBillingForm({ ...billingForm, invoicePrefix: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="INV-"
            />
            <p className="text-xs text-muted-foreground">Prefix for invoice numbers</p>
          </div>
          <div className="space-y-2">
            <Label>Invoice Number Format <span className="text-destructive">*</span></Label>
            <Input 
              value={billingForm.invoiceFormat || ""} 
              onChange={(e) => setBillingForm({ ...billingForm, invoiceFormat: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="YYYY-MM-####"
            />
            <p className="text-xs text-muted-foreground">Pattern for invoice numbering</p>
          </div>
          <div className="space-y-2">
            <Label>Financial Year <span className="text-destructive">*</span></Label>
            <Input 
              value={billingForm.financialYear || ""} 
              onChange={(e) => setBillingForm({ ...billingForm, financialYear: e.target.value })} 
              disabled={modalMode === "view"}
              placeholder="2024-25"
            />
            <p className="text-xs text-muted-foreground">Current financial year</p>
          </div>
        </div>
      </div>

      {/* Invoice Type & Payment Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Invoice Type & Payment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Invoice Type (GST / Non-GST)</Label>
            <Select 
              value={billingForm.gstInvoiceType} 
              onValueChange={(v) => setBillingForm({ ...billingForm, gstInvoiceType: v as "Regular" | "Simplified" | "Export" | "Non-GST" })} 
              disabled={modalMode === "view"}
            >
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">
                  <div className="flex flex-col">
                    <span>Regular GST</span>
                    <span className="text-xs text-muted-foreground">Standard GST invoice</span>
                  </div>
                </SelectItem>
                <SelectItem value="Simplified">
                  <div className="flex flex-col">
                    <span>Simplified</span>
                    <span className="text-xs text-muted-foreground">Minimal invoice format</span>
                  </div>
                </SelectItem>
                <SelectItem value="Export">
                  <div className="flex flex-col">
                    <span>Export</span>
                    <span className="text-xs text-muted-foreground">For international sales</span>
                  </div>
                </SelectItem>
                <SelectItem value="Non-GST">
                  <div className="flex flex-col">
                    <span>Non-GST</span>
                    <span className="text-xs text-muted-foreground">No GST applicable</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Type of tax invoice</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Default Payment Modes</Label>
            <Input 
              value={billingForm.defaultPaymentModes?.join(", ") || ""} 
              onChange={(e) => setBillingForm({ ...billingForm, defaultPaymentModes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} 
              disabled={modalMode === "view"}
              placeholder="Cash, Card, UPI, Credit"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of payment modes</p>
          </div>
        </div>
      </div>

      {/* Control Fields Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Control Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Auto Invoice Generation</Label>
              <p className="text-xs text-muted-foreground">Generate invoices automatically</p>
            </div>
            <Switch 
              checked={billingForm.autoGeneration || false} 
              onCheckedChange={(v) => setBillingForm({ ...billingForm, autoGeneration: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Credit Sales Allowed</Label>
              <p className="text-xs text-muted-foreground">Allow sales on credit terms</p>
            </div>
            <Switch 
              checked={billingForm.creditSaleAllowed || false} 
              onCheckedChange={(v) => setBillingForm({ ...billingForm, creditSaleAllowed: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Returns & Refunds Enabled</Label>
              <p className="text-xs text-muted-foreground">Allow product returns and refunds</p>
            </div>
            <Switch 
              checked={billingForm.returnRefundEnabled || false} 
              onCheckedChange={(v) => setBillingForm({ ...billingForm, returnRefundEnabled: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Invoice Approval Required</Label>
              <p className="text-xs text-muted-foreground">Require approval before sending</p>
            </div>
            <Switch 
              checked={billingForm.approvalRequired || false} 
              onCheckedChange={(v) => setBillingForm({ ...billingForm, approvalRequired: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Multi-Currency Support</Label>
              <p className="text-xs text-muted-foreground">Enable multiple currencies</p>
            </div>
            <Switch 
              checked={billingForm.multiCurrency || false} 
              onCheckedChange={(v) => setBillingForm({ ...billingForm, multiCurrency: v })} 
              disabled={modalMode === "view"} 
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Configuration Status</Label>
              <p className="text-xs text-muted-foreground">Active configs are used for billing</p>
            </div>
            <Select value={billingForm.status} onValueChange={(v) => setBillingForm({ ...billingForm, status: v as "Active" | "Inactive" })} disabled={modalMode === "view"}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="Inactive">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      {billingForm.invoicePrefix && billingForm.invoiceFormat && (
        <div className="p-4 bg-muted/30 rounded-xl border">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Invoice Number Preview
          </h4>
          <div className="p-3 bg-background rounded-lg">
            <span className="text-muted-foreground text-sm">Sample Invoice: </span>
            <span className="font-mono font-medium text-primary">
              {billingForm.invoicePrefix}{billingForm.invoiceFormat.replace("YYYY", "2024").replace("MM", "01").replace("####", "0001")}
            </span>
          </div>
        </div>
      )}

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Module Integration
        </h4>
        <p className="text-xs text-muted-foreground">
          This billing configuration integrates with: <span className="text-foreground">Product Master</span>, <span className="text-foreground">Vendor Setup</span>, and <span className="text-foreground">POS</span>.
          Active configurations are used for new invoice generation.
        </p>
      </div>
    </div>
  );



  // Render Inventory Settings - Enhanced with all required fields
  const renderInventorySettings = () => (
    <div className="glass-card p-6 rounded-xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Inventory & Stock Master Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure global inventory behavior and valuation rules</p>
        </div>
        <div className="text-xs text-muted-foreground">
          Config ID: <span className="font-mono text-foreground">CFG-INV-001</span>
        </div>
      </div>

      {/* Valuation Methods Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Inventory Valuation Methods
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Valuation Method <span className="text-destructive">*</span></Label>
            <Select value={inventorySettings.valuationMethod} onValueChange={(v) => setInventorySettings({ ...inventorySettings, valuationMethod: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FIFO">
                  <div className="flex flex-col">
                    <span>FIFO (First In, First Out)</span>
                    <span className="text-xs text-muted-foreground">Oldest stock sold first</span>
                  </div>
                </SelectItem>
                <SelectItem value="LIFO">
                  <div className="flex flex-col">
                    <span>LIFO (Last In, First Out)</span>
                    <span className="text-xs text-muted-foreground">Newest stock sold first</span>
                  </div>
                </SelectItem>
                <SelectItem value="Weighted Avg">
                  <div className="flex flex-col">
                    <span>Weighted Average</span>
                    <span className="text-xs text-muted-foreground">Average cost calculation</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Method for calculating inventory cost</p>
          </div>
          <div className="space-y-2">
            <Label>Damage / Loss Handling</Label>
            <Select value={inventorySettings.damageHandling} onValueChange={(v) => setInventorySettings({ ...inventorySettings, damageHandling: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Separate">
                  <div className="flex flex-col">
                    <span>Separate Location</span>
                    <span className="text-xs text-muted-foreground">Move to damage location</span>
                  </div>
                </SelectItem>
                <SelectItem value="Write-off">
                  <div className="flex flex-col">
                    <span>Immediate Write-off</span>
                    <span className="text-xs text-muted-foreground">Direct inventory deduction</span>
                  </div>
                </SelectItem>
                <SelectItem value="Pending">
                  <div className="flex flex-col">
                    <span>Pending Review</span>
                    <span className="text-xs text-muted-foreground">Queue for approval</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How damaged stock is processed</p>
          </div>
          <div className="space-y-2">
            <Label>Stock Freeze Cycle</Label>
            <Select value={inventorySettings.stockFreezePeriod} onValueChange={(v) => setInventorySettings({ ...inventorySettings, stockFreezePeriod: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="End of Day">End of Day</SelectItem>
                <SelectItem value="End of Week">End of Week</SelectItem>
                <SelectItem value="End of Month">End of Month</SelectItem>
                <SelectItem value="Custom">Custom Period</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Period for stock freeze / reconciliation</p>
          </div>
        </div>
      </div>

      {/* Control Fields Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Control Toggles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Allow Negative Stock</Label>
              <p className="text-xs text-muted-foreground">Permit stock to go below zero (not recommended)</p>
            </div>
            <Switch checked={inventorySettings.allowNegativeStock} onCheckedChange={(v) => setInventorySettings({ ...inventorySettings, allowNegativeStock: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Approval Workflow for Adjustments</Label>
              <p className="text-xs text-muted-foreground">Require manager approval for stock adjustments</p>
            </div>
            <Switch checked={inventorySettings.stockApprovalRequired} onCheckedChange={(v) => setInventorySettings({ ...inventorySettings, stockApprovalRequired: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Auto Stock Deduction on Billing</Label>
              <p className="text-xs text-muted-foreground">Automatically deduct stock when invoice is created</p>
            </div>
            <Switch checked={inventorySettings.autoStockDeduction} onCheckedChange={(v) => setInventorySettings({ ...inventorySettings, autoStockDeduction: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div>
              <Label className="font-medium">Audit Trail Enabled</Label>
              <p className="text-xs text-muted-foreground">Track all inventory changes with user and timestamp</p>
            </div>
            <Switch checked={inventorySettings.auditTrailEnabled} onCheckedChange={(v) => setInventorySettings({ ...inventorySettings, auditTrailEnabled: v })} />
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Module Integration
        </h4>
        <p className="text-xs text-muted-foreground">
          These settings apply globally across: <span className="text-foreground">Product Master</span>, <span className="text-foreground">Opening Stock</span>, <span className="text-foreground">Billing & Invoicing</span>, and <span className="text-foreground">POS</span>.
          Changes will affect all inventory operations immediately.
        </p>
      </div>

      <div className="flex justify-end pt-4 border-t gap-3">
        <Button variant="outline" onClick={() => toast.info("Settings reset to defaults")}>Reset to Defaults</Button>
        <Button onClick={() => toast.success("Inventory settings saved!")}>Save Settings</Button>
      </div>
    </div>
  );

  // Render Billing Settings
  const renderBillingSettings = () => (
    <div className="glass-card p-6 rounded-xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Billing & Invoicing Setup
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure invoice formats and payment settings</p>
        </div>
      </div>

      {/* Invoice Sequence Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          Invoice Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Invoice Sequence ID</Label>
            <Input 
              value="SEQ-INV-001" 
              disabled 
              className="bg-muted/50 font-mono"
            />
            <p className="text-xs text-muted-foreground">System-generated identifier</p>
          </div>
          <div className="space-y-2">
            <Label>Invoice Prefix <span className="text-destructive">*</span></Label>
            <Input value={billingSettings.invoicePrefix} onChange={(e) => setBillingSettings({ ...billingSettings, invoicePrefix: e.target.value })} placeholder="INV-" />
            <p className="text-xs text-muted-foreground">Prefix for invoice numbers</p>
          </div>
          <div className="space-y-2">
            <Label>Invoice Number Format <span className="text-destructive">*</span></Label>
            <Input value={billingSettings.invoiceFormat} onChange={(e) => setBillingSettings({ ...billingSettings, invoiceFormat: e.target.value })} placeholder="YYYY-MM-####" />
            <p className="text-xs text-muted-foreground">Pattern for invoice numbering</p>
          </div>
          <div className="space-y-2">
            <Label>Financial Year <span className="text-destructive">*</span></Label>
            <Input value={billingSettings.financialYear} onChange={(e) => setBillingSettings({ ...billingSettings, financialYear: e.target.value })} placeholder="2024-25" />
          </div>
          <div className="space-y-2">
            <Label>Invoice Type (GST / Non-GST)</Label>
            <Select value={billingSettings.gstInvoiceType} onValueChange={(v) => setBillingSettings({ ...billingSettings, gstInvoiceType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular GST</SelectItem>
                <SelectItem value="Simplified">Simplified</SelectItem>
                <SelectItem value="Export">Export</SelectItem>
                <SelectItem value="Non-GST">Non-GST</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default Payment Modes</Label>
            <Input value={billingSettings.defaultPaymentModes.join(", ")} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Cash, Card, UPI, etc.</p>
          </div>
        </div>
      </div>

      {/* Control Fields Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Control Fields
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Auto Invoice Generation</Label>
              <p className="text-xs text-muted-foreground">Generate invoices automatically</p>
            </div>
            <Switch checked={billingSettings.autoGeneration} onCheckedChange={(v) => setBillingSettings({ ...billingSettings, autoGeneration: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Credit Sales Allowed</Label>
              <p className="text-xs text-muted-foreground">Allow sales on credit terms</p>
            </div>
            <Switch checked={billingSettings.creditSaleAllowed} onCheckedChange={(v) => setBillingSettings({ ...billingSettings, creditSaleAllowed: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Returns Enabled</Label>
              <p className="text-xs text-muted-foreground">Allow product returns and refunds</p>
            </div>
            <Switch checked={billingSettings.returnRefundEnabled} onCheckedChange={(v) => setBillingSettings({ ...billingSettings, returnRefundEnabled: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Invoice Approval Required</Label>
              <p className="text-xs text-muted-foreground">Require approval before sending</p>
            </div>
            <Switch checked={billingSettings.approvalRequired} onCheckedChange={(v) => setBillingSettings({ ...billingSettings, approvalRequired: v })} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={() => toast.success("Billing settings saved!")}>Save Settings</Button>
      </div>
    </div>
  );

  // Render POS Dashboard
  const renderPOSDashboard = () => (
    <POSDashboard locations={locations} />
  );

  // Render Analytics Settings
  const renderAnalyticsSettings = () => (
    <div className="glass-card p-6 rounded-xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Analytics & Reporting Setup
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure reports and performance tracking</p>
        </div>
      </div>

      {/* System Info Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Analytics Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Analytics Configuration ID</Label>
            <Input 
              value="ANA-CFG-001" 
              disabled 
              className="bg-muted/50 font-mono"
            />
            <p className="text-xs text-muted-foreground">System-generated identifier</p>
          </div>
          <div className="space-y-2">
            <Label>Default Report Period</Label>
            <Select value={analyticsSettings.reportPeriod} onValueChange={(v) => setAnalyticsSettings({ ...analyticsSettings, reportPeriod: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data Retention Period</Label>
            <Select value={analyticsSettings.dataRetention} onValueChange={(v) => setAnalyticsSettings({ ...analyticsSettings, dataRetention: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6 Months">6 Months</SelectItem>
                <SelectItem value="12 Months">12 Months</SelectItem>
                <SelectItem value="24 Months">24 Months</SelectItem>
                <SelectItem value="Forever">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Thresholds Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          KPI Threshold Values
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Low Stock Threshold (%)</Label>
            <Input type="number" value={analyticsSettings.lowStockThreshold} onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, lowStockThreshold: parseInt(e.target.value) })} placeholder="10" />
            <p className="text-xs text-muted-foreground">Alert when stock falls below this %</p>
          </div>
          <div className="space-y-2">
            <Label>Dead Stock Days</Label>
            <Input type="number" value={analyticsSettings.deadStockDays} onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, deadStockDays: parseInt(e.target.value) })} placeholder="90" />
            <p className="text-xs text-muted-foreground">Days without movement</p>
          </div>
          <div className="space-y-2">
            <Label>Dashboard Widgets</Label>
            <Input value={analyticsSettings.dashboardWidgets.join(", ")} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Selected dashboard widgets</p>
          </div>
          <div className="space-y-2">
            <Label>Export Formats</Label>
            <Input value={analyticsSettings.exportFormats.join(", ")} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Available export options</p>
          </div>
        </div>
      </div>

      {/* Control Fields Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Control Fields
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Inventory Analytics Enabled</Label>
              <p className="text-xs text-muted-foreground">Track inventory metrics</p>
            </div>
            <Switch checked={analyticsSettings.inventoryAnalytics} onCheckedChange={(v) => setAnalyticsSettings({ ...analyticsSettings, inventoryAnalytics: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Sales Analytics Enabled</Label>
              <p className="text-xs text-muted-foreground">Track sales metrics</p>
            </div>
            <Switch checked={analyticsSettings.salesAnalytics} onCheckedChange={(v) => setAnalyticsSettings({ ...analyticsSettings, salesAnalytics: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Partner Performance Reports</Label>
              <p className="text-xs text-muted-foreground">Enable partner analytics</p>
            </div>
            <Switch checked={analyticsSettings.partnerPerformance} onCheckedChange={(v) => setAnalyticsSettings({ ...analyticsSettings, partnerPerformance: v })} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <Label className="font-medium">Auto Email Reports</Label>
              <p className="text-xs text-muted-foreground">Send reports automatically via email</p>
            </div>
            <Switch checked={analyticsSettings.autoReportEmail} onCheckedChange={(v) => setAnalyticsSettings({ ...analyticsSettings, autoReportEmail: v })} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={() => toast.success("Analytics settings saved!")}>Save Settings</Button>
      </div>
    </div>
  );

  const getModalTitle = () => {
    const currentModule = activeModule;
    const moduleLabels: Record<string, string> = {
      "product-master": "Product Master",
      "category-master": "Category Master",
      "uom": "Unit of Measure",
      "warehouse": "Warehouse / Location",
      "vendor-setup": "Vendor",
      "tax-price": "Tax Setting",
      "opening-stock": "Opening Stock",
      "min-stock": "Minimum Stock Rule",
      "billing": "Billing Config",
    };
    const action = modalMode === "add" ? "Add" : modalMode === "edit" ? "Edit" : "View";
    return `${action} ${moduleLabels[currentModule] || ""}`;
  };

  const renderForm = () => {
    const currentModule = activeModule;
    switch (currentModule) {
      case "product-master":
        return renderProductForm();
      case "category-master":
        return renderCategoryForm();
      case "uom":
        return renderUOMForm();
      case "warehouse":
        return renderLocationForm();
      case "vendor-setup":
        return renderVendorForm();
      case "tax-price":
        return renderTaxForm();
      case "opening-stock":
        return renderOpeningStockForm();
      case "min-stock":
        return renderMinStockRuleForm();
      case "billing":
        return renderBillingForm();
      default:
        return null;
    }
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case "product-master":
        return (
          <DataTable 
            data={products} 
            columns={productColumns} 
            searchPlaceholder="Search products..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "category-master":
        return (
          <DataTable 
            data={categories} 
            columns={categoryColumns} 
            searchPlaceholder="Search categories..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "uom":
        return (
          <DataTable 
            data={uoms} 
            columns={uomColumns} 
            searchPlaceholder="Search UOM..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "warehouse":
        return (
          <DataTable 
            data={locations} 
            columns={locationColumns} 
            searchPlaceholder="Search locations..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "vendor-setup":
        return (
          <DataTable 
            data={vendors} 
            columns={vendorColumns} 
            searchPlaceholder="Search vendors..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "tax-price":
        return (
          <DataTable 
            data={taxSettings} 
            columns={taxColumns} 
            searchPlaceholder="Search tax settings..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "billing":
        return (
          <DataTable 
            data={billingConfigs} 
            columns={billingColumns} 
            searchPlaceholder="Search billing configs..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "opening-stock":
        return (
          <DataTable 
            data={openingStocks} 
            columns={openingStockColumns} 
            searchPlaceholder="Search opening stock..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      case "min-stock":
        return (
          <DataTable 
            data={minStockRules} 
            columns={minStockColumns} 
            searchPlaceholder="Search stock rules..."
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showExport={canExport}
          />
        );
      default:
        return null;
    }
  };

  const isSettingsModule = ["inventory-master", "order-management", "dispatch-management", "payment-tracking"].includes(activeModule);

  let currentSubModules = subModulesData[activeSection] || [];
  if (rawRole.toLowerCase() === "employee" && activeSection === "product-setup") {
    currentSubModules = currentSubModules.filter(m => m.id === "product-master");
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Elegant Header with Section Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your products, stock levels, and billing settings in one place.
          </p>
        </div>
        
        {/* Section Switcher (Segmented Control) */}
        {filteredMainSections.length > 1 && (
          <div className="bg-muted/50 p-1 rounded-xl flex items-center border border-border/50 overflow-x-auto max-w-full">
            {filteredMainSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    let availableMods = subModulesData[section.id] || [];
                    if (rawRole.toLowerCase() === "employee" && section.id === "product-setup") {
                      availableMods = availableMods.filter(m => m.id === "product-master");
                    }
                    const firstMod = availableMods[0]?.id;
                    if (firstMod) setActiveModule(firstMod);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-background shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Sub Modules - Clean Underline Tabs */}
        {currentSubModules.length > 1 && (
          <div className="flex items-center gap-8 border-b border-border/50 px-2 overflow-x-auto">
            {currentSubModules.map((module) => {
              const isActive = activeModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <module.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {module.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <div className="mt-2">
        {currentSubModules.map((module) => (
          <div key={module.id} className={activeModule === module.id ? "block" : "hidden"}>
            {isSettingsModule ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 ease-out">
                {activeModule === "inventory-master" && renderInventorySettings()}
                {activeModule === "order-management" && <div className="p-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-primary/20 rounded-3xl glass-card bg-gradient-to-b from-background/50 to-muted/20">
                  <ShoppingCart className="w-16 h-16 mb-4 text-primary/40 opacity-50" />
                  <h3 className="text-xl font-bold text-foreground">Order Management</h3>
                  <p className="text-sm mt-2 max-w-sm text-center">Streamline your sales order process, track statuses, and fulfill customer requests seamlessly.</p>
                  <div className="mt-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase">Coming Soon</div>
                </div>}
                {activeModule === "dispatch-management" && <div className="p-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-primary/20 rounded-3xl glass-card bg-gradient-to-b from-background/50 to-muted/20">
                  <Truck className="w-16 h-16 mb-4 text-primary/40 opacity-50" />
                  <h3 className="text-xl font-bold text-foreground">Dispatch Management</h3>
                  <p className="text-sm mt-2 max-w-sm text-center">Manage shipments, assign vehicles, and track delivery status in real-time.</p>
                  <div className="mt-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase">Coming Soon</div>
                </div>}
                {activeModule === "payment-tracking" && <div className="p-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-primary/20 rounded-3xl glass-card bg-gradient-to-b from-background/50 to-muted/20">
                  <CreditCard className="w-16 h-16 mb-4 text-primary/40 opacity-50" />
                  <h3 className="text-xl font-bold text-foreground">Payment Tracking</h3>
                  <p className="text-sm mt-2 max-w-sm text-center">Monitor outstanding dues, record incoming payments, and integrate with payment gateways.</p>
                  <div className="mt-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase">Coming Soon</div>
                </div>}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                {/* Section Header */}
                <div className="flex items-end justify-between px-2 pb-4 border-b border-border/50">
                  <div className="space-y-1.5">
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{module.label}</h2>
                    <p className="text-[15px] text-muted-foreground font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                      {module.description}
                    </p>
                  </div>
                  {canCreate && !["inventory-master", "order-management", "dispatch-management", "payment-tracking"].includes(module.id) && (
                    <Button onClick={handleAdd} className="gap-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 rounded-xl px-5 h-11 bg-primary text-primary-foreground font-semibold">
                      <Plus className="w-4 h-4" />
                      Add {module.label.split(' ')[0]}
                    </Button>
                  )}
                </div>
                <div className="pt-2">
                  {renderModuleContent()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      </div>

      <GlassModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={getModalTitle()}
        size="lg"
      >
        <div className="space-y-6">
          {renderForm()}
          {modalMode !== "view" && (
            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl px-6">Cancel</Button>
              <Button onClick={handleSave} className="rounded-xl px-6 shadow-sm">
                {modalMode === "add" ? "Add Item" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </GlassModal>
    </div>
  );
}
