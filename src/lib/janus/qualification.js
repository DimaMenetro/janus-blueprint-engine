/**
 * JANUS COMPLETION + QUALITY QUALIFICATION against the durable stage model — Phase 5 (pure, no I/O).
 * Applies the Phase 2 contract (lifecycleContract.js) to a run view. Nothing here is stored: completion,
 * the code-decided verdicts and the release decision are recomputed from stage records every time, so the
 * engine and every screen read the same answer. The generator's opinion of its own work is never an input.
 */
import { PAIRS, PATTERNS, CONFIDENCE_TAXONOMY, lowestConfidence } from "@/lib/janus/protocolRegistry";
import { completionManifest, enforceConfidencePropagation, normalizeTag, qualify, releaseDecision,
  QUALITY_CRITERIA, criterionApplies, MODE_EXPECTATIONS, stageIntegrity, MAX_REFINEMENT_CYCLES } from "@/lib/janus/lifecycleContract";
import { QUALIFICATION_KEY, STORAGE_MODEL, CONFIG_INPUT, configOf } from "@/lib/janus/stageModel";
import { BP } from "@/lib/janus/blueprintPipeline";
import { continuationOf, continuableFor, stagePlan } from "@/lib/janus/executionState";

/** Durable artifacts in the shape the contract reads (six intersections and four patterns named apart). */
export function contractArtifacts(artifacts) {
  const syn = artifacts.synthesis;
  if (!syn) return artifacts;
  return { ...artifacts, synthesis: { ...syn, intersections: syn.intersection_matrix || {},
    emergent_patterns: Object.fromEntries(PATTERNS.filter(p => syn[p.id]).map(p => [p.id, syn[p.id]])) } };
}
/** The outputs a revision was compiled from, by stage key — from the EXACT revisions it recorded. */
export function recordedInputs(view, stage) {
  const byId = Object.fromEntries((view.lineage || []).map(s => [s.id, s]));
  // The run configuration travels with them: some integrity rules depend on it (Blueprint level, candidate count).
  const inputs = { ...Object.fromEntries((stage?.depends_on || []).map(id => byId[id]).filter(Boolean).map(d => [d.stage_key, d.output])), [CONFIG_INPUT]: configOf(view.run) };
  // A SUBSTANTIVE REFINEMENT revision was refined from an earlier final Blueprint against an evaluation, not from
  // the assembled draft against the self-critique: it is held to what it owes THOSE (refinementBasis).
  const refines = stage?.provenance?.refines;
  return refines ? { ...inputs, ...refinementBasis(byId[refines.blueprint_stage_id]?.output, refines.deficiencies) } : inputs;
}
/** The base and the findings a refinement revision is validated against, in the shape the refinement rules read. */
export const refinementBasis = (base, deficiencies) => ({ [BP.assembly]: { blueprint: base }, [BP.critique]: { findings: deficiencies || [] } });
/** Today's stage-integrity findings on the ACTIVE revision of `key`, judged against the revisions it was built from. */
export function inputIntegrity(view, key) {
  const rev = view.stageInfo[key]?.active;
  return rev ? stageIntegrity(key, rev.output, { inputs: recordedInputs(view, rev) }) : [];
}
/**
 * COMPLETION = the contract's manifest PLUS the stage integrity of every active revision of the run's plan — the
 * identical function a stage is validated with when it settles and before it is read (lifecycleContract §5b). So
 * a revision that could not settle today cannot count toward completion either: the final Synthesis in full
 * (takeaways, collisions, limitation — which the neutral manifest does not name), each pair's three fields,
 * resolvable references. Staged runs only; a historical Run is judged by the manifest, as before.
 */
export function completionOf(view) {
  const manifest = completionManifest(view.run.execution_mode, contractArtifacts(view.artifacts), { refreshEnabled: !!view.run.refresh_enabled });
  if (view.run.storage_model !== STORAGE_MODEL.staged) return manifest;
  const durable = stagePlan(view.run.execution_mode).flatMap(key =>
    inputIntegrity(view, key).map(e => (key.startsWith("intersection:") ? e : `${key}: ${e}`)));
  const extra = [...new Set(durable)].filter(e => !manifest.blocking.includes(e));
  return extra.length ? { ...manifest, blocking: [...manifest.blocking, ...extra], complete: false, completion_label: null } : manifest;
}

const rank = (tag) => CONFIDENCE_TAXONOMY.indexOf(normalizeTag(tag));
const filled = (a) => Array.isArray(a) && a.length > 0;
const verdict = (reasons, passNote) => ({ verdict: reasons.length ? "fail" : "pass", reasons: reasons.length ? reasons : [passNote] });

/** Every handle a Blueprint step may cite in `derived_from`, with the domains (and confidence) behind it. */
export function traceIndex(a) {
  const idx = new Map();
  const claims = a.cogito?.claims || [];
  claims.forEach(c => idx.set(c.id, { domains: ["cogito"], tag: normalizeTag(c.tag) }));
  enforceConfidencePropagation(claims, a.actus?.recommendations || []).recommendations
    .forEach(r => idx.set(r.id, { domains: ["actus"], tag: normalizeTag(r.inherited_confidence) }));
  (a.corpus?.constraints || []).forEach((_, i) => idx.set(`corpus:${i + 1}`, { domains: ["corpus"] }));
  (a.animus?.boundary_checks || []).forEach((_, i) => idx.set(`animus:${i + 1}`, { domains: ["animus"] }));
  PAIRS.filter(p => a.synthesis?.intersection_matrix?.[p.id]).forEach(p => idx.set(p.id, { domains: p.domains, kind: "pair" }));
  PATTERNS.filter(p => a.synthesis?.[p.id]).forEach(p => idx.set(`pattern:${p.id}`, { domains: PAIRS.find(x => x.id === p.pair).domains, kind: "pattern" }));
  return idx;
}

/**
 * What one Blueprint step rests on: the handles it cites (resolved or not) and its effective confidence —
 * never stronger than the weakest claim or recommendation it cites. Code is the authority, as for recommendations.
 */
export function stepTrace(step, idx) {
  const refs = (Array.isArray(step.derived_from) ? step.derived_from : []).map(id => ({ id, found: idx.has(id) }));
  const ceiling = lowestConfidence(refs.filter(r => idx.get(r.id)?.tag).map(r => idx.get(r.id).tag));
  const declared = step.confidence ? normalizeTag(step.confidence) : null;
  const effective = ceiling && (rank(declared) < 0 || rank(declared) < rank(ceiling)) ? ceiling : declared;
  return { refs, declared, effective, corrected: !!effective && effective !== declared };
}

/**
 * CONFIDENCE OF THE ASSEMBLED DRAFT IS SET BY CODE (Confidence Propagation Law, as for Actus recommendations).
 * In the live CCT run the skeleton labelled a step Contested although it rested on Speculative material; the critic
 * then argued about the label and the refinement "resolved" it by raising it to Established. The draft now leaves
 * assembly with every step at the weakest confidence of what it cites, and each correction is recorded.
 */
export function enforceStepConfidence(blueprint, artifacts) {
  const idx = traceIndex(artifacts), corrections = [];
  const steps = (blueprint.steps || []).map(s => {
    const t = stepTrace(s, idx);
    if (!t.corrected) return s;
    corrections.push({ step: s.step, from: s.confidence ?? null, to: t.effective });
    return { ...s, confidence: t.effective };
  });
  return { blueprint: { ...blueprint, steps }, corrections };
}

/**
 * INHERITANCE, decided by code (Phase 9). A Blueprint that records dispositions is held to them:
 *  - requirements (the objective brief): every one has a disposition; one the plan carries names real steps; a
 *    "must" requirement the plan carries is verified by an acceptance entry;
 *  - Actus recommendations: every one has a disposition, and one marked implemented or integrated is cited in
 *    derived_from by a step it names. A recommendation id pasted into a list is not inheritance.
 * A historical Blueprint records no dispositions and is judged as before.
 */
export function inheritanceFindings(a, brief) {
  const bp = a.blueprint || {}, steps = bp.steps || [];
  const numbers = new Set(steps.map(s => s.step));
  const carried = (d) => d === "implemented" || d === "integrated";
  const requirements = [], recommendations = [];
  if (brief && Array.isArray(bp.requirement_dispositions)) {
    const byId = Object.fromEntries(bp.requirement_dispositions.map(d => [d.requirement, d]));
    const verified = new Set((bp.acceptance || []).flatMap(x => x.verifies || []));
    (brief.requirements || []).forEach(r => {
      const d = byId[r.id];
      if (!d) { requirements.push(`${r.id}: the operator's requirement has no disposition (${r.text})`); return; }
      if (!carried(d.disposition)) { if (!d.reasoning) requirements.push(`${r.id}: ${d.disposition} without reasoning`); return; }
      if (!(d.where || []).some(n => numbers.has(n))) requirements.push(`${r.id}: marked ${d.disposition}, but names no existing step`);
      if (r.priority === "must" && Array.isArray(bp.acceptance) && !verified.has(r.id)) requirements.push(`${r.id}: a "must" requirement with no acceptance entry verifying it`);
    });
  }
  if (Array.isArray(bp.recommendation_dispositions)) {
    const byId = Object.fromEntries(bp.recommendation_dispositions.map(d => [d.recommendation, d]));
    (a.actus?.recommendations || []).forEach(r => {
      const d = byId[r.id];
      if (!d) { recommendations.push(`${r.id}: the recommendation has no disposition`); return; }
      if (!carried(d.disposition)) { if (!d.reasoning) recommendations.push(`${r.id}: ${d.disposition} without reasoning`); return; }
      if (!steps.some(s => (d.where || []).includes(s.step) && (Array.isArray(s.derived_from) ? s.derived_from : []).includes(r.id))) recommendations.push(`${r.id}: marked ${d.disposition}, but no step it names cites it`);
    });
  }
  return { requirements, recommendations };
}

/**
 * THE CODE AUDIT of a Blueprint draft (Phase 9): exactly what the code-decided criteria would fail at qualification,
 * computed on the assembled draft BEFORE the model critiques and refines it — so the critic and the refiner are
 * told, and no defect code can see is left for the evaluation to discover.
 */
export function blueprintAudit(config, artifacts, brief) {
  const verdicts = codeVerdicts({ mode: config.executionMode, blueprintLevel: config.blueprintLevel }, artifacts, brief);
  return { findings: Object.entries(verdicts).flatMap(([criterion, v]) => (v.verdict === "fail" ? v.reasons.map(detail => ({ criterion, detail })) : [])) };
}

/** The five criteria decided by code: two deterministic, three by traceability over recorded links. */
export function codeVerdicts({ mode, blueprintLevel = "L2" }, a, brief) {
  const inherited = inheritanceFindings(a, brief);
  const idx = traceIndex(a);
  const steps = a.blueprint?.steps || [];
  const name = (i) => `step ${steps[i].step ?? i + 1}`;
  const refs = steps.map(s => (Array.isArray(s.derived_from) ? s.derived_from : []).map(id => ({ id, hit: idx.get(id) })));
  const domainsOf = (r) => new Set(r.filter(x => x.hit).flatMap(x => x.hit.domains));
  const claims = a.cogito?.claims || [];

  const evidence = claims.length ? [] : ["no Cogito claims"];
  claims.forEach(c => {
    ["why_believed", "falsifiable_by", "verify_later"].filter(f => !c[f]).forEach(f => evidence.push(`${c.id}: ${f} missing`));
    if (rank(c.tag) < 0) evidence.push(`${c.id}: tag outside the confidence taxonomy`);
  });
  evidence.push(...enforceConfidencePropagation(claims, a.actus?.recommendations || []).errors);

  const depth = steps.length ? [] : ["the Blueprint has no steps"];
  const numbers = new Set(steps.map(s => s.step));
  steps.forEach((s, i) => {
    ["inputs", "outputs"].filter(f => !filled(s[f])).forEach(f => depth.push(`${name(i)}: ${f} missing`));
    if (!s.validation) depth.push(`${name(i)}: validation missing`);
    (s.depends_on_steps || []).filter(d => !numbers.has(d)).forEach(d => depth.push(`${name(i)}: depends on step ${d}, which does not exist`));
    if (blueprintLevel !== "L1" && !filled(s.substeps)) depth.push(`${name(i)}: substeps missing (level ${blueprintLevel})`);
    if (blueprintLevel === "L3" && !filled(s.acceptance_tests)) depth.push(`${name(i)}: acceptance tests missing (level L3)`);
  });
  if (!filled(a.blueprint?.success_criteria)) depth.push("no success criteria");
  (a.blueprint?.risk_register || []).filter(r => !r.mitigation).forEach(r => depth.push(`risk without mitigation: ${r.risk}`));
  depth.push(...inherited.requirements);

  const cross = [];
  refs.forEach((r, i) => {
    if (!r.some(x => x.hit)) cross.push(`${name(i)}: traces to no upstream artifact`);
    r.filter(x => !x.hit).forEach(x => cross.push(`${name(i)}: cites ${x.id}, which does not exist`));
  });
  cross.push(...inherited.recommendations);
  const used = new Set(refs.flatMap(r => [...domainsOf(r)]));
  if (used.size < 2) cross.push(`the Blueprint traces to ${used.size} domain${used.size === 1 ? "" : "s"}; at least two are required`);

  const emergence = [];
  const cites = (kind) => refs.some(r => r.some(x => x.hit?.kind === kind));
  if (MODE_EXPECTATIONS[mode]?.emergence_evidence === "intersections_and_patterns") {
    if (!cites("pair")) emergence.push("no step is traced to an intersection");
    if (!cites("pattern")) emergence.push("no step is traced to a formal emergent pattern");
  } else if (!refs.some(r => domainsOf(r).size >= 2)) emergence.push("no step combines conclusions from two domains");

  const honesty = [];
  refs.forEach((r, i) => {
    const ceiling = lowestConfidence(r.filter(x => x.hit?.tag).map(x => x.hit.tag));
    if (!ceiling) return;
    if (rank(steps[i].confidence) < 0) honesty.push(`${name(i)}: carries no confidence label although it rests on ${ceiling} material`);
    else if (rank(steps[i].confidence) < rank(ceiling)) honesty.push(`${name(i)}: labelled ${steps[i].confidence} but rests on ${ceiling} material`);
  });

  return {
    evidence_discipline: verdict(evidence, "every claim carries its basis, falsifier and verification; every recommendation is anchored"),
    implementation_depth: verdict(depth, "every step has inputs, outputs, validation and resolvable dependencies"),
    cross_domain_necessity: verdict(cross, `steps trace to ${[...used].join(", ")}`),
    emergence: verdict(emergence, "steps are traced to cross-domain conclusions"),
    intellectual_honesty: verdict(honesty, "no step claims more confidence than the material it rests on"),
  };
}

/**
 * EVALUATOR CONSISTENCY (Phase 9). The independent evaluator records what the Blueprint adds beyond the operator's
 * own material, whether the operator's objective is preserved, and the errors of substance it found. A criterion
 * cannot pass against those findings: praise for restated input is not novelty, a reduced objective is
 * domestication, and a blocking error is not robustness. Returns criterion id → why a "pass" is not accepted.
 * An evaluation recorded before these findings existed carries none and is read as it was.
 */
export function evaluatorConsistency(output) {
  const held = {};
  if (!output) return held;
  if (Array.isArray(output.intellectual_surplus) && !output.intellectual_surplus.some(s => typeof s === "string" && /[\p{L}\p{N}]/u.test(s)))
    held.non_obviousness = "The evaluator identified nothing the Blueprint adds beyond the operator's own material, so it cannot pass as non-obvious.";
  const kept = output.objective_preservation?.preserved;
  if (kept && kept !== "yes")
    held.feasibility_without_domestication = `The evaluator found the operator's objective ${kept === "no" ? "replaced" : "only partly preserved"}${output.objective_preservation.lost?.length ? ` (lost: ${output.objective_preservation.lost.join("; ")})` : ""}.`;
  // A section of the operator's material that holds obligations and that the evaluator found absent from the
  // Blueprint is scope that was dropped, whatever the overall answer says.
  const absent = (output.section_realisation || []).filter(s => s?.status === "absent").map(s => s.section);
  if (absent.length && !held.feasibility_without_domestication)
    held.feasibility_without_domestication = `The evaluator found ${absent.length === 1 ? "a section" : "sections"} of the operator's material absent from the Blueprint: ${absent.join(", ")}.`;
  const blocking = (output.substantive_errors || []).filter(x => x?.severity === "blocking").map(x => x.error);
  if (blocking.length) held.adversarial_robustness = `The evaluator recorded blocking errors of substance: ${blocking.join("; ")}.`;
  return held;
}

/**
 * Completion, qualification and release for one run view. `lifecycle` is the run status to judge against
 * (the engine passes the status it is about to persist). Qualification is only attempted for a completed,
 * protocol-complete run whose Blueprint is not stale; the critique verdicts only count when they were
 * given for exactly the active Blueprint revision.
 */
export function deriveQualification(view, lifecycle = view.run.status) {
  const { run, artifacts, stageInfo } = view;
  const completion = completionOf(view);
  const bp = stageInfo.blueprint, q = stageInfo[QUALIFICATION_KEY];
  const blocked = !completion.complete ? "The run is not protocol-complete, so there is no candidate to qualify."
    : lifecycle !== "completed" ? "Qualification begins only once the run has completed."
    : bp?.stale ? `The Blueprint is stale (${bp.stale}). Re-run it before it can be qualified.` : null;
  const evaluation = !blocked && q?.active && !q.stale && (q.active.depends_on || []).includes(bp?.active?.id) ? q.active : null;
  const code = blocked ? {} : codeVerdicts({ mode: run.execution_mode, blueprintLevel: run.blueprint_level }, artifacts, view.pipeline?.[BP.brief]);
  const critique = evaluation?.output?.verdicts || {};
  const held = evaluatorConsistency(evaluation?.output);

  const verdicts = {};
  const criteria = QUALITY_CRITERIA.map(c => {
    const applies = criterionApplies(c);
    let src = c.method === "critique" ? critique[c.id] : code[c.id];
    // The evaluator stays the judge; code only refuses a "pass" its own recorded findings contradict.
    if (c.method === "critique" && src?.verdict === "pass" && held[c.id]) src = { verdict: "fail", reasons: [held[c.id], `The evaluator's own answer was "pass": ${src.reason}`] };
    if (src?.verdict != null) verdicts[c.id] = src.verdict;
    return { id: c.id, method: c.method, standard: c.standard, applies, rule: c.applies_when || null,
      verdict: applies ? src?.verdict ?? null : null, reasons: src?.reasons || (src?.reason ? [src.reason] : []) };
  });
  const result = blocked ? { state: "not_started", missing: [], failed: [], invalid: [], not_applicable: [] } : qualify(verdicts);
  // BOUNDED SUBSTANTIVE REFINEMENT (plan §7.3, contract MAX_REFINEMENT_CYCLES). A Blueprint that fails qualification
  // may be refined against the evaluation — a new Blueprint revision, then one new evaluation — at most this many
  // times per assembled draft, each on the operator's decision. Distinct from a retry (same revision, malformed
  // output). When the budget is spent and it still fails, the state is limitation_reported: never released, and the
  // unresolved criteria are reported as they stand. Every cycle that started a revision counts, whatever it produced.
  const assemblyId = stageInfo[BP.assembly]?.active?.id;
  const cycles = (view.lineage || []).filter(s => s.stage_key === BP.final && s.provenance?.refines && s.error_class !== "not_started"
    && (!assemblyId || (s.depends_on || []).includes(assemblyId))).length;
  const unmet = criteria.filter(c => c.applies && c.verdict != null && c.verdict !== "pass");
  const deficiencies = unmet.map((c, i) => ({ id: `E${i + 1}`, severity: "blocking", category: c.id, where: "the Blueprint as evaluated",
    problem: c.reasons.join(" ") || `Failed: ${c.standard}`, required_change: `Change the Blueprint so that it meets this standard: ${c.standard}` }));
  const exhausted = result.state === "refinement_required" && cycles >= MAX_REFINEMENT_CYCLES;
  const state = exhausted ? "limitation_reported" : result.state;
  const live = q?.latest?.status === "running";
  // A running evaluation whose last call settled as a retryable failure with budget left waits for its next
  // attempt on the SAME revision (Phase 7 tranche 1); any other running evaluation is a call whose outcome is unknown.
  const waiting = live && continuableFor(run, QUALIFICATION_KEY) ? continuationOf(q.latest, view.attempts?.[q.latest.id]) : null;
  // The last evaluation of THIS Blueprint version. If it bought a call and settled without verdicts, another one is
  // a new version with a new attempt limit: only the operator's explicit decision makes it, never the engine.
  const forBlueprint = (view.lineage || []).filter(s => s.stage_key === QUALIFICATION_KEY && (s.depends_on || []).includes(bp?.active?.id));
  const last = forBlueprint[forBlueprint.length - 1];
  const spent = last?.status === "failed" || (last?.status === "cancelled" && last.error_class === "artifact_not_recorded");
  const evaluationAction = blocked || evaluation ? null : live ? (waiting ? "continue" : null) : spent ? "new_version" : "start";
  const pending = blocked || evaluation ? null : live ? (waiting ? "awaiting_retry" : "in_progress") : q?.latest?.status === "failed" ? "evaluation_failed" : "awaiting_evaluation";

  return {
    state, result, criteria, blocked, pending, completion,
    // What substantive refinement may still do, and what stays unresolved when it may do no more.
    refinement: { used: cycles, max: MAX_REFINEMENT_CYCLES, remaining: Math.max(0, MAX_REFINEMENT_CYCLES - cycles), deficiencies,
      available: state === "refinement_required" && !!evaluation && !live && view.storage === STORAGE_MODEL.staged && !!stageInfo[BP.assembly]?.active },
    limitations: exhausted ? unmet.map(c => ({ criterion: c.id, standard: c.standard, reasons: c.reasons })) : [],
    evaluationError: pending === "evaluation_failed" ? q.latest.error_message : null,
    // continue | start | new_version | null — what the evaluation pathway may do now (adapter: evaluateJanus)
    evaluationAction, evaluationRetry: waiting ? { nextAttempt: waiting.nextAttempt, revision: q.latest.revision } : null,
    lastEvaluationError: spent ? last.error_message : null,
    // The engine starts an evaluation on its own only when this Blueprint version has never had one that made a call.
    needsEvaluation: evaluationAction === "start",
    release: releaseDecision(lifecycle, state),
    blueprintStageId: bp?.active?.id || null,
    strongestObjection: evaluation?.output?.strongest_objection || null,
    // The evaluator's findings on what was submitted versus what came back, as recorded.
    findings: evaluation ? { intellectual_surplus: evaluation.output.intellectual_surplus || null, input_restatement: evaluation.output.input_restatement || null,
      objective_preservation: evaluation.output.objective_preservation || null, substantive_errors: evaluation.output.substantive_errors || null,
      section_realisation: evaluation.output.section_realisation || null } : null,
    evaluationStageId: evaluation?.id || null,
  };
}