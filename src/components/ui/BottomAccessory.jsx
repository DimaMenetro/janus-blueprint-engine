/**
 * Bottom Accessory Bar — iOS 26 style context-aware bar
 * Floats above the tab bar, shows execution progress.
 * Appears/disappears with spring animation.
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassAccessory } from "@/components/ui/LiquidGlass";
import { useExecution } from "@/components/janus/ExecutionContext";

const statusIcon = {
  running: Loader2,
  validating: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const statusLabel = {
  running: "Running",
  validating: "Validating",
  completed: "Completed",
  failed: "Failed",
};

export default function BottomAccessory() {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const { execution, clearExecution } = useExecution();

  const show = !!execution;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          style={{
            ...glassAccessory(t),
            padding: "10px 16px",
            maxWidth: 380,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: execution?.runId ? "pointer" : "default",
          }}
          onClick={() => {
            if (execution?.status === "completed" || execution?.status === "failed") {
              clearExecution();
            }
          }}
        >
          {/* Status pill */}
          <StatusChip status={execution.status} isDark={isDark} />

          {/* Domain progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {execution.currentDomain ? (
              <span style={{
                fontSize: 12, fontFamily: "monospace", fontWeight: 500,
                color: t.subtitle, letterSpacing: "0.02em",
              }}>
                ⟳ {execution.currentDomain.toUpperCase()} ({execution.completed}/{execution.total})
              </span>
            ) : execution.status === "completed" ? (
              <span style={{ fontSize: 12, color: isDark ? "#4ade80" : "#16a34a", fontWeight: 500 }}>
                Analysis ready
              </span>
            ) : execution.status === "failed" ? (
              <span style={{ fontSize: 12, color: isDark ? "#f87171" : "#dc2626", fontWeight: 500 }}>
                Execution failed
              </span>
            ) : (
              <span style={{ fontSize: 12, color: t.muted }}>Initializing...</span>
            )}

            {/* Query text excerpt */}
            {execution.queryText && (
              <div style={{
                fontSize: 11, color: t.muted, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {execution.queryText.substring(0, 50)}{execution.queryText.length > 50 ? "…" : ""}
              </div>
            )}
          </div>

          {/* View link when complete */}
          {execution.runId && (execution.status === "completed" || execution.status === "failed") && (
            <Link
              to={`/results?id=${execution.runId}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 12, fontWeight: 600,
                color: isDark ? "#a78bfa" : "#3b82f6",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              View →
            </Link>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatusChip({ status, isDark }) {
  const Icon = statusIcon[status] || Loader2;
  const label = statusLabel[status] || "Idle";
  const isSpinning = status === "running" || status === "validating";

  const colorMap = {
    running:    { color: isDark ? "#60a5fa" : "#2563eb", bg: isDark ? "rgba(59,130,246,0.12)" : "rgba(219,234,254,0.6)" },
    validating: { color: isDark ? "#fbbf24" : "#d97706", bg: isDark ? "rgba(251,191,36,0.12)" : "rgba(254,243,199,0.6)" },
    completed:  { color: isDark ? "#4ade80" : "#16a34a", bg: isDark ? "rgba(74,222,128,0.12)" : "rgba(240,253,244,0.6)" },
    failed:     { color: isDark ? "#f87171" : "#dc2626", bg: isDark ? "rgba(248,113,113,0.12)" : "rgba(254,226,226,0.6)" },
  };

  const c = colorMap[status] || colorMap.running;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 999,
      background: c.bg,
      border: `1px solid ${c.color}22`,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      flexShrink: 0,
    }}>
      <Icon style={{
        width: 13, height: 13, color: c.color,
        ...(isSpinning ? { animation: "spin 1s linear infinite" } : {}),
      }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{label}</span>
    </div>
  );
}