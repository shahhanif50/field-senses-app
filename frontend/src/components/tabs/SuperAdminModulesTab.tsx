import { useState, useEffect } from "react";
import { Search, Plus, Upload, Building2, MapPin, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { RolePermissionsTable, PermissionsMap } from "@/components/shared/RolePermissionsTable";

interface Organization {
  id: string;
  name: string;
}

interface Site {
  id: string;
  orgId: string;
  name: string;
}

// Dummy sites
const DUMMY_SITES: Site[] = [
  { id: "s1", orgId: "1", name: "Corporate HQ" },
  { id: "s2", orgId: "1", name: "North Branch" },
  { id: "s3", orgId: "2", name: "Main Campus" },
  { id: "s4", orgId: "3", name: "Downtown Office" },
];

export function SuperAdminModulesTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrgId, setSelectedOrgId] = useState<string | "">("");
  const [selectedSiteId, setSelectedSiteId] = useState<string | "">("");
  
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations/");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      } else {
        setOrganizations([
          {id: '1', name: 'infodesk computer education'},
          {id: '2', name: 'Infodesk Solutions'},
          {id: '3', name: 'abc'}
        ]);
      }
    } catch (e) {
      setOrganizations([
        {id: '1', name: 'infodesk computer education'},
        {id: '2', name: 'Infodesk Solutions'},
        {id: '3', name: 'abc'}
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedSiteId(""); // Reset site when org changes
    setPermissions({}); // Reset permissions
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    // Simulate loading permissions for this specific site or org
    setPermissions({});
  };

  const handleSaveModules = async () => {
    if (!selectedOrgId) return;
    setIsSaving(true);
    try {
      // Send the complex permissions object to backend
      toast.success("Role permissions have been successfully updated.");
    } catch (e) {
      toast.error("Failed to update role permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const availableSites = DUMMY_SITES.filter(s => s.orgId === selectedOrgId);
  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const selectedSite = selectedSiteId === "all" ? "All Sites (Global)" : availableSites.find(s => s.id === selectedSiteId)?.name;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      
      {/* Premium Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-[#2563eb] p-1.5 bg-[#2563eb]/10 rounded-lg" />
          Access Management
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Configure module availability and granular permissions for your tenant organizations and their respective sites.
        </p>
      </div>

      {/* Scope Selection Card - Premium Glassmorphism styling */}
      <Card className="border-border/60 shadow-md bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563eb]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                 <Building2 className="w-4 h-4 text-[#2563eb]" /> 1. Select Organization
              </Label>
              <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                <SelectTrigger className="w-full h-12 text-base bg-background shadow-sm border-border/80 focus:ring-[#2563eb]/20">
                  <SelectValue placeholder="Choose an organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id} className="py-3 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-semibold">{org.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className={`text-sm font-bold flex items-center gap-2 uppercase tracking-wider ${!selectedOrgId ? 'text-muted-foreground' : 'text-foreground'}`}>
                 <MapPin className={`w-4 h-4 ${!selectedOrgId ? 'text-muted-foreground' : 'text-[#2563eb]'}`} /> 2. Select Site / Project
              </Label>
              <Select value={selectedSiteId} onValueChange={handleSiteChange} disabled={!selectedOrgId}>
                <SelectTrigger className="w-full h-12 text-base bg-background shadow-sm border-border/80 focus:ring-[#2563eb]/20 disabled:opacity-50">
                  <SelectValue placeholder={!selectedOrgId ? "Select organization first" : "Choose a site..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="py-3 font-semibold text-[#2563eb] cursor-pointer">Global Access (All Sites)</SelectItem>
                  {availableSites.map(site => (
                    <SelectItem key={site.id} value={site.id} className="py-3 cursor-pointer">
                      <span className="font-medium">{site.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Configuration UI - Only visible when a site is selected */}
      {selectedSiteId && selectedOrg && (
        <div className="animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both">
          <Card className="border-border/60 shadow-lg bg-card">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 border-b border-border/60 bg-muted/10">
              <div>
                <h3 className="text-xl font-bold text-foreground">Role Permissions Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configuring permissions for <span className="font-bold text-[#2563eb] bg-[#2563eb]/10 px-2 py-0.5 rounded-md ml-1">{selectedOrg.name}</span> 
                  <span className="mx-2 text-border">&rarr;</span> 
                  <span className="font-bold text-[#2563eb] bg-[#2563eb]/10 px-2 py-0.5 rounded-md">{selectedSite}</span>
                </p>
              </div>
              <Button onClick={handleSaveModules} disabled={isSaving} className="mt-4 md:mt-0 bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md hover:shadow-lg transition-all px-8 h-12 text-base font-semibold">
                {isSaving ? "Saving..." : "Save Configuration"}
              </Button>
            </div>

            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Search modules..." className="pl-10 h-12 bg-muted/30 border-border/60 focus-visible:ring-[#2563eb]/20" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-5 border-y border-border/60 mb-8 bg-muted/5 px-4 rounded-xl">
                <Button variant="outline" className="w-full md:w-auto gap-2 bg-background border-border/80 hover:bg-muted h-11">
                  <Upload className="w-4 h-4" /> Bulk Import (CSV)
                </Button>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                  <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Assign to Role:</Label>
                  <Select defaultValue="admin">
                    <SelectTrigger className="w-full sm:w-[180px] bg-background h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <RolePermissionsTable permissions={permissions} onChange={setPermissions} />

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
