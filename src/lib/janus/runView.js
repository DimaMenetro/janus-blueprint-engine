/**
 * JANUS RUN VIEW — legacy adapter + durable view model (Phase 3, pure).
 * Results, export, reruns and the engine's caches all compose through this module, so every surface
 * reads one durable truth. Historical (monolithic) Runs are interpreted here and never written back.
 * Active revision and staleness are DERIVED from the append-only lineage, never stored (no split truth).
 */
import { PAIRS } from "@/lib/janus/protocolRegistry";
import {
  STORAGE_MODEL, STAGE_KEY_ORDER, INTERSECTION_KEYS, DOMAIN_ARTIFACT_KEYS,
  LEGACY_ID_PREFIX, intersectionKey, revisionLabel,
} from "@/lib/janus/stageModel";
import { stageInputs } from "@/lib/janus/stageCompiler";
import { BLUEPRINT_SUBSTAGE_KEYS } from "@/lib/janus/blueprintPipeline";

/** The inputs the canonical compiler declares for a stage key (a key it does not know declares none). */
export const declaredInputs = (key) => (STAGE_KEY_ORDER.includes(key) ? stageInputs(key) : []);

const present = (v) => !!v && typeof v === "object" && Object.keys(v).length > 0;
const orderOf = (key) => { const i = STAGE_KEY_ORDER.indexOf(key); return i < 0 ? STAGE_KEY_ORDER.length : i; };
const CORE = ["corpus", "cogito", "animus", "actus"];

export const storageOf = (run) => (run?.storage_model === STORAGE_MODEL.staged ? STORAGE_MODEL.staged : STORAGE_MODEL.legacy);

/**
 * Legacy adapter: virtual revision-0 stages for a monolithic Run. Its dependencies were never recorded,
 * so they are inferred conservatively — each artifact depends on every earlier historical artifact.
 */
export function legacyStages(run) {
  const synthesis = { ...(run.synthesis || {}) };
  const matrix = synthesis.intersection_matrix || {};
  delete synthesis.intersection_matrix;
  const residual = Object.fromEntries(Object.entries(matrix).filter(([k]) => !PAIRS.some(p => p.id === k)));
  if (present(residual)) synthesis.intersection_matrix = residual; // non-canonical historical pairs stay lossless

  const outputs = { ...Object.fromEntries(DOMAIN_ARTIFACT_KEYS.map(k => [k, run[k]])), synthesis };
  PAIRS.forEach(p => { outputs[intersectionKey(p.id)] = matrix[p.id]; });
  const keys = STAGE_KEY_ORDER.filter(k => present(outputs[k]));
  return keys.map((key, i) => ({
    id: LEGACY_ID_PREFIX + key, run_id: run.id, stage_key: key, revision: 0, status: "succeeded", legacy: true,
    output: outputs[key], depends_on: keys.slice(0, i).map(k => LEGACY_ID_PREFIX + k), dependency_basis: "inferred",
  }));
}

/**
 * Active = latest succeeded revision per key. Stale (Phase 7) = the revision no longer reflects what the run holds:
 *  - it reads a superseded revision, directly or transitively (exact recorded revision IDs); or
 *  - an input its compiler declares had no valid revision when it was compiled, and one exists now: the engine
 *    reads every active input, so a revision that recorded none of that stage was compiled without it. "Now" is
 *    the store's creation order (a revision created after this one could not have been read by it). Historical
 *    artifacts carry no such record and are judged by their recorded dependencies only.
 */
export function deriveStageGraph(stages) {
  const byId = Object.fromEntries(stages.map(s => [s.id, s]));
  const active = {}, latest = {};
  for (const s of stages) {
    if (!latest[s.stage_key] || s.revision > latest[s.stage_key].revision) latest[s.stage_key] = s;
    if (s.status === "succeeded" && (!active[s.stage_key] || s.revision > active[s.stage_key].revision)) active[s.stage_key] = s;
  }
  const memo = {};
  const unreadInput = (s) => {
    if (s.legacy || !s.created_date) return null;
    const read = new Set((s.depends_on || []).map(id => byId[id]?.stage_key).filter(Boolean));
    for (const k of declaredInputs(s.stage_key)) {
      const now = active[k];
      if (now && !now.legacy && !read.has(k) && now.created_date > s.created_date) return `${k} ${revisionLabel(now)} was produced after this revision was compiled without it`;
    }
    return null;
  };
  const staleReason = (s, trail = new Set()) => {
    if (s.id in memo) return memo[s.id];
    if (trail.has(s.id)) return null;
    trail.add(s.id);
    let reason = null;
    for (const depId of s.depends_on || []) {
      const dep = byId[depId];
      if (!dep) continue;
      const now = active[dep.stage_key];
      if (now?.id !== dep.id) { reason = `${dep.stage_key} ${revisionLabel(dep)} superseded by ${revisionLabel(now)}`; break; }
      const upstream = staleReason(dep, trail);
      if (upstream) { reason = `upstream ${dep.stage_key} is stale (${upstream})`; break; }
    }
    return (memo[s.id] = reason || unreadInput(s));
  };

  const isActive = (s) => active[s.stage_key]?.id === s.id;
  const lineage = [...stages]
    .sort((a, b) => orderOf(a.stage_key) - orderOf(b.stage_key) || a.revision - b.revision)
    .map(s => ({ ...s, lineage_state: s.status !== "succeeded" ? s.status : isActive(s) ? "active" : "superseded", stale: isActive(s) ? staleReason(s) : null }));

  const info = {};
  for (const key of new Set(stages.map(s => s.stage_key))) {
    const revs = stages.filter(s => s.stage_key === key);
    info[key] = {
      key, active: active[key] || null, latest: latest[key],
      revisions: revs.filter(s => !s.legacy).length,
      max_revision: Math.max(...revs.map(s => s.revision)),
      stale: active[key] ? staleReason(active[key]) : null,
    };
  }
  return { active, info, lineage };
}

/** The artifact shape every tab, export and prompt builder consumes. */
export function composeArtifacts(active) {
  const artifacts = {};
  DOMAIN_ARTIFACT_KEYS.forEach(k => { if (active[k]) artifacts[k] = active[k].output; });
  const syn = active.synthesis;
  const matrix = { ...(syn?.legacy ? syn.output.intersection_matrix : {}) };
  INTERSECTION_KEYS.forEach((key, i) => { if (active[key]) matrix[PAIRS[i].id] = active[key].output; });
  const patterns = { ...(syn?.output || {}) };
  delete patterns.intersection_matrix;
  if (present(matrix)) patterns.intersection_matrix = matrix;
  if (present(patterns)) artifacts.synthesis = patterns;
  return artifacts;
}

export function composeRunView(run, records = [], attempts = []) {
  const storage = storageOf(run);
  const graph = deriveStageGraph([...(storage === STORAGE_MODEL.legacy ? legacyStages(run) : []), ...records]);
  // Attempts per stage revision, in order — telemetry, and the evidence a lost session's call is resolved from.
  const byStage = {};
  [...attempts].sort((a, b) => a.attempt_number - b.attempt_number).forEach(a => { (byStage[a.stage_id] ||= []).push(a); });
  // The Blueprint pipeline's sub-artifacts (brief, candidates, decision, …, critique): the reasoning behind the
  // Blueprint, read by the Blueprint surface, the qualification and the export. Kept apart from `artifacts`, which
  // stays the set of protocol artifacts completion is counted in.
  const pipeline = Object.fromEntries(BLUEPRINT_SUBSTAGE_KEYS.filter(k => graph.active[k]).map(k => [k, graph.active[k].output]));
  return { run, storage, artifacts: composeArtifacts(graph.active), pipeline, stageInfo: graph.info, lineage: graph.lineage, attempts: byStage };
}

/** Rerun needs from durable state: missing, failed or invalid revisions, and stale dependents. */
export function rerunNeeds(view) {
  const { artifacts, stageInfo, storage, run } = view;
  const core = CORE.every(k => artifacts[k]);
  const troubled = (key) => stageInfo[key]?.latest?.status === "failed" || stageInfo[key]?.active?.validation?.valid === false;
  // Historical Runs carry their errors on the record; they count until a real revision replaces that stage.
  const legacyFlag = (key, re) => storage === STORAGE_MODEL.legacy && !stageInfo[key]?.revisions
    && (run.validation_errors || []).some(e => re.test(e));
  const blueprintStale = stageInfo.blueprint?.stale || null;
  const synthesis = !artifacts.synthesis || ["synthesis", ...INTERSECTION_KEYS].some(troubled) || legacyFlag("synthesis", /synthesis|intersection/);
  // The Blueprint is its whole pipeline (Phase 9): a failed or invalid stage anywhere in it is a Blueprint need.
  const blueprint = !artifacts.blueprint || ["blueprint", ...BLUEPRINT_SUBSTAGE_KEYS].some(troubled) || !!blueprintStale || legacyFlag("blueprint", /blueprint/);
  return { core, synthesis: core && synthesis, blueprint: core && blueprint, blueprintStale };
}