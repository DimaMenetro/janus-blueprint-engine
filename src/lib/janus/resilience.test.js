// Phase 6 — failure, retry, cancellation and ownership semantics.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, rerunBlueprint, requestCancel, reconcileJanus, OPERATOR_ONLY_MESSAGE } from "@/lib/janus/browserAdapter";
import { callLLM } from "@/lib/janus/stageRunner";
import { openAttempt } from "@/lib/janus/stageStore";
import { composeRunView } from "@/lib/janus/runView";
import { deriveExecutionState } from "@/lib/janus/executionState";
import { RETRY_POLICY, FAILURE_EVIDENCE, retryDecision } from "@/lib/janus/lifecycleContract";

const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const attemptsOf = (key) => h.db.RunAttempt.filter(a => a.stage_key === key);
const stageOf = (key) => h.db.RunStage.filter(s => s.stage_key === key).pop();
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId), h.db.RunAttempt.filter(a => a.run_id === runId));
const calls = (key) => h.llm.stages.filter(s => s === key).length;
const MAX = RETRY_POLICY.max_attempts_per_stage;
/** A session that vanished mid-call: the run is open and `key` is the stage its call was for. */
const lostDuring = async (key, fault) => {
  h.llm.transport[key] = fault;
  const result = await executeJanus(params("quick"));
  h.llm.transport = {};
  return result;
};

beforeEach(() => h.reset());
afterEach(() => vi.useRealTimers());

describe("settled-failure classification", () => {
  it("the retry policy is decided from the settled outcome alone", () => {
    expect(RETRY_POLICY.retryable.map(e => retryDecision(e, 1))).toEqual(RETRY_POLICY.retryable.map(() => "retry_scheduled"));
    expect(RETRY_POLICY.retryable.map(e => retryDecision(e, MAX))).toEqual(RETRY_POLICY.retryable.map(() => "exhausted"));
    const terminal = FAILURE_EVIDENCE.filter(e => !RETRY_POLICY.retryable.includes(e));
    expect(terminal).toEqual(["platform_termination", "quota_failure", "operator_cancellation"]);
    [...terminal, "succeeded", "not_started"].forEach(e => expect(retryDecision(e, 1)).toBe("none"));
  });

  it("the server classifies a failed call and that class is what is recorded", async () => {
    h.llm.failOn = "corpus";
    await executeJanus(params("quick"));
    expect(attemptsOf("corpus")[0]).toMatchObject({ outcome: "provider_error", claim_state: "claimed", settled_by: "session",
      transport: { state: "failed", evidence: "provider_error", message: "provider returned 500" } });
    expect(stageOf("corpus")).toMatchObject({ status: "failed", error_class: "provider_error" });
  });

  it("a request that goes silent is not a failure: with no response and no record, the outcome stays unknown", async () => {
    const result = await lostDuring("cogito", "lost");
    expect(result).toMatchObject({ unresolved: "cogito", status: "running" });
    expect(stageOf("cogito")).toMatchObject({ status: "running" });
    expect(stageOf("cogito").error_class).toBeUndefined();
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "in_flight", claim_state: "claimed" })]);
    expect(h.db.Run[0].active_attempt_id).toBe(attemptsOf("cogito")[0].id); // the slot stays taken: nothing can start beside it
    expect(calls("blueprint")).toBe(0);
  });

  it("an HTTP error the platform actually sent, with nothing recorded, is platform termination — and is not retried", async () => {
    h.llm.transport.cogito = "platform";
    const result = await executeJanus(params("quick"));
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "platform_termination", retry_decision: "none" })]);
    expect(stageOf("cogito")).toMatchObject({ status: "failed", error_class: "platform_termination" });
    expect(stageOf("cogito").error_message).toMatch(/HTTP 504/);
    expect(h.db.Run[0].active_attempt_id).toBe(""); // settled, so the slot is free again
    expect(result.status).toBe("partial");
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

  it("invalid output is retried too, and the bound holds: the revision fails once after the last attempt", async () => {
    h.llm.invalidOn = "corpus";
    await executeJanus(params("quick"));
    expect(attemptsOf("corpus").map(a => [a.outcome, a.retry_decision])).toEqual([
      ["schema_failure", "retry_scheduled"], ["schema_failure", "retry_scheduled"], ["schema_failure", "exhausted"]]);
    expect(calls("corpus")).toBe(MAX);
    expect(stageOf("corpus")).toMatchObject({ status: "failed", error_class: "schema_failure" });
    expect(stageOf("corpus").error_message).toMatch(/\(after 3 attempts\)$/);
    expect(deriveExecutionState(viewOf(h.db.Run[0].id)).failures[0]).toMatchObject({ key: "corpus", attempts: 3 });
  });

  it("a quota failure is not retried and nothing further is scheduled", async () => {
    h.llm.failOn = "cogito"; h.llm.failMessage = "Integration credits quota exceeded";
    const result = await executeJanus(params("quick"));
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "quota_failure", retry_decision: "none" })]);
    expect(calls("cogito")).toBe(1);
    expect(calls("blueprint")).toBe(0); // it would only fail the same way
    expect(result.status).toBe("partial");
    expect(viewOf(result.runId).artifacts.corpus).toBeDefined();
  });

  it("attempts never overlap: while one is live, a retry or a second caller cannot start another", async () => {
    const gate = h.gateOn("cogito");
    h.llm.failTimes.cogito = 1;
    const pending = executeJanus(params("quick"));
    await gate.reached;
    expect(attemptsOf("cogito")).toHaveLength(1); // no second attempt exists while the first is in flight

    // Another tab, with no shared memory: its own attempt for the same run is refused by the server.
    const rival = await openAttempt(stageOf("cogito"), 99);
    expect(await callLLM(rival.id, "STAGE KEY: cogito")).toMatchObject({ state: "refused", reason: "run_busy" });
    expect(calls("cogito")).toBe(1);

    gate.release();
    await pending;
    expect(attemptsOf("cogito").filter(a => a.claim_state === "claimed").map(a => a.outcome)).toEqual(["provider_error", "succeeded"]);
  });

  it("one attempt is one call: a claimed attempt cannot be used again", async () => {
    await executeJanus(params("quick"));
    const before = h.llm.calls.length;
    const settled = attemptsOf("corpus")[0];
    await rerunBlueprint(h.db.Run[0].id); // reopens the run; the old attempt is still spent
    h.db.RunStage.find(s => s.id === settled.stage_id).status = "running"; // even if its stage were made to look live
    settled.outcome = "in_flight";
    expect(await callLLM(settled.id, "STAGE KEY: corpus")).toMatchObject({ state: "refused", reason: "attempt_claimed" });
    expect(h.db.Run[0].active_attempt_id).toBe(""); // the slot it briefly took was given back
    expect(h.llm.calls.length).toBe(before + 2); // only the re-run's own calls (blueprint, qualification)
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
    const { runId } = await lostDuring("cogito", "lost");
    const attempt = attemptsOf("cogito")[0];
    attempt.started_at = attempt.claimed_at = "2020-01-01T00:00:00.000Z"; // years old, no outcome recorded
    for (const _again of [1, 2]) {
      expect(await reconcileJanus(runId)).toEqual({ settled: false, unresolved: "cogito" });
      expect((await resumeJanus(runId)).unresolved).toBe("cogito");
    }
    await expect(rerunBlueprint(runId)).rejects.toThrow(/has not settled/);
    expect(attempt).toMatchObject({ outcome: "in_flight", claim_state: "claimed" });
    expect(stageOf("cogito").status).toBe("running");
    expect(h.db.Run[0].status).toBe("running");
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ status: "unresolved", resumable: false });
  });

  it("no timer, deadline or heartbeat exists in the engine, the store or the function", () => {
    const read = (p) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");
    const files = ["src/lib/janus/stageRunner.js", "src/lib/janus/stageStore.js", "src/lib/janus/stageEngine.js", "src/lib/janus/browserAdapter.js",
      "src/lib/janus/executionState.js", "base44/functions/invokeJanusStage/entry.ts"];
    files.forEach(f => expect(read(f)).not.toMatch(/setTimeout|setInterval|Promise\.race|AbortController|AbortSignal|heartbeat_at|Date\.now\(\)\s*-/));
    // Timestamps are written and subtracted for telemetry; none is ever compared to decide an outcome.
    files.forEach(f => expect(read(f)).not.toMatch(/(claimed_at|started_at|recorded_at|elapsed_ms)[^\n]*[<>]=?\s*\d/));
  });
});

describe("safe orphan handling from recorded evidence", () => {
  it("a call that finished after its session vanished is settled from the server's record, and the run resumes without repeating it", async () => {
    const { runId, unresolved } = await lostDuring("cogito", "drop");
    expect(unresolved).toBe("cogito");
    expect(attemptsOf("cogito")[0]).toMatchObject({ outcome: "in_flight", transport: { state: "returned" } });
    expect(deriveExecutionState(viewOf(runId))).toMatchObject({ status: "unresolved", resumable: false });

    expect(await reconcileJanus(runId)).toEqual({ settled: true, unresolved: null });
    expect(attemptsOf("cogito")[0]).toMatchObject({ outcome: "succeeded", settled_by: "recovery" });
    expect(stageOf("cogito")).toMatchObject({ revision: 1, status: "succeeded", output: h.out.cogito });
    expect(calls("cogito")).toBe(1); // recovery made no call

    const resumed = await resumeJanus(runId);
    expect(resumed.status).toBe("completed");
    expect(calls("cogito")).toBe(1); // the paid result was kept, not regenerated
  });

  it("a recorded failure is settled as that failure; recovery itself never retries", async () => {
    h.llm.failOn = "cogito";
    const { runId } = await lostDuring("cogito", "drop");
    h.llm.failOn = null;
    await reconcileJanus(runId);
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "provider_error", retry_decision: "none", settled_by: "recovery" })]);
    expect(stageOf("cogito")).toMatchObject({ status: "failed", error_class: "provider_error" });
    expect(calls("cogito")).toBe(1);
    await resumeJanus(runId); // the explicit resume is what runs the stage again, as a new revision
    expect(stageOf("cogito")).toMatchObject({ revision: 2, status: "succeeded" });
  });

  it("an attempt the server never claimed is closed atomically: no call was made, and a late request can no longer make one", async () => {
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "quick", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "" });
    const stage = await h.base44.entities.RunStage.create({ run_id: run.id, stage_key: "corpus", revision: 1, status: "running", depends_on: [] });
    const attempt = await openAttempt(stage, 1); // the session ended before its request reached the server

    expect(await reconcileJanus(run.id)).toEqual({ settled: true, unresolved: null });
    expect(h.db.RunAttempt[0]).toMatchObject({ claim_state: "void", outcome: "not_started" });
    expect(h.db.RunStage[0]).toMatchObject({ status: "cancelled", error_class: "not_started" });
    expect(deriveExecutionState(viewOf(run.id))).toMatchObject({ status: "interrupted", resumable: true, failures: [] }); // not a failure of the stage

    h.db.RunStage[0].status = "running"; // even if the late request found the stage live
    expect(await callLLM(attempt.id, "STAGE KEY: corpus")).toMatchObject({ state: "refused", reason: "attempt_claimed" });
    expect(h.llm.calls).toHaveLength(0);
  });

  it("an orphaned evaluation on a finished run is resolved without reopening the run or buying another evaluation", async () => {
    h.llm.transport.qualification = "drop";
    const result = await executeJanus({ ...params("quick") });
    h.llm.transport = {};
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualifying" });
    expect(result.status).toBe("completed");

    await reconcileJanus(result.runId);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified" });
    expect(h.db.Run[0].released_blueprint_stage_id).toBe(stageOf("blueprint").id);
    expect(calls("qualification")).toBe(1);
  });
});

describe("truthful cancellation", () => {
  it("cancelling during a failing call stops the retries as well as the later stages", async () => {
    const gate = h.gateOn("cogito");
    h.llm.failOn = "cogito";
    const pending = executeJanus(params("quick"));
    await gate.reached;
    await requestCancel(h.db.Run[0].id);
    gate.release();
    const result = await pending;
    expect(result).toMatchObject({ cancelled: true, status: "cancelled" });
    expect(attemptsOf("cogito")).toEqual([expect.objectContaining({ outcome: "provider_error", retry_decision: "none" })]); // its real outcome, no retry
    expect(calls("blueprint")).toBe(0);
  });

  it("a cancellation made by another session is honoured: the server starts no further call for the run", async () => {
    const gate = h.gateOn("corpus");
    const pending = executeJanus(params("quick"));
    await gate.reached;
    h.db.Run[0].status = "cancelled"; // written from elsewhere, not through this session
    const rival = await openAttempt(stageOf("corpus"), 2);
    expect(await callLLM(rival.id, "STAGE KEY: corpus")).toMatchObject({ state: "refused", reason: "cancel_requested" });
    gate.release();
    expect(await pending).toMatchObject({ cancelled: true });
    expect(h.llm.stages).toEqual(["corpus"]);
  });

  it("cancelling with an unresolved call does not pretend it stopped: the run waits, and closes once the outcome is recorded", async () => {
    const { runId } = await lostDuring("cogito", "drop");
    await requestCancel(runId);
    expect(h.db.Run[0].status).toBe("cancel_requested"); // not cancelled: a call may be live
    await reconcileJanus(runId);
    expect(h.db.Run[0].status).toBe("cancelled");
    expect(stageOf("cogito").status).toBe("succeeded"); // its real outcome was kept
    expect(calls("blueprint")).toBe(0);
  });
});

describe("ownership replaces the operator-only containment", () => {
  const member = () => { h.session.user = { id: "user-2", role: "user" }; };

  it("a signed-in member runs their own staged run end to end", async () => {
    member();
    const result = await executeJanus(params("quick"));
    expect(result.status).toBe("completed");
    expect(h.db.RunAttempt.every(a => a.created_by_id === "user-2" && a.claim_state === "claimed")).toBe(true);
  });

  it("a member cannot start a call for a run they do not own, and cannot re-run a historical Run", async () => {
    const { runId } = await executeJanus(params("quick")); // the operator's run
    const theirs = await openAttempt(stageOf("blueprint"), 2);
    h.db.Run.push({ id: "legacy-1", query_text: "q", execution_mode: "full", output_mode: "Blueprint", status: "completed",
      corpus: { constraints: ["c"] }, cogito: h.out.cogito, animus: h.out.animus, actus: h.out.actus });
    const before = h.llm.calls.length;
    member();
    expect(await callLLM(theirs.id, "STAGE KEY: blueprint")).toMatchObject({ state: "refused", reason: "not_found" });
    await expect(rerunBlueprint("legacy-1")).rejects.toThrow(OPERATOR_ONLY_MESSAGE);
    expect(h.llm.calls.length).toBe(before);
    expect(h.db.Run.find(r => r.id === runId).active_attempt_id).toBe("");
  });

  it("no blanket operator check remains on staged execution", () => {
    const adapter = fs.readFileSync(path.resolve(process.cwd(), "src/lib/janus/browserAdapter.js"), "utf8");
    expect(adapter.match(/await assertOperator\(\)/g)).toHaveLength(1);
    expect(adapter).toMatch(/if \(view\.storage !== STORAGE_MODEL\.staged\) await assertOperator\(\)/);
    const fn = fs.readFileSync(path.resolve(process.cwd(), "base44/functions/invokeJanusStage/entry.ts"), "utf8");
    expect(fn.match(/user\.role !== 'admin'/g)).toHaveLength(1);
    expect(fn).toMatch(/!staged && user\.role !== 'admin'/);
  });
});