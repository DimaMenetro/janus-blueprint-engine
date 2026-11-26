// Cognitive restoration tranche — transactional refinement, the bounded substantive-refinement cycle, the brief's
// account of the operator's material, and the plan's coverage of its own architecture. Additions only.
// Expectations are written out here, independently of the engine's own derivations.
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, refineJanus, NO_REFINEMENT_MESSAGE, OPERATOR_ONLY_MESSAGE } from "@/lib/janus/browserAdapter";
import { composeRunView } from "@/lib/janus/runView";
import { deriveQualification } from "@/lib/janus/qualification";
import { changeErrors, sourceOutline, BP } from "@/lib/janus/blueprintPipeline";
import { stageIntegrity, QUALITY_CRITERIA, MAX_REFINEMENT_CYCLES } from "@/lib/janus/lifecycleContract";
import { compileStage } from "@/lib/janus/stageCompiler";

const params = { queryText: "How should a city pilot autonomous transit?", executionMode: "full", outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false };
const stagesOf = (key) => h.db.RunStage.filter(s => s.stage_key === key);
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId));
const qOf = (runId) => deriveQualification(viewOf(runId));
const clone = (x) => JSON.parse(JSON.stringify(x));
const CRITERION = QUALITY_CRITERIA.find(c => c.method === "critique" && c.hard).id;
const failedRun = async () => {
  h.llm.verdicts[CRITERION] = "fail";
  const { runId } = await executeJanus(params);
  return runId;
};

beforeEach(() => h.reset());

describe("a refinement is a transaction against its base", () => {
  const base = { goal: "Pilot one district", assumptions: ["a1", "a2"],
    steps: [{ step: 1, title: "Scope", instructions: "Map the district in detail", checklist: ["k1", "k2"], substeps: [{ substep: "1a", details: "Survey every stop" }], derived_from: ["C1"], confidence: "Contested" }] };

  it("returns the base word for word, and an undeclared paraphrase of the same length is refused by path", () => {
    expect(changeErrors(clone(base), base)).toEqual([]);
    const thinner = clone(base);
    thinner.steps[0].substeps[0].details = "Survey stops"; // same count, less substance
    thinner.steps[0].checklist = ["k1", "k2 (simplified)"];
    expect(changeErrors(thinner, base)).toEqual([
      "steps[1].substeps[1a].details: differs from the base and is not declared. Return it word for word, or declare the change in refinement.changes with its path and reason",
      "steps[1].checklist: differs from the base and is not declared. Return it word for word, or declare the change in refinement.changes with its path and reason",
    ]);
  });

  it("a declared change is free, needs its finding or reason, and must be a real change", () => {
    const better = clone(base);
    better.steps[0].instructions = "Map the district in detail, then rank stops by transfer demand";
    better.refinement = { changes: [{ path: "steps[1].instructions", finding: "F1", what: "Added the ranking rule" }] };
    expect(changeErrors(better, base, ["F1"])).toEqual([]);
    better.refinement.changes[0].finding = "F9";
    expect(changeErrors(better, base, ["F1"])).toEqual(["refinement.changes steps[1].instructions: cites F9, which is not a finding it was given"]);
    better.refinement.changes = [{ path: "steps[1].instructions", what: "Added the ranking rule" }];
    expect(changeErrors(better, base, ["F1"])).toEqual(["refinement.changes steps[1].instructions: needs the finding it answers or its reason"]);
    const idle = { ...clone(base), refinement: { changes: [{ path: "goal", what: "Sharpened", reason: "Clarity" }] } };
    expect(changeErrors(idle, base)).toEqual(["refinement.changes names goal, but nothing there differs from the base: a declared repair must be an actual change"]);
  });

  it("trace fields are not content, and additions need no permission to exist", () => {
    const next = clone(base);
    next.steps[0].derived_from.push("R1");
    next.steps[0].confidence = "Speculative";
    next.assumptions.push("a3");
    next.steps.push({ step: 2, title: "Pilot", instructions: "Run it" });
    expect(changeErrors(next, base)).toEqual([]);
  });
});

describe("bounded substantive refinement of a Blueprint that failed qualification", () => {
  it("offers a cycle only for an evaluated, failed Blueprint, with the failed criteria as its findings", async () => {
    const runId = await failedRun();
    const q = qOf(runId);
    expect(q.state).toBe("refinement_required");
    expect(q.refinement).toMatchObject({ used: 0, max: MAX_REFINEMENT_CYCLES, remaining: MAX_REFINEMENT_CYCLES, available: true });
    expect(q.refinement.deficiencies.map(d => [d.id, d.category, d.problem])).toEqual([["E1", CRITERION, `${CRITERION} evidence`]]);

    h.reset();
    const ok = await executeJanus(params);
    expect(qOf(ok.runId).refinement).toMatchObject({ used: 0, available: false });
    await expect(refineJanus(ok.runId)).rejects.toThrow(NO_REFINEMENT_MESSAGE);
    expect(stagesOf("blueprint")).toHaveLength(1);
  });

  it("a cycle makes one new Blueprint revision on the evaluated one, then one independent evaluation, and can release it", async () => {
    const runId = await failedRun();
    const [first] = stagesOf("blueprint"), [firstEval] = stagesOf("qualification");
    const before = h.llm.stages.length;
    h.llm.verdicts = {}; // the evaluator judges the refined Blueprint on its merits
    const res = await refineJanus(runId);
    expect(h.llm.stages.slice(before)).toEqual(["blueprint", "qualification"]);
    expect(res).toMatchObject({ cycle: 1, status: "completed", qualification: "qualified", failure: null, unresolved: null });

    const [, second] = stagesOf("blueprint"), [, secondEval] = stagesOf("qualification");
    expect(second).toMatchObject({ revision: 2, status: "succeeded" });
    expect(second.provenance).toMatchObject({ origin: "refinement", refines: { blueprint_stage_id: first.id, evaluation_stage_id: firstEval.id, cycle: 1 } });
    expect(second.provenance.refines.deficiencies.map(d => d.id)).toEqual(["E1"]);
    expect(second.depends_on).toEqual(first.depends_on); // the pipeline's reasoning is kept, not regenerated
    expect(second.output.success_criteria).toEqual([...first.output.success_criteria, "Refined in cycle 1"]);
    expect(second.output.steps).toEqual(first.output.steps); // untouched means identical
    expect(secondEval.depends_on).toContain(second.id);
    expect(first.status).toBe("succeeded"); // the evaluated revision stays in the lineage, as it was
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified", released_blueprint_stage_id: second.id });
    expect(qOf(runId).refinement).toMatchObject({ used: 1, available: false });
    // The prompt carried the evaluated Blueprint and the evaluator's evidence, not the assembled draft.
    const prompt = h.llm.prompts[before];
    expect(prompt).toContain("SUBSTANTIVE REFINEMENT — cycle 1 of 2");
    expect(prompt).toContain(`${CRITERION} evidence`);
  });

  it("after the last cycle still fails, the state is limitation_reported: unreleased, reported, and no further cycle", async () => {
    const runId = await failedRun();
    await refineJanus(runId);
    expect(h.db.Run[0].qualification_state).toBe("refinement_required");
    const res = await refineJanus(runId);
    expect(res).toMatchObject({ cycle: 2, qualification: "limitation_reported" });
    const q = qOf(runId);
    expect(q.state).toBe("limitation_reported");
    expect(q.refinement).toMatchObject({ used: 2, remaining: 0, available: false });
    expect(q.limitations.map(l => [l.criterion, l.reasons])).toEqual([[CRITERION, [`${CRITERION} evidence`]]]);
    expect(q.release.released).toBe(false);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", released_blueprint_stage_id: "" });
    const calls = h.llm.stages.length;
    await expect(refineJanus(runId)).rejects.toThrow(`${NO_REFINEMENT_MESSAGE}: its 2 refinement cycles are used`);
    expect(h.llm.stages).toHaveLength(calls);
    expect(stagesOf("blueprint").map(s => [s.revision, s.status])).toEqual([[1, "succeeded"], [2, "succeeded"], [3, "succeeded"]]);
  });

  it("a refinement that thins the Blueprint is refused; the evaluated Blueprint stays active, the cycle is spent, nothing is evaluated", async () => {
    const runId = await failedRun();
    const [first] = stagesOf("blueprint");
    const thinned = clone(first.output);
    thinned.steps[0].instructions = "Do";
    thinned.refinement = { dispositions: [{ finding: "E1", action: "declined", reason: "Not needed" }] };
    h.llm.override.blueprint = thinned;
    const evaluations = stagesOf("qualification").length;
    const res = await refineJanus(runId);
    expect(res.failure).toMatchObject({ evidence: "schema_failure", attempts: 3 });
    const [, second] = stagesOf("blueprint");
    expect(second).toMatchObject({ revision: 2, status: "failed", error_class: "schema_failure" });
    expect(second.validation.errors).toEqual([expect.stringMatching(/^steps\[1\]\.instructions: differs from the base and is not declared/)]);
    expect(viewOf(runId).stageInfo.blueprint.active.id).toBe(first.id);
    expect(stagesOf("qualification")).toHaveLength(evaluations);
    expect(qOf(runId)).toMatchObject({ state: "refinement_required", refinement: { used: 1, remaining: 1, available: true } });
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "refinement_required", released_blueprint_stage_id: "" });
    // The refused revision is still held, later, to the base and findings it actually had.
    expect(stageIntegrity("blueprint", second.output, { inputs: { ...Object.fromEntries(second.depends_on.map(id => h.db.RunStage.find(s => s.id === id)).map(s => [s.stage_key, s.output])),
      [BP.assembly]: { blueprint: first.output }, [BP.critique]: { findings: second.provenance.refines.deficiencies } } })).toEqual(second.validation.errors);
  });

  it("is an operator action", async () => {
    const runId = await failedRun();
    h.session.user = { id: "user-2", role: "user" };
    const calls = h.llm.stages.length;
    await expect(refineJanus(runId)).rejects.toThrow(OPERATOR_ONLY_MESSAGE);
    expect(h.llm.stages).toHaveLength(calls);
    expect(stagesOf("blueprint")).toHaveLength(1);
  });
});

describe("the brief accounts for every section of the operator's material", () => {
  const SPEC = ["# Orbital Relay Specification", "Status: draft", "## 1. Power budget", "The relay must hold 400 W through eclipse.", "## 2. Thermal control", "Radiators reject 350 W.",
    "## 3. References", "See the mission handbook."].join("\n");
  const brief = { objective: "o", pathway: "p", ambition_guard: ["A relay that only works in sunlight"],
    requirements: [{ id: "Q1", text: "Hold 400 W through eclipse", kind: "capability", priority: "must" }] };

  it("reads the headings the operator wrote; ordinary prose is not a sectioned document", () => {
    expect(sourceOutline(SPEC)).toEqual([{ id: "S1", title: "Orbital Relay Specification" }, { id: "S2", title: "1. Power budget" }, { id: "S3", title: "2. Thermal control" }, { id: "S4", title: "3. References" }]);
    expect(sourceOutline(params.queryText)).toEqual([]);
    expect(sourceOutline("First, do this. Then that.\nSecond paragraph, with a full sentence.")).toEqual([]);
  });

  it("a section passed over in silence, or dismissed without a reason, rejects the brief", () => {
    const check = (coverage) => stageIntegrity(BP.brief, { ...brief, coverage }, { inputs: { "@config": { ...params, queryText: SPEC } } });
    expect(check([{ section: "S1", disposition: "context", note: "Title" }, { section: "S2", disposition: "requirements", requirements: ["Q1"] }])).toEqual([
      'coverage: section S3 ("2. Thermal control") of the operator\'s material is not accounted for — give the requirements drawn from it, or mark it context and say why',
      'coverage: section S4 ("3. References") of the operator\'s material is not accounted for — give the requirements drawn from it, or mark it context and say why',
    ]);
    const rest = [{ section: "S1", disposition: "context", note: "Title" }, { section: "S4", disposition: "context", note: "Reference list" }];
    expect(check([...rest, { section: "S2", disposition: "requirements", requirements: ["Q1"] }, { section: "S3", disposition: "requirements", requirements: ["Q7"] }]))
      .toEqual(["coverage S3: marked requirements, but names no requirement id of this brief"]);
    expect(check([...rest, { section: "S2", disposition: "requirements", requirements: ["Q1"] }, { section: "S3", disposition: "context" }]))
      .toEqual(["coverage S3: marked context, but gives no reason it holds no requirement"]);
    expect(check([...rest, { section: "S2", disposition: "requirements", requirements: ["Q1"] }, { section: "S3", disposition: "context", note: "Restates S2" }])).toEqual([]);
    expect(stageIntegrity(BP.brief, brief, { inputs: { "@config": params } })).toEqual([]); // no sections, nothing owed
  });

  it("the brief's prompt lists the sections it must account for", () => {
    const { prompt } = compileStage({ stageKey: BP.brief, config: { ...params, queryText: SPEC, mode: "full" }, inputs: {} });
    expect(prompt).toContain("label=source_outline");
    expect(prompt).toContain("S3 — 2. Thermal control");
    expect(compileStage({ stageKey: BP.brief, config: { ...params, mode: "full" }, inputs: {} }).prompt).not.toContain("label=source_outline");
  });
});

describe("the plan builds the architecture it declares", () => {
  it("a component no step builds, or a phase with no step, rejects the skeleton", async () => {
    await executeJanus(params);
    const skeleton = stagesOf(BP.skeleton)[0];
    const inputs = { inputs: { ...Object.fromEntries(skeleton.depends_on.map(id => h.db.RunStage.find(s => s.id === id)).map(s => [s.stage_key, s.output])), "@config": params } };
    expect(stageIntegrity(BP.skeleton, skeleton.output, inputs)).toEqual([]);
    const orphaned = clone(skeleton.output);
    orphaned.architecture = { ...(orphaned.architecture || {}), components: [...(orphaned.architecture?.components || []), { id: "M99", name: "Telemetry bus", responsibility: "r" }] };
    orphaned.phases = [...orphaned.phases, { id: "P9", name: "Scale-out" }];
    expect(stageIntegrity(BP.skeleton, orphaned, inputs)).toEqual([
      'component M99 ("Telemetry bus") is declared in the architecture but no step builds it (steps[].components)',
      'phase P9 ("Scale-out") has no step',
    ]);
  });
});