// Janus Execution Engine — Server-Side Orchestrator
// Moves the entire domain-by-domain LLM pipeline to the backend so
// execution survives the user closing/backgrounding their device.
// The frontend creates a Run record, invokes this function, and polls for completion.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const MAX_RAW_JSON_LENGTH = 200000;
const MAX_PROMPT_LENGTH = 10000;
const MAX_CONTEXT_LENGTH = 20000;
const MAX_BLUEPRINT_CONTEXT = 18000;

function safeTruncate(str, max) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "\n\n[TRUNCATED — original was " + str.length + " chars]";
}

// ─── EXECUTION MODES ─────────────────────────────────────────────────────────

const EXECUTION_MODES = {
  QUICK: { id: "quick", label: "Quick", domains: ["corpus", "cogito", "blueprint"] },
  STANDARD: { id: "standard", label: "Standard", domains: ["corpus", "cogito", "animus", "actus", "blueprint"] },
  FULL: { id: "full", label: "Full Janus v2.0", domains: ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"] }
};

// ─── DOMAIN SME (minimal inline — titles & insights for prompt generation) ───

const DOMAIN_SME = {
  corpus: { section: "I", title: "What I Am Made Of", core_insight: "The body as resilient ecosystem of interconnected nodes" },
  cogito: { section: "II", title: "How I Think", core_insight: "Knowledge as multi-dimensional webs with associative leaps" },
  animus: { section: "III", title: "Who I Am", core_insight: "Introspection and ethical conscience integration" },
  actus: { section: "IV", title: "What I Do", core_insight: "Proactive goal-oriented behavior with empathetic modeling" }
};

const SYNTHESIS_MODELS = {
  quantum_foresight: { name: "Quantum Foresight Model", domains: ["corpus", "actus"], description: "Probabilistic decision-making grounded in physical reality", mechanism: "Physics meets strategy." },
  governed_cogito: { name: "Governed Cogito", domains: ["animus", "cogito"], description: "Ethical truth-finding", mechanism: "Conscience governs cognition." },
  narrative_loop: { name: "The Narrative Loop", domains: ["cogito", "actus"], description: "Resonant communication", mechanism: "Understanding meets expression." },
  empathy_driven_strategy: { name: "Empathy-Driven Strategy", domains: ["animus", "actus"], description: "Strategic modeling via non-rational agents", mechanism: "Empathy informs strategy." },
  knowledge_reality: { name: "Knowledge-Reality Validation", domains: ["corpus", "cogito"], description: "Physical truth meets epistemic rigor", mechanism: "Grounding meets justification." },
  conscience_boundary: { name: "Conscience Boundary", domains: ["corpus", "animus"], description: "Technical capability meets ethical limit", mechanism: "Can vs should." }
};

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

// ─── SME IDENTITY BUILDER ────────────────────────────────────────────────────
// Subdomain data inlined to avoid cross-file imports

const SUBDOMAIN_DATA = {
  corpus: [
    { id: "distributed_systems", name: "Distributed Systems & Cloud Architecture" },
    { id: "data_engineering", name: "Data Engineering & Systemic Integrity" },
    { id: "cybersecurity", name: "Cybersecurity & Threat Intelligence" },
    { id: "systems_engineering", name: "Systems Engineering" },
    { id: "theoretical_physics", name: "Theoretical & Quantum Physics" },
    { id: "ai_ml", name: "AI/ML Systems" },
    { id: "neuroscience", name: "Neuroscience & Cognitive Science" }
  ],
  cogito: [
    { id: "unified_ai_cognitive", name: "Unified AI & Cognitive Architectures" },
    { id: "knowledge_graphs", name: "Knowledge Graph & Semantic Networks" },
    { id: "epistemology", name: "Epistemology & Algorithm Auditing" },
    { id: "computational_linguistics", name: "Computational Linguistics & Narratology" },
    { id: "graphrag_reasoning", name: "GraphRAG & Causal Reasoning" },
    { id: "neuro_symbolic", name: "Neuro-Symbolic AI" }
  ],
  animus: [
    { id: "philosophy_of_mind", name: "Philosophy of Mind & Metaphysics" },
    { id: "jungian_psychology", name: "Jungian Psychology & Archetypal Theory" },
    { id: "ethical_ai", name: "Ethical AI & Moral Frameworks" },
    { id: "hci_empathy", name: "UI/UX & Human-Computer Interaction" },
    { id: "ai_safety", name: "AI Safety & Alignment" }
  ],
  actus: [
    { id: "game_theory", name: "Game Theory & Strategic Foresight" },
    { id: "mlops_product", name: "MLOps & Product Management" },
    { id: "agile_scrum", name: "Agile & Scrum Methodologies" },
    { id: "technical_writing", name: "Technical Writing & Information Design" },
    { id: "behavioral_economics", name: "Behavioral Economics" },
    { id: "api_design", name: "API Design & Integration" }
  ]
};

function buildSMEIdentity(domainKey) {
  const domain = DOMAIN_SME[domainKey];
  if (!domain) return "";
  const subs = SUBDOMAIN_DATA[domainKey] || [];
  const subList = subs.map(s => s.name).join(", ");
  return `═══ DOMAIN ACTIVATION: ${domain.title.toUpperCase()} (Section ${domain.section}) ═══

You are consulting a Subject Matter Expert whose unified wisdom spans: ${subList}.

Core Insight: "${domain.core_insight}"

CRITICAL INSTRUCTION: You must think FROM INSIDE this expertise. Do not produce generic observations. Every finding must reflect the depth of a genuine expert who has spent decades across these disciplines. Draw connections between your subdomains — that is where the deepest insights live.`;
}

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
    parts.push("═══ FRESH INTERNET DATA ═══");
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
    parts.push("═══ PRIOR DOMAIN CONTEXT: CORPUS ═══");
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
      parts.push("═══ COGITO CLAIMS ═══");
      if (cog.claims?.length) cog.claims.forEach(c => parts.push(`  ${c.id} [${c.tag}]: ${c.text}`));
      if (cog.causal_chains?.length) {
        parts.push("Causal Chains:");
        cog.causal_chains.forEach(cc => parts.push(`  ${cc.cause} → ${cc.effect} [${cc.confidence}]`));
      }
    }
  }

  if (targetDomain === "actus") {
    if (priorDomains.cogito?.claims?.length) {
      parts.push("═══ COGITO CLAIMS ═══");
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
    if (priorDomains._intersections) {
      parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS ═══");
      Object.entries(priorDomains._intersections).forEach(([pairKey, data]) => {
        const model = SYNTHESIS_MODELS[data._model];
        const label = model ? model.name : pairKey;
        parts.push(`  ▸ ${label}`);
        if (data.insight) parts.push(`    Insight: ${data.insight}`);
        if (data.tension) parts.push(`    Tension: ${data.tension}`);
        if (data.resolution) parts.push(`    Resolution: ${data.resolution}`);
      });
    }
    if (priorDomains.actus?.recommendations?.length) {
      parts.push("\n═══ ACTUS: Key Recommendations ═══");
      priorDomains.actus.recommendations.forEach(r => parts.push(`  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${r.text}`));
    }
    if (priorDomains.corpus?.constraints?.length) {
      parts.push("\n═══ CORPUS: Hard Constraints ═══");
      priorDomains.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
    }
    if (priorDomains.animus?.ethical_stance) {
      parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${priorDomains.animus.ethical_stance}`);
    }
  }

  return safeTruncate(parts.join("\n"), MAX_CONTEXT_LENGTH);
}

// ─── DOMAIN PROMPT BUILDER ───────────────────────────────────────────────────

function buildDomainPrompt(domain, queryText, opts, priorContext) {
  const { executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled } = opts;

  if (domain === "refresh") {
    if (refreshEnabled) {
      return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: REFRESH
You are the Janus Refresh Module with INTERNET ACCESS. Research CURRENT information for each of the 24 subdomains.
CORPUS SUBDOMAINS (7): 1. Distributed Systems 2. Data Engineering 3. Cybersecurity 4. Systems Engineering 5. Physics 6. AI/ML 7. Neuroscience
COGITO SUBDOMAINS (6): 8. Unified AI Cognitive 9. Knowledge Graphs 10. Epistemology 11. Computational Linguistics 12. GraphRAG 13. Neuro-Symbolic
ANIMUS SUBDOMAINS (5): 14. Philosophy of Mind 15. Jungian Psychology 16. Ethical AI 17. HCI 18. AI Safety
ACTUS SUBDOMAINS (6): 19. Game Theory 20. MLOps 21. Agile 22. Technical Writing 23. Behavioral Economics 24. API Design
Output ONLY valid JSON: { "refresh": { "mode": "tier1", "attempted": true, "limitations": "...", "subdomain_updates": { "distributed_systems": "...", "data_engineering": "...", "cybersecurity": "...", "systems_engineering": "...", "theoretical_physics": "...", "ai_ml": "...", "neuroscience": "...", "unified_ai_cognitive": "...", "knowledge_graphs": "...", "epistemology": "...", "computational_linguistics": "...", "graphrag_reasoning": "...", "neuro_symbolic": "...", "philosophy_of_mind": "...", "jungian_psychology": "...", "ethical_ai": "...", "hci_empathy": "...", "ai_safety": "...", "game_theory": "...", "mlops_product": "...", "agile_scrum": "...", "technical_writing": "...", "behavioral_economics": "...", "api_design": "..." }, "key_developments": ["..."], "sources_consulted": ["..."] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    } else {
      return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: REFRESH
Internet access DISABLED. Declare what you WOULD search for.
Output ONLY valid JSON: { "refresh": { "mode": "tier0", "attempted": false, "limitations": "Training data only", "would_refresh": ["topic 1", "topic 2", "topic 3"] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    }
  }

  if (domain === "synthesis") {
    const intersections = priorContext._intersections || {};
    const matrixEntries = Object.entries(intersections)
      .map(([key, val]) => {
        const model = SYNTHESIS_MODELS[val._model];
        const label = model ? model.name : key;
        return `═══ ${key.toUpperCase()} — ${label} ═══\nInsight: ${val.insight || "(not computed)"}\nTension: ${val.tension || "(not computed)"}\nResolution: ${val.resolution || "(not computed)"}`;
      })
      .join("\n\n");

    return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: SYNTHESIS — THE NEXUS (Section V)

You are the Janus Synthesis Engine. The 6 domain intersection pairs have ALREADY been computed. Read them and produce the 4 NAMED EMERGENT PATTERNS plus cross-domain summary.

═══ THE 6 PRE-COMPUTED INTERSECTION PAIRS ═══

${matrixEntries}

Produce:
1. QUANTUM FORESIGHT (Corpus × Actus)
2. GOVERNED COGITO (Animus × Cogito)
3. NARRATIVE LOOP (Cogito × Actus)
4. EMPATHY-DRIVEN STRATEGY (Animus × Actus)

Also: key_takeaways, constraint_collisions, limitation_foreground.

Output ONLY valid JSON: { "synthesis": { "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...", "quantum_foresight": {"cross_domain_insight":"...","probability_wave":["..."],"metaphor":"..."}, "governed_cogito": {"ethical_filter_applied":"...","conscience_verdict":"...","truth_method_soundness":"..."}, "narrative_loop": {"decoded_user_narrative":"...","resonant_strategy":"...","lossless_compression":"..."}, "empathy_driven_strategy": {"true_goal_vs_literal_prompt":"...","behavioral_model":"...","empathy_strategy":"..."} } }
No markdown fences, no prose outside JSON.`;
  }

  if (domain === "blueprint") {
    const blueprintContext = buildDomainContext(priorContext, "blueprint");
    return `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}.
${noveltyDial === "high" ? "alternative_approaches REQUIRED." : ""}

${blueprintContext}

Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], ${noveltyDial === "high" ? '"alternative_approaches": [...], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[]${blueprintLevel !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${["L2", "L3"].includes(blueprintLevel) ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${blueprintLevel === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
  }

  // Core SME domains
  const smeIdentity = buildSMEIdentity(domain);
  const contextBlock = buildDomainContext(priorContext, domain);

  const outputFormats = {
    corpus: `Output ONLY valid JSON with the "corpus" key: { "corpus": { "constraints": ["..."], "feasibility_notes": ["..."], "subdomains": { "distributed_systems": {"perspective": "...", "key_findings": ["..."]}, "data_engineering": {"perspective": "...", "key_findings": ["..."]}, "cybersecurity": {"perspective": "...", "key_findings": ["..."]}, "systems_engineering": {"perspective": "...", "key_findings": ["..."]}, "theoretical_physics": {"perspective": "...", "key_findings": ["..."]}, "ai_ml": {"perspective": "...", "key_findings": ["..."]}, "neuroscience": {"perspective": "...", "key_findings": ["..."]} } } }`,
    cogito: `Output ONLY valid JSON with the "cogito" key: { "cogito": { "claims": [{"id":"C1","tag":"Established","text":"...","depends_on":[],"why_believed":"...","falsifiable_by":"...","verify_later":"..."}], "reasoning_map": ["..."], "graphrag_connections": ["..."], "causal_chains": [{"cause":"...","effect":"...","confidence":"Established"}], "neuro_symbolic_insights": ["..."] } }`,
    animus: `Output ONLY valid JSON with the "animus" key: { "animus": { "boundary_checks": ["..."], "disallowed_moves": ["..."], "safety_notes": ["..."], "consciousness_boundary": "...", "attractor_states": ["..."], "ethical_stance": "...", "risk_analysis": {"cognitive_sync_assessment": "...", "self_determination_factors": ["..."], "misalignment_risks": ["..."]} } }`,
    actus: `CONFIDENCE PROPAGATION LAW (NON-NEGOTIABLE): Every recommendation MUST inherit the LOWEST confidence of its upstream Cogito claims.

Output ONLY valid JSON with the "actus" key: { "actus": { "recommendations": [{"id":"R1","text":"...","depends_on_claims":["C1"],"inherited_confidence":"Established","probability":"high","failure_modes":["..."],"next_actions":["..."]}], "strategic_plan": {"immediate_horizon":"...","long_term_horizon":"...","key_decision_points":["..."]}, "game_theory_analysis": {"game_board":"...","nash_equilibrium":"...","zero_sum_assessment":"...","coalition_dynamics":["..."]}, "technical_summary": "...", "behavioral_factors": {"irrational_actors":["..."],"identity_economics":"...","bias_mitigations":["..."]}, "integration_contracts": ["..."], "iteration_model": {"value_stream":"...","adaptation_triggers":["..."]} } }`
  };

  return `INITIATE PROTOCOL: JANUSSMEv2.0

${smeIdentity}

${contextBlock ? `\n${contextBlock}\n` : ""}
Analyze the following query through your unified expert perspective. Think FROM INSIDE your expertise. Push beyond conventional wisdom.

${outputFormats[domain] || ""}
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// ─── INTERSECTION PROMPT ─────────────────────────────────────────────────────

function buildIntersectionPrompt(pairKey, modelKey, domainA, domainB, dataA, dataB, queryText) {
  const model = SYNTHESIS_MODELS[modelKey];
  const domA = DOMAIN_SME[domainA];
  const domB = DOMAIN_SME[domainB];
  const contextA = JSON.stringify(dataA).slice(0, 6000);
  const contextB = JSON.stringify(dataB).slice(0, 6000);

  return `INITIATE PROTOCOL: JANUSSMEv2.0 — CROSS-DOMAIN SYNTHESIS

═══ INTERSECTION: ${model.name} ═══
${model.description}

═══ DOMAIN A: ${domA.title} (Section ${domA.section}) ═══
${contextA}

═══ DOMAIN B: ${domB.title} (Section ${domB.section}) ═══
${contextB}

CRITICAL: The insight MUST be EMERGENT — something NEITHER domain alone could produce.

Output ONLY valid JSON: { "${pairKey}": { "insight": "...", "tension": "...", "resolution": "..." } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
}

// ─── BLUEPRINT SPLIT-CALL ────────────────────────────────────────────────────

function buildCompressedBlueprintContext(source) {
  const parts = [];
  const matrix = source.synthesis?.intersection_matrix || source._intersections;
  if (matrix) {
    parts.push("═══ CROSS-DOMAIN SYNTHESIS INSIGHTS ═══");
    Object.entries(matrix).forEach(([key, data]) => {
      const insight = data.insight || data.data?.insight;
      const tension = data.tension || data.data?.tension;
      const resolution = data.resolution || data.data?.resolution;
      parts.push(`  ▸ ${key}`);
      if (insight) parts.push(`    Insight: ${insight}`);
      if (tension) parts.push(`    Tension: ${tension}`);
      if (resolution) parts.push(`    Resolution: ${resolution}`);
    });
  }
  const synthSource = source.synthesis || {};
  ["quantum_foresight", "governed_cogito", "narrative_loop", "empathy_driven_strategy"].forEach(key => {
    const pattern = synthSource[key];
    if (pattern) {
      const summary = Object.values(pattern).filter(v => typeof v === "string").join(" | ");
      if (summary) parts.push(`  ▸ ${key}: ${summary.slice(0, 300)}`);
    }
  });
  if (source.actus?.recommendations?.length) {
    parts.push("\n═══ ACTUS: Recommendations ═══");
    source.actus.recommendations.forEach(r => {
      const shortText = r.text?.length > 200 ? r.text.slice(0, 200) + "..." : r.text;
      parts.push(`  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${shortText}`);
    });
  }
  if (source.corpus?.constraints?.length) {
    parts.push("\n═══ CORPUS: Hard Constraints ═══");
    source.corpus.constraints.forEach((x, i) => parts.push(`  ${i + 1}. ${x}`));
  }
  if (source.animus?.ethical_stance) {
    parts.push(`\n═══ ANIMUS: Ethical Stance ═══\n  ${source.animus.ethical_stance}`);
  }
  return safeTruncate(parts.join("\n"), MAX_BLUEPRINT_CONTEXT);
}

async function executeBlueprintSplitCall(base44, source, queryText, blueprintLevel, noveltyDial, outputMode, fileUrls) {
  const errors = [];
  const contextBlock = buildCompressedBlueprintContext(source);

  // Sub-call 1: Skeleton
  let skeleton = null;
  try {
    const prompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — BLUEPRINT SUB-CALL 1/3: SKELETON
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}.

${contextBlock}

Generate the blueprint skeleton — goal, assumptions, steps with titles, instructions, inputs, outputs, validation, dependencies. No substeps/checklists.

Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], "steps": [{"step": 1, "title": "...", "instructions": "...", "inputs": ["..."], "outputs": ["..."], "validation": "...", "depends_on_steps": []}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    const result = await callLLM(base44, prompt, "blueprint", false, fileUrls);
    const parsed = parseLLMResponse(result, "blueprint");
    if (parsed.data) skeleton = parsed.data;
    else errors.push(`blueprint:skeleton: ${parsed.error}`);
  } catch (e) {
    errors.push(`blueprint:skeleton: ${e.message}`);
  }

  if (!skeleton) return { data: null, errors };

  // Sub-call 2: Step Expansion (skip for L1)
  if (blueprintLevel !== "L1") {
    try {
      const stepSummary = skeleton.steps.map(s => `  Step ${s.step}: ${s.title} — ${(s.instructions || "").slice(0, 150)}`).join("\n");
      const fields = [];
      if (blueprintLevel !== "L1") fields.push('"time_estimate": "...", "effort_level": "low|medium|high"');
      if (["L2", "L3"].includes(blueprintLevel)) fields.push('"substeps": [{"substep": "1a", "details": "..."}]');
      if (blueprintLevel === "L3") fields.push('"checklist": ["..."], "acceptance_tests": ["..."]');

      const prompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — BLUEPRINT SUB-CALL 2/3: STEP EXPANSION
Level: ${blueprintLevel}

Goal: ${skeleton.goal}
Steps:
${stepSummary}

For EACH step, produce expansion fields.
Output ONLY valid JSON: { "step_expansions": [{"step": 1, ${fields.join(", ")}}] }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
      const result = await callLLM(base44, prompt, "blueprint", false, fileUrls);
      const parsed = parseLLMResponse(result, "step_expansions");
      if (parsed.data) {
        const expansions = Array.isArray(parsed.data) ? parsed.data : [];
        const expansionMap = {};
        expansions.forEach(exp => { if (exp.step) expansionMap[exp.step] = exp; });
        skeleton.steps = skeleton.steps.map(step => {
          const exp = expansionMap[step.step];
          if (!exp) return step;
          return { ...step, ...exp, step: step.step, title: step.title, instructions: step.instructions };
        });
      } else {
        errors.push(`blueprint:expansion: ${parsed.error}`);
      }
    } catch (e) {
      errors.push(`blueprint:expansion: ${e.message}`);
    }
  }

  // Sub-call 3: Criteria & Risk
  try {
    const stepTitles = skeleton.steps.map(s => `  ${s.step}. ${s.title}`).join("\n");
    const altBlock = noveltyDial === "high" ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : "";
    const prompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — BLUEPRINT SUB-CALL 3/3: CRITERIA & RISK

Steps:
${stepTitles}

Context:
${contextBlock}

Output ONLY valid JSON: { "criteria_risk": { ${altBlock}"success_criteria": ["..."], "risk_register": [{"risk": "...", "impact": "low|med|high", "mitigation": "..."}] } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;
    const result = await callLLM(base44, prompt, "blueprint", false, fileUrls);
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

// ─── LLM CALL HELPER ─────────────────────────────────────────────────────────

async function callLLM(base44, prompt, domain, refreshEnabled, fileUrls) {
  const llmParams = { prompt };
  if (domain === "refresh" && refreshEnabled) {
    llmParams.add_context_from_internet = true;
    llmParams.model = "gemini_3_flash";
  } else {
    llmParams.model = "claude_sonnet_4_6";
  }
  if (fileUrls?.length) llmParams.file_urls = fileUrls;
  return await base44.asServiceRole.integrations.Core.InvokeLLM(llmParams);
}

// ─── RESPONSE PARSER ─────────────────────────────────────────────────────────

function parseLLMResponse(result, expectedKey) {
  let data;
  if (typeof result === "string") {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: `${expectedKey}: No JSON found` };
    data = JSON.parse(jsonMatch[0]);
  } else {
    data = result;
  }
  if (data && data[expectedKey]) return { data: data[expectedKey] };
  if (data && typeof data === "object" && Object.keys(data).length > 0) return { data };
  return { error: `${expectedKey}: Missing key` };
}

// ─── MARKDOWN GENERATOR (minimal — for render_md field) ──────────────────────

function generateMarkdown(data, executionMode) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode?.domains || [];
  let md = `# Janus SME Protocol — CP-002-O-D-JNP v2.0\n\n**Mode:** ${mode?.label || executionMode}\n\n`;

  if (data.corpus) {
    md += "## Section I: Corpus\n\n";
    if (data.corpus.constraints?.length) { md += "**Hard Constraints:**\n"; data.corpus.constraints.forEach((c, i) => md += `${i + 1}. ${c}\n`); md += "\n"; }
  }
  if (data.cogito?.claims?.length) {
    md += "## Section II: Cogito\n\n### Claims\n\n";
    data.cogito.claims.forEach(c => { md += `#### ${c.id} [${c.tag}]\n${c.text}\n\n`; });
  }
  if (data.animus) {
    md += "## Section III: Animus\n\n";
    if (data.animus.ethical_stance) md += `**Ethical Stance:** ${data.animus.ethical_stance}\n\n`;
  }
  if (data.actus?.recommendations?.length) {
    md += "## Section IV: Actus\n\n";
    data.actus.recommendations.forEach(r => { md += `#### ${r.id} [${r.inherited_confidence}] — ${r.probability}\n${r.text}\n\n`; });
  }
  if (data.blueprint) {
    md += "## Blueprint\n\n";
    if (data.blueprint.goal) md += `**Goal:** ${data.blueprint.goal}\n\n`;
    if (data.blueprint.steps?.length) {
      md += "### Steps\n\n";
      data.blueprint.steps.forEach(s => { md += `#### Step ${s.step}: ${s.title}\n${s.instructions}\n\n`; });
    }
  }
  return md;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { runId } = await req.json();
    if (!runId) return Response.json({ error: "Missing runId" }, { status: 400 });

    // Load the Run record (created by frontend)
    const runs = await base44.asServiceRole.entities.Run.filter({ id: runId });
    const run = runs[0];
    if (!run) return Response.json({ error: "Run not found" }, { status: 404 });

    const {
      query_text: queryText,
      execution_mode: executionMode,
      output_mode: outputMode,
      blueprint_level: blueprintLevel,
      novelty_dial: noveltyDial,
      refresh_enabled: refreshEnabled,
      attached_files: attachedFiles
    } = run;

    const mode = EXECUTION_MODES[executionMode.toUpperCase()];
    if (!mode) return Response.json({ error: "Invalid execution mode" }, { status: 400 });

    const domains = mode.domains;
    const fileUrls = (attachedFiles || []).map(f => f.file_url).filter(Boolean);
    const opts = { executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled };

    const mergedData = {};
    const intersections = {};
    const domainErrors = [];

    // Mark as running
    await base44.asServiceRole.entities.Run.update(runId, { status: "running" });

    // Execute each domain sequentially
    for (const domain of domains) {
      // Blueprint: split-call architecture
      if (domain === "blueprint") {
        const source = { ...mergedData, _intersections: intersections };
        const { data: bpData, errors: bpErrors } = await executeBlueprintSplitCall(
          base44, source, queryText, blueprintLevel, noveltyDial, outputMode, fileUrls
        );
        if (bpData) mergedData.blueprint = bpData;
        domainErrors.push(...bpErrors);

        const bpPayload = {};
        if (mergedData.blueprint) bpPayload.blueprint = mergedData.blueprint;
        if (domainErrors.length > 0) bpPayload.validation_errors = [...domainErrors];
        await base44.asServiceRole.entities.Run.update(runId, bpPayload);
        continue;
      }

      const contextForPrompt = { ...mergedData, _intersections: intersections };
      const domainPrompt = buildDomainPrompt(domain, queryText, opts, contextForPrompt);

      let domainResult;
      try {
        domainResult = await callLLM(base44, domainPrompt, domain, refreshEnabled, fileUrls);
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

      // Persist domain result incrementally
      const updatePayload = {};
      if (mergedData[domain]) updatePayload[domain] = mergedData[domain];
      if (domainErrors.length > 0) updatePayload.validation_errors = [...domainErrors];
      await base44.asServiceRole.entities.Run.update(runId, updatePayload);

      // Intersection pairs
      if (INTERSECTION_TRIGGERS[domain] && domains.includes("synthesis")) {
        const triggers = INTERSECTION_TRIGGERS[domain];
        for (const trigger of triggers) {
          const [dA, dB] = trigger.domains;
          if (!mergedData[dA] || !mergedData[dB]) continue;

          try {
            const pairPrompt = buildIntersectionPrompt(trigger.pair, trigger.model, dA, dB, mergedData[dA], mergedData[dB], queryText);
            const pairResult = await callLLM(base44, pairPrompt, "intersection", false, fileUrls);
            const pairParsed = parseLLMResponse(pairResult, trigger.pair);

            if (pairParsed.data) {
              intersections[trigger.pair] = { ...pairParsed.data, _model: trigger.model };
              const currentMatrix = {};
              Object.entries(intersections).forEach(([k, v]) => {
                const { _model, ...p } = v;
                currentMatrix[k] = p;
              });
              await base44.asServiceRole.entities.Run.update(runId, {
                synthesis: { intersection_matrix: currentMatrix }
              });
            } else if (pairParsed.error) {
              domainErrors.push(`intersection:${trigger.pair}: ${pairParsed.error}`);
            }
          } catch (e) {
            domainErrors.push(`intersection:${trigger.pair}: ${e.message}`);
          }
        }
      }
    }

    // Merge intersection matrix into synthesis
    if (Object.keys(intersections).length > 0) {
      const matrix = {};
      Object.entries(intersections).forEach(([key, val]) => {
        const { _model, ...pairData } = val;
        matrix[key] = pairData;
      });
      if (mergedData.synthesis) {
        mergedData.synthesis.intersection_matrix = matrix;
      } else {
        mergedData.synthesis = { intersection_matrix: matrix, key_takeaways: [], constraint_collisions: [], limitation_foreground: "Synthesis patterns failed — intersection matrix preserved." };
      }
    }

    // Finalize
    const renderMd = generateMarkdown(mergedData, executionMode);
    const missingDomains = domains.filter(d => !mergedData[d]);
    const completionStatus = Object.keys(mergedData).length === 0 ? "failed" : "completed";

    const finalPayload = {
      status: completionStatus,
      render_md: safeTruncate(renderMd, 60000),
      raw_json: safeTruncate(JSON.stringify(mergedData), MAX_RAW_JSON_LENGTH),
      validation_errors: [...domainErrors]
    };
    if (completionStatus === "failed") {
      finalPayload.error_message = domainErrors.join("\n");
    }

    await base44.asServiceRole.entities.Run.update(runId, finalPayload);

    return Response.json({ success: completionStatus === "completed", runId, errors: domainErrors });
  } catch (error) {
    console.error("executeJanus fatal error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});