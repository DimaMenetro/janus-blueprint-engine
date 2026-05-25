// Blueprint Split-Call Architecture — Option 1 implementation
// Splits the blueprint generation into 3 focused sub-calls to prevent
// output truncation on complex L2/L3 blueprints.
//
// Call 1: Skeleton — goal, assumptions, step titles + instructions + dependencies
// Call 2: Step Expansion — substeps, checklists, acceptance_tests, time/effort per step
// Call 3: Criteria & Risk — success_criteria, risk_register, alternative_approaches

import { base44 } from "@/api/base44Client";

// ─── COMPRESSED CONTEXT BUILDER (Option 2 — input compression) ───────────────
// Builds a compressed upstream context for blueprint calls.
// Uses structured references (claim IDs, confidence levels, constraint numbers)
// rather than full verbose text. Input-only compression — output is untouched.

const MAX_BLUEPRINT_CONTEXT = 18000;

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n\n[TRUNCATED — original was " + str.length + " chars]";
}

export function buildCompressedBlueprintContext(source) {
  // source can be a Run entity (rerun) or a priorContext object (first-run)
  const parts = [];

  // ── Intersection insights (compressed)
  const matrix = source.synthesis?.intersection_matrix || source._intersections;
  if (matrix) {
    parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS ═══");
    Object.entries(matrix).forEach(([key, data]) => {
      // Strip _model metadata if present
      const insight = data.insight || data.data?.insight;
      const tension = data.tension || data.data?.tension;
      const resolution = data.resolution || data.data?.resolution;
      parts.push(`  ▸ ${key}`);
      if (insight) parts.push(`    Insight: ${insight}`);
      if (tension) parts.push(`    Tension: ${tension}`);
      if (resolution) parts.push(`    Resolution: ${resolution}`);
    });
  }

  // ── Named synthesis patterns (compact one-liners)
  const synthSource = source.synthesis || {};
  ["quantum_foresight", "governed_cogito", "narrative_loop", "empathy_driven_strategy"].forEach(key => {
    const pattern = synthSource[key];
    if (pattern) {
      const summary = Object.values(pattern).filter(v => typeof v === "string").join(" | ");
      if (summary) parts.push(`  ▸ ${key}: ${summary.slice(0, 300)}`);
    }
  });

  // ── Actus recommendations (compressed to structural references)
  const actus = source.actus;
  if (actus?.recommendations?.length) {
    parts.push("\n═══ ACTUS: Recommendations (structural refs) ═══");
    actus.recommendations.forEach(r => {
      const shortText = r.text?.length > 200 ? r.text.slice(0, 200) + "..." : r.text;
      parts.push(`  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${shortText}`);
    });
  }
  if (actus?.strategic_plan) {
    const sp = actus.strategic_plan;
    if (sp.immediate_horizon) parts.push(`  Immediate: ${sp.immediate_horizon.slice(0, 300)}`);
    if (sp.long_term_horizon) parts.push(`  Long-term: ${sp.long_term_horizon.slice(0, 300)}`);
  }

  // ── Corpus constraints (non-negotiable, always included)
  const corpus = source.corpus;
  if (corpus?.constraints?.length) {
    parts.push("\n═══ CORPUS: Hard Constraints ═══");
    corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
  }

  // ── Animus ethical stance
  const animus = source.animus;
  if (animus?.ethical_stance) {
    parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${animus.ethical_stance}`);
  }

  return safeTruncate(parts.join("\n"), MAX_BLUEPRINT_CONTEXT);
}

// ─── LLM CALL ────────────────────────────────────────────────────────────────

async function callLLM(prompt, fileUrls) {
  const params = { prompt, model: "claude_sonnet_4_6" };
  if (fileUrls?.length) params.file_urls = fileUrls;
  return await base44.integrations.Core.InvokeLLM(params);
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

// ─── SPLIT-CALL PROMPTS ──────────────────────────────────────────────────────

function buildSkeletonPrompt(contextBlock, queryText, blueprintLevel, noveltyDial, outputMode) {
  return `INITIATE PROTOCOL: JANUSSMEv2.0 — BLUEPRINT SUB-CALL 1/3: SKELETON
You are the Janus Blueprint Module generating the ROADMAP SKELETON.
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}.

${contextBlock}

YOUR TASK: Generate the blueprint skeleton — the goal, assumptions, and the complete step sequence with titles, instructions, inputs, outputs, validation criteria, and dependency chains. Do NOT generate substeps, checklists, or acceptance tests — those come in a follow-up call.

Output ONLY valid JSON: { "blueprint": { "goal": "the overarching goal", "assumptions": ["assumption 1", "assumption 2"], "steps": [{"step": 1, "title": "step title", "instructions": "detailed instructions for this step", "inputs": ["what this step needs"], "outputs": ["what this step produces"], "validation": "how to verify this step succeeded", "depends_on_steps": []}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

function buildStepExpansionPrompt(skeleton, queryText, blueprintLevel) {
  const stepSummary = skeleton.steps.map(s => `  Step ${s.step}: ${s.title} — ${s.instructions.slice(0, 150)}`).join("\n");

  // Only request fields that this blueprint level needs
  const fields = [];
  if (blueprintLevel !== "L1") fields.push('"time_estimate": "estimated duration", "effort_level": "low|medium|high"');
  if (blueprintLevel === "L2" || blueprintLevel === "L3") fields.push('"substeps": [{"substep": "1a", "details": "detailed instructions"}]');
  if (blueprintLevel === "L3") fields.push('"checklist": ["item to verify"], "acceptance_tests": ["test to pass"]');

  if (fields.length === 0) return null; // L1 doesn't need expansion

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — BLUEPRINT SUB-CALL 2/3: STEP EXPANSION
You are the Janus Blueprint Module expanding each step with detailed sub-information.
Level: ${blueprintLevel}

═══ BLUEPRINT SKELETON (from prior call) ═══
Goal: ${skeleton.goal}
Steps:
${stepSummary}

YOUR TASK: For EACH step number listed above, produce the expansion fields. Match step numbers exactly.

Output ONLY valid JSON: { "step_expansions": [{"step": 1, ${fields.join(", ")}}, {"step": 2, ${fields.join(", ")}}] }
Each object in the array MUST have a "step" field matching the step number from the skeleton.
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

function buildCriteriaRiskPrompt(skeleton, contextBlock, queryText, noveltyDial) {
  const stepTitles = skeleton.steps.map(s => `  ${s.step}. ${s.title}`).join("\n");

  const altBlock = noveltyDial === "high"
    ? '"alternative_approaches": [{"name": "approach name", "pros": ["pro"], "cons": ["con"], "why_not_chosen": "reason"}], '
    : "";

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — BLUEPRINT SUB-CALL 3/3: CRITERIA & RISK
You are the Janus Blueprint Module generating success criteria, risk assessment${noveltyDial === "high" ? ", and alternative approaches" : ""}.

═══ BLUEPRINT STEPS (titles only) ═══
${stepTitles}

═══ UPSTREAM CONTEXT (compressed) ═══
${contextBlock}

YOUR TASK: Generate success criteria that validate the ENTIRE blueprint, and a risk register identifying what could go wrong at each stage.${noveltyDial === "high" ? " Also generate 3+ alternative approaches that were considered but not chosen." : ""}

Output ONLY valid JSON: { "criteria_risk": { ${altBlock}"success_criteria": ["criterion 1", "criterion 2"], "risk_register": [{"risk": "what could go wrong", "impact": "low|med|high", "mitigation": "how to prevent or handle it"}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// ─── MAIN SPLIT-CALL EXECUTOR ────────────────────────────────────────────────

/**
 * Execute blueprint generation as 3 focused sub-calls.
 * @param {object} source - Run entity (rerun) or priorContext (first-run)
 * @param {string} queryText
 * @param {string} blueprintLevel - "L1" | "L2" | "L3"
 * @param {string} noveltyDial - "low" | "medium" | "high"
 * @param {string} outputMode
 * @param {function} onProgress - progress callback
 * @returns {{ data: object|null, errors: string[] }}
 */
export async function executeBlueprintSplitCall({ source, queryText, blueprintLevel, noveltyDial, outputMode, onProgress, fileUrls }) {
  const errors = [];
  const contextBlock = buildCompressedBlueprintContext(source);
  const totalSubCalls = blueprintLevel === "L1" ? 2 : 3;

  // ── Sub-call 1: Skeleton
  onProgress({ domain: "blueprint:skeleton", status: "running", detail: "Generating roadmap skeleton...", completedDomains: 0, totalDomains: totalSubCalls });

  let skeleton = null;
  try {
    const prompt = buildSkeletonPrompt(contextBlock, queryText, blueprintLevel, noveltyDial, outputMode);
    const result = await callLLM(prompt, fileUrls);
    const parsed = parseLLMResponse(result, "blueprint");
    if (parsed.data) {
      skeleton = parsed.data;
    } else {
      errors.push(`blueprint:skeleton: ${parsed.error}`);
    }
  } catch (e) {
    errors.push(`blueprint:skeleton: ${e.message}`);
  }

  if (!skeleton) {
    return { data: null, errors };
  }

  // ── Sub-call 2: Step Expansion (skip for L1 — no substeps/checklists needed)
  if (blueprintLevel !== "L1") {
    onProgress({ domain: "blueprint:expansion", status: "running", detail: "Expanding steps with detail...", completedDomains: 1, totalDomains: totalSubCalls });

    try {
      const prompt = buildStepExpansionPrompt(skeleton, queryText, blueprintLevel);
      if (prompt) {
        const result = await callLLM(prompt, fileUrls);
        const parsed = parseLLMResponse(result, "step_expansions");
        if (parsed.data) {
          const expansions = Array.isArray(parsed.data) ? parsed.data : [];
          // Merge expansions back into skeleton steps
          const expansionMap = {};
          expansions.forEach(exp => { if (exp.step) expansionMap[exp.step] = exp; });

          skeleton.steps = skeleton.steps.map(step => {
            const exp = expansionMap[step.step];
            if (!exp) return step;
            const merged = { ...step };
            if (exp.time_estimate) merged.time_estimate = exp.time_estimate;
            if (exp.effort_level) merged.effort_level = exp.effort_level;
            if (exp.substeps) merged.substeps = exp.substeps;
            if (exp.checklist) merged.checklist = exp.checklist;
            if (exp.acceptance_tests) merged.acceptance_tests = exp.acceptance_tests;
            return merged;
          });
        } else {
          errors.push(`blueprint:expansion: ${parsed.error}`);
        }
      }
    } catch (e) {
      errors.push(`blueprint:expansion: ${e.message}`);
    }
  }

  // ── Sub-call 3: Criteria & Risk
  const criteriaStep = blueprintLevel === "L1" ? 1 : 2;
  onProgress({ domain: "blueprint:criteria", status: "running", detail: "Generating success criteria & risk register...", completedDomains: criteriaStep, totalDomains: totalSubCalls });

  try {
    const prompt = buildCriteriaRiskPrompt(skeleton, contextBlock, queryText, noveltyDial);
    const result = await callLLM(prompt, fileUrls);
    const parsed = parseLLMResponse(result, "criteria_risk");
    if (parsed.data) {
      if (parsed.data.success_criteria) skeleton.success_criteria = parsed.data.success_criteria;
      if (parsed.data.risk_register) skeleton.risk_register = parsed.data.risk_register;
      if (parsed.data.alternative_approaches) skeleton.alternative_approaches = parsed.data.alternative_approaches;
    } else {
      errors.push(`blueprint:criteria: ${parsed.error}`);
    }
  } catch (e) {
    errors.push(`blueprint:criteria: ${e.message}`);
  }

  return { data: skeleton, errors };
}