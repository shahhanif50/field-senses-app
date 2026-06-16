import { useState, useEffect } from "react";
import { User, Mail, Phone, Building, Briefcase, Calendar, Upload, Loader2, CheckCircle2, Building2, MapPin, Map } from "lucide-react";
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
            fullName: sessionStorage.getItem("userName") || "System Admin",
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

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading Profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-muted-foreground">Profile not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">My Profile</h2>
      
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">{error}</div>}
      
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Photo Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full border-4 border-muted overflow-hidden bg-muted flex items-center justify-center shadow-lg">
                  {profile.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
                
                {/* Upload Overlay */}
                <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-white mb-1" />
                      <span className="text-white text-xs font-medium">Change Photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading || profile.isVirtual} />
                </label>
              </div>
              {profile.isVirtual && <span className="text-xs text-muted-foreground text-center">Virtual Profile<br/>(Photo upload disabled)</span>}
            </div>

            {/* Details Section */}
            <div className="flex-1 space-y-6 w-full">
              <div>
                <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                <p className="text-primary font-medium text-lg">{profile.designation}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-medium">{profile.mobileNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employment</p>
                    <p className="font-medium">{profile.employmentType || "Full-time"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Work Mode</p>
                    <p className="font-medium">{profile.workMode || "Office"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{currentOrgName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Sites</p>
                    <p className="font-medium max-w-[200px] truncate" title={
                      profile?.accessibleSites?.length > 0
                        ? sites.filter(s => profile.accessibleSites.includes(s.id)).map(s => s.name).join(", ")
                        : "All Sites"
                    }>
                      {profile?.accessibleSites?.length > 0
                        ? sites.filter(s => profile.accessibleSites.includes(s.id)).map(s => s.name).join(", ")
                        : "All Sites"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Map className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium">{profile.region || "Global"}</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
