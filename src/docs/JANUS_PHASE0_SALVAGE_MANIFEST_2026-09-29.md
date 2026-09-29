# Janus Phase 0 — Donor Salvage Manifest
**Donor:** github.com/DimaMenetro/janus-blueprint-engine @ `3f25d14c8214c97e287629798e89c384619bc4d2` (public; read-only snapshot fetched to sandbox scratch `/tmp/donor`, never written into the app)
**Baseline:** restored live source 2026-09-29 · **Classification per plan §20**
Re-fetch command (for any context reset): `curl -sL https://codeload.github.com/DimaMenetro/janus-blueprint-engine/tar.gz/3f25d14c8214c97e287629798e89c384619bc4d2 | tar xz`

## A. Donor-only files
| File(s) | Class (§20) | Evidence / notes |
|---|---|---|
| `pages/BlueprintPrint.jsx` (310 LOC) + `components/blueprint-vis/*` (10 files, 1,412 LOC) | 20.1 Direct-transplant candidate | Imports only React/lucide/framer, LiquidGlass, ThemeProvider, contentDensity, base44 client. No engine/llmCall/timer dependency. Must be rebound to stage-backed contract (Phase 9). |
| `lib/contentDensity.js`, `hooks/useScrollDensity.js` | 20.1 | Density: content → `normal`/`sparse`; `dense`/`focused` reserved for scroll/focus systems. |
| `ui/PageTransition.jsx`, `ui/PullToRefresh.jsx`, `ui/AccountDeletionModal.jsx` | 20.1 | Orthogonal to execution. PullToRefresh/AccountDeletion import base44 client — review calls in Phase 12. |
| `ProtectedRoute.jsx` | 20.1 (review) | Routing wrapper; compatibility review in Phase 12. |
| `janus/blueprintSplitCall.jsx` | 20.2 Reimplement behavior | Split Skeleton/Expansion/Criteria concept retained (§15.4); code carries `claude_sonnet_4_6` override + 1 timeout-family reference. |
| `janus/llmCall.jsx` | 20.4 Reject (as code) | Timer/retry wrapper lineage; settled-failure semantics reimplemented in Phase 6. |
| `functions/runJanusPipeline` | 20.4 Reject as transport; 20.3 evidence | Monolithic pipeline; 8 timeout/heartbeat/stale refs; explicit gemini_3_flash + sonnet. |
| `functions/probeExecutionBudget`, entity `ProbeResult` | 20.3 Evidence | ~295s measurement methodology. Not reused. |
| `functions/captureGoldenRun`, `compareToGolden`, `docs/golden_runs/STANDARD_v1.json` | 20.3 Evidence / concept | Golden-harness concept → Phase 14/15. STANDARD_v1 = Run 6a280c9b (has empty Synthesis — see audit §10). |
| `functions/abTestBlueprint`, `pages/ABTest`, `components/abtest/*` | 20.3 Evidence | Quality-comparison concept → benchmark suite. |
| `pages/BackendRun`, `pages/BackendRuns`, `functions/testBlueprintRerun` | 20.3 / 20.4 | Server-lane experiment UI; 3 stale/heartbeat refs. Not restored. |
| `docs/*` (13 docs) | 20.3 Evidence | Provenance only; `BENCHMARK_EXTERNAL_1B.md` self-amended re TIMEOUT_MATRIX. Not authority. |

## B. Files changed baseline → donor (diff line counts)
| File | ±lines | Class |
|---|---:|---|
| `entities/Run.jsonc` | 591 | 20.2 — donor lifecycle fields (execution_owner, heartbeat, retry_log…) inform RunStage/RunAttempt design; not adopted as-is (heartbeat-as-failure rejected). |
| `janus/ExecutionEngine.jsx` | 569 | 20.2/20.4 — 9 timeout/stale refs. Behavior salvage only. |
| `janus/rerunEngine.jsx` | 261 | 20.2/20.4 — 11 timeout/stale refs. |
| `Layout.jsx` | 79 | 20.1 — safe-area insets (`env(safe-area-inset-*)`), scroll-reactive header. |
| `ui/LiquidGlass.jsx` | tokens differ from line 16 | 20.1 — donor token revision; exact diff reviewed in Phase 12 (not "vague memory"). |
| `ui/GlassTabBar.jsx`, `ui/BottomAccessory.jsx` | differ | 20.1 — safe-area bottom padding; BottomAccessory redesign per §21.2. |
| `ui/AmbientOrbs.jsx` | identical | — |
| `pages/Diagnostics.jsx` 136 · `History.jsx` 78 · `NewQuery.jsx` 80 · `Results.jsx` 32 | | 20.1 after compat diff; strip any donor execution assumptions. |
| `janus/ExecutionContext.jsx` 46 · `RerunControls.jsx` 23 | | 20.2 |
| `globals.css` 18 · `App.jsx` 12 · `pages.config.js` 4 | | 20.1 — donor adds explicit `/BackendRun`, `/BackendRuns` routes + ABTest/BlueprintPrint registry entries. |
| `functions/checkRunFields` 21 | | 20.3 |

## C. Model IDs in donor (all explicit overrides)
`claude_sonnet_4_6` in ExecutionEngine, rerunEngine, blueprintSplitCall, runJanusPipeline, testBlueprintRerun, probeExecutionBudget, abTestBlueprint, test*; `gemini_3_flash` in ExecutionEngine + runJanusPipeline Refresh. **No donor stage ever ran on the operator's Opus setting either.**