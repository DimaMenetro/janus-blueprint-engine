/**
 * JANUS LIFECYCLE, COMPLETION & QUALITY CONTRACT — Phase 2 specification (executable).
 * Pure functions over a neutral artifact bag { refresh, corpus, cogito, animus, actus, synthesis, blueprint }.
 * Independent of the persisted Run shape so it survives the Phase 3 stage model.
 * Wired into the engine in Phase 5 through `qualification.js` (completion + qualification against the stage model).
 */
import { MODE_PROFILES, PAIRS, PATTERNS, CONFIDENCE_TAXONOMY, CONFIDENCE_NORMALIZATION,
  lowestConfidence, subdomainIds, DOMAIN_ORDER } from "@/lib/janus/protocolRegistry";

// ── 1. LIFECYCLE (persisted run status) ────────────────────────────
export const LIFECYCLE_STATES = ["queued", "running", "validating", "completed", "failed", "partial", "cancel_requested", "cancelled"];
export const TERMINAL_STATES = ["completed", "failed", "partial", "cancelled"];
export const TRANSITIONS = {
  queued: ["running", "cancel_requested", "cancelled"],
  running: ["validating", "failed", "partial", "cancel_requested"],
  validating: ["completed", "running", "failed", "partial", "cancel_requested"], // → running = regenerate an invalid stage
  cancel_requested: ["cancelled"], // only at a safe stage boundary, after the live call settles (§12.4)
  completed: [], failed: [], partial: [], cancelled: [], // reruns create a new revision (Phase 7), never a transition
};
/** UI-only progress labels — never persisted as lifecycle status. */
export const UI_ONLY_LABELS = ["starting", "finalizing"];
export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

// ── 2. QUALIFICATION (separate axis; only after lifecycle = completed) ──
export const QUALIFICATION_STATES = ["not_started", "qualifying", "qualified", "refinement_required", "limitation_reported"];
export const QUALIFICATION_TRANSITIONS = {
  not_started: ["qualifying"],
  qualifying: ["qualified", "refinement_required", "limitation_reported"],
  refinement_required: ["qualifying", "limitation_reported"],
  qualified: [], limitation_reported: [],
};
export const MAX_REFINEMENT_CYCLES = 2; // then limitation_reported
export const JANUS_QUALIFIED = "JANUS-QUALIFIED";

/**
 * Release rule (corrected 2026-10-30): only a JANUS-QUALIFIED Blueprint becomes the released Final Blueprint.
 * JSON validity alone never releases. A Blueprint that fails the constitution after refinement stays
 * inspectable and exportable, always under its unreleased label — it is never quietly promoted.
 */
export const RELEASE_LABELS = {
  released: JANUS_QUALIFIED,
  candidate: "Protocol-complete candidate — awaiting qualification · not released",
  unqualified: "Unqualified — failed the quality constitution after refinement · not released, not JANUS-QUALIFIED",
  incomplete: "Incomplete run — not a release candidate",
};
export function releaseDecision(lifecycle, qualification) {
  const status = lifecycle !== "completed" ? "incomplete"
    : qualification === "qualified" ? "released"
    : qualification === "limitation_reported" ? "unqualified"
    : "candidate";
  return { released: status === "released", status, label: RELEASE_LABELS[status], inspectable: true, exportable: true };
}

// ── 3. FAILURE / RETRY POLICY (§12) ────────────────────────────────
export const FAILURE_EVIDENCE = ["provider_error", "transport_settled_failure", "platform_termination",
  "parse_failure", "schema_failure", "quota_failure", "operator_cancellation"];
export const RETRY_POLICY = {
  max_attempts_per_stage: 3,
  retryable: ["provider_error", "transport_settled_failure", "parse_failure", "schema_failure"],
  requires_settled_prior_attempt: true, // never race a live provider promise
  local_inference_deadline: null,       // elapsed time is telemetry, not failure
  heartbeat_is_failure_evidence: false,
};
/**
 * What happens after an attempt has SETTLED with `outcome` as attempt number `attemptNumber`.
 * Only retryable evidence is retried, and only up to the bound. Quota and platform termination never are.
 */
export function retryDecision(outcome, attemptNumber) {
  if (!RETRY_POLICY.retryable.includes(outcome)) return "none";
  return attemptNumber >= RETRY_POLICY.max_attempts_per_stage ? "exhausted" : "retry_scheduled";
}
/** Terminal run outcome after a stage exhausts retries: successful artifacts are preserved. */
export const outcomeAfterStageFailure = (validStageCount) => (validStageCount > 0 ? "partial" : "failed");

// ── 4. CONFIDENCE PROPAGATION (§5.5 — deterministic, code is the authority) ──
export const normalizeTag = (t) => CONFIDENCE_NORMALIZATION[t] || t;

export function enforceConfidencePropagation(claims = [], recommendations = []) {
  const byId = Object.fromEntries(claims.map(c => [c.id, normalizeTag(c.tag)]));
  const corrections = [], errors = [];
  const out = recommendations.map(r => {
    const deps = (r.depends_on_claims || []).filter(id => byId[id]);
    if (!deps.length) { errors.push(`${r.id}: no resolvable Cogito dependency — confidence ceiling unknown`); return r; }
    const ceiling = lowestConfidence(deps.map(id => byId[id]));
    if (normalizeTag(r.inherited_confidence) !== ceiling) corrections.push({ id: r.id, from: r.inherited_confidence ?? null, to: ceiling });
    return { ...r, inherited_confidence: ceiling };
  });
  return { recommendations: out, corrections, errors };
}

// ── 5. STRUCTURAL VALIDITY per stage ───────────────────────────────
const nonEmpty = (a) => Array.isArray(a) && a.length > 0;
const missingSubdomains = (obj, domain) => subdomainIds(domain).filter(id => !obj?.subdomains?.[id]);

// ── 5a. FINAL SYNTHESIS (plan §14 steps 9–11) — ONE definition ──────
// The stage validator (stageRunner.validateStageOutput) and the completion manifest below both read these.
/** A value that says something: a string with at least one letter or digit. "", " " and "..." do not. */
export const meaningful = (s) => typeof s === "string" && /[\p{L}\p{N}]/u.test(s);
const filled = (v) => (Array.isArray(v) ? v.length > 0 && v.every(meaningful) : meaningful(v));
/** The four formal emergent patterns: every pattern and every field the registry declares, each with content. */
export const patternErrors = (patterns) =>
  PATTERNS.flatMap(p => p.fields.filter(f => !filled(patterns?.[p.id]?.[f])).map(f => `pattern ${p.id}.${f} missing`));
/**
 * What the patterns stage must return to be a valid FINAL Synthesis: the four formal patterns plus the three
 * synthesis-level outputs. "None found" and "not produced" are different states: constraint_collisions may be an
 * empty list, but it may not be absent. Field types are the schema's (janusSchema); this is presence and content.
 */
export function finalSynthesisErrors(output) {
  const e = patternErrors(output);
  const list = (name, emptyIsValid) => {
    const v = output?.[name];
    if (v === undefined || v === null) { e.push(`${name} missing${emptyIsValid ? " (an empty list is valid, absence is not)" : ""}`); return; }
    if (!Array.isArray(v)) { e.push(`${name} must be a list`); return; }
    if (!v.length && !emptyIsValid) e.push(`${name} empty`);
    v.forEach((x, i) => { if (!meaningful(x)) e.push(`${name}[${i}] is not a meaningful entry`); });
  };
  list("key_takeaways", false);
  list("constraint_collisions", true);
  if (!meaningful(output?.limitation_foreground)) e.push("limitation_foreground missing");
  return e;
}

// ── 5b. STAGE INTEGRITY — ONE definition, applied at three boundaries ──────────────────────────────
// What must hold BEFORE any later stage reads an artifact: structure a later stage relies on and references that
// must resolve. The same function is applied
//   - when a stage settles (stageRunner.validateStageOutput): a violation is invalid mandatory output
//     (schema_failure, bounded retry with the violations named), never successful cognition;
//   - when a stage is about to be read as an input (stageEngine.executeStage): a revision recorded under an
//     earlier validator that fails it today is not consumed;
//   - at completion (qualification.completionOf, and the validators below): so the three can never disagree.
// Field TYPES stay the schema's (janusSchema). Completion-only requirements (the explicit subdomain sets of a Full
// run, the mode's minimum alternatives, an anchored recommendation) stay below, in STAGE_VALIDATORS.
// `inputs` maps stage key → the output this artifact was built from; a cross-artifact reference is checked only
// when the artifact it points into is supplied.
const noList = (v) => v == null || (Array.isArray(v) && v.length === 0);
const list = (v) => (Array.isArray(v) ? v : []);
const duplicates = (ids) => [...new Set(ids.filter((id, i) => id && ids.indexOf(id) !== i))];
const INTEGRITY = {
  corpus: (a) => (noList(a?.constraints) ? ["corpus.constraints empty"] : []),
  cogito: (a) => {
    if (noList(a?.claims)) return ["cogito.claims empty"];
    const claims = list(a.claims), ids = new Set(claims.map(c => c?.id)), e = [];
    claims.forEach(c => {
      if (!c?.id || !c?.text) e.push("cogito claim missing id/text");
      // depends_on is the LOGICAL dependency between claims. A document or source name is provenance (claim.sources).
      list(c?.depends_on).forEach(d => { if (!ids.has(d)) e.push(`${c.id}: dangling depends_on ${d}`); });
    });
    duplicates(claims.map(c => c?.id)).forEach(id => e.push(`${id}: claim id used more than once`));
    return e;
  },
  animus: (a) => (noList(a?.boundary_checks) ? ["animus.boundary_checks empty"] : []),
  actus: (a, inputs) => {
    if (noList(a?.recommendations)) return ["actus.recommendations empty"];
    const recs = list(a.recommendations), e = [];
    duplicates(recs.map(r => r?.id)).forEach(id => e.push(`${id}: recommendation id used more than once`));
    const claims = inputs?.cogito?.claims;
    if (Array.isArray(claims)) {
      const ids = new Set(claims.map(c => c?.id));
      recs.forEach(r => list(r?.depends_on_claims).forEach(d => { if (!ids.has(d)) e.push(`${r.id}: depends_on_claims cites ${d}, which is not a Cogito claim id`); }));
    }
    return e;
  },
  synthesis: (a) => finalSynthesisErrors(a),
  blueprint: (a) => {
    if (!a?.goal) return ["blueprint.goal missing"];
    const e = [];
    if (noList(a.steps)) e.push("blueprint.steps empty");
    list(a.steps).forEach(s => { if (!s?.title || !s?.instructions || !s?.validation) e.push(`step ${s?.step}: title/instructions/validation required`); });
    if (noList(a.success_criteria)) e.push("blueprint.success_criteria empty");
    if (noList(a.risk_register)) e.push("blueprint.risk_register empty");
    return e;
  },
};
const PAIR_FIELDS = ["insight", "tension", "resolution"];
export function stageIntegrity(stageKey, output, { inputs } = {}) {
  if (String(stageKey).startsWith("intersection:")) return PAIR_FIELDS.filter(f => !output?.[f]).map(f => `${stageKey}.${f}: missing`);
  return INTEGRITY[stageKey] ? INTEGRITY[stageKey](output, inputs) : [];
}

export const STAGE_VALIDATORS = {
  refresh: (a, ctx) => {
    if (!a) return ["refresh artifact missing"];
    if (!ctx.refreshEnabled) return a.limitations ? [] : ["refresh off: limitations must be declared"];
    const e = [];
    if (!nonEmpty(a.sources)) e.push("refresh on: provenance-bearing sources required");
    const covered = new Set(Object.keys(a.subdomain_updates || {}));
    const miss = DOMAIN_ORDER.flatMap(d => subdomainIds(d)).filter(id => !covered.has(id));
    if (miss.length) e.push(`refresh on: uncovered subdomains (explicit "no sufficiently strong current update established" is valid): ${miss.join(", ")}`);
    return e;
  },
  // Each validator is the shared stage integrity (5b) plus what only completion requires. A value of the wrong TYPE
  // (a string where a list belongs) is the schema's finding at the stage; here it still reads as "empty".
  corpus: (a, ctx) => [
    ...(!nonEmpty(a?.constraints) ? ["corpus.constraints empty"] : INTEGRITY.corpus(a)),
    ...(ctx.full ? missingSubdomains(a, "corpus").map(id => `corpus subdomain missing: ${id}`) : []),
  ],
  cogito: (a, ctx) => {
    if (!nonEmpty(a?.claims)) return ["cogito.claims empty"];
    const e = INTEGRITY.cogito(a);
    a.claims.forEach(c => { if (!CONFIDENCE_TAXONOMY.includes(normalizeTag(c.tag))) e.push(`${c.id}: tag outside taxonomy (${c.tag})`); });
    if (ctx.full) e.push(...missingSubdomains(a, "cogito").map(id => `cogito subdomain missing: ${id}`));
    return e;
  },
  animus: (a, ctx) => [
    ...(!nonEmpty(a?.boundary_checks) ? ["animus.boundary_checks empty"] : INTEGRITY.animus(a)),
    ...(ctx.full ? missingSubdomains(a, "animus").map(id => `animus subdomain missing: ${id}`) : []),
  ],
  actus: (a, ctx) => [
    ...(!nonEmpty(a?.recommendations) ? ["actus.recommendations empty"] : INTEGRITY.actus(a, ctx.inputs)),
    ...(ctx.full ? missingSubdomains(a, "actus").map(id => `actus subdomain missing: ${id}`) : []),
  ],
  // The neutral bag names the six intersections and the four patterns apart. The synthesis-level outputs
  // (takeaways, collisions, limitation) live on the durable patterns revision and are held to the same
  // finalSynthesisErrors at completion through qualification.completionOf.
  synthesis: (a) => [
    ...PAIRS.filter(p => !a?.intersections?.[p.id]).map(p => `intersection missing: ${p.id}`),
    ...patternErrors(a?.emergent_patterns),
  ],
  blueprint: (a, ctx) => {
    const e = INTEGRITY.blueprint(a);
    if (!a?.goal) return e;
    const minAlt = MODE_EXPECTATIONS[ctx.mode]?.min_alternatives ?? 0;
    if ((a.alternative_approaches || []).length < minAlt) e.push(`blueprint needs ≥${minAlt} serious alternative approaches`);
    return e;
  },
};

// ── 6. COMPLETION MANIFEST (§11.2) ─────────────────────────────────
export function completionManifest(mode, artifacts, { refreshEnabled = false } = {}) {
  const profile = MODE_PROFILES[mode];
  if (!profile) throw new Error(`Unknown mode: ${mode}`);
  const ctx = { mode, full: !profile.partial, refreshEnabled, inputs: artifacts };
  const stages = profile.stages.map(s => ({ stage: s, errors: STAGE_VALIDATORS[s](artifacts[s], ctx) }));
  const blocking = stages.flatMap(s => s.errors.map(e => `${s.stage}: ${e}`));
  let confidence = { corrections: [], errors: [] };
  if (profile.stages.includes("actus") && artifacts.cogito && artifacts.actus) {
    confidence = enforceConfidencePropagation(artifacts.cogito.claims, artifacts.actus.recommendations);
    if (ctx.full) blocking.push(...confidence.errors.map(e => `confidence: ${e}`));
  }
  return {
    mode, partial: profile.partial, stages, blocking,
    confidence_corrections: confidence.corrections,
    warnings: ctx.full ? [] : confidence.errors,
    complete: blocking.length === 0,
    completion_label: blocking.length ? null : profile.partial ? `${profile.label} — complete for partial profile` : "Full Janus — protocol-complete candidate",
  };
}

// ── 7. QUALITY CONSTITUTION (§7.2) as executable qualification contract ──
// method: deterministic (code) | traceability (code over links) | critique (independent evaluation pass, never the generator)
// hard: always applicable — the evaluator may only answer pass or fail (corrected 2026-10-30).
// Applicability is decided by this contract from run context, never by the evaluator.
export const QUALITY_CRITERIA = [
  { id: "problem_understanding", method: "critique", hard: true, standard: "Identifies the real problem rather than paraphrasing the query." },
  { id: "cross_domain_necessity", method: "traceability", hard: true, standard: "The output materially depends on more than one Janus domain." },
  { id: "emergence", method: "traceability", hard: true, standard: "Important conclusions arise from intersections or synthesis." },
  { id: "non_obviousness", method: "critique", hard: true, standard: "Surfaces at least one substantive insight that is not obvious from the query." },
  { id: "disciplined_novelty", method: "critique", hard: true, standard: "Differentiated where it matters, without unsupported weirdness presented as novelty." },
  { id: "elegance", method: "critique", hard: true, standard: "Satisfies many constraints with minimal unnecessary machinery." },
  { id: "explanatory_compression", method: "critique", hard: true, standard: "Identifies unifying principles where they exist instead of listing disconnected advice." },
  { id: "evidence_discipline", method: "deterministic", hard: true, standard: "Confidence, falsifiability and verification requirements are preserved." },
  { id: "feasibility_without_domestication", method: "critique", hard: true, standard: "Constraints ground the ambition but do not collapse it into the easiest conventional answer." },
  { id: "implementation_depth", method: "deterministic", hard: true, standard: "Bridges insight to dependencies, inputs, outputs, validation, acceptance and risk." },
  { id: "adversarial_robustness", method: "critique", hard: true, standard: "The preferred solution survives a serious attempt to defeat it; its weakest points are named." },
  { id: "utility", method: "critique", hard: true, standard: "A competent builder or researcher would know what to do next." },
  { id: "intellectual_honesty", method: "traceability", hard: true, standard: "Speculative or contested material stays labelled as such." },
  // Comparison needs a matched historical reference (Phase 15 benchmark suite / operator-pinned reference).
  { id: "historical_no_regression", method: "critique", hard: false, applies_when: "benchmark_reference", standard: "Equals or outperforms the matched historical reference." },
];
/** The only applicability rules that exist. A criterion is not applicable only when its named rule says so. */
export const APPLICABILITY = {
  benchmark_reference: (ctx) => Boolean(ctx.benchmarkReferenceId),
};
export const criterionApplies = (criterion, ctx = {}) =>
  criterion.hard || Boolean(APPLICABILITY[criterion.applies_when]?.(ctx));

export const QUALIFICATION_RULES = {
  generator_self_assessment_counts: false,
  evaluator_verdicts: ["pass", "fail"],  // "not_applicable" is not an evaluator verdict
  applicability_decided_by: "contract",  // criterionApplies(); recorded on the qualification artifact
  invalid_verdict_outcome: "fail",       // any other verdict — including "not_applicable" — fails closed
  all_applicable_criteria_must_pass: true,
};

export function qualify(verdicts = {}, ctx = {}) {
  const r = { missing: [], failed: [], invalid: [], not_applicable: [] };
  for (const c of QUALITY_CRITERIA) {
    const v = verdicts[c.id];
    if (!criterionApplies(c, ctx)) r.not_applicable.push(c.id);
    else if (v == null) r.missing.push(c.id);
    else if (v === "fail") r.failed.push(c.id);
    else if (v !== "pass") r.invalid.push(c.id); // an evaluator cannot skip a criterion
  }
  const state = r.missing.length ? "qualifying"
    : r.failed.length || r.invalid.length ? "refinement_required"
    : "qualified";
  return { state, ...r };
}

// ── 8. MODE EXPECTATIONS (§7.4) ────────────────────────────────────
// adversarial_critique / refinement_after_critique describe the GENERATION pipeline. Qualification still
// evaluates every hard criterion in every mode (incl. emergence, adversarial robustness) against mode-scaled evidence.
export const MODE_EXPECTATIONS = {
  quick: { min_alternatives: 1, min_non_obvious_insights: 1, adversarial_critique: false, refinement_after_critique: false, emergence_evidence: "cross_domain_conclusions" },
  standard: { min_alternatives: 2, min_non_obvious_insights: 1, adversarial_critique: true, refinement_after_critique: false, emergence_evidence: "cross_domain_conclusions" },
  full: { min_alternatives: 3, min_non_obvious_insights: 1, adversarial_critique: true, refinement_after_critique: true, emergence_evidence: "intersections_and_patterns",
    requires: ["refresh_25_when_enabled", "six_intersections", "four_patterns", "cross_domain_candidates", "higher_order_synthesis"] },
};

// ── 9. UI REPRESENTATION (§7.7 — same tranche obligation) ──────────
export const UI_STATES = {
  queued: { label: "Queued", tone: "neutral", actions: ["cancel"] },
  running: { label: "Running", tone: "active", actions: ["cancel"], shows: ["current_stage", "elapsed_telemetry"] },
  validating: { label: "Validating", tone: "active", actions: ["cancel"], shows: ["validation_progress"] },
  completed: { label: "Protocol-complete", tone: "success", actions: ["view", "export", "rerun"], shows: ["qualification_state"] },
  partial: { label: "Partial — artifacts preserved", tone: "warning", actions: ["view", "resume_failed_stage", "export"], shows: ["failed_stage", "failure_evidence"] },
  failed: { label: "Failed", tone: "error", actions: ["view_evidence", "rerun"], shows: ["failure_evidence"] },
  cancel_requested: { label: "Cancelling — waiting for active call to settle", tone: "warning", actions: [] },
  cancelled: { label: "Cancelled", tone: "neutral", actions: ["view", "rerun"] },
};
export const UI_RULES = [
  "Partial profiles always display 'partial' and never 'Full Janus complete'.",
  "JANUS-QUALIFIED badge appears only when releaseDecision().label === JANUS-QUALIFIED.",
  "Elapsed time is shown as telemetry, never as a failure or stall verdict.",
  "Confidence corrections made by code are visible on the affected recommendation.",
  "Failure shows its settled evidence type; preserved stage artifacts remain browsable.",
  "An unqualified Blueprint stays viewable and exportable under RELEASE_LABELS.unqualified and is never presented as the Final Blueprint.",
  "A criterion shows as not applicable only by its contract rule (with that rule named); the evaluator can never mark one not applicable.",
];