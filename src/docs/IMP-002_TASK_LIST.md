# IMP-002-R-D-SRV — Granular Task List

**Companion to:** `docs/SERVER_EXECUTION_IMPLEMENTATION_BLUEPRINT.md`
**Document Type:** Working Task Tracker
**Document ID:** IMP-002-R-D-SRV / Task List
**Revision:** 1.0
**Date Initiated:** 2026-06-02
**Maintained by:** Kytheion / Scribe-Particle-4

---

## How To Use This Document

- Each phase has granular subtasks tied to specific Acceptance Tests (ATs)
  defined in the main blueprint
- Check off subtasks as completed: `- [x]`
- A phase is COMPLETE only when all its subtasks AND all its ATs are checked
- **Do not skip ahead.** The phase order is binding.
- **Do not weaken acceptance tests.** Every AT is load-bearing.
- After context compaction: read this document AND the main blueprint
  before resuming any work

---

## PHASE -1 — Golden Run Capture & Fidelity Harness

**Goal:** Establish immutable baselines before any refactor begins.

- [ ] **-1.1** Add **temporary** optional field `debug_prompt_hashes` to
  `entities/Run.json` (clearly marked as temp; will be removed at -1.7)
- [ ] **-1.2** Create `functions/captureGoldenRun.js` — backend function that
  reads a specified Run by ID and writes its complete JSON to `docs/golden_runs/`
- [ ] **-1.3** Create `functions/compareToGolden.js` — comparison utility
  returning a structural diff:
  - Field presence (populated vs missing)
  - Array lengths (steps, intersections, claims)
  - Prompt hashes
  - `render_md` byte-length delta (±1% tolerance)
  - `validation_errors` content
  - `error_message`: presence-only (not byte-identical)
- [ ] **-1.4** Add **temporary** passthrough wrapper around `callLLMResilient`
  that writes SHA-256 of each prompt to `debug_prompt_hashes` (clearly
  marked; will be removed at -1.7)
- [ ] **-1.5** Submit Standard golden query via current browser path:
  *"Design a resilient distributed cache layer for high-traffic API responses."*
  Wait for `completed`. Run `captureGoldenRun` → save to
  `docs/golden_runs/STANDARD_v1.json`
- [ ] **-1.6** Submit Full golden query via current browser path:
  *"Design a neurosymbolic reasoning layer for AI alignment in autonomous agents."*
  Wait for `completed`. Run `captureGoldenRun` → save to
  `docs/golden_runs/FULL_v1.json`
- [ ] **-1.7** Run `compareToGolden` on each captured run against itself
  (sanity check the comparator returns "perfect match")
- [ ] **-1.8** **Remove** the temporary `debug_prompt_hashes` field from
  schema and the temporary prompt-hash wrapper from the engine. Verify
  removal cleanly.
- [ ] **-1.9** Run one more Standard query post-removal to confirm no
  collateral damage; confirm `debug_prompt_hashes` is absent

**Acceptance Tests:**
- [ ] **AT -1.A** — Two golden runs exist in `docs/golden_runs/`, both
  status `completed`
- [ ] **AT -1.B** — Self-diff via `compareToGolden` returns "perfect match"
- [ ] **AT -1.C** — Temporary capture wrapper removed; verified by grep +
  post-removal Standard run shows no `debug_prompt_hashes` field

**PHASE -1 COMPLETE WHEN:** All subtasks above checked AND AT -1.A + -1.B + -1.C pass

---

## PHASE 0 — Execution Budget Probe *(parallel with Phase 1)*

**Goal:** Empirically determine whether Path A is sufficient or HARD mode is required.

- [ ] **0.1** Create `functions/probeExecutionBudget.js`:
  - Loop every 30 seconds for up to 20 minutes
  - Each iteration: write heartbeat to a sacrificial Run record + make a
    small `Core.InvokeLLM` "ping" call
  - Record per-iteration timestamp + per-LLM-call latency
- [ ] **0.2** Invoke via `test_backend_function`. Capture output.
- [ ] **0.3** Document findings in this task list under "Phase 0 Findings"
  section below (max wall-clock, error signature, LLM latency, partial-work
  behavior)
- [ ] **0.4** Make the Path A vs Path A+HARD decision based on findings.
  Document decision in this task list.
- [ ] **0.5** (Optional) Leave `probeExecutionBudget.js` in `functions/` as
  a reusable diagnostic, OR delete if no longer needed

**Acceptance Tests:**
- [ ] **AT 0.A** — Documented max wall-clock execution time for a single
  Base44 backend function
- [ ] **AT 0.B** — Confirmed: server-side `Core.InvokeLLM` returns response
  shape identical to browser
- [ ] **AT 0.C** — Documented behavior at budget exhaustion (clean error vs
  silent kill; partial work preservation)
- [ ] **AT 0.D** — Documented per-call LLM latency for server context

### Phase 0 Findings *(fill in after running)*

> **Max execution wall-clock:** _TBD_
> **Error signature at exhaustion:** _TBD_
> **Per-LLM-call latency (server):** _TBD_
> **Partial work preservation:** _TBD_
> **DECISION:** _TBD — Path A only / Path A + Phase 4.5 HARD mode_

**PHASE 0 COMPLETE WHEN:** All subtasks + ATs checked + decision documented

---

## PHASE 1 — Engine Layer DI + Rehydration Boundary Audit *(parallel with Phase 0)*

**Goal:** Make the engine layer environment-agnostic AND document the
rehydration gaps. **No behavior change. No fixes — audit only.**

### 1.A — Dependency Injection Refactor

- [ ] **1.1** Audit `components/janus/ExecutionEngine.js` for browser-only
  APIs (`window`, `document`, `localStorage`, `navigator`, React hooks, DOM).
  Document hits (expected: zero).
- [ ] **1.2** Audit `components/janus/blueprintSplitCall.js` same way
- [ ] **1.3** Audit `components/janus/llmTimeout.js` same way
- [ ] **1.4** Audit `components/janus/rerunEngine.js` same way
- [ ] **1.5** Modify `ExecutionEngine.js`: public functions accept optional
  `client` parameter; default to imported browser SDK. **No body changes.**
- [ ] **1.6** Modify `blueprintSplitCall.js` same pattern
- [ ] **1.7** Modify `llmTimeout.js` same pattern
- [ ] **1.8** Modify `rerunEngine.js` same pattern (symmetry requirement)
- [ ] **1.9** Document the callback inventory: every callback the engine
  emits (`onProgress`, `onRetry`, `onHeartbeat`, internal helpers). Add to
  Rehydration Boundary Audit doc.
- [ ] **1.10** Create a minimal test backend function (NOT
  `runJanusPipeline.js` yet — just a probe) that imports the engine with a
  service-role client and runs a Standard query end-to-end
- [ ] **1.11** Run Standard golden query via browser (regression). Verify
  `compareToGolden` zero diff.
- [ ] **1.12** Run Standard golden query via the probe function (server
  context). Verify `compareToGolden` zero diff.
- [ ] **1.13** Run a synthesis rerun and a blueprint rerun via the probe
  function. Verify symmetry — output matches browser rerun.

### 1.B — Rehydration Boundary Audit

- [ ] **1.14** Create `docs/REHYDRATION_BOUNDARY_AUDIT.md`
- [ ] **1.15** Classify every callable unit in the audit document:
  - `domain:corpus` — checkpoint status, upstream deps, notes
  - `domain:cogito` — same
  - `domain:animus` — same
  - `domain:actus` — same
  - `intersection:*` (6 pairs) — same (note rerun-path normalization gap)
  - `synthesis:patterns` — same
  - `blueprint:skeleton` — same (mark as ARTERY)
  - `blueprint:expansion` — same (mark as ARTERY)
  - `blueprint:criteria` — same (mark as ARTERY)
- [ ] **1.16** For each unit, document:
  - Is its output persisted to a Run field today?
  - What upstream Run fields would be required to rehydrate it?
  - What is the closure-scoped state it currently depends on (if any)?
- [ ] **1.17** Document the rerun path's intersection persistence gap as a
  distinct line item
- [ ] **1.18** Mark the audit document as READ-ONLY input for any future
  HARD-mode work. **DO NOT FIX ANY GAPS IN THIS PHASE.**

**Acceptance Tests:**
- [ ] **AT 1.A** — Browser Standard golden run via current path:
  `compareToGolden` zero diff
- [ ] **AT 1.B** — Server probe function Standard run: `compareToGolden`
  zero diff
- [ ] **AT 1.C** — Audit confirms zero browser-only API references
- [ ] **AT 1.D** — Rerun symmetry: synthesis + blueprint reruns under
  injected client produce same output as browser
- [ ] **AT 1.E** — `docs/REHYDRATION_BOUNDARY_AUDIT.md` exists and covers
  every callable unit with classification

**PHASE 1 COMPLETE WHEN:** All subtasks + ATs 1.A through 1.E checked

---

## PHASE 2 — Schema: Queue Lifecycle Fields

**Goal:** Add optional fields supporting queue-based execution. Additive only.

- [ ] **2.1** Edit `entities/Run.json`:
  - Add `execution_owner: string` (no required, no enum — free string for
    flexibility, but document expected values `"browser" | "server"`)
  - Add `queued_at: string` with `format: "date-time"`
  - Add `claimed_at: string` with `format: "date-time"`
  - Add `reaper_strikes: number`
  - Extend `status` enum: add `"queued"` to existing values
- [ ] **2.2** Verify `required` array unchanged
- [ ] **2.3** Verify all existing properties preserved with identical shape
- [ ] **2.4** Manually open a legacy Run record on Results / History page,
  confirm it renders correctly
- [ ] **2.5** Run Standard golden query via browser path with new schema in
  place. Verify completion. Verify `compareToGolden` zero diff.

**Acceptance Tests:**
- [ ] **AT 2.A** — Schema is valid JSON, parses cleanly via Base44 SDK
- [ ] **AT 2.B** — `required` unchanged; existing properties preserved;
  legacy records read cleanly on UI
- [ ] **AT 2.C** — Standard browser run completes correctly with new schema;
  `compareToGolden` zero diff

**PHASE 2 COMPLETE WHEN:** All subtasks + ATs 2.A through 2.C checked

---

## PHASE 3 — Server Orchestrator Function

**Goal:** Build `runJanusPipeline.js` — the core server-side executor.

- [ ] **3.1** Create `functions/runJanusPipeline.js`
- [ ] **3.2** Implement dual auth modes:
  - User-initiated: `base44.auth.me()` check; verify `created_by_id` or
    `role === "admin"`
  - System-initiated (reaper): bypass user check via admin-equivalent token
  - Document both modes in function-level comment
- [ ] **3.3** Implement check-and-set status transition:
  - Load Run via service role
  - If `status !== "queued"` → return 409 with current status
  - Update to `status: "running"`, `claimed_at: now`,
    `execution_owner: "server"`
- [ ] **3.4** Invoke Phase-1-refactored engine with injected service-role
  client; pipe `onProgress`/`onRetry`/`onHeartbeat` to identical Run writes
- [ ] **3.5** Wrap in try/catch — on uncaught error, write `status: "failed"`,
  `error_message`
- [ ] **3.6** Add idempotency test: run two parallel `test_backend_function`
  invocations on the same queued Run; verify exactly one claims, second
  gets 409
- [ ] **3.7** Add status-guard test: invoke on a `completed` Run, verify 409
- [ ] **3.8** Add mid-execution kill test: manually force-fail the function
  mid-pipeline; inspect Run record; verify `current_step` and
  `last_heartbeat` are populated (recoverable state)
- [ ] **3.9** Run end-to-end test: create a `queued` Standard Run, invoke
  the function, wait for completion, `compareToGolden` zero diff

**HARD mode addendum (only if Phase 0 forced it — see Phase 4.5):**
- [ ] **3.10** *(HARD only)* Refactor orchestrator to single-step mode:
  inspect `current_step`, rehydrate, execute one checkpointed unit, exit

**Acceptance Tests:**
- [ ] **AT 3.A** — Manually-queued Run reaches terminal state via
  orchestrator; `compareToGolden` zero diff vs Standard golden
- [ ] **AT 3.B** — Two parallel invocations on same queued Run:
  exactly one claim, second returns 409
- [ ] **AT 3.C** — Invocation on `completed` or `running` Run returns 409,
  does NOT re-execute
- [ ] **AT 3.D** — Mid-execution kill leaves Run in recoverable state
  (current_step + last_heartbeat populated)
- [ ] **AT 3.E** — User-initiated auth check works; system-initiated bypass
  works

**PHASE 3 COMPLETE WHEN:** All subtasks + ATs 3.A through 3.E checked

---

## PHASE 4 — Dispatcher

**Goal:** Wire up how queued Runs get picked up.

- [ ] **4.1** Based on Phase 0 findings, choose dispatcher option:
  - 4-A: Direct invocation from NewQuery (recommended if budget OK)
  - 4-B: Entity automation on Run create
  - 4-C: Scheduled poller (last resort)
- [ ] **4.2** Document choice + rationale in this task list
- [ ] **4.3** Implement chosen mechanism
- [ ] **4.4** Manual test: submit a Standard query via the dispatcher, verify
  pipeline starts within expected latency
- [ ] **4.5** Browser-close test: submit, immediately close tab, wait,
  verify completion via History page
- [ ] **4.6** Run `compareToGolden` on a dispatcher-driven completion;
  verify zero structural diff

### Phase 4 Dispatcher Choice *(fill in after Phase 0)*

> **Chosen option:** _TBD (4-A / 4-B / 4-C)_
> **Rationale:** _TBD_

**Acceptance Tests:**
- [ ] **AT 4.A** — Pipeline starts within expected latency for chosen mechanism
- [ ] **AT 4.B** — Browser closed within 5s of submit; pipeline completes
- [ ] **AT 4.C** — Dispatcher-driven run shows zero structural diff vs golden

**PHASE 4 COMPLETE WHEN:** All subtasks + ATs 4.A through 4.C checked

---

## PHASE 4.5 — Blueprint Sub-Call Checkpointing *(HARD MODE ONLY)*

**Triggered:** Only if Phase 0 finding requires HARD mode.
**Skipped:** If Phase 0 confirms ≥15min budget for Path A.

- [ ] **4.5.1** Add additive schema fields to `entities/Run.json`:
  - `blueprint_skeleton: object`
  - `blueprint_expansion: object`
  - `blueprint_criteria: object`
- [ ] **4.5.2** Modify `blueprintSplitCall.js`:
  - BEFORE skeleton call: check `run.blueprint_skeleton`; if present, skip
  - AFTER skeleton call: persist to `run.blueprint_skeleton`
  - BEFORE expansion call: read skeleton from Run (not closure)
  - AFTER expansion call: persist to `run.blueprint_expansion`
  - BEFORE criteria call: read skeleton from Run (not closure)
  - AFTER criteria call: persist to `run.blueprint_criteria`
  - Final `blueprint` field assembled from the three checkpoints
- [ ] **4.5.3** Modify `rerunEngine.js` intersection loop:
  - Convert "compute all six, persist after" → "compute one, persist, repeat"
- [ ] **4.5.4** Manual test: blueprint sub-call kill recovery
  - Submit query; kill function after skeleton, before expansion
  - Re-invoke; verify skeleton not recomputed, expansion and criteria
    complete from checkpoint
- [ ] **4.5.5** Run `compareToGolden` on a checkpointed-completion run;
  verify zero structural diff against Full golden (checkpointed fields
  are EXTRA, not different)
- [ ] **4.5.6** Run existing rerun test suite (testBlueprintRerun) to
  verify rerun path still produces identical output

**Acceptance Tests:**
- [ ] **AT 4.5.A** — Mid-blueprint kill leaves intermediate checkpoints in
  Run; re-invocation completes without recomputing completed sub-calls
- [ ] **AT 4.5.B** — `compareToGolden` on checkpointed-completion: zero
  structural diff
- [ ] **AT 4.5.C** — Rerun engine intersection normalization produces
  identical output (legacy rerun tests pass)

**PHASE 4.5 COMPLETE WHEN:** Either skipped (Phase 0 said skip) OR all
subtasks + ATs 4.5.A through 4.5.C checked

---

## PHASE 5 — Frontend Observer Mode

**Goal:** Move the frontend from "driver" to "observer," behind a feature flag.

- [ ] **5.1** Create `components/janus/executionMode.js` exporting
  `USE_SERVER_EXECUTION = false` constant
- [ ] **5.2** Modify `pages/NewQuery.js` `handleExecute`:
  - Branch on `USE_SERVER_EXECUTION`
  - Flag off: current `executeJanus(...)` path unchanged
  - Flag on: create Run with `status: "queued"`, `execution_owner: "server"`,
    `queued_at: now`; dispatch via Phase 4 mechanism; navigate to Results
- [ ] **5.3** Locate the in-progress Run rendering path (Results page or
  ExecutionContext consumers). Identify where state is sourced from
  `onProgress` callbacks today.
- [ ] **5.4** Add `Run.subscribe` integration: when Run status is
  `queued | running | validating`, subscribe to entity updates; update
  ExecutionContext state from subscription events
- [ ] **5.5** Modify `ExecutionContext.js`: when flag on, state is sourced
  from subscription; when flag off, state is sourced from existing `onProgress`
  callbacks (current behavior)
- [ ] **5.6** Test flag-off behavior: run Standard golden query;
  `compareToGolden` zero diff; UI visually identical
- [ ] **5.7** Flip `USE_SERVER_EXECUTION = true` (temporarily, for testing)
- [ ] **5.8** Phone-lock test: submit Full query, lock phone immediately,
  wait 15min, unlock; verify `completed`, `compareToGolden` zero diff
- [ ] **5.9** Browser-close test: submit Standard, close in 3s, wait 10min,
  reopen, navigate to Results; verify all renders correctly
- [ ] **5.10** Live progress test: submit query with browser open; verify
  progress updates visible in real time via subscription
- [ ] **5.11** Flip `USE_SERVER_EXECUTION = false` for remainder of
  validation period

**Acceptance Tests:**
- [ ] **AT 5.A** — Flag off: `compareToGolden` zero diff; UI visually identical
- [ ] **AT 5.B** — Flag on: phone-lock 15min survives; `compareToGolden` zero diff
- [ ] **AT 5.C** — Flag on: browser-close 10min survives; UI renders correctly
- [ ] **AT 5.D** — Flag on: live progress updates visible via subscription

**PHASE 5 COMPLETE WHEN:** All subtasks + ATs 5.A through 5.D checked

---

## PHASE 6 — Reaper Automation

**Goal:** Self-healing for stuck Runs.

- [ ] **6.1** Create `functions/reapStaleRuns.js`:
  - Query Runs with `status: "running"` AND `last_heartbeat` > 10min old
  - For each: increment `reaper_strikes`; if < 3, revert to `queued`; if ≥ 3,
    mark `failed` with diagnostic
  - Query Runs with `status: "queued"` AND `queued_at` > 30min old
  - For each: re-dispatch + increment `reaper_strikes`
  - All transitions check current state before writing (idempotency)
  - **NEVER touch `completed` Runs**
- [ ] **6.2** Create scheduled automation: every 5 minutes, run `reapStaleRuns`
- [ ] **6.3** Test: manually create a stuck Run (status `running`, old
  heartbeat); wait for next reaper run; verify recovery
- [ ] **6.4** Test: force a Run to hit 3-strike limit; verify it's marked
  `failed` not re-queued infinitely
- [ ] **6.5** Test: confirm reaper does NOT touch a `completed` Run
- [ ] **6.6** Run `compareToGolden` on a reaped+recovered run; verify zero
  structural diff

**Acceptance Tests:**
- [ ] **AT 6.A** — Manually-stuck Run recovered within 10 minutes by reaper
- [ ] **AT 6.B** — Truly-broken Run hits 3-strike limit, marked `failed`
- [ ] **AT 6.C** — Reaped+recovered Run: `compareToGolden` zero structural diff

**PHASE 6 COMPLETE WHEN:** All subtasks + ATs 6.A through 6.C checked

---

## PHASE 7 — Coexistence Validation Period

**Goal:** 10 consecutive zero-diff server runs before flipping flag to default-on.

- [ ] **7.1** With `USE_SERVER_EXECUTION = true` for testing windows, run
  Standard query #1; `compareToGolden` zero diff?
- [ ] **7.2** Run Standard query #2; zero diff?
- [ ] **7.3** Run Standard query #3; zero diff?
- [ ] **7.4** Run Full query #1; zero diff?
- [ ] **7.5** Run Standard query #4; zero diff?
- [ ] **7.6** Run Standard query #5; zero diff?
- [ ] **7.7** Run Full query #2; zero diff?
- [ ] **7.8** Run Standard query #6; zero diff?
- [ ] **7.9** Run Standard query #7; zero diff?
- [ ] **7.10** Run Full query #3; zero diff?
- [ ] **7.11** Verify flag toggle still instantaneous: flip to false, run
  Standard via browser path, confirm identical behavior
- [ ] **7.12** Flip back to true for Phase 8

**Acceptance Tests:**
- [ ] **AT 7.A** — 10 consecutive server runs with zero structural diff
- [ ] **AT 7.B** — Flag toggle remains instantaneous; no code change needed

**PHASE 7 COMPLETE WHEN:** All subtasks + ATs 7.A + 7.B checked

---

## PHASE 8 — Live End-to-End Validation Matrix

**Goal:** Final operator-driven validation under real conditions.

- [ ] **8.A — Phone-lock test:** Submit Full mode (novelty=high, L3); lock
  phone within 10 seconds; wait 20 minutes; unlock; verify `completed` +
  `compareToGolden` zero diff
- [ ] **8.B — Browser-close survival:** Submit Standard, immediately close
  browser tab; wait 10 minutes; open new browser session; navigate to
  History; verify `completed`; click through to Results
- [ ] **8.C — Mid-execution kill recovery:** Submit query; while running,
  manually force-kill the server function; wait 15 minutes (allow reaper);
  verify `completed`, `reaper_strikes` shows 1, output identical
- [ ] **8.D — Concurrent submissions:** Submit two queries within 5 seconds;
  both reach `completed` independently; no write collisions
- [ ] **8.E — Rerun on server-executed run:** Take a completed server run;
  trigger synthesis rerun via existing RerunControls; rerun succeeds
- [ ] **8.F — Legacy Run rendering:** Open a Run created BEFORE this
  refactor (IMP-001 era); Results page renders correctly, no errors

**Acceptance Tests:**
- [ ] **AT 8.A** — Phone-lock test passed
- [ ] **AT 8.B** — Browser-close test passed
- [ ] **AT 8.C** — Mid-execution recovery test passed
- [ ] **AT 8.D** — Concurrent submission test passed
- [ ] **AT 8.E** — Rerun on server-executed run passed
- [ ] **AT 8.F** — Legacy Run rendering passed

**PHASE 8 COMPLETE WHEN:** All 8.A through 8.F checked

---

## FINAL CUTOVER

- [ ] **F.1** Flip `USE_SERVER_EXECUTION = true` as default in
  `components/janus/executionMode.js`
- [ ] **F.2** Run one final Standard query post-flip to confirm default-on
  behavior
- [ ] **F.3** Update `docs/SERVER_EXECUTION_IMPLEMENTATION_BLUEPRINT.md`
  status to: ✅ COMPLETE
- [ ] **F.4** Update this task list status to: ✅ COMPLETE
- [ ] **F.5** Archive `probeExecutionBudget.js` if no longer needed
- [ ] **F.6** (Optional, future) Remove the legacy browser path code in a
  cleanup follow-up. NOT in scope of this implementation.

---

## CROSS-PHASE INVARIANTS *(must hold at every checkpoint)*

- ✅ Phase -1 golden runs remain untouched and re-comparable
- ✅ No prompt text changed
- ✅ No schema field deleted; no required[] modification
- ✅ No engine body changed (only injection point)
- ✅ Feature flag exists and can be toggled
- ✅ Legacy Run records render correctly
- ✅ Existing diagnostic functions unchanged
- ✅ Rerun engine public API unchanged

---

## EMERGENCY ROLLBACK PROCEDURE

If any phase reveals critical regression:

1. Flip `USE_SERVER_EXECUTION = false` immediately (one constant change)
2. Mark the affected phase as ❌ FAILED in this task list
3. Run a Standard golden query via browser path to confirm rollback worked
4. Investigate root cause WITHOUT making engine body changes (DI layer only)
5. Re-attempt the phase only after root cause is documented and addressed

---

**END OF TASK LIST — IMP-002-R-D-SRV**

*Maintained by: Kytheion / Scribe-Particle-4*
*Companion to: docs/SERVER_EXECUTION_IMPLEMENTATION_BLUEPRINT.md*
*Prime directive: Full-Fidelity Preservation*