import { useState, useEffect } from "react";
import { Calendar, UserCheck, UserX, Clock, Plus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

export function AttendanceLeavesTab() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId") || "";
  const userRole = sessionStorage.getItem("userRole") || "";
  const employeeId = sessionStorage.getItem("employeeId") || "";

  const isAdmin = userRole.toLowerCase() === "admin";
  const isManager = userRole.toLowerCase() === "manager";
  const canManage = isAdmin || isManager;

  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [teamHistory, setTeamHistory] = useState<any[]>([]);
  const [teamBalances, setTeamBalances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form states
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [leaveType, setLeaveType] = useState("Paid Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchLeaveBalances = async () => {
    try {
      // Ensure the employee has balances, create dummy ones if they don't
      const res = await fetch(`${API}/api/ops/leave-balances/?employeeId=${employeeId}`);
      let data = await res.json();
      
      if (data.length === 0 && employeeId && !isAdmin) {
        // Create dummy leave balances
        const createPaid = await fetch(`${API}/api/ops/leave-balances/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, type: "Paid Leave", total: 20, used: 0, available: 20 })
        });
        const createSick = await fetch(`${API}/api/ops/leave-balances/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, type: "Sick Leave", total: 10, used: 0, available: 10 })
        });
        const paidData = await createPaid.json();
        const sickData = await createSick.json();
        data = [paidData, sickData];
      }
      setLeaveBalances(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch(`${API}/api/ops/leave-requests/?employeeId=${employeeId}`);
      const data = await res.json();
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeamData = async () => {
    try {
      const headers = { 'X-User-Id': userId, 'X-User-Role': userRole.toUpperCase() };

      // Fetch Requests
      const reqRes = await fetch(`${API}/api/ops/leave-requests/`, { headers });
      const reqData = await reqRes.json();
      const teamReqs = Array.isArray(reqData) ? reqData.filter(r => r.employeeId !== employeeId) : [];
      setPendingRequests(teamReqs.filter(r => r.status === 'pending'));
      setTeamHistory(teamReqs.filter(r => r.status !== 'pending'));

      // Fetch Balances
      const balRes = await fetch(`${API}/api/ops/leave-balances/`, { headers });
      const balData = await balRes.json();
      const teamBals = Array.isArray(balData) ? balData.filter(b => b.employeeId !== employeeId) : [];
      setTeamBalances(teamBals);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLeaveBalances();
    fetchLeaveRequests();
    if (canManage) {
      fetchTeamData();
    }
    // Fetch all employees to map their names and roles
    fetch(`${API}/api/employees/`, {
      headers: { 'Accept': 'application/json' }
    })
    .then(r => r.json())
    .then(data => {
      setEmployees(Array.isArray(data) ? data : []);
    })
    .catch(console.error);
  }, []);

  const getEmployeeInfo = (empId: string) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) return { name: emp.fullName, role: emp.designation };
    return { name: empId, role: "Unknown Role" };
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast({ title: "Incomplete Form", description: "Please fill out all fields.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`${API}/api/ops/leave-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          leaveType,
          startDate,
          endDate,
          reason,
          status: "pending"
        })
      });

      if (res.ok) {
        // Create an alert notification for Managers/Admins
        await fetch(`${API}/api/ops/alerts/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "pending_approval",
            message: `New Leave Request from ${getEmployeeInfo(employeeId).name} for ${leaveType}`,
            severity: "medium",
            resolved: false,
            relatedEntityId: employeeId,
            relatedEntityType: "employee"
          })
        });

        toast({ title: "Request Submitted", description: "Your leave request is pending approval." });
        setShowRequestForm(false);
        setStartDate("");
        setEndDate("");
        setReason("");
        fetchLeaveRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (request: any, status: string) => {
    try {
      const res = await fetch(`${API}/api/ops/leave-requests/${request.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast({ title: `Leave ${status}`, description: `Request has been ${status}.` });
        fetchTeamData();

        if (status === "approved") {
          // If approved, we should also deduct from their balance
          // Find their balance for this type
          const balRes = await fetch(`${API}/api/ops/leave-balances/?employeeId=${request.employeeId}`);
          const balances = await balRes.json();
          const targetBalance = balances.find((b: any) => b.type === request.leaveType);
          
          if (targetBalance) {
            // Calculate proper working days (skipping weekends)
            const calculateWorkingDays = (startStr: string, endStr: string) => {
              const start = new Date(startStr);
              const end = new Date(endStr);
              let count = 0;
              const cur = new Date(start);
              while (cur <= end) {
                const day = cur.getDay();
                if (day !== 0 && day !== 6) { // Skip Sundays (0) and Saturdays (6)
                  count++;
                }
                cur.setDate(cur.getDate() + 1);
              }
              return count;
            };

            const diffDays = calculateWorkingDays(request.startDate, request.endDate);
            
            // Only update if there are working days taken
            if (diffDays > 0) {
              await fetch(`${API}/api/ops/leave-balances/${targetBalance.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  used: targetBalance.used + diffDays,
                  available: targetBalance.available - diffDays
                })
              });
            }
            
            // Refresh our own balances just in case we approved our own test data
            fetchLeaveBalances();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" /> Attendance & Leaves
          </h2>
          <p className="text-muted-foreground mt-1">Manage holidays, track attendance, and view leave balances.</p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowRequestForm(!showRequestForm)}>
            {showRequestForm ? "Cancel Request" : <><Plus className="w-4 h-4 mr-2" /> Request Leave</>}
          </Button>
        )}
      </div>

      {showRequestForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Submit Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Leave Type</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reason / Comment</label>
                <Input type="text" placeholder="I'll be out of town..." value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full md:w-auto">Submit Request</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Balances */}
      {!isAdmin && (
        <div>
          <h3 className="text-xl font-bold mb-4">Your Leave Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {leaveBalances.map((bal) => (
              <Card key={bal.id} className="relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{bal.type}</p>
                      <h3 className="text-3xl font-bold mt-1">{bal.available} <span className="text-lg font-normal text-muted-foreground">days left</span></h3>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-2">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(bal.used / bal.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used: <span className="font-medium text-foreground">{bal.used}</span> / {bal.total} total days
                  </p>
                </CardContent>
              </Card>
            ))}
            {leaveBalances.length === 0 && (
              <p className="text-muted-foreground italic col-span-3">No leave balances found.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
        {/* Employee's Own Requests */}
        {!isAdmin && (
          <div>
            <h3 className="text-xl font-bold mb-4">Your Recent Requests</h3>
            <div className="space-y-4">
              {leaveRequests.map(req => (
                <div key={req.id} className="bg-card border rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{req.leaveType}</h4>
                    <p className="text-sm text-muted-foreground">{req.startDate} to {req.endDate}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    req.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {req.status.toUpperCase()}
                  </div>
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <p className="text-muted-foreground italic text-sm">You haven't made any leave requests yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Manager/Admin Approvals */}
        {canManage && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Pending Team Requests
            </h3>
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-card border rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 
                        className="font-bold text-lg flex items-center gap-2 cursor-pointer hover:underline text-primary"
                        onClick={() => navigate('/employees')}
                        title="View Profile"
                      >
                        {getEmployeeInfo(req.employeeId).name} 
                        <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full no-underline">{getEmployeeInfo(req.employeeId).role}</span>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{req.employeeId} <span className="mx-1">•</span> requested {req.leaveType}</p>
                      <p className="text-sm font-medium mt-1">{req.startDate} <span className="text-muted-foreground mx-1">to</span> {req.endDate}</p>
                      <p className="text-sm text-muted-foreground mt-2 italic">"{req.reason}"</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border/50">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus(req, 'rejected')}>
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleUpdateStatus(req, 'approved')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>All caught up!</p>
                  <p className="text-sm">No pending leave requests from your team.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Leave Balances & History for Managers/Admins */}
        {canManage && (
          <div className="space-y-8 mt-8 col-span-1 xl:col-span-2">
            
            {/* Team Balances */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" /> Team Leave Balances
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamBalances.map((bal) => (
                  <div key={bal.id} className="bg-card border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 
                        className="font-bold cursor-pointer hover:underline text-primary"
                        onClick={() => navigate('/employees')}
                        title="View Profile"
                      >
                        {getEmployeeInfo(bal.employeeId).name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{bal.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{bal.available}</p>
                      <p className="text-xs text-muted-foreground">days left (Used: {bal.used})</p>
                    </div>
                  </div>
                ))}
                {teamBalances.length === 0 && (
                  <p className="text-muted-foreground italic text-sm">No team balances found.</p>
                )}
              </div>
            </div>

            {/* Team History */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Team Leave History
              </h3>
              <div className="space-y-4">
                {teamHistory.map((req) => (
                  <div key={req.id} className="bg-card border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 
                        className="font-bold text-md flex items-center gap-2 cursor-pointer hover:underline text-primary"
                        onClick={() => navigate('/employees')}
                        title="View Profile"
                      >
                        {getEmployeeInfo(req.employeeId).name}
                        <span className="text-xs font-normal text-muted-foreground no-underline">{getEmployeeInfo(req.employeeId).role}</span>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{req.employeeId} <span className="mx-1">•</span> {req.leaveType}</p>
                      <p className="text-sm mt-1">{req.startDate} to {req.endDate}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      req.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {req.status.toUpperCase()}
                    </div>
                  </div>
                ))}
                {teamHistory.length === 0 && (
                  <p className="text-muted-foreground italic text-sm">No past team leave requests found.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
