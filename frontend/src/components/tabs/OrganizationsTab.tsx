import { useState, useEffect } from "react";
import { Building2, Plus, Shield, CheckCircle2, XCircle, Settings, Trash2, UserPlus, Eye, MapPin, LayoutGrid, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Organization {
  id: string;
  name: string;
  domain: string;
  modulesEnabled: string[];
  is_deleted: boolean;
  createdAt: string;
  admins?: {id: string, name: string, email: string}[];
}

const AVAILABLE_MODULES = [
  "Master Setup", "Employee Portal", "Daily Tracking", "Team Tracking", 
  "Live Tracking", "Reports", "Alerts", 
  "Attendance & Leaves", "Projects & Tasks", "Communication & Meetings", 
  "Documents", "Inventory Management", "Sales Executive"
];

export function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ 
    name: "", domain: "", companyName: "", entityName: "", site: "", 
    country: "", region: "", state: "", city: "", zone: "", 
    whiteLabel: false, subDomain: "", solutionType: "", solutionFor: "", billingTerm: "",
    modulesEnabled: ["Master Setup", "Employee Portal"] 
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editOrgForm, setEditOrgForm] = useState({ 
    name: "", domain: "", companyName: "", entityName: "", site: "", 
    country: "", region: "", state: "", city: "", zone: "", 
    whiteLabel: false, subDomain: "", solutionType: "", solutionFor: "", billingTerm: "",
    modulesEnabled: [] as string[] 
  });

  const [orgFilters, setOrgFilters] = useState({ search: "", region: "", country: "", state: "", city: "", zone: "" });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [newAdminSites, setNewAdminSites] = useState<string[]>([]);
  const [adminOrgSites, setAdminOrgSites] = useState<any[]>([]);

  const [isSitesModalOpen, setIsSitesModalOpen] = useState(false);
  const [selectedOrgIdForSites, setSelectedOrgIdForSites] = useState<string | null>(null);
  const [orgSites, setOrgSites] = useState<any[]>([]);
  const [newSite, setNewSite] = useState<any>({ name: "", siteCode: "", productType: "", country: "", address: "", activateDate: "", status: "Active", contactName: "", contactPhone: "", contactEmail: "", modulesEnabled: [] });

  const fetchSitesForOrg = async (orgId: string) => {
    setOrgSites([]); // Clear stale data before fetching
    try {
      const res = await fetch(`/api/sites/`, {
        headers: { 'X-Organization-Id': orgId }
      });
      if (res.ok) {
        const data = await res.json();
        setOrgSites(Array.isArray(data) ? data : data.results || []);
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (isSitesModalOpen && selectedOrgIdForSites) {
      fetchSitesForOrg(selectedOrgIdForSites);
    } else {
      setNewSite({ id: "", name: "", siteCode: "", productType: "", country: "", address: "", activateDate: "", status: "Active", contactName: "", contactPhone: "", contactEmail: "", modulesEnabled: [] });
    }
  }, [isSitesModalOpen, selectedOrgIdForSites]);

  useEffect(() => {
    if (isAdminModalOpen && selectedOrgId) {
      const fetchAdminSites = async () => {
        try {
          const res = await fetch(`/api/sites/`, {
            headers: { 'X-Organization-Id': selectedOrgId }
          });
          if (res.ok) {
            const data = await res.json();
            setAdminOrgSites(Array.isArray(data) ? data : data.results || []);
          }
        } catch(e) { console.error(e); }
      };
      fetchAdminSites();
    } else {
      setNewAdminSites([]);
      setAdminOrgSites([]);
    }
  }, [isAdminModalOpen, selectedOrgId]);

  const handleCreateSite = async () => {
    if (!newSite.name) return toast.error("Site name is required");
    try {
      const isUpdate = !!newSite.id;
      const url = isUpdate ? `/api/sites/${newSite.id}/` : `/api/sites/`;
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "X-Organization-Id": selectedOrgIdForSites || "" },
        body: JSON.stringify({ ...newSite, organization: selectedOrgIdForSites })
      });
      if (res.ok) {
        toast.success(isUpdate ? "Site updated successfully" : "Site added successfully");
        setNewSite({ id: "", name: "", siteCode: "", productType: "", country: "", address: "", activateDate: "", status: "Active", contactName: "", contactPhone: "", contactEmail: "", modulesEnabled: [] });
        fetchSitesForOrg(selectedOrgIdForSites!);
      } else {
        toast.error(isUpdate ? "Failed to update site" : "Failed to add site");
      }
    } catch(e) {
      toast.error("Network error");
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;
    try {
      const res = await fetch(`/api/sites/${siteId}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Site deleted successfully");
        if (selectedOrgIdForSites) fetchSitesForOrg(selectedOrgIdForSites);
      } else {
        toast.error("Failed to delete site");
      }
    } catch(e) {
      toast.error("Network error");
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations/");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async () => {
    if (!newOrg.name) return toast.error("Name is required");
    try {
      const res = await fetch("/api/organizations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrg),
      });
      if (res.ok) {
        toast.success("Organization created successfully");
        setIsNewModalOpen(false);
        fetchOrganizations();
        setNewOrg({ name: "", domain: "", modulesEnabled: ["Master Setup", "Employee Portal"] } as any);
      }
    } catch (e) {
      toast.error("Failed to create organization");
    }
  };

  const handleUpdateOrg = async () => {
    if (!editingOrg) return;
    if (!editOrgForm.name) return toast.error("Name is required");
    try {
      const res = await fetch(`/api/organizations/${editingOrg.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editOrgForm),
      });
      if (res.ok) {
        toast.success("Organization updated successfully");
        setIsEditModalOpen(false);
        fetchOrganizations();
      } else {
        toast.error("Failed to update organization");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleToggleStatus = async (org: Organization) => {
    const actionText = org.is_deleted ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${actionText} this organization?`)) return;
    try {
      const res = await fetch(`/api/organizations/${org.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_deleted: !org.is_deleted }),
      });
      if (res.ok) {
        toast.success(`Organization successfully ${actionText}d`);
        fetchOrganizations();
      }
    } catch (e) {
      toast.error(`Failed to ${actionText} organization`);
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    if (!window.confirm("Are you absolutely sure you want to permanently delete this organization? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/organizations/${orgId}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success("Organization permanently deleted");
        fetchOrganizations();
      } else {
        toast.error("Failed to delete organization");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleCreateAdmin = async () => {
    if (!selectedOrgId || !newAdmin.name || !newAdmin.email || !newAdmin.password) {
      return toast.error("All fields are required");
    }
    
    if (isCreatingAdmin) return;
    setIsCreatingAdmin(true);

    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/create_admin/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...newAdmin, sites: newAdminSites}),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Admin created successfully! Credentials: " + newAdmin.email);
        setIsAdminModalOpen(false);
        setNewAdmin({ name: "", email: "", password: "" });
        setNewAdminSites([]);
        fetchOrganizations();
      } else {
        toast.error(data.error || "Failed to create admin");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (orgId: string, adminId: string) => {
    if (!window.confirm("Are you sure you want to remove this admin from the organization?")) return;
    try {
      const res = await fetch(`/api/organizations/${orgId}/delete_admin/?admin_id=${adminId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success("Admin removed successfully");
        fetchOrganizations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove admin");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };


  const handleImpersonate = (orgId: string, orgName: string, modulesEnabled: string[] = []) => {
    sessionStorage.setItem("organizationId", orgId);
    
    // Save the global modules so we can restore them later
    if (!sessionStorage.getItem("globalModulesEnabled")) {
      sessionStorage.setItem("globalModulesEnabled", sessionStorage.getItem("modulesEnabled") || '["All"]');
    }
    // Set the specific tenant's modules
    sessionStorage.setItem("modulesEnabled", JSON.stringify(modulesEnabled));

    toast.success(`Now viewing data for ${orgName}`, {
      description: "Refreshing page to apply filters..."
    });
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  const clearImpersonation = () => {
    sessionStorage.setItem("organizationId", "null");
    
    // Restore global modules
    const globalModules = sessionStorage.getItem("globalModulesEnabled");
    if (globalModules) {
      sessionStorage.setItem("modulesEnabled", globalModules);
    } else {
      sessionStorage.setItem("modulesEnabled", '["All"]');
    }

    toast.success("Returned to Global View");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  const currentOrgId = sessionStorage.getItem("organizationId");

  if (isSitesModalOpen && selectedOrgIdForSites) {
    const org = organizations.find(o => o.id === selectedOrgIdForSites);
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <MapPin className="w-6 h-6 text-primary" />
              Manage Sites for {org?.name}
            </h2>
            <p className="text-muted-foreground mt-1">Add new sites or manage existing locations for this organization.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsSitesModalOpen(false)}>Back to Organizations</Button>
            <Button variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20" onClick={() => {
              setNewSite({ id: "", name: "", siteCode: "", productType: "", country: "", address: "", activateDate: "", status: "Active", contactName: "", contactPhone: "", contactEmail: "", modulesEnabled: [] });
              document.getElementById('site-form')?.scrollIntoView({ behavior: 'smooth' });
            }}><Plus className="w-4 h-4 mr-1"/> Add Site</Button>
            <Button onClick={handleCreateSite} className="gradient-btn">{newSite.id ? "Update Site" : "Save New Site"}</Button>
          </div>
        </div>

        {/* Existing Sites List */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">Existing Sites</h3>
          {orgSites.length === 0 ? <p className="text-sm text-muted-foreground">No sites found.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orgSites.map(site => (
                <div key={site.id} className="p-4 border rounded-xl flex justify-between items-start bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm text-foreground">{site.name}</p>
                      {site.siteCode && <Badge variant="outline" className="text-xs bg-card">{site.siteCode}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{site.address || "No address provided"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={() => setNewSite(site)} title="Edit Site">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSite(site.id)} title="Delete Site">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Site Form */}
        <div id="site-form" className="bg-muted/50 p-6 rounded-xl space-y-6 shadow-inner border border-border">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-bold text-foreground">{newSite.id ? "Edit Site / Project" : "Add New Site / Project"}</h3>
            {newSite.id && <Button variant="ghost" size="sm" onClick={() => setNewSite({ id: "", name: "", siteCode: "", productType: "", country: "", address: "", activateDate: "", status: "Active", contactName: "", contactPhone: "", contactEmail: "", modulesEnabled: [] })}>Cancel Edit</Button>}
          </div>
          {/* Site Details Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-foreground">Site Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Site Name *</Label>
                <Input className="border-border" value={newSite.name || ""} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} placeholder="e.g., Corporate HQ" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Site Code *</Label>
                <Input className="border-border" value={newSite.siteCode || ""} onChange={(e) => setNewSite({ ...newSite, siteCode: e.target.value })} placeholder="e.g., CHQ-001" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Select Product</Label>
                <Select value={newSite.productType || ""} onValueChange={(value) => setNewSite({ ...newSite, productType: value })}>
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
                <Input className="border-border" value={newSite.country || ""} onChange={(e) => setNewSite({ ...newSite, country: e.target.value })} placeholder="Select or type country" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Location Address</Label>
                <textarea className="w-full min-h-[100px] p-3 text-sm rounded-md border border-border bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={newSite.address || ""} onChange={(e) => setNewSite({ ...newSite, address: e.target.value })} placeholder="Enter full address..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Activate Date</Label>
                <Input type="date" className="border-border" value={newSite.activateDate || ""} onChange={(e) => setNewSite({ ...newSite, activateDate: e.target.value })} />
              </div>
              <div className="flex items-center justify-between space-y-0 h-full pt-6">
                <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                <Switch checked={newSite.status === "Active" || !newSite.status} onCheckedChange={(checked) => setNewSite({ ...newSite, status: checked ? "Active" : "Inactive" })} />
              </div>
            </div>
          </div>

          {/* Contact Person Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-foreground">Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Full Name *</Label>
                <Input className="border-border" value={newSite.contactName || ""} onChange={(e) => setNewSite({ ...newSite, contactName: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
                <Input className="border-border" value={newSite.contactPhone || ""} onChange={(e) => setNewSite({ ...newSite, contactPhone: e.target.value })} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                <Input type="email" className="border-border" value={newSite.contactEmail || ""} onChange={(e) => setNewSite({ ...newSite, contactEmail: e.target.value })} placeholder="john.doe@example.com" />
              </div>
            </div>
          </div>

          {/* Module Access Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-base font-bold text-foreground">Module Access</h3>
               <div className="flex items-center gap-2">
                 <Input placeholder="Search modules..." className="w-64 h-8 text-xs border-border" />
                 <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-1"/> Add Module</Button>
               </div>
            </div>
            
            <div className="space-y-6 p-4 rounded-xl border border-border/50 bg-muted/30">
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center justify-between border-b pb-1">
                   Field Operations
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-2">
                  {["Master Setup", "Employee Portal", "Daily Tracking", "Team Tracking", "Live Tracking"].map(mod => (
                    <label key={mod} className={`flex items-center gap-2 text-xs cursor-pointer`}>
                      <input type="checkbox" className="rounded border-input text-blue-600" checked={(newSite.modulesEnabled || []).includes(mod)} onChange={(e) => {
                        const current = newSite.modulesEnabled || [];
                        if (e.target.checked) setNewSite({ ...newSite, modulesEnabled: [...current, mod] });
                        else setNewSite({ ...newSite, modulesEnabled: current.filter((m: string) => m !== mod) });
                      }} /> {mod}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-sm text-foreground flex items-center justify-between border-b pb-1">
                   Sales & Inventory
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-2">
                  {["Sales Executive", "Inventory Management", "Product Catalog"].map(mod => (
                    <label key={mod} className={`flex items-center gap-2 text-xs cursor-pointer`}>
                      <input type="checkbox" className="rounded border-input text-blue-600" checked={(newSite.modulesEnabled || []).includes(mod)} onChange={(e) => {
                        const current = newSite.modulesEnabled || [];
                        if (e.target.checked) setNewSite({ ...newSite, modulesEnabled: [...current, mod] });
                        else setNewSite({ ...newSite, modulesEnabled: current.filter((m: string) => m !== mod) });
                      }} /> {mod}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-sm text-foreground flex items-center justify-between border-b pb-1">
                   Productivity & Reports
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-2">
                  {["Reports", "Alerts", "Documents", "Projects & Tasks", "Communication & Meetings", "Attendance & Leaves"].map(mod => (
                    <label key={mod} className={`flex items-center gap-2 text-xs cursor-pointer`}>
                      <input type="checkbox" className="rounded border-input text-blue-600" checked={(newSite.modulesEnabled || []).includes(mod)} onChange={(e) => {
                        const current = newSite.modulesEnabled || [];
                        if (e.target.checked) setNewSite({ ...newSite, modulesEnabled: [...current, mod] });
                        else setNewSite({ ...newSite, modulesEnabled: current.filter((m: string) => m !== mod) });
                      }} /> {mod}
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Global Organizations (Tenants)
          </h2>
          <p className="text-muted-foreground">Manage your SaaS tenants, their active modules, and administration.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-border mr-2 hidden sm:flex">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")} title="Grid View">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")} title="List View">
              <List className="w-4 h-4" />
            </Button>
          </div>
          {currentOrgId && currentOrgId !== "null" && (
            <Button variant="outline" className="border-primary text-primary" onClick={clearImpersonation}>
              Exit Organization View
            </Button>
          )}
          <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Organization Details</h3>
                <p className="text-sm text-muted-foreground mb-4">Provide the essential information for the new organization.</p>
                
                <h4 className="text-sm font-medium mb-3">General Information</h4>
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Organization Name *</Label>
                    <Input placeholder="Acme Corporation" value={newOrg.name} onChange={(e) => setNewOrg({...newOrg, name: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Company details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company Name *</Label>
                    <Input placeholder="Acme Inc." value={newOrg.companyName} onChange={(e) => setNewOrg({...newOrg, companyName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Entity</Label>
                    <Input placeholder="Acme Global Entity" value={newOrg.entityName} onChange={(e) => setNewOrg({...newOrg, entityName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Site</Label>
                    <Input placeholder="Enter your site" value={newOrg.site} onChange={(e) => setNewOrg({...newOrg, site: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Location Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Country</Label>
                    <Input placeholder="Select or type country" value={newOrg.country} onChange={(e) => setNewOrg({...newOrg, country: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Region</Label>
                    <Input placeholder="Select or type region" value={newOrg.region} onChange={(e) => setNewOrg({...newOrg, region: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">State</Label>
                    <Input placeholder="Select or type state" value={newOrg.state} onChange={(e) => setNewOrg({...newOrg, state: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">City</Label>
                    <Input placeholder="Select or type city" value={newOrg.city} onChange={(e) => setNewOrg({...newOrg, city: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Zone</Label>
                    <Input placeholder="Select or type zone" value={newOrg.zone} onChange={(e) => setNewOrg({...newOrg, zone: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Advanced Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-center">
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs mb-2">White Label</Label>
                    <Switch checked={newOrg.whiteLabel} onCheckedChange={(checked) => setNewOrg({...newOrg, whiteLabel: checked})} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">Sub - Domain</Label>
                    <Input placeholder="www.hml.com" value={newOrg.subDomain} onChange={(e) => setNewOrg({...newOrg, subDomain: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Billing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Solution Type</Label>
                    <Select value={newOrg.solutionType} onValueChange={(val) => setNewOrg({...newOrg, solutionType: val})}>
                      <SelectTrigger><SelectValue placeholder="-- Please choose an option --" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="onpremise">On-Premise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Solution For</Label>
                    <Select value={newOrg.solutionFor} onValueChange={(val) => setNewOrg({...newOrg, solutionFor: val})}>
                      <SelectTrigger><SelectValue placeholder="-- Please choose an option --" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="smb">SMB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Billing Term</Label>
                    <Select value={newOrg.billingTerm} onValueChange={(val) => setNewOrg({...newOrg, billingTerm: val})}>
                      <SelectTrigger><SelectValue placeholder="-- Please choose an option --" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateOrg}>Save Organization</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Organization Details</h3>
                
                <h4 className="text-sm font-medium mb-3">General Information</h4>
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Organization Name *</Label>
                    <Input placeholder="Acme Corporation" value={editOrgForm.name} onChange={(e) => setEditOrgForm({...editOrgForm, name: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Company details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company Name *</Label>
                    <Input placeholder="Acme Inc." value={editOrgForm.companyName} onChange={(e) => setEditOrgForm({...editOrgForm, companyName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Entity</Label>
                    <Input placeholder="Acme Global Entity" value={editOrgForm.entityName} onChange={(e) => setEditOrgForm({...editOrgForm, entityName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Site</Label>
                    <Input placeholder="Enter your site" value={editOrgForm.site} onChange={(e) => setEditOrgForm({...editOrgForm, site: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Location Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Country</Label>
                    <Input placeholder="Select or type country" value={editOrgForm.country} onChange={(e) => setEditOrgForm({...editOrgForm, country: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Region</Label>
                    <Input placeholder="Select or type region" value={editOrgForm.region} onChange={(e) => setEditOrgForm({...editOrgForm, region: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">State</Label>
                    <Input placeholder="Select or type state" value={editOrgForm.state} onChange={(e) => setEditOrgForm({...editOrgForm, state: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">City</Label>
                    <Input placeholder="Select or type city" value={editOrgForm.city} onChange={(e) => setEditOrgForm({...editOrgForm, city: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Zone</Label>
                    <Input placeholder="Select or type zone" value={editOrgForm.zone} onChange={(e) => setEditOrgForm({...editOrgForm, zone: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Advanced Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-center">
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs mb-2">White Label</Label>
                    <Switch checked={editOrgForm.whiteLabel} onCheckedChange={(checked) => setEditOrgForm({...editOrgForm, whiteLabel: checked})} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">Sub - Domain</Label>
                    <Input placeholder="www.hml.com" value={editOrgForm.subDomain} onChange={(e) => setEditOrgForm({...editOrgForm, subDomain: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-3">Billing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Solution Type</Label>
                    <Select value={editOrgForm.solutionType} onValueChange={(val) => setEditOrgForm({...editOrgForm, solutionType: val})}>
                      <SelectTrigger><SelectValue placeholder="-- Please choose an option --" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="onpremise">On-Premise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Solution For</Label>
                    <Select value={editOrgForm.solutionFor} onValueChange={(val) => setEditOrgForm({...editOrgForm, solutionFor: val})}>
                      <SelectTrigger><SelectValue placeholder="-- Please choose an option --" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="smb">SMB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Billing Term</Label>
                    <Select value={editOrgForm.billingTerm} onValueChange={(val) => setEditOrgForm({...editOrgForm, billingTerm: val})}>
                      <SelectTrigger><SelectValue placeholder="-- Please choose an option --" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateOrg}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create Tenant Administrator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Full Name</label>
                <Input 
                  placeholder="John Doe" 
                  value={newAdmin.name} 
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Email</label>
                <Input 
                  type="email"
                  placeholder="admin@company.com" 
                  value={newAdmin.email} 
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temporary Password</label>
                <Input 
                  type="text"
                  placeholder="Password123!" 
                  value={newAdmin.password} 
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium mb-2 block">Assigned Sites (Optional)</label>
                {adminOrgSites.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No sites available. Admin will have global access.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                      <div className="text-xs text-muted-foreground mb-1">Select sites to restrict this admin's access. If none selected, they have global access.</div>
                      {adminOrgSites.map(site => (
                        <div key={site.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`admin-site-${site.id}`} 
                            checked={newAdminSites.includes(site.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewAdminSites([...newAdminSites, site.id]);
                              } else {
                                setNewAdminSites(newAdminSites.filter(id => id !== site.id));
                              }
                            }}
                          />
                          <label htmlFor={`admin-site-${site.id}`} className="text-sm cursor-pointer">{site.name}</label>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdminModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAdmin} disabled={isCreatingAdmin}>
                {isCreatingAdmin ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p>Loading organizations...</p>
          ) : organizations.length === 0 ? (
            <p className="text-muted-foreground col-span-3">No organizations found. Create your first tenant above.</p>
          ) : (
            organizations.map((org) => (
              <Card key={org.id} className="relative overflow-hidden group border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/40 opacity-50 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3 px-5 pt-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight">{org.name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3" />
                        {org.domain || "No domain set"}
                      </p>
                    </div>
                    <Badge variant={org.is_deleted ? "destructive" : "default"} className="shadow-none">
                      {org.is_deleted ? "Inactive" : "Active"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modules Enabled</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {org.modulesEnabled && org.modulesEnabled.map((mod: string) => (
                          <Badge key={mod} variant="secondary" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 text-[10px] transition-colors shadow-none">
                            {mod}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administrators</span>
                      <div className="mt-2 space-y-2">
                        {org.admins && org.admins.length > 0 ? (
                          org.admins.map((admin, idx) => (
                            <div key={admin.id || idx} className="flex items-center gap-2.5 bg-muted/40 p-2 rounded-lg border border-border/30 transition-colors hover:bg-muted/60">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                {admin.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium leading-none truncate">{admin.name}</span>
                                <span className="text-[10px] text-muted-foreground mt-1 truncate">{admin.email}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0" 
                                onClick={() => handleDeleteAdmin(org.id, admin.id)}
                                title="Remove Admin"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded-lg border border-dashed border-border/50 text-center">No admins assigned</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-background/50 hover:bg-muted" onClick={() => {
                          sessionStorage.setItem("viewOrganizationIdForSites", org.id);
                          window.dispatchEvent(new CustomEvent("changeTab", { detail: "superadmin-sites" }));
                        }}>
                          <MapPin className="w-3.5 h-3.5 mr-1.5" />
                          Sites
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-background/50 hover:bg-muted" onClick={() => {
                          sessionStorage.setItem("viewOrganizationId", org.id);
                          window.dispatchEvent(new CustomEvent("changeTab", { detail: "organization-details" }));
                        }}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={() => {
                          setEditingOrg(org);
                          setEditOrgForm({ name: org.name, domain: org.domain || "", modulesEnabled: org.modulesEnabled || [] } as any);
                          setIsEditModalOpen(true);
                        }} title="Edit Organization">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => {
                          setSelectedOrgId(org.id);
                          setIsAdminModalOpen(true);
                        }}>
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${org.is_deleted ? "text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600" : "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"}`} onClick={() => handleToggleStatus(org)} title={org.is_deleted ? "Activate Organization" : "Deactivate Organization"}>
                          {org.is_deleted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </Button>
                        {org.is_deleted && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOrg(org.id)} title="Delete Organization">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <h3 className="text-sm font-semibold mb-3">Filters</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <Input placeholder="Search organizations..." className="w-48 h-9 text-sm" value={orgFilters.search} onChange={e => setOrgFilters({...orgFilters, search: e.target.value})} />
              <Select value={orgFilters.region} onValueChange={v => setOrgFilters({...orgFilters, region: v})}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Region" /></SelectTrigger>
                <SelectContent><SelectItem value="North America">North America</SelectItem><SelectItem value="Europe">Europe</SelectItem></SelectContent>
              </Select>
              <Select value={orgFilters.country} onValueChange={v => setOrgFilters({...orgFilters, country: v})}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent><SelectItem value="US">US</SelectItem><SelectItem value="UK">UK</SelectItem></SelectContent>
              </Select>
              <Select value={orgFilters.state} onValueChange={v => setOrgFilters({...orgFilters, state: v})}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent><SelectItem value="CA">California</SelectItem><SelectItem value="NY">New York</SelectItem></SelectContent>
              </Select>
              <Select value={orgFilters.city} onValueChange={v => setOrgFilters({...orgFilters, city: v})}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent><SelectItem value="SF">San Francisco</SelectItem><SelectItem value="London">London</SelectItem></SelectContent>
              </Select>
              <Select value={orgFilters.zone} onValueChange={v => setOrgFilters({...orgFilters, zone: v})}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Zone" /></SelectTrigger>
                <SelectContent><SelectItem value="Z1">Zone 1</SelectItem></SelectContent>
              </Select>
              <Button variant="outline" className="h-9 text-sm" onClick={() => setOrgFilters({search: "", region: "", country: "", state: "", city: "", zone: ""})}>Clear Filters</Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Entity Name</TableHead>
                  <TableHead>Total Sites</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date Time</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right sticky right-0 bg-muted/50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-8">Loading organizations...</TableCell></TableRow>
                ) : organizations.length === 0 ? (
                  <TableRow><TableCell colSpan={13} className="text-center py-8 text-muted-foreground">No organizations found. Create your first tenant above.</TableCell></TableRow>
                ) : (
                  organizations.map((org: any) => (
                    <TableRow key={org.id} className="group hover:bg-muted/30">
                      <TableCell className="font-semibold">{org.name}</TableCell>
                      <TableCell>{org.companyName || "-"}</TableCell>
                      <TableCell>{org.entityName || "-"}</TableCell>
                      <TableCell>{org.totalSites || "0"}</TableCell>
                      <TableCell>{org.country || "-"}</TableCell>
                      <TableCell>{org.region || "-"}</TableCell>
                      <TableCell>{org.state || "-"}</TableCell>
                      <TableCell>{org.city || "-"}</TableCell>
                      <TableCell>{org.zone || "-"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${!org.is_deleted ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {!org.is_deleted ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>{org.createdAt ? new Date(org.createdAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>Admin</TableCell>
                      <TableCell className="text-right sticky right-0 bg-card group-hover:bg-muted/30">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800" onClick={() => { sessionStorage.setItem("viewOrganizationId", org.id); window.dispatchEvent(new CustomEvent("changeTab", { detail: "organization-details" })); }}>
                            View
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { sessionStorage.setItem("viewOrganizationIdForSites", org.id); window.dispatchEvent(new CustomEvent("changeTab", { detail: "superadmin-sites" })); }} title="Sites"><MapPin className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={() => { setEditingOrg(org); setEditOrgForm({ name: org.name, domain: org.domain || "", companyName: org.companyName || "", entityName: org.entityName || "", site: org.site || "", country: org.country || "", region: org.region || "", state: org.state || "", city: org.city || "", zone: org.zone || "", whiteLabel: org.whiteLabel || false, subDomain: org.subDomain || "", solutionType: org.solutionType || "", solutionFor: org.solutionFor || "", billingTerm: org.billingTerm || "", modulesEnabled: org.modulesEnabled || [] }); setIsEditModalOpen(true); }} title="Edit"><Settings className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
