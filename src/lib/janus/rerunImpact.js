/**
 * JANUS RERUN IMPACT — Phase 7 (pure, no I/O).
 * What an explicit re-run will do, computed from the durable lineage alone: the exact recorded revision IDs every
 * revision read, plus the compiler's declared inputs (runView.deriveStageGraph uses the same two rules, so the
 * preview the operator sees and the staleness that follows are one computation, not two).
 *
 * A re-run gives each planned stage a NEW revision; nothing is overwritten and every earlier revision stays
 * inspectable. Once a new revision succeeds, the active revisions that read its predecessor — directly or through
 * other revisions — become stale (`invalidated`). With `cascade`, those affected stages are regenerated too, in
 * canonical order, each from the then-active inputs; a dependent is regenerated only if it actually became stale,
 * so a failed upstream revision invalidates nothing and the valid work is reused. Everything else is untouched.
 *
 * `token` binds a preview to the exact durable state it was computed from. The adapter refuses to execute a
 * preview whose state has changed since (fail closed): what the operator approved is what runs.
 */
import { STAGE_KEY_ORDER, QUALIFICATION_KEY, STORAGE_MODEL, revisionLabel } from "@/lib/janus/stageModel";
import { requiredInputs } from "@/lib/janus/stageCompiler";
import { declaredInputs } from "@/lib/janus/runView";
import { stagePlan, stageLabel, continuationOf } from "@/lib/janus/executionState";

const ordered = (keys) => STAGE_KEY_ORDER.filter(k => keys.has(k));
const item = (s) => ({ key: s.stage_key, label: stageLabel(s.stage_key), id: s.id, revision: revisionLabel(s) });

/** The durable state a preview depends on: run lifecycle, epoch, release, and every revision with its status. */
export const viewSignature = (view) => [view.run.status, view.run.graph_epoch || 0, view.run.released_blueprint_stage_id || "",
  ...view.lineage.map(s => `${s.id}:${s.status}`).sort()].join("|");

/** Why nothing may start now. Fragments; the adapter prefixes them with what was asked for. */
function refusalsFor(view, wanted, plan) {
  const { run, stageInfo } = view;
  const staged = view.storage === STORAGE_MODEL.staged;
  const out = [];
  if (!wanted.size) out.push("choose at least one stage");
  for (const k of wanted) {
    if (k === QUALIFICATION_KEY) out.push("the quality evaluation is not re-run as a stage; use the evaluation controls");
    else if (!STAGE_KEY_ORDER.includes(k) || (staged && !stagePlan(run.execution_mode).includes(k))) out.push(`${k} is not a stage of this run's ${run.execution_mode} plan`);
  }
  if (wanted.has("refresh") && run.refresh_enabled) out.push("live Refresh is unavailable (fail-closed)");
  if (run.status === "cancel_requested") out.push("cancellation was requested for this run; nothing new is started");
  const running = Object.values(stageInfo).map(i => i.latest).find(s => s?.status === "running");
  if (running) {
    const waiting = staged ? continuationOf(running, view.attempts?.[running.id]) : null;
    const how = running.stage_key === QUALIFICATION_KEY ? "Continue the evaluation" : "Resume the run";
    out.push(waiting ? `${running.stage_key} is waiting for its retry (attempt ${waiting.nextAttempt}). ${how} to continue it first.`
      : `a call for ${running.stage_key} has not settled and its outcome is unknown`);
  }
  for (const k of plan) {
    const absent = requiredInputs(k).filter(r => !stageInfo[r]?.active && !plan.slice(0, plan.indexOf(k)).includes(r));
    if (absent.length) out.push(`${k} needs ${absent.join(", ")}, which has no valid revision`);
  }
  return out;
}

export function rerunImpact(view, { targets = [], cascade = false } = {}) {
  const { run, stageInfo, lineage } = view;
  const wanted = new Set(targets);
  const byId = Object.fromEntries(lineage.map(s => [s.id, s]));
  const active = Object.values(stageInfo).map(i => i.active).filter(Boolean);
  const activeIds = new Set(active.map(s => s.id));

  // Does this revision read, through its recorded revisions, the active revision of a stage being re-run — or was
  // it compiled without a stage being re-run that its compiler declares as an input?
  const memo = new Map();
  const touches = (s, trail = new Set()) => {
    if (memo.has(s.id)) return memo.get(s.id);
    if (trail.has(s.id)) return false;
    trail.add(s.id);
    const read = new Set();
    let hit = false;
    for (const id of s.depends_on || []) {
      const d = byId[id];
      if (!d) continue;
      read.add(d.stage_key);
      if ((wanted.has(d.stage_key) && activeIds.has(d.id)) || touches(d, trail)) { hit = true; break; }
    }
    if (!hit && !s.legacy && s.created_date) hit = declaredInputs(s.stage_key).some(k => wanted.has(k) && !read.has(k));
    memo.set(s.id, hit);
    return hit;
  };
  const affected = active.filter(s => !wanted.has(s.stage_key) && touches(s));
  const affectedKeys = new Set(affected.map(s => s.stage_key));
  const cascadeKeys = cascade ? ordered(new Set([...affectedKeys].filter(k => k !== QUALIFICATION_KEY))) : [];
  const plan = ordered(new Set([...wanted, ...cascadeKeys]));
  const cognitive = (s) => s.stage_key !== QUALIFICATION_KEY;

  const blueprintTouched = plan.includes("blueprint") || affectedKeys.has("blueprint");
  const evaluation = stageInfo[QUALIFICATION_KEY]?.active || null;
  return {
    token: `${viewSignature(view)}#${ordered(wanted).join(",")}#${cascade ? 1 : 0}`,
    targets: ordered(wanted), cascade, plan, cascadeKeys,
    // On success each planned stage gets a new revision; these current ones become superseded (and stay inspectable).
    supersedes: plan.map(k => stageInfo[k]?.active).filter(Boolean).map(item),
    // Active revisions that become stale and are NOT regenerated by this re-run.
    invalidated: cascade ? [] : affected.filter(s => cognitive(s) && !stageInfo[s.stage_key].stale).map(item),
    alreadyStale: affected.filter(s => cognitive(s) && stageInfo[s.stage_key].stale && !plan.includes(s.stage_key)).map(item),
    unaffected: ordered(new Set(active.filter(s => cognitive(s) && !wanted.has(s.stage_key) && !affectedKeys.has(s.stage_key)).map(s => s.stage_key)))
      .map(k => item(stageInfo[k].active)),
    qualification: {
      // unchanged: the evaluation and release stand | re_evaluated: the new Blueprint gets one independent evaluation
      // once the run completes | blocked: the Blueprint becomes stale, so it is neither evaluated nor released until re-run
      next: !blueprintTouched ? "unchanged" : plan.includes("blueprint") ? "re_evaluated" : "blocked",
      evaluationInvalidated: !!evaluation && blueprintTouched,
      releaseWithdrawn: !!run.released_blueprint_stage_id && blueprintTouched,
    },
    refusals: refusalsFor(view, wanted, plan),
  };
}