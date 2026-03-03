import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Play, Zap, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  light, dark,
  glassCard, glassSurface, glassBtn, glassError
} from "@/components/ui/LiquidGlass";
import StatusPill from "@/components/janus/StatusPill";
import { EXECUTION_MODES, validateJanusOutput, JANUS_SCHEMA } from "@/components/janus/janusSchema";
import { executeJanus } from "@/components/janus/ExecutionEngine";
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
  const [currentDomain, setCurrentDomain] = useState("");
  const [domainProgress, setDomainProgress] = useState({ completed: 0, total: 0 });

  const handleExecute = async () => {
    if (!queryText.trim()) return;
    setStatus("running");
    setErrorMessage("");
    setCurrentDomain("");
    setDomainProgress({ completed: 0, total: 0 });

    try {
      const result = await executeJanus(
        { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled },
        ({ domain, status: progressStatus, completedDomains, totalDomains }) => {
          setCurrentDomain(domain || "");
          setDomainProgress({ completed: completedDomains, total: totalDomains });
          if (progressStatus === "validating") setStatus("validating");
        },
        generateMarkdown,
        buildPrompt
      );

      if (result.success) {
        setStatus("completed");
        navigate(`/results?id=${result.runId}`);
      } else {
        setStatus("failed");
        setErrorMessage("Execution completed with errors:\n\n" + (result.errors || []).join("\n"));
        navigate(`/results?id=${result.runId}`);
      }
    } catch (err) {
      setStatus("failed");
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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 16, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"}`,
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusPill status={status} />
            {currentDomain && (
              <span style={{ fontSize: 11, fontFamily: "monospace", color: t.muted, animation: "pulse 2s infinite" }}>
                ⟳ {currentDomain.toUpperCase()} ({domainProgress.completed}/{domainProgress.total})
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExecute}
            disabled={!queryText.trim() || status === "running" || status === "validating"}
            style={{
              ...glassBtn(t),
              padding: "0 24px",
              height: 44,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 14,
              opacity: (!queryText.trim() || status === "running" || status === "validating") ? 0.5 : 1,
              cursor: (!queryText.trim() || status === "running" || status === "validating") ? "not-allowed" : "pointer",
            }}
          >
            <Play style={{ width: 16, height: 16 }} />
            Execute Janus
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