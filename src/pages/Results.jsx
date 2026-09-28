import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface, glassBtn, glassError } from "@/components/ui/LiquidGlass";
import StatusPill from "@/components/janus/StatusPill";
import { EXECUTION_MODES } from "@/components/janus/janusSchema";
import GlassResultTabs from "@/components/janus/GlassResultTabs";
import RerunControls from "@/components/janus/RerunControls";

export default function Results() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadRun = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (!id) { navigate("/NewQuery"); return; }
      try { const user = await base44.auth.me(); setIsAdmin(user.role === 'admin'); } catch { setIsAdmin(false); }
      const runs = await base44.entities.Run.filter({ id });
      if (runs.length > 0) setRun(runs[0]);
      setLoading(false);
    };
    loadRun();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <span style={{ fontSize: 15, color: t.subtitle }}>Loading...</span>
        </motion.div>
      </div>
    );
  }

  if (!run) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <p style={{ color: t.subtitle, fontSize: 15 }}>Run not found</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/NewQuery")}
          style={{ ...glassBtn(t), padding: "0 20px", height: 40, fontSize: 13, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
          Back to New Query
        </motion.button>
      </div>
    );
  }

  const mode = EXECUTION_MODES[run.execution_mode?.toUpperCase()] || EXECUTION_MODES.STANDARD;
  const hasFailed = run.status === "failed";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 40px" }}>
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/history")}
          style={{
            ...glassSurface(t),
            padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 500, color: t.subtitle,
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          History
        </motion.button>
        <StatusPill status={run.status} />
      </motion.div>

      {/* Query summary card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...glassCard(t), padding: "18px 22px", marginBottom: 20 }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, color: t.title, marginBottom: 8, lineHeight: 1.4 }}>
          {run.query_text?.substring(0, 120)}{run.query_text?.length > 120 ? "..." : ""}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: t.subtitle, flexWrap: "wrap" }}>
          <span>Mode: <strong style={{ color: t.title }}>{mode.label}</strong></span>
          <span>•</span>
          <span>Output: <strong style={{ color: t.title }}>{run.output_mode}</strong></span>
          {run.refresh_enabled && (
            <>
              <span>•</span>
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 8,
                background: isDark ? "rgba(59,130,246,0.1)" : "rgba(219,234,254,0.6)",
                color: isDark ? "#60a5fa" : "#2563eb",
                border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.4)"}`,
              }}>
                Refresh Enabled
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Error display */}
      {hasFailed && (run.validation_errors || run.error_message) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...glassError(t), padding: "20px 18px", marginBottom: 20 }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle style={{ width: 18, height: 18, color: isDark ? "#f87171" : "#dc2626", marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ color: isDark ? "#f87171" : "#dc2626", fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
                {run.validation_errors ? "Validation Failed" : "Execution Failed"}
              </h3>
              {run.validation_errors?.map((err, idx) => (
                <div key={idx} style={{
                  fontSize: 12, fontFamily: "monospace", color: isDark ? "#fca5a5" : "#991b1b",
                  background: isDark ? "rgba(127,29,29,0.15)" : "rgba(254,226,226,0.4)",
                  padding: "6px 10px", borderRadius: 8, marginBottom: 4,
                  border: `1px solid ${isDark ? "rgba(248,113,113,0.1)" : "rgba(252,165,165,0.2)"}`,
                }}>
                  {err}
                </div>
              ))}
              {!run.validation_errors && run.error_message && (
                <pre style={{
                  fontSize: 12, fontFamily: "monospace", color: isDark ? "#fca5a5" : "#991b1b",
                  whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto",
                }}>
                  {run.error_message}
                </pre>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Domain re-run controls — show when synthesis or blueprint missing/errored */}
      <RerunControls
        run={run}
        t={t}
        isDark={isDark}
        onRerunComplete={async () => {
          const refreshed = await base44.entities.Run.filter({ id: run.id });
          if (refreshed.length > 0) setRun(refreshed[0]);
        }}
      />

      {/* Results tabs */}
      {!hasFailed && (
        <GlassResultTabs run={run} mode={mode} t={t} isDark={isDark} isAdmin={isAdmin} />
      )}
    </div>
  );
}