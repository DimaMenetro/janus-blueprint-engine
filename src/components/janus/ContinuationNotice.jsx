import { GitBranch } from "lucide-react";
import { glassBtn } from "@/components/ui/LiquidGlass";

const note = (t, strong) => ({ margin: "10px 0 0", fontSize: 12, color: strong ? t.text : t.subtitle });

// A stage version whose last call failed with attempts left: what Resume will do, or why it could not.
export default function ContinuationNotice({ state, blocked, onStartNew, busy, t }) {
  const row = state.awaiting;
  // Shown before Resume is clicked: what Resume does with a stage whose last version settled as failed.
  const failed = state.resumable ? state.failures.filter(f => !f.superseded && f.key !== "qualification") : [];
  const left = failed.filter(f => f.rerunOnly);
  const released = failed.filter(f => !f.rerunOnly);
  if (!row) {
    if (!failed.length) return null;
    return (
      <>
        {left.length > 0 && (
          <p style={note(t)}>
            Resuming does not run {left.map(f => f.key).join(", ")} again: its last version failed for good ({left.map(f => `${f.evidence}${f.attempts > 1 ? `, ${f.attempts} attempts` : ""}`).join("; ")}). Resume finishes the remaining stages and closes the run without it. A new version comes only from an explicit re-run, in Stage lineage.
          </p>
        )}
        {released.length > 0 && (
          <p style={note(t)}>
            Resuming starts a new version of {released.map(f => f.key).join(", ")}, because you closed its earlier version before its attempt limit was used.
          </p>
        )}
      </>
    );
  }
  if (!blocked) {
    return (
      <p style={note(t)}>
        The last call for {row.label} failed ({row.lastEvidence}). Resuming continues the same version at attempt {row.nextAttempt} of {state.maxAttempts}. The attempt limit is not reset.
      </p>
    );
  }
  return (
    <div>
      <p style={note(t, true)}>
        {row.label} was not continued, because it is no longer the same operation: {blocked.reasons.join("; ")}. Nothing was started.
      </p>
      <button onClick={onStartNew} disabled={busy} style={{ ...glassBtn(t), minHeight: 40, padding: "0 16px", fontSize: 13, marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
        <GitBranch style={{ width: 14, height: 14 }} />Close this version to start a new one
      </button>
    </div>
  );
}