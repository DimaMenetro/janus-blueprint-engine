import { substrateFindings } from "@/lib/janus/qualification";

const line = (t, strong) => ({ margin: "8px 0 0", fontSize: 12, color: strong ? t.text : t.subtitle });

// What stands between the run and protocol completion, what is recorded but not confirmed, and what code corrected.
export default function CompletionFindings({ view, completion, t }) {
  const substituted = new Set(substrateFindings(view).blocking);
  const onlySubstitution = completion.blocking.length > 0 && completion.blocking.every(b => substituted.has(b));
  const headline = completion.completion_label
    || (onlySubstitution ? "Not protocol-complete — a stage was answered by another model than the one it was fixed to." : "Not protocol-complete — the run is missing required content.");
  return (
    <>
      <p style={line(t)}>{headline}</p>
      {completion.blocking.map((b, i) => <p key={i} style={line(t, true)}>{substituted.has(b) ? "Another model answered — " : "Missing: "}{b}</p>)}
      {(completion.warnings || []).map((w, i) => <p key={`w${i}`} style={line(t)}>Note: {w}.</p>)}
      {completion.confidence_corrections.map(c => (
        <p key={c.id} style={line(t)}>Confidence of {c.id} set by code to {c.to} (the model wrote {c.from || "nothing"}).</p>
      ))}
    </>
  );
}