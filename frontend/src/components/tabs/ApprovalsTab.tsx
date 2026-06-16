import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, CheckCircle2, XCircle, Clock, Banknote, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddEmployeeModal } from "../modals/AddEmployeeModal";
import { useToast } from "@/components/ui/use-toast";
import { useMasterData } from "@/contexts/MasterDataContext";

const API = "";

export function ApprovalsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const { toast } = useToast();

  const { roles, rolePermissions, activeProducts } = useMasterData();

  // --- PERMISSION CHECKS ---
  const rawRole = sessionStorage.getItem("userRole") || "employee";
  const currentRole = roles?.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const approvalsPerm = rolePermissions?.find(p => p.roleId === currentRole?.id && p.module === "Registration Approvals");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = rawRole.toLowerCase() === "admin" || isGlobalAdmin;

  const canApprove = isAdmin || approvalsPerm?.approve;
  // -----------------------

  const userId = sessionStorage.getItem("userId") || "";
  const userRole = rawRole;

  const fetchRequests = () => {
    setLoading(true);
    fetch(`${API}/api/registration-requests/`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Role': userRole.toUpperCase(),
        'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
      }
    })
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data.filter(r => r.status === "pending") : (data.results ? data.results.filter((r: any) => r.status === "pending") : []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchPayouts = () => {
    setPayoutsLoading(true);
    fetch(`${API}/api/ops/withdrawals/?status=pending`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Role': userRole.toUpperCase()
      }
    })
      .then((r) => r.json())
      .then((data) => {
        setPayouts(Array.isArray(data) ? data : []);
        setPayoutsLoading(false);
      })
      .catch(() => setPayoutsLoading(false));
  };

  const fetchOrders = () => {
    setOrdersLoading(true);
    fetch(`${API}/api/inventory/orders/?status=pending`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Role': userRole.toUpperCase()
      }
    })
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : (data.results ? data.results : []));
        setOrdersLoading(false);
      })
      .catch(() => setOrdersLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    fetchPayouts();
    fetchOrders();
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

  const handleUpdatePayout = async (id: string, status: string) => {
    try {
      const payout = payouts.find(p => p.id === id);
      const res = await fetch(`${API}/api/ops/withdrawals/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        if (status === 'rejected' && payout) {
          // Refund the wallet
          const walletRes = await fetch(`${API}/api/ops/wallets/?employeeId=${payout.employeeId}`);
          const wallets = await walletRes.json();
          if (wallets.length > 0) {
            const wallet = wallets[0];
            await fetch(`${API}/api/ops/wallets/${wallet.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                balance: wallet.balance + payout.amount,
                totalWithdrawn: wallet.totalWithdrawn - payout.amount
              })
            });
          }
        }

        toast({ title: `Payout ${status}`, description: `The payout request has been ${status}.` });
        fetchPayouts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrder = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/inventory/orders/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: `Order ${status}`, description: `The product order has been ${status}.` });
        fetchOrders();
      }
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
                {canApprove && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleReject(req.id)}>
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button onClick={() => setSelectedRequest(req)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Assign Role
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Payouts Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Banknote className="w-6 h-6 text-primary" />
          Pending Payout Requests
        </h2>
        
        {payoutsLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p className="text-lg font-semibold text-foreground">No Pending Payouts</p>
            <p className="text-sm mt-1">There are no outstanding payout requests.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {payouts.map((payout) => (
                <motion.div
                  key={payout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-card border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-lg">Amount: ${payout.amount}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span>Employee ID: {payout.employeeId}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="w-3 h-3" />
                      Requested on: {new Date(payout.requestDate).toLocaleString()}
                    </div>
                  </div>
                  {canApprove && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdatePayout(payout.id, 'rejected')}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button onClick={() => handleUpdatePayout(payout.id, 'approved')}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Package className="w-6 h-6 text-primary" />
          Pending Product Orders
        </h2>
        
        {ordersLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p className="text-lg font-semibold text-foreground">No Pending Orders</p>
            <p className="text-sm mt-1">There are no pending product orders to approve.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {orders.map((order) => {
                const product = activeProducts?.find(p => p.id === order.productId);
                return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-card border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex gap-4 items-center flex-1">
                    <div className="w-16 h-16 bg-muted/30 rounded-xl overflow-hidden shrink-0 shadow-inner p-2 flex items-center justify-center border border-border/40">
                      {product?.productImage ? (
                        <img src={product.productImage} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{product?.name || order.productId}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span>Employee ID: {order.employeeId}</span>
                        <span>Quantity: {order.quantity}</span>
                        <span className="font-bold text-primary">Total: ₹{order.totalPrice}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        Requested on: {new Date(order.requestDate || order.created_at || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {canApprove && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateOrder(order.id, 'rejected')}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button onClick={() => handleUpdateOrder(order.id, 'approved')}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                      </Button>
                    </div>
                  )}
                </motion.div>
              )})}
            </AnimatePresence>
          </div>
        )}
      </div>

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
