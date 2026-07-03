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
  const [view, setView] = useState<'list' | 'detail' | 'order' | 'success' | 'history' | 'categories'>('list');
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
    <div className="flex items-center gap-3 mb-8 pt-2">
      {onBack && (
        <button onClick={onBack} className="p-2.5 bg-card border border-border/50 hover:bg-muted hover:shadow-sm rounded-2xl transition-all group">
          <ChevronLeft className="w-5 h-5 text-foreground group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}
      <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{title}</h2>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[80vh] bg-background rounded-xl overflow-hidden relative flex flex-col font-sans">
      
      {/* 1. LIST VIEW */}
      <AnimatePresence mode="wait">
        {(view === 'list' || view === 'categories') && (
          <motion.div 
            key={view}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 md:p-8 flex-1 flex flex-col h-full overflow-y-auto"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
              <div>
                <h2 className="text-4xl font-black text-foreground tracking-tight mb-2">Catalog</h2>
                <p className="text-muted-foreground font-medium">Discover our premium range of products</p>
              </div>
              
              <div className="flex space-x-1 bg-card/80 p-1.5 rounded-2xl w-full md:w-fit backdrop-blur-md border border-border/50 shadow-sm">
                {[
                  { id: 'list', label: 'Products' },
                  { id: 'categories', label: 'Categories' },
                  { id: 'history', label: 'My Orders' }
                ].map(tab => {
                  const isActive = view === tab.id || (view === 'list' && tab.id === 'list' && selectedCategory !== 'all');
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { 
                        if (tab.id === 'list') { setView('list'); setSelectedCategory('all'); }
                        else if (tab.id === 'history') { setView('history'); fetchMyOrders(); }
                        else { setView('categories'); }
                      }}
                      className={`relative flex-1 md:flex-none px-2 sm:px-6 py-3 text-[11px] sm:text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap flex items-center justify-center ${isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-catalog-tab"
                          className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-md shadow-primary/20"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {view === 'categories' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pb-20">
                {categories.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => { setSelectedCategory(c.id); setView('list'); }}
                    className="bg-card/80 backdrop-blur-sm border-2 border-border/50 hover:border-primary/40 rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <div className="w-16 h-16 bg-primary/10 rounded-2xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                       <Package className="w-8 h-8 text-primary" />
                     </div>
                     <h3 className="font-extrabold text-xl text-center text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                  </div>
                ))}
              </div>
            )}

            {view === 'list' && (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-card/40 p-4 rounded-3xl border border-border/50 backdrop-blur-sm">
                  <div className="relative flex-1 w-full">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      className="pl-14 bg-background/80 border-transparent hover:border-primary/20 focus-visible:ring-primary focus-visible:border-primary h-14 text-base rounded-2xl shadow-sm transition-all w-full font-medium" 
                      placeholder="Search for premium products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {selectedCategory !== 'all' && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedCategory('all')}
                        className="rounded-xl text-sm h-14 px-6 text-primary bg-primary/10 hover:bg-primary/20 font-bold"
                      >
                        Clear Filter
                      </Button>
                    )}
                    <div className="flex bg-background/80 border border-border/50 rounded-2xl p-1.5 shadow-sm">
                      <button 
                        onClick={() => setDisplayMode('grid')}
                        className={`p-3 rounded-xl transition-all ${displayMode === 'grid' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >
                        <LayoutGrid className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setDisplayMode('list')}
                        className={`p-3 rounded-xl transition-all ${displayMode === 'list' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`grid gap-6 pb-20 ${displayMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
                  {filteredProducts.map((product) => {
                    const isGrid = displayMode === 'grid';
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={product.id}
                        onClick={() => { setSelectedProduct(product); setView('detail'); }}
                        className={`group bg-card/80 backdrop-blur-md hover:bg-card border border-border/40 hover:border-primary/40 rounded-[2rem] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${isGrid ? 'flex flex-col p-4' : 'flex flex-row p-5 items-center gap-6'}`}
                      >
                        <div className={`${isGrid ? 'w-full aspect-square mb-5' : 'w-28 h-28 shrink-0'} relative bg-gradient-to-br from-primary/5 via-muted/20 to-primary/10 rounded-[1.5rem] overflow-hidden shadow-inner group-hover:shadow-md transition-all duration-500 flex items-center justify-center p-4 border border-white/10`}>
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {product.productImage ? (
                            <img src={product.productImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500 drop-shadow-md" />
                          ) : (
                            <Package className="w-12 h-12 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                          )}
                          
                          {isGrid && (
                            <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-primary text-primary-foreground p-2.5 rounded-xl shadow-lg">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className={`flex flex-col flex-1 min-w-0 ${isGrid ? '' : 'justify-center pr-4'}`}>
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                             <h3 className="font-extrabold text-foreground text-base sm:text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                             {!isGrid && (
                                <div className="hidden sm:flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-primary/10 text-primary whitespace-nowrap">
                                  ₹{product.sellingPrice}
                                </div>
                             )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-4 font-medium opacity-90">{product.brand || "Premium Selection"}</p>
                          
                          {isGrid ? (
                            <div className="mt-auto flex items-center justify-between">
                              <div className="inline-flex items-center text-xl font-black text-foreground">
                                ₹{product.sellingPrice}
                              </div>
                            </div>
                          ) : (
                            <div className="sm:hidden mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary w-fit">
                              ₹{product.sellingPrice}
                            </div>
                          )}
                        </div>
                        {!isGrid && <ChevronRight className="w-6 h-6 text-muted-foreground/30 absolute right-6 group-hover:translate-x-2 group-hover:text-primary transition-all duration-300" />}
                      </motion.div>
                    );
                  })}
                  
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-muted-foreground">
                      <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 opacity-30" />
                      </div>
                      <p className="text-xl font-bold text-foreground mb-2">No products found</p>
                      <p className="font-medium">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* 2. DETAIL VIEW */}
        {view === 'detail' && selectedProduct && (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="p-4 md:p-8 flex flex-col h-full overflow-y-auto w-full max-w-6xl mx-auto"
          >
            <TopBar title="Product Details" onBack={() => setView('list')} />
            
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start mt-4 pb-20">
              <div className="bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 rounded-[2rem] p-6 md:p-8 shadow-sm flex items-center justify-center min-h-[300px] lg:min-h-[400px] border border-border/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                {selectedProduct.productImage ? (
                  <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                    src={selectedProduct.productImage} 
                    alt={selectedProduct.name} 
                    className="w-full h-full max-h-[300px] object-contain mix-blend-multiply drop-shadow-lg group-hover:scale-105 transition-transform duration-700 relative z-10" 
                  />
                ) : (
                  <Package className="w-24 h-24 text-muted-foreground/30 relative z-10" />
                )}
              </div>

              <div className="flex flex-col py-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary w-fit mb-4 uppercase tracking-widest">
                  {selectedProduct.brand || "Premium Quality"}
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-3 tracking-tight leading-tight">{selectedProduct.name}</h2>
                <p className="text-3xl font-bold text-primary mb-6 tracking-tight">₹{selectedProduct.sellingPrice}</p>

                <div className="prose prose-sm dark:prose-invert mb-8 text-muted-foreground leading-relaxed font-medium">
                  <p>
                    {selectedProduct.name} is a meticulously formulated {selectedProduct.brand || "agricultural solution"}, designed to deliver outstanding results. It significantly improves crop yields, enriches soil health, and ensures long-term sustainability.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-card/50 backdrop-blur-sm border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col gap-1 hover:border-primary/30 transition-colors">
                    <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">Availability</span>
                    <span className="text-foreground text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> In Stock</span>
                  </div>
                  <div className="bg-card/50 backdrop-blur-sm border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col gap-1 hover:border-primary/30 transition-colors">
                    <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">Delivery</span>
                    <span className="text-foreground text-sm font-bold flex items-center gap-1.5">2-4 Business Days</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-6 border-t border-border/40">
                   <Button 
                    variant="outline"
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
                    className={`flex-1 rounded-xl h-12 text-sm font-semibold shadow-sm transition-all border-2 ${selectedProduct.brochure ? 'hover:bg-primary hover:text-primary-foreground hover:border-primary' : 'bg-muted-foreground/10 cursor-not-allowed opacity-50'}`}
                  >
                    <Download className="w-4 h-4 mr-2" /> Brochure
                  </Button>
                  
                  <Button 
                    onClick={() => setView('order')}
                    className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-bold shadow-md transition-all hover:-translate-y-0.5"
                  >
                    Order Now
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 md:p-8 flex flex-col h-full overflow-y-auto w-full max-w-3xl mx-auto pb-24"
          >
            <TopBar title="Checkout" onBack={() => setView('detail')} />
            
            <div className="bg-card/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-border/80 shadow-2xl mt-4 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pb-10 border-b border-border/60 relative z-10">
                <div className="w-28 h-28 bg-gradient-to-br from-primary/10 to-muted/40 rounded-[1.5rem] p-3 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                   {selectedProduct.productImage ? (
                    <img src={selectedProduct.productImage} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <Package className="w-10 h-10 text-muted-foreground/40" />
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground mb-2 tracking-tight">{selectedProduct.name}</h3>
                  <p className="text-primary font-extrabold text-2xl">₹{selectedProduct.sellingPrice} <span className="text-base font-semibold text-muted-foreground">/ unit</span></p>
                </div>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <Label className="text-foreground text-sm font-bold uppercase tracking-widest text-muted-foreground">Select Vendor (Optional)</Label>
                  <select 
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="flex h-16 w-full items-center justify-between rounded-2xl border-2 border-border/80 bg-background/50 px-6 py-2 text-lg text-foreground font-semibold focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary shadow-sm hover:border-primary/50 transition-colors cursor-pointer appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="">Direct Order (No Vendor)</option>
                    {activeVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-foreground text-sm font-bold uppercase tracking-widest text-muted-foreground">Quantity</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        min="1" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Enter quantity" 
                        className="h-16 rounded-2xl border-2 border-border/80 bg-background/50 text-xl font-bold focus-visible:ring-0 focus-visible:border-primary pl-6 pr-16 shadow-sm hover:border-primary/50 transition-colors" 
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold pointer-events-none">
                        Units
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-[2rem] p-8 md:p-10 border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10 mt-8">
                <div className="text-center md:text-left">
                  <p className="text-sm font-bold text-primary/80 uppercase tracking-widest mb-2">Total Amount</p>
                  <p className="text-4xl font-black text-primary tracking-tight">₹{selectedProduct.sellingPrice * quantity}</p>
                </div>
                <Button 
                  onClick={handleBookProduct}
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-10 h-16 text-xl font-black shadow-xl shadow-primary/30 transition-all hover:scale-105"
                >
                  {isSubmitting ? "Processing..." : "Confirm Order"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. SUCCESS SUMMARY VIEW */}
        {view === 'success' && selectedProduct && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 flex flex-col items-center justify-center h-full overflow-y-auto w-full max-w-2xl mx-auto min-h-[70vh]"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
              className="w-28 h-28 bg-green-500/10 text-green-500 rounded-[2rem] flex items-center justify-center mb-8 border-4 border-green-500/20 shadow-xl shadow-green-500/10 rotate-12"
            >
              <CheckCircle2 className="w-14 h-14 -rotate-12" />
            </motion.div>
            
            <h2 className="text-5xl font-black text-foreground mb-4 text-center tracking-tight">Order Successful!</h2>
            <p className="text-muted-foreground text-xl text-center mb-12 font-medium max-w-md leading-relaxed">Your request has been submitted and is currently pending approval.</p>

            <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-border/80 w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <h3 className="font-extrabold text-foreground mb-8 text-2xl flex items-center gap-3 border-b border-border/60 pb-6">
                <Package className="w-7 h-7 text-primary" /> Order Summary
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                <div className="w-40 h-40 bg-gradient-to-br from-primary/10 to-muted/40 rounded-[2rem] p-4 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  {selectedProduct.productImage ? (
                    <img src={selectedProduct.productImage} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 space-y-6 w-full">
                  <div className="grid grid-cols-2 gap-6 border-b border-border/40 pb-6">
                    <div>
                      <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2">Product</p>
                      <p className="font-black text-lg text-foreground line-clamp-2 leading-tight">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2">Date</p>
                      <p className="font-bold text-lg text-foreground">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2">Quantity</p>
                      <p className="font-black text-foreground text-xl">{quantity} <span className="text-sm font-semibold text-muted-foreground">units</span></p>
                    </div>
                    <div>
                      <p className="text-primary/80 text-sm font-bold uppercase tracking-widest mb-2">Total Amount</p>
                      <p className="font-black text-primary text-3xl tracking-tight">₹{selectedProduct.sellingPrice * quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 w-full max-w-sm">
              <Button 
                onClick={() => { setView('list'); setSelectedProduct(null); setQuantity(1); }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-16 text-xl font-bold shadow-xl shadow-primary/25 transition-all hover:-translate-y-1"
              >
                Continue Shopping
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
            
            <div className="space-y-6 pb-20 mt-6">
              {ordersLoading ? (
                <div className="text-center py-32 text-muted-foreground flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="font-bold text-lg">Loading your orders...</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-32 text-muted-foreground bg-card/60 backdrop-blur-xl rounded-[3rem] border border-border/80 shadow-sm flex flex-col items-center">
                  <Package className="w-24 h-24 mb-6 opacity-20" />
                  <p className="text-3xl font-black text-foreground mb-3 tracking-tight">No Orders Yet</p>
                  <p className="text-lg font-medium max-w-sm">You haven't placed any product orders recently. Browse the catalog to get started.</p>
                  <Button 
                    onClick={() => { setView('list'); setSelectedCategory('all'); }}
                    className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12 text-base font-bold shadow-lg"
                  >
                    Browse Catalog
                  </Button>
                </div>
              ) : (
                myOrders.map(order => {
                  const product = activeProducts.find(p => p.id === order.productId);
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={order.id} 
                      className="bg-card/80 backdrop-blur-md border border-border/80 hover:border-primary/40 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group"
                    >
                      <div className="flex gap-6 items-center flex-1 w-full">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/5 to-muted/40 rounded-[1.5rem] overflow-hidden shrink-0 shadow-inner p-3 flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform duration-300">
                          {product?.productImage ? (
                            <img src={product.productImage} className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <Package className="w-10 h-10 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-foreground text-2xl mb-3 truncate">{product?.name || order.productId}</h3>
                          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm font-bold">
                            <span className="bg-muted/80 px-4 py-1.5 rounded-full text-muted-foreground">Qty: <span className="text-foreground">{order.quantity}</span></span>
                            <span className="bg-primary/10 px-4 py-1.5 rounded-full text-primary">₹{order.totalPrice}</span>
                            <span className="text-muted-foreground flex items-center gap-2 bg-muted/30 px-4 py-1.5 rounded-full">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                              {new Date(order.requestDate || order.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center w-full md:w-auto md:justify-end border-t md:border-t-0 border-border/50 pt-6 md:pt-0">
                        {order.status === 'approved' && (
                          <div className="px-5 py-2.5 bg-green-500/10 text-green-600 rounded-2xl font-black text-sm flex items-center gap-2.5 border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5" /> APPROVED
                          </div>
                        )}
                        {order.status === 'rejected' && (
                          <div className="px-5 py-2.5 bg-red-500/10 text-red-600 rounded-2xl font-black text-sm flex items-center gap-2.5 border border-red-500/20">
                            <XCircle className="w-5 h-5" /> REJECTED
                          </div>
                        )}
                        {(!order.status || order.status === 'pending') && (
                          <div className="px-5 py-2.5 bg-amber-500/10 text-amber-600 rounded-2xl font-black text-sm flex items-center gap-2.5 border border-amber-500/20">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> PENDING
                          </div>
                        )}
                      </div>
                    </motion.div>
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
