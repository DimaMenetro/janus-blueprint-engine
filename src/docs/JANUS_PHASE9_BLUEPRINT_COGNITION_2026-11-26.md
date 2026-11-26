# Janus Phase 9 — Blueprint Cognition + Presentation: implementation record

Status: **correction tranche (directive part II) COMPLETE and green. Blueprint cognitive pipeline (part III–V) NOT STARTED — blocked on one operator decision (§4).**
Baseline after this tranche: 245/245 tests, production build passes. No model call was made. No live or historical record was written.

## 1. What the live run showed (read-only, run `6b07cabc…`)
- Cogito r1 settled as succeeded with `depends_on: ["Phase 0 Walkthrough", "ShapeScan Product Codex"]` and `["CP-002-O-D-JNP Protocol"]`: source names in a field that must hold claim ids.
- Actus r1 made three calls. All three returned `behavioral_factors.identity_economics` as a list; the first also returned `probability: "moderate"`. Each retry sent the identical prompt, so the model had no way to know what was rejected.
- Actus r2 (explicit re-run) succeeded. Corpus × Actus, Cogito × Actus, Animus × Actus, Synthesis and Blueprint were never produced; the re-run cascade only considers active revisions that become stale.

## 2. Corrections implemented
### 2.1 One integrity definition, three boundaries (`lifecycleContract.stageIntegrity`)
Root cause of finding 2: referential and structural invariants lived only in the completion manifest, so they were checked after downstream stages had already read the artifact.
- **Settlement** (`stageRunner.validateStageOutput`): schema types plus `stageIntegrity`. A violation is `schema_failure` with the normal bounded retry.
- **Consumption** (`stageEngine.executeStage`): an input whose active revision fails today's integrity is not read; the stage is not started and the reason is reported. Staged runs only.
- **Completion** (`qualification.completionOf`): the manifest plus the same function over every active revision of the plan. This closes finding 4: the Synthesis-level outputs (takeaways, collisions, limitation) and each pair's three fields now block completion too.
- Rules: Cogito `depends_on` must resolve to claim ids of the same list; claim and recommendation ids are unique; Actus `depends_on_claims` must cite real Cogito claim ids (checked against the exact Cogito revision it was compiled from); Blueprint mandatory parts; final Synthesis in full.
- Kept at completion only, deliberately: explicit subdomain sets (Full), minimum alternatives, an unanchored recommendation, confidence tags. Three inherited tests pin these as completion-time findings on succeeded stages.
- Cogito claims gain `sources` (provenance) beside `depends_on` (logic). Shown in the Cogito tab and Markdown.

### 2.2 Output contracts and retry feedback
- `stageCompiler.typeLegend`: every domain and Blueprint contract lists each field's type and allowed values, generated from `janusSchema` (one source).
- `stageCompiler.withCorrection`: a retry after `schema_failure` / `parse_failure` sends the revision's own prompt unchanged plus a notice naming every rejection, as a derived data block. It is a pure function of the previous attempt's recorded result, so a continued revision rebuilds the same notice. The fingerprint is over the compiled prompt and is unaffected. A retry after a provider or transport failure repeats the prompt unchanged.
- Schema message for a list where a string belongs now says "got a list (array)".
- Retry count, schema and policy are unchanged.

### 2.3 Dependency-aware completion (`completionImpact.js`, `browserAdapter.completeJanus`, `CompletionControls.jsx`)
A third operation beside Resume (same revision) and Re-run (named stages superseded). Computed only from `stagePlan`, `requiredInputs`, `declaredInputs` and the lineage, so it covers any stage the plan gains.
- Reasons, each shown before anything starts: unproduced, failed, stale, follows (reads a stage produced here; regenerated only if it actually becomes stale), repair (opt-in: replaces a valid revision that fails today's integrity).
- Blocked stages say why. Valid current revisions are listed as kept and never regenerated.
- Guards as for a re-run: preview token, initiation epoch, operator only, refused on an open run, beside an unresolved or waiting revision, and after a cancellation request. Origin recorded as `completion`.
- Against a copy of the live run: without repair it would produce Corpus × Actus and Animus × Actus and block the rest on Cogito; with repair it plans Cogito, the stages that read it, the three missing pairs, Synthesis and Blueprint, keeping Refresh and Corpus.

### 2.4 Context truncation
The 20,000-character cut on derived context is removed for every stage (`MAX_CONTEXT_LENGTH` deleted). The Blueprint's information-transfer design belongs to the pipeline (§4).

### 2.5 Template identity
`corpus`, `cogito`, `animus`, `actus`, `blueprint` → `stage-compiler/2026-11-26.2` (their contracts changed). Pairs and patterns stay `2026-11-26.1`; Refresh and evaluation stay `2026-11-25.3`. A revision of a changed stage waiting for a retry under the old identity is blocked, as designed.

## 3. Tests
- New: `phase9Corrections.test.js` (13), reproducing the live circumstances.
- Changed: one Phase 8 test in `phase8Closeout.test.js` (it pinned "only the Synthesis stages changed", no longer true; rewritten to the invariant, marked in place). The authorization note in `stageEngine.test.js` was corrected: that replacement was made before it was authorized.
- Inherited six files: unchanged in this tranche.

## 4. OPEN DECISION — blocks the Blueprint pipeline
Plan §15.4 and the directive require durable Blueprint sub-stages (candidates, comparison/selection, skeleton, expansion, criteria, deterministic assembly, critique, refinement). Inherited tests pin the Blueprint as exactly one model call and one stage:
- `engines.test.js`: 14 stages and 14 attempts for a Full run; the Blueprint's `depends_on` equals exactly the 12 upstream artifacts; 12 succeeded after a Blueprint failure.
- `stageEngine.test.js`: 14 execution-origin stages; resume of a Quick run calls exactly `["blueprint", "qualification"]` (twice) and `["blueprint"]`.
- `qualification.test.js`: last two calls are `["blueprint", "qualification"]`; 13 succeeded stages (two places).
No design gives the Blueprint durable sub-stages and keeps these numbers. The invariants behind them (every stage durable with exact dependencies, Resume runs only what is missing, evaluation is last and happens once, a failure erases nothing) can all be kept and asserted more strongly. Replacing the assertions needs DIMA's explicit authorization; none was assumed.

## 5. Not verified
- Live behaviour of the new contracts and retry notice (needs an approved paid call).
- `CompletionControls` on a device: not visually checked.
