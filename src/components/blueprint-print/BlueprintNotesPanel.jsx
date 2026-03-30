/**
 * Blueprint Notes Panel — Assumptions ("General Notes") + Alternative Approaches
 * 
 * Modeled after the "General Notes" block found on architectural drawings.
 */

export default function BlueprintNotesPanel({ blueprint, palette }) {
  if (!blueprint) return null;
  
  const hasAssumptions = blueprint.assumptions?.length > 0;
  const hasAlternatives = blueprint.alternative_approaches?.length > 0;
  
  if (!hasAssumptions && !hasAlternatives) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: hasAssumptions && hasAlternatives ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 28 }}>
      {/* General Notes / Assumptions */}
      {hasAssumptions && (
        <div style={{
          border: `1.5px solid ${palette.borderLine}`,
          borderRadius: 2,
          pageBreakInside: "avoid",
        }}>
          <div style={{
            padding: "8px 14px",
            borderBottom: `1px solid ${palette.borderLineLight}`,
            background: palette.copperMuted,
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
              General Notes & Assumptions
            </h2>
          </div>
          <div style={{ padding: "12px 14px" }}>
            {blueprint.assumptions.map((a, i) => (
              <div key={i} style={{
                fontSize: 11, color: palette.text, lineHeight: 1.6,
                marginBottom: 6,
                paddingLeft: 14,
                position: "relative",
              }}>
                <span style={{
                  position: "absolute", left: 0, top: 0,
                  fontFamily: "Georgia, serif", fontWeight: 700, color: palette.copper,
                }}>
                  {i + 1}.
                </span>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Approaches */}
      {hasAlternatives && (
        <div style={{
          border: `1.5px solid ${palette.borderLine}`,
          borderRadius: 2,
          pageBreakInside: "avoid",
        }}>
          <div style={{
            padding: "8px 14px",
            borderBottom: `1px solid ${palette.borderLineLight}`,
            background: palette.navyMuted,
          }}>
            <h2 style={{
              fontFamily: "Georgia, serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: palette.navy,
              margin: 0,
            }}>
              Alternative Approaches Considered
            </h2>
          </div>
          <div style={{ padding: "12px 14px" }}>
            {blueprint.alternative_approaches.map((alt, i) => (
              <div key={i} style={{
                marginBottom: 10,
                padding: "8px 10px",
                border: `1px solid ${palette.borderLineLight}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: palette.navy, marginBottom: 4, fontFamily: "Georgia, serif" }}>
                  {alt.name}
                </div>
                {alt.pros?.map((p, j) => (
                  <div key={`p-${j}`} style={{ fontSize: 10, color: palette.success, lineHeight: 1.5 }}>+ {p}</div>
                ))}
                {alt.cons?.map((c, j) => (
                  <div key={`c-${j}`} style={{ fontSize: 10, color: palette.riskHigh, lineHeight: 1.5 }}>− {c}</div>
                ))}
                {alt.why_not_chosen && (
                  <div style={{ fontSize: 10, color: palette.muted, fontStyle: "italic", marginTop: 4 }}>
                    Not chosen: {alt.why_not_chosen}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}