# Janus Continuity State (Kytheion)
Read this first after any context reset.

- **Governing plan:** `src/docs/JANUS_FINAL_FORM_ARCHITECTURE_IMPLEMENTATION_PLAN_v1.2_2026-09-29.md` (authorized end-to-end by DIMA; continue automatically between phases except at the plan's explicit operator gates; no stopping for documentary neatness).
- **Protocol:** `src/docs/CP-002-O-D-JNP.md` (v2.0 Ideal Form, 25 subdomains 7/6/5/7).
- **Current phase:** Phase 0 COMPLETE. **Phase 1 COMPLETE (2026-09-29)** — 11/11 Vitest tests pass (`npm test`), and the build passes. Next up: Phase 2 (Lifecycle, Completion & Quality Specification).
- **Phase 1 artifacts:** `src/lib/janus/protocolRegistry.js` (canonical: 25 subdomains 7/6/5/7, 6 pairs, 4 patterns, confidence, threading, partial mode profiles, model policy, legacy aliases) + `protocolRegistry.test.js` (roster, pairs, patterns, no stale identities, no second roster). domainSME, both engines' pair maps/refresh keys/pattern templates, schema, EXECUTION_MODES, CorpusTab, markdown, export metadata, Layout/Diagnostics/NewQuery labels all derive from the registry.
- **Phase 1 notes:** the canonical Corpus physics key is `physics`, and historical `theoretical_physics` is read through `readSubdomain`. This fixes a bug where the Corpus tab never rendered physics. Still open for later phases: the 2000/6000-char synthesis truncations (Phase 8) and the explicit sonnet/gemini overrides in `callLLM`/rerun (Phase 4, where the retrieval-provider operator gate applies).
- **Model redline enforced (2026-09-29, Daionae):** no per-call model overrides remain (the Opus setting is inherited). The Gemini Refresh path is removed. Refresh ON fails closed before any Run or LLM call. A guard test enforces this.
- **Phase 2 COMPLETE (2026-09-29):** `src/lib/janus/lifecycleContract.js` + tests (27/27 total). Spec: `JANUS_PHASE2_LIFECYCLE_COMPLETION_QUALITY_SPEC_2026-09-29.md`. Not yet wired, by design (Phase 5). Next up: **Phase 3 — Durable Stage Data Model + Legacy Adapter.**
- **Phase 0 docs:** `JANUS_PHASE0_BASELINE_AUDIT_2026-09-29.md`, `JANUS_PHASE0_SALVAGE_MANIFEST_2026-09-29.md` (both accepted).
- **Donor:** public repo DimaMenetro/janus-blueprint-engine @ 3f25d14c…; re-fetch command is in the manifest. A salvage source, not governing architecture.

## MODEL POLICY (binding, supersedes all earlier rulings)
- **GEMINI IS PROHIBITED in all operational Janus execution, including Refresh.** This is an Operator-level Cephalon rule. The earlier "gemini_3_1_pro for Refresh" ruling is WITHDRAWN. Never reinstate it.
- **Refresh:** provider-neutral search/retrieval → provenance-bearing source corpus → Claude Opus analysis. Do not use `add_context_from_internet` (Gemini-only).
- **Claude Opus** for Refresh analysis, Corpus, Cogito, Animus, Actus, Synthesis, Blueprint, critique, refinement, quality qualification. Record the effective model per stage. No hidden fallback.
- **Retrieval provider/API key/paid service/package** = operator gate. Stop and present options to DIMA.

## Other adjudications
- Vitest approved and installed (^3.2.4).
- Workflow entitlement verified (Pro). Proof run deferred to Phase 10.
- Builder ledger WAIVED. Do not read or import it. Flag specific provenance questions only.
- Historical runs = quality references for no-regression comparison, never goldens (0/34 have 6 pairs + 4 patterns).
- The 19 `running` Runs are not mutated. Timeout/heartbeat architecture is not restored.

## Checkpoint
- Name: `JANUS_PHASE0_RESTORED_BASELINE_PLUS_AUDIT_VITEST_2026-09-29` · ID: `6abbd5ec65beb352c8a87266` · Git: `4d029fc397083e1daed96e58f2736000b4447404` · State: restored six-month baseline + Phase 0 docs + Vitest (no cognitive rewrite).

## Phase 2 corrections + Phase 3 (2026-10-30)
- Phase 2 corrected per Daionae: unqualified Blueprints never released; evaluator cannot mark criteria not applicable (spec §8).
- **Phase 3 COMPLETE:** RunStage/RunAttempt entities; Run extended (storage_model, versions, policy snapshot, qualification refs). Modules: `stageModel.js`, `runView.js` (legacy adapter + view), `stageStore.js`, `stageRunner.js`. Both engines write append-only revisions; Results/Export/Rerun read one view; Stage lineage panel. Record: `JANUS_PHASE3_DURABLE_STAGE_MODEL_2026-10-30.md`.
- Evidence: 47/47 tests, build passes, live persistence round-trip lossless (test records removed; 69 historical Runs untouched).

## Operating procedure (Daionae, 2026-10-30)
Proceed through phases automatically; stop only at genuine operator gates (credits, provider choice, destructive historical mutation, material contradiction, production cutover).

## Phase 4 (2026-11-25)
- **Phase 4 COMPLETE (after the correction tranche below; the first "complete" was premature):** one canonical engine in `src/lib/janus/`: `evidenceBoundary.js`, `stageCompiler.js` (only prompt builder), `stageRunner.js` (only requester of the model call), `stageEngine.js`, `executionState.js`, `browserAdapter.js` (scheduling only). `ExecutionEngine.jsx`, `rerunEngine.jsx`, `domainSME.jsx` and `buildPrompt` are deleted. Record: `JANUS_PHASE4_CANONICAL_STAGE_ENGINE_2026-11-25.md`.
- Resume (open runs only), cancel-after-current-stage and the unresolved-call rule (no manual settlement) are live. Results and BottomAccessory read derived durable state.
- Evidence: 68/68 tests, build passes, 69 historical Runs untouched. No live model call has gone through the new engine yet.
- Tests share `src/lib/janus/testPlatform.js` (in-memory store + deterministic model).

## Security migration (2026-11-25, after Phase 4)
- **Model call moved server-side** on DIMA's instruction (platform rule; scan finding "Core integration protection"): backend function `invokeJanusStage`. `stageRunner.callLLM` calls it; nothing else moved. Details and evidence: Phase 4 record §7. 69/69 tests, build passes.
- **Platform ceiling: a function request ends at 5 minutes.** Every stage call must now finish inside that. Bears on Phase 8/9 (larger prompts) and Phase 10/11 (server execution).
- No live model call has gone through the function yet. One minimal call needs DIMA's approval (credit gate).
- The entries of this section about diagnostic functions and package recommendations are superseded by the tranche below.

## Phase 4 correction tranche + closeout (2026-11-25, Daionae/DIMA review) — record §8
- Invalid parsed output settles `schema_failure` (never active). No operator-made `platform_termination`; an unresolved call blocks resume AND reruns. Terminal runs are never resumed.
- `invokeJanusStage` and the browser adapter are **operators (admins) only until Phase 6 ownership**. Do not widen before then.
- `invokeJanusStage` is an **interim** transport; its 5-minute ceiling is a limitation, not a Janus deadline. Never add a timer. Phase 10/11 resolve it.
- All five diagnostic functions deleted. Only `invokeJanusStage` + `base44/shared/errorResponse.ts` exist server-side; a guard test pins that and scans `base44/` for model names.
- Packages: vite 6.4.6; zod and @hookform/resolvers removed. **vitest 4.1.12 blocked** by an installer failure (npm "edgesOut" error); restored to 3.2.7. Awaiting DIMA.
- **Standing holds from DIMA: no paid model call yet; do not republish yet.**

## Phase 5 (2026-11-25) — record `JANUS_PHASE5_COMPLETION_QUALIFICATION_2026-11-25.md`
- **Core implemented, not complete.** `qualification.js` (pure) + `finalizeRun`: lifecycle from the completion manifest (`completed` / `partial` / `failed`), one independent `qualification` stage, release only when JANUS-QUALIFIED. Screens: QualificationPanel in Results, BottomAccessory, Actus corrections.
- Reviewable decisions: Blueprint steps carry `derived_from` + `confidence`; Blueprint reads Cogito claims and patterns; contracts request subdomains for all four domains and the mode's minimum alternatives. Template `stage-compiler/2026-11-25.2`.
- Evidence: 102/102 tests, build passes, 69 historical Runs untouched (16/19/34), 0 stages.
- Open: refinement cycle and `limitation_reported` (with Phase 9 refinement generation); Blueprint tab display of traces; live evidence.

## Next action
Await DIMA on: (1) the vitest upgrade path, (2) the Phase 5 decisions in record §3. Then Phase 6 (failure classifier, bounded retry, durable ownership/idempotency, safe orphan resolution), which also lifts the operator-only containment.