import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Building2, UserCircle, MapPin, Eye, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  domain: string;
  modulesEnabled: string[];
  is_deleted: boolean;
  createdAt: string;
  admins?: {id: string, name: string, email: string}[];
}

export function OrganizationDetailsTab() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const orgId = sessionStorage.getItem("viewOrganizationId");

  useEffect(() => {
    if (!orgId) return;
    const fetchOrg = async () => {
      try {
        const res = await fetch(`/api/organizations/${orgId}/`);
        if (res.ok) {
          const data = await res.json();
          setOrg(data);
        } else {
          toast.error("Failed to load organization details");
        }
      } catch (e) {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [orgId]);

  const handleBack = () => {
    window.dispatchEvent(new CustomEvent("changeTab", { detail: "organizations" }));
  };

  const handleImpersonate = () => {
    if (!org) return;
    sessionStorage.setItem("organizationId", org.id);
    sessionStorage.setItem("organizationName", org.name);
    if (org.modulesEnabled) {
      sessionStorage.setItem("organizationModules", JSON.stringify(org.modulesEnabled));
    }
    toast.success(`Impersonating ${org.name}`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (loading) return <div className="p-8 text-center">Loading organization details...</div>;
  if (!org) return <div className="p-8 text-center text-muted-foreground">Organization not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              {org.name}
              <Badge variant={org.is_deleted ? "destructive" : "default"} className="ml-2">
                {org.is_deleted ? "Inactive" : "Active"}
              </Badge>
            </h2>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Shield className="w-4 h-4" />
              {org.domain || "No domain configured"}
            </p>
          </div>
        </div>
        <Button onClick={handleImpersonate} className="gap-2">
          <Eye className="w-4 h-4" />
          Impersonate as Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Organization ID</span>
              <p className="font-mono text-sm mt-1">{org.id}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Created Date</span>
              <p className="text-sm mt-1">{new Date(org.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Status</span>
              <div className="flex items-center gap-1 mt-1 text-sm">
                {org.is_deleted ? (
                  <><XCircle className="w-4 h-4 text-destructive" /> Disabled</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Active</>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enabled Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {org.modulesEnabled && org.modulesEnabled.length > 0 ? (
                org.modulesEnabled.map((mod: string) => (
                  <Badge key={mod} variant="secondary" className="bg-primary/10 text-primary">
                    {mod}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No modules enabled</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tenant Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {org.admins && org.admins.length > 0 ? (
                org.admins.map((admin, idx) => (
                  <div key={admin.id || idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-border/50">
                    <UserCircle className="w-8 h-8 text-primary/60" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{admin.name}</span>
                      <span className="text-xs text-muted-foreground">{admin.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No administrators assigned yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
