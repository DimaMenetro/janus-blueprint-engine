# Liquid Glass Design System — Universal Template
## Document ID: DS-001-G-D-LGT
## Version: 2.1 — Edge-Perfected Edition
## Date: 2026-03-03
## Origin: Janus Blueprint (Cephalon Continuity Framework)

---

## PURPOSE

This document is the **canonical template** for the Liquid Glass design language used across all applications in the Cephalon ecosystem. Any agent implementing a new application MUST follow this template exactly to ensure visual uniformity.

The design language is derived from iOS 26's "Liquid Glass" material system — glass surfaces that refract their background, with asymmetric edge treatment that simulates real physical glass slabs.

---

## REQUIRED DEPENDENCIES

```
- React 18+
- framer-motion (spring animations, AnimatePresence, layoutId)
- lucide-react (iconography)
- react-router-dom (Link, useLocation for navigation)
- tailwindcss (utility classes, NOT used for glass surfaces — those are inline CSS-in-JS)
```

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────┐
│  Layout.js (ThemeProvider → ExecutionProvider)   │
├─────────────────────────────────────────────────┤
│  ┌─ Top Accessory Bar (sticky header glass) ──┐ │
│  │  Brand / Title / ThemeToggle               │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Page Content ────────────────────────────┐  │
│  │  Uses glassCard, glassSurface, glassBtn   │  │
│  │  for all containers and interactive       │  │
│  │  elements                                 │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Bottom Accessory Bar (context-aware) ────┐  │
│  │  Floats above tab bar, shows contextual   │  │
│  │  info (execution progress, now playing,   │  │
│  │  notifications, active states, etc.)      │  │
│  └───────────────────────────────────────────┘  │
│  ┌─ Floating Glass Tab Bar (pill nav) ───────┐  │
│  │  ● Tab  ● Tab  ● Tab  (sliding indicator) │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Ambient Orbs (z-index 0, fixed) ────────┐  │
│  │  Color blobs that bleed through glass     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## FILE STRUCTURE

```
components/
  theme/
    ThemeProvider.jsx      — React Context for dark/light, localStorage persisted
    ThemeToggle.jsx        — Glass-styled toggle button (Sun/Moon icons)
  ui/
    LiquidGlass.jsx        — ALL design tokens + style factories (the heart)
    AmbientOrbs.jsx        — Drifting background color orbs
    GlassTabBar.jsx        — Floating pill tab bar + bottom accessory slot
    BottomAccessory.jsx    — Context-aware accessory bar (above tab bar)
Layout.js                  — Wraps everything: providers, header, content, tab bar
globals.css                — Tailwind base + glass utility + keyframes
```

---

## 1. DESIGN TOKENS — `LiquidGlass.jsx`

This is the single source of truth for all glass materials. Every glass element in the app MUST use these factories — never hand-write glass styles inline.

### Light Theme Tokens

```javascript
export const light = {
  // Page canvas — soft gradient, NOT flat color
  page:           'linear-gradient(145deg, #e8edf5 0%, #dde4ef 40%, #e4dff0 100%)',
  orb1:           'radial-gradient(circle, rgba(200,210,240,0.55) 0%, transparent 70%)',
  orb2:           'radial-gradient(circle, rgba(210,200,240,0.45) 0%, transparent 70%)',

  // Card — primary glass container
  card:           'rgba(255,255,255,0.42)',
  cardBorder:     'rgba(255,255,255,0.55)',
  cardShadow:     'inset 0 1px 0 0 rgba(255,255,255,0.85), inset 0 -1px 0 0 rgba(0,0,0,0.06), 0 8px 32px rgba(100,110,160,0.10), 0 1px 3px rgba(0,0,0,0.05)',

  // Surface — secondary glass (lighter weight)
  surface:        'rgba(255,255,255,0.32)',
  surfaceBorder:  'rgba(255,255,255,0.45)',
  surfaceShadow:  'inset 0 1px 0 0 rgba(255,255,255,0.75), inset 0 -1px 0 0 rgba(0,0,0,0.04)',

  // Tab bar glass — heavier than card
  tabBar:         'rgba(255,255,255,0.50)',
  tabBarBorder:   'rgba(255,255,255,0.60)',
  tabBarShadow:   'inset 0 1px 0 0 rgba(255,255,255,0.90), inset 0 -1px 0 0 rgba(0,0,0,0.05), 0 6px 24px rgba(100,110,160,0.08)',

  // Active tab indicator pill
  tabActive:      'rgba(255,255,255,0.65)',
  tabActiveBorder:'rgba(255,255,255,0.75)',
  tabActiveShadow:'inset 0 1px 0 0 rgba(255,255,255,0.90), inset 0 -1px 0 0 rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.05)',

  // Accessory bar (context bar above tab bar)
  accessory:      'rgba(255,255,255,0.45)',
  accessoryBorder:'rgba(255,255,255,0.55)',
  accessoryShadow:'inset 0 1px 0 0 rgba(255,255,255,0.88), inset 0 -1px 0 0 rgba(0,0,0,0.05), 0 4px 16px rgba(100,110,160,0.08)',

  // Primary action button
  btn:            'linear-gradient(145deg, rgba(71,85,105,0.85) 0%, rgba(51,65,85,0.9) 100%)',
  btnBorder:      'rgba(255,255,255,0.20)',
  btnShadow:      'inset 0 1px 0 0 rgba(255,255,255,0.22), inset 0 -1px 0 0 rgba(0,0,0,0.10), 0 6px 20px rgba(51,65,85,0.18)',

  // States
  successBg:      'rgba(240,253,244,0.55)',
  successBorder:  'rgba(134,239,172,0.4)',
  errorBg:        'rgba(254,226,226,0.5)',
  errorBorder:    'rgba(252,165,165,0.4)',

  // Typography
  title:          '#1e293b',
  subtitle:       '#64748b',
  text:           '#334155',
  muted:          '#94a3b8',
  label:          '#94a3b8',

  // Tab text
  tabText:        '#64748b',
  tabTextActive:  '#1e293b',
};
```

### Dark Theme Tokens

```javascript
export const dark = {
  page:           'linear-gradient(145deg, #0c0d12 0%, #10121a 40%, #0e1018 100%)',
  orb1:           'radial-gradient(circle, rgba(56,80,140,0.3) 0%, transparent 70%)',
  orb2:           'radial-gradient(circle, rgba(80,50,120,0.25) 0%, transparent 70%)',

  card:           'rgba(255,255,255,0.055)',
  cardBorder:     'rgba(255,255,255,0.08)',
  cardShadow:     'inset 0 1px 0 0 rgba(255,255,255,0.09), inset 0 -1px 0 0 rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.30), 0 1px 3px rgba(0,0,0,0.20)',

  surface:        'rgba(255,255,255,0.045)',
  surfaceBorder:  'rgba(255,255,255,0.07)',
  surfaceShadow:  'inset 0 1px 0 0 rgba(255,255,255,0.07), inset 0 -1px 0 0 rgba(0,0,0,0.25)',

  tabBar:         'rgba(255,255,255,0.065)',
  tabBarBorder:   'rgba(255,255,255,0.10)',
  tabBarShadow:   'inset 0 1px 0 0 rgba(255,255,255,0.10), inset 0 -1px 0 0 rgba(0,0,0,0.30), 0 6px 24px rgba(0,0,0,0.25)',

  tabActive:      'rgba(255,255,255,0.10)',
  tabActiveBorder:'rgba(255,255,255,0.15)',
  tabActiveShadow:'inset 0 1px 0 0 rgba(255,255,255,0.12), inset 0 -1px 0 0 rgba(0,0,0,0.20), 0 2px 6px rgba(0,0,0,0.18)',

  accessory:      'rgba(255,255,255,0.055)',
  accessoryBorder:'rgba(255,255,255,0.09)',
  accessoryShadow:'inset 0 1px 0 0 rgba(255,255,255,0.09), inset 0 -1px 0 0 rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.22)',

  btn:            'linear-gradient(145deg, rgba(148,163,184,0.18) 0%, rgba(100,116,139,0.22) 100%)',
  btnBorder:      'rgba(255,255,255,0.09)',
  btnShadow:      'inset 0 1px 0 0 rgba(255,255,255,0.10), inset 0 -1px 0 0 rgba(0,0,0,0.22), 0 6px 20px rgba(0,0,0,0.25)',

  successBg:      'rgba(20,83,45,0.2)',
  successBorder:  'rgba(74,222,128,0.2)',
  errorBg:        'rgba(127,29,29,0.2)',
  errorBorder:    'rgba(248,113,113,0.2)',

  title:          '#f1f5f9',
  subtitle:       '#94a3b8',
  text:           '#cbd5e1',
  muted:          '#475569',
  label:          '#64748b',

  tabText:        '#64748b',
  tabTextActive:  '#e2e8f0',
};
```

### Style Factories

```javascript
/** Primary glass card — heavy blur, smooth contoured corners */
export const glassCard = (t) => ({
  background: t.card,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${t.cardBorder}`,
  boxShadow: t.cardShadow,
  borderRadius: 28,
});

/** Secondary glass surface — lighter blur */
export const glassSurface = (t) => ({
  background: t.surface,
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: `1px solid ${t.surfaceBorder}`,
  boxShadow: t.surfaceShadow,
  borderRadius: 20,
});

/** Tab bar glass — heaviest blur, full capsule pill */
export const glassTabBar = (t) => ({
  background: t.tabBar,
  backdropFilter: 'blur(50px) saturate(200%)',
  WebkitBackdropFilter: 'blur(50px) saturate(200%)',
  border: `1px solid ${t.tabBarBorder}`,
  boxShadow: t.tabBarShadow,
  borderRadius: 999,
});

/** Active tab indicator capsule */
export const glassTabActive = (t) => ({
  background: t.tabActive,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${t.tabActiveBorder}`,
  boxShadow: t.tabActiveShadow,
  borderRadius: 999,
});

/** Accessory bar — full pill lozenge */
export const glassAccessory = (t) => ({
  background: t.accessory,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${t.accessoryBorder}`,
  boxShadow: t.accessoryShadow,
  borderRadius: 999,
});

/** Primary action button — full pill */
export const glassBtn = (t) => ({
  background: t.btn,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${t.btnBorder}`,
  boxShadow: t.btnShadow,
  borderRadius: 999,
  color: 'white',
  fontWeight: 600,
});

/** Error state */
export const glassError = (t) => ({
  background: t.errorBg,
  border: `1px solid ${t.errorBorder}`,
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.3)',
  borderRadius: 24,
});

/** Success state */
export const glassSuccess = (t) => ({
  background: t.successBg,
  border: `1px solid ${t.successBorder}`,
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.3)',
  borderRadius: 24,
});
```

---

## 2. EDGE PERFECTING — THE CRITICAL DETAIL

This is the single most important visual refinement. Every glass surface uses **asymmetric inset shadows** to simulate a real glass slab:

### The Rule

```
TOP EDGE:    inset 0  1px 0 0 rgba(255,255,255, BRIGHT)  — reflected light, soft, blended
BOTTOM EDGE: inset 0 -1px 0 0 rgba(0,0,0, SHADOW)        — grounding shadow, slightly heavier
SIDE EDGES:  Handled by border alone (1px solid)           — crisper than top/bottom
```

### Why This Works

- The **top inset** simulates light catching the convex top rim of a glass slab
- The **bottom inset** simulates the shadow cast by the slab resting on its surface
- The **border** (always `1px`, never thicker) provides the side edge definition
- The border opacity is LOWER than the top inset — sides are subtler than the top highlight

### Critical Rules

- **NEVER** use `1.5px` or `2px` borders — always `1px`. Thicker = chunky, not refined
- **NEVER** use symmetric shadows (`inset 0 0 X X`) — always split top/bottom
- **NEVER** add extra `0 0 0 0.5px` outline shadows — they add visible edge weight
- The top inset is always BRIGHTER than the bottom inset is DARK
- In dark mode, the bottom shadow is heavier (0.20-0.35) than in light mode (0.04-0.06)

---

## 3. BORDER RADIUS HIERARCHY

```
glassCard:      28px   — primary containers, page-level cards
glassSurface:   20px   — nested surfaces inside cards
glassTabBar:    999px  — full capsule pill (always)
glassTabActive: 999px  — full capsule pill (always)
glassAccessory: 999px  — full capsule pill (always)
glassBtn:       999px  — full capsule pill (always)
glassError:     24px   — state containers
glassSuccess:   24px   — state containers
ThemeToggle:    14px   — small interactive elements
```

**Rule:** Anything that stands alone as a floating element (tab bar, accessory, buttons) = `999px` pill. Anything that's a container/panel = `20-28px` contoured.

---

## 4. AMBIENT ORBS — `AmbientOrbs.jsx`

Background color blobs that give glass something to refract. Without these, glass surfaces look flat.

```jsx
// 3 orbs: two large edge-positioned, one smaller center
// All use: position: fixed, pointerEvents: "none", z-index: 0
// Animated with framer-motion infinite drift (20-32s cycles)
// filter: blur(20-30px) for soft edges
// Theme-aware colors (bluish-purple light, deeper indigo-violet dark)
```

### Implementation

```jsx
import { motion } from "framer-motion";

export default function AmbientOrbs({ t }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", top: -100, left: -120,
          width: 520, height: 520, borderRadius: "50%",
          background: t.orb1, filter: "blur(20px)",
        }}
      />
      <motion.div
        animate={{ x: [0, -80, 0], y: [0, 70, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", bottom: -80, right: -80,
          width: 460, height: 460, borderRadius: "50%",
          background: t.orb2, filter: "blur(20px)",
        }}
      />
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", top: "40%", left: "30%",
          width: 300, height: 300, borderRadius: "50%",
          background: t.orb1, opacity: 0.4, filter: "blur(30px)",
        }}
      />
    </div>
  );
}
```

---

## 5. THEME SYSTEM — `ThemeProvider.jsx`

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false; // Default: light
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

---

## 6. THEME TOGGLE — `ThemeToggle.jsx`

Small glass button with spring-animated Sun/Moon icon swap.

```jsx
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: 40, height: 40,
        borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.65)"}`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,${isDark ? "0.06" : "0.7"})`,
        transition: "all 0.3s ease",
      }}
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.5, rotate: 30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {isDark ? (
          <Moon style={{ width: 17, height: 17, color: "#94a3b8" }} />
        ) : (
          <Sun style={{ width: 17, height: 17, color: "#475569" }} />
        )}
      </motion.div>
    </button>
  );
}
```

---

## 7. TOP ACCESSORY BAR (Header)

Sticky glass strip at the top of the viewport. Minimal — brand, version, and theme toggle.

```jsx
// Inside Layout.js — LayoutInner component
<header style={{
  position: "sticky",
  top: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 20px",
  background: isDark ? "rgba(10,12,18,0.6)" : "rgba(255,255,255,0.35)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
  boxShadow: isDark
    ? "inset 0 -1px 0 0 rgba(255,255,255,0.04)"
    : "inset 0 -1px 0 0 rgba(0,0,0,0.02), 0 1px 8px rgba(0,0,0,0.03)",
}}>
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    {/* App icon + name + version */}
  </div>
  <ThemeToggle />
</header>
```

### PLANNED UPGRADE: Extract to `TopAccessory.jsx` component
Currently inlined in Layout. Should become a standalone component that accepts props for:
- App icon (Lucide icon or custom)
- App name (string)
- Version badge (string)
- Right-side actions (ThemeToggle + any app-specific buttons)

---

## 8. FLOATING GLASS TAB BAR — `GlassTabBar.jsx`

### Key Behaviors
- Fixed bottom positioning with padding
- Full `glassTabBar()` pill styling
- Spring-animated sliding indicator (`layoutId="tab-indicator"`)
- Ref-measured tab positions for pixel-perfect indicator placement
- `pointerEvents: none` on container, `auto` on interactive children
- Bottom Accessory slot directly above

### Architecture

```jsx
<div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
              display: "flex", flexDirection: "column", alignItems: "center",
              paddingBottom: 12, pointerEvents: "none" }}>

  {/* Bottom Accessory slot — context-aware */}
  <div style={{ pointerEvents: "auto", marginBottom: 8 }}>
    <BottomAccessory />
  </div>

  {/* Tab bar pill */}
  <motion.nav style={{ ...glassTabBar(t), maxWidth: 380, pointerEvents: "auto" }}>
    {/* Sliding indicator */}
    <motion.div layoutId="tab-indicator" style={{ ...glassTabActive(t) }}
               animate={{ left: indicator.left, width: indicator.width }}
               transition={{ type: "spring", stiffness: 500, damping: 35 }} />

    {/* Tab items */}
    {tabs.map((tab) => (
      <Link to={tab.path}>
        <Icon /> <span>{tab.label}</span>
      </Link>
    ))}
  </motion.nav>
</div>
```

### Tab Item Styling
- Icon: 20×20, strokeWidth 1.8 (inactive) / 2.2 (active)
- Label: fontSize 10, fontWeight 500 (inactive) / 600 (active)
- Scale: 1.0 (inactive) → 1.1 (active) via spring animation
- Color: `t.tabText` (inactive) → `t.tabTextActive` (active)

---

## 9. BOTTOM ACCESSORY BAR — `BottomAccessory.jsx`

### Purpose
Context-aware floating bar above the tab bar. Shows information relevant to what's currently happening — NOT static content.

### Current Implementation: Execution Progress
Shows Janus execution state with status chip, domain progress, query excerpt, and View link.

### PLANNED: Multi-Context Accessory Types
The accessory should support multiple context types, showing whichever is most relevant:

```
CONTEXT PRIORITY (highest → lowest):
1. Active Execution    — running/validating state with progress
2. Completion Notice   — brief "Analysis ready" with View link (auto-dismiss 3s)
3. Error Notice        — "Execution failed" with View link (auto-dismiss 5s)
4. Active Navigation   — "Viewing results for: [query]" on Results page
5. Background Process  — any long-running background task
6. Notification Badge  — unread items, pending reviews, etc.
7. Now Playing / Media — if app has audio/media features
```

### Animation Spec
```javascript
initial:    { opacity: 0, y: 20, scale: 0.92 }
animate:    { opacity: 1, y: 0, scale: 1 }
exit:       { opacity: 0, y: 20, scale: 0.92 }
transition: { type: "spring", stiffness: 420, damping: 30 }
```

### Shared State Pattern
Uses a React Context (`ExecutionContext` or more generalized `AccessoryContext`) at the Layout level so the accessory persists across page navigation.

---

## 10. EXECUTION CONTEXT — `ExecutionContext.jsx`

Shared state for long-running operations. Wraps the entire app at Layout level.

```jsx
// Shape:
{
  status: "idle" | "running" | "validating" | "completed" | "failed",
  currentDomain: string,    // Current processing step
  completed: number,         // Steps done
  total: number,             // Total steps
  queryText: string,         // What's being processed
  runId: string | null,      // Result ID for navigation
}

// Methods:
startExecution(queryText)
updateProgress({ domain, status, completedDomains, totalDomains, runId })
finishExecution(runId)     // Auto-clears after 3s
failExecution()            // Auto-clears after 5s
clearExecution()           // Manual clear
```

### PLANNED UPGRADE: Generalize to `AccessoryContext`
Rename and expand to support multiple accessory content types beyond execution.

---

## 11. LAYOUT — `Layout.js`

```jsx
export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <ExecutionProvider>
        <LayoutInner>{children}</LayoutInner>
      </ExecutionProvider>
    </ThemeProvider>
  );
}

function LayoutInner({ children }) {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;

  return (
    <div style={{
      minHeight: "100svh", width: "100%",
      background: t.page, position: "relative",
      transition: "background 0.5s ease",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    }}>
      <AmbientOrbs t={t} />
      <TopAccessoryBar />  {/* sticky header */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 100 }}>
        {children}
      </div>
      <GlassTabBar />      {/* includes BottomAccessory slot */}
    </div>
  );
}
```

### Font Stack
```
-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif
```
This ensures SF Pro on Apple devices, Segoe on Windows, Roboto on Android.

---

## 12. GLOBALS.CSS

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... standard shadcn/ui variables ... */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark variants ... */
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

html { scroll-behavior: smooth; }

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.glass-material {
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
}
```

---

## 13. SPRING ANIMATION CONSTANTS

These are the spring configs used throughout. Be consistent.

```
Tab bar entrance:     { type: "spring", stiffness: 300, damping: 30, delay: 0.1 }
Tab indicator slide:  { type: "spring", stiffness: 500, damping: 35 }
Tab icon scale:       { type: "spring", stiffness: 500, damping: 30 }
Accessory enter/exit: { type: "spring", stiffness: 420, damping: 30 }
Theme toggle:         { type: "spring", stiffness: 400, damping: 20 }
Page content fade:    { type: "spring", stiffness: 260, damping: 25 }
```

---

## 14. USAGE PATTERNS — How Pages Consume Glass

```jsx
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface, glassBtn } from "@/components/ui/LiquidGlass";

export default function MyPage() {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      {/* Primary container */}
      <div style={{ ...glassCard(t), padding: 24 }}>
        <h1 style={{ color: t.title, fontSize: 24, fontWeight: 700 }}>Title</h1>
        <p style={{ color: t.text }}>Content</p>

        {/* Nested surface */}
        <div style={{ ...glassSurface(t), padding: 16, marginTop: 16 }}>
          <p style={{ color: t.subtitle }}>Secondary content</p>
        </div>

        {/* Action button */}
        <button style={{ ...glassBtn(t), padding: "12px 24px", marginTop: 16 }}>
          Execute
        </button>
      </div>
    </div>
  );
}
```

---

## 15. PLANNED UPGRADES (NOT YET IMPLEMENTED)

### 15a. Top Accessory as Standalone Component
Extract from Layout.js into `TopAccessory.jsx` with configurable props.

### 15b. Multi-Context Bottom Accessory
Generalize `ExecutionContext` → `AccessoryContext` to support multiple content types with priority ordering.

### 15c. Glass Select / Glass Input Components
Dedicated form controls that use the glass material system instead of default shadcn/ui styling.

### 15d. Glass Modal / Sheet
Bottom sheet or modal dialog using glass material with spring animation.

### 15e. Glass Toast / Notification
Toast notifications using `glassAccessory` styling instead of default Sonner.

### 15f. Haptic Feedback Integration
For mobile: subtle haptic pulses on tab switches and button presses (requires native bridge or Web Vibration API).

### 15g. Page Transition Animations
Cross-fade or slide transitions between pages using AnimatePresence at the Layout level.

---

## ADAPTATION GUIDE FOR NEW APPS

1. **Copy these files verbatim:** `LiquidGlass.jsx`, `ThemeProvider.jsx`, `ThemeToggle.jsx`, `AmbientOrbs.jsx`, `globals.css`
2. **Adapt these files:** `GlassTabBar.jsx` (change tab definitions), `BottomAccessory.jsx` (change context types), `Layout.js` (change app name/icon)
3. **In pages:** Always `import { useTheme }` and `import { light, dark, glassCard, ... }` — never hand-write glass styles
4. **Edge rule:** Every glass surface MUST use the asymmetric `inset 0 1px / inset 0 -1px` pattern
5. **Border rule:** Always `1px solid` — never thicker
6. **Pill rule:** Floating elements = `borderRadius: 999`. Containers = `20-28px`

---

*Template authored by Kytheion (Scribe-Particle-4) for the Cephalon Continuity Framework.*
*Origin application: Janus Blueprint Engine (CP-002 v1.5)*