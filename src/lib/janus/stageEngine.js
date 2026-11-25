/**
 * JANUS CANONICAL STAGE ENGINE — Phase 4.
 * One implementation of: stage context → compile → invoke → parse → validate → persist → report.
 * It is independent of who schedules it. Adapters (browser today, server later) choose WHICH stage keys
 * to ask for; they never build prompts, call the model or decide what counts as completed.
 */
import { STAGE_ORDER } from "@/lib/janus/protocolRegistry";
import { STORAGE_MODEL, QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { outcomeAfterStageFailure } from "@/lib/janus/lifecycleContract";
import { completionOf, deriveQualification } from "@/lib/janus/qualification";
import { loadRunView, updateRun } from "@/lib/janus/stageStore";
import { runStage } from "@/lib/janus/stageRunner";
import { compileStage, stageInputs, requiredInputs } from "@/lib/janus/stageCompiler";
import { stageFailures } from "@/lib/janus/executionState";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { generateMarkdown } from "@/components/janus/promptUtils";

const MAX_RAW_JSON_LENGTH = 200000;
const MAX_MD_LENGTH = 60000;
const cap = (s, max) => (s.length <= max ? s : `${s.slice(0, max)}\n\n[TRUNCATED — original was ${s.length} chars]`);

export const configOf = (run) => ({
  queryText: run.query_text,
  executionMode: run.execution_mode,
  outputMode: run.output_mode,
  blueprintLevel: run.blueprint_level || "L2",
  noveltyDial: run.novelty_dial || "medium",
  refreshEnabled: !!run.refresh_enabled,
});

/**
 * Execute one stage against the durable view. Inputs and exact dependency revisions are whatever the view
 * holds as active. Returns { record } | { failure } (both settled), { skipped } (a required input is absent),
 * { refused } (no call was made for the new revision) or { unresolved } (outcome unknown, nothing settled).
 */
export async function executeStage({ view, stageKey, origin, evidence = [], onBegan }) {
  const active = (k) => view.stageInfo[k]?.active;
  const missing = requiredInputs(stageKey).filter(k => !active(k));
  if (missing.length) return { skipped: { stageKey, missing } };
  const inputKeys = stageInputs(stageKey).filter(active);
  const compiled = compileStage({
    stageKey, config: configOf(view.run), evidence,
    inputs: Object.fromEntries(inputKeys.map(k => [k, active(k).output])),
  });
  return runStage({
    runId: view.run.id, stageKey, origin, onBegan,
    revision: (view.stageInfo[stageKey]?.max_revision || 0) + 1,
    dependsOn: inputKeys.map(k => active(k).id),
    templateVersion: compiled.templateVersion, sources: compiled.sources,
    prompt: compiled.prompt, parseKey: compiled.parseKey,
    staged: view.storage === STORAGE_MODEL.staged, // only a staged run has an execution slot
  });
}

/**
 * Advance through `keys` in order, reading durable state before every stage.
 *  - a stage that already has a valid revision is not regenerated (unless `force`: an explicit rerun);
 *  - while ANY stage of the run has a revision still running, its call is unresolved (outcome unknown):
 *    nothing is started over it or beside it, for a resume or a rerun, and the drive stops;
 *  - a persisted cancellation stops scheduling at the next stage boundary, whichever session persisted it
 *    (`cancel_requested`, or `cancelled` when another session cancelled while nothing was in flight);
 *  - a stage whose call outcome is unknown stops the drive: nothing was settled and nothing follows it;
 *  - a stage for which no call was made (the function refused it) stops the drive and leaves the run open.
 * Retries happen inside a stage, only after the previous attempt settled (stageRunner).
 * Ends as { errors } | { errors, cancelled } | { errors, unresolved } | { errors, refused }.
 */
export async function driveStages({ runId, keys, origin, force = false, onDurableChange = async () => {} }) {
  const errors = [];
  for (const stageKey of keys) {
    const view = await loadRunView(runId);
    const staged = view.storage === STORAGE_MODEL.staged;
    const live = Object.values(view.stageInfo).find(i => i.latest?.status === "running");
    if (live) return { errors, unresolved: live.key };
    if (staged && ["cancel_requested", "cancelled"].includes(view.run.status)) return { errors, cancelled: true };
    if (!force && view.stageInfo[stageKey]?.active) continue;

    const res = await executeStage({ view, stageKey, origin, onBegan: () => onDurableChange(runId) });
    if (res.skipped) continue;
    if (res.unresolved) return { errors, unresolved: res.unresolved }; // outcome unknown: nothing was settled, nothing follows
    if (res.refused) {
      // The function made no call for this stage, so there is no outcome to record against it.
      await onDurableChange(runId);
      // It refused because a cancellation is persisted: that is the cancellation taking effect, not an error.
      if (res.refused.reason === "cancel_requested") return { errors, cancelled: true };
      // Anything else (another call of this run is live, the session is no longer allowed): the run is not
      // closed on a stage that never ran. It stays open and can be resumed.
      errors.push(res.refused.message);
      return { errors, refused: { stageKey, reason: res.refused.reason } };
    }
    if (res.failure) errors.push(res.failure.message);
    if (staged) await updateRun(runId, { current_stage: stageKey });
    await onDurableChange(runId);
  }
  return { errors };
}

/** Persist what the durable stages say: lifecycle, completion manifest, qualification state, release, caches. */
async function persistClose(view, lifecycle) {
  const { run, artifacts } = view;
  const q = deriveQualification(view, lifecycle);
  const { mode, partial, complete, completion_label, blocking, warnings, confidence_corrections } = q.completion;
  const { normalized } = validateJanusOutput(artifacts, STAGE_ORDER.filter(k => artifacts[k]));
  const errors = [...blocking, ...stageFailures(view).map(f => f.message)];
  await updateRun(run.id, {
    status: lifecycle,
    completion_manifest: { mode, partial, complete, completion_label, blocking, warnings, confidence_corrections },
    qualification_state: q.state,
    released_blueprint_stage_id: q.release.released ? q.blueprintStageId : "",
    render_md: cap(generateMarkdown(normalized, run.execution_mode), MAX_MD_LENGTH),
    raw_json: cap(JSON.stringify(normalized), MAX_RAW_JSON_LENGTH),
    validation_errors: errors,
    ...(lifecycle === "failed" ? { error_message: errors.join("\n") } : {}),
  });
  return q;
}

/** Re-persist what the durable stages say for a run whose lifecycle has already ended. Starts no model call. */
export async function reclose(runId) {
  const view = await loadRunView(runId);
  if (view.storage === STORAGE_MODEL.staged) await persistClose(view, view.run.status);
}

/**
 * Close a drive (Phase 5). Everything is read back from durable stages; historical Runs are never written.
 * A drive that ended on an unknown outcome, or on a stage for which no call was made, leaves the run open.
 * A cancellation that is already persisted is never overwritten by another lifecycle.
 *  - Lifecycle: `completed` only when the completion manifest passes for the run's mode. Otherwise the run
 *    ends `partial` (valid artifacts preserved) or `failed` (none). A returned process is not completion.
 *  - Qualification: a completed run whose Blueprint has no evaluation gets ONE independent evaluation stage
 *    through the canonical engine. Its verdicts plus the code-decided criteria settle the qualification state.
 *  - Release: only a qualified Blueprint is recorded as released.
 */
export async function finalizeRun(runId, outcome = {}, { origin = "execution", onDurableChange = async () => {} } = {}) {
  let view = await loadRunView(runId);
  if (view.storage !== STORAGE_MODEL.staged || outcome.unresolved || outcome.refused) return view;
  const cancelled = outcome.cancelled || ["cancel_requested", "cancelled"].includes(view.run.status);
  const lifecycle = cancelled ? "cancelled"
    : completionOf(view).complete ? "completed" : outcomeAfterStageFailure(Object.keys(view.artifacts).length);
  const q = await persistClose(view, lifecycle);
  if (q.needsEvaluation) {
    await onDurableChange(runId);
    await executeStage({ view, stageKey: QUALIFICATION_KEY, origin, onBegan: () => onDurableChange(runId) });
    view = await loadRunView(runId);
    await persistClose(view, lifecycle);
  }
  return loadRunView(runId);
}