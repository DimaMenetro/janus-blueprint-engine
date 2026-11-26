/**
 * JANUS COMPLETION IMPACT — Phase 9 (pure, no I/O).
 * What it takes for a run to hold a valid, current revision of every stage of its plan — computed from the durable
 * lineage and the compiler's own declarations (stagePlan, requiredInputs, declaredInputs), so it holds for any
 * stage the plan has or gains (the Blueprint sub-stages included) with no stage named here.
 *
 * Three operations stay distinct:
 *   - CONTINUATION (Resume)   the same revision, its next attempt. Open runs only. Never here.
 *   - REGENERATION (Re-run)   the operator names stages; their valid revisions are superseded.
 *   - COMPLETION (this)       nothing valid and current is touched. A stage is planned only for one of the reasons
 *                             below, each shown to the operator before anything starts:
 *       unproduced   it has no revision that holds an artifact (never run: its prerequisites were unavailable, or
 *                    the run ended first)
 *       failed       its newest revision settled as failed and no valid one exists (a new revision: its own limit)
 *       stale        its valid revision reads a superseded input, or was compiled without one that exists now
 *       follows      valid and current now, but it reads a stage planned here, so it becomes stale once that
 *                    stage is produced. Regenerated only if that actually happens.
 *       repair       (opt-in) its valid revision fails today's mandatory stage integrity
 *
 * A stage whose input fails today's integrity (and is not being repaired), or whose required input cannot be
 * produced, is `blocked` and says why. `token` binds the preview to the exact durable state it was computed from.
 */
import { STORAGE_MODEL, QUALIFICATION_KEY, revisionLabel } from "@/lib/janus/stageModel";
import { requiredInputs } from "@/lib/janus/stageCompiler";
import { declaredInputs } from "@/lib/janus/runView";
import { stagePlan, stageLabel, continuationOf } from "@/lib/janus/executionState";
import { inputIntegrity } from "@/lib/janus/qualification";
import { viewSignature } from "@/lib/janus/rerunImpact";

export const COMPLETION_REASONS = {
  unproduced: "Never produced",
  failed: "Failed earlier — a new version",
  stale: "Out of date — reads a replaced input",
  follows: "Reads a stage produced here",
  repair: "Fails today's integrity checks — replaced",
};

export function completionImpact(view, { repair = false } = {}) {
  const { run, stageInfo } = view;
  const staged = view.storage === STORAGE_MODEL.staged;
  const plan = staged ? stagePlan(run.execution_mode) : [];
  const item = (key, extra = {}) => ({ key, label: stageLabel(key), id: stageInfo[key]?.active?.id || key,
    revision: stageInfo[key]?.active ? `${revisionLabel(stageInfo[key].active)} → new` : "new", ...extra });

  // Valid revisions that fail today's mandatory integrity (recorded under an earlier validator).
  const findings = plan.map(key => ({ key, errors: inputIntegrity(view, key) })).filter(f => f.errors.length)
    .map(f => ({ ...f, label: stageLabel(f.key), revision: revisionLabel(stageInfo[f.key].active), id: stageInfo[f.key].active.id }));
  const unfit = new Set(findings.map(f => f.key));

  const planned = [], blocked = [], kept = [];
  const produced = new Set(); // planned here, in order
  const lost = new Set();     // cannot be produced by this operation
  for (const key of plan) {
    const info = stageInfo[key];
    const reason = !info?.active ? (info?.latest?.status === "failed" ? "failed" : "unproduced")
      : info.stale ? "stale"
      : repair && unfit.has(key) ? "repair"
      : declaredInputs(key).some(k => produced.has(k)) ? "follows" : null;
    if (!reason) { kept.push({ key, label: stageLabel(key), id: info.active.id, revision: revisionLabel(info.active) }); continue; }
    const absent = requiredInputs(key, run.execution_mode).filter(k => lost.has(k) || (!stageInfo[k]?.active && !produced.has(k)));
    const bad = declaredInputs(key).filter(k => unfit.has(k) && !produced.has(k) && stageInfo[k]?.active);
    if (absent.length || bad.length) {
      lost.add(key);
      blocked.push(item(key, { reason, why: bad.length
        ? `its input ${bad.map(stageLabel).join(", ")} fails today's integrity checks`
        : `it needs ${absent.map(stageLabel).join(", ")}, which this cannot produce` }));
      // A valid revision that stays in use is still current: nothing that reads it becomes stale.
      continue;
    }
    produced.add(key);
    planned.push(item(key, { reason, detail: reason === "stale" ? info.stale : reason === "failed" ? info.latest.error_message : null }));
  }

  const refusals = [];
  if (!staged) refusals.push("historical runs are completed through an explicit re-run");
  else {
    if (run.refresh_enabled && produced.has("refresh")) refusals.push("live Refresh is unavailable (fail-closed)");
    if (run.status === "cancel_requested") refusals.push("cancellation was requested for this run; nothing new is started");
    const running = Object.values(stageInfo).map(i => i.latest).find(s => s?.status === "running");
    if (running) {
      const waiting = continuationOf(running, view.attempts?.[running.id]);
      const how = running.stage_key === QUALIFICATION_KEY ? "Continue the evaluation" : "Resume the run";
      refusals.push(waiting ? `${running.stage_key} is waiting for its retry (attempt ${waiting.nextAttempt}). ${how} to continue it first.`
        : `a call for ${running.stage_key} has not settled and its outcome is unknown`);
    } else if (run.status === "running") refusals.push("this run has not finished. Resume it first; completion then produces what it left unproduced");
    if (!planned.length && !refusals.length) refusals.push(blocked.length ? "every stage it lacks is blocked" : "every stage of this run's plan has a valid, current version");
  }

  const blueprintTouched = produced.has("blueprint");
  return {
    token: `${viewSignature(view)}#complete#${repair ? 1 : 0}`,
    repair, plan: planned.map(p => p.key), planned, blocked, kept, findings,
    // Active revisions the operator chose to replace (repair): the engine regenerates exactly these.
    replace: planned.filter(p => p.reason === "repair").map(p => stageInfo[p.key].active.id),
    qualification: { next: !blueprintTouched ? "unchanged" : "re_evaluated", evaluationInvalidated: blueprintTouched && !!stageInfo[QUALIFICATION_KEY]?.active,
      releaseWithdrawn: blueprintTouched && !!run.released_blueprint_stage_id },
    refusals,
  };
}