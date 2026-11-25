# Janus Phase 5 — Completion + Quality Qualification Against the Stage Model
- Document Type: Implementation Record · Date: 2026-11-25 · Author: Kytheion (Scribe-Particle-4)
- Governs: plan §7.2–7.4, §7.7, §11, Phase 5 · Builds on: Phase 2 contract (`lifecycleContract.js`), Phase 3/4 stage model and engine
- Status: COMPLETE (closed 2026-11-25 on DIMA's review, see §6). Automated evidence only. Not published. No model call made.

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

## 5. Open items as first recorded (superseded by §6 where it says so)
1. **Refinement cycle.** `refinement_required` is reached and shown, but nothing regenerates the Blueprint from the critique and `limitation_reported` is never reached. The cycle counter belongs with refinement generation (Phase 9). Until then a failing Blueprint stays unreleased under the candidate label.
2. **Blueprint tab** does not yet show `derived_from` / `confidence` per step, and the new Cogito/Animus/Actus subdomain sets have no display (Phase 9/12 presentation).
3. **No live evidence.** The evaluator's real behaviour, prompt sizes (the evaluation prompt is not truncated; the Blueprint context is still capped at 20,000 characters and now carries more) and the cost of the extra call per run are unmeasured.
4. Historical Runs show no qualification panel; they are never evaluated or written.

## 6. Closeout (2026-11-25, DIMA review) — baseline commit `239319f`
DIMA accepted the direction and the §3 decisions. They are not to be reversed.

1. **Kept by decision:** `derived_from` and per-step `confidence` on Blueprint steps; Blueprint access to Cogito claims and the four formal patterns (this also corrects the CP-002 context-threading gap); alternative minimums Quick 1 / Standard 2 / Full 3.
2. **Subdomain output is mode-aware** (output density, not intelligence). The SME identity, with every subdomain in full, is identical in all modes. Full contracts require the explicit subdomain structures for Corpus, Cogito, Animus and Actus (25/25). Standard and Quick contracts do not ask for the inventory and carry a density instruction instead; Quick's says compact is not shallow. Template `stage-compiler/2026-11-25.3`.
3. **Blueprint traceability is visible.** Each step in the Blueprint tab shows its `derived_from` handles (an unknown handle is struck through) and its effective confidence, which code caps at the weakest claim or recommendation the step cites (`stepTrace`). No BlueprintPrint or Phase 9 visual work was done.
4. **Scope correction.** The refinement cycle (§5.1) is Phase 9 work: candidate generation, adversarial comparison, self-critique, refinement and the mature qualification loop. **`limitation_reported` is unreachable until that Phase 9 machinery exists. This is a recorded dependency, not a Phase 5 defect.**
5. **Known debt, not to be "fixed" by removing inputs:** the Blueprint context is still truncated at 20,000 characters. Phase 8/9 must remove or redesign the cognitive-input truncation so the complete required context reaches Blueprint cognition.
6. **Deferred:** display of the subdomain sets (frontend/Blueprint phases); live evidence (§5.3).
7. **Vitest stays on 3.2.7** as deferred environment/tooling debt. Only the Node `vitest run` path is used. Revisit when the installer accepts the patched line, or before any Vitest browser/dev-server surface is used. Not a Janus blocker.

Evidence at close: 104/104 tests, production build passes, 69 historical Runs untouched (16 failed / 19 running / 34 completed, newest update 2026-08-11), 0 RunStage, 0 RunAttempt.
