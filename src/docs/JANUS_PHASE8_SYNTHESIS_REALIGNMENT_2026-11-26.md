# JANUS PHASE 8 — Synthesis Realignment (2026-11-26)
- Document type: phase record (Kytheion, Scribe-Particle-4). Governing plan: `JANUS_FINAL_FORM_ARCHITECTURE_IMPLEMENTATION_PLAN_v1.2_2026-09-29.md`, §5.2, §5.3, §14, Phase 8.
- Authorization: DIMA, 2026-11-26 ("close Phase 7 if its exit criteria genuinely pass, then proceed into Phase 8"). No model call, no publication, no historical mutation.
- Status: **IMPLEMENTED AND GREEN; NOT CLOSED.** One item needs DIMA's adjudication (§3). 198/198 tests, build passes. Automated evidence only.
- Also in this wave (not Phase 8): the operator account control (§6).

## 1. What Phase 8 found
The six pair stages, the patterns stage and the composed Synthesis artifact already existed (Phases 3 to 5). Four things did not conform:
1. Pairs were started in between the domains (a pair ran as soon as its later domain settled). Plan §5.3 and §14: the four domains complete first, then Synthesis is entered.
2. The patterns stage had no required inputs. With a failed pair it was still compiled, with "(not computed)" in place of the missing pair.
3. The Blueprint had no required inputs. In Full it was compiled without a Synthesis (premature Blueprint).
4. Each side of a pair prompt was cut at 6,000 characters, and the pair and patterns contexts were subject to the 20,000 character bound (cognitive-input truncation, plan §3.7).

## 2. Changes (each the smallest that holds its invariant)
### 2.1 Order
**Invariant.** Synthesis is one phase after the four primary domains: six pairs, then the four patterns, then the Blueprint.
**Why existing behaviour could not satisfy it.** `stagePlan` interleaved each pair after its later domain.
**Change.** `executionState.stagePlan`: the six pair keys are placed immediately before `synthesis`. A pair reads exactly what it read before (its two domains), so its cognition is unchanged. `laterDomain` is removed with it. A run begun under the earlier order resumes without regenerating anything (test).
### 2.2 6/6 pairs before the patterns; Synthesis before a Full Blueprint
**Invariant.** The patterns are produced only from six validated pairs. In a mode whose plan has Synthesis, the Blueprint is produced only after a valid Synthesis revision exists.
**Why existing behaviour could not satisfy it.** `requiredInputs` returned nothing for `synthesis` and `blueprint`.
**Change.** `stageCompiler.requiredInputs(stageKey, mode)`: `synthesis` needs the six pair keys; `blueprint` needs `synthesis` when the mode's plan contains it. The engine (`executeStage`) and the re-run preview (`rerunImpact`) pass the mode. The existing machinery does the rest: a stage with an absent required input is not compiled, and a re-run of it is refused before anything is written ("blueprint needs synthesis, which has no valid revision"). Quick and Standard have no Synthesis stage and are unchanged.
**Scope decision to note.** The rule binds staged runs only. A historical Run is re-run as before (a Phase 7 test pins that a historical Full Run without Synthesis can have its Blueprint re-run). If DIMA wants historical re-runs held to the rule too, that test needs a narrow authorization.
### 2.3 No truncation in Synthesis
`PAIR_INPUT_LIMIT` (6,000) is removed. Pair prompts and the patterns prompt are marked `untruncated`, so the 20,000 bound no longer applies to them. The bound remains for the Blueprint and domain contexts (Phase 9 debt, unchanged, still never compensated by removing inputs).
### 2.4 Versions
`PROMPT_TEMPLATE_VERSION` is `stage-compiler/2026-11-26.1` (pair and patterns prompts changed). `ENGINE_VERSION` is `janus-engine/2.0-phase8` (label only).
**Consequence.** A revision waiting for its retry that was recorded under `2026-11-25.3` is no longer the same operation under this build and is reported `blocked` (fail closed, as designed). See §5.
### 2.5 Screens
Synthesis tab: a structure block at the top (`SynthesisStructure.jsx`) names the two kinds apart, "Six pairwise intersections (n of 6)" and "Four formal emergent patterns (n of 4)", marks what was not produced, and discloses provenance on demand (each pair's revision and the domain revisions it read; the patterns revision and the six pair revisions it read; stale reasons). The two sections below carry matching headings.

## 3. CONFLICT FOR DIMA'S ADJUDICATION (not changed)
**The plan.** §14 steps 9 to 12: produce the four patterns, validate the final Synthesis, then proceed to the Blueprint.
**The inherited assertion.** `qualification.test.js`, "a structurally valid Full run with a missing formal pattern cannot become completed": a patterns output that lacks a formal pattern settles as a **succeeded** stage, the Blueprint **is produced** from it (13 succeeded stages), and the run is stopped only afterwards by the completion manifest (`partial`).
**Why they conflict.** Validating the four patterns at the stage (missing pattern or field settles `schema_failure`, with the stage's bounded retries, and no Blueprint) gives 11 succeeded stages. I implemented it, the inherited test failed, and I removed it again. No test was edited.
**State now.** The stage accepts a patterns output with a missing pattern; the Blueprint can then be built on it; the run cannot complete, is never evaluated and never released (unchanged Phase 5 guarantee).
**Proposed replacement (needs explicit authorization for that one test row).** In `stageRunner.validateStageOutput("synthesis")`, require every field of every registry pattern. The row then asserts: `synthesis` r1 failed `schema_failure` after its attempts, zero Blueprint calls, run `partial`, manifest incomplete, no evaluation. Stronger on the test's own guarantee.

## 4. Exit tests (plan, Phase 8)
| Exit test | Proof (`phase8.test.jsx` unless stated) |
|---|---|
| 6/6 pairs required | "with one pair failed, the patterns are not produced…"; "the compiler states the rule" |
| each pair has insight/tension/resolution | inherited "an intersection missing a mandatory field is a schema_failure too"; Full plan test |
| four formal patterns exist without overwriting pair artifacts | "the four formal patterns are added beside the six pairs and never overwrite them"; **four patterns enforced at the stage: open, §3** |
| no premature Blueprint | pair-failed and patterns-failed tests (zero Blueprint calls; re-run refused, nothing written); **missing-pattern case: open, §3** |
| UI distinguishes six pairs from four patterns | structure block rendered from the durable view in two tests (6 of 6 / 4 of 4; 5 of 6 / 0 of 4) |
| no cognitive truncation in Synthesis | "a pair reads both of its domains in full…" (30,000 and 25,000 character inputs arrive whole) |
- Suite: 198 = 104 inherited (one replaced in Phase 7, none touched here) + 52 Phase 6 + 26 Phase 7 + 8 Phase 8 + 8 operator access. Build passes.
- Not verified: the Synthesis tab with real data in a browser (the builder preview cannot read DIMA's runs). No live model call.

## 5. Live data (read-only, 2026-11-26 07:30 UTC)
- 69 historical Runs unchanged (34 completed / 16 failed / 19 running). Reference run `6b0780183aba68f84ea10cfc` unchanged.
- Open Full run `6b07cabc0e1fd52012766c16`: Actus r1, attempt 2 claimed with a recorded response and not settled (the session that awaited it is gone; cause not established). Read against the validator, that recorded response is a `schema_failure` (`actus.behavioral_factors.identity_economics: Expected string, got object`, the same field as attempt 1), so "Check recorded outcome" will leave r1 waiting for attempt 3 of 3.
- **Because of §2.4:** continued from the currently published build, attempt 3 runs normally. Continued from a build that contains Phase 8, r1 is reported as no longer the same operation and needs "Close this version to start a new one". Not written, reconciled or resumed from here.
- Observation for Phase 9 or earlier, not acted on: Actus failed validation twice in a row on the same field. The contract shows `identity_economics` only by example; the model returned an object both times.

## 6. Operator account control (operator UX; not a Phase 8 item)
- `src/lib/janus/operatorAccess.js` (pure), `AccountControl.jsx` + `AccountPanel.jsx` in the header. Uses `AuthContext` unchanged: `user` (from `base44.auth.me()`), `logout()`, `navigateToLogin()`.
- Shows identity and role. "Sign out": the existing `logout()`. "Switch account": marks the current address with `janus_switch_account`, calls `logout()`; when the app loads at the marked return address signed out, it removes the mark and calls `navigateToLogin()`, whose return destination is the current Janus route. Nothing is stored. Signed out: "Sign in".
- View-only for non-admins: Execute (New Query), the run controls (Resume, Check recorded outcome, Cancel) and the Synthesis/Blueprint re-run block are not offered. The engine and the function refuse a non-admin as before (containment unchanged).
- Evidence: `operatorAccess.test.jsx` (8). Live read this turn: `auth.me()` for the builder session is `kinoru11@gmail.com`, role `admin`.
- Not verified: the real sign-out and sign-in round trip inside the installed app (it needs a published build and DIMA's device).
