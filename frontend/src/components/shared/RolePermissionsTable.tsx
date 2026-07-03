import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export type PermissionLevel = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
};

export type PermissionsMap = Record<string, PermissionLevel>;

const PERMISSION_KEYS: (keyof PermissionLevel)[] = ["view", "create", "edit", "delete", "approve", "export"];

export const MODULES_HIERARCHY = [
  {
    id: "master_setup",
    label: "Master Setup",
    subModules: [
      { id: "employees", label: "Employees" },
      { id: "roles", label: "Roles" },
      { id: "role_permissions", label: "Role Permissions" },
      { id: "reporting_manager", label: "Reporting Manager" },
      { id: "departments", label: "Departments" },
      { id: "status_master", label: "Status Master" },
      { id: "distributor_master", label: "Distributor Master" },
      { id: "sites", label: "Sites" },
    ]
  },
  {
    id: "inventory_management",
    label: "Inventory Management",
    subModules: [
      { id: "product_setup", label: "Product Setup" },
      { id: "stock_transfer", label: "Stock Transfer" },
      { id: "stock_adjustment", label: "Stock Adjustment" },
      { id: "warehouse", label: "Warehouse Management" }
    ]
  },
  {
    id: "product_catalog_module",
    label: "Product Catalog",
    subModules: [
      { id: "product_catalog", label: "Product Catalog" }
    ]
  },
  {
    id: "sales_executive",
    label: "Sales Executive",
    subModules: [
      { id: "territory_management", label: "Territory Management" },
      { id: "distributor_linkage", label: "Distributor Linkage" },
      { id: "sales_monitoring", label: "Sales Monitoring" }
    ]
  },
  {
    id: "tracking_operations",
    label: "Tracking & Operations",
    subModules: [
      { id: "daily_tracking", label: "Daily Tracking" },
      { id: "team_tracking", label: "Team Tracking" },
      { id: "live_tracking", label: "Live Tracking" },
      { id: "projects_tasks", label: "Projects & Tasks" }
    ]
  },
  {
    id: "admin_reporting",
    label: "Admin & Reporting",
    subModules: [
      { id: "reports", label: "Reports" },
      { id: "alerts", label: "Alerts" },
      { id: "communication", label: "Communication & Meetings" },
      { id: "documents", label: "Documents" },
      { id: "registration_approvals", label: "Registration Approvals" },
      { id: "permission_requests", label: "Permission Requests" }
    ]
  }
];

interface RolePermissionsTableProps {
  permissions: PermissionsMap;
  onChange: (newPermissions: PermissionsMap) => void;
}

const emptyPermission = (): PermissionLevel => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  export: false,
});

export function RolePermissionsTable({ permissions, onChange }: RolePermissionsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    MODULES_HIERARCHY.reduce((acc, mod) => ({ ...acc, [mod.id]: true }), {})
  );

  const toggleExpand = (moduleId: string) => {
    setExpandedGroups(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handlePermissionChange = (
    moduleId: string, 
    permKey: keyof PermissionLevel, 
    value: boolean, 
    isParent: boolean, 
    subModules?: { id: string }[]
  ) => {
    const newPerms = { ...permissions };
    
    // Ensure parent exists
    if (!newPerms[moduleId]) newPerms[moduleId] = emptyPermission();
    newPerms[moduleId] = { ...newPerms[moduleId], [permKey]: value };

    if (isParent && subModules) {
      // If parent is clicked, sync all children
      subModules.forEach(sub => {
        if (!newPerms[sub.id]) newPerms[sub.id] = emptyPermission();
        newPerms[sub.id] = { ...newPerms[sub.id], [permKey]: value };
      });
    } else if (!isParent) {
      // If child is clicked, we might need to update parent
      // For simplicity, we just update the child here. 
      // Auto-checking the parent if all children are checked is nice, but not strictly required.
    }

    onChange(newPerms);
  };

  return (
    <div className="w-full overflow-x-auto border border-border/50 rounded-xl bg-card shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/30 text-muted-foreground text-xs font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm border-b border-border/50">
          <tr>
            <th className="px-6 py-4 rounded-tl-xl w-1/3">Module Group</th>
            <th className="px-4 py-4 text-center">View</th>
            <th className="px-4 py-4 text-center">Create</th>
            <th className="px-4 py-4 text-center">Edit</th>
            <th className="px-4 py-4 text-center">Delete</th>
            <th className="px-4 py-4 text-center">Approve</th>
            <th className="px-4 py-4 text-center rounded-tr-xl">Export</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {MODULES_HIERARCHY.map((module) => {
            const isExpanded = expandedGroups[module.id];
            const parentPerms = permissions[module.id] || emptyPermission();

            return (
              <React.Fragment key={module.id}>
                {/* Parent Row */}
                <tr className="bg-muted/5 hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleExpand(module.id)}
                      className="flex items-center gap-2 font-bold text-foreground text-base focus:outline-none"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      {module.label}
                    </button>
                  </td>
                  {PERMISSION_KEYS.map(key => (
                    <td key={key} className="px-4 py-4 text-center">
                      <Checkbox 
                        checked={parentPerms[key]}
                        onCheckedChange={(checked) => handlePermissionChange(module.id, key, !!checked, true, module.subModules)}
                        className="w-5 h-5 rounded-md data-[state=checked]:bg-[#2563eb] data-[state=checked]:text-white border-muted-foreground/40 border-2 shadow-sm transition-all"
                      />
                    </td>
                  ))}
                </tr>

                {/* Sub-module Rows */}
                {isExpanded && module.subModules.map((sub) => {
                  const subPerms = permissions[sub.id] || emptyPermission();
                  return (
                    <tr key={sub.id} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-6 py-3 pl-14 text-sm font-medium text-muted-foreground group-hover:text-foreground relative">
                        {/* Tree line connector */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-border/50"></div>
                        <div className="absolute left-8 top-1/2 w-4 h-px bg-border/50"></div>
                        {sub.label}
                      </td>
                      {PERMISSION_KEYS.map(key => (
                        <td key={key} className="px-4 py-3 text-center">
                          <Checkbox 
                            checked={subPerms[key]}
                            onCheckedChange={(checked) => handlePermissionChange(sub.id, key, !!checked, false)}
                            className="w-5 h-5 rounded-md border-muted-foreground/40 border-2 data-[state=checked]:bg-[#2563eb] data-[state=checked]:border-[#2563eb] data-[state=checked]:text-white transition-all"
                          />
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
  );
}
