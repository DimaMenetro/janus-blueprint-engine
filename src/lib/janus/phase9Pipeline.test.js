// Phase 9 — the Blueprint cognitive pipeline (plan §15). New tests; nothing here edits an earlier one.
// Expectations are stated independently of the engine: the pipeline, its dependencies and what each rule must
// refuse are written out here, and the engine, the integrity rules and the qualification are checked against them.
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, previewRerun, rerunStages, rerunBlueprint } from "@/lib/janus/browserAdapter";
import { BP, pipelineIntegrity, refinementErrors, assembleBlueprint } from "@/lib/janus/blueprintPipeline";
import { normalizeStageOutput } from "@/lib/janus/stageRunner";
import { deriveQualification, evaluatorConsistency, inheritanceFindings } from "@/lib/janus/qualification";
import { composeRunView } from "@/lib/janus/runView";
import { deriveExecutionState } from "@/lib/janus/executionState";
import { INTERSECTION_KEYS } from "@/lib/janus/stageModel";

const PIPELINE = ["blueprint:brief", "blueprint:candidates", "blueprint:selection", "blueprint:skeleton", "blueprint:expansion", "blueprint:criteria",
  "blueprint:assembly", "blueprint:critique", "blueprint"];
const UPSTREAM = ["refresh", "corpus", "cogito", "animus", "actus", ...INTERSECTION_KEYS, "synthesis"];
const FULL_PROMPT = "ACTUS: Key Recommendations [pattern:"; // what a Full-mode pipeline prompt shows the test model
const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const clone = (x) => JSON.parse(JSON.stringify(x));
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId), h.db.RunAttempt.filter(a => a.run_id === runId));
const stagesOf = (key) => h.db.RunStage.filter(s => s.stage_key === key);
const stageOf = (key) => stagesOf(key).pop();
const calls = (key) => h.llm.stages.filter(s => s === key).length;
const ids = (keys) => keys.map(k => stageOf(k).id).sort();
const out = (key, prompt = FULL_PROMPT) => clone(h.pipeline[key](prompt));

beforeEach(() => h.reset());

describe("the Blueprint is a pipeline of durable stages", () => {
  it("every stage is a validated revision that read exactly the revisions its place in the chain names", async () => {
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("completed");
    PIPELINE.forEach(k => expect(stagesOf(k).map(s => [s.revision, s.status, s.validation.valid])).toEqual([[1, "succeeded", true]]));
    const reads = (key) => [...stageOf(key).depends_on].sort();
    expect(reads("blueprint:brief")).toEqual([]); // the operator's query alone
    expect(reads("blueprint:candidates")).toEqual(ids([...UPSTREAM, "blueprint:brief"]));
    expect(reads("blueprint:selection")).toEqual(ids([...UPSTREAM, "blueprint:brief", "blueprint:candidates"]));
    expect(reads("blueprint:skeleton")).toEqual(ids([...UPSTREAM, "blueprint:brief", "blueprint:candidates", "blueprint:selection"]));
    expect(reads("blueprint:expansion")).toEqual(ids([...UPSTREAM, "blueprint:brief", "blueprint:selection", "blueprint:skeleton"]));
    expect(reads("blueprint:criteria")).toEqual(ids([...UPSTREAM, "blueprint:brief", "blueprint:selection", "blueprint:skeleton", "blueprint:expansion"]));
    expect(reads("blueprint:critique")).toEqual(ids([...UPSTREAM, "blueprint:brief", "blueprint:assembly"]));
    expect(reads("blueprint")).toEqual(ids([...UPSTREAM, "blueprint:brief", "blueprint:assembly", "blueprint:critique"]));
    // The evaluation is bound to the final Blueprint and reads the reasoning behind it.
    expect(reads("qualification")).toEqual(ids([...UPSTREAM, "blueprint", "blueprint:brief", "blueprint:candidates", "blueprint:selection", "blueprint:critique"]));
    expect(h.db.Run[0].released_blueprint_stage_id).toBe(stageOf("blueprint").id);

    const view = viewOf(runId);
    expect(Object.keys(view.pipeline)).toEqual(PIPELINE.slice(0, -1)); // the reasoning record, apart from the protocol artifacts
    expect(Object.keys(view.artifacts)).not.toContain("blueprint:brief");
    expect(deriveExecutionState(view).rows.map(r => r.key).filter(k => k.startsWith("blueprint"))).toEqual(PIPELINE);
  });

  it("the assembly is computed by code from the recorded sub-artifacts: no model call, no attempt, nothing reworded or dropped", async () => {
    await executeJanus(params("full"));
    const assembly = stageOf("blueprint:assembly");
    expect(calls("blueprint:assembly")).toBe(0);
    expect(h.db.RunAttempt.filter(a => a.stage_id === assembly.id)).toEqual([]);
    expect(assembly.provenance).toMatchObject({ method: "deterministic" });
    expect(assembly.input_fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);

    const recorded = Object.fromEntries(["blueprint:brief", "blueprint:candidates", "blueprint:selection", "blueprint:skeleton", "blueprint:expansion", "blueprint:criteria"].map(k => [k, stageOf(k).output]));
    const draft = assembly.output.blueprint;
    expect(draft).toEqual(assembleBlueprint(recorded)); // a pure function of what was recorded
    expect(draft.objective).toBe(recorded["blueprint:brief"].objective);
    expect(draft.selected_strategy).toMatchObject({ name: "Approach 1", mode: "selected", built_from: ["K1"], attack_on_favorite: "Its pilot may not generalise" });
    // The three candidates that were not selected become the alternatives, each with the case made against it.
    expect(draft.alternative_approaches.map(a => [a.id, a.why_not_chosen])).toEqual([["K2", "Reason against 2"], ["K3", "Reason against 3"], ["K4", "Reason against 4"]]);
    expect(draft.alternative_approaches[0].cons).toEqual(["Weak point of 2", "Attack on 2"]);
    // Every skeleton step is joined with its own expansion, by step number.
    expect(draft.steps.map(s => [s.step, s.title, s.purpose, s.instructions, s.validation])).toEqual(
      recorded["blueprint:skeleton"].steps.map(s => [s.step, s.title, s.purpose, "Do it", "Check it"]));
    expect(draft.acceptance).toEqual(recorded["blueprint:criteria"].acceptance);
    expect(assembly.output.audit.findings).toEqual([]); // the code audit of a sound draft finds nothing
  });

  it("Quick has no self-critique: its Blueprint refines the assembled draft against the code audit alone", async () => {
    const { status } = await executeJanus(params("quick"));
    expect(status).toBe("completed");
    expect(stagesOf("blueprint:critique")).toEqual([]);
    expect(h.llm.stages).toEqual(["corpus", "cogito", ...PIPELINE.filter(k => !["blueprint:assembly", "blueprint:critique"].includes(k)), "qualification"]);
    expect([...stageOf("blueprint").depends_on].sort()).toEqual(ids(["corpus", "cogito", "blueprint:brief", "blueprint:assembly"]));
  });

  it("the stored artifact is the validated one: the schema's normalizations are applied once, before validation", () => {
    const raw = { goal: "g", steps: [{ step: "2", title: "t", instructions: "i", depends_on_steps: ["1"] }], risk_register: [{ risk: "r", impact: "medium", mitigation: "m" }] };
    const stored = normalizeStageOutput("blueprint", raw);
    expect(stored.steps[0]).toMatchObject({ step: 2, depends_on_steps: [1] });
    expect(stored.risk_register[0].impact).toBe("med");
    expect(raw.steps[0].step).toBe("2"); // the model's own text is not rewritten in place
  });
});

describe("each stage is held to what it owes the stages it read", () => {
  const brief = out("blueprint:brief"), candidates = out("blueprint:candidates"), skeleton = out("blueprint:skeleton");
  const errorsOf = (key, output, inputs = {}, ctx = {}) => pipelineIntegrity(key, output, inputs, ctx);

  it("the deterministic outputs of a sound pipeline pass every rule", () => {
    const inputs = { "blueprint:brief": brief, "blueprint:candidates": candidates, "blueprint:skeleton": skeleton, actus: h.out.actus };
    ["blueprint:brief", "blueprint:candidates", "blueprint:selection", "blueprint:skeleton", "blueprint:expansion", "blueprint:criteria", "blueprint:critique"]
      .forEach(k => expect(errorsOf(k, out(k), inputs, { minCandidates: 3, config: { blueprintLevel: "L2" } })).toEqual([]));
  });

  it("brief: an objective with no guard against a narrower reformulation is refused", () => {
    expect(errorsOf("blueprint:brief", { ...brief, ambition_guard: [] })).toEqual([expect.stringMatching(/^brief\.ambition_guard empty/)]);
    expect(errorsOf("blueprint:brief", { ...brief, requirements: [{ id: "R1", text: "x" }] })).toEqual(["requirements[0].id must look like Q1"]);
  });

  it("candidates: fewer than the mode needs, or two that share a mechanism, are refused", () => {
    expect(errorsOf("blueprint:candidates", { ...candidates, candidates: candidates.candidates.slice(0, 2) }, {}, { minCandidates: 3 }))
      .toEqual([expect.stringMatching(/^2 candidates returned; .* at least 3 serious ones$/)]);
    const twins = clone(candidates);
    twins.candidates[1].mechanism = `  ${twins.candidates[0].mechanism.toUpperCase()} `; // the same mechanism, re-cased
    expect(errorsOf("blueprint:candidates", twins)).toEqual(["two candidates share the same mechanism: candidates must differ materially"]);
    const vague = clone(candidates);
    delete vague.candidates[2].weakest_point;
    expect(errorsOf("blueprint:candidates", vague)).toEqual(["K3.weakest_point: missing"]);
  });

  it("selection: every candidate is compared and either chosen or rejected with a reason; a combination says what it takes from whom", () => {
    const inputs = { "blueprint:candidates": candidates };
    const silent = out("blueprint:selection");
    silent.rejected = silent.rejected.filter(r => r.candidate !== "K3");
    silent.comparison = silent.comparison.filter(c => c.candidate !== "K4");
    expect(errorsOf("blueprint:selection", silent, inputs)).toEqual(["candidate K4 was not compared", "candidate K3 is neither chosen nor rejected with a reason"]);
    const combined = out("blueprint:selection");
    Object.assign(combined.decision, { mode: "combined", chosen: ["K1", "K2"] });
    combined.rejected = combined.rejected.filter(r => r.candidate !== "K2");
    expect(errorsOf("blueprint:selection", combined, inputs)).toEqual(['decision.mode "combined" needs integrated_strengths: what is taken from which candidate']);
    const unattacked = out("blueprint:selection");
    delete unattacked.decision.attack_on_favorite;
    expect(errorsOf("blueprint:selection", unattacked, inputs)).toEqual(["decision.attack_on_favorite: missing"]);
  });

  it("skeleton: every requirement and every Actus recommendation has a disposition, and inheritance is a step that cites it", () => {
    const inputs = { "blueprint:brief": brief, actus: h.out.actus };
    const dropped = clone(skeleton);
    dropped.requirement_dispositions = [];
    expect(errorsOf("blueprint:skeleton", dropped, inputs)).toEqual([expect.stringMatching(/^requirement Q1 has no disposition/)]);
    const labelOnly = clone(skeleton);
    labelOnly.steps.find(s => s.step === 2).derived_from = ["animus:1"]; // R1 is "implemented" in step 2, which no longer builds on it
    expect(errorsOf("blueprint:skeleton", labelOnly, inputs)).toEqual(["R1: marked implemented, but no step it names lists R1 in derived_from"]);
    const deferred = clone(skeleton);
    deferred.recommendation_dispositions = [{ recommendation: "R1", disposition: "deferred" }];
    expect(errorsOf("blueprint:skeleton", deferred, inputs)).toEqual(["R1: deferred needs its reasoning"]);
    const dangling = clone(skeleton);
    dangling.steps[1].depends_on_steps = [9];
    expect(errorsOf("blueprint:skeleton", dangling, inputs)).toEqual(["step 2: depends_on_steps names 9, which is not another step's number"]);
  });

  it("expansion: exactly the skeleton's steps, each with what its level demands", () => {
    const inputs = { "blueprint:skeleton": skeleton };
    const short = out("blueprint:expansion");
    short.steps = short.steps.filter(s => s.step !== 2);
    expect(errorsOf("blueprint:expansion", short, inputs)).toEqual(["step 2 of the skeleton is not expanded"]);
    const thin = out("blueprint:expansion");
    thin.steps[0].substeps = [];
    expect(errorsOf("blueprint:expansion", thin, inputs, { config: { blueprintLevel: "L2" } })).toEqual(["step 1: substeps required at level L2"]);
    expect(errorsOf("blueprint:expansion", thin, inputs, { config: { blueprintLevel: "L1" } })).toEqual([]);
  });

  it("criteria: a carried \"must\" requirement is verified, and evidence is read in every direction it can point", () => {
    const inputs = { "blueprint:brief": brief, "blueprint:skeleton": skeleton };
    const unverified = out("blueprint:criteria");
    unverified.acceptance[0].verifies = [];
    expect(errorsOf("blueprint:criteria", unverified, inputs)).toEqual(['Q1: a "must" requirement the plan carries has no acceptance entry verifying it']);
    const confirming = out("blueprint:criteria");
    delete confirming.outcome_interpretation.contradictory;
    delete confirming.outcome_interpretation.null;
    expect(errorsOf("blueprint:criteria", confirming, inputs)).toEqual(["outcome_interpretation.null: missing", "outcome_interpretation.contradictory: missing"]);
  });

  it("refinement repairs and adds: it drops no step, weakens no requirement in silence and answers every finding", () => {
    const draft = assembleBlueprint({ "blueprint:brief": brief, "blueprint:candidates": candidates, "blueprint:selection": out("blueprint:selection"),
      "blueprint:skeleton": skeleton, "blueprint:expansion": out("blueprint:expansion"), "blueprint:criteria": out("blueprint:criteria") });
    const inputs = { "blueprint:assembly": { blueprint: draft }, "blueprint:critique": out("blueprint:critique") };
    const answered = { dispositions: [{ finding: "F1", action: "resolved", change: "Step 1 now states its interface" }] };
    expect(refinementErrors({ ...draft, refinement: answered }, inputs)).toEqual([]);
    expect(refinementErrors({ ...draft, steps: draft.steps.slice(0, 2), refinement: answered }, inputs))
      .toEqual(['step 3 ("Scale") of the assembled draft was dropped: refinement adds and repairs, it does not remove']);
    const weakened = { ...draft, refinement: answered, requirement_dispositions: [{ requirement: "Q1", disposition: "deferred", reasoning: "later" }] };
    expect(refinementErrors(weakened, inputs)).toEqual(["requirement Q1 went from implemented to deferred without an entry in refinement.scope_changes giving the reason"]);
    weakened.refinement = { ...answered, scope_changes: [{ requirement: "Q1", what: "deferred", reason: "The pilot site is not available" }] };
    expect(refinementErrors(weakened, inputs)).toEqual([]); // a declared, reasoned change of scope is allowed
    expect(refinementErrors({ ...draft, refinement: { dispositions: [] } }, inputs)).toEqual(["critique finding F1 has no entry in refinement.dispositions"]);
    expect(refinementErrors({ ...draft, refinement: { dispositions: [{ finding: "F1", action: "declined" }] } }, inputs)).toEqual(["F1: declined needs its reason"]);
  });
});

describe("failure, continuity and regeneration inside the pipeline", () => {
  it("a final Blueprint that drops a step of its draft is a schema failure: the draft and its reasoning stay, nothing is released", async () => {
    const final = h.blueprintFor(FULL_PROMPT);
    h.llm.override.blueprint = { ...final, steps: final.steps.slice(0, 2) };
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("partial");
    expect(stageOf("blueprint")).toMatchObject({ status: "failed", error_class: "schema_failure" });
    expect(stageOf("blueprint").validation.errors).toEqual(expect.arrayContaining([expect.stringMatching(/^step 3 \("Scale"\) of the assembled draft was dropped/)]));
    expect(calls("blueprint")).toBe(3); // its own bounded attempts
    PIPELINE.slice(0, -1).forEach(k => expect(stageOf(k).status).toBe("succeeded"));
    expect(viewOf(runId).artifacts.blueprint).toBeUndefined();
    expect(calls("qualification")).toBe(0);
    expect(h.db.Run[0].released_blueprint_stage_id).toBe("");
  });

  it("a session lost mid-pipeline resumes at the stage it was on: the valid stages before it are not bought again", async () => {
    h.llm.transport["blueprint:expansion"] = "unreached"; // the request never reaches the platform: no call was made
    const first = await executeJanus(params("standard"));
    h.llm.transport = {};
    expect(first).toMatchObject({ status: "running", refused: { stageKey: "blueprint:expansion", reason: "never_claimed" } });
    const before = ["blueprint:brief", "blueprint:candidates", "blueprint:selection", "blueprint:skeleton"].map(k => stageOf(k).id);
    h.llm.stages.length = 0;

    const result = await resumeJanus(first.runId);
    expect(result.status).toBe("completed");
    expect(h.llm.stages).toEqual(["blueprint:expansion", "blueprint:criteria", "blueprint:critique", "blueprint", "qualification"]);
    expect(["blueprint:brief", "blueprint:candidates", "blueprint:selection", "blueprint:skeleton"].map(k => stageOf(k).id)).toEqual(before);
    // The first request made no call, so its revision was closed as not started (no failure invented) and the stage ran once.
    expect(stagesOf("blueprint:expansion").map(s => [s.revision, s.status])).toEqual([[1, "cancelled"], [2, "succeeded"]]);
    expect(h.db.RunAttempt.filter(a => a.stage_key === "blueprint:expansion").map(a => a.outcome)).toEqual(["not_started", "succeeded"]);
  });

  it("re-running one pipeline stage regenerates exactly what read it; the brief, the candidates and all upstream cognition are reused", async () => {
    const { runId } = await executeJanus(params("full"));
    const impact = await previewRerun(runId, { targets: ["blueprint:selection"], cascade: true });
    expect(impact.refusals).toEqual([]);
    expect(impact.plan).toEqual(PIPELINE.slice(2));
    expect(impact.unaffected.map(u => u.key).sort()).toEqual([...UPSTREAM, "blueprint:brief", "blueprint:candidates"].sort());
    expect(impact.qualification).toEqual({ next: "re_evaluated", evaluationInvalidated: true, releaseWithdrawn: true });

    h.llm.stages.length = 0;
    await rerunStages(runId, { targets: ["blueprint:selection"], cascade: true, expected: impact.token });
    expect(h.llm.stages).toEqual([...PIPELINE.slice(2).filter(k => k !== "blueprint:assembly"), "qualification"]);
    const view = viewOf(runId);
    PIPELINE.slice(2).forEach(k => expect(view.stageInfo[k]).toMatchObject({ active: expect.objectContaining({ revision: 2 }), stale: null }));
    [...UPSTREAM, "blueprint:brief", "blueprint:candidates"].forEach(k => expect(view.stageInfo[k].active.revision).toBe(1));
    expect(stagesOf("blueprint:assembly").map(s => s.revision)).toEqual([1, 2]); // a computed stage is versioned like any other
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified", released_blueprint_stage_id: view.stageInfo.blueprint.active.id });
  });

  it("one Blueprint, one pipeline: when a stage of a re-run cannot be replaced, nothing is built on its predecessor", async () => {
    const { runId } = await executeJanus(params("full"));
    const current = stageOf("blueprint").id;
    h.llm.failOn = "blueprint:candidates"; h.llm.stages.length = 0;
    const result = await rerunBlueprint(runId);
    h.llm.failOn = null;
    expect(h.llm.stages).toEqual(["blueprint:brief", "blueprint:candidates", "blueprint:candidates", "blueprint:candidates"]); // its own bounded attempts, then nothing
    expect(stagesOf("blueprint:candidates").map(s => [s.revision, s.status])).toEqual([[1, "succeeded"], [2, "failed"]]);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/^blueprint:selection: not started — blueprint:candidates, which it builds on, produced no valid new version in this operation$/)]));
    PIPELINE.slice(2).forEach(k => expect(stagesOf(k)).toHaveLength(1)); // no revision, no call, for anything after it
    expect(viewOf(runId).stageInfo.blueprint.active.id).toBe(current); // the Blueprint the operator has is the one they had
  });
});

describe("qualification holds the Blueprint, and the evaluator, to the record", () => {
  it("a disposition is checked against the plan: an uncited recommendation and an unverified must-requirement are failures decided by code", () => {
    const brief = out("blueprint:brief");
    const bp = h.blueprintFor(FULL_PROMPT);
    const artifacts = { actus: h.out.actus, blueprint: { ...bp, acceptance: out("blueprint:criteria").acceptance } };
    expect(inheritanceFindings(artifacts, brief)).toEqual({ requirements: [], recommendations: [] });

    const uncited = clone(artifacts);
    uncited.blueprint.steps.forEach(s => { s.derived_from = (s.derived_from || []).filter(x => x !== "R1"); });
    expect(inheritanceFindings(uncited, brief).recommendations).toEqual(["R1: marked implemented, but no step it names cites it"]);
    const unverified = clone(artifacts);
    unverified.blueprint.acceptance[0].verifies = [];
    expect(inheritanceFindings(unverified, brief).requirements).toEqual(['Q1: a "must" requirement with no acceptance entry verifying it']);
    const silent = clone(artifacts);
    silent.blueprint.requirement_dispositions = [];
    expect(inheritanceFindings(silent, brief).requirements).toEqual(["Q1: the operator's requirement has no disposition (Run a bounded pilot before scaling)"]);
    // A historical Blueprint recorded no dispositions and is judged as it always was.
    expect(inheritanceFindings({ actus: h.out.actus, blueprint: { goal: "old", steps: [] } }, undefined)).toEqual({ requirements: [], recommendations: [] });
  });

  it.each([
    ["names nothing the Blueprint adds beyond the operator's material", { intellectual_surplus: [] }, "non_obviousness"],
    ["finds the operator's objective only partly preserved", { objective_preservation: { preserved: "partly", lost: ["city-wide service"] } }, "feasibility_without_domestication"],
    ["records a blocking error of substance", { substantive_errors: [{ error: "The pilot cannot measure trust", severity: "blocking" }] }, "adversarial_robustness"],
  ])("an evaluator that passes every criterion but %s does not release the Blueprint", async (_name, findings, criterion) => {
    Object.assign(h.llm.findings, findings);
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("completed"); // completion and quality are separate
    const q = deriveQualification(viewOf(runId));
    const failed = q.criteria.filter(c => c.applies && c.verdict !== "pass");
    expect(failed.map(c => c.id)).toEqual([criterion]);
    expect(failed[0].reasons[1]).toMatch(/^The evaluator's own answer was "pass"/); // its answer is kept on the record beside the reason it was not accepted
    expect(q.release.released).toBe(false);
    expect(h.db.Run[0]).toMatchObject({ qualification_state: "refinement_required", released_blueprint_stage_id: "" });
    expect(q.findings).toMatchObject(findings);
  });

  it("an evaluation recorded before these findings existed is read as it was", () => {
    expect(evaluatorConsistency({ verdicts: {}, strongest_objection: "o" })).toEqual({});
    expect(evaluatorConsistency(undefined)).toEqual({});
    expect(evaluatorConsistency({ intellectual_surplus: ["x"], objective_preservation: { preserved: "yes", lost: [] }, substantive_errors: [{ error: "typo", severity: "minor" }] })).toEqual({});
  });
});