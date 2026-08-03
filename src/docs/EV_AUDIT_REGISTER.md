# EV AUDIT REGISTER — Reproducible Run Evidence
Document class: Evidence Register (append-only). Companion to JANUS_ENGINE_CONTINUITY.md §4.5.
Audit date: 2026-08-02/03 · Auditor: Kytheion · Method: recorded below so any future audit can reproduce the numbers.

## Method (reproducible)
- Queried all Run records (67 total at audit time), selected `status == "completed"` (34).
- Required-domain sets per execution mode:
  - quick: corpus, cogito, blueprint
  - standard: corpus, cogito, animus, actus, blueprint
  - full: refresh, corpus, cogito, animus, actus, synthesis, blueprint
- A domain counts as PRESENT if the field exists and has ≥1 key. Violation = any required
  domain missing, or blueprint absent/zero steps.
- Renderable = `blueprint` object present with ≥1 step (matches BlueprintTab / BlueprintPrint render paths).
- Reconstructable (full-fidelity) = all mode-required domains present. Note: exportUtils
  always reconstructs *whatever exists*; partial reconstruction is always possible.
- Repair category = smallest recomputation that would satisfy the invariant.

## Result: 34 completed · 24 compliant · 10 violations (29%)

## EV-1 — The stalled run (NOT in the completed set; status `running`)
| Field | Value |
|---|---|
| Run ID | 6a1b70319587fe9c17648d8e |
| Created / last write | 2026-05-30T23:18:09Z / 23:33:43Z |
| Mode / Level / Status | full / L3 / **running** (non-terminal) |
| owner / current_step / heartbeat / retry_log | ABSENT (pre-IMP-001 Phase 2) |
| Present | refresh, corpus, animus, actus, synthesis (4 named patterns; intersection_matrix EMPTY — predates incremental pair persistence) |
| Missing | **cogito (null)**, **blueprint (null)** |
| raw_json / render_md | "{}" (2 chars) / 0 chars |
| validation_errors | 1: `cogito: Parse error — Unexpected non-whitespace character after JSON at position 37629` |
| error_message | null |

## EV-2 — Completion-invariant violations (10 of 34 `completed` runs)

| # | Run ID | Date | Mode/Lvl | Missing required | BP steps | raw/md len | vErr# | Key validation errors (truncated) | Renderable | Full-recon | Repair category |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6a1f4ec4dfdfe3357f2730ab | 2026-06-02 21:44 | std/L2 | blueprint | 0 | 120773/60040 | 9 | Missing required domain: blueprint; cogito tag enum violations ("Feasible") | NO | NO | Rerun blueprint stage (upstream intact) |
| 2 | 6a1f44f4b63fc76c4ded566e | 2026-06-02 21:02 | std/L2 | cogito, actus | 6 | 89817/44564 | 4 | cogito + actus: LLM call exceeded timeout of 120000ms after 3 attempts | yes | NO | Rerun cogito, actus |
| 3 | 6a1f3dc0f3078caf8c63f7ad | 2026-06-02 20:32 | std/L2 | cogito, actus | 7 | 85106/43191 | 4 | cogito + actus: LLM call exceeded timeout of 120000ms after 3 attempts | yes | NO | Rerun cogito, actus |
| 4 | 69ebc39ddfd79c121111b0d3 | 2026-04-24 19:25 | full/L3 | corpus | 14 | 200041/60041 | 3 | corpus: No JSON found in string response; blueprint:expansion litellm 600s timeout | yes | NO | Rerun corpus |
| 5 | 69e185ef6a092f499ebf8e2b | 2026-04-17 00:59 | full/L3 | cogito | 12 | 194406/60041 | 4 | cogito: LLM call failed — Network Error; blueprint:expansion litellm timeout | yes | NO | Rerun cogito |
| 6 | 69d1757dcc7fefd376e4a7f7 | 2026-04-04 20:33 | full/L3 | refresh | 14 | 154605/60040 | 29 | blueprint.steps[*].time_estimate/effort_level: Expected string, got object (schema drift) | yes | NO | Rerun refresh (+ schema-drift note) |
| 7 | 69c69cc7773d514af93ecd2d | 2026-03-27 15:05 | full/L3 | synthesis, blueprint | 0 | 133824/60040 | 18 | Missing synthesis + blueprint; cogito tag enum violations ("Probable") | NO | NO | Rerun synthesis + blueprint |
| 8 | 69c605318185ec5cd8be8126 | 2026-03-27 04:18 | full/L3 | refresh, blueprint | 0 | 19702/12752 | 4 | Missing refresh + blueprint; refresh: No JSON found in string response | NO | NO | Rerun refresh + blueprint |
| 9 | 69a967c0699c0db9bbf6419a | 2026-03-05 11:23 | full/L3 | refresh | 4 | 31150/16798 | 2 | refresh: No JSON found in string response | yes | NO | Rerun refresh |
| 10 | 69a720d947f4b65a28cae405 | 2026-03-03 17:56 | full/L3 | blueprint | 0 | 15586/6679 | 2 | blueprint: LLM call failed — Network Error | NO | NO | Rerun blueprint stage |

### Observations directly supported by this table (no inference)
- 4 of 10 violating runs (rows 1, 7, 8, 10) are marked `completed` with **no renderable blueprint** — the app's Blueprint views show nothing for them.
- Failure inputs are heterogeneous: LLM timeouts (2, 3), parse/format failures (4, 8, 9), network errors (5, 10), enum/schema drift (1, 6, 7). The common factor is not the failure type — it is that finalization stamped `completed` regardless.
- All 10 remain partially reconstructable via exportUtils (whatever domains exist export cleanly); none satisfies full-fidelity reconstruction for its mode.
- No violating run was destroyed by a cache write: raw_json/render_md are populated wherever domains exist. Regression test #4's risk is prospective, not observed.

### Repair status
No repairs performed. Repairing the 10 mis-stamped historical runs (re-stamp status, and/or rerun missing stages) is a **data-change operation requiring operator authorization** — recorded as an open decision in the continuity record.