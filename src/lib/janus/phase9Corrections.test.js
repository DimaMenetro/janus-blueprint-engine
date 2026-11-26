// Phase 9 correction tranche (DIMA directive 2026-11-26, part II). Regressions reproduce what the live
// Aegis/Astrape/Ma'at run (6b07cabc…) actually did: Cogito settled with document names in depends_on; Actus spent
// three identical attempts on identity_economics (a list where one string belongs) and "moderate"; a later Actus
// version left three intersections, the Synthesis and the Blueprint unproduced. Additions only.
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, reconcileJanus, rerunStages, previewCompletion, completeJanus, STALE_PREVIEW_MESSAGE, OPERATOR_ONLY_MESSAGE } from "@/lib/janus/browserAdapter";
import { compileStage, withCorrection } from "@/lib/janus/stageCompiler";
import { validateStageOutput } from "@/lib/janus/stageRunner";
import { stageIntegrity, completionManifest } from "@/lib/janus/lifecycleContract";
import { completionOf, contractArtifacts } from "@/lib/janus/qualification";
import { composeRunView } from "@/lib/janus/runView";
import { stagePlan } from "@/lib/janus/executionState";
import { INTERSECTION_KEYS } from "@/lib/janus/stageModel";

const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const clone = (x) => JSON.parse(JSON.stringify(x));
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId), h.db.RunAttempt.filter(a => a.run_id === runId));
const stagesOf = (key) => h.db.RunStage.filter(s => s.stage_key === key);
const promptsOf = (key) => h.llm.prompts.filter((_, i) => h.llm.stages[i] === key);
const ledger = (key) => h.db.RunAttempt.filter(a => a.stage_key === key).map(a => [a.attempt_number, a.outcome, a.retry_decision]);
const ACTUS_PAIRS = INTERSECTION_KEYS.filter(k => k.endsWith("_x_actus"));
const DOCUMENT_DEPS = () => { const c = clone(h.out.cogito); c.claims[0].depends_on = ["Phase 0 Walkthrough", "ShapeScan Product Codex"]; return c; };
const LIST_WHERE_STRING = () => ({ ...clone(h.out.actus), recommendations: [{ ...h.out.actus.recommendations[0], probability: "moderate" }],
  behavioral_factors: { identity_economics: ["a list where one string belongs"] } });

beforeEach(() => h.reset());

describe("mandatory integrity is enforced when a stage settles", () => {
  it("Cogito: a document name in depends_on is rejected at the stage; the retry names it; provenance moves to sources", async () => {
    const fixed = clone(h.out.cogito);
    fixed.claims[0].sources = ["Phase 0 Walkthrough", "ShapeScan Product Codex"];
    h.llm.sequence.cogito = [DOCUMENT_DEPS(), fixed];
    const { runId, status } = await executeJanus(params("quick"));
    expect(status).toBe("completed");
    expect(stagesOf("cogito").map(s => [s.revision, s.status])).toEqual([[1, "succeeded"]]); // the same revision, healed
    expect(ledger("cogito")).toEqual([[1, "schema_failure", "retry_scheduled"], [2, "succeeded", "none"]]);
    const [first, second] = promptsOf("cogito");
    expect(first).not.toContain("RETRY NOTICE");
    expect(second.startsWith(first)).toBe(true); // the revision's own prompt, unchanged, plus the notice
    expect(second).toContain("RETRY NOTICE — attempt 2");
    expect(second).toContain("C1: dangling depends_on Phase 0 Walkthrough");
    expect(viewOf(runId).artifacts.cogito.claims[0]).toMatchObject({ depends_on: [], sources: ["Phase 0 Walkthrough", "ShapeScan Product Codex"] });
  });

  it("Actus: the live failure (a list for identity_economics, 'moderate') is named field by field and corrected on the next attempt", async () => {
    h.llm.sequence.actus = [LIST_WHERE_STRING()];
    const { status } = await executeJanus(params("standard"));
    expect(status).toBe("completed");
    expect(ledger("actus")).toEqual([[1, "schema_failure", "retry_scheduled"], [2, "succeeded", "none"]]);
    const retry = promptsOf("actus")[1];
    expect(retry).toContain('actus.recommendations[0].probability: Value "moderate" not in allowed values: low, medium, high');
    expect(retry).toContain("actus.behavioral_factors.identity_economics: Expected string, got a list (array)");
    expect(retry).toMatch(/Do not shorten, simplify or drop content/);
  });

  it("the Actus contract states types and allowed values from the schema, and what a dependency may cite", () => {
    const p = compileStage({ stageKey: "actus", config: params("full") }).prompt;
    expect(p).toContain("- behavioral_factors.identity_economics: ONE text value (a single string, never a list and never an object)");
    expect(p).toContain('- recommendations[].probability: exactly one of "low" | "medium" | "high" (no other word) — required');
    expect(p).toContain("depends_on_claims holds ONLY Cogito claim ids");
    expect(compileStage({ stageKey: "cogito", config: params("full") }).prompt).toContain("A document, source, protocol or section is NOT a dependency: name those in sources.");
  });

  it("a recommendation citing something that is not a Cogito claim is rejected against the Cogito it was compiled from", () => {
    const actus = { ...clone(h.out.actus), recommendations: [{ ...h.out.actus.recommendations[0], depends_on_claims: ["C1", "Codex §4"] }] };
    expect(validateStageOutput("actus", actus, { inputs: { cogito: h.out.cogito } }).errors).toEqual(["R1: depends_on_claims cites Codex §4, which is not a Cogito claim id"]);
    expect(validateStageOutput("actus", actus).valid).toBe(true); // without the artifact it points into, only its own integrity
  });

  it("a retry after a failed call repeats the prompt unchanged; the notice is a pure function of the recorded rejection", () => {
    expect(withCorrection("P", { outcome: "provider_error", message: "500" }, 2)).toBe("P");
    expect(withCorrection("P", null, 1)).toBe("P");
    const res = { outcome: "schema_failure", validation: { errors: ["x.y: Expected string, got object"] } };
    expect(withCorrection("P", res, 2)).toBe(withCorrection("P", clone(res), 2));
  });

  it("a continued revision (session lost) rebuilds the same notice from the server's record", async () => {
    h.llm.sequence.cogito = [DOCUMENT_DEPS()];
    h.llm.transport.cogito = ["late"];
    const { runId } = await executeJanus(params("quick"));
    await h.finishPending();
    expect(await reconcileJanus(runId)).toMatchObject({ settled: true, awaiting: { stageKey: "cogito", nextAttempt: 2 } });
    expect((await resumeJanus(runId)).status).toBe("completed");
    expect(stagesOf("cogito")).toHaveLength(1);
    expect(promptsOf("cogito")[1]).toContain("C1: dangling depends_on ShapeScan Product Codex");
  });

  it("execution, consumption and completion use one integrity definition", () => {
    const bad = DOCUMENT_DEPS();
    const atStage = stageIntegrity("cogito", bad);
    expect(atStage).toEqual(["C1: dangling depends_on Phase 0 Walkthrough", "C1: dangling depends_on ShapeScan Product Codex"]);
    expect(validateStageOutput("cogito", bad).errors).toEqual(atStage);
    const manifest = completionManifest("quick", contractArtifacts({ corpus: h.out.corpus, cogito: bad, blueprint: h.blueprintFor("") }));
    expect(manifest.stages.find(s => s.stage === "cogito").errors).toEqual(atStage);
  });

  it("no derived context is cut at a character count", () => {
    const corpus = { constraints: Array.from({ length: 400 }, (_, i) => `Constraint ${i + 1}: ${"detail ".repeat(12)}`) };
    const p = compileStage({ stageKey: "blueprint", config: params("standard"), inputs: { corpus } }).prompt;
    expect(p).not.toContain("[TRUNCATED");
    expect(p).toContain("corpus:400 — Constraint 400");
  });
});

/** The live run's shape: Actus exhausted, later re-run successfully; everything that reads Actus was never produced. */
const liveShape = async () => {
  h.llm.sequence.actus = [LIST_WHERE_STRING(), LIST_WHERE_STRING(), LIST_WHERE_STRING()];
  const { runId, status } = await executeJanus(params("full"));
  expect(status).toBe("partial");
  expect(ledger("actus").map(a => a[2])).toEqual(["retry_scheduled", "retry_scheduled", "exhausted"]);
  await rerunStages(runId, { targets: ["actus"] });
  expect(stagesOf("actus").map(s => [s.revision, s.status])).toEqual([[1, "failed"], [2, "succeeded"]]);
  expect(h.db.RunStage.filter(s => s.status === "succeeded")).toHaveLength(8); // as live: 8 of 13
  h.llm.stages.length = 0;
  return runId;
};

describe("completion of cognition a finished run never produced", () => {
  it("previews exactly the unproduced stages, keeps every valid one, and produces only those", async () => {
    const runId = await liveShape();
    const impact = await previewCompletion(runId);
    expect(impact.plan).toEqual([...ACTUS_PAIRS, "synthesis", "blueprint"]);
    expect(impact.planned.every(p => p.reason === "unproduced")).toBe(true);
    expect(impact.kept.map(k => k.key)).toEqual(stagePlan("full").filter(k => !impact.plan.includes(k)));
    expect(impact).toMatchObject({ blocked: [], findings: [], refusals: [] });
    const before = clone(h.db.RunStage);

    const result = await completeJanus(runId, { expected: impact.token });
    expect(result).toMatchObject({ success: true, status: "completed", qualification: "qualified" });
    expect(h.llm.stages).toEqual([...impact.plan, "qualification"]); // nothing valid was regenerated
    impact.plan.forEach(k => expect(stagesOf(k)).toEqual([expect.objectContaining({ revision: 1, status: "succeeded", provenance: expect.objectContaining({ origin: "completion" }) })]));
    expect(h.db.RunStage.slice(0, before.length)).toEqual(before); // every earlier revision is exactly as it was
    expect(stagesOf("actus")).toHaveLength(2); // history kept, no third version
    expect((await previewCompletion(runId)).refusals).toEqual(["every stage of this run's plan has a valid, current version"]);
  });

  it("a recorded Cogito that fails today's integrity is not built upon; repair replaces it and what reads it follows", async () => {
    const runId = await liveShape();
    h.db.RunStage.find(s => s.stage_key === "cogito").output = DOCUMENT_DEPS(); // settled under the earlier validator, as live
    expect(completionOf(viewOf(runId)).blocking).toEqual(expect.arrayContaining(["cogito: C1: dangling depends_on Phase 0 Walkthrough"]));

    const plain = await previewCompletion(runId);
    expect(plain.findings.map(f => f.key)).toEqual(["cogito"]);
    expect(plain.plan).toEqual(ACTUS_PAIRS.filter(k => !k.includes("cogito")));
    expect(plain.blocked.map(b => b.key)).toEqual([ACTUS_PAIRS.find(k => k.includes("cogito")), "synthesis", "blueprint"]);
    const partial = await completeJanus(runId, { expected: plain.token });
    expect(h.llm.stages).toEqual(plain.plan); // no Synthesis, no Blueprint on an unfit Cogito
    expect(partial.status).toBe("partial");

    h.llm.stages.length = 0;
    const repair = await previewCompletion(runId, { repair: true });
    expect(repair.planned.find(p => p.key === "cogito").reason).toBe("repair");
    expect(repair.planned.filter(p => p.reason === "follows").map(p => p.key)).toEqual(expect.arrayContaining(["animus", "actus"]));
    expect(repair.kept.map(k => k.key)).toEqual(["refresh", "corpus"]);
    const done = await completeJanus(runId, { repair: true, expected: repair.token });
    expect(done).toMatchObject({ success: true, status: "completed" });
    expect(h.llm.stages).toEqual([...repair.plan, "qualification"]);
    expect(stagesOf("corpus")).toHaveLength(1);
    expect(completionOf(viewOf(runId)).complete).toBe(true);
  });

  it("when the repaired stage fails again, nothing valid downstream is regenerated", async () => {
    const runId = await liveShape();
    h.db.RunStage.find(s => s.stage_key === "cogito").output = DOCUMENT_DEPS();
    h.llm.failOn = "cogito";
    const repair = await previewCompletion(runId, { repair: true });
    await completeJanus(runId, { repair: true, expected: repair.token });
    expect(h.llm.stages.filter(s => s === "cogito")).toHaveLength(3); // its own bounded attempts
    expect(h.llm.stages.filter(s => ["animus", "actus", "synthesis", "blueprint"].includes(s))).toEqual([]);
    expect(stagesOf("animus")).toHaveLength(1);
  });

  it("is guarded like a re-run: approved preview only, operator only, not on an open run, not beside an unresolved call", async () => {
    const runId = await liveShape();
    const impact = await previewCompletion(runId);
    await expect(completeJanus(runId, { expected: `${impact.token}x` })).rejects.toThrow(STALE_PREVIEW_MESSAGE);
    h.session.user = { id: "u2", role: "user" };
    await expect(completeJanus(runId, { expected: impact.token })).rejects.toThrow(OPERATOR_ONLY_MESSAGE);
    h.session.user = { id: "user-operator", role: "admin" };
    const both = await Promise.allSettled([1, 2].map(() => completeJanus(runId, { expected: impact.token })));
    expect(both.filter(r => r.status === "fulfilled")).toHaveLength(1); // one initiation per state
    expect(h.llm.stages.filter(s => s === "blueprint")).toHaveLength(1);

    h.reset();
    h.llm.transport.cogito = "lost";
    const open = await executeJanus(params("quick"));
    expect((await previewCompletion(open.runId)).refusals[0]).toMatch(/has not settled/);
    await expect(completeJanus(open.runId)).rejects.toThrow(/Cannot complete this run/);
  });

  it("a recorded Synthesis without its synthesis-level outputs cannot count as complete", async () => {
    const { runId } = await executeJanus(params("full"));
    delete h.db.RunStage.find(s => s.stage_key === "synthesis").output.limitation_foreground;
    expect(completionOf(viewOf(runId))).toMatchObject({ complete: false, blocking: ["synthesis: limitation_foreground missing"] });
  });
});