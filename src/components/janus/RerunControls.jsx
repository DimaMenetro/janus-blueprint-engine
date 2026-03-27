import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Layers, Map, AlertTriangle, CheckCircle } from "lucide-react";
import { glassBtn, glassError } from "@/components/ui/LiquidGlass";
import { rerunSynthesis, rerunBlueprint } from "./rerunEngine";
import { useExecution } from "./ExecutionContext";

export default function RerunControls({ run, t, isDark, onRerunComplete }) {
  const [rerunning, setRerunning] = useState(null); // "synthesis" | "blueprint" | null
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const { startExecution, updateProgress, finishExecution, failExecution } = useExecution();

  // Gate checks reflect the actual dependency graph of the blueprint prompt:
  // Blueprint consumes corpus constraints, actus recommendations, animus ethical stance.
  // Synthesis is used if available but is not a hard prerequisite.
  const hasCoreData = run.corpus && run.cogito && run.animus && run.actus;
  const hasBlueprint = !!run.blueprint;

  const canRerunSynthesis = hasCoreData && !rerunning;
  const canRerunBlueprint = hasCoreData && !rerunning;

  // Check if re-run is needed (missing or errored)
  const synthesisErrors = (run.validation_errors || []).filter(e => e.includes("synthesis") || e.includes("intersection"));
  const blueprintErrors = (run.validation_errors || []).filter(e => e.includes("blueprint"));
  const synthesisMissing = !run.synthesis;

  const showSynthesisRerun = synthesisMissing || synthesisErrors.length > 0;
  const showBlueprintRerun = !hasBlueprint || blueprintErrors.length > 0;

  // Don't render anything if nothing needs re-running and core data exists
  if (!hasCoreData || (!showSynthesisRerun && !showBlueprintRerun)) return null;

  const handleRerun = async (target) => {
    setRerunning(target);
    setError(null);
    setProgress({ detail: "Starting..." });

    // Drive the global ExecutionContext so BottomAccessory shows progress
    const label = target === "synthesis" ? "Re-run: Synthesis" : "Re-run: Blueprint";
    startExecution(label);
    updateProgress({ runId: run.id, status: "running" });

    try {
      const fn = target === "synthesis" ? rerunSynthesis : rerunBlueprint;
      const result = await fn(run.id, (p) => {
        setProgress(p);
        // Mirror progress to ExecutionContext
        updateProgress({
          domain: p.domain,
          status: p.status === "completed" ? "running" : p.status,
          completedDomains: p.completedDomains,
          totalDomains: p.totalDomains,
          runId: run.id,
        });
      });
      if (!result.success) {
        setError(`Completed with errors: ${result.errors.join(", ")}`);
        finishExecution(run.id); // Still navigable even with partial errors
      } else {
        finishExecution(run.id);
      }
      onRerunComplete();
    } catch (e) {
      setError(e.message);
      failExecution();
    } finally {
      setRerunning(null);
      setProgress(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: isDark ? "rgba(59,130,246,0.06)" : "rgba(219,234,254,0.4)",
        border: `1px solid ${isDark ? "rgba(59,130,246,0.15)" : "rgba(147,197,253,0.5)"}`,
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <RefreshCw style={{ width: 15, height: 15, color: isDark ? "#60a5fa" : "#2563eb" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#93bbfd" : "#1e40af" }}>
          Domain Re-run Available
        </span>
      </div>

      {!hasCoreData && (
        <p style={{ fontSize: 12, color: t.subtitle, marginBottom: 8 }}>
          Core domains (Corpus, Cogito, Animus, Actus) must complete before re-running synthesis or blueprint.
        </p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {showSynthesisRerun && (
          <motion.button
            whileHover={canRerunSynthesis ? { scale: 1.02 } : {}}
            whileTap={canRerunSynthesis ? { scale: 0.98 } : {}}
            onClick={() => canRerunSynthesis && handleRerun("synthesis")}
            disabled={!canRerunSynthesis}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 13, fontWeight: 600,
              background: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)",
              color: isDark ? "#c4b5fd" : "#7c3aed",
              border: `1px solid ${isDark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.25)"}`,
              cursor: canRerunSynthesis ? "pointer" : "not-allowed",
              opacity: canRerunSynthesis ? 1 : 0.5,
            }}
          >
            {rerunning === "synthesis" ? (
              <RefreshCw style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
            ) : (
              <Layers style={{ width: 14, height: 14 }} />
            )}
            {rerunning === "synthesis" ? "Re-running Synthesis..." : synthesisMissing ? "Run Synthesis" : "Re-run Synthesis"}
          </motion.button>
        )}

        {showBlueprintRerun && (
          <motion.button
            whileHover={canRerunBlueprint ? { scale: 1.02 } : {}}
            whileTap={canRerunBlueprint ? { scale: 0.98 } : {}}
            onClick={() => canRerunBlueprint && handleRerun("blueprint")}
            disabled={!canRerunBlueprint}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 13, fontWeight: 600,
              background: isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)",
              color: isDark ? "#6ee7b7" : "#059669",
              border: `1px solid ${isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.25)"}`,
              cursor: canRerunBlueprint ? "pointer" : "not-allowed",
              opacity: canRerunBlueprint ? 1 : 0.5,
            }}
          >
            {rerunning === "blueprint" ? (
              <RefreshCw style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
            ) : (
              <Map style={{ width: 14, height: 14 }} />
            )}
            {rerunning === "blueprint" ? "Re-running Blueprint..." : !hasBlueprint ? "Run Blueprint" : "Re-run Blueprint"}
          </motion.button>
        )}
      </div>

      {/* Progress indicator */}
      {progress && (
        <div style={{ marginTop: 10, fontSize: 12, color: t.subtitle, display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
          {progress.detail}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: isDark ? "#f87171" : "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle style={{ width: 12, height: 12 }} />
          {error}
        </div>
      )}
    </motion.div>
  );
}