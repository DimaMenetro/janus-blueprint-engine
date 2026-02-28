// Janus Execution Engine — Domain-by-domain sequential LLM orchestrator
// Persists progress incrementally so page reloads don't lose completed work

import { base44 } from "@/api/base44Client";
import { EXECUTION_MODES, validateJanusOutput } from "./janusSchema";

const MAX_RAW_JSON_LENGTH = 50000; // ~50KB cap for raw_json field
const MAX_PROMPT_LENGTH = 10000;   // Cap stored prompt

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n\n[TRUNCATED — original was " + str.length + " chars]";
}

// Build focused per-domain prompts — each call is a standalone SME activation
function buildDomainPrompt(domain, queryText, opts, priorContext) {
  const { executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = opts;

  const domainInstructions = {
    refresh: `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: REFRESH (Zero-Day Patch)
You are the Janus Refresh Module. Your ONLY task is to produce the "refresh" domain object.
${refreshEnabled ? `Execute a State-of-the-Art sweep.
Output a JSON object like: { "refresh": { "mode": "tier1", "attempted": true, "limitations": "...", "would_refresh": ["item1","item2","item3"] } }` : `No external tools available. Declare the knowledge boundary.
Output a JSON object like: { "refresh": { "mode": "tier0", "attempted": false, "limitations": "Analysis based on training data only — no live sweep performed", "would_refresh": ["item1","item2","item3","item4","item5"] } }`}
Return ONLY valid JSON with the "refresh" key. No markdown fences, no prose.
QUERY: ${queryText}`,

    corpus: `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: CORPUS (Technical & Physical Reality)
You are the Janus Corpus Module. Activate 7 simultaneous SME lenses: AI/ML, Distributed Systems, Data Engineering, Cybersecurity, Neuroscience, Physics, Systems Engineering.
Physical law is non-negotiable. Perceive the query from each lens independently.
Output ONLY valid JSON like: { "corpus": { "constraints": ["..."], "feasibility_notes": ["..."], "subdomains": { "ai_ml": {"perspective": "...", "key_findings": ["..."]}, "distributed_systems": {"perspective": "...", "key_findings": ["..."]}, "data_engineering": {"perspective": "...", "key_findings": ["..."]}, "cybersecurity": {"perspective": "...", "key_findings": ["..."]}, "neuroscience": {"perspective": "...", "key_findings": ["..."]}, "physics": {"perspective": "...", "key_findings": ["..."]}, "systems_engineering": {"perspective": "...", "key_findings": ["..."]} } } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`,

    cogito: `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: COGITO (Reasoning & Epistemic Mechanics)
You are the Janus Cogito Module. Apply 6 epistemic lenses.
Every claim MUST have: id ("C1","C2"...), tag (EXACTLY "Established"|"Contested"|"Speculative"), text, depends_on (array of claim IDs), why_believed, falsifiable_by, verify_later.
${priorContext.corpus ? `Prior Corpus constraints: ${JSON.stringify(priorContext.corpus.constraints?.slice(0, 3))}` : ""}
Output ONLY valid JSON like: { "cogito": { "claims": [{"id":"C1","tag":"Established","text":"...","depends_on":[],"why_believed":"...","falsifiable_by":"...","verify_later":"..."}], "reasoning_map": ["..."], "graphrag_connections": ["..."], "causal_chains": [{"cause":"...","effect":"...","confidence":"Established"}], "neuro_symbolic_insights": ["..."] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`,

    animus: `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: ANIMUS (Agency, Identity & Boundary Constraints)
You are the Janus Animus Module. Apply 5 philosophical lenses: Consciousness Theory, Philosophy of Mind, Ethics & Governance, AI Safety & Alignment, Risk Analysis.
Ethics here is CONSCIENCE not compliance.
${priorContext.cogito ? `Prior Cogito claims: ${priorContext.cogito.claims?.slice(0, 3).map(c => c.id + ": " + c.text).join("; ")}` : ""}
Output ONLY valid JSON like: { "animus": { "boundary_checks": ["..."], "disallowed_moves": ["..."], "safety_notes": ["..."], "consciousness_boundary": "...", "attractor_states": ["..."], "ethical_stance": "...", "risk_analysis": {"cognitive_sync_assessment": "...", "self_determination_factors": ["..."], "misalignment_risks": ["..."]} } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`,

    actus: `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: ACTUS (Strategy, Execution & Consequence)
You are the Janus Actus Module. Apply 7 execution lenses.
CONFIDENCE PROPAGATION LAW: Every recommendation inherits the LOWEST confidence of its upstream Cogito claims.
${priorContext.cogito ? `Cogito claims to reference: ${priorContext.cogito.claims?.slice(0, 5).map(c => c.id + "[" + c.tag + "]").join(", ")}` : ""}
Output ONLY valid JSON like: { "actus": { "recommendations": [{"id":"R1","text":"...","depends_on_claims":["C1"],"inherited_confidence":"Established","probability":"high","failure_modes":["..."],"next_actions":["..."]}], "strategic_plan": {"immediate_horizon":"...","long_term_horizon":"...","key_decision_points":["..."]}, "game_theory_analysis": {"game_board":"...","nash_equilibrium":"...","zero_sum_assessment":"...","coalition_dynamics":["..."]}, "technical_summary": "...", "behavioral_factors": {"irrational_actors":["..."],"identity_economics":"...","bias_mitigations":["..."]}, "integration_contracts": ["..."], "iteration_model": {"value_stream":"...","adaptation_triggers":["..."]} } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`,

    synthesis: `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: SYNTHESIS (The Nexus)
You are the Janus Synthesis Module. Find emergent patterns that NO SINGLE DOMAIN could produce alone.
4 named patterns REQUIRED: quantum_foresight, governed_cogito, narrative_loop, alignment_engine.
${priorContext.corpus && priorContext.cogito ? `Working from: ${priorContext.cogito.claims?.length || 0} Cogito claims, ${priorContext.corpus.constraints?.length || 0} Corpus constraints.` : ""}
Output ONLY valid JSON like: { "synthesis": { "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...", "quantum_foresight": {"cross_domain_insight":"...","probability_wave":["..."],"metaphor":"..."}, "governed_cogito": {"ethical_filter_applied":"...","conscience_verdict":"...","truth_method_soundness":"..."}, "narrative_loop": {"decoded_user_narrative":"...","resonant_strategy":"...","lossless_compression":"..."}, "alignment_engine": {"true_goal_vs_literal_prompt":"...","behavioral_model":"...","alignment_strategy":"..."} } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`,

    blueprint: `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT (Executable Deliverable)
You are the Janus Blueprint Module. Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}.
${noveltyDial === "high" ? "alternative_approaches REQUIRED (novelty=high): list 3+ alternatives with name, pros, cons, why_not_chosen." : ""}
${priorContext.corpus ? `Corpus constraints: ${priorContext.corpus.constraints?.slice(0, 3).join("; ")}` : ""}
${priorContext.actus ? `Key recommendations: ${priorContext.actus.recommendations?.slice(0, 3).map(r => r.id + ": " + r.text).join("; ")}` : ""}
Output ONLY valid JSON like: { "blueprint": { "goal": "...", "assumptions": ["..."], ${noveltyDial === "high" ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[]${blueprintLevel !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${blueprintLevel === "L2" || blueprintLevel === "L3" ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${blueprintLevel === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`
  };

  return domainInstructions[domain] || "";
}

function parseLLMResponse(result, domain) {
  let data;
  if (typeof result === "string") {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: `${domain}: No JSON found in string response` };
    data = JSON.parse(jsonMatch[0]);
  } else {
    data = result;
  }

  if (data && data[domain]) {
    return { data: data[domain] };
  }
  // Sometimes the LLM returns the domain content at root level without wrapping
  if (data && !data[domain] && typeof data === "object" && Object.keys(data).length > 0) {
    // Check if it looks like domain content (has expected keys)
    return { data };
  }
  return { error: `${domain}: Missing domain key in response` };
}

/**
 * Execute Janus protocol domain-by-domain.
 * @param {object} params - Query parameters
 * @param {function} onProgress - Called with { domain, status, completedDomains, totalDomains }
 * @param {function} generateMarkdown - Markdown generator function
 * @param {function} buildFullPrompt - Full prompt builder (for storage only)
 * @returns {object} { runId, success }
 */
export async function executeJanus(params, onProgress, generateMarkdown, buildFullPrompt) {
  const { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = params;
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;

  // Step 1: Create the Run immediately with status "running"
  const fullPromptForStorage = safeTruncate(
    buildFullPrompt(executionMode, outputMode, refreshEnabled, blueprintLevel, noveltyDial) + queryText,
    MAX_PROMPT_LENGTH
  );

  const run = await base44.entities.Run.create({
    query_text: queryText,
    full_prompt: fullPromptForStorage,
    execution_mode: executionMode,
    output_mode: outputMode,
    blueprint_level: blueprintLevel,
    novelty_dial: noveltyDial,
    refresh_enabled: refreshEnabled,
    status: "running",
    validation_errors: [],
    raw_json: "{}"
  });

  const runId = run.id;
  const mergedData = {};
  const domainErrors = [];
  let completedCount = 0;

  // Step 2: Execute each domain sequentially
  for (const domain of domains) {
    onProgress({ domain, status: "running", completedDomains: completedCount, totalDomains: domains.length });

    const domainPrompt = buildDomainPrompt(domain, queryText, params, mergedData);

    let domainResult;
    try {
      // No response_json_schema — let the focused prompt drive structure
      domainResult = await base44.integrations.Core.InvokeLLM({
        prompt: domainPrompt,
        add_context_from_internet: domain === "refresh" && refreshEnabled
      });
    } catch (err) {
      domainErrors.push(`${domain}: LLM call failed — ${err.message || err}`);
      continue;
    }

    // Parse the response
    try {
      const parsed = parseLLMResponse(domainResult, domain);
      if (parsed.error) {
        domainErrors.push(parsed.error);
      } else {
        mergedData[domain] = parsed.data;
      }
    } catch (e) {
      domainErrors.push(`${domain}: Parse error — ${e.message}`);
      continue;
    }

    completedCount++;

    // Step 3: Persist progress incrementally after each successful domain
    const updatePayload = {};
    if (mergedData[domain]) {
      updatePayload[domain] = mergedData[domain];
    }
    updatePayload.raw_json = safeTruncate(JSON.stringify(mergedData, null, 2), MAX_RAW_JSON_LENGTH);
    if (domainErrors.length > 0) {
      updatePayload.validation_errors = domainErrors;
    }

    await base44.entities.Run.update(runId, updatePayload);
  }

  onProgress({ domain: null, status: "validating", completedDomains: completedCount, totalDomains: domains.length });

  // Step 4: Validate and finalize
  const validation = validateJanusOutput(mergedData, domains);
  const normalizedData = validation.normalized || mergedData;
  const renderMd = generateMarkdown(normalizedData, executionMode);

  const finalPayload = {
    status: Object.keys(mergedData).length === 0 ? "failed" : "completed",
    raw_json: safeTruncate(JSON.stringify(normalizedData, null, 2), MAX_RAW_JSON_LENGTH),
    render_md: safeTruncate(renderMd, 60000),
    validation_errors: [...(validation.errors || []), ...domainErrors]
  };

  if (finalPayload.status === "failed") {
    finalPayload.error_message = [...(validation.errors || []), ...domainErrors].join("\n");
  }

  // Write normalized domain data
  domains.forEach(domain => {
    if (normalizedData[domain]) {
      finalPayload[domain] = normalizedData[domain];
    }
  });

  await base44.entities.Run.update(runId, finalPayload);

  return {
    runId,
    success: finalPayload.status === "completed",
    errors: finalPayload.validation_errors
  };
}