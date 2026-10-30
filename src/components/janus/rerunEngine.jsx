// Domain Re-run Engine — surgical re-execution of synthesis or blueprint
// Reads the durable run view (stage revisions, or the legacy adapter for historical Runs) and writes
// NEW stage revisions — earlier revisions are never overwritten. Historical Run records are never written.

import { base44 } from "@/api/base44Client";
import { validateJanusOutput } from "./janusSchema";
import { generateMarkdown } from "./promptUtils";
import { PAIRS, STAGE_ORDER, patternTaskText, patternJsonTemplate } from "@/lib/janus/protocolRegistry";
import { runStage } from "@/lib/janus/stageRunner";
import { loadRunView } from "@/lib/janus/stageStore";
import { STORAGE_MODEL, PROMPT_TEMPLATES, INTERSECTION_KEYS, intersectionKey } from "@/lib/janus/stageModel";

const MAX_RAW_JSON_LENGTH = 200000;
const CORE_DOMAINS = ["corpus", "cogito", "animus", "actus"];

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n\n[TRUNCATED — original was " + str.length + " chars]";
}

// ─── SYNTHESIS MODELS (intersection pair config) ───
// Derived from canonical registry — no local roster.
const SYNTHESIS_MODELS = Object.fromEntries(PAIRS.map(p => [p.model, { name: p.resolution_label, domains: p.domains }]));

const INTERSECTION_PAIRS = [
  ...PAIRS.map(p => ({ pair: p.id, domains: p.domains, model: p.model })),
];

// ─── Build intersection prompt (same logic as ExecutionEngine) ───
function buildIntersectionPrompt(pairKey, modelKey, domainA, domainB, dataA, dataB, queryText) {
  const model = SYNTHESIS_MODELS[modelKey];
  const contextA = JSON.stringify(dataA).slice(0, 6000);
  const contextB = JSON.stringify(dataB).slice(0, 6000);

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — CROSS-DOMAIN SYNTHESIS

You are the Janus Synthesis Engine performing a SINGLE intersection analysis.
Your task: find what EMERGES at the intersection of two expert domains that NEITHER domain alone could produce.

═══ INTERSECTION: ${model.name} ═══

═══ DOMAIN A ═══
${contextA}

═══ DOMAIN B ═══
${contextB}

CRITICAL INSTRUCTION: The insight you produce MUST be EMERGENT — something that could NOT have come from either domain alone.

Output ONLY valid JSON: { "${pairKey}": { "insight": "the emergent wisdom", "tension": "where domains pull differently", "resolution": "how tension resolves" } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// ─── Build synthesis named patterns prompt ───
function buildSynthesisNamedPatternsPrompt(intersections, queryText) {
  const matrixEntries = Object.entries(intersections)
    .map(([key, val]) => {
      return `═══ ${key.toUpperCase()} ═══\nInsight: ${val.insight || "(not computed)"}\nTension: ${val.tension || "(not computed)"}\nResolution: ${val.resolution || "(not computed)"}`;
    })
    .join("\n\n");

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: SYNTHESIS — THE NEXUS (Section V)

You are the Janus Synthesis Engine. The 6 domain intersection pairs have ALREADY been computed.
Your task: produce the 4 NAMED EMERGENT PATTERNS and final cross-domain summary.

═══ THE 6 PRE-COMPUTED INTERSECTION PAIRS ═══

${matrixEntries}

Produce:
${patternTaskText()}

Also: key_takeaways, constraint_collisions, limitation_foreground

Output ONLY valid JSON: { "synthesis": {
  "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...",
${patternJsonTemplate()}
} }

IMPORTANT: Do NOT include intersection_matrix — already stored separately.
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// ─── Build blueprint prompt from the composed durable view ───
// Reads: the six intersections, Actus, Corpus, Animus (recorded as its exact dependencies below).
function buildBlueprintPrompt(source) {
  const parts = [];

  // Intersection insights for blueprint context
  if (source.synthesis?.intersection_matrix) {
    parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS (The Nexus) ═══");
    Object.entries(source.synthesis.intersection_matrix).forEach(([key, data]) => {
      parts.push(`  ▸ ${key}`);
      if (data.insight) parts.push(`    Insight: ${data.insight}`);
      if (data.tension) parts.push(`    Tension: ${data.tension}`);
      if (data.resolution) parts.push(`    Resolution: ${data.resolution}`);
    });
  }

  if (source.actus?.recommendations?.length) {
    parts.push("\n═══ ACTUS: Key Recommendations ═══");
    source.actus.recommendations.forEach(r => parts.push(`  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${r.text}`));
  }

  if (source.corpus?.constraints?.length) {
    parts.push("\n═══ CORPUS: Hard Constraints ═══");
    source.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
  }

  if (source.animus?.ethical_stance) {
    parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${source.animus.ethical_stance}`);
  }

  const blueprintLevel = source.blueprint_level || "L2";
  const noveltyDial = source.novelty_dial || "medium";

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT (Executable Deliverable)
You are the Janus Blueprint Module.
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${source.output_mode}.
${noveltyDial === "high" ? "alternative_approaches REQUIRED." : ""}

${parts.join("\n")}

Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], ${noveltyDial === "high" ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[]${blueprintLevel !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${blueprintLevel === "L2" || blueprintLevel === "L3" ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${blueprintLevel === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${source.query_text}`;
}

// ─── DURABLE RERUN HELPERS ───

async function loadForRerun(runId, target) {
  const view = await loadRunView(runId);
  if (!view) throw new Error("Run not found");
  const missing = CORE_DOMAINS.filter(d => !view.artifacts[d]);
  if (missing.length > 0) throw new Error(`Cannot re-run ${target} — missing prerequisite domains: ${missing.join(", ")}`);
  return view;
}

const nextRevision = (view, key) => (view.stageInfo[key]?.max_revision || 0) + 1;

const rerunStage = (view, stageKey, prompt, parseKey, dependsOn) => runStage({
  runId: view.run.id, stageKey, revision: nextRevision(view, stageKey), dependsOn,
  templateVersion: PROMPT_TEMPLATES.rerun, origin: "rerun", prompt, parseKey,
});

// Staged runs refresh their lifecycle fields and derived caches from the durable view.
// Historical Runs are never written — their reruns live entirely in RunStage.
async function finalizeRerun(runId, errors, errorPattern, hasTarget) {
  const view = await loadRunView(runId);
  if (view.storage !== STORAGE_MODEL.staged) return;
  const keys = STAGE_ORDER.filter(d => view.artifacts[d]);
  const validation = validateJanusOutput(view.artifacts, keys);
  const renderMd = generateMarkdown(validation.normalized || view.artifacts, view.run.execution_mode);

  await base44.entities.Run.update(runId, {
    status: errors.length > 0 && !hasTarget(view.artifacts) ? "failed" : "completed",
    render_md: safeTruncate(renderMd, 60000),
    raw_json: safeTruncate(JSON.stringify(validation.normalized || view.artifacts), MAX_RAW_JSON_LENGTH),
    validation_errors: [...(view.run.validation_errors || []).filter(e => !errorPattern.test(e)), ...errors],
  });
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API — rerunSynthesis / rerunBlueprint
// ═══════════════════════════════════════════════════════════════

/**
 * Re-run synthesis for an existing run.
 * Writes new revisions of all 6 intersection pairs + the 4 named patterns; the dependent
 * Blueprint becomes stale (derived) until it is re-run against the new revisions.
 * Requires: corpus, cogito, animus, actus present in the durable view.
 */
export async function rerunSynthesis(runId, onProgress) {
  onProgress({ domain: "synthesis", status: "starting", detail: "Loading existing run data..." });

  const view = await loadForRerun(runId, "synthesis");
  const { run, artifacts, stageInfo } = view;
  if (view.storage === STORAGE_MODEL.staged) await base44.entities.Run.update(runId, { status: "running" });

  const intersections = {};
  const newIds = [];
  const errors = [];

  // Step 1: Recompute all 6 intersection pairs as new revisions
  for (let i = 0; i < INTERSECTION_PAIRS.length; i++) {
    const { pair, domains: [dA, dB], model } = INTERSECTION_PAIRS[i];
    onProgress({ domain: `synthesis:${pair}`, status: "running", detail: `Computing intersection ${i + 1}/6: ${pair}`, completedDomains: i, totalDomains: 8 });

    const prompt = buildIntersectionPrompt(pair, model, dA, dB, artifacts[dA], artifacts[dB], run.query_text);
    const res = await rerunStage(view, intersectionKey(pair), prompt, pair, [stageInfo[dA].active.id, stageInfo[dB].active.id]);
    if (res.record) { intersections[pair] = res.record.output; newIds.push(res.record.id); }
    else errors.push(res.failure.message);
  }

  // Step 2: Compute named patterns from exactly the new intersection revisions
  onProgress({ domain: "synthesis:patterns", status: "running", detail: "Computing 4 named emergent patterns...", completedDomains: 6, totalDomains: 8 });
  const patterns = await rerunStage(view, "synthesis", buildSynthesisNamedPatternsPrompt(intersections, run.query_text), "synthesis", newIds);
  if (!patterns.record) errors.push(patterns.failure.message);

  // Step 3: Finalize
  onProgress({ domain: "synthesis", status: "finalizing", detail: "Updating run record...", completedDomains: 7, totalDomains: 8 });
  await finalizeRerun(runId, errors, /synthesis|intersection/, a => !!a.synthesis?.intersection_matrix);

  onProgress({ domain: null, status: "completed", detail: "Synthesis re-run complete" });
  return { success: errors.length === 0, errors };
}

/**
 * Re-run blueprint for an existing run as a new revision.
 * Requires: corpus, cogito, animus, actus present; intersections are used when available.
 */
export async function rerunBlueprint(runId, onProgress) {
  onProgress({ domain: "blueprint", status: "starting", detail: "Loading existing run data..." });

  const view = await loadForRerun(runId, "blueprint");
  if (view.storage === STORAGE_MODEL.staged) await base44.entities.Run.update(runId, { status: "running" });

  onProgress({ domain: "blueprint", status: "running", detail: "Generating blueprint from stored domain data...", completedDomains: 0, totalDomains: 1 });

  const source = { ...view.run, ...view.artifacts };
  const dependsOn = [...INTERSECTION_KEYS, "actus", "corpus", "animus"]
    .map(k => view.stageInfo[k]?.active?.id)
    .filter(Boolean);
  const res = await rerunStage(view, "blueprint", buildBlueprintPrompt(source), "blueprint", dependsOn);
  const errors = res.record ? [] : [res.failure.message];

  // Finalize
  onProgress({ domain: "blueprint", status: "finalizing", detail: "Updating run record..." });
  await finalizeRerun(runId, errors, /blueprint/, a => !!a.blueprint);

  onProgress({ domain: null, status: "completed", detail: "Blueprint re-run complete" });
  return { success: errors.length === 0, errors };
}