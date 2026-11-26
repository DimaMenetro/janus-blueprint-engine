const PRESERVED = { yes: "preserved", partly: "only partly preserved", no: "replaced" };

function Group({ label, items, t }) {
  if (!Array.isArray(items)) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.title }}>{label}</div>
      {items.length === 0 && <p style={{ margin: "3px 0 0", fontSize: 12, color: t.subtitle }}>None recorded.</p>}
      {items.map((x, i) => <p key={i} style={{ margin: "3px 0 0", fontSize: 12, color: t.text }}>{x}</p>)}
    </div>
  );
}

// What the independent evaluator recorded about the difference between what was asked and what came back.
// The criteria above are held to these findings by code.
export default function EvaluatorFindings({ findings, t }) {
  if (!findings || Object.values(findings).every(v => v == null)) return null;
  const kept = findings.objective_preservation;
  return (
    <div style={{ paddingTop: 8, marginTop: 8, borderTop: `1px solid ${t.surfaceBorder}` }}>
      <div style={{ fontSize: 12, color: t.subtitle }}>Evaluator findings</div>
      <Group label="Added beyond the operator's own material" items={findings.intellectual_surplus} t={t} />
      <Group label="Restates the operator's material" items={findings.input_restatement} t={t} />
      {kept && (
        <Group label="Operator objective" t={t} items={[`${PRESERVED[kept.preserved] || kept.preserved}${kept.lost?.length ? ` — lost: ${kept.lost.join("; ")}` : ""}`]} />
      )}
      <Group label="Errors of substance" t={t} items={findings.substantive_errors?.map(e => `${e.severity ? `${e.severity}: ` : ""}${e.error}`)} />
    </div>
  );
}