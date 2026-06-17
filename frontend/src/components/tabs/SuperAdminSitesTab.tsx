import { useState, useEffect } from "react";
import { Plus, Search, Upload, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";
import { MODULES_HIERARCHY } from "@/components/shared/RolePermissionsTable";
import { Checkbox } from "@/components/ui/checkbox";

export function SuperAdminSitesTab() {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { sites, setSites } = useMasterData();
  
  // Form State
  const [siteDetails, setSiteDetails] = useState({
    name: "", code: "", product: "", country: "", address: "", date: "", status: true, orgId: ""
  });
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/organizations/")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOrganizations(data);
        else if (data && Array.isArray(data.results)) setOrganizations(data.results);
      })
      .catch(console.error);
  }, []);
  const [contactPerson, setContactPerson] = useState({
    name: "", phone: "", email: ""
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  const handleManageSite = (site: any) => {
    setSiteDetails({
      name: site.name || "",
      code: site.siteCode || "",
      product: site.productType || "",
      country: site.country || "",
      address: site.address || "",
      date: site.activateDate || "",
      status: site.status !== "Inactive",
      orgId: site.organization || ""
    });
    setContactPerson({
      name: site.contactName || "",
      phone: site.contactPhone || "",
      email: site.contactEmail || ""
    });
    setSelectedModules(site.modulesEnabled || []);
    setEditingSiteId(site.id);
    setView("edit");
  };

  const handleDeleteSite = async (id: string) => {
    if (!confirm("Are you sure you want to delete this site?")) return;
    try {
      const res = await fetch(`/api/sites/${id}/`, { method: "DELETE" });
      if (res.ok) {
        setSites(prev => prev.filter(s => s.id !== id));
        toast.success("Site deleted successfully");
      } else {
        toast.error("Failed to delete site");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleSaveSite = async () => {
    if (!siteDetails.name) {
      toast.error("Site name is required.");
      return;
    }
    setIsSaving(true);
    try {
      const url = view === "edit" ? `/api/sites/${editingSiteId}/` : "/api/sites/";
      const method = view === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "X-Organization-Id": siteDetails.orgId || "null"
        },
        body: JSON.stringify({
          name: siteDetails.name,
          siteCode: siteDetails.code,
          productType: siteDetails.product,
          country: siteDetails.country,
          address: siteDetails.address,
          activateDate: siteDetails.date || null,
          status: siteDetails.status ? "Active" : "Inactive",
          contactName: contactPerson.name,
          contactEmail: contactPerson.email,
          contactPhone: contactPerson.phone,
          modulesEnabled: selectedModules,
        })
      });

      if (res.ok) {
        const newSite = await res.json();
        if (view === "edit") {
          setSites(prev => prev.map(s => s.id === editingSiteId ? newSite : s));
          toast.success("Site updated successfully");
        } else {
          setSites(prev => [...prev, newSite]);
          toast.success("Site created successfully");
        }
        setView("list");
        setSiteDetails({ name: "", code: "", product: "", country: "", address: "", date: "", status: true, orgId: "" });
        setContactPerson({ name: "", phone: "", email: "" });
        setSelectedModules([]);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to create site:", errData);
        const errMsg = errData.activateDate ? "Invalid Date Format" : (Object.values(errData)[0] || "Failed to create site");
        toast.error(`Error: ${errMsg}`);
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  if (view === "add" || view === "edit") {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setView("list")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-bold text-foreground">{view === "edit" ? "Edit Site / Project" : "Add Site / Project"}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
            <Button onClick={handleSaveSite} disabled={isSaving} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
              {isSaving ? "Saving..." : (view === "edit" ? "Update Site" : "Save Site")}
            </Button>
          </div>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 text-foreground">Site Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Select Organization <span className="text-red-500">*</span></Label>
                <Select value={siteDetails.orgId} onValueChange={v => setSiteDetails({...siteDetails, orgId: v})}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select an organization" /></SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Site Name <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g., Corporate HQ" value={siteDetails.name} onChange={e => setSiteDetails({...siteDetails, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Site Code <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g., CHQ-001" value={siteDetails.code} onChange={e => setSiteDetails({...siteDetails, code: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Select Product</Label>
                <Select value={siteDetails.product} onValueChange={v => setSiteDetails({...siteDetails, product: v})}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select a product" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field-sense">Field Sense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {siteDetails.product === "field-sense" && (
                <div className="space-y-4 md:col-span-2 pt-4 mt-2">
                  <h3 className="text-base font-bold text-foreground">Select Modules</h3>
                  <div className="space-y-4">
                    {MODULES_HIERARCHY.map(mod => (
                      <div key={mod.id} className="p-4 border border-border/50 rounded-lg bg-muted/5">
                        <div className="flex items-center gap-3 mb-4">
                          <Checkbox 
                            id={`mod-${mod.id}`}
                            checked={selectedModules.includes(mod.id)}
                            onCheckedChange={(c) => {
                              if (c) {
                                setSelectedModules([...selectedModules, mod.id, ...mod.subModules.map(s => s.id)]);
                              } else {
                                setSelectedModules(selectedModules.filter(m => m !== mod.id && !mod.subModules.map(s => s.id).includes(m)));
                              }
                            }}
                          />
                          <Label htmlFor={`mod-${mod.id}`} className="font-bold text-base cursor-pointer">{mod.label}</Label>
                        </div>
                        <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {mod.subModules.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2">
                              <Checkbox 
                                id={`sub-${sub.id}`}
                                checked={selectedModules.includes(sub.id)}
                                onCheckedChange={(c) => {
                                  if (c) {
                                    const newMods = [...selectedModules, sub.id];
                                    if (!newMods.includes(mod.id)) newMods.push(mod.id);
                                    setSelectedModules(newMods);
                                  } else {
                                    setSelectedModules(selectedModules.filter(m => m !== sub.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`sub-${sub.id}`} className="text-sm cursor-pointer font-medium text-muted-foreground">{sub.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>Country</Label>
                <Input placeholder="Select or type country" value={siteDetails.country} onChange={e => setSiteDetails({...siteDetails, country: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Location Address</Label>
                <Textarea placeholder="Enter full address..." className="h-24" value={siteDetails.address} onChange={e => setSiteDetails({...siteDetails, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Activate Date</Label>
                <Input type="date" value={siteDetails.date} onChange={e => setSiteDetails({...siteDetails, date: e.target.value})} />
              </div>
              <div className="space-y-2 flex flex-col justify-center">
                <Label className="mb-3">Status</Label>
                <Switch checked={siteDetails.status} onCheckedChange={c => setSiteDetails({...siteDetails, status: c})} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 text-foreground">Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input placeholder="John Doe" value={contactPerson.name} onChange={e => setContactPerson({...contactPerson, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+1 (555) 123-4567" value={contactPerson.phone} onChange={e => setContactPerson({...contactPerson, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="john.doe@example.com" value={contactPerson.email} onChange={e => setContactPerson({...contactPerson, email: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Sites List</h2>
        <Button onClick={() => setView("add")} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-2">
          <Plus className="w-4 h-4" /> Add Site
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search site..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-background max-w-md" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-[200px] bg-background">
            <SelectValue placeholder="Product Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="fieldsense">Field Sense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Site ID</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Company</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Organization ID</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Site / Project</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Address</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Product Type</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Contact</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Total Users</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Created By</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground">Created Date & Time</TableHead>
                <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.siteCode || "").toLowerCase().includes(searchQuery.toLowerCase())).map((site, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-medium">{site.siteCode || site.id}</TableCell>
                  <TableCell className="text-sm">{site.name}</TableCell>
                  <TableCell className="text-sm">{"-"}</TableCell>
                  <TableCell className="text-sm">{site.name}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate" title={site.address}>{site.address || "-"}</TableCell>
                  <TableCell>
                    {site.productType && site.productType !== "-" ? (
                      <Badge variant="secondary" className="bg-muted/80 text-muted-foreground font-normal rounded-full px-3">{site.productType}</Badge>
                    ) : <span className="text-muted-foreground/50">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">{site.contactName || "-"}</TableCell>
                  <TableCell className="text-sm">{"-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[#2563eb]/10 text-[#2563eb] hover:bg-[#2563eb]/20 border-none font-medium rounded-full px-3">
                      {site.status || "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{"-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{site.createdAt || site.activateDate || "-"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-right">
                    <Button variant="link" onClick={() => handleManageSite(site)} className="p-0 h-auto text-[#2563eb] hover:text-[#1d4ed8] font-medium">Manage Site</Button>
                    <span className="mx-2 text-border/50">&middot;</span>
                    <Button variant="link" onClick={() => handleDeleteSite(site.id)} className="p-0 h-auto text-red-500 hover:text-red-700 font-medium">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
