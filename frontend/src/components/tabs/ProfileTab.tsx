import { useState, useEffect } from "react";
import { User, Mail, Phone, Building, Briefcase, Calendar, Upload, Loader2, CheckCircle2, Building2, MapPin, Map, AlertCircle, Trash2 } from "lucide-react";
import { useMasterData } from "@/contexts/MasterDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API = "";

export function ProfileTab() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { sites } = useMasterData();
  const [currentOrgName, setCurrentOrgName] = useState("Loading...");

  useEffect(() => {
    if (profile?.organization) {
      fetch(`${API}/api/organizations/${profile.organization}/`)
        .then(res => res.json())
        .then(data => setCurrentOrgName(data.name || "N/A"))
        .catch(() => setCurrentOrgName("N/A"));
    } else if (profile) {
      setCurrentOrgName("Global / Multi-Tenant");
    }
  }, [profile]);

  const fetchProfile = async () => {
    const userRole = sessionStorage.getItem("userRole");
    const userId = sessionStorage.getItem("userId") || "";
    const isAdmin = sessionStorage.getItem("isAdminLoggedIn") === "true" && userRole?.toLowerCase() === "admin";
    
    const headers = {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      "X-User-Role": userRole || "",
      "X-Organization-Id": sessionStorage.getItem("organizationId") || "null",
    };
    
    try {
      if (userId && userId !== "admin") {
        // Fetch the specific employee by their ID
        const response = await fetch(`${API}/api/employees/${userId}/`, { headers });
        if (response.ok) {
          const emp = await response.json();
          setProfile(emp);
          return;
        }
      }

      if (isAdmin || userId === "admin") {
        // Try to find admin employee record
        const response = await fetch(`${API}/api/employees/`, { headers });
        const data = await response.json();
        const employees = Array.isArray(data) ? data : data.results || [];
        const adminRecord = employees.find((e: any) => e.email === "admin@example.com" || e.email === "shahhanif@gmail.com");
        
        if (adminRecord) {
          setProfile(adminRecord);
        } else {
          setProfile({
            id: "admin",
            fullName: sessionStorage.getItem("userName") || "Superadmin",
            email: "admin@example.com",
            mobileNumber: "-",
            designation: "Administrator",
            departmentName: "Management",
            profilePhoto: null,
            isVirtual: true
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (profile?.isVirtual) {
      setError("Cannot upload photo for virtual admin account. Please create a real employee record for admin@example.com.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setUploading(true);
      setError("");

      try {
        const response = await fetch(`${API}/api/employees/${profile.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePhoto: base64String }),
        });

        if (response.ok) {
          setProfile({ ...profile, profilePhoto: base64String });
        } else {
          setError("Failed to upload photo");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (profile?.isVirtual) return;

    setUploading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/employees/${profile.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhoto: null }),
      });

      if (response.ok) {
        setProfile({ ...profile, profilePhoto: null });
      } else {
        setError("Failed to remove photo");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading Profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-muted-foreground">Profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col pb-10 mt-8">
      <div className="mb-10">
        <h2 className="text-3xl font-light tracking-tight text-foreground mb-2">Profile Settings</h2>
        <p className="text-muted-foreground text-sm">View and manage your personal information</p>
      </div>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-5 py-4 rounded-xl text-sm mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="flex flex-col items-center md:items-start w-full md:w-64 shrink-0">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-40 h-40 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-background shadow-sm">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-muted-foreground/50" />
              )}
            </div>

            {!profile.isVirtual && (
              <div className="flex items-center gap-2 w-full justify-center">
                <label className="flex items-center justify-center gap-2 cursor-pointer bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 text-center">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Change Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>

                {profile.profilePhoto && (
                  <button 
                    onClick={() => {
                      if(window.confirm('Are you sure you want to remove your profile photo?')) {
                        handleRemovePhoto(new Event('click') as any);
                      }
                    }}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1"
                    title="Remove Photo"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground text-center md:text-left">{profile.fullName}</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center md:text-left">{profile.designation}</p>
          
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            {profile.employmentType || "Employee"}
          </div>

          {profile.isVirtual && (
            <div className="mt-6 text-muted-foreground text-xs text-center md:text-left bg-muted/50 p-3 rounded-lg w-full">
              Virtual Profile<br/>(Photo upload disabled)
            </div>
          )}
        </div>

        {/* Right Column: Detailed Info List */}
        <div className="flex-1 w-full space-y-10">
          
          {/* Contact Info */}
          <section>
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4 border-b border-border/50 pb-2">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 group">
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground/70" /> Email
                </span>
                <span className="text-sm font-medium text-foreground">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 group">
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground/70" /> Mobile
                </span>
                <span className="text-sm font-medium text-foreground">{profile.mobileNumber}</span>
              </div>
            </div>
          </section>

          {/* Work Details */}
          <section>
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4 border-b border-border/50 pb-2">Work Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 group">
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground/70" /> Organization
                </span>
                <span className="text-sm font-medium text-foreground text-right">{currentOrgName}</span>
              </div>
              <div className="flex items-center justify-between py-2 group">
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground/70" /> Work Mode
                </span>
                <span className="text-sm font-medium text-foreground">{profile.workMode || "Office"}</span>
              </div>
              <div className="flex items-center justify-between py-2 group">
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground/70" /> Assigned Sites
                </span>
                <span className="text-sm font-medium text-foreground text-right max-w-[220px] sm:max-w-xs truncate" title={
                  profile?.accessibleSites?.length > 0
                    ? sites.filter(s => profile.accessibleSites.includes(s.id)).map(s => s.name).join(", ")
                    : "All Sites"
                }>
                  {profile?.accessibleSites?.length > 0
                    ? sites.filter(s => profile.accessibleSites.includes(s.id)).map(s => s.name).join(", ")
                    : "All Sites"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 group">
                <span className="text-sm text-muted-foreground flex items-center gap-3">
                  <Map className="w-4 h-4 text-muted-foreground/70" /> Region
                </span>
                <span className="text-sm font-medium text-foreground">{profile.region || "Global"}</span>
              </div>
            </div>
          </section>

          {/* Security / Password */}
          <section>
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4 border-b border-border/50 pb-2">Security</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
              const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
              if (newPassword !== confirmPassword) {
                setError("Passwords do not match");
                return;
              }
              try {
                const response = await fetch(`${API}/api/employees/${profile.id}/change_password/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ new_password: newPassword })
                });
                if (response.ok) {
                  alert("Password changed successfully");
                  form.reset();
                  setError("");
                } else {
                  setError("Failed to change password");
                }
              } catch (err) {
                setError("Network error");
              }
            }} className="space-y-4 max-w-sm">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <input name="newPassword" type="password" required minLength={6} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <input name="confirmPassword" type="password" required minLength={6} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
              </div>
              <Button type="submit" disabled={profile.isVirtual}>Change Password</Button>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
}
