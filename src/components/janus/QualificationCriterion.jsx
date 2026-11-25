const METHOD = { deterministic: "checked by code", traceability: "traced by code", critique: "independent evaluation" };
const TONE = { pass: "#22c55e", fail: "#ef4444" };
const title = (id) => id.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

// One quality criterion: what it demands, how it is checked, the verdict and the evidence for it.
export default function QualificationCriterion({ criterion, t }) {
  const { id, method, standard, applies, rule, verdict, reasons } = criterion;
  const known = verdict === "pass" || verdict === "fail";
  const status = !applies ? "Not applicable" : verdict == null ? "Not evaluated" : known ? (verdict === "pass" ? "Pass" : "Fail") : `Invalid verdict (${verdict}) — counts as fail`;
  const color = !applies || verdict == null ? "rgba(148,163,184,0.6)" : TONE[verdict] || TONE.fail;

  return (
    <div style={{ padding: "8px 0", borderTop: `1px solid ${t.surfaceBorder}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0, alignSelf: "center" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{title(id)}</span>
        <span style={{ fontSize: 12, color: t.text }}>{status}</span>
        <span style={{ fontSize: 11, color: t.subtitle, marginLeft: "auto" }}>{METHOD[method]}</span>
      </div>
      <p style={{ margin: "3px 0 0 16px", fontSize: 12, color: t.subtitle }}>{standard}</p>
      {!applies && rule && (
        <p style={{ margin: "3px 0 0 16px", fontSize: 12, color: t.subtitle }}>Applies only under the contract rule “{rule.replace(/_/g, " ")}”, which is not met for this run.</p>
      )}
      {applies && reasons.map((r, i) => (
        <p key={i} style={{ margin: "3px 0 0 16px", fontSize: 12, color: t.text }}>{r}</p>
      ))}
    </div>
  );
}