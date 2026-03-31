/**
 * SchematicHeader — Classification stamp + title block
 * Inspired by engineering drawing title blocks and document classification headers.
 */
export default function SchematicHeader({ run, isDark }) {
  const border = isDark ? "rgba(180,140,80,0.4)" : "rgba(80,60,30,0.25)";
  const text = isDark ? "#d4a574" : "#5c4a2a";
  const muted = isDark ? "#7a8a9a" : "#8a7a6a";
  const bg = isDark ? "rgba(180,140,80,0.04)" : "rgba(180,160,120,0.06)";

  const date = new Date(run.created_date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  const level = run.blueprint_level || "L2";
  const mode = run.execution_mode || "standard";
  const novelty = run.novelty_dial || "medium";
  const stepCount = run.blueprint?.steps?.length || 0;
  const riskCount = run.blueprint?.risk_register?.length || 0;

  return (
    <div style={{
      border: `2px solid ${border}`,
      background: bg,
      padding: "16px 20px",
      marginBottom: 24,
      position: "relative",
    }}>
      {/* Classification strip */}
      <div style={{
        position: "absolute", top: -1, left: 20, right: 20,
        height: 3, background: isDark ? "#d4a574" : "#8b6914",
      }} />

      {/* Top row: doc type + classification */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 12, flexWrap: "wrap", gap: 8,
      }}>
        <div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: "0.15em",
            textTransform: "uppercase", color: muted, marginBottom: 2,
          }}>
            {">"} JANUS BLUEPRINT PROTOCOL — EXECUTABLE DELIVERABLE
          </div>
          <div style={{
            fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 18, fontWeight: 700,
            color: text, lineHeight: 1.3, maxWidth: 600,
          }}>
            {run.query_text?.slice(0, 100)}{run.query_text?.length > 100 ? "…" : ""}
          </div>
        </div>
        <div style={{
          fontFamily: "'Courier New', monospace", fontSize: 10,
          color: muted, textAlign: "right", lineHeight: 1.6,
        }}>
          <div>DOC.ID: BP-{run.id?.slice(-8)?.toUpperCase()}</div>
          <div>RATIFIED: {date}</div>
          <div>ENGINE: {mode.toUpperCase()} / {level}</div>
          <div>NOVELTY: {novelty.toUpperCase()}</div>
        </div>
      </div>

      {/* Metrics strip */}
      <div style={{
        display: "flex", gap: 24, borderTop: `1px solid ${border}`, paddingTop: 8,
        fontFamily: "'Courier New', monospace", fontSize: 11, color: muted,
      }}>
        <span>{stepCount} PHASES</span>
        <span>{riskCount} RISKS IDENTIFIED</span>
        <span>{run.blueprint?.success_criteria?.length || 0} SUCCESS CRITERIA</span>
        <span>OUTPUT: {run.output_mode || "Blueprint"}</span>
      </div>
    </div>
  );
}