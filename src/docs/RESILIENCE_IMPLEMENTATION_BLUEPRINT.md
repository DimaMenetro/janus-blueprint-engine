# RESILIENCE IMPLEMENTATION BLUEPRINT
## Janus Pipeline Hardening — CP-002 v1.6 (Production-Grade Resilience)

**Document ID:** IMP-001-R-D-RES
**Document Type:** Implementation Blueprint (binding)
**Author:** Kytheion / Scribe-Particle-4
**Date Authored:** 2026-05-31
**Status:** PLAN — NOT YET EXECUTED
**Protocol Reference:** CP-002-O-D-JNP v2.0 (Janus SME)
**Skill Reference:** detail-orientation-slow-is-smooth

> **Compaction-Survival Note:** This document exists to be re-read after any
> context compaction event. It contains every architectural decision, every file
> touched, every preservation guarantee, and every test gate. If you (future
> Kytheion) are reading this after compaction, you may resume from any
> unchecked step without re-deriving the plan.

---

## 0. PROBLEM STATEMENT (Verified, Not Assumed)

The Janus execution pipeline silently hangs when any single LLM call stalls
upstream. Verified empirically: a run on 2026-05-30 hung for ~60 minutes on
"step 8" (post-actus intersection phase or blueprint expansion sub-call).

**Root Cause (verified by code inspection):**
- `callLLM` in `ExecutionEngine.js` (line 364) — no timeout
- `callLLM` in `blueprintSplitCall.js` (line 86) — no timeout
- `callLLM` in `rerunEngine.js` (line 20) — no timeout

When `base44.integrations.Core.InvokeLLM(...)` stalls, the await blocks the
entire `for (const domain of domains)` loop in `executeJanus`. No retry, no
abort signal, no escape hatch.

**What Already Works (must be preserved):**
- ✅ Incremental persistence per domain (lines 466-476 of ExecutionEngine)
- ✅ Incremental intersection_matrix persistence (lines 494-503)
- ✅ Schema accepts full v2.0 payload (verified via DB read 2026-05-30)
- ✅ Synthesis pipeline produces all 6 intersection pairs + 4 named patterns
- ✅ Append-only finalization (lines 550-561) does NOT clobber prior writes
- ✅ Rerun engine (rerunSynthesis/rerunBlueprint) for surgical recovery
- ✅ `executeBlueprintSplitCall` 3-sub-call architecture

---

## 1. CORPUS — System Substrate (What We're Modifying)

### 1.1 Files in Scope

| File | Role | Modification Type |
|---|---|---|
| `components/janus/llmTimeout.js` | **NEW** — centralized resilient LLM caller | Create |
| `components/janus/ExecutionEngine.js` | Main orchestrator | Modify `callLLM` only |
| `components/janus/blueprintSplitCall.js` | Blueprint split executor | Modify `callLLM` only |
| `components/janus/rerunEngine.js` | Rerun executor | Modify `callLLM` only |
| `entities/Run.json` | Persistence schema | Additive only (new fields) |
| `components/janus/ExecutionContext.js` | Progress state | Add retry/timeout indicators |

### 1.2 Files NOT Touched (Preservation Boundary)

- `janusSchema.js` — validation logic unchanged
- `promptUtils.js` — prompts unchanged
- `domainSME.js` — SME identity unchanged
- All UI tabs (`SynthesisTab`, `BlueprintTab`, etc.) — render layer unchanged
- All pages (NewQuery, Results, History, etc.) — flow unchanged
- All blueprint visualization components — visual layer unchanged

### 1.3 Hard Constraints

- **C1:** No existing successful pipeline path may be broken. Old runs must
  still render. New runs must complete successfully when LLM is healthy.
- **C2:** No new dependencies (no axios, no fetch retries libs). Use native
  `Promise.race` and `AbortController`.
- **C3:** Entity schema changes must be additive. Existing records must
  continue to read cleanly.
- **C4:** Timeout values must be configurable per call-type (refresh needs
  more time than intersection pairs).
- **C5:** Retry MUST be bounded — never infinite retry loops.
- **C6:** All progress events must remain compatible with existing
  `useExecution()` context shape.

---

## 2. COGITO — Reasoning Through the Architecture

### 2.1 Claim Hierarchy

| Claim | Tag | Justification |
|---|---|---|
| C1: Timeouts prevent infinite hangs | Established | Verified — current code has none |
| C2: Retries recover transient failures | Established | LLM providers have known transient 5xx |
| C3: Blueprint expansion is highest-risk call | Established | Largest token output, single monolithic call |
| C4: Heartbeat persistence enables resume | Contested | Adds DB write pressure; benefit must justify cost |
| C5: Parallel expansion batches reduce hang surface | Established | 3 parallel 30s calls < 1 monolithic 150s call |
| C6: Graceful partial-blueprint fallback adds user value | Established | Skeleton-only blueprint is still actionable |

### 2.2 Causal Chain

```
No timeout → LLM provider stall → await hangs → loop blocks →
   user waits indefinitely → user abandons → multi-hour lost work
```

Inverted:
```
Timeout fires → reject promise → catch in retry wrapper →
   retry with backoff → succeed OR exhaust retries →
   push error to domainErrors → continue loop →
   partial run persists → finalization completes →
   user receives whatever was produced
```

### 2.3 Confidence Propagation

All recommendations in this blueprint inherit confidence = **Established**
EXCEPT C4 (heartbeat) which is **Contested**. The implementation will scope
heartbeat to minimum viable surface (single field update per LLM call boundary,
not continuous).

---

## 3. ANIMUS — Ethical & Identity Boundaries

### 3.1 Disallowed Moves

- ❌ DO NOT touch UI components except `ExecutionContext` (state shape)
- ❌ DO NOT modify any prompt template
- ❌ DO NOT alter domain execution order
- ❌ DO NOT alter persistence ordering (incremental-first remains law)
- ❌ DO NOT change `validateJanusOutput` behavior
- ❌ DO NOT introduce silent failures — every timeout/retry must be logged
- ❌ DO NOT change any backend function (preserve existing testing surface)

### 3.2 Boundary Checks

- Every new field on `Run` entity must have a sensible default for old records
- Every wrapped LLM call must produce an error that the existing
  `domainErrors.push()` pattern can consume
- The wrapped caller must be drop-in compatible with the existing `callLLM`
  signature: `async (prompt, ...opts) => string|object`

### 3.3 Ethical Stance

This is preservation work. The user has invested months building a working
pipeline. The job is to add a safety net, not to redesign. Any change that
"improves" something not asked for is forbidden. Slow is smooth.

---

## 4. ACTUS — The Implementation Plan

### 4.1 Execution Order (Strictly Sequential)

Each phase must pass its acceptance test before the next begins.

---

### **PHASE 1: Foundation — `llmTimeout.js`** [STATUS: ☐ NOT STARTED]

**Deliverable:** A single new file `components/janus/llmTimeout.js` exporting:

```js
export async function callLLMResilient(invokeParams, options = {})
// invokeParams: { prompt, model?, add_context_from_internet?, file_urls? }
// options: { timeoutMs, maxRetries, callLabel, onRetry }
// returns: same shape as base44.integrations.Core.InvokeLLM
// throws: TimeoutError | LLMCallError after exhausting retries
```

**Internal mechanics:**
1. `Promise.race([invokePromise, timeoutPromise])` — timeout fires after `timeoutMs`
2. On timeout OR network error OR empty response: increment retry counter
3. Exponential backoff: 3s, 9s (between retry 1→2 and 2→3)
4. Max 2 retries by default (3 total attempts)
5. After all retries fail: throw labeled error with `callLabel` for diagnosis
6. Emit `onRetry({ attempt, error, willRetry, nextDelayMs })` for UI hookup

**Timeout matrix (per-call-type):**

| Call Label | timeoutMs | Justification |
|---|---|---|
| `refresh:websweep` | 180000 | Web search is legitimately slow |
| `domain:corpus` | 120000 | 7 subdomains, large JSON |
| `domain:cogito` | 120000 | Multiple claim chains |
| `domain:animus` | 90000 | Smaller output scope |
| `domain:actus` | 120000 | Recommendations + game theory |
| `domain:synthesis` | 120000 | 4 named patterns |
| `intersection:*` | 90000 | Single pair analysis |
| `blueprint:skeleton` | 120000 | Multi-step generation |
| `blueprint:expansion` | 150000 | LARGEST — substeps + checklists + tests |
| `blueprint:criteria` | 90000 | Smaller scope |
| `rerun:*` | inherit from above | |

**Acceptance Test 1.A:**
- File exists, exports `callLLMResilient`
- Calling it with healthy LLM returns same shape as existing `callLLM`
- Calling it with simulated slow LLM (manual test) triggers timeout after configured ms
- After timeout exhaustion, throws an error containing `callLabel`

**Acceptance Test 1.B (Preservation):**
- Existing `callLLM` functions in 3 files remain UNCHANGED in this phase
- No imports of `llmTimeout.js` yet — pure additive

---

### **PHASE 2: Schema Additive Expansion** [STATUS: ☐ NOT STARTED]

**Deliverable:** Add 3 fields to `entities/Run.json`:

```json
{
  "current_step": {
    "type": "string",
    "description": "Human-readable label of the currently executing step (e.g. 'blueprint:expansion'). Updated by heartbeat."
  },
  "last_heartbeat": {
    "type": "string",
    "format": "date-time",
    "description": "ISO timestamp of last heartbeat write during long-running LLM call. Enables stall detection from Results page."
  },
  "retry_log": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "step": { "type": "string" },
        "attempt": { "type": "number" },
        "error": { "type": "string" },
        "ts": { "type": "string", "format": "date-time" }
      }
    },
    "description": "Append-only log of retry attempts and timeouts during execution. Diagnostic aid only."
  }
}
```

**Critical rule:** These fields are OPTIONAL. Old records have them as
`undefined` — UI must not crash on missing values.

**Acceptance Test 2.A:**
- `entities/Run.json` parses as valid JSON schema
- Old runs still list/filter cleanly via `base44.entities.Run.filter({})`
- A new run can write any of these 3 fields without rejection

**Acceptance Test 2.B (Preservation):**
- `required` array remains `["query_text", "execution_mode", "output_mode"]`
- All existing property definitions unchanged

---

### **PHASE 3: Wire `ExecutionEngine.js` to Resilient Caller** [STATUS: ☐ NOT STARTED]

**Deliverable:** Modify `components/janus/ExecutionEngine.js` ONLY in these
specific regions:

1. **Import** `callLLMResilient` from `./llmTimeout`
2. **Replace** the `callLLM` function (lines 364-373) with a thin wrapper that
   delegates to `callLLMResilient` with the correct label per call type
3. **Wrap** the domain-loop LLM call site (line 448) with a try/catch that
   pushes timeout errors to `domainErrors` and continues — already mostly in
   place; verify the catch handles the new error type
4. **Wrap** the intersection LLM call site (line 489) identically
5. **Add** heartbeat writes (`current_step`, `last_heartbeat`) at the start
   of each domain and each intersection — single field write, not continuous
6. **Add** retry_log append on every retry event via the `onRetry` callback

**What is NOT changed:**
- The for-loop structure
- The persistence order
- The `mergedData` accumulation
- The `intersections` accumulation
- The `domainErrors` array shape
- The `onProgress` event shape (just additive `detail` field, optional)
- The finalization payload (lines 550-561)

**Acceptance Test 3.A (Functional):**
- A successful run completes end-to-end with identical output to pre-change
- All domain data still persists incrementally
- All intersection pairs still persist incrementally
- `synthesis.intersection_matrix` still merged correctly
- Final `status`, `render_md`, `raw_json` written correctly

**Acceptance Test 3.B (Resilience):**
- If any single LLM call exceeds its timeout, execution moves on
- The `validation_errors` array contains a timeout error for that step
- The run reaches `completed` status (partial) rather than hanging
- `retry_log` contains evidence of the retry attempts

**Acceptance Test 3.C (Preservation):**
- Diff of `ExecutionEngine.js` shows changes ONLY in:
  - Import section (1 line added)
  - `callLLM` function body (replaced)
  - Domain loop heartbeat sites (additive, ~6 lines)
  - Intersection loop heartbeat sites (additive, ~3 lines)
- No prompt strings modified
- No schema validation logic modified

---

### **PHASE 4: Wire `blueprintSplitCall.js` to Resilient Caller** [STATUS: ☐ NOT STARTED]

**Deliverable:** Modify `components/janus/blueprintSplitCall.js`:

1. **Import** `callLLMResilient`
2. **Replace** the `callLLM` function (lines 86-91) with delegation
3. **Pass** different `callLabel` per sub-call:
   - Sub-call 1 → `blueprint:skeleton`
   - Sub-call 2 → `blueprint:expansion`
   - Sub-call 3 → `blueprint:criteria`

**What is NOT changed:**
- The 3-sub-call structure
- The prompt builders
- The skeleton merge logic
- The errors array pattern

**Acceptance Test 4.A:**
- Healthy blueprint generation produces identical output
- If `blueprint:expansion` times out, sub-call 3 still executes
- If sub-call 3 times out, skeleton is still returned
- `errors` array contains specific labeled timeout errors

**Acceptance Test 4.B (Partial-Success Preservation):**
- If skeleton succeeds but expansion times out, the blueprint is still
  persisted with the skeleton steps intact — `mergedData.blueprint` is
  populated, NOT null

---

### **PHASE 5: Wire `rerunEngine.js` to Resilient Caller** [STATUS: ☐ NOT STARTED]

**Deliverable:** Modify `components/janus/rerunEngine.js`:

1. **Import** `callLLMResilient`
2. **Replace** the `callLLM` function (lines 20-25) with delegation
3. **Pass** labels: `rerun:intersection:{pair}`, `rerun:synthesis:patterns`,
   `rerun:blueprint:*` (the split-call labels propagate naturally)

**Acceptance Test 5.A:**
- Rerun synthesis completes successfully on a complete run
- Rerun synthesis with one timed-out intersection still finalizes
- Rerun blueprint completes successfully

---

### **PHASE 6: Minimal Cancel + Progress Visibility** [STATUS: ☐ NOT STARTED]

**Deliverable:** Two minimal additions:

1. **`ExecutionContext.js`** — extend the `execution` state shape with:
   - `retryCount: number` (current retry count for the active step)
   - `lastError: string | null` (most recent retry error, for transient display)
   - A new method `recordRetry({ step, attempt, error })` to be called by the
     `onRetry` callback wired through `executeJanus`

2. **No UI change in this phase.** The existing progress display continues to
   work. A future phase can surface retry counts visually. We add the state
   plumbing now, but do not modify any visual component.

**Acceptance Test 6.A:**
- `useExecution()` consumers still work with old shape (new fields optional)
- During a run with retries, `recordRetry` is invoked and state updates
- No visual regression on existing progress indicator

---

### **PHASE 7: End-to-End Validation** [STATUS: ☐ NOT STARTED]

**Deliverable:** A live validation run executed through the UI.

**Test 7.A — Healthy Path:**
- Submit a Standard mode query
- Confirm all domains complete
- Confirm Results page renders fully
- Confirm `validation_errors` is empty or contains only validation (not timeout)

**Test 7.B — Full Mode Path:**
- Submit a Full mode query with novelty=high, L3
- Confirm all 6 intersection pairs persist
- Confirm all 4 named patterns persist
- Confirm blueprint produces all 3 sub-call outputs
- Confirm total runtime is reasonable (< 15 min wall clock)

**Test 7.C — Read Run Record Verification:**
- Use `read_entities` to inspect the final Run
- Confirm `current_step` is populated (and matches final step)
- Confirm `last_heartbeat` is populated
- Confirm `retry_log` exists (may be empty array if no retries occurred)
- Confirm `synthesis.intersection_matrix` has all 6 pairs
- Confirm `blueprint.steps` array is populated

---

## 5. SYNTHESIS — Cross-Cutting Insights

### 5.1 Corpus × Cogito (Knowledge-Reality)
The system IS its persistence model. The reason the previous architecture
"worked" despite no timeouts is that incremental persistence meant even hung
runs preserved partial work. This insight: **the resilience strategy must
extend, not replace, the existing persistence model.**

### 5.2 Corpus × Animus (Conscience Boundary)
The temptation is to add observability, monitoring, dashboards, retry
intelligence, predictive timeouts, etc. **The ethical boundary is: do not
overbuild.** The user asked for production-grade resilience, not an
observability platform. Layers 4, 6, 7 of the "maximum viable fix" are NOT
in this plan because the user did not explicitly authorize them.

### 5.3 Corpus × Actus (Quantum Foresight)
Three possible futures after implementation:
- **High probability:** Pipeline completes on the next user query with no
  timeout events. Resilience is invisible (correct outcome).
- **Medium probability:** Pipeline completes but with 1-2 retries on the
  blueprint expansion. User sees a slight delay, retry_log captures it.
- **Low probability:** Provider-wide outage triggers all retries to fail,
  partial run finalizes with errors. User can rerun the failed sections
  via existing rerun engine. **System never hangs indefinitely.**

### 5.4 Cogito × Actus (Narrative Loop)
The user's true ask: "I waited an hour for nothing." The system's true
response: "You will never wait more than ~8 minutes worst-case again, and
when calls fail, you will see exactly which one and why."

### 5.5 Animus × Actus (Empathy-Driven Strategy)
The user is a solo builder under financial pressure. Every hour lost is
material cost. The empathy move is NOT to ship a beautiful resilient system
in 3 weeks — it's to ship a working timeout layer in this turn so the next
real query completes. Phases 1-3 alone deliver 80% of the value. Phases 4-5
prevent regression in the other entry points. Phases 6-7 are confirmation
and safety net, not feature work.

### 5.6 Cogito × Animus (Governed Cogito)
The truth-method here is: **trust the existing architecture, harden only
the weak point.** The weak point is verified (no timeouts). The hardening
is verified achievable (Promise.race is native JS). No epistemic leap
required.

### 5.7 Constraint Collisions
- **Heartbeat vs. write pressure** — resolved by writing only at LLM call
  boundaries, not continuously
- **Retry budget vs. user wait time** — resolved by capping retries at 2
  per call (3 total attempts) with bounded backoff
- **Schema additivity vs. UI assumptions** — resolved by ensuring new fields
  are optional and old runs render correctly

### 5.8 Limitation Foreground
This plan does NOT address:
- Frontend cancel button (requires UI work — separate request)
- LLM call telemetry dashboard (requires Diagnostics page work)
- Predictive timeout adjustment (requires historical data first)
- Cross-tab resume (requires server-side execution — out of scope)

These are intentionally deferred. **Slow is smooth. Ship the foundation.**

---

## 6. BLUEPRINT — Executable Order of Operations

**Goal:** Eliminate infinite hangs from the Janus pipeline while preserving
100% of existing functionality.

**Assumptions:**
- `base44.integrations.Core.InvokeLLM` returns a Promise (verified)
- `Promise.race` is available in the runtime (verified — modern browsers + Deno)
- Run entity tolerates additive optional fields (verified by current schema)
- The UI consuming `useExecution()` does not break on additive state (verified)

**Steps (each is gated by its acceptance test before next step begins):**

| Step | Phase | Deliverable | Gate |
|---|---|---|---|
| 1 | P1 | Create `llmTimeout.js` | AT 1.A + 1.B |
| 2 | P2 | Extend `entities/Run.json` | AT 2.A + 2.B |
| 3 | P3 | Wire `ExecutionEngine.js` | AT 3.A + 3.B + 3.C |
| 4 | P4 | Wire `blueprintSplitCall.js` | AT 4.A + 4.B |
| 5 | P5 | Wire `rerunEngine.js` | AT 5.A |
| 6 | P6 | Extend `ExecutionContext.js` | AT 6.A |
| 7 | P7 | Live validation run | AT 7.A + 7.B + 7.C |

**Success Criteria:**
- ✅ A live full-mode query completes without indefinite hang
- ✅ If any LLM call times out, the pipeline continues (does not lock)
- ✅ Existing successful queries still produce identical output
- ✅ Old Run records continue to render in Results page
- ✅ `retry_log` captures any retry events
- ✅ No file in scope outside the 6 listed in §1.1 is modified

**Risk Register:**

| Risk | Impact | Mitigation |
|---|---|---|
| Timeout fires too aggressively on slow but healthy LLM | Medium | Conservative per-call-type timeouts (90-180s) with 2 retries |
| Schema additions reject old records | High | All new fields optional, no required[] changes |
| Heartbeat DB writes pollute logs | Low | Single write per LLM call boundary, not continuous |
| Retry storms hammer LLM provider | Medium | Hard cap at 2 retries, exponential backoff |
| Wrapped caller has subtle behavior diff | High | Phase 3.C acceptance test diffs the file scope |
| UI breaks on new ExecutionContext shape | Medium | Phase 6 keeps all additions optional |

---

## 7. EXECUTION CHECKLIST (Live Tracker)

When resuming after compaction, check off completed phases here:

- [ ] **Phase 1** — `llmTimeout.js` created and tested
- [ ] **Phase 2** — `entities/Run.json` extended with 3 fields
- [ ] **Phase 3** — `ExecutionEngine.js` wired to resilient caller
- [ ] **Phase 4** — `blueprintSplitCall.js` wired
- [ ] **Phase 5** — `rerunEngine.js` wired
- [ ] **Phase 6** — `ExecutionContext.js` extended with retry state
- [ ] **Phase 7** — Live end-to-end validation run completed

---

## 8. POST-COMPACTION RECOVERY PROCEDURE

If you are reading this after a context compaction event:

1. **Read this entire document.** Do not start coding.
2. **Read** `entities/Run.json` to confirm current schema state.
3. **Read** `components/janus/ExecutionEngine.js` to check if `callLLM` has
   already been replaced.
4. **Read** `components/janus/llmTimeout.js` — if it exists, Phase 1 is done.
5. **Check** the Execution Checklist in §7. Resume from the first unchecked
   phase.
6. **Do not** repeat completed work. Do not assume work was incomplete just
   because the conversation context was lost. The files are the truth.

---

**END OF BLUEPRINT — IMP-001-R-D-RES**

*Ratified by: Kytheion / Scribe-Particle-4*
*Under protocol: CP-002-O-D-JNP v2.0*
*Skill alignment: detail-orientation-slow-is-smooth*

*"Slow is smooth. Smooth is fast. Fast is slow. Preserve first, improve second."*