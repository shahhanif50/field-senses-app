import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  User,
  Clock,
  MapPin,
  Navigation,
  Activity,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Briefcase,
  Building2,
  Target,
  Search,
  Filter,
  ImageIcon, // Changed from Image to ImageIcon
  Paperclip,
  Fuel,
  IndianRupee,
  Utensils,
  Wallet,
  Receipt,
  ZoomIn,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

interface VendorContact {
  name: string;
  phone: string;
  isVerified: boolean;
}

interface TaskEntry {
  id: string;
  taskName: string;
  taskType: "Call" | "Visit" | "Follow-up" | "Issue" | "Other";
  startTime: string;
  endTime: string | null;
  status: "Pending" | "Completed" | "In Progress" | "Escalated";
  proofSubmitted: boolean;
  proofUrl?: string;
  notes: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  distance?: number;
  fuelExpense?: number;
  foodExpense?: number;
  vendorContact?: VendorContact;
}

interface DailyExpenses {
  foodAllowance: number;
  totalFuelExpense: number;
  totalFoodExpense: number;
  miscExpense: number;
  totalExpense: number;
}

interface EmployeeDetails {
  id: string;
  name: string;
  role: string;
  department: string;
  checkInTime: string;
  checkOutTime: string | null;
  workMode: "Field" | "Office" | "Hybrid";
  currentStatus: "Active" | "Idle" | "Offline";
  avatar?: string;
  currentLocation?: { lat: number; lng: number; address: string };
}

interface PerformanceMetrics {
  totalDistance: number;
  idleTime: number;
  planVsActual: number;
  tasksCompleted: number;
  totalTasks: number;
  avgTaskDuration: number;
  punctualityScore: number;
}

interface DailyTrackingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  date: string;
}

// Mock data for demonstration - Agriculture Sales
const mockEmployee: EmployeeDetails = {
  id: "1",
  name: "Ramesh Yadav",
  role: "Field Sales Executive",
  department: "Agri Sales",
  checkInTime: "07:30 AM",
  checkOutTime: "06:45 PM",
  workMode: "Field",
  currentStatus: "Active",
  currentLocation: { lat: 22.7196, lng: 75.8577, address: "Krishi Mandi, Indore" },
};

const mockTasks: TaskEntry[] = [
  {
    id: "t1",
    taskName: "Dealer Visit - Krishi Seva Kendra",
    taskType: "Visit",
    startTime: "08:00 AM",
    endTime: "09:30 AM",
    status: "Completed",
    proofSubmitted: true,
    proofUrl: "/proof-1.jpg",
    notes: "Delivered 50 bags DAP fertilizer. Collected payment of ₹74,500.",
    location: "Krishi Seva Kendra, Indore",
    coordinates: { lat: 22.7196, lng: 75.8577 },
    distance: 12.5,
    fuelExpense: 125,
    foodExpense: 80,
    vendorContact: {
      name: "Rajesh Sharma",
      phone: "+91 98765 43210",
      isVerified: true,
    },
  },
  {
    id: "t2",
    taskName: "Farmer Demo - Hybrid Seeds",
    taskType: "Visit",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    status: "Completed",
    proofSubmitted: true,
    proofUrl: "/proof-2.jpg",
    notes: "Conducted demo for Namdhari 585 tomato seeds. 12 farmers attended.",
    location: "Village Rajpur, Dewas",
    coordinates: { lat: 22.9676, lng: 76.0534 },
    distance: 18.3,
    fuelExpense: 183,
    foodExpense: 120,
    vendorContact: {
      name: "Mohan Patidar",
      phone: "+91 87654 32109",
      isVerified: true,
    },
  },
  {
    id: "t3",
    taskName: "Follow-up Call - Pending Order",
    taskType: "Call",
    startTime: "12:00 PM",
    endTime: "12:20 PM",
    status: "Completed",
    proofSubmitted: true,
    notes: "Confirmed order of 100L Chlorpyrifos for next week delivery.",
    distance: 0,
    fuelExpense: 0,
    foodExpense: 0,
    vendorContact: {
      name: "Pradeep Gupta",
      phone: "+91 76543 21098",
      isVerified: false,
    },
  },
  {
    id: "t4",
    taskName: "Distributor Visit - Agri Mart Distribution",
    taskType: "Visit",
    startTime: "01:00 PM",
    endTime: "02:30 PM",
    status: "Completed",
    proofSubmitted: true,
    proofUrl: "/proof-3.jpg",
    notes: "Met with distributor Mr. Suresh Agarwal. Discussed bulk order of 200 bags Urea, 100 bags MOP. Negotiated 5% volume discount. Confirmed credit terms of 30 days.",
    location: "Agri Mart Distribution Hub, Rau, Indore",
    coordinates: { lat: 22.6574, lng: 75.7926 },
    distance: 15.8,
    fuelExpense: 158,
    foodExpense: 100,
    vendorContact: {
      name: "Suresh Agarwal",
      phone: "+91 99887 76655",
      isVerified: true,
    },
  },
  {
    id: "t5",
    taskName: "Crop Issue - Pest Infestation",
    taskType: "Issue",
    startTime: "03:00 PM",
    endTime: "04:00 PM",
    status: "Escalated",
    proofSubmitted: false,
    notes: "Severe whitefly attack on cotton crop. Recommended Imidacloprid spray. Needs agronomist visit.",
    location: "Farm - Mohan Patel, Ujjain",
    coordinates: { lat: 23.1793, lng: 75.7849 },
    distance: 22.4,
    fuelExpense: 224,
    foodExpense: 50,
    vendorContact: {
      name: "Mohan Patel",
      phone: "+91 88776 65544",
      isVerified: true,
    },
  },
  {
    id: "t6",
    taskName: "New Dealer Onboarding",
    taskType: "Follow-up",
    startTime: "04:30 PM",
    endTime: null,
    status: "In Progress",
    proofSubmitted: false,
    notes: "Collecting documents for new dealer registration - Agri Inputs Store.",
    distance: 0,
    fuelExpense: 0,
    foodExpense: 0,
    vendorContact: {
      name: "Vikram Singh",
      phone: "+91 77665 54433",
      isVerified: false,
    },
  },
  {
    id: "t7",
    taskName: "Fertilizer Stock Check - Mandi",
    taskType: "Visit",
    startTime: "05:30 PM",
    endTime: null,
    status: "Pending",
    proofSubmitted: false,
    notes: "Scheduled stock audit at Krishi Mandi warehouse.",
    location: "Krishi Mandi, Indore",
    coordinates: { lat: 22.7196, lng: 75.8577 },
    distance: 0,
    fuelExpense: 0,
    foodExpense: 0,
    vendorContact: {
      name: "Anil Verma",
      phone: "+91 66554 43322",
      isVerified: true,
    },
  },
];

const mockDailyExpenses: DailyExpenses = {
  foodAllowance: 350,
  totalFuelExpense: 690,
  totalFoodExpense: 350,
  miscExpense: 50,
  totalExpense: 1440,
};

interface MockReceipt {
  id: string;
  preview: string;
  amount: number;
  vendor: string;
  time: string;
}

const mockFuelReceipts: MockReceipt[] = [
  {
    id: "fuel-1",
    preview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect fill='%23fff' width='200' height='280'/%3E%3Crect fill='%23f59e0b' x='10' y='10' width='180' height='40' rx='4'/%3E%3Ctext x='100' y='38' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold' font-size='16'%3EINDIAN OIL%3C/text%3E%3Ctext x='100' y='80' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='12'%3EFuel Receipt%3C/text%3E%3Cline x1='20' y1='95' x2='180' y2='95' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='120' fill='%23374151' font-family='Arial' font-size='11'%3EDate: 18-Jan-2026%3C/text%3E%3Ctext x='30' y='140' fill='%23374151' font-family='Arial' font-size='11'%3ETime: 08:15 AM%3C/text%3E%3Ctext x='30' y='160' fill='%23374151' font-family='Arial' font-size='11'%3EVehicle: MP-09-XY-1234%3C/text%3E%3Cline x1='20' y1='175' x2='180' y2='175' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='200' fill='%23374151' font-family='Arial' font-size='11'%3EPetrol (5.2L)%3C/text%3E%3Ctext x='170' y='200' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹520.00%3C/text%3E%3Cline x1='20' y1='215' x2='180' y2='215' stroke='%23374151' stroke-width='2'/%3E%3Ctext x='30' y='240' fill='%23374151' font-family='Arial' font-weight='bold' font-size='14'%3ETOTAL%3C/text%3E%3Ctext x='170' y='240' text-anchor='end' fill='%23f59e0b' font-family='Arial' font-weight='bold' font-size='14'%3E₹520.00%3C/text%3E%3Ctext x='100' y='270' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='9'%3EThank You! Visit Again%3C/text%3E%3C/svg%3E",
    amount: 520,
    vendor: "Indian Oil - Indore",
    time: "08:15 AM"
  },
  {
    id: "fuel-2",
    preview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect fill='%23fff' width='200' height='280'/%3E%3Crect fill='%2322c55e' x='10' y='10' width='180' height='40' rx='4'/%3E%3Ctext x='100' y='38' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold' font-size='14'%3EHP PETROLEUM%3C/text%3E%3Ctext x='100' y='80' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='12'%3EFuel Receipt%3C/text%3E%3Cline x1='20' y1='95' x2='180' y2='95' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='120' fill='%23374151' font-family='Arial' font-size='11'%3EDate: 18-Jan-2026%3C/text%3E%3Ctext x='30' y='140' fill='%23374151' font-family='Arial' font-size='11'%3ETime: 02:45 PM%3C/text%3E%3Ctext x='30' y='160' fill='%23374151' font-family='Arial' font-size='11'%3EVehicle: MP-09-XY-1234%3C/text%3E%3Cline x1='20' y1='175' x2='180' y2='175' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='200' fill='%23374151' font-family='Arial' font-size='11'%3EPetrol (1.7L)%3C/text%3E%3Ctext x='170' y='200' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹170.00%3C/text%3E%3Cline x1='20' y1='215' x2='180' y2='215' stroke='%23374151' stroke-width='2'/%3E%3Ctext x='30' y='240' fill='%23374151' font-family='Arial' font-weight='bold' font-size='14'%3ETOTAL%3C/text%3E%3Ctext x='170' y='240' text-anchor='end' fill='%2322c55e' font-family='Arial' font-weight='bold' font-size='14'%3E₹170.00%3C/text%3E%3Ctext x='100' y='270' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='9'%3EThank You! Visit Again%3C/text%3E%3C/svg%3E",
    amount: 170,
    vendor: "HP Petroleum - Dewas",
    time: "02:45 PM"
  }
];

const mockFoodReceipts: MockReceipt[] = [
  {
    id: "food-1",
    preview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect fill='%23fff' width='200' height='300'/%3E%3Crect fill='%238b5cf6' x='10' y='10' width='180' height='45' rx='4'/%3E%3Ctext x='100' y='28' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold' font-size='14'%3EKRISHI DHABA%3C/text%3E%3Ctext x='100' y='45' text-anchor='middle' fill='%23e9d5ff' font-family='Arial' font-size='10'%3EPure Veg Restaurant%3C/text%3E%3Ctext x='100' y='85' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='12'%3EBill No: KD-2856%3C/text%3E%3Cline x1='20' y1='100' x2='180' y2='100' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='125' fill='%23374151' font-family='Arial' font-size='11'%3EDate: 18-Jan-2026%3C/text%3E%3Ctext x='30' y='145' fill='%23374151' font-family='Arial' font-size='11'%3ETime: 01:30 PM%3C/text%3E%3Cline x1='20' y1='160' x2='180' y2='160' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='185' fill='%23374151' font-family='Arial' font-size='11'%3EThali (Full)%3C/text%3E%3Ctext x='170' y='185' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹80.00%3C/text%3E%3Ctext x='30' y='205' fill='%23374151' font-family='Arial' font-size='11'%3EChaas%3C/text%3E%3Ctext x='170' y='205' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹20.00%3C/text%3E%3Cline x1='20' y1='220' x2='180' y2='220' stroke='%23374151' stroke-width='2'/%3E%3Ctext x='30' y='245' fill='%23374151' font-family='Arial' font-weight='bold' font-size='14'%3ETOTAL%3C/text%3E%3Ctext x='170' y='245' text-anchor='end' fill='%238b5cf6' font-family='Arial' font-weight='bold' font-size='14'%3E₹100.00%3C/text%3E%3Ctext x='100' y='275' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='9'%3EThank You! Jai Kisaan%3C/text%3E%3C/svg%3E",
    amount: 100,
    vendor: "Krishi Dhaba - Rau",
    time: "01:30 PM"
  },
  {
    id: "food-2",
    preview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect fill='%23fff' width='200' height='300'/%3E%3Crect fill='%23ef4444' x='10' y='10' width='180' height='45' rx='4'/%3E%3Ctext x='100' y='28' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold' font-size='14'%3EMANDI CANTEEN%3C/text%3E%3Ctext x='100' y='45' text-anchor='middle' fill='%23fecaca' font-family='Arial' font-size='10'%3EKrishi Mandi, Indore%3C/text%3E%3Ctext x='100' y='85' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='12'%3EBill No: MC-1124%3C/text%3E%3Cline x1='20' y1='100' x2='180' y2='100' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='125' fill='%23374151' font-family='Arial' font-size='11'%3EDate: 18-Jan-2026%3C/text%3E%3Ctext x='30' y='145' fill='%23374151' font-family='Arial' font-size='11'%3ETime: 10:00 AM%3C/text%3E%3Cline x1='20' y1='160' x2='180' y2='160' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='185' fill='%23374151' font-family='Arial' font-size='11'%3ETea x2%3C/text%3E%3Ctext x='170' y='185' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹30.00%3C/text%3E%3Ctext x='30' y='205' fill='%23374151' font-family='Arial' font-size='11'%3ESamosa x2%3C/text%3E%3Ctext x='170' y='205' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹40.00%3C/text%3E%3Cline x1='20' y1='220' x2='180' y2='220' stroke='%23374151' stroke-width='2'/%3E%3Ctext x='30' y='245' fill='%23374151' font-family='Arial' font-weight='bold' font-size='14'%3ETOTAL%3C/text%3E%3Ctext x='170' y='245' text-anchor='end' fill='%23ef4444' font-family='Arial' font-weight='bold' font-size='14'%3E₹70.00%3C/text%3E%3Ctext x='100' y='275' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='9'%3EThank You!%3C/text%3E%3C/svg%3E",
    amount: 70,
    vendor: "Mandi Canteen - Indore",
    time: "10:00 AM"
  },
  {
    id: "food-3",
    preview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect fill='%23fff' width='200' height='300'/%3E%3Crect fill='%2306b6d4' x='10' y='10' width='180' height='45' rx='4'/%3E%3Ctext x='100' y='28' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold' font-size='14'%3EUJJAIN BHOJNALAYA%3C/text%3E%3Ctext x='100' y='45' text-anchor='middle' fill='%23cffafe' font-family='Arial' font-size='10'%3ESatvik Food%3C/text%3E%3Ctext x='100' y='85' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='12'%3EBill No: UB-4521%3C/text%3E%3Cline x1='20' y1='100' x2='180' y2='100' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='125' fill='%23374151' font-family='Arial' font-size='11'%3EDate: 18-Jan-2026%3C/text%3E%3Ctext x='30' y='145' fill='%23374151' font-family='Arial' font-size='11'%3ETime: 04:15 PM%3C/text%3E%3Cline x1='20' y1='160' x2='180' y2='160' stroke='%23e5e7eb' stroke-width='1'/%3E%3Ctext x='30' y='185' fill='%23374151' font-family='Arial' font-size='11'%3EPoha%3C/text%3E%3Ctext x='170' y='185' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹35.00%3C/text%3E%3Ctext x='30' y='205' fill='%23374151' font-family='Arial' font-size='11'%3EJalebi (250g)%3C/text%3E%3Ctext x='170' y='205' text-anchor='end' fill='%23374151' font-family='Arial' font-size='11'%3E₹45.00%3C/text%3E%3Cline x1='20' y1='220' x2='180' y2='220' stroke='%23374151' stroke-width='2'/%3E%3Ctext x='30' y='245' fill='%23374151' font-family='Arial' font-weight='bold' font-size='14'%3ETOTAL%3C/text%3E%3Ctext x='170' y='245' text-anchor='end' fill='%2306b6d4' font-family='Arial' font-weight='bold' font-size='14'%3E₹80.00%3C/text%3E%3Ctext x='100' y='275' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='9'%3EShubh Yatra!%3C/text%3E%3C/svg%3E",
    amount: 80,
    vendor: "Ujjain Bhojnalaya",
    time: "04:15 PM"
  }
];

const mockMetrics: PerformanceMetrics = {
  totalDistance: 69.0,
  idleTime: 18,
  planVsActual: 105,
  tasksCompleted: 5,
  totalTasks: 7,
  avgTaskDuration: 72,
  punctualityScore: 98,
};

const getStatusColor = (status: TaskEntry["status"]) => {
  switch (status) {
    case "Completed":
      return "bg-success/10 text-success border-success/20";
    case "Pending":
      return "bg-warning/10 text-warning border-warning/20";
    case "In Progress":
      return "bg-primary/10 text-primary border-primary/20";
    case "Escalated":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getTaskTypeIcon = (type: TaskEntry["taskType"]) => {
  switch (type) {
    case "Call":
      return Phone;
    case "Visit":
      return MapPin;
    case "Follow-up":
      return Activity;
    case "Issue":
      return AlertTriangle;
    default:
      return FileText;
  }
};

const getStatusIcon = (status: EmployeeDetails["currentStatus"]) => {
  switch (status) {
    case "Active":
      return "bg-success";
    case "Idle":
      return "bg-warning";
    case "Offline":
      return "bg-muted-foreground";
  }
};

export function DailyTrackingDetailModal({
  isOpen,
  onClose,
  employeeId,
  date,
}: DailyTrackingDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<TaskEntry | null>(null);
  
  // Receipt preview state (admin view-only mode)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Route replay state
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const replayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- NEW DJANGO DATA FETCHING ---
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["dailyTracking", employeeId, date],
    queryFn: async () => {
      // Make sure this matches your actual endpoint
      const response = await api.get(`/api/v1/ops/daily-tracking/${employeeId}/?date=${date}`);
      return response.data;
    },
    enabled: isOpen && !!employeeId && !!date, 
  });

  // Fallback to mock data if backend isn't ready
  const employee = trackingData?.employee || mockEmployee;
  const tasks = trackingData?.tasks || mockTasks;
  const metrics = trackingData?.metrics || mockMetrics;
  const dailyExpenses = trackingData?.dailyExpenses || mockDailyExpenses;

  // Route stops for replay animation
  const routeStops = tasks.filter((t: TaskEntry) => t.coordinates).map((task: TaskEntry, index: number) => ({
    id: task.id,
    name: task.taskName,
    location: task.location || 'Unknown',
    time: task.startTime,
    endTime: task.endTime,
    status: task.status,
    position: [
      { left: 10, top: 75 },
      { left: 30, top: 45 },
      { left: 50, top: 35 },
      { left: 70, top: 28 },
      { left: 85, top: 22 },
    ][index % 5] || { left: 50, top: 50 }, // Fallback for extra points
    distance: task.distance || 0,
  }));

  // Calculate current position based on replay progress
  const getCurrentReplayPosition = () => {
    if (routeStops.length === 0) return { left: 10, top: 75 };
    
    const totalStops = routeStops.length;
    const progressPerStop = 100 / totalStops;
    const currentIndex = Math.min(Math.floor(replayProgress / progressPerStop), totalStops - 1);
    const nextIndex = Math.min(currentIndex + 1, totalStops - 1);
    
    const stopProgress = (replayProgress % progressPerStop) / progressPerStop;
    
    const currentPos = routeStops[currentIndex].position;
    const nextPos = routeStops[nextIndex].position;
    
    return {
      left: currentPos.left + (nextPos.left - currentPos.left) * stopProgress,
      top: currentPos.top + (nextPos.top - currentPos.top) * stopProgress,
    };
  };

  // Replay controls
  const startReplay = () => {
    setIsPlaying(true);
  };

  const pauseReplay = () => {
    setIsPlaying(false);
  };

  const resetReplay = () => {
    setIsPlaying(false);
    setReplayProgress(0);
    setCurrentStopIndex(-1);
  };

  const skipToStop = (index: number) => {
    const progressPerStop = 100 / routeStops.length;
    setReplayProgress(index * progressPerStop);
    setCurrentStopIndex(index);
  };

  // Replay animation effect
  useEffect(() => {
    if (isPlaying) {
      replayIntervalRef.current = setInterval(() => {
        setReplayProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + (0.5 * replaySpeed);
        });
      }, 50);
    } else {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
      }
    }

    return () => {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
      }
    };
  }, [isPlaying, replaySpeed]);

  // Update current stop index based on progress
  useEffect(() => {
    if (routeStops.length === 0) return;
    const progressPerStop = 100 / routeStops.length;
    const newIndex = Math.min(Math.floor(replayProgress / progressPerStop), routeStops.length - 1);
    if (newIndex !== currentStopIndex) {
      setCurrentStopIndex(newIndex);
    }
  }, [replayProgress, routeStops.length, currentStopIndex]);

  const replayPosition = getCurrentReplayPosition();

  const filteredTasks = tasks.filter((task: TaskEntry) => {
    const matchesSearch =
      task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = (format: "csv" | "pdf" | "excel") => {
    console.log(`Exporting as ${format}...`);
  };

  const handleApproveProof = (taskId: string) => {
    console.log(`Approving proof for task ${taskId}`);
  };

  const handleRejectProof = (taskId: string) => {
    console.log(`Rejecting proof for task ${taskId}`);
  };

  // --- LOADING SCREEN ---
  if (isLoading && isOpen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card p-8 text-center rounded-lg shadow-xl border border-border">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading Tracking Data...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border shadow-2xl overflow-hidden w-full max-w-6xl max-h-[90vh] flex flex-col rounded-xl">
              {/* Header */}
              <div className="relative px-6 py-4 border-b border-border/50 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-50" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-lg font-bold">
                        {employee.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${getStatusIcon(
                          employee.currentStatus
                        )} ${employee.currentStatus === "Active" ? "animate-pulse" : ""}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold">
                        {employee.name}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{employee.role}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Employee Info Cards */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="bg-card/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Role</p>
                          <p className="text-sm font-medium">{employee.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Department
                          </p>
                          <p className="text-sm font-medium">
                            {employee.department}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Check-in
                          </p>
                          <p className="text-sm font-medium">
                            {employee.checkInTime}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Check-out
                          </p>
                          <p className="text-sm font-medium">
                            {employee.checkOutTime || "Active"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Work Mode
                          </p>
                          <p className="text-sm font-medium">
                            {employee.workMode}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            employee.currentStatus === "Active"
                              ? "bg-success/10"
                              : employee.currentStatus === "Idle"
                              ? "bg-warning/10"
                              : "bg-muted"
                          }`}
                        >
                          <Activity
                            className={`w-4 h-4 ${
                              employee.currentStatus === "Active"
                                ? "text-success"
                                : employee.currentStatus === "Idle"
                                ? "text-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Status
                          </p>
                          <p className="text-sm font-medium">
                            {employee.currentStatus}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Live Location Map with Route Replay */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Route Replay & Live Tracking
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${isPlaying ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted'}`}>
                        {isPlaying ? 'Playing' : replayProgress > 0 ? 'Paused' : 'Ready'}
                      </Badge>
                    </div>
                  </div>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative">
                        {/* Map Container */}
                        <div className="h-72 bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 relative overflow-hidden">
                          {/* Map Grid Background */}
                          <div className="absolute inset-0" style={{
                            backgroundImage: `
                              linear-gradient(to right, hsl(var(--border)/0.3) 1px, transparent 1px),
                              linear-gradient(to bottom, hsl(var(--border)/0.3) 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                          }} />
                          
                          {/* Route Path - Full */}
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
                              </linearGradient>
                              <linearGradient id="routeActiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="1" />
                              </linearGradient>
                            </defs>
                            {/* Background route */}
                            <path
                              d="M 10,75 Q 20,60 30,45 T 50,35 T 70,28 T 85,22"
                              fill="none"
                              stroke="url(#routeGradient)"
                              strokeWidth="0.8"
                              strokeDasharray="2,2"
                            />
                            {/* Active route (progress-based) */}
                            <path
                              d="M 10,75 Q 20,60 30,45 T 50,35 T 70,28 T 85,22"
                              fill="none"
                              stroke="url(#routeActiveGradient)"
                              strokeWidth="0.8"
                              strokeLinecap="round"
                              style={{
                                strokeDasharray: '100',
                                strokeDashoffset: `${100 - replayProgress}`,
                              }}
                            />
                          </svg>

                          {/* Location Markers for Stops */}
                          {routeStops.map((stop, index) => {
                            const isVisited = index <= currentStopIndex;
                            const isCurrent = index === currentStopIndex;
                            return (
                              <motion.div
                                key={stop.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ 
                                  scale: isCurrent ? 1.2 : 1, 
                                  opacity: 1,
                                }}
                                transition={{ delay: index * 0.05 }}
                                className="absolute group cursor-pointer"
                                style={{ left: `${stop.position.left}%`, top: `${stop.position.top}%` }}
                                onClick={() => skipToStop(index)}
                              >
                                <div className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  isVisited 
                                    ? isCurrent 
                                      ? 'bg-primary ring-4 ring-primary/30' 
                                      : 'bg-success' 
                                    : 'bg-muted-foreground/30'
                                }`}>
                                  <span className="text-[10px] font-bold text-white">{index + 1}</span>
                                  {isCurrent && isPlaying && (
                                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
                                  )}
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border min-w-[140px]">
                                  <p className="font-semibold text-xs">{stop.name.slice(0, 25)}...</p>
                                  <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {stop.time} {stop.endTime ? `- ${stop.endTime}` : ''}
                                  </p>
                                  {stop.distance > 0 && (
                                    <p className="text-muted-foreground flex items-center gap-1">
                                      <Navigation className="w-3 h-3" />
                                      {stop.distance} km
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}

                          {/* Animated Employee Marker (during replay) */}
                          {replayProgress > 0 && (
                            <motion.div
                              className="absolute z-20"
                              animate={{
                                left: `${replayPosition.left}%`,
                                top: `${replayPosition.top}%`,
                              }}
                              transition={{ duration: 0.1, ease: "linear" }}
                            >
                              <div className="relative -translate-x-1/2 -translate-y-1/2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-white">
                                  <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                                {isPlaying && (
                                  <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
                                )}
                                {/* Direction indicator */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
                              </div>
                            </motion.div>
                          )}

                          {/* Current Stop Info Overlay */}
                          {currentStopIndex >= 0 && routeStops[currentStopIndex] && (
                            <motion.div
                              key={currentStopIndex}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-3 left-3 right-16 bg-card/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  routeStops[currentStopIndex].status === 'Completed' ? 'bg-success' : 'bg-warning'
                                }`}>
                                  <span className="text-sm font-bold text-white">{currentStopIndex + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{routeStops[currentStopIndex].name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {routeStops[currentStopIndex].location}
                                    </span>
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {routeStops[currentStopIndex].time}
                                    </span>
                                    {routeStops[currentStopIndex].distance > 0 && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        {routeStops[currentStopIndex].distance} km
                                      </span>
                                    )}
                                    <Badge variant="outline" className={`text-[10px] h-5 ${
                                      routeStops[currentStopIndex].status === 'Completed' 
                                        ? 'bg-success/10 text-success border-success/20' 
                                        : 'bg-warning/10 text-warning border-warning/20'
                                    }`}>
                                      {routeStops[currentStopIndex].status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Legend */}
                          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg p-2 border shadow-sm">
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-success" />
                                <span className="text-muted-foreground">Visited</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                                <span className="text-muted-foreground">Pending</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/30" />
                                <span className="text-muted-foreground">Current</span>
                              </div>
                            </div>
                          </div>

                          {/* Zoom Controls */}
                          <div className="absolute top-3 right-3 flex flex-col gap-1">
                            <Button variant="secondary" size="icon" className="h-7 w-7 bg-card/90 backdrop-blur-sm">
                              <span className="text-lg font-bold">+</span>
                            </Button>
                            <Button variant="secondary" size="icon" className="h-7 w-7 bg-card/90 backdrop-blur-sm">
                              <span className="text-lg font-bold">−</span>
                            </Button>
                          </div>
                        </div>

                        {/* Route Replay Controls */}
                        <div className="p-4 bg-muted/30 border-t">
                          {/* Timeline */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <span>{routeStops[0]?.time || '07:30 AM'}</span>
                              <span className="font-medium text-foreground">
                                {currentStopIndex >= 0 ? routeStops[currentStopIndex]?.time : 'Start'}
                              </span>
                              <span>{routeStops[routeStops.length - 1]?.time || '06:45 PM'}</span>
                            </div>
                            {/* Progress Bar with Stop Markers */}
                            <div className="relative">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-primary via-accent to-success rounded-full"
                                  style={{ width: `${replayProgress}%` }}
                                  transition={{ duration: 0.1 }}
                                />
                              </div>
                              {/* Stop markers on timeline */}
                              <div className="absolute inset-0 flex items-center">
                                {routeStops.map((stop, index) => {
                                  const position = ((index + 1) / routeStops.length) * 100;
                                  const isVisited = replayProgress >= position - (100 / routeStops.length);
                                  return (
                                    <div
                                      key={stop.id}
                                      className={`absolute w-3 h-3 rounded-full border-2 border-card cursor-pointer transition-all hover:scale-125 ${
                                        isVisited ? 'bg-success' : 'bg-muted-foreground/50'
                                      }`}
                                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                                      onClick={() => skipToStop(index)}
                                      title={stop.name}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Control Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={resetReplay}
                                title="Reset"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => skipToStop(Math.max(0, currentStopIndex - 1))}
                                disabled={currentStopIndex <= 0}
                                title="Previous Stop"
                              >
                                <SkipBack className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-11 w-11 rounded-full"
                                onClick={isPlaying ? pauseReplay : startReplay}
                              >
                                {isPlaying ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => skipToStop(Math.min(routeStops.length - 1, currentStopIndex + 1))}
                                disabled={currentStopIndex >= routeStops.length - 1}
                                title="Next Stop"
                              >
                                <SkipForward className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Speed Controls */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Speed:</span>
                              {[1, 2, 4].map((speed) => (
                                <Button
                                  key={speed}
                                  variant={replaySpeed === speed ? "default" : "outline"}
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setReplaySpeed(speed)}
                                >
                                  {speed}x
                                </Button>
                              ))}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Stops</p>
                                <p className="font-semibold">{Math.max(0, currentStopIndex + 1)}/{routeStops.length}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Distance</p>
                                <p className="font-semibold">
                                  {routeStops.slice(0, currentStopIndex + 1).reduce((sum, s) => sum + s.distance, 0).toFixed(1)} km
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Location Info Bar */}
                        <div className="p-3 bg-muted/50 border-t flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{employee.currentLocation?.address || 'Location unavailable'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Lat: {employee.currentLocation?.lat.toFixed(4)}, Lng: {employee.currentLocation?.lng.toFixed(4)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                              GPS Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Task / Activity Table */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Tasks & Activities
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tasks..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 w-48"
                        />
                      </div>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="h-9 w-36">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Escalated">Escalated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Task</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Time</TableHead>
                            <TableHead className="font-semibold">Distance</TableHead>
                            <TableHead className="font-semibold">Fuel Cost</TableHead>
                            <TableHead className="font-semibold">Food Cost</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Proof</TableHead>
                            <TableHead className="font-semibold">Notes</TableHead>
                            <TableHead className="font-semibold text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTasks.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={10}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No tasks found matching your filters
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredTasks.map((task) => {
                              const TypeIcon = getTaskTypeIcon(task.taskType);
                              return (
                                <TableRow
                                  key={task.id}
                                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                                  onClick={() => setSelectedTask(task)}
                                >
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">
                                        {task.taskName}
                                      </p>
                                      {task.location && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                          <MapPin className="w-3 h-3" />
                                          {task.location}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <TypeIcon className="w-4 h-4 text-primary" />
                                      <span className="text-sm">
                                        {task.taskType}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <p>{task.startTime}</p>
                                      <p className="text-muted-foreground">
                                        {task.endTime || "Ongoing"}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <Navigation className="w-3.5 h-3.5 text-primary" />
                                      <span className="text-sm font-medium">
                                        {task.distance ? `${task.distance} km` : "-"}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <Fuel className="w-3.5 h-3.5 text-warning" />
                                      <span className="text-sm font-medium">
                                        {task.fuelExpense ? `₹${task.fuelExpense}` : "-"}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <Utensils className="w-3.5 h-3.5 text-accent" />
                                      <span className="text-sm font-medium">
                                        {task.foodExpense ? `₹${task.foodExpense}` : "-"}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={getStatusColor(task.status)}
                                    >
                                      {task.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {task.proofSubmitted ? (
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="bg-success/10 text-success border-success/20"
                                        >
                                          <Paperclip className="w-3 h-3 mr-1" />
                                          Yes
                                        </Badge>
                                        {task.proofUrl && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </div>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-muted text-muted-foreground"
                                      >
                                        No
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                                      {task.notes}
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {task.proofSubmitted && (
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-success hover:bg-success/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleApproveProof(task.id);
                                          }}
                                        >
                                          <CheckCircle2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRejectProof(task.id);
                                          }}
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </section>

                {/* Travel & Performance */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Travel & Performance
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Navigation className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold text-primary">
                            {metrics.totalDistance}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Distance (km)
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Clock className="w-5 h-5 text-warning" />
                          <span className="text-2xl font-bold text-warning">
                            {metrics.idleTime}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Idle Time (min)
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`bg-gradient-to-br ${
                        metrics.planVsActual >= 90
                          ? "from-success/5 to-success/10 border-success/20"
                          : metrics.planVsActual >= 70
                          ? "from-warning/5 to-warning/10 border-warning/20"
                          : "from-destructive/5 to-destructive/10 border-destructive/20"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Target
                            className={`w-5 h-5 ${
                              metrics.planVsActual >= 90
                                ? "text-success"
                                : metrics.planVsActual >= 70
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          />
                          <span
                            className={`text-2xl font-bold ${
                              metrics.planVsActual >= 90
                                ? "text-success"
                                : metrics.planVsActual >= 70
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          >
                            {metrics.planVsActual}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Plan vs Actual
                        </p>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              metrics.planVsActual >= 90
                                ? "bg-success"
                                : metrics.planVsActual >= 70
                                ? "bg-warning"
                                : "bg-destructive"
                            }`}
                            style={{
                              width: `${Math.min(metrics.planVsActual, 100)}%`,
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Activity className="w-5 h-5 text-accent" />
                          <span className="text-2xl font-bold text-accent">
                            {metrics.tasksCompleted}/{metrics.totalTasks}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tasks Completed
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <Card className="bg-card/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Avg Task Duration
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.avgTaskDuration} min
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-muted-foreground/30" />
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Punctuality Score
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.punctualityScore}%
                          </p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-muted-foreground/30" />
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Completion Rate
                          </p>
                          <p className="text-lg font-semibold">
                            {Math.round(
                              (metrics.tasksCompleted / metrics.totalTasks) * 100
                            )}
                            %
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-muted-foreground/30" />
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Daily Expenses */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Daily Expenses
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Fuel className="w-5 h-5 text-warning" />
                          <span className="text-2xl font-bold text-warning">
                            ₹{dailyExpenses.totalFuelExpense}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Fuel Expense
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          @ ₹10/km for {metrics.totalDistance} km
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Utensils className="w-5 h-5 text-accent" />
                          <span className="text-2xl font-bold text-accent">
                            ₹{dailyExpenses.totalFoodExpense}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Food Expense
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          From {tasks.filter((t) => t.foodExpense && t.foodExpense > 0).length} tasks
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Utensils className="w-5 h-5 text-success" />
                          <span className="text-2xl font-bold text-success">
                            ₹{dailyExpenses.foodAllowance}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Food Allowance
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Daily field allowance
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-muted/50 to-muted border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <IndianRupee className="w-5 h-5 text-muted-foreground" />
                          <span className="text-2xl font-bold text-foreground">
                            ₹{dailyExpenses.miscExpense}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Misc. Expenses
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Parking, tolls, etc.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Wallet className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold text-primary">
                            ₹{dailyExpenses.totalExpense}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Day Expense
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          All expenses combined
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Expense Receipt View Section - Admin View */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fuel Receipts */}
                    <Card className="border-warning/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-warning" />
                            <h4 className="font-semibold text-sm">Fuel Receipts</h4>
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                              {mockFuelReceipts.length} uploaded
                            </Badge>
                          </div>
                          <span className="text-lg font-bold text-warning">
                            ₹{mockFuelReceipts.reduce((sum, r) => sum + r.amount, 0)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {mockFuelReceipts.map((receipt) => (
                            <div key={receipt.id} className="relative group">
                              <div className="border border-warning/20 rounded-lg overflow-hidden bg-white">
                                <img
                                  src={receipt.preview}
                                  alt="Fuel receipt"
                                  className="w-full h-32 object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20 gap-1"
                                  onClick={() => setSelectedReceipt(receipt.preview)}
                                >
                                  <ZoomIn className="w-4 h-4" />
                                  View
                                </Button>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs font-medium truncate">{receipt.vendor}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{receipt.time}</span>
                                  <span className="font-semibold text-warning">₹{receipt.amount}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Food Receipts */}
                    <Card className="border-accent/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-accent" />
                            <h4 className="font-semibold text-sm">Food Receipts</h4>
                            <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                              {mockFoodReceipts.length} uploaded
                            </Badge>
                          </div>
                          <span className="text-lg font-bold text-accent">
                            ₹{mockFoodReceipts.reduce((sum, r) => sum + r.amount, 0)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {mockFoodReceipts.map((receipt) => (
                            <div key={receipt.id} className="relative group">
                              <div className="border border-accent/20 rounded-lg overflow-hidden bg-white">
                                <img
                                  src={receipt.preview}
                                  alt="Food receipt"
                                  className="w-full h-32 object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20 gap-1"
                                  onClick={() => setSelectedReceipt(receipt.preview)}
                                >
                                  <ZoomIn className="w-4 h-4" />
                                  View
                                </Button>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs font-medium truncate">{receipt.vendor}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{receipt.time}</span>
                                  <span className="font-semibold text-accent">₹{receipt.amount}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Receipt Preview Modal */}
                <AnimatePresence>
                  {selectedReceipt && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
                      onClick={() => setSelectedReceipt(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="relative max-w-3xl max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={selectedReceipt}
                          alt="Receipt preview"
                          className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                          onClick={() => setSelectedReceipt(null)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredTasks.length} tasks displayed • Last updated: Just
                    now
                  </p>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport("csv")}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("pdf")}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("excel")}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export as Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Task Detail Slide-over (when clicking a task row) */}
          <AnimatePresence>
            {selectedTask && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedTask(null)}
                  className="fixed inset-0 bg-background/50 z-[60]"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-[60] overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-display font-bold">
                        Task Details
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTask(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Task Name
                        </p>
                        <p className="font-semibold">{selectedTask.taskName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <Badge variant="secondary">
                            {selectedTask.taskType}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <Badge
                            variant="outline"
                            className={getStatusColor(selectedTask.status)}
                          >
                            {selectedTask.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Start Time
                          </p>
                          <p className="font-medium">{selectedTask.startTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            End Time
                          </p>
                          <p className="font-medium">
                            {selectedTask.endTime || "Ongoing"}
                          </p>
                        </div>
                      </div>

                      {selectedTask.location && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Location
                          </p>
                          <p className="font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {selectedTask.location}
                          </p>
                        </div>
                      )}

                      {selectedTask.vendorContact && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vendor Contact
                          </p>
                          <div className="bg-muted/50 p-3 rounded-lg mt-1 space-y-2">
                            <p className="font-medium">{selectedTask.vendorContact.name}</p>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-primary" />
                              <span className="text-sm">{selectedTask.vendorContact.phone}</span>
                              {selectedTask.vendorContact.isVerified ? (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  Unverified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">
                          {selectedTask.notes || "No notes provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Proof Submitted
                        </p>
                        {selectedTask.proofSubmitted ? (
                          <div className="space-y-2">
                            {selectedTask.proofUrl && (
                              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                className="flex-1 bg-success hover:bg-success/90"
                                onClick={() =>
                                  handleApproveProof(selectedTask.id)
                                }
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() =>
                                  handleRejectProof(selectedTask.id)
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No proof submitted for this task
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}