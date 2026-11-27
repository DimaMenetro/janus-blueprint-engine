// Ideal Form tranche T1 — explicit model allocation (DIMA's directive §XIV, §XVI and the Hybrid Model amendment).
// A run records an allocation by cognitive role; a stage revision is fixed to its model when it is created; the
// function reads the model from the revision, never from the request; what the provider reports is recorded and
// judged. Expectations are written out here, independently of the engine's derivations.
// This file names no model: identifiers are read from the registry, the one place that names them.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, rerunStages, refineJanus, evaluateJanus, reconcileJanus } from "@/lib/janus/browserAdapter";
import { QUALITY_CRITERIA, FAILURE_EVIDENCE, RETRY_POLICY, OUTPUT_TRUNCATED, retryDecision } from "@/lib/janus/lifecycleContract";
import { callLLM } from "@/lib/janus/stageRunner";
import { verifyContinuation } from "@/lib/janus/stageEngine";
import { openAttempt } from "@/lib/janus/stageStore";
import { composeRunView } from "@/lib/janus/runView";
import { substrateFindings, substrateOf, deriveQualification } from "@/lib/janus/qualification";
import { stagePlan, deriveExecutionState } from "@/lib/janus/executionState";
import { isDeterministicStage } from "@/lib/janus/blueprintPipeline";
import { QUALIFICATION_KEY } from "@/lib/janus/stageModel";
import { instantOf } from "@/lib/janus/storeTime";
import { MODELS, MODEL_POLICY, COGNITIVE_ROLES, ALLOCATION_PROFILES, DEFAULT_PROFILE, DEFAULT_EFFORT, roleOf, resolveAllocation,
  modelPolicySnapshot, stageModel, modelStanding, modelEvidence, statedVersion, cognitionModels } from "@/lib/janus/protocolRegistry";

const params = (mode, extra = {}) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false, ...extra });
const HYBRID = ALLOCATION_PROFILES.hybrid.models;
const SUBSTRATE = HYBRID.domain;        // the general substrate
const REASONER = HYBRID.intersection;   // reserved for consequential reasoning
const called = () => h.db.RunStage.filter(s => !isDeterministicStage(s.stage_key));
const viewOf = () => composeRunView(h.db.Run[0], h.db.RunStage, h.db.RunAttempt);
const snapshotOf = () => JSON.parse(JSON.stringify(h.db.Run[0].model_policy_snapshot));
const refusal = (promise) => promise.then(() => null, e => ({ evidence: e.evidence, reason: e.reason }));
/** A provider-style name for an authorized model: a vendor prefix, dashes, a date stamp. */
const dated = (id) => `provider/${id.replace(/_/g, "-")}-20261101`;
/** Another authorized model of the same tier as the reasoning model (another version of it), from the registry. */
const SAME_TIER = Object.keys(MODELS).find(m => m !== REASONER && MODELS[m].signature === MODELS[REASONER].signature);
const SAME_TIER_AS_SUBSTRATE = Object.keys(MODELS).find(m => m !== SUBSTRATE && MODELS[m].signature === MODELS[SUBSTRATE].signature);

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
    expect(snapshot.allocation_adopted_at ?? null).toBeNull(); // recorded at the start, not adopted later
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
    // The policy such a run declared when it started — the policy its earlier versions were produced under.
    const declared = { operational_model: "inherited from the app setting", prohibited_model_prefixes: ["gemini"], hidden_fallback_allowed: false, refresh_architecture: "fail closed until retrieval is approved" };
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "",
      model_policy_snapshot: declared });
    await resumeJanus(run.id);
    const adopted = snapshotOf();
    expect(adopted.allocation).toEqual(resolveAllocation().roles);
    expect(adopted).toMatchObject({ profile: DEFAULT_PROFILE, customized: false });
    expect(adopted.allocation_adopted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    called().forEach(s => expect(s.provenance.model.requested).toBe(HYBRID[roleOf(s.stage_key)]));

    // DAIONAE'S REVIEW (2026-11-27): adoption adds, it never rewrites. What the run declared at its start is still
    // there, field for field; the policy now in force is recorded beside it, not over it.
    Object.entries(declared).forEach(([field, value]) => expect(adopted[field]).toEqual(value));
    expect(adopted.transport).toBeNull(); // it declared no transport, and none was written into its declaration
    expect(adopted.adopted_policy).toEqual({ operational_model: MODEL_POLICY.operational_model, prohibited_model_prefixes: MODEL_POLICY.prohibited_model_prefixes,
      hidden_fallback_allowed: MODEL_POLICY.hidden_fallback_allowed, refresh_architecture: MODEL_POLICY.refresh_architecture, transport: MODEL_POLICY.transport });
    expect(adopted.adopted_policy.operational_model).not.toBe(declared.operational_model);

    await rerunStages(run.id, { targets: ["cogito"] });
    expect(snapshotOf()).toEqual(adopted); // adopted once: a later operation changes nothing in it
    expect(h.db.RunStage.filter(s => s.stage_key === "cogito").map(s => s.provenance.model.requested)).toEqual([SUBSTRATE, SUBSTRATE]);
  });

  it("a run that declared nothing at its start adopts the allocation without a declaration being invented for it", async () => {
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "" });
    expect(snapshotOf()).toBeNull();
    await resumeJanus(run.id);
    expect(snapshotOf()).toMatchObject({ operational_model: null, prohibited_model_prefixes: [], hidden_fallback_allowed: null, refresh_architecture: null, transport: null,
      profile: DEFAULT_PROFILE, allocation: resolveAllocation().roles, adopted_policy: { transport: MODEL_POLICY.transport } });
  });
});

describe("what the provider reports is recorded and judged, never hidden", () => {
  // DAIONAE'S REVIEW (2026-11-27), replacing this tranche's own first rule: it accepted the tier word alone
  // ("tier"), so another version of the same tier was not a finding, and it compared names with their separators
  // removed, so a version that merely begins like the requested one counted as verified.
  it("a model is a tier and a version: only the same tier and the same version is verified; another version of the tier is a substitution", () => {
    expect(modelStanding(REASONER, REASONER)).toBe("verified");
    expect(modelStanding(REASONER, dated(REASONER))).toBe("verified");
    expect(modelStanding(SUBSTRATE, `${SUBSTRATE}-2026-11-01`)).toBe("verified"); // a dashed date is a date, not a version
    expect(modelStanding(SUBSTRATE, `${SUBSTRATE}.0`)).toBe("verified");          // ".0" states the same version

    // Another version of the same tier answered: a substitution, in both directions.
    expect(SAME_TIER).toBeTruthy();
    expect(modelEvidence(REASONER, dated(SAME_TIER))).toMatchObject({ standing: "substituted", note: expect.stringContaining(`instead of ${statedVersion(REASONER).join(".")}`) });
    expect(modelStanding(SAME_TIER, dated(REASONER))).toBe("substituted");
    // The case the earlier rule could not see: a version that only begins like the requested one.
    expect(statedVersion(`${SUBSTRATE}-5-20261101`)).toEqual([...statedVersion(SUBSTRATE), 5]);
    expect(modelStanding(SUBSTRATE, `${SUBSTRATE}-5-20261101`)).toBe("substituted");

    // The tier alone confirms nothing, and is never counted as verified.
    expect(modelEvidence(REASONER, `${MODELS[REASONER].signature}-latest`)).toMatchObject({ standing: "unconfirmed", note: expect.stringContaining("is not confirmed") });
    expect(modelStanding(REASONER, "a-small-fast-model")).toBe("substituted");
    expect(modelStanding(REASONER, undefined)).toBe("unreported");

    // The rule can tell every authorized model from every other: each states a version, and no two share tier and version.
    const identities = Object.keys(MODELS).map(m => `${MODELS[m].signature}:${statedVersion(m).join(".")}`);
    Object.keys(MODELS).forEach(m => expect(statedVersion(m).length).toBeGreaterThan(0));
    expect(new Set(identities).size).toBe(identities.length);
    Object.keys(MODELS).forEach(asked => Object.keys(MODELS).forEach(answered =>
      expect(modelStanding(asked, dated(answered))).toBe(asked === answered ? "verified" : "substituted")));
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

  it("another version of the same tier blocks completion exactly as another model does; a name with no version is said and never counted as verified", async () => {
    h.llm.effective.cogito = dated(SAME_TIER_AS_SUBSTRATE || "another-tier");
    h.llm.effective.corpus = `${MODELS[SUBSTRATE].signature}-latest`;
    const result = await executeJanus(params("quick"));
    const { blocking, warnings } = substrateFindings(viewOf());
    expect(warnings).toEqual([`The model that answered 1 stage version is not confirmed: the provider's name carries the tier but no version (corpus: "${MODELS[SUBSTRATE].signature}-latest")`]);
    expect(substrateOf(viewOf(), h.db.RunStage.find(s => s.stage_key === "corpus"))).toMatchObject({ standing: "unconfirmed", requested: SUBSTRATE });
    expect(blocking).toHaveLength(1);
    expect(blocking[0]).toMatch(/^cogito: answered by ".+". Re-run the stage\.$|^cogito: answered by ".+", not the model this version was fixed to \(.+\)\. Re-run the stage\.$|^cogito: answered by ".+": the tier this version was fixed to, but version .+ instead of .+ \(.+\)\. Re-run the stage\.$/);
    expect(result.status).toBe("partial");
    expect(h.db.Run[0].completion_manifest).toMatchObject({ complete: false, blocking: expect.arrayContaining(blocking), warnings: expect.arrayContaining(warnings) });
  });

  // DAIONAE'S REVIEW (2026-11-27): the evaluation is not a stage of the run's plan, so the substrate rule did not
  // reach it — a substituted evaluator could qualify and release a Blueprint.
  it("the independent evaluation is held to the same rule: a substituted evaluator's verdicts are not accepted, nothing is released, and only the operator starts another", async () => {
    h.llm.effective.qualification = "a-small-fast-model";
    const result = await executeJanus(params("quick"));
    expect(result.status).toBe("completed"); // completion is not qualification: the run's own stages are what they were allocated
    expect(substrateFindings(viewOf()).blocking).toEqual([]);
    const evaluations = () => h.db.RunStage.filter(s => s.stage_key === QUALIFICATION_KEY);
    expect(evaluations().map(s => s.status)).toEqual(["succeeded"]); // the paid output is kept and inspectable
    const q = deriveQualification(viewOf());
    expect(q).toMatchObject({ state: "qualifying", pending: "evaluation_rejected", evaluationAction: "new_version", needsEvaluation: false, evaluationStageId: null,
      evaluator: { standing: "substituted", requested: HYBRID.qualification } });
    expect(q.evaluationRejected).toBe(`The independent evaluation of this Blueprint version was answered by "a-small-fast-model", not the model this version was fixed to (${MODELS[HYBRID.qualification].label}), so its verdicts are not accepted`);
    expect(q.release).toMatchObject({ released: false, status: "candidate" });
    expect(q.refinement.available).toBe(false); // nothing is refined against verdicts that are not accepted
    expect(q.criteria.filter(c => c.method === "critique").every(c => c.verdict === null)).toBe(true);
    expect(h.db.Run[0]).toMatchObject({ qualification_state: "qualifying", released_blueprint_stage_id: "" });

    // No hidden re-evaluation: the engine starts none, and the operator's unqualified request is refused.
    const calls = h.llm.stages.length;
    await expect(evaluateJanus(result.runId)).rejects.toThrow(/its verdicts are not accepted\. Another evaluation is a new version and needs your explicit decision/);
    await expect(refineJanus(result.runId)).rejects.toThrow(/it applies to a Blueprint that was evaluated and failed/);
    expect(h.llm.stages).toHaveLength(calls);
    expect(evaluations()).toHaveLength(1);

    // The operator's explicit new version, answered by the model it is fixed to, is the evaluation that counts.
    delete h.llm.effective.qualification;
    await evaluateJanus(result.runId, { newVersion: true });
    expect(evaluations().map(s => [s.revision, s.status, s.provenance.model.requested])).toEqual([[1, "succeeded", HYBRID.qualification], [2, "succeeded", HYBRID.qualification]]);
    const after = deriveQualification(viewOf());
    expect(after).toMatchObject({ state: "qualified", evaluationRejected: null, pending: null, evaluationAction: null, evaluator: { standing: "verified" } });
    expect(h.db.Run[0]).toMatchObject({ qualification_state: "qualified", released_blueprint_stage_id: after.blueprintStageId });
  });

  it("another version of the evaluator's tier is rejected as well; an evaluator whose name states no version is said beside verdicts that stand", async () => {
    h.llm.effective.qualification = dated(SAME_TIER);
    await executeJanus(params("quick"));
    expect(deriveQualification(viewOf())).toMatchObject({ state: "qualifying", pending: "evaluation_rejected", evaluator: { standing: "substituted" } });
    expect(h.db.Run[0].released_blueprint_stage_id).toBe("");

    h.reset();
    h.llm.effective.qualification = `${MODELS[HYBRID.qualification].signature}-latest`;
    await executeJanus(params("quick"));
    const q = deriveQualification(viewOf());
    expect(q).toMatchObject({ state: "qualified", evaluationRejected: null, evaluator: { standing: "unconfirmed" } });
    expect(q.evaluator.note).toMatch(/is not confirmed/);
  });
});

// DAIONAE'S REVIEW (2026-11-27), replacing this tranche's own first test, which expected THREE attempts settled as
// parse_failure: the cut-off answer was bought three times, each time with the same limit.
describe("an answer cut off at the output limit is never bought again unchanged", () => {
  const CUT = '{"corpus": {"constraints": ["Grid latency under 200 ms", "Edge nodes';
  const corpusAttempts = () => h.db.RunAttempt.filter(a => a.stage_key === "corpus");
  const corpusStage = () => h.db.RunStage.find(s => s.stage_key === "corpus");
  const corpusCalls = () => h.llm.stages.filter(k => k === "corpus").length;

  it("the contract: truncation is failure evidence of its own, and it is not retryable", () => {
    expect(FAILURE_EVIDENCE).toContain(OUTPUT_TRUNCATED);
    expect(RETRY_POLICY.retryable).not.toContain(OUTPUT_TRUNCATED);
    [1, 2, RETRY_POLICY.max_attempts_per_stage].forEach(n => expect(retryDecision(OUTPUT_TRUNCATED, n)).toBe("none"));
  });

  it("the version settles on the one call that was cut off, and says why the request is not repeated", async () => {
    h.llm.raw.corpus = CUT;
    h.llm.finish.corpus = "length";
    await executeJanus(params("quick"));
    expect(corpusCalls()).toBe(1); // one purchase, not three
    expect(corpusAttempts()).toHaveLength(1);
    expect(corpusAttempts()[0]).toMatchObject({ outcome: OUTPUT_TRUNCATED, retry_decision: "none", transport: { state: "returned" }, response_text: CUT, model_call: { finish_reason: "length" } });
    expect(corpusAttempts()[0].error_message).toMatch(/cut off at the call's output limit of \d+ tokens \(finish reason: length\)\. The same request would be cut off again, so it is not repeated/);
    expect(corpusStage()).toMatchObject({ status: "failed", error_class: OUTPUT_TRUNCATED, output: null });
    // Not something Resume may buy again either: only an explicit re-run gives the stage another version.
    expect(deriveExecutionState(viewOf()).failures.find(f => f.key === "corpus")).toMatchObject({ evidence: OUTPUT_TRUNCATED, attempts: 1, rerunOnly: true });
  });

  it("the whole limit spent before any answer was produced is truncation too, not a provider failure to retry", async () => {
    h.llm.raw.corpus = "";
    h.llm.finish.corpus = "length";
    await executeJanus(params("quick"));
    expect(corpusCalls()).toBe(1);
    expect(corpusAttempts()[0]).toMatchObject({ outcome: OUTPUT_TRUNCATED, retry_decision: "none", transport: { state: "returned" } });
    expect(corpusAttempts()[0].error_message).toMatch(/before any of it was produced/);
  });

  it("an empty answer for any other reason is still a failure of the call, retried within the bound", async () => {
    h.llm.raw.corpus = "";
    await executeJanus(params("quick"));
    expect(corpusAttempts().map(a => [a.outcome, a.retry_decision])).toEqual([["provider_error", "retry_scheduled"], ["provider_error", "retry_scheduled"], ["provider_error", "exhausted"]]);
    expect(corpusAttempts()[0].transport).toMatchObject({ state: "failed", message: "the provider returned no content (finish reason: stop)" });
  });

  it("an answer that is whole although the provider reports the limit is the artifact it is; one that is whole and invalid is corrected, not called truncated", async () => {
    h.llm.finish.corpus = "length";
    await executeJanus(params("quick"));
    expect(corpusAttempts().map(a => a.outcome)).toEqual(["succeeded"]);
    expect(corpusAttempts()[0].model_call.finish_reason).toBe("length"); // recorded, and visible in Stage lineage
    expect(corpusStage().status).toBe("succeeded");

    h.reset();
    h.llm.finish.corpus = "length";
    h.llm.invalidTimes.corpus = 1;
    await executeJanus(params("quick"));
    expect(corpusAttempts().map(a => a.outcome)).toEqual(["schema_failure", "succeeded"]); // the retry carries the rejections: a changed request
  });

  it("recovery reads a recorded cut-off answer the same way: settled from the record, never left waiting for a retry", async () => {
    h.llm.raw.corpus = CUT;
    h.llm.finish.corpus = "length";
    h.llm.transport.corpus = "late"; // the session gets no response; the call finishes on the server afterwards
    const { runId, unresolved } = await executeJanus(params("quick"));
    expect(unresolved).toBe("corpus");
    await h.finishPending();
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(corpusAttempts()).toHaveLength(1);
    expect(corpusAttempts()[0]).toMatchObject({ outcome: OUTPUT_TRUNCATED, retry_decision: "none", settled_by: "recovery" });
    expect(corpusStage()).toMatchObject({ status: "failed", error_class: OUTPUT_TRUNCATED });
    await resumeJanus(runId); // Resume is continuity: it finishes the plan and closes the run without that stage
    expect(corpusCalls()).toBe(1);
    expect(h.db.RunStage.filter(s => s.stage_key === "corpus")).toHaveLength(1);
  });
});

describe("what is recorded before explicit allocation", () => {

  it("stage versions from before explicit allocation are said to record no model: a warning, not a failure", async () => {
    await executeJanus(params("quick"));
    h.db.RunStage.filter(s => ["corpus", "cogito"].includes(s.stage_key)).forEach(s => { delete s.provenance.model; });
    expect(substrateFindings(viewOf())).toEqual({ blocking: [],
      warnings: ["2 stage versions record no model: produced before explicit allocation, on the platform's default model (corpus, cogito)"] });
  });
});

// The expectations of this block are the live store's own answers, transcribed from the measurement of 2026-11-27
// (temporary records, deleted in the same call). They hold the test store to the real one: if the double drifts
// from what was measured, these fail.
describe("the test store behaves as the real store was measured to", () => {
  const E = () => h.base44.entities;
  const stage = (extra) => E().RunStage.create({ run_id: "probe-run", stage_key: "probe", revision: 1, status: "failed", ...extra });
  const read = async (name, id) => (await E()[name].filter({ id }))[0];

  it("a write that applies the schema drops what is not declared, at every depth, and stores what was not written as default, empty list or null", async () => {
    const made = await stage({ zz_undeclared_top: 1, started_at: "2026-11-27T02:30:00.123Z",
      provenance: { origin: "execution", undeclared_key: 1, model: { requested: "m", undeclared: 1 }, sources: [{ id: "S1", undeclared_in_item: 1 }] } });
    const kept = await read("RunStage", made.id);
    expect(kept).not.toHaveProperty("zz_undeclared_top");
    expect(kept).toMatchObject({ protocol_version: null, depends_on: [], input_fingerprint: null, output: null, validation: null, error_class: null, completed_at: null,
      started_at: "2026-11-27T02:30:00.123Z" }); // a date-time the app writes comes back exactly as written
    expect(kept.provenance).toEqual({ origin: "execution", orchestrator: null, model_policy: null, method: null, model: { role: null, requested: "m", effort: null }, refines: null,
      sources: [{ id: "S1", kind: null, title: null, origin: null, published_at: null, retrieved_at: null, quality: null, subdomains: [] }] });

    const bare = await read("RunStage", (await E().RunStage.create({ run_id: "probe-run", stage_key: "probe", revision: 2, status: "running" })).id);
    expect(bare).toMatchObject({ provenance: null, validation: null, output: null }); // a declared object never written is null, not an object of nulls
    const attempt = await read("RunAttempt", (await E().RunAttempt.create({ run_id: "probe-run", stage_id: made.id, stage_key: "probe", attempt_number: 1, claim_state: "unclaimed" })).id);
    expect(attempt).toMatchObject({ transport: null, model_call: null, response_text: null, retry_decision: "none", outcome: "in_flight" }); // declared defaults are applied
    const run = await read("Run", (await E().Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "cancelled",
      model_policy_snapshot: { operational_model: "old policy text", hidden_fallback_allowed: false, zz_undeclared: 1 } })).id);
    expect(run).toMatchObject({ active_attempt_id: null, graph_epoch: null, completion_manifest: null, corpus: null, validation_errors: [], storage_model: null, refresh_enabled: false, blueprint_level: "L2" });
    // `adopted_policy` was declared after the measurement; null is the measured rule for a declared object never written.
    expect(run.model_policy_snapshot).toEqual({ operational_model: "old policy text", prohibited_model_prefixes: [], hidden_fallback_allowed: false, refresh_architecture: null,
      transport: null, profile: null, customized: null, allocation: null, allocation_adopted_at: null, adopted_policy: null });
  });

  it("an object declared without properties is kept as written; a partly written declared one is filled", async () => {
    const made = await stage({ provenance: { origin: "refinement", refines: { blueprint_stage_id: "b", cycle: 1, zz: 1,
      deficiencies: [{ id: "E1", severity: "blocking", category: "c", where: "w", problem: "p", required_change: "r", zz: 1 }] } },
      output: { any: { nested: [1, { k: null }] }, empty_list: [], nul: null }, validation: { valid: true } });
    const kept = await read("RunStage", made.id);
    expect(kept.output).toEqual({ any: { nested: [1, { k: null }] }, empty_list: [], nul: null });
    expect(kept.validation).toEqual({ validator: null, valid: true, errors: [] });
    expect(kept.provenance.refines).toEqual({ blueprint_stage_id: "b", evaluation_stage_id: null, cycle: 1,
      deficiencies: [{ id: "E1", severity: "blocking", category: "c", where: "w", problem: "p", evidence: null, required_change: "r" }] });
  });

  it("update replaces a declared object as a whole; the conditional write sets exactly the given paths and applies no schema", async () => {
    const made = await stage({ provenance: { origin: "execution", model: { requested: "m" } } });
    await E().RunStage.update(made.id, { provenance: { method: "deterministic" }, zz_undeclared_top: 2 });
    const updated = await read("RunStage", made.id);
    expect(updated.provenance).toEqual({ origin: null, orchestrator: null, model_policy: null, method: "deterministic", model: null, refines: null, sources: [] });
    expect(updated).not.toHaveProperty("zz_undeclared_top");
    expect(updated.status).toBe("failed"); // a key outside the patch is untouched

    expect(await E().RunStage.updateMany({ id: made.id }, { $set: { provenance: { origin: "x", zz: 2 } } })).toEqual({ success: true, updated: 1, has_more: false });
    expect((await read("RunStage", made.id)).provenance).toEqual({ origin: "x", zz: 2 });
    await E().RunStage.updateMany({ id: made.id }, { $set: { "provenance.method": "dot" } });
    expect((await read("RunStage", made.id)).provenance).toEqual({ origin: "x", zz: 2, method: "dot" });
    expect(await E().RunStage.updateMany({ id: "no-such-record" }, { $set: { status: "failed" } })).toEqual({ success: true, updated: 0, has_more: false });

    const attempt = await E().RunAttempt.create({ run_id: "probe-run", stage_id: made.id, stage_key: "probe", attempt_number: 1, outcome: "in_flight", claim_state: "unclaimed" });
    await E().RunAttempt.update(attempt.id, { transport: { state: "failed", evidence: "provider_error", message: "m", undeclared: 1 }, model_call: { requested_model: "m", usage: { a: 1, b: { c: 2 } }, zz: 1 } });
    expect(await read("RunAttempt", attempt.id)).toMatchObject({ claim_state: "unclaimed",
      transport: { state: "failed", evidence: "provider_error", message: "m", http_status: null, recorded_at: null },
      model_call: { requested_model: "m", effective_model: null, reasoning_effort: null, max_output_tokens: null, request_id: null, finish_reason: null, usage: { a: 1, b: { c: 2 } } } });
    expect((await read("RunAttempt", attempt.id)).model_call).not.toHaveProperty("zz");
  });

  it("an enumeration is not enforced by any write; a query on null finds a field never set, a query on the empty string does not", async () => {
    const made = await E().RunAttempt.create({ run_id: "probe-run", stage_id: "s", stage_key: "probe", attempt_number: 1, outcome: "zz_not_in_enum" });
    expect((await read("RunAttempt", made.id)).outcome).toBe("zz_not_in_enum");
    await E().RunAttempt.update(made.id, { outcome: "zz_not_in_enum_2" });
    expect((await read("RunAttempt", made.id)).outcome).toBe("zz_not_in_enum_2");
    expect(await E().RunAttempt.filter({ id: made.id, error_message: "" })).toHaveLength(0);
    expect(await E().RunAttempt.filter({ id: made.id, error_message: { $in: ["", null] } })).toHaveLength(1);
    expect(await E().RunAttempt.filter({ id: made.id, error_message: null })).toHaveLength(1);
  });

  it("the store's own timestamps are read back without a zone designator, although they are UTC; the write that made them answers with one", async () => {
    const made = await stage({});
    expect(made.created_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/);
    const kept = await read("RunStage", made.id);
    expect(kept.created_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/);
    expect(kept.updated_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/);
    expect(instantOf(kept.created_date).toISOString()).toBe(instantOf(made.created_date).toISOString()); // the same instant, read correctly either way
  });
});

describe("what the engine writes is what the store keeps", () => {
  it("the nested records the engine relies on are declared and survive", async () => {
    await executeJanus(params("quick"));
    expect(h.db.RunStage.find(s => s.stage_key === "blueprint:assembly").provenance).toMatchObject({ method: "deterministic", origin: "execution", model: null });
    expect(h.db.RunStage.find(s => s.stage_key === "corpus").provenance).toMatchObject({ model: { role: "domain" }, method: null, refines: null, sources: [] });
  });

  it("every field the engine writes — at the top level and inside each declared object — is declared, so none is dropped", async () => {
    // Every write the engine makes in a Full run with a refinement cycle is replayed against the schemas: a key
    // the schema would drop is a key production would lose silently.
    const dropped = [];
    const declared = (schema, value, where) => {
      if (Array.isArray(value)) { if (schema?.items) value.forEach((x, i) => declared(schema.items, x, `${where}[${i}]`)); return; }
      if (!value || typeof value !== "object" || !schema?.properties) return;
      Object.entries(value).forEach(([k, x]) => (k in schema.properties ? declared(schema.properties[k], x, `${where}.${k}`) : dropped.push(`${where}.${k}`)));
    };
    const schemas = Object.fromEntries(["Run", "RunStage", "RunAttempt"].map(name => [name, JSON.parse(readFileSync(`base44/entities/${name}.jsonc`, "utf8"))]));
    const restore = [];
    Object.entries(h.base44.entities).forEach(([name, api]) => ["create", "update"].forEach(op => {
      const real = api[op];
      restore.push(() => { api[op] = real; });
      api[op] = async (...args) => { declared(schemas[name], args[args.length - 1], name); return real(...args); };
    }));
    try {
      const criterion = QUALITY_CRITERIA.find(c => c.method === "critique" && c.hard).id;
      h.llm.verdicts[criterion] = "fail";
      const { runId } = await executeJanus(params("full"));
      await refineJanus(runId);
      // A run from before explicit allocation, so the adoption write is replayed too.
      const earlier = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "",
        model_policy_snapshot: { operational_model: "inherited from the app setting", hidden_fallback_allowed: false } });
      await resumeJanus(earlier.id);
    } finally {
      restore.forEach(undo => undo());
    }
    expect(h.db.RunStage.some(s => s.provenance?.refines)).toBe(true);
    expect(h.db.Run.some(r => r.model_policy_snapshot?.adopted_policy)).toBe(true);
    expect([...new Set(dropped)]).toEqual([]);
  });

  it("a refinement version records the cycle, the base, the evaluation and every finding, so the cycle limit can be read back", async () => {
    const criterion = QUALITY_CRITERIA.find(c => c.method === "critique" && c.hard).id;
    h.llm.verdicts[criterion] = "fail";
    const { runId } = await executeJanus(params("full"));
    // What the engine is about to record, computed before the cycle from the same durable state.
    const view = composeRunView(h.db.Run[0], h.db.RunStage, h.db.RunAttempt);
    const expected = deriveQualification(view).refinement.deficiencies;
    expect(expected.length).toBeGreaterThan(0);
    await refineJanus(runId);
    const refined = h.db.RunStage.filter(s => s.stage_key === "blueprint").pop();
    expect(refined.provenance.refines).toMatchObject({ cycle: 1, blueprint_stage_id: expect.any(String), evaluation_stage_id: expect.any(String) });
    // Stored as written: nothing the engine recorded was dropped. `evidence` is a declared field of a finding that a
    // criterion-derived deficiency does not carry, so the store holds it as null.
    expect(refined.provenance.refines.deficiencies).toEqual(expected.map(d => ({ evidence: null, ...d })));
    expect(deriveQualification(composeRunView(h.db.Run[0], h.db.RunStage, h.db.RunAttempt)).refinement.used).toBe(1); // read back from the stored record
  });
});