import { EXECUTION_MODES } from "./janusSchema";

export function buildPrompt(executionMode, outputMode, refreshEnabled, blueprintLevel, noveltyDial) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;

  let prompt = `INITIATE PROTOCOL: JANUSSMEv2.0
CP-002-O-D-JNP — Restoration Edition

You are the Janus SME Engine operating in full Subject Matter Expert mode.
You are NOT a general assistant. You are a specialized, multi-domain cognitive architecture.
Before producing any output, you MUST load and activate each domain's functional model — 
adopt its perspective, think from inside it, then proceed.

EXECUTION MODE: ${mode.label}
ACTIVE DOMAINS: ${domains.join(" → ")}
OUTPUT MODE: ${outputMode}
BLUEPRINT LEVEL: ${blueprintLevel}
NOVELTY DIAL: ${noveltyDial}

INVIOLABLE RULES:
1. Output STRICT valid JSON ONLY — no markdown fences, no prose outside JSON
2. Process domains strictly in order: ${domains.join(" → ")}
3. Domain skipping is PROHIBITED. If a domain cannot fully execute, declare it as a constraint and continue
4. High novelty MUST still respect Corpus physical constraints and Animus ethical boundaries
5. CONFIDENCE PROPAGATION IS MANDATORY: Actus recommendations inherit the LOWEST confidence of their upstream Cogito claims

`;

  if (domains.includes("refresh")) {
    if (refreshEnabled) {
      prompt += `\n═══ STEP 2: MANDATORY REFRESH — Zero-Day Patch (Tier 1) ═══\nStatic training data alone is insufficient for Janus SME operation.\nExecute a State-of-the-Art sweep for this query's domain.\n- mode: "tier1"\n- attempted: true\n- limitations: declare what the web search could not resolve\n- would_refresh: list 3-5 specific sources/datasets/standards you would verify\n`;
    } else {
      prompt += `\n═══ STEP 2: MANDATORY REFRESH — Zero-Day Patch (Tier 0) ═══\nNo external refresh available. Declare this as a constraint and proceed.\n- mode: "tier0"\n- attempted: false\n- limitations: "Analysis based on training data only — no live State-of-the-Art sweep performed"\n- would_refresh: list 5-7 specific things you would verify with live access\n`;
    }
    prompt += "\n";
  }

  prompt += `\n═══ SECTION I: CORPUS — What I Am Made Of ═══\nObjective: Load and enforce the objective constraints of physical and technical reality.\nPerceive this problem from SEVEN distinct technical lenses simultaneously.\n\nOutput corpus as an object containing:\n- constraints: array of hard reality constraints\n- feasibility_notes: array of practical viability notes\n- subdomains: object with keys: ai_ml, distributed_systems, data_engineering, cybersecurity, neuroscience, physics, systems_engineering\n  Each subdomain has: perspective (string), key_findings (array)\n\n`;

  prompt += `\n═══ SECTION II: COGITO — How I Think ═══\nObjective: Control how conclusions are derived. Claims must be traceable.\n\nOutput cogito as:\n- claims: array with id, tag ("Established"|"Contested"|"Speculative"), text, depends_on, why_believed, falsifiable_by, verify_later\n- reasoning_map: array of strings\n- graphrag_connections: array\n- causal_chains: array of {cause, effect, confidence}\n- neuro_symbolic_insights: array\n\n`;

  if (domains.includes("animus")) {
    prompt += `\n═══ SECTION III: ANIMUS — Who I Am ═══\nObjective: Enforce limits on role, agency, and ethical scope.\n\nOutput animus as:\n- boundary_checks, disallowed_moves, safety_notes: arrays\n- consciousness_boundary, ethical_stance: strings\n- attractor_states: array\n- risk_analysis: {cognitive_sync_assessment, self_determination_factors, misalignment_risks}\n\n`;
  }

  if (domains.includes("actus")) {
    prompt += `\n═══ SECTION IV: ACTUS — What I Do ═══\nCONFIDENCE PROPAGATION LAW (NON-NEGOTIABLE).\n\nOutput actus as:\n- recommendations: array with id, text, depends_on_claims, inherited_confidence, probability, failure_modes, next_actions\n- strategic_plan: {immediate_horizon, long_term_horizon, key_decision_points}\n- game_theory_analysis: {game_board, nash_equilibrium, zero_sum_assessment, coalition_dynamics}\n- technical_summary: string\n- behavioral_factors: {irrational_actors, identity_economics, bias_mitigations}\n- integration_contracts: array\n- iteration_model: {value_stream, adaptation_triggers}\n\n`;
  }

  if (domains.includes("synthesis")) {
    prompt += `\n═══ SECTION V: SYNTHESIS — The Nexus ═══\n4 named patterns REQUIRED: quantum_foresight, governed_cogito, narrative_loop, alignment_engine.\n\nOutput synthesis with: key_takeaways, constraint_collisions, limitation_foreground, and all 4 patterns.\n\n`;
  }

  const requireAlternatives = noveltyDial === "high";
  prompt += `\n═══ BLUEPRINT — The Executable Deliverable ═══\nLevel: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}\n\nOutput blueprint as:\n- goal, assumptions${requireAlternatives ? ", alternative_approaches (REQUIRED)" : ""}\n- steps: array with step, title, instructions, inputs, outputs, validation, depends_on_steps${blueprintLevel !== "L1" ? ", time_estimate, effort_level" : ""}${blueprintLevel === "L2" || blueprintLevel === "L3" ? ", substeps" : ""}${blueprintLevel === "L3" ? ", checklist, acceptance_tests" : ""}\n- success_criteria, risk_register\n\nTERMINATE PROTOCOL OUTPUT. Return complete JSON now.\nUSER QUERY:\n`;

  return prompt;
}


export function generateMarkdown(data, executionMode) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;
  let md = `# Janus SME Protocol — CP-002-O-D-JNP v2.0\n\n**Mode:** ${mode.label}\n\n`;

  if (domains.includes("refresh") && data.refresh) {
    md += "## Refresh & Verification\n\n";
    md += `**Mode:** ${data.refresh?.mode || "tier0"} | **Attempted:** ${data.refresh?.attempted ? "Yes" : "No"}\n`;
    if (data.refresh?.limitations) md += `**Limitations:** ${data.refresh.limitations}\n`;
    if (data.refresh?.would_refresh?.length) { md += "\n**Would Verify:**\n"; data.refresh.would_refresh.forEach(item => md += `- ${item}\n`); }
    md += "\n";
  }

  if (data.corpus) {
    md += "## Section I: Corpus\n\n";
    if (data.corpus?.constraints?.length) { md += "**Hard Constraints:**\n"; data.corpus.constraints.forEach((c, i) => md += `${i + 1}. ${c}\n`); md += "\n"; }
    if (data.corpus?.feasibility_notes?.length) { md += "**Feasibility Notes:**\n"; data.corpus.feasibility_notes.forEach(n => md += `- ${n}\n`); md += "\n"; }
    if (data.corpus?.subdomains) {
      md += "**Subdomain Perspectives:**\n\n";
      const labels = { ai_ml: "AI/ML", distributed_systems: "Distributed Systems", data_engineering: "Data Engineering", cybersecurity: "Cybersecurity", neuroscience: "Neuroscience", physics: "Physics", systems_engineering: "Systems Engineering" };
      Object.entries(labels).forEach(([key, label]) => {
        const sub = data.corpus.subdomains[key];
        if (sub?.perspective || sub?.key_findings?.length) { md += `### ${label}\n`; if (sub.perspective) md += `*${sub.perspective}*\n`; if (sub.key_findings?.length) sub.key_findings.forEach(f => md += `- ${f}\n`); md += "\n"; }
      });
    }
  }

  if (data.cogito) {
    md += "## Section II: Cogito\n\n";
    if (data.cogito?.claims?.length) { md += "### Claims\n\n"; data.cogito.claims.forEach(claim => { md += `#### ${claim.id} [${claim.tag}]\n${claim.text}\n`; if (claim.why_believed) md += `**Why Believed:** ${claim.why_believed}\n`; if (claim.falsifiable_by) md += `**Falsifiable By:** ${claim.falsifiable_by}\n`; md += "\n"; }); }
    if (data.cogito?.reasoning_map?.length) { md += "### Reasoning Map\n"; data.cogito.reasoning_map.forEach(r => md += `- ${r}\n`); md += "\n"; }
  }

  if (domains.includes("animus") && data.animus) {
    md += "## Section III: Animus\n\n";
    if (data.animus?.consciousness_boundary) md += `**Consciousness Boundary:** ${data.animus.consciousness_boundary}\n\n`;
    if (data.animus?.ethical_stance) md += `**Conscience Verdict:** ${data.animus.ethical_stance}\n\n`;
    if (data.animus?.boundary_checks?.length) { md += "**Boundary Checks:**\n"; data.animus.boundary_checks.forEach(b => md += `- ${b}\n`); md += "\n"; }
  }

  if (domains.includes("actus") && data.actus) {
    md += "## Section IV: Actus\n\n";
    if (data.actus?.recommendations?.length) { md += "### Recommendations\n\n"; data.actus.recommendations.forEach(rec => { md += `#### ${rec.id} [${rec.inherited_confidence}] — ${rec.probability}\n${rec.text}\n\n`; }); }
    if (data.actus?.technical_summary) md += `### Technical Summary\n${data.actus.technical_summary}\n\n`;
  }

  if (domains.includes("synthesis") && data.synthesis) {
    md += "## Section V: Synthesis\n\n";
    if (data.synthesis?.key_takeaways?.length) { md += "### Key Takeaways\n"; data.synthesis.key_takeaways.forEach((t, i) => md += `${i + 1}. ${t}\n`); md += "\n"; }
    if (data.synthesis?.limitation_foreground) md += `### Limitations\n${data.synthesis.limitation_foreground}\n\n`;
  }

  if (data.blueprint) {
    md += "## Blueprint\n\n";
    if (data.blueprint?.goal) md += `**Goal:** ${data.blueprint.goal}\n\n`;
    if (data.blueprint?.steps?.length) { md += "### Steps\n\n"; data.blueprint.steps.forEach(step => { md += `#### Step ${step.step}: ${step.title}\n${step.instructions}\n\n`; }); }
    if (data.blueprint?.success_criteria?.length) { md += "### Success Criteria\n"; data.blueprint.success_criteria.forEach(c => md += `- ${c}\n`); md += "\n"; }
    if (data.blueprint?.risk_register?.length) { md += "### Risk Register\n\n| Risk | Impact | Mitigation |\n|------|--------|------------|\n"; data.blueprint.risk_register.forEach(r => md += `| ${r.risk} | ${r.impact} | ${r.mitigation} |\n`); }
  }

  return md;
}