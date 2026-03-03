import { format } from "date-fns";
import { FileText, Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { glassCard, glassSurface } from "@/components/ui/LiquidGlass";

const statusStyles = {
  completed: (isDark) => ({
    background: isDark ? "rgba(74,222,128,0.1)" : "rgba(240,253,244,0.6)",
    color: isDark ? "#4ade80" : "#15803d",
    border: `1px solid ${isDark ? "rgba(74,222,128,0.2)" : "rgba(134,239,172,0.4)"}`,
  }),
  failed: (isDark) => ({
    background: isDark ? "rgba(248,113,113,0.1)" : "rgba(254,226,226,0.6)",
    color: isDark ? "#f87171" : "#dc2626",
    border: `1px solid ${isDark ? "rgba(248,113,113,0.2)" : "rgba(252,165,165,0.4)"}`,
  }),
  default: (isDark) => ({
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
    color: isDark ? "#94a3b8" : "#64748b",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}`,
  }),
};

export default function GlassRunCard({ run, t, isDark }) {
  const shortTitle = run.query_text?.substring(0, 60) + (run.query_text?.length > 60 ? "..." : "");
  const statusStyle = (statusStyles[run.status] || statusStyles.default)(isDark);

  return (
    <Link to={`/results?id=${run.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        whileHover={{ scale: 1.005, y: -1 }}
        whileTap={{ scale: 0.99 }}
        style={{
          ...glassCard(t),
          padding: "14px 18px",
          cursor: "pointer",
          transition: "background 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <FileText style={{ width: 15, height: 15, color: isDark ? "#a78bfa" : "#3b82f6", flexShrink: 0 }} />
              <span style={{
                fontSize: 14, fontWeight: 600, color: t.title,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {shortTitle || "Untitled Query"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: t.subtitle }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock style={{ width: 12, height: 12 }} />
                <span>{run.created_date ? format(new Date(run.created_date), "MMM d, yyyy HH:mm") : "—"}</span>
              </div>
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 8,
                ...glassSurface(t),
                color: t.subtitle,
              }}>
                {run.output_mode || "Blueprint"}
              </span>
            </div>
          </div>
          <span style={{
            flexShrink: 0, padding: "4px 10px", borderRadius: 10,
            fontSize: 11, fontWeight: 600,
            ...statusStyle,
          }}>
            {run.status || "idle"}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}