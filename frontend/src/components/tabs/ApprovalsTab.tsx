import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddEmployeeModal } from "../modals/AddEmployeeModal";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

export function ApprovalsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const fetchRequests = () => {
    setLoading(true);
    fetch(`${API}/api/registration-requests/`)
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data.filter(r => r.status === "pending") : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReject = async (id: string) => {
    try {
      await fetch(`${API}/api/registration-requests/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-primary" />
          Pending Registrations
        </h2>
        <p className="text-muted-foreground mt-1">Review and approve new user sign-ups</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <p className="text-lg font-semibold text-foreground">All Caught Up!</p>
          <p className="text-sm mt-1">There are no pending registration requests.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-card border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-lg">{req.fullName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span>Email: {req.email}</span>
                    <span>Mobile: {req.mobileNumber}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    Requested on: {new Date(req.requestDate).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleReject(req.id)}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button onClick={() => setSelectedRequest(req)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Assign Role
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedRequest && (
        <AddEmployeeModal
          initialData={selectedRequest}
          requestId={selectedRequest.id}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
