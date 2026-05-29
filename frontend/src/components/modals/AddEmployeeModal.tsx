import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

interface AddEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  requestId?: string;
}

interface Role { id: string; roleName: string; roleCode: string; }
interface Department { id: string; departmentName: string; }

export function AddEmployeeModal({ onClose, onSuccess, initialData, requestId }: AddEmployeeModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || '',
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    mobileNumber: initialData?.mobileNumber || '',
    password: initialData?.password || '',
    designation: '',
    workMode: 'Office',
    roleId: '',
    departmentId: '',
    employmentType: 'Full-time',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/roles/`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/departments/`).then(r => r.json()).catch(() => []),
    ]).then(([rolesData, deptsData]) => {
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
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

    const payload = { ...formData };
    if (!payload.roleId) delete (payload as any).roleId;
    if (!payload.departmentId) delete (payload as any).departmentId;

    try {
      const response = await fetch(`${API}/api/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Employee ID *</label>
              <input name="employeeId" value={formData.employeeId} onChange={handleChange} required placeholder="e.g. EMP-001" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Full Name *</label>
              <input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="employee@company.com" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mobile Number *</label>
              <input name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required placeholder="9876543210" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Set login password" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Designation *</label>
            <input name="designation" value={formData.designation} onChange={handleChange} required placeholder="e.g. Sales Executive" className={inputCls} />
          </div>

          {/* Role & Department Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className={labelCls}>Joining Date *</label>
            <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required className={inputCls} />
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