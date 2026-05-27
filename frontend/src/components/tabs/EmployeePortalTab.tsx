import { useState, useEffect } from 'react';
import { AddEmployeeModal } from '../modals/AddEmployeeModal'; 
import { EmployeeWalletDashboard } from './EmployeeWalletDashboard';
import { AdminEarningsDashboard } from './AdminEarningsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Employee {
  id?: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
}

export function EmployeePortalTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetches fresh data from your Django Backend
  const fetchEmployees = () => {
    fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`}/api/employees/`, {
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

  // Run the fetch once when the tab mounts
  useEffect(() => {
    fetchEmployees();
  }, []);

  const userRole = sessionStorage.getItem("userRole") || "Employee";

  if (userRole !== "Admin") {
    return <EmployeeWalletDashboard />;
  }

  return (
    <div className="p-6">
      <Tabs defaultValue="directory" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="directory">Employee Directory</TabsTrigger>
            <TabsTrigger value="earnings">Global Earnings</TabsTrigger>
          </TabsList>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Add New Employee
          </button>
        </div>

        <TabsContent value="directory" className="space-y-4">
          <div className="grid gap-4">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp.id} className="border p-4 rounded-xl shadow-sm bg-card flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{emp.fullName}</p>
                    <p className="text-sm text-muted-foreground">ID: {emp.employeeId} | Email: {emp.email}</p>
                  </div>
                  <div className="text-sm font-medium">
                    {emp.mobileNumber}
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
    </div>
  );
}