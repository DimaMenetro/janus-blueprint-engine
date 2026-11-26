// Phase 7 — versioned re-run and dependency invalidation, plus its first tranche: the evaluation pathway of a
// completed run. Additions only: the inherited test files are the behavioural oracle and are not edited here. (One
// inherited test, in stageEngine.test.js, was replaced under DIMA's explicit authorization; it is marked there.)
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, rerunStages, previewRerun, rerunSynthesis, rerunBlueprint, requestCancel, reconcileJanus, evaluateJanus,
  closeBlockedRevision, STALE_PREVIEW_MESSAGE, INITIATION_LOST_MESSAGE, OPERATOR_ONLY_MESSAGE } from "@/lib/janus/browserAdapter";
import { claimInitiation, beginStage, openAttempt, voidAttempt, settleStage } from "@/lib/janus/stageStore";
import { callLLM } from "@/lib/janus/stageRunner";
import { composeRunView } from "@/lib/janus/runView";
import { deriveExecutionState } from "@/lib/janus/executionState";
import { deriveQualification } from "@/lib/janus/qualification";
import { PAIRS } from "@/lib/janus/protocolRegistry";
import { INTERSECTION_KEYS, intersectionKey } from "@/lib/janus/stageModel";

const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const snapshot = (x) => JSON.parse(JSON.stringify(x));
const everything = () => snapshot({ runs: h.db.Run, stages: h.db.RunStage, attempts: h.db.RunAttempt });
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId), h.db.RunAttempt.filter(a => a.run_id === runId));
const stagesOf = (key) => h.db.RunStage.filter(s => s.stage_key === key);
const stageOf = (key) => stagesOf(key).pop();
const attemptsOf = (key) => h.db.RunAttempt.filter(a => a.stage_key === key);
const modelCalls = (key) => h.llm.stages.filter(s => s === key).length;
const keys = (items) => items.map(i => i.key).sort();
/** Ids of active cognitive revisions that are stale. */
const staleIds = (view) => new Set(Object.values(view.stageInfo).filter(i => i.key !== "qualification" && i.active && i.stale).map(i => i.active.id));
const pairKeys = (pred) => PAIRS.filter(pred).map(p => intersectionKey(p.id));
const reads = (...domains) => (p) => p.domains.some(d => domains.includes(d));

beforeEach(() => h.reset());

describe("versioned re-run: exact dependents, through recorded revision IDs", () => {
  it("graph branching: re-running Animus invalidates exactly what read it, transitively; the preview equals the actual invalidation", async () => {
    const { runId } = await executeJanus(params("full"));
    const before = viewOf(runId);
    const records = snapshot(h.db.RunStage);
    expect(before.run.released_blueprint_stage_id).toBe(before.stageInfo.blueprint.active.id);

    const impact = await previewRerun(runId, { targets: ["animus"] });
    expect(impact.refusals).toEqual([]);
    expect(impact.plan).toEqual(["animus"]);
    // Actus reads Animus; every pair reading Animus or Actus; the patterns read the pairs; the Blueprint reads all.
    expect(keys(impact.invalidated)).toEqual(["actus", ...pairKeys(reads("animus", "actus")), "synthesis", "blueprint"].sort());
    expect(keys(impact.unaffected)).toEqual(["refresh", "corpus", "cogito", ...pairKeys(p => !reads("animus", "actus")(p))].sort());
    expect(impact.supersedes).toEqual([expect.objectContaining({ key: "animus", revision: "r1" })]);
    expect(impact.qualification).toEqual({ next: "blocked", evaluationInvalidated: true, releaseWithdrawn: true });
    expect(everything().stages).toEqual(records); // a preview writes nothing

    h.llm.stages.length = 0;
    const result = await rerunStages(runId, { targets: ["animus"], expected: impact.token });
    expect(result.success).toBe(true);
    expect(h.llm.stages).toEqual(["animus"]); // a stale Blueprint is not evaluated

    const after = viewOf(runId);
    const newlyStale = [...staleIds(after)].filter(id => !staleIds(before).has(id)).sort();
    expect(newlyStale).toEqual(impact.invalidated.map(i => i.id).sort());
    impact.unaffected.forEach(u => expect(after.stageInfo[u.key]).toMatchObject({ active: expect.objectContaining({ id: u.id }), stale: null }));
    records.forEach(r => expect(h.db.RunStage.find(s => s.id === r.id)).toEqual(r)); // no destructive overwrite
    expect(after.lineage.find(s => s.id === impact.supersedes[0].id)).toMatchObject({ lineage_state: "superseded", revision: 1, output: h.out.animus });
    expect(after.stageInfo.animus.active).toMatchObject({ revision: 2, provenance: expect.objectContaining({ origin: "rerun" }) });
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "not_started", released_blueprint_stage_id: "", graph_epoch: 1 });
    expect(deriveQualification(after).blocked).toMatch(/stale/);
  });

  it("cascade: re-running Cogito regenerates exactly its dependents, reuses everything else, and the new Blueprint is evaluated afresh", async () => {
    const { runId } = await executeJanus(params("full"));
    const impact = await previewRerun(runId, { targets: ["cogito"], cascade: true });
    expect(impact.plan).toEqual(["cogito", "animus", "actus", ...INTERSECTION_KEYS, "synthesis", "blueprint"]);
    expect(impact.invalidated).toEqual([]);
    expect(keys(impact.unaffected)).toEqual(["corpus", "refresh"]);
    expect(impact.qualification).toEqual({ next: "re_evaluated", evaluationInvalidated: true, releaseWithdrawn: true });

    h.llm.stages.length = 0;
    await rerunStages(runId, { targets: ["cogito"], cascade: true, expected: impact.token });
    expect(h.llm.stages).toEqual([...impact.plan, "qualification"]);
    const after = viewOf(runId);
    expect(staleIds(after).size).toBe(0);
    impact.plan.forEach(k => expect(after.stageInfo[k].active.revision).toBe(2));
    ["refresh", "corpus"].forEach(k => expect(after.stageInfo[k].active.revision).toBe(1));
    expect(after.stageInfo.animus.active.depends_on).toEqual(expect.arrayContaining([after.stageInfo.cogito.active.id, after.stageInfo.corpus.active.id]));
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified", released_blueprint_stage_id: after.stageInfo.blueprint.active.id });
  });

  it("a failed new revision invalidates nothing: the current one stays active, no dependent is regenerated, the release stands", async () => {
    const { runId } = await executeJanus(params("full"));
    const released = h.db.Run[0].released_blueprint_stage_id;
    const before = staleIds(viewOf(runId));
    const impact = await previewRerun(runId, { targets: ["cogito"], cascade: true });
    h.llm.invalidOn = "cogito";
    h.llm.stages.length = 0;
    const result = await rerunStages(runId, { targets: ["cogito"], cascade: true, expected: impact.token });
    expect(result.success).toBe(false);
    expect(h.llm.stages).toEqual(["cogito", "cogito", "cogito"]); // its own bounded attempts, nothing downstream, no re-evaluation
    const after = viewOf(runId);
    expect(staleIds(after)).toEqual(before);
    expect(after.stageInfo.cogito).toMatchObject({ active: expect.objectContaining({ revision: 1 }), latest: expect.objectContaining({ revision: 2, status: "failed" }) });
    expect(h.db.Run[0]).toMatchObject({ qualification_state: "qualified", released_blueprint_stage_id: released });
  });

  it("an input a revision was compiled without counts too: a Blueprint built while Cogito had failed is invalidated by Cogito's new revision", async () => {
    h.llm.failOn = "cogito";
    const { runId } = await executeJanus(params("quick"));
    h.llm.failOn = null;
    expect(h.db.Run[0].status).toBe("partial");
    expect(stageOf("blueprint").depends_on).toEqual([stageOf("corpus").id]);

    const impact = await previewRerun(runId, { targets: ["cogito"] });
    expect(impact.supersedes).toEqual([]); // there is no valid Cogito revision to supersede
    expect(impact.invalidated).toEqual([expect.objectContaining({ key: "blueprint", revision: "r1" })]);
    await rerunStages(runId, { targets: ["cogito"], expected: impact.token });
    const view = viewOf(runId);
    expect(view.stageInfo.blueprint.stale).toMatch(/^cogito r2 was produced after this revision was compiled without it/);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", released_blueprint_stage_id: "" });
    expect(deriveQualification(view).blocked).toMatch(/stale/);
    expect(modelCalls("qualification")).toBe(0); // never evaluated a Blueprint that did not see Cogito

    const cascade = await previewRerun(runId, { targets: ["blueprint"] });
    await rerunStages(runId, { targets: ["blueprint"], expected: cascade.token });
    expect(viewOf(runId).stageInfo.blueprint.active.depends_on).toContain(viewOf(runId).stageInfo.cogito.active.id);
    expect(h.db.Run[0]).toMatchObject({ qualification_state: "qualified" });
  });

  it("synthesis re-run (the existing control) previews and invalidates through the same computation", async () => {
    const { runId } = await executeJanus(params("full"));
    const before = viewOf(runId);
    const impact = await previewRerun(runId, { targets: [...INTERSECTION_KEYS, "synthesis"] });
    expect(keys(impact.invalidated)).toEqual(["blueprint"]);
    await rerunSynthesis(runId);
    expect([...staleIds(viewOf(runId))].filter(id => !staleIds(before).has(id))).toEqual([before.stageInfo.blueprint.active.id]);
  });
});

describe("re-run safety: stale previews, concurrency, unresolved calls, cancellation, containment", () => {
  it("a preview whose state changed is not executed: nothing is written", async () => {
    const { runId } = await executeJanus(params("full"));
    const impact = await previewRerun(runId, { targets: ["animus"] });
    await rerunBlueprint(runId); // the run changes after the preview
    const before = everything();
    await expect(rerunStages(runId, { targets: ["animus"], expected: impact.token })).rejects.toThrow(STALE_PREVIEW_MESSAGE);
    expect(everything()).toEqual(before);
  });

  it("two initiations from the same state: exactly one proceeds", async () => {
    const { runId } = await executeJanus(params("full"));
    const impact = await previewRerun(runId, { targets: ["blueprint"] });
    const outcomes = await Promise.allSettled([1, 2].map(() => rerunStages(runId, { targets: ["blueprint"], expected: impact.token })));
    expect(outcomes.filter(o => o.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.find(o => o.status === "rejected").reason.message).toMatch(/started first|already being executed/);
    expect(stagesOf("blueprint").map(s => s.revision)).toEqual([1, 2]);
    expect(h.db.Run[0].graph_epoch).toBe(1);
    // Another tab holding the same preview afterwards is refused as stale.
    await expect(rerunStages(runId, { targets: ["blueprint"], expected: impact.token })).rejects.toThrow(STALE_PREVIEW_MESSAGE);
  });

  it("the initiation claim is one conditional write: of two concurrent claims from one epoch, exactly one takes it", async () => {
    const { runId } = await executeJanus(params("quick"));
    const claims = await Promise.all([1, 2].map(() => claimInitiation(runId, { epoch: 0, status: "completed" })));
    expect(claims.sort()).toEqual([false, true]);
    expect(h.db.Run[0].graph_epoch).toBe(1);
    expect(INITIATION_LOST_MESSAGE).toMatch(/Nothing was started/);
  });

  it("an interrupted re-run leaves the call unresolved: nothing is invalidated, nothing starts beside it, and it resolves from the record", async () => {
    const { runId } = await executeJanus(params("full"));
    const before = staleIds(viewOf(runId));
    h.llm.transport.blueprint = "late";
    const result = await rerunBlueprint(runId);
    h.llm.transport = {};
    expect(result.unresolved).toBe("blueprint");
    expect(staleIds(viewOf(runId))).toEqual(before);
    expect((await previewRerun(runId, { targets: ["animus"] })).refusals).toEqual(["a call for blueprint has not settled and its outcome is unknown"]);
    await expect(rerunStages(runId, { targets: ["animus"] })).rejects.toThrow(/has not settled/);

    await h.finishPending();
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(viewOf(runId).stageInfo.blueprint.active.revision).toBe(2);
  });

  it("a re-run never overrides a cancellation request", async () => {
    const { runId } = await executeJanus(params("quick"));
    h.db.Run[0].status = "cancel_requested"; // persisted by another session
    const before = everything();
    await expect(rerunStages(runId, { targets: ["blueprint"] })).rejects.toThrow(/cancellation was requested/);
    expect(everything()).toEqual(before);
    await requestCancel(runId);
  });

  it("only stages of the run's plan can be re-run, and the evaluation has its own pathway", async () => {
    const { runId } = await executeJanus(params("quick"));
    expect((await previewRerun(runId, { targets: ["animus"] })).refusals).toEqual(["animus is not a stage of this run's quick plan"]);
    expect((await previewRerun(runId, { targets: ["qualification"] })).refusals[0]).toMatch(/evaluation controls/);
    expect((await previewRerun(runId, { targets: [] })).refusals).toEqual(["choose at least one stage"]);
  });

  it("a non-operator cannot re-run, and nothing is written", async () => {
    const { runId } = await executeJanus(params("quick"));
    h.session.user = { id: "user-2", role: "user" };
    const before = everything();
    await expect(rerunStages(runId, { targets: ["blueprint"] })).rejects.toThrow(OPERATOR_ONLY_MESSAGE);
    await expect(evaluateJanus(runId)).rejects.toThrow(/already has its evaluation/);
    expect(everything()).toEqual(before);
  });

  it("a historical Run is never written: its re-run adds revisions beside it, as before", async () => {
    const legacy = { id: "legacy-7", query_text: "q", execution_mode: "full", output_mode: "Blueprint", status: "completed",
      corpus: h.out.corpus, cogito: h.out.cogito, animus: h.out.animus, actus: h.out.actus };
    h.db.Run.push(snapshot(legacy));
    const impact = await previewRerun("legacy-7", { targets: ["blueprint"] });
    expect(impact.refusals).toEqual([]);
    await rerunBlueprint("legacy-7");
    expect(h.db.Run[0]).toEqual(legacy);
    const blueprint = viewOf("legacy-7").stageInfo.blueprint.active;
    expect(blueprint).toMatchObject({ revision: 1, status: "succeeded", depends_on: expect.arrayContaining(["legacy:corpus", "legacy:actus"]) });
    expect(blueprint.legacy).toBeUndefined(); // a real revision beside the historical artifacts
  });
});

describe("Resume is continuity, retry is the same revision, only a re-run makes a new revision", () => {
  const cogito = () => stagesOf("cogito").map(s => [s.revision, s.status, s.error_class, s.provenance?.origin]);
  /** An open Quick run whose session vanished during Cogito's last allowed call, which then failed on the server. */
  const interruptedAtLastCall = async (message) => {
    h.llm.failOn = "cogito";
    if (message) h.llm.failMessage = message;
    h.llm.transport.cogito = message ? "late" : [null, null, "late"];
    const { runId } = await executeJanus(params("quick"));
    h.llm.transport = {};
    await h.finishPending();
    h.llm.failOn = null;
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null }); // recovery settles; it creates nothing
    return runId;
  };

  it.each([
    ["an exhausted revision", undefined, "provider_error", 3],
    ["a non-retryable failure", "Integration credits quota exceeded", "quota_failure", 1],
  ])("Resume after %s creates no new revision and buys no call for that stage, however often it is asked", async (_name, message, evidence, calls) => {
    const runId = await interruptedAtLastCall(message);
    expect(cogito()).toEqual([[1, "failed", evidence, "execution"]]);
    const state = deriveExecutionState(viewOf(runId));
    expect(state).toMatchObject({ status: "interrupted", resumable: true, next: { key: "blueprint" } });
    expect(state.failures).toEqual([expect.objectContaining({ key: "cogito", rerunOnly: true, attempts: calls })]);

    const result = await resumeJanus(runId);
    expect(result.status).toBe("partial");
    expect(cogito()).toEqual([[1, "failed", evidence, "execution"]]);
    expect(modelCalls("cogito")).toBe(calls);
    expect(attemptsOf("cogito")).toHaveLength(calls);
    expect(modelCalls("blueprint")).toBe(1); // the unfinished part of the plan did run
    await expect(resumeJanus(runId)).rejects.toThrow(/has ended/);
    expect(modelCalls("cogito")).toBe(calls);
  });

  it("an open run whose only unfinished stage failed for good is closed by Resume without any call", async () => {
    h.llm.failOn = "blueprint";
    h.llm.transport.blueprint = [null, null, "late"];
    const { runId } = await executeJanus(params("quick"));
    h.llm.transport = {};
    await h.finishPending();
    await reconcileJanus(runId);
    h.llm.failOn = null;
    expect(h.db.Run[0].status).toBe("running");
    const calls = h.llm.stages.length;
    expect((await resumeJanus(runId)).status).toBe("partial");
    expect(h.llm.stages.length).toBe(calls);
    expect(stagesOf("blueprint").map(s => [s.revision, s.status])).toEqual([[1, "failed"]]);
  });

  it("the explicit re-run is what replaces it: revision n+1, the failed revision kept, dependents rebuilt from the new revision", async () => {
    const runId = await interruptedAtLastCall();
    // Regeneration follows continuity: while the run is still open, the re-run is refused and nothing is written.
    const before = everything();
    expect((await previewRerun(runId, { targets: ["cogito"] })).refusals).toEqual([expect.stringMatching(/has not finished\. Resume it first/)]);
    await expect(rerunStages(runId, { targets: ["cogito"] })).rejects.toThrow(/Resume it first/);
    expect(everything()).toEqual(before);

    await resumeJanus(runId);
    const failed = snapshot(stageOf("cogito"));
    const impact = await previewRerun(runId, { targets: ["cogito"], cascade: true });
    expect(impact.plan).toEqual(["cogito", "blueprint"]);
    await rerunStages(runId, { targets: ["cogito"], cascade: true, expected: impact.token });
    expect(cogito()).toEqual([[1, "failed", "provider_error", "execution"], [2, "succeeded", undefined, "rerun"]]);
    expect(h.db.RunStage.find(s => s.id === failed.id)).toEqual(failed); // the failed revision is preserved as it was
    expect(attemptsOf("cogito").filter(a => a.stage_id === stageOf("cogito").id)).toHaveLength(1); // its own attempts, its own limit
    const view = viewOf(runId);
    expect(view.stageInfo.blueprint.active).toMatchObject({ revision: 2, depends_on: expect.arrayContaining([view.stageInfo.cogito.active.id]) });
    expect(staleIds(view).size).toBe(0);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified" });
  });

  it("a second session cannot create a conflicting active revision: its call is refused, and the one valid revision stays active", async () => {
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "" });
    for (const key of ["corpus", "cogito"]) await h.base44.entities.RunStage.create({ run_id: run.id, stage_key: key, revision: 1, status: "succeeded", depends_on: [], output: h.out[key] });
    const gate = h.gateOn("blueprint");
    const pending = resumeJanus(run.id);
    await gate.reached;
    // Another tab, with no shared memory, read the same state and begins the same revision number.
    const rival = await beginStage({ runId: run.id, stageKey: "blueprint", revision: 1, dependsOn: [], templateVersion: "t", prompt: "STAGE KEY: blueprint", origin: "resume" });
    const attempt = await openAttempt(rival, 1);
    const refused = await callLLM(rival.id, "STAGE KEY: blueprint").then(() => null, e => e);
    expect(refused).toMatchObject({ evidence: "not_started", reason: "run_busy" });
    expect(await voidAttempt(attempt.id, { settledBy: "session" })).toBe(true); // what that tab then does: no call was made
    await settleStage(rival, { notStarted: "blueprint: no model call was made for this revision" });
    gate.release();
    expect((await pending).status).toBe("completed");

    expect(modelCalls("blueprint")).toBe(1);
    const succeeded = stagesOf("blueprint").filter(s => s.status === "succeeded");
    expect(succeeded).toHaveLength(1);
    const view = viewOf(run.id);
    expect(view.stageInfo.blueprint.active.id).toBe(succeeded[0].id);
    expect(stageOf("qualification").depends_on).toContain(succeeded[0].id);
    expect(stageOf("qualification").depends_on).not.toContain(rival.id);
    expect(h.db.Run[0].released_blueprint_stage_id).toBe(succeeded[0].id);
  });
});

describe("the evaluation pathway of a completed run (Phase 7, first tranche)", () => {
  const qualStages = () => stagesOf("qualification");
  const ledger = () => attemptsOf("qualification").map(a => [a.attempt_number, a.outcome, a.retry_decision]);
  /** A completed Quick run whose evaluation revision 1 waits for attempt 2: the request for attempt 2 never arrived. */
  const waitingEvaluation = async () => {
    h.llm.failTimes.qualification = 1;
    h.llm.transport.qualification = [null, "unreached"];
    const { runId } = await executeJanus(params("quick"));
    h.llm.transport = {};
    return { runId, stageId: stageOf("qualification").id };
  };

  it("a retry that could not start keeps the same revision waiting on the completed run; only the pathway continues it", async () => {
    const { runId, stageId } = await waitingEvaluation();
    expect(h.db.Run[0]).toMatchObject({ status: "completed", released_blueprint_stage_id: "" });
    expect(qualStages()).toEqual([expect.objectContaining({ id: stageId, revision: 1, status: "running" })]);
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled"], [2, "not_started", "none"]]);
    expect(deriveQualification(viewOf(runId))).toMatchObject({ evaluationAction: "continue", pending: "awaiting_retry", needsEvaluation: false, evaluationRetry: { nextAttempt: 2, revision: 1 } });
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ status: "completed", resumable: false, qualificationAwaiting: { nextAttempt: 2 } });

    await expect(evaluateJanus(runId, { newVersion: true })).rejects.toThrow(/not reset/);
    const out = await evaluateJanus(runId);
    expect(out).toMatchObject({ action: "continue", status: "completed", qualification: "qualified", blocked: null });
    expect(qualStages()).toEqual([expect.objectContaining({ id: stageId, revision: 1, status: "succeeded" })]);
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled"], [2, "not_started", "none"], [2, "succeeded", "none"]]);
    const prompts = h.llm.prompts.filter((_, i) => h.llm.stages[i] === "qualification");
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toBe(prompts[0]);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", released_blueprint_stage_id: stageOf("blueprint").id });
  });

  it("interruptions never reset the limit: three recovered failures exhaust the revision; only an explicit new version evaluates again", async () => {
    h.llm.failOn = "qualification";
    h.llm.transport.qualification = "late";
    const { runId } = await executeJanus(params("quick"));
    h.llm.transport = {};
    await h.finishPending();
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "qualification", nextAttempt: 2 } });
    for (const next of [3, null]) {
      h.llm.transport.qualification = "late";
      expect((await evaluateJanus(runId)).unresolved).toBe("qualification");
      h.llm.transport = {};
      await h.finishPending();
      expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null, ...(next ? { awaiting: { stageKey: "qualification", nextAttempt: next } } : {}) });
    }
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled"], [2, "provider_error", "retry_scheduled"], [3, "provider_error", "exhausted"]]);
    expect(qualStages()).toEqual([expect.objectContaining({ revision: 1, status: "failed" })]);
    expect(modelCalls("qualification")).toBe(3);
    expect(deriveQualification(viewOf(runId))).toMatchObject({ evaluationAction: "new_version", needsEvaluation: false });
    await expect(evaluateJanus(runId)).rejects.toThrow(/needs your explicit decision/);
    expect(modelCalls("qualification")).toBe(3);

    h.llm.failOn = null;
    await evaluateJanus(runId, { newVersion: true });
    expect(qualStages().map(s => [s.revision, s.status, s.provenance.origin])).toEqual([[1, "failed", "execution"], [2, "succeeded", "rerun"]]);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified" });
  });

  it("no hidden retry: after an exhausted evaluation, a later operation that leaves the Blueprint unchanged starts no evaluation", async () => {
    h.llm.failOn = "qualification";
    const { runId } = await executeJanus(params("full"));
    h.llm.failOn = null;
    expect(modelCalls("qualification")).toBe(3);
    h.llm.invalidOn = "blueprint";
    await rerunBlueprint(runId); // its new revision fails: the evaluated Blueprint stays active
    h.llm.invalidOn = null;
    expect(modelCalls("qualification")).toBe(3);
    expect(deriveQualification(viewOf(runId))).toMatchObject({ evaluationAction: "new_version", pending: "evaluation_failed" });
  });

  it("an evaluation that is no longer the same operation is not continued: nothing is written until the operator closes it", async () => {
    const { runId, stageId } = await waitingEvaluation();
    stageOf("qualification").prompt_template_version = "stage-compiler/earlier";
    const before = everything();
    const out = await evaluateJanus(runId);
    expect(out.blocked).toMatchObject({ stageKey: "qualification", revision: 1, nextAttempt: 2, reasons: [expect.stringMatching(/prompt template changed/)] });
    expect(everything()).toEqual(before);
    expect(await closeBlockedRevision(runId)).toEqual({ closed: "qualification", revision: 1 });
    expect(h.db.RunStage.find(s => s.id === stageId)).toMatchObject({ status: "failed" });
    await expect(evaluateJanus(runId)).rejects.toThrow(/explicit decision/);
    await evaluateJanus(runId, { newVersion: true });
    expect(qualStages().map(s => [s.revision, s.status])).toEqual([[1, "failed"], [2, "succeeded"]]);
  });

  it("an evaluation call with no recorded outcome stays unresolved: nothing is started beside it", async () => {
    h.llm.transport.qualification = "lost";
    const { runId } = await executeJanus(params("quick"));
    h.llm.transport = {};
    const before = everything();
    await expect(evaluateJanus(runId)).rejects.toThrow(/has not settled/);
    await expect(evaluateJanus(runId, { newVersion: true })).rejects.toThrow(/has not settled/);
    expect(everything()).toEqual(before);
    expect(modelCalls("qualification")).toBe(0);
  });

  it("the pathway respects the qualification gate: no evaluation for an incomplete run or a stale Blueprint, none twice", async () => {
    const { runId } = await executeJanus(params("full"));
    await expect(evaluateJanus(runId)).rejects.toThrow(/already has its evaluation/);
    await rerunSynthesis(runId);
    await expect(evaluateJanus(runId)).rejects.toThrow(/stale/);
    h.reset();
    h.llm.failOn = "cogito";
    const partial = await executeJanus(params("quick"));
    await expect(evaluateJanus(partial.runId)).rejects.toThrow(/not protocol-complete|only once the run has completed/);
  });

  it("two continuations from the same state: exactly one makes the call", async () => {
    const { runId } = await waitingEvaluation();
    const outcomes = await Promise.allSettled([1, 2].map(() => evaluateJanus(runId)));
    expect(outcomes.filter(o => o.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.find(o => o.status === "rejected").reason.message).toMatch(/started first|already being executed/);
    expect(modelCalls("qualification")).toBe(2);
    expect(h.db.Run[0].qualification_state).toBe("qualified");
  });

  it("the run's lifecycle is never touched: it stays completed, and a completed run is not cancellable", async () => {
    const { runId, stageId } = await waitingEvaluation();
    await requestCancel(runId);
    expect(h.db.Run[0].status).toBe("completed");
    expect(h.db.RunStage.find(s => s.id === stageId).status).toBe("running");
    await evaluateJanus(runId);
    expect(h.db.Run[0].status).toBe("completed");
  });
});