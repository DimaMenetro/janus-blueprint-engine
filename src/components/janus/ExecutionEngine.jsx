// Janus Execution Engine — Domain-by-domain sequential LLM orchestrator
// CP-002-O-D-JNP v2.0 — Wisdom Machine Edition
// Persists progress incrementally so page reloads don't lose completed work

import { base44 } from "@/api/base44Client";
import { EXECUTION_MODES, validateJanusOutput } from "./janusSchema";
import { DOMAIN_SME, SYNTHESIS_MODELS, buildSMEIdentity, buildSynthesisPrompt } from "./domainSME";

const MAX_RAW_JSON_LENGTH = 50000; // ~50KB cap for raw_json field
const MAX_PROMPT_LENGTH = 10000;   // Cap stored prompt
const MAX_CONTEXT_LENGTH = 4000;   // Budget for prior domain context per prompt

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n\n[TRUNCATED — original was " + str.length + " chars]";
}

/**
 * Build a context block from prior domain outputs.
 * Intelligently compresses to fit within token budget while preserving
 * the most important information for downstream domains.
 */
function buildContextBlock(priorDomains, targetDomain) {
  const parts = [];

  // ── INJECT REFRESH DATA into all SME domains when available
  if (priorDomains.refresh?.subdomain_updates) {
    const updates = priorDomains.refresh.subdomain_updates;
    const domainSubdomainMap = {
      corpus: ["distributed_systems", "data_engineering", "cybersecurity", "systems_engineering", "theoretical_physics", "ai_ml", "neuroscience"],
      cogito: ["unified_ai_cognitive", "knowledge_graphs", "epistemology", "computational_linguistics", "graphrag_reasoning", "neuro_symbolic"],
      animus: ["philosophy_of_mind", "jungian_psychology", "ethical_ai", "hci_empathy", "ai_safety"],
      actus: ["game_theory", "mlops_product", "agile_scrum", "technical_writing", "behavioral_economics", "api_design"],
      blueprint: ["distributed_systems", "data_engineering", "cybersecurity", "ai_ml", "neuroscience"] // key ones for blueprint
    };
    const relevantKeys = domainSubdomainMap[targetDomain] || [];
    const freshData = relevantKeys
      .filter(k => updates[k] && updates[k] !== "no significant update found")
      .map(k => `  ${k}: ${updates[k]}`);
    if (freshData.length > 0) {
      parts.push("═══ FRESH INTERNET DATA (from Refresh sweep — use this over training data) ═══");
      parts.push(freshData.join("\n"));
    }
    if (priorDomains.refresh.key_developments?.length) {
      parts.push("Key Recent Developments:");
      priorDomains.refresh.key_developments.forEach(d => parts.push(`  ★ ${d}`));
    }
  }

  if (targetDomain === "cogito" && priorDomains.corpus) {
    // Cogito needs ALL corpus constraints + subdomain perspectives
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
    // Animus needs Cogito claims + causal chains + Corpus constraints
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
    // Actus needs Cogito claims (for confidence propagation) + Animus boundaries + Corpus constraints
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
    // Blueprint needs key findings from ALL prior domains
    if (priorDomains.corpus?.constraints?.length) {
      parts.push("═══ CORPUS: Hard Constraints ═══");
      priorDomains.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
    }
    if (priorDomains.cogito?.claims?.length) {
      parts.push("═══ COGITO: Key Claims ═══");
      priorDomains.cogito.claims.forEach(c => parts.push(`  ${c.id} [${c.tag}]: ${c.text}`));
    }
    if (priorDomains.animus?.ethical_stance) {
      parts.push(`═══ ANIMUS: Ethical Stance ═══\n  ${priorDomains.animus.ethical_stance}`);
    }
    if (priorDomains.actus?.recommendations?.length) {
      parts.push("═══ ACTUS: Key Recommendations ═══");
      priorDomains.actus.recommendations.forEach(r => parts.push(`  ${r.id} [${r.inherited_confidence}]: ${r.text}`));
    }
    if (priorDomains.actus?.strategic_plan) {
      const sp = priorDomains.actus.strategic_plan;
      if (sp.immediate_horizon) parts.push(`  Immediate: ${sp.immediate_horizon}`);
      if (sp.long_term_horizon) parts.push(`  Long-term: ${sp.long_term_horizon}`);
    }
  }

  const contextText = parts.join("\n");
  return safeTruncate(contextText, MAX_CONTEXT_LENGTH);
}

// Build focused per-domain prompts — each call is a genuine SME activation
function buildDomainPrompt(domain, queryText, opts, priorContext) {
  const { executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = opts;

  // ── REFRESH — Targeted Internet Research for All 24 Subdomains
  if (domain === "refresh") {
    if (refreshEnabled) {
      return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: REFRESH (Zero-Day Patch)
You are the Janus Refresh Module. You have INTERNET ACCESS. Your task is to research CURRENT, UP-TO-DATE information for each of the 24 subdomains listed below.

DO NOT rely on your training data alone. Your training data is outdated. It is ${new Date().getFullYear()} — the field has changed significantly. You MUST search the internet for the latest developments, papers, frameworks, vulnerabilities, standards, and breakthroughs relevant to the query.

For EACH subdomain below, search for the most recent and relevant information as it relates to the query. Report what you found, including sources when possible.

CORPUS SUBDOMAINS (7):
1. Distributed Systems & Cloud Architecture — latest architectures, serverless trends, edge computing
2. Data Engineering & Systemic Integrity — latest pipeline frameworks, data governance standards
3. Cybersecurity & Threat Intelligence — current CVEs, threat landscapes, zero-day reports
4. Systems Engineering — latest standards, model-based systems engineering updates
5. Theoretical & Quantum Physics — recent papers, quantum computing milestones
6. AI/ML Systems — latest model architectures, training techniques, scaling laws, benchmarks
7. Neuroscience & Cognitive Science — recent cognitive architecture research, consciousness studies

COGITO SUBDOMAINS (6):
8. Unified AI & Cognitive Architectures — latest cognitive AI frameworks, AGI research directions
9. Knowledge Graph & Semantic Networks — latest graph databases, ontology standards
10. Epistemology & Algorithm Auditing — latest AI audit frameworks, bias detection methods
11. Computational Linguistics & Narratology — latest NLP breakthroughs, LLM capabilities
12. GraphRAG & Causal Reasoning — latest retrieval-augmented generation research, causal ML
13. Neuro-Symbolic AI — latest hybrid architecture research, neurosymbolic benchmarks

ANIMUS SUBDOMAINS (5):
14. Philosophy of Mind & Metaphysics — latest consciousness debates, digital sentience discourse
15. Jungian Psychology & Archetypal Theory — latest applications in AI behavior analysis
16. Ethical AI & Moral Frameworks — latest regulations (EU AI Act updates, US executive orders)
17. UI/UX & Human-Computer Interaction — latest interaction paradigms, spatial computing
18. AI Safety & Alignment — latest alignment research, RLHF alternatives, interpretability breakthroughs

ACTUS SUBDOMAINS (6):
19. Game Theory & Strategic Foresight — latest multi-agent interaction research
20. MLOps & Product Management — latest MLOps platforms, deployment patterns
21. Agile & Scrum Methodologies — latest methodology evolutions, DORA metrics
22. Technical Writing & Information Design — latest documentation standards, AI-generated docs
23. Behavioral Economics — latest research on AI-augmented decision-making
24. API Design & Integration — latest API standards (GraphQL, gRPC trends), integration patterns

Output ONLY valid JSON: { "refresh": { "mode": "tier1", "attempted": true, "limitations": "any search limitations encountered", "subdomain_updates": { "distributed_systems": "latest finding or 'no significant update found'", "data_engineering": "...", "cybersecurity": "...", "systems_engineering": "...", "theoretical_physics": "...", "ai_ml": "...", "neuroscience": "...", "unified_ai_cognitive": "...", "knowledge_graphs": "...", "epistemology": "...", "computational_linguistics": "...", "graphrag_reasoning": "...", "neuro_symbolic": "...", "philosophy_of_mind": "...", "jungian_psychology": "...", "ethical_ai": "...", "hci_empathy": "...", "ai_safety": "...", "game_theory": "...", "mlops_product": "...", "agile_scrum": "...", "technical_writing": "...", "behavioral_economics": "...", "api_design": "..." }, "key_developments": ["most impactful recent development 1", "development 2", "development 3"], "sources_consulted": ["source URL or name 1", "source 2"] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    } else {
      return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: REFRESH (Zero-Day Patch)
You are the Janus Refresh Module. Internet access is DISABLED by the operator.
You MUST NOT claim to have searched the internet. Be honest: your knowledge comes from training data only.
Declare what you WOULD search for if internet access were enabled.

Output ONLY valid JSON: { "refresh": { "mode": "tier0", "attempted": false, "limitations": "Analysis based on training data only — no live internet sweep performed. Training data may be outdated.", "would_refresh": ["subdomain or topic 1", "subdomain or topic 2", "subdomain or topic 3", "subdomain or topic 4", "subdomain or topic 5"], "training_data_cutoff_note": "State your approximate training data cutoff date" } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    }
  }

  // ── SYNTHESIS (uses the dedicated synthesis prompt builder)
  if (domain === "synthesis") {
    const synthPrompt = buildSynthesisPrompt(priorContext);
    return `INITIATE PROTOCOL: JANUSSMEv2.0

${synthPrompt}

OUTPUT FORMAT: Return ONLY valid JSON with the "synthesis" key. Structure:
{ "synthesis": {
    "key_takeaways": ["..."],
    "constraint_collisions": ["..."],
    "limitation_foreground": "...",
    "intersection_matrix": {
      "corpus_x_cogito": {"insight":"...","tension":"...","resolution":"..."},
      "corpus_x_animus": {"insight":"...","tension":"...","resolution":"..."},
      "corpus_x_actus": {"insight":"...","tension":"...","resolution":"..."},
      "cogito_x_animus": {"insight":"...","tension":"...","resolution":"..."},
      "cogito_x_actus": {"insight":"...","tension":"...","resolution":"..."},
      "animus_x_actus": {"insight":"...","tension":"...","resolution":"..."}
    },
    "quantum_foresight": {"cross_domain_insight":"...","probability_wave":["..."],"metaphor":"..."},
    "governed_cogito": {"ethical_filter_applied":"...","conscience_verdict":"...","truth_method_soundness":"..."},
    "narrative_loop": {"decoded_user_narrative":"...","resonant_strategy":"...","lossless_compression":"..."},
    "empathy_driven_strategy": {"true_goal_vs_literal_prompt":"...","behavioral_model":"...","empathy_strategy":"..."}
} }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
  }

  // ── BLUEPRINT (context-rich but not an SME identity domain)
  if (domain === "blueprint") {
    const blueprintContext = buildContextBlock(priorContext, "blueprint");
    return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT (Executable Deliverable)
You are the Janus Blueprint Module. Your task is to produce a concrete, executable plan that honors ALL findings from the prior domain experts.
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}.
${noveltyDial === "high" ? "alternative_approaches REQUIRED (novelty=high): list 3+ alternatives with name, pros, cons, why_not_chosen." : ""}

${blueprintContext}

Every step in the blueprint must be traceable to Corpus constraints, Cogito claims, and Actus recommendations above. The blueprint must respect Animus ethical boundaries.

Output ONLY valid JSON like: { "blueprint": { "goal": "...", "assumptions": ["..."], ${noveltyDial === "high" ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[]${blueprintLevel !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${blueprintLevel === "L2" || blueprintLevel === "L3" ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${blueprintLevel === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
  }

  // ── CORE SME DOMAINS (corpus, cogito, animus, actus)
  // These use the genuine SME identity activation from domainSME.js
  const smeIdentity = buildSMEIdentity(domain);
  const contextBlock = buildContextBlock(priorContext, domain);

  // Domain-specific output format instructions
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
Analyze the following query through your unified expert perspective. Think FROM INSIDE your expertise — do not summarize textbook knowledge, produce findings that reflect genuine mastery.

${outputFormats[domain] || ""}
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
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