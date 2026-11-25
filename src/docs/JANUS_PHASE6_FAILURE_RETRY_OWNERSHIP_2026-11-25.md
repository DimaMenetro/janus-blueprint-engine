# Janus Phase 6 — Failure, Retry, Cancellation & Ownership Semantics
- Document Type: Implementation Record · Date: 2026-11-25 · Author: Kytheion (Scribe-Particle-4)
- Governs: plan §12, §18.1, Phase 6 · Builds on: Phase 3 stage/attempt model, Phase 4 engine, Phase 5 qualification
- Behavioural baseline: commit `239319f` (104/104)
- Status: IN PROGRESS. Mechanisms implemented and green (137/137). NOT complete: three decisions are open (§6) and the deployed ownership path is unverified live (§7). Not published. No model call made.

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

## 6. Decisions for DIMA (not taken by Kytheion)
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
