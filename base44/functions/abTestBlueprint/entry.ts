// ═══════════════════════════════════════════════════════════════════════════
// AB-TEST: Blueprint Generation Architecture Comparison
// ═══════════════════════════════════════════════════════════════════════════
// PURPOSE: Sandboxed diagnostic function comparing two blueprint generation
//          strategies against identical upstream domain data.
//
// VARIANT A (Control): Monolithic single-shot blueprint call
//   - Full uncompressed context from all domains
//   - Single LLM invocation producing the complete blueprint
//
// VARIANT B (Experimental): Split 3-call with compressed context
//   - Sub-call 1: Skeleton (goal, assumptions, step roadmap)
//   - Sub-call 2: Step Expansion (substeps, checklists, time/effort)
//   - Sub-call 3: Criteria & Risk (success_criteria, risk_register, alternatives)
//   - Input context is structurally compressed (IDs, refs, truncation)
//
// SANDBOXING: This function is READ-ONLY against the Run entity.
//             It does NOT modify any stored data.
//             All LLM outputs are returned in the response payload only.
//
// ARCHIVE NOTE: Do not delete. Retained for future comparative analysis.
// ═══════════════════════════════════════════════════════════════════════════

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MAX_CONTEXT = 18000;
const MAX_UNCOMPRESSED_CONTEXT = 24000;

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n[TRUNCATED at " + max + " of " + str.length + " chars]";
}

// ─── LLM HELPER ──────────────────────────────────────────────────────────────

async function callLLM(base44, prompt, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6",
      });
    } catch (e) {
      const isRetryable = e.message?.includes("502") || e.message?.includes("503") || e.message?.includes("timeout");
      if (attempt < retries && isRetryable) {
        console.log(`[AB-TEST] LLM call failed (attempt ${attempt + 1}/${retries + 1}): ${e.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 2000)); // 2s backoff
        continue;
      }
      throw e;
    }
  }
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

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT A: MONOLITHIC SINGLE-SHOT (the old way — full context, one call)
// ═══════════════════════════════════════════════════════════════════════════

function buildMonolithicContext(run) {
  const parts = [];

  // Full intersection insights — no compression
  if (run.synthesis?.intersection_matrix) {
    parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS (The Nexus) ═══");
    parts.push("Emergent wisdom from domain intersections — full fidelity:\n");
    Object.entries(run.synthesis.intersection_matrix).forEach(([key, data]) => {
      parts.push(`  ▸ ${key}`);
      if (data.insight) parts.push(`    Insight: ${data.insight}`);
      if (data.tension) parts.push(`    Tension: ${data.tension}`);
      if (data.resolution) parts.push(`    Resolution: ${data.resolution}`);
    });
  }

  // Full named patterns — no truncation
  const namedPatterns = ["quantum_foresight", "governed_cogito", "narrative_loop", "empathy_driven_strategy"];
  namedPatterns.forEach(key => {
    const pattern = run.synthesis?.[key];
    if (pattern) {
      parts.push(`\n═══ SYNTHESIS: ${key.toUpperCase()} ═══`);
      Object.entries(pattern).forEach(([pk, pv]) => {
        if (typeof pv === "string") parts.push(`  ${pk}: ${pv}`);
        if (Array.isArray(pv)) pv.forEach(item => parts.push(`    • ${item}`));
      });
    }
  });

  // Full actus recommendations — NO compression
  if (run.actus?.recommendations?.length) {
    parts.push("\n═══ ACTUS: Key Recommendations (confidence-propagated) ═══");
    run.actus.recommendations.forEach(r => {
      parts.push(`  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${r.text}`);
      if (r.failure_modes?.length) r.failure_modes.forEach(f => parts.push(`    ⚠ ${f}`));
      if (r.next_actions?.length) r.next_actions.forEach(a => parts.push(`    → ${a}`));
    });
  }

  if (run.actus?.strategic_plan) {
    const sp = run.actus.strategic_plan;
    parts.push("\n═══ ACTUS: Strategic Plan ═══");
    if (sp.immediate_horizon) parts.push(`  Immediate Horizon: ${sp.immediate_horizon}`);
    if (sp.long_term_horizon) parts.push(`  Long-term Horizon: ${sp.long_term_horizon}`);
    if (sp.key_decision_points?.length) sp.key_decision_points.forEach(d => parts.push(`  Decision Point: ${d}`));
  }

  // Full corpus constraints
  if (run.corpus?.constraints?.length) {
    parts.push("\n═══ CORPUS: Hard Constraints (non-negotiable) ═══");
    run.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
  }

  // Full animus
  if (run.animus?.ethical_stance) {
    parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${run.animus.ethical_stance}`);
  }
  if (run.animus?.boundary_checks?.length) {
    parts.push("  Boundary Checks:");
    run.animus.boundary_checks.forEach(b => parts.push(`    • ${b}`));
  }
  if (run.animus?.disallowed_moves?.length) {
    parts.push("  Disallowed Moves:");
    run.animus.disallowed_moves.forEach(d => parts.push(`    ✗ ${d}`));
  }

  return safeTruncate(parts.join("\n"), MAX_UNCOMPRESSED_CONTEXT);
}

function buildMonolithicPrompt(run) {
  const contextBlock = buildMonolithicContext(run);
  const blueprintLevel = run.blueprint_level || "L2";
  const noveltyDial = run.novelty_dial || "medium";

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT (Executable Deliverable)
You are the Janus Blueprint Module — the culmination of a multi-domain cognitive architecture.
Your task: produce a concrete, executable plan that synthesizes ALL prior domain expertise into actionable wisdom.
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${run.output_mode}.
${noveltyDial === "high" ? "alternative_approaches REQUIRED (novelty=high): list 3+ alternatives with name, pros, cons, why_not_chosen." : ""}

${contextBlock}

CRITICAL DIRECTIVES:
1. Every step must be traceable to the synthesis insights and domain constraints above.
2. The blueprint must respect Animus ethical boundaries.
3. If the physics and math check out, precedent does not matter.
4. Blueprints must be answers of WISDOM — highest probability paths to genuinely achieving the stated goal.
5. Complexity yields emergent behaviors. Do not oversimplify.

Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], ${noveltyDial === "high" ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[]${blueprintLevel !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${blueprintLevel === "L2" || blueprintLevel === "L3" ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${blueprintLevel === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${run.query_text}`;
}

async function executeVariantA(base44, run) {
  const startTime = Date.now();
  const prompt = buildMonolithicPrompt(run);
  const promptChars = prompt.length;

  let blueprint = null;
  let error = null;

  try {
    const result = await callLLM(base44, prompt);
    const parsed = parseLLMResponse(result, "blueprint");
    if (parsed.data) {
      blueprint = parsed.data;
    } else {
      error = parsed.error;
    }
  } catch (e) {
    error = e.message;
  }

  const elapsed = Date.now() - startTime;
  return { blueprint, error, promptChars, elapsed };
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT B: SPLIT 3-CALL WITH COMPRESSED CONTEXT (the new way)
// ═══════════════════════════════════════════════════════════════════════════

function buildCompressedContext(run) {
  const parts = [];

  // Compressed intersection insights
  if (run.synthesis?.intersection_matrix) {
    parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS ═══");
    Object.entries(run.synthesis.intersection_matrix).forEach(([key, data]) => {
      parts.push(`  ▸ ${key}`);
      if (data.insight) parts.push(`    Insight: ${data.insight}`);
      if (data.tension) parts.push(`    Tension: ${data.tension}`);
      if (data.resolution) parts.push(`    Resolution: ${data.resolution}`);
    });
  }

  // Named patterns — compact one-liners
  ["quantum_foresight", "governed_cogito", "narrative_loop", "empathy_driven_strategy"].forEach(key => {
    const pattern = run.synthesis?.[key];
    if (pattern) {
      const summary = Object.values(pattern).filter(v => typeof v === "string").join(" | ");
      if (summary) parts.push(`  ▸ ${key}: ${summary.slice(0, 300)}`);
    }
  });

  // Compressed recommendations — structural refs only
  if (run.actus?.recommendations?.length) {
    parts.push("\n═══ ACTUS: Recommendations (structural refs) ═══");
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

  // Corpus constraints — always included
  if (run.corpus?.constraints?.length) {
    parts.push("\n═══ CORPUS: Hard Constraints ═══");
    run.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
  }

  if (run.animus?.ethical_stance) {
    parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${run.animus.ethical_stance}`);
  }

  return safeTruncate(parts.join("\n"), MAX_CONTEXT);
}

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
  const stepSummary = skeleton.steps.map(s => `  Step ${s.step}: ${s.title} — ${(s.instructions || "").slice(0, 150)}`).join("\n");

  const fields = [];
  if (blueprintLevel !== "L1") fields.push('"time_estimate": "estimated duration", "effort_level": "low|medium|high"');
  if (blueprintLevel === "L2" || blueprintLevel === "L3") fields.push('"substeps": [{"substep": "1a", "details": "detailed instructions"}]');
  if (blueprintLevel === "L3") fields.push('"checklist": ["item to verify"], "acceptance_tests": ["test to pass"]');

  if (fields.length === 0) return null;

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

async function executeVariantB(base44, run) {
  const startTime = Date.now();
  const errors = [];
  const timings = {};
  const promptChars = {};

  const contextBlock = buildCompressedContext(run);
  const blueprintLevel = run.blueprint_level || "L2";
  const noveltyDial = run.novelty_dial || "medium";
  const queryText = run.query_text;

  // ── Sub-call 1: Skeleton
  let skeleton = null;
  const t1 = Date.now();
  try {
    const prompt = buildSkeletonPrompt(contextBlock, queryText, blueprintLevel, noveltyDial, run.output_mode);
    promptChars.skeleton = prompt.length;
    const result = await callLLM(base44, prompt);
    const parsed = parseLLMResponse(result, "blueprint");
    if (parsed.data) {
      skeleton = parsed.data;
    } else {
      errors.push(`skeleton: ${parsed.error}`);
    }
  } catch (e) {
    errors.push(`skeleton: ${e.message}`);
  }
  timings.skeleton = Date.now() - t1;

  if (!skeleton) {
    return { blueprint: null, errors, timings, promptChars, elapsed: Date.now() - startTime };
  }

  // ── Sub-call 2: Step Expansion
  if (blueprintLevel !== "L1") {
    const t2 = Date.now();
    try {
      const prompt = buildStepExpansionPrompt(skeleton, queryText, blueprintLevel);
      if (prompt) {
        promptChars.expansion = prompt.length;
        const result = await callLLM(base44, prompt);
        const parsed = parseLLMResponse(result, "step_expansions");
        if (parsed.data) {
          const expansions = Array.isArray(parsed.data) ? parsed.data : [];
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
          errors.push(`expansion: ${parsed.error}`);
        }
      }
    } catch (e) {
      errors.push(`expansion: ${e.message}`);
    }
    timings.expansion = Date.now() - t2;
  }

  // ── Sub-call 3: Criteria & Risk
  const t3 = Date.now();
  try {
    const prompt = buildCriteriaRiskPrompt(skeleton, contextBlock, queryText, noveltyDial);
    promptChars.criteria = prompt.length;
    const result = await callLLM(base44, prompt);
    const parsed = parseLLMResponse(result, "criteria_risk");
    if (parsed.data) {
      if (parsed.data.success_criteria) skeleton.success_criteria = parsed.data.success_criteria;
      if (parsed.data.risk_register) skeleton.risk_register = parsed.data.risk_register;
      if (parsed.data.alternative_approaches) skeleton.alternative_approaches = parsed.data.alternative_approaches;
    } else {
      errors.push(`criteria: ${parsed.error}`);
    }
  } catch (e) {
    errors.push(`criteria: ${e.message}`);
  }
  timings.criteria = Date.now() - t3;

  return { blueprint: skeleton, errors, timings, promptChars, elapsed: Date.now() - startTime };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUALITY METRICS — Structural comparison of two blueprint outputs
// ═══════════════════════════════════════════════════════════════════════════

function measureQuality(blueprint, label) {
  if (!blueprint) return { label, valid: false, error: "No blueprint produced" };

  const steps = blueprint.steps || [];
  const totalChars = JSON.stringify(blueprint).length;

  // Core fields
  const hasGoal = !!blueprint.goal;
  const hasAssumptions = Array.isArray(blueprint.assumptions) && blueprint.assumptions.length > 0;
  const hasSuccessCriteria = Array.isArray(blueprint.success_criteria) && blueprint.success_criteria.length > 0;
  const hasRiskRegister = Array.isArray(blueprint.risk_register) && blueprint.risk_register.length > 0;
  const hasAlternatives = Array.isArray(blueprint.alternative_approaches) && blueprint.alternative_approaches.length > 0;

  // Step depth analysis
  const stepCount = steps.length;
  const stepsWithSubsteps = steps.filter(s => s.substeps?.length > 0).length;
  const stepsWithChecklists = steps.filter(s => s.checklist?.length > 0).length;
  const stepsWithAcceptanceTests = steps.filter(s => s.acceptance_tests?.length > 0).length;
  const stepsWithTimeEstimate = steps.filter(s => !!s.time_estimate).length;
  const stepsWithEffortLevel = steps.filter(s => !!s.effort_level).length;
  const stepsWithValidation = steps.filter(s => !!s.validation).length;
  const stepsWithInputs = steps.filter(s => s.inputs?.length > 0).length;
  const stepsWithOutputs = steps.filter(s => s.outputs?.length > 0).length;
  const stepsWithDependencies = steps.filter(s => s.depends_on_steps?.length > 0).length;

  // Content richness
  const totalSubsteps = steps.reduce((acc, s) => acc + (s.substeps?.length || 0), 0);
  const totalChecklistItems = steps.reduce((acc, s) => acc + (s.checklist?.length || 0), 0);
  const totalAcceptanceTests = steps.reduce((acc, s) => acc + (s.acceptance_tests?.length || 0), 0);
  const totalRisks = blueprint.risk_register?.length || 0;
  const totalSuccessCriteria = blueprint.success_criteria?.length || 0;
  const avgInstructionLength = steps.length > 0 
    ? Math.round(steps.reduce((acc, s) => acc + (s.instructions?.length || 0), 0) / steps.length)
    : 0;

  // Completeness score (0-100)
  let completenessScore = 0;
  if (hasGoal) completenessScore += 10;
  if (hasAssumptions) completenessScore += 5;
  if (stepCount >= 3) completenessScore += 15;
  if (hasSuccessCriteria) completenessScore += 10;
  if (hasRiskRegister) completenessScore += 10;
  if (stepsWithSubsteps > 0) completenessScore += 10;
  if (stepsWithChecklists > 0) completenessScore += 10;
  if (stepsWithAcceptanceTests > 0) completenessScore += 10;
  if (stepsWithTimeEstimate > 0) completenessScore += 5;
  if (stepsWithValidation === stepCount && stepCount > 0) completenessScore += 10;
  if (stepsWithInputs === stepCount && stepCount > 0) completenessScore += 5;

  return {
    label,
    valid: true,
    totalChars,
    hasGoal,
    hasAssumptions: hasAssumptions ? blueprint.assumptions.length : 0,
    hasSuccessCriteria: totalSuccessCriteria,
    hasRiskRegister: totalRisks,
    hasAlternatives: hasAlternatives ? blueprint.alternative_approaches.length : 0,
    stepCount,
    avgInstructionLength,
    depth: {
      stepsWithSubsteps: `${stepsWithSubsteps}/${stepCount}`,
      stepsWithChecklists: `${stepsWithChecklists}/${stepCount}`,
      stepsWithAcceptanceTests: `${stepsWithAcceptanceTests}/${stepCount}`,
      stepsWithTimeEstimate: `${stepsWithTimeEstimate}/${stepCount}`,
      stepsWithEffortLevel: `${stepsWithEffortLevel}/${stepCount}`,
      stepsWithValidation: `${stepsWithValidation}/${stepCount}`,
      stepsWithInputs: `${stepsWithInputs}/${stepCount}`,
      stepsWithOutputs: `${stepsWithOutputs}/${stepCount}`,
      stepsWithDependencies: `${stepsWithDependencies}/${stepCount}`,
    },
    richness: {
      totalSubsteps,
      totalChecklistItems,
      totalAcceptanceTests,
    },
    completenessScore,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const { run_id, variant } = await req.json();
    if (!run_id) return Response.json({ error: "run_id is required" }, { status: 400 });

    // Load the run — use service role to bypass decompression issues on large entities
    console.log(`[AB-TEST] Loading run ${run_id}...`);
    const runs = await base44.asServiceRole.entities.Run.filter({ id: run_id });
    if (!runs.length) return Response.json({ error: "Run not found" }, { status: 404 });
    const run = runs[0];

    // Validate prerequisites
    const missing = ["corpus", "cogito", "animus", "actus"].filter(d => !run[d]);
    if (missing.length > 0) {
      return Response.json({ error: `Missing prerequisite domains: ${missing.join(", ")}` }, { status: 400 });
    }

    console.log(`[AB-TEST] Run loaded. Level: ${run.blueprint_level}, Novelty: ${run.novelty_dial}`);
    console.log(`[AB-TEST] Has synthesis: ${!!run.synthesis}, Has intersection_matrix: ${!!run.synthesis?.intersection_matrix}`);

    // Allow running just one variant (to save credits) or both
    const runA = !variant || variant === "A" || variant === "both";
    const runB = !variant || variant === "B" || variant === "both";

    const results = {
      run_id: run.id,
      query_text: run.query_text?.slice(0, 200),
      blueprint_level: run.blueprint_level,
      novelty_dial: run.novelty_dial,
      has_synthesis: !!run.synthesis,
      has_intersection_matrix: !!run.synthesis?.intersection_matrix,
    };

    // ── Execute Variant A (Monolithic)
    if (runA) {
      console.log("[AB-TEST] Executing Variant A (Monolithic)...");
      const resultA = await executeVariantA(base44, run);
      results.variant_a = {
        label: "Monolithic Single-Shot (uncompressed context)",
        elapsed_ms: resultA.elapsed,
        prompt_chars: resultA.promptChars,
        error: resultA.error || null,
        quality: measureQuality(resultA.blueprint, "Variant A"),
        step_titles: resultA.blueprint?.steps?.map(s => `${s.step}. ${s.title}`)?.slice(0, 8) || [],
        goal: resultA.blueprint?.goal || null,
        blueprint: resultA.blueprint, // Full output for inspection
      };
      console.log(`[AB-TEST] Variant A complete. ${resultA.elapsed}ms, ${resultA.blueprint?.steps?.length || 0} steps, score: ${results.variant_a.quality.completenessScore}`);
    }

    // ── Execute Variant B (Split 3-call)
    if (runB) {
      console.log("[AB-TEST] Executing Variant B (Split 3-call + compressed context)...");
      const resultB = await executeVariantB(base44, run);
      results.variant_b = {
        label: "Split 3-Call (compressed context)",
        elapsed_ms: resultB.elapsed,
        sub_call_timings: resultB.timings,
        prompt_chars: resultB.promptChars,
        errors: resultB.errors.length > 0 ? resultB.errors : null,
        quality: measureQuality(resultB.blueprint, "Variant B"),
        step_titles: resultB.blueprint?.steps?.map(s => `${s.step}. ${s.title}`)?.slice(0, 8) || [],
        goal: resultB.blueprint?.goal || null,
        blueprint: resultB.blueprint, // Full output for inspection
      };
      console.log(`[AB-TEST] Variant B complete. ${resultB.elapsed}ms, ${resultB.blueprint?.steps?.length || 0} steps, score: ${results.variant_b.quality.completenessScore}`);
    }

    // ── Comparative Analysis (if both ran)
    if (runA && runB && results.variant_a?.quality?.valid && results.variant_b?.quality?.valid) {
      const qa = results.variant_a.quality;
      const qb = results.variant_b.quality;
      results.comparison = {
        completeness_score: { A: qa.completenessScore, B: qb.completenessScore, winner: qa.completenessScore > qb.completenessScore ? "A" : qa.completenessScore < qb.completenessScore ? "B" : "tie" },
        step_count: { A: qa.stepCount, B: qb.stepCount, winner: qa.stepCount > qb.stepCount ? "A" : qa.stepCount < qb.stepCount ? "B" : "tie" },
        total_chars: { A: qa.totalChars, B: qb.totalChars, winner: qa.totalChars > qb.totalChars ? "A" : qa.totalChars < qb.totalChars ? "B" : "tie" },
        avg_instruction_length: { A: qa.avgInstructionLength, B: qb.avgInstructionLength },
        time_ms: { A: results.variant_a.elapsed_ms, B: results.variant_b.elapsed_ms, winner: results.variant_a.elapsed_ms < results.variant_b.elapsed_ms ? "A" : "B" },
        total_substeps: { A: qa.richness.totalSubsteps, B: qb.richness.totalSubsteps },
        total_checklist_items: { A: qa.richness.totalChecklistItems, B: qb.richness.totalChecklistItems },
        total_acceptance_tests: { A: qa.richness.totalAcceptanceTests, B: qb.richness.totalAcceptanceTests },
        risks: { A: qa.hasRiskRegister, B: qb.hasRiskRegister },
        success_criteria: { A: qa.hasSuccessCriteria, B: qb.hasSuccessCriteria },
        verdict: qa.completenessScore >= qb.completenessScore ? 
          (qa.completenessScore > qb.completenessScore ? "Variant A (Monolithic) produced more complete output" : "Both variants produced equally complete output") :
          "Variant B (Split) produced more complete output"
      };
    }

    return Response.json(results);
  } catch (error) {
    console.error(`[AB-TEST] Fatal error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});