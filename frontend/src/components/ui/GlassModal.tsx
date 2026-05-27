import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showFooter?: boolean;
  footerContent?: ReactNode;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[95vw]",
};

export function GlassModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
  showFooter = true,
  footerContent,
}: GlassModalProps) {
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
            className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
          >
            <div className={`glass-modal overflow-hidden w-full ${sizeClasses[size]}`}>
              {/* Header */}
              <div className="relative px-6 py-4 border-b border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-50" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold">{title}</h2>
                    {subtitle && (
                      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    )}
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

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>

              {/* Footer */}
              {showFooter && (
                <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
                  {footerContent}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
