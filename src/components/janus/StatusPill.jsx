import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

const statusConfig = {
  idle: { label: "Idle", color: "backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-500/35", icon: Clock },
  running: { label: "Running", color: "backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] text-blue-700 dark:text-blue-400 border border-blue-300/60 dark:border-blue-500/35", icon: Loader2, spin: true },
  validating: { label: "Validating", color: "backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/35", icon: Zap },
  completed: { label: "Completed", color: "backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/35", icon: CheckCircle },
  failed: { label: "Failed", color: "backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] text-red-700 dark:text-red-400 border border-red-300/60 dark:border-red-500/35", icon: XCircle },
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