import { useCallback, useEffect, useState } from "react";
import { Play, X, Loader2 } from "lucide-react";
import { glassBtn } from "@/components/ui/LiquidGlass";
import { previewRerun, rerunStages, STALE_PREVIEW_MESSAGE } from "@/lib/janus/browserAdapter";
import { stageLabel } from "@/lib/janus/executionState";
import { useExecution } from "@/components/janus/ExecutionContext";
import ImpactSection from "@/components/janus/ImpactSection";
import ImpactQualificationNote from "@/components/janus/ImpactQualificationNote";

const btn = (t) => ({ ...glassBtn(t), minHeight: 40, padding: "0 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" });

// Shows exactly what an explicit re-run will create, invalidate and leave alone — before anything starts.
// Confirming executes THIS preview: if the run changed meanwhile, nothing starts and the preview is recomputed.
export default function RerunImpactPreview({ runId, targets, title, t, onDone, onClose }) {
  const { drive, busy } = useExecution();
  const [cascade, setCascade] = useState(false);
  const [impact, setImpact] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const wanted = targets.join(",");

  const load = useCallback(async () => {
    setImpact(null);
    setImpact(await previewRerun(runId, { targets: wanted.split(","), cascade }));
  }, [runId, wanted, cascade]);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);

  const confirm = async () => {
    setError(null);
    setRunning(true);
    try {
      const r = await drive(hooks => rerunStages(runId, { targets: impact.targets, cascade, expected: impact.token }, hooks));
      if (r.unresolved) setError(`Stopped: a call for ${r.unresolved} has not settled`);
      else if (!r.success) setError(`Completed with errors: ${r.errors.join("; ")}`);
      await onDone();
      if (r.success) onClose();
    } catch (e) {
      setError(e.message);
      if (e.message === STALE_PREVIEW_MESSAGE) await load();
    } finally {
      setRunning(false);
    }
  };

  if (!impact) return <div style={{ marginTop: 10, fontSize: 12, color: t.subtitle, display: "flex", gap: 6, alignItems: "center" }}><Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />Computing impact…</div>;
  const current = Object.fromEntries(impact.supersedes.map(s => [s.key, s.revision]));
  const planned = impact.plan.map(k => ({ key: k, label: stageLabel(k), revision: current[k] ? `${current[k]} → new` : "new" }));
  const affected = impact.cascade ? impact.cascadeKeys.length : impact.invalidated.length + impact.alreadyStale.length;
  const blocked = impact.refusals.length > 0;

  return (
    <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 16, border: `1px solid ${t.surfaceBorder}`, background: t.surface }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.title }}>Impact of re-running {title}</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, color: t.text, minHeight: 32, cursor: "pointer" }}>
        <input type="checkbox" checked={cascade} onChange={e => setCascade(e.target.checked)} disabled={running} />
        Also regenerate the stages it makes stale{affected ? ` (${affected})` : ""}
      </label>
      <ImpactSection title="New versions" items={planned} tone="new" note="Earlier versions are kept and stay inspectable." t={t} />
      <ImpactSection title="Becomes stale" items={impact.invalidated} tone="warn" note="These read what is being replaced. They stay in use but are marked stale until re-run." t={t} />
      <ImpactSection title="Already stale" items={impact.alreadyStale} tone="warn" t={t} />
      <ImpactSection title="Unchanged" items={impact.unaffected} t={t} />
      <ImpactQualificationNote qualification={impact.qualification} t={t} />
      <p style={{ margin: "10px 0 0", fontSize: 11, color: t.subtitle }}>This applies once the new versions succeed. A new version that fails leaves the current one in use and invalidates nothing.</p>
      {impact.refusals.map((r, i) => <p key={i} style={{ margin: "8px 0 0", fontSize: 12, color: t.text }}>Cannot re-run now: {r}</p>)}
      {error && <p style={{ margin: "8px 0 0", fontSize: 12, color: t.text }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={confirm} disabled={blocked || running || busy} style={{ ...btn(t), opacity: blocked || running || busy ? 0.5 : 1 }}>
          {running ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Play style={{ width: 14, height: 14 }} />}
          {running ? "Re-running…" : "Confirm re-run"}
        </button>
        <button onClick={onClose} disabled={running} style={{ ...btn(t), background: "transparent", color: t.text, boxShadow: "none", border: `1px solid ${t.surfaceBorder}` }}>
          <X style={{ width: 14, height: 14 }} />Cancel
        </button>
      </div>
    </div>
  );
}