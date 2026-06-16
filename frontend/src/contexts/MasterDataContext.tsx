import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import {
  Employee,
  Role,
  Department,
  StatusMaster,
  Project,
  getRoleName,
  getDepartmentName,
  getStatusName,
  getEligibleOpsManagerEmployees,
  getAssignableEmployees,
} from "@/data/masterData";
import {
  Distributor,
  Territory,
  SalesExecutive,
  SalesTarget,
  DistributorLink,
  Meeting,
  Product,
  Category,
  UOM,
  Location,
  Vendor,
  TrackingEntry,
  Alert,
  RolePermission,
  ReportingManager,
  Lead,
  Customer,
  AttendanceEntry,
  GeoFenceAlert,
  LeaveBalance,
  PerformanceMetric,
  POSTerminal,
  POSAlert,
  EmployeeTask,
  Site,
} from "@/data/sharedTypes";

// Re-export types for convenience
export type { Employee, Role, Department, StatusMaster, Project };
export type {
  Distributor,
  Territory,
  SalesExecutive,
  SalesTarget,
  DistributorLink,
  Meeting,
  Product,
  Category,
  UOM,
  Location,
  Vendor,
  TrackingEntry,
  Alert,
  RolePermission,
  ReportingManager,
  Lead,
  Customer,
  AttendanceEntry,
  GeoFenceAlert,
  LeaveBalance,
  PerformanceMetric,
  POSTerminal,
  POSAlert,
  Site,
} from "@/data/sharedTypes";

// ============= INITIAL DATA =============

const initialDistributors: Distributor[] = [
  {
    id: "dist-1",
    distributorId: "DIST-001",
    firmName: "Agri Fresh Distributors",
    proprietorName: "Ramesh Sharma",
    mobileNumber: "9876543001",
    emailAddress: "ramesh@agrifresh.com",
    panProprietor: "ABCDE1234F",
    panFirm: "FGHIJ5678K",
    gstNumber: "22AAAAA0000A1Z5",
    dateOfBirth: "1975-05-15",
    marriageAnniversary: "2000-02-20",
    officeAddress: "123, Market Road, Indore",
    currentAddress: "45, Residency Area, Indore",
    permanentAddress: "45, Residency Area, Indore",
    district: "Indore",
    state: "Madhya Pradesh",
    pincode: "452001",
    typeOfFirm: "Sole Proprietor",
    distributorProfile: { wholesalerPercent: 60, retailerPercent: 40 },
    yearsOfEstablishment: 15,
    yearsOfExperience: 20,
    topCompaniesAssociated: [
      { companyName: "Tata Rallis", businessType: "Pesticides", turnoverYear1: 5000000, turnoverYear2: 5500000, turnoverYear3: 6000000 },
    ],
    pesticideLicenseNo: "PL-2023-001",
    seedLicenseNo: "SL-2023-001",
    fertiliserLicenseNo: "FL-2023-001",
    pesticideLicenseExpiry: "2025-12-31",
    seedLicenseExpiry: "2025-06-30",
    fertiliserLicenseExpiry: "2025-09-30",
    godownSpace: 5000,
    shopSpace: 1500,
    housePropertyOwned: true,
    computerAvailable: true,
    internetAvailable: true,
    deliveryVehicles: 3,
    salesmenAvailable: 5,
    bankName: "State Bank of India",
    accountNumber: "1234567890",
    accountType: "Current",
    bankLimitCC: 2500000,
    otherLoans: "None",
    totalFundsEmployed: 5000000,
    ownInvestment: 3000000,
    preferredTransporters: ["ABC Transport", "Quick Logistics"],
    depotLocation: "Indore Central Depot",
    attachedRetailersList: "R1, R2, R3, R4, R5",
    numberOfRetailers: 25,
    declarationAccepted: true,
    proprietorSignature: "",
    witnessDetails: { name: "Witness Name", address: "Witness Address", mobile: "9876543999" },
    submittedBy: { name: "Sunita Devi", signature: "" },
    forwardedBy: { name: "Amit Patel", signature: "" },
    approvedBy: { name: "Priya Sharma", signature: "" },
    governmentDocuments: [],
    activeStatus: true,
  },
  {
    id: "dist-2",
    distributorId: "DIST-002",
    firmName: "Green Valley Fertilizers",
    proprietorName: "Suresh Patel",
    mobileNumber: "9876543002",
    emailAddress: "suresh@greenvalley.com",
    panProprietor: "LMNOP1234Q",
    panFirm: "RSTUV5678W",
    gstNumber: "27BBBBB0000B2Z6",
    dateOfBirth: "1980-08-20",
    marriageAnniversary: "2005-11-15",
    officeAddress: "456, Industrial Area, Nashik",
    currentAddress: "78, Green Colony, Nashik",
    permanentAddress: "78, Green Colony, Nashik",
    district: "Nashik",
    state: "Maharashtra",
    pincode: "422001",
    typeOfFirm: "Partnership",
    distributorProfile: { wholesalerPercent: 70, retailerPercent: 30 },
    yearsOfEstablishment: 10,
    yearsOfExperience: 15,
    topCompaniesAssociated: [
      { companyName: "IFFCO", businessType: "Fertilizers", turnoverYear1: 8000000, turnoverYear2: 8500000, turnoverYear3: 9000000 },
    ],
    pesticideLicenseNo: "PL-2023-002",
    seedLicenseNo: "SL-2023-002",
    fertiliserLicenseNo: "FL-2023-002",
    pesticideLicenseExpiry: "2025-11-30",
    seedLicenseExpiry: "2025-05-31",
    fertiliserLicenseExpiry: "2025-08-31",
    godownSpace: 8000,
    shopSpace: 2000,
    housePropertyOwned: true,
    computerAvailable: true,
    internetAvailable: true,
    deliveryVehicles: 5,
    salesmenAvailable: 8,
    bankName: "HDFC Bank",
    accountNumber: "9876543210",
    accountType: "Current",
    bankLimitCC: 5000000,
    otherLoans: "Vehicle Loan - 500000",
    totalFundsEmployed: 10000000,
    ownInvestment: 6000000,
    preferredTransporters: ["Fast Track", "Safe Logistics"],
    depotLocation: "Nashik Main Depot",
    attachedRetailersList: "R6, R7, R8, R9, R10, R11, R12",
    numberOfRetailers: 40,
    declarationAccepted: true,
    proprietorSignature: "",
    witnessDetails: { name: "Witness 2", address: "Witness Address 2", mobile: "9876543888" },
    submittedBy: { name: "Karan Mehta", signature: "" },
    forwardedBy: { name: "Amit Patel", signature: "" },
    approvedBy: { name: "Priya Sharma", signature: "" },
    governmentDocuments: [],
    activeStatus: true,
  },
];

const initialTerritories: Territory[] = [
  { id: "t1", name: "North Zone - Delhi NCR", region: "North", district: "Delhi", assignedSalesExecutiveId: "4", linkedDistributorIds: ["dist-1"], coverageArea: "500 sq km", geoFencing: true, status: "Active" },
  { id: "t2", name: "West Zone - Maharashtra", region: "West", district: "Mumbai", assignedSalesExecutiveId: "4", linkedDistributorIds: ["dist-2"], coverageArea: "800 sq km", geoFencing: true, status: "Active" },
  { id: "t3", name: "South Zone - Karnataka", region: "South", district: "Bangalore", assignedSalesExecutiveId: "8", linkedDistributorIds: [], coverageArea: "600 sq km", geoFencing: false, status: "Active" },
  { id: "t4", name: "East Zone - West Bengal", region: "East", district: "Kolkata", assignedSalesExecutiveId: "", linkedDistributorIds: [], coverageArea: "450 sq km", geoFencing: false, status: "Inactive" },
];

const initialSalesExecutives: SalesExecutive[] = [
  { id: "se-1", employeeId: "3", fullName: "Amit Patel", role: "Territory Manager", department: "Sales", reportingManagerId: "2", phone: "9876543212", email: "amit@agriventures.com", gpsTracking: true, workMode: "Field", status: "Active", assignedTerritoryIds: ["t1", "t2"] },
  { id: "se-2", employeeId: "4", fullName: "Sunita Devi", role: "Sales Executive", department: "Sales", reportingManagerId: "3", phone: "9876543213", email: "sunita@agriventures.com", gpsTracking: true, workMode: "Field", status: "Active", assignedTerritoryIds: ["t1"] },
  { id: "se-3", employeeId: "8", fullName: "Karan Mehta", role: "Sales Executive", department: "Sales", reportingManagerId: "3", phone: "9876543217", email: "karan@agriventures.com", gpsTracking: true, workMode: "Hybrid", status: "Active", assignedTerritoryIds: ["t3"] },
];

const initialSalesTargets: SalesTarget[] = [
  { id: "st-1", employeeId: "4", territoryId: "t1", productCategory: "Fertiliser", targetValue: 500000, achievementValue: 350000, siteVisits: 25, feedbackScore: 4.5, pendingApprovals: 2, remarks: "On track", period: "2024-Q1" },
  { id: "st-2", employeeId: "4", territoryId: "t2", productCategory: "Seed", targetValue: 300000, achievementValue: 280000, siteVisits: 20, feedbackScore: 4.8, pendingApprovals: 0, remarks: "Excellent progress", period: "2024-Q1" },
  { id: "st-3", employeeId: "8", territoryId: "t3", productCategory: "Chemical", targetValue: 400000, achievementValue: 150000, siteVisits: 15, feedbackScore: 3.8, pendingApprovals: 5, remarks: "Needs attention", period: "2024-Q1" },
];

const initialDistributorLinks: DistributorLink[] = [
  {
    id: "dl-1",
    distributorId: "dist-1",
    firmName: "Agri Fresh Distributors",
    assignedTerritoryId: "t1",
    assignedSalesExecutiveIds: ["4"],
    seedLicense: true,
    seedLicenseNumber: "SL-2023-001",
    seedLicenseExpiry: "2025-06-30",
    fertiliserLicense: true,
    fertiliserLicenseNumber: "FL-2023-001",
    fertiliserLicenseExpiry: "2025-09-30",
    pesticideLicense: true,
    pesticideLicenseNumber: "PL-2023-001",
    pesticideLicenseExpiry: "2025-12-31",
    retailerNetworkCount: 25,
    retailers: [
      { id: "r1", name: "Kisan Seva", phone: "9876500001", location: "Indore", status: "Active" },
      { id: "r2", name: "Agro Point", phone: "9876500002", location: "Dewas", status: "Active" },
    ],
    godownSpace: 5000,
    shopSpace: 1500,
    vehicleCount: 3,
    hasComputer: true,
    hasInternet: true,
    status: "Active",
    statusHistory: [{ status: "Active", changedBy: "Priya Sharma", changedAt: "2024-01-15", reason: "Approved after verification" }],
    contactPerson: "Ramesh Sharma",
    contactPhone: "9876543001",
    contactEmail: "ramesh@agrifresh.com",
    address: "123, Market Road, Indore",
    supportingDocuments: [],
  },
  {
    id: "dl-2",
    distributorId: "dist-2",
    firmName: "Green Valley Fertilizers",
    assignedTerritoryId: "t2",
    assignedSalesExecutiveIds: ["4", "8"],
    seedLicense: true,
    seedLicenseNumber: "SL-2023-002",
    seedLicenseExpiry: "2025-05-31",
    fertiliserLicense: true,
    fertiliserLicenseNumber: "FL-2023-002",
    fertiliserLicenseExpiry: "2025-08-31",
    pesticideLicense: true,
    pesticideLicenseNumber: "PL-2023-002",
    pesticideLicenseExpiry: "2025-11-30",
    retailerNetworkCount: 40,
    retailers: [
      { id: "r3", name: "Farm Fresh", phone: "9876500003", location: "Nashik", status: "Active" },
      { id: "r4", name: "Green Agro", phone: "9876500004", location: "Pune", status: "Active" },
    ],
    godownSpace: 8000,
    shopSpace: 2000,
    vehicleCount: 5,
    hasComputer: true,
    hasInternet: true,
    status: "Active",
    statusHistory: [{ status: "Active", changedBy: "Priya Sharma", changedAt: "2024-01-20", reason: "Approved" }],
    contactPerson: "Suresh Patel",
    contactPhone: "9876543002",
    contactEmail: "suresh@greenvalley.com",
    address: "456, Industrial Area, Nashik",
    supportingDocuments: [],
  },
];

const initialMeetings: Meeting[] = [
  {
    id: "m-1",
    title: "Quarterly Sales Review",
    type: "internal",
    date: "2024-02-15",
    startTime: "10:00",
    endTime: "12:00",
    organizer: "Priya Sharma",
    organizerId: "2",
    attendees: [
      { id: "3", name: "Amit Patel", type: "employee" },
      { id: "4", name: "Sunita Devi", type: "employee" },
    ],
    externalGuests: [],
    location: "Conference Room A",
    mode: "in-person",
    agenda: "Review Q4 performance and set Q1 targets",
    reminder: "30min",
    recurring: "none",
    priority: "high",
    approvalRequired: false,
    status: "scheduled",
    isActive: true,
  },
  {
    id: "m-2",
    title: "Distributor Onboarding - Farm Plus",
    type: "client",
    date: "2024-02-18",
    startTime: "14:00",
    endTime: "15:30",
    organizer: "Amit Patel",
    organizerId: "3",
    attendees: [
      { id: "4", name: "Sunita Devi", type: "employee" },
      { id: "c1", name: "Distributor Contact", type: "customer" },
    ],
    externalGuests: ["external@partner.com"],
    location: "Distributor Office, Jaipur",
    mode: "hybrid",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    agenda: "Discuss partnership terms and documentation",
    reminder: "1hour",
    recurring: "none",
    priority: "medium",
    approvalRequired: true,
    status: "scheduled",
    isActive: true,
  },
];

const initialProducts: Product[] = [
  { id: "p-1", productId: "PID-0001", sku: "SKU-FRT-001", barcode: "8901234567890", name: "NPK 20-20-20 Fertilizer", category: "cat-1", brand: "AgriGrow", uom: "uom-1", sellingPrice: 1500, taxCategory: "tax-1", trackInventory: true, allowDiscount: true, serialBatchTracking: true, expiryTracking: true, status: "Active", createdAt: "2024-01-01", updatedAt: "2024-01-15" },
  { id: "p-2", productId: "PID-0002", sku: "SKU-SED-001", barcode: "8901234567891", name: "Hybrid Tomato Seeds", category: "cat-2", brand: "SeedMax", uom: "uom-2", sellingPrice: 500, taxCategory: "tax-2", trackInventory: true, allowDiscount: false, serialBatchTracking: true, expiryTracking: true, status: "Active", createdAt: "2024-01-02", updatedAt: "2024-01-16" },
  { id: "p-3", productId: "PID-0003", sku: "SKU-PES-001", barcode: "8901234567892", name: "Organic Pesticide Spray", category: "cat-3", brand: "BioShield", uom: "uom-3", sellingPrice: 800, taxCategory: "tax-1", trackInventory: true, allowDiscount: true, serialBatchTracking: false, expiryTracking: true, status: "Active", createdAt: "2024-01-03", updatedAt: "2024-01-17" },
];

const initialCategories: Category[] = [
  { id: "cat-1", name: "Fertilizers", parentCategory: "", type: "Physical", description: "All types of fertilizers", status: "Active", linkedProducts: 1 },
  { id: "cat-2", name: "Seeds", parentCategory: "", type: "Physical", description: "Agricultural seeds", status: "Active", linkedProducts: 1 },
  { id: "cat-3", name: "Pesticides", parentCategory: "", type: "Physical", description: "Pest control products", status: "Active", linkedProducts: 1 },
];

const initialUOMs: UOM[] = [
  { id: "uom-1", name: "Kilogram", shortCode: "KG", conversionFactor: 1, baseUnit: "", isBaseUnit: true, status: "Active" },
  { id: "uom-2", name: "Packet", shortCode: "PKT", conversionFactor: 1, baseUnit: "", isBaseUnit: true, status: "Active" },
  { id: "uom-3", name: "Litre", shortCode: "LTR", conversionFactor: 1, baseUnit: "", isBaseUnit: true, status: "Active" },
];

const initialLocations: Location[] = [
  { id: "loc-1", name: "Central Warehouse - Indore", type: "Warehouse", address: "Industrial Area, Indore", gpsEnabled: true, geoFenceEnabled: true, gpsRequired: true, maxCapacity: 50000, currentUtilization: 35000, status: "Active" },
  { id: "loc-2", name: "Branch Office - Mumbai", type: "Branch", address: "Andheri East, Mumbai", gpsEnabled: true, geoFenceEnabled: false, gpsRequired: false, maxCapacity: 10000, currentUtilization: 6000, status: "Active" },
  { id: "loc-3", name: "Mobile Van - North Zone", type: "Van", address: "Delhi NCR", gpsEnabled: true, geoFenceEnabled: true, gpsRequired: true, maxCapacity: 2000, currentUtilization: 1500, status: "Active" },
];

const initialVendors: Vendor[] = [
  { id: "v-1", name: "Agri Fresh Distributors", type: "Distributor", contactPerson: "Ramesh Sharma", phone: "9876543001", email: "ramesh@agrifresh.com", address: "123, Market Road, Indore", gstId: "22AAAAA0000A1Z5", creditLimit: 500000, paymentTerms: 30, linkedWarehouse: "loc-1", status: "Active" },
  { id: "v-2", name: "Green Valley Fertilizers", type: "Distributor", contactPerson: "Suresh Patel", phone: "9876543002", email: "suresh@greenvalley.com", address: "456, Industrial Area, Nashik", gstId: "27BBBBB0000B2Z6", creditLimit: 800000, paymentTerms: 45, linkedWarehouse: "loc-2", status: "Active" },
];

const initialAlerts: Alert[] = [
  { id: "a-1", type: "license_expiry", message: "Seed License expiring in 30 days for Green Valley Fertilizers", timestamp: "2024-02-01T10:00:00", severity: "high", resolved: false, relatedEntityId: "dist-2", relatedEntityType: "distributor" },
  { id: "a-2", type: "low_achievement", message: "Karan Mehta achievement at 37.5% - below target", timestamp: "2024-02-01T11:00:00", severity: "medium", resolved: false, relatedEntityId: "8", relatedEntityType: "employee" },
  { id: "a-3", type: "stock_low", message: "NPK 20-20-20 Fertilizer stock below minimum level at Central Warehouse", timestamp: "2024-02-01T12:00:00", severity: "high", resolved: false, relatedEntityId: "p-1", relatedEntityType: "product" },
];

const initialRolePermissions: RolePermission[] = [
  { id: "1", roleId: "1", roleName: "Admin", module: "Master Setup", view: true, create: true, edit: true, delete: true, approve: true, export: true },
  { id: "2", roleId: "1", roleName: "Admin", module: "Employee Portal", view: true, create: true, edit: true, delete: true, approve: true, export: true },
  { id: "3", roleId: "1", roleName: "Admin", module: "Sales Executive", view: true, create: true, edit: true, delete: true, approve: true, export: true },
  { id: "4", roleId: "2", roleName: "Sales Manager", module: "Sales Executive", view: true, create: true, edit: true, delete: false, approve: true, export: true },
  { id: "5", roleId: "2", roleName: "Sales Manager", module: "Distributor Master", view: true, create: true, edit: true, delete: false, approve: true, export: true },
];

const initialReportingManagers: ReportingManager[] = [
  { id: "rm-1", employeeId: "3", employeeName: "Amit Patel", managerId: "2", managerName: "Priya Sharma", reportingType: "Direct", effectiveFrom: "2021-06-20", effectiveTo: "", visibilityScope: "Team", overrideAccess: false },
  { id: "rm-2", employeeId: "4", employeeName: "Sunita Devi", managerId: "3", managerName: "Amit Patel", reportingType: "Direct", effectiveFrom: "2022-01-05", effectiveTo: "", visibilityScope: "Team", overrideAccess: false },
  { id: "rm-3", employeeId: "8", employeeName: "Karan Mehta", managerId: "3", managerName: "Amit Patel", reportingType: "Direct", effectiveFrom: "2023-02-15", effectiveTo: "", visibilityScope: "Team", overrideAccess: false },
];

// ============= CONTEXT TYPE =============

interface MasterDataContextType {
  // Core Data
  sites: Site[];
  setSites: React.Dispatch<React.SetStateAction<Site[]>>;
  employees: Employee[];
  roles: Role[];
  departments: Department[];
  statusMaster: StatusMaster[];
  projects: Project[];

  // Extended Data
  distributors: Distributor[];
  territories: Territory[];
  salesExecutives: SalesExecutive[];
  salesTargets: SalesTarget[];
  distributorLinks: DistributorLink[];
  meetings: Meeting[];
  products: Product[];
  categories: Category[];
  uoms: UOM[];
  locations: Location[];
  vendors: Vendor[];
  alerts: Alert[];
  rolePermissions: RolePermission[];
  reportingManagers: ReportingManager[];
  leads: Lead[];
  customers: Customer[];
  attendanceEntries: AttendanceEntry[];
  geoFenceAlerts: GeoFenceAlert[];
  leaveBalances: LeaveBalance[];
  performanceMetrics: PerformanceMetric[];
  posTerminals: POSTerminal[];
  posAlerts: POSAlert[];
  trackingEntries: TrackingEntry[];
  employeeTasks: EmployeeTask[];

  // Core Setters
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setStatusMaster: React.Dispatch<React.SetStateAction<StatusMaster[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;

  // Extended Setters
  setDistributors: React.Dispatch<React.SetStateAction<Distributor[]>>;
  setTerritories: React.Dispatch<React.SetStateAction<Territory[]>>;
  setSalesExecutives: React.Dispatch<React.SetStateAction<SalesExecutive[]>>;
  setSalesTargets: React.Dispatch<React.SetStateAction<SalesTarget[]>>;
  setDistributorLinks: React.Dispatch<React.SetStateAction<DistributorLink[]>>;
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setUoms: React.Dispatch<React.SetStateAction<UOM[]>>;
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  setRolePermissions: React.Dispatch<React.SetStateAction<RolePermission[]>>;
  setReportingManagers: React.Dispatch<React.SetStateAction<ReportingManager[]>>;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setAttendanceEntries: React.Dispatch<React.SetStateAction<AttendanceEntry[]>>;
  setGeoFenceAlerts: React.Dispatch<React.SetStateAction<GeoFenceAlert[]>>;
  setLeaveBalances: React.Dispatch<React.SetStateAction<LeaveBalance[]>>;
  setPerformanceMetrics: React.Dispatch<React.SetStateAction<PerformanceMetric[]>>;
  setPosTerminals: React.Dispatch<React.SetStateAction<POSTerminal[]>>;
  setPosAlerts: React.Dispatch<React.SetStateAction<POSAlert[]>>;
  setTrackingEntries: React.Dispatch<React.SetStateAction<TrackingEntry[]>>;
  setEmployeeTasks: React.Dispatch<React.SetStateAction<EmployeeTask[]>>;

  // Helper functions - Core
  getRoleNameById: (roleId: string) => string;
  getDepartmentNameById: (departmentId: string) => string;
  getStatusNameById: (statusId: string) => string;
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeeNameById: (id: string) => string;

  // Helper functions - Extended
  getDistributorById: (id: string) => Distributor | undefined;
  getDistributorNameById: (id: string) => string;
  getTerritoryById: (id: string) => Territory | undefined;
  getTerritoryNameById: (id: string) => string;
  getSalesExecutiveById: (id: string) => SalesExecutive | undefined;
  getSalesExecutiveNameById: (id: string) => string;
  getProductById: (id: string) => Product | undefined;
  getProductNameById: (id: string) => string;
  getLocationById: (id: string) => Location | undefined;
  getLocationNameById: (id: string) => string;
  getVendorById: (id: string) => Vendor | undefined;
  getVendorNameById: (id: string) => string;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryNameById: (id: string) => string;

  // Derived data
  eligibleOpsManagerEmployees: Employee[];
  assignableEmployees: Employee[];
  activeRoles: Role[];
  activeDepartments: Department[];
  activeStatuses: StatusMaster[];
  activeDistributors: Distributor[];
  activeTerritories: Territory[];
  activeSalesExecutives: SalesExecutive[];
  activeProducts: Product[];
  activeLocations: Location[];
  activeVendors: Vendor[];
  unresolvedAlerts: Alert[];
  salesEmployees: Employee[];
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function MasterDataProvider({ children }: { children: ReactNode }) {
  // Core state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statusMaster, setStatusMaster] = useState<StatusMaster[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch from backend on mount
  React.useEffect(() => {
    // Dynamically detect hostname so mobile devices accessing via local IP can connect
    const host = window.location.hostname;
    const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : `/api`;
    const getHeaders = () => ({
      "Content-Type": "application/json",
      "X-User-Id": sessionStorage.getItem("userId") || "",
      "X-User-Role": sessionStorage.getItem("userRole") || "",
      "X-Organization-Id": sessionStorage.getItem("organizationId") || "",
    });
    const get = (url: string) => fetch(url, { headers: getHeaders() }).then(res => res.json()).catch(() => null);

    // Core entities
    Promise.all([
      get(`${BASE}/auth/me/`),
      get(`${BASE}/employees/`),
      get(`${BASE}/roles/`),
      get(`${BASE}/departments/`),
      get(`${BASE}/status-masters/`),
      get(`${BASE}/role-permissions/`),
      get(`${BASE}/reporting-managers/`),
      get(`${BASE}/sites/`),
    ]).then(([meData, empData, roleData, deptData, statusData, permData, repData, siteData]) => {
      if (meData && !meData.error) {
        sessionStorage.setItem("userRole", meData.roleCode);
        sessionStorage.setItem("isGlobalAdmin", meData.isGlobalAdmin ? "true" : "false");
        sessionStorage.setItem("modulesEnabled", JSON.stringify(meData.modulesEnabled || []));
        sessionStorage.setItem("trackingEnabled", meData.trackingEnabled ? "true" : "false");
        sessionStorage.setItem("defaultDashboard", meData.defaultDashboard || "");
      }
      if (Array.isArray(empData)) setEmployees(empData);
      if (Array.isArray(roleData)) setRoles(roleData);
      if (Array.isArray(deptData)) setDepartments(deptData);
      if (Array.isArray(statusData)) setStatusMaster(statusData);
      if (Array.isArray(permData)) setRolePermissions(permData);
      if (Array.isArray(repData)) setReportingManagers(repData);
      if (Array.isArray(siteData)) setSites(siteData);
    });

    // CRM entities
    Promise.all([
      get(`${BASE}/crm/distributors/`),
      get(`${BASE}/crm/territories/`),
      get(`${BASE}/crm/sales-executives/`),
      get(`${BASE}/crm/sales-targets/`),
      get(`${BASE}/crm/distributor-links/`),
      get(`${BASE}/crm/leads/`),
      get(`${BASE}/crm/customers/`),
    ]).then(([distData, terrData, seData, stData, dlData, leadData, custData]) => {
      if (Array.isArray(distData)) setDistributors(distData);
      if (Array.isArray(terrData)) setTerritories(terrData);
      if (Array.isArray(seData)) setSalesExecutives(seData);
      if (Array.isArray(stData)) setSalesTargets(stData);
      if (Array.isArray(dlData)) setDistributorLinks(dlData);
      if (Array.isArray(leadData)) setLeads(leadData);
      if (Array.isArray(custData)) setCustomers(custData);
    });

    // Inventory entities
    Promise.all([
      get(`${BASE}/inventory/products/`),
      get(`${BASE}/inventory/categories/`),
      get(`${BASE}/inventory/uoms/`),
      get(`${BASE}/inventory/locations/`),
      get(`${BASE}/inventory/vendors/`),
      get(`${BASE}/inventory/pos-terminals/`),
      get(`${BASE}/inventory/pos-alerts/`),
    ]).then(([prodData, catData, uomData, locData, vendData, termData, paData]) => {
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(uomData)) setUoms(uomData);
      if (Array.isArray(locData)) setLocations(locData);
      if (Array.isArray(vendData)) setVendors(vendData);
      if (Array.isArray(termData)) setPosTerminals(termData);
      if (Array.isArray(paData)) setPosAlerts(paData);
    });

    // Ops entities
    Promise.all([
      get(`${BASE}/ops/meetings/`),
      get(`${BASE}/ops/alerts/`),
      get(`${BASE}/ops/attendance/`),
      get(`${BASE}/ops/geofence-alerts/`),
      get(`${BASE}/ops/leave-balances/`),
      get(`${BASE}/ops/performance-metrics/`),
      get(`${BASE}/ops/tracking-entries/`),
      get(`${BASE}/ops/employee-tasks/`),
    ]).then(([meetData, alertData, attData, geoData, lbData, pmData, teData, etData]) => {
      if (Array.isArray(meetData)) setMeetings(meetData);
      if (Array.isArray(alertData)) setAlerts(alertData);
      if (Array.isArray(attData)) setAttendanceEntries(attData);
      if (Array.isArray(geoData)) setGeoFenceAlerts(geoData);
      if (Array.isArray(lbData)) setLeaveBalances(lbData);
      if (Array.isArray(pmData)) setPerformanceMetrics(pmData);
      if (Array.isArray(teData)) setTrackingEntries(teData);
      if (Array.isArray(etData)) setEmployeeTasks(etData);
    });

    // Auto-refresh removed as per user request to avoid real-time tracking costs
    // Data will only be loaded on mount or manual refresh
  }, []);

  // Extended state
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [salesExecutives, setSalesExecutives] = useState<SalesExecutive[]>([]);
  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>([]);
  const [distributorLinks, setDistributorLinks] = useState<DistributorLink[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [reportingManagers, setReportingManagers] = useState<ReportingManager[]>([]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [geoFenceAlerts, setGeoFenceAlerts] = useState<GeoFenceAlert[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [posTerminals, setPosTerminals] = useState<POSTerminal[]>([]);
  const [posAlerts, setPosAlerts] = useState<POSAlert[]>([]);
  const [trackingEntries, setTrackingEntries] = useState<TrackingEntry[]>([]);
  const [employeeTasks, setEmployeeTasks] = useState<EmployeeTask[]>([]);

  // Core helper functions
  const getRoleNameById = useCallback((roleId: string) => getRoleName(roleId, roles), [roles]);
  const getDepartmentNameById = useCallback((departmentId: string) => getDepartmentName(departmentId, departments), [departments]);
  const getStatusNameById = useCallback((statusId: string) => getStatusName(statusId, statusMaster), [statusMaster]);
  const getEmployeeById = useCallback((id: string) => employees.find(e => e.id === id), [employees]);
  const getEmployeeNameById = useCallback((id: string) => {
    if (id === 'admin' || id === 'SYSTEM') return 'System Admin';
    return employees.find(e => e.id === id)?.fullName || "Unknown";
  }, [employees]);

  // Extended helper functions
  const getDistributorById = useCallback((id: string) => distributors.find(d => d.id === id), [distributors]);
  const getDistributorNameById = useCallback((id: string) => distributors.find(d => d.id === id)?.firmName || "Unknown", [distributors]);
  const getTerritoryById = useCallback((id: string) => territories.find(t => t.id === id), [territories]);
  const getTerritoryNameById = useCallback((id: string) => territories.find(t => t.id === id)?.name || "Unknown", [territories]);
  const getSalesExecutiveById = useCallback((id: string) => salesExecutives.find(se => se.id === id || se.employeeId === id), [salesExecutives]);
  const getSalesExecutiveNameById = useCallback((id: string) => {
    const se = salesExecutives.find(s => s.id === id || s.employeeId === id);
    if (se) return se.fullName;
    const emp = employees.find(e => e.id === id);
    return emp?.fullName || "Unknown";
  }, [salesExecutives, employees]);
  const getProductById = useCallback((id: string) => products.find(p => p.id === id), [products]);
  const getProductNameById = useCallback((id: string) => products.find(p => p.id === id)?.name || "Unknown", [products]);
  const getLocationById = useCallback((id: string) => locations.find(l => l.id === id), [locations]);
  const getLocationNameById = useCallback((id: string) => locations.find(l => l.id === id)?.name || "Unknown", [locations]);
  const getVendorById = useCallback((id: string) => vendors.find(v => v.id === id), [vendors]);
  const getVendorNameById = useCallback((id: string) => vendors.find(v => v.id === id)?.name || "Unknown", [vendors]);
  const getCategoryById = useCallback((id: string) => categories.find(c => c.id === id), [categories]);
  const getCategoryNameById = useCallback((id: string) => categories.find(c => c.id === id)?.name || "Unknown", [categories]);

  // Derived data - Core
  const eligibleOpsManagerEmployees = useMemo(
    () => getEligibleOpsManagerEmployees(employees, roles, departments, statusMaster),
    [employees, roles, departments, statusMaster]
  );

  const assignableEmployees = useMemo(
    () => getAssignableEmployees(employees, roles, departments, statusMaster),
    [employees, roles, departments, statusMaster]
  );

  const activeRoles = useMemo(() => roles.filter(r => r.activeStatus), [roles]);
  const activeDepartments = useMemo(() => departments.filter(d => d.activeStatus), [departments]);
  const activeStatuses = useMemo(() => statusMaster.filter(s => s.activeStatus), [statusMaster]);

  // Derived data - Extended
  const activeDistributors = useMemo(() => distributors.filter(d => d.activeStatus), [distributors]);
  const activeTerritories = useMemo(() => territories.filter(t => t.status === "Active"), [territories]);
  const activeSalesExecutives = useMemo(() => salesExecutives.filter(se => se.status === "Active"), [salesExecutives]);
  const activeProducts = useMemo(() => products.filter(p => p.status === "Active"), [products]);
  const activeLocations = useMemo(() => locations.filter(l => l.status === "Active"), [locations]);
  const activeVendors = useMemo(() => vendors.filter(v => v.status === "Active"), [vendors]);
  const unresolvedAlerts = useMemo(() => alerts.filter(a => !a.resolved), [alerts]);

  // Sales employees (employees in Sales department)
  const salesEmployees = useMemo(() => {
    const salesDeptId = departments.find(d => d.departmentName === "Sales")?.id;
    return employees.filter(e => e.departmentId === salesDeptId && e.accountStatus);
  }, [employees, departments]);

  const value: MasterDataContextType = {
    // Core Data
    sites,
    employees,
    roles,
    departments,
    statusMaster,
    projects,

    // Extended Data
    distributors,
    territories,
    salesExecutives,
    salesTargets,
    distributorLinks,
    meetings,
    products,
    categories,
    uoms,
    locations,
    vendors,
    alerts,
    rolePermissions,
    reportingManagers,
    leads,
    customers,
    attendanceEntries,
    geoFenceAlerts,
    leaveBalances,
    performanceMetrics,
    posTerminals,
    posAlerts,
    trackingEntries,
    employeeTasks,

    // Core Setters
    setSites,
    setEmployees,
    setRoles,
    setDepartments,
    setStatusMaster,
    setProjects,

    // Extended Setters
    setDistributors,
    setTerritories,
    setSalesExecutives,
    setSalesTargets,
    setDistributorLinks,
    setMeetings,
    setProducts,
    setCategories,
    setUoms,
    setLocations,
    setVendors,
    setAlerts,
    setRolePermissions,
    setReportingManagers,
    setLeads,
    setCustomers,
    setAttendanceEntries,
    setGeoFenceAlerts,
    setLeaveBalances,
    setPerformanceMetrics,
    setPosTerminals,
    setPosAlerts,
    setTrackingEntries,
    setEmployeeTasks,

    // Helper functions - Core
    getRoleNameById,
    getDepartmentNameById,
    getStatusNameById,
    getEmployeeById,
    getEmployeeNameById,

    // Helper functions - Extended
    getDistributorById,
    getDistributorNameById,
    getTerritoryById,
    getTerritoryNameById,
    getSalesExecutiveById,
    getSalesExecutiveNameById,
    getProductById,
    getProductNameById,
    getLocationById,
    getLocationNameById,
    getVendorById,
    getVendorNameById,
    getCategoryById,
    getCategoryNameById,

    // Derived data
    eligibleOpsManagerEmployees,
    assignableEmployees,
    activeRoles,
    activeDepartments,
    activeStatuses,
    activeDistributors,
    activeTerritories,
    activeSalesExecutives,
    activeProducts,
    activeLocations,
    activeVendors,
    unresolvedAlerts,
    salesEmployees,
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error("useMasterData must be used within a MasterDataProvider");
  }
  return context;
}
