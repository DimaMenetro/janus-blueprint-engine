/**
 * JANUS STAGE STORE — durable Run / RunStage / RunAttempt persistence (Phase 3, extended in Phase 4).
 * A stage revision is created when its attempt starts and settled exactly once; it is never rewritten after.
 * Reads compose through runView, so the frontend and the engine share one durable truth.
 */
import { base44 } from "@/api/base44Client";
import { PROTOCOL, MODEL_POLICY } from "@/lib/janus/protocolRegistry";
import { ENGINE_VERSION, ORCHESTRATOR, STORAGE_MODEL, fingerprintInputs } from "@/lib/janus/stageModel";
import { composeRunView } from "@/lib/janus/runView";

const STAGE_LIMIT = 1000;

/** Run + every stage revision, composed (historical Runs go through the legacy adapter). */
export async function loadRunView(runId) {
  const [run] = await base44.entities.Run.filter({ id: runId });
  if (!run) return null;
  const stages = await base44.entities.RunStage.filter({ run_id: runId }, "created_date", STAGE_LIMIT);
  return composeRunView(run, stages);
}

export const createRun = (data) => base44.entities.Run.create(data);
export const updateRun = (runId, patch) => base44.entities.Run.update(runId, patch);

/** The newest staged run that is still open — how a reloaded session finds work in progress. */
export async function findOpenStagedRun() {
  const [run] = await base44.entities.Run.filter(
    { storage_model: STORAGE_MODEL.staged, status: { $in: ["running", "cancel_requested"] } }, "-created_date", 1);
  return run || null;
}

export async function beginStage({ runId, stageKey, revision, dependsOn, templateVersion, prompt, origin, sources = [] }) {
  const startedAt = new Date().toISOString();
  const stage = await base44.entities.RunStage.create({
    run_id: runId, stage_key: stageKey, revision, status: "running",
    protocol_version: PROTOCOL.version, engine_version: ENGINE_VERSION, prompt_template_version: templateVersion,
    depends_on: dependsOn, input_fingerprint: await fingerprintInputs({ stageKey, templateVersion, dependsOn, prompt }),
    provenance: { origin, orchestrator: ORCHESTRATOR, model_policy: MODEL_POLICY.operational_model, ...(sources.length ? { sources } : {}) },
    started_at: startedAt,
  });
  const attempt = await base44.entities.RunAttempt.create({
    run_id: runId, stage_id: stage.id, stage_key: stageKey, attempt_number: 1, orchestrator: ORCHESTRATOR,
    model_policy: MODEL_POLICY.operational_model, outcome: "in_flight", retry_decision: "none", started_at: startedAt,
  });
  return { stage, attempt, startedAt };
}

/** Settle once. The artifact is persisted before the telemetry. Returns the settled stage record. */
export async function settleStage({ stage, attempt, startedAt }, { output, validation, evidence, message }) {
  const endedAt = new Date().toISOString();
  const patch = evidence
    ? { status: "failed", error_class: evidence, error_message: message, completed_at: endedAt }
    : { status: "succeeded", output, validation, completed_at: endedAt };
  await base44.entities.RunStage.update(stage.id, patch);
  await base44.entities.RunAttempt.update(attempt.id, {
    outcome: evidence || "succeeded",
    ended_at: endedAt,
    elapsed_ms: Date.parse(endedAt) - Date.parse(startedAt),
    ...(evidence ? { error_message: message } : {}),
  });
  return { ...stage, ...patch };
}

/**
 * Settle a stage whose owning session is gone, on the operator's explicit confirmation.
 * The evidence is the operator's statement that the session ended — never elapsed time.
 */
export async function settleOrphanedStage(stage) {
  const endedAt = new Date().toISOString();
  const message = `${stage.stage_key}: the session that owned this call ended before its outcome was recorded (operator-confirmed)`;
  await base44.entities.RunStage.update(stage.id, { status: "failed", error_class: "platform_termination", error_message: message, completed_at: endedAt });
  const attempts = await base44.entities.RunAttempt.filter({ stage_id: stage.id });
  for (const a of attempts.filter(x => x.outcome === "in_flight")) {
    await base44.entities.RunAttempt.update(a.id, { outcome: "platform_termination", ended_at: endedAt, error_message: message });
  }
}