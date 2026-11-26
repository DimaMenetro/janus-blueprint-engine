# JANUS PHASE 7 — Versioned Rerun & Dependency Invalidation (2026-11-26)
- Document type: phase record (Kytheion, Scribe-Particle-4). Governing plan: `JANUS_FINAL_FORM_ARCHITECTURE_IMPLEMENTATION_PLAN_v1.2_2026-09-29.md`, Phase 7.
- Authorization: DIMA, via Daionae (IC-001), 2026-11-25. Builder development only: no paid Janus execution, no probe Run, no retrieval provider, no historical mutation, no republication.
- Status: **CLOSED 2026-11-26 on the plan's five exit tests (§6.7) plus the live data-binding check (§7), under DIMA's instruction to close it if the criteria genuinely pass.** §2.1 was adjudicated by DIMA and is implemented (§6). §6.5 remains open for DIMA's ruling if desired. Limit: no pixel-level check of the screens with real data (§7).

## 0. Baseline confirmed before editing
- HEAD `0eb24d5`, 156/156, the six inherited test files byte-identical to `239319f` (104 tests), Phase 6 tests 52.
- Live data (read-only): 69 historical Runs (34 completed / 16 failed / 19 running), untouched. One staged Run: DIMA's Full L3 reference run `6b0780183aba68f84ea10cfc` — completed, `refinement_required`, unreleased, 14 succeeded stages, 14 attempts. Not written by this phase (no epoch, unchanged `updated_date`). The new staleness rule reports nothing stale on it.

## 1. Tranche 1, item 2 — the evaluation of a completed run (DONE)
**Invariant.** An interrupted evaluation after the run completed keeps its logical revision and its attempt budget. It is continued, not replaced, and never retried in secret.
**Why the existing behaviour could not satisfy it.** Phase 6 let a revision wait only on an open run (`status: running`). The evaluation runs after the run is `completed`, so recovery closed it as failed, and the next `finalizeRun` started a new evaluation revision with three fresh calls (a hidden retry of an exhausted evaluation).
**Change (smallest that holds it).**
- `executionState.continuableFor(run, stageKey)`: run stages may wait on an open run, the evaluation on a completed run. `stageRunner` (live never-started retry and recovery) and `deriveExecutionState` use it. Run Resume still never reaches a completed run (`qualificationAwaiting` is separate from `awaiting`).
- `qualification.deriveQualification` adds `evaluationAction`: `continue` (waiting), `start` (this Blueprint version never had an evaluation that made a call), `new_version` (the last one for this version settled failed, or its result was lost), or null. `needsEvaluation` is now `action === "start"`, so the engine never re-evaluates on its own after a settled failure.
- `stageEngine.evaluateStage` + `browserAdapter.evaluateJanus`: the dedicated pathway. Continue goes through `verifyContinuation` (same fingerprint, dependencies, template and protocol checks), then `continueStage` (slot, claim, recorded outcome, bounded retry). `new_version` needs `{ newVersion: true }`. Refused when the run is not completed, the Blueprint is stale or incomplete, the call is unresolved, or an evaluation already exists. A mismatch returns `blocked` with no write. `closeBlockedRevision` now also closes a blocked evaluation on a completed run. The run's lifecycle is never touched.
- Screens: QualificationPanel shows "Continue evaluation", "Run evaluation" or "Start a new evaluation version" (operators only).
- **Phase 6 test changed under this directive (1):** "a run that has ended is never resumed, so a retry left pending there is closed…" now asserts the evaluation keeps revision 1 waiting for attempt 2. Marked in the file. No other Phase 6 test changed.
- **Cancellation:** a completed run is not cancellable (Phase 2 transition table), so an evaluation in progress on it has no cancel control. A cancelled or cancelling run settles a waiting evaluation from its last call, as before. A separate evaluation-cancel axis was not invented.

## 2. Tranche 1, item 1 — Resume vs explicit new revision
### 2.1 CONFLICT FOR DIMA'S ADJUDICATION (RESOLVED 2026-11-26: see §6; the text below is the record of the conflict as raised)
The pinned assertion, `src/lib/janus/stageEngine.test.js` lines 238–250, "resume does not treat the invalid revision as completed: the stage runs again":
```
await driveStages({ runId, keys: ["cogito"], origin: "execution" });   // cogito invalid 3 times → revision 1 failed, exhausted
await resumeJanus(run.id);
expect(h.llm.stages).toEqual(["cogito", "blueprint", "qualification"]);
expect(viewOf(run.id).stageInfo.cogito.active).toMatchObject({ revision: 2, status: "succeeded" });
```
- **Why it conflicts.** The cogito revision is exhausted (schema_failure ×3). Plain Resume creates revision 2 with three fresh calls. An uninterrupted session would not have done that: it would have continued to the Blueprint and closed the run as partial. So the interruption buys new attempts, which is what the directive forbids.
- **Why no additive solution exists.** The assertion requires that `resumeJanus(runId)`, with no other argument and no other operator action, regenerates the exhausted stage. Any change that makes Resume stop doing that fails this assertion. Any distinction that keeps it (for example by failure class) would be a heuristic invented to dodge the oracle.
- **Proposed replacement.** Resume continues only what an uninterrupted session would have done. It never regenerates a settled failed revision (exhausted or non-retryable): it continues the remaining plan and closes the run. The failed stage then comes back only through the explicit Phase 7 re-run, behind its impact preview. Proposed assertions:
  ```
  await resumeJanus(run.id);
  expect(h.llm.stages).toEqual(["blueprint"]);                        // as the uninterrupted session would have run
  expect(viewOf(run.id).stageInfo.cogito.latest).toMatchObject({ revision: 1, status: "failed" });
  expect(h.db.Run[0].status).toBe("partial");
  await rerunStages(run.id, { targets: ["cogito"], cascade: true });  // explicit new revision
  expect(viewOf(run.id).stageInfo.cogito.active).toMatchObject({ revision: 2, status: "succeeded" });
  ```
  The "invalid output is not treated as completed" part of the original test is kept (cogito never counts as completed).
- **Done meanwhile (additive, permitted).** The explicit new-revision path exists (§3). The Resume control now says before it is clicked when it would start a new version of a failed stage, and with which evidence and how many attempts. The new staleness rule (§3.2) also makes today's behaviour honest: a Blueprint compiled while Cogito had failed is stale once Cogito gets a new revision, so it is never qualified.

## 3. Phase 7 — versioned re-run and dependency invalidation
### 3.1 Traversal
`src/lib/janus/rerunImpact.js` (pure). It works from the exact recorded `depends_on` revision IDs, traversed transitively, plus the compiler's declared inputs (§3.2). Its output:
- `plan`: stages that get a new revision;
- `supersedes`: the current revisions those replace;
- `invalidated`: active revisions that become stale and are not regenerated;
- `alreadyStale`;
- `unaffected`;
- `qualification`: `{ next: unchanged | re_evaluated | blocked, evaluationInvalidated, releaseWithdrawn }`;
- `refusals`;
- `token`: the run status, the epoch, the release and every revision id with its status.

### 3.2 Staleness rule added (change of assumption)
**Invariant.** A revision compiled without one of its declared inputs is invalidated when that input later gets a valid revision.
**Why the existing rule could not satisfy it.** Staleness only covered superseded recorded dependencies. A Blueprint built while Cogito had failed recorded no Cogito revision, so it stayed "current" after Cogito was produced, and it would have been evaluated and could have been released.
**The rule.** `runView.deriveStageGraph` flags a revision when its compiler declares input K, it recorded no K revision, and K's active revision was created after it. This is decided from recorded IDs plus the store's creation order. It never applies to historical artifacts, and never to records without a creation time. The preview applies the same rule, so preview and invalidation agree. It changes no inherited outcome, and it flags nothing on the reference run.

### 3.3 Execution
`browserAdapter.previewRerun`, `rerunStages(runId, { targets, cascade, expected })`. The existing `rerunSynthesis` and `rerunBlueprint` go through the same core.
- New revisions only; old revisions are byte-identical afterwards.
- A cascade regenerates an affected stage only if it actually became stale (`driveStages` `force: { dependents }`). A failed upstream revision invalidates nothing and regenerates nothing.
- If the durable state differs from the approved preview, the run is refused with nothing written.
- Initiation is one conditional write on the new `Run.graph_epoch`: of two initiations from the same state exactly one proceeds.
- Refused: beside an unresolved or waiting revision, after `cancel_requested`, for stages outside the run's plan, and for non-operators (refused before any write).
- Historical Runs: never written (no epoch). Revisions are added beside them as before.

### 3.4 Screens
- Every re-run shows its impact before execution, both the Synthesis and Blueprint controls and a per-stage "Re-run…" in Stage lineage (operators, staged runs): new versions, becomes stale, already stale, unchanged, the qualification and release effect, and an optional "also regenerate the stages it makes stale". Confirm executes exactly that preview; if it has gone stale, the preview is recomputed.
- Stage lineage shows "Versions (n)" per stage: state, origin, time, calls, fingerprint, and the output on demand.
- **UI change to note:** the "Run Synthesis" button is hidden on staged Quick and Standard runs, whose plan has no synthesis. Re-runs are limited to the run's plan, so it would be refused.

## 4. Evidence
- 177/177 = 104 inherited (byte-identical to `239319f`) + 52 Phase 6 (1 changed under directive item 2) + 21 Phase 7 (`phase7.test.js`).
  - Branching (Animus: exact affected and unaffected sets).
  - Cascade (Cogito: exact plan, reuse of Corpus and Refresh, fresh evaluation and release).
  - Failed new revision (nothing invalidated, release stands).
  - Missing-input staleness.
  - Synthesis control through the same computation.
  - Stale preview; concurrent initiation, plus the store-level claim.
  - Interrupted re-run, resolved from the record.
  - Cancellation; plan, evaluation and empty-target refusals; non-operator.
  - Historical Run.
  - The evaluation pathway: never-started retry, three interruptions to exhaustion, no hidden retry, identity mismatch and explicit close, unresolved call, gate refusals, concurrent continuation, lifecycle untouched.
- Production build passes. Lint is clean on changed files; the 4 historical unused-import errors are in untouched files.
- `invokeJanusStage` is unchanged. No timers, heartbeats or deadlines were added. `ENGINE_VERSION` is now `janus-engine/2.0-phase7`. It is a provenance label only; no identity check reads it.
- Diff: 15 files changed (+294 / −153), plus 7 new files (`rerunImpact.js`, `phase7.test.js`, 5 components). Entity change: `Run.graph_epoch` (number).
- Not verified: the screens with real data. The preview browser session cannot read DIMA's run; it showed "Run not found" under row-level security. No manual pass. No live model call.

## 5. Limits carried forward
- Resume semantics for settled failed revisions: resolved in §6.
- Concurrent **resume** from two tabs may still open two attempts that the function refuses (Phase 6 limit). Resume was not given the epoch claim: that would write the Run on a blocked resume, which a Phase 6 test pins as write-free.
- A re-run on an open run closes it through `finalizeRun`, as before Phase 7 (unchanged behaviour).
- External-evidence continuation stays blocked; the five-minute transport ceiling stays fail-safe and unresolved; the 20k Blueprint context truncation and the reference run's synthesis and Blueprint deficiencies stay with Phases 8 and 9.

## 6. Resume correction (DIMA's adjudication of §2.1, 2026-11-26)
### 6.1 Invariant
Resume is execution continuity. A retry is another attempt of the same revision. Only an explicit re-run creates a new revision. Recovery reads and settles; it creates nothing. The original guarantee stays: a failed or invalid revision never counts as completed.
### 6.2 Why the existing behaviour could not satisfy it
`driveStages` regenerated every stage without a valid revision. On Resume that gave an exhausted or non-retryable failed stage revision n+1 with three fresh calls, which an uninterrupted session would never have made.
### 6.3 Change (three small pieces, no new entity field, no new mechanism)
- `executionState.rerunOnly(stage, attempts)`, pure, from the attempt ledger and the existing bounded policy: a failed revision whose operation is spent (limit used, or a failure the policy never retries, or no recorded call).
- `stageEngine.driveStages`: without `force`, a stage whose newest revision is `rerunOnly` and that has no valid revision is not regenerated. The drive continues the rest of the plan and the run closes from what exists (`partial` or `failed`), as the uninterrupted session would have closed it. An open run whose only unfinished stages are such failures is closed by Resume with no call.
- `rerunImpact`: a re-run is refused on a run that is still open ("Resume it first"). Reason: a re-run closes the run when it ends, so on an open run it ended the run before its unexecuted stages ever ran. Continuity first, regeneration after. Proven by test; nothing is written on refusal.
- Screens: the Resume notice now says which failed stages Resume leaves alone and that a new version comes from Stage lineage → Re-run. `deriveExecutionState.next` never points at such a stage.
### 6.4 Inherited test replaced (the only one; authorized by DIMA)
`stageEngine.test.js`, "resume does not treat the invalid revision as completed: the stage runs again" → "…and does not replace it: only an explicit re-run does". Old expectation no longer authoritative: Resume produced Cogito revision 2. The replacement is stronger on the original guarantee: after Resume the invalid revision is still failed, is not active, is not an artifact, the run is `partial` (not completed), nothing is released; then the explicit cascade re-run produces revision 2 (origin `rerun`), keeps revision 1, rebuilds the Blueprint from it, and the run completes. The reason is written above the test. `git diff 239319f` on the six inherited files now shows exactly this one test; the other five files are byte-identical.
### 6.5 Two retained behaviours DIMA should know about (not changed, both pinned by Phase 6 tests)
- **Operator-closed revision.** After `closeBlockedRevision` (a waiting revision that can no longer be continued, closed by the operator's explicit "close this version to start a new one"), Resume does start revision n+1. That revision is failed with its limit NOT spent, so `rerunOnly` is false. On an open run that record can only come from that explicit decision (every other path that settles a revision with budget left requires a cancelled or ended run). If DIMA wants this to go through the re-run control as well, it needs a narrow authorization for the Phase 6 test "a blocked revision needs the operator's explicit decision…".
- **Revisions for which no call was ever made** (`cancelled / not_started`) and **a paid result that was lost** (`cancelled / artifact_not_recorded`) are not failures. Resume still runs those stages. The first bought nothing. The second is one paid call whose artifact exists nowhere; Resume giving it a new revision is unchanged Phase 6 behaviour.
### 6.6 Concurrency
No new mechanism. Re-run initiation: the epoch claim (§3.3). Resume from two sessions: the server slot refuses the second call (`run_busy`), that session's attempt is voided and its revision closes `not_started`; one call, one succeeded revision, and it is the active one that the evaluation and the release point at. New test proves it. A duplicate revision NUMBER can exist as a `not_started` record; it is never active.
### 6.7 Exit standard, with the test that proves each line (182/182)
| Criterion | Proof |
|---|---|
| explicit re-run creates revision n+1 | phase7 "the explicit re-run is what replaces it"; branching; cascade |
| Resume never creates n+1 to escape failure | phase7 "Resume after an exhausted revision / a non-retryable failure"; replaced inherited test |
| prior valid revisions preserved; no overwrite | phase7 branching (records byte-equal after) |
| failed newer revision does not erase the older valid one | phase7 "a failed new revision invalidates nothing"; inherited "a prior valid revision stays active" |
| exact downstream invalidation; unaffected branches valid | phase7 branching (exact sets, preview = actual) |
| stale state has a causal reason | `stale` strings ("superseded by", "compiled without"); phase7 missing-input test |
| downstream re-run reads current dependency revisions | phase7 cascade (`depends_on` of new revisions) |
| no budget reset through re-run/resume confusion | Resume tests above; resilience "a re-run never starts beside a revision that is waiting"; evaluation tests |
| no conflicting active revisions under concurrency | phase7 "two initiations", "a second session cannot create a conflicting active revision" |
| historical Runs untouched | phase7 + engines historical tests; live read: 69 (34/16/19), newest update 2026-08-11 |
| suites and build | 104 inherited (1 replaced) + 52 Phase 6 (untouched this pass) + 26 Phase 7; build passes; lint clean |
### 6.8 Live data observed (read-only)
- 69 historical Runs unchanged. Reference run `6b0780183aba68f84ea10cfc` unchanged.
- A second staged run exists that this work did not create: `6b07cabc0e1fd52012766c16`, Full, created 2026-11-26 05:59 UTC, open, with an Actus call in flight at attempt 2 after a `schema_failure` on attempt 1 when read. It was not written, reconciled or resumed from here.

## 7. Live data-binding check (2026-11-26, read-only, before any Phase 8 edit)
Method: a read-only copy of both real staged runs (Run, RunStage, RunAttempt) was put through the real view model (`composeRunView`, `deriveExecutionState`, `deriveQualification`, `rerunImpact`) and the real panels (`ExecutionStatePanel`, `QualificationPanel`, `StageLineagePanel`, rendered to markup). The script was temporary and is removed. Nothing was written.
- Reference run `6b0780183aba68f84ea10cfc`: Protocol-complete, 14/14 stages, 14 active revisions, nothing stale, six pairs; qualification `refinement_required`, 12 of 13 criteria, not released, strongest objection shown. Re-run previews: Animus alone makes exactly 8 revisions stale and leaves 4 untouched, evaluation blocked; Cogito with cascade plans 11 stages and leaves 2; Blueprint alone leaves 12 and is re-evaluated. Each agrees with the recorded `depends_on` IDs.
- Open run `6b07cabc0e1fd52012766c16`: read as "Unresolved call", 7/13 saved, Actus in progress (attempt 2 of 3), "Check recorded outcome" and "Cancel after current stage" offered, Resume not offered, every re-run refused ("a call for actus has not settled"), not a release candidate.
- Limit: this proves the binding of real records to the screens' content. It is not a visual check: the builder preview session cannot read DIMA's runs ("Run not found" under row-level security).
