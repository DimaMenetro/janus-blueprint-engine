/**
 * Blueprint Risk Annotations — Risk register as margin callout annotations
 * 
 * Styled like architectural annotation notes with severity badges.
 */

export default function BlueprintRiskAnnotations({ risks, palette }) {
  if (!risks || risks.length === 0) return null;

  const impactColor = (impact) => {
    const map = { high: palette.riskHigh, med: palette.riskMed, low: palette.riskLow };
    return map[impact] || palette.muted;
  };

  return (
    <div style={{
      border: `1.5px solid ${palette.borderLine}`,
      borderRadius: 2,
      marginBottom: 28,
      pageBreakInside: "avoid",
    }}>
      <div style={{
        padding: "8px 14px",
        borderBottom: `1px solid ${palette.borderLineLight}`,
        background: palette.copperMuted,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <h2 style={{
          fontFamily: "Georgia, serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: palette.copper,
          margin: 0,
        }}>
          Risk Register
        </h2>
        <span style={{ fontSize: 10, color: palette.label, fontFamily: "monospace" }}>
          {risks.length} identified risk{risks.length !== 1 ? "s" : ""}
        </span>
      </div>
      
      <div style={{ padding: "12px 14px" }}>
        {risks.map((risk, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 12,
              marginBottom: i < risks.length - 1 ? 10 : 0,
              paddingBottom: i < risks.length - 1 ? 10 : 0,
              borderBottom: i < risks.length - 1 ? `1px solid ${palette.borderLineLight}` : "none",
            }}
          >
            {/* Severity badge */}
            <div style={{
              padding: "2px 8px",
              border: `1.5px solid ${impactColor(risk.impact)}`,
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: impactColor(risk.impact),
              height: "fit-content",
              marginTop: 1,
            }}>
              {risk.impact || "—"}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: palette.title, lineHeight: 1.4 }}>
                ⚠ {risk.risk}
              </div>
              <div style={{ fontSize: 11, color: palette.subtitle, marginTop: 3, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: palette.copper }}>Mitigation:</span> {risk.mitigation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}