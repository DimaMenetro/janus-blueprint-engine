/**
 * JANUS EXECUTION STATE — derived from durable stage records (Phase 4, pure).
 * The engine uses it to decide what still has to run; Results and the BottomAccessory use it to show
 * progress. Nothing here is stored and nothing here comes from a callback or a timer.
 */
import { MODE_PROFILES, PAIRS, DOMAINS, DOMAIN_ORDER } from "@/lib/janus/protocolRegistry";
import { STORAGE_MODEL, STAGE_KEY_ORDER, QUALIFICATION_KEY, intersectionKey } from "@/lib/janus/stageModel";
import { UI_STATES, TERMINAL_STATES } from "@/lib/janus/lifecycleContract";

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
  .map(s => ({ key: s.stage_key, evidence: s.error_class || "provider_error", message: s.error_message || `${s.stage_key}: failed`, superseded: !!view.stageInfo[s.stage_key].active }));

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
  const rows = keys.map(key => {
    const info = stageInfo[key];
    const state = info?.latest?.status === "running" ? "live" : info?.active ? "completed" : info?.latest?.status === "failed" ? "failed" : "pending";
    return { key, label: stageLabel(key), state, revision: info?.active?.revision ?? null };
  });
  const live = rows.find(r => r.state === "live") || null;
  const remaining = rows.filter(r => r.state === "pending" || r.state === "failed");

  let status = run.status || "idle";
  if (status !== "cancel_requested" && status !== "cancelled") {
    if (live) status = driving ? "running" : "unresolved";
    else if (driving) status = "running";
    else if (staged && status === "running") status = "interrupted";
  }
  const label = status === "cancel_requested" && !live ? "Cancelling" : UI_STATES[status]?.label || EXTRA_LABELS[status] || status;
  const ended = staged && TERMINAL_STATES.includes(run.status);

  return {
    staged, status, label, rows, live,
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
  };
}