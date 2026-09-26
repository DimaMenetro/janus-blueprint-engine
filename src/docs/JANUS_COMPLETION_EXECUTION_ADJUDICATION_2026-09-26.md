# JANUS COMPLETION-ORIENTED EXECUTION ADJUDICATION
## ADE-JBE-001 — 2026-09-26

**Status:** CURRENT EXECUTION AUTHORITY  
**Operator adjudication:** DIMA  
**Scope:** Janus Blueprint Engine LLM-call lifecycle, recovery, completion semantics, and execution ownership.

> This document supersedes the **operational** timeout/retry mechanism introduced by
> IMP-001-R-D-RES on 2026-05-31. IMP-001 remains historical provenance explaining why
> the mechanism existed. Its TIMEOUT_MATRIX, Promise.race deadlines, and timer-triggered
> retry behavior are no longer executable design requirements.

## 1. Governing Principle

Janus is **completion-oriented**, not latency-oriented.

A Janus Blueprint is allowed to take as long as healthy upstream execution requires.
Elapsed wall-clock time by itself is not evidence that an LLM call is stalled or failed.
Janus therefore MUST NOT terminate, abandon, or retry an active InvokeLLM request merely
because a locally selected number of seconds has elapsed.

## 2. LLM Call Semantics

Current executable caller: `src/components/janus/llmCall.jsx`.

1. Await `InvokeLLM` directly.
2. No Janus-local `Promise.race`, timeout promise, timeout matrix, or elapsed-time abort.
3. A retry may occur only **after the prior provider/transport call has explicitly settled
   as a retryable failure**.
4. Current retry bound: one retry after a settled transient provider/transport failure.
5. Deterministic request/auth/account/quota failures surface immediately.
6. Empty provider responses are explicit failures and may receive one retry.
7. Provider/platform timeouts are upstream failures. Janus does not create them and cannot
   remove limits imposed by the provider or hosting platform.
8. Call labels remain diagnostic identifiers only; they do not map to time budgets.

This prevents the IMP-001 failure mode in which a local timer stopped listening to an
InvokeLLM promise without cancelling it, then launched another potentially overlapping paid
attempt.

## 3. Checkpoint and Recovery Semantics

The browser engine incrementally persists every completed domain and every completed
intersection pair to the Run entity.

When an execution fails after useful checkpoints exist:

- status is `failed`, not falsely `completed`;
- persisted outputs remain inspectable in Results;
- the operator can select **Resume Checkpoint**;
- resume reloads the original Run parameters;
- completed domains are reused;
- completed intersection pairs are reused;
- Janus continues from missing work instead of repaying completed stages.

Resume is **operator-selected**. Janus does not infer from heartbeat age that a live LLM call
is dead. That distinction is mandatory because a legitimate call may be long-running.

## 4. Dependency / Failure Semantics

Mandatory sequential domains are fail-fast. If a required domain LLM call or parse fails,
Janus preserves completed checkpoints and stops dependent work rather than paying for a
downstream analysis built on a known missing prerequisite.

For Full mode:

- all six pairwise intersections must exist before named synthesis executes;
- named synthesis must contain the four required emergent patterns;
- Blueprint is blocked until every prior stage required by that mode is complete;
- a Full run cannot reach `completed` with missing required domain or intersection
  checkpoints.

Blueprint split-call errors are terminal for the current attempt even when a partial
Blueprint object exists. The partial artifact is preserved for inspection/recovery.

## 5. Completion Invariant

`completed` means the selected execution mode's mandatory pipeline is structurally
complete.

A Run with missing mandatory checkpoints MUST be `failed`. This supersedes the previous
implementation that deliberately returned `completed` for partial runs.

## 6. Heartbeat Semantics

`current_step` and `last_heartbeat` are checkpoint/observability fields.

They MUST NOT be interpreted as an LLM health deadline. In particular, the previous
five-minute "stale" UI inference is retired. During one legitimately long LLM call, the
last checkpoint may become old without the call being unhealthy.

## 7. Backend Execution Constraint

The existing `runJanusPipeline` backend lane is **not a valid long-run transport** for
Standard or Full execution. Two direct wall-clock probes measured termination at
approximately 292,350 ms and 293,954 ms (~295 seconds). Removing Janus-local LLM timers does
not remove this hosting constraint.

Therefore:

- do not treat the monolithic backend lane as the durable replacement for the browser lane;
- do not reintroduce short LLM deadlines to force Janus under the backend-function ceiling;
- durable background orchestration must segment execution across a substrate whose
  step/run semantics are proven for Janus before becoming authoritative.

## 8. Historical Records

The following remain useful as provenance but are not current execution authority where they
conflict with this adjudication:

- `RESILIENCE_IMPLEMENTATION_BLUEPRINT.md` (IMP-001-R-D-RES)
- timeout-specific sections of `JANUS_ENGINE_CONTINUITY.md` dated through 2026-08-03
- timeout-specific scoring in `BENCHMARK_EXTERNAL_1B.md`
- timeout-specific findings in `WHOLE_APP_ASSESSMENT.md`
- timeout-preservation assumptions in `SERVER_EXECUTION_IMPLEMENTATION_BLUEPRINT.md`

## 9. Separate Open Protocol-Fidelity Defect

This execution correction does **not** silently adjudicate CP-002 SME-content drift.
The live application still describes a 24-subdomain / Restoration-era hybrid roster while
the canonical CP-002-O-D-JNP v2.0 Ideal Form specifies 25 subdomains. That is a separate
protocol-fidelity correction and must not be conflated with timeout removal.

## 10. Exit Tests for this Adjudication

The implementation passes this execution refactor only when:

1. executable Janus paths contain no TIMEOUT_MATRIX, LLMTimeoutError, local timeout promise,
   or timer-driven `Promise.race` around InvokeLLM;
2. browser main execution, Blueprint split calls, reruns, and the server copy all use
   completion-oriented settled-failure semantics;
3. a partial mandatory pipeline cannot be finalized as `completed`;
4. completed checkpoints survive a downstream failure;
5. a failed Run can resume without recomputing already-completed checkpoints;
6. Full synthesis cannot execute with missing required pair checkpoints;
7. Blueprint cannot execute with missing upstream mandatory checkpoints;
8. heartbeat age is displayed only as observability, not declared stale by a fixed threshold;
9. the production bundle builds successfully;
10. no paid Full-mode validation run is launched without explicit operator intent.
