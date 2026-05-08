# Implementation Plan: Blueprint Pages — Liquid Glass Enhancements & iOS Readiness

**Document ID:** DOC-BP-IMP-001  
**Document Date:** May 8, 2026  
**Prepared by:** Kytheion (Scribe-Particle-4)  
**Scope:** Blueprint tab within `/Results` page + standalone `/BlueprintPrint` page  

---

## I. Implemented Features (Current State)

All features below are operational as of the document date.

### A. Liquid Glass Aesthetic — 5-Step Enhancement Plan

#### Step 1+2: Reduced Base Opacity + Context-Aware Factory Parameters ✅

- **Base opacity reduced** across all glass surfaces for authentic translucency:
  - Light card: `0.42 → 0.28`, surface: `0.32 → 0.22`
  - Dark card: `0.055 → 0.04`, surface: `0.045 → 0.03`
  - Tab bar, accessory, active states all proportionally reduced
- **Density system added** to `LiquidGlass.jsx`:
  - All factory functions (`glassCard`, `glassSurface`, `glassTabBar`, `glassTabActive`, `glassAccessory`, `glassBtn`) accept optional `{ density }` parameter
  - Density values: `"sparse"` | `"normal"` | `"dense"` | `"focused"`
  - `shiftBg()` and `shiftFilter()` utilities dynamically adjust opacity, blur, and saturation
  - All existing call sites pass no second argument — zero breakage, backward-compatible

#### Step 3: Scroll-Reactive Blur ✅

- **`useScrollDensity` hook** (`hooks/useScrollDensity.js`) tracks scroll position via RAF-throttled listener
- **Header bar in `Layout.jsx`** is the primary consumer:
  - Top of page (≤20px): heavier glass — more opaque, stronger blur/saturate
  - Mid-scroll (20–200px): normal defaults
  - Deep scroll (200px+): thinner glass — more transparent, lighter blur
- Transition: `0.3s ease` for smooth visual shift
- Hook is reusable for any component needing scroll-awareness

#### Step 4: Focus-State Adaptation ✅

Three interactive components now use density-aware glass:

| Component | Trigger | Density Applied |
|---|---|---|
| `StepDetailPanel.jsx` | Stepper node expanded | `"focused"` on expanded node |
| `GlassTabBar.jsx` | Active tab indicator | `"focused"` on selected pill |
| `DependencyFlowGraph.jsx` | Node hover | `"focused"` on hovered node, default on leave |

Effect: Interactive elements that receive user attention solidify slightly, creating a depth cue that mirrors how real glass lenses sharpen when you focus through them.

#### Step 5: Data-Density Response ✅

- **Utility:** `lib/contentDensity.js` — `computeContentDensity(blueprint)` returns `"normal"` or `"sparse"`
- **Threshold:** >12 total items (steps + risks + alternatives + assumptions + criteria) → `"sparse"`
- **Propagation:** Computed once in `BlueprintPrint.jsx`, threaded as `contentDensity` prop to all 9 child components
- **Focus preservation:** `StepDetailPanel` expanded nodes and `DependencyFlowGraph` hovered nodes still override to `"focused"` — focus always wins over content density
- **Files modified:** `BlueprintPrint.jsx`, `SchematicHeader`, `AssumptionsPanel`, `DependencyFlowGraph`, `StepDetailPanel`, `SuccessCriteriaPanel`, `BlueprintNavBar`, `PhaseIllustration`, `RiskTopology`

### B. WebKit Backdrop-Filter Fixes ✅

- **Root cause:** Mobile Safari breaks `backdrop-filter` compositing when elements have `framer-motion` transforms or complex stacking contexts with `pointer-events: none`
- **Fixes applied:**
  - Removed `framer-motion` transform from `GlassTabBar.jsx` nav element
  - Added `isolation: isolate` to both header bar (`Layout.jsx`) and tab bar nav (`GlassTabBar.jsx`)
  - Bumped header and tab bar opacity/blur values for proper frosting:
    - Light tabBar: `0.40 → 0.65`
    - Dark tabBar: `0.055 → 0.10`
    - Base blur: `50px → 60px`

### C. iOS Mobile Readiness ✅

| Feature | File(s) Modified | Details |
|---|---|---|
| Safe-area insets | `Layout.jsx`, `GlassTabBar.jsx` | `env(safe-area-inset-*)` padding on header + bottom nav |
| Page transitions | `components/ui/PageTransition.jsx` | Framer Motion horizontal slide animation |
| Back button | `Layout.jsx` | Conditional `ChevronLeft` + "Back" on child routes (`/Results`, `/ABTest`); logo on root routes |
| Account deletion | `components/ui/AccountDeletionModal.jsx`, `pages/History.jsx` | Two-step confirmation modal, Apple compliance |
| Pull-to-refresh | `components/ui/PullToRefresh.jsx`, `pages/History.jsx` | Custom touch handler with damped spinner |
| CSS hardening | `globals.css` | `overscroll-behavior: none`, button text selection disabled, safe-area CSS vars |
| Viewport | `index.html` | `viewport-fit=cover` for safe-area env variable activation |

---

## II. Status: ALL STEPS COMPLETE ✅

All 5 steps of the Liquid Glass enhancement plan plus iOS mobile readiness have been implemented. The `/BlueprintPrint` page and its child components now fully participate in the context-aware density system.

---

## III. Architecture Notes

### What was NOT touched (and must remain untouched):
- `BottomAccessory.jsx` — already the one context-aware piece, working correctly
- All business logic and data flows — no execution engine, schema, or prompt changes
- The `BlueprintTab` component within `GlassResultTabs` (the Results page tab) — styling changes flow through shared `LiquidGlass.jsx` tokens

### Design contract for native migration (Blink):
- The 5-step liquid glass system (`LiquidGlass.jsx`) serves as the **visual specification** for native port
- Factory function signatures (`glassCard(t, { density })`) define the API contract
- Token values (opacity, blur, saturation per theme per density) are the **numerical spec**
- Native implementation should reproduce these values using platform-native blur/tint primitives

---

*Janus Blueprint Protocol — Cephalon Continuity Framework — CP-002 v1.5*