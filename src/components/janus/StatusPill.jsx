import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

const statusConfig = {
  idle: { label: "Idle", color: "bg-slate-100 text-slate-600", icon: Clock },
  running: { label: "Running", color: "bg-blue-100 text-blue-700", icon: Loader2, spin: true },
  validating: { label: "Validating", color: "bg-amber-100 text-amber-700", icon: Zap },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function StatusPill({ status = "idle" }) {
  const config = statusConfig[status] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
      config.color
    )}>
      <Icon className={cn("w-4 h-4", config.spin && "animate-spin")} />
      <span>{config.label}</span>
    </div>
  );
}