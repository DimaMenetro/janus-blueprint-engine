import { useCallback, useEffect, useState } from "react";
import { Play, Loader2, ListChecks } from "lucide-react";
import { glassBtn, glassSurface } from "@/components/ui/LiquidGlass";
import { previewCompletion, completeJanus, STALE_PREVIEW_MESSAGE } from "@/lib/janus/browserAdapter";
import { COMPLETION_REASONS } from "@/lib/janus/completionImpact";
import { useExecution } from "@/components/janus/ExecutionContext";
import ImpactSection from "@/components/janus/ImpactSection";
import ImpactQualificationNote from "@/components/janus/ImpactQualificationNote";

// Operator control: produce what a finished run never produced (or holds only out of date), after showing exactly
// which stages and why. Valid, current versions are listed as kept and are not regenerated.
export default function CompletionControls({ view, t, isAdmin = false, onChanged }) {
  const { drive, busy } = useExecution();
  const [repair, setRepair] = useState(false);
  const [impact, setImpact] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const runId = view.run.id;
  const signature = view.lineage.map(s => `${s.id}:${s.status}`).join("|") + view.run.status;

  const load = useCallback(async () => setImpact(await previewCompletion(runId, { repair })), [runId, repair]);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load, signature]);

  if (!isAdmin || view.storage !== "staged_v1" || !impact) return null;
  if (!impact.planned.length && !impact.blocked.length && !impact.findings.length) return null;

  const confirm = async () => {
    setError(null);
    setRunning(true);
    try {
      const r = await drive(hooks => completeJanus(runId, { repair, expected: impact.token }, hooks));
      if (r.unresolved) setError(`Stopped: a call for ${r.unresolved} has not settled`);
      else if (!r.success) setError(`Finished with errors: ${r.errors.join("; ")}`);
      await onChanged();
    } catch (e) {
      setError(e.message);
      if (e.message === STALE_PREVIEW_MESSAGE) await load();
    } finally {
      setRunning(false);
    }
  };

  const byReason = Object.keys(COMPLETION_REASONS).map(reason => ({ reason, items: impact.planned.filter(p => p.reason === reason) }));
  const disabled = impact.refusals.length > 0 || running || busy;

  return (
    <div style={{ ...glassSurface(t), padding: "14px 18px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: t.title }}>
        <ListChecks style={{ width: 15, height: 15 }} />Complete this run
      </div>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: t.subtitle }}>Produces only what this run lacks. Valid, current versions are kept as they are.</p>

      {byReason.map(g => <ImpactSection key={g.reason} title={COMPLETION_REASONS[g.reason]} items={g.items} tone="new" t={t} />)}
      <ImpactSection title="Cannot be produced yet" items={impact.blocked} tone="warn" t={t} />
      {impact.blocked.map(b => <p key={b.key} style={{ margin: "4px 0 0", fontSize: 11, color: t.subtitle }}>{b.label}: {b.why}.</p>)}
      <ImpactSection title="Kept" items={impact.kept} t={t} />

      {impact.findings.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.title }}>Fails today's integrity checks ({impact.findings.length})</div>
          {impact.findings.map(f => (
            <p key={f.key} style={{ margin: "4px 0 0", fontSize: 11, color: t.text, overflowWrap: "anywhere" }}>{f.label} {f.revision}: {f.errors.join("; ")}</p>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 12, color: t.text, minHeight: 32, cursor: "pointer" }}>
            <input type="checkbox" checked={repair} onChange={e => setRepair(e.target.checked)} disabled={running} />
            Also replace these with new versions (stages that read them follow)
          </label>
        </div>
      )}

      {impact.planned.length > 0 && <ImpactQualificationNote qualification={impact.qualification} t={t} />}
      {impact.refusals.map((r, i) => <p key={i} style={{ margin: "8px 0 0", fontSize: 12, color: t.text }}>Cannot start now: {r}</p>)}
      {error && <p style={{ margin: "8px 0 0", fontSize: 12, color: t.text, overflowWrap: "anywhere" }}>{error}</p>}

      <button onClick={confirm} disabled={disabled}
        style={{ ...glassBtn(t), marginTop: 12, minHeight: 40, padding: "0 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
        {running ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Play style={{ width: 14, height: 14 }} />}
        {running ? "Completing…" : `Produce ${impact.planned.length} stage${impact.planned.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}