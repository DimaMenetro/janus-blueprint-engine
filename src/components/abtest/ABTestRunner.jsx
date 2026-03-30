import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Play, Loader2, AlertTriangle } from "lucide-react";
import { glassSurface, glassBtn } from "@/components/ui/LiquidGlass";

export default function ABTestRunner({ t, isDark, onResults }) {
  const [runId, setRunId] = useState("");
  const [variant, setVariant] = useState("both");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const execute = async () => {
    if (!runId.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("abTestBlueprint", {
        run_id: runId.trim(),
        variant,
      });
      onResults(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Unknown error");
    } finally {
      setRunning(false);
    }
  };

  const variantOptions = [
    { value: "both", label: "Both (A vs B)" },
    { value: "A", label: "Variant A only" },
    { value: "B", label: "Variant B only" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Run ID input */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: t.label, marginBottom: 6, display: "block" }}>
          Run ID
        </label>
        <input
          value={runId}
          onChange={(e) => setRunId(e.target.value)}
          placeholder="Paste a completed Run ID..."
          disabled={running}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 14,
            fontSize: 13,
            fontFamily: "monospace",
            color: t.title,
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Variant selector */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: t.label, marginBottom: 6, display: "block" }}>
          Variant
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {variantOptions.map((opt) => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !running && setVariant(opt.value)}
              style={{
                ...glassSurface(t),
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: running ? "not-allowed" : "pointer",
                color: variant === opt.value ? (isDark ? "#a78bfa" : "#3b82f6") : t.subtitle,
                border: `1px solid ${variant === opt.value ? (isDark ? "rgba(167,139,250,0.3)" : "rgba(59,130,246,0.3)") : "transparent"}`,
              }}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Execute button */}
      <motion.button
        whileHover={running ? {} : { scale: 1.02 }}
        whileTap={running ? {} : { scale: 0.98 }}
        onClick={execute}
        disabled={running || !runId.trim()}
        style={{
          ...glassBtn(t),
          padding: "0 24px",
          height: 42,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: running || !runId.trim() ? "not-allowed" : "pointer",
          opacity: running || !runId.trim() ? 0.5 : 1,
          alignSelf: "flex-start",
        }}
      >
        {running ? (
          <>
            <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
            Running AB Test... (this takes ~60-120s)
          </>
        ) : (
          <>
            <Play style={{ width: 14, height: 14 }} />
            Execute AB Test
          </>
        )}
      </motion.button>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "12px 16px", borderRadius: 14,
            background: isDark ? "rgba(248,113,113,0.08)" : "rgba(254,226,226,0.5)",
            border: `1px solid ${isDark ? "rgba(248,113,113,0.15)" : "rgba(252,165,165,0.3)"}`,
          }}
        >
          <AlertTriangle style={{ width: 14, height: 14, color: isDark ? "#f87171" : "#dc2626", marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: isDark ? "#fca5a5" : "#991b1b" }}>{error}</span>
        </motion.div>
      )}
    </div>
  );
}