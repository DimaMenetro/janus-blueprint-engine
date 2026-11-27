// Ideal Form tranche T1 — explicit model allocation (DIMA's directive §XIV, §XVI and the Hybrid Model amendment).
// A run records an allocation by cognitive role; a stage revision is fixed to its model when it is created; the
// function reads the model from the revision, never from the request; what the provider reports is recorded and
// judged. Expectations are written out here, independently of the engine's derivations.
// This file names no model: identifiers are read from the registry, the one place that names them.
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, rerunStages } from "@/lib/janus/browserAdapter";
import { callLLM } from "@/lib/janus/stageRunner";
import { verifyContinuation } from "@/lib/janus/stageEngine";
import { openAttempt } from "@/lib/janus/stageStore";
import { composeRunView } from "@/lib/janus/runView";
import { substrateFindings } from "@/lib/janus/qualification";
import { stagePlan } from "@/lib/janus/executionState";
import { isDeterministicStage } from "@/lib/janus/blueprintPipeline";
import { QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { MODELS, MODEL_POLICY, COGNITIVE_ROLES, ALLOCATION_PROFILES, DEFAULT_PROFILE, DEFAULT_EFFORT, roleOf, resolveAllocation,
  modelPolicySnapshot, stageModel, modelStanding, cognitionModels } from "@/lib/janus/protocolRegistry";

const params = (mode, extra = {}) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false, ...extra });
const HYBRID = ALLOCATION_PROFILES.hybrid.models;
const SUBSTRATE = HYBRID.domain;        // the general substrate
const REASONER = HYBRID.intersection;   // reserved for consequential reasoning
const called = () => h.db.RunStage.filter(s => !isDeterministicStage(s.stage_key));
const viewOf = () => composeRunView(h.db.Run[0], h.db.RunStage, h.db.RunAttempt);
const refusal = (promise) => promise.then(() => null, e => ({ evidence: e.evidence, reason: e.reason }));

beforeEach(() => h.reset());

describe("the allocation: cognitive roles, not stage names", () => {
  it("every stage that calls a model has a role, and every role has an authorized model in every profile", () => {
    ["quick", "standard", "full"].forEach(mode => [...stagePlan(mode), QUALIFICATION_KEY].filter(k => !isDeterministicStage(k)).forEach(key => {
      expect(COGNITIVE_ROLES[roleOf(key)]).toBeTruthy();
      Object.keys(ALLOCATION_PROFILES).forEach(profile => expect(stageModel(modelPolicySnapshot({ profile }), key)).toEqual(
        { role: roleOf(key), requested: ALLOCATION_PROFILES[profile].models[roleOf(key)], effort: DEFAULT_EFFORT }));
    }));
    expect(roleOf("blueprint:assembly")).toBeNull(); // computed by code: it has no model
  });

  it("the default is the hybrid allocation: the substrate for the domains, elaboration and assimilation, the reasoning model everywhere reasoning is the product", () => {
    expect(DEFAULT_PROFILE).toBe("hybrid");
    expect(SUBSTRATE).not.toBe(REASONER);
    expect(MODELS[SUBSTRATE].signature).not.toBe(MODELS[REASONER].signature); // two tiers, not two names for one
    const onSubstrate = ["domain", "elaboration", "assimilation"];
    Object.keys(COGNITIVE_ROLES).forEach(role => expect(HYBRID[role]).toBe(onSubstrate.includes(role) ? SUBSTRATE : REASONER));
    expect(resolveAllocation()).toMatchObject({ profile: "hybrid", customized: false });
  });
});

describe("a run records its allocation and every stage version is fixed to its model", () => {
  it("the run holds the allocation from its start; each version records role, model and effort; the request never carries a model", async () => {
    await executeJanus(params("full"));
    const snapshot = h.db.Run[0].model_policy_snapshot;
    expect(snapshot).toMatchObject({ profile: "hybrid", customized: false, hidden_fallback_allowed: false, transport: "ai_gateway" });
    expect(Object.keys(snapshot.allocation).sort()).toEqual(Object.keys(COGNITIVE_ROLES).sort());
    expect(snapshot.allocation_adopted_at).toBeUndefined(); // recorded at the start, not adopted later
    called().forEach(s => expect(s.provenance.model).toEqual({ role: roleOf(s.stage_key), requested: HYBRID[roleOf(s.stage_key)], effort: DEFAULT_EFFORT }));
    expect(h.llm.calls.every(keys => keys.join() === "stage_id,prompt")).toBe(true);
    // What the function asked the Gateway for is exactly what each version recorded, call by call.
    expect(h.llm.models).toEqual(h.llm.stages.map(key => HYBRID[roleOf(key)]));
    h.db.RunAttempt.forEach(a => {
      const fixed = h.db.RunStage.find(s => s.id === a.stage_id).provenance.model.requested;
      expect(a.model_call).toMatchObject({ requested_model: fixed, effective_model: fixed, reasoning_effort: DEFAULT_EFFORT, finish_reason: "stop" });
    });
    expect(substrateFindings(viewOf())).toEqual({ blocking: [], warnings: [] });
  });

  it("the operator's selection governs execution: a whole profile, or one role changed", async () => {
    await executeJanus(params("quick", { modelSelection: { profile: "opus" } }));
    expect([...new Set(h.llm.models)]).toEqual([REASONER]);
    expect(h.db.Run[0].model_policy_snapshot).toMatchObject({ profile: "opus", customized: false });

    h.reset();
    const other = cognitionModels().find(m => m !== REASONER && m !== SUBSTRATE);
    await executeJanus(params("quick", { modelSelection: { overrides: { qualification: { model: other, effort: "medium" } } } }));
    expect(h.db.Run[0].model_policy_snapshot).toMatchObject({ profile: "hybrid", customized: true });
    expect(h.db.RunStage.find(s => s.stage_key === QUALIFICATION_KEY).provenance.model).toEqual({ role: "qualification", requested: other, effort: "medium" });
    called().filter(s => s.stage_key !== QUALIFICATION_KEY).forEach(s => expect(s.provenance.model.requested).toBe(HYBRID[roleOf(s.stage_key)]));
    expect(h.db.RunAttempt.find(a => a.stage_key === QUALIFICATION_KEY).model_call.requested_model).toBe(other);
  });

  it("a model that is not authorized — the prohibited one, an unknown one, the research model — is refused before any record or call", async () => {
    const prohibited = `${MODEL_POLICY.prohibited_model_prefixes[0]}_pro`;
    const research = Object.keys(MODELS).find(m => MODELS[m].research);
    for (const model of [prohibited, "an_unlisted_model", research]) {
      await expect(executeJanus(params("quick", { modelSelection: { overrides: { domain: { model } } } }))).rejects.toThrow(/is not a model Janus may reason with/);
    }
    await expect(executeJanus(params("quick", { modelSelection: { profile: "cheapest" } }))).rejects.toThrow(/Unknown model allocation profile/);
    await expect(executeJanus(params("quick", { modelSelection: { overrides: { domain: { effort: "max" } } } }))).rejects.toThrow(/is not a reasoning effort the transport accepts/);
    expect(h.db.Run).toHaveLength(0);
    expect(h.db.RunStage).toHaveLength(0);
    expect(h.llm.calls).toHaveLength(0);
  });
});

describe("the substrate of a version cannot change, and is never left to a default", () => {
  it("a retry calls the model the version recorded, even if the run's record were altered between its attempts", async () => {
    h.llm.invalidTimes.corpus = 1; // first attempt rejected by validation, second valid
    const gate = h.gateOn("corpus");
    const pending = executeJanus(params("quick"));
    await gate.reached;
    h.db.Run[0].model_policy_snapshot.allocation.domain = { model: REASONER, effort: "low" }; // nothing in Janus does this; the record is tampered to prove the rule
    gate.release();
    await pending;
    const corpus = h.db.RunStage.find(s => s.stage_key === "corpus");
    const attempts = h.db.RunAttempt.filter(a => a.stage_id === corpus.id);
    expect(attempts.map(a => a.outcome)).toEqual(["schema_failure", "succeeded"]);
    attempts.forEach(a => expect(a.model_call).toMatchObject({ requested_model: SUBSTRATE, reasoning_effort: DEFAULT_EFFORT }));
    expect(corpus.provenance.model).toEqual({ role: "domain", requested: SUBSTRATE, effort: DEFAULT_EFFORT });
  });

  it("a version that records no model gets no call and is never continued; a model outside the list on the record is refused too", async () => {
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "" });
    const stage = await h.base44.entities.RunStage.create({ run_id: run.id, stage_key: "corpus", revision: 1, status: "running", depends_on: [], provenance: { origin: "execution" } });
    await openAttempt(stage, 1);
    expect(await refusal(callLLM(stage.id, "STAGE KEY: corpus"))).toEqual({ evidence: "not_started", reason: "model_not_recorded" });
    expect((await verifyContinuation(viewOf(), h.db.RunStage[0])).reasons).toContain("it records no model (it was started before explicit model allocation)");

    h.db.RunStage[0].provenance.model = { role: "domain", requested: "an_unlisted_model", effort: DEFAULT_EFFORT };
    expect(await refusal(callLLM(stage.id, "STAGE KEY: corpus"))).toEqual({ evidence: "not_started", reason: "model_not_authorized" });

    // Refused before the slot and the claim: nothing was taken, nothing was called.
    expect(h.llm.models).toEqual([]);
    expect(h.db.RunAttempt[0]).toMatchObject({ outcome: "in_flight", claim_state: "unclaimed" });
    expect(h.db.Run[0].active_attempt_id).toBe("");
  });

  it("a run created before explicit allocation adopts the default once, with the moment recorded, when a new version is created for it", async () => {
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "",
      model_policy_snapshot: { operational_model: "inherited from the app setting", hidden_fallback_allowed: false } });
    await resumeJanus(run.id);
    const adopted = h.db.Run[0].model_policy_snapshot;
    expect(adopted.allocation).toEqual(resolveAllocation().roles);
    expect(adopted.allocation_adopted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    called().forEach(s => expect(s.provenance.model.requested).toBe(HYBRID[roleOf(s.stage_key)]));

    await rerunStages(run.id, { targets: ["cogito"] });
    expect(h.db.Run[0].model_policy_snapshot.allocation_adopted_at).toBe(adopted.allocation_adopted_at); // adopted once
    expect(h.db.RunStage.filter(s => s.stage_key === "cogito").map(s => s.provenance.model.requested)).toEqual([SUBSTRATE, SUBSTRATE]);
  });
});

describe("what the provider reports is recorded and judged, never hidden", () => {
  it("the answering model is verified, of the same tier, substituted, or unreported", () => {
    expect(modelStanding(REASONER, REASONER)).toBe("verified");
    expect(modelStanding(REASONER, `provider/${REASONER.replace(/_/g, "-")}-20261101`)).toBe("verified");
    expect(modelStanding(REASONER, `${MODELS[REASONER].signature}-latest`)).toBe("tier");
    expect(modelStanding(REASONER, "a-small-fast-model")).toBe("mismatch");
    expect(modelStanding(REASONER, undefined)).toBe("unreported");
  });

  it("a stage answered by another model than its version was fixed to blocks completion and says which; the output stays inspectable", async () => {
    h.llm.effective.cogito = "a-small-fast-model";
    const result = await executeJanus(params("quick"));
    const cogito = h.db.RunStage.find(s => s.stage_key === "cogito");
    expect(cogito.status).toBe("succeeded"); // the paid output is not discarded
    expect(h.db.RunAttempt.find(a => a.stage_id === cogito.id).model_call).toMatchObject({ requested_model: SUBSTRATE, effective_model: "a-small-fast-model" });
    const finding = `cogito: answered by "a-small-fast-model", not the model this version was fixed to (${MODELS[SUBSTRATE].label}). Re-run the stage.`;
    expect(substrateFindings(viewOf()).blocking).toEqual([finding]);
    expect(result.status).toBe("partial"); // not completed: the cognition is not what the run was allocated
    expect(h.db.Run[0].completion_manifest.blocking).toContain(finding);
    expect(h.db.Run[0].released_blueprint_stage_id).toBe("");
    expect(h.db.RunStage.some(s => s.stage_key === QUALIFICATION_KEY)).toBe(false); // an incomplete run is not evaluated
  });

  it("an output cut off at the output limit is reported as cut off, with the reason recorded on every attempt", async () => {
    h.llm.raw.corpus = '{"corpus": {"constraints": ["Grid latency under 200 ms", "Edge nodes';
    h.llm.finish.corpus = "length";
    await executeJanus(params("quick"));
    const attempts = h.db.RunAttempt.filter(a => a.stage_key === "corpus");
    expect(attempts).toHaveLength(3);
    attempts.forEach(a => {
      expect(a.outcome).toBe("parse_failure");
      expect(a.error_message).toMatch(/cut off at the model's output-length limit \(finish reason: length\)/);
      expect(a.model_call.finish_reason).toBe("length");
    });
  });

  it("stage versions from before explicit allocation are said to record no model: a warning, not a failure", async () => {
    await executeJanus(params("quick"));
    h.db.RunStage.filter(s => ["corpus", "cogito"].includes(s.stage_key)).forEach(s => { delete s.provenance.model; });
    expect(substrateFindings(viewOf())).toEqual({ blocking: [],
      warnings: ["2 stage versions record no model: produced before explicit allocation, on the platform's default model (corpus, cogito)"] });
  });
});

describe("the store keeps only what the entity schemas declare inside a declared object", () => {
  it("the nested records the engine relies on are declared and survive; an undeclared key does not", async () => {
    const { runId } = await executeJanus(params("quick"));
    expect(h.db.RunStage.find(s => s.stage_key === "blueprint:assembly").provenance).toMatchObject({ method: "deterministic", origin: "execution" });
    expect(h.db.RunStage.find(s => s.stage_key === "corpus").provenance).toMatchObject({ model: { role: "domain" } });
    const odd = await h.base44.entities.RunStage.create({ run_id: runId, stage_key: "probe", revision: 1, status: "failed", provenance: { origin: "execution", undeclared_key: 1 } });
    expect(odd.provenance).toEqual({ origin: "execution" });
  });
});