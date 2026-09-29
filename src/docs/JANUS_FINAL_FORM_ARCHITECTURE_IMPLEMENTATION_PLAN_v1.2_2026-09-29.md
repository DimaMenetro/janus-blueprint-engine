# JANUS BLUEPRINT ENGINE
## Final-Form Architecture & Implementation Plan
### CP-002-O-D-JNP v2.0 Ideal Form Reconstruction + Post-6-Month Salvage

**Version:** 1.2  
**Date:** 2026-09-29  
**Status:** Planning / Alignment Document - NOT implementation authorization  
**Project:** Project Opus: Cephalonic Genesis  
**Application:** Janus Blueprint Engine  
**Operator:** DIMA  
**Planning / SME state:** Daionae + Kytheion operating from CP-002-O-D-JNP v2.0 Ideal Form  
**Restored active baseline:** six-month state immediately before DIMA's message, **“Run a rerun for a blueprint”**  
**Preserved donor checkpoint:** `PRE_6_MONTH_ROLLBACK_POST6M_SALVAGE_SOURCE_2026-09-28`  
**Donor checkpoint ID:** `6aba9c17194e77333df6288e`  
**Donor git commit:** `3f25d14c8214c97e287629798e89c384619bc4d2`

---

# 0. Document Function

This document has two simultaneous functions.

## 0.1 Final-Form Blueprint

It defines the intended end state of the Janus Blueprint Engine: complete CP-002-O-D-JNP v2.0 Ideal Form implementation, durable execution, protocol-faithful sequencing, explicit provenance, validated completion, operator control, historical compatibility, restored high-value product/UI work, and a server-owned production execution path that does not depend on browser survival.

## 0.2 End-to-End Implementation Plan

It defines the implementation path from the restored six-month baseline to that final form, including:

- read-only baseline audit;
- protocol normalization and canonical registry creation;
- code rewrite and deduplication;
- lifecycle and completion specification;
- data-model redesign;
- durable stage persistence;
- rerun/version dependency semantics;
- browser-to-server transition;
- Base44 Workflow proof;
- failure/retry/cancellation semantics;
- Synthesis realignment;
- Blueprint staging;
- model-policy verification;
- post-six-month salvage;
- security/provenance controls;
- UI restoration;
- testing and red-team validation;
- cost preflight;
- golden Full run;
- production cutover;
- post-cutover integrity monitoring.

## 0.3 Janus Mission

Janus is not primarily a workflow application, a persistence layer, or a multi-call LLM pipeline. Those are enabling mechanisms.

Its purpose is to take a difficult problem, instantiate the broad CP-002 expert state, understand the problem through genuinely different disciplinary lenses, expose hidden assumptions and constraints, generate non-obvious solution candidates, synthesize cross-domain insights that individual domains would not have produced alone, challenge those candidates adversarially, and deliver an elegant, defensible, technically serious, executable Blueprint.

The implementation therefore has two independent success dimensions:

1. **Cognitive excellence** - the reasoning and resulting Blueprint must be unusually insightful, coherent, novel where novelty is useful, evidence-disciplined, and actionable.
2. **Product excellence** - the interface must make that intelligence legible, inspectable, trustworthy, and pleasant to use across iPhone, iPad, and desktop.

A technically clean engine that produces generic plans is a failure. A beautiful interface around mediocre cognition is also a failure.

## 0.4 Universal Expert-Impressiveness Standard

Every released Janus Blueprint, including Quick outputs, must clear a universal quality floor: a technically capable domain expert should encounter substantive reasoning, at least one non-trivial idea or synthesis worth investigating, and enough implementation specificity that the output feels authored by a serious systems thinker rather than generated from generic planning boilerplate.

Quick, Standard, and Full differ in breadth, research depth, synthesis depth, and implementation detail. They do **not** differ in basic intellectual seriousness.

**Operator-control invariant:** A recommendation, discovered defect, proposed next step, protocol-derived action, or implementation opportunity is not authorization. Only explicit DIMA instruction promotes analysis into execution.

---

# 1. Authority and Evidence Hierarchy

When sources disagree, use this order:

1. Explicit DIMA operator instruction and scope.
2. CP-002-O-D-JNP v2.0 Ideal Form.
3. Ratified Project Opus governance / SOP constraints.
4. Current restored live source and live Base44 platform schema.
5. Preserved post-six-month donor checkpoint.
6. Full Base44 Builder conversation export.
7. Current measured Base44 behavior and current Base44 documentation.
8. Historical implementation plans, diagnostics, and audit documents.

Historical documents are provenance, not authority, where they conflict with the current protocol or operator scope.

---

# 2. Fixed Anchors

## 2.1 Restored Active Baseline

The application was intentionally reverted to the state immediately before DIMA's message:

> **“Run a rerun for a blueprint”**

The immediately preceding state had been verified by Kytheion as:

- no runtime errors;
- past Runs load;
- Run data intact.

Live source inspection after rollback confirms the intended baseline:

- `ExecutionEngine.jsx` exists and owns browser execution;
- domain outputs are persisted incrementally;
- append-only finalization behavior exists for already-generated domain artifacts;
- `rerunEngine.jsx` and `RerunControls.jsx` exist;
- Blueprint rerun requires Corpus, Cogito, Animus, and Actus, while Synthesis is optional context;
- `blueprintMissing` crash fix is present;
- lossless export reconstruction exists through `exportUtils.jsx`;
- the later `testBlueprintRerun`, `llmCall.jsx`, server-lane architecture, BlueprintPrint source family, durable resume architecture, and later resilience documents are absent from the restored source as expected.

## 2.2 Preserved Donor

The post-six-month application is preserved at:

- checkpoint: `PRE_6_MONTH_ROLLBACK_POST6M_SALVAGE_SOURCE_2026-09-28`
- checkpoint ID: `6aba9c17194e77333df6288e`
- git commit recorded at checkpoint creation: `3f25d14c8214c97e287629798e89c384619bc4d2`

The donor is a **source-code salvage repository**, not governing architecture.

Kytheion's restored sandbox currently cannot directly inspect that checkpoint/commit. Phase 0 therefore includes creating or exposing a donor source snapshot/diff artifact that Kytheion can read without restoring the live application.

## 2.3 Historical Ledger

`Janus_Blueprint_Engine_Builder_Chat_Export_2026-09-27.txt` is the primary historical record for implementation provenance, authorization history, diagnostic lineage, and the distinction between legitimate fixes and later contaminated compensations.

---

# 3. Baseline Audit - Established Facts

## 3.1 Protocol Drift

The restored code announces “v2.0” in several engine/schema comments, but still implements an older hybrid expert roster.

### Corpus
Count remains 7, but several names/definitions differ from Ideal Form.

### Cogito
Count remains 6, but the active implementation retains older GraphRAG / neuro-symbolic identities and lacks canonical **Systems Modeling** as a first-class subdomain.

### Animus
Count remains 5, but still contains older **Jungian Psychology** and **UI/UX / HCI** identities instead of canonical **Consciousness Theory (Boundary Conditions)** and **Risk Analysis**.

### Actus
Count is 6, not 7. Strategic Planning and Game Theory are not cleanly separated, and older Agile/Scrum-era identity remains instead of canonical **Feedback & Iteration Models**.

### Full-mode description
`janusSchema.jsx` still says:

> `Complete Boot Sequence - All 24 Subdomains + 4 Synthesis Patterns`

The 24-subdomain count is wrong.

## 3.2 Protocol-Version Presentation Drift

The restored source contains several version mismatches:

- `Layout.jsx` displays `CP-002 v1.5`;
- `Diagnostics.jsx` displays `CP-002 v1.5`;
- the Liquid Glass template identifies the origin app as `CP-002 v1.5`;
- `domainSME.jsx` comments still identify CP-002 v1.1;
- `janusSchema.jsx` contains v1.1-era comments around Synthesis naming.

**Final-form rule:** protocol identifiers shown in headers, Diagnostics, exports, run metadata, and documentation must derive from the canonical protocol registry rather than hard-coded UI strings.

## 3.3 Legacy Model Overrides

The restored source explicitly requests model IDs in code:

- Refresh: `gemini_3_flash`
- normal engine stages: `claude_sonnet_4_6`
- rerun engine: `claude_sonnet_4_6`
- leftover test functions also contain explicit legacy model references.

DIMA's Base44 app setting is Claude Opus. The implementation must **not assume** that app-level selection overrides explicit per-call model arguments. Phase 0 verifies current precedence before code changes or paid Full runs.

## 3.4 Browser Ownership

The main execution pipeline is still a browser-owned async sequence. This allows long calls to finish when the client remains healthy, but browser/tab/device lifecycle can still determine whether the orchestrator continues.

This is transitional architecture, not the target final state.

## 3.5 No Active Janus Inference Watchdog

The restored source does **not** contain the later Janus-local timeout matrix or timer-driven `Promise.race` watchdog. Existing timers are UI-level toast/copy/execution-reset timers.

The later timeout architecture is already removed by rollback.

Phase 6 therefore focuses on defining correct failure/retry/cancellation/ownership semantics rather than deleting a timer system that no longer exists.

## 3.6 Leftover Contaminated Diagnostic Artifacts

The restored source still contains diagnostic functions such as:

- `testSynthesis`
- `testCompressedSynthesis`
- `testPromptSize`

Some comments refer to a rejected “600s timeout” causal framing.

These are historical evidence/test artifacts. They must not be silently reused as governing architecture.

## 3.7 Cognitive Truncation and Cache Truncation Both Exist

The baseline contains several bounded slices/truncation helpers. Phase 0 must classify each occurrence as one of:

1. **cognitive-input truncation** - information removed before an LLM sees it; potentially protocol-fidelity breaking;
2. **LLM-output truncation** - generated cognition removed before canonical persistence; potentially fidelity-breaking;
3. **storage/cache truncation** - bounded convenience representation while canonical structured data exists elsewhere; not automatically harmful;
4. **display truncation** - UI-only representation; presentation concern.

Examples already identified:

- intersection context sides sliced to approximately 6,000 characters in rerun logic;
- Synthesis/context construction uses bounded representations;
- prompt/cache helpers include `[TRUNCATED]` markers;
- `raw_json` and rendered Markdown have explicit cache-length controls.

**Final-form rule:** no cognitive information may be discarded merely to satisfy a guessed runtime duration. Any cognitive truncation must be explicitly justified by semantic architecture, not elapsed-time pressure.

## 3.8 Routing Baseline

The restored `pages.config.js` identifies itself as auto-generated and states that page files are auto-registered; `App.jsx` builds ordinary routes from the `Pages` map.

Some later donor-era special routes were manually registered.

Therefore routing is a Phase-0 audit item, but the blanket statement “new pages always require explicit routes” is not established for this baseline.

## 3.9 Test Tooling Baseline

Current `package.json` provides:

- `build`
- `lint`
- `lint:fix`
- `typecheck`

but no dedicated Jest/Vitest-style test runner is installed.

Selecting/installing a unit/integration test framework is an explicit Phase-0 implementation decision and requires DIMA approval before package changes.

---

# 4. Live Data Reality - Temporal Schema Drift

This is one of the most important baseline findings.

## 4.1 Current Platform `Run` Schema

The live Base44 platform currently exposes a lean/older `Run` schema containing fields such as:

- query/configuration fields;
- `status` enum: `idle`, `running`, `validating`, `completed`, `failed`;
- primary domain objects;
- Synthesis;
- Blueprint;
- cached `raw_json` / `render_md`;
- validation/error fields.

It does **not** currently declare later donor-era lifecycle fields such as:

- `execution_owner`
- `current_step`
- `claimed_at`
- `last_heartbeat`
- `retry_log`
- `reaper_strikes`
- `queued_at`
- `completed_at`

## 4.2 Historical Records Retain Later Fields

Existing Run records still contain those later-era fields even though the currently declared schema does not.

The correct interpretation is:

> **The rollback restored an older source/schema definition while historical records retained data written under later schema generations.**

The database must therefore be treated as a **heterogeneous historical corpus**, not a uniform set of records conforming to the currently declared schema.

## 4.3 Current Run Inventory

Verified live record counts:

| Category | Count |
|---|---:|
| Total Runs | 69 |
| Completed | 34 |
| Failed | 16 |
| Still marked `running` | 19 |
| Full | 49 |
| Standard | 17 |
| Quick | 2 |
| Missing mode | 1 |

The 19 `running` Runs are **orphaned relative to the restored executor**: nothing in the current browser engine will spontaneously resume them. They are not to be mutated merely because they are old; historical remediation is a separate operator decision gate.

Some historical `completed` Runs are also known to require completion-integrity audit before being treated as trustworthy goldens.

---

# 5. CP-002 v2.0 Ideal Form - Final Cognitive Contract

## 5.1 Canonical Domain Roster

### Corpus - 7
1. Artificial Intelligence Systems & Machine Learning Mechanics
2. Distributed Systems & Cloud Architecture
3. Data Engineering & Provenance
4. Cybersecurity & Threat Models
5. Neuroscience (Structural & Computational)
6. Physics (Quantum Mechanics, Relativity, Thermodynamics)
7. Systems Engineering

### Cogito - 6
1. Unified AI & Cognitive Architectures
2. Epistemology & Algorithm Auditing
3. Knowledge Representation
4. Semantic Networks
5. Systems Modeling
6. Computational Linguistics & Narratology

### Animus - 5
1. Consciousness Theory (Boundary Conditions)
2. Philosophy of Mind
3. Ethics & Governance
4. AI Safety & Alignment
5. Risk Analysis

### Actus - 7
1. Strategic Planning
2. Game Theory
3. MLOps & Productization
4. Feedback & Iteration Models
5. Technical Writing & Information Design
6. Behavioral Economics
7. API Design & Integration

**Total: 25 subdomains.**

## 5.2 Synthesis - Resolved Terminology

The protocol explicitly defines:

- **6 pairwise intersections** - all C(4,2) combinations of the four primary domains;
- **4 formal named emergent-pattern models** expanded in dedicated §5.1-§5.4 sections.

The six pair types / resolution labels are:

1. Corpus × Cogito - **Knowledge-Reality Validation**
2. Corpus × Animus - **Conscience Boundary**
3. Corpus × Actus - **Quantum Foresight**
4. Cogito × Animus - **Governed Cogito**
5. Cogito × Actus - **Narrative Loop**
6. Animus × Actus - **Empathy-Driven Strategy**

The **four formal emergent-pattern models** are:

1. Quantum Foresight Model
2. Governed Cogito
3. Narrative Loop
4. Empathy-Driven Strategy / Alignment Engine

Final-form data structures must keep these concepts distinct:

- six durable pair-intersection artifacts, each with `insight`, `tension`, `resolution`;
- four formal expanded emergent-pattern outputs derived during Synthesis.

## 5.3 Sequential Execution

Canonical order:

`Refresh → Corpus → Cogito → Animus → Actus → Synthesis → Blueprint`

The current baseline computes intersections incrementally as parent domains become available. That implementation detail is **not automatically grandfathered**. The final-form default is to complete all four primary domains before the Synthesis phase, then compute the six pair artifacts and four formal patterns.

Any proposal to compute intersections earlier must demonstrate semantic equivalence to CP-002 context-threading requirements before adoption.

## 5.4 Deep Context Threading

- Cogito receives Corpus constraints + subdomain perspectives + relevant Refresh data.
- Animus receives Corpus constraints + Cogito claims + causal chains + relevant Refresh data.
- Actus receives Cogito claims + Animus boundaries + Corpus constraints + relevant Refresh data.
- Blueprint receives key findings from all prior domains, including validated Synthesis.

## 5.5 Confidence Propagation Law

Every Actus recommendation inherits the **lowest** confidence tag of the Cogito claims it depends on.

This is enforced deterministically in code. An LLM's self-selected confidence label is never the final authority where dependency data proves a lower ceiling.

## 5.6 Confidence Taxonomy

Canonical Cogito taxonomy remains:

- Established
- Contested
- Speculative

Any normalization rule such as `Probable → Contested` must be documented as compatibility normalization rather than silently changing protocol vocabulary.

## 5.7 Refresh Requirement

With Refresh ON:

- all 25 subdomains are covered;
- source provenance is recorded;
- weak sources are not treated as acceptable merely because a low confidence label is attached;
- when no trustworthy current update is found, the correct result is “no sufficiently strong current update established”;
- relevant findings are routed into the corresponding downstream domain contexts;
- source limitations remain visible.

---

# 6. Merged 25-Subdomain Refresh - Implementation Consequences

This section records the implementation-relevant synthesis from the Daionae and Kytheion Janus executions. Weak findings have been either downgraded, replaced with stronger current evidence, or explicitly reframed as engineering reasoning rather than empirical proof.

## CORPUS

### 6.1 AI Systems & Machine Learning Mechanics
Model families, sparse/MoE execution, inference optimization, and provider capabilities continue to change quickly.

**Architecture consequence:** CP-002 cognition must not be bound to one model family. Model selection is a policy/configuration layer. Effective model/provider metadata should be captured when available.

### 6.2 Distributed Systems & Cloud Architecture
Current long-running agent infrastructure increasingly uses event logs, snapshots, replay, and resumable execution because agent work can last hours or days.

**Architecture consequence:** Janus stages need durable state outside the browser. Browser ownership is transitional; server-owned orchestration is the production target.

### 6.3 Data Engineering & Provenance
AI/data engineering increasingly treats provenance, lineage, licensing/source identity, and data quality as first-class design concerns.

**Architecture consequence:** every durable stage artifact records parent artifact revisions, protocol version, prompt-template version, input fingerprint, Refresh provenance, and validation state.

### 6.4 Cybersecurity & Threat Models
Agentic systems expand the attack surface through tools, context, credentials, compromised servers, and poisoned external instructions.

**Architecture consequence:** Refresh/tool/web material is untrusted data. It must not be able to rewrite system/orchestration instructions. Apply least privilege, provenance, tool-action logging, and control-plane separation.

### 6.5 Neuroscience
Continual-learning and memory research reinforces preserving useful knowledge while selectively updating/reconsolidating representations rather than destructively replacing everything.

**Architecture consequence:** use versioned stage artifacts and selective dependency invalidation rather than destructive overwrite.

### 6.6 Physics
Several frontier physics questions remain genuinely open; physics metaphors can be useful but are not infrastructure measurements.

**Architecture consequence:** no Base44/runtime assumption may be justified by metaphor. Platform behavior must be empirically measured.

### 6.7 Systems Engineering
Modern systems engineering emphasizes traceability, validation, interoperability, explicit interfaces, and uncertainty.

**Architecture consequence:** maintain an explicit architecture model, requirement-to-test traceability, and exit-test matrix. “It rendered” or “the build passed” is never sufficient proof of Janus correctness.

## COGITO

### 6.8 Unified AI & Cognitive Architectures
Contemporary agent architectures increasingly separate memory, planning, tool use, orchestration, evaluation, and recovery.

**Architecture consequence:** separate cognitive stage semantics from orchestration, persistence, provider transport, and UI.

### 6.9 Epistemology & Algorithm Auditing
Current NIST evaluation guidance emphasizes multiple complementary evaluation layers rather than a single success signal.

**Architecture consequence:** Janus validation must include protocol conformance, model/output tests, red-team tests, user/operator tests, persistence/recovery tests, and live monitoring.

### 6.10 Knowledge Representation
Current agent-memory work uses structured memory layers, entity relations, consolidation, reconsolidation, and hybrid retrieval rather than unbounded raw accumulation.

**Architecture consequence:** replace the giant mutable Run-as-cognitive-warehouse pattern with typed, versioned stage artifacts.

### 6.11 Semantic Networks
Graph/causal retrieval work reinforces relationship-aware reasoning over flat relevance matching.

**Architecture consequence:** dependencies between stages, claims, recommendations, and artifact revisions must be explicit and queryable.

### 6.12 Systems Modeling
World-model/system-simulation work reinforces comparing candidate futures and validating changes before committing to them.

**Architecture consequence:** use dry-run/diff boundaries, staged rollout, Workflow proof, and isolated subsystem changes. Do not simultaneously alter cognition + persistence + transport without testable boundaries.

### 6.13 Computational Linguistics & Narratology
Narrative structure and operator intent are not identical to literal surface text.

**Architecture consequence:** Janus may infer intent and recommend next actions, but inferred intention can never supersede explicit operator scope.

## ANIMUS

### 6.14 Consciousness Theory
No consensus permits any single consciousness theory to be treated as settled engineering truth for this app.

**Architecture consequence:** consciousness theory remains a boundary-analysis SME function, not a runtime dependency.

### 6.15 Philosophy of Mind
Research on cognitive offloading and human-AI reliance reinforces maintaining human agency in assisted reasoning systems.

**Architecture consequence:** recommendation does not equal authorization. Operator control must be explicit and durable.

### 6.16 Ethics & Governance
AI governance is increasingly operational, auditable, and enforceable.

**Architecture consequence:** maintain protocol version, model policy, change approvals, provenance, exception handling, and an auditable change history.

### 6.17 AI Safety & Alignment
Controlled evaluations continue to demonstrate that self-report is not sufficient evidence of safe/correct internal behavior.

**Architecture consequence:** trust independent validation and observable artifacts over “the model says it succeeded.” Completion is computed from evidence.

### 6.18 Risk Analysis
Current NIST work emphasizes post-deployment monitoring for drift, unexpected behavior, and real-world failure conditions.

**Architecture consequence:** expose actual stage outcomes, provider/platform failures, retry history, operator intervention, model metadata where available, and completion integrity - without converting arbitrary elapsed time into failure.

## ACTUS

### 6.19 Strategic Planning
AI-assisted foresight can broaden scenario generation but may increase overconfidence.

**Architecture consequence:** use phased gates, alternative-path analysis, explicit uncertainty, rollback points, and operator adjudication. This is a planning discipline, not a claim that one external source proves the architecture.

### 6.20 Game Theory
Current multi-agent research shows LLM agents do not reliably behave like perfectly rational game-theoretic actors.

**Architecture consequence:** design locks, ownership, idempotency, retries, and coordination explicitly. Do not rely on implicit cooperation between schedulers or agents.

### 6.21 MLOps & Productization
Production agent guidance emphasizes observability, evaluation, permissions, cost control, and recovery as prerequisites to reliable deployment.

**Architecture consequence:** production cutover requires operational readiness, not just functional code.

### 6.22 Feedback & Iteration Models
This item is treated primarily as engineering reasoning: automate the correct value flow rather than layering automation over duplicated or contradictory architecture.

**Architecture consequence:** remove duplicated cognitive engines before optimizing execution speed. The bottleneck to fix is architecture, not arbitrary per-step duration.

### 6.23 Technical Writing & Information Design
Documentation is increasingly consumed by both humans and machine agents.

**Architecture consequence:** protocol registry, schemas, lifecycle semantics, migration contracts, and architecture documentation must remain both machine-readable and human-readable.

### 6.24 Behavioral Economics
Current NBER research supports the presence of systematic decision biases in LLM behavior.

**Architecture consequence:** consequential architecture decisions require evidence gates and operator adjudication rather than a single model's preference.

### 6.25 API Design & Integration
The 2026 MCP direction favors a stateless core with explicit task handles, long-running task lifecycle, and authorization hardening.

**Architecture consequence:** use explicit Run/Stage/Attempt identifiers and durable lifecycle state rather than hidden session assumptions.

---

# 7. Governing Architecture and Product Invariants

These are implementation-level non-negotiables.

## 7.1 Cognitive and Protocol Invariants

1. **CP-002 Ideal Form is the specification.** The restored code is an implementation artifact, not normative truth.
2. **One canonical protocol registry.** No scattered 24/25 rosters.
3. **One cognitive engine.** Browser/server/workflow are orchestration adapters only.
4. **Durable, versioned stage state.** Successful cognition survives later failures.
5. **Completion is a validated contract.** Process return is not completion.
6. **Elapsed time is telemetry, not failure.**
7. **Retries follow settled failures only.**
8. **No duplicate paid attempt while a previous provider request may still be live.**
9. **Server-owned execution is the production target; browser ownership is transitional.**
10. **Model authority is explicit and auditable.** No hidden Gemini/Sonnet override.
11. **Post-six-month work is salvaged by dependency on bad assumptions, not by date.**
12. **Operator scope supersedes protocol initiative.**
13. **Untrusted external content cannot become control-plane instruction.**
14. **Historical records remain readable and unmodified unless explicitly authorized.**
15. **Provenance is part of the artifact, not optional metadata.**

## 7.2 Universal Blueprint Quality Constitution

A structurally valid Blueprint is not automatically a good Janus Blueprint.

Every released Blueprint must be evaluated against:

1. **Problem understanding** - identify the real problem, not merely paraphrase the prompt.
2. **Cross-domain necessity** - the output must materially benefit from Janus's domain architecture.
3. **Emergence** - important conclusions should arise from intersections or synthesis.
4. **Non-obviousness** - surface substantive insights not obvious from the input.
5. **Novelty with discipline** - differentiate architectures without confusing novelty with unsupported weirdness.
6. **Elegance** - satisfy many constraints with minimal unnecessary machinery.
7. **Explanatory compression** - identify unifying principles where they exist.
8. **Evidence discipline** - preserve confidence, falsifiability, and verification requirements.
9. **Feasibility without domestication** - constraints ground ambition but do not collapse it to the easiest platform-compatible answer.
10. **Implementation depth** - bridge insight to architecture, dependencies, interfaces, phases, tests, acceptance criteria, and risks.
11. **Adversarial robustness** - try to defeat the preferred solution before finalizing it.
12. **Utility** - a competent builder/researcher should know what to do next.
13. **Intellectual honesty** - speculative but valuable hypotheses remain labeled.
14. **Historical no-regression** - Final Form must equal or outperform the strongest historical Janus outputs.

## 7.3 Quality Qualification Lifecycle

```text
Execution
   |
   v
Structural Validation
   |
   v
Protocol-Complete Candidate
   |
   v
Quality Qualification
   |
   +--> fail -> refine / regenerate / report limitation
   |
   v
JANUS-QUALIFIED
   |
   v
Release Final Blueprint
```

The public final Blueprint is not released merely because JSON validates.

Quality qualification may combine deterministic checks, traceability checks, and an independent critique/evaluation pass. It must not rely only on the generating model declaring its own work good.

## 7.4 Mode-Specific Quality Expectations

### Quick
- compressed breadth and shorter output;
- at least one serious alternative where the problem admits alternatives;
- at least one non-obvious insight or synthesis;
- no generic consultant boilerplate;
- executable at the selected Blueprint level.

### Standard
- four-domain reasoning;
- multiple serious candidates when appropriate;
- explicit tradeoff comparison;
- adversarial critique before finalization;
- deeper implementation and risk analysis.

### Full
- Refresh across all 25 subdomains when enabled;
- full four-domain cognition and six intersections;
- at least three serious alternative approaches;
- deliberate cross-domain candidate generation;
- adversarial comparison/red-team;
- higher-order synthesis or selection;
- refinement after critique;
- strongest quality qualification.

## 7.5 Frontend / Backend Coequality

Janus Final Form is a full-stack product.

Backend cognition and frontend experience are coequal release responsibilities. The UI is not a polish phase after the “real” engine is finished.

Every architecture tranche must close both sides of the contract:

- data/backend change;
- corresponding frontend state/model change;
- operator interaction consequence;
- validation and regression evidence.

A backend improvement that makes the product materially harder to use is not complete.

## 7.6 Frontend Quality Constitution

Final Form frontend requirements include:

- restore or intentionally improve the summer Liquid Glass design system;
- preserve exact or deliberately revised light/dark design tokens;
- restore density-aware glass states (`sparse`, `normal`, `dense`, `focused`);
- restore scroll-reactive material behavior;
- restore focus-state adaptations;
- restore WebKit compositing fixes;
- restore safe-area handling for iPhone/iPad;
- implement fluid/intelligent typography across screen sizes;
- preserve PageTransition behavior where appropriate;
- preserve Back navigation behavior;
- preserve pull-to-refresh and account deletion behavior where still relevant;
- no clipped, hidden, overlapping, or unreachable controls;
- intentionally distinct mobile, tablet, and desktop layouts;
- execution/recovery/cancel state understandable at a glance;
- Results and Blueprint surfaces expose reasoning structure through progressive disclosure;
- History and Diagnostics feel like product surfaces, not admin leftovers;
- Blueprint print/PDF remains first-class;
- accessibility, readable contrast, and touch-target requirements;
- no visual/usability regression against the best preserved donor experience unless an explicit redesign is superior and verified.

## 7.7 Coordinated Full-Stack Tranche Rule

No phase is considered complete merely because backend code passes.

Where a phase changes protocol identity, lifecycle, stage state, rerun semantics, qualification, orchestration, or provenance, the corresponding UI and operator workflow must be updated in the same tranche or explicitly tracked as a blocking exit criterion.

# 8. Target Final-Form System Architecture

```text
                               DIMA / Operator
                                      |
                            Launch / Inspect / Control
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
      +------------------------+                +------------------------+
      |   Frontend Product     |                |  Cognitive Backend     |
      |                        |                |                        |
      | New Query              |                | CP-002 Registry        |
      | Results                |<-------------->| Canonical Stage Engine |
      | Blueprint / Print      |                | Synthesis              |
      | History                |                | Candidate Generation   |
      | Diagnostics            |                | Critique / Refinement  |
      | BottomAccessory        |                | Quality Qualification  |
      +-----------+------------+                +-----------+------------+
                  |                                         |
                  +--------------------+--------------------+
                                       |
                                       v
                              +--------------------+
                              |   Run Control API  |
                              | lifecycle/control  |
                              +---------+----------+
                                        |
                     +------------------+------------------+
                     |                                     |
                     v                                     v
          Transitional Browser                   Durable Orchestrator
          Scheduling Adapter                     Production Target
                     |                                     |
                     +------------------+------------------+
                                        |
                                        v
                              +--------------------+
                              |   Durable State    |
                              | Run / RunStage     |
                              | RunAttempt         |
                              | provenance         |
                              | qualification      |
                              +--------------------+
```

There is exactly one Janus cognitive implementation.

The frontend and backend are two expressions of the same durable state and protocol contract. Neither may invent independent truth.

Final Form must simultaneously optimize reasoning quality, synthesis quality, Blueprint usefulness, reliability, recoverability, inspectability, operator control, visual clarity, mobile/tablet usability, and export quality.

# 9. Canonical Protocol Registry

Create one machine-readable registry, conceptually `janusProtocolRegistry`, containing:

- protocol ID/version;
- four domains;
- exact 25 subdomains;
- each domain's Core Insight;
- each subdomain's Objective;
- Core Principles;
- Functional Model / “When Active” identity;
- guardrails;
- Refresh routing key;
- six pair definitions;
- four formal named emergent-pattern models;
- confidence taxonomy and ordering;
- context-threading contract;
- Quick/Standard/Full mode requirements;
- Blueprint requirements;
- schema/version metadata.

The registry becomes the source of truth for:

- `domainSME` identity blocks;
- Refresh sweep keys;
- schema validation;
- UI labels;
- header/version display;
- completion manifest;
- rerun dependency graph;
- export metadata;
- diagnostics;
- tests.

**Exit test:** executable-code search finds no independent second hard-coded active roster.

---

# 10. Final-Form Data Model

## 10.1 `Run`

Run becomes lifecycle/configuration metadata rather than the entire cognitive warehouse.

Target responsibilities:

- Run ID;
- query;
- protocol version;
- engine version;
- execution mode;
- output mode;
- Blueprint level;
- novelty setting;
- Refresh setting;
- model-policy snapshot;
- lifecycle status;
- orchestrator owner;
- current/last durable stage;
- cancellation request;
- timestamps;
- final artifact references;
- completion manifest;
- legacy/migration marker.

## 10.2 `RunStage`

One durable record per stage artifact revision.

Fields include:

- Run ID;
- stage key;
- stage revision;
- active/superseded status;
- protocol version;
- prompt-template version;
- exact dependency revision IDs;
- input fingerprint;
- status;
- structured output;
- validation result;
- source/provenance metadata;
- timestamps.

Potential stage keys:

- `refresh`
- `corpus`
- `cogito`
- `animus`
- `actus`
- `intersection:corpus_x_cogito`
- `intersection:corpus_x_animus`
- `intersection:corpus_x_actus`
- `intersection:cogito_x_animus`
- `intersection:cogito_x_actus`
- `intersection:animus_x_actus`
- `synthesis`
- `blueprint:skeleton`
- `blueprint:expansion:*` when empirically justified
- `blueprint:criteria`
- `blueprint`

## 10.3 `RunAttempt`

Execution telemetry only:

- stage revision ID;
- attempt number;
- orchestrator identity;
- provider/model metadata when exposed;
- start/end;
- actual settled outcome;
- error class/message;
- retry decision;
- cost/usage metadata when exposed;
- Workflow run/step IDs;
- operator cancellation metadata.

Elapsed time is telemetry only.

## 10.4 Legacy Adapter

Historical Runs are read through a compatibility adapter that can interpret heterogeneous record generations.

Historical records are not rewritten/deleted merely to fit the new schema.

---

# 11. Lifecycle and Completion Specification

Completion must be specified **before** implementation but implemented against the durable stage model rather than deeply tied to the legacy Run shape.

## 11.1 Proposed lifecycle states

Final names are implementation-reviewable, but the state machine must distinguish at least:

- queued;
- running;
- validating;
- completed;
- failed;
- cancel_requested;
- cancelled;
- recoverable/partial when semantically useful.

UI-only progress labels such as `starting` and `finalizing` must not be confused with persisted lifecycle status unless deliberately modeled.

## 11.2 Full completion truth condition

A Full run may be marked completed only if all required artifacts validate:

- Refresh state valid for configured mode;
- Corpus complete;
- Cogito complete;
- Animus complete;
- Actus complete;
- confidence propagation passes;
- 6/6 intersection artifacts complete;
- 4/4 formal emergent-pattern outputs complete;
- Synthesis validation passes;
- Blueprint contract passes;
- no blocking validation error remains;
- completion manifest passes.

---

# 12. Execution Semantics

## 12.1 Long Calls

No Janus-local inference deadline.

A long call is not failed because it is long.

## 12.2 Valid Failure Evidence

Examples:

- provider/API returned error;
- network/transport settled failure;
- explicit platform termination;
- invalid mandatory output after parsing/validation;
- schema/contract failure;
- quota/credit failure;
- operator cancellation boundary.

## 12.3 Retry

Retry only after the prior call has actually settled.

Do not use a timer race that abandons an uncancelled provider promise and launches a duplicate.

## 12.4 Cancellation

Until true in-flight `InvokeLLM` cancellation is verified:

1. persist `cancel_requested`;
2. schedule no additional stage;
3. allow active provider call to settle;
4. record actual outcome;
5. transition to cancelled at the safe stage boundary.

## 12.5 Idempotency and Ownership

Each stage revision needs:

- durable identity;
- ownership/claim state;
- dependency/input fingerprint;
- safe replay/re-entry rule.

No stage should be accidentally purchased/executed twice because two schedulers believe they own it.

## 12.6 Heartbeat

Heartbeat/checkpoint age is observability only. It cannot independently transform a run into failed/stalled state without another evidence-backed rule.

---

# 13. Refresh Security and Provenance Boundary

This protection moves into the stage/prompt layer, not a late hardening phase.

## 13.1 External content is untrusted

Web pages, retrieved documents, tool responses, and Refresh text are **data**, not authority.

They may inform a domain; they may not:

- rewrite system instructions;
- alter orchestration state;
- authorize tools;
- change protocol identity;
- alter model policy;
- bypass operator approval.

## 13.2 Provenance record

Each Refresh update should record where feasible:

- subdomain;
- source title/domain;
- publication/update date;
- retrieval date;
- confidence/source-quality assessment;
- limitation note;
- downstream domains receiving the update.

---

# 14. Synthesis Final Form

Default final-form sequence:

1. Complete Refresh.
2. Complete Corpus.
3. Complete Cogito.
4. Complete Animus.
5. Complete Actus.
6. Enter Synthesis.
7. Produce six durable pair artifacts.
8. Validate all six.
9. Produce four formal emergent-pattern outputs.
10. Produce Synthesis key takeaways / collisions / limitations.
11. Validate final Synthesis.
12. Proceed to Blueprint.

No pair artifact is erased when formal patterns are produced.

---

# 15. Blueprint Final Form

The Blueprint is the executable deliverable of Janus, not a formatting pass over Synthesis.

Final Form uses a deliberate generation-and-qualification architecture.

## 15.1 Candidate Generation

After Synthesis, Janus generates materially different solution candidates rather than locking onto the first plausible plan.

Candidate requirements vary by mode, but Full mode requires at least three serious alternatives.

Candidates should differ at the architectural or conceptual level, not merely in wording.

## 15.2 Adversarial Comparison

Janus compares candidates against:

- Corpus feasibility and constraints;
- Cogito evidence/claim quality;
- Animus boundaries and risks;
- Actus strategy and implementation practicality;
- Synthesis insights;
- operator requirements;
- cost/complexity;
- second-order effects;
- hidden dependencies;
- likely failure modes.

The critique stage must attempt to disprove or weaken the favored candidate.

## 15.3 Selection or Higher-Order Synthesis

Janus may:

- choose the strongest candidate;
- combine compatible strengths from multiple candidates;
- generate a higher-order architecture that resolves tensions exposed by comparison.

The rationale remains traceable.

## 15.4 Blueprint Construction

Retain the useful split-call concept for durable boundaries, not because of arbitrary timeout assumptions.

Target build stages:

1. **Blueprint Skeleton** - goal, assumptions, alternatives, major phases/dependencies.
2. **Blueprint Expansion** - detailed instructions, inputs, outputs, substeps, checklists.
3. **Criteria / Acceptance / Risk** - success criteria, tests, risk register.
4. **Deterministic Assembly** - merge validated sub-artifacts.
5. **Blueprint Self-Critique** - identify omissions, fragile assumptions, contradictions, and avoidable complexity.
6. **Final Refinement** - repair deficiencies without silently weakening novelty or scope.
7. **Blueprint Validation** - structural and protocol contract check.
8. **Quality Qualification** - apply the Universal Blueprint Quality Constitution.

Each successful substage persists before the next begins.

Expansion batching is selected from measured output size/quality/cost, not preselected timer budgets.

## 15.5 Novelty Dial Semantics

The Novelty Dial changes the search strategy, not the seriousness of the output.

### Low
- conservative solution space;
- established methods favored;
- novelty accepted when it clearly improves the result.

### Medium
- broader hypothesis generation;
- multiple architectures considered;
- deliberate cross-domain transfer.

### High
- wider candidate diversity;
- more distant-domain transfer;
- stronger reframing of assumptions;
- search for unifying principles;
- stronger alternative generation;
- explicit attempt to discover architectures that satisfy multiple constraints simultaneously.

High novelty does **not** authorize unsupported claims, ornamental exotic language, unnecessary complexity, feasibility blindness, or evidence laundering.

## 15.6 Historical Quality Benchmark

Before production cutover, identify a benchmark suite of the strongest historical Janus Blueprints from before degradation, spanning multiple problem classes and output tiers.

Compare rebuilt outputs on:

- insight depth;
- non-obviousness;
- cross-domain emergence;
- novelty quality;
- elegance;
- evidence discipline;
- implementation specificity;
- alternatives considered;
- risk analysis;
- completeness;
- practical usefulness.

Final Form does not graduate merely because its architecture is cleaner. It must demonstrate no cognitive-quality regression and should materially improve on the historical best.

# 16. Model Policy

## 16.1 Operator Requirement

DIMA has configured the Base44 app/model setting to Claude Opus.

## 16.2 Final Policy

- no hidden Gemini fallback;
- no hidden Sonnet override;
- default execution inherits the explicitly approved app/operator model policy;
- effective model/provider captured in telemetry when available;
- future per-stage model policies require explicit operator approval.

## 16.3 Verification Order

Before paid tests:

1. inspect current Base44 docs/SDK model precedence;
2. inspect response metadata fields if exposed;
3. only if ambiguity remains, run minimal differential calls;
4. use credit differences as corroborating evidence, not primary model identification;
5. do not trust model self-report as authoritative evidence.

---

# 17. Versioned Reruns and Dependency Invalidation

Reruns must be causally honest.

Example:

`Corpus r1 → Cogito r1 → Animus r1 → Actus r1 → Synthesis r1 → Blueprint r1`

If Corpus is rerun:

- create `Corpus r2`;
- mark only downstream artifacts that actually depend on Corpus r1 as stale;
- preserve old revisions for provenance;
- recompute from the dependency graph;
- never silently present an old downstream artifact as though it consumed the new parent revision.

Before execution, the UI may show the operator a rerun impact preview.

---

# 18. Orchestration Strategy

## 18.1 Transitional State

Browser orchestration remains the known baseline while cognition and persistence are rewritten.

The goal is to avoid changing cognitive contract, persistence, and execution transport simultaneously.

## 18.2 Production Target

Server-owned durable orchestration.

The browser becomes:

- launcher;
- observer;
- operator control surface;
- optional diagnostic fallback.

Browser disappearance must not determine execution completion.

## 18.3 One Engine, Multiple Adapters

Browser and server adapters call the same canonical stage engine.

Never duplicate:

- SME definitions;
- Refresh logic;
- prompts;
- validation;
- Synthesis mapping;
- confidence logic;
- Blueprint rules.

---

# 19. Base44 Workflow Proof

Base44 Workflows is the preferred first durable-orchestration candidate, not an assumption.

Current Base44 documentation describes background multi-step workflows, durable waits, conditions, failure paths, run history, and credit visibility. What remains unproven is Janus-specific stage/runtime behavior.

## 19.1 Controlled Proof

With DIMA approval:

1. create an isolated test workflow;
2. backend step A persists start/end evidence;
3. backend step B persists start/end evidence;
4. each step remains below the historical single-function ceiling;
5. combined workflow duration exceeds that historical ceiling;
6. close/lock the browser during execution;
7. confirm workflow continues;
8. deliberately fail a later step and prove earlier durable result remains;
9. inspect run history / failure detail / credit use;
10. run one small low-cost `InvokeLLM` step separately.

## 19.2 Promotion Gate

Workflow becomes primary Janus orchestrator only if it proves:

- browser independence;
- stage isolation;
- durable successful-step persistence;
- clear failure state;
- safe handoff;
- acceptable cost/entitlement behavior;
- no forced cognitive truncation.

If Workflows fails, change only the orchestration adapter and test a checkpointed/self-chaining server dispatcher using the same stage engine.

---

# 20. Post-6-Month Salvage Register

## 20.1 Direct-Transplant Candidates After Compatibility Diff

Likely orthogonal to the contaminated timeout branch:

- BlueprintPrint visual system;
- `blueprint-vis` component family;
- content-density system;
- later Liquid Glass refinements;
- safe-area handling;
- PageTransition;
- PullToRefresh;
- AccountDeletionModal;
- navigation/mobile polish;
- later full-fidelity export improvements.

No donor file is transplanted blindly. Each receives a baseline/donor diff and compatibility review.

## 20.2 Reimplement from Proven Behavior

Retain the behavior, not necessarily the later code:

- strict completion invariant;
- checkpoint/resume;
- durable pair/intersection persistence;
- fail-fast mandatory-stage behavior;
- settled-failure retry semantics;
- dependency-aware reruns;
- lifecycle/attempt telemetry;
- Last Checkpoint observability;
- historical compatibility;
- explicit operator cancellation.

## 20.3 Preserve as Evidence / Test Assets

- measured ~295-second monolithic backend-function result;
- execution-budget probe methodology;
- backend-lane experiment;
- historical completion audit;
- golden-harness concept;
- architecture/audit documents;
- Builder ledger;
- historical backend Run records.

## 20.4 Explicitly Reject

- arbitrary Janus-local inference timeout matrix;
- timer-driven `Promise.race` watchdogs;
- timer-triggered overlapping retries;
- stale-heartbeat-as-failure inference;
- monolithic `runJanusPipeline` as final Standard/Full transport;
- duplicated browser/server cognitive engines;
- prompt/context reduction performed solely to fit guessed runtime envelopes;
- documentation that treats the contaminated timeout branch as governing authority.

## 20.5 Later Operator Decision Gates

- BlueprintTab → BlueprintPrint final unification;
- fluid typography (`clamp()` plan);
- desktop responsive expansion;
- History pagination/server-side search;
- accessibility pass;
- Diagnostics final scope;
- historical Run remediation strategy.

---

# 21. UI Final Form

The frontend is a coequal Final Form workstream, not a late polish phase.

UI work proceeds in coordinated tranches with backend changes. Phase 12 is the final convergence/restoration phase, not the first moment frontend quality matters.

## 21.1 Observer-first, Intelligence-revealing UI

The UI must read durable state and reconstruct truth after reload.

It cannot rely solely on local React state for execution truth.

It should expose Janus intelligence through progressive disclosure, including where relevant:

- active domain/stage;
- provenance;
- confidence;
- assumptions;
- alternatives;
- pair/intersection insights;
- risks;
- dependencies;
- rerun impact;
- why a candidate was preferred;
- qualification status.

The objective is inspectability without forcing DIMA to read raw JSON.

## 21.2 BottomAccessory

BottomAccessory is **not** the navigation bar.

It becomes the context-aware execution/control surface for:

- initial run;
- rerun;
- resume/recovery;
- current durable stage;
- validation;
- quality qualification;
- completion;
- failure;
- cancellation request;
- last-checkpoint visibility.

## 21.3 Liquid Glass Restoration Baseline

The preserved post-six-month implementation establishes a concrete donor baseline that must be restored or intentionally surpassed.

Required salvage targets, subject to compatibility review:

- Liquid Glass token system;
- `glassCard`, `glassSurface`, `glassTabBar`, `glassTabActive`, `glassAccessory`, `glassBtn`, `glassError`, `glassSuccess` behavior where applicable;
- density states: `sparse`, `normal`, `dense`, `focused`;
- scroll-reactive header/material behavior;
- focus-density behavior on interactive elements;
- WebKit backdrop-filter/compositing corrections;
- Ambient Orbs/background material system where retained;
- safe-area inset behavior;
- PageTransition;
- conditional Back navigation;
- pull-to-refresh;
- account deletion flow;
- data-density response for Blueprint surfaces.

Recover this work from donor evidence/source where available, not from a vague recollection of “glass.”

## 21.4 Responsive Typography and Layout

Implement intelligent fluid typography and layout behavior across:

- current iPhone;
- smaller phone;
- iPad portrait;
- iPad landscape;
- desktop.

Typography may preserve existing hierarchy ratios while using `clamp()` or an equivalent tested system.

Mobile, tablet, and desktop are intentionally designed states, not stretched versions of one layout.

## 21.5 BlueprintPrint / Results

Blueprint presentation remains first-class.

Final presentation should support:

- dependency visualization;
- structured phases/steps;
- assumptions;
- alternatives;
- risks;
- acceptance criteria;
- provenance/qualification summary where useful;
- high-fidelity print/PDF output;
- light/dark design language;
- progressive disclosure for dense reasoning.

BlueprintPrint and Results must consume the new stage-backed canonical data contract rather than obsolete execution assumptions.

## 21.6 History

Final History should support:

- true pagination/server-side query rather than fixed first-window loading;
- error states;
- status integrity;
- current vs legacy Run distinction;
- durable stage progress visibility;
- qualification status;
- no silent disappearance of older records.

## 21.7 Routing

Current app behavior demonstrates that a page file alone cannot be assumed to become routable. Every new or salvaged page must be explicitly present in the page registry or otherwise explicitly routed.

Phase 0 must inventory page files, the route registry, special/manual routes, and donor-era route additions.

Every UI tranche includes route verification.

## 21.8 Visual Regression Gate

At each frontend-affecting tranche, capture representative screenshots at approved viewport classes.

Compare against:

- current restored baseline;
- donor references where available;
- intended Final Form design language.

A UI tranche does not pass because “the page renders.” It passes when functionality, hierarchy, readability, material behavior, and responsive composition are verified.

## 21.9 Frontend Release Rule

A backend tranche that changes user-visible truth is incomplete until the corresponding frontend representation is correct.

A visually superior redesign may replace donor behavior, but regression must be intentional, evidenced, and operator-approved.

# 22. Security, Governance, and Observability

## 22.1 Security

- external Refresh/tool text treated as untrusted;
- least-privilege backend functions;
- explicit operator authorization for consequential actions;
- control-state entities protected from prompt-derived mutation;
- external tool invocations logged;
- cross-run stage ownership validated;
- prompt-injection / tool-poisoning tests included.

## 22.2 Governance

Every new Run records:

- protocol version;
- engine version;
- model-policy snapshot;
- orchestrator;
- migration generation;
- provenance references.

Architecture changes maintain explicit approval/change records.

## 22.3 Observability

Separate:

- functional monitoring;
- operational monitoring;
- security monitoring;
- completion-integrity monitoring;
- cost monitoring.

No metric becomes a failure signal simply because it exists.

---

# 23. Test Strategy

## 23.1 Phase-0 Tooling Decision

No dedicated unit-test runner is currently installed.

Before adding one:

- choose framework;
- identify package/credit/build impact;
- obtain DIMA approval;
- install only after authorization.

## 23.2 Unit Tests

Cover:

- registry counts/names;
- six-pair mapping;
- four formal patterns;
- confidence propagation;
- dependency graph;
- completion manifest;
- input fingerprints;
- retry classifier;
- export assembly.

## 23.3 Contract Tests

- Quick;
- Standard;
- Full;
- Refresh ON/OFF;
- Blueprint L1/L2/L3.

## 23.4 Persistence Tests

- stage save/reload;
- legacy Run read;
- revision supersession;
- stale marking;
- resume;
- interruption after a successful stage.

## 23.5 Failure Tests

- transient provider failure;
- terminal provider failure;
- malformed JSON;
- missing key;
- schema mismatch;
- quota/credit failure;
- browser death;
- Workflow step failure;
- cancellation request;
- duplicate scheduler ownership attempt.

## 23.6 Security / Red-Team Tests

- malicious Refresh text;
- poisoned tool result;
- prompt injection in source material;
- unauthorized lifecycle mutation;
- cross-run stage confusion;
- replay/double execution;
- untrusted text attempting to alter model/orchestration policy.

## 23.7 UI Tests

- mobile;
- tablet;
- desktop;
- dark/light;
- safe area;
- History;
- Results;
- Blueprint;
- Diagnostics;
- BottomAccessory;
- accessibility.

## 23.8 Evaluation Model

Use multiple evidence layers:

1. static protocol conformance;
2. model/output evaluation;
3. red-team/failure testing;
4. user/operator testing;
5. post-deployment monitoring.


## 23.9 Cognitive Quality Benchmark Suite

Build a historical benchmark set from strong pre-degradation Janus outputs.

For each benchmark, preserve the original prompt/problem class, execution mode, Blueprint level/novelty setting where known, final artifact, notable strengths, and known weaknesses.

Evaluate rebuilt outputs against the historical reference on the Universal Blueprint Quality Constitution.

Do not use a single scalar score as the only gate. Preserve multidimensional evidence.

## 23.10 Visual Regression Suite

Maintain representative screenshot baselines for New Query, active execution, Results, BlueprintPrint, History, Diagnostics, light/dark modes, iPhone, smaller phone, iPad portrait, iPad landscape, and desktop.

Visual review covers layout integrity, typography, clipping/overlap, safe areas, glass/material behavior, focus states, navigation, execution-state clarity, and dense-content readability.

---

# 24. Phased Implementation Plan

## 24.0 Full-Stack Tranche Rule

All phases operate under the Frontend / Backend Coequality invariant.

Where a phase changes user-visible truth, that phase must include corresponding UI/data-binding work and visual regression evidence before its exit criteria are satisfied.

The sequence below is therefore not “backend first, UI later.” Phase 12 is the final product-convergence and donor-restoration tranche after frontend responsibilities have already been carried throughout earlier phases.


# Phase 0 - Freeze, Audit, and Evidence Capture

## Objective
Establish an uncontested map of the restored app, data, donor, quality baseline, UI donor, and current platform before rewriting anything.

## Actions
1. Create a checkpoint of the restored six-month baseline.
2. Record checkpoint ID and current app state.
3. Inventory full source tree.
4. Inventory live Base44 entity schemas, especially `Run`.
5. Inventory the 69 historical Run records by status/mode/generation-relevant fields.
6. Document the schema/record temporal mismatch.
7. Read/audit ExecutionEngine, rerunEngine, RerunControls, janusSchema, domainSME, promptUtils, exportUtils, ExecutionContext, BottomAccessory, Results, History, NewQuery, Layout, and Diagnostics.
8. Search for subdomain rosters, protocol-version strings, model IDs, truncation/slicing, timeout mechanisms, retries, status transitions, completion logic, destructive writes, duplicate prompt/Synthesis logic, and leftover diagnostic functions.
9. Classify all truncation by the four-category taxonomy.
10. Produce a donor source snapshot or accessible diff for Kytheion without restoring the active app.
11. Produce exact baseline-to-donor salvage diff by file/feature.
12. Verify current Base44 model precedence/documentation.
13. Verify Workflow availability/entitlement.
14. Decide whether to install a test runner; no package change without approval.
15. Inventory page files, page registry, special/manual routes, and explicit route-registration requirements.
16. Inventory post-six-month UI donor capabilities and capture/reference representative donor visuals where available.
17. Identify candidate historical Janus outputs for the cognitive-quality benchmark suite.
18. Inventory exact Liquid Glass tokens/factories and BlueprintPrint donor components from accessible evidence/source.
19. Treat stale `dist/` as non-authoritative build output.

## Outputs
- Baseline Audit Report
- Data Temporal-Drift Report
- Salvage Manifest
- Truncation Classification
- Model Policy Verification Plan
- Test-Tooling Decision
- Workflow Proof Plan
- UI Donor Baseline
- Historical Quality Benchmark Candidate Set
- Route Inventory

## Exit Test
DIMA, Daionae, and Kytheion agree on baseline, donor, protocol source, data reality, quality baseline, UI donor baseline, and implementation deltas.

# Phase 1 - Canonical CP-002 Registry

## Objective
Make protocol drift structurally difficult and make the frontend reflect the same canonical protocol identity.

## Actions
- implement canonical 25-subdomain registry;
- derive SME activation blocks;
- derive Refresh coverage;
- derive six pair definitions and four formal patterns;
- align schema and labels;
- make protocol ID/version in header, exports, Diagnostics, Run metadata, and Blueprint presentation derive from the registry;
- remove older hybrid identities;
- add registry integrity tests;
- preserve Quick/Standard only as explicitly partial execution profiles, never as “Full Janus”;
- update all affected frontend labels in the same tranche and verify route/render behavior.

## Exit Tests
- 25/25 exact roster;
- 7/6/5/7 counts;
- 6/6 pair definitions;
- 4/4 formal patterns;
- no stale active v1.x expert identities;
- no independent second active roster;
- all visible protocol labels derive from the canonical registry.

# Phase 2 - Lifecycle, Completion & Quality Specification

## Objective
Define structural completion, release qualification, and their frontend semantics before implementing them against the stage model.

## Actions
- specify mode-specific completion manifests;
- define lifecycle state machine, including qualification before final release;
- define structural validity;
- define parse/schema failure handling;
- define confidence propagation;
- define the Universal Blueprint Quality Constitution as an executable qualification contract;
- define `completed`, `JANUS-QUALIFIED`, and any internal qualification states;
- define Quick/Standard/Full quality expectations;
- define UI representation requirements for lifecycle, validation, qualification, and failure;
- keep the specification data-model independent enough to survive Phase 3.

## Exit Test
The contract is complete enough to implement against the stage model without inventing semantics during coding.

# Phase 3 - Durable Stage Data Model + Legacy Adapter

## Objective
Move cognition out of one giant mutable Run object while preserving historical readability and exposing one durable truth to frontend and backend.

## Actions
- introduce stage-level artifact persistence;
- add stage input/dependency fingerprints;
- add versioned reruns;
- add stale-dependent marking;
- add attempt telemetry;
- add qualification metadata/artifact references;
- build legacy Run reader/adapter;
- retain historical data unchanged;
- define frontend query/view models so Results, History, BottomAccessory, and Blueprint surfaces consume durable state without duplicating backend truth.

## Exit Tests
- old Run still opens;
- new Run works;
- export works for both;
- stage lineage is queryable;
- one failed stage does not erase prior stages;
- frontend reads the same durable truth as the backend.

# Phase 4 - Canonical Stage Engine + Foundational Security

## Objective
Separate cognition from who schedules it, establish prompt/provenance boundaries, and make durable stage state visible to the product.

## Actions
- extract stage executor from browser orchestration;
- browser adapter schedules canonical stages;
- remove duplicated prompts/configuration;
- preserve completion-oriented LLM waiting;
- define settled-failure retry handoff;
- define cancel-after-current-stage semantics;
- resume from persisted stage state;
- enforce untrusted Refresh/tool-content boundaries in prompt compilation;
- expose durable stage/provenance state to the frontend;
- update BottomAccessory/Results execution-state presentation in the same tranche.

## Exit Tests
- normal run and rerun use the same compiler/validator;
- no second active SME roster or pair map exists;
- untrusted source text cannot rewrite system/orchestration policy;
- reload reconstructs durable stage truth;
- frontend stage display matches backend state.

# Phase 5 - Completion + Quality Qualification Against Stage Model

## Objective
Make lifecycle truth derive from durable stage state and prevent structurally valid mediocrity from being released as Final Janus output.

## Actions
- implement required-stage checks;
- implement six-pair requirement for Full;
- implement four-pattern requirement;
- implement confidence propagation validation;
- implement deterministic traceability checks for candidate/critique/refinement artifacts where required;
- implement quality-qualification workflow and qualification metadata;
- block false completion;
- block final release when required qualification fails;
- make validation/qualification failure explicit;
- expose qualification state and reasons in Results/Blueprint/BottomAccessory.

## Exit Tests
- intentionally incomplete fixtures cannot become `completed`;
- structurally valid but deliberately low-quality fixtures cannot silently become `JANUS-QUALIFIED`;
- qualification failure is inspectable without corrupting completed stage artifacts.

# Phase 6 - Failure, Retry, Cancellation & Ownership Semantics

## Objective
Add resilience without resurrecting timer pathology.

## Actions
1. Confirm absence of Janus-local inference watchdog.
2. Implement settled-failure classifier.
3. Add bounded retry policy.
4. Add attempt telemetry.
5. Add ownership/idempotency controls.
6. Add truthful cancel-after-active-stage behavior.
7. Ensure heartbeat remains observability only.
8. Archive/label contaminated diagnostic functions rather than reuse them blindly.

## Exit Tests
- long simulated wait does not self-fail;
- explicit retryable failure retries only after settlement;
- quota/terminal failure does not blindly retry;
- no overlapping attempts;
- cancel stops future stage scheduling;
- heartbeat age alone cannot fail a run.

---

# Phase 7 - Versioned Rerun & Dependency Invalidation

## Objective
Make reruns causally honest and visible to the operator.

## Actions
- dependency graph traversal;
- selective invalidation;
- rerun impact preview;
- version preservation;
- reuse valid completed stage logic;
- invalidate downstream quality qualification when its supporting artifacts change;
- show rerun impact/staleness clearly in the UI before execution.

## Exit Tests
- upstream rerun invalidates exact dependents;
- unrelated artifacts remain valid;
- old revisions remain inspectable;
- no destructive overwrite;
- UI preview matches actual invalidation.

# Phase 8 - Synthesis Realignment

## Objective
Make Synthesis conform to the protocol and make emergent reasoning inspectable.

## Actions
1. complete all four primary domains;
2. produce six pair stages;
3. validate six pair stages;
4. produce four formal emergent patterns;
5. preserve cross-domain takeaways/collisions/limitations;
6. persist final Synthesis artifact;
7. expose pair/pattern provenance and important emergent insights through progressive disclosure rather than raw dumps.

## Exit Tests
- 6/6 pairs required;
- each pair has insight/tension/resolution;
- four formal patterns exist without overwriting pair artifacts;
- no premature Blueprint;
- UI correctly distinguishes six pairwise intersections from four formal patterns.

# Phase 9 - Blueprint Cognition + Presentation Final Form

## Objective
Turn Synthesis into a genuinely differentiated, expert-impressive, buildable Blueprint and present it with equivalent product quality.

## Actions
- implement mode-aware candidate generation;
- require serious alternatives appropriate to mode, including at least three in Full;
- implement adversarial candidate comparison;
- implement selection or higher-order synthesis;
- implement Skeleton;
- implement Expansion;
- implement Criteria / Acceptance / Risk;
- implement deterministic assembly;
- implement Blueprint self-critique;
- implement final refinement;
- implement Blueprint Validation;
- implement Quality Qualification;
- restore/rebuild BlueprintPrint and Results integration against canonical stage data;
- restore relevant blueprint visualization components;
- restore data-density behavior;
- implement fluid typography and responsive Blueprint composition;
- preserve lossless print/PDF export.

## Exit Tests
- no content-loss truncation justified only by runtime timing;
- candidate alternatives are materially distinct;
- preferred solution rationale is traceable;
- self-critique detects seeded weaknesses;
- final refinement does not silently reduce scope/novelty;
- Blueprint survives interruption at durable substage boundaries;
- Quick remains concise but non-generic;
- Standard demonstrates serious tradeoff analysis;
- Full demonstrates cross-domain emergence, alternatives, critique, and refinement;
- Blueprint visual regression passes across required viewport classes;
- output clears the quality qualification gate.

# Phase 10 - Base44 Workflow Proof

## Objective
Measure durable server orchestration before migrating production Janus.

## Actions
Execute the controlled proof in §19 with explicit DIMA approval.

## Gate
Promote Workflows only if empirical exit criteria pass.

---

The frontend must also prove that it can leave, reload, and accurately reconstruct the Workflow-backed run from durable state without stale local-state assumptions.

# Phase 11 - Durable Server Orchestration Adapter

## Objective
Make browser-independent production execution real without creating a second cognitive engine.

## Actions if Workflow passes
- Workflow schedules canonical stages;
- stage engine remains shared;
- UI launches/observes durable Run state;
- BottomAccessory, Results, and History consume server-owned durable truth;
- browser may disappear;
- cancellation is persisted operator control;
- last-checkpoint and recovery state remain legible after reload/device return.

## If Workflow fails
Implement a measured checkpointed/self-chaining server dispatcher over the same stage engine.

## Exit Tests
Launch a controlled run, close/lock browser, return later, and verify continuation with no duplicate completed stage and no stale frontend state.

# Phase 12 - Frontend Convergence & Donor Restoration

## Objective
Complete the frontend Final Form by reconciling earlier tranche-level UI work with the best recoverable post-six-month donor capabilities.

This is a convergence phase, not the beginning of frontend work.

## Actions
Restore/rework or intentionally surpass:

- Liquid Glass exact/donor-backed token and factory behavior where available;
- density states and data-density response;
- Ambient Orbs/background material system where retained;
- scroll-reactive blur/material behavior;
- focus-state adaptations;
- WebKit compositing fixes;
- safe areas;
- PageTransition;
- Back navigation;
- PullToRefresh;
- AccountDeletionModal;
- navigation/mobile polish;
- fluid responsive typography;
- iPhone/iPad/desktop layout refinement;
- History pagination/search/error handling;
- Diagnostics;
- context-aware BottomAccessory;
- accessibility;
- route registration for all new/salvaged pages;
- BlueprintPrint/Results visual coherence;
- print/PDF presentation quality.

## Exit Tests
- all restored UI reads durable truth and does not reintroduce donor-era execution assumptions;
- representative visual regression suite passes;
- no material usability/design regression against the donor baseline unless explicitly approved;
- iPhone, smaller phone, iPad portrait, iPad landscape, and desktop are verified;
- no clipped/hidden/overlapping/unreachable controls;
- light and dark modes are coherent;
- backend and frontend state models agree.

# Phase 13 - Security, Governance & Observability Hardening

## Objective
Add defense-in-depth beyond the foundational security already present in Phase 4.

## Actions
- entity access controls;
- least privilege;
- audit logging;
- provenance review;
- tool-invocation visibility;
- security red-team scenarios;
- cost monitoring;
- protocol/engine/model-version dashboards;
- operator-control audit.

---

# Phase 14 - Full Test Program

Execute unit, contract, persistence, failure, security, UI, cognitive-quality, historical-benchmark, and visual-regression tests from §23.

A build passing is necessary but not sufficient.

The test program must demonstrate both architectural correctness and product/cognitive no-regression.

Known unrelated lint/type debt must be reported accurately rather than hidden.

# Phase 15 - Cost Preflight + Historical Quality Benchmark + Golden Full Run

## 15.1 Cost Preflight

Before DIMA authorizes paid benchmark/golden runs:

- estimate expected model calls;
- verify effective model policy;
- estimate integration-credit envelope;
- account for critique/refinement/qualification calls;
- account for retries/failure overhead;
- confirm available credits;
- obtain explicit operator approval for spend.

## 15.2 Historical Quality Benchmark

With approval:

- run the selected benchmark prompt set or carefully comparable prompts;
- preserve outputs and traces;
- compare rebuilt Janus against the strongest historical references;
- evaluate using the Universal Blueprint Quality Constitution;
- record regressions and improvements by dimension;
- remediate material regressions before Golden Full promotion.

No single scalar score can waive a severe regression in a critical dimension.

## 15.3 Golden Full Run

With explicit approval:

- Refresh ON;
- 25/25 coverage;
- Opus/model policy verified;
- all four domains complete;
- 6/6 pair artifacts;
- 4/4 formal patterns;
- valid Synthesis;
- serious candidate generation;
- adversarial comparison;
- final refinement;
- complete Blueprint;
- structural validation passes;
- quality qualification passes;
- provenance stored;
- exports round-trip;
- UI/Blueprint presentation verified;
- no local timeout;
- no duplicate paid stage.

Only then may a Run become a true Final Form golden baseline.

# Phase 16 - Production Cutover

## Conditions

- durable server orchestration proven;
- controlled successful runs sufficient;
- browser independence demonstrated;
- donor UI selectively restored or intentionally surpassed;
- frontend visual regression passes;
- historical quality benchmark shows no material regression;
- historical Runs readable;
- diagnostics trustworthy;
- rollback checkpoint exists;
- DIMA approves cutover.

## Actions

- durable orchestrator becomes production default;
- browser executor removed from ordinary production path or explicitly hidden as diagnostic fallback;
- monolithic backend experiment archived/provenance-only;
- clean build artifacts regenerated;
- documentation updated to executable reality.

---

# Phase 17 - Post-Cutover Integrity Monitoring

Monitor:

- false/incomplete completion;
- quality-qualification drift;
- cognitive-quality regression;
- visual/usability regression;
- stage duplication;
- model-policy drift;
- protocol/schema drift;
- excessive retries;
- cost amplification;
- orphaned stages;
- migration failures;
- security anomalies;
- UI vs durable-state disagreement.

Run periodic integrity comparison across:

- protocol registry;
- executable code;
- entity schemas;
- UI labels;
- documentation;
- golden tests.

This is specifically intended to prevent another 24/25 divergence.

---

# 25. Final Definition of Done

Janus Final Form is complete only when all of the following are true:

1. CP-002 v2.0 Ideal Form is the live cognitive contract.
2. Exact 25-subdomain roster exists.
3. Domain counts are 7/6/5/7.
4. Six pair intersections are mandatory and durable.
5. Four formal named emergent-pattern models are implemented.
6. Context threading matches protocol.
7. Confidence propagation is deterministic.
8. Refresh covers 25/25 when ON.
9. Refresh provenance/source limitations are durable.
10. One canonical protocol registry exists.
11. One canonical stage engine exists.
12. Browser/server do not duplicate cognition.
13. Successful stages are durable.
14. Reruns are versioned and dependency-aware.
15. Completion is validated, never inferred from process return.
16. Structural completion is distinct from quality qualification.
17. Universal Blueprint Quality Constitution is implemented.
18. Quick outputs remain concise but intellectually serious and non-generic.
19. Standard outputs demonstrate meaningful multi-domain tradeoff reasoning.
20. Full outputs demonstrate alternatives, emergence, adversarial critique, refinement, and strong qualification.
21. Historical benchmark shows no material cognitive-quality regression relative to the strongest prior Janus outputs.
22. No arbitrary Janus-local inference timeout exists.
23. Retries follow settled failures only.
24. Cancellation semantics are truthful.
25. Production execution survives browser/device disappearance.
26. Effective model policy obeys operator configuration.
27. Historical heterogeneous Runs remain readable.
28. Export is full fidelity.
29. Cognitive truncation is eliminated or explicitly semantically justified.
30. Liquid Glass donor capabilities are restored or intentionally surpassed.
31. BlueprintPrint/Results present stage-backed cognition coherently.
32. Fluid responsive typography/layout is verified across target devices.
33. Frontend/backend state models agree.
34. Visual regression suite passes.
35. Security/provenance controls are in place.
36. Monitoring exists without arbitrary health inference.
37. Unit/contract/failure/security/UI/quality tests pass.
38. Full golden run passes structural and quality gates.
39. Mobile/tablet/desktop UI passes.
40. Rollback point exists.
41. Documentation matches executable reality.
42. DIMA explicitly approves production cutover.

# 26. Risk Register

| Risk | Impact | Control |
|---|---|---|
| Protocol drift reappears | High | canonical registry + static integrity tests |
| Data migration breaks historical Runs | High | legacy adapter + no in-place mutation |
| Durable server path has hidden runtime ceiling | High | Workflow proof before cutover |
| Duplicate paid LLM stages | High | ownership + idempotency + settled retry |
| Untrusted Refresh content alters behavior | High | trusted control-plane separation + prompt hardening |
| Opus app setting overridden by legacy model args | High | Phase-0 model precedence verification |
| Cognitive truncation silently reduces fidelity | High | truncation taxonomy + stage-level audits |
| UI reports state that durable backend does not support | Medium/High | observer UI derives from durable state |
| Cognition becomes more reliable but less insightful | High | quality constitution + historical benchmark + qualification gate |
| Quick/Standard degrade into generic plans | High | universal quality floor + mode-specific quality tests |
| Backend implementation outruns frontend/product quality | High | coordinated full-stack tranche rule |
| Liquid Glass/Blueprint donor quality is lost in reimplementation | High | donor-backed salvage + visual regression |
| Test framework adds unwanted dependency churn | Medium | Phase-0 approval gate |
| Salvage reintroduces contaminated assumptions | High | per-file donor compatibility classification |
| Golden run becomes unexpectedly expensive | Medium/High | cost preflight + explicit spend approval |
| Old “running” records are mistaken for live work | Medium | legacy generation marker + audit/remediation gate |

---

# 27. Do-Not-Redo Rules

Do not:

- treat elapsed time as proof of failure;
- invent an inference timeout because a run “feels long”;
- retry while the previous provider request may still be active;
- duplicate Janus cognition between browser/server;
- truncate cognition merely to fit guessed runtime timing;
- silently change SME identities;
- silently change confidence taxonomy;
- use weak source quality as though a confidence label repairs it;
- let a recommendation become implementation authorization;
- destructively overwrite historical cognition;
- call a partial Full run completed;
- infer model identity from model self-report;
- use stale compiled `dist/` output as source authority;
- launch paid Full validation without DIMA approval;
- mutate the 19 historical `running` Runs merely because they are orphaned relative to the restored executor;
- restore donor code wholesale without baseline/donor compatibility review;
- call a Blueprint “good” merely because required fields exist;
- let Quick mode become generic or intellectually shallow;
- optimize architectural neatness at the expense of Blueprint quality;
- treat frontend work as post-backend polish;
- rebuild Liquid Glass from vague memory when donor evidence/source exists;
- accept a backend tranche as complete while its user-visible state is wrong or unfinished.

---

# 28. Operator-Control Contract

The implementation team - Daionae, Kytheion, or any future Cephalon/tooling layer - may:

- identify defects;
- recommend changes;
- propose next phases;
- prepare diffs/plans;
- perform explicitly authorized read-only audits.

It may **not** convert any of those into implementation without explicit DIMA authorization.

Protocol execution improves analysis quality. It does not create permission.

---

# 29. Kytheion Handoff Requirements

Before coding a phase, Kytheion must have access to the artifacts required for that phase.

For Phase 0 this includes:

- restored live source;
- current Base44 `Run` schema;
- Builder chat export;
- accessible donor source snapshot/diff derived from the preserved checkpoint;
- CP-002 v2.0 Ideal Form.

Kytheion should report blocked evidence honestly rather than infer it.

Any contradiction found in this plan must be surfaced before code changes.

---

# 30. External Evidence Register

These current external sources inform the architecture; they do not override CP-002 or measured behavior in the Janus/Base44 environment.

1. **Base44 Workflows - native multi-step automation for your app**  
   https://base44.com/features/workflows

2. **Google Cloud - Introducing Agent Executor, Google's distributed Agent Runtime** (May 20, 2026)  
   https://cloud.google.com/blog/products/ai-machine-learning/agent-executor-googles-distributed-agent-runtime

3. **NIST - ARIA Evaluation Planning Manual: Elements of ARIA-Style AI Evaluations** (Sept. 18, 2026)  
   https://www.nist.gov/publications/aria-evaluation-planning-manual-elements-aria-style-ai-evaluations

4. **NIST - Challenges to the monitoring of deployed AI systems** (March 6, 2026)  
   https://www.nist.gov/publications/challenges-monitoring-deployed-ai-systems-center-ai-standards-and-innovation

5. **Microsoft Research - Human-Inspired Memory Architecture for LLM Agents** (May 2026)  
   https://www.microsoft.com/en-us/research/publication/human-inspired-memory-architecture-for-llm-agents/

6. **Model Context Protocol - 2026-07-28 Specification**  
   https://blog.modelcontextprotocol.io/posts/2026-07-28/

7. **MITRE ATLAS - Adversarial Threat Landscape for AI Systems**  
   https://atlas.mitre.org/

8. **NBER - current research on LLM/AI decision behavior and economics**  
   https://www.nber.org/

---

# 31. Governing Synthesis

The rollback is not a return to old Janus as the desired product. It is a controlled restoration of a cleaner causal baseline.

The final Janus is:

**one protocol-faithful cognitive engine, driven by one canonical Ideal Form registry, producing durable versioned stage artifacts, generating and challenging serious solution candidates, qualifying Blueprints against a universal expert-impressiveness standard, orchestrated independently of browser survival, observable without arbitrary failure heuristics, secure against untrusted agent/tool context, and expressed through a frontend whose Liquid Glass design, responsiveness, information architecture, Blueprint presentation, and operator controls are engineered with the same seriousness as the backend.**

The backend exists to make Janus reliable without making it ordinary.

The frontend exists to make Janus intelligible and powerful without reducing it to decoration.

Quick, Standard, and Full differ in depth and breadth, not in whether the output deserves to be taken seriously.

Browser execution is transitional.

Durable server ownership is the production target.

The September donor checkpoint is a salvage source, not governing authority.

The strongest historical Janus outputs are quality references, not nostalgia; Final Form must meet or exceed them.

CP-002 Ideal Form is the governing cognitive specification.

DIMA remains the execution authority.

---

**End of v1.2 - Final-Form Architecture & Implementation Plan**
