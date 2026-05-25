/**
 * ProcessingCard — Liquid Glass server-side execution progress indicator
 * Shows incremental domain completion as the backend processes the Janus pipeline.
 * Uses glassCard tokens and animated status chips consistent with the design system.
 */
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { glassCard, glassSurface } from "@/components/ui/LiquidGlass";

const DOMAIN_LABELS = {
  corpus:    "Corpus",
  cogito:    "Cogito",
  animus:    "Animus",
  actus:     "Actus",
  synthesis: "Synthesis",
  blueprint: "Blueprint",
};

function DomainChip({ label, complete, isDark }) {
  const Icon = complete ? CheckCircle2 : Circle;
  const color = complete
    ? (isDark ? "#4ade80" : "#16a34a")
    : (isDark ? "#475569" : "#94a3b8");
  const bg = complete
    ? (isDark ? "rgba(74,222,128,0.08)" : "rgba(240,253,244,0.6)")
    : (isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.35)");

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 999,
      background: bg,
      border: `1px solid ${color}22`,
      transition: "all 0.4s ease",
    }}>
      <Icon style={{ width: 12, height: 12, color }} />
      <span style={{ fontSize: 11, fontWeight: 500, color, letterSpacing: "0.01em" }}>{label}</span>
    </div>
  );
}

export default function ProcessingCard({ run, t, isDark }) {
  const domainKeys = Object.keys(DOMAIN_LABELS);
  const completedDomains = domainKeys.filter(k => run[k]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ ...glassCard(t), padding: "22px 24px", marginBottom: 20 }}
    >
      {/* Header with spinner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ flexShrink: 0 }}
        >
          <Loader2 style={{ width: 20, height: 20, color: isDark ? "#a78bfa" : "#3b82f6" }} />
        </motion.div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: t.title, marginBottom: 2 }}>
            Janus is processing on the server
          </p>
          <p style={{ fontSize: 12, color: t.subtitle }}>
            You can close the app — results will be here when you return.
          </p>
        </div>
      </div>

      {/* Domain progress chips */}
      <div style={{
        ...glassSurface(t),
        padding: "10px 14px",
        display: "flex", flexWrap: "wrap", gap: 6,
      }}>
        {domainKeys.map(key => (
          <DomainChip
            key={key}
            label={DOMAIN_LABELS[key]}
            complete={!!run[key]}
            isDark={isDark}
          />
        ))}
      </div>
    </motion.div>
  );
}