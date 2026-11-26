/**
 * JANUS BLUEPRINT PIPELINE — Phase 9 (pure, no I/O). Plan §15.
 * The Blueprint is no longer one call. It is a chain of durable stages, each a RunStage revision with exact
 * dependencies, each validated before the next reads it:
 *
 *   blueprint:brief        the operator's objective and material requirements, read from the query alone (Q ids)
 *   blueprint:candidates   materially different solution candidates (K ids), each with an operational mechanism
 *   blueprint:selection    adversarial comparison, then selection / combination / higher-order synthesis
 *   blueprint:skeleton     complete objective, architecture, phases, steps; a disposition for every requirement
 *                          and every Actus recommendation
 *   blueprint:expansion    implementation detail for exactly the skeleton's steps
 *   blueprint:criteria     success criteria, acceptance, outcome interpretation, risk
 *   blueprint:assembly     DETERMINISTIC: merges the validated sub-artifacts into one draft and audits it in code.
 *                          No model call, so no attempt record.
 *   blueprint:critique     self-critique of the assembled draft (modes with adversarial critique)
 *   blueprint              final refinement: the complete Blueprint. Code checks that it dropped no step, weakened
 *                          no requirement silently and answered every critique finding. Qualification binds to it.
 *
 * This file holds the keys, the schemas (one source: the stage validator, the type legend and the normalizer all
 * read them through janusSchema), the stage integrity rules and the deterministic assembly. It imports nothing from
 * the lifecycle contract, which reads the integrity rules from here.
 */
export const BP = {
  brief: "blueprint:brief", candidates: "blueprint:candidates", selection: "blueprint:selection", skeleton: "blueprint:skeleton",
  expansion: "blueprint:expansion", criteria: "blueprint:criteria", assembly: "blueprint:assembly", critique: "blueprint:critique",
  final: "blueprint",
};
/** Canonical order. `blueprint` is last: the artifact every screen, export and the evaluation read. */
export const BLUEPRINT_PIPELINE_KEYS = [BP.brief, BP.candidates, BP.selection, BP.skeleton, BP.expansion, BP.criteria, BP.assembly, BP.critique, BP.final];
export const BLUEPRINT_SUBSTAGE_KEYS = BLUEPRINT_PIPELINE_KEYS.filter(k => k !== BP.final);
/** Stages computed by code from validated artifacts. They make no model call and have no attempt. */
export const isDeterministicStage = (key) => key === BP.assembly;
export const BLUEPRINT_STAGE_LABELS = {
  [BP.brief]: "Blueprint · Objective brief", [BP.candidates]: "Blueprint · Candidates", [BP.selection]: "Blueprint · Comparison and selection",
  [BP.skeleton]: "Blueprint · Skeleton", [BP.expansion]: "Blueprint · Expansion", [BP.criteria]: "Blueprint · Criteria and risk",
  [BP.assembly]: "Blueprint · Assembly", [BP.critique]: "Blueprint · Self-critique", [BP.final]: "Blueprint",
};

/**
 * THE OPERATOR'S MATERIAL, SECTION BY SECTION (pure). The live CCT brief turned a twelve-section specification into
 * eight requirements, and nothing downstream could know what had been passed over. The headings the operator wrote
 * are read by code (markdown headings, bold-only lines, short numbered or lettered titles) and numbered S1…Sn; the
 * brief must account for each one: requirements drawn from it, or context with the reason. Understanding stays the
 * model's; code only makes silence about a section impossible. Fewer than three headings is not a sectioned document.
 */
export function sourceOutline(queryText = "") {
  const raw = String(queryText);
  const lines = (raw.includes("\n") ? raw.split("\n") : raw.split("\\n")).map(l => l.trim()).filter(Boolean);
  const heading = (l) => l.length <= 110 && (/^#{1,6}\s+\S/.test(l) || /^\*\*[^*]+\*\*\s*:?$/.test(l)
    || (/^(\d+(\.\d+)*\s*[·.)]?|PART\s+[IVX\d]+|Appendix\s+\w+\s*[·.:]?|Section\s+[\dIVX]+[.:]?)(\s+\S|$)/i.test(l) && l.split(/\s+/).length <= 9 && !/[.;,?!]$/.test(l)));
  const titles = [...new Set(lines.filter(heading).map(l => l.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").replace(/:$/, "").trim()))];
  return titles.length >= 3 ? titles.map((title, i) => ({ id: `S${i + 1}`, title })) : [];
}

// ── Schemas ────────────────────────────────────────────────────────
const str = { type: "string" };
const strs = { type: "array", items: str };
const nums = { type: "array", items: { type: "number" } };
const CONFIDENCE = { type: "string", enum: ["Established", "Contested", "Speculative"] };
const obj = (properties, required = []) => ({ type: "object", properties, required });
const list = (properties, required) => ({ type: "array", items: obj(properties, required) });

const DISPOSITION = (subject, values) => list({ [subject]: str, disposition: { type: "string", enum: values }, where: nums, reasoning: str }, [subject, "disposition"]);
export const REQUIREMENT_DISPOSITIONS = ["implemented", "integrated", "deferred", "alternative"];
export const RECOMMENDATION_DISPOSITIONS = ["implemented", "integrated", "deferred", "rejected"];
const CARRIED = ["implemented", "integrated"]; // the two dispositions that put a requirement into the plan

export const SPECIFICATION_KINDS = ["algorithm", "formula", "data_structure", "state_machine", "interface_contract", "procedure", "tolerance", "experiment", "failure_handling", "physical_mechanism"];
const STEP_PLAN = { step: { type: "number" }, title: str, purpose: str, phase: str, depends_on_steps: nums, components: strs, fulfils: strs, derived_from: strs, confidence: str };
const STEP_DETAIL = { instructions: str, inputs: strs, outputs: strs, validation: str, time_estimate: str, effort_level: str, interfaces: strs,
  substeps: list({ substep: str, details: str }), checklist: strs, acceptance_tests: strs,
  // What a builder would otherwise have to invent: the algorithm, the formula, the structure, the contract, the test.
  specifications: list({ kind: { type: "string", enum: SPECIFICATION_KINDS }, name: str, content: str }, ["kind", "content"]) };
const ARCHITECTURE = obj({ summary: str, components: list({ id: str, name: str, responsibility: str, interfaces: strs }, ["id", "name", "responsibility"]), relationships: strs });
const SCOPE = obj({ in: strs, deferred: list({ item: str, reason: str, revisit_when: str }, ["item", "reason"]), out: strs });
const ACCEPTANCE = list({ id: str, criterion: str, verifies: strs, method: str, evidence: str }, ["id", "criterion", "method"]);
const OUTCOMES = obj({ positive: str, null: str, contradictory: str, inconclusive: str }, ["positive", "null", "contradictory", "inconclusive"]);
const RISKS = list({ risk: str, impact: { type: "string", enum: ["low", "med", "high"] }, mitigation: str, trigger: str }, ["risk", "impact", "mitigation"]);
const STRATEGY = obj({ name: str, mode: str, built_from: strs, architecture: str, rationale: str, attack_on_favorite: str, residual_weaknesses: strs,
  integrated_strengths: list({ from: str, what: str }), derived_from: strs });

/** The final Blueprint (and the assembled draft): the historical contract plus what the pipeline carries into it. */
export const BLUEPRINT_SCHEMA = obj({
  goal: str, objective: str, pathway: str, assumptions: strs, selected_strategy: STRATEGY,
  alternative_approaches: list({ id: str, name: str, thesis: str, mechanism: str, pros: strs, cons: strs, why_not_chosen: str, epistemic_status: str, salvaged: str }),
  architecture: ARCHITECTURE, phases: list({ id: str, name: str, intent: str }), scope: SCOPE, invariants: strs, decision_points: strs,
  steps: list({ ...STEP_PLAN, ...STEP_DETAIL }, ["step", "title", "instructions"]),
  success_criteria: strs, acceptance: ACCEPTANCE, outcome_interpretation: OUTCOMES, risk_register: RISKS,
  requirement_dispositions: DISPOSITION("requirement", REQUIREMENT_DISPOSITIONS),
  recommendation_dispositions: DISPOSITION("recommendation", RECOMMENDATION_DISPOSITIONS),
  refinement: obj({
    dispositions: list({ finding: str, action: { type: "string", enum: ["resolved", "declined"] }, change: str, reason: str }, ["finding", "action"]),
    scope_changes: list({ requirement: str, what: str, reason: str }, ["what", "reason"]),
    removals: list({ path: str, reason: str }, ["path", "reason"]),
    changes: list({ path: str, finding: str, what: str, reason: str }, ["path", "what"]),
    summary: str,
  }),
});

export const PIPELINE_SCHEMAS = {
  [BP.brief]: obj({
    objective: str, pathway: str,
    requirements: list({ id: str, text: str, kind: { type: "string", enum: ["capability", "interface", "constraint", "control", "evidence", "acceptance", "non_goal"] },
      priority: { type: "string", enum: ["must", "should"] }, basis: str }, ["id", "text", "kind", "priority"]),
    end_state: str, implied_necessities: strs, relationships: strs,
    coverage: list({ section: str, disposition: { type: "string", enum: ["requirements", "context"] }, requirements: strs, note: str }, ["section", "disposition"]),
    ambition_guard: strs,
  }, ["objective", "requirements", "ambition_guard"]),
  [BP.candidates]: obj({
    problem_frame: str,
    candidates: list({ id: str, name: str, thesis: str, mechanism: str, differs_by: str, objective_fit: str, key_assumptions: strs,
      mechanism_transfers: list({ source_discipline: str, source_mechanism: str, mapping: str, evaluation: str }, ["source_discipline", "source_mechanism", "mapping", "evaluation"]),
      requirements_at_risk: strs, derived_from: strs, epistemic_status: CONFIDENCE, strongest_case: str, weakest_point: str },
    ["id", "name", "thesis", "mechanism", "differs_by", "objective_fit", "epistemic_status", "strongest_case", "weakest_point"]),
  }, ["problem_frame", "candidates"]),
  [BP.selection]: obj({
    comparison: list({ candidate: str,
      assessment: obj({ corpus: str, cogito: str, animus: str, actus: str, synthesis: str, operator_requirements: str }, ["corpus", "cogito", "operator_requirements"]),
      cost_complexity: str, second_order_effects: str, hidden_dependencies: str, failure_modes: strs, strongest_attack: str,
      survives: { type: "string", enum: ["yes", "weakened", "no"] }, conclusion: str }, ["candidate", "assessment", "strongest_attack", "survives", "conclusion"]),
    decision: obj({ mode: { type: "string", enum: ["selected", "combined", "higher_order"] }, chosen: strs, name: str, architecture: str, rationale: str,
      attack_on_favorite: str, residual_weaknesses: strs, integrated_strengths: list({ from: str, what: str }, ["from", "what"]), derived_from: strs },
    ["mode", "chosen", "name", "architecture", "rationale", "attack_on_favorite"]),
    rejected: list({ candidate: str, reason: str, salvaged: str }, ["candidate", "reason"]),
  }, ["comparison", "decision"]),
  [BP.skeleton]: obj({
    goal: str, assumptions: strs, architecture: ARCHITECTURE, phases: list({ id: str, name: str, intent: str }, ["id", "name"]), scope: SCOPE,
    invariants: strs, decision_points: strs, steps: list(STEP_PLAN, ["step", "title", "purpose"]),
    requirement_dispositions: DISPOSITION("requirement", REQUIREMENT_DISPOSITIONS),
    recommendation_dispositions: DISPOSITION("recommendation", RECOMMENDATION_DISPOSITIONS),
  }, ["goal", "steps", "requirement_dispositions"]),
  [BP.expansion]: obj({ steps: list({ step: { type: "number" }, ...STEP_DETAIL }, ["step", "instructions", "validation"]) }, ["steps"]),
  [BP.criteria]: obj({ success_criteria: strs, acceptance: ACCEPTANCE, outcome_interpretation: OUTCOMES, risk_register: RISKS },
    ["success_criteria", "acceptance", "outcome_interpretation", "risk_register"]),
  [BP.assembly]: obj({ blueprint: BLUEPRINT_SCHEMA, audit: obj({ findings: list({ criterion: str, detail: str }, ["criterion", "detail"]),
    confidence_corrections: list({ step: { type: "number" }, from: str, to: str }, ["step", "to"]) }, ["findings"]) }, ["blueprint", "audit"]),
  [BP.critique]: obj({
    findings: list({ id: str, severity: { type: "string", enum: ["blocking", "major", "minor"] },
      category: { type: "string", enum: ["objective_preservation", "domestication", "unsupported_mechanism", "epistemic_error", "omission", "contradiction",
        "implementation_gap", "traceability", "avoidable_complexity", "weak_alternative"] },
      where: str, problem: str, evidence: str, required_change: str }, ["id", "severity", "category", "problem", "required_change"]),
    objective_check: obj({ preserved: { type: "string", enum: ["yes", "partly", "no"] }, lost: strs }, ["preserved", "lost"]),
    input_restatement: strs, genuine_additions: strs, summary: str,
  }, ["findings", "objective_check", "input_restatement", "genuine_additions"]),
};

// ── Stage integrity (applied at settlement, before consumption and at completion — lifecycleContract §5b) ──
const said = (s) => typeof s === "string" && /[\p{L}\p{N}]/u.test(s);
const arr = (v) => (Array.isArray(v) ? v : []);
const repeated = (xs) => [...new Set(xs.filter((x, i) => x !== undefined && x !== "" && xs.indexOf(x) !== i))];
const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
function idRule(items, pattern, example, what, e) {
  items.forEach((x, i) => { if (!pattern.test(String(x?.id ?? ""))) e.push(`${what}[${i}].id must look like ${example}`); });
  repeated(items.map(x => x?.id)).forEach(id => e.push(`${what} id ${id} is used more than once`));
}
const need = (o, fields, where, e) => fields.filter(f => !said(o?.[f])).forEach(f => e.push(`${where}.${f}: missing`));
const stepNumbers = (steps) => new Set(arr(steps).map(s => s?.step));

function dispositionErrors(dispositions, subject, ids, carried, steps, e, { cite } = {}) {
  const numbers = stepNumbers(steps);
  const byId = Object.fromEntries(arr(dispositions).map(d => [d?.[subject], d]));
  ids.filter(id => !byId[id]).forEach(id => e.push(`${subject} ${id} has no disposition: every one is implemented, integrated, deferred or answered with a reasoned alternative`));
  arr(dispositions).forEach(d => {
    const id = d?.[subject];
    if (!ids.includes(id)) { e.push(`${subject}_dispositions cites ${id}, which does not exist`); return; }
    if (carried.includes(d.disposition)) {
      const where = arr(d.where);
      if (!where.length) e.push(`${id}: ${d.disposition} needs "where" — the step numbers that carry it`);
      where.filter(n => !numbers.has(n)).forEach(n => e.push(`${id}: "where" names step ${n}, which does not exist`));
      // Inheritance is operational, not a label: a step it names must actually build on it.
      if (cite && where.length && !arr(steps).some(s => where.includes(s.step) && arr(s.derived_from).includes(id))) e.push(`${id}: marked ${d.disposition}, but no step it names lists ${id} in derived_from`);
    } else if (!said(d.reasoning)) e.push(`${id}: ${d.disposition} needs its reasoning`);
  });
}

const RULES = {
  [BP.brief]: (a, _inputs, ctx = {}) => {
    const e = [];
    need(a, ["objective"], "brief", e);
    if (!arr(a?.requirements).length) e.push("brief.requirements empty");
    idRule(arr(a?.requirements), /^Q\d+$/, "Q1", "requirements", e);
    arr(a?.requirements).forEach(r => { if (!said(r?.text)) e.push(`${r?.id}: text missing`); });
    if (!arr(a?.ambition_guard).some(said)) e.push("brief.ambition_guard empty: name at least one narrower reformulation that would not satisfy the operator's objective");
    // Every section of the operator's material is accounted for (sourceOutline), so none is passed over in silence.
    const ids = new Set(arr(a?.requirements).map(r => r?.id));
    const covered = Object.fromEntries(arr(a?.coverage).map(c => [c?.section, c]));
    sourceOutline(ctx.config?.queryText).forEach(s => {
      const c = covered[s.id];
      if (!c) e.push(`coverage: section ${s.id} ("${s.title}") of the operator's material is not accounted for — give the requirements drawn from it, or mark it context and say why`);
      else if (c.disposition === "requirements" && !arr(c.requirements).some(id => ids.has(id))) e.push(`coverage ${s.id}: marked requirements, but names no requirement id of this brief`);
      else if (c.disposition === "context" && !said(c.note)) e.push(`coverage ${s.id}: marked context, but gives no reason it holds no requirement`);
    });
    return e;
  },
  [BP.candidates]: (a, inputs, ctx) => {
    const e = [], cs = arr(a?.candidates);
    if (!cs.length) return ["candidates empty"];
    if (ctx.minCandidates && cs.length < ctx.minCandidates) e.push(`${cs.length} candidate${cs.length === 1 ? "" : "s"} returned; this mode and novelty setting need at least ${ctx.minCandidates} serious ones`);
    idRule(cs, /^K\d+$/, "K1", "candidates", e);
    cs.forEach(c => need(c, ["name", "thesis", "mechanism", "differs_by", "objective_fit", "strongest_case", "weakest_point"], c?.id || "candidate", e));
    // Distinct in code as far as code can tell: not the same name, mechanism or axis of difference twice.
    ["name", "mechanism", "differs_by"].forEach(f => repeated(cs.map(c => norm(c?.[f]))).forEach(() => e.push(`two candidates share the same ${f}: candidates must differ materially`)));
    const q = new Set(arr(inputs?.[BP.brief]?.requirements).map(r => r.id));
    if (q.size) cs.forEach(c => arr(c.requirements_at_risk).filter(id => !q.has(id)).forEach(id => e.push(`${c.id}: requirements_at_risk cites ${id}, which is not a requirement id`)));
    return e;
  },
  [BP.selection]: (a, inputs) => {
    const e = [], d = a?.decision || {};
    need(d, ["name", "architecture", "rationale", "attack_on_favorite"], "decision", e);
    const chosen = arr(d.chosen);
    if (!chosen.length) e.push("decision.chosen empty: name the candidate ids the decision is built from");
    if (d.mode === "selected" && chosen.length > 1) e.push('decision.mode "selected" names exactly one candidate; use "combined" or "higher_order" for several');
    if (d.mode !== "selected" && !arr(d.integrated_strengths).length) e.push(`decision.mode "${d.mode}" needs integrated_strengths: what is taken from which candidate`);
    arr(a?.comparison).forEach(c => need(c, ["strongest_attack", "conclusion"], `comparison ${c?.candidate}`, e));
    const ks = arr(inputs?.[BP.candidates]?.candidates).map(c => c.id);
    if (ks.length) {
      const compared = arr(a?.comparison).map(c => c?.candidate), rejected = arr(a?.rejected).map(r => r?.candidate);
      ks.filter(k => !compared.includes(k)).forEach(k => e.push(`candidate ${k} was not compared`));
      [...compared, ...chosen, ...rejected].filter(k => !ks.includes(k)).forEach(k => e.push(`${k} is not a candidate id`));
      ks.filter(k => !chosen.includes(k) && !rejected.includes(k)).forEach(k => e.push(`candidate ${k} is neither chosen nor rejected with a reason`));
    }
    arr(a?.rejected).forEach(r => { if (!said(r?.reason)) e.push(`rejected ${r?.candidate}: reason missing`); });
    return e;
  },
  [BP.skeleton]: (a, inputs) => {
    const e = [], steps = arr(a?.steps);
    need(a, ["goal"], "skeleton", e);
    if (!steps.length) return [...e, "skeleton.steps empty"];
    const numbers = stepNumbers(steps);
    steps.forEach(s => {
      if (!Number.isInteger(s?.step)) e.push(`a step has no whole-number "step" (${JSON.stringify(s?.step)})`);
      need(s, ["title", "purpose"], `step ${s?.step}`, e);
      arr(s?.depends_on_steps).forEach(d => { if (!numbers.has(d) || d === s.step) e.push(`step ${s.step}: depends_on_steps names ${JSON.stringify(d)}, which is not another step's number`); });
    });
    repeated(steps.map(s => s?.step)).forEach(n => e.push(`step number ${n} is used more than once`));
    const reqs = arr(inputs?.[BP.brief]?.requirements).map(r => r.id);
    if (reqs.length) {
      dispositionErrors(a?.requirement_dispositions, "requirement", reqs, CARRIED, steps, e);
      steps.forEach(s => arr(s.fulfils).filter(id => !reqs.includes(id)).forEach(id => e.push(`step ${s.step}: fulfils cites ${id}, which is not a requirement id`)));
    }
    const recs = arr(inputs?.actus?.recommendations).map(r => r.id);
    if (recs.length) dispositionErrors(a?.recommendation_dispositions, "recommendation", recs, CARRIED, steps, e, { cite: true });
    // The plan builds the architecture it declares: no component and no phase without a step that realises it.
    const touched = new Set(steps.flatMap(s => arr(s.components))), phased = new Set(steps.map(s => s.phase));
    arr(a?.architecture?.components).filter(c => c?.id && !touched.has(c.id)).forEach(c => e.push(`component ${c.id} ("${c.name}") is declared in the architecture but no step builds it (steps[].components)`));
    arr(a?.phases).filter(p => p?.id && !phased.has(p.id)).forEach(p => e.push(`phase ${p.id} ("${p.name}") has no step`));
    return e;
  },
  [BP.expansion]: (a, inputs, ctx) => {
    const e = [], steps = arr(a?.steps);
    if (!steps.length) return ["expansion.steps empty"];
    repeated(steps.map(s => s?.step)).forEach(n => e.push(`step ${n} is expanded more than once`));
    const planned = inputs?.[BP.skeleton] ? stepNumbers(inputs[BP.skeleton].steps) : null;
    if (planned) {
      [...planned].filter(n => !steps.some(s => s.step === n)).forEach(n => e.push(`step ${n} of the skeleton is not expanded`));
      steps.filter(s => !planned.has(s.step)).forEach(s => e.push(`step ${JSON.stringify(s.step)} is not a step of the skeleton`));
    }
    const level = ctx.config?.blueprintLevel;
    steps.forEach(s => {
      need(s, ["instructions", "validation"], `step ${s?.step}`, e);
      ["inputs", "outputs"].filter(f => !arr(s?.[f]).length).forEach(f => e.push(`step ${s?.step}.${f}: empty`));
      if (level && level !== "L1" && !arr(s?.substeps).length) e.push(`step ${s?.step}: substeps required at level ${level}`);
      if (level === "L3" && !arr(s?.acceptance_tests).length) e.push(`step ${s?.step}: acceptance_tests required at level L3`);
    });
    return e;
  },
  [BP.criteria]: (a, inputs) => {
    const e = [];
    if (!arr(a?.success_criteria).some(said)) e.push("success_criteria empty");
    if (!arr(a?.acceptance).length) e.push("acceptance empty");
    idRule(arr(a?.acceptance), /^A\d+$/, "A1", "acceptance", e);
    arr(a?.acceptance).forEach(x => need(x, ["criterion", "method"], x?.id || "acceptance", e));
    if (!arr(a?.risk_register).length) e.push("risk_register empty");
    arr(a?.risk_register).forEach(r => need(r, ["risk", "mitigation"], "risk", e));
    // Evidence is read in every direction it can point, never only the one that confirms the plan.
    need(a?.outcome_interpretation, ["positive", "null", "contradictory", "inconclusive"], "outcome_interpretation", e);
    const reqs = arr(inputs?.[BP.brief]?.requirements);
    if (reqs.length) {
      const verified = new Set(arr(a?.acceptance).flatMap(x => arr(x.verifies)));
      [...verified].filter(id => !reqs.some(r => r.id === id)).forEach(id => e.push(`acceptance verifies ${id}, which is not a requirement id`));
      const carried = new Set(arr(inputs?.[BP.skeleton]?.requirement_dispositions).filter(d => CARRIED.includes(d.disposition)).map(d => d.requirement));
      reqs.filter(r => r.priority === "must" && carried.has(r.id) && !verified.has(r.id)).forEach(r => e.push(`${r.id}: a "must" requirement the plan carries has no acceptance entry verifying it`));
    }
    return e;
  },
  [BP.assembly]: (a) => (a?.blueprint?.goal && arr(a.blueprint.steps).length ? [] : ["assembly produced no Blueprint draft"]),
  [BP.critique]: (a) => {
    const e = [];
    if (!Array.isArray(a?.findings)) return ["critique.findings missing (an empty list is valid only when nothing is wrong; absence is not)"];
    idRule(a.findings, /^F\d+$/, "F1", "findings", e);
    a.findings.forEach(f => need(f, ["problem", "required_change"], f?.id || "finding", e));
    if (!Array.isArray(a?.objective_check?.lost)) e.push("objective_check.lost missing");
    // Something the critic found lost is a finding with a required change, so the refinement must answer it.
    else if (a.objective_check.lost.some(said) && !a.findings.some(f => ["objective_preservation", "omission", "domestication"].includes(f?.category)))
      e.push("objective_check.lost names what the draft lost, but no finding (objective_preservation, omission or domestication) requires its restoration");
    return e;
  },
};

/**
 * What the FINAL Blueprint owes the draft and the critique it was refined from (plan §15.4 step 6: "repair
 * deficiencies without silently weakening novelty or scope"). Checked only against the exact revisions it read.
 */
// REFINEMENT PRESERVES SUBSTANCE (Phase 9 corrective tranche). The live CCT run's final Blueprint returned fewer
// substeps, checklist items, inputs, outputs and acceptance entries than its assembled draft, with no finding asking
// for any of it. The rule is structural, not a length target: a list of the draft may grow or be rewritten, but it
// may not come back with fewer entries, and a part the draft holds may not come back absent — unless
// refinement.removals names that path and gives the reason. Step traces (derived_from) and the alternatives are
// judged where they always were (qualification, completion).
const KEPT_LISTS = ["assumptions", "invariants", "decision_points", "success_criteria", "risk_register", "acceptance", "phases"];
const KEPT_PARTS = ["selected_strategy", "architecture", "scope", "outcome_interpretation"];
const KEPT_STEP_LISTS = ["inputs", "outputs", "substeps", "specifications", "checklist", "acceptance_tests", "interfaces", "components", "fulfils"];
const KEPT_STEP_TEXTS = ["purpose", "instructions", "validation"];
export function preservationErrors(final, draft) {
  const e = [];
  const declared = new Set(arr(final?.refinement?.removals).filter(r => said(r?.reason)).map(r => r.path));
  const shrink = (path, before, after) => {
    const b = arr(before).length, a = arr(after).length;
    if (a < b && !declared.has(path)) e.push(`${path}: the assembled draft holds ${b} entr${b === 1 ? "y" : "ies"} and the refinement returned ${a}. Carry every entry forward; to remove one, name "${path}" in refinement.removals with the reason`);
  };
  KEPT_LISTS.forEach(k => shrink(k, draft[k], final?.[k]));
  KEPT_PARTS.filter(k => draft[k] && !final?.[k] && !declared.has(k)).forEach(k => e.push(`${k}: present in the assembled draft, absent from the refinement`));
  if (final?.architecture) shrink("architecture.components", draft.architecture?.components, final.architecture.components);
  if (final?.outcome_interpretation) Object.keys(draft.outcome_interpretation || {}).filter(k => said(draft.outcome_interpretation[k]) && !said(final.outcome_interpretation[k]))
    .forEach(k => e.push(`outcome_interpretation.${k}: present in the assembled draft, empty in the refinement`));
  const now = Object.fromEntries(arr(final?.steps).map(s => [s.step, s]));
  arr(draft.steps).filter(d => now[d.step]).forEach(d => {
    KEPT_STEP_LISTS.forEach(k => shrink(`steps[${d.step}].${k}`, d[k], now[d.step][k]));
    KEPT_STEP_TEXTS.filter(k => said(d[k]) && !said(now[d.step][k])).forEach(k => e.push(`steps[${d.step}].${k}: present in the assembled draft, empty in the refinement`));
  });
  return e;
}

/**
 * TRANSACTIONAL REFINEMENT — untouched means identical. Equal list lengths do not establish equal substance: an
 * entry can be rewritten into a thinner paraphrase and keep every count. So the refinement is read as a
 * transaction against its base: every piece of content of the base is either returned VERBATIM or lies under a
 * path the refinement DECLARES in refinement.changes (what was done, and the finding or the reason behind it).
 * An undeclared difference is refused by name, so nothing is lost by accident; a declared one is free to rewrite,
 * reorganise or replace, and is exactly what the independent evaluator is shown to judge.
 *  - a declaration must name something that actually differs (a claimed repair with no change is refused);
 *  - a finding marked "resolved" must be the stated reason of at least one declared change.
 * Trace fields (derived_from, confidence, dispositions) are not content: they have their own rules.
 */
const NOT_CONTENT = new Set(["derived_from", "confidence", "requirement_dispositions", "recommendation_dispositions", "refinement"]);
const entryKey = (x, i) => x?.step ?? x?.id ?? x?.substep ?? x?.name ?? x?.risk ?? x?.item ?? i;
function contentOf(v, path = "", out = { scalars: new Map(), members: new Map() }) {
  if (Array.isArray(v)) {
    if (v.every(x => x === null || typeof x !== "object")) out.members.set(path, new Set(v.map(String)));
    else v.forEach((x, i) => contentOf(x, `${path}[${entryKey(x, i)}]`, out));
  } else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => { if (!NOT_CONTENT.has(k)) contentOf(x, path ? `${path}.${k}` : k, out); });
  else if (v !== undefined && v !== null && v !== "") out.scalars.set(path, String(v));
  return out;
}
const covers = (declared, path) => declared.some(d => path === d || path.startsWith(`${d}.`) || path.startsWith(`${d}[`));
export function changeErrors(final, base, findingIds = []) {
  const e = [], was = contentOf(base), now = contentOf(final);
  const stepsNow = stepNumbers(final?.steps);
  const underDroppedStep = (p) => { const m = p.match(/^steps\[(\d+)\]/); return m && !stepsNow.has(Number(m[1])); }; // reported as a dropped step
  const changes = arr(final?.refinement?.changes), removals = arr(final?.refinement?.removals).filter(r => said(r?.reason)).map(r => r.path);
  const declared = [...changes.filter(c => said(c?.path)).map(c => c.path), ...removals];
  const differing = new Set();
  was.scalars.forEach((v, p) => { if (now.scalars.get(p) !== v) differing.add(p); });
  was.members.forEach((set, p) => { if ([...set].some(x => !now.members.get(p)?.has(x))) differing.add(p); });
  [...differing].filter(p => !underDroppedStep(p) && !covers(declared, p))
    .forEach(p => e.push(`${p}: differs from the base and is not declared. Return it word for word, or declare the change in refinement.changes with its path and reason`));
  // What the refinement added: content at a path the base does not hold, or a new member of a list.
  const added = new Set();
  now.scalars.forEach((v, p) => { if (!was.scalars.has(p)) added.add(p); });
  now.members.forEach((set, p) => { if ([...set].some(x => !was.members.get(p)?.has(x))) added.add(p); });
  const touched = [...differing, ...added];
  changes.forEach((c, i) => {
    if (!said(c?.path)) { e.push(`refinement.changes[${i}].path: missing`); return; }
    if (!said(c.what)) e.push(`refinement.changes ${c.path}: "what" is missing — say what was changed`);
    if (c.finding ? !findingIds.includes(c.finding) : !said(c.reason)) e.push(`refinement.changes ${c.path}: ${c.finding ? `cites ${c.finding}, which is not a finding it was given` : "needs the finding it answers or its reason"}`);
    if (!touched.some(p => covers([c.path], p))) e.push(`refinement.changes names ${c.path}, but nothing there differs from the base: a declared repair must be an actual change`);
  });
  return e;
}

export function refinementErrors(final, inputs = {}) {
  const e = [];
  const draft = inputs[BP.assembly]?.blueprint;
  const findingIds = arr(inputs[BP.critique]?.findings).map(f => f.id);
  if (draft) {
    const lost = preservationErrors(final, draft);
    const lostAt = lost.map(x => x.split(":")[0]);
    // A loss already named as a whole (a list that came back shorter) is not repeated entry by entry.
    e.push(...lost, ...changeErrors(final, draft, findingIds).filter(x => !covers(lostAt, x.split(":")[0])));
    // The alternatives are the comparison's record: none of the base's may disappear (plan §15.1–15.3).
    const b = arr(draft.alternative_approaches).length, a = arr(final?.alternative_approaches).length;
    if (a < b) e.push(`alternative_approaches: the base holds ${b} and the refinement returned ${a}. Every alternative that was seriously compared stays on the record`);
    const kept = stepNumbers(final?.steps);
    arr(draft.steps).filter(s => !kept.has(s.step)).forEach(s => e.push(`step ${s.step} ("${s.title}") of the assembled draft was dropped: refinement adds and repairs, it does not remove`));
    const declared = new Set(arr(final?.refinement?.scope_changes).filter(c => said(c?.reason)).map(c => c.requirement));
    const now = Object.fromEntries(arr(final?.requirement_dispositions).map(d => [d.requirement, d.disposition]));
    arr(draft.requirement_dispositions).forEach(d => {
      if (!now[d.requirement]) e.push(`requirement ${d.requirement} lost its disposition in refinement`);
      else if (CARRIED.includes(d.disposition) && !CARRIED.includes(now[d.requirement]) && !declared.has(d.requirement))
        e.push(`requirement ${d.requirement} went from ${d.disposition} to ${now[d.requirement]} without an entry in refinement.scope_changes giving the reason`);
    });
  }
  const findings = arr(inputs[BP.critique]?.findings);
  const answered = Object.fromEntries(arr(final?.refinement?.dispositions).map(d => [d.finding, d]));
  findings.forEach(f => {
    const d = answered[f.id];
    if (!d) e.push(`critique finding ${f.id} has no entry in refinement.dispositions`);
    else if (d.action === "resolved" && !said(d.change)) e.push(`${f.id}: resolved needs "change" — what was changed, and where`);
    else if (d.action === "resolved" && draft && !arr(final?.refinement?.changes).some(c => c?.finding === f.id)) e.push(`${f.id}: marked resolved, but no entry of refinement.changes cites ${f.id}: a resolution is a change that can be pointed to`);
    else if (d.action === "declined" && !said(d.reason)) e.push(`${f.id}: declined needs its reason`);
  });
  return e;
}

/** `ctx`: { config, minCandidates }. */
export const pipelineIntegrity = (stageKey, output, inputs = {}, ctx = {}) => (RULES[stageKey] ? RULES[stageKey](output, inputs, ctx) : []);

// ── Deterministic assembly (plan §15.4 step 4) ─────────────────────
const prune = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));
/**
 * Merge the validated sub-artifacts into one Blueprint draft. Pure and total: nothing is summarised, re-worded or
 * dropped. Every skeleton step is joined with its expansion by step number; the candidates that were not adopted as
 * proposed become the alternatives, each carrying the comparison's case against it.
 */
export function assembleBlueprint(inputs = {}) {
  const brief = inputs[BP.brief] || {}, sel = inputs[BP.selection] || {}, sk = inputs[BP.skeleton] || {}, cr = inputs[BP.criteria] || {};
  const d = sel.decision || {}, chosen = arr(d.chosen);
  const compared = Object.fromEntries(arr(sel.comparison).map(c => [c.candidate, c]));
  const rejected = Object.fromEntries(arr(sel.rejected).map(r => [r.candidate, r]));
  const detail = Object.fromEntries(arr(inputs[BP.expansion]?.steps).map(s => [s.step, s]));
  const alternatives = arr(inputs[BP.candidates]?.candidates).filter(c => d.mode !== "selected" || !chosen.includes(c.id)).map(c => prune({
    id: c.id, name: c.name, thesis: c.thesis, mechanism: c.mechanism, epistemic_status: c.epistemic_status,
    pros: [c.strongest_case, ...arr(d.integrated_strengths).filter(s => s.from === c.id).map(s => `Carried into the selected strategy: ${s.what}`)].filter(said),
    cons: [c.weakest_point, compared[c.id]?.strongest_attack, ...arr(compared[c.id]?.failure_modes)].filter(said),
    why_not_chosen: rejected[c.id]?.reason || (chosen.includes(c.id) ? `Not adopted as proposed: its strengths are integrated into "${d.name}".` : compared[c.id]?.conclusion),
    salvaged: rejected[c.id]?.salvaged,
  }));
  return prune({
    goal: sk.goal, objective: brief.objective, pathway: brief.pathway, assumptions: arr(sk.assumptions),
    selected_strategy: prune({ name: d.name, mode: d.mode, built_from: chosen, architecture: d.architecture, rationale: d.rationale,
      attack_on_favorite: d.attack_on_favorite, residual_weaknesses: d.residual_weaknesses, integrated_strengths: d.integrated_strengths, derived_from: d.derived_from }),
    alternative_approaches: alternatives,
    architecture: sk.architecture, phases: sk.phases, scope: sk.scope, invariants: sk.invariants, decision_points: sk.decision_points,
    steps: [...arr(sk.steps)].sort((x, y) => x.step - y.step).map(s => { const { step: _n, ...rest } = detail[s.step] || {}; return { ...s, ...rest }; }),
    success_criteria: arr(cr.success_criteria), acceptance: cr.acceptance, outcome_interpretation: cr.outcome_interpretation, risk_register: arr(cr.risk_register),
    requirement_dispositions: sk.requirement_dispositions, recommendation_dispositions: sk.recommendation_dispositions,
  });
}