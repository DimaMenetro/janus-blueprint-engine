# Janus Phase 6 — Failure, Retry, Cancellation & Ownership Semantics
- Document Type: Implementation Record · Date: 2026-11-25 · Author: Kytheion (Scribe-Particle-4)
- Governs: plan §12, §18.1, Phase 6 · Builds on: Phase 3 stage/attempt model, Phase 4 engine, Phase 5 qualification
- Behavioural baseline: commit `239319f` (104/104)
- Status: COMPLETE (closed 2026-11-25 on DIMA's review and directive, see §8). 156/156 tests, build passes. Automated evidence only: the live model path is pending evidence (§7). Not published. No model call made.

## 1. Correction record (why this pass was stopped and restarted)
The first Phase 6 pass (commits `8c6fa39`, `07e05fa`, `f42832c`) was stopped by DIMA. What was wrong, stated plainly:
1. **Simplification-driven rewrite.** The recovery computation was judged "convoluted" and rewritten for compactness. That is not a basis for changing Janus.
2. **Inherited tests were edited to fit new code.** In `stageEngine.test.js`: the request-contract assertion was changed, the guard against fabricating `platform_termination` was loosened to admit a new path, and both operator-containment tests were deleted.
3. **A failure class was inferred.** An HTTP error with no recorded outcome was settled as `platform_termination`.
4. **Scope was added without authorization.** A quota failure halted all later stages.
5. **Work continued from red tests.**

Corrections made in this pass:
- All six inherited test files restored byte-identical to `239319f` (`git diff 239319f` on them is empty). They pass unmodified.
- The inferred `platform_termination` path is removed. The app names no call-failure class at all.
- The quota halt is removed. A quota failure is settled and not retried; scheduling is otherwise as before.
- The operator-only containment is restored exactly (function and adapter).
- The request contract is `{ stage_id, prompt }` again, as the inherited tests require.
- `recoverStage` is written from the truth table in §4, with the cases kept apart.

## 2. Invariants
1. **Unknown outcome = unresolved.** An HTTP error the function did not author, an abnormal return, a lost response, or a claimed attempt with nothing recorded means the call may still be alive. Then: the attempt stays in flight, the stage stays running, the run's slot stays taken, and there is no retry, no replacement and no failure evidence.
2. **An attempt is settled only from evidence:** (a) what the function itself stated; (b) what the function recorded on the attempt; (c) proof that no call was made, namely closing the attempt while still unclaimed in one conditional write.
3. **One live call per staged run; one call per RunAttempt, ever.**
4. **Retry only after the previous attempt actually settled,** only for retryable evidence, at most 3 attempts per revision.
5. **Nothing is decided by elapsed time.** No timer, deadline or heartbeat. Timestamps are telemetry.
6. **Historical Runs are never written.**

## 3. Mechanism
| Piece | Where | Role |
|---|---|---|
| Slot | `Run.active_attempt_id`, taken and freed in `invokeJanusStage` | One conditional write (`free → attempt id`). Freed only after the outcome is recorded. |
| Claim | `RunAttempt.claim_state` (`unclaimed → claimed`, or `→ void`) | One conditional write by the function. The stage must have exactly one open attempt, unclaimed. |
| Record | `RunAttempt.transport`, `response_text` | Written by the function when the call settles: the evidence recovery reads. |
| Classification | `invokeJanusStage` (`provider_error` / `quota_failure`), `stageRunner.resolveTransport` (parse / schema) | The class comes from where the evidence is. The app infers none. |
| Retry | `lifecycleContract.retryDecision`, `stageRunner.work` | Attempts strictly in sequence inside one revision; decision recorded on each attempt. |
| Recovery | `stageRunner.recoverStage`, `browserAdapter.reconcileJanus`, "Check recorded outcome" | Reads and settles. Never starts a call. |
| Cancellation | function refuses new calls; `work` stops retries; `driveStages` stops scheduling | An active call still lands its real outcome. |
| Telemetry | attempts on the run view; attempt counts in the execution panel | Observability only. |

Store behaviour was measured against the real store before relying on it: of four concurrent conditional writes exactly one reports `updated: 1`; `""` does not match a missing field; `{ $in: ["", null] }` does. SDK 0.8.54 (the function's version) has `updateMany`. The test double implements exactly this subset.

## 4. `recoverStage` truth table
| Last attempt of the revision | What is known | Result |
|---|---|---|
| 1. In flight, never claimed | No call was made | Attempt closed atomically (`void` / `not_started`). Stage closed as not started. No failure. |
| 2. In flight, record: returned | The actual response | Parsed, validated and settled from the record (success, or parse/schema failure). |
| 3. In flight, record: failed | The actual failure class | Settled as that class. |
| 4. In flight, claimed, no record | Nothing. It may be alive | Unresolved. Nothing is written. Slot stays taken. |
| 5. Case 1, with an earlier settled attempt | That earlier outcome | The revision keeps the earlier actual outcome. No new outcome invented. |
| No attempt open | The last settled call | Settled from it. If a success was recorded nowhere: closed as `artifact_not_recorded` (not a success, not a provider failure). |

Case 6 (cancellation): no new attempt after `cancel_requested`; an active attempt keeps its real outcome.

**Superseded in part by §8:** in cases 3 and 5, and in case 2 when the recorded response fails parsing or validation, the *attempt* is settled as shown, but the *revision* is settled only when the bounded policy says so. With budget left on an open run it stays running and waits for attempt n+1.

## 5. Exit tests (`resilience.test.js`, 33 tests; inherited 104 unmodified)
| Exit criterion | Evidence |
|---|---|
| Long waits do not self-fail | week-long open call; inherited day-long test |
| Only settled failures are retry candidates | `lost` / `http` cases: one attempt, no retry |
| Retry only after settlement | attempt-by-attempt record; next `started_at` ≥ previous `ended_at` |
| Quota / terminal failures not retried | quota test; recorded termination test |
| No overlap with an unresolved attempt | inherited test; gate test |
| One Run cannot own two calls | `run_busy` refusal while a call is live |
| One RunAttempt cannot buy two calls | simultaneous requests (staged and historical); spent attempt |
| Cancellation stops scheduling | four cancellation tests, including cross-session |
| Age alone cannot fail a run | 2020-dated claim; source scan for timers and time comparisons |
| Lost session does not manufacture failure | `lost`, `http`, `unreached`, `rejected` cases |
| Recovery uses durable evidence only | truth-table tests, cases 1–5 |
| Prior artifacts intact | snapshots of the saved stage before and after recovery |
| 69 historical Runs untouched | live count 69 (16 / 19 / 34), newest update 2026-08-11, none carries the slot field |

## 6. Decisions put to DIMA (all three decided 2026-11-25, see §8)
1. **Lifting the operator-only containment.** The ownership mechanism is in place underneath it. Lifting it means retiring the two inherited tests under "interim containment: operators only until durable stage ownership (Phase 6)" and the admin assertions in "the model call runs in one narrow backend function". That is an edit to the oracle and needs explicit authorization. Until then non-admin users cannot run Janus.
2. **Recovered retryable failure.** Recovery settles the revision as that failure and buys nothing. The stage runs again only on the operator's Resume, as a new revision with its own bound of 3. Alternative: Resume continues the same revision at attempt n+1 (strict bound of 3 across the orphaning), which needs the revision's prompt recompiled and proven identical by fingerprint. Not built; needs a decision.
3. **Quota failure and later stages.** Now: not retried, later stages still scheduled (unchanged behaviour). The stopped pass halted the run on quota; that was removed as unauthorized. Say if a halt is wanted.

## 7. Not verified / known limits
- **Deployed function:** only refusals were called (400, 404; both return `evidence: not_started`). The slot, claim and record path has never run against the live store from the function. Verifying it needs either a real call (paid, on hold) or a temporary probe Run in the live data (not done without approval).
- The deployed 403 for a non-admin is covered by source and by the double only.
- If the platform ends a function request at 5 minutes, nothing is recorded and the run stays unresolved with its slot taken. There is no way yet to obtain affirmative termination evidence, so such a run cannot be resolved by the app. That is correct under invariant 1 and is a limitation of the interim transport (Phase 10/11).
- `transport_settled_failure` and `platform_termination` remain valid evidence classes that nothing currently assigns.
- Two sessions reconciling the same never-claimed attempt can both close the stage as not started (same value written twice).
- No manual browser pass. Lint: the 6 historical unused-import errors in untouched files remain.

## 8. Closeout (2026-11-25, DIMA review and directive)
DIMA accepted the correction pass and decided the three items in §6.

### 8.1 Decisions
1. **Operator-only containment is retained** as an intentional operator policy (Janus is private; DIMA is the admin). It is not a Phase 6 gate. The two inherited containment tests stay. The ownership machinery stays underneath it.
2. **A recovered retryable failure continues the SAME revision** (§8.2). The behaviour in §6.2 ("new revision with its own bound of 3") was wrong and is removed.
3. **Live verification of the function is pending evidence**, to be gathered in a later approved integration test. No probe Run was created. Not a reason to alter the implementation.
4. **Five-minute transport ceiling:** unchanged fail-safe. No outcome recorded means unresolved. No termination evidence is manufactured. The limitation belongs to the durable server/workflow work.
5. Quota: unchanged (settled, not retried, no halt).

### 8.2 Same-revision retry continuation
A RunStage revision is one logical operation, fixed by its dependency revision IDs, protocol version, prompt-template version and input fingerprint. A RunAttempt is one execution of it. Losing the session is not a new operation.

| Last actual call of the revision | Attempt records | Revision |
|---|---|---|
| succeeded | `none` | settled succeeded |
| non-retryable failure | `none` | settled failed |
| retryable, budget exhausted | `exhausted` | settled failed |
| retryable, budget left, run cancelling / cancelled / ended / historical | `none`, real outcome kept | settled failed (cancellation boundary, or no resume can follow) |
| retryable, budget left, run open | `retry_scheduled` | **not settled**: stays running, waiting for attempt n+1 |

- **The record of "next valid operation is attempt n+1"** is `retry_scheduled` on the last attempt that made a call, on a revision that is still running with nothing in flight. It is read by `executionState.continuationOf`, never stored separately. The policy is recomputed from the recorded outcome and the number of calls made, so the record alone cannot extend the budget.
- **The budget is counted in calls of the revision.** An attempt that never made a call (`not_started`) uses none. The next attempt number is calls made plus one, so no attempt number above 3 can exist and an interruption cannot reset the count.
- **Recovery** (`recoverStage`) settles the attempt and stops. It starts no call.
- **Resume** (`driveStages`) continues a waiting revision before anything else, through `stageEngine.verifyContinuation`: the stage is rebuilt from the exact dependency revisions recorded on it, compiled, and fingerprinted. It is continued (`stageRunner.continueStage`, same RunStage id, normal slot/claim path) only if protocol version, template version, dependency revisions and fingerprint all match.
- **Mismatch fails closed.** The drive ends `blocked`: nothing is opened, settled or regenerated. The operator's explicit action (`closeBlockedRevision`, "Close this version to start a new one") closes the revision from the real outcome of its last call; Resume then produces a new revision. That action is refused while the revision can still be continued, so it cannot reset a budget.
- **Cancellation:** a waiting revision is closed from its last real outcome and no attempt is opened, whichever session persisted the cancellation.
- **Re-runs** refuse to start beside a waiting revision.
- **Screens:** the stage shows "retry pending (attempt n of 3)"; a blocked continuation shows its reasons.

### 8.3 Consequences Kytheion wants DIMA to see (implemented, flagged for review)
1. **A retry that could not start in a live session also leaves the revision waiting.** If attempt 1 settles as retryable and the request for attempt 2 never reaches the function, the revision used to be settled failed after one call, and a later Resume would make revision 2 with three fresh attempts. That is the same budget reset by an interruption, so it now waits for attempt 2 like the recovered case. This changed one Phase 6 test that DIMA had reviewed ("a retry that never started changes nothing").
2. **Phase 6 tests changed for this directive (4):** that one, and truth-table cases 2 (invalid recorded response), 3 and 5, which asserted the superseded "revision settled failed". Each still asserts the same attempt outcome. No inherited test was touched.
3. **An exhausted or non-retryable revision on a still-open run** is settled failed, and Resume then generates a new revision of that stage. That is inherited baseline behaviour ("resume does not treat the invalid revision as completed: the stage runs again") and was not changed.
4. **A retry left pending on an ended run** (in practice the quality evaluation, which runs after the run is `completed`) is closed from its real outcome, because an ended run is never resumed.

### 8.4 Evidence at close
- 156/156: the 104 inherited tests with all six files byte-identical to `239319f`, plus 52 Phase 6 tests (19 new in "same-revision retry continuation").
- Production build passes. Lint clean on changed files.
- `invokeJanusStage` unchanged in this pass.
- 69 historical Runs untouched (16 failed / 19 running / 34 completed, newest update 2026-08-11), none staged, none with a slot; 0 RunStage, 0 RunAttempt.

### 8.5 Known limits carried forward
- Live slot → claim → InvokeLLM → record path: pending evidence.
- Two tabs resuming the same waiting revision in the same instant each open an attempt; the function then refuses both (it requires exactly one open attempt), no call is made, and the revision keeps waiting.
- A revision that read external evidence cannot be continued (its text is not stored) and blocks. Refresh is fail-closed today, so this cannot occur yet; it must be revisited with the retrieval work.
