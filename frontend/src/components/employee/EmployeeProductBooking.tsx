import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasterData } from '@/contexts/MasterDataContext';
import { Package, Search, ChevronRight, ChevronLeft, Download, CheckCircle2, XCircle, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const API = "";

export function EmployeeProductBooking() {
  const { activeProducts, categories, activeVendors } = useMasterData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [view, setView] = useState<'list' | 'detail' | 'order' | 'success' | 'history'>('list');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // order form state
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // history state
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  // mock customer state just for visual reference as requested
  const [customerType, setCustomerType] = useState('Select Customer Type');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // existing fields
  const userId = sessionStorage.getItem("userId") || "EMP-Unknown";
  const userName = sessionStorage.getItem("userName") || "Employee";

  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/inventory/orders/?employeeId=${userId}`, {
        headers: {
          'X-User-Id': sessionStorage.getItem("userId") || "",
          'X-User-Role': sessionStorage.getItem("userRole") || "",
          'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyOrders(Array.isArray(data) ? data : (data.results ? data.results : []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleBookProduct = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    const totalPrice = selectedProduct.sellingPrice * quantity;
    
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Id': sessionStorage.getItem("userId") || "",
      'X-User-Role': sessionStorage.getItem("userRole") || "",
      'X-Organization-Id': sessionStorage.getItem("organizationId") || ""
    };

    try {
      const orderRes = await fetch(`${API}/api/inventory/orders/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          employeeId: userId,
          productId: selectedProduct.id,
          quantity: quantity,
          totalPrice: totalPrice,
          vendorId: selectedVendor || null,
          status: 'pending'
        })
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const orderData = await orderRes.json();

      await fetch(`${API}/api/ops/alerts/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          type: "pending_approval",
          message: `New Product Order from ${userName} for ${quantity}x ${selectedProduct.name}`,
          severity: "medium",
          resolved: false,
          relatedEntityId: orderData.id,
          relatedEntityType: "order"
        })
      });

      setView('success');
    } catch (e) {
      console.error(e);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TopBar = ({ title, onBack }: { title: string, onBack?: () => void }) => (
    <div className="flex items-center gap-3 mb-6 pt-2">
      {onBack && (
        <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      )}
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[80vh] bg-background rounded-xl overflow-hidden relative flex flex-col font-sans">
      
      {/* 1. LIST VIEW */}
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-y-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 mt-2 gap-4">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Products</h2>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => { setView('history'); fetchMyOrders(); }}
                  variant="outline" 
                  className="rounded-xl bg-background text-sm h-10 font-medium border-border"
                >
                  My Orders
                </Button>
                <select 
                  className="rounded-xl bg-background text-sm h-10 font-medium border border-border px-3 focus-visible:outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex border border-border rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setDisplayMode('grid')}
                    className={`p-2 ${displayMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-foreground'}`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDisplayMode('list')}
                    className={`p-2 ${displayMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-foreground'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="relative mb-6">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                className="pl-10 bg-card border-border rounded-full h-12 shadow-sm focus-visible:ring-primary" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={`grid gap-6 pb-20 ${displayMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 max-w-4xl'}`}>
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => { setSelectedProduct(product); setView('detail'); }}
                  className="bg-card hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 cursor-pointer shadow-sm border border-border/60 relative group"
                >
                  <div className="w-24 h-24 sm:w-20 sm:h-20 bg-muted/30 rounded-xl overflow-hidden shrink-0 shadow-inner p-3 flex items-center justify-center border border-border/40">
                    {product.productImage ? (
                      <img src={product.productImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 pr-6 w-full">
                    <h3 className="font-bold text-foreground text-lg mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{product.brand || "High quality agricultural product."}</p>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold text-sm">
                      ₹{product.sellingPrice}
                    </div>
                  </div>
                  <ChevronRight className="hidden sm:block w-5 h-5 text-muted-foreground/50 absolute right-5 group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-10 text-gray-500">No products found.</div>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. DETAIL VIEW */}
        {view === 'detail' && selectedProduct && (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-6 flex flex-col h-full overflow-y-auto w-full max-w-4xl mx-auto"
          >
            <TopBar title="Field Senses" onBack={() => setView('list')} />
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[300px] border border-border">
                {selectedProduct.productImage ? (
                  <img src={selectedProduct.productImage} alt={selectedProduct.name} className="max-h-[300px] object-contain mix-blend-multiply" />
                ) : (
                  <Package className="w-32 h-32 text-muted-foreground/30" />
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-3xl font-bold text-foreground">{selectedProduct.name}</h2>
                  <p className="text-2xl font-bold text-primary">₹{selectedProduct.sellingPrice}</p>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {selectedProduct.name} is a premium {selectedProduct.brand || "agricultural product"}. It is used to improve crop yields and soil health. It can also be used together with other products to treat deficiencies.
                </p>

                <Button 
                  onClick={() => {
                    if (selectedProduct.brochure) {
                      const a = document.createElement('a');
                      a.href = selectedProduct.brochure;
                      a.download = `${selectedProduct.name}_Brochure.pdf`;
                      a.click();
                    } else {
                      toast.error("No brochure available for this product.");
                    }
                  }}
                  className={`w-full text-primary-foreground rounded-xl h-12 text-lg font-medium mb-8 shadow-md transition-all ${selectedProduct.brochure ? 'bg-primary hover:bg-primary/90' : 'bg-muted-foreground cursor-not-allowed opacity-50'}`}
                >
                  <Download className="w-5 h-5 mr-2" /> Download Brochure
                </Button>

                <div className="space-y-6 mb-24">
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-3">Bulk Pricing:</h3>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                      <li>1-10 Packs: <span className="font-medium text-foreground">₹{selectedProduct.sellingPrice} per pack</span></li>
                      <li>11-50 Packs: <span className="font-medium text-foreground">₹{(selectedProduct.sellingPrice * 0.9).toFixed(0)} per pack</span></li>
                      <li>51+ Packs: <span className="font-medium text-foreground">₹{(selectedProduct.sellingPrice * 0.8).toFixed(0)} per pack</span></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-3">Additional Details:</h3>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                      <li>Minimum Order Quantity: 1 pack</li>
                      <li>Shipping: Free shipping on orders over ₹15,000.</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-auto">
                  <Button 
                    onClick={() => setView('order')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 text-lg font-bold shadow-lg transition-all hover:scale-[1.02]"
                  >
                    Order now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. ORDER FORM VIEW */}
        {view === 'order' && selectedProduct && (
          <motion.div 
            key="order"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 flex flex-col h-full overflow-y-auto w-full max-w-2xl mx-auto pb-24"
          >
            <TopBar title="Field Senses" onBack={() => setView('detail')} />
            
            <h2 className="text-2xl font-bold text-foreground mb-6">Create New Order</h2>
            
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground mt-2 mb-4 border-b border-border pb-2">Order Details</h3>
              
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Selected Product</Label>
                  <select disabled className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm text-foreground font-medium opacity-80">
                    <option>{selectedProduct.name}</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Select Vendor (Optional)</Label>
                  <select 
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="">No Vendor Selected</option>
                    {activeVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold">Quantity</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="Enter quantity" 
                      className="h-12 rounded-xl border-border bg-background focus-visible:ring-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold opacity-0">Unit</Label>
                    <div className="h-12 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                      Units
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/20 mt-4">
                  <span className="font-semibold text-foreground">Total Price:</span>
                  <span className="text-2xl font-bold text-primary">₹{selectedProduct.sellingPrice * quantity}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button 
                onClick={handleBookProduct}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 text-lg font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                {isSubmitting ? "Processing..." : "Submit Order"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS SUMMARY VIEW */}
        {view === 'success' && selectedProduct && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 flex flex-col h-full overflow-y-auto w-full max-w-xl mx-auto"
          >
            <TopBar title="Field Senses" />
            
            <div className="flex flex-col items-center justify-center text-center mt-10 mb-8">
              <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
              <h2 className="text-3xl font-bold text-foreground">Order Placed!</h2>
              <p className="text-muted-foreground mt-2 text-lg">Your order has been submitted for approval.</p>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex justify-between border-b border-border pb-4 mb-4">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-bold text-foreground">{new Date().toLocaleDateString()}</span>
              </div>
              
              <h3 className="font-bold text-foreground mb-4 mt-2">Product Details</h3>
              
              <div className="flex gap-6 items-center">
                <div className="w-24 h-24 bg-background rounded-xl p-3 border border-border flex items-center justify-center shrink-0 shadow-inner">
                  {selectedProduct.productImage ? (
                    <img src={selectedProduct.productImage} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <Package className="w-12 h-12 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Name:</span>
                    <span className="font-bold text-foreground text-sm line-clamp-1">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Quantity:</span>
                    <span className="font-bold text-foreground text-sm">{quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Unit Price:</span>
                    <span className="font-bold text-foreground text-sm">₹{selectedProduct.sellingPrice}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/50">
                    <span className="font-semibold text-foreground">Total Price:</span>
                    <span className="font-bold text-primary text-lg">₹{selectedProduct.sellingPrice * quantity}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Button 
                onClick={() => { setView('list'); setSelectedProduct(null); setQuantity(1); }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 text-lg font-bold shadow-lg transition-all"
              >
                Back to Products
              </Button>
            </div>
          </motion.div>
        )}

        {/* 5. ORDER HISTORY VIEW */}
        {view === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 md:p-8 flex flex-col h-full overflow-y-auto w-full max-w-5xl mx-auto"
          >
            <TopBar title="Order History" onBack={() => setView('list')} />
            
            <div className="space-y-4 pb-20">
              {ordersLoading ? (
                <div className="text-center py-20 text-muted-foreground">Loading orders...</div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
                  <p className="text-xl font-bold text-foreground">No Orders Yet</p>
                  <p className="mt-2">You haven't placed any product orders.</p>
                </div>
              ) : (
                myOrders.map(order => {
                  const product = activeProducts.find(p => p.id === order.productId);
                  return (
                    <div key={order.id} className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative group">
                      <div className="flex gap-4 items-center flex-1">
                        <div className="w-16 h-16 bg-muted/30 rounded-xl overflow-hidden shrink-0 shadow-inner p-2 flex items-center justify-center border border-border/40">
                          {product?.productImage ? (
                            <img src={product.productImage} className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg mb-1">{product?.name || order.productId}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>Qty: {order.quantity}</span>
                            <span>Total: <strong className="text-primary">₹{order.totalPrice}</strong></span>
                            <span>Date: {new Date(order.requestDate || order.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {order.status === 'approved' && (
                          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-sm flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Approved
                          </div>
                        )}
                        {order.status === 'rejected' && (
                          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold text-sm flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Rejected
                          </div>
                        )}
                        {(!order.status || order.status === 'pending') && (
                          <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold text-sm flex items-center gap-1">
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
