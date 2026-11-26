/**
 * JANUS EXECUTION STATE — derived from durable stage records (Phase 4, pure).
 * The engine uses it to decide what still has to run; Results and the BottomAccessory use it to show
 * progress. Nothing here is stored and nothing here comes from a callback or a timer.
 */
import { MODE_PROFILES, PAIRS, DOMAINS, DOMAIN_ORDER } from "@/lib/janus/protocolRegistry";
import { STORAGE_MODEL, STAGE_KEY_ORDER, QUALIFICATION_KEY, intersectionKey } from "@/lib/janus/stageModel";
import { UI_STATES, TERMINAL_STATES, RETRY_POLICY, retryDecision } from "@/lib/janus/lifecycleContract";

/**
 * SAME-REVISION RETRY CONTINUATION (Phase 6) — read from the durable attempt ledger of ONE revision, never stored.
 * A revision is one logical artifact-generation operation (fixed dependencies, protocol, template, fingerprint);
 * its attempts are executions of that operation. Losing the session is not a new operation, so a revision whose
 * last call settled as a retryable failure with budget left is CONTINUED at its next attempt — it is not closed
 * and regenerated with a fresh budget.
 *
 * A running revision is waiting for its next attempt only when ALL of this holds:
 *   - none of its attempts is in flight (an in-flight attempt may be a live call: that is unresolved, not waiting);
 *   - its last attempt that made a call recorded `retry_scheduled` — the durable record that the revision's next
 *     valid operation is another attempt (written by the session that awaited the call, or by recovery);
 *   - the bounded policy, recomputed from the recorded outcome and the number of calls made, still allows it.
 * Attempts that never made a call (`not_started`) bought nothing and use none of the budget: the next attempt
 * number is the number of calls made plus one, so the ceiling is counted in calls and can never be reset.
 * Anything else — including a running revision with no attempt records at all — is not waiting.
 */
export function continuationOf(stage, attempts = []) {
  if (stage?.status !== "running" || attempts.some(a => a.outcome === "in_flight")) return null;
  const called = attempts.filter(a => a.outcome !== "not_started");
  const last = called[called.length - 1];
  if (!last || last.retry_decision !== "retry_scheduled") return null;
  if (retryDecision(last.outcome, called.length) !== "retry_scheduled") return null;
  return { stageId: stage.id, stageKey: stage.stage_key, revision: stage.revision, callsMade: called.length, nextAttempt: called.length + 1, after: last };
}

/**
 * Where a revision of `stageKey` may be left WAITING for its next attempt: only where an operator action can still
 * reach it. A run stage: an open staged run (Resume continues it). The quality evaluation: a completed staged run
 * (it runs after completion, and "Continue evaluation" continues it — run completion stays distinct from
 * qualification). Anywhere else (cancellation, a run whose lifecycle ended, a historical Run) the revision is
 * settled from its last actual call.
 */
export const continuableFor = (run, stageKey) => run?.storage_model === STORAGE_MODEL.staged
  && run.status === (stageKey === QUALIFICATION_KEY ? "completed" : "running");

const laterDomain = (pair) => pair.domains.reduce((a, b) => (DOMAIN_ORDER.indexOf(a) > DOMAIN_ORDER.indexOf(b) ? a : b));

/** Ordered stage keys a mode executes. A pair becomes available once its later domain has settled. */
export function stagePlan(mode) {
  const stages = (MODE_PROFILES[mode] || MODE_PROFILES.standard).stages;
  const withPairs = stages.includes("synthesis");
  return stages.flatMap(s => [s, ...(withPairs ? PAIRS.filter(p => laterDomain(p) === s).map(p => intersectionKey(p.id)) : [])]);
}

export function stageLabel(key) {
  const pair = PAIRS.find(p => intersectionKey(p.id) === key);
  if (pair) return pair.domains.map(d => DOMAINS[d].label).join(" × ");
  if (key === QUALIFICATION_KEY) return "Quality qualification";
  return DOMAINS[key]?.label || key.charAt(0).toUpperCase() + key.slice(1);
}

/** Settled failure evidence: stages whose newest revision failed. */
export const stageFailures = (view) => STAGE_KEY_ORDER
  .map(k => view.stageInfo[k]?.latest)
  .filter(s => s?.status === "failed")
  .map(s => ({ key: s.stage_key, evidence: s.error_class || "provider_error", message: s.error_message || `${s.stage_key}: failed`,
    attempts: attemptsMade(view, s), superseded: !!view.stageInfo[s.stage_key].active }));
/** Attempts that actually made (or are making) a model call for a revision — retry telemetry. */
function attemptsMade(view, stage) {
  return (view.attempts?.[stage?.id] || []).filter(a => a.outcome !== "not_started").length;
}

const EXTRA_LABELS = {
  interrupted: "Interrupted — no session is running this",
  unresolved: "Unresolved call — outcome unknown, nothing further can start",
  idle: "Idle",
};

/**
 * `driving` is the one non-durable fact: whether THIS session is currently scheduling the run.
 * It never changes which stages count as completed — only how an open run is described.
 */
export function deriveExecutionState(view, { driving = false } = {}) {
  const { run, stageInfo, storage } = view;
  const staged = storage === STORAGE_MODEL.staged;
  const plan = stagePlan(run.execution_mode);
  const keys = [...plan, ...STAGE_KEY_ORDER.filter(k => !plan.includes(k) && stageInfo[k])];
  // A revision can be waiting for its next attempt only where it can still be continued (continuableFor).
  // Elsewhere the same records read as an unsettled revision, which "Check recorded outcome" closes from its
  // last actual call.
  const rows = keys.map(key => {
    const info = stageInfo[key];
    const running = info?.latest?.status === "running";
    // A running revision whose last call settled as a retryable failure is waiting for its next attempt, not live.
    const waiting = running && continuableFor(run, key) ? continuationOf(info.latest, view.attempts?.[info.latest.id]) : null;
    const state = waiting ? "awaiting" : running ? "live" : info?.active ? "completed" : info?.latest?.status === "failed" ? "failed" : "pending";
    return { key, label: stageLabel(key), state, revision: info?.active?.revision ?? null, attempts: attemptsMade(view, info?.latest),
      ...(waiting ? { nextAttempt: waiting.nextAttempt, lastEvidence: waiting.after.outcome } : {}) };
  });
  const live = rows.find(r => r.state === "live") || null;
  // A waiting evaluation belongs to a completed run: it is continued from the qualification controls, never by Resume.
  const awaiting = rows.find(r => r.state === "awaiting" && r.key !== QUALIFICATION_KEY) || null;
  const qualificationAwaiting = rows.find(r => r.state === "awaiting" && r.key === QUALIFICATION_KEY) || null;
  // The revision waiting for its retry is continued before anything else is started.
  const remaining = [...(awaiting ? [awaiting] : []), ...rows.filter(r => r.state === "pending" || r.state === "failed")];

  let status = run.status || "idle";
  if (status !== "cancel_requested" && status !== "cancelled") {
    if (live) status = driving ? "running" : "unresolved";
    else if (driving) status = "running";
    else if (staged && status === "running") status = "interrupted";
  }
  const label = status === "cancel_requested" && !live ? "Cancelling" : UI_STATES[status]?.label || EXTRA_LABELS[status] || status;
  const ended = staged && TERMINAL_STATES.includes(run.status);

  return {
    staged, status, label, rows, live, awaiting, qualificationAwaiting,
    completed: rows.filter(r => r.state === "completed").length,
    total: rows.length,
    next: live ? null : remaining[0] || null,
    failures: stageFailures(view),
    // Ordinary resume exists only for an open, interrupted run. A terminal run is never resumed: what it
    // lacks can only come from an explicit re-run, which produces a new revision.
    resumable: staged && !ended && !driving && !live && remaining.length > 0 && run.status !== "cancel_requested",
    endedIncomplete: ended && !driving && remaining.length > 0,
    cancellable: staged && run.status === "running",
    unresolved: !driving && !!live,
    maxAttempts: RETRY_POLICY.max_attempts_per_stage,
  };
}