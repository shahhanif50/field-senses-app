import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from 'lucide-react';

const API = "";

interface AddEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Record<string, string>;
  requestId?: string;
}

interface Role { id: string; roleName: string; roleCode: string; }
interface Department { id: string; departmentName: string; }

export function AddEmployeeModal({ onClose, onSuccess, initialData, requestId }: AddEmployeeModalProps) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sites, setSites] = useState<{id: string, name: string}[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    mobileNumber: initialData?.mobileNumber || '',
    password: initialData?.password || '',
    designation: '',
    workMode: 'Office',
    roleId: '',
    departmentId: '',
    siteId: '',
    employmentType: 'Full-time',
    joiningDate: new Date().toISOString().split('T')[0],
    trackingEnabled: false,
    accessibleSites: [] as string[]
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/roles/`, { headers: { 'X-Organization-Id': sessionStorage.getItem('organizationId') || '' } }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/departments/`, { headers: { 'X-Organization-Id': sessionStorage.getItem('organizationId') || '' } }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/sites/`, { headers: { 'X-Organization-Id': sessionStorage.getItem('organizationId') || '' } }).then(r => r.json()).catch(() => []),
    ]).then(([rolesData, deptsData, sitesData]) => {
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
      setSites(Array.isArray(sitesData) ? sitesData : sitesData.results || []);
      setLoadingMeta(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload: Partial<typeof formData> = { ...formData };
    if (!payload.roleId) delete payload.roleId;
    if (!payload.departmentId) delete payload.departmentId;
    if (!payload.siteId) delete payload.siteId;
    if (payload.accessibleSites?.length === 0) delete payload.accessibleSites;

    try {
      const response = await fetch(`${API}/api/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (requestId) {
          // Mark the request as approved
          try {
            await fetch(`${API}/api/registration-requests/${requestId}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'approved' })
            });
          } catch (e) {
            console.error("Failed to approve request", e);
          }
        }

        // Post a New Employee Notification
        try {
          await fetch(`${API}/api/ops/alerts/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: "tracking_update",
              message: `New Employee Registered: ${payload.fullName} (${responseData.employeeId || 'New'})`,
              severity: "low",
              resolved: false,
              relatedEntityId: responseData.employeeId || 'unknown',
              relatedEntityType: "employee"
            })
          });
        } catch (e) {
          console.error("Failed to create alert", e);
        }

        toast({
          title: "Employee Registered",
          description: `${payload.fullName} has been successfully added to the system.`,
        });

        onSuccess();
      } else {
        const errorData = await response.json();
        const msg = Object.values(errorData).flat().join(', ');
        setError(msg || 'Failed to save employee. Check all fields.');
      }
    } catch {
      setError('Network error. Make sure the server is running.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-border bg-background text-foreground placeholder-muted-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Add New Employee</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Fill in the details to create an employee account</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-lg">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="employee@company.com" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mobile Number *</label>
              <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required placeholder="9876543210" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password *</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="Set login password" 
                  className={inputCls} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Designation *</label>
            <input name="designation" value={formData.designation} onChange={handleChange} required placeholder="e.g. Sales Executive" className={inputCls} />
          </div>

          {/* Role & Department Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Role</label>
              {loadingMeta ? (
                <div className={`${inputCls} text-muted-foreground`}>Loading roles...</div>
              ) : (
                <select name="roleId" value={formData.roleId} onChange={handleChange} className={inputCls}>
                  <option value="">— Select Role —</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.roleName} ({r.roleCode})</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className={labelCls}>Department</label>
              {loadingMeta ? (
                <div className={`${inputCls} text-muted-foreground`}>Loading depts...</div>
              ) : (
                <select name="departmentId" value={formData.departmentId} onChange={handleChange} className={inputCls}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.departmentName}</option>
                  ))}
                </select>
              )}
            </div>
          </div>



          {/* Work Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Work Mode</label>
              <select name="workMode" value={formData.workMode} onChange={handleChange} className={inputCls}>
                <option value="Field">Field</option>
                <option value="Office">Office</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Employment Type</label>
              <select name="employmentType" value={formData.employmentType} onChange={handleChange} className={inputCls}>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Joining Date *</label>
              <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required className={inputCls} />
            </div>
            <div className="flex items-center gap-3 mt-8">
              <input 
                type="checkbox" 
                id="trackingEnabled" 
                name="trackingEnabled" 
                checked={formData.trackingEnabled} 
                onChange={(e) => setFormData({...formData, trackingEnabled: e.target.checked})} 
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="trackingEnabled" className="text-sm font-medium text-foreground cursor-pointer">
                Enable GPS Tracking
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}