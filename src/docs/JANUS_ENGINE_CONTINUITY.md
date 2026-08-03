# JANUS ENGINE CONTINUITY RECORD (CR-JBE-001)

> **READ THIS FIRST.** At the start of every Janus Engine session, Kytheion reads this
> record and the code it points to before acting. The repository/sandbox is canonical;
> conversational memory is not.
>
> **Last verified: 2026-08-03** (amendment pass: TR-0(c) probe, Phase -1 teardown +
> validation V-1…V-7, TR-0(e) execution-path research, whole-app assessment ASM-JBE-001,
> and a contradiction-reconciliation sweep of §2, §4 DEBT-1, §4.6, and the Work Registers).
> Prior verification 2026-08-02 (direct source read of ExecutionEngine.jsx,
> blueprintSplitCall.jsx, runJanusPipeline/entry.ts, ExecutionContext.jsx, llmTimeout.jsx,
> janusSchema.jsx, domainSME.jsx).
>
> **Amendment rule (binding).** No superseded statement may remain active above its
> correction. Where a claim has been overtaken, it is either amended in place or marked
> `[HISTORICAL — SUPERSEDED]` with a pointer forward. A reader must never have to
> discover which of two mutually exclusive claims appears later in the file.

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
  Full UI progress. FRAGILE on iPhone/iPad: tab suspension can kill a run mid-pipeline —
  this is a real structural fragility of the lane.
  **⚠️ CORRECTION (2026-08-03):** an earlier revision of this line named tab suspension as
  the *root cause of the historical "stuck at 8/13" incident*. **That causal claim is
  RETRACTED** — see §4.5 EV-1(3) and EV-1(5). The incident's cause was never established;
  browser suspension survives only as unresolved hypothesis **H2** among H1–H4, which the
  evidence cannot separate. Tab-suspension fragility is a **general property of this lane**,
  not the diagnosed cause of that run.
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
- **[DEBT-1 — ✅ RESOLVED 2026-08-03]** `debug_prompt_hashes` field + Phase -1 recorder
  were meant to be removed after golden-run capture (subtask -1.8). **Both are now
  removed** — recorder and call site deleted from `llmTimeout.jsx`, field deleted from the
  Run schema, `phase1Capture.jsx` and `GoldenRunCapture.jsx` deleted. See TR-0(d).
  Residue to remember: 4 legacy runs still hold stored hash values (V-6), and the golden
  harness now has 3 dead gates (V-5).
- **[DEBT-2]** Engine code is ~duplicated between browser (components/janus/*) and server
  (runJanusPipeline entry.ts) under the IMP-002 byte-preservation mandate. Any prompt
  change must be made in BOTH places until unification.
- **[LIMIT-1]** BlueprintPrint fetches only 15 most recent completed runs (deliberate —
  payload-size fix, July 2026).
- **[DEFECT-1 — LIVE, HIGH] No completion invariant.** Finalization marks a run
  `completed` whenever ANY domain exists; 10 of 34 completed runs are partial, 4 with no
  blueprint at all. See §4.5 EV-2. Present in BOTH engine copies.
- **[DEFECT-2 — LIVE] Domain parse failures are silently survivable.** Verified in
  current code (both engines): a malformed domain response is logged to
  validation_errors and the pipeline continues; context builders include the failed
  domain's sections only when present, so downstream prompts silently omit them and
  dependent intersections are skipped. No signal distinguishes this from a clean run.
  (That EV-1's downstream domains ran without Cogito is justified inference — see
  §4.5(3b) — since the contemporaneous code is unreachable.)

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

### (3) HISTORICAL IMPLEMENTATION-PLAN DIAGNOSIS (class: historical diagnosis, not Run-proven)
IMP-001 §0 (authored 2026-05-31, one day after the incident, from direct code
inspection) diagnosed **absent LLM timeouts** — `callLLM` in ExecutionEngine,
blueprintSplitCall, and rerunEngine had no `Promise.race`, so a stalled provider call
*could* block the domain loop indefinitely. The Run record is **consistent with** that
diagnosis (work stops after actus/synthesis; no terminal failure transition or terminal
diagnostic was ever recorded — note the cogito parse error IS recorded in
validation_errors; what is absent is any *terminal* error state). The Run does **not
independently prove** it: nothing in the record shows an LLM promise hung, that a
blueprint call had started, or where between actus/synthesis and blueprint the process
died. My 2026-08-02 phone-sleep framing was an unverified conflation of two incidents
and is **retracted**; phone-sleep enters the documentary record only on 2026-06-02 as
IMP-002's motivation — a later, separate concern.

### (3b) JUSTIFIED INFERENCE (class: inference, grounded in verified code + Run data)
- **Silent degradation on domain failure.** CURRENT code (both engines, read directly):
  a domain parse failure is appended to validation_errors and the loop continues;
  `buildDomainContext` includes Cogito sections only `if (priorDomains.cogito)`, so
  downstream prompts silently omit them when Cogito is absent, and Cogito-dependent
  intersection pairs are skipped (`if (!mergedData[dA] || !mergedData[dB]) continue`).
  For the 2026-05-30 run this behavior is an **inference**: the contemporaneous code
  version is unreachable (no repo history via connector), so "animus/actus/synthesis
  reasoned without Cogito" is well-supported but not directly verified. What the Run
  directly proves is narrower: downstream outputs exist while the final cogito field is
  null, and no cogito-dependent intersection was persisted.

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

### (5) UNRESOLVED HYPOTHESES (class: hypotheses — none is established)
- H1: an unbounded LLM await hung during or before the blueprint stage (IMP-001's
  diagnosis, applied to this run).
- H2: browser suspension terminated the foreground pipeline before blueprint.
- H3: failure occurred during final normalization or while writing specific fields.
- H4: the cogito parse failure degraded downstream context enough to worsen later
  stages (untestable without replay).
- H1–H4 cannot be separated: the run predates heartbeat instrumentation and no
  contemporaneous code snapshot is reachable (GitHub connector unauthorized).
- **This is the reconstructable limit. EV-1 is closed as "partially reconstructed";
  no further forensic work is warranted.**

> Evidence-class key used throughout §4.5: (1) directly verified DB evidence ·
> (2) contemporaneous Base44 diagnosis · (3) historical implementation-plan diagnosis ·
> (3b/4) justified inference · (5) unresolved hypotheses · (6) proposed engineering
> changes (§ Work Registry, PROPOSED items) · (7) operator-authorized decisions
> (§ Work Registry, AUTHORIZED items only).

### The corrected lesson (this supersedes the phone-lock framing)
The failure was not "raw_json was empty." It was that the system had **no enforced,
recoverable definition of a completed artifact** spanning execution, persistence, and
presentation. A run could lose an entire reasoning domain to a parse error, never
produce its deliverable, and sit indefinitely in `running` with no signal — while a
different run could be stamped `completed` while missing the same things. IMP-001
(bounded calls, heartbeats) and IMP-002 (execution off the foreground browser) each
attacked one symptom. Neither established the invariant.

### EV-2 — Completion-invariant violations are PRESENT AND CURRENT (verified 2026-08-02/03)
Audited all 67 Runs: 34 with `status: "completed"`, **10 (29%) violate the minimum
invariant** for their execution mode; 4 of the 10 have no renderable blueprint at all.
**The full reproducible per-run register — Run IDs, mode, required vs missing fields,
blueprint step counts, cache sizes, validation errors, classification, renderability,
reconstructability, and repair category, plus the audit method — is preserved in
`src/docs/EV_AUDIT_REGISTER.md`. The 29% aggregate is not canonical without it.**
Root cause verified by direct read of BOTH engine copies (ExecutionEngine.jsx L596–599;
runJanusPipeline/entry.ts L1767–1770 — identical): finalization computes
`completionStatus` as `failed` only when **zero** domains exist — otherwise it returns
`"completed"` for both the complete and partial branches (the ternary's two arms are the
same string, with `missingDomains` computed and then ignored). **A partial run is
indistinguishable from a whole one at the status level.** This is a live defect, not history.

**Required completion invariant (defined here; enforcement is PROPOSED, not implemented):**
a Blueprint-producing run may only reach `completed` when — every domain its execution
mode requires is present and non-empty; required intersections present (full mode);
synthesis present where applicable; `blueprint` is a valid object with ≥1 step; schema
validation passes; full JSON and Markdown reconstruct successfully.

**Three independent state dimensions (do not collapse):**
1. **Execution-attempt state** — did this attempt end? (running / attempt-ended). An
   attempt may be over while the artifact is unfinished.
2. **Artifact-integrity state** — does the persisted artifact satisfy the invariant
   above? (complete / partial / empty). Judged from fields, never from status alone.
3. **Recoverability state** — can the artifact be finished without recomputing valid
   upstream work? (recoverable / repaired / unrecoverable).
A run may simultaneously be attempt-ended, hold a partial artifact, and be recoverable —
EV-1's run is exactly that. `status` currently conflates all three; any future state
model must express them separately rather than through one ambiguous value.

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
- **Phase -1 (golden harness): PARTIAL — teardown now COMPLETE (amended 2026-08-03).**
  captureGoldenRun + compareToGolden deployed; `docs/golden_runs/STANDARD_v1.json` exists.
  **FULL_v1.json was never captured — and see TR-0(d) V-4/V-5: no qualifying Full
  candidate currently exists in the database.**
  Teardown subtasks -1.8/-1.9: **✅ DONE 2026-08-03** (DEBT-1 resolved). The earlier
  "still present" statement is superseded.
- **Phase 0 (budget probe): ✅ DONE 2026-08-03 (amended).** `probeExecutionBudget`
  deployed and executed twice; **~295 s wall-clock ceiling measured** and independently
  corroborated by platform documentation (5-minute hard limit). **RISK-1 is now
  quantified.** The Path A vs HARD decision is *informed but still not made* — the
  candidate set is narrowed to three (TR-0(e)); selection remains an operator decision.
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

### Current implementation baseline (amended 2026-08-03)
Browser lane fully functional (IMP-001-hardened). Server lane functional for queued-run
execution via /BackendRun, but bounded by a **measured ~295 s wall-clock ceiling**
(no longer unknown — TR-0(c)), with no resume, no reaper, permissive auth. Under that
measured ceiling the server lane **cannot complete Standard or Full runs** as currently
built. Golden harness: Standard baseline only; **Phase -1 teardown COMPLETE**; harness
operational but degraded (3 of 8 gates dead — V-5); **no qualifying Full golden candidate
exists** (V-4). Production build verified passing 2026-08-03 (exit 0).

## 5. Work Registers

### Active Implementation Tranche
**TR-0 — Incident Reconstruction, Completion-Invariant Audit, and Execution-Budget
Probe** — revised 2026-08-02 after EV-1/EV-2. Awaiting DIMA go-ahead on part (c) only.
- **(a) Incident reconstruction — ✅ DONE.** EV-1 recorded in §4.5; phone-lock root cause
  retracted; closed as partially reconstructed (forensic limit reached).
- **(b) Completion-invariant audit — ✅ DONE (2026-08-03).** EV-2 recorded with the full
  reproducible per-run register in `src/docs/EV_AUDIT_REGISTER.md`; DEFECT-1/DEFECT-2
  logged; invariant + three-dimension state model defined; 6 regression tests recorded
  as binding acceptance conditions. **Enforcement is NOT part of this audit** — it is
  the PROPOSED candidate TR-1a below. Repairing the 10 mis-stamped historical runs is a
  separate open operator decision (no data changed).
- **(c) Execution-budget measurement — ✅ COMPLETE (2026-08-03, operator-authorized).**

  **Reproduction record (evidence class: directly measured).**
  - Function under test: `base44/functions/probeExecutionBudget/entry.ts`.
    Revision at time of probe: auth guard temporarily replaced with a tolerant
    `try { await base44.auth.me(); } catch {}` block to permit sandbox-driven
    invocation; all other logic identical to the committed revision. Auth guard
    restored immediately after (see Validation V-1).
  - Invocation method: `base44.functions.invoke('probeExecutionBudget', {...})`
    from the platform exec sandbox (not the browser, not the Diagnostics page).
  - Heartbeat mechanism: `ProbeResult.update()` every 10 s inside a
    `while (Date.now() - t0 < maxMinutes*60000)` loop.

  | | Probe 1 | Probe 2 |
  |---|---|---|
  | ProbeResult ID | `6a6fe5df392d47fc4168b8bb` | `6a6fe7f9136ad8ed5e916556` |
  | `started_at` | 2026-08-03T00:50:39.388Z | 2026-08-03T00:59:37.144Z |
  | payload `maxMinutes` | 10 | 8 |
  | final `last_heartbeat` | 2026-08-03T00:55:31.820Z | 2026-08-03T01:04:31.233Z |
  | final `tick_count` | 29 | 29 |
  | final `elapsed_ms` | 292,350 | 293,954 |
  | `survived` | false | false |
  | `completed_at` | null | null |

  - **Heartbeat sequence (Probe 2), sampled by an independent observer:**
    t≈110 s → tick 11, elapsed 110,676 ms, heartbeat age 6.9 s (live);
    t≈233 s → tick 23, elapsed 233,506 ms, heartbeat age 8.4 s (live);
    t≈360 s → tick 29, elapsed 293,954 ms, heartbeat age 66.3 s (dead).
    Ticks advanced monotonically at ~10 s until they stopped.
  - **Disconnect timing (Probe 2):** the invoking caller was released at
    ~8 s after launch (`Promise.race` against an 8,000 ms timer; the invoke
    promise was never awaited to completion). Heartbeats continued for a
    further ~286 s after caller release.
  - **Death signature:** silent. No error returned, no rejection surfaced to
    any observer, `survived` never set true, `completed_at` never written. The
    isolate stops between two heartbeat writes; the only external symptom is a
    `last_heartbeat` that stops advancing.
  - **Minimal-LLM latency (phase `llm`):** 1,073 / 1,019 / 1,062 ms for three
    sequential `InvokeLLM` calls with the prompt `"Reply with the single word:
    pong"`, model `claude_sonnet_4_6`, no schema, no internet context.
    **Scope limit:** this measures endpoint reachability and per-call baseline
    overhead ONLY. It does NOT characterize production Janus domain-call
    latency, which carries multi-KB accumulated prompts and large structured
    JSON responses (the TIMEOUT_MATRIX budgets 90–240 s precisely because those
    calls are nothing like a ping). Do not extrapolate pipeline duration from
    this number.

  **Conclusion (scoped exactly to what was measured).**
  > A single synchronous backend-function invocation is not viable for the
  > current Standard and Full Janus pipelines under the observed ~295-second
  > execution ceiling.

  Basis: one domain call alone is budgeted up to 240 s in TIMEOUT_MATRIX; a
  Standard run issues 7+ sequential LLM calls and Full more; the observed
  ceiling (~292–294 s, twice, identical tick count) cannot contain them. This is
  consistent with the failure of server run `6a58dbbf…`.

  **Explicitly NOT established by this probe.** The ceiling was measured on ONE
  execution path — a synchronous `functions.invoke` of a Deno backend function.
  It is NOT established that every Base44 execution mechanism shares this limit.
  Open research item (carried into the external-research phase): determine
  whether Base44 currently offers distinct execution paths — background jobs,
  scheduled functions, asynchronous continuation, function chaining, queues, or
  workflow orchestration — and document the wall-clock limit, invocation model,
  and durability guarantee of each. Until that is done, no statement of the form
  "Path A is eliminated on Base44" may be written; the rejection above is scoped
  to the synchronous-invocation path for Standard/Full runs.

  **Remaining open decision:** the choice among checkpoint-resume, per-stage
  invocation chaining, or another supported Base44 mechanism is UNDECIDED and
  depends on the research item above plus the whole-application assessment.

- **(d) Phase -1 teardown — IMPLEMENTATION COMPLETE, VALIDATION RECORDED (2026-08-03).**
  Removed: prompt-hash recorder block + call site from `llmTimeout.jsx`;
  `debug_prompt_hashes` from the Run schema; `phase1Capture.jsx`;
  `GoldenRunCapture.jsx` and its Diagnostics mount.

  **Validation results:**
  - **V-1 — Auth enforcement restored: VERIFIED AT SOURCE, RUNTIME-ANONYMOUS
    CHECK NOT PERFORMED.** `probeExecutionBudget/entry.ts` lines 14–17 again read
    `const user = await base44.auth.me(); if (!user) return 401;` — identical to
    every other function in the app. The temporary tolerant block is gone.
    Caveat recorded honestly: available tooling invokes functions as an
    authenticated principal, so a true unauthenticated HTTP call to the deployed
    endpoint was NOT executed. Claim strength: source-verified, not
    runtime-verified. To close fully, issue an unauthenticated request to the
    deployed function URL and confirm 401.
  - **V-2 — No sensitive data persisted: VERIFIED.** Both ProbeResult records were
    read back in full. Fields present: `probe_type`, `started_at`,
    `last_heartbeat`, `completed_at`, `tick_count`, `elapsed_ms`, `survived`,
    `max_minutes`, `notes` (null), plus platform built-ins. No credentials, no
    tokens, no prompt text, no Run content, no user PII. `created_by_id` is the
    platform's opaque service-role principal identifier
    (`service_67645bce-…`), which is an actor label, not a secret. Probe logs
    emitted timing values only.
  - **V-3a — Static-reference scan: PASSED.** A full recursive scan of `src/` and
    `base44/` for `phase1Capture`, `GoldenRunCapture`, and `recordPromptHash`
    returns ZERO hits in `src/`. `Diagnostics.jsx` imports only live modules
    (NavigationLogger, janusSchema, exportUtils, pages.config, LiquidGlass,
    base44Client) and no longer mounts the capture panel. Two backend references
    remain and are safe (see V-5).
    **Scope limit (correction 2026-08-03):** this was previously labelled
    "Build integrity — VERIFIED". **That label was overclaimed and is withdrawn.**
    A name scan proves only that those exact identifiers are absent; it proves
    nothing about whether the application compiles or the routes render.
  - **V-3b — Production build: ✅ VERIFIED 2026-08-03.** `npx vite build` executed
    in the sandbox: **exit status 0**, `dist/` emitted (`index.html` + `assets`).
    No compilation errors. Only non-blocking warnings (stale `caniuse-lite` /
    `baseline-browser-mapping` data). The bundle builds.
  - **V-3c — Route load verification: PARTIAL.** Rendered observation obtained for
    **/BlueprintPrint** (1440×900 — renders correctly: header, run selector,
    empty-state card, tab bar). One capture attempt for **/BackendRuns** failed at
    the tooling level (no page error observed — the screenshot service did not
    return). **Still unrendered: /Diagnostics, /NewQuery, /History, /Results,
    /BackendRun.** V-3c stays OPEN until each is loaded and observed.
  - **V-4 / V-5 — Golden-capture and prompt-comparison capability: PRESERVED,
    BUT DEGRADED. No restore required.** The deleted files were a UI convenience
    layer, not the mechanism. The actual capability lives in two intact backend
    functions:
    `captureGoldenRun` (8-gate verification, SHA-256 content hashes of
    `render_md`/`raw_json`, structural fingerprints) and `compareToGolden`
    (presence, array-length, subdomain, intersection, render_md ±1% tolerance,
    validation_errors equality). Both are operator-invocable directly and are
    unaffected by the UI deletion.
    **⚠️ MAJOR CORRECTION (2026-08-03) — the earlier Full-golden claim was WRONG
    and is withdrawn.** It asserted that "completed Full-mode runs with both
    blueprint and synthesis exist" and named four as candidates. `completed` +
    blueprint + synthesis is **not** a qualifying test, and two of the four named
    runs are **already-registered completion-invariant violations** in
    `EV_AUDIT_REGISTER.md` EV-2: `69ebc39d…` is **missing Corpus** (EV-2 row 4) and
    `69e185ef…` is **missing Cogito** (EV-2 row 5). Citing audited defective runs
    as golden candidates was a direct contradiction of our own evidence register.

    **A Full golden candidate must first pass, in order:** (1) the mode-specific
    structural invariant (refresh, corpus, cogito, animus, actus, synthesis,
    blueprint all present and non-empty); (2) **required intersection
    completeness** (all 6 pairs); (3) schema validation; (4) dependency
    consistency; (5) absence or explicit adjudication of `validation_errors`;
    (6) semantic review of the resulting artifact.

    **Re-audit result — NO QUALIFYING CANDIDATE EXISTS.** All 15 Full-mode runs in
    the database were re-examined field-by-field against the gates above:
    - **Gate 2 fails universally.** `synthesis.intersection_matrix` is **empty on
      every single Full run** — 0 of 6 pairs on all 15. Persisted synthesis keys are
      only `key_takeaways`, `constraint_collisions`, `limitation_foreground`.
      Every existing Full run **predates incremental intersection persistence**.
    - **`corpus.subdomains` is empty on all 15** (keys present: `constraints`,
      `feasibility_notes` only) — so the corpus subdomain fingerprint is
      uncapturable from historical data too.
    - Gate 5: only 6 runs have zero `validation_errors` (`69d31010`, `69cf18a0`,
      `69ad0451`, `69a63901`, `69a2f90e`, `69a254b2`) — but all 6 still fail Gate 2.
    - Separately noted: `render_md` sits at exactly 60,040–60,041 chars on 8 runs —
      the 60k cache cap, i.e. **silently truncated** markdown. Flagged for review.

    **Consequence — this changes the dependency graph.** The Full golden baseline
    is **not** "a task not yet performed" that can proceed in parallel. It requires
    a **freshly generated, invariant-passing Full run**, which the current engine
    cannot produce under the measured ~295 s ceiling. **Full-golden capture is
    therefore BLOCKED BEHIND the architecture decision**, not independent of it.
    **Degradation to record:** `captureGoldenRun` gates g5/g6/g7 and
    `compareToGolden` check #9 all read `run.debug_prompt_hashes`. With the
    schema field removed, those gates will now evaluate false / be skipped for
    all NEW runs, so `all_pass` can never be true going forward and prompt-level
    byte comparison is no longer available. Content-hash + structural comparison
    remain fully functional. Either re-scope the gates to the 5 surviving checks
    or reinstate the recorder if prompt-level diffing is needed again.
  - **V-6 — Legacy `debug_prompt_hashes` data + reproducibility consequence:
    RECORDED.** Removing the schema property did NOT delete stored values. Four
    runs still carry hash arrays and remain readable via service role:
    `6a280c9bf2d582da07c32fda` (7 entries — the Standard golden),
    `6a1f4ec4dfdfe3357f2730ab` (4), `6a1f44f4b63fc76c4ded566e` (5),
    `6a1f3dc0f3078caf8c63f7ad` (5).
    Consequence: historical prompt hashes are still readable for forensic
    comparison, but no NEW run can produce a comparable hash set. Prompt-level
    reproducibility is therefore frozen at the pre-teardown corpus — future
    prompt drift is detectable only indirectly, via content hashes and
    structural fingerprints.
  - **V-7 — Prompt-byte invariance: PENDING DETERMINISTIC COMPARISON.** The
    earlier claim that prompt bytes are unchanged "by construction" is
    RETRACTED as an assertion. The recorder was a no-op when unset, which is an
    argument, not a measurement.

    **⚠️ CORRECTION (2026-08-03).** The earlier disposition — "compare a Standard
    run against `STANDARD_v1` via `compareToGolden`" — **cannot discharge V-7 and
    is withdrawn as a closure path.** `compareToGolden` compares **outputs**:
    content hashes, array lengths, structural fingerprints, `render_md` size.
    Prompt-byte invariance is a claim about **inputs**. Output parity is
    consistent with prompt drift (a changed prompt can yield a structurally
    identical artifact) and output divergence is consistent with prompt stability
    (LLM non-determinism). The evidence channel V-7 relied on —
    `debug_prompt_hashes` — **no longer exists for new runs** (V-6). Claiming the
    output comparator can close an input-parity gate would be a category error.

    **V-7 must be closed by exactly ONE of these three explicit paths (operator
    choice required):**
    1. **Restore a bounded prompt-evidence mechanism** — a narrowly-scoped prompt
       snapshot or hash, captured for the parity test only, then torn down again
       under a teardown plan written *before* it ships (Phase -1's lesson).
    2. **Deterministic offline prompt-construction test** — call `buildPrompt` /
       `buildDomainContext` / `buildSMEIdentity` / `buildCompressedBlueprintContext`
       with **fixed inputs**, and byte-compare the generated prompt strings against
       committed fixtures. **Preferred:** no LLM spend, no schema change, no
       production instrumentation, runs in CI, and it tests exactly the claim.
       Also the only option that protects DEBT-2 — it can assert the browser and
       server engine copies emit **identical bytes**.
    3. **Formally abandon byte-level parity** and redefine the fidelity gate in
       terms of structural/content equivalence — requires **explicit operator
       approval** and an amendment recording what fidelity guarantee Janus then has.

    Until one path is chosen and executed, V-7 is **OPEN** and no fidelity claim
    about prompt bytes may be made.

  **Artifact classification (item 7): RETAINED DIAGNOSTICS.** Both
  `probeExecutionBudget` (auth-guarded, touches no Run records, writes only
  ProbeResult) and the `ProbeResult` entity are retained as active diagnostic
  tooling — they will be re-run to measure any alternative execution mechanism
  found during external research. They are NOT temporary artifacts scheduled for
  removal and NOT disabled. Retention is reviewed once the execution-path
  research concludes.

**Status.**
- TR-0(c) execution-budget measurement: **COMPLETE.**
- Phase -1 teardown implementation: **COMPLETE**, with validation recorded above;
  V-1 (runtime-anonymous check) and V-7 (deterministic prompt comparison) remain
  open sub-items.
- TR-0 overall: incident reconstruction and structural completion audit complete;
  remediation scope, dependency-consistent repair classification, and
  semantic-fidelity validation remain open.

---

## TR-0(e) — Execution-Path Research: Base44 Mechanism Survey (2026-08-03)

Closes the open research item from TR-0(c). Evidence class: **platform documentation
+ authoring guide**, cross-checked against our own measurement.

### Documented limits per mechanism

| Mechanism | Wall-clock limit | Invocation model | Durability |
|---|---|---|---|
| **Backend function** (`functions.invoke`) | **5 min, hard** — "requests that exceed this limit are terminated" | synchronous HTTP | none — silent kill |
| **`waitUntil()`** (`base44:runtime`) | post-response background work | fire-and-forget after return | **best-effort, NOT guaranteed** |
| **Automations** (legacy apps) | **3 min per run** — shorter | scheduled / data-event / connector | run fails on overrun |
| **Workflows** (current apps) | per-**step** budget; each step is a separate backend-function invocation | scheduled / entity / connector / agent triggers | **durable** — multi-step, waits survive restarts, per-step run log |

### Findings

- **F-1 — Our measurement matches the documented platform limit exactly.**
  Documented: 5 minutes. Measured: 292,350 ms and 293,954 ms. Independent
  confirmation from two directions; the ~295 s ceiling is a real, documented,
  non-negotiable platform constraint, not an anomaly of our function.
- **F-2 — The synchronous-invocation rejection is confirmed and now doubly
  grounded.** Platform docs give the identical remedy we derived from the probe:
  *"break up work into smaller batches… use scheduled automations to spread work
  over multiple runs… restructure so each function call handles a smaller chunk."*
- **F-3 — `waitUntil()` is NOT a viable pipeline carrier.** Explicitly documented
  as best-effort with no completion guarantee. Using it to run Janus domains
  would reproduce Defect-1 (silent partial completion) by design. **Rejected.**
- **F-4 — Automations are strictly worse than a plain function** for our purpose
  (3 min < 5 min). **Not applicable.**
- **F-5 — Workflows are the only *documented native Base44* mechanism found in
  this survey that provides durable, observable multi-step orchestration.**
  Scope of the claim: this is a statement about what the platform documentation
  surveyed on 2026-08-03 exposes — NOT a claim that no other durable mechanism
  can exist. Application-managed durability (checkpoint/resume state persisted on
  the Run record and driven by self-chaining invocations) is also durable and
  remains a live candidate; it is simply built by us rather than provided by the
  platform. Undocumented, newer, or non-native mechanisms are outside this
  survey's reach.
  Workflows are a strong candidate carrier for a segmented Janus pipeline.
  Relevant properties, from the authoring guide:
  - Steps are **strictly sequential** (no parallelism).
    **⚠️ CORRECTION (2026-08-03): the earlier claim that this "matches Janus's dependency
    chain exactly" is WRONG and is withdrawn.** Janus Full mode is **not a linear chain —
    it is a dependency graph (DAG)**: 7 domains plus **6 cross-domain intersections that
    become eligible as their parent domains complete** (INTERSECTION_TRIGGERS —
    cogito→1 pair, animus→2, actus→3; §1). A strictly sequential Workflow can execute a
    **valid topological ordering** of that graph, but that is not the same as matching it.
    Consequences that must be carried into any design:
    **serialization of work that could otherwise be scheduled independently**, with
    knock-on effects on **latency**, **cost**, and **checkpoint semantics** (a linear
    step list cannot express "these 3 pairs became eligible together").
    Decomposition options to compare — none selected:
    (i) **one Workflow step per domain + per intersection** (13 steps in Full — maximum
    granularity and observability, maximum step-fraction cost, fully serialized);
    (ii) **grouped intersection steps** (fire each trigger cohort as one step — fewer
    steps, coarser checkpoints, retains eligibility semantics);
    (iii) **application-managed DAG scheduling** (we compute eligibility and dispatch —
    preserves the true graph, all mechanism is ours);
    (iv) **hybrid Workflow spine + Run-record checkpoints** (platform durability,
    application-level eligibility).
    **Binding constraint on all four: CP-002 input and dependency fidelity must be
    preserved exactly** — identical prompt inputs and identical upstream dependencies per
    call, whatever the decomposition. A decomposition that changes what a domain sees is
    a protocol change, not a refactor.
  - Each `invoke_backend_function` step is a **separate backend-function
    invocation** in an ordered sequence.
    ⚠️ **HYPOTHESIS, NOT ESTABLISHED FACT — H-1.** It is *architecturally
    plausible* that each step therefore receives its own independent ~5-minute
    budget rather than sharing one ceiling across the whole run, but the
    documentation surveyed does **not** state this. What the docs DO establish is
    only: ordered backend-function steps, conditions, durable delays, entity
    triggers, per-step run visibility, and step-count-based credit usage.
    **No design may depend on independent per-step budgets until H-1 is measured.**

    **Discharge condition — CORRECTED PROBE DESIGN (2026-08-03).** An earlier draft
    proposed steps that *deliberately exceed* the 5-minute function ceiling. **That
    design is rejected as invalid:** it would only re-demonstrate that an individual
    invocation gets terminated, which is already known, and would tell us nothing about
    the workflow-level envelope.
    The correct experiment uses **two instrumented steps that are each safely BELOW the
    individual ceiling but whose COMBINED duration exceeds it** — e.g. two steps of
    ~3 minutes each (~6 min total). The question under test is: *can a Workflow run
    exceed one function's wall-clock ceiling while every constituent invocation remains
    individually valid?*
    Evidence to preserve from the probe run:
    per-step **start and end timestamps**; the **Workflow run ID**; **per-step status**;
    **total elapsed time**; **heartbeat evidence** within each step; **credit usage**
    (which also discharges the unpublished per-step fraction); **retry behaviour**; and
    the **final Workflow status**. Preserve the run log itself, not just a summary.
  - `wait` is **durable and survives restarts** (ISO-8601 durations).
  - **Per-step run visibility** — the run log shows exactly which step succeeded
    or failed. This directly attacks the silent-kill death signature and is the
    natural substrate for a completion invariant (Defect-1).
  - **Entity triggers** fire on Run create/update — a Run inserted with
    `status: "queued"` could start the workflow with no browser involvement,
    which is the original IMP-002 goal.
  - `switch` branching on jq conditions supports resume/skip logic.
- **F-6 — Constraints to carry into any workflow design.**
  - Workflows require the **Builder plan or above** — a commercial precondition
    to verify with DIMA before committing the architecture.
  - Per-run **credit cost scales with step count**; a 7–13 step Janus run costs
    more per run than the current monolith.
  - **If integration credits are exhausted mid-run, the run is cancelled** — a new
    failure mode that must be handled by the completion invariant.
  - Minimum scheduled interval is 5 minutes (affects any polling/reaper design,
    not the main pipeline).
  - This app currently has **zero workflows defined**; this would be net-new.

### Consequence for the architecture decision

The candidate set is now reduced by evidence, not preference:
- Monolithic synchronous invocation — **rejected** (F-1, F-2).
- `waitUntil()` background continuation — **rejected** (F-3).
- Automations — **not applicable** (F-4).
- **Remaining viable:** (a) workflow-orchestrated per-stage chaining, or
  (b) self-chaining backend functions with checkpoint-resume state on the Run
  record, or (c) a hybrid — workflow as the durable spine with checkpointed
  stages.

### App orchestration surface — current state (2026-08-03)

- This app resolves to the **Workflows** interface; **zero workflows are
  currently defined**. [MEASURED]
- **Legacy automations cannot be enumerated with available tooling** — the
  absence of workflows is NOT evidence of the absence of automations. Operator
  check required: Dashboard → Automations, presence of a "Switch to Workflows"
  button.
- Migration, if required, is **documented as non-destructive**: automations are
  recreated as workflows with triggers and schedules intact, run counts and stats
  carry over, past run logs stay accessible as archived originals, archived items
  come across, nothing stops running, one step, no rebuild. Risk assessed **LOW**.
  Caveat: no "switch back" is documented — treat as **one-way until proven
  otherwise**, and authorize it separately rather than as a side effect of Janus
  work.
- Entitlement (Builder+ plan) and current credit headroom are **unverified** —
  operator-visible only.

Full detail, plus benchmarking, UI/UX evaluation, plan reconciliation, cost
analysis and the integrated roadmap: **`WHOLE_APP_ASSESSMENT.md` (ASM-JBE-001)**.

**Still open, still DIMA's call.** The selection among (a), (b), and (c) is
deliberately NOT made here. It depends on the Builder-plan question (F-6), the
per-run credit budget, and the whole-application assessment still in progress.
What the evidence now establishes is only that the viable set contains exactly
these three, and that whichever is chosen must supply a completion invariant,
since every rejected option fails silently.

**TR-1a — Completion-Invariant Enforcement** — evidence class (6): **PROPOSED
engineering change, CANDIDATE status only. Not promoted, not sequenced, not authorized.**
Its priority relative to TR-1 (resume) and everything else is explicitly **held open**
until the broader external research, UI/UX review, implementation-plan reconciliation
completion, and whole-product assessment are done, per operator directive 2026-08-03.
Scope if authorized: enforce the §4.5 invariant at finalization in both engine copies
using the three-dimension state model (execution-attempt / artifact-integrity /
recoverability — no single ambiguous status); surface parse-failure degradation instead
of swallowing it (DEFECT-2). Carries the 6 regression tests verbatim. Discovery of
DEFECT-1 motivates this candidate; it does not by itself decide its rank.

**TR-1 — Interrupted-Run Resume (server lane)** — QUEUED behind TR-0; final shape
depends on probe findings (plain resume vs per-step invocation chaining vs blueprint
sub-call checkpointing per plan Phase 4.5). Original scope retained: stalled-run claim
(stale heartbeat), rehydrate mergedData + intersections from persisted fields, skip
completed steps, Resume action on /BackendRun. Completion tests as previously recorded:
(1) fresh queued run unaffected; (2) run killed after Corpus+Cogito resumes without
recomputing them; (3) active-run claim still no-op; (4) resumed artifact validates.

### Approved Backlog
- Golden-run dry test vs STANDARD_v1 archive (compareToGolden) after any engine change

### Pending Ratification (NOT approved — corrected 2026-08-03)
Moved out of "Approved Backlog", which misclassified them. DOC-BP-IMP-002, the source
plan, classifies both as recovered design **pending ratification**:
- **Phase 5A.1** — Fluid typography (`clamp()` system) for /BlueprintPrint. Recovered
  design, pending ratification.
- **Phase 5A.2** — Unify BlueprintTab → schematic view. Pending ratification **and**
  listed under "Pending operator decisions" #2 as requiring **explicit operator
  authorization**. It was never approved.

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