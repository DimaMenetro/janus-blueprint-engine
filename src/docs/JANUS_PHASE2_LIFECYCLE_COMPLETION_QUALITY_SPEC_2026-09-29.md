# Janus Phase 2 — Lifecycle, Completion & Quality Specification
- Document Type: Specification (Phase 2 exit artifact) · Date: 2026-09-29 · Author: Kytheion (Scribe-Particle-4)
- Governs: plan §7.2–7.7, §11, §12, Phase 2 · Protocol: CP-002-O-D-JNP v2.0 Ideal Form
- **Executable form (normative):** `src/lib/janus/lifecycleContract.js` · Tests: `lifecycleContract.test.js`
- Status: specified, not wired into the engine. Wiring happens in Phase 5, against the Phase 3 stage model.

## 0. Pre-Phase-2 model-policy enforcement (Daionae directive)
- Removed `claude_sonnet_4_6` overrides from `ExecutionEngine.callLLM` and `rerunEngine.callLLM`. Every call now inherits the operator's Claude Opus setting.
- Removed the `gemini_3_flash` + `add_context_from_internet` Refresh path.
- Refresh ON **fails closed** at the start of `executeJanus`. No Run is created and no LLM is invoked; `REFRESH_UNAVAILABLE_MESSAGE` is shown to the operator. There is no training-data substitute, no silent disable and no Gemini fallback.
- Future architecture is unchanged: provider-neutral retrieval → provenance-bearing source corpus → Claude Opus Refresh analysis.
- Guard test: "model policy: no per-call model overrides, no Gemini, no web-context path".

## 1. Two independent axes
| Axis | States | Terminal |
|---|---|---|
| Lifecycle (persisted run status) | queued, running, validating, completed, failed, partial, cancel_requested, cancelled | completed, failed, partial, cancelled |
| Qualification (only after `completed`) | not_started, qualifying, qualified, refinement_required, limitation_reported | qualified, limitation_reported |

- The transitions are defined in `TRANSITIONS` and `QUALIFICATION_TRANSITIONS`.
- A rerun produces a new revision (Phase 7). A rerun is never a state transition.
- `starting` and `finalizing` are UI-only labels and are never persisted.
- A cancel request always passes through `cancel_requested`. The active call settles first, and the run moves to `cancelled` at the next safe boundary.
- `partial` means a stage exhausted its retries after at least one valid stage. The valid artifacts are preserved.

## 2. Structural validity and the completion manifest
- `completionManifest(mode, artifacts, {refreshEnabled})` runs the validator for each stage in the mode profile.
- Full completion requires all of the following (§11.2):
  - Refresh valid:
    - OFF: limitations must be declared.
    - ON: provenance sources, plus all 25 subdomains covered. An explicit "no sufficiently strong current update established" counts as coverage.
  - Every domain present, each with its complete subdomain set.
  - Cogito tags inside the taxonomy, and no dangling dependencies.
  - Confidence propagation satisfied.
  - All 6 intersections and all 4 patterns present, with every pattern field.
  - The Blueprint contract met: goal; steps with title, instructions and validation; success criteria; risk register; at least 3 alternatives.
- Quick and Standard validate only their own profile stages. Their label always says "partial" and never claims Full completion.

## 3. Parse / schema failure
- Parse and schema failures count as **settled failure evidence** (`FAILURE_EVIDENCE`) and can be retried.
- Retry rules (`RETRY_POLICY`):
  - at most 3 attempts per stage;
  - retry only after the prior attempt has settled;
  - no local inference deadline;
  - a heartbeat is never failure evidence.
- `outcomeAfterStageFailure`: the run becomes `partial` if at least one valid stage exists, otherwise `failed`.

## 4. Confidence propagation (§5.5)
- `enforceConfidencePropagation` works deterministically: code sets each recommendation's confidence to the lowest normalized tag among its dependencies. The model's own label is overridden, and every correction is recorded and shown in the UI.
- `Probable` is normalized to `Contested`. This is a compatibility normalization only.
- A recommendation with no resolvable dependency is a blocking error in Full and a warning in partial profiles.

## 5. Quality qualification (§7.2–7.4)
- `QUALITY_CRITERIA` lists the 14 constitution criteria. Each criterion is checked by one of three methods:
  - **deterministic:** evidence discipline, implementation depth;
  - **traceability:** cross-domain necessity, emergence, intellectual honesty;
  - **independent critique:** the other nine, checked by a separate evaluation pass.
- The generator's self-assessment never counts.
- `qualify(verdicts)` rules:
  - Any missing verdict keeps the state at `qualifying`.
  - Any failed criterion moves it to `refinement_required`.
  - All pass (or not applicable) moves it to `qualified`.
- After `MAX_REFINEMENT_CYCLES` (2) the state becomes `limitation_reported`.
- **Release** (`releaseDecision`):
  - Only a `completed` run can be released.
  - `qualified` is released with the **JANUS-QUALIFIED** label.
  - `limitation_reported` is released with the label "not JANUS-QUALIFIED".
  - Anything else stays an unreleased candidate. JSON validity alone never releases a Blueprint.
- Mode expectations are in `MODE_EXPECTATIONS`:

| Mode | Minimum alternatives | Adversarial critique | Refinement after critique |
|---|---|---|---|
| Quick | 1 | no | no |
| Standard | 2 | yes | no |
| Full | 3 | yes | yes, plus the §7.4 Full requirements |

## 6. UI representation (§7.7)
- `UI_STATES` maps every lifecycle state to a label, a tone, the operator actions allowed, and the fields shown.
- `UI_RULES` binds the following:
  - the partial label;
  - the JANUS-QUALIFIED badge only through `releaseDecision`;
  - elapsed time shown as telemetry only;
  - confidence corrections kept visible;
  - failure evidence and preserved artifacts kept browsable.
- These are the blocking frontend exit criteria for Phase 5.

## 7. Decisions made here (reviewable)
1. Qualification is a separate axis, not additional lifecycle states. This keeps the persisted status small and survives Phase 3.
2. `limitation_reported` releases with a visible label that says it is not qualified.
3. An unanchored Actus recommendation blocks Full completion.
4. Retry budget is 3 attempts per stage; refinement budget is 2 cycles.

## Exit test
- 27/27 Vitest tests pass. 15 of them are new lifecycle/contract tests.
- Production build passes.
- Every semantic that Phases 3–5 need is defined in the executable contract, so none has to be invented during coding.