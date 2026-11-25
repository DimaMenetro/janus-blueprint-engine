/**
 * JANUS STAGE RUNNER — one durable LLM stage: begin → attempt → settle → (bounded retry) → settle the revision.
 * The only place Janus requests a model call. The call itself runs server-side, in the `invokeJanusStage`
 * backend function, which accepts a stage this user owns plus its compiled prompt and forwards the prompt only.
 * That function is the single owner of the call (Phase 6): it takes the run's execution slot, claims the
 * stage's one open attempt, and records the settled outcome on the attempt.
 * Completion-oriented: Janus adds no deadline and waits for the call to settle. Elapsed time is telemetry only.
 * `invokeJanusStage` is an INTERIM secure transport: the platform ends a function request at 5 minutes. That
 * ceiling is a known limitation, not a Janus inference deadline — the production orchestration path must
 * carry legitimately longer cognition.
 *
 * EVIDENCE RULE. An attempt is settled only from one of:
 *   (a) what the function itself stated about the call (its result, or its failure class);
 *   (b) what the function recorded on the attempt (`transport`);
 *   (c) proof that no call was made: the attempt was closed while still unclaimed, in one conditional write.
 * Anything else is UNKNOWN: an HTTP error the function did not author, a request that returned abnormally, a
 * lost response, a claimed attempt with no record. An unknown outcome is unresolved — the call may still be
 * alive. Nothing is settled, nothing is retried, nothing replaces it, and the run's slot stays taken.
 * No failure class is ever inferred here; a class reaches an attempt only through (a) or (b).
 * Model policy: no per-call override — every call inherits the operator's Claude Opus setting.
 */
import { base44 } from "@/api/base44Client";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { beginStage, openAttempt, settleAttempt, settleStage, readAttempt, voidAttempt, releaseSlot, runStatus } from "@/lib/janus/stageStore";
import { classifyParseError, parseKeyOf, QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { QUALITY_CRITERIA, criterionApplies, retryDecision } from "@/lib/janus/lifecycleContract";

const STAGE_FUNCTION = "invokeJanusStage";
const NOT_STARTED = "not_started";
const CANCEL_STATES = ["cancel_requested", "cancelled"];

/**
 * Ask the function to make the call for a stage's open attempt. Resolves with the model's result.
 * Rejects with the function's own message; the error also carries what the function stated, if anything:
 *   evidence  "not_started" (it refused before any call) | a failure class (the call settled as a failure) |
 *             null (the function stated nothing — the outcome is not known from this response)
 *   reason    why it refused, when it did
 */
export async function callLLM(stageId, prompt) {
  try {
    const { data } = await base44.functions.invoke(STAGE_FUNCTION, { stage_id: stageId, prompt });
    return data.result;
  } catch (err) {
    // Keep the server's failure evidence, not the transport wrapper's generic text.
    const body = err?.response?.data;
    const detail = body?.error;
    throw Object.assign(new Error(typeof detail === "string" ? detail : err?.message || String(err)), {
      evidence: typeof body?.evidence === "string" ? body.evidence : null,
      reason: typeof body?.reason === "string" ? body.reason : null,
    });
  }
}

/** The outcome the function recorded on an attempt — evidence (b). */
const recordedTransport = (attempt) => (attempt.transport.state === "returned"
  ? { state: "returned", result: attempt.response_text }
  : { state: "failed", evidence: attempt.transport.evidence, message: attempt.transport.message });

/**
 * Make the one call for `attempt` and report what is actually known about it:
 *   returned | failed        the call settled — stated by the function (a) or read from its record (b)
 *   not_started              no call was made, and none can be: the attempt is closed (c)
 *   unknown                  none of the above. The call may be alive.
 */
async function attemptCall(stage, attempt, prompt) {
  let said;
  try { return { state: "returned", result: await callLLM(stage.id, prompt) }; } catch (err) { said = err; }
  if (said.evidence && said.evidence !== NOT_STARTED) return { state: "failed", evidence: said.evidence, message: said.message };

  // The function refused, or stated nothing at all. Neither is taken on trust: "no call was made" is only
  // established by closing the attempt while it is still unclaimed. If that write does not take, the attempt
  // is claimed — a call exists or existed — and the only remaining evidence is the function's record.
  const refused = said.evidence === NOT_STARTED;
  const message = refused ? said.message : "The request did not reach the function, so no call was made for this attempt";
  if (await voidAttempt(attempt.id, { settledBy: "session", message })) return { state: NOT_STARTED, reason: refused ? said.reason : "never_claimed", message };
  const now = await readAttempt(attempt.id);
  return now?.transport ? recordedTransport(now) : { state: "unknown" };
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

/**
 * Settled-outcome classifier (plan §12.2): a SETTLED transport → the attempt's actual outcome.
 * A failed call keeps the class the function gave it. A returned call is parsed and validated here.
 */
export function resolveTransport(stageKey, t) {
  if (t.state === "failed") return { outcome: t.evidence, message: `LLM call failed — ${t.message}` };
  const parseKey = parseKeyOf(stageKey);
  let parsed;
  try { parsed = parseLLMResponse(t.result, parseKey); } catch (e) { return { outcome: "parse_failure", message: `Parse error — ${e.message}` }; }
  if (parsed.error) return { outcome: classifyParseError(parsed.error), message: parsed.error.replace(`${parseKey}: `, "") };
  const validation = validateStageOutput(stageKey, parsed.data);
  // Parsed but invalid is settled failure evidence (plan §12.2), never successful cognition.
  if (!validation.valid) {
    const shown = validation.errors.slice(0, 5).join("; ") + (validation.errors.length > 5 ? ` (+${validation.errors.length - 5} more)` : "");
    return { outcome: "schema_failure", message: `Output failed mandatory validation — ${shown}`, output: parsed.data, validation };
  }
  return { outcome: "succeeded", output: parsed.data, validation };
}

/** Settle the revision from an attempt's actual outcome. `attempts` = how many attempts made a call. */
async function settleRevision(stage, res, attempts) {
  if (res.outcome === "succeeded") return { record: await settleStage(stage, { output: res.output, validation: res.validation }) };
  const message = `${stage.stage_key}: ${res.message}${attempts > 1 ? ` (after ${attempts} attempts)` : ""}`;
  await settleStage(stage, { evidence: res.outcome, message, output: res.output, validation: res.validation });
  return { failure: { evidence: res.outcome, message, attempts } };
}

/**
 * The attempts of one revision, strictly in sequence. Attempt n+1 is opened only after attempt n has settled
 * with a retryable outcome and the bound allows it — never beside a live or unknown attempt.
 */
async function work(stage, prompt, onChange, slot) {
  let previous = null; // the last attempt of this revision whose call actually settled: { res, n }
  for (let n = 1; ; n += 1) {
    const attempt = await openAttempt(stage, n);
    const t = await attemptCall(stage, attempt, prompt);

    // Outcome unknown: the call may be alive. The attempt stays in flight, the revision stays running, the
    // slot stays taken. No retry and no replacement follow.
    if (t.state === "unknown") return { unresolved: stage.stage_key };

    if (t.state === NOT_STARTED) {
      // No call was made for this attempt (it is already closed). If an earlier attempt of this revision
      // settled, its actual outcome stands — no new provider outcome is invented for the retry that never ran.
      if (previous) return settleRevision(stage, previous.res, previous.n);
      const message = `${stage.stage_key}: ${t.message}`;
      await settleStage(stage, { notStarted: message });
      return { refused: { reason: t.reason, message } };
    }

    const res = resolveTransport(stage.stage_key, t);
    let decision = retryDecision(res.outcome, n);
    // Cancellation stops retries as well as later stages. This attempt still keeps its real outcome.
    if (decision === "retry_scheduled" && CANCEL_STATES.includes(await runStatus(stage.run_id))) decision = "none";
    await settleAttempt(attempt, { outcome: res.outcome, message: res.message, retryDecision: decision });
    // The function frees the slot once it has recorded the outcome. If its record failed, this settlement is
    // what frees it. Conditional on this attempt holding the slot, so it can free nothing else.
    if (slot) await releaseSlot(stage.run_id, attempt.id);
    if (decision !== "retry_scheduled") return settleRevision(stage, res, n);
    previous = { res, n };
    if (onChange) await onChange(stage);
  }
}

// Stages this session is working. A second attempt for the same stage is refused here as well as by the server.
const unresolved = new Set();
export const UNRESOLVED_ATTEMPT = "a previous attempt for this stage has not settled — no overlapping attempt is started";

/**
 * Runs one stage durably. Ends as:
 *   { record }                                   success
 *   { failure: { evidence, message, attempts } } settled failure (after the retries the policy allowed)
 *   { refused: { reason, message } }             no call was made for this revision
 *   { unresolved }                               outcome unknown — nothing was settled
 * A failure never touches other stages. `onBegan` fires once the running revision is persisted and again
 * before each retry. `staged: false` (a historical Run, which has no execution slot) skips the slot release.
 */
export async function runStage({ prompt, parseKey: _parseKey, onBegan, staged, ...stage }) {
  const slotKey = `${stage.runId}|${stage.stageKey}`;
  if (unresolved.has(slotKey)) throw new Error(`${stage.stageKey}: ${UNRESOLVED_ATTEMPT}`);
  unresolved.add(slotKey);
  try {
    const record = await beginStage({ ...stage, prompt });
    if (onBegan) await onBegan(record);
    return await work(record, prompt, onBegan, staged !== false);
  } finally {
    unresolved.delete(slotKey);
  }
}

/** The revision can be closed without a live call: settle it from the last attempt whose call actually settled. */
async function settleFromLastCall(stage, called) {
  const prior = called[called.length - 1];
  // No attempt of this revision ever made a call.
  if (!prior) return { record: await settleStage(stage, { notStarted: `${stage.stage_key}: no model call was made for this revision` }) };
  // The function's record of that call is the evidence; it is resolved exactly as a live session would have.
  if (prior.transport) return settleRevision(stage, resolveTransport(stage.stage_key, recordedTransport(prior)), called.length);
  // No record (the function could not write it), but the session that held the response settled the attempt.
  if (prior.outcome !== "succeeded") return settleRevision(stage, { outcome: prior.outcome, message: prior.error_message }, called.length);
  // It settled as succeeded, yet the artifact was never recorded and that session is gone: there is nothing
  // to restore. That is neither a success nor a provider failure, and it is recorded as exactly what it is.
  return { record: await settleStage(stage, { lost: `${stage.stage_key}: the call succeeded, but its result reached only a session that ended before saving it` }) };
}

/**
 * Resolve a revision left `running` by a session that is gone — from durable evidence only.
 * `attempts` are this revision's attempts in order. The cases are kept apart on purpose:
 *
 *   last attempt                         | what is known                  | what happens
 *   -------------------------------------+--------------------------------+-------------------------------------------
 *   1 in flight, never claimed           | no call was made               | attempt closed atomically; no failure made up
 *   2 in flight, recorded: returned      | the call's actual response     | parsed, validated, settled from the record
 *   3 in flight, recorded: failed        | the call's actual failure class| settled as that class
 *   4 in flight, claimed, nothing recorded | NOTHING — it may be alive    | unresolved: nothing settled, slot stays taken
 *   5 (1) with an earlier settled attempt| that earlier outcome           | the revision keeps the earlier actual outcome
 *   – no attempt open                    | the last settled call          | the revision is settled from it
 *
 * Recovery reads and settles. It never starts a call and never retries: a stage whose recovered outcome is a
 * retryable failure is run again only by an explicit resume or re-run, as a new revision.
 * Nothing here looks at how old anything is.
 */
export async function recoverStage(stage, attempts = [], { slot = true } = {}) {
  const called = attempts.filter(a => a.outcome !== "in_flight" && a.outcome !== NOT_STARTED); // attempts whose call settled
  const last = attempts[attempts.length - 1] || null;

  if (last?.outcome === "in_flight" && last.transport) {
    // Cases 2 and 3: the function recorded the outcome.
    const res = resolveTransport(stage.stage_key, recordedTransport(last));
    await settleAttempt(last, { outcome: res.outcome, message: res.message, retryDecision: "none", settledBy: "recovery", endedAt: last.transport.recorded_at });
    if (slot) await releaseSlot(stage.run_id, last.id);
    return settleRevision(stage, res, called.length + 1);
  }

  if (last?.outcome === "in_flight") {
    // No record. Case 1 if the attempt can still be closed unclaimed; otherwise case 4.
    const neverClaimed = await voidAttempt(last.id, { settledBy: "recovery" });
    if (!neverClaimed) return { unresolved: stage.stage_key };
    return settleFromLastCall(stage, called); // case 5 when an earlier attempt settled; else no call was ever made
  }

  // No attempt is open: the session ended between settling its last attempt and settling the revision
  // (or before opening its first attempt).
  return settleFromLastCall(stage, called);
}