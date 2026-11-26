import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, rerunSynthesis, rerunBlueprint } from "@/lib/janus/browserAdapter";
import { composeRunView } from "@/lib/janus/runView";
import { deriveQualification, stepTrace, traceIndex } from "@/lib/janus/qualification";
import { compileStage } from "@/lib/janus/stageCompiler";

const src = (rel) => fs.readFileSync(path.resolve(process.cwd(), "src", rel), "utf8");
import { deriveExecutionState } from "@/lib/janus/executionState";
import { JANUS_QUALIFIED, QUALITY_CRITERIA } from "@/lib/janus/lifecycleContract";
import { PATTERNS, subdomainIds } from "@/lib/janus/protocolRegistry";

const run = (mode) => executeJanus({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const stagesOf = (runId) => h.db.RunStage.filter(s => s.run_id === runId);
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), stagesOf(runId));
const qOf = (runId) => deriveQualification(viewOf(runId));
const criterion = (q, id) => q.criteria.find(c => c.id === id);
const clone = (x) => JSON.parse(JSON.stringify(x));

beforeEach(() => h.reset());

describe("completion is a validated contract, not a returned process", () => {
  it("a Full run that satisfies the manifest completes, is evaluated once, and only then is released", async () => {
    const result = await run("full");
    const record = h.db.Run[0];
    expect(result).toMatchObject({ status: "completed", qualification: "qualified" });
    expect(record.completion_manifest).toMatchObject({ complete: true, partial: false, blocking: [] });
    expect(h.llm.stages.slice(-2)).toEqual(["blueprint", "qualification"]);
    expect(h.llm.stages.filter(s => s === "qualification")).toHaveLength(1);

    const view = viewOf(result.runId);
    expect(record.released_blueprint_stage_id).toBe(view.stageInfo.blueprint.active.id);
    expect(view.stageInfo.qualification.active.depends_on).toContain(view.stageInfo.blueprint.active.id);
    expect(view.artifacts.qualification).toBeUndefined(); // an evaluation is not a Blueprint artifact
    const q = qOf(result.runId);
    expect(q.release).toMatchObject({ released: true, label: JANUS_QUALIFIED });
    expect(q.criteria).toHaveLength(14);
    expect(q.criteria.filter(c => c.verdict === "pass")).toHaveLength(13);
    expect(criterion(q, "historical_no_regression")).toMatchObject({ applies: false, verdict: null, rule: "benchmark_reference" });
  });

  it("partial profiles complete as partial profiles and never claim Full", async () => {
    await run("quick");
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified" });
    expect(h.db.Run[0].completion_manifest).toMatchObject({ partial: true, complete: true });
    expect(h.db.Run[0].completion_manifest.completion_label).toMatch(/partial/i);
  });

  it("output density scales with the mode, the expertise does not: only Full demands the explicit subdomain sets", () => {
    const config = { queryText: "q", outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false };
    const prompt = (mode, stageKey) => compileStage({ stageKey, config: { ...config, executionMode: mode } }).prompt;
    const identity = (p) => p.slice(p.indexOf("═══ DOMAIN ACTIVATION"), p.indexOf("CRITICAL INSTRUCTION"));
    ["corpus", "cogito", "animus", "actus"].forEach(d => {
      const [quick, standard, full] = ["quick", "standard", "full"].map(m => prompt(m, d));
      subdomainIds(d).forEach(id => expect(full).toContain(`"${id}": {"perspective"`));
      [quick, standard].forEach(p => {
        expect(p).not.toContain('"subdomains"');
        expect(p).toMatch(/reason from every subdomain of this expertise/);
        expect(identity(p)).toBe(identity(full)); // the same complete SME expertise in every mode
      });
      expect(quick).toMatch(/Compact is not shallow/);
    });
  });

  it("a Blueprint step shows what it is derived from and its effective confidence", () => {
    const idx = traceIndex({ cogito: h.out.cogito, actus: h.out.actus, corpus: h.out.corpus });
    expect(stepTrace({ derived_from: ["C1", "corpus:1", "C99"], confidence: "Established" }, idx)).toEqual({
      refs: [{ id: "C1", found: true }, { id: "corpus:1", found: true }, { id: "C99", found: false }],
      declared: "Established", effective: "Contested", corrected: true,
    });
    expect(stepTrace({ derived_from: ["corpus:1"], confidence: "Speculative" }, idx)).toMatchObject({ effective: "Speculative", corrected: false });
    expect(stepTrace({ title: "historical step" }, idx)).toEqual({ refs: [], declared: null, effective: null, corrected: false });
    expect(src("components/janus/tabs/BlueprintTab.jsx")).toMatch(/<BlueprintStepTrace step=\{step\}/);
  });

  // REPLACED UNDER DIMA'S EXPLICIT AUTHORIZATION (2026-11-26, Phase 8 closeout). This was the first row of the table
  // below ("a missing formal pattern"). Its guarantee is kept and made stronger: a Full run with an incomplete Synthesis
  // cannot complete, qualify or release. Its sequencing expectation is superseded: the patterns stage used to settle
  // as succeeded, a Blueprint was purchased on top of it, and the gap was found only afterwards by the completion
  // manifest (13 succeeded stages). Final Form validates the final Synthesis before the Blueprint (plan §14, steps
  // 9 to 12), so the incomplete Synthesis is itself the failure and no Blueprint is generated from it.
  it("a Full run with a missing formal pattern fails at the Synthesis stage: no Blueprint, no completion, no qualification, no release", async () => {
    const incomplete = clone(h.out.synthesis);
    delete incomplete[PATTERNS[0].id];
    h.llm.override.synthesis = incomplete;
    const result = await run("full");
    const record = h.db.Run[0];
    const revisions = stagesOf(result.runId).filter(s => s.stage_key === "synthesis");
    expect(revisions).toHaveLength(1); // retries are attempts of the same revision
    expect(revisions[0]).toMatchObject({ revision: 1, status: "failed", error_class: "schema_failure" });
    expect(revisions[0].validation).toMatchObject({ valid: false, errors: PATTERNS[0].fields.map(f => `pattern ${PATTERNS[0].id}.${f} missing`) });
    expect(h.db.RunAttempt.filter(a => a.stage_id === revisions[0].id).map(a => [a.attempt_number, a.outcome, a.retry_decision]))
      .toEqual([[1, "schema_failure", "retry_scheduled"], [2, "schema_failure", "retry_scheduled"], [3, "schema_failure", "exhausted"]]); // the normal bounded retry
    expect(h.llm.stages.filter(s => s === "blueprint")).toEqual([]); // zero Blueprint calls
    expect(stagesOf(result.runId).filter(s => s.stage_key === "blueprint")).toEqual([]);
    expect(viewOf(result.runId).stageInfo.synthesis.active).toBeNull(); // the invalid Synthesis never becomes the active one
    expect(result.status).toBe("partial");
    expect(record.completion_manifest.complete).toBe(false);
    expect(record.validation_errors.some(e => new RegExp(`pattern ${PATTERNS[0].id}`).test(e))).toBe(true);
    expect(h.llm.stages).not.toContain("qualification"); // nothing to qualify, no evaluation purchased
    expect(record).toMatchObject({ qualification_state: "not_started", released_blueprint_stage_id: "" });
    expect(qOf(result.runId).release).toMatchObject({ released: false, status: "incomplete" });
    expect(deriveExecutionState(viewOf(result.runId))).toMatchObject({ status: "partial", resumable: false });
  });

  it.each([
    ["a missing subdomain", "cogito", () => { const c = clone(h.out.cogito); delete c.subdomains[subdomainIds("cogito")[0]]; return c; }, /cogito subdomain missing/],
    ["fewer than three alternatives", "blueprint", () => ({ ...h.blueprintFor("ACTUS: Key Recommendations [pattern:"), alternative_approaches: [{ name: "only one" }] }), /alternative approaches/],
    ["an unanchored recommendation", "actus", () => ({ ...clone(h.out.actus), recommendations: [{ id: "R1", text: "r", depends_on_claims: [], inherited_confidence: "Established", probability: "high" }] }), /no resolvable Cogito dependency/],
  ])("a structurally valid Full run with %s cannot become completed", async (_name, key, seed, blocking) => {
    h.llm.override[key] = seed();
    const result = await run("full");
    const record = h.db.Run[0];
    expect(result.status).toBe("partial");
    expect(stagesOf(result.runId).filter(s => s.status === "succeeded")).toHaveLength(13); // every stage settled as valid output
    expect(record.completion_manifest.complete).toBe(false);
    expect(record.validation_errors.some(e => blocking.test(e))).toBe(true);
    expect(h.llm.stages).not.toContain("qualification"); // nothing to qualify, no evaluation purchased
    expect(record).toMatchObject({ qualification_state: "not_started", released_blueprint_stage_id: "" });
    expect(qOf(result.runId).release).toMatchObject({ released: false, status: "incomplete" });
    expect(deriveExecutionState(viewOf(result.runId))).toMatchObject({ status: "partial", resumable: false });
  });

  it("a run with no valid artifact ends failed; one with some ends partial with them preserved", async () => {
    h.llm.failOn = "corpus"; h.llm.invalidOn = "cogito"; h.llm.override.blueprint = { goal: 7 };
    await run("quick");
    expect(h.db.Run[0].status).toBe("failed");
    h.reset();
    h.llm.failOn = "blueprint";
    const { runId } = await run("quick");
    expect(h.db.Run[0].status).toBe("partial");
    expect(Object.keys(viewOf(runId).artifacts)).toEqual(["corpus", "cogito"]);
  });

  it("confidence propagation is decided by code and the correction is recorded", async () => {
    h.llm.override.actus = { ...clone(h.out.actus), recommendations: [{ id: "R1", text: "r", depends_on_claims: ["C1"], inherited_confidence: "Established", probability: "high" }] };
    await run("full");
    expect(h.db.Run[0].completion_manifest.confidence_corrections).toEqual([{ id: "R1", from: "Established", to: "Contested" }]);
    expect(h.db.Run[0].status).toBe("completed");
  });
});

describe("structurally valid mediocrity is not released", () => {
  const unreleased = (runId, state) => {
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: state, released_blueprint_stage_id: "" });
    const q = qOf(runId);
    expect(q.release.released).toBe(false);
    expect(q.release.label).not.toBe(JANUS_QUALIFIED);
    return q;
  };

  it("a criterion failed by the independent evaluator blocks release, with its reason inspectable", async () => {
    h.llm.verdicts.elegance = "fail";
    const { runId } = await run("full");
    const q = unreleased(runId, "refinement_required");
    expect(q.result.failed).toEqual(["elegance"]);
    expect(criterion(q, "elegance")).toMatchObject({ verdict: "fail", reasons: ["elegance evidence"] });
  });

  it("an evaluator cannot wave a Blueprint through: missing traces fail in code even when every critique passes", async () => {
    const untraced = h.blueprintFor("ACTUS: Key Recommendations [pattern:");
    untraced.steps.forEach(s => { delete s.derived_from; });
    h.llm.override.blueprint = untraced;
    const { runId } = await run("full");
    const q = unreleased(runId, "refinement_required");
    expect(q.result.failed).toEqual(["cross_domain_necessity", "emergence"]);
    expect(criterion(q, "cross_domain_necessity").reasons).toContain("step 1: traces to no upstream artifact");
    expect(criterion(q, "emergence").reasons).toEqual(["no step is traced to an intersection", "no step is traced to a formal emergent pattern"]);
  });

  it("invented trace handles and inflated confidence are caught", async () => {
    const bp = h.blueprintFor("ACTUS: Key Recommendations [pattern:");
    bp.steps[0].derived_from.push("C99");
    bp.steps[1].confidence = "Established"; // rests on R1, which inherits Contested
    h.llm.override.blueprint = bp;
    const { runId } = await run("full");
    const q = unreleased(runId, "refinement_required");
    expect(criterion(q, "cross_domain_necessity").reasons).toEqual(["step 1: cites C99, which does not exist"]);
    expect(criterion(q, "intellectual_honesty").reasons).toEqual(["step 2: labelled Established but rests on Contested material"]);
  });

  it("the evaluator cannot skip a criterion: any verdict other than pass or fail counts as a failure", async () => {
    h.llm.verdicts.utility = "not_applicable";
    const { runId } = await run("full");
    expect(unreleased(runId, "refinement_required").result.invalid).toEqual(["utility"]);
  });

  it.each([["fails", "failOn", "provider_error"], ["returns an incomplete verdict set", "invalidOn", "schema_failure"]])(
    "when the evaluation %s nothing is released and the completed artifacts are untouched", async (_n, knob, evidence) => {
      h.llm[knob] = "qualification";
      const { runId } = await run("full");
      const q = unreleased(runId, "qualifying");
      expect(q).toMatchObject({ pending: "evaluation_failed" });
      const view = viewOf(runId);
      expect(view.stageInfo.qualification).toMatchObject({ active: null, latest: expect.objectContaining({ status: "failed", error_class: evidence }) });
      expect(stagesOf(runId).filter(s => s.status === "succeeded")).toHaveLength(13);
      expect(view.stageInfo.blueprint.active.status).toBe("succeeded");
    });

  it("a stale Blueprint is neither evaluated nor released; a new Blueprint revision is evaluated afresh", async () => {
    const { runId } = await run("full");
    expect(h.db.Run[0].qualification_state).toBe("qualified");
    h.llm.stages.length = 0;

    await rerunSynthesis(runId);
    expect(h.llm.stages).not.toContain("qualification");
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "not_started", released_blueprint_stage_id: "" });
    expect(qOf(runId).blocked).toMatch(/stale/);

    await rerunBlueprint(runId);
    const view = viewOf(runId);
    expect(view.stageInfo.qualification.active).toMatchObject({ revision: 2 });
    expect(view.stageInfo.qualification.active.depends_on).toContain(view.stageInfo.blueprint.active.id);
    expect(h.db.Run[0]).toMatchObject({ qualification_state: "qualified", released_blueprint_stage_id: view.stageInfo.blueprint.active.id });
  });
});

describe("one qualification truth", () => {

  it("the engine and every screen derive qualification from the same function; the badge text lives only in the contract", () => {
    ["lib/janus/stageEngine.js", "components/janus/QualificationPanel.jsx", "components/janus/ExecutionContext.jsx"]
      .forEach(f => expect(src(f)).toMatch(/deriveQualification\(/));
    ["components/janus/QualificationPanel.jsx", "components/janus/QualificationCriterion.jsx", "components/ui/BottomAccessory.jsx", "lib/janus/qualification.js"]
      .forEach(f => expect(src(f)).not.toContain(JANUS_QUALIFIED));
    expect(src("components/ui/BottomAccessory.jsx")).toMatch(/qualification\.release\.label/);
  });

  it("every criterion has a standard, and the generator is never asked to grade itself", () => {
    QUALITY_CRITERIA.forEach(c => expect(c.standard).toBeTruthy());
    const blueprintPrompt = h.llm.prompts; // filled by the run below
    return run("quick").then(() => {
      const bp = blueprintPrompt[h.llm.stages.indexOf("blueprint")];
      const ev = blueprintPrompt[h.llm.stages.indexOf("qualification")];
      expect(bp).not.toMatch(/verdict/i);
      expect(ev).toMatch(/You did NOT write the Blueprint/);
      expect(ev).toMatch(/There is no "not applicable"/);
      QUALITY_CRITERIA.filter(c => c.method === "critique" && c.hard).forEach(c => expect(ev).toContain(`${c.id} — `));
      QUALITY_CRITERIA.filter(c => c.method !== "critique").forEach(c => expect(ev).not.toContain(`${c.id} — `)); // decided by code, not by a model
    });
  });
});