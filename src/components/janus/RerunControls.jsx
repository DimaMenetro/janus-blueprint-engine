import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Layers, Map } from "lucide-react";
import { rerunNeeds } from "@/lib/janus/runView";
import { stagePlan } from "@/lib/janus/executionState";
import { INTERSECTION_KEYS, STORAGE_MODEL } from "@/lib/janus/stageModel";
import { useExecution } from "@/components/janus/ExecutionContext";
import RerunImpactPreview from "@/components/janus/RerunImpactPreview";

const TARGETS = { synthesis: [...INTERSECTION_KEYS, "synthesis"], blueprint: ["blueprint"] };

export default function RerunControls({ view, t, isDark, onRerunComplete, isAdmin = false }) {
  const [preview, setPreview] = useState(null); // "synthesis" | "blueprint" | null — its impact is shown before anything runs
  const { busy } = useExecution();

  // Needs derive from durable stage state: missing, failed or invalid revisions, stale dependents,
  // and (historical Runs only) errors recorded on the original record.
  const needs = rerunNeeds(view);
  const hasBlueprint = !!view.artifacts.blueprint;
  const synthesisMissing = !view.artifacts.synthesis;
  // A staged run re-runs only stages of its own plan (a partial profile has no synthesis stages).
  const inPlan = (key) => view.storage !== STORAGE_MODEL.staged || stagePlan(view.run.execution_mode).includes(key);
  const showSynthesisRerun = needs.synthesis && inPlan("synthesis");
  const showBlueprintRerun = needs.blueprint;

  // Re-runs are operator controls: not shown to anyone else.
  if (!isAdmin || !needs.core || (!showSynthesisRerun && !showBlueprintRerun)) return null;

  const button = (target, Icon, label, color) => (
    <motion.button
      whileHover={!busy ? { scale: 1.02 } : {}}
      whileTap={!busy ? { scale: 0.98 } : {}}
      onClick={() => setPreview(p => (p === target ? null : target))}
      disabled={busy}
      aria-expanded={preview === target}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", minHeight: 40, borderRadius: 12, fontSize: 13, fontWeight: 600,
        background: color.bg, color: color.fg, border: `1px solid ${color.border}`, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1,
      }}
    >
      <Icon style={{ width: 14, height: 14 }} />{label}
    </motion.button>
  );
  const violet = { bg: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)", fg: isDark ? "#c4b5fd" : "#7c3aed", border: isDark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.25)" };
  const green = { bg: isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)", fg: isDark ? "#6ee7b7" : "#059669", border: isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.25)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: isDark ? "rgba(59,130,246,0.06)" : "rgba(219,234,254,0.4)",
        border: `1px solid ${isDark ? "rgba(59,130,246,0.15)" : "rgba(147,197,253,0.5)"}`,
        borderRadius: 16, padding: "16px 20px", marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <RefreshCw style={{ width: 15, height: 15, color: isDark ? "#60a5fa" : "#2563eb" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#93bbfd" : "#1e40af" }}>Domain Re-run Available</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {showSynthesisRerun && button("synthesis", Layers, synthesisMissing ? "Run Synthesis" : "Re-run Synthesis", violet)}
        {showBlueprintRerun && button("blueprint", Map, !hasBlueprint ? "Run Blueprint" : needs.blueprintStale ? "Re-run Blueprint (stale)" : "Re-run Blueprint", green)}
      </div>

      {/* Staleness is derived from exact dependency revisions */}
      {needs.blueprintStale && !preview && (
        <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, color: t.subtitle }}>Blueprint is stale: {needs.blueprintStale}</p>
      )}

      {preview && (
        <RerunImpactPreview runId={view.run.id} targets={TARGETS[preview]} title={preview === "synthesis" ? "Synthesis (six intersections and the patterns)" : "Blueprint"}
          t={t} onDone={onRerunComplete} onClose={() => setPreview(null)} />
      )}
    </motion.div>
  );
}