// Domain Re-run Engine — surgical re-execution of synthesis or blueprint
// Reads stored domain data from an existing Run and re-executes only the target domain.

import { base44 } from "@/api/base44Client";
import { validateJanusOutput } from "./janusSchema";
import { generateMarkdown } from "./promptUtils";

// ─── Re-use the LLM call + prompt builders from ExecutionEngine ───
// We import the module dynamically to avoid circular deps, but the functions
// we need are the same ones the main engine uses.

const MAX_RAW_JSON_LENGTH = 200000;

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n\n[TRUNCATED — original was " + str.length + " chars]";
}

async function callLLM(prompt) {
  return await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
  });
}

function parseLLMResponse(result, expectedKey) {
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

// ─── SYNTHESIS MODELS (intersection pair config) ───
const SYNTHESIS_MODELS = {
  knowledge_reality: { name: "Knowledge-Reality Validation", domains: ["corpus", "cogito"] },
  conscience_boundary: { name: "Conscience Boundary", domains: ["corpus", "animus"] },
  quantum_foresight: { name: "Quantum Foresight Model", domains: ["corpus", "actus"] },
  governed_cogito: { name: "Governed Cogito", domains: ["cogito", "animus"] },
  narrative_loop: { name: "The Narrative Loop", domains: ["cogito", "actus"] },
  empathy_driven_strategy: { name: "Empathy-Driven Strategy", domains: ["animus", "actus"] },
};

const INTERSECTION_PAIRS = [
  { pair: "corpus_x_cogito", domains: ["corpus", "cogito"], model: "knowledge_reality" },
  { pair: "corpus_x_animus", domains: ["corpus", "animus"], model: "conscience_boundary" },
  { pair: "corpus_x_actus", domains: ["corpus", "actus"], model: "quantum_foresight" },
  { pair: "cogito_x_animus", domains: ["cogito", "animus"], model: "governed_cogito" },
  { pair: "cogito_x_actus", domains: ["cogito", "actus"], model: "narrative_loop" },
  { pair: "animus_x_actus", domains: ["animus", "actus"], model: "empathy_driven_strategy" },
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
1. QUANTUM FORESIGHT (Corpus × Actus)
2. GOVERNED COGITO (Animus × Cogito)
3. NARRATIVE LOOP (Cogito × Actus)
4. EMPATHY-DRIVEN STRATEGY (Animus × Actus)

Also: key_takeaways, constraint_collisions, limitation_foreground

Output ONLY valid JSON: { "synthesis": {
  "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...",
  "quantum_foresight": {"cross_domain_insight":"...","probability_wave":["..."],"metaphor":"..."},
  "governed_cogito": {"ethical_filter_applied":"...","conscience_verdict":"...","truth_method_soundness":"..."},
  "narrative_loop": {"decoded_user_narrative":"...","resonant_strategy":"...","lossless_compression":"..."},
  "empathy_driven_strategy": {"true_goal_vs_literal_prompt":"...","behavioral_model":"...","empathy_strategy":"..."}
} }

IMPORTANT: Do NOT include intersection_matrix — already stored separately.
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// Maximum context size for blueprint prompt — prevents timeout on large runs
const MAX_BLUEPRINT_CONTEXT = 18000;

// ─── Build blueprint prompt from stored context ───
function buildBlueprintPrompt(run) {
  const parts = [];

  // Intersection insights for blueprint context
  if (run.synthesis?.intersection_matrix) {
    parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS (The Nexus) ═══");
    Object.entries(run.synthesis.intersection_matrix).forEach(([key, data]) => {
      parts.push(`  ▸ ${key}`);
      if (data.insight) parts.push(`    Insight: ${data.insight}`);
      if (data.tension) parts.push(`    Tension: ${data.tension}`);
      if (data.resolution) parts.push(`    Resolution: ${data.resolution}`);
    });
  }

  // Named synthesis patterns — compact summaries if available
  const namedPatterns = ["quantum_foresight", "governed_cogito", "narrative_loop", "empathy_driven_strategy"];
  namedPatterns.forEach(key => {
    const pattern = run.synthesis?.[key];
    if (pattern) {
      const summary = Object.values(pattern).filter(v => typeof v === "string").join(" | ");
      if (summary) parts.push(`  ▸ ${key}: ${summary.slice(0, 300)}`);
    }
  });

  if (run.actus?.recommendations?.length) {
    parts.push("\n═══ ACTUS: Key Recommendations (compressed) ═══");
    // Compress recommendations — take id, confidence, probability, and first 200 chars of text
    run.actus.recommendations.forEach(r => {
      const shortText = r.text?.length > 200 ? r.text.slice(0, 200) + "..." : r.text;
      parts.push(`  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${shortText}`);
    });
  }

  if (run.actus?.strategic_plan) {
    const sp = run.actus.strategic_plan;
    if (sp.immediate_horizon) parts.push(`  Immediate: ${sp.immediate_horizon.slice(0, 300)}`);
    if (sp.long_term_horizon) parts.push(`  Long-term: ${sp.long_term_horizon.slice(0, 300)}`);
  }

  if (run.corpus?.constraints?.length) {
    parts.push("\n═══ CORPUS: Hard Constraints ═══");
    run.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
  }

  if (run.animus?.ethical_stance) {
    parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${run.animus.ethical_stance}`);
  }

  // Truncate total context to prevent timeout
  const contextBlock = safeTruncate(parts.join("\n"), MAX_BLUEPRINT_CONTEXT);

  const blueprintLevel = run.blueprint_level || "L2";
  const noveltyDial = run.novelty_dial || "medium";

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT (Executable Deliverable)
You are the Janus Blueprint Module.
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${run.output_mode}.
${noveltyDial === "high" ? "alternative_approaches REQUIRED." : ""}

${contextBlock}

Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], ${noveltyDial === "high" ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[]${blueprintLevel !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${blueprintLevel === "L2" || blueprintLevel === "L3" ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${blueprintLevel === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${run.query_text}`;
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API — rerunSynthesis / rerunBlueprint
// ═══════════════════════════════════════════════════════════════

/**
 * Re-run synthesis for an existing run.
 * Recomputes all 6 intersection pairs + 4 named patterns.
 * Requires: corpus, cogito, animus, actus already stored on the run.
 */
export async function rerunSynthesis(runId, onProgress) {
  onProgress({ domain: "synthesis", status: "starting", detail: "Loading existing run data..." });

  const runs = await base44.entities.Run.filter({ id: runId });
  const run = runs[0];
  if (!run) throw new Error("Run not found");

  // Validate prerequisites exist
  const missing = ["corpus", "cogito", "animus", "actus"].filter(d => !run[d]);
  if (missing.length > 0) throw new Error(`Cannot re-run synthesis — missing prerequisite domains: ${missing.join(", ")}`);

  await base44.entities.Run.update(runId, { status: "running" });

  const queryText = run.query_text;
  const intersections = {};
  const errors = [];

  // Step 1: Recompute all 6 intersection pairs
  for (let i = 0; i < INTERSECTION_PAIRS.length; i++) {
    const { pair, domains: [dA, dB], model } = INTERSECTION_PAIRS[i];
    onProgress({ domain: `synthesis:${pair}`, status: "running", detail: `Computing intersection ${i + 1}/6: ${pair}`, completedDomains: i, totalDomains: 8 });

    try {
      const prompt = buildIntersectionPrompt(pair, model, dA, dB, run[dA], run[dB], queryText);
      const result = await callLLM(prompt);
      const parsed = parseLLMResponse(result, pair);
      if (parsed.data) {
        intersections[pair] = parsed.data;
      } else {
        errors.push(`intersection:${pair}: ${parsed.error}`);
      }
    } catch (e) {
      errors.push(`intersection:${pair}: ${e.message}`);
    }
  }

  // Persist intersection pairs immediately
  await base44.entities.Run.update(runId, {
    synthesis: { intersection_matrix: intersections },
  });

  // Step 2: Compute named patterns
  onProgress({ domain: "synthesis:patterns", status: "running", detail: "Computing 4 named emergent patterns...", completedDomains: 6, totalDomains: 8 });

  try {
    const patternPrompt = buildSynthesisNamedPatternsPrompt(intersections, queryText);
    const patternResult = await callLLM(patternPrompt);
    const patternParsed = parseLLMResponse(patternResult, "synthesis");

    if (patternParsed.data) {
      // Merge named patterns with the intersection matrix
      const fullSynthesis = {
        ...patternParsed.data,
        intersection_matrix: intersections,
      };
      await base44.entities.Run.update(runId, { synthesis: fullSynthesis });
    } else {
      errors.push(`synthesis:patterns: ${patternParsed.error}`);
    }
  } catch (e) {
    errors.push(`synthesis:patterns: ${e.message}`);
  }

  // Step 3: Finalize
  onProgress({ domain: "synthesis", status: "finalizing", detail: "Updating run record...", completedDomains: 7, totalDomains: 8 });

  // Rebuild cached fields from full data
  const updatedRuns = await base44.entities.Run.filter({ id: runId });
  const updatedRun = updatedRuns[0];
  const allDomains = ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"].filter(d => updatedRun[d]);
  const fullData = {};
  allDomains.forEach(d => { fullData[d] = updatedRun[d]; });

  const validation = validateJanusOutput(fullData, allDomains);
  const renderMd = generateMarkdown(validation.normalized || fullData, updatedRun.execution_mode);

  // Write normalized domain data back to fix enum drift (e.g. "Probable" → "Contested")
  const normalizedSynthData = validation.normalized || fullData;
  const synthDomainUpdate = {};
  allDomains.forEach(d => { if (normalizedSynthData[d]) synthDomainUpdate[d] = normalizedSynthData[d]; });

  await base44.entities.Run.update(runId, {
    ...synthDomainUpdate,
    status: errors.length > 0 && !updatedRun.synthesis?.intersection_matrix ? "failed" : "completed",
    render_md: safeTruncate(renderMd, 60000),
    raw_json: safeTruncate(JSON.stringify(normalizedSynthData), MAX_RAW_JSON_LENGTH),
    // Replace ALL validation errors — fresh validation + only rerun-specific errors
    validation_errors: [...(validation.errors || []), ...errors],
  });

  onProgress({ domain: null, status: "completed", detail: "Synthesis re-run complete" });
  return { success: errors.length === 0, errors };
}

/**
 * Re-run blueprint for an existing run.
 * Requires: corpus, cogito, animus, actus, synthesis already stored.
 */
export async function rerunBlueprint(runId, onProgress) {
  onProgress({ domain: "blueprint", status: "starting", detail: "Loading existing run data..." });

  const runs = await base44.entities.Run.filter({ id: runId });
  const run = runs[0];
  if (!run) throw new Error("Run not found");

  // Blueprint requires core domains; synthesis is used if available but not a hard prerequisite
  const missing = ["corpus", "cogito", "animus", "actus"].filter(d => !run[d]);
  if (missing.length > 0) throw new Error(`Cannot re-run blueprint — missing prerequisite domains: ${missing.join(", ")}`);

  await base44.entities.Run.update(runId, { status: "running" });

  const errors = [];

  onProgress({ domain: "blueprint", status: "running", detail: "Generating blueprint from stored domain data...", completedDomains: 0, totalDomains: 1 });

  try {
    const prompt = buildBlueprintPrompt(run);
    const result = await callLLM(prompt);
    const parsed = parseLLMResponse(result, "blueprint");

    if (parsed.data) {
      await base44.entities.Run.update(runId, { blueprint: parsed.data });
    } else {
      errors.push(`blueprint: ${parsed.error}`);
    }
  } catch (e) {
    errors.push(`blueprint: ${e.message}`);
  }

  // Finalize
  onProgress({ domain: "blueprint", status: "finalizing", detail: "Updating run record..." });

  const updatedRuns = await base44.entities.Run.filter({ id: runId });
  const updatedRun = updatedRuns[0];
  const allDomains = ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"].filter(d => updatedRun[d]);
  const fullData = {};
  allDomains.forEach(d => { fullData[d] = updatedRun[d]; });

  // Re-validate ALL domains — this normalizes "Probable" → "Contested" and cleans stale errors
  const validation = validateJanusOutput(fullData, allDomains);
  const normalizedData = validation.normalized || fullData;
  const renderMd = generateMarkdown(normalizedData, updatedRun.execution_mode);

  // Write normalized domain data back to fix enum drift (e.g. "Probable" → "Contested")
  const domainUpdate = {};
  allDomains.forEach(d => { if (normalizedData[d]) domainUpdate[d] = normalizedData[d]; });

  await base44.entities.Run.update(runId, {
    ...domainUpdate,
    status: errors.length > 0 && !updatedRun.blueprint ? "failed" : "completed",
    render_md: safeTruncate(renderMd, 60000),
    raw_json: safeTruncate(JSON.stringify(normalizedData), MAX_RAW_JSON_LENGTH),
    // Replace ALL validation errors — fresh validation + only rerun-specific errors
    validation_errors: [...(validation.errors || []), ...errors],
  });

  onProgress({ domain: null, status: "completed", detail: "Blueprint re-run complete" });
  return { success: errors.length === 0, errors };
}