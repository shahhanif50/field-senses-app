import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Shield, Building, GitBranch, FileText, Plus, User, Mail, Phone, Calendar,
  Briefcase, MapPin, Trash2, Check, X, ChevronRight, ChevronDown, UserPlus, AlertTriangle, Lock,
  Store, BadgeCheck, Pen, Upload, Eye, EyeOff, Download, File
} from "lucide-react";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlassModal } from "@/components/ui/GlassModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useMasterData,
  Employee,
  Role,
  Department,
  StatusMaster,
  Distributor,
  RolePermission,
  ReportingManager,
} from "@/contexts/MasterDataContext";
import type { GovernmentDocument, CompanyAssociation, ApprovalSignature, WitnessDetails, Site } from "@/data/sharedTypes";

const AVAILABLE_MODULES = [
  "Master Setup", "Employee Portal", "Daily Tracking", "Team Tracking", 
  "Live Tracking", "Reports", "Alerts", 
  "Attendance & Leaves", "Projects & Tasks", "Communication & Meetings", 
  "Documents", "Inventory Management", "Sales Executive"
];

type MasterType = "employees" | "roles" | "role-permissions" | "reporting-manager" | "departments" | "status" | "distributors" | "sites";

// ============= LOCAL INTERFACES (not shared) =============

// Employee mapping for multi-select in reporting manager
interface EmployeeMapping {
  employeeId: string;
  employeeName: string;
  reportingType: "Direct" | "Dotted";
  effectiveFrom: string;
  effectiveTo: string;
  visibilityScope: "Team" | "Department";
  overrideAccess: boolean;
}


// ============= TABS CONFIG =============

const masterTabs = [
  { id: "employees", label: "Employees", icon: Users },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "role-permissions", label: "Role Permissions", icon: FileText },
  { id: "reporting-manager", label: "Reporting Manager", icon: GitBranch },
  { id: "departments", label: "Departments", icon: Building },
  { id: "status", label: "Status Master", icon: FileText },
  { id: "distributors", label: "Distributor Master", icon: Store },
  { id: "sites", label: "Sites", icon: MapPin },
];

type PermissionModuleConfig = {
  id: string;
  label: string;
  subModules?: { id: string; label: string; }[];
};

const permissionModulesHierarchy: PermissionModuleConfig[] = [
  {
    id: "Master Setup",
    label: "Master Setup",
    subModules: [
      { id: "Employees", label: "Employees" },
      { id: "Roles", label: "Roles" },
      { id: "Role Permissions", label: "Role Permissions" },
      { id: "Reporting Manager", label: "Reporting Manager" },
      { id: "Departments", label: "Departments" },
      { id: "Status Master", label: "Status Master" },
      { id: "Distributor Master", label: "Distributor Master" },
      { id: "Sites", label: "Sites" }
    ]
  },
  {
    id: "Inventory Management",
    label: "Inventory Management",
    subModules: [
      { id: "Product Setup", label: "Product Setup" },
      { id: "Stock Management", label: "Stock Management" },
      { id: "Sales & Billing", label: "Sales & Billing" }
    ]
  },
  {
    id: "Field Operations & Tracking",
    label: "Field Operations & Tracking",
    subModules: [
      { id: "Daily Tracking", label: "Daily Tracking" },
      { id: "Team Tracking", label: "Team Tracking" },
      { id: "Live Tracking", label: "Live Tracking" }
    ]
  },
  {
    id: "Employee Portal",
    label: "Employee Portal",
    subModules: []
  },
  {
    id: "Approvals & Requests",
    label: "Approvals & Requests",
    subModules: [
      { id: "Permission Requests", label: "Permission Requests" },
      { id: "Registration Approvals", label: "Registration Approvals" }
    ]
  },
  {
    id: "Reports",
    label: "Reports",
    subModules: []
  },
  {
    id: "Alerts",
    label: "Alerts",
    subModules: []
  },
  {
    id: "Documents",
    label: "Documents",
    subModules: []
  },
  {
    id: "My Profile",
    label: "My Profile",
    subModules: []
  }
];

const allPermissionModuleIds: string[] = [];
permissionModulesHierarchy.forEach(parent => {
  allPermissionModuleIds.push(parent.id);
  if (parent.subModules) {
    parent.subModules.forEach(sub => allPermissionModuleIds.push(sub.id));
  }
});

// ============= MAIN COMPONENT =============

interface MasterSetupTabProps {
  defaultMaster?: MasterType;
  isTeamManagementView?: boolean;
}

export function MasterSetupTab({ defaultMaster = "employees", isTeamManagementView = false }: MasterSetupTabProps) {
  const [activeMaster, setActiveMaster] = useState<MasterType>(defaultMaster);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [showPassword, setShowPassword] = useState(false);

  const visibleMasters = useMemo(() => {
    let modulesEnabled: string[] = [];
    try {
      modulesEnabled = JSON.parse(sessionStorage.getItem("modulesEnabled") || "[]");
    } catch (e) { }

    const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
    const orgId = sessionStorage.getItem("organizationId");
    const isImpersonating = isGlobalAdmin && orgId && orgId !== "null";

    let filtered = masterTabs;

    if (isTeamManagementView) {
      filtered = filtered.filter(m => ["employees", "reporting-manager"].includes(m.id));
    }

    if (!isGlobalAdmin || isImpersonating) {
      if (!modulesEnabled.includes("All")) {
        filtered = filtered.filter(m => modulesEnabled.includes(m.label));
      }
    }

    return filtered;
  }, [isTeamManagementView]);

  // Shared data from context (synced across all tabs)
  const {
    employees, setEmployees,
    roles, setRoles,
    departments, setDepartments,
    statusMaster, setStatusMaster,
    distributors, setDistributors,
    rolePermissions, setRolePermissions,
    reportingManagers, setReportingManagers,
    sites, setSites,
    activeRoles, activeDepartments, activeStatuses, activeDistributors,
    getRoleNameById, getDepartmentNameById, getStatusNameById,
    getEmployeeNameById,
  } = useMasterData();

  // Bulk permission toggle state
  const [bulkToggleRole, setBulkToggleRole] = useState<string>("");
  const [isBulkToggleOpen, setIsBulkToggleOpen] = useState(false);

  // --- PERMISSION CHECKS ---
  const rawRole = sessionStorage.getItem("userRole") || "employee";
  const currentRole = activeRoles.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const masterSetupPerm = rolePermissions.find(p => p.roleId === currentRole?.id && p.module === "Master Setup");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = rawRole.toLowerCase() === "admin" || isGlobalAdmin;

  const canCreate = isAdmin || masterSetupPerm?.create;
  const canEdit = isAdmin || masterSetupPerm?.edit;
  const canDelete = isAdmin || masterSetupPerm?.delete;
  const canExport = isAdmin || masterSetupPerm?.export;
  const canApprove = isAdmin || masterSetupPerm?.approve;
  // -----------------------

  // --- MODULE FILTERING FOR PERMISSIONS ---
  const availableDropdownModules = useMemo(() => {
    let modulesEnabled: string[] = [];
    try {
      modulesEnabled = JSON.parse(sessionStorage.getItem("modulesEnabled") || "[]");
    } catch (e) { }

    const orgId = sessionStorage.getItem("organizationId");
    const isImpersonating = isGlobalAdmin && orgId && orgId !== "null";

    const allDropdownModules = [
      "Organizations", "Master Setup", "Sales Executive", "Employee Portal",
      "Inventory Management", "Daily Tracking", "Team Tracking",
      "Live Tracking", "Reports", "Alerts",
      "Attendance & Leaves", "Projects & Tasks", "Communication & Meetings",
      "Documents", "Permission Requests", "Registration Approvals", "My Profile"
    ];

    return allDropdownModules.filter(mod => {
      if (isGlobalAdmin && !isImpersonating) return true; // Superadmin sees everything
      if (mod === "Organizations") return false; // Tenant never sees organizations
      if (mod === "Permission Requests" || mod === "Registration Approvals" || mod === "My Profile") return true;

      let effectiveMod = mod;

      return modulesEnabled.includes("All") || modulesEnabled.includes(effectiveMod);
    });
  }, [isGlobalAdmin]);
  // -----------------------
  // Get unique roles from permissions for bulk toggle
  const uniqueRolesInPermissions = useMemo(() => {
    const rolesMap = new Map<string, { roleId: string; roleName: string }>();
    rolePermissions.forEach(p => {
      if (!rolesMap.has(p.roleId)) {
        rolesMap.set(p.roleId, { roleId: p.roleId, roleName: p.roleName });
      }
    });
    return Array.from(rolesMap.values());
  }, [rolePermissions]);

  // Bulk toggle handlers
  const handleBulkEnableAll = async (roleId: string) => {
    const toUpdate = rolePermissions.filter(p => p.roleId === roleId);

    // Optimistic UI update
    setRolePermissions(prev => prev.map(p =>
      p.roleId === roleId
        ? { ...p, view: true, create: true, edit: true, delete: true, approve: true, export: true }
        : p
    ));

    // Backend update
    for (const p of toUpdate) {
      await fetch(`/api/role-permissions/${p.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view: true, create: true, edit: true, delete: true, approve: true, export: true })
      });
    }
  };

  const handleBulkDisableAll = async (roleId: string) => {
    const toUpdate = rolePermissions.filter(p => p.roleId === roleId);

    setRolePermissions(prev => prev.map(p =>
      p.roleId === roleId
        ? { ...p, view: false, create: false, edit: false, delete: false, approve: false, export: false }
        : p
    ));

    for (const p of toUpdate) {
      await fetch(`/api/role-permissions/${p.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view: false, create: false, edit: false, delete: false, approve: false, export: false })
      });
    }
  };

  const handleGridBulkAction = (actionType: 'enableAll' | 'disableAll') => {
    const newVal = actionType === 'enableAll';
    const newGrid: Record<string, any> = {};
    allPermissionModuleIds.forEach(mod => {
      newGrid[mod] = { view: newVal, create: newVal, edit: newVal, delete: newVal, approve: newVal, export: newVal };
    });
    setGridPermissions(newGrid);
  };

  const handlePermissionChange = (moduleId: string, action: string, checked: boolean, parentId?: string) => {
    setGridPermissions(prev => {
      const next = { ...prev };
      
      const currentMod = next[moduleId] || { view: false, create: false, edit: false, delete: false, approve: false, export: false };
      next[moduleId] = { ...currentMod, [action]: checked };
      
      // If it's a parent, update all children
      const parentConfig = permissionModulesHierarchy.find(p => p.id === moduleId);
      if (parentConfig && parentConfig.subModules) {
        parentConfig.subModules.forEach(sub => {
          const currentSub = next[sub.id] || { view: false, create: false, edit: false, delete: false, approve: false, export: false };
          next[sub.id] = { ...currentSub, [action]: checked };
        });
      }
      
      return next;
    });
  };
  
  const toggleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };


  const handleSaveGridPermissions = async () => {
    if (!selectedRoleForGrid) return;
    setIsSavingGrid(true);
    try {
      const roleName = roles.find(r => r.id === selectedRoleForGrid)?.roleName || "";
      const permissionsArray = Object.entries(gridPermissions).map(([moduleName, perms]) => ({
        module: moduleName,
        ...perms
      }));

      const res = await fetch('/api/role-permissions/bulk_update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': sessionStorage.getItem('organizationId') || ''
        },
        body: JSON.stringify({
          roleId: selectedRoleForGrid,
          roleName,
          permissions: permissionsArray
        })
      });

      if (res.ok) {
        toast.success("Permissions updated successfully");
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
        fetch('/api/role-permissions/', {
          headers: {
            'X-Organization-Id': sessionStorage.getItem('organizationId') || ''
          }
        }).then(r => r.json()).then(data => {
          if (Array.isArray(data)) setRolePermissions(data);
        }).catch(() => { });
      } else {
        toast.error("Failed to update permissions");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSavingGrid(false);
    }
  };

  const handleBulkTogglePermission = async (roleId: string, permission: "view" | "create" | "edit" | "delete" | "approve" | "export", enabled: boolean) => {
    const toUpdate = rolePermissions.filter(p => p.roleId === roleId);

    setRolePermissions(prev => prev.map(p =>
      p.roleId === roleId
        ? { ...p, [permission]: enabled }
        : p
    ));

    for (const p of toUpdate) {
      await fetch(`/api/role-permissions/${p.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [permission]: enabled })
      });
    }
  };


  // Selected items
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<RolePermission | null>(null);
  const [selectedReporting, setSelectedReporting] = useState<ReportingManager | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusMaster | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);


  // Form states
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [roleForm, setRoleForm] = useState<Partial<Role>>({});
  const [permissionForm, setPermissionForm] = useState<Partial<RolePermission>>({});
  const [reportingForm, setReportingForm] = useState<Partial<ReportingManager>>({});
  const [departmentForm, setDepartmentForm] = useState<Partial<Department>>({});
  const [statusForm, setStatusForm] = useState<Partial<StatusMaster>>({});
  const [distributorForm, setDistributorForm] = useState<Partial<Distributor>>({});
  const [siteForm, setSiteForm] = useState<Partial<Site>>({});


  // Permissions Grid State
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const [selectedRoleForGrid, setSelectedRoleForGrid] = useState<string>("");
  const [gridPermissions, setGridPermissions] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean; export: boolean; }>>({});
  const [isSavingGrid, setIsSavingGrid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Effect to populate grid when role is selected
  useEffect(() => {
    if (activeMaster === "role-permissions" && selectedRoleForGrid) {
      const perms = rolePermissions.filter(p => p.roleId === selectedRoleForGrid);
      const initialGrid: Record<string, any> = {};

      allPermissionModuleIds.forEach(mod => {
        initialGrid[mod] = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
      });

      perms.forEach(p => {
        if (initialGrid[p.module] !== undefined) {
          initialGrid[p.module] = {
            view: p.view,
            create: p.create,
            edit: p.edit,
            delete: p.delete,
            approve: p.approve,
            export: p.export
          };
        }
      });

      setGridPermissions(initialGrid);
      
      // Expand all by default
      const initialExpanded: Record<string, boolean> = {};
      permissionModulesHierarchy.forEach(p => {
        if (p.subModules && p.subModules.length > 0) {
          initialExpanded[p.id] = true;
        }
      });
      setExpandedModules(initialExpanded);
    }
  }, [selectedRoleForGrid, rolePermissions, activeMaster]);


  // Government Document form state
  const [documentForm, setDocumentForm] = useState<Partial<GovernmentDocument>>({
    documentType: "PAN",
    documentNumber: "",
    expiryDate: "",
    fileName: "",
    fileData: "",
    remarks: "",
  });


  // ============= REPORTING MANAGER WIZARD STATE =============
  const [reportingWizardStep, setReportingWizardStep] = useState<1 | 2>(1);
  const [newManagerForm, setNewManagerForm] = useState<Partial<Employee>>({});
  const [employeeMappings, setEmployeeMappings] = useState<EmployeeMapping[]>([]);
  const [createdManagerId, setCreatedManagerId] = useState<string>("");

  // ============= DEPARTMENT WIZARD STATE =============
  const [departmentWizardStep, setDepartmentWizardStep] = useState<1 | 2>(1);
  const [newDeptHeadForm, setNewDeptHeadForm] = useState<Partial<Employee>>({});
  const [createdDepartmentId, setCreatedDepartmentId] = useState<string>("");

  // Get management roles only (active)
  const managementRoles = useMemo(() =>
    roles.filter(r => r.activeStatus && r.roleType === "Management"),
    [roles]
  );

  // Get employees who can be managers (active, with management roles)
  const existingManagers = useMemo(() =>
    employees.filter(emp => {
      const role = roles.find(r => r.id === emp.roleId);
      const status = statusMaster.find(s => s.id === emp.statusId);
      return status?.statusName === "Active" && role?.roleType === "Management";
    }),
    [employees, roles, statusMaster]
  );

  // Get employees available for mapping (not yet mapped to the selected manager)
  const availableEmployeesForMapping = useMemo(() => {
    const managerId = createdManagerId || newManagerForm.id;
    const activeStatusId = statusMaster.find(s => s.statusName === "Active")?.id;
    if (!managerId) return employees.filter(e => e.statusId === activeStatusId);

    const alreadyMappedIds = reportingManagers
      .filter(rm => rm.managerId === managerId)
      .map(rm => rm.employeeId);

    return employees.filter(e =>
      e.statusId === activeStatusId &&
      e.id !== managerId &&
      !alreadyMappedIds.includes(e.id)
    );
  }, [employees, createdManagerId, newManagerForm.id, reportingManagers, statusMaster]);

  // ============= EMPLOYEE HANDLERS =============

  // Use context helper functions (aliased for backwards compatibility)
  const getRoleName = getRoleNameById;
  const getDepartmentName = getDepartmentNameById;
  const getStatusName = getStatusNameById;

  const employeeColumns: Column<Employee>[] = [
    { key: "employeeId", header: "ID", className: "w-24" },
    {
      key: "fullName",
      header: "Name",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "roleId",
      header: "Role",
      render: (value) => (
        <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
          {getRoleName(String(value))}
        </span>
      ),
    },
    {
      key: "departmentId",
      header: "Department",
      render: (value) => getDepartmentName(String(value))
    },
    {
      key: "accountStatus",
      header: "Status",
      render: (value) => {
        const isActive = Boolean(value);
        return (
          <StatusBadge
            status={isActive ? "active" : "inactive"}
            label={isActive ? "Active" : "Disabled"}
            pulse={isActive}
          />
        );
      },
    },
    {
      key: "trackingEnabled",
      header: "GPS",
      render: (value) => (
        <span className={value ? "text-success font-medium" : "text-muted-foreground"}>
          {value ? "Enabled" : "Disabled"}
        </span>
      ),
    },
    {
      key: "workMode",
      header: "Work Mode",
      render: (value) => (
        <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium">
          {String(value)}
        </span>
      ),
    },
  ];

  const handleEmployeeCreate = () => {
    // Get the first active status (usually "Active") as default
    const defaultStatusId = activeStatuses.find(s => s.statusName === "Active")?.id || activeStatuses[0]?.id || "";

    setEmployeeForm({
      fullName: "",
      email: "",
      mobileNumber: "",
      password: "",
      roleId: "",
      departmentId: "",
      designation: "",
      reportingManager: "",
      employmentType: "Full-time",
      workMode: "Office",
      joiningDate: "",
      trackingEnabled: false,
      attendanceRequired: true,
      taskAssignmentAllowed: true,
      statusId: defaultStatusId,
      accountStatus: true,
    });
    setSelectedEmployee(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEmployeeView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEmployeeEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm(employee);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleEmployeeDelete = async (employee: Employee) => {
    if (confirm(`Are you sure you want to delete ${employee.fullName}?`)) {
      try {
        const response = await fetch(`/api/employees/${employee.id}/`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
        } else {
          console.error("Failed to delete employee", await response.text());
          alert("Failed to delete employee from backend.");
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error while trying to delete.");
      }
    }
  };

  const handleEmployeeSave = async () => {
    setIsSaving(true);
    const payload: any = { ...employeeForm };
    if (!payload.roleId) delete payload.roleId;
    if (!payload.departmentId) delete payload.departmentId;
    if (!payload.statusId) delete payload.statusId;

    if (!payload.designation) payload.designation = "Employee";
    if (!payload.password) payload.password = "lovableops123";

    if (modalMode === "create") {
      try {
        const response = await fetch(`/api/employees/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const savedEmployee = await response.json();
          setEmployees((prev) => [...prev, savedEmployee]);
          setIsModalOpen(false);
        } else {
          const errorData = await response.json();
          console.error("Backend Error:", errorData);
          alert("Error saving employee to backend: " + JSON.stringify(errorData));
        }
      } catch (error) {
        console.error("Network Error:", error);
        alert("Network Error: Ensure Django server is running.");
      } finally {
        setIsSaving(false);
      }
    } else if (modalMode === "edit" && selectedEmployee) {
      try {
        const response = await fetch(`/api/employees/${selectedEmployee.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const updatedEmployee = await response.json();
          setEmployees((prev) =>
            prev.map((e) => (e.id === selectedEmployee.id ? updatedEmployee : e))
          );
          setIsModalOpen(false);
        } else {
          const errorData = await response.json();
          console.error("Backend Error:", errorData);
          alert("Error updating employee: " + JSON.stringify(errorData));
        }
      } catch (error) {
        console.error("Network Error:", error);
        alert("Network Error: Ensure Django server is running.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // ============= ROLE HANDLERS =============

  const roleColumns: Column<Role>[] = [
    { key: "roleCode", header: "Code", className: "w-24" },
    { key: "roleName", header: "Role Name" },
    {
      key: "roleType",
      header: "Type",
      render: (value) => (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${value === "Management" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
          }`}>
          {String(value)}
        </span>
      ),
    },
    { key: "defaultDashboard", header: "Default Dashboard" },
    {
      key: "rolePriority",
      header: "Priority",
      render: (value) => (
        <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium">
          {String(value)}
        </span>
      ),
    },
    {
      key: "activeStatus",
      header: "Status",
      render: (value) => (
        <StatusBadge status={value ? "active" : "inactive"} pulse={value as boolean} />
      ),
    },
  ];

  const handleRoleCreate = () => {
    setRoleForm({
      roleName: "",
      roleCode: "",
      roleType: "Execution",
      defaultDashboard: "",
      rolePriority: 50,
      activeStatus: true,
    });
    setSelectedRole(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleRoleView = (role: Role) => {
    setSelectedRole(role);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleRoleEdit = (role: Role) => {
    setSelectedRole(role);
    setRoleForm(role);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleRoleDelete = async (role: Role) => {
    // Check if role is assigned to any employee
    const assignedEmployees = employees.filter(emp => emp.roleId === role.id);

    if (assignedEmployees.length > 0) {
      alert(`Cannot delete "${role.roleName}" role. It is currently assigned to ${assignedEmployees.length} employee(s): ${assignedEmployees.map(e => e.fullName).join(", ")}`);
      return;
    }

    if (confirm(`Are you sure you want to delete ${role.roleName}?`)) {
      try {
        const res = await fetch(`/api/roles/${role.id}/`, { method: 'DELETE' });
        if (res.ok) setRoles((prev) => prev.filter((r) => r.id !== role.id));
        else alert("Failed to delete role.");
      } catch { alert("Network error."); }
    }
  };

  const handleRoleSave = async () => {
    const payload: any = { ...roleForm };
    if (!payload.roleCode) payload.roleCode = roleForm.roleName?.toUpperCase().replace(/\s+/g, "_").slice(0, 10) || "";

    if (modalMode === "create") {
      try {
        const res = await fetch(`/api/roles/`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (res.ok) { const saved = await res.json(); setRoles((prev) => [...prev, saved]); setIsModalOpen(false); }
        else { const err = await res.json(); alert("Error: " + JSON.stringify(err)); }
      } catch { alert("Network error."); }
    } else if (modalMode === "edit" && selectedRole) {
      try {
        const res = await fetch(`/api/roles/${selectedRole.id}/`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (res.ok) { const updated = await res.json(); setRoles((prev) => prev.map((r) => r.id === selectedRole.id ? updated : r)); setIsModalOpen(false); }
        else { const err = await res.json(); alert("Error: " + JSON.stringify(err)); }
      } catch { alert("Network error."); }
    }
  };

  // ============= ROLE PERMISSIONS HANDLERS =============

  const permissionColumns: Column<RolePermission>[] = [
    { key: "roleName", header: "Role" },
    { key: "module", header: "Module" },
    {
      key: "view",
      header: "View",
      render: (value) => value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
    {
      key: "create",
      header: "Create",
      render: (value) => value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
    {
      key: "edit",
      header: "Edit",
      render: (value) => value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
    {
      key: "delete",
      header: "Delete",
      render: (value) => value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
    {
      key: "approve",
      header: "Approve",
      render: (value) => value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
    {
      key: "export",
      header: "Export",
      render: (value) => value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
  ];

  const handlePermissionCreate = () => {
    setPermissionForm({
      roleId: "",
      roleName: "",
      module: "",
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: false,
    });
    setSelectedPermission(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handlePermissionView = (permission: RolePermission) => {
    setSelectedPermission(permission);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handlePermissionEdit = (permission: RolePermission) => {
    setSelectedPermission(permission);
    setPermissionForm(permission);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handlePermissionDelete = async (permission: RolePermission) => {
    if (confirm(`Are you sure you want to delete this permission?`)) {
      try {
        const res = await fetch(`/api/role-permissions/${permission.id}/`, { method: 'DELETE' });
        if (res.ok) {
          setRolePermissions((prev) => prev.filter((p) => p.id !== permission.id));
        } else {
          alert("Failed to delete permission.");
        }
      } catch {
        alert("Network error.");
      }
    }
  };

  const handlePermissionSave = async () => {
    if (modalMode === "create") {
      const selectedRole = roles.find(r => r.id === permissionForm.roleId);
      const payload = {
        ...permissionForm,
        roleName: selectedRole?.roleName || "",
      };
      try {
        const res = await fetch(`/api/role-permissions/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const saved = await res.json();
          setRolePermissions((prev) => [...prev, saved]);
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert("Error: " + JSON.stringify(err));
        }
      } catch {
        alert("Network error.");
      }
    } else if (modalMode === "edit" && selectedPermission) {
      try {
        const res = await fetch(`/api/role-permissions/${selectedPermission.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(permissionForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setRolePermissions((prev) =>
            prev.map((p) => (p.id === selectedPermission.id ? updated : p))
          );
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert("Error: " + JSON.stringify(err));
        }
      } catch {
        alert("Network error.");
      }
    }
  };

  // ============= REPORTING MANAGER HANDLERS =============

  const reportingColumns: Column<ReportingManager>[] = [
    { key: "employeeName", header: "Employee" },
    { key: "managerName", header: "Manager" },
    {
      key: "reportingType",
      header: "Type",
      render: (value) => (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${value === "Direct" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
          {String(value)}
        </span>
      ),
    },
    { key: "effectiveFrom", header: "From" },
    { key: "effectiveTo", header: "To" },
    { key: "visibilityScope", header: "Scope" },
    {
      key: "overrideAccess",
      header: "Override",
      render: (value) => value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground" />,
    },
  ];

  const handleReportingCreate = () => {
    // Reset wizard state
    setReportingWizardStep(1);
    setCreatedManagerId("");
    const defaultStatusId = activeStatuses.find(s => s.statusName === "Active")?.id || activeStatuses[0]?.id || "";

    setNewManagerForm({
      employeeId: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      fullName: "",
      email: "",
      mobileNumber: "",
      roleId: "",
      departmentId: "",
      designation: "",
      reportingManager: "",
      employmentType: "Full-time",
      workMode: "Office",
      joiningDate: new Date().toISOString().split("T")[0],
      trackingEnabled: true,
      attendanceRequired: true,
      taskAssignmentAllowed: true,
      statusId: defaultStatusId,
      accountStatus: true,
    });
    setEmployeeMappings([]);
    setSelectedReporting(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleReportingView = (reporting: ReportingManager) => {
    setSelectedReporting(reporting);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleReportingEdit = (reporting: ReportingManager) => {
    setSelectedReporting(reporting);
    setReportingForm(reporting);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleReportingDelete = async (reporting: ReportingManager) => {
    if (confirm(`Are you sure you want to delete this mapping?`)) {
      try {
        const res = await fetch(`/api/reporting-managers/${reporting.id}/`, { method: 'DELETE' });
        if (res.ok) {
          setReportingManagers((prev) => prev.filter((r) => r.id !== reporting.id));

          // Clear employee's reportingManager field on both frontend and backend
          setEmployees(prev => prev.map(emp => {
            if (emp.id === reporting.employeeId) {
              fetch(`/api/employees/${emp.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportingManager: null })
              });
              return { ...emp, reportingManager: "" };
            }
            return emp;
          }));
        } else {
          alert("Failed to delete mapping.");
        }
      } catch {
        alert("Network error.");
      }
    }
  };

  // Step 1: Create or select manager
  const handleCreateManager = async () => {
    if (!newManagerForm.fullName || !newManagerForm.email || !newManagerForm.roleId) {
      alert("Please fill in required fields: Full Name, Email, and Role");
      return;
    }

    const payload: any = { ...newManagerForm };
    if (!payload.roleId) delete payload.roleId;
    if (!payload.departmentId) delete payload.departmentId;
    if (!payload.statusId) delete payload.statusId;

    if (!payload.designation) payload.designation = "Manager";
    if (!payload.password) payload.password = "lovableops123";

    try {
      const response = await fetch(`/api/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedEmployee = await response.json();
        setEmployees((prev) => [...prev, savedEmployee]);
        setCreatedManagerId(savedEmployee.id);
        setNewManagerForm(savedEmployee);

        // Move to step 2
        setReportingWizardStep(2);
      } else {
        const errorData = await response.json();
        console.error("Backend Error:", errorData);
        alert("Error creating manager: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Network Error: Ensure Django server is running.");
    }
  };

  const handleSelectExistingManager = (managerId: string) => {
    setCreatedManagerId(managerId);
    const manager = employees.find(e => e.id === managerId);
    if (manager) {
      setNewManagerForm(manager);
    }
    setReportingWizardStep(2);
  };

  // Add employee to mapping
  const handleAddEmployeeMapping = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    // Check if already added
    if (employeeMappings.some(m => m.employeeId === employeeId)) {
      alert("This employee is already added to the mapping list");
      return;
    }

    setEmployeeMappings(prev => [...prev, {
      employeeId: employee.id,
      employeeName: employee.fullName,
      reportingType: "Direct",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: "",
      visibilityScope: "Team",
      overrideAccess: false,
    }]);
  };

  // Remove employee from mapping
  const handleRemoveEmployeeMapping = (employeeId: string) => {
    setEmployeeMappings(prev => prev.filter(m => m.employeeId !== employeeId));
  };

  // Update mapping settings
  const handleUpdateMapping = (employeeId: string, field: keyof EmployeeMapping, value: unknown) => {
    setEmployeeMappings(prev => prev.map(m =>
      m.employeeId === employeeId ? { ...m, [field]: value } : m
    ));
  };

  // Save all mappings
  const handleSaveReportingMappings = async () => {
    if (employeeMappings.length === 0) {
      alert("Please add at least one employee to map");
      return;
    }

    const managerId = createdManagerId;
    const manager = employees.find(e => e.id === managerId);
    if (!manager) {
      alert("Manager not found");
      return;
    }

    try {
      const savedMappings: ReportingManager[] = [];
      for (const mapping of employeeMappings) {
        const payload = {
          employeeId: mapping.employeeId,
          employeeName: mapping.employeeName,
          managerId: managerId,
          managerName: manager.fullName,
          reportingType: mapping.reportingType,
          effectiveFrom: mapping.effectiveFrom,
          effectiveTo: mapping.effectiveTo || null,
          visibilityScope: mapping.visibilityScope,
          overrideAccess: mapping.overrideAccess,
        };
        const res = await fetch(`/api/reporting-managers/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const saved = await res.json();
          savedMappings.push(saved);
        }
      }

      setReportingManagers(prev => [...prev, ...savedMappings]);

      // Update employee reportingManager field on both frontend and backend
      setEmployees(prev => prev.map(emp => {
        const mapping = employeeMappings.find(m => m.employeeId === emp.id);
        if (mapping) {
          fetch(`/api/employees/${emp.id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportingManager: manager.id })
          });
          return { ...emp, reportingManager: manager.id };
        }
        return emp;
      }));

      setIsModalOpen(false);

      // Reset wizard
      setReportingWizardStep(1);
      setCreatedManagerId("");
      setNewManagerForm({});
      setEmployeeMappings([]);
    } catch {
      alert("Error saving reporting mappings.");
    }
  };

  // Handle edit save for individual mapping
  const handleReportingSave = async () => {
    if (modalMode === "edit" && selectedReporting) {
      try {
        const res = await fetch(`/api/reporting-managers/${selectedReporting.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportingForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setReportingManagers((prev) =>
            prev.map((r) => (r.id === selectedReporting.id ? updated : r))
          );
          setIsModalOpen(false);
        } else {
          alert("Failed to save mapping.");
        }
      } catch {
        alert("Network error.");
      }
    }
    setIsModalOpen(false);
  };

  // Check if manager can be deleted
  const canDeleteManager = (employeeId: string): boolean => {
    return !reportingManagers.some(rm => rm.managerId === employeeId);
  };

  // Override employee delete to check for manager mappings
  const handleEmployeeDeleteWithCheck = (employee: Employee) => {
    if (!canDeleteManager(employee.id)) {
      const mappedCount = reportingManagers.filter(rm => rm.managerId === employee.id).length;
      alert(`Cannot delete "${employee.fullName}". This employee is a manager with ${mappedCount} employee(s) mapped. Please remove the reporting relationships first.`);
      return;
    }
    handleEmployeeDelete(employee);
  };

  // ============= DEPARTMENT HANDLERS =============

  const departmentColumns: Column<Department>[] = [
    { key: "departmentCode", header: "Code", className: "w-24" },
    { key: "departmentName", header: "Name" },
    { key: "parentDepartment", header: "Parent" },
    { key: "departmentHead", header: "Head" },
    {
      key: "trackingEnabled",
      header: "Tracking",
      render: (value) => (
        <span className={value ? "text-success font-medium" : "text-muted-foreground"}>
          {value ? "Enabled" : "Disabled"}
        </span>
      ),
    },
    {
      key: "kpiCategory",
      header: "KPI",
      render: (value) => (
        <div className="flex gap-1 flex-wrap">
          {(value as string[]).map((kpi, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{kpi}</span>
          ))}
        </div>
      ),
    },
    {
      key: "activeStatus",
      header: "Status",
      render: (value) => (
        <StatusBadge status={value ? "active" : "inactive"} pulse={value as boolean} />
      ),
    },
  ];

  const handleDepartmentCreate = () => {
    setDepartmentWizardStep(1);
    setCreatedDepartmentId("");
    setDepartmentForm({
      departmentName: "",
      departmentCode: "",
      parentDepartmentId: "",
      departmentHeadId: "",
      trackingEnabled: true,
      kpiCategory: [],
      activeStatus: true,
    });
    const defaultStatusId = activeStatuses.find(s => s.statusName === "Active")?.id || activeStatuses[0]?.id || "";

    setNewDeptHeadForm({
      employeeId: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      fullName: "",
      email: "",
      mobileNumber: "",
      roleId: "",
      departmentId: "",
      designation: "",
      reportingManager: "",
      employmentType: "Full-time",
      workMode: "Office",
      joiningDate: new Date().toISOString().split("T")[0],
      trackingEnabled: true,
      attendanceRequired: true,
      taskAssignmentAllowed: true,
      statusId: defaultStatusId,
      accountStatus: true,
    });
    setSelectedDepartment(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDepartmentView = (dept: Department) => {
    setSelectedDepartment(dept);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleDepartmentEdit = (dept: Department) => {
    setSelectedDepartment(dept);
    setDepartmentForm(dept);
    setDepartmentWizardStep(1);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDepartmentDelete = async (dept: Department) => {
    const assignedEmployees = employees.filter(emp => emp.departmentId === dept.id);
    if (assignedEmployees.length > 0) {
      alert(`Cannot delete "${dept.departmentName}" department. It has ${assignedEmployees.length} employee(s) assigned.`);
      return;
    }
    if (confirm(`Are you sure you want to delete ${dept.departmentName}?`)) {
      try {
        const res = await fetch(`/api/departments/${dept.id}/`, { method: 'DELETE' });
        if (res.ok) setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
        else alert("Failed to delete department.");
      } catch { alert("Network error."); }
    }
  };

  // Step 1: Save department basics and move to step 2
  const handleDepartmentStep1Complete = async () => {
    if (!departmentForm.departmentName?.trim()) {
      alert("Please enter a department name");
      return;
    }

    const payload = {
      departmentName: departmentForm.departmentName,
      departmentCode: departmentForm.departmentName?.toUpperCase().replace(/\s+/g, "_").slice(0, 10) || "",
      departmentHeadId: "",
      trackingEnabled: departmentForm.trackingEnabled || false,
      kpiCategory: departmentForm.kpiCategory || [],
      activeStatus: departmentForm.activeStatus ?? true,
    };

    try {
      const res = await fetch(`/api/departments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setDepartments((prev) => [...prev, saved]);
        setCreatedDepartmentId(saved.id);
        setNewDeptHeadForm(prev => ({ ...prev, departmentId: saved.id }));
        setDepartmentWizardStep(2);
      } else {
        const err = await res.json();
        alert("Error creating department: " + JSON.stringify(err));
      }
    } catch {
      alert("Network error.");
    }
  };

  // Select existing manager as department head
  const handleSelectDeptHead = (managerId: string) => {
    if (!createdDepartmentId) return;

    setDepartments(prev => prev.map(d =>
      d.id === createdDepartmentId
        ? { ...d, departmentHeadId: managerId }
        : d
    ));

    // Update form state
    setDepartmentForm(prev => ({ ...prev, departmentHeadId: managerId }));
  };

  // Create new department head
  const handleCreateDeptHead = async () => {
    if (!newDeptHeadForm.fullName?.trim() || !newDeptHeadForm.email?.trim() || !newDeptHeadForm.roleId) {
      alert("Please fill in all required fields for the department head");
      return;
    }

    const defaultEmpId = `EMP${String(employees.length + 1).padStart(3, "0")}`;
    const payload = {
      ...newDeptHeadForm,
      employeeId: defaultEmpId,
      departmentId: createdDepartmentId,
    };

    try {
      const res = await fetch(`/api/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setEmployees(prev => [...prev, saved]);
        if (createdDepartmentId) {
          setDepartments(prev => prev.map(d =>
            d.id === createdDepartmentId
              ? { ...d, departmentHeadId: saved.id }
              : d
          ));
        }
        setDepartmentForm(prev => ({ ...prev, departmentHeadId: saved.id }));
      } else {
        const err = await res.json();
        alert("Error creating department head: " + JSON.stringify(err));
      }
    } catch {
      alert("Network error.");
    }
  };

  // Final save for department wizard
  const handleDepartmentWizardComplete = async () => {
    if (createdDepartmentId && departmentForm.departmentHeadId) {
      try {
        await fetch(`/api/departments/${createdDepartmentId}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ departmentHeadId: departmentForm.departmentHeadId }),
        });
      } catch { }
    }
    setIsModalOpen(false);
    setDepartmentWizardStep(1);
    setCreatedDepartmentId("");
  };

  const handleDepartmentSave = async () => {
    if (modalMode === "edit" && selectedDepartment) {
      try {
        const res = await fetch(`/api/departments/${selectedDepartment.id}/`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(departmentForm),
        });
        if (res.ok) { const updated = await res.json(); setDepartments((prev) => prev.map((d) => d.id === selectedDepartment.id ? updated : d)); setIsModalOpen(false); }
        else { const err = await res.json(); alert("Error: " + JSON.stringify(err)); }
      } catch { alert("Network error."); }
    }
  };

  // ============= STATUS MASTER HANDLERS =============

  const statusColumns: Column<StatusMaster>[] = [
    {
      key: "statusName",
      header: "Status Name",
      render: (value) => (
        <span className="font-medium">{String(value)}</span>
      ),
    },
    {
      key: "tracking",
      header: "Tracking",
      render: (value) => (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}>
          {value ? "ON" : "OFF"}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (value) => (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${value === "All" ? "bg-blue-100 text-blue-700" :
          value === "Manager Only" ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"
          }`}>
          {String(value)}
        </span>
      ),
    },
    {
      key: "activeStatus",
      header: "Active",
      render: (value, row) => (
        <Switch
          checked={value as boolean}
          onCheckedChange={(checked) => handleStatusToggle(row.id, checked)}
        />
      ),
    },
  ];

  const handleStatusCreate = () => {
    // Check for duplicate status name
    setStatusForm({
      statusName: "",
      tracking: true,
      visibility: "All",
      activeStatus: true,
    });
    setSelectedStatus(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleStatusView = (status: StatusMaster) => {
    setSelectedStatus(status);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleStatusEdit = (status: StatusMaster) => {
    setSelectedStatus(status);
    setStatusForm(status);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleStatusToggle = (statusId: string, checked: boolean) => {
    setStatusMaster((prev) =>
      prev.map((s) => (s.id === statusId ? { ...s, activeStatus: checked } : s))
    );
  };

  const handleStatusSave = async () => {
    const duplicateCheck = statusMaster.find(
      s => s.statusName.toLowerCase() === (statusForm.statusName || "").toLowerCase()
        && s.id !== selectedStatus?.id
    );
    if (duplicateCheck) { alert("Status name already exists."); return; }

    if (modalMode === "create") {
      try {
        const res = await fetch(`/api/status-masters/`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statusForm),
        });
        if (res.ok) { const saved = await res.json(); setStatusMaster((prev) => [...prev, saved]); setIsModalOpen(false); }
        else { const err = await res.json(); alert("Error: " + JSON.stringify(err)); }
      } catch { alert("Network error."); }
    } else if (modalMode === "edit" && selectedStatus) {
      try {
        const res = await fetch(`/api/status-masters/${selectedStatus.id}/`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statusForm),
        });
        if (res.ok) { const updated = await res.json(); setStatusMaster((prev) => prev.map((s) => s.id === selectedStatus.id ? updated : s)); setIsModalOpen(false); }
        else { const err = await res.json(); alert("Error: " + JSON.stringify(err)); }
      } catch { alert("Network error."); }
    }
  };

  // ============= DISTRIBUTOR HANDLERS =============

  const distributorColumns: Column<Distributor>[] = [
    { key: "distributorId", header: "ID", className: "w-24" },
    {
      key: "firmName",
      header: "Firm Name",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.firmName}</p>
            <p className="text-xs text-muted-foreground">{row.proprietorName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "mobileNumber",
      header: "Contact",
      render: (_, row) => (
        <div>
          <p className="text-sm">{row.mobileNumber}</p>
          <p className="text-xs text-muted-foreground">{row.emailAddress}</p>
        </div>
      ),
    },
    {
      key: "licenses",
      header: "Licenses",
      render: (_, row) => (
        <div className="flex gap-1 flex-wrap">
          {row.seedLicenseNo && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Seed</span>}
          {row.fertiliserLicenseNo && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Fertiliser</span>}
          {row.pesticideLicenseNo && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Pesticide</span>}
        </div>
      ),
    },
    {
      key: "godownSpace",
      header: "Infrastructure",
      render: (_, row) => (
        <div>
          <p className="text-sm">{row.godownSpace} sq ft</p>
          <p className="text-xs text-muted-foreground">{row.deliveryVehicles} vehicles</p>
        </div>
      ),
    },
    {
      key: "numberOfRetailers",
      header: "Retailers",
      render: (value) => (
        <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium">
          {value as number} attached
        </span>
      ),
    },
    {
      key: "activeStatus",
      header: "Status",
      render: (value) => (
        <StatusBadge status={value ? "active" : "inactive"} pulse={value as boolean} />
      ),
    },
  ];

  const handleDistributorCreate = () => {
    setDistributorForm({
      distributorId: `DIST${String(distributors.length + 1).padStart(3, "0")}`,
      firmName: "",
      proprietorName: "",
      mobileNumber: "",
      emailAddress: "",
      panProprietor: "",
      panFirm: "",
      gstNumber: "",
      dateOfBirth: "",
      marriageAnniversary: "",
      officeAddress: "",
      currentAddress: "",
      permanentAddress: "",
      district: "",
      state: "",
      pincode: "",
      typeOfFirm: "Sole Proprietor",
      distributorProfile: { wholesalerPercent: 50, retailerPercent: 50 },
      yearsOfEstablishment: 0,
      yearsOfExperience: 0,
      topCompaniesAssociated: [],
      pesticideLicenseNo: "",
      seedLicenseNo: "",
      fertiliserLicenseNo: "",
      pesticideLicenseExpiry: "",
      seedLicenseExpiry: "",
      fertiliserLicenseExpiry: "",
      godownSpace: 0,
      shopSpace: 0,
      housePropertyOwned: false,
      computerAvailable: false,
      internetAvailable: false,
      deliveryVehicles: 0,
      salesmenAvailable: 0,
      bankName: "",
      accountNumber: "",
      accountType: "Saving",
      bankLimitCC: 0,
      otherLoans: "",
      totalFundsEmployed: 0,
      ownInvestment: 0,
      preferredTransporters: [],
      depotLocation: "",
      attachedRetailersList: "",
      numberOfRetailers: 0,
      declarationAccepted: false,
      proprietorSignature: "",
      witnessDetails: { name: "", address: "", mobile: "" },
      submittedBy: { name: "", signature: "" },
      forwardedBy: { name: "", signature: "" },
      approvedBy: { name: "", signature: "" },
      activeStatus: true,
    });
    setSelectedDistributor(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDistributorView = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleDistributorEdit = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setDistributorForm(distributor);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDistributorDelete = async (distributor: Distributor) => {
    if (confirm(`Are you sure you want to delete ${distributor.firmName}?`)) {
      try {
        const res = await fetch(`/api/crm/distributors/${distributor.id}/`, { method: 'DELETE' });
        if (res.ok) {
          setDistributors((prev) => prev.filter((d) => d.id !== distributor.id));
        } else {
          alert("Failed to delete distributor.");
        }
      } catch {
        alert("Network error.");
      }
    }
  };

  const handleDistributorSave = async () => {
    if (modalMode === "create") {
      try {
        const res = await fetch(`/api/crm/distributors/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(distributorForm),
        });
        if (res.ok) {
          const saved = await res.json();
          setDistributors((prev) => [...prev, saved]);
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert("Error: " + JSON.stringify(err));
        }
      } catch {
        alert("Network error.");
      }
    } else if (modalMode === "edit" && selectedDistributor) {
      try {
        const res = await fetch(`/api/crm/distributors/${selectedDistributor.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(distributorForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setDistributors((prev) =>
            prev.map((d) => (d.id === selectedDistributor.id ? updated : d))
          );
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert("Error: " + JSON.stringify(err));
        }
      } catch {
        alert("Network error.");
      }
    }
  };

  // ============= SITE HANDLERS =============

  const siteColumns: Column<Site>[] = [
    { key: "id", header: "Site ID", render: (val) => String(val).substring(0, 8) },
    { key: "organization", header: "Organization ID", render: (val) => String(val || "-") },
    { key: "name", header: "Site / Project" },
    { key: "address", header: "Address", render: (val) => String(val || "-") },
    { key: "productType", header: "Product Type", render: (val) => val ? <span className="px-2 py-1 bg-muted/60 rounded-full text-xs">{String(val)}</span> : "-" },
    { key: "contactName", header: "Contact", render: (val) => String(val || "-") },
    { key: "id", header: "Total Users", render: (val, row) => employees.filter(e => e.siteId === row.id).length },
    { key: "status", header: "Status", render: (val) => <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">{String(val)}</span> },
    { key: "createdAt", header: "Created Date & Time", render: (val) => val ? new Date(String(val)).toLocaleString() : "-" },
  ];

  const handleSiteCreate = () => {
    setSiteForm({ name: "", address: "" });
    setSelectedSite(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleSiteEdit = (site: Site) => {
    setSelectedSite(site);
    setSiteForm(site);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSiteDelete = async (site: Site) => {
    if (confirm(`Delete site ${site.name}?`)) {
      try {
        const res = await fetch(`/api/sites/${site.id}/`, { method: 'DELETE' });
        if (res.ok) setSites(prev => prev.filter(s => s.id !== site.id));
      } catch { alert("Network error"); }
    }
  };

  const handleSiteSave = async () => {
    if (modalMode === "create") {
      const res = await fetch(`/api/sites/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(siteForm),
      });
      if (res.ok) { const s = await res.json(); setSites(prev => [...prev, s]); setIsModalOpen(false); }
    } else if (modalMode === "edit" && selectedSite) {
      const res = await fetch(`/api/sites/${selectedSite.id}/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(siteForm),
      });
      if (res.ok) { const s = await res.json(); setSites(prev => prev.map(old => old.id === s.id ? s : old)); setIsModalOpen(false); }
    }
  };


  // ============= GET MODAL CONTENT =============

  const getModalTitle = () => {
    if (activeMaster === "reporting-manager" && modalMode === "create") {
      return reportingWizardStep === 1 ? "Step 1: Setup Reporting Manager" : "Step 2: Map Employees";
    }
    const prefix = modalMode === "create" ? "Add" : modalMode === "edit" ? "Edit" : "View";
    switch (activeMaster) {
      case "employees": return `${prefix} Employee`;
      case "roles": return `${prefix} Role`;
      case "role-permissions": return `${prefix} Permission`;
      case "reporting-manager": return `${prefix} Reporting`;
      case "departments": return `${prefix} Department`;
      case "status": return `${prefix} Status`;
      case "distributors": return `${prefix} Distributor`;
      case "sites": return `${prefix} Site`;
      default: return "";
    }
  };

  const getModalSubtitle = () => {
    if (activeMaster === "reporting-manager" && modalMode === "create") {
      return reportingWizardStep === 1
        ? "Create a new manager or select an existing one"
        : "Map employees to this manager";
    }
    return modalMode === "view" ? "View details" : "Fill in the information";
  };

  const handleSave = () => {
    switch (activeMaster) {
      case "employees": handleEmployeeSave(); break;
      case "roles": handleRoleSave(); break;
      case "role-permissions": handlePermissionSave(); break;
      case "reporting-manager": handleReportingSave(); break;
      case "departments": handleDepartmentSave(); break;
      case "status": handleStatusSave(); break;
      case "distributors": handleDistributorSave(); break;
      case "sites": handleSiteSave(); break;
    }
  };

  const handleCreate = () => {
    switch (activeMaster) {
      case "employees": handleEmployeeCreate(); break;
      case "roles": handleRoleCreate(); break;
      case "role-permissions": handlePermissionCreate(); break;
      case "reporting-manager": handleReportingCreate(); break;
      case "departments": handleDepartmentCreate(); break;
      case "status": handleStatusCreate(); break;
      case "distributors": handleDistributorCreate(); break;
      case "sites": handleSiteCreate(); break;
    }
  };

  // ============= RENDER =============

  return (
    <div className="space-y-6">
      {/* Master Type Tabs */}
      <div className="glass-card p-2 flex flex-wrap gap-2">
        {visibleMasters.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMaster === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMaster(tab.id as MasterType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                ? "bg-primary text-primary-foreground shadow-lg"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeMaster}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* EMPLOYEES */}
        {activeMaster === "employees" && (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Employee Master</h2>
                <p className="text-muted-foreground">
                  Manage all employees, their roles, and GPS tracking settings
                </p>
              </div>
              {canCreate && (
                <Button onClick={handleEmployeeCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Employee
                </Button>
              )}
            </div>

            <DataTable
              data={employees}
              columns={employeeColumns}
              onView={handleEmployeeView}
              onEdit={canEdit ? handleEmployeeEdit : undefined}
              onDelete={canDelete ? handleEmployeeDeleteWithCheck : undefined}
              showExport={canExport}
              searchPlaceholder="Search employees..."
            />
          </>
        )}

        {/* ROLES */}
        {activeMaster === "roles" && (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Role Master</h2>
                <p className="text-muted-foreground">
                  Manage roles, their priorities, and default dashboards
                </p>
              </div>
              {canCreate && (
                <Button onClick={handleRoleCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Role
                </Button>
              )}
            </div>

            <DataTable
              data={roles}
              columns={roleColumns}
              onView={handleRoleView}
              onEdit={canEdit ? handleRoleEdit : undefined}
              onDelete={canDelete ? handleRoleDelete : undefined}
              showExport={canExport}
              searchPlaceholder="Search roles..."
            />
          </>
        )}

        {/* ROLE PERMISSIONS */}
        {activeMaster === "role-permissions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Role Permissions</h2>
                <p className="text-muted-foreground">
                  Manage all module permissions for a specific role
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-end mb-6 pb-6 border-b border-border/50">
                <div className="flex-1 w-full md:max-w-md">
                  <Label className="mb-2 block font-medium">Select Role to Manage</Label>
                  <Select value={selectedRoleForGrid} onValueChange={setSelectedRoleForGrid}>
                    <SelectTrigger className="bg-background h-10">
                      <SelectValue placeholder="Choose a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoleForGrid && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => handleGridBulkAction('enableAll')}
                      className="text-success border-success/30 hover:bg-success/10"
                    >
                      <Check className="w-4 h-4 mr-2" /> Select All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGridBulkAction('disableAll')}
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4 mr-2" /> Clear All
                    </Button>
                    <Button
                      onClick={handleSaveGridPermissions}
                      disabled={isSavingGrid}
                      className="bg-primary"
                    >
                      {isSavingGrid ? "Saving..." : "Save Mapping"}
                    </Button>
                  </div>
                )}
              </div>

              {selectedRoleForGrid ? (
                <div className="relative overflow-auto max-h-[60vh] rounded-lg border border-border/50">
                  <AnimatePresence>
                    {showSuccessAnimation && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm"
                      >
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", damping: 15 }}
                          className="bg-green-500/10 text-green-600 dark:text-green-400 flex flex-col items-center justify-center p-8 rounded-2xl border border-green-500/20 shadow-xl"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="bg-green-500 text-white p-3 rounded-full mb-4 shadow-lg"
                          >
                            <Check className="w-8 h-8" />
                          </motion.div>
                          <h3 className="text-xl font-bold mb-1">Permissions Saved!</h3>
                          <p className="text-sm opacity-80">The mappings have been successfully updated.</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/95 backdrop-blur-sm text-muted-foreground uppercase text-xs sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Module Group</th>
                        <th className="px-4 py-3 font-semibold text-center">View</th>
                        <th className="px-4 py-3 font-semibold text-center">Create</th>
                        <th className="px-4 py-3 font-semibold text-center">Edit</th>
                        <th className="px-4 py-3 font-semibold text-center">Delete</th>
                        <th className="px-4 py-3 font-semibold text-center">Approve</th>
                        <th className="px-4 py-3 font-semibold text-center">Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {permissionModulesHierarchy.map(parent => {
                        const parentPerms = gridPermissions[parent.id] || { view: false, create: false, edit: false, delete: false, approve: false, export: false };
                        const hasSubModules = parent.subModules && parent.subModules.length > 0;
                        const isExpanded = expandedModules[parent.id];

                        return (
                          <React.Fragment key={parent.id}>
                            <tr className={`hover:bg-muted/30 transition-colors ${hasSubModules ? 'bg-muted/10' : ''}`}>
                              <td className="px-4 py-3 font-semibold text-[15px] flex items-center gap-2">
                                {hasSubModules ? (
                                  <button onClick={() => toggleExpand(parent.id)} className="p-1 hover:bg-muted rounded-md transition-colors">
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                  </button>
                                ) : (
                                  <div className="w-6" /> // spacer
                                )}
                                {parent.label}
                              </td>
                              {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).map(action => (
                                <td key={action} className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={parentPerms[action]}
                                      onCheckedChange={(checked) => handlePermissionChange(parent.id, action, !!checked)}
                                    />
                                  </div>
                                </td>
                              ))}
                            </tr>
                            
                            {/* Render Sub Modules if expanded */}
                            {hasSubModules && isExpanded && parent.subModules!.map(sub => {
                              const subPerms = gridPermissions[sub.id] || { view: false, create: false, edit: false, delete: false, approve: false, export: false };
                              return (
                                <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-4 py-2 pl-12 text-sm text-muted-foreground border-l-2 border-transparent relative">
                                    <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50"></div>
                                    <div className="absolute left-6 top-1/2 w-4 h-px bg-border/50"></div>
                                    {sub.label}
                                  </td>
                                  {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).map(action => (
                                    <td key={action} className="px-4 py-2 text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={subPerms[action]}
                                          onCheckedChange={(checked) => handlePermissionChange(sub.id, action, !!checked, parent.id)}
                                        />
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Please select a role to view and manage its permissions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTING MANAGER */}
        {activeMaster === "reporting-manager" && (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Reporting Manager Mapping</h2>
                <p className="text-muted-foreground">
                  Manage employee-manager hierarchy and reporting structure
                </p>
              </div>
              {canCreate && (
                <Button onClick={handleReportingCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Mapping
                </Button>
              )}
            </div>

            <DataTable
              data={reportingManagers}
              columns={reportingColumns}
              onView={handleReportingView}
              onEdit={canEdit ? handleReportingEdit : undefined}
              onDelete={canDelete ? handleReportingDelete : undefined}
              showExport={canExport}
              searchPlaceholder="Search mappings..."
            />
          </>
        )}

        {/* DEPARTMENTS */}
        {activeMaster === "departments" && (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Department Master</h2>
                <p className="text-muted-foreground">
                  Manage departments, heads, and KPI categories
                </p>
              </div>
              {canCreate && (
                <Button onClick={handleDepartmentCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Department
                </Button>
              )}
            </div>

            <DataTable
              data={departments}
              columns={departmentColumns}
              onView={handleDepartmentView}
              onEdit={canEdit ? handleDepartmentEdit : undefined}
              onDelete={canDelete ? handleDepartmentDelete : undefined}
              showExport={canExport}
              searchPlaceholder="Search departments..."
            />
          </>
        )}

        {/* STATUS MASTER */}
        {activeMaster === "status" && (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Status Master</h2>
                <p className="text-muted-foreground">
                  Employee lifecycle statuses and their tracking behavior
                </p>
              </div>
              {canCreate && (
                <Button onClick={handleStatusCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Status
                </Button>
              )}
            </div>

            <DataTable
              data={statusMaster}
              columns={statusColumns}
              onView={handleStatusView}
              onEdit={canEdit ? handleStatusEdit : undefined}
              showExport={canExport}
              searchPlaceholder="Search statuses..."
            />
          </>
        )}

        {/* DISTRIBUTORS */}
        {activeMaster === "distributors" && (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Distributor Master</h2>
                <p className="text-muted-foreground">
                  Manage distributors, their licenses, infrastructure, and retailer network
                </p>
              </div>
              {canCreate && (
                <Button onClick={handleDistributorCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Distributor
                </Button>
              )}
            </div>

            <DataTable
              data={distributors}
              columns={distributorColumns}
              onView={handleDistributorView}
              onEdit={canEdit ? handleDistributorEdit : undefined}
              onDelete={canDelete ? handleDistributorDelete : undefined}
              showExport={canExport}
              searchPlaceholder="Search distributors..."
            />
          </>
        )}

        {/* SITES */}
        {activeMaster === "sites" && !isModalOpen && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">Site Master</h2>
                <p className="text-muted-foreground">Manage locations and site addresses</p>
              </div>
              {canCreate && <Button onClick={handleSiteCreate}><Plus className="w-4 h-4" /> Add Site</Button>}
            </div>
            <DataTable
              data={sites}
              columns={siteColumns}
              onEdit={canEdit ? handleSiteEdit : undefined}
              onDelete={canDelete ? handleSiteDelete : undefined}
            />
          </>
        )}

        {/* SITE CREATE/EDIT FORM */}
        {activeMaster === "sites" && isModalOpen && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-2xl font-bold text-foreground">{modalMode === "create" ? "Add Site / Project" : "Edit Site / Project"}</h2>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} className="gradient-btn" disabled={isSaving}>
                  {isSaving ? "Saving..." : (modalMode === "create" ? "Create" : "Save Changes")}
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 p-6 rounded-xl overflow-y-auto space-y-6 shadow-inner border border-border">
              {/* Site Details Section */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
                <h3 className="text-base font-bold text-foreground">Site Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Site Name *</Label>
                    <Input className="border-border" value={siteForm.name || ""} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} placeholder="e.g., Corporate HQ" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Site Code *</Label>
                    <Input className="border-border" value={siteForm.siteCode || ""} onChange={(e) => setSiteForm({ ...siteForm, siteCode: e.target.value })} placeholder="e.g., CHQ-001" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Select Product</Label>
                    <Select value={siteForm.productType || ""} onValueChange={(value) => setSiteForm({ ...siteForm, productType: value })}>
                      <SelectTrigger className="border-border"><SelectValue placeholder="Select a product" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vibecopilot">Vibecopilot</SelectItem>
                        <SelectItem value="OpsHub">OpsHub</SelectItem>
                        <SelectItem value="FieldSense">FieldSense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Country</Label>
                    <Input className="border-border" value={siteForm.country || ""} onChange={(e) => setSiteForm({ ...siteForm, country: e.target.value })} placeholder="Select or type country" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Location Address</Label>
                    <textarea className="w-full min-h-[100px] p-3 text-sm rounded-md border border-border bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={siteForm.address || ""} onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })} placeholder="Enter full address..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Activate Date</Label>
                    <Input type="date" className="border-border" value={siteForm.activateDate || ""} onChange={(e) => setSiteForm({ ...siteForm, activateDate: e.target.value })} />
                  </div>
                  <div className="flex items-center justify-between space-y-0 h-full pt-6">
                    <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                    <Switch checked={siteForm.status === "Active" || !siteForm.status} onCheckedChange={(checked) => setSiteForm({ ...siteForm, status: checked ? "Active" : "Inactive" })} />
                  </div>
                </div>
              </div>

              {/* Contact Person Section */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
                <h3 className="text-base font-bold text-foreground">Contact Person</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Full Name *</Label>
                    <Input className="border-border" value={siteForm.contactName || ""} onChange={(e) => setSiteForm({ ...siteForm, contactName: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
                    <Input className="border-border" value={siteForm.contactPhone || ""} onChange={(e) => setSiteForm({ ...siteForm, contactPhone: e.target.value })} placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                    <Input type="email" className="border-border" value={siteForm.contactEmail || ""} onChange={(e) => setSiteForm({ ...siteForm, contactEmail: e.target.value })} placeholder="john.doe@example.com" />
                  </div>
                </div>
              </div>

              {/* Module Access Section */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground">Module Access</h3>
                <div className="space-y-6 p-4 rounded-xl border border-border/50 bg-muted/30">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground/90 bg-card px-2 py-1 rounded shadow-sm inline-block">Application Modules</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-2 mt-2">
                      {AVAILABLE_MODULES.map(mod => {
                        const isOrgEnabled = (() => {
                          try {
                            const orgMods = JSON.parse(sessionStorage.getItem("modulesEnabled") || "[]");
                            return orgMods.includes("All") || orgMods.includes(mod);
                          } catch { return true; }
                        })();
                        if (!isOrgEnabled) return null;
                        
                        return (
                          <label key={mod} className={`flex items-center gap-2 text-sm cursor-pointer`}>
                            <input type="checkbox" className="rounded border-input" checked={(siteForm.modulesEnabled || []).includes(mod)} onChange={(e) => {
                              const current = siteForm.modulesEnabled || [];
                              if (e.target.checked) setSiteForm({ ...siteForm, modulesEnabled: [...current, mod] });
                              else setSiteForm({ ...siteForm, modulesEnabled: current.filter(m => m !== mod) });
                            }} /> {mod}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </motion.div>

      {/* MODAL */}
      <GlassModal
        isOpen={isModalOpen && activeMaster !== "sites"}
        onClose={() => {
          setIsModalOpen(false);
          // Reset wizard on close
          if (activeMaster === "reporting-manager") {
            setReportingWizardStep(1);
            setCreatedManagerId("");
            setNewManagerForm({});
            setEmployeeMappings([]);
          }
          if (activeMaster === "departments") {
            setDepartmentWizardStep(1);
            setCreatedDepartmentId("");
            setNewDeptHeadForm({});
          }
        }}
        title={getModalTitle()}
        subtitle={getModalSubtitle()}
        size="xl"
        footerContent={
          // Department wizard footer
          activeMaster === "departments" && modalMode === "create" ? (
            <div className="flex justify-between gap-3">
              <div>
                {departmentWizardStep === 2 && (
                  <Button variant="outline" onClick={async () => {
                    // Go back - remove the created department
                    if (createdDepartmentId) {
                      try {
                        await fetch(`/api/departments/${createdDepartmentId}/`, { method: 'DELETE' });
                      } catch { }
                      setDepartments(prev => prev.filter(d => d.id !== createdDepartmentId));
                      setCreatedDepartmentId("");
                    }
                    setDepartmentWizardStep(1);
                  }}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={async () => {
                  // Cancel - clean up if department was created
                  if (createdDepartmentId) {
                    try {
                      await fetch(`/api/departments/${createdDepartmentId}/`, { method: 'DELETE' });
                    } catch { }
                    setDepartments(prev => prev.filter(d => d.id !== createdDepartmentId));
                  }
                  setIsModalOpen(false);
                  setDepartmentWizardStep(1);
                  setCreatedDepartmentId("");
                }}>
                  Cancel
                </Button>
                {departmentWizardStep === 1 ? (
                  <Button
                    onClick={handleDepartmentStep1Complete}
                    className="gradient-btn"
                    disabled={!departmentForm.departmentName?.trim()}
                  >
                    Create & Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleDepartmentWizardComplete}
                    className="gradient-btn"
                  >
                    {departmentForm.departmentHeadId ? "Complete Setup" : "Skip & Finish"}
                  </Button>
                )}
              </div>
            </div>
          ) : activeMaster === "reporting-manager" && modalMode === "create" ? (
            <div className="flex justify-between gap-3">
              <div>
                {reportingWizardStep === 2 && (
                  <Button variant="outline" onClick={() => setReportingWizardStep(1)}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                {reportingWizardStep === 1 ? (
                  <Button
                    onClick={handleCreateManager}
                    className="gradient-btn"
                    disabled={!newManagerForm.fullName || !newManagerForm.email || !newManagerForm.roleId}
                  >
                    Create & Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveReportingMappings}
                    className="gradient-btn"
                    disabled={employeeMappings.length === 0}
                  >
                    Save Mappings ({employeeMappings.length})
                  </Button>
                )}
              </div>
            </div>
          ) : modalMode !== "view" ? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gradient-btn" disabled={isSaving}>
                {isSaving ? "Saving..." : (modalMode === "create" ? "Create" : "Save Changes")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          )
        }
      >
        {/* EMPLOYEE FORM */}
        {activeMaster === "employees" && modalMode !== "view" && (
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={employeeForm.fullName || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                    placeholder="John Anderson"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={employeeForm.email || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={employeeForm.mobileNumber || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, mobileNumber: e.target.value })}
                    placeholder="+1 555-0101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={employeeForm.password || ""}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                      placeholder="Enter password for login"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for employee portal login
                  </p>
                </div>
              </div>
            </div>

            {/* Organization Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Organization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={employeeForm.roleId || ""}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, roleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeRoles.length > 0 ? (
                        activeRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.roleName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__disabled__" disabled>
                          No active roles available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Roles are managed in Role Master
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={employeeForm.departmentId || ""}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, departmentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDepartments.length > 0 ? (
                        activeDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.departmentName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__disabled__" disabled>
                          No active departments available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Departments are managed in Department Master
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={employeeForm.designation || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                    placeholder="Job title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reporting Manager</Label>
                  <Select
                    value={employeeForm.reportingManager || ""}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, reportingManager: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Work Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Work Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={employeeForm.employmentType || "Full-time"}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, employmentType: value as "Full-time" | "Contract" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Work Mode</Label>
                  <Select
                    value={employeeForm.workMode || "Office"}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, workMode: value as "Field" | "Office" | "Hybrid" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Field">Field</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Joining Date</Label>
                  <Input
                    type="date"
                    value={employeeForm.joiningDate || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, joiningDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Tracking Control Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Tracking Control
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <Label>Tracking Enabled</Label>
                    <p className="text-xs text-muted-foreground">GPS & activity tracking</p>
                  </div>
                  <Switch
                    checked={employeeForm.trackingEnabled || false}
                    onCheckedChange={(checked) => setEmployeeForm({ ...employeeForm, trackingEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <Label>Attendance Required</Label>
                    <p className="text-xs text-muted-foreground">Check-in mandatory</p>
                  </div>
                  <Switch
                    checked={employeeForm.attendanceRequired || false}
                    onCheckedChange={(checked) => setEmployeeForm({ ...employeeForm, attendanceRequired: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <Label>Task Assignment Allowed</Label>
                    <p className="text-xs text-muted-foreground">Can receive tasks</p>
                  </div>
                  <Switch
                    checked={employeeForm.taskAssignmentAllowed || false}
                    onCheckedChange={(checked) => setEmployeeForm({ ...employeeForm, taskAssignmentAllowed: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Status & System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee Status</Label>
                  <Select
                    value={employeeForm.statusId || ""}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, statusId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeStatuses.length > 0 ? (
                        activeStatuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>{status.statusName}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No statuses available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={employeeForm.region || "none"}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, region: value === "none" ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific region</SelectItem>
                      <SelectItem value="North">North</SelectItem>
                      <SelectItem value="South">South</SelectItem>
                      <SelectItem value="East">East</SelectItem>
                      <SelectItem value="West">West</SelectItem>
                      <SelectItem value="Central">Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned Site (Optional)</Label>
                  <Select
                    value={employeeForm.siteId || "none"}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, siteId: value === "none" ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific site</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accessible Sites (For Admins)</Label>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto border border-input rounded-md p-2 bg-background">
                    {sites.map(s => {
                      const accessibleSites = employeeForm.accessibleSites || [];
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={accessibleSites.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEmployeeForm(prev => ({ ...prev, accessibleSites: [...(prev.accessibleSites || []), s.id] }));
                              } else {
                                setEmployeeForm(prev => ({ ...prev, accessibleSites: (prev.accessibleSites || []).filter(id => id !== s.id) }));
                              }
                            }}
                          />
                          {s.name}
                        </label>
                      );
                    })}
                    {sites.length === 0 && <span className="text-xs text-muted-foreground">No sites available</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <Label>Account Status</Label>
                    <p className="text-xs text-muted-foreground">Login enable/disable</p>
                  </div>
                  <Switch
                    checked={employeeForm.accountStatus || false}
                    onCheckedChange={(checked) => setEmployeeForm({ ...employeeForm, accountStatus: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMPLOYEE VIEW */}
        {activeMaster === "employees" && modalMode === "view" && selectedEmployee && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: User, label: "Full Name", value: selectedEmployee.fullName },
                { icon: Mail, label: "Email", value: selectedEmployee.email },
                { icon: Phone, label: "Mobile", value: selectedEmployee.mobileNumber },
                { icon: Lock, label: "Password", value: "••••••••" },
                { icon: Shield, label: "Role", value: getRoleName(selectedEmployee.roleId) },
                { icon: Building, label: "Department", value: getDepartmentName(selectedEmployee.departmentId) },
                { icon: Briefcase, label: "Designation", value: selectedEmployee.designation },
                {
                  icon: GitBranch,
                  label: "Reporting Manager",
                  value: employees.find(e => e.id === selectedEmployee.reportingManager)?.fullName || "None"
                },
                { icon: Calendar, label: "Joining Date", value: selectedEmployee.joiningDate },
                { icon: MapPin, label: "Work Mode", value: selectedEmployee.workMode },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <item.icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
              <div>
                <p className="text-sm font-medium">Status</p>
                <StatusBadge
                  status={getStatusName(selectedEmployee.statusId) === "Active" ? "active" : "inactive"}
                  label={getStatusName(selectedEmployee.statusId)}
                />
              </div>
              <div>
                <p className="text-sm font-medium">GPS Tracking</p>
                <p className={selectedEmployee.trackingEnabled ? "text-success" : "text-muted-foreground"}>
                  {selectedEmployee.trackingEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Account</p>
                <p className={selectedEmployee.accountStatus ? "text-success" : "text-muted-foreground"}>
                  {selectedEmployee.accountStatus ? "Active" : "Disabled"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROLE FORM */}
        {activeMaster === "roles" && modalMode !== "view" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role Name *</Label>
              <Input
                value={roleForm.roleName || ""}
                onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                placeholder="Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Role Code</Label>
              <Input
                value={roleForm.roleCode || (roleForm.roleName ? roleForm.roleName.toUpperCase().replace(/\s+/g, "_").slice(0, 20) : "")}
                onChange={(e) => setRoleForm({ ...roleForm, roleCode: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                placeholder="e.g. MGR_01"
              />
            </div>
            <div className="space-y-2">
              <Label>Role Type</Label>
              <Select
                value={roleForm.roleType || "Execution"}
                onValueChange={(value) => setRoleForm({ ...roleForm, roleType: value as Role["roleType"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Execution">Execution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Dashboard</Label>
              <Select
                value={roleForm.defaultDashboard || ""}
                onValueChange={(value) => setRoleForm({ ...roleForm, defaultDashboard: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {availableDropdownModules.includes("Employee Portal") && <SelectItem value="employee-portal">Employee Portal</SelectItem>}
                  {availableDropdownModules.includes("Master Setup") && <SelectItem value="master-setup">Master Setup</SelectItem>}
                  {availableDropdownModules.includes("Inventory Management") && <SelectItem value="inventory-management">Inventory Management</SelectItem>}
                  {availableDropdownModules.includes("Sales Executive") && <SelectItem value="sales-executive">Sales Executive</SelectItem>}
                  {availableDropdownModules.includes("Daily Tracking") && <SelectItem value="my-daily-tracking">Daily Tracking</SelectItem>}
                  {availableDropdownModules.includes("Live Tracking") && <SelectItem value="my-live-tracking">Live Tracking</SelectItem>}
                  {availableDropdownModules.includes("Team Tracking") && <SelectItem value="team-tracking">Team Tracking</SelectItem>}
                  {availableDropdownModules.includes("Reports") && <SelectItem value="reports">Reports</SelectItem>}
                  {availableDropdownModules.includes("Alerts") && <SelectItem value="alerts">Alerts</SelectItem>}
                  {availableDropdownModules.includes("Attendance & Leaves") && <SelectItem value="attendance-leaves">Attendance & Leaves</SelectItem>}
                  {availableDropdownModules.includes("Projects & Tasks") && <SelectItem value="projects">Projects & Tasks</SelectItem>}
                  {availableDropdownModules.includes("Communication & Meetings") && <SelectItem value="communication">Communication & Meetings</SelectItem>}
                  {availableDropdownModules.includes("Documents") && <SelectItem value="documents">Documents</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role Priority</Label>
              <Input
                type="number"
                value={roleForm.rolePriority || 50}
                onChange={(e) => setRoleForm({ ...roleForm, rolePriority: parseInt(e.target.value) })}
                min={1}
                max={100}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable/Disable role</p>
              </div>
              <Switch
                checked={roleForm.activeStatus || false}
                onCheckedChange={(checked) => setRoleForm({ ...roleForm, activeStatus: checked })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Visible Dashboard KPI Cards</Label>
              <p className="text-xs text-muted-foreground mb-2">Select which top-level KPI cards this role is allowed to see.</p>
              <div className="flex flex-wrap gap-4">
                {[
                  "Employees Online",
                  "Active Projects",
                  "Today's Site Visits",
                  "Pending Alerts",
                  "Total Distance Today",
                  "Delayed Projects",
                  "Pending Reimbursements",
                  "Pending Leave Requests"
                ].map((kpi) => (
                  <div key={kpi} className="flex items-center space-x-2 bg-muted/50 p-2 rounded-md border">
                    <Checkbox
                      id={`kpi-${kpi}`}
                      checked={(roleForm.visibleKpis || []).includes(kpi)}
                      onCheckedChange={(checked) => {
                        const currentKpis = roleForm.visibleKpis || [];
                        if (checked) {
                          setRoleForm({ ...roleForm, visibleKpis: [...currentKpis, kpi] });
                        } else {
                          setRoleForm({ ...roleForm, visibleKpis: currentKpis.filter(k => k !== kpi) });
                        }
                      }}
                    />
                    <Label htmlFor={`kpi-${kpi}`} className="cursor-pointer font-normal">
                      {kpi}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ROLE VIEW */}
        {activeMaster === "roles" && modalMode === "view" && selectedRole && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Role Name", value: selectedRole.roleName },
              { label: "Role Code", value: selectedRole.roleCode },
              { label: "Role Type", value: selectedRole.roleType },
              { label: "Default Dashboard", value: selectedRole.defaultDashboard },
              { label: "Priority", value: String(selectedRole.rolePriority) },
              { label: "Status", value: selectedRole.activeStatus ? "Active" : "Inactive" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* PERMISSION VIEW */}
        {activeMaster === "role-permissions" && modalMode === "view" && selectedPermission && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium">{selectedPermission.roleName}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Module</p>
                <p className="font-medium">{selectedPermission.module}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-cols-6 gap-4">
              {(["view", "create", "edit", "delete", "approve", "export"] as const).map((perm) => (
                <div key={perm} className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground capitalize mb-2">{perm}</p>
                  {selectedPermission[perm] ? (
                    <Check className="w-5 h-5 text-success mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground mx-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTING MANAGER WIZARD - CREATE MODE */}
        {activeMaster === "reporting-manager" && modalMode === "create" && (
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${reportingWizardStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">1</span>
                <span className="font-medium">Setup Manager</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${reportingWizardStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">2</span>
                <span className="font-medium">Map Employees</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1: Create/Select Manager */}
              {reportingWizardStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Option to select existing manager */}
                  {existingManagers.length > 0 && (
                    <div className="p-4 border border-border rounded-xl bg-muted/30">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Select Existing Manager
                      </h4>
                      <Select onValueChange={handleSelectExistingManager}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an existing manager..." />
                        </SelectTrigger>
                        <SelectContent>
                          {existingManagers.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.fullName} - {getRoleName(emp.roleId)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or create new</span>
                    </div>
                  </div>

                  {/* Create New Manager Form */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Create New Reporting Manager
                    </h4>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={newManagerForm.fullName || ""}
                          onChange={(e) => setNewManagerForm({ ...newManagerForm, fullName: e.target.value })}
                          placeholder="Manager Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={newManagerForm.email || ""}
                          onChange={(e) => setNewManagerForm({ ...newManagerForm, email: e.target.value })}
                          placeholder="manager@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile Number</Label>
                        <Input
                          value={newManagerForm.mobileNumber || ""}
                          onChange={(e) => setNewManagerForm({ ...newManagerForm, mobileNumber: e.target.value })}
                          placeholder="+1 555-0101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role * (Management Only)</Label>
                        <Select
                          value={newManagerForm.roleId || ""}
                          onValueChange={(value) => setNewManagerForm({ ...newManagerForm, roleId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select management role" />
                          </SelectTrigger>
                          <SelectContent>
                            {managementRoles.length > 0 ? (
                              managementRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.roleName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__disabled__" disabled>
                                No management roles available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Only Management type roles can be managers
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select
                          value={newManagerForm.departmentId || ""}
                          onValueChange={(value) => setNewManagerForm({ ...newManagerForm, departmentId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeDepartments.length > 0 ? (
                              activeDepartments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.departmentName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__disabled__" disabled>
                                No active departments
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input
                          value={newManagerForm.designation || ""}
                          onChange={(e) => setNewManagerForm({ ...newManagerForm, designation: e.target.value })}
                          placeholder="Manager Title"
                        />
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-primary/5 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Manager will be added to Employee Master</p>
                        <p className="text-muted-foreground">
                          Upon creation, this manager will be automatically added as an Active employee with Account Status enabled.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Map Employees */}
              {reportingWizardStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Manager Info */}
                  <div className="p-4 bg-primary/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{newManagerForm.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {getRoleName(newManagerForm.roleId || "")} • {getDepartmentName(newManagerForm.departmentId || "")}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                          Manager Created
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add Employees */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Map Employees to This Manager
                    </h4>

                    <div className="flex gap-3">
                      <Select onValueChange={handleAddEmployeeMapping}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select employee to add..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEmployeesForMapping.length > 0 ? (
                            availableEmployeesForMapping.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.fullName} - {getRoleName(emp.roleId)}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__disabled__" disabled>
                              No employees available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mapped Employees List */}
                    {employeeMappings.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {employeeMappings.map((mapping) => (
                          <div key={mapping.employeeId} className="p-4 border border-border rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="font-medium">{mapping.employeeName}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveEmployeeMapping(mapping.employeeId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={mapping.reportingType}
                                  onValueChange={(value) => handleUpdateMapping(mapping.employeeId, "reportingType", value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Direct">Direct</SelectItem>
                                    <SelectItem value="Dotted">Dotted</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Scope</Label>
                                <Select
                                  value={mapping.visibilityScope}
                                  onValueChange={(value) => handleUpdateMapping(mapping.employeeId, "visibilityScope", value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Team">Team</SelectItem>
                                    <SelectItem value="Department">Department</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">From</Label>
                                <Input
                                  type="date"
                                  className="h-8"
                                  value={mapping.effectiveFrom}
                                  onChange={(e) => handleUpdateMapping(mapping.employeeId, "effectiveFrom", e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">To (Optional)</Label>
                                <Input
                                  type="date"
                                  className="h-8"
                                  value={mapping.effectiveTo}
                                  onChange={(e) => handleUpdateMapping(mapping.employeeId, "effectiveTo", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-border rounded-xl text-center">
                        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No employees mapped yet</p>
                        <p className="text-sm text-muted-foreground">Select employees from the dropdown above</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* REPORTING EDIT FORM */}
        {activeMaster === "reporting-manager" && modalMode === "edit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Input value={reportingForm.employeeName || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Input value={reportingForm.managerName || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Reporting Type</Label>
              <Select
                value={reportingForm.reportingType || "Direct"}
                onValueChange={(value) => setReportingForm({ ...reportingForm, reportingType: value as ReportingManager["reportingType"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility Scope</Label>
              <Select
                value={reportingForm.visibilityScope || "Team"}
                onValueChange={(value) => setReportingForm({ ...reportingForm, visibilityScope: value as ReportingManager["visibilityScope"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Team">Team</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Effective From</Label>
              <Input
                type="date"
                value={reportingForm.effectiveFrom || ""}
                onChange={(e) => setReportingForm({ ...reportingForm, effectiveFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Effective To</Label>
              <Input
                type="date"
                value={reportingForm.effectiveTo || ""}
                onChange={(e) => setReportingForm({ ...reportingForm, effectiveTo: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Override Access</Label>
                <p className="text-xs text-muted-foreground">Emergency access</p>
              </div>
              <Switch
                checked={reportingForm.overrideAccess || false}
                onCheckedChange={(checked) => setReportingForm({ ...reportingForm, overrideAccess: checked })}
              />
            </div>
          </div>
        )}

        {/* REPORTING VIEW */}
        {activeMaster === "reporting-manager" && modalMode === "view" && selectedReporting && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Employee", value: selectedReporting.employeeName },
              { label: "Manager", value: selectedReporting.managerName },
              { label: "Type", value: selectedReporting.reportingType },
              { label: "Scope", value: selectedReporting.visibilityScope },
              { label: "From", value: selectedReporting.effectiveFrom },
              { label: "To", value: selectedReporting.effectiveTo || "Ongoing" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* DEPARTMENT WIZARD - CREATE MODE */}
        {activeMaster === "departments" && modalMode === "create" && (
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${departmentWizardStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">1</span>
                <span className="font-medium">Create Department</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${departmentWizardStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">2</span>
                <span className="font-medium">Assign Head</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1: Create Department */}
              {departmentWizardStep === 1 && (
                <motion.div
                  key="dept-step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    Department Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department Name *</Label>
                      <Input
                        value={departmentForm.departmentName || ""}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, departmentName: e.target.value })}
                        placeholder="e.g., Sales, Marketing, Engineering"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Department Code</Label>
                      <Input
                        value={departmentForm.departmentCode || departmentForm.departmentName?.toUpperCase().replace(/\s+/g, "_").slice(0, 10) || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parent Department</Label>
                      <Select
                        value={departmentForm.parentDepartmentId || "none"}
                        onValueChange={(value) => setDepartmentForm({ ...departmentForm, parentDepartmentId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Top Level)</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.departmentName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div>
                        <Label>Active Status</Label>
                        <p className="text-xs text-muted-foreground">Enable department</p>
                      </div>
                      <Switch
                        checked={departmentForm.activeStatus ?? true}
                        onCheckedChange={(checked) => setDepartmentForm({ ...departmentForm, activeStatus: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div>
                      <Label>GPS Tracking Enabled</Label>
                      <p className="text-xs text-muted-foreground">Enable tracking for department employees</p>
                    </div>
                    <Switch
                      checked={departmentForm.trackingEnabled ?? true}
                      onCheckedChange={(checked) => setDepartmentForm({ ...departmentForm, trackingEnabled: checked })}
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Assign Department Head */}
              {departmentWizardStep === 2 && (
                <motion.div
                  key="dept-step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Department Created Info */}
                  <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <Building className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold">{departmentForm.departmentName}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {departmentForm.departmentCode || departmentForm.departmentName?.toUpperCase().replace(/\s+/g, "_").slice(0, 10)}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                          ✓ Department Created
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Select Existing Manager as Head */}
                  {existingManagers.length > 0 && (
                    <div className="p-4 border border-border rounded-xl bg-muted/30">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Select Existing Manager as Department Head
                      </h4>
                      <Select
                        value={departmentForm.departmentHeadId || "none"}
                        onValueChange={(value) => handleSelectDeptHead(value === "none" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a manager..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Assign Later)</SelectItem>
                          {existingManagers.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.fullName} - {getRoleName(emp.roleId)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or create new department head</span>
                    </div>
                  </div>

                  {/* Create New Department Head */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Create New Department Head
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={newDeptHeadForm.fullName || ""}
                          onChange={(e) => setNewDeptHeadForm({ ...newDeptHeadForm, fullName: e.target.value })}
                          placeholder="Department Head Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={newDeptHeadForm.email || ""}
                          onChange={(e) => setNewDeptHeadForm({ ...newDeptHeadForm, email: e.target.value })}
                          placeholder="head@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile Number</Label>
                        <Input
                          value={newDeptHeadForm.mobileNumber || ""}
                          onChange={(e) => setNewDeptHeadForm({ ...newDeptHeadForm, mobileNumber: e.target.value })}
                          placeholder="+1 555-0101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role * (Management Only)</Label>
                        <Select
                          value={newDeptHeadForm.roleId || ""}
                          onValueChange={(value) => setNewDeptHeadForm({ ...newDeptHeadForm, roleId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select management role" />
                          </SelectTrigger>
                          <SelectContent>
                            {managementRoles.length > 0 ? (
                              managementRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.roleName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__disabled__" disabled>
                                No management roles available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input
                          value={newDeptHeadForm.designation || ""}
                          onChange={(e) => setNewDeptHeadForm({ ...newDeptHeadForm, designation: e.target.value })}
                          placeholder="e.g., Department Manager"
                        />
                      </div>
                    </div>

                    {newDeptHeadForm.fullName && newDeptHeadForm.email && newDeptHeadForm.roleId && (
                      <Button
                        onClick={handleCreateDeptHead}
                        className="w-full gradient-btn gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create & Assign as Department Head
                      </Button>
                    )}

                    {/* Info Box */}
                    <div className="p-4 bg-primary/5 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Department Head will be added to Employee Master</p>
                        <p className="text-muted-foreground">
                          The new department head will be automatically added as an Active employee and linked to this department.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* DEPARTMENT EDIT FORM */}
        {activeMaster === "departments" && modalMode === "edit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department Name *</Label>
              <Input
                value={departmentForm.departmentName || ""}
                onChange={(e) => setDepartmentForm({ ...departmentForm, departmentName: e.target.value })}
                placeholder="Sales"
              />
            </div>
            <div className="space-y-2">
              <Label>Department Code</Label>
              <Input
                value={departmentForm.departmentCode || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Department</Label>
              <Select
                value={departmentForm.parentDepartmentId || "none"}
                onValueChange={(value) => setDepartmentForm({ ...departmentForm, parentDepartmentId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments.filter(d => d.id !== selectedDepartment?.id).map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.departmentName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department Head (Manager)</Label>
              <Select
                value={departmentForm.departmentHeadId || "none"}
                onValueChange={(value) => setDepartmentForm({ ...departmentForm, departmentHeadId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {existingManagers.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName} - {getRoleName(emp.roleId)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Tracking Enabled</Label>
                <p className="text-xs text-muted-foreground">GPS tracking for dept</p>
              </div>
              <Switch
                checked={departmentForm.trackingEnabled || false}
                onCheckedChange={(checked) => setDepartmentForm({ ...departmentForm, trackingEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable/Disable</p>
              </div>
              <Switch
                checked={departmentForm.activeStatus || false}
                onCheckedChange={(checked) => setDepartmentForm({ ...departmentForm, activeStatus: checked })}
              />
            </div>
          </div>
        )}

        {/* DEPARTMENT VIEW */}
        {activeMaster === "departments" && modalMode === "view" && selectedDepartment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Name", value: selectedDepartment.departmentName },
              { label: "Code", value: selectedDepartment.departmentCode },
              { label: "Parent", value: selectedDepartment.parentDepartmentId ? getDepartmentName(selectedDepartment.parentDepartmentId) : "None" },
              { label: "Head", value: selectedDepartment.departmentHeadId ? employees.find(e => e.id === selectedDepartment.departmentHeadId)?.fullName || "Unknown" : "Not Assigned" },
              { label: "Tracking", value: selectedDepartment.trackingEnabled ? "Enabled" : "Disabled" },
              { label: "Status", value: selectedDepartment.activeStatus ? "Active" : "Inactive" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* STATUS VIEW */}
        {activeMaster === "status" && modalMode === "view" && selectedStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Status Name", value: selectedStatus.statusName },
              { label: "Tracking", value: selectedStatus.tracking ? "ON" : "OFF" },
              { label: "Visibility", value: selectedStatus.visibility },
              { label: "Active", value: selectedStatus.activeStatus ? "Yes" : "No" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* STATUS CREATE/EDIT FORM */}
        {activeMaster === "status" && (modalMode === "create" || modalMode === "edit") && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Status Name *</Label>
                <Input
                  value={statusForm.statusName || ""}
                  onChange={(e) => setStatusForm({ ...statusForm, statusName: e.target.value })}
                  placeholder="e.g., Probation, On Notice"
                />
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={statusForm.visibility || "All"}
                  onValueChange={(value: "All" | "Manager Only" | "Admin Only") =>
                    setStatusForm({ ...statusForm, visibility: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Manager Only">Manager Only</SelectItem>
                    <SelectItem value="Admin Only">Admin Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label>Tracking</Label>
                  <p className="text-xs text-muted-foreground">Attendance & GPS tracking</p>
                </div>
                <Switch
                  checked={statusForm.tracking || false}
                  onCheckedChange={(checked) => setStatusForm({ ...statusForm, tracking: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-xs text-muted-foreground">Enable or disable status</p>
                </div>
                <Switch
                  checked={statusForm.activeStatus !== false}
                  onCheckedChange={(checked) => setStatusForm({ ...statusForm, activeStatus: checked })}
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-primary/5 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Status Changes Propagate System-Wide</p>
                <p className="text-muted-foreground">
                  Changes will automatically update dashboards, tracking settings, task assignments, and reports.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DISTRIBUTOR VIEW */}
        {activeMaster === "distributors" && modalMode === "view" && selectedDistributor && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Basic Details */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">Basic Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Distributor ID", value: selectedDistributor.distributorId },
                  { label: "Firm Name", value: selectedDistributor.firmName },
                  { label: "Proprietor Name", value: selectedDistributor.proprietorName },
                  { label: "Mobile Number", value: selectedDistributor.mobileNumber },
                  { label: "Email Address", value: selectedDistributor.emailAddress || "-" },
                  { label: "PAN (Proprietor)", value: selectedDistributor.panProprietor },
                  { label: "PAN (Firm)", value: selectedDistributor.panFirm || "-" },
                  { label: "GST Number", value: selectedDistributor.gstNumber },
                  { label: "Date of Birth", value: selectedDistributor.dateOfBirth },
                  { label: "Marriage Anniversary", value: selectedDistributor.marriageAnniversary || "-" },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">Address Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Office Address", value: selectedDistributor.officeAddress },
                  { label: "Current Address", value: selectedDistributor.currentAddress },
                  { label: "Permanent Address", value: selectedDistributor.permanentAddress },
                  { label: "District", value: selectedDistributor.district },
                  { label: "State", value: selectedDistributor.state },
                  { label: "Pincode", value: selectedDistributor.pincode },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Profile */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">Business Profile</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Type of Firm</p>
                  <p className="font-medium text-sm">{selectedDistributor.typeOfFirm}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Distributor Profile</p>
                  <p className="font-medium text-sm">
                    W: {selectedDistributor.distributorProfile.wholesalerPercent}% / R: {selectedDistributor.distributorProfile.retailerPercent}%
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Years of Establishment</p>
                  <p className="font-medium text-sm">{selectedDistributor.yearsOfEstablishment} years</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Years of Experience</p>
                  <p className="font-medium text-sm">{selectedDistributor.yearsOfExperience} years</p>
                </div>
              </div>
              {selectedDistributor.topCompaniesAssociated.length > 0 && (
                <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">Top Companies Associated</p>
                  <div className="space-y-2">
                    {selectedDistributor.topCompaniesAssociated.map((company, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-background rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{company.companyName}</p>
                          <p className="text-xs text-muted-foreground">{company.businessType}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p>₹{(company.turnoverYear3 / 100000).toFixed(1)}L (Y3)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Licenses */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">Licenses</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Pesticide License</p>
                  <p className="font-medium text-sm">{selectedDistributor.pesticideLicenseNo || "Not Available"}</p>
                  {selectedDistributor.pesticideLicenseExpiry && (
                    <p className="text-xs text-amber-600">Expires: {selectedDistributor.pesticideLicenseExpiry}</p>
                  )}
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Seed License</p>
                  <p className="font-medium text-sm">{selectedDistributor.seedLicenseNo || "Not Available"}</p>
                  {selectedDistributor.seedLicenseExpiry && (
                    <p className="text-xs text-amber-600">Expires: {selectedDistributor.seedLicenseExpiry}</p>
                  )}
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Fertiliser License</p>
                  <p className="font-medium text-sm">{selectedDistributor.fertiliserLicenseNo || "Not Available"}</p>
                  {selectedDistributor.fertiliserLicenseExpiry && (
                    <p className="text-xs text-amber-600">Expires: {selectedDistributor.fertiliserLicenseExpiry}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">Infrastructure</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">{selectedDistributor.godownSpace}</p>
                  <p className="text-xs text-muted-foreground">Godown (sq.ft)</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">{selectedDistributor.shopSpace}</p>
                  <p className="text-xs text-muted-foreground">Shop (sq.ft)</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">{selectedDistributor.deliveryVehicles}</p>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">{selectedDistributor.salesmenAvailable}</p>
                  <p className="text-xs text-muted-foreground">Salesmen</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                  <span className={`w-3 h-3 rounded-full ${selectedDistributor.housePropertyOwned ? 'bg-green-500' : 'bg-red-400'}`} />
                  <span className="text-sm">Property {selectedDistributor.housePropertyOwned ? 'Owned' : 'Rented'}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                  <span className={`w-3 h-3 rounded-full ${selectedDistributor.computerAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                  <span className="text-sm">Computer {selectedDistributor.computerAvailable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                  <span className={`w-3 h-3 rounded-full ${selectedDistributor.internetAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                  <span className="text-sm">Internet {selectedDistributor.internetAvailable ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Banking & Investment */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">Banking & Investment</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Bank Name", value: selectedDistributor.bankName },
                  { label: "Account Number", value: selectedDistributor.accountNumber },
                  { label: "Account Type", value: selectedDistributor.accountType },
                  { label: "Bank Limit (CC)", value: `₹${(selectedDistributor.bankLimitCC / 100000).toFixed(1)}L` },
                  { label: "Total Funds Employed", value: `₹${(selectedDistributor.totalFundsEmployed / 100000).toFixed(1)}L` },
                  { label: "Own Investment", value: `₹${(selectedDistributor.ownInvestment / 100000).toFixed(1)}L` },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              {selectedDistributor.otherLoans && (
                <div className="mt-2 p-3 bg-amber-50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Other Loans</p>
                  <p className="font-medium text-sm">{selectedDistributor.otherLoans}</p>
                </div>
              )}
            </div>

            {/* Transport & Retailers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-3 text-primary">Transport Preferences</h4>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">Preferred Transporters</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedDistributor.preferredTransporters.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Depot Location</p>
                  <p className="font-medium text-sm">{selectedDistributor.depotLocation || "-"}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3 text-primary">Attached Retailers</h4>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">Number of Retailers: <span className="font-bold text-primary">{selectedDistributor.numberOfRetailers}</span></p>
                  <p className="text-sm">{selectedDistributor.attachedRetailersList || "No retailers listed"}</p>
                </div>
              </div>
            </div>

            {/* Approval Chain with Signatures */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">Approval Chain & Signatures</h4>

              {/* Proprietor Signature */}
              {selectedDistributor.proprietorSignature && (
                <div className="mb-4 p-4 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">Proprietor Signature</p>
                  <img
                    src={selectedDistributor.proprietorSignature}
                    alt="Proprietor Signature"
                    className="h-20 border rounded-lg bg-card p-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Submitted By */}
                <div className="p-4 bg-blue-50/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <p className="text-xs text-muted-foreground">Submitted By (Field Staff)</p>
                  </div>
                  <p className="font-medium text-sm mb-2">{selectedDistributor.submittedBy.name || "-"}</p>
                  {selectedDistributor.submittedBy.signature && (
                    <img
                      src={selectedDistributor.submittedBy.signature}
                      alt="SO/ASM Signature"
                      className="h-16 border rounded-lg bg-card p-1"
                    />
                  )}
                </div>

                {/* Forwarded By */}
                <div className="p-4 bg-amber-50/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <p className="text-xs text-muted-foreground">Forwarded By (RSM)</p>
                  </div>
                  <p className="font-medium text-sm mb-2">{selectedDistributor.forwardedBy.name || "-"}</p>
                  {selectedDistributor.forwardedBy.signature && (
                    <img
                      src={selectedDistributor.forwardedBy.signature}
                      alt="RSM Signature"
                      className="h-16 border rounded-lg bg-card p-1"
                    />
                  )}
                </div>

                {/* Approved By */}
                <div className="p-4 bg-green-50/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <p className="text-xs text-muted-foreground">Approved By (HOD)</p>
                  </div>
                  <p className="font-medium text-sm mb-2">{selectedDistributor.approvedBy.name || "-"}</p>
                  {selectedDistributor.approvedBy.signature && (
                    <img
                      src={selectedDistributor.approvedBy.signature}
                      alt="HOD Signature"
                      className="h-16 border rounded-lg bg-card p-1"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DISTRIBUTOR CREATE/EDIT FORM */}
        {activeMaster === "distributors" && (modalMode === "create" || modalMode === "edit") && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Basic Details */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">1</span>
                Basic Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Distributor ID</Label>
                  <Input value={distributorForm.distributorId || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Firm Name *</Label>
                  <Input
                    value={distributorForm.firmName || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, firmName: e.target.value })}
                    placeholder="Registered firm name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proprietor Name *</Label>
                  <Input
                    value={distributorForm.proprietorName || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, proprietorName: e.target.value })}
                    placeholder="Owner name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={distributorForm.mobileNumber || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, mobileNumber: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={distributorForm.emailAddress || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, emailAddress: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN (Proprietor) *</Label>
                  <Input
                    value={distributorForm.panProprietor || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, panProprietor: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN (Firm)</Label>
                  <Input
                    value={distributorForm.panFirm || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, panFirm: e.target.value.toUpperCase() })}
                    placeholder="If different from proprietor"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST Number *</Label>
                  <Input
                    value={distributorForm.gstNumber || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="23ABCDE1234F1Z5"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={distributorForm.dateOfBirth || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marriage Anniversary</Label>
                  <Input
                    type="date"
                    value={distributorForm.marriageAnniversary || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, marriageAnniversary: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">2</span>
                Address Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Office Address *</Label>
                  <Input
                    value={distributorForm.officeAddress || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, officeAddress: e.target.value })}
                    placeholder="Firm's registered address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Address</Label>
                  <Input
                    value={distributorForm.currentAddress || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, currentAddress: e.target.value })}
                    placeholder="Proprietor's current residence"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permanent Address</Label>
                  <Input
                    value={distributorForm.permanentAddress || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, permanentAddress: e.target.value })}
                    placeholder="Proprietor's permanent residence"
                  />
                </div>
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Input
                    value={distributorForm.district || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, district: e.target.value })}
                    placeholder="District"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select
                    value={distributorForm.state || ""}
                    onValueChange={(value) => setDistributorForm({ ...distributorForm, state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Gujarat">Gujarat</SelectItem>
                      <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                      <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pincode *</Label>
                  <Input
                    value={distributorForm.pincode || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, pincode: e.target.value })}
                    placeholder="452001"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Business Profile */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">3</span>
                Business Profile
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type of Firm *</Label>
                  <Select
                    value={distributorForm.typeOfFirm || "Sole Proprietor"}
                    onValueChange={(value: "Sole Proprietor" | "Partnership" | "Pvt Ltd" | "Co-Op Society") =>
                      setDistributorForm({ ...distributorForm, typeOfFirm: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Pvt Ltd">Pvt Ltd</SelectItem>
                      <SelectItem value="Co-Op Society">Co-Op Society</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Wholesaler %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={distributorForm.distributorProfile?.wholesalerPercent || 0}
                    onChange={(e) => setDistributorForm({
                      ...distributorForm,
                      distributorProfile: {
                        wholesalerPercent: Number(e.target.value),
                        retailerPercent: 100 - Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retailer %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={distributorForm.distributorProfile?.retailerPercent || 0}
                    onChange={(e) => setDistributorForm({
                      ...distributorForm,
                      distributorProfile: {
                        retailerPercent: Number(e.target.value),
                        wholesalerPercent: 100 - Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years of Establishment</Label>
                  <Input
                    type="number"
                    value={distributorForm.yearsOfEstablishment || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, yearsOfEstablishment: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={distributorForm.yearsOfExperience || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, yearsOfExperience: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Licenses */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">4</span>
                Licenses
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pesticide License No.</Label>
                  <Input
                    value={distributorForm.pesticideLicenseNo || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, pesticideLicenseNo: e.target.value })}
                    placeholder="License number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pesticide License Expiry</Label>
                  <Input
                    type="date"
                    value={distributorForm.pesticideLicenseExpiry || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, pesticideLicenseExpiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seed License No.</Label>
                  <Input
                    value={distributorForm.seedLicenseNo || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, seedLicenseNo: e.target.value })}
                    placeholder="License number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seed License Expiry</Label>
                  <Input
                    type="date"
                    value={distributorForm.seedLicenseExpiry || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, seedLicenseExpiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fertiliser License No.</Label>
                  <Input
                    value={distributorForm.fertiliserLicenseNo || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, fertiliserLicenseNo: e.target.value })}
                    placeholder="License number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fertiliser License Expiry</Label>
                  <Input
                    type="date"
                    value={distributorForm.fertiliserLicenseExpiry || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, fertiliserLicenseExpiry: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">5</span>
                Infrastructure
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Godown Space (sq.ft)</Label>
                  <Input
                    type="number"
                    value={distributorForm.godownSpace || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, godownSpace: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shop Space (sq.ft)</Label>
                  <Input
                    type="number"
                    value={distributorForm.shopSpace || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, shopSpace: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Vehicles</Label>
                  <Input
                    type="number"
                    value={distributorForm.deliveryVehicles || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, deliveryVehicles: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salesmen Available</Label>
                  <Input
                    type="number"
                    value={distributorForm.salesmenAvailable || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, salesmenAvailable: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <Label>House Property Owned</Label>
                  <Checkbox
                    checked={distributorForm.housePropertyOwned || false}
                    onCheckedChange={(checked) => setDistributorForm({ ...distributorForm, housePropertyOwned: checked as boolean })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <Label>Computer Available</Label>
                  <Switch
                    checked={distributorForm.computerAvailable || false}
                    onCheckedChange={(checked) => setDistributorForm({ ...distributorForm, computerAvailable: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <Label>Internet Available</Label>
                  <Switch
                    checked={distributorForm.internetAvailable || false}
                    onCheckedChange={(checked) => setDistributorForm({ ...distributorForm, internetAvailable: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Banking & Investment */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">6</span>
                Banking & Investment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={distributorForm.bankName || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, bankName: e.target.value })}
                    placeholder="Primary bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={distributorForm.accountNumber || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, accountNumber: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select
                    value={distributorForm.accountType || "Saving"}
                    onValueChange={(value: "Saving" | "Current") => setDistributorForm({ ...distributorForm, accountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Saving">Saving</SelectItem>
                      <SelectItem value="Current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bank Limit (CC) ₹</Label>
                  <Input
                    type="number"
                    value={distributorForm.bankLimitCC || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, bankLimitCC: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other Loans</Label>
                  <Input
                    value={distributorForm.otherLoans || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, otherLoans: e.target.value })}
                    placeholder="Financial liabilities"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Funds Employed ₹</Label>
                  <Input
                    type="number"
                    value={distributorForm.totalFundsEmployed || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, totalFundsEmployed: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Own Investment ₹</Label>
                  <Input
                    type="number"
                    value={distributorForm.ownInvestment || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, ownInvestment: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Transport Preferences */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">7</span>
                Transport Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Preferred Transporters (comma separated)</Label>
                  <Input
                    value={distributorForm.preferredTransporters?.join(", ") || ""}
                    onChange={(e) => setDistributorForm({
                      ...distributorForm,
                      preferredTransporters: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="VRL Logistics, Gati Express, DTDC"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Depot Location</Label>
                  <Input
                    value={distributorForm.depotLocation || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, depotLocation: e.target.value })}
                    placeholder="Nearest depot"
                  />
                </div>
              </div>
            </div>

            {/* Attached Retailers */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">8</span>
                Attached Retailers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Retailer List</Label>
                  <Input
                    value={distributorForm.attachedRetailersList || ""}
                    onChange={(e) => setDistributorForm({ ...distributorForm, attachedRetailersList: e.target.value })}
                    placeholder="Comma separated list of retailers"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Retailers</Label>
                  <Input
                    type="number"
                    value={distributorForm.numberOfRetailers || 0}
                    onChange={(e) => setDistributorForm({ ...distributorForm, numberOfRetailers: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Government Documents Section */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">9</span>
                Government Documents
              </h4>

              {/* Add New Document Form */}
              <div className="p-4 bg-muted/30 rounded-xl mb-4">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Document
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Document Type *</Label>
                    <Select
                      value={documentForm.documentType || "PAN"}
                      onValueChange={(value: GovernmentDocument["documentType"]) => setDocumentForm({ ...documentForm, documentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PAN">PAN</SelectItem>
                        <SelectItem value="GST Certificate">GST Certificate</SelectItem>
                        <SelectItem value="Seed License">Seed License</SelectItem>
                        <SelectItem value="Fertiliser License">Fertiliser License</SelectItem>
                        <SelectItem value="Pesticide License">Pesticide License</SelectItem>
                        <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                        <SelectItem value="Udyam Certificate">Udyam Certificate</SelectItem>
                        <SelectItem value="Shop Act">Shop Act</SelectItem>
                        <SelectItem value="FSSAI">FSSAI</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Number</Label>
                    <Input
                      value={documentForm.documentNumber || ""}
                      onChange={(e) => setDocumentForm({ ...documentForm, documentNumber: e.target.value })}
                      placeholder="Enter document number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={documentForm.expiryDate || ""}
                      onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload File *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setDocumentForm({
                                ...documentForm,
                                fileName: file.name,
                                fileData: event.target?.result as string
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-sm"
                      />
                    </div>
                    {documentForm.fileName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <File className="w-3 h-3" />
                        {documentForm.fileName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Remarks</Label>
                    <Input
                      value={documentForm.remarks || ""}
                      onChange={(e) => setDocumentForm({ ...documentForm, remarks: e.target.value })}
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!documentForm.documentType || !documentForm.fileName}
                  onClick={() => {
                    const newDoc: GovernmentDocument = {
                      id: String(Date.now()),
                      documentType: documentForm.documentType!,
                      documentNumber: documentForm.documentNumber || "",
                      expiryDate: documentForm.expiryDate || "",
                      fileName: documentForm.fileName || "",
                      fileData: documentForm.fileData || "",
                      remarks: documentForm.remarks || "",
                      uploadedBy: "Current User", // Auto-filled
                      timestamp: new Date().toISOString(), // Auto-generated
                    };
                    setDistributorForm({
                      ...distributorForm,
                      governmentDocuments: [...(distributorForm.governmentDocuments || []), newDoc]
                    });
                    // Reset form
                    setDocumentForm({
                      documentType: "PAN",
                      documentNumber: "",
                      expiryDate: "",
                      fileName: "",
                      fileData: "",
                      remarks: "",
                    });
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </Button>
              </div>

              {/* Document List */}
              {(distributorForm.governmentDocuments?.length || 0) > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Document Type</th>
                          <th className="px-4 py-3 text-left font-medium">Number</th>
                          <th className="px-4 py-3 text-left font-medium">Expiry Date</th>
                          <th className="px-4 py-3 text-left font-medium">File Name</th>
                          <th className="px-4 py-3 text-left font-medium">Uploaded By</th>
                          <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                          <th className="px-4 py-3 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {distributorForm.governmentDocuments?.map((doc) => (
                          <tr key={doc.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                                {doc.documentType}
                              </span>
                            </td>
                            <td className="px-4 py-3">{doc.documentNumber || "-"}</td>
                            <td className="px-4 py-3">
                              {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-4 py-3 flex items-center gap-1">
                              <File className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{doc.fileName}</span>
                            </td>
                            <td className="px-4 py-3">{doc.uploadedBy}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(doc.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {doc.fileData && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newWindow = window.open();
                                        if (newWindow) {
                                          newWindow.document.write(`<img src="${doc.fileData}" style="max-width: 100%;" />`);
                                        }
                                      }}
                                      className="h-7 w-7 p-0"
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = doc.fileData;
                                        link.download = doc.fileName;
                                        link.click();
                                      }}
                                      className="h-7 w-7 p-0"
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDistributorForm({
                                      ...distributorForm,
                                      governmentDocuments: distributorForm.governmentDocuments?.filter(d => d.id !== doc.id)
                                    });
                                  }}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(distributorForm.governmentDocuments?.length || 0) === 0 && (
                <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-xl">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents uploaded yet</p>
                  <p className="text-xs">Add government documents using the form above</p>
                </div>
              )}
            </div>

            {/* Declaration & Approval */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">10</span>
                Declaration & Approval
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                  <Checkbox
                    checked={distributorForm.declarationAccepted || false}
                    onCheckedChange={(checked) => setDistributorForm({ ...distributorForm, declarationAccepted: checked as boolean })}
                  />
                  <div>
                    <p className="font-medium text-sm">I hereby declare that all information provided is true and accurate.</p>
                    <p className="text-xs text-muted-foreground">Terms and conditions acceptance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Witness Name</Label>
                    <Input
                      value={distributorForm.witnessDetails?.name || ""}
                      onChange={(e) => setDistributorForm({
                        ...distributorForm,
                        witnessDetails: { ...distributorForm.witnessDetails!, name: e.target.value }
                      })}
                      placeholder="Witness name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Witness Mobile</Label>
                    <Input
                      value={distributorForm.witnessDetails?.mobile || ""}
                      onChange={(e) => setDistributorForm({
                        ...distributorForm,
                        witnessDetails: { ...distributorForm.witnessDetails!, mobile: e.target.value }
                      })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Witness Address</Label>
                    <Input
                      value={distributorForm.witnessDetails?.address || ""}
                      onChange={(e) => setDistributorForm({
                        ...distributorForm,
                        witnessDetails: { ...distributorForm.witnessDetails!, address: e.target.value }
                      })}
                      placeholder="Address"
                    />
                  </div>
                </div>

                {/* Proprietor Signature */}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Pen className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-semibold">Proprietor Signature</Label>
                  </div>
                  <SignaturePad
                    value={distributorForm.proprietorSignature || ""}
                    onChange={(signature) => setDistributorForm({
                      ...distributorForm,
                      proprietorSignature: signature
                    })}
                  />
                </div>

                {/* Approval Workflow Signatures */}
                <div className="border border-primary/20 rounded-xl p-4">
                  <h5 className="text-sm font-semibold mb-4 text-primary flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" />
                    Approval Workflow Signatures
                  </h5>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Submitted By - Field Staff */}
                    <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                          <p className="text-sm font-semibold">Submitted By</p>
                          <p className="text-xs text-muted-foreground">SO/ASM - Field Staff</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Name & Designation</Label>
                        <Input
                          value={distributorForm.submittedBy?.name || ""}
                          onChange={(e) => setDistributorForm({
                            ...distributorForm,
                            submittedBy: {
                              name: e.target.value,
                              signature: distributorForm.submittedBy?.signature || ""
                            }
                          })}
                          placeholder="Name (SO/ASM)"
                          className="h-9"
                        />
                      </div>
                      <SignaturePad
                        value={distributorForm.submittedBy?.signature || ""}
                        onChange={(signature) => setDistributorForm({
                          ...distributorForm,
                          submittedBy: {
                            name: distributorForm.submittedBy?.name || "",
                            signature: signature
                          }
                        })}
                        label="Digital Signature"
                        height={100}
                      />
                    </div>

                    {/* Forwarded By - Regional Manager */}
                    <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                          <p className="text-sm font-semibold">Forwarded By</p>
                          <p className="text-xs text-muted-foreground">RSM - Regional Manager</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Name & Designation</Label>
                        <Input
                          value={distributorForm.forwardedBy?.name || ""}
                          onChange={(e) => setDistributorForm({
                            ...distributorForm,
                            forwardedBy: {
                              name: e.target.value,
                              signature: distributorForm.forwardedBy?.signature || ""
                            }
                          })}
                          placeholder="Name (RSM)"
                          className="h-9"
                        />
                      </div>
                      <SignaturePad
                        value={distributorForm.forwardedBy?.signature || ""}
                        onChange={(signature) => setDistributorForm({
                          ...distributorForm,
                          forwardedBy: {
                            name: distributorForm.forwardedBy?.name || "",
                            signature: signature
                          }
                        })}
                        label="Digital Signature"
                        height={100}
                      />
                    </div>

                    {/* Approved By - HOD */}
                    <div className="space-y-3 p-4 bg-green-50/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                          <p className="text-sm font-semibold">Approved By</p>
                          <p className="text-xs text-muted-foreground">HOD - Final Approval</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Name & Designation</Label>
                        <Input
                          value={distributorForm.approvedBy?.name || ""}
                          onChange={(e) => setDistributorForm({
                            ...distributorForm,
                            approvedBy: {
                              name: e.target.value,
                              signature: distributorForm.approvedBy?.signature || ""
                            }
                          })}
                          placeholder="Name (HOD)"
                          className="h-9"
                        />
                      </div>
                      <SignaturePad
                        value={distributorForm.approvedBy?.signature || ""}
                        onChange={(signature) => setDistributorForm({
                          ...distributorForm,
                          approvedBy: {
                            name: distributorForm.approvedBy?.name || "",
                            signature: signature
                          }
                        })}
                        label="Digital Signature"
                        height={100}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable or disable distributor</p>
              </div>
              <Switch
                checked={distributorForm.activeStatus !== false}
                onCheckedChange={(checked) => setDistributorForm({ ...distributorForm, activeStatus: checked })}
              />
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
