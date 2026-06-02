// ─────────────────────────────────────────────────────────────────────────────
// IMP-002-R-D-SRV Phase -1.5 — Golden Run Capture UI
// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY diagnostics-only UI. Triggers captureGoldenRun() with a small
// fixed test query, then displays the resulting runId + hash count so the
// operator can hand it off to functions/captureGoldenRun for archival.
//
// REMOVAL: deleted at subtask -1.8 alongside phase1Capture.js.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface, glassBtn } from "@/components/ui/LiquidGlass";
import { captureGoldenRun } from "@/components/janus/phase1Capture";

const DEFAULT_QUERY =
  "Design a resilient distributed cache layer for high-traffic API responses.";

export default function GoldenRunCapture() {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCapture = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    setStatus("Starting capture…");

    try {
      const out = await captureGoldenRun(
        {
          queryText: query,
          executionMode: "standard",
          outputMode: "Blueprint",
          blueprintLevel: "L2",
          noveltyDial: "medium",
          refreshEnabled: false,
        },
        (p) => {
          if (p?.domain) setStatus(`Running: ${p.domain} (${p.status || ""})`);
        }
      );
      setResult(out);
      setStatus("Capture complete. Recorder cleared.");
    } catch (e) {
      setError(e?.message || String(e));
      setStatus("Capture failed. Recorder cleared (finally block).");
    } finally {
      setRunning(false);
    }
  };

  const copyRunId = () => {
    if (result?.runId) navigator.clipboard.writeText(result.runId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ ...glassCard(t), padding: "18px 20px", marginBottom: 16 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: t.title, margin: 0 }}>
            Golden Run Capture
          </h2>
          <p style={{ fontSize: 11, color: t.muted, margin: "2px 0 0" }}>
            IMP-002 Phase −1.5 · TEMP · hashes only · finally-clear guaranteed
          </p>
        </div>
        <motion.button
          whileHover={{ scale: running ? 1 : 1.02 }}
          whileTap={{ scale: running ? 1 : 0.98 }}
          onClick={handleCapture}
          disabled={running}
          style={{
            ...glassBtn(t),
            padding: "0 14px",
            height: 36,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: running ? "default" : "pointer",
            opacity: running ? 0.6 : 1,
          }}
        >
          {running ? (
            <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
          ) : (
            <Camera style={{ width: 13, height: 13 }} />
          )}
          {running ? "Capturing…" : "Capture Golden Run"}
        </motion.button>
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={running}
        rows={2}
        style={{
          ...glassSurface(t),
          width: "100%",
          padding: "8px 10px",
          fontSize: 12,
          fontFamily: "inherit",
          color: t.text,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      {status && (
        <div style={{ ...glassSurface(t), marginTop: 10, padding: "8px 12px", fontSize: 11, color: t.subtitle }}>
          {status}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: isDark ? "#4ade80" : "#16a34a" }} />
            <span style={{ fontSize: 12, color: t.text }}>
              Run <span style={{ fontFamily: "monospace", color: t.title }}>{result.runId}</span>
            </span>
            <button
              onClick={copyRunId}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: t.muted,
                display: "inline-flex",
                alignItems: "center",
              }}
              title="Copy runId"
            >
              <Copy style={{ width: 12, height: 12 }} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: t.subtitle, fontFamily: "monospace" }}>
            success: {String(result.success)} · hashes: {result.hashCount} · flushed: {result.flushed}
            {result.flushTimedOut ? " · ⚠ flush timed out" : ""}
          </div>
          {result.errors?.length > 0 && (
            <div style={{ fontSize: 11, color: isDark ? "#fbbf24" : "#d97706" }}>
              {result.errors.length} soft error(s): {result.errors[0]}
              {result.errors.length > 1 ? ` …(+${result.errors.length - 1} more)` : ""}
            </div>
          )}
          <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>
            Next: call <code>captureGoldenRun</code> backend function with this runId to archive the
            baseline JSON. Hashes are stored on <code>Run.debug_prompt_hashes</code>. Raw prompts are
            never persisted by this flow.
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: isDark ? "#f87171" : "#dc2626" }} />
          <span style={{ fontSize: 12, color: isDark ? "#f87171" : "#dc2626", fontFamily: "monospace" }}>
            {error}
          </span>
        </div>
      )}
    </motion.div>
  );
}