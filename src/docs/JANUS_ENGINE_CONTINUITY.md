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
- **Resilience (IMP-001, complete):** callLLMResilient wraps every call with a per-label
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

## 5. Work Registers

### Active Implementation Tranche
**TR-1 — Interrupted-Run Resume (server lane)** — recommended 2026-08-02, awaiting
DIMA go-ahead. Scope: runJanusPipeline accepts a stalled 'running' run (heartbeat older
than threshold) as claimable; on claim, rehydrate mergedData + intersections from the
Run's already-persisted domain fields and skip completed steps; BackendRun page gains a
"Resume" action for stalled runs. Must-not-regress: fresh queued-run execution, prompt
bytes, idempotent claim of active runs, browser lane untouched.
Completion tests: (1) fresh queued run executes as before; (2) a run killed after Corpus
+Cogito resumes and only executes remaining steps; (3) claiming an actively-running run
(recent heartbeat) is still a no-op; (4) resumed run's final artifact validates.

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