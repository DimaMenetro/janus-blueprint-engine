/**
 * Blueprint Title Cartouche — The architectural title block
 * 
 * Modeled after the bordered title block found at the bottom of architectural drawings.
 * Contains: Blueprint goal (title), metadata, protocol reference, date.
 */

export default function BlueprintTitleCartouche({ run, palette }) {
  const bp = run?.blueprint;
  if (!bp) return null;

  const date = run.created_date
    ? new Date(run.created_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div
      style={{
        border: `2px solid ${palette.borderLine}`,
        borderRadius: 2,
        padding: 0,
        marginBottom: 32,
      }}
    >
      {/* Top row: Protocol stamp + date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${palette.borderLineLight}`,
          padding: "8px 16px",
          background: palette.copperMuted,
        }}
      >
        <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.copper }}>
          CP-002-O-D-JNP v2.0 — Janus Blueprint Protocol
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: palette.label }}>
          {date}
        </span>
      </div>

      {/* Main title: Goal */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${palette.borderLineLight}` }}>
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.3,
          color: palette.title,
          margin: 0,
        }}>
          {bp.goal}
        </h1>
      </div>

      {/* Metadata grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        fontSize: 10,
      }}>
        {[
          { label: "QUERY", value: run.query_text?.length > 60 ? run.query_text.slice(0, 60) + "…" : run.query_text },
          { label: "LEVEL", value: run.blueprint_level || "L2" },
          { label: "NOVELTY", value: run.novelty_dial || "medium" },
          { label: "RUN ID", value: run.id?.slice(0, 12) + "…" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: "8px 12px",
              borderRight: i < 3 ? `1px solid ${palette.borderLineLight}` : "none",
            }}
          >
            <div style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: palette.copper, marginBottom: 2 }}>
              {item.label}
            </div>
            <div style={{ color: palette.text, fontFamily: "monospace", wordBreak: "break-all" }}>
              {item.value || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}