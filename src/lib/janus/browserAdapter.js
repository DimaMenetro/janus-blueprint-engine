/**
 * JANUS BROWSER ADAPTER — transitional scheduler (plan §18.1). Scheduling only.
 * Each entry point picks which stage keys to request and hands them to the canonical stage engine.
 * No prompts, no model calls and no completion rules live here.
 */
import { PROTOCOL, MODEL_POLICY } from "@/lib/janus/protocolRegistry";
import { STORAGE_MODEL, ENGINE_VERSION, ORCHESTRATOR, INTERSECTION_KEYS } from "@/lib/janus/stageModel";
import { createRun, updateRun, loadRunView, settleOrphanedStage } from "@/lib/janus/stageStore";
import { driveStages, finalizeRun } from "@/lib/janus/stageEngine";
import { stagePlan } from "@/lib/janus/executionState";
import { REFRESH_UNAVAILABLE_MESSAGE } from "@/lib/janus/stageCompiler";

export { REFRESH_UNAVAILABLE_MESSAGE };
const CORE_DOMAINS = ["corpus", "cogito", "animus", "actus"];

// Runs this session is scheduling right now. One driver per run — never two.
const driving = new Set();
export const isDriving = (runId) => driving.has(runId);

async function advance(runId, { keys, origin, force = false }, hooks = {}) {
  if (driving.has(runId)) throw new Error("This run is already being executed in this session");
  driving.add(runId);
  try {
    if (hooks.onDurableChange) await hooks.onDurableChange(runId);
    const outcome = await driveStages({ runId, keys, origin, force, onDurableChange: hooks.onDurableChange });
    const view = await finalizeRun(runId, outcome);
    return {
      runId, status: view.run.status, stageErrors: outcome.errors, errors: view.run.validation_errors || [],
      cancelled: !!outcome.cancelled || view.run.status === "cancelled", unresolved: outcome.unresolved || null,
    };
  } finally {
    driving.delete(runId);
  }
}

/** New run: every stage of the mode's plan, in order. */
export async function executeJanus(params, hooks) {
  const { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = params;
  if (refreshEnabled) throw new Error(REFRESH_UNAVAILABLE_MESSAGE); // fail closed before any record or model call
  const run = await createRun({
    query_text: queryText, execution_mode: executionMode, output_mode: outputMode, blueprint_level: blueprintLevel,
    novelty_dial: noveltyDial, refresh_enabled: refreshEnabled, status: "running", validation_errors: [], raw_json: "{}",
    storage_model: STORAGE_MODEL.staged, protocol_version: PROTOCOL.version, engine_version: ENGINE_VERSION,
    orchestrator: ORCHESTRATOR, model_policy_snapshot: { ...MODEL_POLICY },
  });
  const result = await advance(run.id, { keys: stagePlan(executionMode), origin: "execution" }, hooks);
  return { ...result, success: result.status === "completed" };
}

/** Continue an open or incomplete staged run from its durable stages. Valid stages are never regenerated. */
export async function resumeJanus(runId, hooks) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  if (view.storage !== STORAGE_MODEL.staged) throw new Error("Historical runs are read-only and cannot be resumed");
  if (view.run.refresh_enabled) throw new Error(REFRESH_UNAVAILABLE_MESSAGE);
  if (!["running", "cancel_requested"].includes(view.run.status)) await updateRun(runId, { status: "running" });
  const result = await advance(runId, { keys: stagePlan(view.run.execution_mode), origin: "resume" }, hooks);
  return { ...result, success: result.status === "completed" };
}

async function rerun(runId, target, keys, hooks) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const missing = CORE_DOMAINS.filter(d => !view.artifacts[d]);
  if (missing.length > 0) throw new Error(`Cannot re-run ${target} — missing prerequisite domains: ${missing.join(", ")}`);
  if (view.storage === STORAGE_MODEL.staged) await updateRun(runId, { status: "running" });
  const result = await advance(runId, { keys, origin: "rerun", force: true }, hooks);
  return { ...result, success: result.stageErrors.length === 0 && !result.unresolved && !result.cancelled, errors: result.stageErrors };
}

/** New revisions of the six intersections and the four patterns. The dependent Blueprint becomes stale (derived). */
export const rerunSynthesis = (runId, hooks) => rerun(runId, "synthesis", [...INTERSECTION_KEYS, "synthesis"], hooks);
/** A new Blueprint revision from the currently active stages. */
export const rerunBlueprint = (runId, hooks) => rerun(runId, "blueprint", ["blueprint"], hooks);

const liveStages = (view) => Object.values(view.stageInfo).map(i => i.latest).filter(s => s?.status === "running");

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

/** Operator confirms the session that owned an unresolved call is gone; settle it so the run can move again. */
export async function abandonUnresolved(runId) {
  if (driving.has(runId)) throw new Error("This session is still waiting on that call — it has not been abandoned");
  const view = await loadRunView(runId);
  if (!view || view.storage !== STORAGE_MODEL.staged) return;
  for (const stage of liveStages(view)) await settleOrphanedStage(stage);
  if (view.run.status === "cancel_requested") await updateRun(runId, { status: "cancelled" });
}