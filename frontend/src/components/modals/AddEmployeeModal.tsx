import { useState } from 'react';

interface AddEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEmployeeModal({ onClose, onSuccess }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    designation: '',
    workMode: 'Office',
    roleId: '',
    departmentId: '',
    employmentType: 'Full-time',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData };
    if (!payload.roleId) delete (payload as any).roleId;
    if (!payload.departmentId) delete (payload as any).departmentId;

    console.log("Saving data to Django:", payload);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/employees/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), 
      });

      if (response.ok) {
        console.log("Success! Data saved to backend.");
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error("Backend Rejected Data:", errorData);
        alert("Check Console for error: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Network Error (Is Django running on 8000?):", error);
      alert("Network Error: Make sure your Django server is running at http://localhost:8000/");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
        
        <form onSubmit={handleCreateEmployee} className="flex flex-col gap-3">
          <input type="text" placeholder="Employee ID" className="border p-2 rounded"
            value={formData.employeeId}
            onChange={(e) => setFormData({...formData, employeeId: e.target.value})} required />
          
          <input type="text" placeholder="Full Name" className="border p-2 rounded"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
          
          <input type="email" placeholder="Email" className="border p-2 rounded"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          
          <input type="text" placeholder="Mobile Number" className="border p-2 rounded"
            value={formData.mobileNumber}
            onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} required />

          <input type="password" placeholder="Password" className="border p-2 rounded"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})} required />

          <input type="text" placeholder="Designation" className="border p-2 rounded"
            value={formData.designation}
            onChange={(e) => setFormData({...formData, designation: e.target.value})} required />

          <select className="border p-2 rounded" value={formData.workMode} onChange={(e) => setFormData({...formData, workMode: e.target.value})}>
            <option value="Field">Field</option>
            <option value="Office">Office</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <select className="border p-2 rounded" value={formData.employmentType} onChange={(e) => setFormData({...formData, employmentType: e.target.value})}>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
          </select>

          <input type="date" className="border p-2 rounded"
            value={formData.joiningDate}
            onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} required />

          <input type="text" placeholder="Role UUID (Optional)" className="border p-2 rounded"
            value={formData.roleId}
            onChange={(e) => setFormData({...formData, roleId: e.target.value})} />

          <input type="text" placeholder="Department UUID (Optional)" className="border p-2 rounded"
            value={formData.departmentId}
            onChange={(e) => setFormData({...formData, departmentId: e.target.value})} />

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}