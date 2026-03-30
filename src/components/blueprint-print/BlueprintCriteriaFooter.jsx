/**
 * Blueprint Criteria Footer — Success criteria as a verification schedule
 * 
 * Modeled after architectural drawing verification/inspection schedules.
 */

export default function BlueprintCriteriaFooter({ criteria, palette }) {
  if (!criteria || criteria.length === 0) return null;

  return (
    <div style={{
      border: `2px solid ${palette.success}`,
      borderRadius: 2,
      marginBottom: 28,
      pageBreakInside: "avoid",
    }}>
      <div style={{
        padding: "8px 14px",
        borderBottom: `1px solid ${palette.borderLineLight}`,
        background: palette.successBg,
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
          color: palette.success,
          margin: 0,
        }}>
          Verification Schedule — Success Criteria
        </h2>
        <span style={{ fontSize: 10, color: palette.label, fontFamily: "monospace" }}>
          {criteria.length} criteria
        </span>
      </div>

      <div style={{ padding: "10px 14px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{
                fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                color: palette.copper, padding: "4px 8px", textAlign: "left",
                borderBottom: `1.5px solid ${palette.borderLine}`,
                width: 40,
              }}>
                #
              </th>
              <th style={{
                fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                color: palette.copper, padding: "4px 8px", textAlign: "left",
                borderBottom: `1.5px solid ${palette.borderLine}`,
              }}>
                CRITERION
              </th>
              <th style={{
                fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                color: palette.copper, padding: "4px 8px", textAlign: "center",
                borderBottom: `1.5px solid ${palette.borderLine}`,
                width: 60,
              }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, i) => (
              <tr key={i}>
                <td style={{
                  fontSize: 11, color: palette.label, padding: "6px 8px", fontFamily: "monospace",
                  borderBottom: `1px solid ${palette.borderLineLight}`,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td style={{
                  fontSize: 11, color: palette.text, padding: "6px 8px", lineHeight: 1.5,
                  borderBottom: `1px solid ${palette.borderLineLight}`,
                }}>
                  {c}
                </td>
                <td style={{
                  fontSize: 14, textAlign: "center", padding: "6px 8px",
                  borderBottom: `1px solid ${palette.borderLineLight}`,
                  color: palette.borderLine,
                }}>
                  ☐
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}