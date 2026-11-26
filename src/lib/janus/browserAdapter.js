/**
 * JANUS BROWSER ADAPTER — transitional scheduler (plan §18.1). Scheduling only.
 * Each entry point picks which stage keys to request and hands them to the canonical stage engine.
 * No prompts, no model calls and no completion rules live here.
 */
import { PROTOCOL, MODEL_POLICY } from "@/lib/janus/protocolRegistry";
import { TERMINAL_STATES } from "@/lib/janus/lifecycleContract";
import { STORAGE_MODEL, ENGINE_VERSION, ORCHESTRATOR, INTERSECTION_KEYS, QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { base44 } from "@/api/base44Client";
import { createRun, updateRun, loadRunView, claimInitiation } from "@/lib/janus/stageStore";
import { driveStages, finalizeRun, reclose, verifyContinuation, evaluateStage } from "@/lib/janus/stageEngine";
import { recoverStage, closeFromLastCall } from "@/lib/janus/stageRunner";
import { stagePlan, continuationOf, continuableFor, stageLabel } from "@/lib/janus/executionState";
import { REFRESH_UNAVAILABLE_MESSAGE } from "@/lib/janus/stageCompiler";
import { rerunImpact } from "@/lib/janus/rerunImpact";
import { completionImpact } from "@/lib/janus/completionImpact";
import { deriveQualification, recordedInputs } from "@/lib/janus/qualification";

export { REFRESH_UNAVAILABLE_MESSAGE };
const CORE_DOMAINS = ["corpus", "cogito", "animus", "actus"];
const liveStages = (view) => Object.values(view.stageInfo).map(i => i.latest).filter(s => s?.status === "running");

/**
 * Interim containment, mirrored by the `invokeJanusStage` function: only an operator (admin) may start model
 * work. Checked before any record. The Phase 6 ownership mechanism (one execution slot per staged run, one
 * claim per attempt, server-recorded outcomes) is in place underneath it; lifting this containment is a
 * separate, explicit operator decision and is not made here.
 */
export const OPERATOR_ONLY_MESSAGE = "Janus execution is limited to operators until durable stage ownership is in place";
async function assertOperator() {
  const user = await base44.auth.me();
  if (user?.role !== "admin") throw new Error(OPERATOR_ONLY_MESSAGE);
}

// Runs this session is scheduling right now. One driver per run — never two.
const driving = new Set();
export const isDriving = (runId) => driving.has(runId);

async function advance(runId, { keys, origin, force = false }, hooks = {}) {
  if (driving.has(runId)) throw new Error("This run is already being executed in this session");
  driving.add(runId);
  try {
    if (hooks.onDurableChange) await hooks.onDurableChange(runId);
    const outcome = await driveStages({ runId, keys, origin, force, onDurableChange: hooks.onDurableChange });
    const view = await finalizeRun(runId, outcome, { origin, onDurableChange: hooks.onDurableChange });
    return {
      runId, status: view.run.status, qualification: view.run.qualification_state || null, stageErrors: outcome.errors, errors: view.run.validation_errors || [],
      cancelled: !!outcome.cancelled || view.run.status === "cancelled", unresolved: outcome.unresolved || null,
      refused: outcome.refused || null,
      // A revision waiting for its retry could not be continued because it is no longer provably the same operation.
      blocked: outcome.blocked || null,
    };
  } finally {
    driving.delete(runId);
  }
}

/** New run: every stage of the mode's plan, in order. */
export async function executeJanus(params, hooks) {
  const { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = params;
  if (refreshEnabled) throw new Error(REFRESH_UNAVAILABLE_MESSAGE); // fail closed before any record or model call
  await assertOperator();
  const run = await createRun({
    active_attempt_id: "", // the execution slot starts free
    query_text: queryText, execution_mode: executionMode, output_mode: outputMode, blueprint_level: blueprintLevel,
    novelty_dial: noveltyDial, refresh_enabled: refreshEnabled, status: "running", validation_errors: [], raw_json: "{}",
    storage_model: STORAGE_MODEL.staged, protocol_version: PROTOCOL.version, engine_version: ENGINE_VERSION,
    orchestrator: ORCHESTRATOR, model_policy_snapshot: { ...MODEL_POLICY },
  });
  const result = await advance(run.id, { keys: stagePlan(executionMode), origin: "execution" }, hooks);
  return { ...result, success: result.status === "completed" };
}

/**
 * Continue an OPEN staged run (interrupted before its lifecycle ended) from its durable stages. Valid stages
 * are never regenerated. A terminal run (completed, failed, partial, cancelled) is never moved back to running
 * here: recovery after a terminal state is an explicit revision-producing re-run (formalized in Phase 7).
 * Resume is execution continuity only: it runs what has not run, continues a revision waiting for its retry, and
 * closes the run. It never gives a stage a new revision because its last one failed for good (exhausted or
 * non-retryable): that stage is left failed and comes back only through an explicit re-run.
 */
export async function resumeJanus(runId, hooks) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  if (view.storage !== STORAGE_MODEL.staged) throw new Error("Historical runs are read-only and cannot be resumed");
  if (view.run.refresh_enabled) throw new Error(REFRESH_UNAVAILABLE_MESSAGE);
  if (TERMINAL_STATES.includes(view.run.status)) throw new Error(`This run has ended (${view.run.status}) and is not resumed. A finished run recovers through a re-run, which produces a new revision.`);
  await assertOperator();
  const result = await advance(runId, { keys: stagePlan(view.run.execution_mode), origin: "resume" }, hooks);
  return { ...result, success: result.status === "completed" };
}

export const STALE_PREVIEW_MESSAGE = "This run changed after the impact preview was computed (a stage version or the run's state is different now). Nothing was started. Review the impact again.";
export const INITIATION_LOST_MESSAGE = "Another operation on this run was started first, from the same state. Nothing was started here.";

/**
 * Take the run's initiation epoch for an explicit operation (stageStore.claimInitiation). A historical Run is never
 * written; it has no slot either, and its revisions are guarded by the attempt claim alone.
 */
async function claim(view, patch = {}) {
  if (view.storage !== STORAGE_MODEL.staged) return;
  if (!(await claimInitiation(view.run.id, { epoch: view.run.graph_epoch || 0, status: view.run.status, patch }))) throw new Error(INITIATION_LOST_MESSAGE);
}

/** The impact of an explicit re-run, from the current durable state (rerunImpact). Starts nothing, writes nothing. */
export async function previewRerun(runId, request) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  return rerunImpact(view, request);
}

/**
 * EXPLICIT RE-RUN (Phase 7): new revisions of `targets` — and, with `cascade`, of every stage they make stale —
 * through the canonical engine. Never overwrites: earlier revisions stay, superseded and inspectable; unaffected
 * revisions stay active. `expected` is the token of the preview the operator approved: if the durable state has
 * changed since, nothing is started (fail closed). Refused beside an unresolved or waiting revision, after a
 * cancellation request, and when another initiation from the same state won the run's epoch.
 */
async function rerunCore(runId, { targets = [], cascade = false, expected } = {}, hooks, label) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const impact = rerunImpact(view, { targets, cascade });
  const what = label || impact.targets.map(stageLabel).join(", ") || "stages";
  if (impact.refusals.length) throw new Error(`Cannot re-run ${what} — ${impact.refusals[0]}`);
  if (expected !== undefined && expected !== impact.token) throw new Error(STALE_PREVIEW_MESSAGE);
  if (driving.has(runId)) throw new Error("This run is already being executed in this session");
  await assertOperator();
  await claim(view, { status: "running" });
  const result = await advance(runId, { keys: impact.plan, origin: "rerun", force: cascade ? { dependents: impact.cascadeKeys } : true }, hooks);
  return { ...result, impact, success: result.stageErrors.length === 0 && !result.unresolved && !result.refused && !result.cancelled, errors: result.stageErrors };
}
export const rerunStages = (runId, request, hooks) => rerunCore(runId, request, hooks);

/** What completing this run would produce, and why each stage (completionImpact). Starts nothing, writes nothing. */
export async function previewCompletion(runId, request) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  return completionImpact(view, request);
}

/**
 * COMPLETION (Phase 9): produce the cognition a finished run never produced, lost to a failure, or holds only out
 * of date — and nothing else. Distinct from Resume (same revision, open runs) and from a re-run (named stages,
 * valid revisions superseded): a valid, current revision is never regenerated here. With `repair`, the operator
 * also replaces valid revisions that fail today's mandatory integrity. Same guards as a re-run: the approved
 * preview's token, no unresolved or waiting revision, no cancellation, operator only, one initiation per state.
 */
export async function completeJanus(runId, { repair = false, expected } = {}, hooks) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const impact = completionImpact(view, { repair });
  if (impact.refusals.length) throw new Error(`Cannot complete this run — ${impact.refusals[0]}`);
  if (expected !== undefined && expected !== impact.token) throw new Error(STALE_PREVIEW_MESSAGE);
  if (driving.has(runId)) throw new Error("This run is already being executed in this session");
  await assertOperator();
  await claim(view, { status: "running" });
  const result = await advance(runId, { keys: impact.plan, origin: "completion", force: { complete: true, replace: impact.replace } }, hooks);
  return { ...result, impact, success: result.stageErrors.length === 0 && !result.unresolved && !result.refused && !result.cancelled, errors: result.stageErrors };
}

async function rerun(runId, target, keys, hooks) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const missing = CORE_DOMAINS.filter(d => !view.artifacts[d]);
  if (missing.length > 0) throw new Error(`Cannot re-run ${target} — missing prerequisite domains: ${missing.join(", ")}`);
  return rerunCore(runId, { targets: keys }, hooks, target);
}

/** New revisions of the six intersections and the four patterns. The dependent Blueprint becomes stale (derived). */
export const rerunSynthesis = (runId, hooks) => rerun(runId, "synthesis", [...INTERSECTION_KEYS, "synthesis"], hooks);
/** A new Blueprint revision from the currently active stages. */
export const rerunBlueprint = (runId, hooks) => rerun(runId, "blueprint", ["blueprint"], hooks);

/**
 * THE EVALUATION PATHWAY OF A COMPLETED RUN (Phase 7, first tranche). Ordinary Resume never reaches a completed
 * run, so the evaluation has its own: it continues an evaluation waiting for its retry (same revision, same attempt
 * limit), makes the first evaluation of the current Blueprint version, or — only with `newVersion`, the operator's
 * explicit decision — a new evaluation after the last one settled without verdicts. Never beside an unresolved
 * call, never for a stale or incomplete run, and never a hidden retry of a settled or exhausted evaluation.
 */
export async function evaluateJanus(runId, { newVersion = false } = {}, hooks = {}) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  if (view.storage !== STORAGE_MODEL.staged) throw new Error("Historical runs are read-only");
  const q = deriveQualification(view);
  if (q.blocked) throw new Error(q.blocked);
  const action = q.evaluationAction;
  if (!action) throw new Error(q.pending === "in_progress" ? "The evaluation call for this Blueprint version has not settled and its outcome is unknown: nothing is started beside it" : "This Blueprint version already has its evaluation");
  if (action === "new_version" && !newVersion) throw new Error(`The last evaluation of this Blueprint version settled without verdicts (${q.lastEvaluationError}). Another evaluation is a new version and needs your explicit decision.`);
  if (action === "continue" && newVersion) throw new Error("The evaluation is waiting for its retry, so it is continued, not replaced: its attempt limit is not reset.");
  if (driving.has(runId)) throw new Error("This run is already being executed in this session");
  await assertOperator();
  if (action === "continue") {
    // Identity first, so a revision that is no longer the same operation is reported without any write.
    // The engine proves it again after the claim, against the state it actually continues.
    const stage = view.stageInfo[QUALIFICATION_KEY].latest;
    const identity = await verifyContinuation(view, stage);
    if (!identity.ok) return { runId, action, status: view.run.status, qualification: view.run.qualification_state || null, unresolved: null, refused: null, failure: null,
      blocked: { stageKey: QUALIFICATION_KEY, revision: stage.revision, nextAttempt: q.evaluationRetry.nextAttempt, reasons: identity.reasons } };
  }
  await claim(view);
  driving.add(runId);
  try {
    if (hooks.onDurableChange) await hooks.onDurableChange(runId);
    const origin = action === "continue" ? "resume" : action === "new_version" ? "rerun" : "execution";
    const res = await evaluateStage({ runId, action, origin, onDurableChange: hooks.onDurableChange });
    const after = await loadRunView(runId);
    return { runId, action, status: after.run.status, qualification: after.run.qualification_state || null,
      unresolved: res.unresolved || null, refused: res.refused || null, blocked: res.blocked || null, failure: res.failure || null };
  } finally {
    driving.delete(runId);
  }
}

/**
 * Cancel after the current stage (plan §12.4). The request is persisted; an active call is left to settle
 * and its real outcome is recorded; no further stage is scheduled. If nothing is in flight and no session
 * is scheduling the run, the safe boundary is already here and the run is cancelled at once.
 */
export async function requestCancel(runId) {
  const view = await loadRunView(runId);
  if (!view || view.storage !== STORAGE_MODEL.staged || view.run.status !== "running") return;
  await updateRun(runId, { status: "cancel_requested" });
  if (driving.has(runId)) return;
  const running = liveStages(view);
  // A revision waiting for its retry has no call in flight, so the boundary is here too: no further attempt
  // is scheduled, and the revision is closed from the real outcome of its last call.
  const waiting = running.length === 1 && continuationOf(running[0], view.attempts[running[0].id]);
  if (waiting) await closeFromLastCall(running[0], view.attempts[running[0].id], recordedInputs(view, running[0]));
  if (running.length === 0 || waiting) await updateRun(runId, { status: "cancelled" });
}

/**
 * The operator's explicit decision to give up a revision that is waiting for its retry but can no longer be
 * continued (its dependencies, template, protocol or prompt no longer match what it recorded). The revision is
 * closed from the real outcome of its last call; a later Resume then produces a new revision. Starts no model
 * call. Refused while the revision can still be continued, so it cannot be used to reset a retry budget.
 */
export async function closeBlockedRevision(runId, hooks = {}) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  if (view.storage !== STORAGE_MODEL.staged) throw new Error("Historical runs are read-only");
  if (driving.has(runId)) throw new Error("This run is already being executed in this session");
  const [stage] = liveStages(view);
  const attempts = stage ? view.attempts[stage.id] || [] : [];
  if (!stage || !continuableFor(view.run, stage.stage_key) || !continuationOf(stage, attempts)) throw new Error("No version of this run is waiting for a retry");
  if ((await verifyContinuation(view, stage)).ok) throw new Error(`This version can still be continued: ${stage.stage_key === QUALIFICATION_KEY ? "continue the evaluation" : "resume the run"}. A new version is started only when it can no longer be continued.`);
  await closeFromLastCall(stage, attempts, recordedInputs(view, stage));
  if (hooks.onDurableChange) await hooks.onDurableChange(runId);
  return { closed: stage.stage_key, revision: stage.revision };
}

/**
 * Resolve a call left unresolved by a session that is gone — from recorded evidence only (stageRunner.recoverStage).
 * A session disappearing is not evidence of anything, and nothing here is decided by elapsed time: if the server
 * claimed the call and recorded no outcome, it stays unresolved. Starts no model call. Afterwards an open run
 * can be resumed; a run whose lifecycle had ended only has its recorded state re-derived.
 * `awaiting` reports a revision whose recorded call was a retryable failure with attempts left: its attempt is
 * settled, the revision is not, and Resume continues that same revision at the next attempt.
 */
export async function reconcileJanus(runId, hooks = {}) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const [live] = liveStages(view);
  if (!live || driving.has(runId)) return { settled: false, unresolved: live?.stage_key || null };
  const res = await recoverStage(live, view.attempts[live.id] || [], { slot: view.storage === STORAGE_MODEL.staged, integrity: recordedInputs(view, live) });
  if (!res.unresolved && view.storage === STORAGE_MODEL.staged) {
    if (view.run.status === "cancel_requested") await finalizeRun(runId, { cancelled: true });
    else if (TERMINAL_STATES.includes(view.run.status)) await reclose(runId);
  }
  if (hooks.onDurableChange) await hooks.onDurableChange(runId);
  return { settled: !res.unresolved, unresolved: res.unresolved || null, ...(res.awaiting ? { awaiting: res.awaiting } : {}) };
}