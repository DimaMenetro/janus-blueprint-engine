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

  let md = `# Janus Blueprint Engine Output\n\n**Mode:** ${mode.label}\n\n`;

  if (domains.includes("refresh") && data.refresh) {
    md += "## 1. Refresh & Verification\n\n";
    md += `**Mode:** ${data.refresh?.mode || "tier0"}\n`;
    md += `**Attempted:** ${data.refresh?.attempted ? "Yes" : "No"}\n`;
    md += `**Limitations:** ${data.refresh?.limitations || "N/A"}\n\n`;
    if (data.refresh?.would_refresh?.length) {
      md += "**Would Verify:**\n";
      data.refresh.would_refresh.forEach(item => md += `- ${item}\n`);
    }
    md += "\n";
  }

  if (data.corpus) {
    md += "## Corpus\n\n";
    if (data.corpus?.constraints?.length) {
      md += "**Constraints:**\n";
      data.corpus.constraints.forEach((c, i) => md += `${i + 1}. ${c}\n`);
    }
    if (data.corpus?.feasibility_notes?.length) {
      md += "\n**Feasibility Notes:**\n";
      data.corpus.feasibility_notes.forEach(n => md += `- ${n}\n`);
    }
    md += "\n";
  }

  if (data.cogito) {
    md += "## Cogito\n\n";
    if (data.cogito?.claims?.length) {
      md += "**Claims:**\n\n";
      data.cogito.claims.forEach(claim => {
        md += `### ${claim.id} [${claim.tag}]\n`;
        md += `${claim.text}\n`;
        if (claim.depends_on?.length) {
          md += `*Depends on: ${claim.depends_on.join(", ")}*\n`;
        }
        md += "\n";
      });
    }
    if (data.cogito?.reasoning_map?.length) {
      md += "**Reasoning Map:**\n";
      data.cogito.reasoning_map.forEach(r => md += `- ${r}\n`);
    }
    md += "\n";
  }

  if (domains.includes("animus") && data.animus) {
    md += "## Animus\n\n";
    if (data.animus?.boundary_checks?.length) {
      md += "**Boundary Checks:**\n";
      data.animus.boundary_checks.forEach(b => md += `- ${b}\n`);
    }
    if (data.animus?.disallowed_moves?.length) {
      md += "\n**Disallowed Moves:**\n";
      data.animus.disallowed_moves.forEach(d => md += `- ⛔ ${d}\n`);
    }
    if (data.animus?.safety_notes?.length) {
      md += "\n**Safety Notes:**\n";
      data.animus.safety_notes.forEach(s => md += `- ⚠️ ${s}\n`);
    }
    md += "\n";
  }

  if (domains.includes("actus") && data.actus) {
    md += "## Actus\n\n";
    if (data.actus?.recommendations?.length) {
      md += "**Recommendations:**\n\n";
      data.actus.recommendations.forEach(rec => {
        md += `### ${rec.id} [${rec.inherited_confidence}] - ${rec.probability} probability\n`;
        md += `${rec.text}\n\n`;
        md += `*Based on: ${rec.depends_on_claims?.join(", ") || "N/A"}*\n\n`;
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
  }

  if (domains.includes("synthesis") && data.synthesis) {
    md += "## Cross-Domain Synthesis\n\n";
    if (data.synthesis?.key_takeaways?.length) {
      md += "**Key Takeaways:**\n";
      data.synthesis.key_takeaways.forEach((t, i) => md += `${i + 1}. ${t}\n`);
    }
    if (data.synthesis?.constraint_collisions?.length) {
      md += "\n**Constraint Collisions:**\n";
      data.synthesis.constraint_collisions.forEach(c => md += `- ⚠️ ${c}\n`);
    }
    if (data.synthesis?.limitation_foreground) {
      md += `\n**Limitations:** ${data.synthesis.limitation_foreground}\n`;
    }
    md += "\n";
  }

  if (data.blueprint) {
    md += "## Blueprint\n\n";
    if (data.blueprint?.goal) {
      md += `**Goal:** ${data.blueprint.goal}\n\n`;
    }
    if (data.blueprint?.assumptions?.length) {
      md += "**Assumptions:**\n";
      data.blueprint.assumptions.forEach(a => md += `- ${a}\n`);
      md += "\n";
    }
    if (data.blueprint?.steps?.length) {
      md += "### Steps\n\n";
      data.blueprint.steps.forEach(step => {
        md += `#### Step ${step.step}: ${step.title}\n`;
        md += `${step.instructions}\n\n`;
        if (step.inputs?.length) md += `**Inputs:** ${step.inputs.join(", ")}\n`;
        if (step.outputs?.length) md += `**Outputs:** ${step.outputs.join(", ")}\n`;
        if (step.validation) md += `**Validation:** ${step.validation}\n`;
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
      md += "### Risk Register\n\n";
      md += "| Risk | Impact | Mitigation |\n";
      md += "|------|--------|------------|\n";
      data.blueprint.risk_register.forEach(r => {
        md += `| ${r.risk} | ${r.impact} | ${r.mitigation} |\n`;
      });
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

  const handleExecute = async () => {
    if (!queryText.trim()) return;

    setStatus("running");
    setErrorMessage("");

    const mode = EXECUTION_MODES[executionMode.toUpperCase()];
    const fullPrompt = buildPrompt(executionMode, outputMode, refreshEnabled, blueprintLevel, noveltyDial) + queryText;

    let result;
    try {
      // Build detailed schema with proper structure for each domain
      const responseSchema = {
        type: "object",
        properties: Object.fromEntries(
          mode.domains.map(d => [d, JANUS_SCHEMA.properties[d]])
        ),
        required: mode.domains
      };

      result = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: refreshEnabled && mode.domains.includes("refresh"),
        response_json_schema: responseSchema
      });
    } catch (err) {
      await base44.entities.Run.create({
        query_text: queryText,
        full_prompt: fullPrompt,
        execution_mode: executionMode,
        output_mode: outputMode,
        blueprint_level: blueprintLevel,
        novelty_dial: noveltyDial,
        refresh_enabled: refreshEnabled,
        status: "failed",
        error_message: `LLM call failed: ${err.message || err}`,
        raw_json: JSON.stringify(err)
      });
      setStatus("failed");
      setErrorMessage(`LLM ERROR: ${err.message || err}`);
      return;
    }

    setStatus("validating");

    let parsedData;
    let rawJsonString;

    if (typeof result === "string") {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        parsedData = JSON.parse(jsonMatch[0]);
        rawJsonString = jsonMatch[0];
      } catch (e) {
        await base44.entities.Run.create({
          query_text: queryText,
          full_prompt: fullPrompt,
          execution_mode: executionMode,
          output_mode: outputMode,
          blueprint_level: blueprintLevel,
          novelty_dial: noveltyDial,
          refresh_enabled: refreshEnabled,
          status: "failed",
          error_message: "Failed to parse JSON from LLM response",
          raw_json: result
        });
        setStatus("failed");
        setErrorMessage("PARSE ERROR: Could not extract valid JSON.\n\n" + result);
        return;
      }
    } else {
      parsedData = result;
      rawJsonString = JSON.stringify(result, null, 2);
    }

    // Validate against schema (also normalizes data)
    const validation = validateJanusOutput(parsedData, mode.domains);

    if (!validation.valid) {
      const run = await base44.entities.Run.create({
        query_text: queryText,
        full_prompt: fullPrompt,
        execution_mode: executionMode,
        output_mode: outputMode,
        blueprint_level: blueprintLevel,
        novelty_dial: noveltyDial,
        refresh_enabled: refreshEnabled,
        status: "failed",
        validation_errors: validation.errors,
        error_message: validation.errors.join("\n"),
        raw_json: rawJsonString
      });
      setStatus("failed");
      setErrorMessage("VALIDATION FAILED:\n\n" + validation.errors.join("\n") + "\n\nRaw JSON:\n" + rawJsonString);
      navigate(`/results?id=${run.id}`);
      return;
    }

    // Use normalized data for markdown and storage
    const normalizedData = validation.normalized;
    const renderMd = generateMarkdown(normalizedData, executionMode);

    const runData = {
      query_text: queryText,
      full_prompt: fullPrompt,
      execution_mode: executionMode,
      output_mode: outputMode,
      blueprint_level: blueprintLevel,
      novelty_dial: noveltyDial,
      refresh_enabled: refreshEnabled,
      status: "completed",
      raw_json: rawJsonString,
      render_md: renderMd
    };

    // Add normalized domains to storage
    mode.domains.forEach(domain => {
      if (normalizedData[domain]) {
        runData[domain] = normalizedData[domain];
      }
    });

    const run = await base44.entities.Run.create(runData);

    setStatus("completed");
    navigate(`/results?id=${run.id}`);
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">CP-002 v1.5</p>
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