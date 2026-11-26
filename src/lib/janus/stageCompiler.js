/**
 * JANUS CANONICAL STAGE COMPILER — Phase 4 (pure, no I/O).
 * The only place a Janus stage prompt is built. Ordinary runs, resumes and reruns all compile here.
 * Protocol identity comes from the registry; data enters only through the evidence boundary.
 * Layout of every prompt: control header → stage instructions → data-plane law → data blocks → output contract.
 */
import { DOMAINS, DOMAIN_ORDER, PAIRS, PATTERNS, MODE_PROFILES, allSubdomains, refreshKeysFor, subdomainIds, patternTaskText,
  patternJsonTemplate, pairLabel, protocolLabel } from "@/lib/janus/protocolRegistry";
import { intersectionKey, INTERSECTION_KEYS, QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { QUALITY_CRITERIA, criterionApplies, MODE_EXPECTATIONS, minAlternatives, hasCritique } from "@/lib/janus/lifecycleContract";
import { BP, BLUEPRINT_PIPELINE_KEYS, isDeterministicStage, sourceOutline } from "@/lib/janus/blueprintPipeline";
import { BLUEPRINT_SPECS } from "@/lib/janus/blueprintSpecs";
import { DATA_PLANE_LAW, PLANES, sealEvidence, renderEvidenceBlock, renderDataBlock, assertBoundaryIntegrity } from "@/lib/janus/evidenceBoundary";
import { JANUS_SCHEMA } from "@/components/janus/janusSchema";
import { domainContext, pairLines } from "@/lib/janus/stageContext";

/**
 * PROMPT-TEMPLATE IDENTITY IS PER STAGE. A stage's identity changes when, and only when, the prompt contract of THAT
 * stage changes. A revision waiting for its retry is therefore blocked by a change to its own stage, never by a
 * change to another stage's prompt (stageEngine.verifyContinuation). When a stage's prompt changes, give that stage
 * a new identity here and leave the others alone.
 *  - 2026-11-25.3: Refresh, the four domains, Blueprint, qualification (unchanged since Phase 5);
 *  - 2026-11-26.1: the six pair intersections and the patterns stage (Phase 8: inputs read in full; the final
 *    Synthesis requirements stated). Unchanged since;
 *  - 2026-11-26.2: the four domains and the Blueprint (Phase 9 corrections: field types and allowed values stated
 *    from the schema; Cogito separates a claim's logical dependencies from its sources; Actus states what
 *    depends_on_claims may cite; derived context is no longer cut at a character count).
 *  - 2026-11-26.3: every stage except Refresh (Phase 9 pipeline). The four domains, the six pairs and the patterns
 *    stage gained the cognitive-discipline clause (objective fidelity, mechanism over vocabulary, valid evidence
 *    logic); a pair may state its mechanism. The Blueprint became the final refinement of a pipeline of new stages
 *    (blueprintSpecs), each with this identity. The evaluation reads the operator objective and the pipeline record
 *    and returns its findings on surplus, objective preservation and substantive errors.
 * Refresh is unchanged since Phase 5 and keeps 2026-11-25.3.
 */
// 2026-11-26.5 (cognitive restoration): every reasoning stage. The four domains and the Nexus gained the depth and
// novelty clauses and richer contracts; every stage that reads earlier cognition now reads it in full
// (stageContext); the patterns stage reads each pair's mechanism; the Blueprint stages gained specifications,
// source coverage and transactional refinement. Refresh alone is unchanged.
// 2026-11-26.6 (ideal-form continuation): EVERY stage. The field-type legend every contract carries is now stated
// from each list's own item type; Refresh analyses a live retrieved corpus; the brief states each section's
// substance; the skeleton disposes of every intersection and pattern; the final Blueprint returns edits that code
// integrates; the evaluation judges the source section by section. Refresh therefore leaves 2026-11-25.3 too.
const IDEAL_FORM = "stage-compiler/2026-11-26.6";
export const templateVersionOf = (_stageKey) => IDEAL_FORM;
export const REFRESH_UNAVAILABLE_MESSAGE =
  "Live Refresh retrieved no source records, so there is nothing to analyse and no research is claimed. Try again, or turn Refresh off to run on training data only.";

// NO COGNITIVE INPUT IS CUT AT A CHARACTER COUNT (plan §3.7, Phase 9). The derived context of every stage is
// passed in full: what a stage reads is decided by what its context builder selects (meaning), never by where a
// slice happens to fall. The former 20,000-character bound on the domains' and the Blueprint's context is gone.
const pairOf = (stageKey) => PAIRS.find(p => intersectionKey(p.id) === stageKey);

// What each stage actually reads. Since Phase 5 the Blueprint also reads the Cogito claims and the four
// patterns (CONTEXT_THREADING.blueprint): its steps must be traceable to them, and it cannot cite what it
// never saw. The deeper Blueprint cognition (candidates, critique, refinement) remains Phase 8/9.
const ALL_ARTIFACTS = ["refresh", "corpus", "cogito", "animus", "actus", ...INTERSECTION_KEYS, "synthesis"];
// The Blueprint pipeline (Phase 9). Each stage reads the upstream cognition in full plus exactly the sub-artifacts
// it builds on. The brief reads the operator's query alone, so no upstream re-run can make it stale.
const PIPELINE_INPUTS = {
  [BP.brief]: [],
  [BP.candidates]: [...ALL_ARTIFACTS, BP.brief],
  [BP.selection]: [...ALL_ARTIFACTS, BP.brief, BP.candidates],
  [BP.skeleton]: [...ALL_ARTIFACTS, BP.brief, BP.candidates, BP.selection],
  [BP.expansion]: [...ALL_ARTIFACTS, BP.brief, BP.selection, BP.skeleton],
  [BP.criteria]: [...ALL_ARTIFACTS, BP.brief, BP.selection, BP.skeleton, BP.expansion],
  [BP.assembly]: [...ALL_ARTIFACTS, BP.brief, BP.candidates, BP.selection, BP.skeleton, BP.expansion, BP.criteria],
  [BP.critique]: [...ALL_ARTIFACTS, BP.brief, BP.assembly],
};
// What must exist, valid, before a pipeline stage is compiled: the chain it builds on.
const PIPELINE_REQUIRES = {
  [BP.brief]: [], [BP.candidates]: [BP.brief], [BP.selection]: [BP.brief, BP.candidates], [BP.skeleton]: [BP.brief, BP.selection],
  [BP.expansion]: [BP.skeleton], [BP.criteria]: [BP.skeleton, BP.expansion],
  [BP.assembly]: [BP.brief, BP.candidates, BP.selection, BP.skeleton, BP.expansion, BP.criteria],
  [BP.critique]: [BP.assembly], [BP.final]: [BP.assembly],
};
const STAGE_INPUTS = {
  ...PIPELINE_INPUTS,
  [QUALIFICATION_KEY]: ["blueprint", ...ALL_ARTIFACTS, BP.brief, BP.candidates, BP.selection, BP.critique],
  refresh: [],
  corpus: ["refresh"],
  cogito: ["refresh", "corpus"],
  animus: ["refresh", "corpus", "cogito"],
  actus: ["refresh", "corpus", "cogito", "animus"],
  synthesis: [...INTERSECTION_KEYS],
  blueprint: [...ALL_ARTIFACTS, BP.brief, BP.assembly, BP.critique],
};
export const stageInputs = (stageKey) => (pairOf(stageKey)?.domains || STAGE_INPUTS[stageKey]).slice();
/**
 * Inputs without which a stage is not compiled at all (each must have a valid active revision).
 * SYNTHESIS FINAL FORM (plan §14, Phase 8):
 *  - the patterns stage needs all six pair intersections, each validated: 6/6, never "(not computed)";
 *  - in a mode whose plan has Synthesis (Full), the Blueprint needs the validated Synthesis: no premature Blueprint.
 *    Through these two rules it also rests on all four primary domains. The partial profiles (Quick, Standard) have
 *    no Synthesis stage, so their Blueprint is unchanged.
 */
export const requiredInputs = (stageKey, mode) => {
  if (pairOf(stageKey)) return pairOf(stageKey).domains.slice();
  if (stageKey === QUALIFICATION_KEY) return ["blueprint"];
  if (stageKey === "synthesis") return [...INTERSECTION_KEYS];
  // BLUEPRINT PIPELINE (plan §15, Phase 9): the validated Synthesis where the mode has one (no premature Blueprint
  // cognition), then the chain: no stage is compiled before the sub-artifacts it builds on exist and are valid. The
  // final Blueprint needs the assembled draft, and the self-critique where the mode's pipeline has one.
  // The brief reads the operator's query alone (its recorded dependencies stay empty), but it is still Blueprint
  // cognition: it too waits for the validated Synthesis, so a run whose Synthesis failed starts no Blueprint stage.
  if (BLUEPRINT_PIPELINE_KEYS.includes(stageKey)) return [
    ...(MODE_PROFILES[mode]?.stages.includes("synthesis") ? ["synthesis"] : []),
    ...PIPELINE_REQUIRES[stageKey],
    ...(stageKey === BP.final && hasCritique(mode) ? [BP.critique] : []),
  ];
  return [];
};

/**
 * COGNITIVE DISCIPLINE (Phase 9) — stated to every reasoning stage, because a Blueprint cannot be better than the
 * cognition it inherits: an objective narrowed upstream, or a pattern that is only a name, is already lost.
 */
const COGNITIVE_DISCIPLINE = `COGNITIVE DISCIPLINE:
(a) OBJECTIVE FIDELITY — keep the operator's stated objective intact. Ground it, stage it and constrain it; do not replace it with a narrower, easier or more conventional one, and do not rename it into something smaller.
(b) MECHANISM, NOT VOCABULARY — any construct, model or principle you name must come with what it does operationally: what it takes in, what it does, what it yields and how its effect would be evaluated. A physical or scientific term is literal only where the literal science applies; otherwise say plainly that it is an analogy. A new name is not a new idea.
(c) VALID EVIDENCE LOGIC — a validation must let a positive, a null, a contradictory and an inconclusive result each occur and each mean something. Never define success as the absence of an effect.
(d) SURPLUS — do not hand the operator's own material back as a finding. Say what it implies, what it misses or what it makes possible.`;

// ── SME identity (registry-derived) ──
function smeIdentity(domainKey) {
  const domain = DOMAINS[domainKey];
  const details = domain.subdomains.map((s, i) => `  ${i + 1}. ${s.name}
     Objective: ${s.objective}
${s.core_principles.map(p => `    • ${p}`).join("\n")}
     When Active: ${s.functional_model}`).join("\n\n");
  return `═══ DOMAIN ACTIVATION: ${domain.label.toUpperCase()} — ${domain.title.toUpperCase()} (Section ${domain.section}) — ${protocolLabel()} ═══

You are consulting a Subject Matter Expert whose unified wisdom spans ${domain.subdomains.length} subdomains: ${domain.subdomains.map(s => s.name).join(", ")}.

Core Insight: "${domain.core_insight}"
Objective: ${domain.objective}

This expert draws from ALL of the following subdomain expertise SIMULTANEOUSLY — they do not think in silos. Each subdomain informs and enriches the others:

${details}

GUARDRAILS (constraints to keep in mind, NOT your identity):
${domain.guardrails.map(g => `  • ${g}`).join("\n")}

CRITICAL INSTRUCTION: You must think FROM INSIDE this expertise. Do not produce generic observations. Every finding must reflect the depth of a genuine expert who has spent decades across these disciplines. Draw connections between your subdomains — that is where the deepest insights live.`;
}

// ── Refresh-derived material is untrusted: it originates outside Janus ──
function refreshEvidence(refresh, target) {
  const updates = refresh?.subdomain_updates;
  if (!updates) return [];
  const records = refreshKeysFor(target)
    .filter(k => updates[k] && updates[k] !== "no significant update found")
    .map(k => ({ kind: "refresh_update", subdomains: [k], text: updates[k] }));
  (refresh.key_developments || []).forEach(d => records.push({ kind: "refresh_key_development", text: d }));
  return records;
}

// ── Derived context from earlier stages: stageContext.domainContext (every declared input, in full) ──

/**
 * HOW DEEP, HOW WIDE (stated to every primary domain and to the Nexus). Depth is a property of the problem, never a
 * count: the output-contract examples show the SHAPE of one entry, not how many entries there are. The novelty dial
 * sets the search strategy of the whole run (plan §15.5), so the faculties that feed the Blueprint search as widely
 * as the Blueprint is asked to.
 */
const NOVELTY_SEARCH = {
  low: "NOVELTY DIAL — LOW: reason first from established methods and settled results. Raise a novel mechanism only where it clearly improves the outcome, and say why.",
  medium: "NOVELTY DIAL — MEDIUM: generate hypotheses broadly and transfer at least one mechanism from another discipline where it does real work.",
  high: "NOVELTY DIAL — HIGH: widen the search. Reframe the problem's assumptions from first principles, transfer mechanisms from distant disciplines, look for a unifying principle, and follow an unconventional line of reasoning as far as it holds. This licenses exploration, not unsupported assertion: every such idea carries its mechanism and its honest status.",
};
const depthClause = (config) => `DEPTH FOLLOWS THE PROBLEM. This run produces a ${config.outputMode} at level ${config.blueprintLevel || "L2"}; everything built later can only be as deep as what you establish here.
- Work through the operator's material in full: every section, mechanism, interface, gate, constraint and stated intention is in scope. Material you pass over in silence is lost to every later stage.
- The JSON examples in the output contract show the shape of ONE entry. The number of entries is whatever the problem needs: every load-bearing proposition, mechanism, risk, decision and dependency gets its own entry. One entry where the problem holds ten is a failed analysis, and ten padded entries where it holds one is no better.
- Go below the surface of each point: state how it works, which quantities or relationships govern it (formally where a formal statement exists), what it depends on, where it stops holding, and what it changes in the design.
- Where the objective depends on something not yet known or not yet built, do not shrink the objective: name the investigation, derivation or capability that would close the gap.
${NOVELTY_SEARCH[config.noveltyDial] || NOVELTY_SEARCH.medium}`;

// ── Output contracts ──
// Output density scales with the mode; the expertise does not. The SME identity (all subdomains, in full) is
// the same in every mode. Full reports every subdomain explicitly — 25 across the four domains, as its
// completion contract requires. Quick and Standard are partial profiles: they reason from the same expertise
// but fold it into the integrated fields instead of emitting a per-subdomain inventory.
const isFull = (mode) => MODE_PROFILES[mode]?.partial === false;
const DENSITY_NOTE = {
  standard: "OUTPUT DENSITY (Standard profile): reason from every subdomain of this expertise, but do not emit a per-subdomain inventory. Integrate what each contributes into the fields below; every field must carry substantive expert findings.",
  quick: "OUTPUT DENSITY (Quick profile): reason from every subdomain of this expertise, but keep the output compact — no per-subdomain inventory, and only findings that change what the operator should do. Compact is not shallow: every finding must still be one only this expertise would produce.",
};
const subdomainsJson = (domain) => subdomainIds(domain).map((id, i) =>
  i === 0 ? `"${id}": {"perspective": "your expert perspective as one coherent voice", "key_findings": ["specific findings only this expertise would produce"]}`
          : `"${id}": {"perspective": "...", "key_findings": ["..."]}`).join(", ");
/**
 * FIELD TYPES, stated from the schema the validator enforces (one source: janusSchema). An example value in a JSON
 * template does not tell a model whether a field is one string or a list, or which words an enumerated field
 * accepts; a wrong guess rejects the whole output. This lists every field's type and allowed values in words.
 */
function typeLegend(stageKey) {
  const lines = [];
  const describe = (s) => (s.enum ? `exactly one of ${s.enum.map(v => `"${v}"`).join(" | ")} (no other word)`
    : s.type === "string" ? "ONE text value (a single string, never a list and never an object)"
    : s.type === "number" ? "a number"
    : s.type === "boolean" ? "true or false"
    // Stated from the items' own schema. Calling every plain list "text values" told the model to write step
    // references as strings, which the validator then refused (the benchmark's `where` failures).
    : s.type === "array" ? (s.items?.type === "object" ? "a list of objects"
      : s.items?.type === "number" ? "a list of NUMBERS, for example [1, 3] (bare numbers, never quoted, never one number alone)"
      : s.items?.enum ? `a list whose entries are each one of ${s.items.enum.map(v => `"${v}"`).join(" | ")}`
      : "a list of text values (an array of strings, never one string)")
    : "an object");
  const walk = (schema, path) => Object.entries(schema.properties || {}).forEach(([key, s]) => {
    if (key === "subdomains" || key === "alignment_engine" || key === "intersection_matrix") return; // shown in full by the contract / not part of this stage's output
    const at = path ? `${path}.${key}` : key;
    lines.push(`- ${at}: ${describe(s)}${(schema.required || []).includes(key) ? " — required" : ""}`);
    if (s.type === "object") walk(s, at);
    if (s.type === "array" && s.items?.type === "object") walk(s.items, `${at}[]`);
  });
  walk(JANUS_SCHEMA.properties[stageKey], "");
  return `FIELD TYPES (checked by code — a wrong type, or a value outside an allowed set, rejects the whole output; a field the output contract does not ask for may be left out):\n${lines.join("\n")}`;
}
const REFERENCE_RULES = {
  cogito: `CLAIM DEPENDENCIES (checked by code): depends_on holds ONLY the ids of OTHER claims in this same claims list (C1, C2, …) that the claim logically rests on, and [] when it rests on none. A document, source, protocol or section is NOT a dependency: name those in sources. A depends_on entry that is not a claim id of this list rejects the output. Every claim id is used once.`,
  actus: `RECOMMENDATION DEPENDENCIES (checked by code): depends_on_claims holds ONLY Cogito claim ids exactly as shown in the prior stage outputs (C1, C2, …). An entry that is not one of those ids rejects the output. Every recommendation id is used once.`,
};
const domainContract = (domain, mode) => {
  const subs = (d) => (isFull(mode) ? `, "subdomains": { ${subdomainsJson(d)} }` : "");
  const rules = [typeLegend(domain), REFERENCE_RULES[domain]].filter(Boolean).join("\n\n");
  const contracts = {
  corpus: `Output ONLY valid JSON with the "corpus" key: { "corpus": { "constraints": ["hard reality constraints from your expert assessment"], "feasibility_notes": ["practical viability notes"], "mechanisms": [{"name":"a mechanism the objective relies on or is limited by","operation":"what it takes in, what it does, what it yields","relationships":"the quantities and relations that govern it, stated formally where a formal statement exists","limits":"where it stops holding"}], "system_model": "the system as a whole: components, flows, feedback loops and the behaviour that emerges from their interaction", "enabling_dependencies": ["what must exist, be measured or be discovered for the objective to be reachable"]${subs("corpus")} } }`,
  cogito: `Output ONLY valid JSON with the "cogito" key: { "cogito": { "claims": [{"id":"C1","tag":"Established","text":"your epistemic finding","depends_on":[],"sources":["a document, material or body of evidence this claim draws on, by name"],"why_believed":"justified basis","falsifiable_by":"what would disprove this","verify_later":"what to check","implications":"what follows for the design if this holds"}], "reasoning_map": ["logical chain step 1", "step 2", "..."], "graphrag_connections": ["concept A ↔ concept B: relationship"], "causal_chains": [{"cause":"...","effect":"...","mechanism":"how the cause produces the effect","confidence":"Established"}], "neuro_symbolic_insights": ["insights from bridging symbolic and connectionist reasoning"], "hypotheses": [{"id":"H1","statement":"a conjecture worth pursuing","rationale":"why it may hold","test":"how it would be tested, and what a positive, null or contradictory result would mean","status":"Speculative"}], "formal_models": [{"name":"...","variables":"...","relations":"the relations between them","predicts":"what the model predicts that could be checked"}], "associative_leaps": [{"from":"a concept in this problem","to":"a concept in a distant field","bridge":"the functional relationship they share","payoff":"what the connection makes possible"}], "open_questions": ["what remains unknown and matters"]${subs("cogito")} } }`,
  animus: `Output ONLY valid JSON with the "animus" key: { "animus": { "boundary_checks": ["what the user should/should not do"], "disallowed_moves": ["explicitly forbidden approaches"], "safety_notes": ["safety considerations"], "consciousness_boundary": "where agency and autonomy limits lie", "attractor_states": ["natural equilibrium points the system tends toward"], "ethical_stance": "your integrated moral assessment", "risk_analysis": {"cognitive_sync_assessment": "how well-aligned are the goals", "self_determination_factors": ["factors affecting autonomy"], "misalignment_risks": ["where intent and outcome may diverge"]}, "intent_model": {"stated_goal":"what was literally asked","true_goal":"what the operator is actually trying to bring about","divergence":"where the two could come apart"}, "moral_reasoning": [{"question":"a moral question this objective raises","rules_view":"what duty and principle say","outcomes_view":"what the consequences say","virtue_view":"what a person of good character would do","verdict":"your integrated judgment"}], "affirmed_pursuits": ["what this objective is right to pursue, and why — conscience affirms as well as forbids"], "stakeholders": [{"who":"...","stake":"...","autonomy_risk":"..."}]${subs("animus")} } }`,
  actus: `CONFIDENCE PROPAGATION LAW (NON-NEGOTIABLE): Every recommendation MUST inherit the LOWEST confidence tag of the Cogito claims it depends on. A recommendation depending on a "Speculative" claim CANNOT be marked "Established".

Output ONLY valid JSON with the "actus" key: { "actus": { "recommendations": [{"id":"R1","text":"actionable recommendation","depends_on_claims":["C1"],"inherited_confidence":"Established","probability":"high","failure_modes":["what could go wrong"],"next_actions":["immediate next step"],"rationale":"why this, and why now","mechanism":"how it produces its effect","expected_effect":"what changes if it is done, and how that would be observed"}], "strategic_plan": {"immediate_horizon":"next 1-4 weeks","long_term_horizon":"3-12 months","key_decision_points":["decisions that must be made"]}, "game_theory_analysis": {"game_board":"who are the players and what are the stakes","nash_equilibrium":"stable outcome if all act rationally","zero_sum_assessment":"is this zero-sum or positive-sum","coalition_dynamics":["potential alliances and conflicts"],"players":[{"player":"...","incentives":"...","likely_moves":"..."}]}, "technical_summary": "lossless compression of the entire analysis into one paragraph", "behavioral_factors": {"irrational_actors":["who might act irrationally and why"],"identity_economics":"how identity shapes economic decisions here","bias_mitigations":["specific debiasing strategies"]}, "integration_contracts": ["API/interface agreements needed"], "iteration_model": {"value_stream":"how value flows through the system","adaptation_triggers":["signals that should trigger strategy change"]}, "strategic_branches": [{"branch":"a way events may unfold","trigger":"what shows it is happening","response":"the prepared move"}], "enabling_work": ["an investigation, derivation or capability that must be delivered for the objective to be reached"]${subs("actus")} } }`,
  };
  const contract = `${contracts[domain]}\n\n${rules}`;
  return isFull(mode) ? contract : `${DENSITY_NOTE[mode] || DENSITY_NOTE.standard}\n\n${contract}`;
};

const REFRESH_ROSTER = () => {
  let n = 0;
  return DOMAIN_ORDER.map(d => `${DOMAINS[d].label.toUpperCase()} SUBDOMAINS (${DOMAINS[d].subdomains.length}):\n` +
    DOMAINS[d].subdomains.map(s => `${++n}. ${s.name} [key: ${s.refresh_key}]`).join(" ")).join("\n\n");
};

// ── Stage specifications ──
const domainSpec = (domain) => (config, inp) => ({
  parseKey: domain,
  title: `DOMAIN: ${DOMAINS[domain].label.toUpperCase()}`,
  instructions: `${smeIdentity(domain)}

Analyze the operator's query (data block "query") through your unified expert perspective. Think FROM INSIDE your expertise — do not summarize textbook knowledge, produce findings that reflect genuine mastery. Push beyond conventional wisdom. If the physics and math support a novel approach, precedent is irrelevant.

${depthClause(config)}

${COGNITIVE_DISCIPLINE}`,
  context: domainContext(domain, inp),
  untrusted: refreshEvidence(inp.refresh, domain),
  contract: domainContract(domain, config.executionMode),
});

const SPECS = {
  refresh: (config, inp, evidence, retrieval) => {
    if (!config.refreshEnabled) return {
      parseKey: "refresh", title: "DOMAIN: REFRESH (Zero-Day Patch)",
      instructions: `You are the Janus Refresh Module. Internet access is DISABLED by the operator.
You MUST NOT claim to have searched the internet. Be honest: your knowledge comes from training data only.
Declare what you WOULD search for if internet access were enabled.`,
      contract: `Output ONLY valid JSON: { "refresh": { "mode": "tier0", "attempted": false, "limitations": "Analysis based on training data only — no live internet sweep performed. Training data may be outdated.", "would_refresh": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"], "training_data_cutoff_note": "State your approximate training data cutoff date" } }`,
    };
    // Live Refresh: provider-neutral retrieval (retrieveJanusEvidence: each subdomain searched by name, newest
    // first, no model) → provenance-bearing source corpus → this analysis. With no corpus it fails closed.
    if (!evidence.length) throw new Error(REFRESH_UNAVAILABLE_MESSAGE);
    return {
      parseKey: "refresh", title: "DOMAIN: REFRESH (Zero-Day Patch) — SOURCE CORPUS ANALYSIS", storeEvidence: true,
      instructions: `You are the Janus Refresh Module. You have NO internet access of your own. A source corpus was retrieved live for this run, one search per subdomain, newest first, and is supplied as untrusted evidence records (ids E1…En). Each record names the subdomain it was retrieved for, its origin, its publication date and its quality.
For EACH of the ${allSubdomains().length} subdomains below, report what the corpus establishes that is current AND bears on the operator's query: the development, why it matters for this problem (what it enables, constrains, contradicts or makes obsolete), and the evidence ids. A record retrieved for one subdomain may inform another; use it where it does. Weigh quality as labelled: a preprint is a claim, not a settled result. Where the corpus establishes nothing that bears on the query, write exactly "no sufficiently strong current update established". Never state anything as retrieved that is not in the corpus, and never fill a gap from memory.
key_developments: the three developments with the greatest consequence for this problem, each with its evidence ids. limitations: what this corpus cannot tell you (the data block "retrieval_report" says what was searched, when, and which subdomains returned nothing).

${REFRESH_ROSTER()}`,
      untrusted: evidence, untrustedLabel: "retrieved_source_corpus",
      blocks: retrieval ? [{ label: "retrieval_report", text: JSON.stringify(retrieval, null, 1) }] : [],
      contract: `Output ONLY valid JSON: { "refresh": { "mode": "tier1", "attempted": true, "limitations": "limits of the supplied corpus", "subdomain_updates": { ${allSubdomains().map(s => `"${s.refresh_key}": "..."`).join(", ")} }, "key_developments": ["development 1 [E1]"], "sources": ["E1"] } }`,
    };
  },
  corpus: domainSpec("corpus"),
  cogito: domainSpec("cogito"),
  animus: domainSpec("animus"),
  actus: domainSpec("actus"),
  synthesis: (config, inp) => ({
    parseKey: "synthesis", title: "DOMAIN: SYNTHESIS — THE NEXUS (Section V)", untruncated: true,
    instructions: `You are the Janus Synthesis Engine. The 6 domain intersection pairs have ALREADY been computed by dedicated cross-domain analysis and are supplied as prior stage outputs. Each represents the EMERGENT wisdom found at the intersection of two expert domains.

Using ONLY those intersection pairs as your source material, produce the 4 NAMED EMERGENT PATTERNS:

${patternTaskText()}

Also produce:
- key_takeaways: The 3-5 most groundbreaking cross-domain insights from ALL 6 intersections combined
- constraint_collisions: Where intersection findings genuinely CONFLICT with each other
- limitation_foreground: The single most significant limitation of this entire analysis

REQUIRED (checked by code): all four patterns with every field shown in the output contract; key_takeaways (not empty); constraint_collisions (always present: an empty list only when the analysis found no genuine collision, never omitted); limitation_foreground.

CRITICAL: Every named pattern must produce EMERGENT insight — wisdom that transcends any single intersection pair. If it could come from one pair alone, it fails. Push past convention — novel problems require novel solutions.

WHAT EACH PATTERN DOES (it is a working model, not a caption):
- Quantum Foresight explores the branching futures of this objective. futures lists the materially different ways it can unfold: the conditions that produce each, how likely it is and why, the leading indicators that tell which branch is being entered, and the strategic response prepared for it. probability_wave names those branches; it is never a list of abstract nouns.
- Governed Cogito examines the truth-finding itself. method_audit takes each method this analysis relies on and states what it can establish, what it cannot, and the ethical condition under which using it is sound.
- Narrative Loop decodes what the operator is actually trying to bring about (operator_intent) and designs how the result must be communicated and structured to be usable by them (communication_design).
- Empathy-Driven Strategy models the people involved. actors gives each one's motivation, the non-rational drivers that will move them (identity, fear, status, sunk cost), their predicted behaviour and the strategy that works with it.
For every pattern also give: mechanism (how it operates on this problem: what it takes in, what it does, what it yields), design_consequence (what the Blueprint must do differently because of it — a pattern with no consequence is decoration), evaluation (how its effect would be observed) and epistemic_status.

${depthClause(config)}

${COGNITIVE_DISCIPLINE}`,
    // Each pair in full: its insight, tension and resolution AND the mechanism, consequence and formal statement it
    // produced. The patterns are built from how the pairs work, not from their headlines.
    context: PAIRS.map(p => `${p.id.toUpperCase()} — ${p.resolution_label}\n${pairLines(p, inp[intersectionKey(p.id)] || {}).join("\n")}`).join("\n\n"),
    contract: `Output ONLY valid JSON: { "synthesis": {
  "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...",
${patternJsonTemplate()}
} }
Each pattern object above also carries "mechanism", "design_consequence", "evaluation", "epistemic_status" and its working structure: quantum_foresight "futures": [{"future":"...","conditions":"...","likelihood":"...","leading_indicators":"...","strategic_response":"..."}]; governed_cogito "method_audit": [{"method":"...","what_it_can_establish":"...","what_it_cannot":"...","ethical_condition":"..."}]; narrative_loop "operator_intent" and "communication_design"; empathy_driven_strategy "actors": [{"actor":"...","motivation":"...","non_rational_drivers":"...","predicted_behavior":"...","strategy_response":"..."}].

${typeLegend("synthesis")}

IMPORTANT: Do NOT include an intersection_matrix field — the pre-computed pairs are already stored separately.`,
  }),
};
// The Blueprint pipeline (blueprintSpecs): the objective brief → candidates → … → the final refinement (`blueprint`).
// Its stage specifications live in their own file; they are compiled here, like every other stage.
Object.entries(BLUEPRINT_SPECS).forEach(([key, spec]) => {
  SPECS[key] = (config, inp) => ({ parseKey: key, ...spec(config, inp, {
    ledger: domainContext("blueprint", inp), typeLegend,
    minAlternatives: minAlternatives(config.executionMode, config.noveltyDial),
    untrusted: refreshEvidence(inp.refresh, "blueprint"),
  }) });
});

// Independent evaluation: a separate call that never sees the generator's instructions or its self-assessment.
SPECS[QUALIFICATION_KEY] = (config, inp) => {
  const critique = QUALITY_CRITERIA.filter(c => c.method === "critique" && criterionApplies(c));
  const expect = MODE_EXPECTATIONS[config.executionMode] || {};
  const matrix = Object.fromEntries(PAIRS.filter(p => inp[intersectionKey(p.id)]).map(p => [p.id, inp[intersectionKey(p.id)]]));
  const brief = inp[BP.brief];
  const sections = sourceOutline(config.queryText);
  return {
    blocks: sections.length ? [{ label: "source_outline", text: sections.map(s => `${s.id} — ${s.title}`).join("\n") }] : [],
    parseKey: QUALIFICATION_KEY, title: "QUALITY QUALIFICATION — INDEPENDENT EVALUATION", untruncated: true,
    instructions: `You are the Janus Quality Evaluator. You did NOT write the Blueprint in the data block and you owe it nothing.
Your task is to decide whether it deserves release, by trying to find where it fails. A Blueprint that is merely well-formed, generic, safe or plausible FAILS. Do not reward length, confident wording or scientific-sounding language: a term is worth only the mechanism behind it.

READ THE OPERATOR'S QUERY FIRST (data block "query"), all of it. Before you look at the Blueprint, form your own account of what the operator's end state contains: every subsystem, capability, relationship and standard of quality the material describes, and what kind of thing each one is meant to be (a place to live is not an archive; a society is not a registry; a developmental process is not a configuration step). That account, not the Blueprint's own summary of the objective, is what you judge against. The objective brief in "operator_objective" is itself under evaluation: if it reduced, flattened or re-described the operator's material into something smaller, every stage after it inherited the reduction, and a Blueprint that is perfectly coherent with a narrowed brief has still failed the operator. Internal coherence is not fidelity.
${sections.length ? `SECTION BY SECTION (checked by code). The data block "source_outline" lists the sections of the operator's material, S1, S2, … For EVERY one, record in section_realisation whether the Blueprint realises what that section means: "realised" (a builder following the Blueprint would build it, as the kind of thing it is), "partial" (named, or built as something lesser), or "absent" (no path to it and no reasoned deferral), with where in the Blueprint, or what is missing. A section whose title appears in a step is not thereby realised.
` : ""}Then judge the difference between what was submitted and what came back, and record it:
- intellectual_surplus: what the Blueprint contributes that is NOT already in the operator's query — a mechanism, a resolved tension, a structure, a risk, a sequence. A sophisticated restatement of the input is not novelty and not insight: if the operator already wrote it, it is not surplus. An empty list is a valid answer.
- input_restatement: the parts of the Blueprint that only restate the operator's own material.
- objective_preservation: does the Blueprint pursue the operator's objective at its full ambition ("yes"), a reduced or renamed version of it ("partly"), or a different objective ("no")? lost lists every requirement, interface, mode, gate or control of the query that the Blueprint neither builds nor defers with a real reason.${brief ? " The requirement list in operator_objective is there to check against; the query itself is the authority." : ""}
- substantive_errors: errors of substance — a named construct with no operational mechanism, interdisciplinary or scientific vocabulary with nothing behind it, a scientific or mathematical error, a claim or confidence label stronger than its support, validation logic that can only come out one way or that treats the absence of an effect as proof, acceptance conditions that contradict each other or the plan, an internal contradiction, an alternative that was never a serious rival, a simplification of the operator's problem that was not justified, a step a builder could not execute without inventing the design, and — in blueprint.refinement.changes — any declared change that left the Blueprint saying less than before. Mark each "blocking" when the Blueprint cannot be trusted until it is repaired, otherwise "minor".
JUDGE THE THINKING, NOT ITS FAMILIARITY. An unconventional mechanism is not an error because it is new: ask whether its mechanism is stated, whether its status is labelled honestly and whether it would work if its premises hold. Reward a genuinely ingenious solution; fail a conventional one that merely sounds safe. Length, structure, citations and confident description are not evidence of either.

Then judge each criterion below separately, against the Blueprint, the operator's query and the upstream material it was built from. For each one answer exactly "pass" or "fail" and state the specific evidence. There is no "not applicable" and no partial credit: when in doubt, fail. Your answers must agree with what you recorded above (code enforces it): non_obviousness cannot pass with nothing in intellectual_surplus, feasibility_without_domestication cannot pass unless the objective is preserved and no section is absent, and adversarial_robustness cannot pass over a blocking error.
Mode: ${config.executionMode || "unspecified"} — expected at least ${expect.min_alternatives ?? 0} serious alternative(s) and ${expect.min_non_obvious_insights ?? 1} non-obvious insight(s).

CRITERIA:
${critique.map((c, i) => `${i + 1}. ${c.id} — ${c.standard}`).join("\n")}`,
    context: JSON.stringify({
      blueprint: inp.blueprint, ...(brief ? { operator_objective: brief } : {}),
      ...(inp[BP.candidates] ? { candidates_considered: inp[BP.candidates] } : {}),
      ...(inp[BP.selection] ? { comparison_and_decision: inp[BP.selection] } : {}),
      ...(inp[BP.critique] ? { self_critique_before_refinement: inp[BP.critique] } : {}),
      corpus_constraints: inp.corpus?.constraints, cogito_claims: inp.cogito?.claims,
      animus: inp.animus && { boundary_checks: inp.animus.boundary_checks, disallowed_moves: inp.animus.disallowed_moves, ethical_stance: inp.animus.ethical_stance },
      actus_recommendations: inp.actus?.recommendations, intersections: matrix, synthesis: inp.synthesis,
    }, null, 1),
    contract: `Output ONLY valid JSON: { "${QUALIFICATION_KEY}": { "intellectual_surplus": ["..."], "input_restatement": ["..."], "objective_preservation": {"preserved":"yes or partly or no","lost":["..."]}, "substantive_errors": [{"error":"...","severity":"blocking or minor"}], ${sections.length ? '"section_realisation": [{"section":"S1","status":"realised or partial or absent","where":"..."}], ' : ""}"verdicts": { ${critique.map(c => `"${c.id}": {"verdict":"pass or fail","reason":"specific evidence"}`).join(", ")} }, "strongest_objection": "the best argument against releasing this Blueprint" } }`,
  };
};

function intersectionSpec(pair, inp, config) {
  const [a, b] = pair.domains;
  const side = (tag, d) => `DOMAIN ${tag}: ${DOMAINS[d].title} (Section ${DOMAINS[d].section})\nExpert Output:\n${JSON.stringify(inp[d])}`;
  return {
    parseKey: pair.id, title: "CROSS-DOMAIN SYNTHESIS", untruncated: true,
    instructions: `You are the Janus Synthesis Engine performing a SINGLE intersection analysis.
Your task: find what EMERGES at the intersection of two expert domains that NEITHER domain alone could produce.

═══ INTERSECTION: ${pair.resolution_label} ═══
${pair.description}
Mechanism: ${pair.mechanism}
Domain A — ${DOMAINS[a].title}: "${DOMAINS[a].core_insight}"
Domain B — ${DOMAINS[b].title}: "${DOMAINS[b].core_insight}"

CRITICAL INSTRUCTION: The insight you produce MUST be EMERGENT — something that could NOT have come from either domain alone. You are looking for the spark that happens when these two forms of expertise collide. Think like a polymath who sees what specialists miss.

If the physics and math check out, precedent doesn't matter. Novel problems require novel solutions. Push past conventional thinking — if there's a non-obvious path that has higher probability of achieving the goal, NAME IT even if it's unheard of.

AN EMERGENT INSIGHT HAS A CONSEQUENCE. State what follows from it: an explanatory, mathematical, computational, scientific, strategic or architectural consequence that changes what should be built or how it should be tested. Where the relationship you found can be stated formally (variables, the relation between them, the condition under which it holds), state it. Where you borrow from another field, say which mechanism you take, how it maps here and where the analogy stops. Read both expert outputs in full, including their mechanisms, models, hypotheses and subdomain findings: the collision is usually between two specifics, not two summaries.

${NOVELTY_SEARCH[config?.noveltyDial] || NOVELTY_SEARCH.medium}

${COGNITIVE_DISCIPLINE}`,
    context: `${side("A", a)}\n\n${side("B", b)}`,
    contract: `Output ONLY valid JSON: { "${pair.id}": { "insight": "the emergent wisdom that lives at this intersection", "tension": "where these two domains pull in different directions", "resolution": "how the tension resolves into something greater than either domain", "mechanism": "one text value: how the resolution works operationally — what it takes in, what it does, what it yields, and how its effect would be evaluated", "consequence": "one text value: what this changes in the design, the strategy or the test plan", "formalization": "one text value, where a formal statement exists: the variables, the relation and the condition under which it holds; otherwise leave it out", "epistemic_status": "Established or Contested or Speculative" } }`,
  };
}

/**
 * RETRY FEEDBACK (the only other text the compiler authors). `prompt` is a revision's compiled prompt; `previous` is
 * the settled result of the attempt before this one. When that attempt returned an output the code rejected, the
 * retry carries the prompt unchanged plus this notice naming every rejection — otherwise the prompt alone.
 * The rejections quote model-produced values, so they enter as a derived data block, never as instruction.
 * Deterministic: the same previous result always yields the same text.
 */
const REJECTED = { schema_failure: "it was rejected by code validation", parse_failure: "it could not be read as the single JSON object the output contract requires" };
export function withCorrection(prompt, previous, attemptNumber) {
  if (!previous || !REJECTED[previous.outcome]) return prompt;
  const rejections = previous.validation?.errors?.length ? previous.validation.errors : [String(previous.message || "").replace(/^Output failed mandatory validation — /, "")];
  return [
    prompt,
    `RETRY NOTICE — attempt ${attemptNumber} of this same stage. Your previous output for this stage was not accepted: ${REJECTED[previous.outcome]}. The stage, its inputs and its output contract above are unchanged. Produce the COMPLETE output again, at full depth, and correct exactly the rejections listed in the data block below (each is a field path and what was wrong with it). Do not shorten, simplify or drop content to avoid them, and change nothing else for their sake.`,
    renderDataBlock(PLANES.derived, "previous_attempt_rejections", rejections.map(r => `- ${r}`).join("\n")),
  ].join("\n\n");
}

/**
 * Compile one stage. `inputs` maps stage key → settled output; `evidence` is untrusted source records.
 * Returns the prompt plus everything the executor records as provenance.
 */
export function compileStage({ stageKey, config, inputs = {}, evidence = [], retrieval = null }) {
  const pair = pairOf(stageKey);
  if (isDeterministicStage(stageKey)) throw new Error(`${stageKey} is computed by code from validated artifacts: it has no prompt`);
  if (!pair && !SPECS[stageKey]) throw new Error(`Unknown stage key: ${stageKey}`);
  const spec = pair ? intersectionSpec(pair, inputs, config) : SPECS[stageKey](config, inputs, evidence, retrieval);
  // Documents the operator attached as files travel with every call (server-side, from the Run record). They are
  // named here so the stage knows they exist and so they are part of the revision's identity.
  const attached = (config.attachments || []).filter(a => a?.file_uri);
  const sealed = sealEvidence(spec.untrusted || []);
  const blocks = [
    ...(sealed.length ? [renderEvidenceBlock(sealed, spec.untrustedLabel || "refresh_derived_evidence")] : []),
    ...(spec.context ? [renderDataBlock(PLANES.derived, "prior_stage_outputs", spec.context)] : []),
    // Structured records a stage builds on (the objective brief, the decision, the assembled draft, …): derived data.
    ...(spec.blocks || []).map(b => renderDataBlock(PLANES.derived, b.label, b.text)),
    ...(attached.length ? [renderDataBlock(PLANES.operator, "attached_documents",
      `The operator attached ${attached.length === 1 ? "this document" : "these documents"} to the query. ${attached.length === 1 ? "It is" : "They are"} supplied to you as files and ${attached.length === 1 ? "is" : "are"} part of the operator's material, to be read in full:\n${attached.map(a => `- ${a.name} (${a.file_uri})`).join("\n")}`)] : []),
    renderDataBlock(PLANES.operator, "query", config.queryText),
  ];
  const prompt = [
    `INITIATE PROTOCOL: JANUSSMEv2.0 — ${spec.title}`,
    `STAGE KEY: ${stageKey}`,
    spec.instructions,
    DATA_PLANE_LAW,
    ...blocks,
    spec.contract,
    "No markdown fences, no prose outside JSON. Execute the stage defined above against the data blocks now.",
  ].join("\n\n");
  assertBoundaryIntegrity(prompt, blocks.length);
  return {
    stageKey, parseKey: spec.parseKey, prompt, templateVersion: templateVersionOf(stageKey),
    inputKeys: stageInputs(stageKey),
    // A live-retrieved corpus is stored whole on the revision that read it (text included), so the same prompt can
    // be rebuilt for a retry. Evidence derived from an earlier stage is rebuilt from that stage: metadata is enough.
    sources: spec.storeEvidence ? sealed : sealed.map(({ text: _text, ...meta }) => meta),
  };
}