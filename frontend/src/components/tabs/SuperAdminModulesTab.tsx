import { useState, useEffect } from "react";
import { ShieldAlert, Settings, CheckCircle2, XCircle, MapPin, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";

const MODULES_HIERARCHY = [
  {
    id: "master_setup", label: "Master Setup",
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
    id: "inventory_management", label: "Inventory Management",
    subModules: [
      { id: "product_setup", label: "Product Setup" },
      { id: "stock_transfer", label: "Stock Transfer" },
      { id: "stock_adjustment", label: "Stock Adjustment" },
      { id: "warehouse", label: "Warehouse Management" },
    ]
  },
  {
    id: "sales_executive", label: "Sales Executive",
    subModules: [
      { id: "territory_management", label: "Territory Management" },
      { id: "distributor_linkage", label: "Distributor Linkage" },
      { id: "sales_monitoring", label: "Sales Monitoring" },
    ]
  },
  {
    id: "tracking_operations", label: "Tracking & Operations",
    subModules: [
      { id: "daily_tracking", label: "Daily Tracking" },
      { id: "team_tracking", label: "Team Tracking" },
      { id: "live_tracking", label: "Live Tracking" },
      { id: "projects_tasks", label: "Projects & Tasks" },
    ]
  },
  {
    id: "admin_reporting", label: "Admin & Reporting",
    subModules: [
      { id: "reports", label: "Reports" },
      { id: "alerts", label: "Alerts" },
      { id: "communication", label: "Communication & Meetings" },
      { id: "documents", label: "Documents" },
    ]
  }
];

export function SuperAdminModulesTab() {
  const { sites } = useMasterData();

  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const currentOrgId = sessionStorage.getItem("organizationId");
  const isImpersonating = isGlobalAdmin && currentOrgId && currentOrgId !== "null";
  const isSuperAdmin = isGlobalAdmin && !isImpersonating;

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(isSuperAdmin ? "" : (currentOrgId || ""));
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/organizations/")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOrganizations(data);
        else if (data?.results) setOrganizations(data.results);
      })
      .catch(() => {});
  }, []);

  // Filter sites by org
  const availableSites = isSuperAdmin
    ? sites.filter(s => s.organization === selectedOrgId || s.orgId === selectedOrgId)
    : sites.filter(s => s.organization === currentOrgId || s.orgId === currentOrgId);

  const selectedSite = availableSites.find(s => s.id === selectedSiteId);

  // When site is selected, load its current modules
  useEffect(() => {
    if (selectedSiteId && selectedSite) {
      setSelectedModules(selectedSite.modulesEnabled || []);
    }
  }, [selectedSiteId]);

  const toggleModule = (moduleId: string, subModuleIds: string[]) => {
    setSelectedModules(prev => {
      const allSelected = prev.includes(moduleId);
      if (allSelected) {
        // Remove parent and all children
        return prev.filter(m => m !== moduleId && !subModuleIds.includes(m));
      } else {
        // Add parent and all children
        const toAdd = [moduleId, ...subModuleIds].filter(m => !prev.includes(m));
        return [...prev, ...toAdd];
      }
    });
  };

  const toggleSubModule = (subId: string, parentId: string, allSubIds: string[]) => {
    setSelectedModules(prev => {
      const isSelected = prev.includes(subId);
      let next = isSelected ? prev.filter(m => m !== subId) : [...prev, subId];
      
      // Auto add/remove parent
      const anySubSelected = allSubIds.some(s => next.includes(s));
      if (anySubSelected && !next.includes(parentId)) next = [...next, parentId];
      if (!anySubSelected) next = next.filter(m => m !== parentId);
      
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedSiteId) {
      toast.error("Please select a site first.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sites/${selectedSiteId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-Id": selectedOrgId || currentOrgId || ""
        },
        body: JSON.stringify({ modulesEnabled: selectedModules })
      });

      if (res.ok) {
        toast.success("Modules updated successfully! Changes take effect on next login.");
        // Update session if this is the user's own site
        const siteOrgId = selectedSite?.organization || selectedSite?.orgId;
        if (siteOrgId === currentOrgId) {
          sessionStorage.setItem("modulesEnabled", JSON.stringify(selectedModules));
        }
      } else {
        toast.error("Failed to save modules.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectAll = () => {
    const all: string[] = [];
    MODULES_HIERARCHY.forEach(m => {
      all.push(m.id);
      m.subModules.forEach(s => all.push(s.id));
    });
    setSelectedModules(all);
  };

  const clearAll = () => setSelectedModules([]);

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#2563eb] p-1.5 bg-[#2563eb]/10 rounded-lg" />
          Module Configuration
        </h1>
        <p className="text-muted-foreground text-base">
          Control which modules are available for each site / project in your organization.
        </p>
      </div>

      {/* Scope Selection */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className={`grid grid-cols-1 gap-6 ${isSuperAdmin ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#2563eb]" /> Organization
                </Label>
                <Select value={selectedOrgId} onValueChange={v => { setSelectedOrgId(v); setSelectedSiteId(""); setSelectedModules([]); }}>
                  <SelectTrigger className="bg-background h-11">
                    <SelectValue placeholder="Select an organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2563eb]" /> Site / Project
              </Label>
              <Select
                value={selectedSiteId}
                onValueChange={v => setSelectedSiteId(v)}
                disabled={isSuperAdmin && !selectedOrgId}
              >
                <SelectTrigger className="bg-background h-11 disabled:opacity-50">
                  <SelectValue placeholder={isSuperAdmin && !selectedOrgId ? "Select org first" : "Choose a site..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableSites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{site.name}</span>
                        {site.siteCode && <span className="text-xs text-muted-foreground">{site.siteCode}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <Label className="text-sm font-semibold opacity-0">Actions</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1 h-11" onClick={selectAll} disabled={!selectedSiteId}>
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Select All
                </Button>
                <Button variant="outline" size="sm" className="gap-1 h-11" onClick={clearAll} disabled={!selectedSiteId}>
                  <XCircle className="w-4 h-4 text-red-400" /> Clear All
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Toggles */}
      {selectedSiteId ? (
        <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Modules for: <span className="text-[#2563eb]">{selectedSite?.name || "Selected Site"}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedModules.length} module{selectedModules.length !== 1 ? "s" : ""} enabled
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-2 h-11 px-6 font-semibold shadow-md"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODULES_HIERARCHY.map(mod => {
              const subIds = mod.subModules.map(s => s.id);
              const isParentChecked = selectedModules.includes(mod.id);
              const someSubChecked = subIds.some(s => selectedModules.includes(s));

              return (
                <Card key={mod.id} className={`border transition-all duration-200 ${isParentChecked ? "border-[#2563eb]/40 bg-[#2563eb]/[0.02] shadow-sm" : "border-border"}`}>
                  <CardContent className="p-5">
                    {/* Parent Module */}
                    <div className="flex items-center gap-3 mb-4">
                      <Checkbox
                        id={`mod-${mod.id}`}
                        checked={isParentChecked}
                        className={isParentChecked ? "border-[#2563eb] data-[state=checked]:bg-[#2563eb]" : ""}
                        onCheckedChange={() => toggleModule(mod.id, subIds)}
                      />
                      <label htmlFor={`mod-${mod.id}`} className="font-bold text-base cursor-pointer flex items-center gap-2">
                        {mod.label}
                        {isParentChecked && (
                          <Badge className="bg-[#2563eb]/10 text-[#2563eb] border-none text-xs font-medium">Active</Badge>
                        )}
                      </label>
                    </div>

                    {/* Sub Modules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 ml-7">
                      {mod.subModules.map(sub => {
                        const isSubChecked = selectedModules.includes(sub.id);
                        return (
                          <div key={sub.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`sub-${sub.id}`}
                              checked={isSubChecked}
                              className={isSubChecked ? "border-[#2563eb] data-[state=checked]:bg-[#2563eb]" : ""}
                              onCheckedChange={() => toggleSubModule(sub.id, mod.id, subIds)}
                            />
                            <label
                              htmlFor={`sub-${sub.id}`}
                              className={`text-sm cursor-pointer transition-colors ${isSubChecked ? "text-foreground font-medium" : "text-muted-foreground"}`}
                            >
                              {sub.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-2 h-12 px-8 font-semibold shadow-md"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save Module Configuration"}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <Settings className="w-12 h-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-lg text-muted-foreground">Select a site to configure modules</h3>
            <p className="text-sm text-muted-foreground/70 max-w-sm">
              Choose a site from the dropdown above to see and manage which modules are available for that site's users.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
