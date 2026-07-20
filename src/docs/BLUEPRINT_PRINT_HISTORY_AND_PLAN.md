# Implementation History & Plan: Experimental Blueprint Schematic Page (`/BlueprintPrint`)

**Document ID:** DOC-BP-IMP-002
**Document Date:** July 20, 2026
**Prepared by:** Kytheion (Scribe-Particle-4)
**Document Type:** Implementation History & Forward Plan
**Scope:** The standalone experimental blueprint visualization page (`/BlueprintPrint`) and its component family (`src/components/blueprint-vis/`)
**Related Artifacts:** DOC-BP-IMP-001 (Liquid Glass Enhancements & iOS Readiness — COMPLETE)

---

## 0. Provenance Note

The earliest conversational design transcripts for this page are no longer retrievable.
This history is **reconstructed from the code archive itself** (component structure, inline
comments, prop contracts) and from DOC-BP-IMP-001. The code is authoritative about *what*
was built; where exact ordering or dates are inferred, they are marked (~approx).

---

## I. Complete History — From Creation to Present

### Phase 1: Page Genesis — "Prototype v1" (~early 2026)

- Created `/BlueprintPrint` as a **sandbox page**, deliberately separate from the
  production Blueprint tab inside `/Results` (`BlueprintTab.jsx` in `GlassResultTabs`).
- Purpose (from the file's own header): *"Sandbox page for technical schematic
  visualization"* — a safe space to experiment with visual rendering of Janus
  blueprints without risking the production Results flow.
- Core mechanics established at genesis:
  - Run selector dropdown (completed runs with blueprints only)
  - Loads real `Run` entities from the database — no mock data, ever
  - Zero writes: page is strictly read-only over completed runs

### Phase 2: "Prototype v2" — Real Visual Diagrams (~spring 2026)

Header comment marks the shift: *"Prototype v2: Real visual diagrams, not text re-rendering."*
The page stopped being formatted text and became a true schematic. Component family built
in `src/components/blueprint-vis/` (one focused file each):

| Component | Role |
|---|---|
| `EngineeringGrid.jsx` | Blueprint-paper background grid (sketch aesthetic) |
| `SchematicHeader.jsx` | Title-block "header plate" with run metadata |
| `DependencyFlowGraph.jsx` | Visual step-dependency graph (nodes + edges, hover focus) |
| `StepDetailPanel.jsx` | Interactive stepper — expandable step nodes with full detail |
| `IOHubDiagram.jsx` | Per-phase input/output hub diagram |
| `PhaseIllustration.jsx` | Illustrative rendering per selected phase |
| `AssumptionsPanel.jsx` | Collapsible assumptions + alternative approaches |
| `SuccessCriteriaPanel.jsx` | Interactive success-criteria checklist |
| `RiskTopology.jsx` | Risk register rendered as a topology/impact view |
| `BlueprintNavBar.jsx` | View-mode switcher + link back to Results |

- **Three view modes** introduced: `full` (everything), `visual` (diagram-first),
  `stepper` (detail-first) — routed through `BlueprintNavBar`.
- **Phase selector** for I/O Hub diagrams — pick a phase, see its I/O hub + illustration.
- Footer stamp: "Janus Blueprint Protocol — Cephalon Continuity Framework — CP-002 v1.5".

### Phase 3: Liquid Glass Enhancement Pass (May 2026) — DOC-BP-IMP-001 ✅

Fully documented in DOC-BP-IMP-001; summarized here for continuity:

1. **Steps 1+2:** Reduced base glass opacity; density-aware factory functions
   (`glassCard(t, { density })`) with `sparse | normal | dense | focused` values.
2. **Step 3:** Scroll-reactive blur via `useScrollDensity` hook (header consumer).
3. **Step 4:** Focus-state adaptation — expanded stepper nodes, hovered graph nodes,
   and active tab pills solidify to `"focused"` density.
4. **Step 5:** Data-density response — `computeContentDensity(blueprint)` in
   `lib/contentDensity.js`; >12 total blueprint items → `"sparse"` glass. Computed once
   in `BlueprintPrint.jsx`, threaded as `contentDensity` to all 9 child components.
   Focus always overrides content density.
5. **WebKit fixes:** `isolation: isolate`, removed framer-motion transform from the
   tab bar, bumped frosting values for mobile Safari.
6. **iOS readiness:** safe-area insets, page transitions, back button, pull-to-refresh,
   account deletion modal, viewport-fit=cover.

**Status: ALL COMPLETE** (per DOC-BP-IMP-001, Section II).

### Phase 4: Pre-Interruption Design Work (RECOVERED — ~May 2026)

Recovered July 20, 2026 from an operator-preserved session transcript. Two plans were
fully designed and analyzed but **never executed** — the backend refactor interrupted
them at the "awaiting confirmation" stage:

**4a. Fluid Typography Plan (Responsive Text Scaling)**
- Replace fixed pixel font sizes with a fluid type system using CSS `clamp()`:
  - `--fluid-title: clamp(18px, 4vw, 24px)`
  - `--fluid-body: clamp(11px, 2.5vw, 14px)`
  - `--fluid-label: clamp(9px, 2vw, 11px)`
- Ratios stay locked (titles ~1.6× body); the schematic shrinks to legible minimums
  on iPhone and expands on iPad/large displays. No media-query bloat, no breaking changes.

**4b. The Unified Blueprint (BlueprintTab Replacement)**
- Comparative analysis completed: `BlueprintPrint` was verified as a **direct and
  comprehensive superset** of the production `BlueprintTab` in `/Results` — every
  BlueprintTab data point (goal, assumptions, alternatives, steps with
  effort/time/dependencies/substeps/checklists/acceptance tests/I/O/validation,
  success criteria, risk register) is covered, plus the interactive visualizations.
- Decision reached: `BlueprintPrint` **can fully replace** `BlueprintTab` as the
  official blueprint display, consolidating the UX and eliminating redundancy.
- Status at interruption: analysis complete, **awaiting operator confirmation** —
  confirmation never given because the session pivoted to a stalled-run incident.

**4c. The Stalled-Run Incident (trigger for the backend refactor)**
- A browser-executed blueprint run appeared stuck at step 8/13; diagnosis showed the
  backend synthesis had completed but the `raw_json` field was left **empty**, so the
  frontend had nothing to render — the run was effectively lost.
- Diagnosis confirmed runs must not depend on the operator's phone screen staying
  awake → this directly motivated the IMP-002 server-owned execution lane
  (`runJanusPipeline`, `/BackendRun`, `/BackendRuns`, golden-run capture).
- Note: the display-side answer to truncated/empty `raw_json` was later addressed via
  `reconstructFullJson` / `reconstructFullMarkdown` (rebuilding exports from domain
  fields), but 4a and 4b remained unexecuted.

### Phase 4.5: Interruption — Backend Refactor Takes Priority (~May–July 2026)

- All effort shifted to the IMP-002 emergency backend lane.
- No feature work landed on `/BlueprintPrint` during this window.

### Phase 5: Stability Fix (July 16, 2026)

- **Network Error fix:** the page previously fetched 50 full-size runs in one request
  (multi-megabyte payload, unhandled promise). Fixed:
  - Server-side filter `{ status: "completed" }`, limit reduced to 15
  - Graceful error state with Retry button; `loading` always resolves
- This is the page's current, live state.

---

## II. Current State Inventory (as of July 20, 2026)

- **Route:** `/BlueprintPrint` (registered via pages config)
- **Data source:** 15 most recent completed `Run` entities with a `blueprint` field
- **View modes:** full / visual / stepper
- **Rendered sections (full mode):** header plate → goal statement → assumptions &
  alternatives → dependency flow graph → step detail panel → I/O hub + phase
  illustration → success criteria → risk topology → footer stamp
- **Design system:** fully integrated with Liquid Glass density system (5/5 steps)
- **Known constraints:**
  - No export of the schematic (screen-only)
  - Dependency graph is static (no zoom/pan) — large blueprints get cramped
  - No time dimension — step `time_estimate` / `effort_level` fields are stored but
    not visualized as a timeline
  - Run selector offers only the latest 15 completed runs

---

## III. Forward Implementation Plan

### Phase 5A — RECOVERED DESIGN WORK (designed pre-refactor, pending ratification)

These are the genuine "where we left off" items, recovered from the Phase 4 transcript.
Both are zero-integration-credit.

**5A.1 Fluid Typography System**
- Implement the `clamp()`-based fluid type variables (see Phase 4a spec) and apply
  them across `/BlueprintPrint` and its 10 child components
- Acceptance: schematic legible on iPhone-width viewport; ratios preserved at all sizes

**5A.2 The Unified Blueprint — Replace `BlueprintTab` with the schematic view**
- Route the Blueprint tab in `/Results` to render the schematic component family
  (superset verification already complete, Phase 4b)
- Retire or redirect the standalone sandbox once parity is confirmed
- Acceptance: `/Results` blueprint tab shows the full schematic; no BlueprintTab data
  point lost; sandbox behavior preserved during transition
- ⚠️ Was awaiting operator confirmation at time of interruption — **still requires
  explicit go-ahead** before execution (per SOP-011-O-D-RAM)

### Phase 6 — NEW CANDIDATES (PROPOSED, UNRATIFIED)

> ⚠️ These items are **candidate features**, not recovered design decisions. They were
> proposed July 18–20, 2026 based on the current state inventory above. Ratify, amend,
> or strike before execution (per SOP-011-O-D-RAM).

All items are **zero-integration-credit** — they operate on existing completed runs.

### 6.1 Printable / PDF Schematic Export
- Render the full schematic to PDF using already-installed `jspdf` + `html2canvas`
- Export button in `BlueprintNavBar`; light-theme forced for print fidelity
- Acceptance: a completed run exports to a legible multi-page PDF

### 6.2 Timeline / Gantt View of Steps
- New view mode `timeline` alongside full/visual/stepper
- Horizontal bars from `time_estimate` + `depends_on_steps` (dependency-ordered lanes)
- Acceptance: steps with dependencies render in correct sequence with duration bars

### 6.3 Zoom-and-Pan Dependency Graph
- Wrap `DependencyFlowGraph` in an SVG viewport with wheel-zoom + drag-pan
- Acceptance: a 10+ step blueprint is fully navigable without cramping

### 6.4 Run Selector Search
- Text filter over query labels in the dropdown (client-side, no extra fetching)
- Acceptance: typing narrows the run list instantly

**Suggested execution order:** Phase 5A first (5A.1 typography → 5A.2 unification, upon
your confirmation), then 6.3 → 6.2 → 6.1 → 6.4 (graph usability first, export last so it
captures the improved visuals).

---

## IV. Standing Constraints

- This page remains a **sandbox** — production blueprint rendering in `/Results` is untouched
- Read-only over `Run` entities; no writes, no LLM calls
- All new components go in `src/components/blueprint-vis/`, one focused file each
- All styling flows through Liquid Glass tokens with `contentDensity` threading

---

*Janus Blueprint Protocol — Cephalon Continuity Framework — CP-002 v1.5*