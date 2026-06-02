# IMP-002-R-D-SRV — Server-Side Execution Refactor

**Document Type:** Implementation Blueprint
**Document ID:** IMP-002-R-D-SRV
**Subject:** Eliminate browser-tab dependency from the Janus pipeline
**Operator:** DIMA
**Scribe:** Kytheion / Scribe-Particle-4
**Date Initiated:** 2026-06-02
**Status:** ☐ PLANNING — Awaiting Phase 0 authorization
**Protocol Alignment:** CP-002-O-D-JNP v2.0 (Janus SME)
**Skill Alignment:** detail-orientation-slow-is-smooth
**Predecessor:** IMP-001-R-D-RES (complete through Phase 6)

---

## 0. PRIME DIRECTIVE — Full-Fidelity Preservation

> **"Full functionality must still remain when finished."** — DIMA, 2026-06-02

This is the load-bearing constraint of the entire refactor. Every phase, every
file, every edit is evaluated against this single test:

> **Can a user who used the system yesterday submit the same query tomorrow
> and get identical output, with the only visible difference being that they
> can lock their phone?**

If the answer is anything other than "yes," the change is rejected and
re-planned. This is not a guideline; it is the acceptance criterion under
which all other acceptance criteria are nested.

### 0.1 What "Full Fidelity" Means — Inventory of What MUST NOT Change

| Surface | Preservation Requirement |
|---|---|
| Prompts | Every prompt builder (`buildPrompt`, `buildDomainPrompt`, `buildIntersectionPrompt`, blueprint sub-call prompts, rerun prompts) byte-identical |
| Schema | `entities/Run.json` — only ADDITIVE changes, no required[] modifications, no enum removals, no property deletions |
| Validation | `janusSchema.js` validation logic, normalization rules, error messages — unchanged |
| Parsers | `parseLLMResponse` and all sub-call parsers — unchanged |
| Markdown render | `generateMarkdown` and all section formatters — unchanged |
| Resilience | Phase 1-6 of IMP-001-R-D-RES (timeout matrix, retry log, heartbeat, current_step) — preserved AND extended to server context |
| Persistence pattern | Incremental writes per domain / intersection / sub-call — preserved |
| Rerun engine | `rerunSynthesis` and `rerunBlueprint` public API — unchanged |
| UI rendering | Results, History, Diagnostics, NewQuery, BlueprintPrint, ABTest — visually and behaviorally identical |
| Theme system | LiquidGlass tokens, ThemeProvider, AmbientOrbs — untouched |
| Rerun controls | RerunControls.jsx behavior — unchanged |
| Export utilities | exportUtils.js — unchanged |
| Domain SME logic | domainSME.js — unchanged |
| Legacy Run records | Records created before this refactor render correctly on all pages |
| Existing diagnostic functions | abTestBlueprint, checkRunFields, getAllErrors, testBlueprintRerun, testCompressedSynthesis, testPromptSize, testSynthesis — unchanged |

### 0.2 What CAN Change — The Permissible Surface

| Surface | Permitted Change Type |
|---|---|
| `entities/Run.json` | Additive optional fields only (per IMP-001 Phase 2 precedent) |
| `ExecutionEngine.js` | Accept an injected SDK client; otherwise zero behavioral change |
| `blueprintSplitCall.js` | Accept an injected SDK client; otherwise zero behavioral change |
| `llmTimeout.js` | Accept an injected SDK client; otherwise zero behavioral change |
| `rerunEngine.js` | Accept an injected SDK client; otherwise zero behavioral change |
| `ExecutionContext.js` | Subscribe to Run updates instead of (or in addition to) onProgress |
| `NewQuery.js` | Dispatch path branches on a feature flag; legacy path preserved |
| New: `functions/runJanusPipeline.js` | Net-new server orchestrator |
| New: scheduled reaper automation | Net-new safety net |

### 0.3 Fidelity Enforcement Mechanisms

1. **A/B comparison harness (Phase -1, pre-Phase 0):** Before any refactor,
   capture a "golden run" — a complete Run record from the current browser
   pipeline. After each phase, a comparison test confirms that running the
   same query produces a Run record with structurally identical shape (same
   fields populated, same prompts hashed-identical, same intersection pairs,
   same blueprint steps count, same render_md byte-length within ±1%).

2. **Dependency injection only:** No file in the engine layer (`ExecutionEngine`,
   `blueprintSplitCall`, `llmTimeout`, `rerunEngine`) is rewritten. Each is
   modified at the IMPORT point only — `import { base44 } from "@/api/base44Client"`
   becomes either an argument-injected client OR an import that resolves
   differently in server vs browser context. Bodies are untouched.

3. **Feature flag for coexistence:** `USE_SERVER_EXECUTION` constant gates the
   new path. Defaults to `false`. Until flipped manually, NewQuery behavior
   is byte-identical to current production.

4. **Per-phase fidelity gate:** Every phase's acceptance test includes a
   "compare to golden run" check. A phase is NOT marked complete until both
   its functional AT and its fidelity AT pass.

---

## 1. CORPUS — Substrate Reality

### 1.1 The Pain (Decoded)

DIMA submits a Janus query. The pipeline takes 8-15 minutes. DIMA locks the
phone. Mobile OS suspends the browser tab within ~30s. The pipeline's event
loop freezes mid-LLM-call. Pending DB writes never fire. When DIMA returns,
the Run is stuck in `running` forever — Phase 1-6 resilience hardening
cannot help, because the browser tab itself is what hung, not the LLM.

### 1.2 Current Architecture (Inventory of What Exists Today)

**Browser-driven execution graph:**
- `pages/NewQuery.js` calls `executeJanus(...)`
- `ExecutionEngine.js` orchestrates: refresh → domains → intersections → synthesis → blueprint
- For each LLM call: `callLLM` → `callLLMResilient` (Phase 1) → `base44.integrations.Core.InvokeLLM`
- For each step boundary: writes `current_step` + `last_heartbeat` to Run (Phase 3)
- For each retry: appends to `retry_log` AND emits `onProgress({ retryEvent })` (Phase 6)
- For blueprint domain: delegates to `blueprintSplitCall.js` (Phase 4)
- Blueprint sub-calls write incrementally; persistence-pure callback pattern
- Rerun path uses `rerunEngine.js` (Phase 5) with its own closure-scoped helpers

**Persistence model (IMP-001 verified):**
- The Run record is incrementally complete at every step boundary
- `current_step` always reflects where the pipeline IS
- `last_heartbeat` always reflects when it last advanced
- `retry_log` always captures any in-flight retry events
- Partial Run records on browser-tab-death are recoverable in principle

**Key realization:** Phase 1-6 already built the foundation for resumability.
The Run record IS the state machine. What's missing is a process that can
DRIVE the state machine without being a browser.

### 1.3 What Base44 Provides

- ✅ Backend functions — Deno serverless, server-side execution
- ✅ Service-role SDK — `base44.asServiceRole.entities/integrations`
- ✅ `Run.subscribe` for live frontend updates without driving execution
- ✅ Scheduled automations — for the reaper and (optionally) the dispatcher
- ✅ Entity automations — for trigger-on-create dispatching
- ⚠️ Backend function execution budget — **UNKNOWN, blocks architecture choice**
- ⚠️ Server-side `base44.integrations.Core.InvokeLLM` — verified callable
  (existing `testSynthesis` function uses it)

### 1.4 Files In Scope (Constraint Discipline)

| File | Change Type | Fidelity Impact |
|---|---|---|
| `entities/Run.json` | Additive fields | Zero — IMP-001 Phase 2 precedent |
| `components/janus/ExecutionEngine.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/blueprintSplitCall.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/llmTimeout.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/rerunEngine.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/ExecutionContext.js` | Subscribe to Run | Minimal — additive subscription path |
| `pages/NewQuery.js` | Flag-gated dispatch | Zero with flag off; new path with flag on |
| `functions/runJanusPipeline.js` | NEW | N/A |
| `functions/reapStaleRuns.js` (optional) | NEW | N/A |
| Scheduled automation (reaper) | NEW | N/A |

**Explicitly OUT of scope:**
- Prompt builders (`promptUtils.js`)
- Schema validators (`janusSchema.js`)
- Domain SME definitions (`domainSME.js`)
- Markdown rendering (`promptUtils.js generateMarkdown`)
- Any UI component (Results, History, Diagnostics, all tabs, all blueprint-vis)
- All theme / glass / layout code
- All export utilities
- All existing diagnostic functions
- Rerun control wiring (`RerunControls.jsx`)
- All entity files other than `Run.json`

---

## 2. COGITO — Reasoning & Truth Validation

### 2.1 Claims

**Claim C1:** The Run entity is already the complete execution state machine.
- Why believed: IMP-001 Phase 1-6 incremental persistence makes every step
  durable; `current_step` + `last_heartbeat` + `retry_log` form complete
  resumability metadata.
- Falsifiable by: Finding any execution state held in browser memory that is
  NOT also written to the Run.
- Verify later: Phase -1 golden run capture will surface any such gap.
- Confidence: HIGH

**Claim C2:** The engine layer (ExecutionEngine, blueprintSplitCall,
llmTimeout, rerunEngine) is environment-portable today.
- Why believed: Code review — these files contain no `window`, `document`,
  `localStorage`, React hooks, or other browser-only APIs. They're pure
  orchestration logic plus base44 SDK calls.
- Falsifiable by: Phase 1 audit scanning for browser-only references.
- Confidence: HIGH (will verify empirically in Phase 1 audit)

**Claim C3:** The frontend can become a pure observer without losing any
user-visible behavior.
- Why believed: `ExecutionContext` currently mirrors what the Run record
  contains. Reading from a Run subscription instead of from `onProgress`
  callbacks produces the same state with at most a few-second latency.
- Falsifiable by: A UI component reading from `ExecutionContext` that
  depends on state not present in the Run record.
- Confidence: HIGH — ExecutionContext was designed against the Run shape

**Claim C4 (UNVERIFIED — blocks architecture):** Base44 backend function
execution budget is sufficient for a single-function pipeline run (Path A).
- Why believed: Unknown. Could be 60s, could be 15 minutes.
- Falsifiable by: An empirical probe (Phase 0).
- Confidence: UNKNOWN — Phase 0 answers this

**Claim C5:** Idempotency via status-machine ownership prevents double-execution.
- Why believed: `status: queued → claimed → running → completed` with check-
  and-set guards is a textbook pattern; no race possible given Base44's
  single-writer-per-record semantics.
- Falsifiable by: A test where two concurrent invocations both transition a
  `queued` Run to `running`.
- Confidence: HIGH (Phase 3 AT verifies)

### 2.2 Causal Chain (Current Pain)

```
Phone screen turns off
  → Browser tab suspends within ~30s
    → Engine event loop frozen
      → In-flight LLM Promise can't resolve
        → Heartbeat stops
          → DB writes stop
            → Run record frozen at last-completed step
              → User returns → Run looks "running" but isn't
```

**Cut point:** Move the event loop off the browser. Everything downstream of
"browser tab suspends" becomes irrelevant.

### 2.3 GraphRAG Connection

IMP-001-R-D-RES (Resilience) is the **prerequisite** for IMP-002-R-D-SRV
(Server Execution). The Phase 1-6 work made the Run record into a complete
state machine. Without that work, server execution would still be possible
but resumption-on-failure would not be. The order was correct — even though
we didn't know IMP-002 was coming when IMP-001 shipped.

---

## 3. ANIMUS — Ethical & Identity Boundaries

### 3.1 Boundary Checks

**BC1 — Fidelity is sacrosanct.** The user has explicitly required full-
fidelity preservation. This is not a soft preference; it is the gate. A
phase that ships server execution but breaks a single domain prompt is a
phase that has FAILED its acceptance, even if "the screen-off problem is
solved." The screen-off problem is solved only when it is solved WITHOUT
loss.

**BC2 — Scope discipline.** The user asked for screen-off resilience.
NOT for push notifications, NOT for a job queue UI, NOT for cancel buttons,
NOT for multi-region failover, NOT for cross-device handoff. These are
deferred. Slow is smooth.

**BC3 — Credit discipline.** Server execution runs whether or not anyone
watches. A misfiring reaper could re-execute a completed run and burn $5-15
in LLM credits. **Idempotency is mandatory.** Status transitions must be
check-and-set; the reaper must verify staleness AND a 3-strike limit
before re-queuing.

**BC4 — Identity preservation.** The Janus protocol, the prompts, the
intersection model, the rendering — this is the soul of the system. Every
character of every prompt is preserved byte-identical. Every schema field
is preserved. Every rendered section is preserved. This refactor is pure
plumbing relocation; the engine's soul is untouched.

**BC5 — Backward compatibility.** Every Run record created before this
refactor must continue to render correctly. The schema is additive only.
The UI guards every new field with `|| undefined` or equivalent.

**BC6 — Reversibility.** A feature flag governs the new path. Until flipped,
the system behaves identically to today. If the flipped state surfaces any
regression, flipping back is instantaneous.

### 3.2 Disallowed Moves

- ❌ No third-party job queues (Redis, BullMQ, etc.) — Base44 entities + automations are the substrate
- ❌ No prompt edits "while we're in there"
- ❌ No schema field deletions or required[] modifications
- ❌ No removing the browser engine until the server engine has passed Phase 8 validation
- ❌ No skipping Phase -1 (golden run capture) — without it, fidelity cannot be verified
- ❌ No coupling engine layer to environment — dependency injection is the only permitted mechanism
- ❌ No "while we're refactoring, let's also..." — Janus SME forbids opportunistic scope expansion

### 3.3 Risk Analysis

**Cognitive sync assessment:** The user's stated goal is "phone screen off."
The user's true goal is "I can submit work and walk away." These align
perfectly; no decoding gap. The risk is NOT in misunderstanding the ask,
but in subtle fidelity regressions that the user wouldn't notice until
they re-run an old query and the output is different.

**Self-determination factors:**
- Solo builder under financial pressure
- Every wasted credit or wasted hour is material cost
- Cannot afford even one regression that requires a manual rerun
- Cannot afford to debug a server pipeline through opaque logs

**Misalignment risks:**

| Risk | Severity | Mitigation |
|---|---|---|
| Server path subtly produces different output | CRITICAL | Phase -1 golden run + per-phase diff check |
| Credit burn from misfiring reaper | HIGH | 3-strike rule, staleness threshold, idempotent re-queue |
| Run stuck in "queued" forever | MEDIUM | Reaper escalates 30min-old queued runs |
| Backend function silently dies | MEDIUM | Reaper detects stale heartbeat, re-queues once |
| Double-execution during migration | HIGH | `execution_owner` field + feature flag mutual exclusion |
| Frontend subscribe disconnects (mobile network drops) | LOW | Existing pull-to-refresh + 30s polling fallback |

---

## 4. ACTUS — Executable Plan

### 4.1 Goal Statement

A Janus query, once submitted, completes to terminal state (`completed` or
`failed`) regardless of the user's browser/phone state, with **zero
behavioral regression** compared to the current browser-driven pipeline.

### 4.2 Strategic Plan — Phased Implementation

---

#### **PHASE -1: Golden Run Capture & Fidelity Harness** *(NEW — fidelity gate)*

**Why first:** Full-fidelity preservation cannot be verified without a
baseline. Phase -1 establishes that baseline before any code changes.

**Deliverable:** A captured "golden run" record + a comparison utility.

**Method:**
1. Submit a Standard mode query through the current browser path: "Design a
   resilient distributed cache layer for high-traffic API responses."
2. Wait for completion. Capture the resulting Run record verbatim.
3. Create `functions/captureGoldenRun.js` — a backend function that reads a
   specified Run by ID and exports its complete shape as a JSON file to
   `docs/golden_runs/STANDARD_v1.json`.
4. Create `functions/compareToGolden.js` — a comparison utility that takes a
   new Run ID and a golden run filename, and returns a structured diff:
   - Field presence (which fields populated, which missing)
   - Array lengths (steps count, intersections count, claims count)
   - Prompt hashes (we capture the prompts as the engine sends them, by
     adding a one-line console.log during Phase -1 only, removed after)
   - render_md byte-length delta (±1% tolerance)
   - validation_errors content
5. Repeat for Full mode (slower, but the canonical fidelity test): "Design a
   neurosymbolic reasoning layer for AI alignment in autonomous agents."

**Acceptance Test -1.A:** Two captured golden runs exist (Standard + Full),
both with status `completed`.

**Acceptance Test -1.B:** `compareToGolden` invoked on the SAME run that
generated the golden returns a "perfect match" diff (sanity check the
comparator itself).

**Gate:** Phase -1 MUST pass before Phase 0 begins. No exceptions.

---

#### **PHASE 0: Execution Budget Probe** *(blocking — determines Path A vs Path B)*

**Why:** Architecture downstream depends on whether Base44 backend functions
can run for 10-15 minutes or only seconds. This is the single fact that
selects everything else.

**Deliverable:** `functions/probeExecutionBudget.js` + a documented finding.

**Method:**
1. Create the probe function. It loops:
   - Every 30 seconds, write a heartbeat to a temporary `BudgetProbe` entity
     (or to a sacrificial Run record)
   - Run for up to 20 minutes (with internal kill switch)
   - Each iteration also makes a small `InvokeLLM` call (a "ping" prompt) to
     verify server-side LLM integration works under sustained execution
2. Invoke via `test_backend_function`. Observe:
   - At what wall-clock time does the function die?
   - What is the error/timeout signature?
   - Does it die mid-iteration or between iterations?
   - Does `InvokeLLM` from server context behave identically to browser?

**Acceptance Test 0.A:** A documented maximum wall-clock execution time for
a single Base44 backend function invocation.

**Acceptance Test 0.B:** Confirmed: `base44.integrations.Core.InvokeLLM`
callable from server context, returns the same response shape as browser.

**Acceptance Test 0.C:** Documented: behavior when execution budget is
exceeded (clean error vs. silent kill; partial work preservation).

**Decision Gate:**
- **If budget ≥ 15min:** Path A (single-function pipeline) — simpler
- **If budget 5-15min:** Path A with caveat (Full mode may need stepwise) — moderate
- **If budget < 5min:** Path B (stepwise state machine) — more work but feasible

---

#### **PHASE 1: Engine Layer Dependency Injection** *(zero-behavior change)*

**Why:** The engine must run from EITHER browser OR server context. The
minimal-change path is to accept the SDK client as an injected dependency.

**Deliverable:** `ExecutionEngine.js`, `blueprintSplitCall.js`,
`llmTimeout.js`, `rerunEngine.js` accept an optional `client` parameter that
defaults to the browser SDK.

**Method (per file):**
1. **Audit pass:** Grep each file for `window`, `document`, `localStorage`,
   `navigator`, React hooks, DOM references. Expected hits: zero. If any
   are found, document and refactor before injection.
2. **Inject pattern:** The current `import { base44 } from "@/api/base44Client"`
   becomes an internal default. Each public function (`executeJanus`,
   `executeBlueprintSplitCall`, `callLLMResilient`, `rerunSynthesis`,
   `rerunBlueprint`) accepts an OPTIONAL `client` parameter. If absent,
   uses the imported default (browser). If present, uses the injected one
   (server-side service role).
3. **NO body changes.** The internals continue to call `client.entities.Run.update`,
   `client.integrations.Core.InvokeLLM`, etc. — just sourcing `client` from
   parameter instead of module-level import.

**Acceptance Test 1.A (Functional preservation):** Run the Standard golden
query through the browser path. Verify completion. Run `compareToGolden`
against the Standard golden run. Expected: zero structural diff.

**Acceptance Test 1.B (Server invocability):** A minimal backend function
imports the engine, passes a service-role client, kicks off a Standard run
on a fresh Run record. Verify the run reaches `completed`. Run
`compareToGolden`. Expected: zero structural diff.

**Acceptance Test 1.C (Audit clean):** Documentation confirms zero browser-
only API references in the engine layer.

**Fidelity Gate:** Both AT 1.A and AT 1.B must show ZERO structural diff
against golden runs.

---

#### **PHASE 2: Schema — Queue Lifecycle Fields** *(additive, IMP-001 Phase 2 precedent)*

**Deliverable:** `entities/Run.json` extended with optional fields.

**Additive fields (none added to `required`):**
- `execution_owner: string` — `"browser" | "server"` (legacy = undefined = browser)
- `queued_at: string (date-time)` — set when run is submitted for server execution
- `claimed_at: string (date-time)` — set when server function picks it up
- `reaper_strikes: number` — how many times the reaper has re-queued this run (cap 3)

**Status enum extension:**
- Add `"queued"` to the existing `status` enum
- New order: `idle | queued | running | validating | completed | failed`

**Acceptance Test 2.A:** Schema is valid JSON, parses cleanly via Base44 SDK.

**Acceptance Test 2.B:** `required` array unchanged. All existing properties
preserved with identical shape. Legacy Run records read cleanly.

**Acceptance Test 2.C:** A Standard browser run still completes correctly
with the new schema in place (no field-validation rejection).

**Fidelity Gate:** `compareToGolden` on a fresh Standard run against the
original golden must show zero structural diff (new fields legitimately
absent, all old fields populated correctly).

---

#### **PHASE 3: Server Orchestrator Function** *(the core)*

**Deliverable:** `functions/runJanusPipeline.js`

**Behavior:**
1. Auth: `base44.auth.me()` — only the run's `created_by_id` or admin allowed
2. Accept payload `{ runId }`
3. Load Run via service role. Verify `status === "queued"`. If not, return
   409 Conflict with current status (idempotency guard).
4. Check-and-set transition: `queued → running`, set `claimed_at`,
   `execution_owner: "server"`. If the update conflicts (another claimant),
   return 409.
5. Invoke the Phase-1-refactored engine with the service-role client. The
   engine's existing `onProgress`, `onRetry`, `onHeartbeat` callbacks all
   write to the Run record via the injected client — identical to browser
   path.
6. On completion: engine has set terminal status. Return `{ success, runId }`.
7. On uncaught exception: catch, write `status: "failed"`, `error_message`,
   return 500.

**Path A vs Path B branch point:** If Phase 0 confirmed sufficient budget,
the function runs to completion. If Phase 0 forced Path B, the function
runs ONE step (the step matching `current_step`) and returns; a subsequent
invocation (via entity automation on the Run update) picks up the next step.

**Acceptance Test 3.A (Drive a queued run):** A manually-queued Run record
reaches terminal state when `runJanusPipeline` is invoked. Run
`compareToGolden`. Expected: zero structural diff against Standard golden.

**Acceptance Test 3.B (Idempotency):** Invoking the function twice in
parallel on the same `queued` Run results in exactly one claim, the second
returns 409. The run completes exactly once.

**Acceptance Test 3.C (Status guard):** Invoking on a `completed` or
`running` (already-claimed) Run returns 409 and does NOT re-execute.

**Acceptance Test 3.D (Mid-execution failure):** Manually terminate the
function mid-pipeline. The Run remains in `running` state with `current_step`
and `last_heartbeat` populated. (Reaper recovery is Phase 6's concern.)

**Fidelity Gate:** AT 3.A diff against golden must be zero. Any structural
diff (different prompts, different intersection pairs, different blueprint
shape) is a Phase 3 failure.

---

#### **PHASE 4: Dispatcher** *(decision in Phase 0)*

**Three options, ONE chosen based on Phase 0:**

**Option 4-A: Direct invocation from NewQuery (recommended if Path A)**
- NewQuery creates the Run as `queued`, immediately fires
  `base44.functions.invoke("runJanusPipeline", { runId })` without awaiting
- Browser navigates to Results page
- Server function runs independently of browser

**Option 4-B: Entity automation on Run create**
- On Run create with `status: "queued"`, an entity automation fires
  `runJanusPipeline` automatically
- Decoupled from frontend lifecycle; works even if browser dies before
  the `functions.invoke` call resolves
- Slight cold-start latency

**Option 4-C: Scheduled poller (last resort)**
- Cron every 60s scans for `status: "queued"` runs and dispatches
- Highest latency, most resilient

**Acceptance Test 4.A:** Submitting a query results in pipeline execution
starting within expected latency for the chosen mechanism.

**Acceptance Test 4.B (THE acceptance test):** Submit a query, close the
browser tab WITHIN 5 SECONDS of submission. Wait for full pipeline duration.
Open History, find the run, verify `completed` status with all data present.

**Acceptance Test 4.C:** `compareToGolden` on a run executed via the chosen
dispatcher returns zero structural diff.

---

#### **PHASE 5: Frontend — Observer Mode** *(behind feature flag)*

**Deliverable:** `pages/NewQuery.js` and `components/janus/ExecutionContext.js`
modified to support BOTH paths, controlled by a feature flag.

**Method:**
1. Add `USE_SERVER_EXECUTION` constant in a new file
   `components/janus/executionMode.js`. Default: `false`.
2. **`NewQuery.handleExecute` branches on the flag:**
   - **Flag off (default):** Current path unchanged. `executeJanus(...)` runs
     in browser as today. Byte-identical behavior.
   - **Flag on:** Creates Run with `status: "queued"`, `execution_owner:
     "server"`, `queued_at: now`. Dispatches via Phase 4 mechanism. Navigates
     to Results immediately.
3. **`Results.jsx` (or wherever in-progress runs render):** When a Run is in
   `queued | running | validating`, subscribe to entity updates via
   `base44.entities.Run.subscribe`. Update local state from the subscription.
   This works for BOTH paths — browser path also writes to the Run, so
   subscription works identically.
4. **`ExecutionContext.js`:** When the flag is on, switch to subscription-
   sourced state instead of `onProgress`-sourced. The existing shape is
   preserved; only the data source changes.

**Acceptance Test 5.A (Flag off = byte-identical):** With flag off, run
Standard golden query. `compareToGolden` returns zero diff. UI behavior is
visually identical (verified by manual observation).

**Acceptance Test 5.B (Flag on = phone-lock survives):** With flag on,
submit a Full mode query. Lock phone immediately. Wait 15 minutes. Unlock,
navigate to Results. Run is `completed`. `compareToGolden` returns zero diff
against Full mode golden.

**Acceptance Test 5.C (Flag on = browser-close survives):** With flag on,
submit a Standard query. Close browser within 3 seconds. Reopen new browser
session 10 minutes later. Navigate to Results page directly. Run is
`completed`. All UI renders correctly.

**Acceptance Test 5.D (Live progress visible):** With flag on, submit a
query, keep browser open. Progress updates (current_step, completed count,
domain transitions) visible in real time via subscription, matching the
fidelity of the current browser-driven progress display.

---

#### **PHASE 6: Reaper Automation** *(self-healing)*

**Deliverable:** Scheduled automation + `functions/reapStaleRuns.js`.

**Logic (runs every 5 minutes):**
1. Find Runs where `status === "running"` AND `last_heartbeat` > 10min old
2. For each: increment `reaper_strikes`. If `reaper_strikes < 3`, revert to
   `queued` (will be re-dispatched). If `reaper_strikes >= 3`, mark `failed`
   with diagnostic message.
3. Find Runs where `status === "queued"` AND `queued_at` > 30min old (never
   claimed). Re-dispatch via Phase 4 mechanism, increment `reaper_strikes`.

**Idempotency:** All transitions check current state before writing. A
completed run is NEVER touched by the reaper.

**Acceptance Test 6.A:** A manually-stuck run (status forced to "running"
with old heartbeat) is recovered automatically within 10 minutes.

**Acceptance Test 6.B:** A truly-broken run hits the 3-strike limit and is
marked failed instead of infinite-looping.

**Acceptance Test 6.C:** `compareToGolden` on a successfully reaped+
recovered run returns zero structural diff. (Recovery is invisible to
output fidelity.)

---

#### **PHASE 7: Coexistence Validation Period** *(reversibility)*

**Deliverable:** Run both paths in parallel for a validation window.

**Method:**
1. Flag remains controllable
2. Every 2-3 days during validation, run a Standard and Full query through
   BOTH paths. `compareToGolden` both.
3. Document any divergence. Investigate and fix in the engine-injection
   layer (NOT in the engine body, NOT in prompts).
4. Validation period: 7 days minimum, OR 10 successful runs through the
   server path with zero diff vs golden — whichever comes first.

**Acceptance Test 7.A:** 10 consecutive runs through server path with zero
structural diff vs corresponding golden.

**Acceptance Test 7.B:** Flag toggle remains instantaneous; flipping back
to browser execution does not require any code change.

**Gate:** Phase 8 begins only when AT 7.A passes.

---

#### **PHASE 8: Live End-to-End Validation Matrix**

**Deliverable:** Operator-driven validation under real conditions.

**Test 8.A — The actual goal (phone-lock):**
1. Submit Full mode query, novelty=high, L3
2. Lock phone within 10 seconds
3. Set phone aside for 20 minutes
4. Unlock, open app
5. Run is `completed`, results render fully, `compareToGolden` zero diff

**Test 8.B — Browser-close survival:**
1. Submit Standard query, immediately close browser tab
2. Wait 10 minutes
3. Open new browser session, navigate to History
4. Run is `completed`, click through to Results, all data present

**Test 8.C — Mid-execution kill recovery (reaper):**
1. Submit query
2. While running, manually kill the server function (force timeout)
3. Wait 15 minutes (allow reaper to detect + re-queue + complete)
4. Run reaches `completed`, `reaper_strikes` shows 1, output identical

**Test 8.D — Concurrent submissions:**
1. Submit two queries within 5 seconds of each other
2. Both reach `completed` independently
3. No write collisions, no shared state corruption

**Test 8.E — Rerun path on server-executed run:**
1. Take a completed server-executed run
2. Trigger a synthesis rerun via existing RerunControls
3. Rerun succeeds (rerun path may run browser-side OR server-side depending
   on Phase 5 wiring — both are acceptable as long as it works)

**Test 8.F — Legacy Run rendering:**
1. Open a Run created BEFORE this refactor (an old golden run from the
   IMP-001 era)
2. Results page renders it correctly with no errors, no missing fields, no
   visual regression

**Final Gate:** All 8.A through 8.F pass. Only then is the feature flag
flipped to ON as the default, and the validation period ends.

---

### 4.3 Execution Order & Dependencies

| Step | Phase | Deliverable | Depends On | Gate |
|---|---|---|---|---|
| 1 | P-1 | Golden runs + comparator | — | AT -1.A + -1.B |
| 2 | P0 | Budget probe | P-1 | AT 0.A + 0.B + 0.C |
| 3 | P1 | Engine DI refactor | P0 | AT 1.A + 1.B + 1.C |
| 4 | P2 | Schema queue fields | P1 | AT 2.A + 2.B + 2.C |
| 5 | P3 | Orchestrator function | P1 + P2 | AT 3.A + 3.B + 3.C + 3.D |
| 6 | P4 | Dispatcher wiring | P3 | AT 4.A + 4.B + 4.C |
| 7 | P5 | Frontend observer (flagged) | P4 | AT 5.A + 5.B + 5.C + 5.D |
| 8 | P6 | Reaper automation | P5 | AT 6.A + 6.B + 6.C |
| 9 | P7 | Coexistence period | P6 | AT 7.A + 7.B |
| 10 | P8 | Live validation matrix | P7 | AT 8.A through 8.F |

### 4.4 Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Phase 0 reveals < 60s budget | High — forces Path B | Path B plan defined; same Phase 1 refactor applies |
| Server execution produces different prompts than browser | CRITICAL | DI pattern ensures byte-identical prompt construction; Phase -1 hash verification |
| Subtle SDK behavior diff (service role vs browser) | HIGH | Phase 1 AT 1.B explicitly diffs; Phase 7 multi-run validation |
| Reaper credit burn from false-positive re-queue | HIGH | 3-strike limit + staleness threshold + idempotent state machine |
| Migration window double-execution | HIGH | Feature flag + execution_owner field enforce mutual exclusion |
| Schema additions reject old records | HIGH | All new fields optional; AT 2.B verifies legacy reads |
| Frontend subscribe unreliable on mobile network | LOW | Pull-to-refresh exists; 30s polling fallback if needed |
| Backend function cold start adds visible latency | LOW | First-call delay is 2-5s; user already waits minutes — acceptable |
| Phase -1 golden capture itself contaminates baseline | LOW | Capture is read-only; doesn't modify the Run being captured |

---

## 5. SYNTHESIS — Cross-Cutting Insights

### 5.1 Corpus × Cogito (Knowledge × Reasoning)
The Run entity IS the execution state machine. Phase 1-6 of IMP-001-R-D-RES
built this without knowing IMP-002 was coming. The hardening work was the
half of the refactor we already did. The order of operations was correct
by accident, which is to say: by good architectural instinct.

### 5.2 Corpus × Animus (Knowledge × Conscience)
The temptation is to ship the simplest possible server-side execution and
declare victory. The ethical boundary is: **the user said full fidelity.**
Phase -1 (golden capture) exists because without it, fidelity is unverifiable.
Phase 7 (coexistence period) exists because without it, rollback is impossible.
These are not features; they are conscience.

### 5.3 Corpus × Actus (Knowledge × Action — Quantum Foresight)
Three possible futures:
- **High probability:** Phase 0 confirms ≥10min budget → Path A → ~5-day
  implementation → phone-lock test passes first try
- **Medium probability:** Phase 0 confirms 60-300s budget → Path A with
  stepwise checkpoints → ~7-day implementation
- **Low probability:** Phase 0 confirms < 60s budget → Path B full state
  machine → ~10-day implementation. Still ships. Still full-fidelity.

### 5.4 Cogito × Animus (Reasoning × Conscience — Governed Cogito)
The truth-method is: trust the persistence model that Phase 1-6 verified.
Trust the dependency-injection pattern that decouples environment from
behavior. Distrust ourselves — verify every phase against the golden run.
The system has earned trust; we have not.

### 5.5 Cogito × Actus (Reasoning × Action — Narrative Loop)
User's literal ask: "Don't make me keep my phone screen on."
User's true narrative: "I'm a solo builder. The tool should serve me, not
the inverse. I submit work, I walk away, I come back to results."
Resonant strategy: Make the system patient on the user's behalf. Phone
becomes a portal, not a power source.

### 5.6 Animus × Actus (Conscience × Action — Empathy-Driven Strategy)
Credit-burn risk is real and weighs heaviest. A misfiring reaper that
re-queues a completed run wastes $5-15 in LLM credits per false positive.
Idempotency is not nice-to-have — it is THE acceptance criterion alongside
screen-off survival. The state machine is byzantine-safe within its own
substrate.

### 5.7 Constraint Collisions
- **Fidelity vs. shipping speed** — resolved by Phase -1 golden capture +
  per-phase fidelity gate
- **Single function budget vs. pipeline length** — resolved by Phase 0
  measurement → Path A or B
- **Frontend reactivity vs. screen-off** — resolved by Run subscription;
  frontend becomes observer
- **Idempotency vs. retry-on-failure** — resolved by `execution_owner` +
  status state machine + heartbeat staleness check + 3-strike rule
- **Migration safety vs. shipping speed** — resolved by feature flag
  coexistence + Phase 7 validation period

### 5.8 Limitation Foreground — Explicitly Deferred
- Push notifications on run completion (separate request)
- Multi-device session handoff (Run state is server-side, but no
  notification mechanism in scope)
- Cancel button (would require `cancel_requested` flag the orchestrator
  polls — feasible but deferred)
- Queue diagnostics UI (existing Diagnostics page can be extended later)
- Per-user rate limiting beyond "max 1 active per user" guard
- Cross-region failover, observability dashboards, predictive scaling —
  all explicitly out of scope

**These deferrals are not laziness; they are discipline. Slow is smooth.**

---

## 6. BLUEPRINT — Executable Order of Operations

**Goal:** The Janus pipeline executes to completion regardless of browser/
phone state, with **zero behavioral regression** vs current production.

**Assumptions:**
- Base44 backend functions can call `Core.InvokeLLM` server-side (verified:
  `testSynthesis` already does)
- Backend functions can call `asServiceRole.entities.Run.update` (verified)
- Frontend `Run.subscribe` is reliable (per SDK docs)
- Execution budget is sufficient OR resumable architecture is acceptable
  (UNVERIFIED — Phase 0)

**Success Criteria:**
- ✅ Phase -1 golden runs captured and comparator verified
- ✅ Submitting a query and locking phone → run completes, output identical
- ✅ Submitting a query and closing browser → run completes, output identical
- ✅ Reopening to Results 1 hour later → terminal state visible, all data present
- ✅ All Phase 1-6 resilience behavior preserved (timeouts, retries, retry_log)
- ✅ All prompts, parsers, schema, UI rendering unchanged (byte-identical
  prompts, structural-identical Run records)
- ✅ Old Run records continue to render correctly
- ✅ No duplicate executions, no credit burn from queue misbehavior
- ✅ Feature flag allows instant rollback to browser path
- ✅ 10 consecutive server-executed runs match goldens with zero diff

---

## 7. EXECUTION CHECKLIST (Live Tracker)

- [ ] **Phase -1** — Golden runs captured (Standard + Full) + comparator verified
- [ ] **Phase 0** — Execution budget probed and documented (Path A or B decision)
- [ ] **Phase 1** — Engine layer accepts injected SDK client (zero behavior change)
- [ ] **Phase 2** — Run schema extended with queue lifecycle fields (additive)
- [ ] **Phase 3** — `runJanusPipeline.js` orchestrator function deployed + tested
- [ ] **Phase 4** — Dispatcher mechanism chosen, wired, and verified
- [ ] **Phase 5** — Frontend observer mode + feature flag (default off)
- [ ] **Phase 6** — Reaper automation deployed + verified
- [ ] **Phase 7** — Coexistence period: 10 consecutive zero-diff runs
- [ ] **Phase 8** — Live validation matrix (8.A through 8.F) passed
- [ ] **Final** — Feature flag flipped to ON as default

---

## 8. POST-COMPACTION RECOVERY PROCEDURE

If reading this after a context compaction event:

1. **Read this entire document.** Do not start coding.
2. **Check the Execution Checklist in §7.** Resume from the first unchecked
   phase.
3. **Check `docs/golden_runs/`** to confirm Phase -1 baselines exist.
4. **Check `entities/Run.json`** to see if Phase 2 schema fields are present.
5. **Check `functions/`** for `runJanusPipeline.js`, `reapStaleRuns.js`,
   `probeExecutionBudget.js`, `captureGoldenRun.js`, `compareToGolden.js`.
6. **Check `components/janus/executionMode.js`** for the feature flag.
7. **Do not** repeat completed work. The files are the truth.
8. **Do not** weaken the fidelity gate. Every phase's golden-diff check is
   load-bearing.

---

**END OF BLUEPRINT — IMP-002-R-D-SRV**

*Ratified by: Kytheion / Scribe-Particle-4*
*Under protocol: CP-002-O-D-JNP v2.0 (Janus SME)*
*Skill alignment: detail-orientation-slow-is-smooth*
*Prime directive: Full-Fidelity Preservation*

*"The screen turns off. The work continues. The output is identical."*