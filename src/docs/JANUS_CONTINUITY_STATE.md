# Janus Continuity State (Kytheion)
Read this first after any context reset.

- **Governing plan:** `src/docs/JANUS_FINAL_FORM_ARCHITECTURE_IMPLEMENTATION_PLAN_v1.2_2026-09-29.md` (authorized end-to-end by DIMA; continue automatically between phases except at the plan's explicit operator gates; no stopping for documentary neatness).
- **Protocol:** `src/docs/CP-002-O-D-JNP.md` (v2.0 Ideal Form, 25 subdomains 7/6/5/7).
- **Current phase:** Phase 0 COMPLETE. **Phase 1 COMPLETE (2026-09-29)** — 11/11 Vitest tests pass (`npm test`), and the build passes. Next up: Phase 2 (Lifecycle, Completion & Quality Specification).
- **Phase 1 artifacts:** `src/lib/janus/protocolRegistry.js` (canonical: 25 subdomains 7/6/5/7, 6 pairs, 4 patterns, confidence, threading, partial mode profiles, model policy, legacy aliases) + `protocolRegistry.test.js` (roster, pairs, patterns, no stale identities, no second roster). domainSME, both engines' pair maps/refresh keys/pattern templates, schema, EXECUTION_MODES, CorpusTab, markdown, export metadata, Layout/Diagnostics/NewQuery labels all derive from the registry.
- **Phase 1 notes:** the canonical Corpus physics key is `physics`, and historical `theoretical_physics` is read through `readSubdomain`. This fixes a bug where the Corpus tab never rendered physics. Still open for later phases: the 2000/6000-char synthesis truncations (Phase 8) and the explicit sonnet/gemini overrides in `callLLM`/rerun (Phase 4, where the retrieval-provider operator gate applies).
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

## Next action
Phase 1: canonical `janusProtocolRegistry` (incl. Opus-only model policy), registry-derived domainSME/pair map/labels/version display, Vitest registry tests, frontend labels in the same tranche.