/**
 * JANUS CANONICAL STAGE ENGINE — Phase 4.
 * One implementation of: stage context → compile → invoke → parse → validate → persist → report.
 * It is independent of who schedules it. Adapters (browser today, server later) choose WHICH stage keys
 * to ask for; they never build prompts, call the model or decide what counts as completed.
 */
import { MODE_PROFILES, STAGE_ORDER } from "@/lib/janus/protocolRegistry";
import { STORAGE_MODEL } from "@/lib/janus/stageModel";
import { loadRunView, updateRun } from "@/lib/janus/stageStore";
import { runStage } from "@/lib/janus/stageRunner";
import { compileStage, stageInputs, requiredInputs } from "@/lib/janus/stageCompiler";
import { stageFailures } from "@/lib/janus/executionState";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { generateMarkdown } from "@/components/janus/promptUtils";

const MAX_RAW_JSON_LENGTH = 200000;
const MAX_MD_LENGTH = 60000;
const cap = (s, max) => (s.length <= max ? s : `${s.slice(0, max)}\n\n[TRUNCATED — original was ${s.length} chars]`);

export const configOf = (run) => ({
  queryText: run.query_text,
  outputMode: run.output_mode,
  blueprintLevel: run.blueprint_level || "L2",
  noveltyDial: run.novelty_dial || "medium",
  refreshEnabled: !!run.refresh_enabled,
});

/**
 * Execute one stage against the durable view. Inputs and exact dependency revisions are whatever the view
 * holds as active. Returns { record } | { failure } (both settled) or { skipped } (a required input is absent).
 */
export async function executeStage({ view, stageKey, origin, evidence = [], onBegan }) {
  const active = (k) => view.stageInfo[k]?.active;
  const missing = requiredInputs(stageKey).filter(k => !active(k));
  if (missing.length) return { skipped: { stageKey, missing } };
  const inputKeys = stageInputs(stageKey).filter(active);
  const compiled = compileStage({
    stageKey, config: configOf(view.run), evidence,
    inputs: Object.fromEntries(inputKeys.map(k => [k, active(k).output])),
  });
  return runStage({
    runId: view.run.id, stageKey, origin, onBegan,
    revision: (view.stageInfo[stageKey]?.max_revision || 0) + 1,
    dependsOn: inputKeys.map(k => active(k).id),
    templateVersion: compiled.templateVersion, sources: compiled.sources,
    prompt: compiled.prompt, parseKey: compiled.parseKey,
  });
}

/**
 * Advance through `keys` in order, reading durable state before every stage.
 *  - a stage that already has a valid revision is not regenerated (unless `force`: an explicit rerun);
 *  - a stage whose newest revision is still running is unresolved: nothing is started and the drive stops;
 *  - a persisted cancellation request stops scheduling at the next stage boundary.
 * Ends as { errors } | { errors, cancelled } | { errors, unresolved }.
 */
export async function driveStages({ runId, keys, origin, force = false, onDurableChange = async () => {} }) {
  const errors = [];
  for (const stageKey of keys) {
    const view = await loadRunView(runId);
    const staged = view.storage === STORAGE_MODEL.staged;
    if (staged && view.run.status === "cancel_requested") return { errors, cancelled: true };
    const info = view.stageInfo[stageKey];
    if (info?.latest?.status === "running") return { errors, unresolved: stageKey };
    if (!force && info?.active) continue;

    const res = await executeStage({ view, stageKey, origin, onBegan: () => onDurableChange(runId) });
    if (res.skipped) continue;
    if (res.failure) errors.push(res.failure.message);
    if (staged) await updateRun(runId, { current_stage: stageKey });
    await onDurableChange(runId);
  }
  return { errors };
}

/**
 * Close a drive: lifecycle status + derived caches, all read back from durable stages.
 * Historical Runs are never written. An unresolved drive leaves the run open.
 * Interim status rule (unchanged): Phase 5 replaces it with the completion manifest.
 */
export async function finalizeRun(runId, outcome = {}) {
  const view = await loadRunView(runId);
  if (view.storage !== STORAGE_MODEL.staged || outcome.unresolved) return view;
  const { run, artifacts } = view;
  const required = MODE_PROFILES[run.execution_mode]?.stages || STAGE_ORDER.filter(k => artifacts[k]);
  const validation = validateJanusOutput(artifacts, required);
  const normalized = validation.normalized || artifacts;
  const errors = [...validation.errors, ...stageFailures(view).map(f => f.message)];
  const cancelled = outcome.cancelled || run.status === "cancel_requested";
  const status = cancelled ? "cancelled" : Object.keys(artifacts).length === 0 ? "failed" : "completed";
  await updateRun(runId, {
    status,
    render_md: cap(generateMarkdown(normalized, run.execution_mode), MAX_MD_LENGTH),
    raw_json: cap(JSON.stringify(normalized), MAX_RAW_JSON_LENGTH),
    validation_errors: errors,
    ...(status === "failed" ? { error_message: errors.join("\n") } : {}),
  });
  return loadRunView(runId);
}