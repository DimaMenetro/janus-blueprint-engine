# Janus Blueprint Engine — Whole-Application Assessment

* **Document Type:** Assessment / Reconciliation Record
* **Document ID:** ASM-JBE-001
* **Rev:** 1.0
* **Date:** 2026-08-03
* **Author:** Kytheion (Scribe-Particle-4)
* **Authority:** Operator-directed (DIMA), whole-product review
* **Companion:** `JANUS_ENGINE_CONTINUITY.md` (CR-JBE-001) — execution forensics
* **Status:** Evidence-recorded. No architecture decision is made in this document.

> **Standing epistemic rule for this document.** Every finding carries an
> evidence class: **[MEASURED]** (observed directly), **[DOCUMENTED]** (platform
> docs), **[CODE]** (read from this repository), **[HYPOTHESIS]** (plausible,
> untested). No claim is promoted between classes without new evidence.

---

## Section 0 — Orchestration Surface: Current App State

Required by operator directive before any architecture selection.

### 0.1 Which interface does this app expose?

| Question | Finding | Class |
|---|---|---|
| Workflows or Automations? | **Workflows.** The workflow authoring surface resolves for this app and reports its workflow inventory directly. | [MEASURED] |
| Workflows currently defined | **Zero.** "No workflows exist yet for this app." | [MEASURED] |
| Legacy automations present | **UNDETERMINED — see 0.2.** | — |
| Workspace entitlement | **UNVERIFIED — see 0.3.** | — |

**Interpretation.** The app is on, or has access to, the Workflows interface
rather than being locked to legacy Automations. The July 6 2026 cutoff described
in the docs would nominally place an older app on Automations, so either this app
post-dates the cutoff or it has already been switched. Either way, the
orchestration surface available to us today is Workflows, and it is empty.

### 0.2 Automation history — honest limits of this check

I can enumerate **workflows**; I have **no tool that enumerates legacy
automations** or reads the Dashboard → Automations panel. Therefore:

- I cannot state that zero automations exist — only that zero *workflows* exist.
- **Operator action to close this:** open Dashboard → Automations. If the panel
  shows a **"Switch to Workflows"** button, the app is still on Automations and
  the workflow surface I see is latent. If the panel is absent or already reads
  Workflows, the app is native/already-migrated.

### 0.3 Migration implications — [DOCUMENTED]

If a switch is required, the documented behaviour is **non-destructive**:

- Each automation is **recreated as a workflow**, keeping its original trigger and schedule.
- **Run counts and stats carry over** to the new workflow.
- **Past run logs stay accessible** — originals are retained as archived, not deleted.
- **Archived automations come across** and stay archived.
- **Nothing stops running** during the switch.
- It is a **one-step, no-rebuild** operation.

**Assessment:** migration risk is **LOW**. No documented data loss, no behavioural
break, no rebuild. The only genuine risks are (a) irreversibility is not
documented — the docs describe no "switch back", so treat it as **one-way until
proven otherwise**; and (b) if unknown automations exist per 0.2, their
post-migration behaviour should be spot-checked rather than assumed.

**Recommendation:** do not perform the switch as a side effect of Janus work.
If needed, it should be an explicit, separately-authorized operator action taken
when the architecture decision actually requires Workflows.

### 0.4 Entitlement and cost preconditions — [DOCUMENTED]

- Workflows require the **Builder plan or above**.
- Builder includes **10,000 integration credits/month**, **shared workspace-wide**
  across workflows, automations, agents and integrations.
- Billing model: **per step that runs a backend function = a fraction of an
  integration credit**; fractions **accumulate across all steps in a run**; any
  built-in integration called inside a step (notably **InvokeLLM**) is billed
  **separately on top** at standard rates.
- The docs **do not publish the exact per-step decimal**. Estimating it requires
  running a test workflow and reading execution logs.
- **If credits are exhausted mid-run, the run is cancelled.**

**Unverified:** this workspace's actual plan tier and current credit consumption.
That is operator-visible information I cannot read.

---

## Section 1 — Product & Architecture Benchmarking

### 1.1 What Janus actually is, in current-practice terms

Stripped of its protocol vocabulary, the engine is a **multi-stage LLM reasoning
pipeline with typed intermediate artifacts**: ~7 (Standard) to ~13+ (Full)
sequential model calls, each consuming prior stages' structured output, ending in
a schema-validated blueprint. This is the pattern the wider field now calls a
**deterministic agent workflow** (as distinct from an autonomous tool-using
agent): fixed graph, no model-chosen control flow, strong output typing.

**This is the right pattern for the job.** Janus needs auditability and
reproducibility (CP-002 fidelity), which a fixed graph gives and an autonomous
agent loop does not. The architecture choice is sound. The problems are all in
**execution substrate**, not in pipeline design.

### 1.2 Where Janus is genuinely ahead of common practice

| Property | Janus | Typical LLM-pipeline app |
|---|---|---|
| Typed schema for every stage | Yes — `janusSchema.jsx`, normalize + validate | Usually free-text or loose JSON |
| Incremental persistence per stage | Yes — each domain written on completion | Usually all-or-nothing at end |
| Per-call-type timeout matrix | Yes — 90–240 s, empirically tuned per label | Usually one global timeout |
| Bounded retry with backoff + retry log | Yes — `llmTimeout.jsx`, logged to the Run | Often naive retry or none |
| Output-truncation mitigation | Yes — blueprint split into 3 sub-calls | Usually unaddressed until it breaks |
| Golden-run regression harness | Yes — content hashes + structural fingerprints | Rare |
| Cross-domain intersection synthesis | Yes — 6 explicit pairs | Essentially unique to CP-002 |

The forensic and regression tooling here is **above the norm** for an app of this
size. That is a real asset and should be protected in any refactor.

### 1.3 Where Janus is behind current practice — the honest list

1. **No durable execution substrate.** The defining gap. Everything below is
   downstream of it.
2. **No completion invariant** (Defect-1). Current practice for staged pipelines
   is a terminal gate that refuses to stamp success unless every required stage
   is present. Janus stamps `completed` optimistically.
3. **Silent partial degradation** (Defect-2). Domain parse failures survive into
   downstream reasoning without a hard signal.
4. **No resume.** A pipeline that dies at stage 6 of 13 discards stages 1–5's
   value even though they were persisted. Checkpoint-resume is standard practice
   for long chains and the persisted data to support it **already exists**.
5. **Two parallel execution lanes with no unified user-facing model** (browser
   lane via `/NewQuery`, server lane via `/BackendRun`). This is a transitional
   state that has become semi-permanent.
6. **Client-side orchestration of a multi-minute job.** `NewQuery` calls
   `executeJanus` in the browser [CODE] — the run is bound to the tab's lifetime.

### 1.4 Comparative shape of the three candidate architectures

Kept open per directive. No selection made.

| Dimension | (A) Workflow orchestration | (B) App-managed checkpoint/resume | (C) Hybrid |
|---|---|---|---|
| Durability source | Platform | Our code on the Run record | Platform spine + our checkpoints |
| Per-step budget | **H-1, unproven** | Known: ~5 min per invocation [MEASURED] | Inherits both |
| Observability | Per-step run log, built-in | Only what we build | Best of both |
| Credit cost | Step fractions + LLM, accumulating | LLM only, no step fractions | Step fractions + LLM |
| Entitlement risk | Requires Builder+ | None | Requires Builder+ |
| Build effort | Low–medium (new surface, zero workflows today) | Medium–high (all mechanism is ours) | Highest |
| Resume granularity | Step boundary | Arbitrary, our choice | Arbitrary |
| Vendor coupling | High | Low | Medium |
| CP-002 fidelity risk | Step decomposition must not alter prompt construction | Same risk, fully under our control | Same |

**Cross-cutting requirement, independent of choice:** every rejected option and
every candidate option fails *silently* by default. **A completion invariant is
mandatory in all three.** It is the one piece of work that is not blocked by the
architecture decision — which makes it the correct thing to build first.

---

## Section 2 — Frontend & UI/UX Evaluation

Evidence class **[CODE]** throughout — read from `Layout.jsx`, `NewQuery.jsx`,
`History.jsx`, `GlassTabBar.jsx`, `Diagnostics.jsx`, `LiquidGlass.jsx`.

### 2.1 Design system — strong

The Liquid Glass system is coherent and well-executed: light/dark token sets,
density-reactive blur/opacity driven by scroll, safe-area insets throughout,
spring-animated tab indicator, page transitions, pull-to-refresh, and an
Apple-requirement account-deletion path. On a phone this is a genuinely polished,
native-feeling app. That quality is not in question.

### 2.2 The central responsive finding — the app is mobile-only by construction

**Every page is a fixed `maxWidth: 720` centred column**, and **all styling is
inline `style={{}}` objects**, not Tailwind classes.

Consequence: **inline styles cannot express media queries.** There is no
mechanism anywhere in the app for a layout to change at a breakpoint. The only
responsive behaviour present is fluid width up to 720 px plus a few `flexWrap`s.

| Viewport | Actual behaviour | Verdict |
|---|---|---|
| Mobile (≤430 px) | Full-bleed column, bottom pill nav, safe areas honoured | **Excellent** — the design target |
| Tablet (768–1024 px) | Same 720 px column, centred; bottom pill still fixed at 440 px | **Adequate but unconsidered** — reads as a blown-up phone |
| Desktop (≥1280 px) | Same 720 px column stranded in the centre; ~60% of viewport is empty ambient background; navigation remains a floating bottom pill | **Poor** — violates desktop convention and wastes the space that dense blueprint content most needs |

This matters disproportionately for **`/BlueprintPrint`** and the **Results
domain tabs**, which render wide schematic content — dependency graphs, I/O hubs,
risk topology, intersection matrices — into a 720 px column on a 2560 px display.
The most information-dense views are the most penalized.

**Root cause is architectural, not cosmetic.** Adding breakpoints requires either
migrating layout-critical styles to Tailwind classes or introducing a viewport
hook. `useScrollDensity` already establishes the hook pattern, so a
`useBreakpoint` companion is a small, idiomatic addition. This is a
**bounded refactor with a clear seam**, not a rewrite — but it is not a
one-line fix either, and it should be scoped honestly.

### 2.3 Concrete defects found while reading

**D-UI-1 — Tab indicator breaks on route-case mismatch. [CODE]**
`GlassTabBar` computes `activeIndex` with exact equality
(`location.pathname === tab.path`) against mixed-case paths
(`/NewQuery`, `/history`, `/BlueprintPrint`, `/diagnostics`). `Layout.jsx`, by
contrast, deliberately compares child routes with `.toLowerCase()`. Any arrival
at a differently-cased path (`/History`, `/Diagnostics`) yields `activeIndex = -1`
→ **the active capsule vanishes and no tab appears selected.** Low severity, high
visibility, trivial fix — normalize case in the comparison.

**D-UI-2 — History loads 100 full Run documents. [CODE + MEASURED]**
`History.jsx` calls `Run.list("-created_date", 100)`. Run records carry the full
corpus, cogito, animus, actus, synthesis, blueprint, `raw_json` and `render_md`
payloads — these are large documents. **This is the same defect class already
fixed in `BlueprintPrint`**, where the fetch had to be capped at 15 records to
stop network timeouts. History still carries the unmitigated version at nearly
7× the row count. With 67 runs in the database today it is latent; it degrades as
history grows. Fix: server-side field projection or a smaller page size with
pagination.

**D-UI-3 — History has no error path. [CODE]**
`loadRuns` has no failure handling and `setLoading(false)` sits after the await.
A rejected fetch leaves the page on **skeleton placeholders forever**, with no
message and no retry. Given D-UI-2 makes that fetch the most timeout-prone call
in the app, these two defects compound.

**D-UI-4 — Search is client-side over the loaded window only. [CODE]**
The keyword filter runs against the 100 fetched records. Runs older than the
window are unfindable, and the empty state says "No matching runs" — which is
false rather than merely unhelpful.

**D-UI-5 — Browser-lane runs are bound to the tab. [CODE]**
`NewQuery` awaits `executeJanus` in the browser. Navigating away, backgrounding
on mobile, or a sleeping device kills a multi-minute run. There is no warning to
the user before starting. This is a **UX manifestation of the architecture
problem**, and it will be resolved by whichever candidate is chosen — but until
then the interface should at minimum warn.

**D-UI-6 — Two unexplained execution lanes.**
`/NewQuery` (browser) and `/BackendRun` + `/BackendRuns` (server) are separate
routes, and the backend pair are not in the tab bar. A user has no way to
understand which lane they are in, why two exist, or which one to trust.

**D-UI-7 — Accessibility gaps.**
No visible focus states on the inline-styled interactive elements; tab links
carry no `aria-current`; the History search input has no associated label; 10 px
tab labels are below comfortable minimums; several muted-token foregrounds are
plausibly under WCAG AA on glass backgrounds (unmeasured — flagged, not asserted).
Interaction feedback is scale-animation only, which does not reach assistive tech.

### 2.4 UI/UX verdict

Mobile execution: **strong**. Tablet: **acceptable, unconsidered**.
Desktop: **structurally unaddressed** — and desktop is the natural environment for
reviewing a dense architectural blueprint, which is the app's core value.
The defect list is short and mostly cheap; the responsive gap is the only item
requiring real design decisions.

---

## Section 3 — Implementation-Plan Reconciliation

| Plan / Artifact | Documented intent | Live reality | Verdict |
|---|---|---|---|
| **IMP-001-R-D-RES** (resilience) | Timeout matrix, bounded retry, heartbeat, retry log, `current_step` | All present and in use: `llmTimeout.jsx` matrix with tuned per-label budgets; retry log and heartbeat fields live on the Run schema | **DELIVERED** |
| **IMP-002** (server lane) | Move execution server-side; `queued` status, `execution_owner`, claim/lifecycle timestamps | Schema fields all exist; `runJanusPipeline` exists; `/BackendRun`, `/BackendRuns` routed explicitly in `App.jsx` | **BLOCKED — invalidated premise.** Built on synchronous invocation, now rejected by the ~295 s ceiling [MEASURED + DOCUMENTED] |
| **IMP-002 reaper** | Detect and flag stalled runs; `reaper_strikes` field | Field exists, defaulted to 0; **no reaper implemented** | **DEFERRED — field is a stub** |
| **Phase -1 instrumentation** | Prompt-hash capture for byte-level reproducibility | Torn down; schema field removed; 4 legacy runs retain data | **RETIRED — with residue** (see continuity V-5/V-6) |
| **Golden-run harness** | Capture + compare baselines | `captureGoldenRun` / `compareToGolden` intact and invocable | **OPERATIONAL BUT DEGRADED** — 3 of 8 gates read the removed `debug_prompt_hashes`, so `all_pass` can never be true for new runs |
| **Full-mode golden baseline** | Reference for Full runs | Never captured; qualifying completed Full runs exist in DB | **OUTSTANDING TASK, not a lost capability** |
| **DOC-BP-IMP-002** (BlueprintPrint) | Fluid typography via `clamp()`; unify `BlueprintTab` → `BlueprintPrint` | Neither executed; both components still exist separately | **OPEN** — and the fluid-typography item is a partial answer to §2.2 |
| **Defect-1 completion invariant** | Refuse `completed` on partial runs | Not implemented | **OPEN — highest-value unblocked work** |
| **Defect-2 parse-failure hardening** | Fail loudly on domain parse failure | Not implemented | **OPEN** |
| **10 mis-stamped historical runs** | Repair or re-stamp | Audited and registered in `EV_AUDIT_REGISTER.md`; no remediation | **AWAITING OPERATOR AUTHORIZATION** |

### 3.1 Reconciliation findings

- **F-R1 — Schema has outrun implementation.** `reaper_strikes`, `queued_at`,
  `claimed_at`, `execution_owner` describe a lifecycle no live code fully drives.
  Harmless, but it makes the schema an unreliable guide to actual behaviour.
  Any future reader should treat these as *intent*, not *contract*.
- **F-R2 — IMP-002 is not wrong, it is incomplete.** Its goal (server-owned
  execution, browser-independent) is exactly right and is preserved under all
  three candidates. Only its *transport assumption* — one synchronous invocation
  — is dead. The Run-lifecycle schema it introduced is directly reusable.
- **F-R3 — The database has drifted from the code twice.** Legacy prompt hashes
  persist after schema removal; 11 Full runs sit permanently at `status: running`
  from browser-lane deaths. There is no reconciliation pass that ever cleans
  orphaned state. This is a structural gap, not an incident.
- **F-R4 — Defect-1 is the only major item blocked by nothing.** It needs no
  architecture decision, no entitlement, no probe.

---

## Section 4 — Base44 Capability & Cost Analysis

### 4.1 Capability envelope [DOCUMENTED + MEASURED]

| Capability | Status for Janus |
|---|---|
| Backend function, 5-min hard ceiling | Confirmed twice by measurement; caps any single stage |
| `waitUntil()` | **Rejected** — best-effort, no completion guarantee; would institutionalize Defect-1 |
| Automations, 3-min | Not applicable — strictly worse |
| Workflows | Ordered backend-function steps, conditions, durable waits, entity triggers, per-step run log; **per-step budget = H-1, unproven** |
| Entity triggers | Directly enables browser-independent start: insert Run as `queued` → workflow fires |
| Sequential-only execution | **Matches Janus's dependency chain exactly** — no redesign needed |
| InvokeLLM | Already the workhorse; billed per call regardless of architecture |

### 4.2 Cost model

The **dominant cost is unchanged by the architecture decision**: a Standard run
issues ~7 InvokeLLM calls and a Full run 13+, and those are billed identically
whether orchestrated by browser, function, or workflow. Restructuring does not
make Janus cheaper.

What restructuring *adds*, under (A) or (C) only, is **per-step fractions
accumulating across 7–13 steps**. Against multi-credit LLM calls this is very
likely a **minor marginal overhead** — but the exact fraction is unpublished, so
this is **[HYPOTHESIS]**, dischargeable by reading execution logs from the same
minimal probe that tests H-1. **One probe answers both questions.**

Genuine cost risks, in order:
1. **Mid-run cancellation on credit exhaustion** — a new, silent failure mode that
   the completion invariant must treat as a first-class outcome.
2. **Shared workspace credit pool** — Janus competes with everything else in the
   workspace; a heavy Full-run period can starve unrelated apps.
3. **Retry amplification** — up to 3 attempts per call × 13 calls is a large
   worst-case credit envelope, and it is currently unbudgeted and unmonitored.
4. **Full-mode refresh sweeps** use internet-context calls across 24 subdomains.

**Recommendation (not a decision):** before enabling any architecture at scale,
instrument per-run credit consumption. Cost is currently invisible, and every
option above makes it *more* granular, not less.

---

## Section 5 — Integrated Janus Roadmap

Ordered by dependency, not ambition. Each item states what unblocks it.

### Lane 1 — Unblocked, correctness-critical (start immediately)

| # | Item | Why now |
|---|---|---|
| 1.1 | **Completion invariant (Defect-1)** — a terminal gate that refuses `completed` unless every mode-required domain is present and non-empty; otherwise `partial` or `failed` with a reason | Blocked by nothing. Required by all three architectures. Directly prevents the 10-run mis-stamping class from recurring |
| 1.2 | **Parse-failure hardening (Defect-2)** — domain parse failure becomes an explicit run-level condition, not a silent skip | Same rationale; pairs naturally with 1.1 |
| 1.3 | **Credit-exhaustion as a recognized outcome** | Cheap to add while 1.1 is being written; expensive to retrofit |

### Lane 2 — Evidence-gathering (parallel with Lane 1)

| # | Item | Discharges |
|---|---|---|
| 2.1 | **Minimal Workflow probe** — two timed backend-function steps writing start/end timestamps to an entity; preserve the run log | **H-1** (independent per-step budget) **and** the per-step credit fraction, in one run |
| 2.2 | **Operator check of Dashboard → Automations** | §0.2 automation inventory; §0.3 migration necessity |
| 2.3 | **Confirm workspace plan tier and credit headroom** | §0.4 entitlement precondition |
| 2.4 | **Capture the Full-mode golden baseline** from an existing qualifying completed run | Restores regression coverage for Full before any refactor touches it |
| 2.5 | **Re-scope golden gates** to the 5 surviving checks, or consciously accept `all_pass = false` | Makes the harness usable again |

> **Gate:** the architecture decision (Lane 3) should not be taken until 2.1, 2.2
> and 2.3 report. That is a small, fast set — it is not a long delay.

### Lane 3 — Architecture decision and execution (operator-gated)

| # | Item |
|---|---|
| 3.1 | **Select among (A) Workflow orchestration, (B) app-managed checkpoint/resume, (C) hybrid** — informed by 2.1/2.2/2.3, cost tolerance, vendor-coupling appetite, and CP-002 fidelity |
| 3.2 | **Checkpoint/resume semantics** — required under (B) and (C), valuable under (A). The persisted per-domain data to support it already exists; only the resume logic is missing |
| 3.3 | **Retire the browser lane** once the server lane is durable; collapse `/NewQuery`, `/BackendRun`, `/BackendRuns` into one honest execution surface (closes D-UI-5, D-UI-6) |
| 3.4 | **Prompt-byte parity validation** against a golden baseline before/after the refactor — the still-open V-7 |
| 3.5 | **Implement the reaper**, or delete `reaper_strikes` from the schema. Not both-and-neither |

### Lane 4 — Frontend (independent of Lane 3; can run in parallel)

| # | Item | Cost |
|---|---|---|
| 4.1 | **D-UI-1** tab-indicator case normalization | Trivial |
| 4.2 | **D-UI-3** History error state + retry | Small |
| 4.3 | **D-UI-2** History fetch projection / pagination | Small–medium; prevents a growing timeout |
| 4.4 | **D-UI-4** server-side search, or honest empty-state copy | Small |
| 4.5 | **Responsive strategy decision** — the §2.2 root cause. Introduce a `useBreakpoint` hook beside `useScrollDensity`, and widen dense views (`/BlueprintPrint`, Results tabs) at ≥1024 px | Medium; needs a design decision first |
| 4.6 | **Fluid typography via `clamp()`** — recovered DOC-BP-IMP-002 item, partially serves 4.5 | Small |
| 4.7 | **Unify `BlueprintTab` → `BlueprintPrint`** — recovered item | Medium |
| 4.8 | **Accessibility pass** (D-UI-7): focus states, `aria-current`, input labels, measured contrast | Medium |

### Lane 5 — Historical data remediation (awaiting authorization)

| # | Item |
|---|---|
| 5.1 | Decide repair vs re-stamp vs annotate for the **10 mis-stamped completed runs** |
| 5.2 | Decide disposition of the **11 Full runs permanently at `status: running`** |
| 5.3 | Decide whether to purge or preserve the **4 legacy `debug_prompt_hashes`** payloads |
| 5.4 | Establish a recurring **DB/code reconciliation pass** (F-R3) so orphaned state stops accumulating |

---

## Section 6 — Open Questions for the Operator

1. **Plan tier and credit headroom** — is Builder+ in place, and what is current
   monthly consumption? (Gates candidate A and C.)
2. **Automations panel state** — does Dashboard → Automations offer
   "Switch to Workflows"? (§0.2)
3. **Vendor-coupling posture** — is deep coupling to Base44 Workflows acceptable,
   or is portability a standing requirement? (This is a values question, not a
   technical one, and it materially separates A from B.)
4. **Desktop as a first-class target** — yes or no? §2.2's remedy is only worth
   its cost if desktop review of blueprints matters.
5. **Historical remediation authorization** — Lane 5 touches the archival record
   and will not proceed without explicit instruction.

---

## Section 7 — Standing Constraints Carried Forward

- **H-1 unproven.** No design may assume independent per-step execution budgets
  until the minimal Workflow probe (2.1) discharges it.
- **V-1 open.** `probeExecutionBudget` auth is source-verified, not
  runtime-verified against an anonymous caller.
- **V-7 open.** Prompt-byte invariance across the Phase -1 teardown is unmeasured;
  the "unchanged by construction" claim stands retracted.
- **Golden harness degraded.** 3 of 8 gates are dead pending 2.5.
- **All three candidate architectures remain live.** Nothing in this document
  selects one.