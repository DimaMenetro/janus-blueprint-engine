# Janus Phase 0 — Baseline Audit Report
**Governing plan:** `src/docs/JANUS_FINAL_FORM_ARCHITECTURE_IMPLEMENTATION_PLAN_v1.2_2026-09-29.md`
**Author:** Kytheion (Scribe-Particle-4) · **Date:** 2026-09-29 · **Mode:** read-only audit, no source/data mutation
**Status:** Phase 0 PARTIAL — halted at operator gates (see §9)

## 1. Source inventory (live, restored baseline)
Pages: Diagnostics, History, NewQuery, OAuthConsent, Results (+ Layout.jsx, auto-registered via `pages.config.js` → `App.jsx` loop).
Janus core: ExecutionEngine, rerunEngine, RerunControls, domainSME, janusSchema, promptUtils, exportUtils, ExecutionContext, GlassResultTabs, 8 tabs.
Backend functions: checkRunFields, getAllErrors, testSynthesis, testCompressedSynthesis, testPromptSize (diagnostic artifacts — plan §3.6; NOT reused).
Absent as expected: BottomAccessory source is present only as `components/ui/BottomAccessory.jsx` (listed); llmCall, server lane, BlueprintPrint, durable resume — absent. Confirms plan §2.1.
Test tooling: build / lint / lint:fix / typecheck only. No test runner (plan §3.9 confirmed).

## 2. Protocol drift (confirms §3.1, with exact evidence)
Active roster in `domainSME.jsx` (24 subdomains):
- Corpus 7: Distributed Systems; Data Engineering & Systemic Integrity; Cybersecurity & Threat Intelligence; Systems Engineering; Theoretical & Quantum Physics; AI/ML Systems; Neuroscience & Cognitive Science.
- Cogito 6: Unified AI & Cognitive Arch.; Knowledge Graph & Semantic Networks; Epistemology & Algorithm Auditing; Computational Linguistics & Narratology; GraphRAG & Causal Reasoning; Neuro-Symbolic AI. — **missing Knowledge Representation (as named), Systems Modeling.**
- Animus 5: Philosophy of Mind & Metaphysics; **Jungian Psychology**; Ethical AI & Moral Frameworks; **UI/UX & HCI**; AI Safety & Alignment. — missing Consciousness Theory, Risk Analysis.
- Actus 6: **Game Theory & Strategic Foresight** (merged); MLOps & Product Management; **Agile & Scrum**; Technical Writing; Behavioral Economics; API Design. — missing Strategic Planning split, Feedback & Iteration Models.
Version strings: Layout.jsx:58 and Diagnostics.jsx:86 `CP-002 v1.5`; domainSME.jsx:1,327 `v1.1`; janusSchema.jsx:402 `All 24 Subdomains`.
Second roster copies: pair map in ExecutionEngine.jsx:20-30 and rerunEngine.jsx (duplicated intersection prompts) — violates invariant 7.1.2/7.1.3.

## 3. Model policy — VERIFIED (plan §16.3 step 1)
Base44 SDK docs: *"Optionally specify a model to override the app-level model setting for this specific call."* → **explicit per-call model beats the app setting.**
Live explicit overrides:
- ExecutionEngine.jsx:367 → `gemini_3_flash` (Refresh)
- ExecutionEngine.jsx:369 → `claude_sonnet_4_6` (all domain/Synthesis/Blueprint stages)
- rerunEngine.jsx:22 → `claude_sonnet_4_6`
- testSynthesis / testCompressedSynthesis → `claude_sonnet_4_6`
**Conclusion (Established):** no current Janus stage runs on the operator's Opus setting.
**Contradiction (Established):** the platform supports web context (`add_context_from_internet`) ONLY on `gemini_3_flash` / `gemini_3_1_pro`. Plan §5.7 requires Refresh ON with live sources; §16.2 forbids a hidden Gemini path. Both cannot hold simultaneously → operator gate G-3.

## 4. Truncation classification (plan §3.7)
| Location | Category | Assessment |
|---|---|---|
| ExecutionEngine.jsx:160-161, rerunEngine.jsx:62-63 — pair context sides `slice(0,6000)` | 1 cognitive-input | Fidelity-breaking; remove/justify in Phase 8 |
| domainSME.jsx:444 — synthesis prompt domain data `slice(0,2000)` | 1 cognitive-input | Fidelity-breaking; severe (2k/domain) |
| ExecutionEngine.jsx:12 MAX_CONTEXT_LENGTH 20000 via truncate() | 1 cognitive-input | Audit per call-site in Phase 4 |
| ExecutionEngine.jsx:11 MAX_PROMPT_LENGTH 10000 (stored full_prompt) | 3 storage/cache | Harmless if canonical prompt reconstructable |
| MAX_RAW_JSON_LENGTH 200000 (both engines) | 3 storage/cache | Harmless; exportUtils reconstructs losslessly |
| ExportTab 500-char previews, RunCard/GlassRunCard 60, Results 120 | 4 display | Presentation only |
| testCompressedSynthesis 400/800/3000 slices | 1 (in diagnostic) | Contaminated artifact; archive in Phase 6 |
No LLM-output (category 2) truncation found before persistence.

## 5. Timers / watchdogs (plan §3.5) — confirmed absent
Only UI timers: ExportTab copy-toast (2s), ExecutionContext reset (3s/5s). No Promise.race, no inference timeout.

## 6. Data temporal-drift (plan §4) — re-verified live
Total 69 · completed 34 · failed 16 · running 19 · full 49 · standard 17 · quick 2 · null mode 1 — **exact match to plan §4.3.**
Of 19 `running`: 6 carry donor-era `current_step` (domain:corpus/cogito/animus, blueprint:criteria — latest 2026-08-03); 13 carry no lifecycle fields (Mar–May 2026). `execution_owner` null on all 19. Three record generations exist → legacy adapter must handle ≥3 shapes. **No records mutated.**

## 7. Routing inventory (plan §3.8 / §21.7)
Baseline: `pages.config.js` auto-registration feeds `App.jsx` loop wrapped in Layout. Platform notice (2026-09-29): auto-generation is **no longer active** for this app — new/salvaged pages require an explicit `<Route>` wrapped in `LayoutWrapper`. Resolves plan §3.8 ambiguity in favour of §21.7.

## 8. Blocked evidence
- Donor checkpoint `6aba9c17194e77333df6288e` / commit `3f25d14c…` — **not readable from this sandbox.** Blocks Phase 0 items 10, 11, 16, 18 (salvage diff, UI donor baseline, Liquid Glass/BlueprintPrint donor inventory). `LIQUID_GLASS_TEMPLATE.md` is a partial secondary source only.
- `Janus_Blueprint_Engine_Builder_Chat_Export_2026-09-27.txt` — not present in the workspace.
- Workflow entitlement — not yet measured (Phase 10 requires DIMA approval anyway).
- Historical benchmark candidates — selectable from the 34 completed Runs only after completion-integrity audit; needs Builder export for "pre-degradation" provenance.

## 9. Operator gates reached (Phase 0 exit test requires DIMA agreement)
- **G-1 Donor access:** supply donor source snapshot/diff (e.g., GitHub repo sync of commit `3f25d14…`, or a zip/export upload).
- **G-2 Test runner:** recommend Vitest (native to Vite, zero config change, dev-only). Requires package approval.
- **G-3 Model/Refresh contradiction:** options (a) Refresh stage explicitly and visibly on `gemini_3_1_pro` as a declared, audited per-stage policy, all other stages inherit app setting (Opus) — *recommended*; (b) Refresh via a non-LLM search API backend function with secrets, Opus analyses results; (c) Refresh OFF until resolved.
- **G-4 Builder chat export:** upload for provenance/benchmark selection.
- **G-5 Phase 0 exit agreement** on this report.