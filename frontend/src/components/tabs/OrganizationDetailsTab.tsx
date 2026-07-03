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
      </div>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y divide-border/60">
            {/* Row 1: Organization Info */}
            <div className="p-6 sm:p-8 space-y-5 bg-card/50">
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary/70" />
                Organization Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization ID</span>
                  <p className="font-mono text-sm mt-1.5 text-foreground bg-muted/50 p-2 rounded-md border border-border/50 break-all w-fit">{org.id}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created Date</span>
                  <p className="text-sm mt-1.5 font-medium">{new Date(org.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm font-medium">
                    {org.is_deleted ? (
                      <Badge variant="destructive" className="flex items-center w-fit gap-1"><XCircle className="w-3.5 h-3.5" /> Disabled</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 flex w-fit items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Active</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Enabled Modules */}
            <div className="p-6 sm:p-8 bg-card/30">
              <h3 className="text-lg font-bold tracking-tight text-foreground mb-5 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary/70" />
                Enabled Modules
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {org.modulesEnabled && org.modulesEnabled.length > 0 ? (
                  org.modulesEnabled.map((mod: string) => (
                    <Badge key={mod} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 font-medium shadow-sm transition-colors cursor-default">
                      {mod}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 p-4 bg-muted/30 rounded-lg w-full border border-dashed">
                    <XCircle className="w-4 h-4" /> No modules enabled
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Tenant Administrators */}
            <div className="p-6 sm:p-8 bg-card/50">
              <h3 className="text-lg font-bold tracking-tight text-foreground mb-5 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-primary/70" />
                Tenant Administrators
              </h3>
              <div className="space-y-3">
                {org.admins && org.admins.length > 0 ? (
                  org.admins.map((admin, idx) => (
                    <div key={admin.id || idx} className="flex items-center gap-3.5 p-3.5 bg-background rounded-xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 w-full sm:w-1/2 lg:w-1/3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-foreground truncate">{admin.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{admin.email}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl border border-dashed text-center w-full sm:w-1/2 lg:w-1/3">
                    <UserCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No administrators</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Assign an admin to manage this tenant.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
