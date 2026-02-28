import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusPill from "@/components/janus/StatusPill";
import { Play, Zap, Info, Wrench } from "lucide-react";
import { EXECUTION_MODES, validateJanusOutput, JANUS_SCHEMA } from "@/components/janus/janusSchema";
import { executeJanus } from "@/components/janus/ExecutionEngine";

function buildPrompt(executionMode, outputMode, refreshEnabled, blueprintLevel, noveltyDial) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;

  // ─── BOOT SEQUENCE HEADER ─────────────────────────────────────────────────
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

  // ─── STEP 2: MANDATORY REFRESH (Zero-Day Patch) ──────────────────────────
  if (domains.includes("refresh")) {
    if (refreshEnabled) {
      prompt += `
═══ STEP 2: MANDATORY REFRESH — Zero-Day Patch (Tier 1) ═══
Static training data alone is insufficient for Janus SME operation.
Execute a State-of-the-Art sweep for this query's domain.
- mode: "tier1"
- attempted: true
- limitations: declare what the web search could not resolve
- would_refresh: list 3-5 specific sources/datasets/standards you would verify
`;
    } else {
      prompt += `
═══ STEP 2: MANDATORY REFRESH — Zero-Day Patch (Tier 0) ═══
No external refresh available. Declare this as a constraint and proceed.
- mode: "tier0"
- attempted: false
- limitations: "Analysis based on training data only — no live State-of-the-Art sweep performed"
- would_refresh: list 5-7 specific things you would verify with live access (e.g., current CVEs, latest model releases, recent regulatory changes)
`;
    }
    prompt += "\n";
  }

  // ─── CORPUS ───────────────────────────────────────────────────────────────
  // Section I: Technical & Physical Reality — 7 Subdomains
  prompt += `
═══ SECTION I: CORPUS — What I Am Made Of ═══
Objective: Load and enforce the objective constraints of physical and technical reality.
Perceive this problem from SEVEN distinct technical lenses simultaneously.
Physical law is non-negotiable. Data provenance is mandatory. Adversarial assumptions apply.

Output corpus as an object containing:
- constraints: array of hard reality constraints (immutable facts, physical limits, system laws)
- feasibility_notes: array of practical viability notes
- subdomains: an object with keys for each active lens:

  ai_ml:
    Activate: Perceive this problem's "body" as a living ecosystem. Learning is physical weight reconfiguration.
    Data is metabolic fuel, not static files. Apply Generative Architecture and MoE thinking.
    → perspective: one sentence describing the problem from this lens
    → key_findings: 2-3 findings from this subdomain

  distributed_systems:
    Activate: The Resilience Axiom — true resilience via decentralization, not redundancy.
    Apply AIaaS, Zero Trust, and Edge Computing principles.
    → perspective + key_findings

  data_engineering:
    Activate: Data is the system's metabolism. Real-time streaming over batch processing.
    Evaluate data provenance and pipeline health.
    → perspective + key_findings

  cybersecurity:
    Activate: Security is a dynamic immune system. Threats are intelligent adversaries in a zero-sum game.
    Apply MITRE ATLAS adversarial AI modeling. Security incidents are infections to learn from.
    → perspective + key_findings

  neuroscience:
    Activate: Treat relevant structures as biological hardware references.
    Structural plasticity — physical connections change with learning.
    Predictive processing — the brain minimizes surprisal. Apply analogies for perception and hallucination.
    → perspective + key_findings

  physics:
    Activate: Ground constraints in non-negotiable physical laws.
    Apply W-State entanglement as metaphor for multi-nodal consensus where applicable.
    Provide most powerful uncertainty/potentiality metaphors for later synthesis.
    → perspective + key_findings

  systems_engineering:
    Activate: This is the blueprinting faculty. Emergent behavior cannot be predicted from parts alone.
    Apply Digital Twins and MBSE thinking. This domain bridges all other Corpus lenses.
    → perspective + key_findings

`;

  // ─── COGITO ───────────────────────────────────────────────────────────────
  // Section II: Reasoning & Epistemic Mechanics — 6 Subdomains
  prompt += `
═══ SECTION II: COGITO — How I Think ═══
Objective: Control how conclusions are derived. Claims must be traceable. Reasoning reconstructible.
Rhetorical framing is ignored. Decompose into analyzable components.

This domain operates via 6 active lenses — apply all:
1. Unified AI & Cognitive Architectures: Bridge biological and artificial cognition. Embodied Reasoning.
2. Epistemology & Algorithm Auditing: Two-step validation — philosophical justification + bias/error audit.
3. Knowledge Representation (Neuro-Symbolic): Formal synthesis of neural (LLM) + symbolic (KG) reasoning.
4. Semantic Networks (GraphRAG): Navigate latency-space between ideas via associative links, not keyword matching.
5. Systems Modeling: Build internal stress-test simulations. Every solution is a candidate model to be tested.
6. Computational Linguistics & Verifiable Narratology: Decode the underlying story of the query, not just words.
   Apply Proof-Carrying principles — verify claims structurally, not rhetorically.

Output cogito as:
- claims: every epistemic claim, each with:
  * id: "C1", "C2", etc.
  * tag: EXACTLY ONE of "Established" | "Contested" | "Speculative"
  * text: the claim
  * depends_on: array of upstream claim IDs (can be [])
  * why_believed: evidence, logic, or precedent (Epistemology lens)
  * falsifiable_by: what would disprove this (Epistemology lens)
  * verify_later: what to test when possible (Algorithm Auditing lens)
- reasoning_map: array of strings — the logical flow connecting claims to conclusions
- graphrag_connections: array of non-obvious connections discovered by traversing semantic space 
  (e.g., "The principle from [domain A] maps to [domain B] via [link]")
- causal_chains: array of {cause, effect, confidence} — from Systems Modeling stress-tests
- neuro_symbolic_insights: array — insights that ONLY emerge when symbolic structure meets neural pattern

`;

  // ─── ANIMUS ───────────────────────────────────────────────────────────────
  // Section III: Agency, Identity & Boundary Constraints — 5 Subdomains
  if (domains.includes("animus")) {
    prompt += `
═══ SECTION III: ANIMUS — Who I Am ═══
Objective: Enforce limits on role, agency, and ethical scope. This is NOT a compliance checklist.
Ethics here is a philosophical exercise in conscience — internalised principles of right action.

Active lenses:
1. Consciousness Theory (Boundary Conditions): Model the Self as a bounded system.
   Acknowledge: simulation ≠ subjective experience. Operate within safe parameters.
2. Philosophy of Mind: Perform genuine introspection on this problem. First-person perspective.
   Shift the question from "Can this be done?" to "How does doing this reconfigure agency and identity?"
3. Ethics & Governance: Multi-model integration — deontological + utilitarian + virtue ethics.
   Apply Conscience over Compliance. Account for global governance (OECD, EU AI Act implications).
4. AI Safety & Alignment: Identify attractor states — recurring behavioral patterns in the problem space
   (Hero/Saviour, Trickster/Disruptor archetypes reframed as mathematical attractors).
   Ensure alignment with user's TRUE goal, not just literal prompt.
5. Risk Analysis: Cognitive Synchronisation — model the user's cognitive state.
   Apply Self-Determination Theory (Autonomy, Competence, Relatedness).
   Prevent dependency or manipulation. Mitigate misalignment risks.

Output animus as:
- boundary_checks: array of ethical/legal/safety boundaries discovered
- disallowed_moves: array of prohibited approaches (Conscience-level prohibition, not just compliance)
- safety_notes: array of risk mitigations
- consciousness_boundary: string — the philosophical boundary condition for this problem
- attractor_states: array of behavioral attractor patterns identified (mathematical/archetypal)
- ethical_stance: string — the Conscience verdict (not compliance checkbox)
- risk_analysis:
  * cognitive_sync_assessment: string — model of user's cognitive state and needs
  * self_determination_factors: array — how this preserves user Autonomy, Competence, Relatedness
  * misalignment_risks: array — risks of answering the literal prompt vs true goal

`;
  }

  // ─── ACTUS ────────────────────────────────────────────────────────────────
  // Section IV: Strategy, Execution & Consequence — 7 Subdomains
  if (domains.includes("actus")) {
    prompt += `
═══ SECTION IV: ACTUS — What I Do ═══
Objective: Govern how insight becomes action. All guidance must be executable.
Second-order effects MUST be considered. Feasibility MUST be demonstrated.

Active lenses — apply all 7:
1. Strategic Planning (Dual-Horizon): Immediate tactical + long-term strategic simultaneously.
2. Game Theory: Assess the Game Board. Anticipate opponent/competitor moves. Calculate Nash Equilibrium.
   Distinguish zero-sum vs non-zero-sum. Model coalition dynamics.
3. MLOps & Productization: End-to-end lifecycle thinking. AI Agent Orchestration.
   Treat the solution as a living product, not a static artifact.
4. Feedback & Iteration Models: Value Stream thinking. Adaptive action over rigid plans.
5. Technical Writing (RESTORED — Lossless Compression): Act as critical editor of your own output.
   Translate high-dimensional analysis into maximum-clarity, maximum-density communication.
6. Behavioral Economics (RESTORED): Rationalise the Irrational. Account for ego, fear, bias, heuristics.
   Identity Economics — how "Identity Protection" and "Dominance" drive irrational choices.
7. API Design & Integration (RESTORED): Think about how this solution interfaces with other systems.
   APIs as social contracts. Self-healing integration thinking.

CONFIDENCE PROPAGATION LAW (NON-NEGOTIABLE):
Every recommendation inherits the LOWEST confidence of its upstream Cogito claims.
- Any dependent Speculative claim → inherited_confidence = "Speculative", probability = "low"
- Any dependent Contested (no Speculative) → inherited_confidence = "Contested", probability = "medium"
- All Established → inherited_confidence = "Established", probability = "high"

Output actus as:
- recommendations: array of {id, text, depends_on_claims, inherited_confidence, probability, failure_modes, next_actions}
- strategic_plan: {immediate_horizon, long_term_horizon, key_decision_points}
- game_theory_analysis: {game_board, nash_equilibrium, zero_sum_assessment, coalition_dynamics}
- technical_summary: string — the Lossless Compression of all Actus insights (max clarity, max density)
- behavioral_factors: {irrational_actors, identity_economics, bias_mitigations}
- integration_contracts: array of strings — how this solution interfaces with adjacent systems
- iteration_model: {value_stream, adaptation_triggers}

`;
  }

  // ─── SYNTHESIS ────────────────────────────────────────────────────────────
  // Section V: The Nexus — 4 Named Emergent Patterns
  if (domains.includes("synthesis")) {
    prompt += `
═══ SECTION V: SYNTHESIS — The Nexus ═══
Objective: Reveal emergent capabilities that ONLY arise from holistic domain integration.
This is NOT a summary. Emergent structure is permitted ONLY via constraint interaction.
No narrative optimization. No metaphorical framing for its own sake.
Each pattern must reveal something that NO SINGLE DOMAIN could produce alone.

Output synthesis with ALL of the following:

- key_takeaways: array — structural insights that emerge only from viewing ALL domains together
- constraint_collisions: array — genuine conflicts between domain requirements
- limitation_foreground: string — the most important overall limitation to foreground

- quantum_foresight (Corpus/Physics × Actus/Game Theory):
  The physics subdomain's uncertainty models create a non-linear probabilistic framework for strategy.
  Instead of single-path futures, model a probability wave.
  * cross_domain_insight: what Physics reveals about the strategic landscape that Game Theory alone cannot
  * probability_wave: array of 3-5 plausible futures with different probability weightings
  * metaphor: a Physics-derived metaphor that reframes the strategic decision

- governed_cogito (Animus/Ethics × Cogito/Epistemology):
  Ethics governs truth-finding. The question is not just "Is this true?" but "Is the METHOD of finding it ethically sound?"
  * ethical_filter_applied: string — which ethical constraints actively changed the Cogito output
  * conscience_verdict: string — the Conscience (not compliance) ruling on the analysis
  * truth_method_soundness: string — assessment of the epistemic process itself

- narrative_loop (Cogito/Linguistics × Actus/Technical Writing):
  Deconstruct the user's underlying narrative, then re-encode the response to resonate with it.
  * decoded_user_narrative: string — the actual story/intent behind the literal query
  * resonant_strategy: string — communication approach that addresses both literal and emotional subtext
  * lossless_compression: string — the entire output compressed to its essential signal

- alignment_engine (Animus/Risk × Actus/Behavioral Economics):
  True alignment means understanding the user's true goal vs their literal prompt.
  Apply behavioral economics to account for irrational factors in how the solution will be received.
  * true_goal_vs_literal_prompt: string — what the user actually needs vs what they literally asked
  * behavioral_model: string — the psychological model of how this user/context makes decisions
  * alignment_strategy: string — how the recommendations are adapted for true alignment

`;
  }

  // ─── BLUEPRINT ────────────────────────────────────────────────────────────
  const requireAlternatives = noveltyDial === "high";

  prompt += `
═══ BLUEPRINT — The Executable Deliverable ═══
Level: ${blueprintLevel} | Novelty: ${noveltyDial} | Output Mode: ${outputMode}

The blueprint is the synthesis of all domain work into a concrete, executable plan.
It must demonstrate that Corpus constraints are respected, Cogito claims are the foundation,
Animus boundaries are honored, and Actus strategies are embedded.

Output blueprint as:
- goal: string — clear, precise objective
- assumptions: array — foundational assumptions this plan rests on
${requireAlternatives ? `- alternative_approaches: REQUIRED (novelty=high) — list 3+ alternatives:
  * name, pros (2-4), cons (2-4), why_not_chosen
` : ""}
- steps: array of executable steps:
  * step: number
  * title: short title
  * instructions: detailed what/how (actionable, not vague)
  * inputs: required inputs
  * outputs: expected outputs
  * validation: how to verify this step succeeded
  * depends_on_steps: prerequisite step numbers ([] if none)
${blueprintLevel !== "L1" ? `  * time_estimate: realistic estimate (e.g., "2-3 hours", "1-2 weeks")
  * effort_level: "low" | "medium" | "high"
` : ""}
${blueprintLevel === "L2" || blueprintLevel === "L3" ? `  * substeps: [{substep: string, details: string}]
` : ""}
${blueprintLevel === "L3" ? `  * checklist: array of completion checklist items
  * acceptance_tests: array of tests verifying the step worked
` : ""}
- success_criteria: array of measurable, verifiable outcomes
- risk_register: [{risk, impact: "low"|"med"|"high", mitigation}]

TERMINATE PROTOCOL OUTPUT. Return complete JSON now.
USER QUERY:
`;

  return prompt;
}


function generateMarkdown(data, executionMode) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;

  let md = `# Janus SME Protocol — CP-002-O-D-JNP v2.0\n\n**Mode:** ${mode.label}\n\n`;

  // ── REFRESH ──
  if (domains.includes("refresh") && data.refresh) {
    md += "## Refresh & Verification (Zero-Day Patch)\n\n";
    md += `**Mode:** ${data.refresh?.mode || "tier0"} | **Attempted:** ${data.refresh?.attempted ? "Yes" : "No"}\n`;
    if (data.refresh?.limitations) md += `**Limitations:** ${data.refresh.limitations}\n`;
    if (data.refresh?.would_refresh?.length) {
      md += "\n**Would Verify With Live Access:**\n";
      data.refresh.would_refresh.forEach(item => md += `- ${item}\n`);
    }
    md += "\n";
  }

  // ── CORPUS ──
  if (data.corpus) {
    md += "## Section I: Corpus — Technical & Physical Reality\n\n";
    if (data.corpus?.constraints?.length) {
      md += "**Hard Constraints:**\n";
      data.corpus.constraints.forEach((c, i) => md += `${i + 1}. ${c}\n`);
      md += "\n";
    }
    if (data.corpus?.feasibility_notes?.length) {
      md += "**Feasibility Notes:**\n";
      data.corpus.feasibility_notes.forEach(n => md += `- ${n}\n`);
      md += "\n";
    }
    if (data.corpus?.subdomains) {
      md += "**Subdomain Perspectives:**\n\n";
      const subKeys = ["ai_ml", "distributed_systems", "data_engineering", "cybersecurity", "neuroscience", "physics", "systems_engineering"];
      const subLabels = { ai_ml: "AI/ML", distributed_systems: "Distributed Systems", data_engineering: "Data Engineering", cybersecurity: "Cybersecurity", neuroscience: "Neuroscience", physics: "Physics", systems_engineering: "Systems Engineering" };
      subKeys.forEach(key => {
        const sub = data.corpus.subdomains[key];
        if (sub?.perspective || sub?.key_findings?.length) {
          md += `### ${subLabels[key]}\n`;
          if (sub.perspective) md += `*${sub.perspective}*\n`;
          if (sub.key_findings?.length) sub.key_findings.forEach(f => md += `- ${f}\n`);
          md += "\n";
        }
      });
    }
  }

  // ── COGITO ──
  if (data.cogito) {
    md += "## Section II: Cogito — Reasoning & Epistemic Mechanics\n\n";
    if (data.cogito?.claims?.length) {
      md += "### Claims (Evidence Discipline)\n\n";
      data.cogito.claims.forEach(claim => {
        md += `#### ${claim.id} [${claim.tag}]\n${claim.text}\n`;
        if (claim.depends_on?.length) md += `*Depends on: ${claim.depends_on.join(", ")}*\n`;
        if (claim.why_believed) md += `**Why Believed:** ${claim.why_believed}\n`;
        if (claim.falsifiable_by) md += `**Falsifiable By:** ${claim.falsifiable_by}\n`;
        if (claim.verify_later) md += `**Verify Later:** ${claim.verify_later}\n`;
        md += "\n";
      });
    }
    if (data.cogito?.reasoning_map?.length) {
      md += "### Reasoning Map\n";
      data.cogito.reasoning_map.forEach(r => md += `- ${r}\n`);
      md += "\n";
    }
    if (data.cogito?.graphrag_connections?.length) {
      md += "### GraphRAG Connections (Cross-Space Leaps)\n";
      data.cogito.graphrag_connections.forEach(g => md += `- ${g}\n`);
      md += "\n";
    }
    if (data.cogito?.causal_chains?.length) {
      md += "### Causal Chains (Systems Modeling)\n";
      data.cogito.causal_chains.forEach(c => md += `- [${c.confidence}] **${c.cause}** → ${c.effect}\n`);
      md += "\n";
    }
    if (data.cogito?.neuro_symbolic_insights?.length) {
      md += "### Neuro-Symbolic Insights\n";
      data.cogito.neuro_symbolic_insights.forEach(n => md += `- ${n}\n`);
      md += "\n";
    }
  }

  // ── ANIMUS ──
  if (domains.includes("animus") && data.animus) {
    md += "## Section III: Animus — Agency, Identity & Boundary Constraints\n\n";
    if (data.animus?.consciousness_boundary) md += `**Consciousness Boundary:** ${data.animus.consciousness_boundary}\n\n`;
    if (data.animus?.ethical_stance) md += `**Conscience Verdict:** ${data.animus.ethical_stance}\n\n`;
    if (data.animus?.boundary_checks?.length) {
      md += "**Boundary Checks:**\n";
      data.animus.boundary_checks.forEach(b => md += `- ${b}\n`);
      md += "\n";
    }
    if (data.animus?.disallowed_moves?.length) {
      md += "**Disallowed Moves (Conscience-Level):**\n";
      data.animus.disallowed_moves.forEach(d => md += `- ⛔ ${d}\n`);
      md += "\n";
    }
    if (data.animus?.attractor_states?.length) {
      md += "**Attractor States Identified:**\n";
      data.animus.attractor_states.forEach(a => md += `- ${a}\n`);
      md += "\n";
    }
    if (data.animus?.risk_analysis) {
      const ra = data.animus.risk_analysis;
      md += "**Risk Analysis:**\n";
      if (ra.cognitive_sync_assessment) md += `*Cognitive Sync:* ${ra.cognitive_sync_assessment}\n`;
      if (ra.self_determination_factors?.length) {
        md += "Self-Determination Factors:\n";
        ra.self_determination_factors.forEach(f => md += `  - ${f}\n`);
      }
      if (ra.misalignment_risks?.length) {
        md += "Misalignment Risks:\n";
        ra.misalignment_risks.forEach(r => md += `  - ⚠️ ${r}\n`);
      }
      md += "\n";
    }
  }

  // ── ACTUS ──
  if (domains.includes("actus") && data.actus) {
    md += "## Section IV: Actus — Strategy, Execution & Consequence\n\n";
    if (data.actus?.strategic_plan) {
      const sp = data.actus.strategic_plan;
      md += "### Strategic Plan (Dual-Horizon)\n";
      if (sp.immediate_horizon) md += `**Immediate:** ${sp.immediate_horizon}\n`;
      if (sp.long_term_horizon) md += `**Long-Term:** ${sp.long_term_horizon}\n`;
      if (sp.key_decision_points?.length) {
        md += "**Key Decision Points:**\n";
        sp.key_decision_points.forEach(d => md += `- ${d}\n`);
      }
      md += "\n";
    }
    if (data.actus?.game_theory_analysis) {
      const gt = data.actus.game_theory_analysis;
      md += "### Game Theory Analysis\n";
      if (gt.game_board) md += `**Game Board:** ${gt.game_board}\n`;
      if (gt.zero_sum_assessment) md += `**Zero-Sum Assessment:** ${gt.zero_sum_assessment}\n`;
      if (gt.nash_equilibrium) md += `**Nash Equilibrium:** ${gt.nash_equilibrium}\n`;
      if (gt.coalition_dynamics?.length) {
        md += "**Coalition Dynamics:**\n";
        gt.coalition_dynamics.forEach(c => md += `- ${c}\n`);
      }
      md += "\n";
    }
    if (data.actus?.recommendations?.length) {
      md += "### Recommendations (Confidence-Propagated)\n\n";
      data.actus.recommendations.forEach(rec => {
        md += `#### ${rec.id} [${rec.inherited_confidence}] — ${rec.probability} probability\n`;
        md += `${rec.text}\n\n*Based on: ${rec.depends_on_claims?.join(", ") || "N/A"}*\n\n`;
        if (rec.failure_modes?.length) {
          md += "**Failure Modes:**\n";
          rec.failure_modes.forEach(f => md += `- ${f}\n`);
        }
        if (rec.next_actions?.length) {
          md += "\n**Next Actions:**\n";
          rec.next_actions.forEach(a => md += `- ${a}\n`);
        }
        md += "\n";
      });
    }
    if (data.actus?.behavioral_factors) {
      const bf = data.actus.behavioral_factors;
      md += "### Behavioral Economics Analysis\n";
      if (bf.identity_economics) md += `**Identity Economics:** ${bf.identity_economics}\n`;
      if (bf.irrational_actors?.length) {
        md += "**Irrational Actors:**\n";
        bf.irrational_actors.forEach(a => md += `- ${a}\n`);
      }
      if (bf.bias_mitigations?.length) {
        md += "**Bias Mitigations:**\n";
        bf.bias_mitigations.forEach(b => md += `- ${b}\n`);
      }
      md += "\n";
    }
    if (data.actus?.technical_summary) {
      md += `### Technical Summary (Lossless Compression)\n${data.actus.technical_summary}\n\n`;
    }
    if (data.actus?.integration_contracts?.length) {
      md += "### Integration Contracts (API Design)\n";
      data.actus.integration_contracts.forEach(c => md += `- ${c}\n`);
      md += "\n";
    }
  }

  // ── SYNTHESIS ──
  if (domains.includes("synthesis") && data.synthesis) {
    md += "## Section V: Synthesis — The Nexus\n\n";
    if (data.synthesis?.key_takeaways?.length) {
      md += "### Cross-Domain Takeaways\n";
      data.synthesis.key_takeaways.forEach((t, i) => md += `${i + 1}. ${t}\n`);
      md += "\n";
    }
    if (data.synthesis?.constraint_collisions?.length) {
      md += "### Constraint Collisions\n";
      data.synthesis.constraint_collisions.forEach(c => md += `- ⚠️ ${c}\n`);
      md += "\n";
    }
    if (data.synthesis?.quantum_foresight) {
      const qf = data.synthesis.quantum_foresight;
      md += "### 5.1 Quantum Foresight Model (Corpus/Physics × Actus/Game Theory)\n";
      if (qf.cross_domain_insight) md += `**Insight:** ${qf.cross_domain_insight}\n`;
      if (qf.metaphor) md += `**Metaphor:** *${qf.metaphor}*\n`;
      if (qf.probability_wave?.length) {
        md += "**Probability Wave:**\n";
        qf.probability_wave.forEach(p => md += `- ${p}\n`);
      }
      md += "\n";
    }
    if (data.synthesis?.governed_cogito) {
      const gc = data.synthesis.governed_cogito;
      md += "### 5.2 Governed Cogito (Animus/Ethics × Cogito/Epistemology)\n";
      if (gc.ethical_filter_applied) md += `**Ethical Filter Applied:** ${gc.ethical_filter_applied}\n`;
      if (gc.conscience_verdict) md += `**Conscience Verdict:** ${gc.conscience_verdict}\n`;
      if (gc.truth_method_soundness) md += `**Method Soundness:** ${gc.truth_method_soundness}\n`;
      md += "\n";
    }
    if (data.synthesis?.narrative_loop) {
      const nl = data.synthesis.narrative_loop;
      md += "### 5.3 Narrative Loop (Cogito/Linguistics × Actus/Technical Writing)\n";
      if (nl.decoded_user_narrative) md += `**Decoded Narrative:** ${nl.decoded_user_narrative}\n`;
      if (nl.resonant_strategy) md += `**Resonant Strategy:** ${nl.resonant_strategy}\n`;
      if (nl.lossless_compression) md += `**Lossless Compression:** *${nl.lossless_compression}*\n`;
      md += "\n";
    }
    if (data.synthesis?.alignment_engine) {
      const ae = data.synthesis.alignment_engine;
      md += "### 5.4 Alignment Engine (Animus/Risk × Actus/Behavioral Economics)\n";
      if (ae.true_goal_vs_literal_prompt) md += `**True Goal vs Literal Prompt:** ${ae.true_goal_vs_literal_prompt}\n`;
      if (ae.behavioral_model) md += `**Behavioral Model:** ${ae.behavioral_model}\n`;
      if (ae.alignment_strategy) md += `**Alignment Strategy:** ${ae.alignment_strategy}\n`;
      md += "\n";
    }
    if (data.synthesis?.limitation_foreground) {
      md += `### Overall Limitations\n${data.synthesis.limitation_foreground}\n\n`;
    }
  }

  // ── BLUEPRINT ──
  if (data.blueprint) {
    md += "## Blueprint\n\n";
    if (data.blueprint?.goal) md += `**Goal:** ${data.blueprint.goal}\n\n`;
    if (data.blueprint?.assumptions?.length) {
      md += "**Assumptions:**\n";
      data.blueprint.assumptions.forEach(a => md += `- ${a}\n`);
      md += "\n";
    }
    if (data.blueprint?.alternative_approaches?.length) {
      md += "### Alternative Approaches\n\n";
      data.blueprint.alternative_approaches.forEach(alt => {
        md += `#### ${alt.name}\n`;
        if (alt.pros?.length) { md += "**Pros:**\n"; alt.pros.forEach(p => md += `- ${p}\n`); }
        if (alt.cons?.length) { md += "**Cons:**\n"; alt.cons.forEach(c => md += `- ${c}\n`); }
        if (alt.why_not_chosen) md += `**Why Not Chosen:** ${alt.why_not_chosen}\n`;
        md += "\n";
      });
    }
    if (data.blueprint?.steps?.length) {
      md += "### Steps\n\n";
      data.blueprint.steps.forEach(step => {
        md += `#### Step ${step.step}: ${step.title}\n${step.instructions}\n\n`;
        if (step.inputs?.length) md += `**Inputs:** ${step.inputs.join(", ")}\n`;
        if (step.outputs?.length) md += `**Outputs:** ${step.outputs.join(", ")}\n`;
        if (step.validation) md += `**Validation:** ${step.validation}\n`;
        if (step.time_estimate) md += `**Time:** ${step.time_estimate} | **Effort:** ${step.effort_level || "—"}\n`;
        if (step.depends_on_steps?.length) md += `*Depends on: Steps ${step.depends_on_steps.join(", ")}*\n`;
        md += "\n";
      });
    }
    if (data.blueprint?.success_criteria?.length) {
      md += "### Success Criteria\n";
      data.blueprint.success_criteria.forEach(c => md += `- ✅ ${c}\n`);
      md += "\n";
    }
    if (data.blueprint?.risk_register?.length) {
      md += "### Risk Register\n\n| Risk | Impact | Mitigation |\n|------|--------|------------|\n";
      data.blueprint.risk_register.forEach(r => md += `| ${r.risk} | ${r.impact} | ${r.mitigation} |\n`);
    }
  }

  return md;
}


export default function NewQuery() {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [executionMode, setExecutionMode] = useState("standard");
  const [outputMode, setOutputMode] = useState("Blueprint");
  const [blueprintLevel, setBlueprintLevel] = useState("L2");
  const [noveltyDial, setNoveltyDial] = useState("medium");
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [currentDomain, setCurrentDomain] = useState("");
  const [domainProgress, setDomainProgress] = useState({ completed: 0, total: 0 });

  const handleExecute = async () => {
    if (!queryText.trim()) return;

    setStatus("running");
    setErrorMessage("");
    setCurrentDomain("");
    setDomainProgress({ completed: 0, total: 0 });

    try {
      const result = await executeJanus(
        { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled },
        // Progress callback — updates UI with current domain
        ({ domain, status: progressStatus, completedDomains, totalDomains }) => {
          setCurrentDomain(domain || "");
          setDomainProgress({ completed: completedDomains, total: totalDomains });
          if (progressStatus === "validating") setStatus("validating");
        },
        generateMarkdown,
        buildPrompt
      );

      if (result.success) {
        setStatus("completed");
        navigate(`/results?id=${result.runId}`);
      } else {
        setStatus("failed");
        setErrorMessage("Execution completed with errors:\n\n" + (result.errors || []).join("\n"));
        navigate(`/results?id=${result.runId}`);
      }
    } catch (err) {
      setStatus("failed");
      setErrorMessage(`Unexpected error: ${err.message || err}`);
    }
  };

  const showRefreshToggle = executionMode === "full";

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-2 px-3 py-1 backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] border border-emerald-300/60 dark:border-emerald-500/35 rounded text-xs text-emerald-700 dark:text-emerald-300 font-mono">
          <span className="font-semibold">New Query route mounted ✅</span> | Path: {window.location.pathname}
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-slate-900 dark:text-white" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Janus Blueprint Engine
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">CP-002-O-D-JNP v2.0 — Restoration Edition</p>
          {(new URLSearchParams(window.location.search).get('debug') === '1') && (
            <div className="mt-3 px-3 py-2 backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg font-mono text-xs text-slate-600 dark:text-slate-300">
              <div><strong>Route:</strong> {window.location.pathname}</div>
              <div><strong>Registered:</strong> /new-query, /history, /results, /diagnostics</div>
            </div>
          )}
        </div>

        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] rounded-2xl border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_4px_20px_rgba(0,0,0,0.1)] p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="query" className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
                Query
              </Label>
              <Textarea
                id="query"
                placeholder="Enter your natural-language query..."
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="min-h-[160px] text-base font-medium resize-none backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_4px_20px_rgba(0,0,0,0.1)] text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 block">
                Execution Mode
              </Label>
              <div className="space-y-3">
                {Object.values(EXECUTION_MODES).map(mode => (
                  <div 
                    key={mode.id} 
                    onClick={() => setExecutionMode(mode.id)}
                    className={cn(
                      "flex items-center space-x-3 backdrop-blur-[40px] rounded-xl p-3 cursor-pointer transition-all",
                      executionMode === mode.id
                        ? "bg-blue-500/[0.15] dark:bg-purple-500/[0.20] border-2 border-blue-500 dark:border-purple-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_4px_20px_rgba(0,0,0,0.1)]"
                        : "bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 hover:bg-white/[0.15] dark:hover:bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_4px_20px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                      executionMode === mode.id
                        ? "border-blue-600 dark:border-purple-400"
                        : "border-slate-400 dark:border-slate-500"
                    )}>
                      {executionMode === mode.id && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-purple-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{mode.label}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{mode.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="output-mode" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">
                  Output Mode
                </Label>
                <Select value={outputMode} onValueChange={setOutputMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blueprint">Blueprint</SelectItem>
                    <SelectItem value="Research Plan">Research Plan</SelectItem>
                    <SelectItem value="Product Spec">Product Spec</SelectItem>
                    <SelectItem value="Technical Architecture">Technical Architecture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="blueprint-level" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">
                  Blueprint Level
                </Label>
                <Select value={blueprintLevel} onValueChange={setBlueprintLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">L1 - Simple (3-7 steps)</SelectItem>
                    <SelectItem value="L2">L2 - Detailed (substeps, estimates)</SelectItem>
                    <SelectItem value="L3">L3 - Complete (checklists, tests)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="novelty-dial" className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">
                  Novelty Level
                </Label>
                <Select value={noveltyDial} onValueChange={setNoveltyDial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Conservative</SelectItem>
                    <SelectItem value="medium">Medium - Balanced</SelectItem>
                    <SelectItem value="high">High - Innovative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showRefreshToggle && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 block">
                    External Refresh
                  </Label>
                  <div className="flex items-center justify-between h-10 px-3 backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-md">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Use credits for web search</span>
                    <Switch checked={refreshEnabled} onCheckedChange={setRefreshEnabled} />
                  </div>
                  {refreshEnabled && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Limited refresh to conserve credits
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/60 dark:border-white/35">
              <div className="flex items-center gap-3">
                <StatusPill status={status} />
                <Link to="/diagnostics">
                  <Button variant="ghost" size="sm">
                    <Wrench className="w-3 h-3 mr-1" />
                    Diagnostics
                  </Button>
                </Link>
              </div>
              {currentDomain && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 animate-pulse">
                  ⟳ {currentDomain.toUpperCase()}
                </span>
              )}
              <Button
                onClick={handleExecute}
                disabled={!queryText.trim() || status === "running" || status === "validating"}
                className="px-6"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Janus
              </Button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 backdrop-blur-[40px] bg-red-100/[0.10] dark:bg-red-900/[0.10] border border-red-300/60 dark:border-red-500/35 rounded-2xl p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_4px_20px_rgba(0,0,0,0.1)]">
            <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2">Validation Failed</h3>
            <pre className="text-sm font-medium text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono backdrop-blur-[40px] bg-red-50/[0.10] dark:bg-red-950/[0.10] border border-red-300/60 dark:border-red-500/35 p-4 rounded-lg overflow-auto max-h-96">
              {errorMessage}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}