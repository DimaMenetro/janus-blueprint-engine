/**
 * JANUS CANONICAL STAGE COMPILER — Phase 4 (pure, no I/O).
 * The only place a Janus stage prompt is built. Ordinary runs, resumes and reruns all compile here.
 * Protocol identity comes from the registry; data enters only through the evidence boundary.
 * Layout of every prompt: control header → stage instructions → data-plane law → data blocks → output contract.
 */
import { DOMAINS, DOMAIN_ORDER, PAIRS, PATTERNS, MODE_PROFILES, allSubdomains, refreshKeysFor, subdomainIds, patternTaskText,
  patternJsonTemplate, pairLabel, protocolLabel } from "@/lib/janus/protocolRegistry";
import { intersectionKey, INTERSECTION_KEYS, QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { QUALITY_CRITERIA, criterionApplies, MODE_EXPECTATIONS } from "@/lib/janus/lifecycleContract";
import { DATA_PLANE_LAW, PLANES, sealEvidence, renderEvidenceBlock, renderDataBlock, assertBoundaryIntegrity } from "@/lib/janus/evidenceBoundary";
import { JANUS_SCHEMA } from "@/components/janus/janusSchema";

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
 * Refresh and the quality evaluation are unchanged since Phase 5 and keep 2026-11-25.3.
 */
const UNCHANGED_SINCE_PHASE5 = "stage-compiler/2026-11-25.3";
const SYNTHESIS_PHASE8 = "stage-compiler/2026-11-26.1";
const PHASE9_CORRECTIONS = "stage-compiler/2026-11-26.2";
const TEMPLATE_IDENTITY = {
  refresh: UNCHANGED_SINCE_PHASE5, [QUALIFICATION_KEY]: UNCHANGED_SINCE_PHASE5, synthesis: SYNTHESIS_PHASE8,
  corpus: PHASE9_CORRECTIONS, cogito: PHASE9_CORRECTIONS, animus: PHASE9_CORRECTIONS, actus: PHASE9_CORRECTIONS, blueprint: PHASE9_CORRECTIONS,
};
export const templateVersionOf = (stageKey) =>
  (PAIRS.some(p => intersectionKey(p.id) === stageKey) ? SYNTHESIS_PHASE8 : TEMPLATE_IDENTITY[stageKey] || UNCHANGED_SINCE_PHASE5);
export const REFRESH_UNAVAILABLE_MESSAGE =
  "Live Refresh is temporarily unavailable pending the external retrieval implementation (provider-neutral retrieval → provenance-bearing source corpus → Claude Opus Refresh analysis). Turn Refresh off to run without live research.";

// NO COGNITIVE INPUT IS CUT AT A CHARACTER COUNT (plan §3.7, Phase 9). The derived context of every stage is
// passed in full: what a stage reads is decided by what its context builder selects (meaning), never by where a
// slice happens to fall. The former 20,000-character bound on the domains' and the Blueprint's context is gone.
const pairOf = (stageKey) => PAIRS.find(p => intersectionKey(p.id) === stageKey);

// What each stage actually reads. Since Phase 5 the Blueprint also reads the Cogito claims and the four
// patterns (CONTEXT_THREADING.blueprint): its steps must be traceable to them, and it cannot cite what it
// never saw. The deeper Blueprint cognition (candidates, critique, refinement) remains Phase 8/9.
const ALL_ARTIFACTS = ["refresh", "corpus", "cogito", "animus", "actus", ...INTERSECTION_KEYS, "synthesis"];
const STAGE_INPUTS = {
  [QUALIFICATION_KEY]: ["blueprint", ...ALL_ARTIFACTS],
  refresh: [],
  corpus: ["refresh"],
  cogito: ["refresh", "corpus"],
  animus: ["refresh", "corpus", "cogito"],
  actus: ["refresh", "corpus", "cogito", "animus"],
  synthesis: [...INTERSECTION_KEYS],
  blueprint: ALL_ARTIFACTS,
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
  if (stageKey === "blueprint" && MODE_PROFILES[mode]?.stages.includes("synthesis")) return ["synthesis"];
  return [];
};

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

// ── Derived context from earlier stages ──
const numbered = (items) => items.map((x, i) => `  ${i + 1}. ${x}`);
const claimLines = (claims) => claims.map(c => `  ${c.id} [${c.tag}]: ${c.text}`);

function domainContext(target, inp) {
  const parts = [];
  const constraints = inp.corpus?.constraints?.length ? ["CORPUS CONSTRAINTS", ...numbered(inp.corpus.constraints)] : [];

  if (target === "cogito" && inp.corpus) {
    const c = inp.corpus;
    parts.push("PRIOR DOMAIN CONTEXT: CORPUS (What I Am Made Of)");
    if (c.constraints?.length) parts.push("Hard Constraints:", ...numbered(c.constraints));
    if (c.feasibility_notes?.length) parts.push("Feasibility Notes:", ...c.feasibility_notes.map(x => `  • ${x}`));
    if (c.subdomains) {
      parts.push("Subdomain Expert Perspectives:");
      Object.entries(c.subdomains).forEach(([key, sub]) => {
        if (sub?.perspective) parts.push(`  ${key}: ${sub.perspective}`);
        (sub?.key_findings || []).forEach(f => parts.push(`    → ${f}`));
      });
    }
  }
  if (target === "animus") {
    parts.push(...constraints);
    if (inp.cogito) {
      parts.push("COGITO CLAIMS (for ethical review)", ...claimLines(inp.cogito.claims || []));
      if (inp.cogito.causal_chains?.length) parts.push("Causal Chains:", ...inp.cogito.causal_chains.map(cc => `  ${cc.cause} → ${cc.effect} [${cc.confidence}]`));
    }
  }
  if (target === "actus") {
    if (inp.cogito?.claims?.length) parts.push("COGITO CLAIMS (for confidence propagation)", ...claimLines(inp.cogito.claims));
    if (inp.animus) {
      const a = inp.animus;
      parts.push("ANIMUS BOUNDARIES");
      if (a.ethical_stance) parts.push(`  Ethical Stance: ${a.ethical_stance}`);
      (a.boundary_checks || []).forEach(b => parts.push(`  Boundary: ${b}`));
      (a.disallowed_moves || []).forEach(d => parts.push(`  DISALLOWED: ${d}`));
    }
    parts.push(...constraints);
  }
  if (target === "blueprint") {
    // Every item below is shown with the handle a step cites in derived_from.
    const pairs = PAIRS.filter(p => inp[intersectionKey(p.id)]);
    if (pairs.length) {
      parts.push("CROSS-DOMAIN SYNTHESIS INSIGHTS (The Nexus) — emergent wisdom from domain intersections, full fidelity:");
      pairs.forEach(p => {
        const data = inp[intersectionKey(p.id)];
        parts.push(`  ▸ [${p.id}] ${pairLabel(p)}`);
        if (data.insight) parts.push(`    Insight: ${data.insight}`);
        if (data.tension) parts.push(`    Tension: ${data.tension}`);
        if (data.resolution) parts.push(`    Resolution: ${data.resolution}`);
      });
    }
    if (inp.actus?.recommendations?.length) {
      parts.push("ACTUS: Key Recommendations (confidence-propagated)", ...inp.actus.recommendations.map(r => `  ${r.id} [${r.inherited_confidence}/${r.probability}]: ${r.text}`));
    }
    const sp = inp.actus?.strategic_plan;
    if (sp?.immediate_horizon) parts.push(`  Immediate Horizon: ${sp.immediate_horizon}`);
    if (sp?.long_term_horizon) parts.push(`  Long-term Horizon: ${sp.long_term_horizon}`);
    const patterns = PATTERNS.filter(p => inp.synthesis?.[p.id]);
    if (patterns.length) {
      parts.push("FORMAL EMERGENT PATTERNS");
      patterns.forEach(p => parts.push(`  ▸ [pattern:${p.id}] ${p.name}`, ...p.fields.filter(f => inp.synthesis[p.id][f]).map(f => `    ${f}: ${[].concat(inp.synthesis[p.id][f]).join(" | ")}`)));
    }
    if (inp.cogito?.claims?.length) parts.push("COGITO: Claims (handle = claim id)", ...claimLines(inp.cogito.claims));
    if (inp.corpus?.constraints?.length) parts.push("CORPUS: Hard Constraints (non-negotiable)", ...inp.corpus.constraints.map((x, i) => `  corpus:${i + 1} — ${x}`));
    if (inp.animus?.ethical_stance) parts.push("ANIMUS: Ethical Stance", `  ${inp.animus.ethical_stance}`);
    if (inp.animus?.boundary_checks?.length) parts.push("ANIMUS: Boundaries", ...inp.animus.boundary_checks.map((x, i) => `  animus:${i + 1} — ${x}`));
  }
  return parts.join("\n");
}

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
    : s.type === "array" ? (s.items?.type === "object" ? "a list of objects" : "a list of text values (an array of strings, never one string)")
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
  corpus: `Output ONLY valid JSON with the "corpus" key: { "corpus": { "constraints": ["hard reality constraints from your expert assessment"], "feasibility_notes": ["practical viability notes"]${subs("corpus")} } }`,
  cogito: `Output ONLY valid JSON with the "cogito" key: { "cogito": { "claims": [{"id":"C1","tag":"Established","text":"your epistemic finding","depends_on":[],"sources":["a document, material or body of evidence this claim draws on, by name"],"why_believed":"justified basis","falsifiable_by":"what would disprove this","verify_later":"what to check"}], "reasoning_map": ["logical chain step 1", "step 2", "..."], "graphrag_connections": ["concept A ↔ concept B: relationship"], "causal_chains": [{"cause":"...","effect":"...","confidence":"Established"}], "neuro_symbolic_insights": ["insights from bridging symbolic and connectionist reasoning"]${subs("cogito")} } }`,
  animus: `Output ONLY valid JSON with the "animus" key: { "animus": { "boundary_checks": ["what the user should/should not do"], "disallowed_moves": ["explicitly forbidden approaches"], "safety_notes": ["safety considerations"], "consciousness_boundary": "where agency and autonomy limits lie", "attractor_states": ["natural equilibrium points the system tends toward"], "ethical_stance": "your integrated moral assessment", "risk_analysis": {"cognitive_sync_assessment": "how well-aligned are the goals", "self_determination_factors": ["factors affecting autonomy"], "misalignment_risks": ["where intent and outcome may diverge"]}${subs("animus")} } }`,
  actus: `CONFIDENCE PROPAGATION LAW (NON-NEGOTIABLE): Every recommendation MUST inherit the LOWEST confidence tag of the Cogito claims it depends on. A recommendation depending on a "Speculative" claim CANNOT be marked "Established".

Output ONLY valid JSON with the "actus" key: { "actus": { "recommendations": [{"id":"R1","text":"actionable recommendation","depends_on_claims":["C1"],"inherited_confidence":"Established","probability":"high","failure_modes":["what could go wrong"],"next_actions":["immediate next step"]}], "strategic_plan": {"immediate_horizon":"next 1-4 weeks","long_term_horizon":"3-12 months","key_decision_points":["decisions that must be made"]}, "game_theory_analysis": {"game_board":"who are the players and what are the stakes","nash_equilibrium":"stable outcome if all act rationally","zero_sum_assessment":"is this zero-sum or positive-sum","coalition_dynamics":["potential alliances and conflicts"]}, "technical_summary": "lossless compression of the entire analysis into one paragraph", "behavioral_factors": {"irrational_actors":["who might act irrationally and why"],"identity_economics":"how identity shapes economic decisions here","bias_mitigations":["specific debiasing strategies"]}, "integration_contracts": ["API/interface agreements needed"], "iteration_model": {"value_stream":"how value flows through the system","adaptation_triggers":["signals that should trigger strategy change"]}${subs("actus")} } }`,
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

Analyze the operator's query (data block "query") through your unified expert perspective. Think FROM INSIDE your expertise — do not summarize textbook knowledge, produce findings that reflect genuine mastery. Push beyond conventional wisdom. If the physics and math support a novel approach, precedent is irrelevant.`,
  context: domainContext(domain, inp),
  untrusted: refreshEvidence(inp.refresh, domain),
  contract: domainContract(domain, config.executionMode),
});

const SPECS = {
  refresh: (config, inp, evidence) => {
    if (!config.refreshEnabled) return {
      parseKey: "refresh", title: "DOMAIN: REFRESH (Zero-Day Patch)",
      instructions: `You are the Janus Refresh Module. Internet access is DISABLED by the operator.
You MUST NOT claim to have searched the internet. Be honest: your knowledge comes from training data only.
Declare what you WOULD search for if internet access were enabled.`,
      contract: `Output ONLY valid JSON: { "refresh": { "mode": "tier0", "attempted": false, "limitations": "Analysis based on training data only — no live internet sweep performed. Training data may be outdated.", "would_refresh": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"], "training_data_cutoff_note": "State your approximate training data cutoff date" } }`,
    };
    // Target architecture: provider-neutral retrieval → provenance-bearing source corpus → analysis.
    // No retrieval provider exists yet, so there is no corpus and this fails closed.
    if (!evidence.length) throw new Error(REFRESH_UNAVAILABLE_MESSAGE);
    return {
      parseKey: "refresh", title: "DOMAIN: REFRESH (Zero-Day Patch) — SOURCE CORPUS ANALYSIS",
      instructions: `You are the Janus Refresh Module. You have NO internet access. A retrieved source corpus is supplied as untrusted evidence records (ids E1…En).
For EACH of the ${allSubdomains().length} subdomains below, report what the corpus establishes that is current and relevant to the operator's query, citing evidence ids. Where the corpus establishes nothing strong enough, write exactly "no sufficiently strong current update established". Never state anything as retrieved that is not in the corpus.

${REFRESH_ROSTER()}`,
      untrusted: evidence, untrustedLabel: "retrieved_source_corpus",
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

CRITICAL: Every named pattern must produce EMERGENT insight — wisdom that transcends any single intersection pair. If it could come from one pair alone, it fails. Push past convention — novel problems require novel solutions.`,
    context: PAIRS.map(p => {
      const v = inp[intersectionKey(p.id)] || {};
      return `${p.id.toUpperCase()} — ${p.resolution_label}\nInsight: ${v.insight || "(not computed)"}\nTension: ${v.tension || "(not computed)"}\nResolution: ${v.resolution || "(not computed)"}`;
    }).join("\n\n"),
    contract: `Output ONLY valid JSON: { "synthesis": {
  "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...",
${patternJsonTemplate()}
} }

IMPORTANT: Do NOT include an intersection_matrix field — the pre-computed pairs are already stored separately.`,
  }),
  blueprint: (config, inp) => {
    const { blueprintLevel: lvl, noveltyDial: nov, outputMode } = config;
    const minAlt = Math.max(MODE_EXPECTATIONS[config.executionMode]?.min_alternatives ?? 0, nov === "high" ? 3 : 0);
    return {
      parseKey: "blueprint", title: "DOMAIN: BLUEPRINT (Executable Deliverable)",
      instructions: `You are the Janus Blueprint Module — the culmination of a multi-domain cognitive architecture.
Your task: produce a concrete, executable plan that synthesizes ALL prior domain expertise into actionable wisdom.
Level: ${lvl} | Novelty: ${nov} | Output Mode: ${outputMode}.
${minAlt ? `alternative_approaches REQUIRED: at least ${minAlt} serious, materially different alternative${minAlt === 1 ? "" : "s"}, each with name, pros, cons, why_not_chosen.` : ""}

CRITICAL DIRECTIVES:
1. Every step must be traceable to the synthesis insights and domain constraints supplied as prior stage outputs.
2. The blueprint must respect Animus ethical boundaries.
3. If the physics and math check out, precedent does not matter. This protocol exists to find solutions that conventional thinking misses.
4. Blueprints must be answers of WISDOM — highest probability paths to genuinely achieving the stated goal, even if unheard of.
5. Complexity yields emergent behaviors. Do not oversimplify. The depth of the prior analysis IS the competitive advantage.
6. TRACEABILITY (checked by code): every step lists in derived_from the handles of the prior material it is built on, exactly as they appear in the prior stage outputs — claim ids, recommendation ids, corpus:<n>, animus:<n>, intersection ids shown in brackets, pattern:<id>. Never invent a handle.
7. CONFIDENCE (checked by code): every step carries confidence — the LOWEST confidence among the claims and recommendations it rests on (Established, Contested or Speculative). Never label a step stronger than its weakest support.`,
      context: domainContext("blueprint", inp),
      untrusted: refreshEvidence(inp.refresh, "blueprint"),
      contract: `Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], ${minAlt ? '"alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], ' : ""}"steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[],"derived_from":["C1","corpus:1"],"confidence":"Contested"${lvl !== "L1" ? ',"time_estimate":"...","effort_level":"medium"' : ""}${lvl === "L2" || lvl === "L3" ? ',"substeps":[{"substep":"1a","details":"..."}]' : ""}${lvl === "L3" ? ',"checklist":["..."],"acceptance_tests":["..."]' : ""}}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }

${typeLegend("blueprint")}`,
    };
  },
};

// Independent evaluation: a separate call that never sees the generator's instructions or its self-assessment.
SPECS[QUALIFICATION_KEY] = (config, inp) => {
  const critique = QUALITY_CRITERIA.filter(c => c.method === "critique" && criterionApplies(c));
  const expect = MODE_EXPECTATIONS[config.executionMode] || {};
  const matrix = Object.fromEntries(PAIRS.filter(p => inp[intersectionKey(p.id)]).map(p => [p.id, inp[intersectionKey(p.id)]]));
  return {
    parseKey: QUALIFICATION_KEY, title: "QUALITY QUALIFICATION — INDEPENDENT EVALUATION", untruncated: true,
    instructions: `You are the Janus Quality Evaluator. You did NOT write the Blueprint in the data block and you owe it nothing.
Your task is to decide whether it deserves release, by trying to find where it fails. A Blueprint that is merely well-formed, generic, safe or plausible FAILS. Do not reward length or confident wording.

Judge each criterion below separately, against the Blueprint and the upstream material it was built from. For each one answer exactly "pass" or "fail" and state the specific evidence. There is no "not applicable" and no partial credit: when in doubt, fail.
Mode: ${config.executionMode || "unspecified"} — expected at least ${expect.min_alternatives ?? 0} serious alternative(s) and ${expect.min_non_obvious_insights ?? 1} non-obvious insight(s).

CRITERIA:
${critique.map((c, i) => `${i + 1}. ${c.id} — ${c.standard}`).join("\n")}`,
    context: JSON.stringify({
      blueprint: inp.blueprint, corpus_constraints: inp.corpus?.constraints, cogito_claims: inp.cogito?.claims,
      animus: inp.animus && { boundary_checks: inp.animus.boundary_checks, disallowed_moves: inp.animus.disallowed_moves, ethical_stance: inp.animus.ethical_stance },
      actus_recommendations: inp.actus?.recommendations, intersections: matrix, synthesis: inp.synthesis,
    }, null, 1),
    contract: `Output ONLY valid JSON: { "${QUALIFICATION_KEY}": { "verdicts": { ${critique.map(c => `"${c.id}": {"verdict":"pass or fail","reason":"specific evidence"}`).join(", ")} }, "strongest_objection": "the best argument against releasing this Blueprint" } }`,
  };
};

function intersectionSpec(pair, inp) {
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

If the physics and math check out, precedent doesn't matter. Novel problems require novel solutions. Push past conventional thinking — if there's a non-obvious path that has higher probability of achieving the goal, NAME IT even if it's unheard of.`,
    context: `${side("A", a)}\n\n${side("B", b)}`,
    contract: `Output ONLY valid JSON: { "${pair.id}": { "insight": "the emergent wisdom that lives at this intersection", "tension": "where these two domains pull in different directions", "resolution": "how the tension resolves into something greater than either domain" } }`,
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
export function compileStage({ stageKey, config, inputs = {}, evidence = [] }) {
  const pair = pairOf(stageKey);
  if (!pair && !SPECS[stageKey]) throw new Error(`Unknown stage key: ${stageKey}`);
  const spec = pair ? intersectionSpec(pair, inputs) : SPECS[stageKey](config, inputs, evidence);
  const sealed = sealEvidence(spec.untrusted || []);
  const blocks = [
    ...(sealed.length ? [renderEvidenceBlock(sealed, spec.untrustedLabel || "refresh_derived_evidence")] : []),
    ...(spec.context ? [renderDataBlock(PLANES.derived, "prior_stage_outputs", spec.context)] : []),
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
    sources: sealed.map(({ text: _text, ...meta }) => meta),
  };
}