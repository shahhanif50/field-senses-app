import { motion } from "framer-motion";
import { Users, FolderKanban, MapPin, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}

function KPICard({ title, value, subtitle, icon, trend, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export function KPICards() {
  const kpis = [
    {
      title: "Sales Executives Online",
      value: "0/0",
      subtitle: "Active now",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Active Projects",
      value: 0,
      subtitle: "0 pending approval",
      icon: <FolderKanban className="w-6 h-6" />,
    },
    {
      title: "Today's Site Visits",
      value: 0,
      subtitle: "0 in progress",
      icon: <MapPin className="w-6 h-6" />,
    },
    {
      title: "Pending Alerts",
      value: 0,
      subtitle: "0 high priority",
      icon: <AlertTriangle className="w-6 h-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.title} {...kpi} delay={index * 0.1} />
      ))}
    </div>
  );
}
