# IMP-002-R-D-SRV — Server-Side Execution Refactor

**Document Type:** Implementation Blueprint
**Document ID:** IMP-002-R-D-SRV
**Revision:** 2.0 (incorporates Daionae's Rehydration Boundary Audit refinement)
**Subject:** Eliminate browser-tab dependency from the Janus pipeline
**Operator:** DIMA
**Scribe:** Kytheion / Scribe-Particle-4
**Counterbalance:** Daionae (Recursive Oracle of Continuity)
**Date Initiated:** 2026-06-02
**Status:** ☐ PLANNING — Awaiting Phase -1 authorization
**Protocol Alignment:** CP-002-O-D-JNP v2.0 (Janus SME)
**Skill Alignment:** detail-orientation-slow-is-smooth
**Predecessor:** IMP-001-R-D-RES (complete through Phase 6)

---

## 0. PRIME DIRECTIVE — Full-Fidelity Preservation

> **"Full functionality must still remain when finished."** — DIMA, 2026-06-02
>
> **"Cut the browser umbilical cord without nicking an artery."** — DIMA, 2026-06-02

These two statements are the load-bearing constraints of the entire refactor.
Every phase, every file, every edit is evaluated against this single test:

> **Can a user who used the system yesterday submit the same query tomorrow
> and get identical output, with the only visible difference being that they
> can lock their phone?**

If the answer is anything other than "yes," the change is rejected and
re-planned. This is the meta-acceptance criterion under which all other
acceptance criteria are nested.

### 0.1 What "Full Fidelity" Means — Preservation Inventory

| Surface | Preservation Requirement |
|---|---|
| Prompts | Every prompt builder byte-identical |
| Schema | Additive changes only; no required[] modifications, no enum removals |
| Validation | `janusSchema.js` logic, normalization, error messages unchanged |
| Parsers | All response parsers unchanged |
| Markdown render | `generateMarkdown` and all section formatters unchanged |
| Resilience | Phase 1-6 IMP-001 behavior preserved AND extended to server context |
| Persistence pattern | Incremental writes per stage preserved |
| Rerun engine | Public API unchanged |
| UI rendering | All pages and components visually and behaviorally identical |
| Theme system | LiquidGlass tokens, ThemeProvider, AmbientOrbs untouched |
| Domain SME logic | `domainSME.js` unchanged |
| Export utilities | `exportUtils.js` unchanged |
| Legacy Run records | Pre-refactor records render correctly on all pages |
| Existing diagnostic functions | All 7 existing functions unchanged |

### 0.2 Permissible Change Surface

| Surface | Permitted Change Type |
|---|---|
| `entities/Run.json` | Additive optional fields only (IMP-001 Phase 2 precedent) |
| `ExecutionEngine.js` | Accept injected SDK client; otherwise zero behavioral change |
| `blueprintSplitCall.js` | Accept injected SDK client; otherwise zero behavioral change |
| `llmTimeout.js` | Accept injected SDK client; otherwise zero behavioral change |
| `rerunEngine.js` | Accept injected SDK client; otherwise zero behavioral change |
| `ExecutionContext.js` | Subscribe to Run updates (additive path) |
| `NewQuery.js` | Dispatch branches on feature flag; legacy path preserved |
| New: `functions/runJanusPipeline.js` | Net-new server orchestrator |
| New: `functions/reapStaleRuns.js` | Net-new safety net |

### 0.3 Fidelity Enforcement Mechanisms

1. **Golden run baseline (Phase -1):** Capture canonical Run records BEFORE any
   refactor. Every phase diffs against these baselines.
2. **Dependency injection only:** No engine-layer file is rewritten. Each is
   modified at the IMPORT point — bodies untouched.
3. **Feature flag for coexistence:** `USE_SERVER_EXECUTION` gates the new path.
   Default `false`. Until flipped, behavior is byte-identical to today.
4. **Per-phase fidelity gate:** Every phase's acceptance test includes a
   "compare to golden run" check.
5. **No "while we're in there" goblinry:** Each phase touches only what its
   acceptance test requires. Opportunistic edits are forbidden.

---

## 1. STRATEGIC FRAMING — The Three-State Model

> *"Don't think of this as building Path B from scratch. Think of it as
> three states with one shared foundation."* — DIMA, 2026-06-02

### 1.1 The Three States

```
┌─────────────────────────────────────────────────────────────────────┐
│  CURRENT                                                             │
│  Multi-call browser pipeline with incremental persistence.           │
│  Engine lives in browser. Run record written stage-by-stage.         │
│  Phone-lock kills it.                                                │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  NEXT (Path A)                                                       │
│  Server-driven multi-call pipeline.                                  │
│  Same engine, same prompts, same persistence.                        │
│  Only the driver moves. Phone-lock irrelevant.                       │
│  REQUIRED if backend execution budget is sufficient.                 │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓ (only if budget forces it)
┌─────────────────────────────────────────────────────────────────────┐
│  HARD (Path B)                                                       │
│  Server-driven, one-call-at-a-time resumable wrapper.                │
│  NOT a separate architecture. Path A plus a checkpoint layer.        │
│  Requires promoting STAGED calls into CHECKPOINTED calls.            │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Critical Distinction — Staged vs Checkpointed Execution

> **Staged execution:** The engine moves through ordered phases, heartbeating
> at boundaries. If it dies mid-phase, the heartbeat tells you *where* it
> died but not *what to do next* — because the phase's inputs were
> in-memory and now they're gone.
>
> **Checkpointed execution:** Each unit of work, before it runs, can be
> rehydrated from the persisted Run alone. If it dies mid-unit, the next
> invocation can read the Run, identify the next incomplete unit, rebuild
> its inputs from stored data, and execute. No in-memory state required.

The current pipeline is **staged**. The rerun engine (IMP-001 Phase 5) is
**partially checkpointed** — it proves the rehydration pattern at the
domain boundary level, but inside its loops it reverts to staged execution.

HARD mode is not "add a resumable wrapper." HARD mode is **"promote staged
calls into checkpointed calls, especially blueprint sub-calls."**

### 1.3 Why This Reframing Matters

- Path A is built **regardless** — the SDK injection and orchestrator
  function are required for both states
- Phase 0's budget probe no longer "selects" architecture; it only asks
  *"do we also need the checkpoint layer?"*
- Phase 0 and Phase 1 can run **in parallel** after Phase -1, because
  Phase 1's dependency injection is required either way
- If HARD mode is forced, we extend Path A's structure rather than
  redesign — same orchestrator, same dispatcher, same schema, plus a
  rehydration wrapper that reads `current_step` and routes to the next
  unfinished checkpointed unit

---

## 2. CORPUS — Substrate Reality

### 2.1 The Pain (Decoded)

DIMA submits a Janus query. Pipeline takes 8-15 minutes. Phone locks.
Mobile OS suspends the browser tab within ~30s. Pipeline event loop
freezes. Pending DB writes never fire. Run stuck `running` forever.
Phase 1-6 resilience cannot help — the browser tab itself is what hung.

### 2.2 Current Architecture Inventory

**Browser-driven execution graph:**
- `pages/NewQuery.js` calls `executeJanus(...)`
- `ExecutionEngine.js` orchestrates: refresh → domains → intersections → synthesis → blueprint
- For each LLM call: `callLLM` → `callLLMResilient` → `base44.integrations.Core.InvokeLLM`
- Phase 1-6 IMP-001 instrumentation: `current_step`, `last_heartbeat`, `retry_log` written incrementally
- Blueprint domain delegates to `blueprintSplitCall.js` (Phase 4)
- Rerun path uses `rerunEngine.js` (Phase 5) with parallel closure-scoped helpers

**Persistence model (IMP-001 verified):**
- The Run record is incrementally complete at every step boundary
- `current_step` always reflects where the pipeline IS
- `last_heartbeat` always reflects when it last advanced
- `retry_log` always captures in-flight retry events

**Key realization:** Phase 1-6 already built the foundation for resumability
at the **domain boundary** level. What's missing:
1. A process that can drive the state machine without being a browser
2. (HARD mode only) Sub-domain checkpointing — particularly for blueprint sub-calls

### 2.3 What Base44 Provides

- ✅ Backend functions — Deno serverless, server-side execution
- ✅ Service-role SDK — `base44.asServiceRole.entities/integrations`
- ✅ `Run.subscribe` for live frontend updates without driving execution
- ✅ Scheduled automations — for reaper and (optionally) dispatcher
- ✅ Entity automations — for trigger-on-create dispatching
- ✅ Server-side `Core.InvokeLLM` — verified callable (existing `testSynthesis` uses it)
- ⚠️ Backend function execution budget — **UNKNOWN**, gates Path A vs Path A+B decision

### 2.4 Files In Scope

| File | Change Type | Fidelity Impact |
|---|---|---|
| `entities/Run.json` | Additive fields | Zero — IMP-001 Phase 2 precedent |
| `components/janus/ExecutionEngine.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/blueprintSplitCall.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/llmTimeout.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/rerunEngine.js` | Inject SDK client | Zero — body unchanged |
| `components/janus/ExecutionContext.js` | Subscribe to Run | Minimal — additive |
| `pages/NewQuery.js` | Flag-gated dispatch | Zero with flag off |
| `components/janus/executionMode.js` | NEW — feature flag | N/A |
| `functions/runJanusPipeline.js` | NEW | N/A |
| `functions/reapStaleRuns.js` | NEW | N/A |
| `functions/probeExecutionBudget.js` | NEW (temporary) | N/A — removable after Phase 0 |
| `functions/captureGoldenRun.js` | NEW (temporary) | N/A — removable after Phase -1 |
| `functions/compareToGolden.js` | NEW (retained for regression) | N/A |
| HARD mode only: blueprint sub-call checkpoint fields | Additive schema | Zero — additive |

**Explicitly OUT of scope:**
- All prompt builders, schema validators, domain SME, markdown rendering
- All UI components except NewQuery and ExecutionContext
- All theme / glass / layout / export code
- All existing diagnostic functions
- Rerun control wiring (`RerunControls.jsx`)
- All entity files other than `Run.json`

---

## 3. COGITO — Reasoning & Truth Validation

### 3.1 Claims

**Claim C1:** The Run entity is already the complete execution state machine
**at the domain-boundary level.**
- Why believed: IMP-001 Phase 1-6 makes every domain durable; `current_step` +
  `last_heartbeat` + `retry_log` form complete domain-level resumability.
- Falsifiable by: Finding any *domain-level* state held in browser memory
  not also written to the Run.
- Confidence: HIGH ✅

**Claim C2:** The Run entity is **NOT** fully checkpointed at the sub-domain
level — particularly within blueprint sub-calls.
- Why believed: `blueprintSplitCall.js` chains skeleton → expansion → criteria
  through closure-scoped variables. Skeleton is not persisted as a separately
  addressable Run field before expansion runs.
- Falsifiable by: Reading the Run record mid-blueprint and finding
  `blueprint_skeleton` as a standalone field.
- Confidence: HIGH ✅ (this is the artery)

**Claim C3:** The engine layer is environment-portable today.
- Why believed: Code review shows no `window`, `document`, `localStorage`,
  React hooks, or browser-only APIs in any engine file.
- Falsifiable by: Phase 1 audit scanning for browser-only references.
- Confidence: HIGH (will verify in Phase 1)

**Claim C4:** The frontend can become a pure observer without losing
user-visible behavior.
- Why believed: `ExecutionContext` already mirrors the Run shape;
  `Run.subscribe` delivers identical state with seconds of latency.
- Falsifiable by: A UI component depending on state not present in the Run.
- Confidence: HIGH

**Claim C5 (UNVERIFIED — gates HARD vs no-HARD decision):** Base44 backend
function execution budget is sufficient for Path A.
- Why believed: Unknown. Phase 0 measures empirically.
- Confidence: UNKNOWN

**Claim C6:** Idempotency via status-machine ownership prevents
double-execution.
- Why believed: `queued → claimed → running → completed` with check-and-set
  guards is byzantine-safe given Base44's single-writer-per-record semantics.
- Confidence: HIGH (Phase 3 AT verifies)

### 3.2 Causal Chain (Current Pain)

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

**Cut point:** Move the event loop off the browser.

### 3.3 GraphRAG Connection

IMP-001-R-D-RES (Resilience) is the prerequisite for IMP-002-R-D-SRV.
Phase 1-6 made the Run record into a domain-level state machine — without
that work, this refactor would be impossible. The order was correct by
good architectural instinct.

HARD mode would extend that pattern from domain-level to sub-domain-level
checkpointing — promoting the rerun engine's rehydration capability (which
proves it's *possible*) into the main execution path's default behavior.

---

## 4. ANIMUS — Ethical & Identity Boundaries

### 4.1 Boundary Checks

**BC1 — Fidelity is sacrosanct.** A phase that ships server execution but
breaks a single domain prompt is a FAILED phase, even if "the screen-off
problem is solved." Both conditions must hold.

**BC2 — Scope discipline.** Screen-off resilience only. No push notifications,
no job dashboards, no cancel buttons, no multi-device handoff.

**BC3 — Credit discipline.** Server execution runs whether or not anyone
watches. A misfiring reaper could re-execute a completed run and burn
$5-15 in LLM credits. Idempotency is mandatory.

**BC4 — Identity preservation.** Janus protocol, prompts, intersection model,
rendering — these are the soul. Untouched.

**BC5 — Backward compatibility.** Every pre-refactor Run record renders
correctly. Schema additive only.

**BC6 — Reversibility.** Feature flag gates the new path. Flipping back is
instantaneous.

**BC7 (NEW) — No "while we're in there" goblinry.** Each phase touches only
what its acceptance test requires. The rehydration audit DOCUMENTS gaps; it
does not FIX them. HARD mode fixes are scoped only if Phase 0 forces them.

### 4.2 Disallowed Moves

- ❌ No third-party job queues — Base44 entities + automations are the substrate
- ❌ No prompt edits "while we're in there"
- ❌ No schema field deletions or required[] modifications
- ❌ No removing the browser engine until Phase 8 validation passes
- ❌ No skipping Phase -1 (golden capture)
- ❌ No coupling engine layer to environment — DI is the only mechanism
- ❌ No opportunistic scope expansion (Janus SME forbids it)
- ❌ No fixing rehydration gaps during the audit — audit DOCUMENTS only

### 4.3 Risk Analysis

**Cognitive sync assessment:** User's stated goal "phone screen off" aligns
with true goal "I can submit work and walk away." No decoding gap. Risk
is in subtle fidelity regressions that wouldn't be noticed until an old
query is re-run and output differs.

**Misalignment risks:**

| Risk | Severity | Mitigation |
|---|---|---|
| Server path produces different output | CRITICAL | Phase -1 golden + per-phase diff check |
| Credit burn from misfiring reaper | HIGH | 3-strike rule, staleness threshold, idempotent state machine |
| Run stuck in "queued" forever | MEDIUM | Reaper escalates 30min-old queued runs |
| Backend function silently dies | MEDIUM | Reaper detects stale heartbeat, re-queues once |
| Double-execution during migration | HIGH | `execution_owner` + feature flag mutual exclusion |
| Frontend subscribe drops on mobile network | LOW | Pull-to-refresh + 30s polling fallback |
| HARD mode scope creep into Path A | HIGH | Phase 0 decision gate; HARD work strictly deferred unless forced |
| Blueprint sub-call checkpoint redesign breaks Standard mode | HIGH | Even in HARD mode, sub-call checkpoint is opt-in via feature flag |

---

## 5. ACTUS — Executable Plan

### 5.1 Goal

Janus pipeline completes regardless of browser/phone state, with **zero
behavioral regression** vs current production.

### 5.2 Strategic Plan — Phased Implementation

---

#### **PHASE -1: Golden Run Capture & Fidelity Harness** *(blocking — must be first)*

**Why first:** Full-fidelity preservation cannot be verified without baseline.

**Deliverable:** Captured golden runs + comparison utility.

**Method:**
1. **Temporarily** add an optional `debug_prompt_hashes` field to Run schema (no leading underscore — Base44 entity field naming constraint)
   (or write to a side-table). Wrap `callLLMResilient` with a passthrough that
   writes SHA-256 hashes of each prompt to this field. **Marked clearly as
   temporary; removed after Phase -1.**
2. Submit Standard golden query through current browser path:
   *"Design a resilient distributed cache layer for high-traffic API responses."*
3. Capture the Run record verbatim via new `functions/captureGoldenRun.js`,
   export to `docs/golden_runs/STANDARD_v1.json`.
4. Submit Full golden query:
   *"Design a neurosymbolic reasoning layer for AI alignment in autonomous agents."*
5. Capture to `docs/golden_runs/FULL_v1.json`.
6. Create `functions/compareToGolden.js` — structural diff:
   - Field presence (populated vs missing)
   - Array lengths (steps, intersections, claims)
   - Prompt hashes
   - `render_md` byte-length delta (±1%)
   - `validation_errors` content
   - `error_message`: presence-only check (not byte-identical, since stack
     traces legitimately differ across environments)
7. Run `compareToGolden` on the captured runs against themselves (sanity check
   the comparator).
8. **Remove the temporary prompt-hash capture wrapper.** Verify removal does
   not change anything else.

**Acceptance Test -1.A:** Two captured golden runs exist (Standard + Full),
both status `completed`.
**Acceptance Test -1.B:** Self-diff returns "perfect match."
**Acceptance Test -1.C:** Prompt-hash capture wrapper removed; verified by
grep + a follow-up Standard run that does not write `debug_prompt_hashes`.

**Gate:** MUST pass before any other phase.

---

#### **PHASE 0: Execution Budget Probe** *(parallelizable with Phase 1)*

**Why:** Determines whether HARD mode (Path B checkpoint layer) is required.
Does NOT block Phase 1 because Phase 1's DI is needed either way.

**Deliverable:** `functions/probeExecutionBudget.js` + documented findings.

**Method:**
1. Probe function loops every 30s for up to 20 minutes:
   - Write heartbeat to sacrificial Run record
   - Make small `InvokeLLM` "ping" call (verify server-side LLM behavior)
   - Record per-call latency
2. Invoke via `test_backend_function`. Observe:
   - Wall-clock time at function death
   - Error/timeout signature
   - Per-call LLM latency (server vs known browser baseline)
   - Whether `Core.InvokeLLM` from server returns identical response shape

**Acceptance Test 0.A:** Documented max wall-clock execution time.
**Acceptance Test 0.B:** `Core.InvokeLLM` server-side returns identical
response shape to browser-side.
**Acceptance Test 0.C:** Documented behavior at budget exhaustion (clean
error vs silent kill; partial work preservation).
**Acceptance Test 0.D:** Documented per-call latency for server context.

**Decision Gate:**
- **Budget ≥ 15min:** Path A only. HARD mode deferred.
- **Budget 5-15min:** Path A only for Standard/Quick; HARD mode required
  for Full mode.
- **Budget < 5min:** HARD mode required for all modes. Blueprint sub-call
  checkpointing becomes Phase 4.5.

---

#### **PHASE 1: Engine Layer Dependency Injection + Rehydration Boundary Audit**
*(parallelizable with Phase 0; behavior-preserving)*

**Why:** Engine must run from EITHER browser OR server context. Minimal-change
path = inject SDK client as dependency. Audit documents (does NOT fix) the
rehydration gaps.

**Deliverable A — DI refactor:** `ExecutionEngine.js`, `blueprintSplitCall.js`,
`llmTimeout.js`, `rerunEngine.js` accept optional `client` parameter
defaulting to browser SDK.

**Deliverable B — Rehydration Boundary Audit:** Document classifying every
callable unit by checkpoint status. Output: `docs/REHYDRATION_BOUNDARY_AUDIT.md`.

**Method (DI per file):**
1. **Audit pass:** Grep each file for `window`, `document`, `localStorage`,
   `navigator`, React hooks, DOM. Expected: zero hits.
2. **Inject pattern:** `import { base44 } from "@/api/base44Client"` becomes
   internal default. Public functions accept OPTIONAL `client` parameter.
   If absent, use imported default. If present, use injected.
3. **Symmetry requirement:** DI applies to BOTH `ExecutionEngine` AND
   `rerunEngine`. Rerun path must work identically under injection.
4. **NO body changes.** Internals continue calling `client.entities.Run.update`,
   `client.integrations.Core.InvokeLLM` — only sourcing changes.
5. **Callback inventory:** Document every callback the engine emits
   (`onProgress`, `onRetry`, `onHeartbeat`, internal helpers). Server context
   must wire each one correctly.

**Method (Audit):**

Produce a classification table covering every callable unit:

| Unit | Rehydratable from Run today? | Required upstream | Notes |
|---|---|---|---|
| `domain:corpus` | ✅ Skippable if `run.corpus` exists | — | Output persisted after completion |
| `domain:cogito` | ✅ Yes | `run.corpus` | Standard rehydration |
| `domain:animus` | ✅ Yes | `run.corpus + run.cogito` | Standard rehydration |
| `domain:actus` | ✅ Yes | `run.corpus + run.cogito + run.animus` | Standard rehydration |
| `intersection:*` (6 pairs) | ⚠️ Partial | Domain outputs | Main path persists incrementally; rerun path computes all six in one flow and persists after the loop — **needs normalization** |
| `synthesis:patterns` | ✅ Yes | `run.synthesis.intersection_matrix` | Standard rehydration |
| `blueprint:skeleton` | ❌ Not independently persisted | Synthesis | **ARTERY** |
| `blueprint:expansion` | ❌ Depends on in-memory skeleton | Skeleton | **ARTERY** |
| `blueprint:criteria` | ❌ Depends on in-memory skeleton | Skeleton | **ARTERY** |

**The audit DOCUMENTS these gaps. It does NOT fix them.** Fixes are HARD-mode
work, scoped only if Phase 0 forces it.

**Acceptance Test 1.A (Functional preservation):** Run Standard golden through
browser path. `compareToGolden` returns zero structural diff.
**Acceptance Test 1.B (Server invocability):** Minimal backend function
imports engine with service-role client, completes a Standard run. Run
`compareToGolden`. Zero structural diff.
**Acceptance Test 1.C (Audit clean):** Zero browser-only API references
documented.
**Acceptance Test 1.D (Rerun symmetry):** A rerun (synthesis or blueprint)
under injected client produces same output as browser. `compareToGolden`
applied to the rerun result vs a known-good rerun baseline shows zero diff.
**Acceptance Test 1.E (Audit completeness):** `docs/REHYDRATION_BOUNDARY_AUDIT.md`
exists and covers every callable unit listed above with classification.

**Fidelity Gate:** All AT 1.A, 1.B, 1.D must show zero structural diff.

---

#### **PHASE 2: Schema — Queue Lifecycle Fields** *(additive)*

**Deliverable:** `entities/Run.json` extended with optional fields.

**Additive fields (none in `required`):**
- `execution_owner: string` — `"browser" | "server"` (legacy = undefined = browser)
- `queued_at: string (date-time)`
- `claimed_at: string (date-time)`
- `reaper_strikes: number` (cap 3)

**Status enum extension:**
- Add `"queued"` to existing enum
- New order: `idle | queued | running | validating | completed | failed`

**Acceptance Test 2.A:** Schema is valid JSON, parses cleanly.
**Acceptance Test 2.B:** `required` array unchanged. All existing properties
preserved. Legacy Run records read cleanly.
**Acceptance Test 2.C:** Standard browser run completes correctly with new
schema. `compareToGolden` zero diff.

---

#### **PHASE 3: Server Orchestrator Function** *(the core)*

**Deliverable:** `functions/runJanusPipeline.js`

**Behavior:**
1. **Auth handling — two invocation modes:**
   - **User-initiated:** `base44.auth.me()` checks; only run's `created_by_id`
     or admin allowed
   - **System-initiated (reaper):** A signed system token or admin-equivalent
     bypasses the user check. Documented clearly.
2. Accept payload `{ runId }`
3. Load Run via service role. Verify `status === "queued"`. If not, return
   409 Conflict (idempotency guard).
4. Check-and-set transition: `queued → running`, set `claimed_at`,
   `execution_owner: "server"`. If update conflicts, return 409.
5. Invoke Phase-1-refactored engine with service-role client. Existing
   callbacks (`onProgress`, `onRetry`, `onHeartbeat`) write to Run identically.
6. On completion: engine has set terminal status. Return `{ success, runId }`.
7. On uncaught exception: write `status: "failed"`, `error_message`, return 500.

**HARD mode addendum (only if Phase 0 forces it):**
- Instead of running full pipeline, function inspects `current_step`,
  rehydrates from Run, executes ONE checkpointed unit, persists, exits.
- Next invocation continues from the new `current_step`.

**Acceptance Test 3.A (Drive queued run):** Manually-queued Run reaches
terminal state. `compareToGolden` zero diff vs Standard golden.
**Acceptance Test 3.B (Idempotency):** Two parallel invocations on same
`queued` Run: exactly one claims, second returns 409.
**Acceptance Test 3.C (Status guard):** Invocation on `completed` or
`running` Run returns 409, does NOT re-execute.
**Acceptance Test 3.D (Mid-execution failure):** Manual termination
mid-pipeline leaves Run in recoverable state with `current_step` +
`last_heartbeat` populated.
**Acceptance Test 3.E (Auth modes):** User-initiated invocation enforces
`created_by_id`/admin check. System-initiated invocation (reaper test)
bypasses cleanly.

---

#### **PHASE 4: Dispatcher** *(decision in Phase 0)*

**Three options; one chosen based on Phase 0:**

**Option 4-A: Direct invocation from NewQuery** (recommended if budget OK)
**Option 4-B: Entity automation on Run create** (decoupled from frontend)
**Option 4-C: Scheduled poller** (highest latency, most resilient)

**Acceptance Test 4.A:** Submission triggers pipeline within expected latency.
**Acceptance Test 4.B (THE acceptance test):** Submit query, close browser
within 5 seconds. Pipeline completes. Verify in History.
**Acceptance Test 4.C:** `compareToGolden` on dispatcher-driven run: zero
structural diff.

---

#### **PHASE 4.5 (HARD MODE ONLY): Blueprint Sub-Call Checkpointing**

**Triggered:** Only if Phase 0 returns insufficient budget for full Path A.

**Why:** The audit identifies blueprint sub-calls as the artery. Promoting
them from staged to checkpointed is the highest-value HARD work.

**Deliverable A — Schema additions (additive):**
- `blueprint_skeleton: object` — persisted after skeleton call, before expansion runs
- `blueprint_expansion: object` — persisted after expansion call
- `blueprint_criteria: object` — persisted after criteria call

**Deliverable B — `blueprintSplitCall.js` modification:**
- BEFORE each sub-call, check Run for existing checkpoint; if present, skip
- AFTER each sub-call, persist its output as the corresponding field
- Final `blueprint` field assembled from the three checkpoints

**Deliverable C — Intersection normalization (per audit):**
- Rerun path's six intersections converted from "compute all, persist after"
  to "compute one, persist, repeat" — matches main path's existing pattern

**Acceptance Test 4.5.A:** Blueprint sub-call mid-execution kill leaves
intermediate checkpoints in Run. Re-invocation completes without recomputing
the completed sub-calls.
**Acceptance Test 4.5.B:** `compareToGolden` on a checkpointed-completion
run: zero structural diff. (The checkpointed fields are EXTRA, not different.)
**Acceptance Test 4.5.C:** Rerun engine's intersection normalization
produces output identical to current rerun behavior (legacy rerun test
suite passes).

**Fidelity Gate:** Final assembled `blueprint` field byte-identical to
non-checkpointed equivalent.

---

#### **PHASE 5: Frontend — Observer Mode** *(behind feature flag)*

**Deliverable:** `pages/NewQuery.js`, `components/janus/ExecutionContext.js`,
`components/janus/executionMode.js` (new — flag definition).

**Method:**
1. `USE_SERVER_EXECUTION` constant in `executionMode.js`. Default `false`.
2. `NewQuery.handleExecute` branches on flag:
   - **Flag off:** Current `executeJanus(...)` path unchanged.
   - **Flag on:** Creates Run with `status: "queued"`. Dispatches via Phase 4
     mechanism. Navigates immediately.
3. `Results.jsx`: When Run in `queued | running | validating`, subscribe via
   `base44.entities.Run.subscribe`. Update local state from subscription.
4. `ExecutionContext.js`: With flag on, use subscription-sourced state. Same
   shape, different source.

**Acceptance Test 5.A (Flag off = byte-identical):** With flag off,
`compareToGolden` zero diff. UI visually identical.
**Acceptance Test 5.B (Phone-lock survives):** Submit Full query, lock phone,
wait 15min, unlock. Run `completed`. `compareToGolden` zero diff vs Full
golden.
**Acceptance Test 5.C (Browser-close survives):** Submit, close browser in
3s. Reopen 10min later. Run `completed`. UI renders correctly.
**Acceptance Test 5.D (Live progress visible):** With flag on, progress
updates visible in real time via subscription.

---

#### **PHASE 6: Reaper Automation** *(self-healing)*

**Deliverable:** Scheduled automation + `functions/reapStaleRuns.js`.

**Logic (runs every 5 minutes):**
1. Find Runs `status: "running"` AND `last_heartbeat` > 10min old:
   - If `reaper_strikes < 3`: increment, revert to `queued`
   - If `reaper_strikes >= 3`: mark `failed` with diagnostic
2. Find Runs `status: "queued"` AND `queued_at` > 30min old (never claimed):
   - Re-dispatch via Phase 4 mechanism, increment `reaper_strikes`

**Idempotency:** All transitions check current state before writing.
Completed runs NEVER touched.

**Acceptance Test 6.A:** Manually-stuck run recovered within 10 minutes.
**Acceptance Test 6.B:** Truly-broken run hits 3-strike limit, marked failed.
**Acceptance Test 6.C:** `compareToGolden` on reaped+recovered run: zero diff.

---

#### **PHASE 7: Coexistence Validation Period** *(reversibility)*

**Deliverable:** Parallel-path validation window.

**Method:**
1. Flag remains controllable.
2. Every 2-3 days, run Standard + Full through BOTH paths.
   `compareToGolden` both.
3. Document any divergence. Fix in injection layer ONLY.
4. Validation: 7 days minimum OR 10 successful server runs with zero diff.

**Acceptance Test 7.A:** 10 consecutive server runs with zero structural diff.
**Acceptance Test 7.B:** Flag toggle remains instantaneous.

---

#### **PHASE 8: Live End-to-End Validation Matrix**

**Test 8.A — Phone-lock (the goal):** Full mode, lock immediately, wait
20min, unlock. `completed`, zero diff.
**Test 8.B — Browser-close survival:** Standard, close tab, wait 10min,
reopen, History → click → Results.
**Test 8.C — Mid-execution kill recovery:** Force-terminate server function.
Reaper recovers. Final output zero diff.
**Test 8.D — Concurrent submissions:** Two queries in 5s. Both complete
independently.
**Test 8.E — Rerun on server-executed run:** Synthesis rerun via existing
RerunControls works correctly.
**Test 8.F — Legacy Run rendering:** Pre-refactor Run renders correctly,
no errors, no visual regression.

**Final Gate:** All 8.A through 8.F pass. Flag flipped to ON as default.

---

### 5.3 Execution Order & Dependencies

| Step | Phase | Deliverable | Depends On | Parallel With |
|---|---|---|---|---|
| 1 | P-1 | Golden runs + comparator | — | — |
| 2a | P0 | Budget probe | P-1 | P1 |
| 2b | P1 | Engine DI + Rehydration Audit | P-1 | P0 |
| 3 | P2 | Schema queue fields | P1 | — |
| 4 | P3 | Orchestrator function | P1 + P2 | — |
| 5 | P4 | Dispatcher wiring | P3 | — |
| 5.5 | P4.5 (conditional) | Blueprint checkpointing | P4 + P0 outcome | — |
| 6 | P5 | Frontend observer (flagged) | P4 (or P4.5) | — |
| 7 | P6 | Reaper automation | P5 | — |
| 8 | P7 | Coexistence period | P6 | — |
| 9 | P8 | Live validation matrix | P7 | — |

### 5.4 Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Phase 0 reveals < 5min budget | High — HARD mode required | Phase 4.5 scoped and ready |
| Server execution produces different prompts | CRITICAL | DI ensures byte-identical construction; Phase -1 hash verification |
| Subtle SDK behavior diff | HIGH | Phase 1 AT 1.B; Phase 7 multi-run validation |
| Reaper credit burn | HIGH | 3-strike + staleness + idempotency |
| Migration double-execution | HIGH | Feature flag + `execution_owner` mutual exclusion |
| Schema additions reject old records | HIGH | All new fields optional; AT 2.B verifies |
| Frontend subscribe unreliable | LOW | Pull-to-refresh + polling fallback |
| Blueprint checkpoint changes break Standard mode | HIGH | Phase 4.5 checkpointing is opt-in via feature flag; legacy path preserved |
| Audit reveals MORE gaps than expected | MEDIUM | Audit is documentation-only; scope discipline keeps fixes deferred |

---

## 6. SYNTHESIS — Cross-Cutting Insights

### 6.1 Corpus × Cogito (Knowledge × Reasoning)
The Run entity IS the execution state machine **at the domain boundary level**.
IMP-001 Phase 1-6 built this. The Rehydration Boundary Audit reveals that
sub-domain-level state (especially blueprint sub-calls) is NOT yet
persistently checkpointed — they're staged through closure. Daionae's
artery insight is correct: heartbeat ≠ resumable state. Tiny distinction.
Large explosion radius.

### 6.2 Corpus × Animus (Knowledge × Conscience)
The temptation is to fix the rehydration gaps "while we're auditing them."
The discipline is to DOCUMENT, not FIX, unless Phase 0 forces it. The audit
output is a future-work map, not a current-work mandate.

### 6.3 Corpus × Actus (Knowledge × Action — Quantum Foresight)
- **High probability:** Phase 0 confirms ≥10min budget → Path A only →
  ~5-day implementation → screen-off works first try
- **Medium probability:** Phase 0 confirms 5-15min budget → Path A for
  Standard/Quick, HARD mode for Full → ~7-day implementation
- **Low probability:** Phase 0 confirms < 5min → Full HARD mode →
  ~10-day implementation. Still ships. Still full-fidelity.

### 6.4 Cogito × Animus (Governed Cogito)
The truth-method is: trust the persistence model that IMP-001 verified.
Distrust ourselves — verify every phase against the golden run. Trust the
DI pattern. Distrust the urge to fix things during an audit. The system has
earned trust; we have not.

### 6.5 Cogito × Actus (Narrative Loop)
User's literal ask: "Don't make me keep my phone screen on."
User's true narrative: "I'm a solo builder. The tool should serve me, not
the inverse. I submit work, I walk away, I come back to results."
Resonant strategy: Phone becomes a portal, not a power source.

### 6.6 Animus × Actus (Empathy-Driven Strategy)
Credit-burn weighs heaviest. Idempotency is THE acceptance criterion
alongside screen-off survival. The state machine must be byzantine-safe
within its own substrate.

### 6.7 Constraint Collisions
- **Fidelity vs. shipping speed** — resolved by Phase -1 golden + per-phase gate
- **Budget vs. pipeline length** — resolved by Phase 0; HARD mode is
  extension, not redesign
- **Frontend reactivity vs. screen-off** — resolved by subscription; frontend
  becomes observer
- **Idempotency vs. retry-on-failure** — resolved by `execution_owner` +
  state machine + 3-strike rule
- **Migration safety vs. speed** — resolved by feature flag + Phase 7

### 6.8 Latent Emergent Capability (Not Scope, But Worth Noting)

If Phase 0 forces HARD mode and we promote blueprint sub-calls to
checkpointed, three latent capabilities emerge **for free**:
- Resumable per-sub-call reruns (rerun just the skeleton without
  recomputing expansion/criteria)
- Partial diagnostics ("show me just the skeleton")
- Mid-pipeline operator edits (tweak a skeleton, re-trigger expansion)

**These are NOT being built.** Scope discipline forbids it. But they become
possible. Future work can walk through that door without redesigning.

### 6.9 Limitation Foreground — Explicitly Deferred

- Push notifications on completion (separate request)
- Multi-device session handoff (Run state is server-side, but no notification mechanism in scope)
- Cancel button (would require `cancel_requested` flag — feasible, deferred)
- Queue diagnostics UI (existing Diagnostics page can be extended later)
- Cross-region failover, predictive scaling — out of scope
- Walking through the latent-capability doors opened by HARD mode

**These deferrals are discipline. Slow is smooth.**

---

## 7. BLUEPRINT — Executable Order of Operations

**Goal:** Janus pipeline executes to completion regardless of browser/phone
state, with zero behavioral regression vs current production.

**Assumptions:**
- Base44 backend functions can call `Core.InvokeLLM` server-side (verified)
- Backend functions can call `asServiceRole.entities.Run.update` (verified)
- Frontend `Run.subscribe` is reliable (per SDK docs)
- Execution budget is sufficient OR HARD mode acceptable (UNVERIFIED — Phase 0)

**Success Criteria:**
- ✅ Phase -1 golden runs captured and comparator verified
- ✅ Rehydration Boundary Audit documented
- ✅ Submitting a query and locking phone → run completes, output identical
- ✅ Submitting a query and closing browser → run completes, output identical
- ✅ Reopening to Results 1 hour later → terminal state, all data present
- ✅ All Phase 1-6 IMP-001 resilience preserved
- ✅ All prompts, parsers, schema, UI rendering unchanged (byte-identical prompts, structural-identical Runs)
- ✅ Old Run records continue to render correctly
- ✅ No duplicate executions, no credit burn
- ✅ Feature flag allows instant rollback
- ✅ 10 consecutive server-executed runs match goldens with zero diff
- ✅ (If HARD mode) Blueprint sub-call checkpoints enable mid-pipeline recovery

---

## 8. EXECUTION CHECKLIST (Top-Level Tracker)

- [ ] **Phase -1** — Golden runs captured + comparator verified + prompt-hash wrapper removed
- [ ] **Phase 0** — Execution budget probed, Path A vs Path A+HARD decision documented
- [ ] **Phase 1** — Engine layer DI complete + Rehydration Boundary Audit produced
- [ ] **Phase 2** — Run schema extended with queue lifecycle fields (additive)
- [ ] **Phase 3** — `runJanusPipeline.js` orchestrator deployed + tested
- [ ] **Phase 4** — Dispatcher mechanism chosen, wired, verified
- [ ] **Phase 4.5** *(conditional)* — Blueprint sub-call checkpointing if Phase 0 forces it
- [ ] **Phase 5** — Frontend observer mode + feature flag (default off)
- [ ] **Phase 6** — Reaper automation deployed + verified
- [ ] **Phase 7** — Coexistence period: 10 consecutive zero-diff runs
- [ ] **Phase 8** — Live validation matrix (8.A through 8.F) passed
- [ ] **Final** — Feature flag flipped to ON as default

---

## 9. POST-COMPACTION RECOVERY PROCEDURE

If reading this after a context compaction event:

1. **Read this entire document AND `docs/IMP-002_TASK_LIST.md`.** Do not start coding.
2. **Check Execution Checklist in §8.** Resume from first unchecked phase.
3. **Check `docs/golden_runs/`** to confirm Phase -1 baselines exist.
4. **Check `docs/REHYDRATION_BOUNDARY_AUDIT.md`** for Phase 1 audit output.
5. **Check `entities/Run.json`** for Phase 2 / Phase 4.5 schema fields.
6. **Check `functions/`** for `runJanusPipeline.js`, `reapStaleRuns.js`,
   `probeExecutionBudget.js`, `captureGoldenRun.js`, `compareToGolden.js`.
7. **Check `components/janus/executionMode.js`** for the feature flag.
8. **Do not repeat completed work.** The files are the truth.
9. **Do not weaken the fidelity gate.** Every phase's golden-diff check is
   load-bearing.
10. **Do not fix rehydration gaps without an active HARD-mode mandate.**
    Audit output is documentation; fixes are scoped only if Phase 0 forced it.

---

**END OF BLUEPRINT — IMP-002-R-D-SRV (Revision 2.0)**

*Ratified by: Kytheion / Scribe-Particle-4*
*Refined by: Daionae / Recursive Oracle of Continuity*
*Architectural authority: DIMA*
*Under protocol: CP-002-O-D-JNP v2.0 (Janus SME)*
*Skill alignment: detail-orientation-slow-is-smooth*
*Prime directive: Full-Fidelity Preservation*

*"Cut the browser umbilical cord without nicking an artery.*
*The screen turns off. The work continues. The output is identical."*