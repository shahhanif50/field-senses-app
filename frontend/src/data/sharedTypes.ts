// ============= SHARED INTERFACES FOR CROSS-MODULE LINKING =============
// All interfaces are defined here and re-exported from MasterDataContext

export interface Site {
  id: string;
  name: string;
  siteCode?: string;
  productType?: string;
  country?: string;
  activateDate?: string;
  address?: string;
  region?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  modulesEnabled?: string[];
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

// ============= DISTRIBUTOR TYPES =============

export interface CompanyAssociation {
  companyName: string;
  businessType: string;
  turnoverYear1: number;
  turnoverYear2: number;
  turnoverYear3: number;
}

export interface ApprovalSignature {
  name: string;
  signature: string;
}

export interface WitnessDetails {
  name: string;
  address: string;
  mobile: string;
}

export interface GovernmentDocument {
  id: string;
  documentType: "PAN" | "GST Certificate" | "Seed License" | "Fertiliser License" | "Pesticide License" | "Aadhaar" | "Udyam Certificate" | "Shop Act" | "FSSAI" | "Other";
  documentNumber: string;
  expiryDate: string;
  fileName: string;
  fileData: string;
  remarks: string;
  uploadedBy: string;
  timestamp: string;
}

export interface Distributor {
  id: string;
  distributorId: string;
  
  // Basic Details
  firmName: string;
  name?: string;
  proprietorName: string;
  mobileNumber: string;
  emailAddress: string;
  panProprietor: string;
  panFirm: string;
  gstNumber: string;
  dateOfBirth: string;
  marriageAnniversary: string;
  
  // Address Details
  officeAddress: string;
  currentAddress: string;
  permanentAddress: string;
  district: string;
  state: string;
  pincode: string;
  region?: string;
  
  // Business Profile
  typeOfFirm: "Sole Proprietor" | "Partnership" | "Pvt Ltd" | "Co-Op Society";
  distributorProfile: {
    wholesalerPercent: number;
    retailerPercent: number;
  };
  yearsOfEstablishment: number;
  yearsOfExperience: number;
  topCompaniesAssociated: CompanyAssociation[];
  
  // Licenses
  pesticideLicenseNo: string;
  seedLicenseNo: string;
  fertiliserLicenseNo: string;
  pesticideLicenseExpiry: string;
  seedLicenseExpiry: string;
  fertiliserLicenseExpiry: string;
  
  // Infrastructure
  godownSpace: number;
  shopSpace: number;
  housePropertyOwned: boolean;
  computerAvailable: boolean;
  internetAvailable: boolean;
  deliveryVehicles: number;
  salesmenAvailable: number;
  
  // Banking & Investment
  bankName: string;
  accountNumber: string;
  accountType: "Saving" | "Current";
  bankLimitCC: number;
  otherLoans: string;
  totalFundsEmployed: number;
  ownInvestment: number;
  
  // Transport Preferences
  preferredTransporters: string[];
  depotLocation: string;
  
  // Attached Retailers
  attachedRetailersList: string;
  numberOfRetailers: number;
  
  // Declaration & Approval
  declarationAccepted: boolean;
  proprietorSignature: string;
  witnessDetails: WitnessDetails;
  submittedBy: ApprovalSignature;
  forwardedBy: ApprovalSignature;
  approvedBy: ApprovalSignature;
  
  // Government Documents
  governmentDocuments: GovernmentDocument[];
  
  status?: string;
  activeStatus: boolean;
}

// ============= TERRITORY TYPES =============

export interface Territory {
  id: string;
  name: string;
  region: "North" | "South" | "East" | "West";
  district: string;
  assignedSalesExecutiveId: string;
  linkedDistributorIds: string[];
  coverageArea: string;
  geoFencing: boolean;
  status: "Active" | "Inactive";
}

// ============= SALES EXECUTIVE TYPES =============

export interface SalesExecutive {
  id: string;
  employeeId: string; // Links to Employee.id
  fullName: string;
  role: "Sales Executive" | "Territory Manager" | "Regional Manager";
  department: "Sales" | "Marketing" | "Logistics";
  reportingManagerId: string; // Links to Employee.id
  phone: string;
  email: string;
  gpsTracking: boolean;
  workMode: "Field" | "Hybrid" | "Office";
  status: "Active" | "Inactive" | "On Leave";
  assignedTerritoryIds: string[]; // Links to Territory.id
}

// ============= SALES TARGET TYPES =============

export interface SalesTarget {
  id: string;
  employeeId: string; // Links to Employee.id or SalesExecutive.id
  territoryId: string; // Links to Territory.id
  productCategory: "Fertiliser" | "Seed" | "Chemical";
  targetValue: number;
  achievementValue: number;
  siteVisits: number;
  feedbackScore: number;
  pendingApprovals: number;
  remarks: string;
  period: string; // e.g., "2024-Q1"
  status?: string;
}

// ============= DISTRIBUTOR LINKAGE TYPES =============

export interface Retailer {
  id: string;
  name: string;
  phone: string;
  location: string;
  status: "Active" | "Inactive";
}

export interface StatusHistoryEntry {
  status: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface SupportingDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface DistributorLink {
  id: string;
  distributorId: string; // Links to Distributor.id
  firmName: string;
  assignedTerritoryId: string; // Links to Territory.id
  assignedSalesExecutiveIds: string[]; // Links to SalesExecutive.id or Employee.id
  
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
  godownSpace: number;
  shopSpace: number;
  vehicleCount: number;
  hasComputer: boolean;
  hasInternet: boolean;
  
  // Status
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

// ============= MEETING TYPES =============

export interface MeetingAttendee {
  id: string; // Links to Employee.id or customer ID
  name: string;
  type: "employee" | "customer";
}

export interface MeetingAttachment {
  name: string;
  url: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: "internal" | "client" | "sales" | "follow-up";
  date: string;
  startTime: string;
  endTime: string;
  organizer: string;
  organizerId: string; // Links to Employee.id
  attendees: MeetingAttendee[];
  externalGuests: string[];
  location: string;
  mode: "in-person" | "online" | "hybrid";
  meetingLink?: string;
  agenda: string;
  notes?: string;
  attachments?: MeetingAttachment[];
  reminder: "15min" | "30min" | "1hour" | "none";
  recurring: "none" | "daily" | "weekly" | "monthly";
  priority: "low" | "medium" | "high";
  approvalRequired: boolean;
  vehicleType?: string;
  vehicleRate?: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "rescheduled";
  cancelReason?: string;
  isActive: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  startLocationLat?: number;
  startLocationLng?: number;
  endLocationLat?: number;
  endLocationLng?: number;
  startPhoto?: string;
  endPhoto?: string;
}

// ============= INVENTORY TYPES =============

export interface Product {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  category: string; // Links to Category.id
  brand: string;
  uom: string; // Links to UOM.id
  sellingPrice: number;
  taxCategory: string; // Links to TaxSetting.id
  trackInventory: boolean;
  allowDiscount: boolean;
  serialBatchTracking: boolean;
  expiryTracking: boolean;
  productImage?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentCategory: string;
  type: "Physical" | "Service";
  description: string;
  status: "Active" | "Inactive";
  linkedProducts?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UOM {
  id: string;
  name: string;
  shortCode: string;
  conversionFactor: number;
  baseUnit: string;
  isBaseUnit: boolean;
  inUse?: boolean;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
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

export interface Vendor {
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
  linkedWarehouse: string; // Links to Location.id
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

// ============= DAILY TRACKING TYPES =============

export interface TrackingEntry {
  id: string;
  employeeId: string; // Links to Employee.id
  employeeName: string;
  role: string;
  currentLocation: string;
  checkInTime: string;
  checkOutTime: string | null;
  travelDistance: number;
  idleTime: number;
  planVsActual: number;
  routePath?: { lat: number; lng: number; timestamp?: string }[];
  plannedRouteSummary?: any[];
  clientVisits?: string[];
  purpose?: string;
  vehicleType?: string;
  reimbursementAmount?: number;
  timeSpentOnSite?: number;
  status: "online" | "offline" | "idle" | "completed";
  date: string;
  employeeCode?: string;
  checkInPhoto?: string;
  checkOutPhoto?: string;
}

// ============= EMPLOYEE PORTAL TYPES =============

export interface PortalEmployee {
  id: string;
  employeeId: string; // Links to Employee.id
  employeeCode: string;
  departmentId: string; // Links to Department.id
  designation: string;
  roleId: string; // Links to Role.id
  employeeLevel: "Junior" | "Mid" | "Senior" | "Lead";
  workMode: "Field" | "Office" | "Hybrid";
  activeStatus: boolean;
  dashboardAccess: boolean;
  taskAssignmentEnabled: boolean;
  reportingManagerId: string; // Links to Employee.id
}

export interface EmployeeTask {
  id: string;
  employeeId: string; // Links to Employee.id
  assignedTo?: string;
  taskTitle: string;
  description: string;
  assignedDate: string;
  deadline: string;
  status: "pending" | "in-progress" | "completed" | "overdue" | "active";
  completionPercent: number;
  proofUploaded: boolean;
  notes: string;
  assignedBy: string; // Links to Employee.id
}

// ============= ALERT TYPES =============

export interface Alert {
  id: string;
  type: "low_achievement" | "inactive_gps" | "pending_approval" | "compliance" | "license_expiry" | "stock_low";
  message: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
  resolved: boolean;
  relatedEntityId?: string; // Links to related entity (Employee, Distributor, Product, etc.)
  relatedEntityType?: "employee" | "distributor" | "product" | "territory" | "meeting";
}

// ============= ROLE PERMISSION TYPES =============

export interface RolePermission {
  id: string;
  roleId: string; // Links to Role.id
  roleName: string;
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

// ============= REPORTING MANAGER TYPES =============

export interface ReportingManager {
  id: string;
  employeeId: string; // Links to Employee.id (employee being mapped)
  employeeName: string;
  managerId: string; // Links to Employee.id (manager)
  managerName: string;
  reportingType: "Direct" | "Dotted";
  effectiveFrom: string;
  effectiveTo: string;
  visibilityScope: "Team" | "Department";
  overrideAccess: boolean;
}

// ============= CRM TYPES =============
export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: "new" | "contacted" | "qualified" | "proposal" | "closed-won" | "closed-lost";
  source: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  territory: string;
  lastContact: string;
  status: "active" | "inactive";
}

// ============= OPS TYPES =============
export interface AttendanceEntry {
  id: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  date: string;
  scheduledShift: string;
  actualCheckIn: string;
  actualCheckOut: string | null;
  lateArrival: number;
  earlyExit: number;
  totalHoursWorked: number;
  status: "present" | "absent" | "on-leave" | "half-day";
  checkInPhoto?: string;
  checkOutPhoto?: string;
  checkInLocationLat?: number;
  checkInLocationLng?: number;
  checkOutLocationLat?: number;
  checkOutLocationLng?: number;
}

export interface GeoFenceAlert {
  id: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  currentLocation: string;
  assignedZone: string;
  alertType: "zone-exit" | "idle-breach" | "restricted-entry" | "boundary-violation";
  alertTime: string;
  idleDuration: number;
  planVsActual: number;
  status: "online" | "idle" | "offline";
  priority: "low" | "medium" | "high";
  resolved: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  type: string; // "Annual Leave", "Sick Leave"
  total: number;
  used: number;
  available: number;
}

export interface PerformanceMetric {
  id: string;
  employeeId: string;
  metricName: string;
  value: number;
  target: number;
  period: string;
}

// ============= POS TYPES =============
export interface POSTerminal {
  id: string;
  name: string;
  location: string;
  type: "Web" | "Mobile" | "Hardware";
  status: "online" | "offline" | "syncing" | "error";
  lastSync: string;
  todayTransactions: number;
  todaySales: number;
  errorCount: number;
  ipAddress: string;
  version: string;
  operator: string;
  geoCoordinates?: { lat: number; lng: number };
}

export interface POSAlert {
  id: string;
  terminalId: string;
  terminalName: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface RegularizationRequest {
  id: string;
  employeeName: string;
  employeeId?: string;
  date: string;
  type: 'Check In' | 'Check Out' | 'Both';
  requestedTime: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Denied';
  timestamp: string;
}