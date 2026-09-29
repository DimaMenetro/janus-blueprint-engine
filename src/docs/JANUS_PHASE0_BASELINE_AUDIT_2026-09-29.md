# Janus Phase 0 — Baseline Audit Report (Rev. 2)
**Governing plan:** `src/docs/JANUS_FINAL_FORM_ARCHITECTURE_IMPLEMENTATION_PLAN_v1.2_2026-09-29.md`
**Companion:** `src/docs/JANUS_PHASE0_SALVAGE_MANIFEST_2026-09-29.md`
**Author:** Kytheion (Scribe-Particle-4) · **Date:** 2026-09-29 · **Mode:** read-only; no source-logic or data mutation
**Status:** Phase 0 evidence near-complete — open items in §11

## 1. Source inventory
Registered pages (`pages.config.js`): Diagnostics (mainPage), History, NewQuery, Results; Layout wraps all.
Janus core: ExecutionEngine, rerunEngine, RerunControls, domainSME, janusSchema, promptUtils, exportUtils, ExecutionContext, GlassResultTabs, 8 tabs.
Backend functions: checkRunFields, getAllErrors, testSynthesis, testCompressedSynthesis, testPromptSize — diagnostic artifacts (§3.6), not reused.
Absent as expected (§2.1): llmCall, blueprintSplitCall, runJanusPipeline, BlueprintPrint family, durable resume. Confirmed by donor diff.
`dist/` present — stale, non-authoritative (item 19).

## 2. Protocol drift (§3.1)
Active roster `domainSME.jsx` = 24 subdomains:
- Corpus 7: Distributed Systems; Data Engineering & Systemic Integrity; Cybersecurity & Threat Intelligence; Systems Engineering; Theoretical & Quantum Physics; AI/ML Systems; Neuroscience & Cognitive Science.
- Cogito 6: Unified AI & Cognitive Arch.; Knowledge Graph & Semantic Networks; Epistemology & Algorithm Auditing; Computational Linguistics & Narratology; GraphRAG & Causal Reasoning; Neuro-Symbolic AI — lacks Knowledge Representation (as named) and Systems Modeling.
- Animus 5: Philosophy of Mind & Metaphysics; Jungian Psychology; Ethical AI & Moral Frameworks; UI/UX & HCI; AI Safety & Alignment — lacks Consciousness Theory, Risk Analysis.
- Actus 6: Game Theory & Strategic Foresight (merged); MLOps & Product Management; Agile & Scrum; Technical Writing; Behavioral Economics; API Design — lacks separate Strategic Planning, Feedback & Iteration Models.
Version strings: Layout.jsx:58, Diagnostics.jsx:86 `CP-002 v1.5`; domainSME.jsx:1,327 `v1.1`; janusSchema.jsx:402 `All 24 Subdomains`.
Duplicate pair maps/prompts: ExecutionEngine.jsx:20-30 and rerunEngine.jsx (violates 7.1.2/7.1.3).

## 3. Model policy — verified and adjudicated
Base44 SDK docs: explicit per-call `model` overrides the app-level setting. Live overrides: ExecutionEngine.jsx:367 `gemini_3_flash` (Refresh), :369 `claude_sonnet_4_6` (all other stages); rerunEngine.jsx:22 sonnet; test* functions sonnet. Donor identical (manifest §C). **No stage has ever run on the operator Opus setting.**
Web context (`add_context_from_internet`) is supported only on `gemini_3_flash` / `gemini_3_1_pro`.
**DIMA adjudication (2026-09-29, SUPERSEDING — Operator-level Cephalon rule):**
- **Gemini is PROHIBITED from all operational Janus execution in every stage, including Refresh** (`gemini_3_flash`, `gemini_3_1_pro`, any Gemini). The earlier Gemini-for-Refresh ruling is WITHDRAWN and void.
- Refresh = provider-neutral external search/retrieval → provenance-bearing source corpus (URLs, metadata, excerpts, timestamps, documents) → **Claude Opus** Refresh analysis. Retrieval is not Janus cognition.
- Claude Opus is the operational model for Refresh analysis, Corpus, Cogito, Animus, Actus, Synthesis, Blueprint, adversarial critique, refinement, quality qualification.
- Effective model/provider recorded per stage. **No hidden fallback.**
- Consequence: `add_context_from_internet` (Gemini-only) must NOT be used. Existing `gemini_3_flash` and `claude_sonnet_4_6` overrides are to be removed.
- **Operator gate:** if the retrieval layer needs an API key, paid service, package, or provider choice, halt and present options to DIMA. Never fall back to Gemini.
Implementation lands in Phase 1/4 (registry model-policy entry + stage engine); no code changed in Phase 0.

## 4. Truncation classification (§3.7)
| Location | Category | Assessment |
|---|---|---|
| ExecutionEngine.jsx:160-161, rerunEngine.jsx:62-63 — pair context `slice(0,6000)` | 1 cognitive-input | Fidelity-breaking → Phase 8 |
| domainSME.jsx:444 — synthesis domain data `slice(0,2000)` | 1 cognitive-input | Severe → Phase 8 |
| ExecutionEngine.jsx:12 MAX_CONTEXT_LENGTH 20000 via truncate() | 1 cognitive-input | Per-call-site audit → Phase 4 |
| ExecutionEngine.jsx:11 MAX_PROMPT_LENGTH 10000 (stored full_prompt) | 3 storage/cache | Harmless if prompt reconstructable |
| MAX_RAW_JSON_LENGTH 200000 | 3 storage/cache | Harmless; exportUtils lossless |
| ExportTab 500 previews; RunCard/GlassRunCard 60; Results 120 | 4 display | Presentation |
| testCompressedSynthesis 400/800/3000 | 1 (diagnostic) | Contaminated artifact → archive Phase 6 |
No category-2 (LLM-output) truncation before persistence.

## 5. Timers (§3.5) — no inference watchdog
Only UI timers: ExportTab 2s copy toast; ExecutionContext 3s/5s reset. No Promise.race / inference timeout in baseline.

## 6. Data temporal drift (§4) — live
69 total · 34 completed · 16 failed · 19 running · full 49 / standard 17 / quick 2 / null 1 (exact match §4.3).
19 `running`: 6 with donor-era `current_step` (latest 2026-08-03), 13 with no lifecycle fields (Mar–May 2026); `execution_owner` null on all. ≥3 record generations. No records mutated.

## 7. Routing inventory (§3.8 / §21.7)
- Page files: Diagnostics, History, NewQuery, OAuthConsent, Results.
- Page registry (`pages.config.js` PAGES): Diagnostics, History, NewQuery, Results. **OAuthConsent.jsx exists as a file but is not in the registry and has no explicit route → it is not routed.** Direct evidence that a page file alone does not become routable.
- Special/manual routes (baseline): none besides `/` and `*`. Donor added explicit `/BackendRun`, `/BackendRuns` and registry entries ABTest, BlueprintPrint.
- Platform notice (2026-09-29): registry auto-generation is no longer active for this app.
- **Operative conclusion:** every new or recovered page must be explicitly registered/routed and wrapped in `LayoutWrapper`; each UI tranche verifies routes.

## 8. Donor (§2.2, items 10, 11, 16, 18) — ACCESSIBLE
Commit `3f25d14c…` in public repo DimaMenetro/janus-blueprint-engine fetched read-only to sandbox scratch. Full file/feature diff and §20 classification: salvage manifest. UI donor baseline inventory (Liquid Glass token revision, density system, safe-area, PageTransition, PullToRefresh, AccountDeletionModal, BlueprintPrint + 10 blueprint-vis components) recorded there. Visual donor screenshots cannot be captured without running the donor build; source is the reference.

## 9. Workflows (item 13) — non-paid verification
Base44 docs: *"Workflows is available on the Builder plan and above"* (Builder, Pro, Elite). Workspace plan (live): **Pro** → entitled. Integration credits: 2,885 / 29,192 used this period (reset 2026-09-30). Janus Workflow proof NOT run (Phase 10).

## 10. Historical quality benchmark candidates (item 17)
Completion-integrity scan of all 34 `completed` Runs: **0/34 persist six pair artifacts or four formal patterns** (Synthesis holds only key_takeaways / constraint_collisions / limitation_foreground; STANDARD_v1 golden Run 6a280c9b has empty Synthesis). No historical Run satisfies the §11.2 Full truth condition → historical runs are *quality references*, never protocol-complete goldens.
Candidate set (structural signals; quality judgment pending ledger + DIMA):
| Run | Mode/Level | Signals |
|---|---|---|
| 69d31010232c546b533348c8 | Full L3, Refresh | 4 domains, 11 claims, 8 steps, 4 alts, 0 errors |
| 69cf18a076215c9faad1eb47 | Full L3, Refresh | 4 domains, 6 claims, 10 steps, 4 alts, 0 errors |
| 69d200730bc011e568b114f0 | Full L3, Refresh | 4 domains, 15 claims, 10 steps, 5 alts, 1 error |
| 69e044356b738a6ca3083e59 | Full L3, Refresh (ternary computing) | 4 domains, 12 claims, 10 steps, 4 alts, 4 errors |
| 6a280c9bf2d582da07c32fda | Standard L2 (STANDARD_v1) | 4 domains, 15 claims, 9 steps, 0 alts, empty Synthesis |
| 69ea5a6559aade4e65d761e5 | Quick L3 (only Quick) | 2 domains, 12 claims, 12 steps, 2 errors |
| 69a2f90eef81bac3a1c9becf | Full L3 (Feb, pre-degradation?) | 4 domains, 3 alts, 0 errors |

## 11. Test tooling (item 14)
Vitest approved by DIMA as dev dependency; installed (`vitest ^3.2.4`). No other build tooling changed. Test script/config added in Phase 1 with registry tests.

## 12. Phase 0 gates
- Builder ledger — **WAIVED by DIMA (2026-09-29).** Do not import or read it; it is held externally for forensic provenance. Flag specific provenance questions instead.
- Donor/UI salvage, benchmark references, exit agreement — **ACCEPTED** by DIMA 2026-09-29. Pre/post-degradation provenance is not a blocker.
- **Restore checkpoint — ONLY REMAINING GATE.** Record: name · ID · state = *restored six-month Janus application baseline + Phase 0 audit/documentation + approved test-tooling (Vitest) state*. It is NOT a byte-identical pre-Phase-0 snapshot. No cognitive or source-logic changes are allowed before this is recorded.
  - Name: `JANUS_PHASE0_RESTORED_BASELINE_PLUS_AUDIT_VITEST_2026-09-29` · ID: `6abbd5ec65beb352c8a87266` · Git: `4d029fc397083e1daed96e58f2736000b4447404`
- **PHASE 0 COMPLETE — closed 2026-09-29.** Proceeding to Phase 1.