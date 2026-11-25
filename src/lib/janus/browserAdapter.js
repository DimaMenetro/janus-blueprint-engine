/**
 * JANUS BROWSER ADAPTER — transitional scheduler (plan §18.1). Scheduling only.
 * Each entry point picks which stage keys to request and hands them to the canonical stage engine.
 * No prompts, no model calls and no completion rules live here.
 */
import { PROTOCOL, MODEL_POLICY } from "@/lib/janus/protocolRegistry";
import { TERMINAL_STATES } from "@/lib/janus/lifecycleContract";
import { STORAGE_MODEL, ENGINE_VERSION, ORCHESTRATOR, INTERSECTION_KEYS } from "@/lib/janus/stageModel";
import { base44 } from "@/api/base44Client";
import { createRun, updateRun, loadRunView } from "@/lib/janus/stageStore";
import { driveStages, finalizeRun, reclose } from "@/lib/janus/stageEngine";
import { recoverStage } from "@/lib/janus/stageRunner";
import { stagePlan } from "@/lib/janus/executionState";
import { REFRESH_UNAVAILABLE_MESSAGE } from "@/lib/janus/stageCompiler";

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

async function rerun(runId, target, keys, hooks) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const missing = CORE_DOMAINS.filter(d => !view.artifacts[d]);
  if (missing.length > 0) throw new Error(`Cannot re-run ${target} — missing prerequisite domains: ${missing.join(", ")}`);
  const [live] = liveStages(view);
  if (live) throw new Error(`Cannot re-run ${target} — a call for ${live.stage_key} has not settled and its outcome is unknown`);
  await assertOperator();
  if (view.storage === STORAGE_MODEL.staged) await updateRun(runId, { status: "running" });
  const result = await advance(runId, { keys, origin: "rerun", force: true }, hooks);
  return { ...result, success: result.stageErrors.length === 0 && !result.unresolved && !result.refused && !result.cancelled, errors: result.stageErrors };
}

/** New revisions of the six intersections and the four patterns. The dependent Blueprint becomes stale (derived). */
export const rerunSynthesis = (runId, hooks) => rerun(runId, "synthesis", [...INTERSECTION_KEYS, "synthesis"], hooks);
/** A new Blueprint revision from the currently active stages. */
export const rerunBlueprint = (runId, hooks) => rerun(runId, "blueprint", ["blueprint"], hooks);

/**
 * Cancel after the current stage (plan §12.4). The request is persisted; an active call is left to settle
 * and its real outcome is recorded; no further stage is scheduled. If nothing is in flight and no session
 * is scheduling the run, the safe boundary is already here and the run is cancelled at once.
 */
export async function requestCancel(runId) {
  const view = await loadRunView(runId);
  if (!view || view.storage !== STORAGE_MODEL.staged || view.run.status !== "running") return;
  await updateRun(runId, { status: "cancel_requested" });
  if (!driving.has(runId) && liveStages(view).length === 0) await updateRun(runId, { status: "cancelled" });
}

/**
 * Resolve a call left unresolved by a session that is gone — from recorded evidence only (stageRunner.recoverStage).
 * A session disappearing is not evidence of anything, and nothing here is decided by elapsed time: if the server
 * claimed the call and recorded no outcome, it stays unresolved. Starts no model call. Afterwards an open run
 * can be resumed; a run whose lifecycle had ended only has its recorded state re-derived.
 */
export async function reconcileJanus(runId, hooks = {}) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const [live] = liveStages(view);
  if (!live || driving.has(runId)) return { settled: false, unresolved: live?.stage_key || null };
  const res = await recoverStage(live, view.attempts[live.id] || [], { slot: view.storage === STORAGE_MODEL.staged });
  if (!res.unresolved && view.storage === STORAGE_MODEL.staged) {
    if (view.run.status === "cancel_requested") await finalizeRun(runId, { cancelled: true });
    else if (TERMINAL_STATES.includes(view.run.status)) await reclose(runId);
  }
  if (hooks.onDurableChange) await hooks.onDurableChange(runId);
  return { settled: !res.unresolved, unresolved: res.unresolved || null };
}