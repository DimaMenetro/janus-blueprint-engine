import { motion } from "framer-motion";
import { Trophy, Clock, FileText, Layers, Shield, CheckCircle2 } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

function MetricRow({ label, a, b, winner, icon: Icon, t, isDark }) {
  const winA = winner === "A";
  const winB = winner === "B";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 80px 80px", alignItems: "center",
      padding: "8px 0",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.subtitle }}>
        {Icon && <Icon style={{ width: 12, height: 12 }} />}
        {label}
      </div>
      <span style={{
        fontSize: 13, fontWeight: 600, textAlign: "center",
        color: winA ? (isDark ? "#4ade80" : "#16a34a") : t.text,
      }}>
        {a ?? "—"}{winA ? " ✓" : ""}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 600, textAlign: "center",
        color: winB ? (isDark ? "#4ade80" : "#16a34a") : t.text,
      }}>
        {b ?? "—"}{winB ? " ✓" : ""}
      </span>
    </div>
  );
}

export default function QualityComparison({ results, t, isDark }) {
  const { variant_a: a, variant_b: b, comparison: cmp } = results;
  if (!a && !b) return null;

  const qa = a?.quality;
  const qb = b?.quality;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Verdict banner */}
      {cmp?.verdict && (
        <div style={{
          ...glassSurface(t),
          padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Trophy style={{ width: 16, height: 16, color: isDark ? "#fbbf24" : "#d97706" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{cmp.verdict}</span>
        </div>
      )}

      {/* Metrics table */}
      {qa && qb && (
        <div style={{ ...glassSurface(t), padding: "16px 18px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 80px 80px",
            paddingBottom: 8, marginBottom: 4,
            borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.label, textTransform: "uppercase", letterSpacing: "0.05em" }}>Metric</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#f97316" : "#ea580c", textAlign: "center" }}>A (Mono)</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#a78bfa" : "#7c3aed", textAlign: "center" }}>B (Split)</span>
          </div>

          <MetricRow label="Completeness" a={qa.completenessScore} b={qb.completenessScore} winner={cmp?.completeness_score?.winner} icon={CheckCircle2} t={t} isDark={isDark} />
          <MetricRow label="Steps" a={qa.stepCount} b={qb.stepCount} winner={cmp?.step_count?.winner} icon={Layers} t={t} isDark={isDark} />
          <MetricRow label="Total Chars" a={qa.totalChars?.toLocaleString()} b={qb.totalChars?.toLocaleString()} winner={cmp?.total_chars?.winner} icon={FileText} t={t} isDark={isDark} />
          <MetricRow label="Avg Instructions" a={`${qa.avgInstructionLength} ch`} b={`${qb.avgInstructionLength} ch`} t={t} isDark={isDark} />
          <MetricRow label="Substeps" a={qa.richness?.totalSubsteps} b={qb.richness?.totalSubsteps} t={t} isDark={isDark} />
          <MetricRow label="Checklists" a={qa.richness?.totalChecklistItems} b={qb.richness?.totalChecklistItems} t={t} isDark={isDark} />
          <MetricRow label="Acceptance Tests" a={qa.richness?.totalAcceptanceTests} b={qb.richness?.totalAcceptanceTests} t={t} isDark={isDark} />
          <MetricRow label="Success Criteria" a={qa.hasSuccessCriteria} b={qb.hasSuccessCriteria} t={t} isDark={isDark} />
          <MetricRow label="Risk Register" a={qa.hasRiskRegister} b={qb.hasRiskRegister} t={t} isDark={isDark} />
          <MetricRow label="Alternatives" a={qa.hasAlternatives} b={qb.hasAlternatives} t={t} isDark={isDark} />
          <MetricRow label="Time" a={`${(a.elapsed_ms / 1000).toFixed(1)}s`} b={`${(b.elapsed_ms / 1000).toFixed(1)}s`} winner={cmp?.time_ms?.winner} icon={Clock} t={t} isDark={isDark} />
          <MetricRow label="Prompt Chars" a={typeof a.prompt_chars === "number" ? a.prompt_chars : "—"} b={typeof b.prompt_chars === "object" ? Object.values(b.prompt_chars).reduce((s, v) => s + v, 0) : "—"} t={t} isDark={isDark} />
        </div>
      )}

      {/* Depth breakdown */}
      {qa && qb && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <DepthCard label="Variant A" quality={qa} color={isDark ? "#f97316" : "#ea580c"} t={t} isDark={isDark} />
          <DepthCard label="Variant B" quality={qb} color={isDark ? "#a78bfa" : "#7c3aed"} t={t} isDark={isDark} />
        </div>
      )}

      {/* Errors */}
      {(a?.error || b?.errors) && (
        <div style={{ ...glassSurface(t), padding: "14px 18px" }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#f87171" : "#dc2626", marginBottom: 8 }}>Errors</h4>
          {a?.error && <div style={{ fontSize: 11, fontFamily: "monospace", color: isDark ? "#fca5a5" : "#991b1b", marginBottom: 4 }}>A: {a.error}</div>}
          {b?.errors?.map((e, i) => <div key={i} style={{ fontSize: 11, fontFamily: "monospace", color: isDark ? "#fca5a5" : "#991b1b", marginBottom: 4 }}>B: {e}</div>)}
        </div>
      )}
    </motion.div>
  );
}

function DepthCard({ label, quality, color, t, isDark }) {
  if (!quality?.depth) return null;
  return (
    <div style={{ ...glassSurface(t), padding: "14px 16px" }}>
      <h4 style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{label} — Step Depth</h4>
      {Object.entries(quality.depth).map(([key, val]) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
          <span style={{ color: t.subtitle }}>{key.replace(/([A-Z])/g, " $1").replace("steps With", "").trim()}</span>
          <span style={{ fontFamily: "monospace", color: t.text, fontWeight: 600 }}>{val}</span>
        </div>
      ))}
    </div>
  );
}