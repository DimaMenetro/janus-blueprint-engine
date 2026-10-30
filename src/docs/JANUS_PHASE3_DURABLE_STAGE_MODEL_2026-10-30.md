# Janus Phase 3 — Durable Stage Data Model + Legacy Adapter
- Document Type: Implementation Record (Phase 3 exit artifact) · Date: 2026-10-30 · Author: Kytheion (Scribe-Particle-4)
- Governs: plan §10, §18.3, Phase 3 · Builds on: Phase 2 contract
- Status: COMPLETE

## 1. What changed
| Layer | Artifact |
|---|---|
| Entities | `RunStage` (one record per stage revision), `RunAttempt` (telemetry), `Run` extended |
| Pure model | `src/lib/janus/stageModel.js` — keys, versions, sha256 fingerprints, failure classes |
| Adapter + view | `src/lib/janus/runView.js` — legacy adapter, derived lineage, composition, rerun needs |
| Persistence | `src/lib/janus/stageStore.js` · Runner: `src/lib/janus/stageRunner.js` |
| Engines | Execution writes 13 stage revisions (Full); reruns write new revisions |
| Frontend | Results/Export/Rerun read the view; Stage lineage panel; tabs stay browsable after failures |

## 2. Decisions (reviewable)
1. Active and stale are **derived**, never stored (no split truth).
2. Historical Runs are **never written**, including by reruns; reruns live in RunStage.
3. Legacy dependencies are inferred conservatively and labelled `inferred`.
4. Dependencies record what prompts actually read. Finding: Blueprint reads the intersections but not Cogito or the 4 patterns (gap vs `CONTEXT_THREADING`; Phase 8/9).
5. `raw_json`/`render_md` remain derived, non-authoritative caches; exports never use them.
6. Run status semantics unchanged until Phase 5 wires the completion manifest.
7. RLS: RunStage/RunAttempt read/update owner-or-admin, delete admin-only.

## 3. Exit tests
| Exit test | Evidence |
|---|---|
| Old Run still opens | runView legacy-adapter tests (lossless, unmutated) |
| New Run works | engines test: 13 durable revisions, exact deps, fingerprints |
| Export works for both | export tests, legacy + staged |
| Lineage queryable | live round-trip: `RunStage.filter({run_id})` lossless |
| Failed stage keeps prior stages | engines test: blueprint failure, 12 stages preserved |
| One durable truth | engine caches == view; source guard on frontend reads |
- 47/47 tests; build passes.

## 4. Deferred by plan
Retries/ownership/cancellation → Phase 6; canonical executor + durable progress → Phase 4; contract validation → Phase 5; domain reruns → Phase 7.