import { useState } from "react";
import { Play, RotateCcw, GitBranch } from "lucide-react";
import { glassBtn } from "@/components/ui/LiquidGlass";
import { evaluateJanus, closeBlockedRevision } from "@/lib/janus/browserAdapter";
import { useExecution } from "@/components/janus/ExecutionContext";

const btn = (t, off) => ({ ...glassBtn(t), minHeight: 40, padding: "0 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", opacity: off ? 0.5 : 1 });
const line = (t, strong) => ({ margin: "8px 0 0", fontSize: 12, color: strong ? t.text : t.subtitle });

// The evaluation pathway of a completed run: continue a waiting evaluation, run the first one, or — explicitly —
// start a new evaluation version after one settled without verdicts. Run completion is never touched here.
export default function EvaluationControls({ q, runId, t, onChanged }) {
  const { drive, busy } = useExecution();
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const act = (fn) => async () => {
    setError(null);
    try { await fn(); } catch (e) { setError(e.message); }
    await onChanged();
  };
  const evaluate = (newVersion) => act(async () => {
    const r = await drive(hooks => evaluateJanus(runId, { newVersion }, hooks));
    setBlocked(r.blocked);
    if (r.unresolved) throw new Error("The evaluation call has not settled; its outcome is unknown.");
  });
  const closeBlocked = act(async () => { await closeBlockedRevision(runId); setBlocked(null); });
  const action = q.evaluationAction;
  if (!action && !blocked) return null;

  return (
    <div>
      {action === "continue" && <p style={line(t)}>The last evaluation call failed and a retry is pending. Continuing uses the same evaluation version at attempt {q.evaluationRetry.nextAttempt}; the attempt limit is not reset.</p>}
      {action === "new_version" && <p style={line(t)}>The evaluation of this Blueprint version settled without verdicts{q.lastEvaluationError ? ` (${q.lastEvaluationError})` : ""}. Another evaluation is a new version with its own attempt limit, and only starts on your decision.</p>}
      {blocked && <p style={line(t, true)}>The evaluation was not continued, because it is no longer the same operation: {blocked.reasons.join("; ")}. Nothing was started.</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {blocked && <button onClick={closeBlocked} disabled={busy} style={btn(t, busy)}><GitBranch style={{ width: 14, height: 14 }} />Close this version to start a new one</button>}
        {!blocked && action === "continue" && <button onClick={evaluate(false)} disabled={busy} style={btn(t, busy)}><Play style={{ width: 14, height: 14 }} />Continue evaluation</button>}
        {!blocked && action === "start" && <button onClick={evaluate(false)} disabled={busy} style={btn(t, busy)}><Play style={{ width: 14, height: 14 }} />Run evaluation</button>}
        {!blocked && action === "new_version" && <button onClick={evaluate(true)} disabled={busy} style={btn(t, busy)}><RotateCcw style={{ width: 14, height: 14 }} />Start a new evaluation version</button>}
      </div>
      {error && <p style={line(t, true)}>{error}</p>}
    </div>
  );
}