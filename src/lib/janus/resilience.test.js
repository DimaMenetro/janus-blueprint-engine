// Phase 6 — failure, retry, cancellation and ownership semantics.
// These tests are additions. The six inherited test files are the behavioural oracle and are not edited here.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, requestCancel, reconcileJanus, rerunBlueprint, closeBlockedRevision } from "@/lib/janus/browserAdapter";
import { callLLM, continueStage } from "@/lib/janus/stageRunner";
import { beginStage, openAttempt, settleAttempt } from "@/lib/janus/stageStore";
import { composeRunView } from "@/lib/janus/runView";
import { deriveExecutionState } from "@/lib/janus/executionState";
import { RETRY_POLICY, FAILURE_EVIDENCE, retryDecision } from "@/lib/janus/lifecycleContract";

const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const attemptsOf = (key) => h.db.RunAttempt.filter(a => a.stage_key === key);
const stageOf = (key) => h.db.RunStage.filter(s => s.stage_key === key).pop();
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId), h.db.RunAttempt.filter(a => a.run_id === runId));
const modelCalls = (key) => h.llm.stages.filter(s => s === key).length; // calls that actually reached the model
const slot = () => h.db.Run[0].active_attempt_id;
const snapshot = (rec) => JSON.parse(JSON.stringify(rec));
const MAX = RETRY_POLICY.max_attempts_per_stage;
const read = (p) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

/** A Quick run whose request for `key` meets a transport fault (see testPlatform). */
const during = async (key, fault) => {
  h.llm.transport[key] = fault;
  const result = await executeJanus(params("quick"));
  h.llm.transport = {};
  return result;
};
/** The records a session leaves when it vanishes right after starting the revision for `key`: corpus saved, `key` running. */
const leftBehind = async (key = "cogito", runFields = {}) => {
  const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "", ...runFields });
  await h.base44.entities.RunStage.create({ run_id: run.id, stage_key: "corpus", revision: 1, status: "succeeded", depends_on: [], output: h.out.corpus });
  const stage = await beginStage({ runId: run.id, stageKey: key, revision: 1, dependsOn: [], templateVersion: "t", prompt: `STAGE KEY: ${key}`, origin: "execution" });
  return { runId: run.id, stage };
};
/** A request for the stage's open attempt, as a session sends it. */
const send = (stage) => callLLM(stage.id, `STAGE KEY: ${stage.stage_key}`);
const refusedWith = async (promise) => { const err = await promise.then(() => null, e => e); return err && { evidence: err.evidence, reason: err.reason }; };

beforeEach(() => h.reset());
afterEach(() => vi.useRealTimers());

describe("settled-failure classification", () => {
  it("the retry policy is decided from the settled outcome alone", () => {
    expect(RETRY_POLICY.retryable.map(e => retryDecision(e, 1))).toEqual(RETRY_POLICY.retryable.map(() => "retry_scheduled"));
    expect(RETRY_POLICY.retryable.map(e => retryDecision(e, MAX))).toEqual(RETRY_POLICY.retryable.map(() => "exhausted"));
    const terminal = FAILURE_EVIDENCE.filter(e => !RETRY_POLICY.retryable.includes(e));
    // DAIONAE'S REVIEW 2026-11-27: `output_truncated` joins the evidence that is never retried — the provider stopped at
    // the output limit, and the same request is cut off again (lifecycleContract.OUTPUT_TRUNCATED). The three classes
    // this assertion always listed are unchanged, as is what it asserts: retry is decided from the settled outcome alone.
    expect(terminal).toEqual(["platform_termination", "quota_failure", "operator_cancellation", "output_truncated"]);
    [...terminal, "succeeded", "not_started"].forEach(e => expect(retryDecision(e, 1)).toBe("none"));
  });

  it("the function classifies a failed call, records it, and that record is the attempt's outcome", async () => {
    h.llm.failOn = "corpus";
    await executeJanus(params("quick"));
    expect(attemptsOf("corpus")[0]).toMatchObject({ outcome: "provider_error", claim_state: "claimed", settled_by: "session",
      transport: { state: "failed", evidence: "provider_error", message: "provider returned 500" } });
    expect(stageOf("corpus")).toMatchObject({ status: "failed", error_class: "provider_error" });
  });

  it("the app never names a call-failure class itself: a class reaches an attempt only from the function", () => {
    const appSide = ["src/lib/janus/stageRunner.js", "src/lib/janus/stageStore.js", "src/lib/janus/stageEngine.js", "src/lib/janus/browserAdapter.js", "src/lib/janus/stageModel.js"];
    appSide.forEach(f => expect(read(f)).not.toMatch(/provider_error|transport_settled_failure|platform_termination|quota_failure|operator_cancellation/));
    // The function assigns only what it can see: the integration's own error. It has no evidence of termination and claims none.
    expect(read("base44/functions/invokeJanusStage/entry.ts")).not.toMatch(/platform_termination|transport_settled_failure/);
  });
});

describe("an unknown outcome is unresolved, never a failure", () => {
  it.each([
    ["the session gets no response at all", "lost"],
    ["the platform answers the request with an HTTP error", "http"],
  ])("attempt claimed, nothing recorded, and %s: unresolved — no failure, no retry, no replacement, slot kept", async (_name, fault) => {
    const result = await during("cogito", fault);
    expect(result).toMatchObject({ unresolved: "cogito", status: "running" });
    expect(attemptsOf("cogito")).toHaveLength(1); // no retry, no replacement attempt
    expect(attemptsOf("cogito")[0]).toMatchObject({ outcome: "in_flight", claim_state: "claimed", retry_decision: "none" });
    expect(attemptsOf("cogito")[0].transport).toBeNull(); // STORE-FIDELITY 2026-11-27: null is what the store holds for a field never written (was toBeUndefined)
    expect(stageOf("cogito").status).toBe("running"); // the stage is not settled
    expect(stageOf("cogito").error_class).toBeNull(); // and no failure evidence was made up — STORE-FIDELITY 2026-11-27 (was toBeUndefined)
    expect(h.db.RunStage.some(s => s.status === "failed")).toBe(false);
    expect(slot()).toBe(attemptsOf("cogito")[0].id); // the run's execution slot stays occupied
    expect(modelCalls("blueprint")).toBe(0); // nothing further was scheduled
    expect(deriveExecutionState(viewOf(result.runId))).toMatchObject({ status: "unresolved", resumable: false, failures: [] });
  });

  it.each([
    ["the request never reaches the platform", "unreached"],
    ["the platform rejects the request before the function runs", "rejected"],
  ])("attempt never claimed because %s: closed atomically — no call was made, and no failure is invented", async (_name, fault) => {
    const result = await during("cogito", fault);
    expect(result).toMatchObject({ status: "running", unresolved: null, refused: { stageKey: "cogito", reason: "never_claimed" } });
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ claim_state: "void", outcome: "not_started", settled_by: "session" })]);
    expect(stageOf("cogito")).toMatchObject({ status: "cancelled", error_class: "not_started" });
    expect(modelCalls("cogito")).toBe(0);
    expect(slot()).toBe("");
    expect(deriveExecutionState(viewOf(result.runId))).toMatchObject({ status: "interrupted", resumable: true, failures: [] });
    expect((await resumeJanus(result.runId)).status).toBe("completed"); // the run was left open, not closed on a stage that never ran
    expect(stageOf("cogito")).toMatchObject({ revision: 2, status: "succeeded" });
  });

  it("a response that is lost after the function recorded the outcome is settled from that record, not repeated", async () => {
    const result = await during("cogito", "drop");
    expect(result.status).toBe("completed");
    expect(modelCalls("cogito")).toBe(1);
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "succeeded", settled_by: "session", transport: expect.objectContaining({ state: "returned" }) })]);
  });

  it("a termination class settles an attempt only when it is on the function's record", async () => {
    const { runId, stage } = await leftBehind();
    await openAttempt(stage, 1);
    h.llm.transport.cogito = "lost";
    await send(stage).catch(() => {});
    expect(await reconcileJanus(runId)).toEqual({ settled: false, unresolved: "cogito" }); // claimed, no record: unresolved

    // Affirmative evidence, written by the server side: the execution was terminated.
    Object.assign(h.db.RunAttempt[0], { transport: { state: "failed", evidence: "platform_termination", message: "execution terminated by the platform", recorded_at: new Date().toISOString() } });
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(h.db.RunAttempt[0]).toMatchObject({ outcome: "platform_termination", retry_decision: "none", settled_by: "recovery" });
    expect(stageOf("cogito")).toMatchObject({ status: "failed", error_class: "platform_termination" });
    expect(modelCalls("cogito")).toBe(0);
  });
});

describe("bounded retry, only after settlement", () => {
  it("a retryable failure is retried after it settles, and the recovery is recorded attempt by attempt", async () => {
    h.llm.failTimes.cogito = 2;
    const result = await executeJanus(params("quick"));
    expect(result.status).toBe("completed");
    const attempts = attemptsOf("cogito");
    expect(attempts.map(a => [a.attempt_number, a.outcome, a.retry_decision])).toEqual([
      [1, "provider_error", "retry_scheduled"], [2, "provider_error", "retry_scheduled"], [3, "succeeded", "none"]]);
    expect(new Set(attempts.map(a => a.stage_id)).size).toBe(1); // one revision, three attempts
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "succeeded" });
    attempts.slice(1).forEach((a, i) => expect(Date.parse(a.started_at)).toBeGreaterThanOrEqual(Date.parse(attempts[i].ended_at)));
    attempts.forEach(a => expect(a.elapsed_ms).toBeGreaterThanOrEqual(0));
  });

  it("invalid output is retried too, and the bound holds: the revision fails once, after the last attempt", async () => {
    h.llm.invalidOn = "corpus";
    await executeJanus(params("quick"));
    expect(attemptsOf("corpus").map(a => [a.outcome, a.retry_decision])).toEqual([
      ["schema_failure", "retry_scheduled"], ["schema_failure", "retry_scheduled"], ["schema_failure", "exhausted"]]);
    expect(modelCalls("corpus")).toBe(MAX);
    expect(stageOf("corpus")).toMatchObject({ status: "failed", error_class: "schema_failure" });
    expect(stageOf("corpus").error_message).toMatch(/\(after 3 attempts\)$/);
    expect(deriveExecutionState(viewOf(h.db.Run[0].id)).failures[0]).toMatchObject({ key: "corpus", attempts: 3 });
  });

  it("a quota failure is settled as such and is not retried", async () => {
    h.llm.failOn = "cogito"; h.llm.failMessage = "Integration credits quota exceeded";
    await executeJanus(params("quick"));
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "quota_failure", retry_decision: "none" })]);
    expect(modelCalls("cogito")).toBe(1);
    expect(stageOf("cogito")).toMatchObject({ status: "failed", error_class: "quota_failure" });
    expect(viewOf(h.db.Run[0].id).artifacts.corpus).toEqual(h.out.corpus); // the earlier artifact is intact
  });

  it("a retry that never started changes nothing: the earlier outcome stands, no budget is used, and the same revision waits for it", async () => {
    h.llm.failTimes.cogito = 1;
    h.llm.transport.cogito = [null, "unreached"]; // attempt 1 fails for real; the request for attempt 2 never arrives
    const result = await executeJanus(params("quick"));
    expect(attemptsOf("cogito").map(a => [a.attempt_number, a.outcome, a.claim_state])).toEqual([[1, "provider_error", "claimed"], [2, "not_started", "void"]]);
    expect(modelCalls("cogito")).toBe(1);
    // No outcome is invented for the retry that never ran, and the revision is not closed with budget left.
    expect(result).toMatchObject({ status: "running", refused: { stageKey: "cogito", reason: "never_claimed" } });
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "running" });
    expect(stageOf("cogito").error_class).toBeNull(); // STORE-FIDELITY 2026-11-27: null is what the store holds for a field never written (was toBeUndefined)
    expect(deriveExecutionState(viewOf(result.runId))).toMatchObject({ status: "interrupted", resumable: true, failures: [], awaiting: { key: "cogito", nextAttempt: 2 } });

    const stageId = stageOf("cogito").id;
    expect((await resumeJanus(result.runId)).status).toBe("completed");
    expect(h.db.RunStage.filter(s => s.stage_key === "cogito")).toEqual([expect.objectContaining({ id: stageId, revision: 1, status: "succeeded" })]);
    expect(attemptsOf("cogito").map(a => [a.attempt_number, a.outcome])).toEqual([[1, "provider_error"], [2, "not_started"], [2, "succeeded"]]);
    expect(modelCalls("cogito")).toBe(2);
  });
});

describe("ownership: one live call per run, one call per attempt", () => {
  it("attempts never overlap, and a run cannot own two calls at once", async () => {
    const gate = h.gateOn("cogito");
    h.llm.failTimes.cogito = 1;
    const pending = executeJanus(params("quick"));
    await gate.reached;
    const live = attemptsOf("cogito");
    expect(live).toHaveLength(1); // no retry attempt exists while the first is in flight
    expect(slot()).toBe(live[0].id);

    // A second request for the same stage (another tab, with no shared memory): its one open attempt is taken.
    expect(await refusedWith(send(stageOf("cogito")))).toEqual({ evidence: "not_started", reason: "attempt_claimed" });
    // A different stage of the same run, with its own fresh attempt: the run's slot is taken.
    const other = await beginStage({ runId: h.db.Run[0].id, stageKey: "blueprint", revision: 1, dependsOn: [], templateVersion: "t", prompt: "STAGE KEY: blueprint", origin: "execution" });
    const rival = await openAttempt(other, 1);
    expect(await refusedWith(send(other))).toEqual({ evidence: "not_started", reason: "run_busy" });
    expect(h.db.RunAttempt.find(a => a.id === rival.id)).toMatchObject({ claim_state: "unclaimed", outcome: "in_flight" });
    expect(h.llm.stages).toEqual(["corpus", "cogito"]); // neither refused request reached the model
    expect(slot()).toBe(live[0].id); // and neither disturbed the slot

    h.db.RunStage.find(s => s.id === other.id).status = "cancelled"; // the rival session gives up its own revision
    gate.release();
    await pending;
    expect(attemptsOf("cogito").map(a => [a.claim_state, a.outcome])).toEqual([["claimed", "provider_error"], ["claimed", "succeeded"]]);
    expect(slot()).toBe("");
  });

  it("two simultaneous requests for one attempt buy one call (staged run: the slot decides)", async () => {
    const { stage } = await leftBehind();
    await openAttempt(stage, 1);
    const outcomes = await Promise.allSettled([send(stage), send(stage)]);
    expect(outcomes.map(o => o.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(outcomes.find(o => o.status === "rejected").reason).toMatchObject({ evidence: "not_started" });
    expect(modelCalls("cogito")).toBe(1);
    expect(h.db.RunAttempt).toEqual([expect.objectContaining({ claim_state: "claimed", transport: expect.objectContaining({ state: "returned" }) })]);
  });

  it("two simultaneous requests for one attempt buy one call (historical Run: the claim decides, and the Run is not written)", async () => {
    h.db.Run.push({ id: "legacy-1", query_text: "q", execution_mode: "full", output_mode: "Blueprint", status: "completed", corpus: { constraints: ["c"] } });
    const before = snapshot(h.db.Run[0]);
    const stage = await beginStage({ runId: "legacy-1", stageKey: "cogito", revision: 1, dependsOn: [], templateVersion: "t", prompt: "STAGE KEY: cogito", origin: "rerun" });
    await openAttempt(stage, 1);
    const outcomes = await Promise.allSettled([send(stage), send(stage)]);
    expect(outcomes.map(o => o.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(outcomes.find(o => o.status === "rejected").reason).toMatchObject({ evidence: "not_started", reason: "attempt_claimed" });
    expect(modelCalls("cogito")).toBe(1);
    expect(h.db.Run[0]).toEqual(before);
  });

  it("a spent attempt can never buy a second call, even if its records were made to look live again", async () => {
    await executeJanus(params("quick"));
    const calls = h.llm.stages.length;
    const spent = attemptsOf("corpus")[0];
    stageOf("corpus").status = "running";
    spent.outcome = "in_flight"; // still claimed
    expect(await refusedWith(send(stageOf("corpus")))).toEqual({ evidence: "not_started", reason: "attempt_claimed" });
    expect(h.llm.stages.length).toBe(calls);
    expect(slot()).toBe("");
  });
});

describe("waiting is not failing", () => {
  it("a call that stays open for a week is still simply running; nothing reads its age", async () => {
    vi.useFakeTimers();
    const gate = h.gateOn("corpus");
    const pending = executeJanus(params("quick"));
    await gate.reached;
    await vi.advanceTimersByTimeAsync(7 * 24 * 60 * 60 * 1000);
    expect(stageOf("corpus").status).toBe("running");
    expect(attemptsOf("corpus")).toEqual([expect.objectContaining({ outcome: "in_flight" })]);
    gate.release();
    expect((await pending).status).toBe("completed");
    expect(attemptsOf("corpus")[0].elapsed_ms).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000); // telemetry only
  });

  it("the age of a claim alone can never fail a run, however old it is", async () => {
    const { runId } = await during("cogito", "lost");
    const attempt = attemptsOf("cogito")[0];
    attempt.started_at = attempt.claimed_at = "2020-01-01T00:00:00.000Z"; // years old, and no outcome recorded
    const corpus = snapshot(stageOf("corpus"));
    for (const _again of [1, 2]) {
      expect(await reconcileJanus(runId)).toEqual({ settled: false, unresolved: "cogito" });
      expect((await resumeJanus(runId)).unresolved).toBe("cogito");
    }
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "in_flight", claim_state: "claimed" })]);
    expect(stageOf("cogito").status).toBe("running");
    expect(h.db.Run[0]).toMatchObject({ status: "running", active_attempt_id: attempt.id });
    expect(stageOf("corpus")).toEqual(corpus);
    expect(modelCalls("cogito")).toBe(0); // "lost": the double's function never got as far as the model, and nothing replaced it
  });

  it("no timer, deadline or heartbeat exists in the engine, the store or the function", () => {
    const files = ["src/lib/janus/stageRunner.js", "src/lib/janus/stageStore.js", "src/lib/janus/stageEngine.js", "src/lib/janus/browserAdapter.js",
      "src/lib/janus/executionState.js", "base44/functions/invokeJanusStage/entry.ts"];
    files.forEach(f => expect(read(f)).not.toMatch(/setTimeout|setInterval|Promise\.race|AbortController|AbortSignal|heartbeat_at|Date\.now\(\)\s*-/));
    // Timestamps are written, and subtracted for telemetry; none is ever compared to decide an outcome.
    files.forEach(f => expect(read(f)).not.toMatch(/(claimed_at|started_at|recorded_at|elapsed_ms)[^\n]*[<>]=?\s*\d/));
  });
});

describe("recovery from durable evidence: the truth table, case by case", () => {
  it("case 1 — attempt never claimed: closed atomically; no call occurred, none can, and no failure is recorded", async () => {
    const { runId, stage } = await leftBehind();
    await openAttempt(stage, 1); // the session ended before its request reached the function
    const corpus = snapshot(stageOf("corpus"));

    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(h.db.RunAttempt).toEqual([expect.objectContaining({ claim_state: "void", outcome: "not_started", settled_by: "recovery" })]);
    expect(stageOf("cogito")).toMatchObject({ status: "cancelled", error_class: "not_started" });
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ status: "interrupted", resumable: true, failures: [] });
    expect(stageOf("corpus")).toEqual(corpus);

    // The request arrives late after all.
    expect(await refusedWith(send(stage))).toEqual({ evidence: "not_started", reason: "stage_settled" });
    stageOf("cogito").status = "running"; // even if the stage still looked live, the closed attempt cannot be claimed
    expect(await refusedWith(send(stage))).toEqual({ evidence: "not_started", reason: "attempt_claimed" });
    expect(modelCalls("cogito")).toBe(0);
  });

  it("case 1 — a revision with no attempt at all: no call was made for it", async () => {
    const { runId } = await leftBehind(); // the session ended between creating the revision and opening an attempt
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(stageOf("cogito")).toMatchObject({ status: "cancelled", error_class: "not_started" });
    expect(h.db.RunAttempt).toHaveLength(0);
  });

  it("case 2 — claimed, and the function recorded a response: validated and settled from that record; the paid result is kept", async () => {
    const { runId } = await during("cogito", "late");
    expect(await reconcileJanus(runId)).toEqual({ settled: false, unresolved: "cogito" }); // still running on the server (case 4)
    await h.finishPending(); // the call completes there; nobody is listening
    expect(attemptsOf("cogito")[0]).toMatchObject({ outcome: "in_flight", transport: { state: "returned" } });

    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "succeeded", retry_decision: "none", settled_by: "recovery" })]);
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "succeeded", output: h.out.cogito, validation: expect.objectContaining({ valid: true }) });
    expect(slot()).toBe("");
    expect(modelCalls("cogito")).toBe(1); // recovery made no call

    expect((await resumeJanus(runId)).status).toBe("completed");
    expect(modelCalls("cogito")).toBe(1); // and the resume did not regenerate it
  });

  it("case 2 — a recorded response that fails validation settles the attempt as the invalid output it is; it never becomes an artifact", async () => {
    h.llm.invalidTimes.cogito = 1;
    const { runId } = await during("cogito", "late");
    await h.finishPending();
    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "cogito", nextAttempt: 2 } });
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "schema_failure", retry_decision: "retry_scheduled", settled_by: "recovery" })]);
    expect(attemptsOf("cogito")[0].error_message).toMatch(/^Output failed mandatory validation/);
    // Retryable with budget left: the revision is not settled as failed, and the invalid output is not an artifact.
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "running" });
    expect(stageOf("cogito").output).toBeNull(); // STORE-FIDELITY 2026-11-27: null is what the store holds for a field never written (was toBeUndefined)
    expect(viewOf(runId).stageInfo.cogito.active).toBeNull();
    expect(viewOf(runId).artifacts.cogito).toBeUndefined();
    expect(modelCalls("cogito")).toBe(1);
  });

  it("case 3 — claimed, and the function recorded a provider failure: the attempt is settled as that class; recovery itself buys nothing", async () => {
    h.llm.failOn = "cogito";
    const { runId } = await during("cogito", "late");
    await h.finishPending();
    h.llm.failOn = null;
    const corpus = snapshot(stageOf("corpus"));

    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "cogito", nextAttempt: 2 } });
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "provider_error", retry_decision: "retry_scheduled", settled_by: "recovery" })]);
    expect(modelCalls("cogito")).toBe(1);
    expect(slot()).toBe("");
    expect(stageOf("corpus")).toEqual(corpus);
    // Retryable with budget left: the revision is not settled. Its next valid operation is attempt 2 (see "same-revision retry continuation").
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "running" });
    expect(stageOf("cogito").error_class).toBeNull(); // STORE-FIDELITY 2026-11-27: null is what the store holds for a field never written (was toBeUndefined)
  });

  it("case 4 — claimed, nothing recorded: unresolved. Asking again, resuming and waiting change nothing", async () => {
    const { runId } = await during("cogito", "late"); // the call is alive on the server
    const before = snapshot({ stages: h.db.RunStage, attempts: h.db.RunAttempt, run: h.db.Run[0] });
    for (const _again of [1, 2, 3]) {
      expect(await reconcileJanus(runId)).toEqual({ settled: false, unresolved: "cogito" });
      expect((await resumeJanus(runId)).unresolved).toBe("cogito");
    }
    expect(snapshot({ stages: h.db.RunStage, attempts: h.db.RunAttempt, run: h.db.Run[0] })).toEqual(before);
    expect(before.attempts.filter(a => a.stage_key === "cogito")).toEqual([expect.objectContaining({ outcome: "in_flight", claim_state: "claimed" })]);
    expect(before.run.active_attempt_id).toBe(before.attempts.find(a => a.stage_key === "cogito").id); // the slot is still held by that call
    expect(h.llm.stages).toEqual(["corpus"]);
  });

  it("case 5 — an earlier attempt settled as retryable, the retry attempt was never claimed: the earlier outcome is preserved", async () => {
    const { runId, stage } = await leftBehind();
    const first = await openAttempt(stage, 1);
    h.llm.failOn = "cogito";
    await send(stage).catch(() => {}); // a real call, a real recorded failure
    h.llm.failOn = null;
    await settleAttempt(first, { outcome: "provider_error", message: "LLM call failed — provider returned 500", retryDecision: "retry_scheduled" });
    await openAttempt(stage, 2); // the session vanished before sending the retry

    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "cogito", nextAttempt: 2 } });
    expect(h.db.RunAttempt.map(a => [a.attempt_number, a.outcome, a.claim_state])).toEqual([[1, "provider_error", "claimed"], [2, "not_started", "void"]]);
    expect(modelCalls("cogito")).toBe(1); // no new call, and no new outcome
    // The unclaimed retry used none of the budget; the revision still waits for attempt 2 and is not closed.
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "running" });
    expect(stageOf("cogito").error_class).toBeNull(); // STORE-FIDELITY 2026-11-27: null is what the store holds for a field never written (was toBeUndefined)
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ resumable: true, failures: [], awaiting: { key: "cogito", nextAttempt: 2 } });
  });

  it("a call that succeeded but whose result was recorded nowhere is neither a success nor a provider failure", async () => {
    const { runId, stage } = await leftBehind();
    const attempt = await openAttempt(stage, 1);
    await send(stage);
    // The function could not write its record; the session settled the attempt from the response it held, then vanished.
    await settleAttempt(attempt, { outcome: "succeeded" });
    const rec = h.db.RunAttempt[0]; delete rec.transport; delete rec.response_text;

    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(stageOf("cogito")).toMatchObject({ status: "cancelled", error_class: "artifact_not_recorded" });
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ resumable: true, failures: [] });
  });

  it("an orphaned evaluation on a finished run is resolved without reopening the run or buying another evaluation", async () => {
    h.llm.transport.qualification = "late";
    const result = await executeJanus(params("quick"));
    h.llm.transport = {};
    expect(result.status).toBe("completed");
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualifying", released_blueprint_stage_id: "" });

    await h.finishPending();
    expect(await reconcileJanus(result.runId)).toEqual({ settled: true, unresolved: null });
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified", released_blueprint_stage_id: stageOf("blueprint").id });
    expect(modelCalls("qualification")).toBe(1);
  });
});

describe("same-revision retry continuation", () => {
  const cogitoStages = () => h.db.RunStage.filter(s => s.stage_key === "cogito");
  const ledger = () => attemptsOf("cogito").map(a => [a.attempt_number, a.outcome, a.retry_decision, a.settled_by]);
  const everything = () => snapshot({ stages: h.db.RunStage, attempts: h.db.RunAttempt, run: h.db.Run[0] });
  /** The session vanishes while a call for cogito is live; the call then ends on the server as a failure. */
  const interruptedFailure = async (start) => {
    h.llm.failOn = "cogito";
    h.llm.transport.cogito = "late";
    const result = await start();
    h.llm.transport = {};
    expect(result.unresolved).toBe("cogito");
    await h.finishPending();
    h.llm.failOn = null;
    return result;
  };
  /** Recovery of that call, with proof that recovery itself bought nothing. */
  const recover = async (runId) => {
    const calls = h.llm.stages.length;
    const result = await reconcileJanus(runId);
    expect(h.llm.stages.length).toBe(calls);
    return result;
  };
  /** A run whose cogito revision 1 is waiting for attempt 2 after a recovered provider failure. */
  const waitingForAttempt2 = async () => {
    const { runId } = await interruptedFailure(() => executeJanus(params("quick")));
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "cogito", nextAttempt: 2 } });
    return { runId, stageId: stageOf("cogito").id };
  };

  it("recovered attempt 1 retryable → the revision waits; Resume opens attempt 2 on the same RunStage, with the identical prompt", async () => {
    const { runId, stageId } = await waitingForAttempt2();
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled", "recovery"]]);
    expect(stageOf("cogito")).toMatchObject({ id: stageId, revision: 1, status: "running" });
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ status: "interrupted", resumable: true, unresolved: false, live: null, failures: [],
      awaiting: { key: "cogito", state: "awaiting", nextAttempt: 2, lastEvidence: "provider_error" }, next: { key: "cogito" } });
    const fingerprint = stageOf("cogito").input_fingerprint;

    expect((await resumeJanus(runId)).status).toBe("completed");
    expect(cogitoStages()).toEqual([expect.objectContaining({ id: stageId, revision: 1, status: "succeeded", output: h.out.cogito, input_fingerprint: fingerprint })]);
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled", "recovery"], [2, "succeeded", "none", "session"]]);
    expect(new Set(attemptsOf("cogito").map(a => a.stage_id))).toEqual(new Set([stageId]));
    const prompts = h.llm.prompts.filter((_, i) => h.llm.stages[i] === "cogito");
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toBe(prompts[0]);
    expect(slot()).toBe("");
  });

  it("recovered attempt 2 retryable → Resume opens attempt 3 on the same RunStage; interruptions never reset the limit, and there is no fourth attempt", async () => {
    const { runId, stageId } = await waitingForAttempt2();
    await interruptedFailure(() => resumeJanus(runId)); // attempt 2: the session vanishes again
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "cogito", nextAttempt: 3 } });
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled", "recovery"], [2, "provider_error", "retry_scheduled", "recovery"]]);
    expect(stageOf("cogito")).toMatchObject({ id: stageId, revision: 1, status: "running" });
    expect(deriveExecutionState(viewOf(runId)).awaiting).toMatchObject({ key: "cogito", nextAttempt: 3 });

    await interruptedFailure(() => resumeJanus(runId)); // attempt 3: and again
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null });
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled", "recovery"], [2, "provider_error", "retry_scheduled", "recovery"], [3, "provider_error", "exhausted", "recovery"]]);
    expect(cogitoStages()).toEqual([expect.objectContaining({ id: stageId, revision: 1, status: "failed", error_class: "provider_error" })]);
    expect(stageOf("cogito").error_message).toMatch(/\(after 3 attempts\)$/);
    expect(new Set(attemptsOf("cogito").map(a => a.stage_id))).toEqual(new Set([stageId]));
    expect(modelCalls("cogito")).toBe(MAX); // three calls across three sessions, never more

    // The exhausted revision cannot be given a fourth attempt by any path.
    const view = viewOf(runId);
    expect(deriveExecutionState(view).awaiting).toBeNull();
    await expect(continueStage({ stage: stageOf("cogito"), attempts: view.attempts[stageId], prompt: "STAGE KEY: cogito" })).rejects.toThrow(/not waiting for a retry/);
    expect(await refusedWith(send(stageOf("cogito")))).toEqual({ evidence: "not_started", reason: "stage_settled" });
    expect(attemptsOf("cogito")).toHaveLength(MAX);
    expect(modelCalls("cogito")).toBe(MAX);
  });

  it("the limit is counted in calls of the revision, whoever made them: two live, one interrupted, then exhausted", async () => {
    h.llm.failOn = "cogito";
    h.llm.transport.cogito = [null, null, "late"];
    const { runId } = await executeJanus(params("quick"));
    h.llm.transport = {};
    await h.finishPending();
    h.llm.failOn = null;
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null });
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled", "session"], [2, "provider_error", "retry_scheduled", "session"], [3, "provider_error", "exhausted", "recovery"]]);
    expect(cogitoStages()).toEqual([expect.objectContaining({ revision: 1, status: "failed", error_class: "provider_error" })]);
  });

  it("a session that ended right after settling a retryable attempt left the revision waiting; Resume continues it without any recovery step", async () => {
    const { runId, stageId } = await waitingForAttempt2();
    h.db.RunAttempt.find(a => a.stage_id === stageId).settled_by = "session"; // exactly what a live session writes before its next attempt
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ unresolved: false, resumable: true, awaiting: { nextAttempt: 2 } });
    expect((await resumeJanus(runId)).status).toBe("completed");
    expect(cogitoStages()).toEqual([expect.objectContaining({ id: stageId, revision: 1, status: "succeeded" })]);
  });

  it.each([
    ["a dependency's recorded output no longer compiles to the fingerprinted prompt", () => { stageOf("corpus").output = { ...h.out.corpus, constraints: ["a different constraint"] }; }, /input fingerprint/],
    ["the dependency revisions are no longer the active ones", async () => { await h.base44.entities.RunStage.create({ run_id: h.db.Run[0].id, stage_key: "corpus", revision: 2, status: "succeeded", depends_on: [], output: h.out.corpus }); }, /dependency revisions are no longer the active ones/],
    ["a recorded dependency revision is no longer available", () => { stageOf("corpus").status = "failed"; }, /no longer available/],
    ["the prompt template changed", () => { stageOf("cogito").prompt_template_version = "stage-compiler/earlier"; }, /prompt template changed/],
    ["the protocol version changed", () => { stageOf("cogito").protocol_version = "1.0"; }, /protocol version changed/],
    ["the stored fingerprint is not this operation's", () => { stageOf("cogito").input_fingerprint = "sha256:" + "0".repeat(64); }, /input fingerprint/],
  ])("identity mismatch blocks continuation (%s): fail closed, nothing started, nothing settled", async (_name, change, reason) => {
    const { runId, stageId } = await waitingForAttempt2();
    await change();
    const before = everything();

    const result = await resumeJanus(runId);
    expect(result).toMatchObject({ status: "running", unresolved: null, blocked: { stageKey: "cogito", revision: 1, nextAttempt: 2 } });
    expect(result.blocked.reasons.join("; ")).toMatch(reason);
    expect(result.stageErrors.join("\n")).toMatch(/^cogito: r1 is not continued/);
    expect(everything()).toEqual(before); // no attempt opened, no new revision, the old one not silently continued or closed
    expect(modelCalls("cogito")).toBe(1);
    expect(h.db.RunStage.find(s => s.id === stageId).status).toBe("running");
  });

  it("a blocked revision needs the operator's explicit decision: only then is it closed, and only then does Resume produce a new revision", async () => {
    const { runId, stageId } = await waitingForAttempt2();
    // While the revision can still be continued, it cannot be closed to reset its budget.
    await expect(closeBlockedRevision(runId)).rejects.toThrow(/can still be continued/);
    expect(stageOf("cogito")).toMatchObject({ id: stageId, status: "running" });

    stageOf("cogito").prompt_template_version = "stage-compiler/earlier";
    expect((await resumeJanus(runId)).blocked).toBeTruthy();
    const calls = h.llm.stages.length;
    expect(await closeBlockedRevision(runId)).toEqual({ closed: "cogito", revision: 1 });
    expect(h.llm.stages.length).toBe(calls);
    expect(h.db.RunStage.find(s => s.id === stageId)).toMatchObject({ status: "failed", error_class: "provider_error", error_message: "cogito: LLM call failed — provider returned 500" });
    await expect(closeBlockedRevision(runId)).rejects.toThrow(/No version of this run is waiting/);

    expect((await resumeJanus(runId)).status).toBe("completed");
    expect(cogitoStages().map(s => [s.revision, s.status])).toEqual([[1, "failed"], [2, "succeeded"]]);
  });

  it("a re-run never starts beside a revision that is waiting for its retry", async () => {
    h.llm.failOn = "blueprint";
    h.llm.transport.blueprint = "late";
    const { runId } = await executeJanus(params("full"));
    h.llm.transport = {};
    await h.finishPending();
    h.llm.failOn = null;
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "blueprint", nextAttempt: 2 } });
    const before = everything();
    await expect(rerunBlueprint(runId)).rejects.toThrow(/blueprint is waiting for its retry \(attempt 2\)/);
    expect(everything()).toEqual(before);

    const stageId = stageOf("blueprint").id;
    expect((await resumeJanus(runId)).status).toBe("completed");
    expect(h.db.RunStage.filter(s => s.stage_key === "blueprint")).toEqual([expect.objectContaining({ id: stageId, revision: 1, status: "succeeded" })]);
    expect(modelCalls("blueprint")).toBe(2);
  });

  it("cancellation blocks continuation: a waiting revision is closed from its real outcome and no further attempt is opened", async () => {
    const { runId, stageId } = await waitingForAttempt2();
    await requestCancel(runId);
    expect(h.db.Run[0].status).toBe("cancelled");
    expect(ledger()).toEqual([[1, "provider_error", "retry_scheduled", "recovery"]]); // the real attempt outcome is preserved
    expect(cogitoStages()).toEqual([expect.objectContaining({ id: stageId, status: "failed", error_class: "provider_error" })]);
    await expect(resumeJanus(runId)).rejects.toThrow(/has ended/);
    expect(modelCalls("cogito")).toBe(1);
    expect(attemptsOf("cogito")).toHaveLength(1);
  });

  it("cancellation requested before recovery: the recovered attempt keeps its real outcome, schedules no retry, and the run reaches the boundary", async () => {
    h.llm.failOn = "cogito";
    const { runId } = await during("cogito", "late");
    await requestCancel(runId);
    expect(h.db.Run[0].status).toBe("cancel_requested"); // a call may be alive
    await h.finishPending();
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null });
    expect(ledger()).toEqual([[1, "provider_error", "none", "recovery"]]);
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "failed", error_class: "provider_error" });
    expect(h.db.Run[0].status).toBe("cancelled");
    expect(modelCalls("blueprint")).toBe(0);
  });

  it("cancellation persisted elsewhere while a revision waits: the resuming session opens no attempt and closes at the boundary", async () => {
    const { runId, stageId } = await waitingForAttempt2();
    h.db.Run[0].status = "cancel_requested"; // written from another session
    expect(await resumeJanus(runId)).toMatchObject({ cancelled: true, status: "cancelled" });
    expect(attemptsOf("cogito")).toHaveLength(1);
    expect(h.db.RunStage.find(s => s.id === stageId)).toMatchObject({ status: "failed", error_class: "provider_error" });
    expect(modelCalls("cogito")).toBe(1);
  });

  it("a non-retryable recovered failure settles the revision", async () => {
    h.llm.failMessage = "Integration credits quota exceeded";
    const { runId } = await interruptedFailure(() => executeJanus(params("quick")));
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null });
    expect(ledger()).toEqual([[1, "quota_failure", "none", "recovery"]]);
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "failed", error_class: "quota_failure" });
    expect(deriveExecutionState(viewOf(runId)).awaiting).toBeNull();
  });

  it("an exhausted recovered failure settles the revision", async () => {
    h.llm.failOn = "cogito";
    h.llm.transport.cogito = [null, null, "late"];
    const { runId } = await executeJanus(params("quick"));
    h.llm.transport = {};
    await h.finishPending();
    expect(await recover(runId)).toEqual({ settled: true, unresolved: null });
    expect(attemptsOf("cogito")[2]).toMatchObject({ attempt_number: 3, outcome: "provider_error", retry_decision: "exhausted", settled_by: "recovery" });
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "failed", error_class: "provider_error" });
    expect(stageOf("cogito").error_message).toMatch(/\(after 3 attempts\)$/);
  });

  it("recovery purchases zero calls and is idempotent: asking again changes nothing", async () => {
    const { runId } = await waitingForAttempt2();
    const before = everything();
    const calls = h.llm.stages.length;
    for (const _again of [1, 2, 3]) expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "cogito", nextAttempt: 2 } });
    expect(everything()).toEqual(before);
    expect(h.llm.stages.length).toBe(calls);
    expect(h.llm.calls).toHaveLength(2); // corpus, and cogito attempt 1: the only requests ever sent
  });

  // Superseded by DIMA's Phase 7 directive (tranche 1, item 2): this test used to assert that a retry left pending on
  // the evaluation of a completed run is closed from its real outcome. The evaluation now keeps its logical revision
  // and budget there, and its own pathway continues it (phase7.test.js "the evaluation pathway of a completed run").
  it("a retry left pending on the evaluation of a completed run keeps its revision and budget; the run is not reopened", async () => {
    h.llm.failOn = "qualification";
    h.llm.transport.qualification = "late";
    const result = await executeJanus(params("quick"));
    h.llm.transport = {};
    await h.finishPending();
    h.llm.failOn = null;
    expect(result.status).toBe("completed");
    expect(await recover(result.runId)).toEqual({ settled: true, unresolved: null, awaiting: { stageKey: "qualification", nextAttempt: 2 } });
    expect(attemptsOf("qualification")).toEqual([expect.objectContaining({ outcome: "provider_error", retry_decision: "retry_scheduled", settled_by: "recovery" })]);
    expect(stageOf("qualification")).toMatchObject({ revision: 1, status: "running" });
    expect(stageOf("qualification").error_class).toBeNull(); // STORE-FIDELITY 2026-11-27: null is what the store holds for a field never written (was toBeUndefined)
    expect(h.db.Run[0]).toMatchObject({ status: "completed", released_blueprint_stage_id: "" });
    expect(deriveExecutionState(viewOf(result.runId))).toMatchObject({ status: "completed", resumable: false, awaiting: null, qualificationAwaiting: { key: "qualification", nextAttempt: 2 } });
  });
});

describe("truthful cancellation (case 6)", () => {
  it("cancelling during a failing call stops the retries as well as the later stages; the call keeps its real outcome", async () => {
    const gate = h.gateOn("cogito");
    h.llm.failOn = "cogito";
    const pending = executeJanus(params("quick"));
    await gate.reached;
    await requestCancel(h.db.Run[0].id);
    gate.release();
    expect(await pending).toMatchObject({ cancelled: true, status: "cancelled" });
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "provider_error", retry_decision: "none" })]);
    expect(modelCalls("blueprint")).toBe(0);
  });

  it("after a cancellation is persisted the function starts no new call for the run", async () => {
    const { stage } = await leftBehind("cogito", { status: "cancel_requested" });
    await openAttempt(stage, 1);
    expect(await refusedWith(send(stage))).toEqual({ evidence: "not_started", reason: "cancel_requested" });
    expect(modelCalls("cogito")).toBe(0);
    expect(slot()).toBe("");
  });

  it("a cancellation persisted by another session stops this session's scheduling; the active call still lands its real outcome", async () => {
    const gate = h.gateOn("corpus");
    const pending = executeJanus(params("quick"));
    await gate.reached;
    h.db.Run[0].status = "cancelled"; // written from elsewhere, not through this session
    gate.release();
    expect(await pending).toMatchObject({ cancelled: true, status: "cancelled" });
    expect(h.llm.stages).toEqual(["corpus"]);
    expect(stageOf("corpus")).toMatchObject({ status: "succeeded", output: h.out.corpus });
  });

  it("cancelling with an unresolved call does not pretend it stopped: the run waits, and closes once the outcome is recorded", async () => {
    const { runId } = await during("cogito", "late");
    await requestCancel(runId);
    expect(h.db.Run[0].status).toBe("cancel_requested"); // not cancelled: a call may be alive
    expect(await reconcileJanus(runId)).toEqual({ settled: false, unresolved: "cogito" });
    expect(h.db.Run[0].status).toBe("cancel_requested");

    await h.finishPending();
    await reconcileJanus(runId);
    expect(h.db.Run[0].status).toBe("cancelled");
    expect(stageOf("cogito")).toMatchObject({ status: "succeeded", output: h.out.cogito }); // its real outcome was kept
    expect(modelCalls("blueprint")).toBe(0);
  });
});