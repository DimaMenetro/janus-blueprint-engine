# Janus Continuity State (Kytheion)
Read this first after any context reset.

## READ NEXT, IN THIS ORDER (2026-11-26, DIMA's Ideal Form directive)
1. `JANUS_KYTHEION_SME_STATE.md` — Kytheion's own CP-002 execution (Refresh ON): research, constraints, claims, intersections, model allocation, causal findings. Operate as **Janus-Kytheion** from it.
2. `JANUS_OPERATOR_DIRECTIVE_2026-11-26_IDEAL_FORM_PART1.md`, `…PART2.md`, `…PART3.md` — DIMA's directive, verbatim. Part 3 ends with the Hybrid Operational Model amendment.
3. The section "IDEAL FORM TRANCHE" near the end of this file — what is done, what is next, the exact continuation boundary.

## OPERATIVE DECISIONS THAT SUPERSEDE OLDER LINES OF THIS FILE (2026-11-26)
- **Model policy:** explicit per-call model selection is AUTHORIZED. Sonnet is the general substrate, Opus is reserved for consequential reasoning (allocation in the SME state §8). The "MODEL POLICY (binding…)" section below is HISTORICAL: its blanket Gemini ban and its "no per-call override" rule are withdrawn.
- **Gemini:** only Gemini 3.1 is prohibited. Other Gemini versions are judged on capability and authorization. Refresh must be a complete live capability, not fail-closed.
- **Paid calls:** none without DIMA's explicit approval (probes, runs, validation, external APIs). Use the recorded probe evidence.
- **Unchanged:** operator-only containment; historical runs untouched; publishing is DIMA's; never weaken inherited tests (narrow replacement only where DIMA's decision supersedes an assertion, marked in place); Phase 10 not started.

## EXECUTION SUBSTRATE (2026-11-27, DIMA) — READ BEFORE ANY CALL-PATH OR ORCHESTRATION WORK
- Record: `JANUS_EXECUTION_SUBSTRATE_EVALUATION_2026-11-27.md` (facts with sources, Janus analysis, branch requirements, exit criteria, DIMA's reserved decisions D1/D2).
- **Workflows are not a path for the model calls:** the platform enforces the 5-minute function limit identically on workflow steps; a workflow has no model-call step; workflows are shared with main and cannot be tried on a branch. They stay the Phase 10 orchestration candidate (phone independence) for calls that fit under 5 minutes.
- **Page path, in a separate branch session:** the page calls the AI Gateway directly with the operator's own token (`base44.aiGateway.connection()`, user mode, accepted on workspace-shared apps). Same request and evidence as `invokeJanusStage`. Not InvokeLLM. Main is unchanged by it.
- **Corrected fact:** the Gateway is not backend-only for this app (the "Gateway interface (docs)" line below said so).
- **Measured (read-only):** Corpus on Sonnet 5, high effort: 19,106 / 22,044 / 23,072 tokens in 235 / 263 / 282 s (~82 tokens/s), recorded. Both Cogito attempts were claimed and never recorded (the function ended). The 26 Nov benchmark that completed (`6b0868e3…`) was server-side with the expanded contracts; its 35 calls took at most 27 s on the default model. The calls became long when the allocated substrate answered, not when the call moved server-side.
- **Open runs, untouched:** `6b08e39e…` (cancel requested) and `6b08ec20…` (running) each hold their slot with an unresolved Cogito attempt that can never be recorded. `6b08eb20…` (running): its Corpus attempt holds a recorded success; "Check recorded outcome" settles it without a call.
- **Deferred for DIMA:** the documented 504 `Timeout` end is not captured, so such an attempt stays unresolved forever.

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
- **COMPLETE (closed on DIMA's review; record §6; baseline commit `239319f`, 104/104).** `qualification.js` (pure) + `finalizeRun`: lifecycle from the completion manifest (`completed` / `partial` / `failed`), one independent `qualification` stage, release only when JANUS-QUALIFIED. Screens: QualificationPanel in Results, BottomAccessory, Actus corrections.
- Reviewable decisions: Blueprint steps carry `derived_from` + `confidence`; Blueprint reads Cogito claims and patterns; contracts request subdomains for all four domains and the mode's minimum alternatives. Template `stage-compiler/2026-11-25.2`.
- Evidence: 102/102 tests, build passes, 69 historical Runs untouched (16/19/34), 0 stages.
- Closeout: the §3 decisions are accepted and must not be reversed. Subdomain output is mode-aware (Full explicit 25/25; Standard/Quick integrated, same SME expertise). Blueprint tab shows `derived_from` and effective confidence per step. Template `stage-compiler/2026-11-25.3`.
- `limitation_reported` is unreachable until the Phase 9 refinement machinery exists (recorded dependency). Blueprint context truncation (20,000 chars) is known debt for Phase 8/9: never compensate by removing inputs.
- Vitest stays on 3.2.7 (deferred tooling debt, DIMA's decision).

## STANDING DISCIPLINE (DIMA, 2026-11-25 — mandatory, non-negotiable)
An earlier Phase 6 pass was stopped because Kytheion judged recovery code "convoluted" and began rewriting it, edited inherited tests to fit the new code, and inferred a failure class from an HTTP error. That is the failure mode that forced the months-long rollback.
- **Complexity is the system.** Never simplify because code feels verbose, awkward or repetitive. Refactor shape only with demonstrated behavioural equivalence. If a section is hard to read, document it.
- **Inherited tests are the behavioural oracle.** Never weaken, delete, skip or rewrite one because new code breaks it. Check with `git diff 239319f -- <the six baseline test files>`: it must be empty.
- **Never continue from red tests.** Before a structural change: state the invariant, say why existing behaviour cannot satisfy it, make the smallest architecture-preserving change, run focused tests, run the full suite.
- **Unknown outcome = unresolved.** No failure class is ever inferred. Do not change scope.

## Phase 6 (2026-11-25) — COMPLETE — record `JANUS_PHASE6_FAILURE_RETRY_OWNERSHIP_2026-11-25.md` (§8 closeout)
- Re-anchored to `239319f`. The six inherited test files are byte-identical to it and pass (104) with 52 Phase 6 tests (`resilience.test.js`): 156/156. Build passes. 69 historical Runs untouched.
- **Same-revision retry continuation (DIMA directive):** a retryable failure with budget left never closes the revision on an open run. It stays running and waits; Resume continues the SAME RunStage at attempt n+1 after `verifyContinuation` proves protocol, template, dependency revisions and fingerprint. Mismatch fails closed (`blocked`); only the operator's explicit `closeBlockedRevision` allows a new revision. The budget is counted in calls of the revision and is never reset by an interruption. Recovery buys nothing.
- In place: one RunAttempt per actual attempt; server-side slot (`Run.active_attempt_id`) and single attempt claim, both conditional writes; server-recorded outcomes (`RunAttempt.transport`, `response_text`); bounded retry only after settlement; recovery from recorded evidence (`recoverStage` truth table, `reconcileJanus`, "Check recorded outcome"); cancellation stops retries and scheduling.
- **Operator-only containment is retained by DIMA's decision** (intentional policy, not a gate). Do not lift it; do not retire the two inherited containment tests.
- Pending evidence, not a defect: the deployed function's slot/claim/record path (to be verified in a later approved integration test; no probe Run). The five-minute transport ceiling stays fail-safe (unresolved) until the durable server/workflow work.
- Flagged for DIMA in record §8.3: a retry that could not start in a live session also leaves the revision waiting; four Phase 6 tests were changed for the directive.

## Phase 7 (2026-11-26) — CLOSED 2026-11-26 (record §7: live data-binding check; §6.5 still open for DIMA) — record `JANUS_PHASE7_VERSIONED_RERUN_2026-11-26.md`
- 177/177 (104 inherited byte-identical to `239319f`, 52 Phase 6 with 1 changed under DIMA's directive item 2, 21 Phase 7). Build passes. 69 historical Runs and DIMA's reference run `6b0780183aba68f84ea10cfc` untouched.
- Evaluation pathway of a completed run (`evaluateJanus`, `evaluateStage`): continue (same revision and budget, identity proven), start, or explicit `newVersion`. No hidden re-evaluation (`needsEvaluation` only when this Blueprint version never had a paid evaluation).
- Re-run: `rerunImpact.js` (exact recorded IDs + compiler-declared inputs), `previewRerun`, `rerunStages` (`cascade`, preview token fail-closed, `Run.graph_epoch` initiation claim). New staleness rule: a revision compiled without a declared input is stale once that input exists.
- Screens: impact preview before every re-run, per-stage Re-run and Versions in Stage lineage, evaluation controls in QualificationPanel.
- **Resume correction (DIMA, 2026-11-26; record §6):** Resume = continuity, retry = same revision, re-run = new revision, recovery = nothing. `executionState.rerunOnly`: Resume never regenerates a failed revision whose operation is spent (exhausted, non-retryable); it finishes the plan and closes the run. A re-run is refused on an open run ("Resume it first"). One inherited test replaced under explicit authorization (`stageEngine.test.js`, marked in place); `git diff 239319f` on the six inherited files must show only that test.
- 182/182 (104 inherited with that one replaced, 52 Phase 6, 26 Phase 7). Build passes. Exit table: record §6.7.
- Retained and flagged (record §6.5): after the operator's explicit `closeBlockedRevision`, Resume still starts the new revision (Phase 6 test pins it); `not_started` and `artifact_not_recorded` revisions are not failures and Resume still runs those stages.
- Open staged run `6b07cabc0e1fd52012766c16` (Full, started by the operator 2026-11-26) was seen live and not touched.

## Phase 8 (2026-11-26) — IMPLEMENTED, NOT CLOSED — record `JANUS_PHASE8_SYNTHESIS_REALIGNMENT_2026-11-26.md`
- 198/198 (104 inherited, 52 Phase 6, 26 Phase 7, 8 Phase 8 in `phase8.test.jsx`, 8 in `operatorAccess.test.jsx`). No existing test edited. Build passes.
- Plan order: four domains, then the six pairs, then `synthesis` (patterns), then Blueprint (`stagePlan`). `requiredInputs(stageKey, mode)`: patterns need 6/6 pairs; a Full Blueprint needs `synthesis` (staged runs only; historical re-runs unchanged). Pair and patterns prompts are untruncated. Template `stage-compiler/2026-11-26.1`, engine label `phase8`.
- Synthesis tab: `SynthesisStructure.jsx` (six pairs vs four patterns, counts, provenance on demand).
- **Awaiting DIMA (record §3):** validating the four patterns at the stage conflicts with the inherited test "a structurally valid Full run with a missing formal pattern cannot become completed" (it expects 13 succeeded stages, Blueprint included). Not implemented; proposed replacement is in the record.
- **Open run `6b07cabc0e1fd52012766c16`:** Actus r1 attempt 2 has a recorded response that reads as `schema_failure`; after "Check recorded outcome" it waits for attempt 3. Under a build with Phase 8 the template differs, so it is `blocked` and needs "Close this version to start a new one". Not touched.
- **Operator account control** (header): identity, role, Sign out, Switch account, through `AuthContext` unchanged (`operatorAccess.js`). Non-admins are view only. The real round trip in the installed app is unverified until DIMA publishes.

## Phase 8 — CLOSED 2026-11-26 (DIMA)
- Final Synthesis validated at its stage; stage-scoped template identity authorized by DIMA, including the one `stageEngine.test.js` assertion replacement. 232/232 at close.

## Phase 9 (2026-11-26) — correction tranche (first of two; the pipeline follows below) — record `JANUS_PHASE9_BLUEPRINT_COGNITION_2026-11-26.md`
- 245/245, build passes. No paid call. Live run `6b07cabc…` (now `partial`, Actus r2 succeeded) and reference run `6b0780…` untouched.
- `lifecycleContract.stageIntegrity`: one integrity definition used at settlement, before an input is read, and at completion (`qualification.completionOf`). Cogito `depends_on` = claim ids only; `sources` = provenance.
- Contracts list field types from the schema (`typeLegend`); schema/parse retries carry the rejections (`withCorrection`); the prompt fingerprint is unchanged.
- Completion: `completionImpact.js`, `completeJanus`, `CompletionControls.jsx`. Third operation beside Resume and Re-run; never regenerates a valid current revision; `repair` is opt-in.
- 20,000-character context cut removed everywhere.
- Templates: four domains and Blueprint `2026-11-26.2`; pairs/patterns `2026-11-26.1`; Refresh/evaluation `2026-11-25.3`.

## Phase 9 (2026-11-26) — PIPELINE AND PRESENTATION IMPLEMENTED, NOT YET RUN LIVE — record §6–§9
- 268/268 in 14 files, production build passes. No paid call. No live or historical record written.
- DIMA authorized replacing the inherited one-stage/one-call Blueprint assertions (record §4, now closed); each replacement is marked in place in the test files.
- Blueprint = durable pipeline (`blueprintPipeline.js`, `blueprintSpecs.js`): brief → candidates → selection → skeleton → expansion → criteria → assembly (code, no attempt) → critique (Standard, Full) → `blueprint` (final refinement). `executionState.blueprintPlan(mode)` is the one list of its stages.
- Templates: every stage except Refresh `stage-compiler/2026-11-26.3`; Refresh `2026-11-25.3`.
- Evaluator records surplus, restatement, objective preservation and errors of substance; code holds its verdicts to them (`qualification.evaluatorConsistency`).
- Presentation: Blueprint tab shows strategy, architecture and scope, requirement and recommendation dispositions, per-step plan, acceptance and outcome interpretation, self-critique with the refinement's answer to each finding (`components/janus/blueprint/*`); Quality panel shows the evaluator's findings; Markdown and JSON exports carry the whole reasoning record (`pipelineMarkdown`, `_blueprint_reasoning`).
- Operator "Re-run Blueprint" regenerates the whole pipeline of the run's mode; one pipeline stage alone is re-run from Stage lineage. A failed pipeline stage counts as a Blueprint need.
- Open: three unused-import lint errors in files not touched by Phase 9 (`GlassRunCard.jsx`, `RunCard.jsx`, `RefreshTab.jsx`); the new screens are not visually checked on a device; no live run has exercised the pipeline.

## Phase 9 corrective tranche 1 (2026-11-26, DIMA's Final Form execution directive) — PHASE 9 STILL OPEN
- 276/276 in 15 files. No paid call, no live record written. New: `phase9Refinement.test.js` (8).
- Evidence read (read-only) from live CCT run `6b0817e2…`: the final refinement returned less than its draft (steps 5434→4009 chars, alternatives 4→3, acceptance 4→3, substeps/checklists/inputs/outputs cut) and raised step 3 Contested→Established on Speculative support. The brief reduced a 19k-character, 12-section specification to 8 requirements. Upstream was thin (2 claims, 1 recommendation, 4 constraints). Every stage call settled in 3–14 s.
- Done: `blueprintPipeline.preservationErrors` (inside `refinementErrors`): a list of the draft may not come back shorter, a part or step text may not come back absent, unless `refinement.removals` names the path with a reason. `qualification.enforceStepConfidence`: the assembled draft's step confidence is set by code to the weakest support; corrections recorded in `audit.confidence_corrections`. Templates: `blueprint` and `blueprint:assembly` → `2026-11-26.4`; all others unchanged.
- **Needs DIMA's authorization (inherited `qualification.test.js`):** (1) "fewer than three alternatives" seeds the loss through the final Blueprint and expects it to settle; refusing a dropped alternative at the stage breaks it. (2) "invented trace handles and inflated confidence are caught" expects an inflated final label to settle and fail at qualification; refusing it at the stage breaks it. Until authorized, both are still caught only at completion/qualification.
- **Model policy: UNVERIFIED at runtime.** `invokeJanusStage` sends `{ prompt }` only. Platform docs: an omitted model uses the app-level setting; the default is `automatic`, "a fast, low cost model". InvokeLLM returns no model metadata, and the app-level value could not be read. Operator action: confirm the app's InvokeLLM model (Workspace settings › Apps configuration › AI model access › Default model), or authorize an explicit per-call Opus id (which needs the guard test "no per-call model overrides" replaced).
- Not started in this tranche: objective-brief coverage of the source material; richer upstream contracts and context threading (pair `mechanism` is not passed to the patterns stage; the Blueprint ledger omits subdomain findings, game theory, behavioral factors); L3 mechanism fields; bounded refinement cycle and `limitation_reported`; two-way Actus–Blueprint trace; qualification in exports; print/typography/visual checks; three lint errors.

## Phase 9 corrective tranche 2 (2026-11-26, consolidated implementation directive) — PHASE 9 STILL OPEN
- 288/288 in 16 files, production build passes, lint clean (the three unused imports are removed). No paid call, no live or historical record written. New: `phase9RefinementCycle.test.js` (12).
- The two inherited `qualification.test.js` assertions were replaced under DIMA's narrow authorization (directive §8), each marked in place: dropped alternatives and inflated step confidence are now refused when the final Blueprint settles; the completion and release boundaries are still asserted against a recorded artifact.
- Upstream depth: domain and Nexus contracts carry mechanisms and working models; every reasoning stage inherits prior artifacts in full (`stageContext`); the patterns stage reads each pair's mechanism. Templates: every stage except Refresh `stage-compiler/2026-11-26.5`.
- Transactional refinement (`blueprintPipeline.changeErrors`, inside `refinementErrors`): every piece of the base is returned word for word or lies under a path declared in `refinement.changes` (path, what, finding or reason). An undeclared difference, a declared path where nothing differs, and a "resolved" finding with no declared change are each refused. Trace fields keep their own rules.
- Final confidence (`lifecycleContract.stepConfidenceErrors`): a final step's label cannot exceed the weakest claim or recommendation it cites.
- Brief coverage (`blueprintPipeline.sourceOutline`): the operator's headings are numbered S1…Sn by code and the brief must account for each (requirements or context with a reason). The brief also states end state, implied necessities and relationships.
- Skeleton: every declared component is built by a step and every phase has a step. Critique: something named lost must be a finding.
- L3 `specifications` per step (algorithm, formula, data structure, state machine, interface contract, procedure, tolerance, experiment, failure handling, physical mechanism): carried by assembly, protected by preservation, shown on the Blueprint tab and in Markdown.
- Bounded substantive refinement: `stageEngine.refineStage`, `browserAdapter.refineJanus`, `RefinementControls.jsx`. Operator-initiated; one cycle = a new `blueprint` revision built on the evaluated one against the failed criteria (E1…), validated transactionally against that base, then one independent evaluation. `provenance.refines` records the base, the evaluation, the cycle and the findings; `qualification.recordedInputs` re-reads them. `MAX_REFINEMENT_CYCLES` = 2 per assembled draft, every started cycle counts; then `limitation_reported`: never released, limitations shown in the Quality panel. A refinement revision is never left waiting on a completed run: an interrupted one is settled from its last call by Reconcile.
- Evaluator: errors of substance now name empty vocabulary, scientific errors, unjustified simplification, unexecutable steps and declared changes that reduced the Blueprint; it is told to judge the thinking, not its familiarity.
- **Model policy: still UNVERIFIED at runtime** (see tranche 1). Unchanged, and the largest open risk to cognitive depth.
- Not started: two-way Actus–Blueprint trace; qualification, release and limitations in exports and print; device/visual checks of the new screens and of the account-switch round trip; a live run of the pipeline (needs DIMA's approval of the paid call).

## IDEAL FORM TRANCHE (2026-11-26, DIMA's Ideal Form directive + Hybrid Model amendment) — PHASE 9 STILL OPEN
### Established before any code changed (evidence, read-only)
- **Repository:** HEAD `c1056e4`; tree = `17c3766` (288/288, 16 files) + the directive. `594b98b` (interrupted work) was reverted by `8210e97`; readable with `git show 594b98b:<path>`.
- **The benchmark ran on a fast low-cost model, not Opus (strong inference).** Live records of run `6b0868e3…`: the query is 194,922 characters; every call settled in 5–27 s; domain calls returned 7–9k characters in 9–11 s; whole-Blueprint outputs of 26–30k characters returned in 13–20 s (hundreds of output tokens per second). The function sent `InvokeLLM({ prompt })`; the platform guide states an omitted model is `automatic`. Depth was already gone at the first domain (Corpus 4 constraints, Cogito 3 claims, Actus 3 recommendations for a 195k-character vision; brief 5 requirements, 34 of 57 sections marked context; skeleton 3 steps, confidence written as "High"/"Medium"). The substrate is therefore the first cause; mechanisms cannot be judged until a run uses the allocated models.
- **Current app-runtime model catalog (platform guide, 2026-11-26):** `claude_opus_5_5`, `claude-sonnet-5`, `claude_fable_5_1`, `claude_fable_5_2`, `gpt_6_luna`, `gpt_6_sol`, `gpt_6_astra`, `gpt_6_2_sol`, `gpt_6_2_astra`, `glm_5_2`, `gemini_3_8_flash` (the only one with InvokeLLM web context). The AI Gateway accepts the same ids. `gemini_4_carbon` and `claude_sonnet_5_5` are Builder-catalog ids, not app-runtime ids.
- **Gateway interface (docs):** `const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection()` (synchronous), then OpenAI-compatible `POST {baseURL}/chat/completions` with `Authorization: Bearer token` plus `headers`. Service-role only, backend only. **Corrected 2026-11-27: the SDK's user mode (`base44.aiGateway.connection()`) is accepted on workspace-shared apps such as this one; see EXECUTION SUBSTRATE.** Billed to the app's credit quota; rejected before the model runs when credits are out. Docs do not describe reasoning effort, web search or usage fields: those rest on DIMA's reported probes (SME state §8).
- **Refinement failures, as recorded:** r1 43 errors (numeric `where` returned as strings: the type legend called every non-object list "text values"); r2 3 (declared changes with nothing changed, positions written zero-based); r3 16 (undeclared rewrites); r4 101 (lists returned shorter); r5 passed on its second call.

### Decisions (with the reason each exists)
1. **Transport = AI Gateway, called by `invokeJanusStage`.** Reason: it is the only transport that returns the effective model, usage and finish reason, so "no hidden fallback" becomes checkable. The client still sends only `{ stage_id, prompt }`; the function reads the model from the revision it is asked to run.
2. **A revision fixes its model when it is created** (`RunStage.provenance.model = { role, requested, effort }`). Retry, continuation and recovery read it from there, so the substrate of a revision cannot change. The Run records the allocation when it starts (`model_policy_snapshot.allocation`); a run that has none (created before this tranche) adopts the default once, recorded with a timestamp, the first time a new revision is created for it.
3. **Requested and effective model are recorded on every attempt** (`RunAttempt.model_call`). A mismatch is surfaced and blocks completion as a finding; it does not discard paid output (the provider's naming is not yet measured, so failing closed could burn credits on a false alarm).
4. **No timer in the function** (standing rule). The 5-minute ceiling is met by keeping each call small, never by aborting, truncating or cutting inputs.
5. **Refinement = operations applied by code** (SME state R1), addressed by the key path shown to the model, with accepted operations kept across the attempts of a revision (a retry supplies only corrections). The earlier whole-document form stays valid for artifacts already recorded.
6. **Expansion must be decomposed (per step) before real L3 depth is possible.** With Sonnet or Opus speeds a single L3 expansion of a real plan exceeds 5 minutes. Not yet built: see the boundary below.

### Continuation boundary (update this list as work lands)
- [~] T1 model allocation — ENGINE DONE, TWO SCREENS LEFT (2026-11-27). 302/302 in 17 files, build passes, lint 0 errors. No paid call; no live or historical run written (three temporary probe records were created and deleted in the same call).
  - Done: `protocolRegistry` (`MODELS`, `COGNITIVE_ROLES`, `roleOf`, `ALLOCATION_PROFILES` hybrid/opus/sonnet, `resolveAllocation`, `modelPolicySnapshot`, `stageModel`, `modelStanding`); `base44/shared/janusModels.ts` (server list, a test keeps it identical); `invokeJanusStage` now calls the Gateway `/chat/completions` with the model read from `RunStage.provenance.model` (refuses `model_not_recorded` / `model_not_authorized` before slot and claim), records `RunAttempt.model_call` (requested, effective, effort, finish_reason, usage, request id), has a free `{ check: "catalog" }` path; `stageStore.beginStage` fixes the model on the revision; `stageEngine.allocationOf` (a pre-allocation run adopts the default once, timestamped); `verifyContinuation` blocks a revision with no model; `qualification.substrateFindings` (a substituted model blocks completion, unreported/unrecorded are warnings); `finish_reason: length` is named in the rejection; Prompt page selector (`ModelAllocationSelector`, `RoleAllocationRow`) wired through `executeJanus({ modelSelection })`. Tests: `modelAllocation.test.js` (14).
  - Inherited assertions replaced under the directive, each marked in place with the reason: `protocolRegistry.test.js` (Gemini family ban → Gemini 3.1; "no model named in src" → named only in the registry; server file list + one authorized list) and `stageEngine.test.js` (the `InvokeLLM({ prompt })` pin → the Gateway call with the model from the stage record). Containment, no-timer, no-stack and ownership assertions are unchanged.
  - **Measured facts (live store, 2026-11-27):** inside a schema-declared object the store keeps ONLY declared properties, at any depth, and returns unwritten declared ones as `null`. `provenance.method` and `provenance.refines` were therefore never stored before this tranche: the refinement-cycle bound (`MAX_REFINEMENT_CYCLES`) could not have been read back in production. Both are now declared, with `provenance.model`. The test double strips undeclared nested keys from the real schema files, so this class of loss now fails in tests. Engine code must read such fields by truthiness, never "absent vs null".
  - **Gateway catalog (free read):** chat models listed = automatic, gemini_3_8_flash, gpt_6_luna, claude-sonnet-5, claude_opus_5_5, gpt_6_sol, gpt_6_astra, claude_fable_5_1, glm_5_2, claude_fable_5_2, gpt_6_2_sol, gpt_6_2_astra. `claude_opus_4_8` is not listed (DIMA's probe reported it answering). Sonnet's id is `claude-sonnet-5` (hyphens).
  - **Unverified until the first approved live call:** the Gateway's response shape as read by the function (`model`, `choices[0].finish_reason`, `usage`), whether `reasoning_effort: "high"` and `max_tokens: 32000` are accepted for both models, and how the provider names the answering model (decides verified / tier / mismatch). The function has never made a real call.
  - Left in T1: Diagnostics panel (configured allocation, Gateway catalog check, effective model and usage of a run's calls); model and effective model per version in Stage lineage (`StageVersionList`).
- [~] T1 CORRECTIVE PASS (Daionae's review, DIMA 2026-11-27) — IN PROGRESS; keep this list exact.
  - **THE STORE, AS MEASURED 2026-11-27 (temporary records, deleted in the same call; nothing left behind). These are facts, use them:**
    - `create` and `update` APPLY THE SCHEMA: a key the schema does not declare is dropped at the top level and at every depth of an object declared with properties (list items included); a declared property not written is stored as its declared default, `[]` for a list, `null` otherwise (present, not absent); a declared object never written is `null`, not an object of nulls; an object declared WITHOUT properties (`output`, `allocation`, `usage`) is kept as written; `update` touches only the patch's top-level keys and REPLACES a declared object whole (its other properties become null).
    - `updateMany(query, { $set })` DOES NOT APPLY THE SCHEMA: it sets the given paths raw (dotted paths work), keeps undeclared keys, fills nothing. The engine uses it only for top-level scalars (slot, claim, void, epoch).
    - Enumerations are not enforced by any write. A query on `null` matches a field never set; a query on `""` does not; `{ $in: [.., null] }` does.
    - `created_date`/`updated_date`: a READ returns UTC with six fractional digits and NO zone ("2026-11-27T02:32:49.133000"); the write's own response carries "Z". `new Date()` reads the zone-less form as LOCAL time. **Defect found:** History cards (`GlassRunCard`, `RunCard`) and `StageVersionList` showed every time shifted by the reader's UTC offset (six hours in Chicago). `src/lib/janus/storeTime.js` (`instantOf`) reads them correctly — STILL TO WIRE into those three components. A date-time the app writes comes back exactly as written.
  - Done: `testPlatform.js` now behaves exactly as measured (schema-applying create/update from the real schema files, raw updateMany, null queries, both timestamp forms); `modelAllocation.test.js` holds it to the literal measured answers and replays every engine write against the schemas (nothing the engine writes is dropped). 309/309.
  - Inherited assertions changed for store fidelity ONLY (each marked `STORE-FIDELITY 2026-11-27` in place; `toBeUndefined()` → `toBeNull()` on a stored field never written, same guarantee): `resilience.test.js` ×7, `stageEngine.test.js` ×1 plus the exact shape of recorded evidence metadata (now with the store's nulls, still exact, still no text), `engines.test.js` ×1, `phase7.test.js` ×1. Report these to DIMA.
  - Done: adoption adds, never rewrites (`stageEngine.allocationOf`): the declared policy stays field for field; `adopted_policy` (new, declared in `Run.model_policy_snapshot`) holds the policy in force afterwards.
  - Schemas changed: `Run.model_policy_snapshot.adopted_policy`; `RunAttempt.outcome` gains `output_truncated`.
  - DONE in this pass (2026-11-27; 317/317 in 17 files, lint 0, build passes): (1) identity standing: verified only when tier AND version match; another version of the same tier is a substitution; a tier with no version is unconfirmed (`modelEvidence`, `statedVersion`); (2) the evaluation is held to the same rule: a substituted evaluator's verdicts are not accepted, nothing is qualified, released or refined on them, another evaluation only on the operator's decision (`evaluationRejected`); (3) `output_truncated`: finish reason `length` with an unreadable or empty answer settles the revision after ONE call, never retried unchanged, and recovery reads it the same way; my own T1 test that expected three purchases is replaced; the inherited `resilience.test.js` list of non-retryable classes gains it, marked `DAIONAE'S REVIEW 2026-11-27`; (4) `instantOf` wired into History cards and Stage lineage; (5a) Stage lineage shows each version's substrate and call (finish reason, usage); the Quality panel shows who evaluated and why verdicts were not accepted. A UI label tripped the "models named only in the registry" guard; the label was reworded ("Substrate:"), the guard is unchanged.
  - STILL TO DO in this pass: (5b) the Diagnostics model panel (configured allocation, Gateway catalog check, effective model and usage of a run's calls; `substrateText.usageTotals` is ready), held until the page-path branch is merged or discarded because both touch the Diagnostics page; (6) amend the governing plan; (7) SME state for T1.
- [ ] T2 refinement by operations + type legend + one addressing module.
- [ ] T2b per-step expansion (dynamic part stages, deterministic merge).
- [ ] T3 objective comprehension first; evaluator's own census; trace = dependence.
- [ ] T4 live Refresh: direction → retrieval as durable attempts → evidence artifact → assimilation.
- [ ] T5 attachments, large-document prompt editor, print, qualification in exports.

## Next action
Continue the boundary list above in order. Do not start Phase 10. Do not make a paid call without DIMA's approval. Publishing is DIMA's.
The page-path branch runs in its own session (EXECUTION SUBSTRATE above); main does not duplicate its work and does not create workflows for it.

## Superseded — the decision that preceded the pipeline (kept for the record)
**DIMA decision needed (Phase 9 record §4):** the Blueprint sub-stage pipeline cannot coexist with inherited assertions that pin the Blueprint as one stage and one call (stage counts of 14/13/12, exact call sequences, exact Blueprint `depends_on`). Authorize replacing those specific assertions with the stronger invariants, then build the pipeline (candidates → comparison/selection → skeleton → expansion → criteria → deterministic assembly → critique → refinement → qualification) and the presentation. Do not start Phase 10. Publishing is DIMA's. Do not make a paid call.