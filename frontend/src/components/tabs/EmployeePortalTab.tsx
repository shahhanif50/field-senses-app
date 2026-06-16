import { useState, useEffect } from 'react';
import { AddEmployeeModal } from '../modals/AddEmployeeModal'; 
import { User, Phone, MapPin, X } from 'lucide-react';
import { AdminLiveTracking } from '../tracking/AdminLiveTracking';
import { EmployeeWalletDashboard } from './EmployeeWalletDashboard';
import { AdminEarningsDashboard } from './AdminEarningsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasterData } from '@/contexts/MasterDataContext';

interface Employee {
  id?: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  profilePhoto?: string | null;
}

export function EmployeePortalTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeLeaves, setActiveLeaves] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMapEmployee, setSelectedMapEmployee] = useState<string | null>(null);
  
  const { roles, rolePermissions } = useMasterData();

  // Fetches fresh data from your Django Backend
  const fetchEmployees = () => {
    fetch(`/api/employees/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      })
      .then((data) => {
        setEmployees(data);
      })
      .catch((error) => console.error('Error fetching employees from Django:', error));
  };

  const fetchActiveLeaves = async () => {
    try {
      const res = await fetch(`/api/ops/leave-requests/?status=approved`);
      const data = await res.json();
      setActiveLeaves(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  // Run the fetch once when the tab mounts
  useEffect(() => {
    fetchEmployees();
    fetchActiveLeaves();
  }, []);

  const isEmployeeOnLeave = (empId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return activeLeaves.some(leave => 
      leave.employeeId === empId && 
      leave.startDate <= today && 
      leave.endDate >= today
    );
  };

  const userRole = sessionStorage.getItem("userRole") || "Employee";
  const isManagement = ["admin", "manager", "sr_mgr", "head"].includes(userRole.toLowerCase());

  const currentRole = roles.find(r => r.roleCode?.toLowerCase() === userRole.toLowerCase());
  const employeeModulePerm = rolePermissions.find(p => p.roleId === currentRole?.id && p.module.includes("Employee"));
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const canCreate = isGlobalAdmin || userRole === 'ADMIN' || employeeModulePerm?.create;

  if (!isManagement) {
    return <EmployeeWalletDashboard />;
  }

  return (
    <div className="p-6">
      <Tabs defaultValue="directory" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap justify-start hide-scrollbar">
            <TabsTrigger value="directory" className="whitespace-nowrap">Employee Directory</TabsTrigger>
            <TabsTrigger value="earnings" className="rounded-md whitespace-nowrap">Global Earnings</TabsTrigger>
          </TabsList>
          {canCreate && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              Add New Employee
            </button>
          )}
        </div>

        <TabsContent value="directory" className="space-y-4">
          <div className="grid gap-4">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp.id} className="border p-4 rounded-xl shadow-sm bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {emp.profilePhoto ? (
                        <img src={emp.profilePhoto} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{emp.fullName}</p>
                        <div 
                          className={`w-2.5 h-2.5 rounded-full ${isEmployeeOnLeave(emp.employeeId) ? 'bg-red-500' : 'bg-green-500'}`} 
                          title={isEmployeeOnLeave(emp.employeeId) ? "On Holiday Today" : "Working Today"} 
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">ID: {emp.employeeId} | Email: {emp.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                    <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {emp.mobileNumber || "No number"}
                    </div>
                    <button
                      onClick={() => setSelectedMapEmployee(emp.employeeId)}
                      className="flex items-center gap-2 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Track Location
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No employees found in the database. Click "Add New Employee" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="earnings">
          <AdminEarningsDashboard />
        </TabsContent>
      </Tabs>

      {isModalOpen && (
        <AddEmployeeModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEmployees(); // Automatically refresh the list after a successful save
          }}
        />
      )}

      {selectedMapEmployee && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Live Tracking: {employees.find(e => e.employeeId === selectedMapEmployee)?.fullName}
              </h3>
              <button 
                onClick={() => setSelectedMapEmployee(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 relative overflow-auto p-4 bg-muted/30">
              <AdminLiveTracking preSelectedEmployeeId={selectedMapEmployee} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}