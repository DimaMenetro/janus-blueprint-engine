/**
 * JANUS LIFECYCLE, COMPLETION & QUALITY CONTRACT — Phase 2 specification (executable).
 * Pure functions over a neutral artifact bag { refresh, corpus, cogito, animus, actus, synthesis, blueprint }.
 * Independent of the persisted Run shape so it survives the Phase 3 stage model.
 * Not yet wired into the engine — that is Phase 5 (completion + qualification against the stage model).
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

/** Release rule: JSON validity alone never releases a Blueprint. */
export function releaseDecision(lifecycle, qualification) {
  if (lifecycle !== "completed") return { released: false, label: null };
  if (qualification === "qualified") return { released: true, label: JANUS_QUALIFIED };
  if (qualification === "limitation_reported") return { released: true, label: "Released with reported limitations — not JANUS-QUALIFIED" };
  return { released: false, label: "Protocol-complete candidate — awaiting qualification" };
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
  corpus: (a, ctx) => [
    ...(!nonEmpty(a?.constraints) ? ["corpus.constraints empty"] : []),
    ...(ctx.full ? missingSubdomains(a, "corpus").map(id => `corpus subdomain missing: ${id}`) : []),
  ],
  cogito: (a, ctx) => {
    if (!nonEmpty(a?.claims)) return ["cogito.claims empty"];
    const ids = new Set(a.claims.map(c => c.id)), e = [];
    a.claims.forEach(c => {
      if (!c.id || !c.text) e.push("cogito claim missing id/text");
      if (!CONFIDENCE_TAXONOMY.includes(normalizeTag(c.tag))) e.push(`${c.id}: tag outside taxonomy (${c.tag})`);
      (c.depends_on || []).forEach(d => { if (!ids.has(d)) e.push(`${c.id}: dangling depends_on ${d}`); });
    });
    if (ctx.full) e.push(...missingSubdomains(a, "cogito").map(id => `cogito subdomain missing: ${id}`));
    return e;
  },
  animus: (a, ctx) => [
    ...(!nonEmpty(a?.boundary_checks) ? ["animus.boundary_checks empty"] : []),
    ...(ctx.full ? missingSubdomains(a, "animus").map(id => `animus subdomain missing: ${id}`) : []),
  ],
  actus: (a, ctx) => [
    ...(!nonEmpty(a?.recommendations) ? ["actus.recommendations empty"] : []),
    ...(ctx.full ? missingSubdomains(a, "actus").map(id => `actus subdomain missing: ${id}`) : []),
  ],
  synthesis: (a) => [
    ...PAIRS.filter(p => !a?.intersections?.[p.id]).map(p => `intersection missing: ${p.id}`),
    ...PATTERNS.flatMap(p => p.fields.filter(f => !a?.emergent_patterns?.[p.id]?.[f]).map(f => `pattern ${p.id}.${f} missing`)),
  ],
  blueprint: (a, ctx) => {
    if (!a?.goal) return ["blueprint.goal missing"];
    const e = [];
    if (!nonEmpty(a.steps)) e.push("blueprint.steps empty");
    (a.steps || []).forEach(s => { if (!s.title || !s.instructions || !s.validation) e.push(`step ${s.step}: title/instructions/validation required`); });
    if (!nonEmpty(a.success_criteria)) e.push("blueprint.success_criteria empty");
    if (!nonEmpty(a.risk_register)) e.push("blueprint.risk_register empty");
    const minAlt = MODE_EXPECTATIONS[ctx.mode]?.min_alternatives ?? 0;
    if ((a.alternative_approaches || []).length < minAlt) e.push(`blueprint needs ≥${minAlt} serious alternative approaches`);
    return e;
  },
};

// ── 6. COMPLETION MANIFEST (§11.2) ─────────────────────────────────
export function completionManifest(mode, artifacts, { refreshEnabled = false } = {}) {
  const profile = MODE_PROFILES[mode];
  if (!profile) throw new Error(`Unknown mode: ${mode}`);
  const ctx = { mode, full: !profile.partial, refreshEnabled };
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
export const QUALITY_CRITERIA = [
  { id: "problem_understanding", method: "critique" },
  { id: "cross_domain_necessity", method: "traceability" },
  { id: "emergence", method: "traceability" },
  { id: "non_obviousness", method: "critique" },
  { id: "disciplined_novelty", method: "critique" },
  { id: "elegance", method: "critique" },
  { id: "explanatory_compression", method: "critique" },
  { id: "evidence_discipline", method: "deterministic" },
  { id: "feasibility_without_domestication", method: "critique" },
  { id: "implementation_depth", method: "deterministic" },
  { id: "adversarial_robustness", method: "critique" },
  { id: "utility", method: "critique" },
  { id: "intellectual_honesty", method: "traceability" },
  { id: "historical_no_regression", method: "critique" }, // benchmark comparison, Phase 5/9
];
export const QUALIFICATION_RULES = {
  generator_self_assessment_counts: false,
  all_criteria_must_pass: true,
  verdicts: ["pass", "fail", "not_applicable"],
};

export function qualify(verdicts) {
  const missing = QUALITY_CRITERIA.filter(c => !verdicts[c.id]).map(c => c.id);
  const failed = QUALITY_CRITERIA.filter(c => verdicts[c.id] === "fail").map(c => c.id);
  if (missing.length) return { state: "qualifying", missing, failed };
  return { state: failed.length ? "refinement_required" : "qualified", missing, failed };
}

// ── 8. MODE EXPECTATIONS (§7.4) ────────────────────────────────────
export const MODE_EXPECTATIONS = {
  quick: { min_alternatives: 1, min_non_obvious_insights: 1, adversarial_critique: false, refinement_after_critique: false },
  standard: { min_alternatives: 2, min_non_obvious_insights: 1, adversarial_critique: true, refinement_after_critique: false },
  full: { min_alternatives: 3, min_non_obvious_insights: 1, adversarial_critique: true, refinement_after_critique: true,
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
];