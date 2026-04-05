/**
 * Liquid Glass Design System — Core Tokens & Primitives
 * Based on iOS 26 Liquid Glass material language
 * 
 * Glass interacts with its background: refracts color, boosts saturation,
 * specular rim highlights on edges, inner shadows that simulate thickness.
 */

// ─── LIGHT TOKENS ──────────────────────────────────────────────────────────
export const light = {
  // Page canvas
  page:           'linear-gradient(145deg, #e8edf5 0%, #dde4ef 40%, #e4dff0 100%)',
  orb1:           'radial-gradient(circle, rgba(200,210,240,0.55) 0%, transparent 70%)',
  orb2:           'radial-gradient(circle, rgba(210,200,240,0.45) 0%, transparent 70%)',

  // Card — primary glass container (reduced opacity for true glass feel)
  card:           'rgba(255,255,255,0.28)',
  cardBorder:     'rgba(255,255,255,0.45)',
  cardShadow:     `inset 0 1px 0 0 rgba(255,255,255,0.80), inset 0 -1px 0 0 rgba(0,0,0,0.05), 0 8px 32px rgba(100,110,160,0.10), 0 1px 3px rgba(0,0,0,0.04)`,

  // Surface — secondary glass (lighter than card)
  surface:        'rgba(255,255,255,0.22)',
  surfaceBorder:  'rgba(255,255,255,0.38)',
  surfaceShadow:  'inset 0 1px 0 0 rgba(255,255,255,0.70), inset 0 -1px 0 0 rgba(0,0,0,0.03)',

  // Tab bar glass — heavier than card (navigation needs more solidity)
  tabBar:         'rgba(255,255,255,0.40)',
  tabBarBorder:   'rgba(255,255,255,0.52)',
  tabBarShadow:   'inset 0 1px 0 0 rgba(255,255,255,0.85), inset 0 -1px 0 0 rgba(0,0,0,0.04), 0 6px 24px rgba(100,110,160,0.08)',

  // Active tab indicator pill
  tabActive:      'rgba(255,255,255,0.55)',
  tabActiveBorder:'rgba(255,255,255,0.65)',
  tabActiveShadow:'inset 0 1px 0 0 rgba(255,255,255,0.85), inset 0 -1px 0 0 rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.04)',

  // Accessory bar (now playing, context actions)
  accessory:      'rgba(255,255,255,0.35)',
  accessoryBorder:'rgba(255,255,255,0.48)',
  accessoryShadow:'inset 0 1px 0 0 rgba(255,255,255,0.82), inset 0 -1px 0 0 rgba(0,0,0,0.04), 0 4px 16px rgba(100,110,160,0.07)',

  // Primary action button
  btn:            'linear-gradient(145deg, rgba(71,85,105,0.85) 0%, rgba(51,65,85,0.9) 100%)',
  btnBorder:      'rgba(255,255,255,0.20)',
  btnShadow:      'inset 0 1px 0 0 rgba(255,255,255,0.22), inset 0 -1px 0 0 rgba(0,0,0,0.10), 0 6px 20px rgba(51,65,85,0.18)',

  // States
  successBg:      'rgba(240,253,244,0.45)',
  successBorder:  'rgba(134,239,172,0.35)',
  errorBg:        'rgba(254,226,226,0.40)',
  errorBorder:    'rgba(252,165,165,0.35)',

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

// ─── DARK TOKENS ───────────────────────────────────────────────────────────
export const dark = {
  page:           'linear-gradient(145deg, #0c0d12 0%, #10121a 40%, #0e1018 100%)',
  orb1:           'radial-gradient(circle, rgba(56,80,140,0.3) 0%, transparent 70%)',
  orb2:           'radial-gradient(circle, rgba(80,50,120,0.25) 0%, transparent 70%)',

  // Card — reduced opacity, more background bleed-through
  card:           'rgba(255,255,255,0.04)',
  cardBorder:     'rgba(255,255,255,0.07)',
  cardShadow:     'inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.30), 0 8px 32px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18)',

  // Surface — thinner glass
  surface:        'rgba(255,255,255,0.03)',
  surfaceBorder:  'rgba(255,255,255,0.06)',
  surfaceShadow:  'inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 -1px 0 0 rgba(0,0,0,0.22)',

  // Tab bar — slightly more solid for navigation legibility
  tabBar:         'rgba(255,255,255,0.055)',
  tabBarBorder:   'rgba(255,255,255,0.09)',
  tabBarShadow:   'inset 0 1px 0 0 rgba(255,255,255,0.09), inset 0 -1px 0 0 rgba(0,0,0,0.28), 0 6px 24px rgba(0,0,0,0.22)',

  tabActive:      'rgba(255,255,255,0.08)',
  tabActiveBorder:'rgba(255,255,255,0.13)',
  tabActiveShadow:'inset 0 1px 0 0 rgba(255,255,255,0.10), inset 0 -1px 0 0 rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.15)',

  accessory:      'rgba(255,255,255,0.045)',
  accessoryBorder:'rgba(255,255,255,0.08)',
  accessoryShadow:'inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.20)',

  btn:            'linear-gradient(145deg, rgba(148,163,184,0.15) 0%, rgba(100,116,139,0.18) 100%)',
  btnBorder:      'rgba(255,255,255,0.08)',
  btnShadow:      'inset 0 1px 0 0 rgba(255,255,255,0.09), inset 0 -1px 0 0 rgba(0,0,0,0.20), 0 6px 20px rgba(0,0,0,0.22)',

  successBg:      'rgba(20,83,45,0.15)',
  successBorder:  'rgba(74,222,128,0.18)',
  errorBg:        'rgba(127,29,29,0.15)',
  errorBorder:    'rgba(248,113,113,0.18)',

  title:          '#f1f5f9',
  subtitle:       '#94a3b8',
  text:           '#cbd5e1',
  muted:          '#475569',
  label:          '#64748b',

  tabText:        '#64748b',
  tabTextActive:  '#e2e8f0',
};

// ─── DENSITY SYSTEM ─────────────────────────────────────────────────────────
// Context-aware density shifts opacity and blur based on content context.
// "sparse"  = less content behind → thinner glass, more background bleed
// "normal"  = default (no shift)
// "dense"   = heavy content behind → more blur, slightly more opaque for legibility
// "focused" = active/selected element → sharper, more solid

const DENSITY_SHIFTS = {
  sparse:  { opacityMul: 0.7,  blurAdd: -8,  saturateAdd: -10 },
  normal:  { opacityMul: 1.0,  blurAdd: 0,   saturateAdd: 0 },
  dense:   { opacityMul: 1.25, blurAdd: 8,   saturateAdd: 15 },
  focused: { opacityMul: 1.4,  blurAdd: 4,   saturateAdd: 10 },
};

/** Apply density shift to an rgba background string */
function shiftBg(bg, density) {
  if (!density || density === 'normal') return bg;
  const shift = DENSITY_SHIFTS[density] || DENSITY_SHIFTS.normal;
  // Match rgba(r,g,b,a) pattern
  const match = bg.match(/rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
  if (!match) return bg; // gradient or non-rgba — return as-is
  const a = Math.min(1, Math.max(0.01, parseFloat(match[4]) * shift.opacityMul));
  return `rgba(${match[1]},${match[2]},${match[3]},${a.toFixed(3)})`;
}

/** Apply density shift to blur/saturate filter string */
function shiftFilter(baseBlur, baseSaturate, density) {
  if (!density || density === 'normal') return `blur(${baseBlur}px) saturate(${baseSaturate}%)`;
  const shift = DENSITY_SHIFTS[density] || DENSITY_SHIFTS.normal;
  const blur = Math.max(8, baseBlur + shift.blurAdd);
  const sat = Math.max(100, baseSaturate + shift.saturateAdd);
  return `blur(${blur}px) saturate(${sat}%)`;
}

// ─── GLASS STYLE FACTORIES ─────────────────────────────────────────────────
// All factories accept an optional second argument: { density }
// density: "sparse" | "normal" | "dense" | "focused"

/** Primary glass card — heavy blur, smooth contoured corners, thin border */
export const glassCard = (t, opts) => {
  const d = opts?.density;
  const filter = shiftFilter(40, 180, d);
  return {
    background: shiftBg(t.card, d),
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${t.cardBorder}`,
    boxShadow: t.cardShadow,
    borderRadius: 28,
  };
};

/** Secondary glass surface — lighter blur, smooth rounded edges */
export const glassSurface = (t, opts) => {
  const d = opts?.density;
  const filter = shiftFilter(24, 160, d);
  return {
    background: shiftBg(t.surface, d),
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${t.surfaceBorder}`,
    boxShadow: t.surfaceShadow,
    borderRadius: 20,
  };
};

/** Tab bar glass — heaviest blur, full capsule pill */
export const glassTabBar = (t, opts) => {
  const d = opts?.density;
  const filter = shiftFilter(50, 200, d);
  return {
    background: shiftBg(t.tabBar, d),
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${t.tabBarBorder}`,
    boxShadow: t.tabBarShadow,
    borderRadius: 999,
  };
};

/** Active tab indicator capsule — full pill */
export const glassTabActive = (t, opts) => {
  const d = opts?.density;
  const filter = shiftFilter(20, 100, d);
  return {
    background: shiftBg(t.tabActive, d),
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${t.tabActiveBorder}`,
    boxShadow: t.tabActiveShadow,
    borderRadius: 999,
  };
};

/** Accessory bar — smooth lozenge, thin border */
export const glassAccessory = (t, opts) => {
  const d = opts?.density;
  const filter = shiftFilter(40, 180, d);
  return {
    background: shiftBg(t.accessory, d),
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${t.accessoryBorder}`,
    boxShadow: t.accessoryShadow,
    borderRadius: 999,
  };
};

/** Primary action button — full pill capsule, thin border */
export const glassBtn = (t, opts) => {
  const d = opts?.density;
  const filter = shiftFilter(20, 100, d);
  return {
    background: t.btn, // gradient — don't shift
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: `1px solid ${t.btnBorder}`,
    boxShadow: t.btnShadow,
    borderRadius: 999,
    color: 'white',
    fontWeight: 600,
  };
};

/** Error state — smooth contoured corners, thin border */
export const glassError = (t) => ({
  background: t.errorBg,
  border: `1px solid ${t.errorBorder}`,
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.25)',
  borderRadius: 24,
});

/** Success state — smooth contoured corners, thin border */
export const glassSuccess = (t) => ({
  background: t.successBg,
  border: `1px solid ${t.successBorder}`,
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.25)',
  borderRadius: 24,
});