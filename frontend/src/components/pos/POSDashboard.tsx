import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, Wifi, WifiOff, RefreshCw, Power, Settings, MapPin,
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle,
  CheckCircle, XCircle, Clock, Activity, Zap, Bell, Filter,
  Search, MoreVertical, Eye, ChevronDown, ChevronUp, CreditCard,
  Smartphone, Laptop, Server, Globe, BarChart3, PieChart, LineChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useMasterData } from "@/contexts/MasterDataContext";
import { POSTerminal, POSAlert } from "@/data/sharedTypes";

// Interfaces
interface SalesMetric {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}



// Hourly Sales Data for Chart
const hourlyData = [
  { hour: "9AM", sales: 12500, transactions: 15 },
  { hour: "10AM", sales: 28900, transactions: 32 },
  { hour: "11AM", sales: 45600, transactions: 48 },
  { hour: "12PM", sales: 67800, transactions: 72 },
  { hour: "1PM", sales: 54300, transactions: 58 },
  { hour: "2PM", sales: 38900, transactions: 42 },
  { hour: "3PM", sales: 52100, transactions: 55 },
  { hour: "4PM", sales: 61200, transactions: 65 },
  { hour: "5PM", sales: 78400, transactions: 82 },
  { hour: "6PM", sales: 89500, transactions: 95 },
];

// Payment type distribution
const paymentTypes = [
  { type: "Cash", amount: 345600, percentage: 35, color: "bg-emerald-500" },
  { type: "Card", amount: 423800, percentage: 43, color: "bg-blue-500" },
  { type: "UPI", amount: 196700, percentage: 20, color: "bg-purple-500" },
  { type: "Credit", amount: 19600, percentage: 2, color: "bg-amber-500" },
];

interface POSDashboardProps {
  locations: Array<{ id: string; name: string }>;
}

export default function POSDashboard({ locations }: POSDashboardProps) {
  const { posTerminals: terminals, posAlerts: alerts } = useMasterData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTerminal, setSelectedTerminal] = useState<POSTerminal | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    totalSales: 0,
    totalTransactions: 0,
    onlineTerminals: 0,
    syncRate: 0,
  });

  // Animate metrics on mount
  useEffect(() => {
    const targetValues = {
      totalSales: terminals.reduce((sum, t) => sum + t.todaySales, 0),
      totalTransactions: terminals.reduce((sum, t) => sum + t.todayTransactions, 0),
      onlineTerminals: terminals.filter(t => t.status === "online").length,
      syncRate: 94,
    };

    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues({
        totalSales: Math.round(targetValues.totalSales * easeOut),
        totalTransactions: Math.round(targetValues.totalTransactions * easeOut),
        onlineTerminals: Math.round(targetValues.onlineTerminals * easeOut),
        syncRate: Math.round(targetValues.syncRate * easeOut),
      });

      if (step >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [terminals]);

  // Filter terminals
  const filteredTerminals = terminals.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard refreshed successfully");
    }, 1500);
  };

  // Handle sync terminal
  const handleSyncTerminal = (terminal: POSTerminal) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminal.id ? { ...t, status: "syncing" as const } : t
    ));
    toast.info(`Syncing ${terminal.name}...`);
    setTimeout(() => {
      setTerminals(prev => prev.map(t => 
        t.id === terminal.id ? { ...t, status: "online" as const, lastSync: "Just now" } : t
      ));
      toast.success(`${terminal.name} synced successfully`);
    }, 2000);
  };

  // Handle toggle terminal
  const handleToggleTerminal = (terminal: POSTerminal, enabled: boolean) => {
    setTerminals(prev => prev.map(t => 
      t.id === terminal.id ? { ...t, status: enabled ? "online" : "offline" } : t
    ));
    toast.success(`${terminal.name} ${enabled ? "enabled" : "disabled"}`);
  };

  // Resolve alert
  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    ));
    toast.success("Alert marked as resolved");
  };

  // Get status icon and color
  const getStatusIndicator = (status: POSTerminal["status"]) => {
    switch (status) {
      case "online":
        return { icon: Wifi, color: "text-emerald-500", bg: "bg-emerald-500/20", pulse: true };
      case "offline":
        return { icon: WifiOff, color: "text-muted-foreground", bg: "bg-muted", pulse: false };
      case "syncing":
        return { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/20", pulse: true };
      case "error":
        return { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/20", pulse: true };
    }
  };

  // Get terminal type icon
  const getTerminalTypeIcon = (type: POSTerminal["type"]) => {
    switch (type) {
      case "Web": return Globe;
      case "Mobile": return Smartphone;
      case "Hardware": return Server;
    }
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" />
            POS Integration Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring and management of all connected POS terminals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            POS Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Today's Sales</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(animatedValues.totalSales)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-emerald-500 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12.5% from yesterday</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Transactions</p>
                  <p className="text-3xl font-bold mt-1">{animatedValues.totalTransactions}</p>
                  <div className="flex items-center gap-1 mt-2 text-blue-500 text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Across all terminals</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Online Terminals</p>
                  <p className="text-3xl font-bold mt-1">
                    {animatedValues.onlineTerminals}
                    <span className="text-lg text-muted-foreground font-normal">/{terminals.length}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-sm text-muted-foreground">Live monitoring</span>
                  </div>
                </div>
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Sync Rate</p>
                  <p className="text-3xl font-bold mt-1">{animatedValues.syncRate}%</p>
                  <div className="mt-2">
                    <Progress value={animatedValues.syncRate} className="h-2" />
                  </div>
                </div>
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="terminals" className="gap-2">
              <Monitor className="w-4 h-4" />
              Terminals
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" />
              Alerts
              {alerts.filter(a => !a.resolved).length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {alerts.filter(a => !a.resolved).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <PieChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab === "terminals" && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search terminals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="syncing">Syncing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Chart */}
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-primary" />
                  Today's Sales Trend
                </CardTitle>
                <Badge variant="outline">Live</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 pt-4">
                  {hourlyData.map((item, index) => (
                    <motion.div
                      key={item.hour}
                      className="flex-1 flex flex-col items-center gap-2"
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <motion.div
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md relative group cursor-pointer"
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.sales / 90000) * 200}px` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatCurrency(item.sales)}
                          <br />
                          {item.transactions} txns
                        </div>
                      </motion.div>
                      <span className="text-xs text-muted-foreground">{item.hour}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Types */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentTypes.map((payment, index) => (
                  <motion.div
                    key={payment.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{payment.type}</span>
                      <span className="text-muted-foreground">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${payment.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${payment.percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.8 }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{payment.percentage}%</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Terminal Status Grid */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Terminal Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {terminals.map((terminal, index) => {
                  const status = getStatusIndicator(terminal.status);
                  const TypeIcon = getTerminalTypeIcon(terminal.type);
                  
                  return (
                    <motion.div
                      key={terminal.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border ${status.bg} cursor-pointer transition-all`}
                      onClick={() => setSelectedTerminal(terminal)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${status.bg}`}>
                            <TypeIcon className={`w-4 h-4 ${status.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{terminal.name}</p>
                            <p className="text-xs text-muted-foreground">{terminal.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {status.pulse && (
                            <span className="relative flex h-2 w-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color.replace('text-', 'bg-')} opacity-75`} />
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color.replace('text-', 'bg-')}`} />
                            </span>
                          )}
                          <span className={`text-xs font-medium capitalize ${status.color}`}>
                            {terminal.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Sales</p>
                          <p className="font-semibold">{formatCurrency(terminal.todaySales)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transactions</p>
                          <p className="font-semibold">{terminal.todayTransactions}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminals Tab */}
        <TabsContent value="terminals">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Terminal</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Today's Sales</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredTerminals.map((terminal, index) => {
                      const status = getStatusIndicator(terminal.status);
                      const TypeIcon = getTerminalTypeIcon(terminal.type);
                      
                      return (
                        <motion.tr
                          key={terminal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.03 }}
                          className="group hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${status.bg}`}>
                                <Monitor className={`w-4 h-4 ${status.color}`} />
                              </div>
                              <div>
                                <p className="font-medium">{terminal.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{terminal.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {terminal.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className="w-4 h-4 text-muted-foreground" />
                              {terminal.type}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {status.pulse && (
                                <span className="relative flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.color.replace('text-', 'bg-')} opacity-75`} />
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color.replace('text-', 'bg-')}`} />
                                </span>
                              )}
                              <Badge
                                variant={terminal.status === "online" ? "default" : terminal.status === "error" ? "destructive" : "secondary"}
                                className="capitalize"
                              >
                                {terminal.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {terminal.lastSync}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(terminal.todaySales)}
                          </TableCell>
                          <TableCell>{terminal.todayTransactions}</TableCell>
                          <TableCell>{terminal.operator}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedTerminal(terminal)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSyncTerminal(terminal)}
                                disabled={terminal.status === "syncing"}
                              >
                                <RefreshCw className={`w-4 h-4 ${terminal.status === "syncing" ? "animate-spin" : ""}`} />
                              </Button>
                              <Switch
                                checked={terminal.status !== "offline"}
                                onCheckedChange={(checked) => handleToggleTerminal(terminal, checked)}
                              />
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Active Alerts & Notifications
              </CardTitle>
              <Button variant="outline" size="sm">
                Mark All Resolved
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start justify-between p-4 rounded-xl border ${
                      alert.resolved ? "bg-muted/30 opacity-60" : 
                      alert.type === "error" ? "bg-destructive/10 border-destructive/30" :
                      alert.type === "warning" ? "bg-amber-500/10 border-amber-500/30" :
                      "bg-blue-500/10 border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        alert.type === "error" ? "bg-destructive/20" :
                        alert.type === "warning" ? "bg-amber-500/20" :
                        "bg-blue-500/20"
                      }`}>
                        {alert.type === "error" ? (
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : alert.type === "warning" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Bell className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {alert.terminalName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve
                      </Button>
                    )}
                    {alert.resolved && (
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                        Resolved
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Terminal Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Terminal Performance Ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {terminals
                  .sort((a, b) => b.todaySales - a.todaySales)
                  .slice(0, 5)
                  .map((terminal, index) => {
                    const maxSales = terminals.reduce((max, t) => Math.max(max, t.todaySales), 0);
                    const percentage = (terminal.todaySales / maxSales) * 100;
                    
                    return (
                      <motion.div
                        key={terminal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? "bg-amber-500/20 text-amber-500" :
                              index === 1 ? "bg-gray-300/20 text-gray-400" :
                              index === 2 ? "bg-orange-500/20 text-orange-500" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-medium">{terminal.name}</span>
                          </div>
                          <span className="text-muted-foreground">{formatCurrency(terminal.todaySales)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
              </CardContent>
            </Card>

            {/* Sync Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  Sync Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Fully Synced</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{terminals.filter(t => t.status === "online").length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-center gap-2 text-blue-500">
                        <RefreshCw className="w-5 h-5" />
                        <span className="font-medium">Syncing</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{terminals.filter(t => t.status === "syncing").length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <WifiOff className="w-5 h-5" />
                        <span className="font-medium">Offline</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{terminals.filter(t => t.status === "offline").length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Errors</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{terminals.filter(t => t.status === "error").length}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Sync Health</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      Last full sync completed at 10:45 AM today
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Error Distribution by Terminal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4 h-48">
                {terminals.map((terminal, index) => (
                  <motion.div
                    key={terminal.id}
                    className="flex-1 flex flex-col items-center gap-2"
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <motion.div
                      className={`w-full rounded-t-md ${terminal.errorCount > 0 ? "bg-destructive" : "bg-muted"}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((terminal.errorCount / 5) * 150, 4)}px` }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold">{terminal.errorCount}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-16" title={terminal.name}>
                        {terminal.name.split(' ')[0]}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Terminal Detail Modal */}
      <AnimatePresence>
        {selectedTerminal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTerminal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedTerminal.name}</h3>
                  <p className="text-muted-foreground">{selectedTerminal.id}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTerminal(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedTerminal.location}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedTerminal.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">IP Address</p>
                    <p className="font-mono text-sm">{selectedTerminal.ipAddress}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-mono text-sm">{selectedTerminal.version}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Operator</p>
                    <p className="font-medium">{selectedTerminal.operator}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Sync</p>
                    <p className="font-medium">{selectedTerminal.lastSync}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{formatCurrency(selectedTerminal.todaySales)}</p>
                    <p className="text-sm text-muted-foreground">Today's Sales</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{selectedTerminal.todayTransactions}</p>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{selectedTerminal.errorCount}</p>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleSyncTerminal(selectedTerminal);
                      setSelectedTerminal(null);
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync Now
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Settings className="w-4 h-4" />
                    Configure
                  </Button>
                  <Button 
                    variant={selectedTerminal.status === "offline" ? "default" : "destructive"}
                    className="gap-2"
                    onClick={() => {
                      handleToggleTerminal(selectedTerminal, selectedTerminal.status === "offline");
                      setSelectedTerminal(null);
                    }}
                  >
                    <Power className="w-4 h-4" />
                    {selectedTerminal.status === "offline" ? "Enable" : "Disable"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
