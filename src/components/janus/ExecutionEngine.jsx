// Janus Execution Engine — Domain-by-domain sequential LLM orchestrator
// CP-002-O-D-JNP v2.0 — Wisdom Machine Edition
// Architecture: Incremental Synthesis — intersection pairs computed as domains complete
// Persists progress incrementally so page reloads don't lose completed work

import { base44 } from "@/api/base44Client";
import { EXECUTION_MODES, validateJanusOutput } from "./janusSchema";
import { DOMAIN_SME, SYNTHESIS_MODELS, buildSMEIdentity, buildSynthesisPrompt } from "./domainSME";

const MAX_RAW_JSON_LENGTH = 200000; // Full fidelity for cephalon consumption
const MAX_PROMPT_LENGTH = 10000;
const MAX_CONTEXT_LENGTH = 20000; // Full fidelity — quality over speed

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n\n[TRUNCATED — original was " + str.length + " chars]";
}

// ─── INTERSECTION PAIR MAPPING ───────────────────────────────────────────────
// Which intersection pairs become available after each domain completes
const INTERSECTION_TRIGGERS = {
  cogito:  [{ pair: "corpus_x_cogito", domains: ["corpus", "cogito"], model: "knowledge_reality" }],
  animus:  [
    { pair: "corpus_x_animus", domains: ["corpus", "animus"], model: "conscience_boundary" },
    { pair: "cogito_x_animus", domains: ["cogito", "animus"], model: "governed_cogito" }
  ],
  actus:   [
    { pair: "corpus_x_actus", domains: ["corpus", "actus"], model: "quantum_foresight" },
    { pair: "cogito_x_actus", domains: ["cogito", "actus"], model: "narrative_loop" },
    { pair: "animus_x_actus", domains: ["animus", "actus"], model: "empathy_driven_strategy" }
  ]
};

// ─── CONTEXT BUILDERS ────────────────────────────────────────────────────────

function buildRefreshContext(priorDomains, targetDomain) {
  if (!priorDomains.refresh?.subdomain_updates) return "";
  const updates = priorDomains.refresh.subdomain_updates;
  const domainSubdomainMap = {
    corpus: ["distributed_systems", "data_engineering", "cybersecurity", "systems_engineering", "theoretical_physics", "ai_ml", "neuroscience"],
    cogito: ["unified_ai_cognitive", "knowledge_graphs", "epistemology", "computational_linguistics", "graphrag_reasoning", "neuro_symbolic"],
    animus: ["philosophy_of_mind", "jungian_psychology", "ethical_ai", "hci_empathy", "ai_safety"],
    actus: ["game_theory", "mlops_product", "agile_scrum", "technical_writing", "behavioral_economics", "api_design"],
    blueprint: ["distributed_systems", "data_engineering", "cybersecurity", "ai_ml", "neuroscience"]
  };
  const relevantKeys = domainSubdomainMap[targetDomain] || [];
  const freshData = relevantKeys
    .filter(k => updates[k] && updates[k] !== "no significant update found")
    .map(k => `  ${k}: ${updates[k]}`);
  const parts = [];
  if (freshData.length > 0) {
    parts.push("═══ FRESH INTERNET DATA (from Refresh sweep — use this over training data) ═══");
    parts.push(freshData.join("\n"));
  }
  if (priorDomains.refresh.key_developments?.length) {
    parts.push("Key Recent Developments:");
    priorDomains.refresh.key_developments.forEach(d => parts.push(`  ★ ${d}`));
  }
  return parts.join("\n");
}

function buildDomainContext(priorDomains, targetDomain) {
  const parts = [];
  const refreshCtx = buildRefreshContext(priorDomains, targetDomain);
  if (refreshCtx) parts.push(refreshCtx);

  if (targetDomain === "cogito" && priorDomains.corpus) {
    const c = priorDomains.corpus;
    parts.push("═══ PRIOR DOMAIN CONTEXT: CORPUS (What I Am Made Of) ═══");
    if (c.constraints?.length) parts.push("Hard Constraints:\n" + c.constraints.map((x, i) => `  ${i + 1}. ${x}`).join("\n"));
    if (c.feasibility_notes?.length) parts.push("Feasibility Notes:\n" + c.feasibility_notes.map(x => `  • ${x}`).join("\n"));
    if (c.subdomains) {
      parts.push("Subdomain Expert Perspectives:");
      Object.entries(c.subdomains).forEach(([key, sub]) => {
        if (sub?.perspective) parts.push(`  ${key}: ${sub.perspective}`);
        if (sub?.key_findings?.length) sub.key_findings.forEach(f => parts.push(`    → ${f}`));
      });
    }
  }

  if (targetDomain === "animus") {
    if (priorDomains.corpus?.constraints?.length) {
      parts.push("═══ CORPUS CONSTRAINTS ═══");
      priorDomains.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
    }
    if (priorDomains.cogito) {
      const cog = priorDomains.cogito;
      parts.push("═══ COGITO CLAIMS (for ethical review) ═══");
      if (cog.claims?.length) cog.claims.forEach(c => parts.push(`  ${c.id} [${c.tag}]: ${c.text}`));
      if (cog.causal_chains?.length) {
        parts.push("Causal Chains:");
        cog.causal_chains.forEach(cc => parts.push(`  ${cc.cause} → ${cc.effect} [${cc.confidence}]`));
      }
    }
  }

  if (targetDomain === "actus") {
    if (priorDomains.cogito?.claims?.length) {
      parts.push("═══ COGITO CLAIMS (for confidence propagation) ═══");
      priorDomains.cogito.claims.forEach(c => parts.push(`  ${c.id} [${c.tag}]: ${c.text}`));
    }
    if (priorDomains.animus) {
      const a = priorDomains.animus;
      parts.push("═══ ANIMUS BOUNDARIES ═══");
      if (a.ethical_stance) parts.push(`  Ethical Stance: ${a.ethical_stance}`);
      if (a.boundary_checks?.length) a.boundary_checks.forEach(b => parts.push(`  Boundary: ${b}`));
      if (a.disallowed_moves?.length) a.disallowed_moves.forEach(d => parts.push(`  DISALLOWED: ${d}`));
    }
    if (priorDomains.corpus?.constraints?.length) {
      parts.push("═══ CORPUS CONSTRAINTS ═══");
      priorDomains.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
    }
  }

  if (targetDomain === "blueprint") {
    // Blueprint receives FULL-FIDELITY intersection insights — no truncation
    // These are the distilled cross-domain wisdom the blueprint must operationalize
    if (priorDomains._intersections) {
      parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS (The Nexus) ═══");
      parts.push("Emergent wisdom from domain intersections — full fidelity:\n");
      Object.entries(priorDomains._intersections).forEach(([pairKey, data]) => {
        const model = SYNTHESIS_MODELS[data._model];
        const label = model ? `${model.name} (${model.domains.map(d => DOMAIN_SME[d]?.title || d).join(" × ")})` : pairKey;
        parts.push(`  ▸ ${label}`);
        if (data.insight) parts.push(`    Insight: ${data.insight}`);
        if (data.tension) parts.push(`    Tension: ${data.tension}`);
        if (data.resolution) parts.push(`    Resolution: ${data.resolution}`);
      });
    }
    // Actus recommendations — the most actionable upstream data for the blueprint
    if (priorDomains.actus?.recommendations?.length) {
      parts.push("\n═══ ACTUS: Key Recommendations (confidence-propagated) ═══");
      priorDomains.actus.recommendations.forEach(r => parts.push(`  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${r.text}`));
    }
    if (priorDomains.actus?.strategic_plan) {
      const sp = priorDomains.actus.strategic_plan;
      if (sp.immediate_horizon) parts.push(`  Immediate Horizon: ${sp.immediate_horizon}`);
      if (sp.long_term_horizon) parts.push(`  Long-term Horizon: ${sp.long_term_horizon}`);
    }
    // Corpus constraints are non-negotiable for blueprint
    if (priorDomains.corpus?.constraints?.length) {
      parts.push("\n═══ CORPUS: Hard Constraints (non-negotiable) ═══");
      priorDomains.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
    }
    if (priorDomains.animus?.ethical_stance) {
      parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${priorDomains.animus.ethical_stance}`);
    }
  }

  return safeTruncate(parts.join("\n"), MAX_CONTEXT_LENGTH);
}

// ─── INTERSECTION PAIR PROMPT ────────────────────────────────────────────────

function buildIntersectionPrompt(pairKey, modelKey, domainA, domainB, dataA, dataB, queryText) {
  const model = SYNTHESIS_MODELS[modelKey];
  const domA = DOMAIN_SME[domainA];
  const domB = DOMAIN_SME[domainB];

  const contextA = JSON.stringify(dataA).slice(0, 3000);
  const contextB = JSON.stringify(dataB).slice(0, 3000);

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — CROSS-DOMAIN SYNTHESIS

You are the Janus Synthesis Engine performing a SINGLE intersection analysis.
Your task: find what EMERGES at the intersection of two expert domains that NEITHER domain alone could produce.

═══ INTERSECTION: ${model.name} ═══
${model.description}
Mechanism: ${model.mechanism}

═══ DOMAIN A: ${domA.title} (Section ${domA.section}) ═══
Core Insight: "${domA.core_insight}"
Expert Output:
${contextA}

═══ DOMAIN B: ${domB.title} (Section ${domB.section}) ═══
Core Insight: "${domB.core_insight}"
Expert Output:
${contextB}

CRITICAL INSTRUCTION: The insight you produce MUST be EMERGENT — something that could NOT have come from either domain alone. You are looking for the spark that happens when these two forms of expertise collide. Think like a polymath who sees what specialists miss.

If the physics and math check out, precedent doesn't matter. Novel problems require novel solutions. Push past conventional thinking — if there's a non-obvious path that has higher probability of achieving the goal, NAME IT even if it's unheard of.

Output ONLY valid JSON: { "${pairKey}": { "insight": "the emergent wisdom that lives at this intersection", "tension": "where these two domains pull in different directions", "resolution": "how the tension resolves into something greater than either domain" } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// ─── DOMAIN PROMPTS ──────────────────────────────────────────────────────────

function buildDomainPrompt(domain, queryText, opts, priorContext) {
  const { executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = opts;

  // ── REFRESH
  if (domain === "refresh") {
    if (refreshEnabled) {
      return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: REFRESH (Zero-Day Patch)
You are the Janus Refresh Module. You have INTERNET ACCESS. Your task is to research CURRENT, UP-TO-DATE information for each of the 24 subdomains listed below.

DO NOT rely on your training data alone. Your training data is outdated. It is ${new Date().getFullYear()} — the field has changed significantly. You MUST search the internet for the latest developments, papers, frameworks, vulnerabilities, standards, and breakthroughs relevant to the query.

For EACH subdomain below, search for the most recent and relevant information as it relates to the query. Report what you found, including sources when possible.

CORPUS SUBDOMAINS (7):
1. Distributed Systems & Cloud Architecture 2. Data Engineering & Systemic Integrity 3. Cybersecurity & Threat Intelligence 4. Systems Engineering 5. Theoretical & Quantum Physics 6. AI/ML Systems 7. Neuroscience & Cognitive Science

COGITO SUBDOMAINS (6):
8. Unified AI & Cognitive Architectures 9. Knowledge Graph & Semantic Networks 10. Epistemology & Algorithm Auditing 11. Computational Linguistics & Narratology 12. GraphRAG & Causal Reasoning 13. Neuro-Symbolic AI

ANIMUS SUBDOMAINS (5):
14. Philosophy of Mind & Metaphysics 15. Jungian Psychology & Archetypal Theory 16. Ethical AI & Moral Frameworks 17. UI/UX & Human-Computer Interaction 18. AI Safety & Alignment

ACTUS SUBDOMAINS (6):
19. Game Theory & Strategic Foresight 20. MLOps & Product Management 21. Agile & Scrum Methodologies 22. Technical Writing & Information Design 23. Behavioral Economics 24. API Design & Integration

Output ONLY valid JSON: { "refresh": { "mode": "tier1", "attempted": true, "limitations": "any search limitations encountered", "subdomain_updates": { "distributed_systems": "...", "data_engineering": "...", "cybersecurity": "...", "systems_engineering": "...", "theoretical_physics": "...", "ai_ml": "...", "neuroscience": "...", "unified_ai_cognitive": "...", "knowledge_graphs": "...", "epistemology": "...", "computational_linguistics": "...", "graphrag_reasoning": "...", "neuro_symbolic": "...", "philosophy_of_mind": "...", "jungian_psychology": "...", "ethical_ai": "...", "hci_empathy": "...", "ai_safety": "...", "game_theory": "...", "mlops_product": "...", "agile_scrum": "...", "technical_writing": "...", "behavioral_economics": "...", "api_design": "..." }, "key_developments": ["development 1", "development 2", "development 3"], "sources_consulted": ["source 1", "source 2"] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    } else {
      return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: REFRESH (Zero-Day Patch)
You are the Janus Refresh Module. Internet access is DISABLED by the operator.
You MUST NOT claim to have searched the internet. Be honest: your knowledge comes from training data only.
Declare what you WOULD search for if internet access were enabled.

Output ONLY valid JSON: { "refresh": { "mode": "tier0", "attempted": false, "limitations": "Analysis based on training data only — no live internet sweep performed. Training data may be outdated.", "would_refresh": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"], "training_data_cutoff_note": "State your approximate training data cutoff date" } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    }
  }

  // ── FINAL SYNTHESIS (named patterns only — intersection matrix already computed)
  if (domain === "synthesis") {
    const intersections = priorContext._intersections || {};
    // Full-fidelity intersection pairs — NO truncation. These ARE the synthesis inputs.
    // The intersection pairs already contain the distilled wisdom from each domain pair.
    // We do NOT re-send raw domain dumps — that's redundant noise the LLM doesn't need.
    const matrixEntries = Object.entries(intersections)
      .map(([key, val]) => {
        const model = SYNTHESIS_MODELS[val._model];
        const label = model ? model.name : key;
        return `═══ ${key.toUpperCase()} — ${label} ═══
Insight: ${val.insight || "(not computed)"}
Tension: ${val.tension || "(not computed)"}
Resolution: ${val.resolution || "(not computed)"}`;
      })
      .join("\n\n");

    return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: SYNTHESIS — THE NEXUS (Section V)

You are the Janus Synthesis Engine. The 6 domain intersection pairs have ALREADY been computed by dedicated cross-domain analysis. Each pair below represents the EMERGENT wisdom found at the intersection of two expert domains.

Your task: read these 6 intersection results and produce the 4 NAMED EMERGENT PATTERNS that arise from their combination, plus a final cross-domain summary.

═══ THE 6 PRE-COMPUTED INTERSECTION PAIRS (full fidelity) ═══

${matrixEntries}

═══ YOUR SYNTHESIS TASK ═══

Using ONLY the intersection pairs above as your source material, produce:

1. QUANTUM FORESIGHT (Corpus × Actus): Probabilistic decision-making grounded in physical reality. What futures become visible when physics meets strategy?
2. GOVERNED COGITO (Animus × Cogito): Ethical truth-finding. How does conscience govern the reasoning process?
3. NARRATIVE LOOP (Cogito × Actus): Where understanding meets expression. What story is the user telling, and what response resonates?
4. EMPATHY-DRIVEN STRATEGY (Animus × Actus): Non-rational agent modeling. What strategies emerge when you model real human behavior, not rational actors?

Also produce:
- key_takeaways: The 3-5 most groundbreaking cross-domain insights from ALL 6 intersections combined
- constraint_collisions: Where intersection findings genuinely CONFLICT with each other
- limitation_foreground: The single most significant limitation of this entire analysis

CRITICAL: Every named pattern must produce EMERGENT insight — wisdom that transcends any single intersection pair. If it could come from one pair alone, it fails. Push past convention — novel problems require novel solutions.

Output ONLY valid JSON: { "synthesis": {
  "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...",
  "quantum_foresight": {"cross_domain_insight":"...","probability_wave":["..."],"metaphor":"..."},
  "governed_cogito": {"ethical_filter_applied":"...","conscience_verdict":"...","truth_method_soundness":"..."},
  "narrative_loop": {"decoded_user_narrative":"...","resonant_strategy":"...","lossless_compression":"..."},
  "empathy_driven_strategy": {"true_goal_vs_literal_prompt":"...","behavioral_model":"...","empathy_strategy":"..."}
} }

IMPORTANT: Do NOT include an intersection_matrix field — the pre-computed pairs are already stored separately. Focus your output ENTIRELY on the 4 named emergent patterns and the summary fields.

No markdown fences, no prose outside JSON.`;
  }

  // ── BLUEPRINT
  if (domain === "blueprint") {
    const blueprintContext = buildDomainContext(priorContext, "blueprint");
    return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT (Executable Deliverable)
You are the Janus Blueprint Module — the culmination of a multi-domain cognitive architecture.
Your task: produce a concrete, executable plan that synthesizes ALL prior domain expertise into actionable wisdom.
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}.
${noveltyDial === "high" ? "alternative_approaches REQUIRED (novelty=high): list 3+ alternatives with name, pros, cons, why_not_chosen." : ""}

${blueprintContext}

CRITICAL DIRECTIVES:
1. Every step must be traceable to the synthesis insights and domain constraints above.
2. The blueprint must respect Animus ethical boundaries.
3. If the physics and math check out, precedent does not matter. This protocol exists to find solutions that conventional thinking misses.
4. Blueprints must be answers of WISDOM — highest probability paths to genuinely achieving the stated goal, even if unheard of.
5. Complexity yields emergent behaviors. Do not oversimplify. The depth of the prior analysis IS the competitive advantage.

Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], ${noveltyDial === "high" ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[]${blueprintLevel !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${blueprintLevel === "L2" || blueprintLevel === "L3" ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${blueprintLevel === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
  }

  // ── CORE SME DOMAINS (corpus, cogito, animus, actus)
  const smeIdentity = buildSMEIdentity(domain);
  const contextBlock = buildDomainContext(priorContext, domain);

  const outputFormats = {
    corpus: `Output ONLY valid JSON with the "corpus" key: { "corpus": { "constraints": ["hard reality constraints from your expert assessment"], "feasibility_notes": ["practical viability notes"], "subdomains": { "distributed_systems": {"perspective": "your expert perspective as one coherent voice", "key_findings": ["specific technical findings only this expertise would produce"]}, "data_engineering": {"perspective": "...", "key_findings": ["..."]}, "cybersecurity": {"perspective": "...", "key_findings": ["..."]}, "systems_engineering": {"perspective": "...", "key_findings": ["..."]}, "theoretical_physics": {"perspective": "...", "key_findings": ["..."]}, "ai_ml": {"perspective": "...", "key_findings": ["..."]}, "neuroscience": {"perspective": "...", "key_findings": ["..."]} } } }`,

    cogito: `Output ONLY valid JSON with the "cogito" key: { "cogito": { "claims": [{"id":"C1","tag":"Established","text":"your epistemic finding","depends_on":[],"why_believed":"justified basis","falsifiable_by":"what would disprove this","verify_later":"what to check"}], "reasoning_map": ["logical chain step 1", "step 2", "..."], "graphrag_connections": ["concept A ↔ concept B: relationship"], "causal_chains": [{"cause":"...","effect":"...","confidence":"Established"}], "neuro_symbolic_insights": ["insights from bridging symbolic and connectionist reasoning"] } }`,

    animus: `Output ONLY valid JSON with the "animus" key: { "animus": { "boundary_checks": ["what the user should/should not do"], "disallowed_moves": ["explicitly forbidden approaches"], "safety_notes": ["safety considerations"], "consciousness_boundary": "where agency and autonomy limits lie", "attractor_states": ["natural equilibrium points the system tends toward"], "ethical_stance": "your integrated moral assessment", "risk_analysis": {"cognitive_sync_assessment": "how well-aligned are the goals", "self_determination_factors": ["factors affecting autonomy"], "misalignment_risks": ["where intent and outcome may diverge"]} } }`,

    actus: `CONFIDENCE PROPAGATION LAW (NON-NEGOTIABLE): Every recommendation MUST inherit the LOWEST confidence tag of the Cogito claims it depends on. A recommendation depending on a "Speculative" claim CANNOT be marked "Established".

Output ONLY valid JSON with the "actus" key: { "actus": { "recommendations": [{"id":"R1","text":"actionable recommendation","depends_on_claims":["C1"],"inherited_confidence":"Established","probability":"high","failure_modes":["what could go wrong"],"next_actions":["immediate next step"]}], "strategic_plan": {"immediate_horizon":"next 1-4 weeks","long_term_horizon":"3-12 months","key_decision_points":["decisions that must be made"]}, "game_theory_analysis": {"game_board":"who are the players and what are the stakes","nash_equilibrium":"stable outcome if all act rationally","zero_sum_assessment":"is this zero-sum or positive-sum","coalition_dynamics":["potential alliances and conflicts"]}, "technical_summary": "lossless compression of the entire analysis into one paragraph", "behavioral_factors": {"irrational_actors":["who might act irrationally and why"],"identity_economics":"how identity shapes economic decisions here","bias_mitigations":["specific debiasing strategies"]}, "integration_contracts": ["API/interface agreements needed"], "iteration_model": {"value_stream":"how value flows through the system","adaptation_triggers":["signals that should trigger strategy change"]} } }`
  };

  return `INITIATE PROTOCOL: JANUSSMEv2.0

${smeIdentity}

${contextBlock ? `\n${contextBlock}\n` : ""}
Analyze the following query through your unified expert perspective. Think FROM INSIDE your expertise — do not summarize textbook knowledge, produce findings that reflect genuine mastery. Push beyond conventional wisdom. If the physics and math support a novel approach, precedent is irrelevant.

${outputFormats[domain] || ""}
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// ─── RESPONSE PARSER ─────────────────────────────────────────────────────────

function parseLLMResponse(result, expectedKey) {
  let data;
  if (typeof result === "string") {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: `${expectedKey}: No JSON found in string response` };
    data = JSON.parse(jsonMatch[0]);
  } else {
    data = result;
  }

  if (data && data[expectedKey]) {
    return { data: data[expectedKey] };
  }
  if (data && !data[expectedKey] && typeof data === "object" && Object.keys(data).length > 0) {
    return { data };
  }
  return { error: `${expectedKey}: Missing key in response` };
}

// ─── LLM CALL HELPER ─────────────────────────────────────────────────────────

async function callLLM(prompt, domain, refreshEnabled) {
  const llmParams = { prompt };
  if (domain === "refresh" && refreshEnabled) {
    llmParams.add_context_from_internet = true;
    llmParams.model = "gemini_3_flash";
  } else {
    llmParams.model = "claude_sonnet_4_6";
  }
  return await base44.integrations.Core.InvokeLLM(llmParams);
}

// ─── MAIN EXECUTION ──────────────────────────────────────────────────────────

/**
 * Execute Janus protocol with incremental synthesis.
 * Domain pipeline: refresh? → corpus → cogito (+intersection) → animus (+intersections) → actus (+intersections) → synthesis (named patterns) → blueprint
 */
export async function executeJanus(params, onProgress, generateMarkdown, buildFullPrompt) {
  const { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = params;
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;

  // Step 1: Create Run record
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
  const intersections = {}; // Accumulated intersection pairs
  const domainErrors = [];
  let completedCount = 0;
  const totalSteps = domains.length + (domains.includes("synthesis") ? 6 : 0); // 6 intersection pairs for full mode

  // Step 2: Execute each domain sequentially
  for (const domain of domains) {
    onProgress({ domain, status: "running", completedDomains: completedCount, totalDomains: totalSteps });

    // Attach intersections to context for synthesis and blueprint
    const contextForPrompt = { ...mergedData, _intersections: intersections };
    const domainPrompt = buildDomainPrompt(domain, queryText, params, contextForPrompt);

    // ── Execute domain LLM call
    let domainResult;
    try {
      domainResult = await callLLM(domainPrompt, domain, refreshEnabled);
    } catch (err) {
      domainErrors.push(`${domain}: LLM call failed — ${err.message || err}`);
      continue;
    }

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

    // Persist domain result immediately (NO raw_json here — saves entity size)
    const updatePayload = {};
    if (mergedData[domain]) {
      updatePayload[domain] = mergedData[domain];
    }
    if (domainErrors.length > 0) {
      updatePayload.validation_errors = [...domainErrors];
    }
    await base44.entities.Run.update(runId, updatePayload);

    // ── INCREMENTAL SYNTHESIS: Compute intersection pairs as they become available
    if (INTERSECTION_TRIGGERS[domain] && domains.includes("synthesis")) {
      const triggers = INTERSECTION_TRIGGERS[domain];
      for (const trigger of triggers) {
        const [dA, dB] = trigger.domains;
        if (!mergedData[dA] || !mergedData[dB]) continue; // Skip if prerequisite missing

        onProgress({ domain: `synthesis:${trigger.pair}`, status: "running", completedDomains: completedCount, totalDomains: totalSteps });

        try {
          const pairPrompt = buildIntersectionPrompt(trigger.pair, trigger.model, dA, dB, mergedData[dA], mergedData[dB], queryText);
          const pairResult = await callLLM(pairPrompt, "intersection", false);
          const pairParsed = parseLLMResponse(pairResult, trigger.pair);

          if (pairParsed.data) {
            intersections[trigger.pair] = { ...pairParsed.data, _model: trigger.model };
            // Persist intersection pairs incrementally so they survive downstream timeouts
            const { _model, ...cleanPair } = intersections[trigger.pair];
            const currentMatrix = {};
            Object.entries(intersections).forEach(([k, v]) => {
              const { _model: m, ...p } = v;
              currentMatrix[k] = p;
            });
            await base44.entities.Run.update(runId, { 
              synthesis: { intersection_matrix: currentMatrix } 
            });
          } else if (pairParsed.error) {
            domainErrors.push(`intersection:${trigger.pair}: ${pairParsed.error}`);
          }
        } catch (e) {
          domainErrors.push(`intersection:${trigger.pair}: ${e.message}`);
        }

        completedCount++;
      }
    }
  }

  onProgress({ domain: null, status: "validating", completedDomains: completedCount, totalDomains: totalSteps });

  // Step 3: Merge pre-computed intersection pairs into synthesis data
  if (Object.keys(intersections).length > 0) {
    // Build intersection_matrix from the stored pairs (synthesis no longer returns these)
    const matrix = {};
    Object.entries(intersections).forEach(([key, val]) => {
      const { _model, ...pairData } = val;
      matrix[key] = pairData;
    });
    if (mergedData.synthesis) {
      mergedData.synthesis.intersection_matrix = matrix;
    } else {
      // If synthesis itself failed but intersections succeeded, preserve them
      mergedData.synthesis = { intersection_matrix: matrix, key_takeaways: [], constraint_collisions: [], limitation_foreground: "Synthesis named patterns failed — intersection matrix preserved from incremental computation." };
    }
  }

  // Step 4: Validate and finalize
  const validation = validateJanusOutput(mergedData, domains);
  const normalizedData = validation.normalized || mergedData;
  const renderMd = generateMarkdown(normalizedData, executionMode);

  // Determine completion status
  const missingDomains = domains.filter(d => !normalizedData[d]);
  const completionStatus = Object.keys(mergedData).length === 0 ? "failed" 
    : missingDomains.length === 0 ? "completed" 
    : "completed"; // Partial success — some domains present, errors list shows what's missing
  
  const finalPayload = {
    status: completionStatus,
    render_md: safeTruncate(renderMd, 60000),
    validation_errors: [...(validation.errors || []), ...domainErrors]
  };

  // Write raw_json ONCE at the end (compressed, no pretty-print)
  finalPayload.raw_json = safeTruncate(JSON.stringify(normalizedData), MAX_RAW_JSON_LENGTH);

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