import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Calendar,
  Users,
  BarChart3,
  Bell,
  Target,
  TrendingUp,
  Handshake,
  Phone,
  FileText,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Building2,
  ChevronRight,
  Filter,
  Download,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMasterData } from "@/contexts/MasterDataContext";
import { Lead, Customer } from "@/data/sharedTypes";
import { LiveTrackingMap } from "@/components/tracking/LiveTrackingMap";

// ============= Types =============

interface SalesKPI {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Meeting {
  id: string;
  title: string;
  customer: string;
  time: string;
  date: string;
  location: string;
  status: "upcoming" | "completed" | "cancelled";
}

interface Task {
  id: string;
  title: string;
  type: "call" | "visit" | "follow-up" | "proposal";
  customer: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed";
}

// ============= Mock Data =============


const notifications = [
  { id: "1", message: "New lead assigned: Harbor Construction", time: "10 min ago", type: "info" },
  { id: "2", message: "Meeting reminder: Project Discussion at 10:00 AM", time: "30 min ago", type: "warning" },
  { id: "3", message: "Deal closed: Urban Structures - ₹3,20,000", time: "2 hours ago", type: "success" },
];

// ============= Sidebar Menu =============

const sidebarMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "daily-tracking", label: "Daily Tracking", icon: Activity },
  { id: "live-tracking", label: "Live Tracking", icon: Navigation },
  { id: "meetings", label: "Meeting Setup", icon: Calendar },
  { id: "leads", label: "Leads & Deals", icon: Target },
  { id: "customers", label: "Assigned Customers", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "notifications", label: "Alerts", icon: Bell },
];

// ============= KPI Data =============

const salesKPIs: SalesKPI[] = [
  { title: "Leads Created", value: "24", change: "+12%", changeType: "positive", icon: Target, color: "from-blue-500 to-blue-600" },
  { title: "Deals Closed", value: "8", change: "+25%", changeType: "positive", icon: Handshake, color: "from-green-500 to-green-600" },
  { title: "Conversion Rate", value: "33%", change: "+5%", changeType: "positive", icon: TrendingUp, color: "from-purple-500 to-purple-600" },
  { title: "Target Achievement", value: "78%", change: "22% to go", changeType: "neutral", icon: BarChart3, color: "from-orange-500 to-orange-600" },
];

// ============= Components =============

function SalesPortalContent() {
  const navigate = useNavigate();
  const { leads: mockLeads, meetings: rawMeetings, customers: mockCustomers, employeeTasks: rawTasks } = useMasterData();

  const mockMeetings: Meeting[] = rawMeetings.map(m => ({
    id: m.id,
    title: m.title,
    customer: m.attendees?.[0]?.name || "N/A",
    time: m.startTime || "00:00",
    date: m.date || new Date().toISOString().split('T')[0],
    location: m.location || "N/A",
    status: m.status === "scheduled" ? "upcoming" : (m.status as "completed" | "cancelled")
  }));

  const mockTasks: Task[] = rawTasks.map(t => ({
    id: t.id,
    title: t.taskTitle,
    type: "follow-up",
    customer: "N/A",
    dueDate: t.deadline || new Date().toISOString().split('T')[0],
    priority: "medium",
    status: t.status === "Completed" ? "completed" : "pending"
  }));

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Get logged-in user info
  const userName = sessionStorage.getItem("userName") || "Sales Executive";
  const userEmail = sessionStorage.getItem("userEmail") || "";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "contacted": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "qualified": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "proposal": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "closed-won": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "closed-lost": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "upcoming": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "completed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "inactive": return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {salesKPIs.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${kpi.color}`} />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.title}</p>
                      <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                      <p className={`text-sm mt-1 ${
                        kpi.changeType === "positive" ? "text-green-600" :
                        kpi.changeType === "negative" ? "text-red-600" : "text-muted-foreground"
                      }`}>
                        {kpi.change}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Panel */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Today's Tasks</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTasks.filter(t => t.status === "pending").slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === "high" ? "bg-red-500" :
                  task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.customer}</p>
                </div>
                <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Meetings Panel */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Upcoming Meetings</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMeetings.filter(m => m.status === "upcoming").slice(0, 4).map((meeting) => (
              <div key={meeting.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{meeting.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{meeting.time}</span>
                    <MapPin className="w-3 h-3 ml-2" />
                    <span className="truncate">{meeting.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockLeads.slice(0, 4).map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                  {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lead.name}</p>
                  <p className="text-sm text-muted-foreground">₹{lead.value.toLocaleString()}</p>
                </div>
                <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Customer Access */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Assigned Customers</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockCustomers.filter(c => c.status === "active").slice(0, 4).map((customer) => (
              <div key={customer.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.company}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10">
                    <Phone className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10">
                    <Mail className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Target Progress */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Monthly Target Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Sales Target</span>
                <span className="text-sm text-muted-foreground">₹15,60,000 / ₹20,00,000</span>
              </div>
              <Progress value={78} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Leads Target</span>
                <span className="text-sm text-muted-foreground">24 / 30</span>
              </div>
              <Progress value={80} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Meetings Completed</span>
                <span className="text-sm text-muted-foreground">18 / 25</span>
              </div>
              <Progress value={72} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDailyTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daily Activity Tracking</h2>
        <Button className="gradient-btn">
          <Activity className="w-4 h-4 mr-2" />
          Log Activity
        </Button>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Phone className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Calls Made</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <MapPin className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Visits Done</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Deals Closed</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "09:30 AM", activity: "Called ABC Corporation for follow-up", type: "call", status: "completed" },
                  { time: "10:00 AM", activity: "Meeting with XYZ Industries - Project Discussion", type: "meeting", status: "completed" },
                  { time: "11:30 AM", activity: "Site visit to Metro Construction", type: "visit", status: "completed" },
                  { time: "02:00 PM", activity: "Proposal sent to Global Tech Ltd", type: "proposal", status: "completed" },
                  { time: "03:30 PM", activity: "Follow-up call with Harbor Co", type: "call", status: "pending" },
                ].map((log, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-sm font-medium text-muted-foreground w-20">{log.time}</div>
                    <div className={`w-2 h-2 rounded-full ${log.status === "completed" ? "bg-green-500" : "bg-yellow-500"}`} />
                    <div className="flex-1">
                      <p className="font-medium">{log.activity}</p>
                    </div>
                    <Badge variant="secondary">{log.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card className="border-0 shadow-lg p-6 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Weekly activity summary will be displayed here</p>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card className="border-0 shadow-lg p-6 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Monthly activity summary will be displayed here</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderLiveTracking = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Live Tracking & Route History</h2>
          <p className="text-muted-foreground">Monitor field operations, calculate distances, and automate travel reimbursements.</p>
        </div>
      </div>
      
      <LiveTrackingMap />
    </div>
  );

  const renderMeetings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meeting Setup</h2>
        <Button className="gradient-btn">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search meetings..." className="w-64" />
      </div>

      <div className="grid gap-4">
        {mockMeetings.map((meeting) => (
          <Card key={meeting.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {new Date(meeting.date).getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground">{meeting.customer}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {meeting.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {meeting.location}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(meeting.status)}>{meeting.status}</Badge>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leads & Deals</h2>
        <Button className="gradient-btn">
          <Target className="w-4 h-4 mr-2" />
          Create Lead
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="closed-won">Closed Won</SelectItem>
            <SelectItem value="closed-lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search leads..." className="w-64" />
      </div>

      <div className="grid gap-4">
        {mockLeads.map((lead) => (
          <Card key={lead.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                  {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{lead.name}</h3>
                  <p className="text-sm text-muted-foreground">{lead.company}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{lead.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Source: {lead.source}</p>
                </div>
                <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assigned Customers</h2>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Territory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="north">North Zone</SelectItem>
              <SelectItem value="south">South Zone</SelectItem>
              <SelectItem value="east">East Zone</SelectItem>
              <SelectItem value="west">West Zone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-10 max-w-md" />
      </div>

      <div className="grid gap-4">
        {mockCustomers.map((customer) => (
          <Card key={customer.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">{customer.company}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{customer.territory}</span>
                    <span>Last contact: {customer.lastContact}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Phone className="w-3 h-3" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="flex gap-2">
          <Select defaultValue="daily">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Report</SelectItem>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Daily Activity Report", description: "Summary of calls, visits, and meetings", date: "2025-01-12" },
          { title: "Lead Status Report", description: "Overview of lead pipeline and conversions", date: "2025-01-12" },
          { title: "Sales Performance Report", description: "Target vs achievement analysis", date: "2025-01-11" },
          { title: "Customer Visit Report", description: "Details of customer visits and outcomes", date: "2025-01-10" },
          { title: "Weekly Summary", description: "Week-over-week performance comparison", date: "2025-01-07" },
          { title: "Monthly Performance", description: "Monthly sales and activity metrics", date: "2025-01-01" },
        ].map((report, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{report.date}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alerts & Notifications</h2>
        <Button variant="outline">Mark All Read</Button>
      </div>

      <div className="space-y-3">
        {[
          { id: "1", message: "New lead assigned: Harbor Construction", time: "10 min ago", type: "info", icon: Target },
          { id: "2", message: "Meeting reminder: Project Discussion at 10:00 AM", time: "30 min ago", type: "warning", icon: Calendar },
          { id: "3", message: "Deal closed: Urban Structures - ₹3,20,000", time: "2 hours ago", type: "success", icon: CheckCircle2 },
          { id: "4", message: "Follow-up overdue: ABC Corporation", time: "3 hours ago", type: "error", icon: AlertCircle },
          { id: "5", message: "New customer assigned: Prime Builders", time: "5 hours ago", type: "info", icon: Users },
          { id: "6", message: "Weekly report ready for download", time: "1 day ago", type: "info", icon: FileText },
        ].map((notification) => {
          const Icon = notification.icon;
          return (
            <Card key={notification.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === "success" ? "bg-green-100 text-green-600" :
                    notification.type === "warning" ? "bg-yellow-100 text-yellow-600" :
                    notification.type === "error" ? "bg-red-100 text-red-600" :
                    "bg-blue-100 text-blue-600"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-sm text-muted-foreground">{notification.time}</p>
                  </div>
                  <Button variant="ghost" size="sm">Dismiss</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard": return renderDashboard();
      case "daily-tracking": return renderDailyTracking();
      case "live-tracking": return renderLiveTracking();
      case "meetings": return renderMeetings();
      case "leads": return renderLeads();
      case "customers": return renderCustomers();
      case "reports": return renderReports();
      case "notifications": return renderNotifications();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Navigation Header - Like Admin Portal */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="glass-card mx-4 mt-4 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display font-bold text-lg gradient-text">Field Senses</h1>
                <p className="text-xs text-muted-foreground">Sales Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {sidebarMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`nav-link flex items-center gap-2 ${
                      isActive ? "active" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden 2xl:inline text-xs">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 bg-background/50 border-border/50 focus:bg-background transition-all"
                />
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="rounded-xl hover:bg-primary/10"
              >
                {isDark ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-primary/10"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-xs">
                    {notifications.length}
                  </Badge>
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl z-50">
                    <div className="p-3 border-b border-border">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-muted border-b border-border last:border-0">
                          <p className="text-sm">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden rounded-xl hover:bg-primary/10"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="xl:hidden glass-card mx-4 mt-2 p-4"
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {sidebarMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium text-center leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function SalesPortal() {
  return (
    <MasterDataProvider>
      <SalesPortalContent />
    </MasterDataProvider>
  );
}
