/**
 * JANUS STAGE RUNNER — one durable LLM stage: begin → attempt → settle → (bounded retry) → settle the revision.
 * The only place Janus requests a model call. The call runs server-side in the `invokeJanusStage` function,
 * which owns it: it takes the run's execution slot, claims the attempt once, and records the outcome.
 * Completion-oriented: Janus adds no deadline and waits for the call to settle. Elapsed time is telemetry only.
 * Failure is only ever settled from evidence: what the function reported, what the server recorded, or a
 * response the platform actually sent. A request that simply went silent is unresolved, not failed.
 * Model policy: no per-call override — every call inherits the operator's Claude Opus setting.
 */
import { base44 } from "@/api/base44Client";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { beginStage, openAttempt, settleAttempt, settleStage, readAttempt, voidAttempt, releaseSlot, runStatus } from "@/lib/janus/stageStore";
import { classifyParseError, parseKeyOf, QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { QUALITY_CRITERIA, criterionApplies, retryDecision } from "@/lib/janus/lifecycleContract";

const STAGE_FUNCTION = "invokeJanusStage";

/**
 * Ask the server to make the call for one attempt. Never throws; reports what is actually known:
 *  returned | failed (the function's own statement) | refused (no call was made) |
 *  platform (an HTTP error that is not the function's own) | unknown (no response at all).
 */
export async function callLLM(attemptId, prompt) {
  try {
    const { data } = await base44.functions.invoke(STAGE_FUNCTION, { attempt_id: attemptId, prompt });
    return { state: "returned", result: data.result, recorded: data.recorded !== false };
  } catch (err) {
    const res = err?.response, body = res?.data;
    if (body?.evidence === "not_started") return { state: "refused", reason: body.reason || null, message: body.error };
    if (body?.evidence) return { state: "failed", evidence: body.evidence, message: body.error, recorded: body.recorded !== false };
    return { state: res?.status ? "platform" : "unknown", http_status: res?.status, message: err?.message || String(err) };
  }
}

/** The outcome the server recorded on an attempt, in the same shape callLLM reports. */
const recordedTransport = (attempt) => (attempt.transport.state === "returned"
  ? { state: "returned", result: attempt.response_text }
  : { state: "failed", evidence: attempt.transport.evidence, message: attempt.transport.message });

/** The function itself said nothing. Evidence is then the server's record, or a response the platform sent. */
async function afterSilence(attempt, silent) {
  const now = await readAttempt(attempt.id);
  if (now?.transport) return recordedTransport(now);
  if (silent.state === "unknown") return silent; // no response of any kind: the call may still be running
  if (now?.claim_state !== "claimed" && await voidAttempt(attempt.id)) {
    return { state: "refused", reason: "rejected", message: `The request was rejected before any call was made (HTTP ${silent.http_status})` };
  }
  return silent;
}

export function parseLLMResponse(result, expectedKey) {
  let data;
  if (typeof result === "string") {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: `${expectedKey}: No JSON found in string response` };
    data = JSON.parse(jsonMatch[0]);
  } else {
    data = result;
  }
  if (data && data[expectedKey]) return { data: data[expectedKey] };
  if (data && typeof data === "object" && Object.keys(data).length > 0) return { data };
  return { error: `${expectedKey}: Missing key in response` };
}

export function validateStageOutput(stageKey, output) {
  if (stageKey === QUALIFICATION_KEY) {
    // Every applicable critique criterion needs a verdict and its evidence. Whether the verdict counts is the contract's call.
    const errors = QUALITY_CRITERIA.filter(c => c.method === "critique" && criterionApplies(c)).flatMap(c => {
      const v = output?.verdicts?.[c.id];
      return typeof v?.verdict === "string" && v.reason ? [] : [`qualification.verdicts.${c.id}: verdict and reason required`];
    });
    return { validator: "qualification-verdicts", valid: errors.length === 0, errors };
  }
  if (stageKey.startsWith("intersection:")) {
    const errors = ["insight", "tension", "resolution"].filter(f => !output?.[f]).map(f => `${stageKey}.${f}: missing`);
    return { validator: "intersection-fields", valid: errors.length === 0, errors };
  }
  const { errors } = validateJanusOutput({ [stageKey]: output }, [stageKey]);
  return { validator: "janusSchema", valid: errors.length === 0, errors };
}

/** Settled-outcome classifier: a settled transport → the attempt's actual outcome (plan §12.2). */
export function resolveTransport(stageKey, t) {
  if (t.state === "failed") return { outcome: t.evidence, message: `LLM call failed — ${t.message}` };
  if (t.state === "platform") return { outcome: "platform_termination", message: `The platform ended the request (HTTP ${t.http_status}) and no outcome was recorded` };
  const parseKey = parseKeyOf(stageKey);
  let parsed;
  try { parsed = parseLLMResponse(t.result, parseKey); } catch (e) { return { outcome: "parse_failure", message: `Parse error — ${e.message}` }; }
  if (parsed.error) return { outcome: classifyParseError(parsed.error), message: parsed.error.replace(`${parseKey}: `, "") };
  const validation = validateStageOutput(stageKey, parsed.data);
  // Parsed but invalid is settled failure evidence, never successful cognition.
  if (!validation.valid) {
    const shown = validation.errors.slice(0, 5).join("; ") + (validation.errors.length > 5 ? ` (+${validation.errors.length - 5} more)` : "");
    return { outcome: "schema_failure", message: `Output failed mandatory validation — ${shown}`, output: parsed.data, validation };
  }
  return { outcome: "succeeded", output: parsed.data, validation };
}

async function settleRevision(stage, res, attempts) {
  if (res.outcome === "succeeded") return { record: await settleStage(stage, { output: res.output, validation: res.validation }) };
  const message = `${stage.stage_key}: ${res.message}${attempts > 1 ? ` (after ${attempts} attempts)` : ""}`;
  await settleStage(stage, { evidence: res.outcome, message, output: res.output, validation: res.validation });
  return { failure: { evidence: res.outcome, message, attempts } };
}

/** Attempts in sequence. The next one is opened only after the previous one has settled, never beside it. */
async function work(stage, prompt, onChange) {
  let previous = null;
  for (let n = 1; ; n += 1) {
    const attempt = await openAttempt(stage, n);
    let t = await callLLM(attempt.id, prompt);
    if (t.state === "platform" || t.state === "unknown") t = await afterSilence(attempt, t);
    if (t.state === "unknown") return { unresolved: stage.stage_key };
    if (t.state === "refused") {
      await settleAttempt(attempt, { outcome: "not_started", message: t.message });
      if (previous) return settleRevision(stage, previous, n - 1); // the retry could not start: the last real outcome stands
      const message = `${stage.stage_key}: ${t.message}`;
      await settleStage(stage, { notStarted: message });
      return { refused: { reason: t.reason, message } };
    }
    const res = resolveTransport(stage.stage_key, t);
    let decision = retryDecision(res.outcome, n);
    if (decision === "retry_scheduled" && (await runStatus(stage.run_id)) !== "running") decision = "none"; // cancellation stops retries too
    await settleAttempt(attempt, { outcome: res.outcome, message: res.message, retryDecision: decision });
    if (t.recorded !== true) await releaseSlot(stage.run_id, attempt.id);
    if (decision !== "retry_scheduled") return settleRevision(stage, res, n);
    previous = res;
    if (onChange) await onChange(stage);
  }
}

// Stages this session is working. A second attempt for the same stage is refused locally as well as by the server.
const unresolved = new Set();
export const UNRESOLVED_ATTEMPT = "a previous attempt for this stage has not settled — no overlapping attempt is started";

/**
 * Runs one stage durably. Ends as { record } (success), { failure: { evidence, message, attempts } } (settled
 * failure), { refused } (the server made no call) or { unresolved } (outcome unknown — nothing was settled).
 * A failure never touches other stages. `onBegan` fires when the running revision is persisted and before each retry.
 */
export async function runStage({ prompt, parseKey: _parseKey, onBegan, ...stage }) {
  const slot = `${stage.runId}|${stage.stageKey}`;
  if (unresolved.has(slot)) throw new Error(`${stage.stageKey}: ${UNRESOLVED_ATTEMPT}`);
  unresolved.add(slot);
  try {
    const record = await beginStage({ ...stage, prompt });
    if (onBegan) await onBegan(record);
    return await work(record, prompt, onBegan);
  } finally {
    unresolved.delete(slot);
  }
}

/**
 * Resolve a revision left `running` by a session that is gone — from evidence only:
 *  - the server recorded the call's outcome → settle from that record;
 *  - the server never claimed the attempt → close it atomically; no call was made and none can be;
 *  - the server claimed it and recorded nothing → the call may still be live: unresolved, nothing is touched.
 * Recovery never starts a model call and never retries; a new attempt is an explicit resume or re-run.
 */
export async function recoverStage(stage, attempts = []) {
  const settled = (a) => !["in_flight", "not_started"].includes(a.outcome);
  const last = attempts[attempts.length - 1];
  let res = null;
  let count = attempts.filter(settled).length;
  if (last?.outcome === "in_flight") {
    if (last.transport) {
      res = resolveTransport(stage.stage_key, recordedTransport(last));
      await settleAttempt(last, { outcome: res.outcome, message: res.message, settledBy: "recovery", endedAt: last.transport.recorded_at });
      await releaseSlot(stage.run_id, last.id);
      count += 1;
    } else if (!(await voidAttempt(last.id))) {
      return { unresolved: stage.stage_key };
    }
  }
  if (!res) {
    const prior = [...attempts].reverse().find(settled);
    if (!prior) return { record: await settleStage(stage, { notStarted: `${stage.stage_key}: no model call was made for this revision` }) };
    if (prior.transport) res = resolveTransport(stage.stage_key, recordedTransport(prior));
    else if (prior.outcome !== "succeeded") res = { outcome: prior.outcome, message: prior.error_message };
    else return { record: await settleStage(stage, { notStarted: `${stage.stage_key}: the result reached a session that ended before saving it, and it was not recorded` }) };
  }
  return settleRevision(stage, res, Math.max(count, 1));
}