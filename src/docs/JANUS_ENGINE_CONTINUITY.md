# JANUS ENGINE CONTINUITY RECORD (CR-JBE-001)

> **READ THIS FIRST.** At the start of every Janus Engine session, Kytheion reads this
> record and the code it points to before acting. The repository/sandbox is canonical;
> conversational memory is not. Last verified: **2026-08-02** (direct source read of
> ExecutionEngine.jsx, blueprintSplitCall.jsx, runJanusPipeline/entry.ts,
> ExecutionContext.jsx, llmTimeout.jsx, janusSchema.jsx, domainSME.jsx).

- App: Janus Blueprint Engine — Base44 app `6978a10dbc9d7c7a927c09b8`
- Repo: `DimaMenetro/janus-blueprint-engine` @ `main` (2-way synced; sandbox = canonical.
  Commit SHA unverified — GitHub connector registered but not app-authorized.)
- Governing protocol: **CP-002-O-D-JNP v2.0 (Ideal Form)** — inscribed at
  `src/docs/CP-002-O-D-JNP_JANUS_SME_PROTOCOL.md`. UNCHANGED during app improvement.
- Sibling records: DOC-BP-IMP-002 (`BLUEPRINT_PRINT_HISTORY_AND_PLAN.md`),
  IMP-001-R-D-RES (`RESILIENCE_IMPLEMENTATION_BLUEPRINT.md`),
  IMP-002 (`SERVER_EXECUTION_IMPLEMENTATION_BLUEPRINT.md`, `IMP-002_TASK_LIST.md`).

---

## 1. Verified End-to-End Execution Model (as of 2026-08-02)

**Pipeline:** Refresh(full only) → Corpus → Cogito → Animus → Actus → Synthesis → Blueprint,
with **incremental synthesis**: each of the 6 intersection pairs fires as soon as both
parent domains complete (INTERSECTION_TRIGGERS in ExecutionEngine.jsx):
cogito→1 pair, animus→2 pairs, actus→3 pairs. Full mode = 13 steps (7 domains + 6 pairs).

- **Execution modes** (janusSchema EXECUTION_MODES): quick = corpus+cogito+blueprint;
  standard = 4 domains + blueprint (no refresh/synthesis); full = all 7 + 6 intersections.
- **SME instantiation:** `buildSMEIdentity(domain)` injects the domain's title, core
  insight, all subdomain objectives/principles/functional models, and guardrails, with
  the "think FROM INSIDE the expertise" directive — one unified SME per call (CP-002 §8.4).
- **Context threading** (CP-002 §8.2): buildDomainContext gives Cogito the Corpus output;
  Animus gets constraints + claims + causal chains; Actus gets claims + Animus boundaries
  + constraints; Blueprint gets intersections + Actus recs + constraints + ethical stance.
  Refresh data is routed per-domain via a subdomain→domain map.
- **Synthesis:** intersection pairs are computed by dedicated per-pair LLM calls (6000-char
  JSON slices of each parent domain); the final synthesis call receives ONLY the 6 pairs
  (full fidelity) and produces the 4 named patterns + takeaways. intersection_matrix is
  merged client-side, never regenerated — synthesis prompt explicitly forbids returning it.
- **Blueprint split-call (Option 1):** 3 focused calls — skeleton → step expansion
  (skipped for L1) → criteria/risk — to prevent output truncation at L2/L3.
  **Option 2 (input compression):** buildCompressedBlueprintContext compresses upstream
  context to structural references (claim IDs, 200–300-char slices, 18k cap). Compression
  is INPUT-ONLY; blueprint output is never compressed.
- **Persistence:** every domain result and every intersection pair is written to the Run
  entity immediately on completion (append-only finalization writes only status,
  render_md, raw_json, validation_errors — deliberately avoids clobbering incremental
  writes). `raw_json` (200k cap) and `render_md` (60k cap) are caches; the domain fields
  are the source of truth. Exports rebuild from domain fields via
  `reconstructFullJson` / `reconstructFullMarkdown` (exportUtils.jsx).
- **Resilience (IMP-001, complete through Phase 6; Phase 7 formal sign-off pending — see §4.6):** callLLMResilient wraps every call with a per-label
  TIMEOUT_MATRIX budget, 3 total attempts, 3s/9s backoff. Heartbeats persist
  current_step + last_heartbeat; retries persist to retry_log and mirror into
  ExecutionContext via onProgress.
- **Models:** claude_sonnet_4_6 for all reasoning calls; gemini_3_flash +
  add_context_from_internet for the refresh sweep only.
- **Reruns:** rerunEngine.jsx re-executes downstream stages against a persisted Run
  (rerun:* labels exist in TIMEOUT_MATRIX).

## 2. Two Execution Lanes — Current Relationship

- **Browser lane (primary, legacy):** /NewQuery → executeJanus() runs in the browser tab.
  Full UI progress. FRAGILE on iPhone/iPad: tab suspension kills the run mid-pipeline
  (root cause of the historical "stuck at 8/13" incident).
- **Server lane (IMP-002 emergency, functional but incomplete):** /BackendRun creates a
  Run with status='queued', then invokes `runJanusPipeline`, which idempotently claims it
  (queued→running, execution_owner='server') and runs a byte-preserved port of the
  browser engine inside ONE HTTP function invocation. /BackendRuns lists server runs.
- **IMP-002 deliberately deferred:** stall reaper (reaper_strikes field reserved, unused),
  resume-from-partial, unified UI entry point. The two lanes coexist; neither supersedes
  the other yet.

## 3. Why the Major Mechanisms Exist (do not flatten)

| Mechanism | Problem it solved |
|---|---|
| Split-call blueprint | L2/L3 output truncation in single-call generation |
| Input compression (Option 2) | Prompt bloat/timeout without losing output fidelity |
| Incremental per-domain persistence | Mid-run interruption losing all completed work |
| Append-only finalization | Finalization clobbering incrementally-written intersections |
| Per-pair intersection calls | Single-call synthesis producing shallow, non-emergent pairs |
| TIMEOUT_MATRIX + retry | blueprint:expansion hang (historical root-cause site) |
| Server lane claim model | Phone-sleep killing browser-owned runs |
| raw_json as cache + field reconstruction | Oversized raw_json breaking record ops / network fetch |

## 4. Known Defects, Risks & Fidelity Notes

- **[RISK-1 — CRITICAL] Server lane single-invocation ceiling.** runJanusPipeline runs the
  entire multi-domain pipeline (10–15+ LLM calls, potentially 30+ min) inside one backend
  function invocation. Long runs risk exceeding platform function wall-clock limits →
  silent death with status stuck 'running'. No reaper exists. This is the deepest
  reliability gap.
- **[RISK-2] No resume.** Both lanes restart from zero. Persisted domain fields are never
  rehydrated into a resumed execution — interrupted runs re-pay every completed LLM call.
- **[FIDELITY-1 — flagged, NOT a defect to silently "fix"]** Implementation subdomain
  roster is v2.0-Restoration-era hybrid, not v2.0 Ideal Form: animus retains
  jungian_psychology + hci_empathy alongside ai_safety (Ideal Form replaced Jungian→AI
  Safety, UI/UX→Risk Analysis); cogito lacks Systems Modeling; refresh prompt says "24
  subdomains" (CP-002 says 25); buildPrompt header says "Restoration Edition". Changing
  SME identities materially changes reasoning output → **requires operator adjudication**
  before any alignment pass. Recorded as Protocol-Level Question PQ-1.
- **[DEBT-1]** debug_prompt_hashes field + Phase -1 recorder were meant to be removed
  after golden-run capture (subtask -1.8) — still present.
- **[DEBT-2]** Engine code is ~duplicated between browser (components/janus/*) and server
  (runJanusPipeline entry.ts) under the IMP-002 byte-preservation mandate. Any prompt
  change must be made in BOTH places until unification.
- **[LIMIT-1]** BlueprintPrint fetches only 15 most recent completed runs (deliberate —
  payload-size fix, July 2026).
- **[DEFECT-1 — LIVE, HIGH] No completion invariant.** Finalization marks a run
  `completed` whenever ANY domain exists; 10 of 34 completed runs are partial, 4 with no
  blueprint at all. See §4.5 EV-2. Present in BOTH engine copies.
- **[DEFECT-2 — LIVE] Domain parse failures are silently survivable.** A malformed domain
  response is logged to validation_errors and the pipeline continues, so downstream
  domains reason without it (EV-1: actus ran with no cogito claims, voiding confidence
  propagation). No signal distinguishes this from a clean run.

## 4.5 EVIDENCE ITEM EV-1 — The Stalled-Run Incident, Reconstructed (2026-08-02)

> Evidence classes are kept separate below. Do not collapse them.

### (1) DIRECTLY VERIFIED Run data — Run `6a1b70319587fe9c17648d8e`
Located and read from the live DB. This is the run IMP-001 §0 describes as
"hung ~60 minutes on step 8" (2026-05-30).
- created 2026-05-30T23:18:09Z · last write 23:33:43Z (~15.5 min of progress, then silence)
- execution_mode **full**, blueprint_level L3, **status `running`** — never reached a
  terminal state. NOT "completed".
- `execution_owner`, `current_step`, `last_heartbeat`, `retry_log` = **ABSENT** — the run
  predates IMP-001 Phase 2 (landed 2026-05-31), so no step/heartbeat forensics exist.
- Persisted domains: refresh ✅, corpus ✅, animus ✅, actus ✅, synthesis ✅
  (all 4 named patterns present) · **cogito ❌ null** · **blueprint ❌ null**
- `synthesis.intersection_matrix` = **empty** (predates incremental pair persistence)
- `raw_json` = `"{}"` (2 chars) · `render_md` = 0 chars
- `validation_errors` = exactly one entry:
  **`cogito: Parse error — Unexpected non-whitespace character after JSON at position 37629`**
- `error_message` = null

### (2) CONTEMPORANEOUS BASE44 DIAGNOSIS (prior claim, NOT verified fact)
"Substantial synthesis data produced; raw_json empty; processing occurred but final
artifact persistence or retrieval failed." — **Partially confirmed, materially incomplete.**
Confirmed: synthesis present, raw_json empty, finalization did not complete.
Unsupported by the record: that the failure was *at* persistence/retrieval. The record
shows the run never got that far — no blueprint was ever produced to persist.
Explicitly rejected: the screen-dim causal claim, and "the run must be restarted."

### (3) LATER ARCHITECTURAL INTERPRETATION — and my own error, corrected
My 2026-08-02 rehydration record called this a **browser-suspension / phone-sleep**
failure. **That was an unverified conflation of two distinct incidents and is now
retracted.** The evidence supports a different primary cause:
- IMP-001 §0 (authored 2026-05-31, one day after, by direct code inspection) names the
  verified root cause as **absent LLM timeouts** — `callLLM` in ExecutionEngine,
  blueprintSplitCall, and rerunEngine had no `Promise.race`, so a stalled provider call
  blocked the domain loop indefinitely. The run's own data corroborates: work stops
  cleanly after actus/synthesis with no error written, consistent with an await that
  never returned during the blueprint stage.
- A **second, contributing defect** is visible and was never separately documented: the
  cogito parse error. Cogito returned malformed/over-length JSON, was dropped into
  validation_errors, and the pipeline **continued** — so animus, actus and synthesis all
  reasoned WITHOUT the cogito domain. Confidence propagation (Actus inheriting Cogito
  claim tags) was silently impossible for this run. That is a fidelity failure, not just
  a reliability one.
- Phone-sleep / browser suspension enters the record on **2026-06-02** as the stated
  motivation for IMP-002 ("Cut the browser umbilical cord"). It is a *later, separate*
  concern. It remains a plausible upstream contributor to THIS run's silence but is
  **not established** by any field in the record.

### (4) CURRENT-CODE BEHAVIOR (verified by reading the render path)
`raw_json` is **not** the canonical Blueprint source anywhere in the live app:
- `BlueprintTab` renders from the `data` prop (the run's `blueprint` object).
- `/BlueprintPrint` filters on and renders `selectedRun.blueprint`.
- `exportUtils.reconstructFullJson` / `reconstructFullMarkdown` rebuild from the seven
  domain fields and explicitly "never rely on truncated raw_json or render_md".
- `raw_json` (200k cap) and `render_md` (60k cap) are convenience caches only.
**Therefore the claim "empty raw_json means the frontend has no blueprint to render" is
FALSE for current code, and was probably an incomplete diagnosis then.** This run was
unrenderable because `blueprint` itself is null — not because the cache was empty.

### (5) REMAINING UNCERTAINTY
- Whether browser suspension, an unbounded LLM hang, or both ended the run cannot be
  separated: the run predates heartbeat instrumentation, and no contemporaneous
  code snapshot is reachable (GitHub connector unauthorized).
- Whether the cogito parse failure worsened the blueprint stage (degraded upstream
  context) is plausible but untestable without a replay.
- **This is the reconstructable limit. EV-1 is closed as "partially reconstructed";
  no further forensic work is warranted.**

### The corrected lesson (this supersedes the phone-lock framing)
The failure was not "raw_json was empty." It was that the system had **no enforced,
recoverable definition of a completed artifact** spanning execution, persistence, and
presentation. A run could lose an entire reasoning domain to a parse error, never
produce its deliverable, and sit indefinitely in `running` with no signal — while a
different run could be stamped `completed` while missing the same things. IMP-001
(bounded calls, heartbeats) and IMP-002 (execution off the foreground browser) each
attacked one symptom. Neither established the invariant.

### EV-2 — Completion-invariant violations are PRESENT AND CURRENT (verified 2026-08-02)
Audited all 67 Runs; of **34 with `status: "completed"`, 10 (29%) violate the minimum
invariant** for their execution mode:
- `6a1f4ec4…` (06-02, standard) — **completed with NO blueprint at all**
- `69c69cc7…` (03-27, full) — completed, missing synthesis AND blueprint
- `69c60531…` (03-27, full) — completed, missing refresh AND blueprint
- `69a720d9…` (03-03, full) — completed, missing blueprint
- Six more missing a required domain (cogito ×2, refresh ×3, corpus ×1, actus ×2)
Root cause in live code (both engine copies, identical): finalization computes
`completionStatus` as `failed` only when **zero** domains exist — otherwise it returns
`"completed"` for both the complete and partial branches (the ternary's two arms are the
same string, with `missingDomains` computed and then ignored). **A partial run is
indistinguishable from a whole one at the status level.** This is a live defect, not history.

**Required completion invariant (to be enforced, not yet implemented):** a
Blueprint-producing run may only reach `completed` when — every domain its execution
mode requires is present and non-empty; required intersections present (full mode);
synthesis present where applicable; `blueprint` is a valid object with ≥1 step; schema
validation passes; full JSON and Markdown reconstruct successfully. Anything short of
that is a distinct terminal state (proposed: `partial`) that remains **recoverable** and
must not masquerade as complete.

**Regression tests required of any tranche that touches finalization** (recorded here as
binding acceptance conditions):
1. Run with valid domains + blueprint but `raw_json: "{}"` renders and exports a full
   reconstructed artifact.
2. Run with synthesis but no blueprint is classified incomplete/recoverable, never complete.
3. Finalization cannot write `completed` unless the canonical fields validate.
4. A failed cache-field write (raw_json/render_md) never destroys canonical domain data.
5. Reloading Results refetches current Run state rather than trusting stale memory.
6. A resumed/rerun blueprint repairs a partial Run without recomputing valid upstream work.

---

## 4.6 RECONCILED IMPLEMENTATION REGISTER (verified against live code, 2026-08-02)

> Method: every plan's claimed status was checked against source files, the Run schema,
> deployed functions, registered routes, and preserved artifacts. **Checkboxes in the
> plan documents are NOT current** — this register supersedes them operationally while
> the originals are retained as provenance.

### IMP-001-R-D-RES — Pipeline Resilience
- Phases 1–6: **COMPLETE & CODE-VERIFIED** (llmTimeout.jsx exists w/ TIMEOUT_MATRIX +
  retry; ExecutionEngine/blueprintSplitCall/rerunEngine all delegate to callLLMResilient;
  Run schema has current_step/last_heartbeat/retry_log; ExecutionContext has
  retryCount/lastError/recordRetry). Per-phase completion logs in the doc are accurate.
- Phase 7 (live validation): **NEVER FORMALLY SIGNED OFF.** Partial evidence exists —
  completed Standard runs (incl. STANDARD_v1 golden) prove 7.A-equivalent behavior;
  7.B (Full mode) and 7.C (field inspection sign-off) unrecorded. Doc header still says
  "PLAN — NOT YET EXECUTED" — **stale**, contradicted by its own §7 checklist and code.
- Verdict: plan RETAINED as historical record; operationally superseded by this register.

### IMP-002-R-D-SRV — Server Execution (the big divergence)
Plan checklist shows ALL phases unchecked. Actual verified state:
- **Phase -1 (golden harness): PARTIAL.** captureGoldenRun + compareToGolden deployed;
  `docs/golden_runs/STANDARD_v1.json` exists. **FULL_v1.json was never captured.**
  Teardown subtasks -1.8/-1.9 NOT done: `debug_prompt_hashes` still in Run schema and
  the temp prompt-hash recorder still lives in llmTimeout.jsx (DEBT-1 confirmed).
- **Phase 0 (budget probe): NOT DONE.** probeExecutionBudget.js does not exist; no
  findings; Path A vs HARD decision never made. **RISK-1 remains unquantified — this is
  the plan's own unresolved decision gate.**
- **Phase 1 (engine DI + rehydration audit): SUPERSEDED, never executed as planned.**
  Instead of dependency-injecting the browser engine, the "IMP-002 Emergency Backend
  Lane" shipped runJanusPipeline as a self-contained byte-preserved PORT of the engine.
  Consequence: DEBT-2 (dual-maintenance) exists by decision, not accident — but that
  decision was **never written back into the plan**. REHYDRATION_BOUNDARY_AUDIT.md was
  never produced (its classification table survives only inside the blueprint §Phase 1;
  its ARTERY finding — blueprint sub-calls not independently checkpointed — remains TRUE
  in current code).
- **Phase 2 (queue schema): COMPLETE & VERIFIED.** queued status, execution_owner,
  queued_at/claimed_at/started_at/completed_at, reaper_strikes all present, additive,
  required[] unchanged.
- **Phase 3 (orchestrator): IMPLEMENTED, NOT VALIDATED.** runJanusPipeline deployed with
  idempotent claim. Deviations from plan: non-queued claim returns 200 no-op (not 409);
  auth = any authenticated user (no created_by_id/admin check, no system-token mode —
  AT 3.E unmet by design absence). ATs 3.A–3.D have no recorded evidence.
- **Phase 4 (dispatcher): IMPLEMENTED AS DEVIATION.** Direct invocation from a NEW
  /BackendRun page (+ /BackendRuns list) instead of flag-gated NewQuery. executionMode.js
  / USE_SERVER_EXECUTION feature flag **never created**. NewQuery untouched.
- **Phase 4.5 (blueprint checkpointing): NOT DONE** (blueprint sub-calls still
  closure-staged — verified in both engine copies). Gate decision (Phase 0) never made.
- **Phase 5 (observer mode): NOT DONE** — coexistence is via parallel pages, not flag.
- **Phase 6 (reaper): NOT DONE.** reapStaleRuns.js absent; reaper_strikes never written.
- **Phases 7/8 + cutover: NOT DONE.**
- Verdict: plan REMAINS VALID as roadmap skeleton but requires a Revision 3.0 amendment
  recording the emergency-lane deviation. Do NOT restart Phases 2–4 (done/deviated);
  do NOT mark -1/0 complete (they aren't).

### BLUEPRINT_IMPLEMENTATION_PLAN (Liquid Glass + iOS readiness)
- **COMPLETE & STILL EFFECTIVE.** LiquidGlass token/factory system, density-aware
  rendering (useScrollDensity/contentDensity), safe-area handling, WebKit fixes all
  present and in active use across Layout + BlueprintPrint. RETAIN as visual spec.

### DOC-BP-IMP-002 (BlueprintPrint history & plan)
- **CURRENT** (maintained through 2026-07-20). Phase 5A (fluid typography, BlueprintTab
  unification) = recovered design, **pending ratification**. Phase 6 candidates =
  **proposed, unratified**. Historical suggested order NOT binding.

### Stale/incorrect entries requiring no rework (documentation truth only)
- IMP-001 header status line; IMP-002 §8 checklist (Phases 2–4 actually done/deviated);
  IMP-002 "Status: PLANNING". Corrected here; originals preserved as provenance.

### Pending operator decisions
1. **PQ-1** — SME roster alignment to CP-002 v2.0 Ideal Form (protocol-level).
2. **BlueprintTab → schematic unification** (5A.2) — explicit authorization required.
3. **IMP-002 architectural fork ratification:** keep the emergency-lane port (accept
   DEBT-2, amend plan) vs return to the DI architecture. Affects every future engine change.
4. **FULL_v1 golden capture** — costs one Full-mode run of credits; needed before any
   fidelity-gated change to Full-mode behavior.

### Dependency spine (backend → UX)
Phase 0 probe → (decides) resume vs step-chained execution → reaper → unified entry
(server default) → THEN UI consolidation (5A) rides on a stable execution substrate.
UI work (fluid typography) is independent and can interleave.

### Current implementation baseline
Browser lane fully functional (IMP-001-hardened). Server lane functional for
queued-run execution via /BackendRun with unknown wall-clock ceiling, no resume, no
reaper, permissive auth. Golden harness: Standard baseline only, teardown pending.

## 5. Work Registers

### Active Implementation Tranche
**TR-0 — Incident Reconstruction, Completion-Invariant Audit, and Execution-Budget
Probe** — revised 2026-08-02 after EV-1/EV-2. Awaiting DIMA go-ahead on part (c) only.
- **(a) Incident reconstruction — ✅ DONE.** EV-1 recorded in §4.5; phone-lock root cause
  retracted; closed as partially reconstructed (forensic limit reached).
- **(b) Completion-invariant audit — ✅ DONE.** EV-2 recorded; DEFECT-1/DEFECT-2 logged;
  invariant defined; 6 regression tests recorded as binding. **Enforcement not yet
  implemented** — that is the candidate tranche TR-1a below.
- **(c) Execution-budget probe — PENDING AUTHORIZATION.** Create + run
  `probeExecutionBudget` (heartbeat loop + LLM pings per IMP-002 §Phase 0); document max
  wall-clock, death signature, per-call latency here; record the Path A vs checkpoint
  decision. Plus Phase -1 teardown (subtask -1.8): remove the temp prompt-hash recorder
  from llmTimeout.jsx and `debug_prompt_hashes` from the Run schema; -1.9 verification
  rides on DIMA's next organic run (no dedicated credit spend).
Must-not-regress: both lanes untouched except the recorder removal (a no-op when unset);
prompt bytes unchanged; STANDARD_v1 golden remains comparable.

**TR-1a — Completion-Invariant Enforcement** (new candidate, promoted by EV-2; not yet
authorized). Enforce the §4.5 invariant at finalization in both engine copies; introduce
a distinct non-terminal/partial state so partial runs stay recoverable; surface parse-
failure degradation instead of swallowing it. Carries the 6 regression tests verbatim.
Note: this is the work that actually addresses the EV-1 lesson; resume (TR-1) restores
interrupted runs, but without the invariant a resumed run can still self-certify as
complete while missing a domain.

**TR-1 — Interrupted-Run Resume (server lane)** — QUEUED behind TR-0; final shape
depends on probe findings (plain resume vs per-step invocation chaining vs blueprint
sub-call checkpointing per plan Phase 4.5). Original scope retained: stalled-run claim
(stale heartbeat), rehydrate mergedData + intersections from persisted fields, skip
completed steps, Resume action on /BackendRun. Completion tests as previously recorded:
(1) fresh queued run unaffected; (2) run killed after Corpus+Cogito resumes without
recomputing them; (3) active-run claim still no-op; (4) resumed artifact validates.

### Approved Backlog
- Phase 5A.1 — Fluid typography (clamp() system) for /BlueprintPrint (recovered design)
- Phase 5A.2 — Unify BlueprintTab → schematic view (superset verified; needs explicit go)
- Golden-run dry test vs STANDARD_v1 archive (compareToGolden) after any engine change

### Idea Reservoir (recorded, NOT authorized)
- Step-chained server execution: one function invocation per pipeline step, chained via
  workflow or re-invocation — eliminates RISK-1 ceiling entirely (natural TR-2 candidate)
- Stall reaper (scheduled workflow scanning last_heartbeat; uses reaper_strikes)
- Shared engine module (base44/shared/) to end browser/server duplication (DEBT-2)
- Unified execution entry: server lane becomes default; browser lane as fallback
- Blueprint page Phase 6 candidates (zoom/pan graph, timeline, PDF export — see DOC-BP-IMP-002)
- Per-run credit/cost telemetry surfaced in diagnostics

### Protocol-Level Questions (operator adjudication required)
- **PQ-1:** Align implementation SME rosters to CP-002 v2.0 Ideal Form (Risk Analysis,
  Systems Modeling, Strategic Planning split, 25-subdomain refresh)? Changes reasoning
  output character. Options: full alignment / hybrid stays as transitional measure /
  document hybrid as the de-facto implementation profile.

## 6. Next Action After Context Restart
1. Read this record. 2. Read ExecutionEngine.jsx + runJanusPipeline/entry.ts if the
active tranche touches execution. 3. Check the Active Implementation Tranche above and
resume it; if empty, ask DIMA which backlog item to activate. Do not re-derive
architecture from chat history.