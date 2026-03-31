/**
 * SchematicHeader — Title block rendered as ink on glass surface
 * Uses glassSurface for the container, with clean typography.
 */
import { glassSurface } from "@/components/ui/LiquidGlass";

export default function SchematicHeader({ run, isDark, t }) {
  const date = new Date(run.created_date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const level = run.blueprint_level || "L2";
  const mode = run.execution_mode || "standard";
  const novelty = run.novelty_dial || "medium";
  const stepCount = run.blueprint?.steps?.length || 0;
  const riskCount = run.blueprint?.risk_register?.length || 0;

  const inkLight = isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.12)";
  const inkAccent = isDark ? "rgba(148,163,184,0.4)" : "rgba(71,85,105,0.3)";

  return (
    <div style={{
      ...glassSurface(t),
      padding: "18px 22px",
      marginBottom: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top accent line — thin ink stroke */}
      <div style={{
        position: "absolute", top: 0, left: 20, right: 20,
        height: 1,
        background: isDark
          ? "linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)"
          : "linear-gradient(90deg, transparent, rgba(71,85,105,0.2), transparent)",
      }} />

      {/* Top row: doc type + classification */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 14, flexWrap: "wrap", gap: 8,
      }}>
        <div>
          <div style={{
            fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: t.muted, marginBottom: 4,
          }}>
            Janus Blueprint Protocol — Executable Deliverable
          </div>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: t.title, lineHeight: 1.3, maxWidth: 600,
          }}>
            {run.query_text?.slice(0, 100)}{run.query_text?.length > 100 ? "…" : ""}
          </div>
        </div>
        <div style={{
          fontSize: 10, color: t.muted, textAlign: "right", lineHeight: 1.7,
          opacity: 0.8,
        }}>
          <div>BP-{run.id?.slice(-8)?.toUpperCase()}</div>
          <div>{date}</div>
          <div>{mode.toUpperCase()} / {level}</div>
          <div>Novelty: {novelty}</div>
        </div>
      </div>

      {/* Metrics strip — dashed separator */}
      <div style={{
        display: "flex", gap: 20, paddingTop: 10,
        borderTop: `1px dashed ${inkLight}`,
        fontSize: 11, color: t.subtitle, flexWrap: "wrap",
      }}>
        <span>{stepCount} phases</span>
        <span>{riskCount} risks</span>
        <span>{run.blueprint?.success_criteria?.length || 0} success criteria</span>
        <span style={{ opacity: 0.6 }}>{run.output_mode || "Blueprint"}</span>
      </div>
    </div>
  );
}