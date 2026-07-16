import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "online" | "offline" | "pending" | "delayed" | "completed" | "idle" | "success" | "warning" | "error" | "info" | "scheduled" | "cancelled" | "rescheduled" | "approved" | "denied";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  inactive: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  online: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  offline: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  pending: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  delayed: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  completed: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  idle: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  success: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  warning: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  error: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  info: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  scheduled: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  cancelled: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  rescheduled: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  approved: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  denied: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
};

export function StatusBadge({ status, label, pulse = false, className }: StatusBadgeProps) {
  const normalizedStatus = (status || "").toLowerCase() as StatusType;
  const config = statusConfig[normalizedStatus] || statusConfig.inactive;
  const displayLabel = label || String(status).charAt(0).toUpperCase() + String(status).slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", config.dot, pulse && "animate-pulse")} />
      {displayLabel}
    </span>
  );
}
