import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Zap } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  light, dark,
  glassCard, glassBtn, glassError
} from "@/components/ui/LiquidGlass";
import { protocolLabel } from "@/lib/janus/protocolRegistry";
import { executeJanus } from "@/lib/janus/browserAdapter";
import { useExecution } from "@/components/janus/ExecutionContext";
import { useAuth } from "@/lib/AuthContext";
import { isOperator } from "@/lib/janus/operatorAccess";
import QueryForm from "@/components/janus/QueryForm";
import ExecutionModeSelector from "@/components/janus/ExecutionModeSelector";
import ParameterGrid from "@/components/janus/ParameterGrid";

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
  const { drive } = useExecution();
  // Execution is operator-only (containment). The control follows the signed-in role; the engine enforces it.
  const operator = isOperator(useAuth().user);

  const handleExecute = async () => {
    if (!queryText.trim()) return;
    setStatus("running");
    setErrorMessage("");

    try {
      // Progress is not tracked here: the execution observer re-reads durable stage state after every change.
      const result = await drive(hooks => executeJanus(
        { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled }, hooks));
      setStatus(result.status);
      navigate(`/results?id=${result.runId}`);
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
          {protocolLabel()}
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
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingTop: 16, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"}`,
          flexWrap: "wrap", gap: 12,
        }}>
          {!operator && (
            <span style={{ fontSize: 12, color: t.subtitle, flex: "1 1 200px" }}>
              View only. Executing Janus needs the admin account: use the account button at the top to switch.
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExecute}
            disabled={!operator || !queryText.trim() || status === "running" || status === "validating"}
            style={{
              ...glassBtn(t),
              padding: "0 24px",
              height: 44,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 14,
              opacity: (!operator || !queryText.trim() || status === "running" || status === "validating") ? 0.5 : 1,
              cursor: (!operator || !queryText.trim() || status === "running" || status === "validating") ? "not-allowed" : "pointer",
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