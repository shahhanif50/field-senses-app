import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, CheckCircle2, XCircle, Clock, Trash2, Search, Filter, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useMasterData } from "@/contexts/MasterDataContext";

const API = "";

export function AdminOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const { toast } = useToast();
  const { activeProducts } = useMasterData();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-User-Id': sessionStorage.getItem("userId") || "",
    'X-User-Role': sessionStorage.getItem("userRole") || "",
    'X-Organization-Id': sessionStorage.getItem("organizationId") || "",
  });

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${API}/api/inventory/orders/`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const results = Array.isArray(data) ? data : (data.results ? data.results : []);
        setOrders(results.sort((a: any, b: any) => new Date(b.requestDate || b.created_at).getTime() - new Date(a.requestDate || a.created_at).getTime()));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrder = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/inventory/orders/${id}/`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: `Order ${status}`, description: `The product order has been ${status}.` });
        fetchOrders();
      } else {
        toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Network error occurred.", variant: "destructive" });
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/inventory/orders/${id}/`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast({ title: "Order Deleted", description: "The order has been removed." });
        fetchOrders();
      } else {
        toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Network error occurred.", variant: "destructive" });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.productId?.toLowerCase().includes(searchQuery.toLowerCase());
    const orderStatus = order.status || 'pending';
    const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Admin Orders Management
          </h2>
          <p className="text-muted-foreground mt-1">Review, manage, and process all employee product orders.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Employee ID..." 
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex rounded-lg overflow-hidden border border-border">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === status 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background hover:bg-muted text-foreground'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border">
          <p className="text-lg font-semibold text-foreground">No Orders Found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredOrders.map((order) => {
              const product = activeProducts?.find(p => p.id === order.productId);
              const orderStatus = order.status || 'pending';
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-card border border-border/60 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex gap-4 items-center flex-1 w-full">
                    <div className="w-16 h-16 bg-muted/30 rounded-xl overflow-hidden shrink-0 shadow-inner p-2 flex items-center justify-center border border-border/40">
                      {product?.productImage ? (
                        <img src={product.productImage} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="font-bold text-lg">{product?.name || order.productId}</h3>
                        <div className="flex items-center gap-2">
                          {orderStatus === 'approved' && (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {orderStatus === 'rejected' && (
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-semibold text-xs flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                          {orderStatus === 'pending' && (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold text-xs flex items-center gap-1">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                        <span>Employee ID: <strong className="text-foreground font-medium">{order.employeeId}</strong></span>
                        <span>Quantity: <strong className="text-foreground font-medium">{order.quantity}</strong></span>
                        <span>Total: <strong className="text-primary font-bold">₹{order.totalPrice}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        Requested on: {new Date(order.requestDate || order.created_at || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 shrink-0 md:flex-col lg:flex-row">
                    {orderStatus === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateOrder(order.id, 'rejected')}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button size="sm" onClick={() => handleUpdateOrder(order.id, 'approved')}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOrder(order.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
