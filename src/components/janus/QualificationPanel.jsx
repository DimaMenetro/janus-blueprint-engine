import { useState } from "react";
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronRight } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";
import { deriveQualification } from "@/lib/janus/qualification";
import QualificationCriterion from "@/components/janus/QualificationCriterion";
import EvaluationControls from "@/components/janus/EvaluationControls";
import EvaluatorFindings from "@/components/janus/EvaluatorFindings";

const PENDING = {
  in_progress: "The independent evaluation is running.",
  awaiting_evaluation: "The independent evaluation has not run for this Blueprint version yet.",
  awaiting_retry: "The independent evaluation is waiting for its retry.",
};
const line = (t, strong) => ({ margin: "8px 0 0", fontSize: 12, color: strong ? t.text : t.subtitle });

// Completion and quality qualification for one run — derived from durable stage records, never stored.
export default function QualificationPanel({ view, t, isAdmin = false, onChanged = async () => {} }) {
  const [open, setOpen] = useState(false);
  if (view.storage !== "staged_v1") return null;
  const q = deriveQualification(view);
  const { completion, release } = q;
  const Icon = release.released ? ShieldCheck : ShieldAlert;
  const Chevron = open ? ChevronDown : ChevronRight;
  const failed = q.criteria.filter(c => c.applies && c.verdict != null && c.verdict !== "pass");

  return (
    <div style={{ ...glassSurface(t), padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon style={{ width: 16, height: 16, color: release.released ? "#22c55e" : t.subtitle, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{release.label}</span>
      </div>
      <p style={line(t)}>{completion.completion_label || "Not protocol-complete — the run is missing required content."}</p>
      {completion.blocking.map((b, i) => <p key={i} style={line(t, true)}>Missing: {b}</p>)}
      {completion.confidence_corrections.map(c => (
        <p key={c.id} style={line(t)}>Confidence of {c.id} set by code to {c.to} (the model wrote {c.from || "nothing"}).</p>
      ))}
      {q.blocked && completion.complete && <p style={line(t)}>{q.blocked}</p>}
      {PENDING[q.pending] && <p style={line(t)}>{PENDING[q.pending]}</p>}
      {q.pending === "evaluation_failed" && <p style={line(t, true)}>The independent evaluation did not complete, so nothing is released: {q.evaluationError}</p>}
      {failed.length > 0 && <p style={line(t, true)}>Not qualified: {failed.length} of {q.criteria.filter(c => c.applies).length} criteria failed. Refinement is required before release.</p>}
      {q.strongestObjection && <p style={line(t)}>Strongest objection: {q.strongestObjection}</p>}
      {isAdmin && <EvaluationControls q={q} runId={view.run.id} t={t} onChanged={onChanged} />}

      {!q.blocked && (
        <button onClick={() => setOpen(!open)} style={{ marginTop: 10, minHeight: 40, background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: t.text }}>
          <Chevron style={{ width: 14, height: 14 }} />Quality criteria ({q.criteria.filter(c => c.verdict === "pass").length} of {q.criteria.filter(c => c.applies).length} passed)
        </button>
      )}
      {open && !q.blocked && q.criteria.map(c => <QualificationCriterion key={c.id} criterion={c} t={t} />)}
      {open && !q.blocked && <EvaluatorFindings findings={q.findings} t={t} />}
    </div>
  );
}