# JANUS BLUEPRINT ENGINE — FULL APPLICATION AUDIT
## AUD-JBE-2026-09-26

**Audit date:** 2026-09-26  
**Application:** Janus Blueprint Engine  
**Base44 app:** 6978a10dbc9d7c7a927c09b8  
**Repository:** DimaMenetro/janus-blueprint-engine  
**Operator:** DIMA  
**Execution authority for this refactor:** ADE-JBE-001 — Janus Completion-Oriented Execution Adjudication

---

## 1. Executive Finding

The May 31 timeout hardening was not merely under-tuned. Its governing assumption was wrong
for Janus: locally selected elapsed-time limits were being used as evidence that a healthy
LLM call had failed.

That mechanism has now been removed from every executable Janus production path audited in
this application.

The primary browser execution lane is restored to completion-oriented behavior and hardened
beyond the pre-timeout May design with:

- direct provider waits rather than local elapsed-time races;
- retries only after explicitly settled transient provider/transport failures;
- incremental checkpoint persistence;
- explicit resume from failed checkpoints;
- fail-fast mandatory-domain dependency handling;
- strict structural completion invariants;
- preservation/inspection of partial artifacts;
- no fixed "stale heartbeat" inference;
- prevention of new use of the known-invalid monolithic backend lane.

---

## 2. Evidence Baseline

### 2.1 Historical Run data

Live Run data audited before modification contained **69 records**:

- 34 `completed`
- 19 `running`
- 16 `failed`
- 49 Full
- 17 Standard
- 2 Quick
- 1 legacy/undefined mode

Historical records include partial runs marked `completed`, proving the prior completion
invariant was unsafe.

The latest Janus Run was the 2026-08-11 Full run
`6a7b23a0f0106f13ff4086d5`, which failed after Corpus exhausted three local 120-second
attempts. Its recorded error explicitly named the 120,000 ms local cutoff.

Historical provider-side failures also include explicit upstream `litellm.Timeout` errors.
Those are provider/platform failures and are distinct from the removed Janus-local timers.

### 2.2 Backend execution ceiling

Two prior execution-budget probes measured termination at approximately:

- 292,350 ms
- 293,954 ms

This is a transport/runtime ceiling on the monolithic backend-function path. It is not an
acceptable reason to shorten healthy Janus LLM calls.

### 2.3 Current Base44 direction

Current Base44 public product documentation describes Workflows as a native background,
multi-step engine with durable waits, branching/fallbacks, Activity run history, and credit
visibility. That makes Workflows a plausible future orchestration substrate.

However, the public material audited here does **not** prove that a single Janus InvokeLLM
step can remain active for every latency Janus may legitimately require. Workflows therefore
remains a candidate pending an instrumented Janus-specific execution probe; it is not being
declared production-ready by assumption.

This preserves Project Opus Global Redline GR-4 (scheduled/durable jobs rather than fragile
idle loops) without replacing one unmeasured timeout assumption with another.

---

## 3. Timeout / Retry Audit — FIXED

### Previous state

`src/components/janus/llmTimeout.jsx` contained:

- TIMEOUT_MATRIX
- LLMTimeoutError
- timeoutPromise
- Promise.race around InvokeLLM
- 2 retries (3 total attempts)
- 3 s / 9 s backoff

The same mechanism was duplicated into
`base44/functions/runJanusPipeline/entry.ts`.

Because the timeout branch could win without cancelling the provider promise, Janus could
abandon an in-flight paid call and launch another attempt.

### Current state

`llmTimeout.jsx` has been **deleted**.

Current executable caller:
`src/components/janus/llmCall.jsx`

Behavior:

- direct `await InvokeLLM(...)`;
- no TIMEOUT_MATRIX;
- no local timeout promise;
- no Promise.race;
- no setTimeout around Janus LLM work;
- one bounded retry only after the prior call has explicitly settled as a retryable transient
  provider/transport failure;
- deterministic auth/request/quota failures surface immediately;
- empty responses are explicit failures rather than inferred hangs;
- call labels remain diagnostic only.

The browser engine, Blueprint split-call module, rerun engine, and server copy all use this
completion-oriented failure model.

**Static executable scan:** zero matches for TIMEOUT_MATRIX, LLMTimeoutError,
callLLMResilient, timeoutPromise, or Promise.race in the Janus execution modules or
runJanusPipeline.

---

## 4. Completion Integrity Audit — FIXED FOR PRIMARY LANE

### Previous defect

The browser engine contained an effective invariant of:

`missingDomains.length === 0 ? "completed" : "completed"`

A partial Run could therefore be finalized as completed.

### Current behavior

For new browser executions:

- required domains must exist;
- Full mode requires all six intersection checkpoints;
- Full named synthesis must contain the required named patterns;
- Blueprint is blocked if upstream mandatory checkpoints are missing;
- execution failures cannot be converted into a completed Run;
- incomplete attempts finalize as `failed`, while their completed artifacts remain persisted.

This corrects the historical false-completion behavior without deleting historical Run data.

---

## 5. Dependency / Parse Failure Audit — FIXED FOR PRIMARY LANE

### Previous defect

A domain parse failure could append an error and then allow later domains to run with missing
context. This spent additional integration credits on structurally degraded downstream work.

### Current behavior

Mandatory domain LLM/parse failure is fail-fast:

1. persist the error;
2. preserve every completed checkpoint;
3. stop dependent work;
4. finalize the attempt as failed;
5. allow operator-selected checkpoint resume.

Independent intersection attempts are still collected where possible. Named synthesis is
blocked until all required pair checkpoints exist.

---

## 6. Checkpoint / Resume Audit — IMPLEMENTED FOR FAILED BROWSER RUNS

The primary browser lane already persisted domain and intersection results incrementally but
did not rehydrate them.

Current implementation adds explicit checkpoint resume:

- Results displays **Resume Checkpoint** for failed Runs;
- New Query loads the original Run parameters;
- completed domains are rehydrated and skipped;
- completed intersection pairs are rehydrated and skipped;
- missing pairs can be filled without re-paying completed pairs;
- if a newly completed pair invalidates legacy named synthesis, synthesis is recomputed;
- a failed terminal Blueprint is treated as non-authoritative and recomputed;
- a completed Run is never resumed/recomputed.

Resume is operator-selected. Janus does not infer that a currently running LLM call is dead
from heartbeat age.

### Remaining limitation

A browser tab can still be terminated while an individual provider request is in flight.
Checkpoint resume limits the loss to the unfinished stage, but true browser-independent
execution requires a proven durable orchestration substrate.

---

## 7. Heartbeat / Stall Audit — FIXED

The Backend Runs UI previously labeled a running Run "stale" when the last heartbeat exceeded
five minutes.

That inference is invalid for completion-oriented Janus because a single legitimate provider
call may exceed five minutes.

The fixed UI now displays **Last checkpoint** only. Heartbeat age is observability data, not
a health verdict.

Project Opus GR-7 observability remains served without converting telemetry into an arbitrary
kill condition.

---

## 8. Server Lane Audit — KNOWN INVALID TRANSPORT, NEW DISPATCHES DISABLED

`runJanusPipeline` is a monolithic backend execution lane.

The measured ~295-second function ceiling means removing local LLM timers cannot make that
transport reliable for Standard or Full Janus. Attempting to force Janus inside the ceiling
would simply move the timeout mistake from application code into architecture.

Remediation in this pass:

- its embedded LLM caller was converted to completion-oriented settled-failure semantics;
- its partial-domain completion invariant was tightened;
- the UI no longer permits new Backend Run dispatches;
- historical backend runs remain inspectable;
- the operator is directed to completion-oriented New Query.

The source remains for provenance/research until a durable replacement is proven.

---

## 9. Synthesis Persistence Audit — FIXED IN PRIMARY LANE

The incremental pair matrix could be persisted before named synthesis, then overwritten when
the synthesis domain object was written. Append-only finalization did not necessarily restore
that matrix.

Current browser finalization explicitly merges the accumulated intersection matrix back into
the synthesis object and persists the combined synthesis before final status.

---

## 10. Protocol Fidelity Audit — OPEN, SEPARATE FROM TIMEOUT REPAIR

Canonical **CP-002-O-D-JNP v2.0 (Ideal Form)** is ACTIVE and defines:

- 25 total subdomains
- Corpus: 7
- Cogito: 6
- Animus: 5
- Actus: 7
- 6 intersection pairs
- 4 named emergent patterns

The live application is still a Restoration-era hybrid:

- Full-mode description says **24 subdomains**;
- Refresh prompt explicitly asks for **24 subdomains**;
- Animus still contains `jungian_psychology` and `hci_empathy`;
- Actus currently contains only 6 listed SME subdomains;
- Cogito and Actus IDs/rosters do not fully match the Ideal Form.

This is a **protocol-fidelity defect**, but it was intentionally not silently rewritten during
the execution-reliability repair because changing SME identity/domain content materially
changes Janus reasoning behavior.

Required next adjudication: exact CP-002 v2.0 Ideal Form alignment pass across one canonical
domain registry, refresh routing, prompt generation, schema text, browser engine, and server
copy.

---

## 11. Duplication / Maintainability Audit — OPEN

Browser execution logic and `runJanusPipeline` remain substantially duplicated.

That duplication already caused drift and makes every execution-semantic change a two-copy
maintenance problem.

Recommended endpoint after a durable background substrate is proven:

- one canonical prompt/domain registry;
- one canonical stage executor;
- orchestration adapters for browser and durable background execution;
- no duplicated prompt bytes or SME rosters.

Do not perform this consolidation before the CP-002 alignment and durable-substrate decision
are locked, because doing both simultaneously would make fidelity regression harder to
isolate.

---

## 12. Historical Documentation Audit — FIXED

IMP-001 and related August assessments previously described TIMEOUT_MATRIX behavior as
current.

Remediation:

- created `JANUS_COMPLETION_EXECUTION_ADJUDICATION_2026-09-26.md`;
- amended `JANUS_ENGINE_CONTINUITY.md` at the top so the current adjudication is read before
  historical timeout text;
- marked timeout-specific IMP-001 content as historical/superseded for execution;
- amended server, benchmark, and whole-app assessment records without erasing provenance.

---

## 13. Build / Static Validation

Post-refactor validation:

- `npm run build`: **PASS**
- Janus executable local-timeout scan: **PASS — zero matches**
- `llmTimeout.jsx`: **absent**
- browser checkpoint-resume code: **present**
- failed-Run Results resume control: **present**
- five-minute stale-heartbeat inference: **removed**
- monolithic backend new-dispatch UI: **disabled**

Repository-wide lint/typecheck were already red before this pass. Current lint reports 19
unused-import errors, down from the 23-error baseline. Typecheck still reports broad existing
JS/JSDoc/component-typing debt. The remaining errors in `blueprintSplitCall.jsx` are the same
pre-existing destructured-parameter JSDoc typing errors observed before this refactor.
Production bundling succeeds.

No paid Full-mode LLM validation run was launched during this audit.

---

## 14. Remaining Priority Order

### P0 — completed in this pass
1. Remove arbitrary Janus-local LLM deadlines.
2. Prevent overlapping timer-triggered paid retries.
3. Fix primary-lane completion invariant.
4. Fail fast on missing mandatory domain execution.
5. Restore persisted synthesis intersection matrix.
6. Add failed-Run checkpoint resume.
7. Remove fixed stale-heartbeat inference.
8. Disable known-invalid monolithic backend dispatch.
9. Correct continuity documentation.

### P1 — next protocol correctness pass
1. Align the app to canonical CP-002 v2.0 Ideal Form (25 subdomains).
2. Replace duplicated hard-coded SME/refresh rosters with one canonical domain registry.
3. Revalidate prompt/schema fidelity after that intentional semantic change.

### P2 — durable execution
1. Run an instrumented Base44 Workflows proof specifically against Janus execution behavior.
2. Verify per-step InvokeLLM/runtime semantics rather than inferring them from general
   Workflows marketing/docs.
3. If proven, move stage orchestration to durable jobs while retaining the same canonical
   stage executor and checkpoints.
4. Add explicit operator cancellation/termination semantics.

### P3 — debt
1. Clean repository lint/typecheck baseline.
2. Classify/close the 19 historical nonterminal Runs without rewriting history.
3. Rebuild golden-run gates only after CP-002 alignment and an invariant-passing Full run.

---

## 15. Audit Verdict

The timer failure mode is no longer active in executable Janus code.

The primary Janus path is now materially closer to the intended engine behavior than the
pre-timeout May implementation: it waits for completion, preserves finished work, refuses to
declare incomplete work complete, and can resume a failed execution from checkpoints.

The application is buildable now. The next correctness blocker is no longer timeout tuning;
it is **CP-002 protocol drift**, followed by proving a genuinely durable background
orchestration substrate.
