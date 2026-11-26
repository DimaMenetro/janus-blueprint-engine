/**
 * JANUS CANONICAL STAGE ENGINE — Phase 4.
 * One implementation of: stage context → compile → invoke → parse → validate → persist → report.
 * It is independent of who schedules it. Adapters (browser today, server later) choose WHICH stage keys
 * to ask for; they never build prompts, call the model or decide what counts as completed.
 */
import { STAGE_ORDER, PROTOCOL } from "@/lib/janus/protocolRegistry";
import { STORAGE_MODEL, QUALIFICATION_KEY, CONFIG_INPUT, configOf, fingerprintInputs, revisionLabel } from "@/lib/janus/stageModel";
import { outcomeAfterStageFailure } from "@/lib/janus/lifecycleContract";
import { completionOf, deriveQualification, recordedInputs, inputIntegrity, blueprintAudit, enforceStepConfidence, refinementBasis } from "@/lib/janus/qualification";
import { REFINE_INPUT } from "@/lib/janus/blueprintSpecs";
import { loadRunView, updateRun, recordDeterministicStage } from "@/lib/janus/stageStore";
import { runStage, continueStage, closeFromLastCall, validateStageOutput } from "@/lib/janus/stageRunner";
import { BP, BLUEPRINT_PIPELINE_KEYS, isDeterministicStage, assembleBlueprint } from "@/lib/janus/blueprintPipeline";
import { composeArtifacts } from "@/lib/janus/runView";
import { compileStage, stageInputs, requiredInputs, templateVersionOf } from "@/lib/janus/stageCompiler";
import { stageFailures, continuationOf, rerunOnly } from "@/lib/janus/executionState";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { generateMarkdown } from "@/components/janus/promptUtils";

const MAX_RAW_JSON_LENGTH = 200000;
const MAX_MD_LENGTH = 60000;
const cap = (s, max) => (s.length <= max ? s : `${s.slice(0, max)}\n\n[TRUNCATED — original was ${s.length} chars]`);

export { configOf };

/**
 * DETERMINISTIC STAGES (plan §15.4 step 4). Computed by code from the validated artifacts a stage declares as its
 * inputs; no model is called. The Blueprint assembly merges the pipeline's sub-artifacts into one draft and audits
 * it with the same code that decides the code-judged quality criteria.
 */
const DETERMINISTIC = {
  [BP.assembly]: (inputs, config) => {
    const artifacts = composeArtifacts(Object.fromEntries(Object.entries(inputs).map(([k, output]) => [k, { output }])));
    // Invariants code can establish are established here, before the critic and the refiner read the draft.
    const { blueprint, corrections } = enforceStepConfidence(assembleBlueprint(inputs), artifacts);
    return { blueprint, audit: { ...blueprintAudit(config, { ...artifacts, blueprint }, inputs[BP.brief]), ...(corrections.length ? { confidence_corrections: corrections } : {}) } };
  },
};

/**
 * Execute one stage against the durable view. Inputs and exact dependency revisions are whatever the view
 * holds as active. Returns { record } | { failure } (both settled), { skipped } (a required input is absent),
 * { refused } (no call was made for the new revision) or { unresolved } (outcome unknown, nothing settled).
 */
export async function executeStage({ view, stageKey, origin, evidence = [], onBegan, refine }) {
  const active = (k) => view.stageInfo[k]?.active;
  const staged = view.storage === STORAGE_MODEL.staged;
  // The mode's Synthesis-before-Blueprint rule binds staged runs (the engine's own plan). A historical Run is
  // re-run as before: its record predates the plan and is never held to it.
  const missing = requiredInputs(stageKey, staged ? view.run.execution_mode : undefined).filter(k => !active(k));
  if (missing.length) return { skipped: { stageKey, missing } };
  const inputKeys = stageInputs(stageKey).filter(active);
  // CONSUMPTION BOUNDARY (lifecycleContract §5b). An input is read only if it holds today's mandatory integrity.
  // A revision that settled as succeeded under an earlier validator and fails it now is not built upon: the stage
  // is not started, and says which input and why. Staged runs only (a historical Run is read as it was recorded).
  const unfit = staged ? inputKeys.map(k => ({ key: k, revision: active(k).revision, errors: inputIntegrity(view, k) })).filter(x => x.errors.length) : [];
  if (unfit.length) return { skipped: { stageKey, missing: [], unfit } };
  const inputs = Object.fromEntries(inputKeys.map(k => [k, active(k).output]));
  const config = configOf(view.run);
  // A substantive refinement is validated against the Blueprint it refines and the evaluation it answers.
  const integrity = { ...inputs, [CONFIG_INPUT]: config, ...(refine ? refinementBasis(refine.base, refine.deficiencies) : {}) };
  if (refine) inputs[REFINE_INPUT] = refine;
  if (isDeterministicStage(stageKey)) {
    // No prompt, no call, no attempt: the revision is computed, validated and recorded settled in one write.
    const output = DETERMINISTIC[stageKey](inputs, config);
    const validation = validateStageOutput(stageKey, output, { inputs: integrity });
    const record = await recordDeterministicStage({ runId: view.run.id, stageKey, origin, output, validation,
      revision: (view.stageInfo[stageKey]?.max_revision || 0) + 1, dependsOn: inputKeys.map(k => active(k).id), templateVersion: templateVersionOf(stageKey) });
    if (onBegan) await onBegan(record);
    return validation.valid ? { record } : { failure: { evidence: "schema_failure", message: record.error_message, attempts: 0 } };
  }
  const compiled = compileStage({ stageKey, config, evidence, inputs });
  return runStage({
    runId: view.run.id, stageKey, origin, onBegan, integrity,
    revision: (view.stageInfo[stageKey]?.max_revision || 0) + 1,
    dependsOn: inputKeys.map(k => active(k).id),
    templateVersion: compiled.templateVersion, sources: compiled.sources,
    prompt: compiled.prompt, parseKey: compiled.parseKey,
    staged: view.storage === STORAGE_MODEL.staged, // only a staged run has an execution slot
    ...(refine ? { refines: { blueprint_stage_id: refine.blueprintStageId, evaluation_stage_id: refine.evaluationStageId, cycle: refine.cycle, deficiencies: refine.deficiencies } } : {}),
  });
}

/**
 * ONE SUBSTANTIVE REFINEMENT CYCLE of a completed run whose Blueprint failed qualification (plan §7.3). Not a retry
 * and not a re-run: the pipeline's reasoning is kept, and the final Blueprint is refined against the independent
 * evaluation — a NEW `blueprint` revision built transactionally on the evaluated one, answering each failed
 * criterion — and then evaluated once, independently, like any Blueprint. The evaluated revision stays in the
 * lineage; if the new one is refused, it stays the active Blueprint. The run's lifecycle is not touched.
 * The cycle is recorded on the revision (provenance.refines), which is what bounds it (MAX_REFINEMENT_CYCLES).
 * Ends as { refined: <stage result>, evaluation: <stage result> | null }.
 */
export async function refineStage({ runId, origin = "refinement", onDurableChange = async () => {} }) {
  const view = await loadRunView(runId);
  const q = deriveQualification(view);
  const refined = await executeStage({ view, stageKey: BP.final, origin, onBegan: () => onDurableChange(runId),
    refine: { base: view.stageInfo[BP.final].active.output, blueprintStageId: q.blueprintStageId, evaluationStageId: q.evaluationStageId,
      cycle: q.refinement.used + 1, max: q.refinement.max, deficiencies: q.refinement.deficiencies } });
  let evaluation = null;
  if (refined.record) {
    await onDurableChange(runId);
    evaluation = await executeStage({ view: await loadRunView(runId), stageKey: QUALIFICATION_KEY, origin, onBegan: () => onDurableChange(runId) });
  }
  if (!refined.unresolved && !evaluation?.unresolved) await reclose(runId);
  await onDurableChange(runId);
  return { refined, evaluation };
}

/**
 * Advance through `keys` in order, reading durable state before every stage.
 *  - a stage that already has a valid revision is not regenerated (unless `force`: an explicit rerun);
 *  - a stage whose newest revision settled as failed with its operation spent is not regenerated either (unless
 *    `force`): Resume never creates a revision to escape a failure (executionState.rerunOnly);
 *  - while ANY stage of the run has a revision still running, its call is unresolved (outcome unknown):
 *    nothing is started over it or beside it, for a resume or a rerun, and the drive stops;
 *  - the one exception is a revision WAITING for its retry (its last call settled as a retryable failure with
 *    budget left — executionState.continuationOf). It is continued first, on the same RunStage, at its next
 *    attempt, after its identity is proven (verifyContinuation). If its identity no longer matches, the drive
 *    stops `blocked`: nothing is continued and no new revision is started silently;
 *  - a persisted cancellation stops scheduling at the next stage boundary, whichever session persisted it
 *    (`cancel_requested`, or `cancelled` when another session cancelled while nothing was in flight);
 *  - a stage whose call outcome is unknown stops the drive: nothing was settled and nothing follows it;
 *  - a stage for which no call was made (the function refused it) stops the drive and leaves the run open.
 * Retries happen inside a stage, only after the previous attempt settled (stageRunner).
 * `force: true` gives every key a new revision (an explicit re-run of exactly those stages). `force: { dependents }`
 * (a Phase 7 cascade) gives every key outside `dependents` a new revision, and a key in `dependents` one only if
 * its active revision is stale at that moment — an upstream re-run that produced no new valid revision
 * invalidated nothing, so the valid revision is reused, not regenerated.
 * Ends as { errors } | { errors, cancelled } | { errors, unresolved } | { errors, refused } | { errors, blocked }.
 */
export async function driveStages({ runId, keys, origin, force = false, onDurableChange = async () => {} }) {
  const errors = [];
  const unreplaced = new Set(); // stages this drive tried to give a revision and could not
  const isPipeline = (key) => BLUEPRINT_PIPELINE_KEYS.includes(key);
  const regenerate = (view, key) => {
    const info = view.stageInfo[key];
    // Resume is not regeneration: without an explicit re-run, a stage whose newest revision settled as failed with
    // its operation spent (exhausted or non-retryable) gets no new revision. The drive goes on without it, exactly
    // as the session that produced the failure would have.
    if (!force && info && !info.active && rerunOnly(info.latest, view.attempts[info.latest.id])) return false;
    // COMPLETION (Phase 9): a stage gets a revision only if, at this moment, the run holds no valid current one —
    // none at all, a stale one, or one the operator chose to replace because it fails today's integrity. A valid
    // current revision is never regenerated, so an upstream stage that failed again invalidates nothing.
    if (force?.complete) return !info?.active || !!info.stale || (force.replace || []).includes(info.active.id);
    if (!info?.active || force === true) return true;
    return Array.isArray(force?.dependents) && (!force.dependents.includes(key) || !!info.stale);
  };
  /** What one stage result means for the drive: `null` to go on, or the outcome the drive ends with. */
  const landed = async (res, stageKey, staged) => {
    if (res.unresolved) return { errors, unresolved: res.unresolved }; // outcome unknown: nothing was settled, nothing follows
    if (res.refused) {
      // The function made no call for this stage, so there is no outcome to record against it.
      await onDurableChange(runId);
      // It refused because a cancellation is persisted: that is the cancellation taking effect, not an error.
      if (res.refused.reason === "cancel_requested") return { errors, cancelled: true };
      // Anything else (another call of this run is live, the session is no longer allowed): the run is not
      // closed on a stage that never ran. It stays open and can be resumed — for a retry that could not start,
      // by continuing the same revision at the same attempt number.
      errors.push(res.refused.message);
      return { errors, refused: { stageKey, reason: res.refused.reason }, ...(res.awaiting ? { awaiting: res.awaiting } : {}) };
    }
    if (res.failure) errors.push(res.failure.message);
    if (staged) await updateRun(runId, { current_stage: stageKey });
    await onDurableChange(runId);
    return null;
  };

  for (let i = 0; i < keys.length;) {
    const stageKey = keys[i];
    const view = await loadRunView(runId);
    const staged = view.storage === STORAGE_MODEL.staged;
    const cancelled = staged && ["cancel_requested", "cancelled"].includes(view.run.status);
    const running = Object.values(view.stageInfo).map(info => info.latest).find(s => s?.status === "running");
    if (running) {
      const attempts = view.attempts[running.id] || [];
      // Only a staged run's revision can be waiting for its retry; anything else that is running is a call
      // whose outcome is not known here.
      const waiting = staged ? continuationOf(running, attempts) : null;
      if (!waiting) return { errors, unresolved: running.stage_key };
      // The cancellation boundary: no further attempt is scheduled, and the revision is closed from the real
      // outcome of its last call.
      if (cancelled) { await closeFromLastCall(running, attempts, recordedInputs(view, running)); return { errors, cancelled: true }; }
      // SAME-REVISION CONTINUATION. The revision is continued only if it is provably the same operation.
      const identity = await verifyContinuation(view, running);
      if (!identity.ok) {
        errors.push(`${running.stage_key}: ${revisionLabel(running)} is not continued — ${identity.reasons.join("; ")}. It needs an explicit new version.`);
        return { errors, blocked: { stageKey: running.stage_key, revision: running.revision, nextAttempt: waiting.nextAttempt, reasons: identity.reasons } };
      }
      const end = await landed(await continueStage({ stage: running, attempts, prompt: identity.prompt, staged, integrity: recordedInputs(view, running), onBegan: () => onDurableChange(runId) }), running.stage_key, staged);
      if (end) return end;
      continue; // the same plan position is read again from durable state
    }
    if (cancelled) return { errors, cancelled: true };
    i += 1;
    if (!regenerate(view, stageKey)) continue;

    // ONE BLUEPRINT, ONE PIPELINE (Phase 9). In an operation that produces new revisions, a pipeline stage is not
    // built on the predecessor of a pipeline stage this same operation set out to replace and could not. It would
    // be paid cognition known in advance to rest on what the operator asked to replace. The current Blueprint and
    // everything valid stay as they are; the failure is reported.
    const lost = force && isPipeline(stageKey) ? requiredInputs(stageKey, staged ? view.run.execution_mode : undefined).filter(k => isPipeline(k) && unreplaced.has(k)) : [];
    if (lost.length) {
      errors.push(`${stageKey}: not started — ${lost.join(", ")}, which it builds on, produced no valid new version in this operation`);
      unreplaced.add(stageKey);
      continue;
    }

    const res = await executeStage({ view, stageKey, origin, onBegan: () => onDurableChange(runId) });
    if (res.failure || res.skipped) unreplaced.add(stageKey);
    if (res.skipped) {
      // Not started because an input it would read fails mandatory integrity: said, not passed over in silence.
      (res.skipped.unfit || []).forEach(u => errors.push(`${stageKey}: not started — its input ${u.key} r${u.revision} fails mandatory integrity (${u.errors.slice(0, 3).join("; ")}${u.errors.length > 3 ? `; +${u.errors.length - 3} more` : ""}). Re-run ${u.key} first.`));
      continue;
    }
    const end = await landed(res, stageKey, staged);
    if (end) return end;
  }
  return { errors };
}

/**
 * IDENTITY CHECK before a revision is continued at its next attempt. A revision is one logical operation,
 * fixed by its dependency revision IDs, protocol version, its own stage's prompt-template identity and input fingerprint.
 * The stage is rebuilt from the EXACT dependency revisions recorded on it, compiled, and fingerprinted; it is
 * continued only if every part still matches. Any difference fails closed: the old revision is not continued
 * silently, and a new revision needs the operator's explicit decision.
 * Returns { ok: true, prompt } | { ok: false, reasons }.
 */
export async function verifyContinuation(view, stage) {
  const key = stage.stage_key;
  const reasons = [];
  const byId = Object.fromEntries(view.lineage.map(s => [s.id, s]));
  const recorded = stage.depends_on || [];
  const deps = recorded.map(id => byId[id]);
  if (stage.protocol_version !== PROTOCOL.version) reasons.push(`protocol version changed (${stage.protocol_version} → ${PROTOCOL.version})`);
  // The identity of THIS stage's prompt template. Another stage's prompt changing is not a change to this operation.
  const template = templateVersionOf(key);
  if (stage.prompt_template_version !== template) reasons.push(`prompt template changed (${stage.prompt_template_version} → ${template})`);
  if (deps.some(d => d?.status !== "succeeded")) reasons.push("a recorded dependency revision is no longer available");
  // The inputs the engine would read for this stage now must be exactly the revisions this one recorded.
  const now = stageInputs(key).map(k => view.stageInfo[k]?.active?.id).filter(Boolean);
  if ([...now].sort().join("|") !== [...recorded].sort().join("|")) reasons.push("its dependency revisions are no longer the active ones");
  if (stage.provenance?.sources?.length) reasons.push("it read external evidence whose text is not stored");
  if (reasons.length) return { ok: false, reasons };

  const compiled = compileStage({ stageKey: key, config: configOf(view.run), inputs: Object.fromEntries(deps.map(d => [d.stage_key, d.output])) });
  const fingerprint = await fingerprintInputs({ stageKey: key, templateVersion: compiled.templateVersion, dependsOn: recorded, prompt: compiled.prompt });
  if (fingerprint !== stage.input_fingerprint) return { ok: false, reasons: ["the prompt compiled from its recorded inputs no longer matches its input fingerprint"] };
  return { ok: true, prompt: compiled.prompt };
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

/**
 * THE QUALITY EVALUATION OF A COMPLETED RUN, outside run execution (Phase 7, first tranche). The run's lifecycle
 * is not touched: completion stays distinct from qualification and release. `action` is what deriveQualification
 * allows now:
 *  - continue     the evaluation revision waiting for its retry is continued — the SAME RunStage, its next
 *                 attempt, its original attempt limit — only after its identity is proven (verifyContinuation);
 *                 a mismatch ends `blocked` and nothing is started, settled or regenerated;
 *  - start        the first evaluation of this Blueprint version;
 *  - new_version  the operator's explicit new evaluation after the last one settled without verdicts.
 * The call goes through the canonical runner (slot, claim, recorded outcome, bounded retry). Afterwards the
 * qualification state and release are re-derived from the durable records.
 * Ends as { record } | { failure } | { refused } | { unresolved } | { blocked }.
 */
export async function evaluateStage({ runId, action, origin, onDurableChange = async () => {} }) {
  const view = await loadRunView(runId);
  let res;
  if (action === "continue") {
    const stage = view.stageInfo[QUALIFICATION_KEY].latest;
    const attempts = view.attempts[stage.id] || [];
    const identity = await verifyContinuation(view, stage);
    if (!identity.ok) return { blocked: { stageKey: QUALIFICATION_KEY, revision: stage.revision, nextAttempt: continuationOf(stage, attempts)?.nextAttempt, reasons: identity.reasons } };
    res = await continueStage({ stage, attempts, prompt: identity.prompt, staged: true, onBegan: () => onDurableChange(runId) });
  } else {
    res = await executeStage({ view, stageKey: QUALIFICATION_KEY, origin, onBegan: () => onDurableChange(runId) });
  }
  await reclose(runId);
  await onDurableChange(runId);
  return res;
}

/** Re-persist what the durable stages say for a run whose lifecycle has already ended. Starts no model call. */
export async function reclose(runId) {
  const view = await loadRunView(runId);
  if (view.storage === STORAGE_MODEL.staged) await persistClose(view, view.run.status);
}

/**
 * Close a drive (Phase 5). Everything is read back from durable stages; historical Runs are never written.
 * A drive that ended on an unknown outcome, on a stage for which no call was made, or on a waiting revision
 * that could not be continued, leaves the run open.
 * A cancellation that is already persisted is never overwritten by another lifecycle.
 *  - Lifecycle: `completed` only when the completion manifest passes for the run's mode. Otherwise the run
 *    ends `partial` (valid artifacts preserved) or `failed` (none). A returned process is not completion.
 *  - Qualification: a completed run whose Blueprint has no evaluation gets ONE independent evaluation stage
 *    through the canonical engine. Its verdicts plus the code-decided criteria settle the qualification state.
 *  - Release: only a qualified Blueprint is recorded as released.
 */
export async function finalizeRun(runId, outcome = {}, { origin = "execution", onDurableChange = async () => {} } = {}) {
  let view = await loadRunView(runId);
  if (view.storage !== STORAGE_MODEL.staged || outcome.unresolved || outcome.refused || outcome.blocked) return view;
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