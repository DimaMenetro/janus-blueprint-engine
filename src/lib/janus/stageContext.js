/**
 * JANUS COGNITIVE INHERITANCE — what each stage is given of the cognition before it (pure, no I/O).
 * The compiler (stageCompiler) is still the only place a prompt is built; this file is the part of it that decides
 * what upstream reasoning a stage reads. CP-002 §8.1: "each domain receives accumulated output of all prior
 * domains"; §8.2 names the minimum of each block. The live CCT run showed what a thinner reading costs: the
 * patterns stage never saw the mechanisms its own pairs had produced, and the Blueprint never saw the subdomain
 * findings, the reasoning behind a claim, the game board or the behavioural model.
 *
 * RULE: a stage reads the artifacts it declares IN FULL, as meaning (never a slice, never an id alone). Every field
 * an artifact holds is rendered: the known ones in a fixed order under the handles later stages cite, anything else
 * under its own name, so a field added to a domain's contract reaches its consumers without a change here.
 */
import { PAIRS, PATTERNS, DOMAINS, getSubdomains, readSubdomain, pairLabel } from "@/lib/janus/protocolRegistry";
import { intersectionKey } from "@/lib/janus/stageModel";
import { enforceConfidencePropagation } from "@/lib/janus/lifecycleContract";

const said = (v) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "" && !(typeof v === "object" && !Object.keys(v).length));
const label = (k) => String(k).replace(/_/g, " ");
/** One value as text: a list joined, an object as "field: value" pairs. Nothing is cut. */
export function show(v) {
  if (Array.isArray(v)) return v.map(show).filter(Boolean).join(" | ");
  if (v && typeof v === "object") return Object.entries(v).filter(([, x]) => said(x)).map(([k, x]) => `${label(k)}: ${show(x)}`).join("; ");
  return v === null || v === undefined ? "" : String(v);
}
const bullets = (title, items, mark = "•") => (said(items) ? [title, ...items.map(x => `  ${mark} ${show(x)}`)] : []);
const field = (title, v) => (said(v) ? [`${title}: ${show(v)}`] : []);
/** Whatever `obj` holds beyond `known`, each under its own name. */
const rest = (obj, known) => Object.entries(obj || {}).filter(([k, v]) => !known.includes(k) && said(v))
  .flatMap(([k, v]) => (Array.isArray(v) ? bullets(`${label(k)}:`, v) : field(label(k), v)));

function subdomainLines(domain, artifact) {
  if (!artifact?.subdomains) return [];
  const lines = getSubdomains(domain).flatMap(({ id, name }) => {
    const s = readSubdomain(artifact.subdomains, id);
    if (!said(s)) return [];
    return [`  ${name}: ${s.perspective || ""}`, ...(s.key_findings || []).map(f => `    → ${f}`), ...rest(s, ["perspective", "key_findings"]).map(l => `    ${l}`)];
  });
  return lines.length ? [`${DOMAINS[domain].label.toUpperCase()}: Subdomain findings`, ...lines] : [];
}

function corpusBlock(c) {
  if (!c) return [];
  return [
    ...(said(c.constraints) ? ["CORPUS: Hard Constraints (non-negotiable)", ...c.constraints.map((x, i) => `  corpus:${i + 1} — ${x}`)] : []),
    ...bullets("CORPUS: Feasibility Notes", c.feasibility_notes),
    ...bullets("CORPUS: Mechanisms (how the substrate actually works)", c.mechanisms),
    ...field("CORPUS: System model", c.system_model),
    ...bullets("CORPUS: Enabling dependencies (what must exist or be discovered)", c.enabling_dependencies),
    ...subdomainLines("corpus", c),
    ...rest(c, ["constraints", "feasibility_notes", "mechanisms", "system_model", "enabling_dependencies", "subdomains"]).map(l => `CORPUS: ${l}`),
  ];
}

function cogitoBlock(g) {
  if (!g) return [];
  const claims = (g.claims || []).flatMap(c => [
    `  ${c.id} [${c.tag}]: ${c.text}`,
    ...(said(c.depends_on) ? [`    rests on: ${c.depends_on.join(", ")}`] : []),
    ...(c.why_believed ? [`    believed because: ${c.why_believed}`] : []),
    ...(c.falsifiable_by ? [`    falsifiable by: ${c.falsifiable_by}`] : []),
    ...(c.verify_later ? [`    still to verify: ${c.verify_later}`] : []),
    ...rest(c, ["id", "tag", "text", "depends_on", "why_believed", "falsifiable_by", "verify_later"]).map(l => `    ${l}`),
  ]);
  return [
    ...(claims.length ? ["COGITO: Claims (handle = claim id)", ...claims] : []),
    ...bullets("COGITO: Reasoning Map", g.reasoning_map),
    ...bullets("COGITO: Causal Chains", (g.causal_chains || []).map(cc => `${cc.cause} → ${cc.effect} [${cc.confidence}]${cc.mechanism ? ` via ${cc.mechanism}` : ""}`)),
    ...bullets("COGITO: Conceptual connections", g.graphrag_connections),
    ...bullets("COGITO: Neuro-symbolic insights", g.neuro_symbolic_insights),
    ...bullets("COGITO: Hypotheses (status as labelled)", g.hypotheses),
    ...bullets("COGITO: Formal models", g.formal_models),
    ...bullets("COGITO: Associative leaps", g.associative_leaps),
    ...bullets("COGITO: Open questions", g.open_questions),
    ...subdomainLines("cogito", g),
    ...rest(g, ["claims", "reasoning_map", "causal_chains", "graphrag_connections", "neuro_symbolic_insights", "hypotheses", "formal_models", "associative_leaps", "open_questions", "subdomains"]).map(l => `COGITO: ${l}`),
  ];
}

function animusBlock(a) {
  if (!a) return [];
  return [
    ...(a.ethical_stance ? ["ANIMUS: Ethical Stance", `  ${a.ethical_stance}`] : []),
    ...(said(a.boundary_checks) ? ["ANIMUS: Boundaries", ...a.boundary_checks.map((x, i) => `  animus:${i + 1} — ${x}`)] : []),
    ...bullets("ANIMUS: Disallowed Moves", a.disallowed_moves, "✕"),
    ...bullets("ANIMUS: Affirmed pursuits (what the objective is right to pursue)", a.affirmed_pursuits),
    ...field("ANIMUS: Intent model", a.intent_model),
    ...bullets("ANIMUS: Moral reasoning", a.moral_reasoning),
    ...bullets("ANIMUS: Safety Notes", a.safety_notes),
    ...field("ANIMUS: Consciousness boundary", a.consciousness_boundary),
    ...bullets("ANIMUS: Attractor states", a.attractor_states),
    ...bullets("ANIMUS: Misalignment Risks", a.risk_analysis?.misalignment_risks),
    ...field("ANIMUS: Cognitive synchronization", a.risk_analysis?.cognitive_sync_assessment),
    ...bullets("ANIMUS: Self-determination factors", a.risk_analysis?.self_determination_factors),
    ...bullets("ANIMUS: Stakeholders", a.stakeholders),
    ...subdomainLines("animus", a),
    ...rest(a, ["ethical_stance", "boundary_checks", "disallowed_moves", "affirmed_pursuits", "intent_model", "moral_reasoning", "safety_notes", "consciousness_boundary",
      "attractor_states", "risk_analysis", "stakeholders", "subdomains"]).map(l => `ANIMUS: ${l}`),
  ];
}

/**
 * Actus, with each recommendation at the confidence CODE gives it (Confidence Propagation Law): the weakest tag of
 * the Cogito claims it rests on, from the exact Cogito artifact supplied. A later stage never reads a label the
 * law would have corrected.
 */
function actusBlock(a, cogito) {
  if (!a) return [];
  const enforced = cogito?.claims ? enforceConfidencePropagation(cogito.claims, a.recommendations || []) : { recommendations: a.recommendations || [], corrections: [] };
  const corrected = new Set(enforced.corrections.map(c => c.id));
  const recs = enforced.recommendations.flatMap(r => [
    `  ${r.id} [${r.inherited_confidence}/${r.probability}]${corrected.has(r.id) ? " (confidence set by code from its claims)" : ""}: ${r.text}`,
    ...(said(r.depends_on_claims) ? [`    rests on: ${r.depends_on_claims.join(", ")}`] : []),
    ...(said(r.failure_modes) ? [`    failure modes: ${r.failure_modes.join(" | ")}`] : []),
    ...(said(r.next_actions) ? [`    next actions: ${r.next_actions.join(" | ")}`] : []),
    ...rest(r, ["id", "text", "depends_on_claims", "inherited_confidence", "probability", "failure_modes", "next_actions"]).map(l => `    ${l}`),
  ]);
  const sp = a.strategic_plan || {};
  return [
    ...(recs.length ? ["ACTUS: Key Recommendations (confidence-propagated)", ...recs] : []),
    ...field("ACTUS: Immediate Horizon", sp.immediate_horizon),
    ...field("ACTUS: Long-term Horizon", sp.long_term_horizon),
    ...bullets("ACTUS: Decision Points", sp.key_decision_points),
    ...field("ACTUS: Game theory", a.game_theory_analysis),
    ...field("ACTUS: Behavioural factors", a.behavioral_factors),
    ...bullets("ACTUS: Strategic branches", a.strategic_branches),
    ...bullets("ACTUS: Enabling work", a.enabling_work),
    ...bullets("ACTUS: Integration Contracts", a.integration_contracts),
    ...field("ACTUS: Iteration model", a.iteration_model),
    ...field("ACTUS: Technical summary", a.technical_summary),
    ...subdomainLines("actus", a),
    ...rest(a, ["recommendations", "strategic_plan", "game_theory_analysis", "behavioral_factors", "strategic_branches", "enabling_work", "integration_contracts",
      "iteration_model", "technical_summary", "subdomains"]).map(l => `ACTUS: ${l}`),
  ];
}

const PAIR_ORDER = ["insight", "tension", "resolution", "mechanism", "consequence", "formalization", "epistemic_status"];
/** One pair intersection in full: the three canonical fields, its mechanism, and anything else it produced. */
export function pairLines(pair, v = {}, indent = "") {
  return [
    ...PAIR_ORDER.filter(f => said(v[f])).map(f => `${indent}${label(f).replace(/^./, c => c.toUpperCase())}: ${show(v[f])}`),
    ...rest(v, PAIR_ORDER).map(l => `${indent}${l}`),
  ];
}

function nexusBlock(inp) {
  const parts = [];
  const pairs = PAIRS.filter(p => inp[intersectionKey(p.id)]);
  if (pairs.length) {
    parts.push("CROSS-DOMAIN SYNTHESIS INSIGHTS (The Nexus) — emergent wisdom from domain intersections, full fidelity:");
    pairs.forEach(p => parts.push(`  ▸ [${p.id}] ${pairLabel(p)}`, ...pairLines(p, inp[intersectionKey(p.id)], "    ")));
  }
  const syn = inp.synthesis;
  if (!syn) return parts;
  parts.push(...bullets("SYNTHESIS: Key Takeaways", syn.key_takeaways));
  parts.push(...bullets("SYNTHESIS: Constraint Collisions (conflicts between findings that remain open)", syn.constraint_collisions));
  if (syn.limitation_foreground) parts.push(`SYNTHESIS: Foreground Limitation — ${syn.limitation_foreground}`);
  const patterns = PATTERNS.filter(p => syn[p.id]);
  if (patterns.length) {
    parts.push("FORMAL EMERGENT PATTERNS");
    patterns.forEach(p => parts.push(`  ▸ [pattern:${p.id}] ${p.name}`,
      ...p.fields.filter(f => said(syn[p.id][f])).map(f => `    ${f}: ${show(syn[p.id][f])}`), ...rest(syn[p.id], p.fields).map(l => `    ${l}`)));
  }
  return parts;
}

/**
 * The derived context of `target`. Order within the Blueprint ledger: the Nexus first (what emerged), then the
 * action faculty, the reasoning, the substrate and the conscience it must respect.
 */
export function domainContext(target, inp) {
  const parts = [];
  if (target === "cogito" && inp.corpus) parts.push("PRIOR DOMAIN CONTEXT: CORPUS (What I Am Made Of)", ...corpusBlock(inp.corpus));
  if (target === "animus") parts.push(...corpusBlock(inp.corpus), ...cogitoBlock(inp.cogito));
  if (target === "actus") parts.push(...cogitoBlock(inp.cogito), ...animusBlock(inp.animus), ...corpusBlock(inp.corpus));
  if (target === "blueprint") parts.push(...nexusBlock(inp), ...actusBlock(inp.actus, inp.cogito), ...cogitoBlock(inp.cogito), ...corpusBlock(inp.corpus), ...animusBlock(inp.animus));
  return parts.join("\n");
}