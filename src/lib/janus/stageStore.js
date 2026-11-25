/**
 * JANUS STAGE STORE — durable Run / RunStage / RunAttempt persistence (Phase 3, extended in Phases 4 and 6).
 * A stage revision is created when its first attempt starts and settled exactly once; it is never rewritten after.
 * A revision may take several attempts (bounded retry); each attempt is settled exactly once.
 * Reads compose through runView, so the frontend and the engine share one durable truth.
 */
import { base44 } from "@/api/base44Client";
import { PROTOCOL, MODEL_POLICY } from "@/lib/janus/protocolRegistry";
import { ENGINE_VERSION, ORCHESTRATOR, STORAGE_MODEL, fingerprintInputs } from "@/lib/janus/stageModel";
import { composeRunView } from "@/lib/janus/runView";

const LIMIT = 1000;
const took = (write) => write?.updated === 1;

/** Run + every stage revision + every attempt, composed (historical Runs go through the legacy adapter). */
export async function loadRunView(runId) {
  const [run] = await base44.entities.Run.filter({ id: runId });
  if (!run) return null;
  const [stages, attempts] = await Promise.all([
    base44.entities.RunStage.filter({ run_id: runId }, "created_date", LIMIT),
    base44.entities.RunAttempt.filter({ run_id: runId }, "created_date", LIMIT),
  ]);
  return composeRunView(run, stages, attempts);
}

export const createRun = (data) => base44.entities.Run.create(data);
export const updateRun = (runId, patch) => base44.entities.Run.update(runId, patch);
export const runStatus = async (runId) => (await base44.entities.Run.filter({ id: runId }))[0]?.status;
export const readAttempt = async (attemptId) => (await base44.entities.RunAttempt.filter({ id: attemptId }))[0];

/** The newest staged run that is still open — how a reloaded session finds work in progress. */
export async function findOpenStagedRun() {
  const [run] = await base44.entities.Run.filter(
    { storage_model: STORAGE_MODEL.staged, status: { $in: ["running", "cancel_requested"] } }, "-created_date", 1);
  return run || null;
}

export async function beginStage({ runId, stageKey, revision, dependsOn, templateVersion, prompt, origin, sources = [] }) {
  return base44.entities.RunStage.create({
    run_id: runId, stage_key: stageKey, revision, status: "running",
    protocol_version: PROTOCOL.version, engine_version: ENGINE_VERSION, prompt_template_version: templateVersion,
    depends_on: dependsOn, input_fingerprint: await fingerprintInputs({ stageKey, templateVersion, dependsOn, prompt }),
    provenance: { origin, orchestrator: ORCHESTRATOR, model_policy: MODEL_POLICY.operational_model, ...(sources.length ? { sources } : {}) },
    started_at: new Date().toISOString(),
  });
}

/** One attempt = at most one model call. It starts unclaimed; only the server can claim it, once. */
export const openAttempt = (stage, attemptNumber) => base44.entities.RunAttempt.create({
  run_id: stage.run_id, stage_id: stage.id, stage_key: stage.stage_key, attempt_number: attemptNumber, orchestrator: ORCHESTRATOR,
  model_policy: MODEL_POLICY.operational_model, outcome: "in_flight", claim_state: "unclaimed", retry_decision: "none",
  started_at: new Date().toISOString(),
});

/** Settle one attempt with its actual outcome. Elapsed time is telemetry only. */
export async function settleAttempt(attempt, { outcome, message, retryDecision = "none", settledBy = "session", endedAt = new Date().toISOString() }) {
  await base44.entities.RunAttempt.update(attempt.id, {
    outcome, retry_decision: retryDecision, settled_by: settledBy, ended_at: endedAt,
    ...(attempt.started_at ? { elapsed_ms: Date.parse(endedAt) - Date.parse(attempt.started_at) } : {}),
    ...(outcome === "succeeded" ? {} : { error_message: message }),
  });
}

/**
 * Close an attempt the server never claimed, in one conditional write. If it succeeds, no model call was made
 * for the attempt and none can be: the server's claim needs the same unclaimed state and now cannot get it.
 * If it does not, the server holds the claim and the outcome is whatever the server records.
 */
export const voidAttempt = async (attemptId) => took(await base44.entities.RunAttempt.updateMany(
  { id: attemptId, claim_state: "unclaimed", outcome: "in_flight" },
  { $set: { claim_state: "void", outcome: "not_started", settled_by: "recovery", ended_at: new Date().toISOString(), error_message: "No model call was made for this attempt" } }));

/** Free the run's execution slot if this settled attempt still holds it. Conditional, so it can only free its own. */
export const releaseSlot = (runId, attemptId) =>
  base44.entities.Run.updateMany({ id: runId, active_attempt_id: attemptId }, { $set: { active_attempt_id: "" } });

/**
 * Settle a revision once and return the settled record.
 *  - succeeded: the validated artifact;
 *  - failed: settled failure evidence. A parsed artifact that failed mandatory validation is kept on the FAILED
 *    revision, with its validation errors, for diagnosis only — a failed revision is never read as cognition;
 *  - cancelled (`notStarted`): no model call was ever made for this revision. That is not a failure of the stage.
 */
export async function settleStage(stage, { output, validation, evidence, message, notStarted }) {
  const completed_at = new Date().toISOString();
  const patch = notStarted ? { status: "cancelled", error_class: "not_started", error_message: notStarted, completed_at }
    : evidence ? { status: "failed", error_class: evidence, error_message: message, completed_at, ...(validation ? { output, validation } : {}) }
    : { status: "succeeded", output, validation, completed_at };
  await base44.entities.RunStage.update(stage.id, patch);
  return { ...stage, ...patch };
}
// A revision is settled only from an outcome that actually exists: one this session awaited, one the server
// recorded, or the proof that no call was made. Nothing here settles anything because time passed.