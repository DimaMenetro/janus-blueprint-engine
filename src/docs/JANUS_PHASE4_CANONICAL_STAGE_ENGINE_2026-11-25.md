# Janus Phase 4 — Canonical Stage Engine + Foundational Security
- Document Type: Implementation Record (Phase 4 exit artifact) · Date: 2026-11-25 · Author: Kytheion (Scribe-Particle-4)
- Governs: plan §12, §13, §18.3, §21.2, Phase 4 · Builds on: Phase 3 durable stage model (unchanged)
- Status: COMPLETE after the correction tranche in §8 (automated evidence only — no paid run was made). §2.4, §3.2 and §7 below are superseded where §8 says so.

## 1. Structure
| Layer | Module | Role |
|---|---|---|
| Boundary | `lib/janus/evidenceBoundary.js` | Control plane / data plane. Seals untrusted records, quotes derived and operator text, checks block integrity. |
| Compiler | `lib/janus/stageCompiler.js` | The only prompt builder. Registry-derived. Declares each stage's inputs. |
| Runner | `lib/janus/stageRunner.js` | The only requester of the model call (served by backend function `invokeJanusStage`, see §7). begin → invoke → parse → validate → settle. Refuses an overlapping attempt. |
| Engine | `lib/janus/stageEngine.js` | `executeStage`, `driveStages`, `finalizeRun`. Scheduler-independent. |
| State | `lib/janus/executionState.js` | `stagePlan`, `deriveExecutionState`, `stageFailures`. Pure, derived from durable records. |
| Adapter | `lib/janus/browserAdapter.js` | Scheduling only: execute, resume, rerun synthesis, rerun blueprint, cancel, abandon. |
| Frontend | `ExecutionContext`, `BottomAccessory`, `ExecutionStatePanel`, `Results`, `NewQuery`, `RerunControls` | Observe durable state; no local progress counters. |

Removed: `ExecutionEngine.jsx`, `rerunEngine.jsx`, `domainSME.jsx`, `buildPrompt` (a monolithic prompt that was stored but never sent).

## 2. Semantics established
1. **One cognition.** Runs, resumes and reruns compile through `compileStage` and execute through `runStage`. Reruns now use the full prompts; the thinner rerun prompts are gone.
2. **Engine result states.** `{record}` settled success · `{failure}` settled failure · `{cancelled}` · `{unresolved}` live or never-recorded call.
3. **Resume.** Before every stage the engine re-reads durable state. A stage with a valid revision is not regenerated. A stage whose newest revision is still `running` stops the drive; nothing is started over it.
4. **Unresolved call after a lost session.** SUPERSEDED by §8.2: the outcome stays unknown and nothing replaces the call. (Original, withdrawn: the operator could confirm the session ended and the revision settled as `platform_termination`.)
5. **Waiting.** No deadline, race, abort or heartbeat judgment exists. Elapsed time is telemetry on RunAttempt.
6. **Cancel.** `cancel_requested` is persisted; the active call settles and its real outcome is saved; no further stage is scheduled; the run becomes `cancelled` at the boundary. With nothing in flight and no session scheduling, the boundary is immediate.
7. **Untrusted content.** Retrieved records and Refresh-derived text enter as JSON inside an `untrusted_external` block. Earlier-stage output and the query are marker-neutralized, line-quoted and delimited. Compilation aborts if blocks are not perfectly paired.
8. **Provenance.** As Phase 3, plus `provenance.origin` (execution | resume | rerun) and `provenance.sources` (evidence metadata; RunStage schema gained this optional field). Effective model is not exposed by the platform and is not recorded beyond the policy string.

## 3. Decisions (reviewable)
1. Refresh ON stays fail-closed in the adapter and in the compiler. The compiler holds the target Refresh prompt (analysis over a supplied source corpus); it cannot run until a retrieval provider is chosen (operator gate).
2. SUPERSEDED by §8.3: resume is for open runs only. (Original, withdrawn: resume was allowed for cancelled and failed runs and set them back to `running`.)
3. Run status rule is still interim and now uniform: no artifacts → `failed`, otherwise `completed` (a failed rerun no longer marks the whole run failed; the failed stage and its evidence are shown from stage records). Phase 5 replaces it.
4. `full_prompt` is no longer written for new runs. Historical runs keep theirs.
5. Ownership across browser tabs is not solved here (Phase 6). Within one session a run has one driver and a stage one live attempt.
6. Schema and display pair maps now derive from the registry (schema, markdown, Synthesis tab).

## 4. Exit tests (68/68, build passes)
| Exit test | Evidence (`stageEngine.test.js` unless noted) |
|---|---|
| Run and rerun share compiler/executor | identical prompts for the same stage; source guards on prompt building and model calls |
| No second roster or pair map | pair-id guard; roster guards in `protocolRegistry.test.js` |
| Untrusted text cannot rewrite policy | control skeleton identical under hostile evidence, Refresh text, stage output and query |
| Reload reconstructs durable truth | state derived from records alone; unresolved call blocks restart |
| Completed stage not regenerated | resume runs only the missing stage |
| No inference deadline | source guard; a call open for a simulated day stays running |
| No overlapping attempt | runner and adapter both refuse |
| Cancel after current stage | request persisted, call settles as succeeded, next stage never created |
| Frontend matches engine | row-for-row comparison; no progress counters in UI sources |
| Historical runs readable and untouched | adapter tests; live check: 69 runs, 16/19/34, no updates |

## 5. Not verified
- No live model call was made through the new engine. The first real run will be the first live evidence.
- The reload detection query and the new screens were not exercised in a browser.

## 6. Deferred by plan
Completion manifest and qualification → Phase 5. Retries, cross-session ownership, idempotency → Phase 6. Invalidation and impact preview → Phase 7. Truncation removal, Blueprint inputs → Phase 8/9.

## 7. Addendum — model call moved to a backend function (2026-11-25, after Phase 4 exit)
- **Why:** platform rule. Core integration calls other than file upload and signed URLs must run in a backend function. Raised by the security scan ("Core integration protection") and instructed by DIMA.
- **What moved:** only the call. `stageRunner.callLLM` now invokes backend function `invokeJanusStage` with `{ stage_id, prompt }`. Compiler, parsing, validation, persistence and scheduling are unchanged and stay in the browser.
- **Function contract:** signed-in caller; a stage the caller can read (RLS) whose status is `running`; prompt non-blank and at most 600,000 characters; forwards `{ prompt }` only, with the service role. A model failure returns its message (502). Any other failure returns a generic message plus a log reference.
- **Model policy** is now enforced at the server boundary: no model, file or web parameter can be passed.
- **New platform ceiling:** a function request is ended at 5 minutes. A stage call that runs longer now settles as a failure. Janus still adds no timer. How the browser sees that cut is unverified.
- **Evidence:** 69/69 tests, build passes. On the deployed function: 400 (missing or blank input), 404 (unknown or malformed stage), 409 (settled stage), 413 (oversized prompt), and the failure body reaches the runner as its message. Temporary records were removed (69 runs, 0 stages after).
- **Not verified:** the success path and the model-failure path. No model call was made (credit gate).
- **Reach:** the live app uses this only after it is republished.
- **Correction to this addendum:** it was written before the §8 tranche. The function contract is now operators only (§8.4), and the 5-minute ceiling is a limitation of an interim transport, not an accepted Janus deadline (§8.5).

## 8. Correction tranche (2026-11-25, Daionae/DIMA review) — Phase 4 closeout
The earlier "COMPLETE" status was premature: the three functional corrections below were outstanding, and the error-leak cleanup covered three of five diagnostic functions.

1. **Invalid output is a failure.** Parsed output that fails mandatory stage validation settles the RunStage as `failed` / `schema_failure` and the RunAttempt as `schema_failure`. The rejected output and its validation errors are kept on that failed revision for diagnosis. A failed revision is never active, so it is never read as cognition, and resume runs the stage again. A prior valid revision stays active. No retry budget was added (Phase 6).
2. **No operator-created `platform_termination`.** `abandonUnresolved`, `settleOrphanedStage` and the "Mark call as ended" control are deleted. A revision whose call outcome was never recorded stays `running` (unresolved). While any stage of a run is unresolved, nothing is started for that run: not a resume, not a rerun. `platform_termination` remains a valid evidence class that the app never fabricates. Safe orphan resolution is Phase 6.
3. **Terminal means terminal.** `resumeJanus` refuses `completed`, `failed`, `partial` and `cancelled` runs and never sets them back to `running`. `deriveExecutionState.resumable` is false for them; the panel says recovery is a re-run. Reruns remain the explicit revision-producing path (Phase 7 formalizes it).
4. **Backend endpoint contained.** `invokeJanusStage` returns 403 to non-admins before reading anything. The browser adapter applies the same rule before creating any record (execute, resume, rerun). The stage ownership/status check stays as defense in depth. Not to be widened until Phase 6 provides one durable owner and one attempt per stage. **Consequence: non-admin app users cannot run Janus for now.**
5. **Five-minute ceiling.** Recorded as a limitation of an interim transport. Janus adds no timer. A cut the platform actually reports is settled failure evidence, but Final Form must carry longer cognition; the Workflow/durable-server proof (Phase 10/11) resolves it.
6. **Diagnostic functions deleted:** `getAllErrors`, `checkRunFields`, `testPromptSize`, `testSynthesis`, `testCompressedSynthesis`. This removed the last Sonnet overrides, the service-role reads open to any signed-in user, and the remaining raw-error responses. The model-policy guard now scans `src/` and `base44/` and pins the list of backend files.
7. **Packages:** vite 6.4.6 installed; zod and @hookform/resolvers removed. **vitest 4.1.12 could NOT be installed:** the platform installer fails inside npm ("Cannot read properties of null (reading 'edgesOut')") on every attempt, including after removing vitest first. vitest was restored to 3.2.7, so that scan finding (medium, test tool only) remains open. Operator decision needed.

### Closeout evidence
| Check | Evidence |
|---|---|
| Full suite | 85/85 at Phase 4 close (102/102 after Phase 5) |
| Production build | passes |
| Historical Runs | 69, 16 failed / 19 running / 34 completed, newest update 2026-08-11; 0 RunStage, 0 RunAttempt |
| No Sonnet/Gemini override | guard test over `src/` and `base44/`; only the prohibition entry in the registry names Gemini |
| Terminal runs cannot resume | `terminal lifecycle boundary` tests (all four states) |
| Unknown outcome cannot be settled by hand | `resume from durable stage state` tests; the functions no longer exist |
| Invalid output is `schema_failure` | `truthful settlement` tests (4) |
| Endpoint operator-only | source guard + double; deployed function answers an admin normally (404 for an unknown stage) |
| Diagnostics not deployed | all five report "not found"; only `invokeJanusStage` exists |

### Not verified
- The deployed 403 for a non-admin caller (the test tool calls as the builder). Covered by source and by the test double only.
- No live model call. No manual browser pass. Lint: 6 historical unused-import errors in untouched files remain.
