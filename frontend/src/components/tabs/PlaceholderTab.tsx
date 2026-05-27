import { motion } from "framer-motion";
import { Plus, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceholderTabProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderTab({ title, description, icon: Icon }: PlaceholderTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-12 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-6 flex items-center justify-center">
        <Icon className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-3xl font-display font-bold mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-lg mx-auto mb-8">{description}</p>
      <div className="flex items-center justify-center gap-4">
        <Button className="gradient-btn gap-2">
          <Plus className="w-4 h-4" />
          Add New
        </Button>
        <Button variant="outline">View Documentation</Button>
      </div>
    </motion.div>
  );
}
