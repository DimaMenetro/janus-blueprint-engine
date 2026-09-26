import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Play, Zap } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  light, dark,
  glassCard, glassBtn, glassError
} from "@/components/ui/LiquidGlass";
import { executeJanus } from "@/components/janus/ExecutionEngine";
import { useExecution } from "@/components/janus/ExecutionContext";
import QueryForm from "@/components/janus/QueryForm";
import ExecutionModeSelector from "@/components/janus/ExecutionModeSelector";
import ParameterGrid from "@/components/janus/ParameterGrid";
import { buildPrompt, generateMarkdown } from "@/components/janus/promptUtils";

export default function NewQuery() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = isDark ? dark : light;

  const [queryText, setQueryText] = useState("");
  const [executionMode, setExecutionMode] = useState("standard");
  const [outputMode, setOutputMode] = useState("Blueprint");
  const [blueprintLevel, setBlueprintLevel] = useState("L2");
  const [noveltyDial, setNoveltyDial] = useState("medium");
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resumeRunId, setResumeRunId] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const { startExecution, updateProgress, recordRetry, finishExecution, failExecution } = useExecution();

  useEffect(() => {
    const resumeId = new URLSearchParams(window.location.search).get("resume");
    if (!resumeId) return;

    let cancelled = false;
    setResumeLoading(true);

    (async () => {
      try {
        const matches = await base44.entities.Run.filter({ id: resumeId });
        const savedRun = Array.isArray(matches) ? matches[0] : matches;
        if (!savedRun) throw new Error("The selected Janus checkpoint no longer exists.");

        if (savedRun.status === "completed") {
          navigate(`/results?id=${savedRun.id}`, { replace: true });
          return;
        }

        if (cancelled) return;
        setResumeRunId(savedRun.id);
        setQueryText(savedRun.query_text || "");
        setExecutionMode(savedRun.execution_mode || "standard");
        setOutputMode(savedRun.output_mode || "Blueprint");
        setBlueprintLevel(savedRun.blueprint_level || "L2");
        setNoveltyDial(savedRun.novelty_dial || "medium");
        setRefreshEnabled(!!savedRun.refresh_enabled);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(`Unable to load checkpoint: ${error?.message || String(error)}`);
        }
      } finally {
        if (!cancelled) setResumeLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [navigate]);

  const handleExecute = async () => {
    if (!queryText.trim()) return;
    setStatus("running");
    setErrorMessage("");
    startExecution(queryText);

    try {
      const result = await executeJanus(
        { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled, resumeRunId },
        (payload) => {
          // Phase 6: route retry events into the context's recordRetry; everything
          // else flows through updateProgress as before. Destructure inside so the
          // engine can extend the payload shape additively without breaking callers.
          if (payload && payload.retryEvent) {
            recordRetry(payload.retryEvent);
            return;
          }
          const { domain, status: progressStatus, completedDomains, totalDomains } = payload;
          updateProgress({ domain, status: progressStatus, completedDomains, totalDomains });
          if (progressStatus === "validating") setStatus("validating");
        },
        generateMarkdown,
        buildPrompt
      );

      if (result.success) {
        setStatus("completed");
        finishExecution(result.runId);
        navigate(`/results?id=${result.runId}`);
      } else {
        setStatus("failed");
        setErrorMessage("Execution completed with errors:\n\n" + (result.errors || []).join("\n"));
        updateProgress({ runId: result.runId, status: "failed" });
        navigate(`/results?id=${result.runId}`);
      }
    } catch (err) {
      setStatus("failed");
      failExecution();
      setErrorMessage(`Unexpected error: ${err.message || err}`);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 40px" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Zap style={{ width: 28, height: 28, color: isDark ? "#a78bfa" : "#3b82f6" }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: t.title, letterSpacing: "-0.5px", margin: 0 }}>
            Janus Blueprint Engine
          </h1>
        </div>
        <p style={{ fontSize: 13, color: t.subtitle, margin: 0 }}>
          CP-002-O-D-JNP v2.0 — Restoration Edition
        </p>
      </motion.div>

      {resumeRunId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...glassCard(t), padding: "14px 16px", marginBottom: 16 }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: t.title, marginBottom: 4 }}>
            Resuming saved Janus checkpoint
          </div>
          <div style={{ fontSize: 12, color: t.subtitle, lineHeight: 1.5 }}>
            Completed domains and intersection pairs will be reused. The original run parameters are authoritative; Janus will continue from the first missing checkpoint rather than recomputing finished work.
          </div>
        </motion.div>
      )}

      {/* Main glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        style={{ ...glassCard(t), padding: "24px 22px", display: "flex", flexDirection: "column", gap: 24 }}
      >
        <QueryForm value={queryText} onChange={setQueryText} t={t} />
        <ExecutionModeSelector value={executionMode} onChange={setExecutionMode} t={t} isDark={isDark} />
        <ParameterGrid
          outputMode={outputMode} setOutputMode={setOutputMode}
          blueprintLevel={blueprintLevel} setBlueprintLevel={setBlueprintLevel}
          noveltyDial={noveltyDial} setNoveltyDial={setNoveltyDial}
          refreshEnabled={refreshEnabled} setRefreshEnabled={setRefreshEnabled}
          showRefresh={executionMode === "full"}
          t={t} isDark={isDark}
        />

        {/* Footer bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingTop: 16, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"}`,
          flexWrap: "wrap", gap: 12,
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExecute}
            disabled={!queryText.trim() || resumeLoading || status === "running" || status === "validating"}
            style={{
              ...glassBtn(t),
              padding: "0 24px",
              height: 44,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 14,
              opacity: (!queryText.trim() || resumeLoading || status === "running" || status === "validating") ? 0.5 : 1,
              cursor: (!queryText.trim() || resumeLoading || status === "running" || status === "validating") ? "not-allowed" : "pointer",
            }}
          >
            <Play style={{ width: 16, height: 16 }} />
            {resumeLoading ? "Loading Checkpoint…" : resumeRunId ? "Resume Janus" : "Execute Janus"}
          </motion.button>
        </div>
      </motion.div>

      {/* Error display */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...glassError(t), marginTop: 20, padding: "20px 18px" }}
        >
          <h3 style={{ color: isDark ? "#fca5a5" : "#dc2626", fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
            Validation Failed
          </h3>
          <pre style={{
            fontSize: 12, color: isDark ? "#fca5a5" : "#dc2626",
            whiteSpace: "pre-wrap", fontFamily: "monospace",
            background: isDark ? "rgba(127,29,29,0.15)" : "rgba(254,226,226,0.4)",
            padding: 14, borderRadius: 12, maxHeight: 300, overflow: "auto",
            border: `1px solid ${isDark ? "rgba(248,113,113,0.15)" : "rgba(252,165,165,0.3)"}`,
          }}>
            {errorMessage}
          </pre>
        </motion.div>
      )}
    </div>
  );
}