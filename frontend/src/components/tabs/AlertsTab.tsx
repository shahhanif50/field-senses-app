import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Clock, RefreshCw, Shield, Zap, MapPin, Package,
  Bell, Filter, XCircle, ChevronRight, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMasterData } from "@/contexts/MasterDataContext";

const API = "";

interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
  resolved: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  high: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: <XCircle className="w-4 h-4 text-red-500" />,
  },
  medium: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  },
  low: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: <Info className="w-4 h-4 text-blue-500" />,
  },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  low_achievement: <Zap className="w-4 h-4" />,
  inactive_gps: <MapPin className="w-4 h-4" />,
  pending_approval: <Clock className="w-4 h-4" />,
  compliance: <Shield className="w-4 h-4" />,
  license_expiry: <Shield className="w-4 h-4" />,
  stock_low: <Package className="w-4 h-4" />,
  tracking_update: <Bell className="w-4 h-4" />,
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AlertsTab() {
  const { roles, rolePermissions } = useMasterData();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [showResolved, setShowResolved] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/ops/alerts/`)
      .then(r => r.json())
      .then(data => {
        setAlerts(Array.isArray(data) ? data.sort((a: Alert, b: Alert) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await fetch(`${API}/api/ops/alerts/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    } catch {
      // silently fail
    } finally {
      setResolving(null);
    }
  };

  const filtered = alerts.filter(a => {
    if (!showResolved && a.resolved) return false;
    if (filter !== "all" && a.severity !== filter) return false;
    return true;
  });

  const unresolvedCount = alerts.filter(a => !a.resolved).length;
  const highCount = alerts.filter(a => !a.resolved && a.severity === "high").length;
  const mediumCount = alerts.filter(a => !a.resolved && a.severity === "medium").length;

  // --- PERMISSION CHECKS ---
  const rawRole = sessionStorage.getItem("userRole") || "employee";
  const currentRole = roles?.find(r => r.roleCode?.toLowerCase() === rawRole.toLowerCase());
  const alertsPerm = rolePermissions?.find(p => p.roleId === currentRole?.id && p.module === "Alerts");
  const isGlobalAdmin = sessionStorage.getItem("isGlobalAdmin") === "true";
  const isAdmin = rawRole.toLowerCase() === "admin" || isGlobalAdmin;

  const isRegionalManager = rawRole?.toLowerCase() === "regional_manager" || rawRole?.toLowerCase() === "regional manager";
  const canEdit = !isRegionalManager && (isAdmin || alertsPerm?.edit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Alerts & Escalation
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {unresolvedCount} unresolved alert{unresolvedCount !== 1 ? "s" : ""} · Auto-refreshes every 30s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{highCount}</p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{mediumCount}</p>
              <p className="text-sm text-muted-foreground">Medium Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {alerts.filter(a => a.resolved).length}
              </p>
              <p className="text-sm text-muted-foreground">Resolved Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="low">🔵 Low</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showResolved ? "default" : "outline"}
          size="sm"
          onClick={() => setShowResolved(!showResolved)}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {showResolved ? "Hide Resolved" : "Show Resolved"}
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p>Loading alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p className="text-lg font-semibold text-foreground">All Clear!</p>
            <p className="text-sm mt-1">No alerts match the current filters.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((alert, i) => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
              const typeIcon = TYPE_ICONS[alert.type] || <Bell className="w-4 h-4" />;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-xl border p-4 flex items-start gap-4 transition-all ${
                    alert.resolved
                      ? "opacity-50 bg-muted/30 border-border"
                      : `${cfg.bg} ${cfg.border}`
                  }`}
                >
                  {/* Severity Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.resolved ? "bg-muted" : "bg-white/70 dark:bg-black/20"
                  }`}>
                    {alert.resolved ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                        {typeIcon}
                        {alert.type.replace(/_/g, " ")}
                      </span>
                      <Badge variant={alert.resolved ? "secondary" : "outline"} className="text-xs">
                        {alert.resolved ? "Resolved" : alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(alert.timestamp)}
                      {alert.relatedEntityType && (
                        <><ChevronRight className="w-3 h-3" />{alert.relatedEntityType}: {alert.relatedEntityId}</>
                      )}
                    </p>
                  </div>

                  {/* Action */}
                  {!alert.resolved && canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 bg-white dark:bg-black/20 text-xs"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolving === alert.id}
                    >
                      {resolving === alert.id ? (
                        <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
