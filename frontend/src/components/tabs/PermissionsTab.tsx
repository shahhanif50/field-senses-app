import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const API = "";

export function PermissionsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'approved', 'rejected'
  const { toast } = useToast();

  const userId = sessionStorage.getItem("userId") || "";
  const userRole = sessionStorage.getItem("userRole") || "";
  const headers = {
    "Content-Type": "application/json",
    "X-User-Id": userId,
    "X-User-Role": userRole,
  };

  const fetchRequests = () => {
    setLoading(true);
    fetch(`${API}/api/permission-requests/`, { headers })
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      const res = await fetch(`${API}/api/permission-requests/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          requester: userId,
          title,
          description,
          status: "Pending"
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Permission request created." });
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        fetchRequests();
      } else {
        toast({ title: "Error", description: "Failed to create request.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API}/api/permission-requests/${id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: "Updated", description: `Request marked as ${newStatus}.` });
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === "all") return true;
    return r.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Permission Requests
          </h2>
          <p className="text-muted-foreground mt-1">Manage and track your permission approvals</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Permission Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Request Title</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Leave Approval, Software License..." 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details for your manager..."
                  />
                </div>
                <Button type="submit" className="w-full">Submit Request</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary/40" />
          <p className="text-lg font-semibold text-foreground">No requests found</p>
          <p className="text-sm mt-1">You don't have any permission requests matching the filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredRequests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-card border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{req.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      req.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                      req.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{req.description || "No description provided."}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}</span>
                    <span>Requester: {req.requesterName || "Unknown"}</span>
                    <span>Approver: {req.approverName || "Pending Assignment"}</span>
                  </div>
                </div>
                
                {req.status === "Pending" && req.approver === userId && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus(req.id, "Rejected")}>
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus(req.id, "Approved")}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </div>
                )}
                
                {req.status === "Pending" && userRole === "admin" && req.approver !== userId && req.requester !== userId && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus(req.id, "Rejected")}>
                      Reject (Admin)
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus(req.id, "Approved")}>
                      Approve (Admin)
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
