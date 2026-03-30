/**
 * Blueprint Step Plate — Each step rendered as a bordered "plate" section
 * 
 * Modeled after architectural drawing detail views:
 * - Hexagonal step node marker
 * - Bordered region with instructions
 * - Substeps as nested callouts
 * - Dependency arrows noted as references
 */

export default function BlueprintStepPlate({ step, totalSteps, palette, blueprintLevel }) {
  const level = blueprintLevel || "L2";
  const effortColor = {
    low: palette.success,
    medium: palette.amber,
    high: palette.riskHigh,
  }[step.effort_level] || palette.muted;

  return (
    <div
      style={{
        border: `1.5px solid ${palette.borderLine}`,
        borderRadius: 2,
        marginBottom: 20,
        background: palette.sectionBg,
        position: "relative",
        pageBreakInside: "avoid",
      }}
    >
      {/* Step header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderBottom: `1px solid ${palette.borderLineLight}`,
          background: palette.copperMuted,
        }}
      >
        {/* Hexagonal node marker */}
        <div style={{
          width: 32, height: 32,
          background: palette.nodeBackground,
          border: `2px solid ${palette.nodeBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontSize: 14,
          fontWeight: 700,
          color: palette.nodeText,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          flexShrink: 0,
        }}>
          {step.step}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{
            fontFamily: "Georgia, serif",
            fontSize: 15,
            fontWeight: 700,
            color: palette.title,
            margin: 0,
            lineHeight: 1.3,
          }}>
            {step.title}
          </h3>
          <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
            {step.time_estimate && (
              <span style={{ fontSize: 10, color: palette.label, fontFamily: "monospace" }}>
                ⏱ {step.time_estimate}
              </span>
            )}
            {step.effort_level && (
              <span style={{ fontSize: 10, color: effortColor, fontWeight: 600, fontFamily: "monospace", textTransform: "uppercase" }}>
                ◆ {step.effort_level} effort
              </span>
            )}
            {step.depends_on_steps?.length > 0 && (
              <span style={{ fontSize: 10, color: palette.navy, fontFamily: "monospace" }}>
                ← Dep: {step.depends_on_steps.map(d => `§${d}`).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Instructions body */}
      <div style={{ padding: "14px 16px" }}>
        <p style={{
          fontSize: 12,
          lineHeight: 1.7,
          color: palette.text,
          margin: 0,
        }}>
          {step.instructions}
        </p>

        {/* Inputs / Outputs / Validation — compact grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          {step.inputs?.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.copper, marginBottom: 4 }}>INPUTS</div>
              {step.inputs.map((inp, i) => (
                <div key={i} style={{ fontSize: 11, color: palette.subtitle, lineHeight: 1.5 }}>→ {inp}</div>
              ))}
            </div>
          )}
          {step.outputs?.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.copper, marginBottom: 4 }}>OUTPUTS</div>
              {step.outputs.map((out, i) => (
                <div key={i} style={{ fontSize: 11, color: palette.subtitle, lineHeight: 1.5 }}>← {out}</div>
              ))}
            </div>
          )}
          {step.validation && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.copper, marginBottom: 4 }}>VALIDATION</div>
              <div style={{ fontSize: 11, color: palette.success, lineHeight: 1.5 }}>✓ {step.validation}</div>
            </div>
          )}
        </div>

        {/* Substeps (L2/L3) */}
        {(level === "L2" || level === "L3") && step.substeps?.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${palette.borderLineLight}`, paddingTop: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.navy, marginBottom: 6 }}>SUBSTEPS</div>
            {step.substeps.map((sub, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, marginBottom: 6,
                padding: "6px 10px",
                border: `1px solid ${palette.borderLineLight}`,
                borderLeft: `3px solid ${palette.navy}`,
                background: palette.navyMuted,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: palette.navy, flexShrink: 0 }}>{sub.substep}</span>
                <span style={{ fontSize: 11, color: palette.text, lineHeight: 1.5 }}>{sub.details}</span>
              </div>
            ))}
          </div>
        )}

        {/* Checklist (L3) */}
        {level === "L3" && step.checklist?.length > 0 && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${palette.borderLineLight}`, paddingTop: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.amber, marginBottom: 6 }}>CHECKLIST</div>
            {step.checklist.map((item, i) => (
              <div key={i} style={{ fontSize: 11, color: palette.text, marginBottom: 3, display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: palette.borderLine, fontFamily: "monospace" }}>☐</span>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Acceptance tests (L3) */}
        {level === "L3" && step.acceptance_tests?.length > 0 && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${palette.borderLineLight}`, paddingTop: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.success, marginBottom: 6 }}>ACCEPTANCE TESTS</div>
            {step.acceptance_tests.map((test, i) => (
              <div key={i} style={{
                fontSize: 11, color: palette.text, marginBottom: 4,
                padding: "4px 8px",
                border: `1px solid ${palette.sectionBorder}`,
                borderLeft: `3px solid ${palette.success}`,
                background: palette.successBg,
              }}>
                ✦ {test}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}