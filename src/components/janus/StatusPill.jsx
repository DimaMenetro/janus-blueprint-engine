import { Loader2, CheckCircle, XCircle, Clock, Zap } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

const statusConfig = {
  idle:       { label: "Idle",       icon: Clock,       color: (d) => d ? "#64748b" : "#94a3b8", bg: (d) => d ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.35)" },
  running:    { label: "Running",    icon: Loader2,     color: (d) => d ? "#60a5fa" : "#2563eb", bg: (d) => d ? "rgba(59,130,246,0.1)" : "rgba(219,234,254,0.5)", spin: true },
  validating: { label: "Validating", icon: Zap,         color: (d) => d ? "#fbbf24" : "#d97706", bg: (d) => d ? "rgba(251,191,36,0.1)" : "rgba(254,243,199,0.5)" },
  completed:  { label: "Completed",  icon: CheckCircle, color: (d) => d ? "#4ade80" : "#16a34a", bg: (d) => d ? "rgba(74,222,128,0.1)" : "rgba(240,253,244,0.5)" },
  failed:     { label: "Failed",     icon: XCircle,     color: (d) => d ? "#f87171" : "#dc2626", bg: (d) => d ? "rgba(248,113,113,0.1)" : "rgba(254,226,226,0.5)" },
};

export default function StatusPill({ status = "idle" }) {
  const { isDark } = useTheme();
  const config = statusConfig[status] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 14px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      color: config.color(isDark),
      background: config.bg(isDark),
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${config.color(isDark)}22`,
      boxShadow: `inset 0 1px 0 0 rgba(255,255,255,${isDark ? "0.05" : "0.5"})`,
    }}>
      <Icon style={{ width: 14, height: 14, ...(config.spin ? { animation: "spin 1s linear infinite" } : {}) }} />
      <span>{config.label}</span>
    </div>
  );
}