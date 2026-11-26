// Phase 9 corrective tranche — refinement preserves substance; draft confidence is set by code.
// Regressions reproduce what the live CCT run (6b0817e2…) did: its final Blueprint returned fewer substeps,
// checklist items, inputs, outputs and acceptance entries than its assembled draft, and raised step 3 from
// Contested to Established although it rested on Speculative material. Additions only.
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus } from "@/lib/janus/browserAdapter";
import { preservationErrors, refinementErrors } from "@/lib/janus/blueprintPipeline";
import { enforceStepConfidence } from "@/lib/janus/qualification";
import { compileStage } from "@/lib/janus/stageCompiler";

const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const clone = (x) => JSON.parse(JSON.stringify(x));
const stageOf = (key) => h.db.RunStage.filter(s => s.stage_key === key).pop();
// A draft written out here, independent of the engine: the shape the live draft had.
const DRAFT = {
  goal: "g", assumptions: ["a1", "a2"], invariants: ["i1"], success_criteria: ["s1", "s2"],
  selected_strategy: { name: "S" }, architecture: { summary: "x", components: [{ id: "M1", name: "n", responsibility: "r" }, { id: "M2", name: "n2", responsibility: "r2" }] },
  outcome_interpretation: { positive: "p", null: "n", contradictory: "c", inconclusive: "i" },
  acceptance: [{ id: "A1", criterion: "c", method: "m" }, { id: "A2", criterion: "c", method: "m" }],
  risk_register: [{ risk: "r", impact: "med", mitigation: "m" }],
  steps: [{ step: 1, title: "t", purpose: "why", instructions: "do", validation: "check", inputs: ["a", "b", "c"], outputs: ["x", "y"],
    substeps: [{ substep: "1a", details: "d" }, { substep: "1b", details: "d" }, { substep: "1c", details: "d" }], checklist: ["k1", "k2", "k3"], acceptance_tests: ["t1", "t2"] }],
};

beforeEach(() => h.reset());

describe("refinement preserves the draft's substance", () => {
  it("an unchanged or enlarged Blueprint passes", () => {
    expect(preservationErrors(clone(DRAFT), DRAFT)).toEqual([]);
    const grown = clone(DRAFT);
    grown.steps[0].substeps.push({ substep: "1d", details: "new" });
    grown.steps.push({ step: 2, title: "added", instructions: "i", validation: "v" });
    grown.acceptance.push({ id: "A3", criterion: "c", method: "m" });
    expect(preservationErrors(grown, DRAFT)).toEqual([]);
  });

  it("the live losses are each refused by name: fewer substeps, checklist items, inputs, outputs and acceptance entries", () => {
    const lossy = clone(DRAFT);
    lossy.steps[0].substeps.pop(); lossy.steps[0].checklist.pop(); lossy.steps[0].inputs.pop(); lossy.steps[0].outputs.pop(); lossy.acceptance.pop();
    const errors = preservationErrors(lossy, DRAFT);
    expect(errors.map(e => e.split(":")[0])).toEqual(["acceptance", "steps[1].inputs", "steps[1].outputs", "steps[1].substeps", "steps[1].checklist"]);
    expect(errors[3]).toMatch(/holds 3 entries and the refinement returned 2/);
  });

  it("a part or a step text the draft holds cannot come back absent or empty", () => {
    const hollow = clone(DRAFT);
    delete hollow.selected_strategy; hollow.outcome_interpretation.null = ""; hollow.steps[0].purpose = ""; hollow.architecture.components.pop();
    expect(preservationErrors(hollow, DRAFT)).toEqual([
      "selected_strategy: present in the assembled draft, absent from the refinement",
      expect.stringMatching(/^architecture\.components: the assembled draft holds 2 entries and the refinement returned 1/),
      "outcome_interpretation.null: present in the assembled draft, empty in the refinement",
      "steps[1].purpose: present in the assembled draft, empty in the refinement",
    ]);
  });

  it("a removal is allowed only when it is declared with its reason, for exactly that path", () => {
    const pruned = clone(DRAFT);
    pruned.steps[0].checklist.pop(); pruned.assumptions.pop();
    pruned.refinement = { removals: [{ path: "steps[1].checklist", reason: "k3 duplicated k1" }, { path: "assumptions" }] };
    expect(preservationErrors(pruned, DRAFT)).toEqual([expect.stringMatching(/^assumptions: /)]); // no reason, not allowed
  });

  it("is part of what the final Blueprint owes its draft, and a lossy refinement is a schema failure with the losses named on the retry", async () => {
    expect(refinementErrors({ ...clone(DRAFT), acceptance: [] }, { "blueprint:assembly": { blueprint: DRAFT } })).toEqual([expect.stringMatching(/^acceptance: /)]);
    const lossy = h.blueprintFor("ACTUS: Key Recommendations [pattern:");
    lossy.steps[0].substeps = [];
    h.llm.sequence.blueprint = [lossy];
    const { status } = await executeJanus(params("full"));
    expect(status).toBe("completed"); // the same revision, repaired on its next attempt
    expect(h.db.RunAttempt.filter(a => a.stage_key === "blueprint").map(a => a.outcome)).toEqual(["schema_failure", "succeeded"]);
    const retry = h.llm.prompts.filter((_, i) => h.llm.stages[i] === "blueprint")[1];
    expect(retry).toContain("steps[1].substeps: the assembled draft holds 1 entry and the refinement returned 0");
    expect(stageOf("blueprint").output.steps[0].substeps).toHaveLength(1);
  });

  it("the refiner is told the rule and that confidence is not its to raise", () => {
    const p = compileStage({ stageKey: "blueprint", config: params("full"), inputs: { "blueprint:assembly": { blueprint: DRAFT, audit: { findings: [] } } } }).prompt;
    expect(p).toContain("PRESERVE SUBSTANCE (checked by code)");
    expect(p).toContain("refinement.removals");
    expect(p).toContain("was set by code to the weakest confidence of the material it cites. Do not raise it.");
  });
});

describe("the assembled draft's step confidence is set by code", () => {
  const artifacts = { cogito: { claims: [{ id: "C1", tag: "Established" }, { id: "C2", tag: "Speculative" }] },
    actus: { recommendations: [{ id: "R1", depends_on_claims: ["C1", "C2"], inherited_confidence: "Speculative" }] } };

  it("the live case: a step labelled Contested that rests on Speculative material becomes Speculative, and the correction is recorded", () => {
    const { blueprint, corrections } = enforceStepConfidence({ steps: [
      { step: 2, confidence: "Established", derived_from: ["C1"] },
      { step: 3, confidence: "Contested", derived_from: ["R1"] },
      { step: 4, derived_from: ["C2"] },
      { step: 5, confidence: "Speculative", derived_from: ["C1"] }, // weaker than its support: honest, left alone
    ] }, artifacts);
    expect(blueprint.steps.map(s => s.confidence)).toEqual(["Established", "Speculative", "Speculative", "Speculative"]);
    expect(corrections).toEqual([{ step: 3, from: "Contested", to: "Speculative" }, { step: 4, from: null, to: "Speculative" }]);
  });

  it("in a run, the draft leaves assembly corrected, and the audit no longer reports the label as a defect for the critic to argue about", async () => {
    const skeleton = clone(h.pipeline["blueprint:skeleton"]("ACTUS: Key Recommendations [pattern:"));
    skeleton.steps[1].confidence = "Established"; // rests on R1, which inherits Contested
    h.llm.override["blueprint:skeleton"] = skeleton;
    await executeJanus(params("full"));
    const { blueprint, audit } = stageOf("blueprint:assembly").output;
    expect(blueprint.steps[1].confidence).toBe("Contested");
    expect(audit.confidence_corrections).toEqual([{ step: 2, from: "Established", to: "Contested" }]);
    expect(audit.findings.filter(f => f.criterion === "intellectual_honesty")).toEqual([]);
  });
});