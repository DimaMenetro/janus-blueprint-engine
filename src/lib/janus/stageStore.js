/**
 * JANUS STAGE STORE — durable RunStage / RunAttempt persistence (Phase 3).
 * A stage revision is created when its attempt starts and settled exactly once; it is never rewritten after.
 * Reads compose through runView, so the frontend and both engines share one durable truth.
 */
import { base44 } from "@/api/base44Client";
import { PROTOCOL, MODEL_POLICY } from "@/lib/janus/protocolRegistry";
import { ENGINE_VERSION, ORCHESTRATOR, fingerprintInputs } from "@/lib/janus/stageModel";
import { composeRunView } from "@/lib/janus/runView";

const STAGE_LIMIT = 1000;

/** Run + every stage revision, composed (historical Runs go through the legacy adapter). */
export async function loadRunView(runId) {
  const [run] = await base44.entities.Run.filter({ id: runId });
  if (!run) return null;
  const stages = await base44.entities.RunStage.filter({ run_id: runId }, "created_date", STAGE_LIMIT);
  return composeRunView(run, stages);
}

export async function beginStage({ runId, stageKey, revision, dependsOn, templateVersion, prompt, origin }) {
  const startedAt = new Date().toISOString();
  const stage = await base44.entities.RunStage.create({
    run_id: runId, stage_key: stageKey, revision, status: "running",
    protocol_version: PROTOCOL.version, engine_version: ENGINE_VERSION, prompt_template_version: templateVersion,
    depends_on: dependsOn, input_fingerprint: await fingerprintInputs({ stageKey, templateVersion, dependsOn, prompt }),
    provenance: { origin, orchestrator: ORCHESTRATOR, model_policy: MODEL_POLICY.operational_model },
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