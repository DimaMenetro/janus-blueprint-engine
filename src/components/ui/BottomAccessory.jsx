/**
 * Bottom Accessory Bar — context-aware execution surface above the tab bar.
 * Everything it shows is derived from durable stage records (ExecutionContext → deriveExecutionState).
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, PauseCircle, Ban, X } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassAccessory } from "@/components/ui/LiquidGlass";
import { useExecution } from "@/components/janus/ExecutionContext";

const TONES = {
  running:          { icon: Loader2,     spin: true, light: "#2563eb", dark: "#60a5fa", chip: "Running" },
  validating:       { icon: Loader2,     spin: true, light: "#d97706", dark: "#fbbf24", chip: "Validating" },
  cancel_requested: { icon: Loader2,     spin: true, light: "#d97706", dark: "#fbbf24", chip: "Cancelling" },
  interrupted:      { icon: PauseCircle, light: "#d97706", dark: "#fbbf24", chip: "Interrupted" },
  unresolved:       { icon: PauseCircle, light: "#d97706", dark: "#fbbf24", chip: "Unresolved" },
  cancelled:        { icon: Ban,         light: "#64748b", dark: "#94a3b8", chip: "Cancelled" },
  completed:        { icon: CheckCircle, light: "#16a34a", dark: "#4ade80", chip: "Completed" },
  failed:           { icon: XCircle,     light: "#dc2626", dark: "#f87171", chip: "Failed" },
  partial:          { icon: PauseCircle, light: "#d97706", dark: "#fbbf24", chip: "Partial" },
};

function detailOf(state, qualification) {
  const progress = `${state.completed}/${state.total} stages saved`;
  if (state.live) return `${state.live.label.toUpperCase()} in progress · ${progress}`;
  if (state.status === "completed" && qualification) return qualification.release.label;
  if (state.status === "partial" && qualification) return `${qualification.completion.blocking.length} required item${qualification.completion.blocking.length === 1 ? "" : "s"} missing · ${progress}`;
  if (state.awaiting) return `Retry of ${state.awaiting.label} pending (attempt ${state.awaiting.nextAttempt} of ${state.maxAttempts}) · ${progress}`;
  if (state.status === "interrupted" && state.next) return `Stopped before ${state.next.label} · ${progress}`;
  if (state.failures.length && state.status !== "running") return `${state.failures.length} stage${state.failures.length === 1 ? "" : "s"} failed · ${progress}`;
  return progress;
}

export default function BottomAccessory() {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const { execution, dismiss } = useExecution();
  const state = execution?.state;
  const tone = state && (TONES[state.status] || TONES.interrupted);
  const color = tone && (isDark ? tone.dark : tone.light);
  const Icon = tone?.icon;
  const query = execution?.view.run.query_text || "";

  return (
    <AnimatePresence>
      {execution && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          style={{ ...glassAccessory(t), padding: "10px 12px 10px 16px", maxWidth: 380, width: "100%", display: "flex", alignItems: "center", gap: 10 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, background: `${color}1f`, border: `1px solid ${color}22`, flexShrink: 0 }}>
            <Icon style={{ width: 13, height: 13, color, ...(tone.spin ? { animation: "spin 1s linear infinite" } : {}) }} />
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{tone.chip}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div title={state.label} style={{ fontSize: 12, fontWeight: 500, color: t.subtitle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {detailOf(state, execution.qualification)}
            </div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {query.substring(0, 50)}{query.length > 50 ? "…" : ""}
            </div>
          </div>

          <Link to={`/results?id=${execution.runId}`} style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#a78bfa" : "#3b82f6", textDecoration: "none", whiteSpace: "nowrap", padding: "8px 4px" }}>
            View →
          </Link>
          {!execution.driving && (
            <button onClick={dismiss} aria-label="Hide" style={{ background: "none", border: "none", padding: 8, cursor: "pointer", display: "flex", flexShrink: 0 }}>
              <X style={{ width: 14, height: 14, color: t.muted }} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}