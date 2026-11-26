// Phase 8 closeout (DIMA, 2026-11-26): the final Synthesis is validated before anything is built on it, and a
// stage's continuation identity is its own stage's, not a global label. Additions only.
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, reconcileJanus, rerunSynthesis, rerunBlueprint } from "@/lib/janus/browserAdapter";
import { validateStageOutput } from "@/lib/janus/stageRunner";
import { finalSynthesisErrors, completionManifest } from "@/lib/janus/lifecycleContract";
import { contractArtifacts } from "@/lib/janus/qualification";
import { templateVersionOf } from "@/lib/janus/stageCompiler";
import { composeRunView } from "@/lib/janus/runView";
import { PAIRS, PATTERNS } from "@/lib/janus/protocolRegistry";
import { INTERSECTION_KEYS } from "@/lib/janus/stageModel";

const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const clone = (x) => JSON.parse(JSON.stringify(x));
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId), h.db.RunAttempt.filter(a => a.run_id === runId));
const stagesOf = (key) => h.db.RunStage.filter(s => s.stage_key === key);
const stageOf = (key) => stagesOf(key).pop();
const calls = (key) => h.llm.stages.filter(s => s === key).length;
const good = () => clone(h.out.synthesis);
const errorsOf = (output) => validateStageOutput("synthesis", output).errors;
const FIELDS = PATTERNS.flatMap(p => p.fields.map(f => [p.id, f])); // the registry is the roster: nothing is listed here by hand

beforeEach(() => h.reset());

describe("a valid final Synthesis (stage validation)", () => {
  it("the complete output is valid, and an empty collision list is a valid finding", () => {
    expect(validateStageOutput("synthesis", good())).toMatchObject({ valid: true, errors: [] });
    expect(errorsOf({ ...good(), constraint_collisions: [] })).toEqual([]);
    expect(errorsOf({ ...good(), constraint_collisions: ["Latency budget against consent prompts"] })).toEqual([]);
  });

  it.each(FIELDS)("pattern %s needs its field %s: absent, blank or contentless is invalid", (id, field) => {
    const message = `pattern ${id}.${field} missing`;
    const without = good(); delete without[id][field];
    expect(errorsOf(without)).toContain(message);
    const isList = Array.isArray(good()[id][field]);
    for (const empty of isList ? [[], [" "], ["..."]] : ["", "   ", "..."]) {
      const o = good(); o[id][field] = empty;
      expect(errorsOf(o)).toContain(message);
    }
  });

  it.each(PATTERNS.map(p => [p.id, p.fields]))("a missing pattern (%s) is reported field by field", (id, fields) => {
    const o = good(); delete o[id];
    expect(errorsOf(o)).toEqual(fields.map(f => `pattern ${id}.${f} missing`));
  });

  it("key_takeaways must be a non-empty list of meaningful entries", () => {
    const set = (v) => { const o = good(); if (v === undefined) delete o.key_takeaways; else o.key_takeaways = v; return errorsOf(o); };
    expect(set(undefined)).toEqual(["key_takeaways missing"]);
    expect(set([])).toEqual(["key_takeaways empty"]);
    expect(set(["A real takeaway", "  "])).toEqual(["key_takeaways[1] is not a meaningful entry"]);
    expect(set("one string, not a list")).toEqual(["synthesis.key_takeaways: Expected array, got string", "key_takeaways must be a list"]);
  });

  it("constraint_collisions must be present: none found is an empty list, not produced is invalid", () => {
    const set = (v) => { const o = good(); if (v === undefined) delete o.constraint_collisions; else o.constraint_collisions = v; return errorsOf(o); };
    expect(set(undefined)).toEqual(["constraint_collisions missing (an empty list is valid, absence is not)"]);
    expect(set(null)).toContain("constraint_collisions missing (an empty list is valid, absence is not)");
    expect(set([""])).toEqual(["constraint_collisions[0] is not a meaningful entry"]);
    expect(set([])).toEqual([]);
  });

  it("limitation_foreground must be a non-empty statement", () => {
    for (const v of [undefined, "", "   ", "…"]) {
      const o = good(); if (v === undefined) delete o.limitation_foreground; else o.limitation_foreground = v;
      expect(errorsOf(o)).toEqual(["limitation_foreground missing"]);
    }
  });

  it("execution and completion use one definition of a valid pattern set", () => {
    for (const [id, field] of FIELDS) {
      for (const damage of [(o) => { delete o[id][field]; }, (o) => { o[id][field] = Array.isArray(o[id][field]) ? [] : "  "; }]) {
        const o = good(); damage(o);
        const atStage = finalSynthesisErrors(o);
        const artifacts = contractArtifacts({ synthesis: { ...o, intersection_matrix: Object.fromEntries(PAIRS.map(p => [p.id, { insight: "i", tension: "t", resolution: "r" }])) } });
        const atCompletion = completionManifest("full", artifacts).stages.find(s => s.stage === "synthesis").errors;
        expect(atStage).toEqual([`pattern ${id}.${field} missing`]);
        expect(atCompletion).toEqual(atStage);
      }
    }
  });
});

describe("an invalid final Synthesis fails at its stage: nothing is built on it", () => {
  const last = PATTERNS[PATTERNS.length - 1];
  it.each([
    ["no key takeaways", (o) => { delete o.key_takeaways; }, /key_takeaways missing/],
    ["an empty key takeaways list", (o) => { o.key_takeaways = []; }, /key_takeaways empty/],
    ["no constraint_collisions field", (o) => { delete o.constraint_collisions; }, /constraint_collisions missing/],
    ["no limitation foreground", (o) => { delete o.limitation_foreground; }, /limitation_foreground missing/],
    ["one field of one formal pattern missing", (o) => { delete o[last.id][last.fields[last.fields.length - 1]]; }, new RegExp(`pattern ${last.id}\\.${last.fields[last.fields.length - 1]} missing`)],
  ])("%s: schema_failure with the normal bounded retry, zero Blueprint calls, partial, not qualified, not released", async (_name, damage, reason) => {
    const o = good(); damage(o);
    h.llm.override.synthesis = o;
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("partial");
    expect(stagesOf("synthesis")).toHaveLength(1);
    expect(stageOf("synthesis")).toMatchObject({ revision: 1, status: "failed", error_class: "schema_failure" });
    expect(stageOf("synthesis").error_message).toMatch(reason);
    expect(h.db.RunAttempt.filter(a => a.stage_key === "synthesis").map(a => [a.attempt_number, a.outcome, a.retry_decision]))
      .toEqual([[1, "schema_failure", "retry_scheduled"], [2, "schema_failure", "retry_scheduled"], [3, "schema_failure", "exhausted"]]);
    expect(calls("blueprint")).toBe(0);
    expect(calls("qualification")).toBe(0);
    const view = viewOf(runId);
    expect(view.stageInfo.synthesis.active).toBeNull();
    expect(Object.keys(view.artifacts.synthesis.intersection_matrix)).toHaveLength(6); // the six validated pairs stand
    expect(h.db.Run[0]).toMatchObject({ status: "partial", qualification_state: "not_started", released_blueprint_stage_id: "" });
    expect(h.db.Run[0].completion_manifest.complete).toBe(false);
  });

  it("a retry that returns a valid Synthesis heals the same revision, and only then is the Blueprint produced", async () => {
    h.llm.invalidTimes.synthesis = 2;
    const { status } = await executeJanus(params("full"));
    expect(status).toBe("completed");
    expect(stagesOf("synthesis").map(s => [s.revision, s.status])).toEqual([[1, "succeeded"]]);
    expect(calls("synthesis")).toBe(3);
    expect(calls("blueprint")).toBe(1);
    expect(h.llm.stages.indexOf("blueprint")).toBeGreaterThan(h.llm.stages.lastIndexOf("synthesis"));
  });

  it("after an exhausted Synthesis, the explicit re-runs are what produce it and then the Blueprint", async () => {
    const o = good(); delete o.limitation_foreground;
    h.llm.override.synthesis = o;
    const { runId } = await executeJanus(params("full"));
    delete h.llm.override.synthesis;
    await rerunSynthesis(runId);
    expect(stagesOf("synthesis").map(s => [s.revision, s.status])).toEqual([[1, "failed"], [2, "succeeded"]]);
    await rerunBlueprint(runId);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified" });
  });
});

describe("continuation identity is the stage's own", () => {
  const BASE = templateVersionOf("actus");
  /** An open Full run whose Actus revision is waiting for attempt 2 after a recovered retryable failure. */
  const actusWaiting = async () => {
    h.llm.failOn = "actus";
    h.llm.transport.actus = "late";
    const { runId } = await executeJanus(params("full"));
    h.llm.transport = {};
    await h.finishPending();
    h.llm.failOn = null;
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "actus", nextAttempt: 2 } });
    return runId;
  };

  // UPDATED 2026-11-26 under DIMA's Phase 9 directive (II.4: "an actual modification to a stage's prompt contract
  // must increment that stage's template identity"). This Phase 8 test (not one of the six inherited files) pinned
  // a fact of its day: "Phase 8 changed the Synthesis stages only", i.e. every other stage shared one identity. The
  // Phase 9 corrections changed the prompt contracts of the four domains and the Blueprint, so that fact is no
  // longer true. The invariant it protected is kept and stated directly: identity is per stage, and a stage whose
  // contract did not change keeps its identity (the six pairs and the patterns stage since Phase 8; Refresh and the
  // evaluation since Phase 5).
  it("the compiler gives each stage its own template identity: it moves only when that stage's own prompt contract does", () => {
    const id = templateVersionOf;
    // UPDATED AGAIN 2026-11-26 (Phase 9 pipeline, DIMA's continuation directive). The pipeline changed the prompt
    // contract of every stage except Refresh: the domains, the pairs and the patterns stage gained the
    // cognitive-discipline clause, the Blueprint became a pipeline, and the evaluation returns new findings. So each
    // of them moved, as II.4 requires, and Refresh, whose contract did not change, did not.
    expect(id("refresh")).toBe("stage-compiler/2026-11-25.3"); // unchanged since Phase 5
    // UPDATED 2026-11-26 (Phase 9 corrective tranche, same rule II.4): the final Blueprint's contract gained the
    // substance-preservation rules and the assembly's output gained code-set step confidence, so exactly those two
    // moved to .4. Every other stage's contract is untouched and keeps .3.
    const changed = ["corpus", "cogito", "animus", "actus", ...INTERSECTION_KEYS, "synthesis", "qualification",
      "blueprint:brief", "blueprint:candidates", "blueprint:selection", "blueprint:skeleton", "blueprint:expansion", "blueprint:criteria", "blueprint:critique"];
    expect(new Set(changed.map(id))).toEqual(new Set(["stage-compiler/2026-11-26.3"]));
    expect(["blueprint", "blueprint:assembly"].map(id)).toEqual(["stage-compiler/2026-11-26.4", "stage-compiler/2026-11-26.4"]);
  });

  it.each([
    ["nothing about Actus changed, although the Synthesis stages carry a newer identity", () => {}],
    ["the recorded template identity of other stages differs", () => { ["corpus", "cogito", "animus"].forEach(k => { stageOf(k).prompt_template_version = "stage-compiler/another"; }); }],
  ])("a waiting Actus revision is continued when %s", async (_name, change) => {
    const runId = await actusWaiting();
    const waiting = stageOf("actus");
    expect(waiting).toMatchObject({ revision: 1, status: "running", prompt_template_version: BASE });
    change();
    const result = await resumeJanus(runId);
    expect(result.blocked).toBeNull();
    expect(result.status).toBe("completed");
    expect(stagesOf("actus").map(s => [s.id, s.revision, s.status])).toEqual([[waiting.id, 1, "succeeded"]]); // the same revision
    expect(h.db.RunAttempt.filter(a => a.stage_key === "actus").map(a => a.attempt_number)).toEqual([1, 2]); // the budget carried over
    INTERSECTION_KEYS.forEach(k => expect(stageOf(k).prompt_template_version).toBe(templateVersionOf(k)));
  });

  it("a change to Actus's own template identity blocks it: nothing is started, nothing is settled", async () => {
    const runId = await actusWaiting();
    stageOf("actus").prompt_template_version = "stage-compiler/earlier";
    const before = h.llm.stages.length;
    const result = await resumeJanus(runId);
    expect(result.blocked).toMatchObject({ stageKey: "actus", revision: 1, nextAttempt: 2, reasons: [expect.stringMatching(/^prompt template changed \(stage-compiler\/earlier → /)] });
    expect(h.llm.stages.length).toBe(before);
    expect(stageOf("actus").status).toBe("running");
  });
});