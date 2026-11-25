import { useState } from "react";
import { Play, Ban, AlertTriangle, SearchCheck } from "lucide-react";
import { glassSurface, glassBtn } from "@/components/ui/LiquidGlass";
import { useExecution } from "@/components/janus/ExecutionContext";
import { resumeJanus, requestCancel, reconcileJanus } from "@/lib/janus/browserAdapter";

const DOT = { completed: "#22c55e", live: "#3b82f6", failed: "#ef4444", pending: "rgba(148,163,184,0.45)" };
const btn = (t) => ({ ...glassBtn(t), minHeight: 40, padding: "0 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" });

// Durable execution state for one run: what is saved, what is in flight, what failed, and the operator's controls.
export default function ExecutionStatePanel({ state, runId, t, onChanged }) {
  const { drive, observe, busy } = useExecution();
  const [error, setError] = useState(null);
  if (!state.staged) return null;

  const act = (fn) => async () => {
    setError(null);
    try { await fn(); } catch (e) { setError(e.message); }
    await onChanged();
  };
  const resume = act(() => drive(hooks => resumeJanus(runId, hooks)));
  const reconcile = act(async () => {
    const { settled } = await reconcileJanus(runId);
    await observe(runId);
    if (!settled) throw new Error("No outcome is recorded for that call yet. It stays unresolved.");
  });
  const cancel = act(async () => { await requestCancel(runId); await observe(runId); });

  return (
    <div style={{ ...glassSurface(t), padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{state.label}</span>
        <span style={{ fontSize: 12, color: t.subtitle }}>{state.completed}/{state.total} stages saved</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10 }}>
        {state.rows.map(r => (
          <span key={r.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: r.state === "pending" ? t.muted : t.text }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: DOT[r.state], flexShrink: 0 }} />
            {r.label}{r.state === "live" ? " · in progress" : r.state === "failed" ? " · failed" : ""}
            {r.state === "live" && r.attempts > 1 ? ` (attempt ${r.attempts} of ${state.maxAttempts})` : ""}
          </span>
        ))}
      </div>

      {state.failures.map(f => (
        <div key={f.key} style={{ marginTop: 8, fontSize: 12, color: t.text, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <AlertTriangle style={{ width: 13, height: 13, marginTop: 2, flexShrink: 0 }} />
          <span>{f.message} <span style={{ color: t.subtitle }}>({f.evidence}{f.attempts > 1 ? ` · ${f.attempts} attempts` : ""}{f.superseded ? " · an earlier valid version is still in use" : ""})</span></span>
        </div>
      ))}

      {state.status === "cancel_requested" && state.live && (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: t.subtitle }}>
          The call for {state.live.label} cannot be stopped mid-flight. Its result will be saved, then nothing further starts.
        </p>
      )}
      {state.unresolved && (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: t.subtitle }}>
          A call for {state.live.label} was started in a session that is no longer reporting, so nothing further is started for this run. Checking reads what the server recorded: a finished call is saved with its real result, a call that never started is closed, and anything else stays unresolved. It cannot be marked as ended by hand.
        </p>
      )}

      {state.endedIncomplete && (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: t.subtitle }}>
          This run has ended and is not resumed. Stages it lacks can only be produced by a re-run, which creates a new version.
        </p>
      )}

      {(state.resumable || state.cancellable || state.unresolved) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {state.unresolved && <button onClick={reconcile} disabled={busy} style={{ ...btn(t), opacity: busy ? 0.5 : 1 }}><SearchCheck style={{ width: 14, height: 14 }} />Check recorded outcome</button>}
          {state.resumable && <button onClick={resume} disabled={busy} style={{ ...btn(t), opacity: busy ? 0.5 : 1 }}><Play style={{ width: 14, height: 14 }} />Resume from saved stages</button>}
          {state.cancellable && <button onClick={cancel} style={btn(t)}><Ban style={{ width: 14, height: 14 }} />Cancel after current stage</button>}
        </div>
      )}
      {error && <p style={{ margin: "10px 0 0", fontSize: 12, color: t.text }}>{error}</p>}
    </div>
  );
}