# Janus Phase 5 — Completion + Quality Qualification Against the Stage Model
- Document Type: Implementation Record · Date: 2026-11-25 · Author: Kytheion (Scribe-Particle-4)
- Governs: plan §7.2–7.4, §7.7, §11, Phase 5 · Builds on: Phase 2 contract (`lifecycleContract.js`), Phase 3/4 stage model and engine
- Status: CORE IMPLEMENTED, automated evidence only. Open items in §5. Not published. No model call made.

## 1. What changed
| Piece | Where | Role |
|---|---|---|
| Completion + qualification | `lib/janus/qualification.js` (pure) | Applies the Phase 2 contract to a run view: `completionOf`, `codeVerdicts`, `deriveQualification`. Nothing is stored; engine and screens call the same function. |
| Run close | `stageEngine.finalizeRun` | Replaces the interim rule. Lifecycle from the manifest; one evaluation stage; persists manifest, qualification state and release. |
| Evaluation stage | stage key `qualification` (compiler, runner validation) | Independent critique of one Blueprint revision. A normal durable stage: revision, dependencies, attempt, provenance. |
| Screens | `QualificationPanel`, `QualificationCriterion`, Results, BottomAccessory, StatusPill, Actus tab | Completion label, missing items, release label, each criterion with method, verdict and evidence, code-corrected confidence on the recommendation. |

## 2. Semantics
1. **Lifecycle.** `completed` only if `completionManifest` passes for the run's mode. Otherwise `partial` (valid artifacts kept) or `failed` (none). Cancelled stays cancelled. Quick/Standard complete as partial profiles and say so.
2. **Qualification is attempted only** for a completed, protocol-complete run whose Blueprint is not stale.
3. **Fourteen criteria, three methods.** Code decides five: `evidence_discipline`, `implementation_depth` (deterministic) and `cross_domain_necessity`, `emergence`, `intellectual_honesty` (traceability). The evaluation stage decides eight critique criteria. `historical_no_regression` is not applicable until a benchmark reference exists (contract rule, Phase 15).
4. **Independence.** The evaluation is a separate call with its own instructions; it is told it did not write the Blueprint and may answer only pass or fail. The Blueprint prompt never asks for a self-grade. Same model family, by policy.
5. **Verdicts count only for the exact Blueprint revision** they were given for. A new Blueprint revision is evaluated afresh. A stale Blueprint is neither evaluated nor released.
6. **Fail closed.** Missing verdicts → `qualifying`. Any fail or any verdict other than pass/fail → `refinement_required`. A failed or invalid evaluation releases nothing and leaves every artifact untouched.
7. **Release.** `released_blueprint_stage_id` is set only when `releaseDecision` says released (JANUS-QUALIFIED). The label text exists only in the contract.

## 3. Decisions (reviewable — these go beyond pure wiring)
1. **Blueprint steps carry `derived_from` and `confidence`.** Traceability cannot be checked without recorded links. Handles: claim ids, recommendation ids, `corpus:<n>`, `animus:<n>`, intersection ids, `pattern:<id>`. Invented handles fail.
2. **Blueprint now reads Cogito claims and the four patterns** (as CP-002 context threading already specified). It cannot cite what it never saw. This pulls one input fix forward from Phase 8/9; candidate generation, critique and refinement stay there.
3. **Output contracts now request what completion requires:** subdomain sets for Cogito, Animus and Actus (Corpus already had them) and the mode's minimum alternatives (Quick 1, Standard 2, Full 3). Without this no run could ever complete. Prompt template version is `stage-compiler/2026-11-25.2`.
4. **Emergence evidence by mode:** Full needs a step traced to an intersection and one traced to a formal pattern; Quick/Standard need a step combining two domains.
5. **One evaluation attempt per close.** If it fails, the run shows "evaluation did not complete"; an explicit re-run triggers another. No retry loop (Phase 6).
6. **Interim rule replaced, not kept:** a run with artifacts is no longer `completed` by default.

## 4. Exit tests (102/102, build passes)
| Plan exit test | Evidence (`qualification.test.js`) |
|---|---|
| Incomplete fixtures cannot become `completed` | four structurally valid Full runs (missing pattern, missing subdomain, too few alternatives, unanchored recommendation) end `partial`, no evaluation bought |
| Valid but low-quality cannot silently qualify | evaluator fail; untraced Blueprint with all critiques passing; invented handle; inflated confidence; `not_applicable` verdict |
| Failure inspectable without corrupting artifacts | failed and invalid evaluations: nothing released, 13 succeeded stages intact, reasons on each criterion |
| Also | Full happy path released; partial labels; stale Blueprint; code-corrected confidence; single derivation for engine and screens |

## 5. Open before Phase 5 can be called complete
1. **Refinement cycle.** `refinement_required` is reached and shown, but nothing regenerates the Blueprint from the critique and `limitation_reported` is never reached. The cycle counter belongs with refinement generation (Phase 9). Until then a failing Blueprint stays unreleased under the candidate label.
2. **Blueprint tab** does not yet show `derived_from` / `confidence` per step, and the new Cogito/Animus/Actus subdomain sets have no display (Phase 9/12 presentation).
3. **No live evidence.** The evaluator's real behaviour, prompt sizes (the evaluation prompt is not truncated; the Blueprint context is still capped at 20,000 characters and now carries more) and the cost of the extra call per run are unmeasured.
4. Historical Runs show no qualification panel; they are never evaluated or written.
